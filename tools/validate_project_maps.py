#!/usr/bin/env python3
"""Validate that every project is complete, numbered, and palette-reachable."""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "site" / "assets" / "projects"
SVG_NS = "{http://www.w3.org/2000/svg}"


def class_has(element, name: str) -> bool:
    return name in element.attrib.get("class", "").split()


def validate_structure(project: dict) -> None:
    project_id = project["id"]
    svg_path = ASSETS / f"{project_id}.svg"
    source = svg_path.read_bytes().decode("utf-8")
    root = ET.fromstring(source)
    paths = [element for element in root.iter() if class_has(element, "paint-region")]
    labels = [element for element in root.iter() if class_has(element, "label")]

    assert len(paths) == project["regions"], (
        f"{project_id}: manifest says {project['regions']} regions, SVG has {len(paths)}"
    )
    region_ids = [element.attrib.get("data-region-id") for element in paths]
    assert None not in region_ids and len(region_ids) == len(set(region_ids)), (
        f"{project_id}: region IDs must be present and unique"
    )

    expected_numbers = set(range(1, len(project["palette"]) + 1))
    actual_numbers = {int(element.attrib["data-number"]) for element in paths}
    assert actual_numbers == expected_numbers, (
        f"{project_id}: palette offers {sorted(expected_numbers)}, regions use {sorted(actual_numbers)}"
    )

    expected_colors = {
        number: color["hex"].lower()
        for number, color in enumerate(project["palette"], start=1)
    }
    for element in paths:
        number = int(element.attrib["data-number"])
        color = element.attrib["data-color"].lower()
        if color.startswith("rgb"):
            channels = [int(value) for value in re.findall(r"\d+", color)]
            color = "#" + "".join(f"{value:02x}" for value in channels)
        assert color == expected_colors[number], (
            f"{project_id}: region {element.attrib['data-region-id']} color does not match number {number}"
        )

    labels_by_id = {}
    for label in labels:
        label_id = label.attrib.get("data-region-id")
        labels_by_id.setdefault(label_id, []).append("".join(label.itertext()).strip())
    assert set(labels_by_id) == set(region_ids), f"{project_id}: every region needs a number label"
    for element in paths:
        region_id = element.attrib["data-region-id"]
        assert labels_by_id[region_id] == [element.attrib["data-number"]], (
            f"{project_id}: label for region {region_id} does not match its palette number"
        )


def validate_render_coverage(project: dict, temp_dir: Path) -> None:
    if not shutil.which("inkscape"):
        return
    output = temp_dir / f"{project['id']}.png"
    subprocess.run(
        [
            "inkscape", str(ASSETS / f"{project['id']}.svg"),
            "--export-type=png", f"--export-filename={output}",
            "--export-width=800", "--export-height=600",
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        env={"HOME": str(temp_dir), "XDG_CONFIG_HOME": str(temp_dir), "XDG_CACHE_HOME": str(temp_dir)},
    )
    alpha = Image.open(output).convert("RGBA").getchannel("A")
    histogram = alpha.histogram()
    transparentish = sum(histogram[:240])
    # Adjacent vector paths can create a nearly opaque antialiasing fringe.
    # Pixels below this threshold identify genuinely unmapped canvas areas.
    assert transparentish / (800 * 600) < 0.005, (
        f"{project['id']}: rendered canvas contains unmapped transparent areas"
    )


def main() -> None:
    manifest = json.loads((ASSETS / "manifest.json").read_text(encoding="utf-8"))
    assert len(manifest) == 22, f"Expected 22 projects, found {len(manifest)}"
    with tempfile.TemporaryDirectory(prefix="paint-map-validation-") as directory:
        temp_dir = Path(directory)
        for project in manifest:
            validate_structure(project)
            validate_render_coverage(project, temp_dir)
            print(f"PASS {project['id']}: {project['regions']} numbered regions")
    print("PASS all 22 project maps are complete and palette-reachable")


if __name__ == "__main__":
    main()
