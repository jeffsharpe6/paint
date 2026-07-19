#!/usr/bin/env python3
"""Repair and rebuild Palette by Number SVG region maps.

The finished WEBP previews are the canonical artwork.  This script rebuilds
damaged SVG maps from those previews, guarantees that every pixel belongs to a
numbered region, and normalizes any skipped palette numbers in otherwise-valid
SVGs.
"""

from __future__ import annotations

import html
import json
import re
from collections import defaultdict
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "site" / "assets" / "projects"
MANIFEST_PATH = ASSETS / "manifest.json"
MAP_WIDTH = 320
MAP_HEIGHT = 240
MIN_REGION_PIXELS = 18

# These files were truncated or contained non-UTF-8 data.  Rebuilding them is
# safer than attempting to recover partial geometry.
REBUILD_IDS = {
    "alpine-stillness",
    "cottage-in-bloom",
    "desert-courtyard",
    "frenchie-in-blooms",
    "golden-hour-pup",
    "kitchen-herb-garden",
    "secret-garden-gate",
    "sunflower-sunday",
}

FOUR_CONNECTED = np.array([[0, 1, 0], [1, 1, 1], [0, 1, 0]], dtype=np.uint8)
NEIGHBOR_OFFSETS = (
    (-1, -1), (-1, 0), (-1, 1),
    (0, -1),            (0, 1),
    (1, -1),  (1, 0),  (1, 1),
)


def rgb_from_hex(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[index:index + 2], 16) for index in (0, 2, 4))


def initial_color_map(image_path: Path, palette: list[dict]) -> np.ndarray:
    image = Image.open(image_path).convert("RGB")
    image = image.resize((MAP_WIDTH, MAP_HEIGHT), Image.Resampling.LANCZOS)
    pixels = np.asarray(image, dtype=np.int16)
    colors = np.asarray([rgb_from_hex(item["hex"]) for item in palette], dtype=np.int16)
    distances = (pixels[:, :, None, :].astype(np.int32) - colors[None, None, :, :]) ** 2
    return distances.sum(axis=3).argmin(axis=2).astype(np.uint8)


def merge_small_regions(color_map: np.ndarray, palette_size: int) -> np.ndarray:
    """Merge compression speckles while retaining the artwork's real shapes."""
    result = color_map.copy()
    for _ in range(4):
        changed = False
        for color_index in range(palette_size):
            components, _ = ndimage.label(result == color_index, structure=FOUR_CONNECTED)
            sizes = np.bincount(components.ravel())
            small = sizes < MIN_REGION_PIXELS
            if len(small):
                small[0] = False
            small_pixels = small[components]
            if not small_pixels.any():
                continue

            # Let the surrounding colors consume tiny WEBP edge artifacts.
            # Repeating the local vote also removes one-pixel tendrils left by
            # lossy compression without simplifying meaningful boundaries.
            for _ in range(4):
                neighbors = np.stack([
                    np.roll(np.roll(result, dy, axis=0), dx, axis=1)
                    for dy, dx in NEIGHBOR_OFFSETS
                ])
                scores = np.stack([
                    (neighbors == candidate).sum(axis=0)
                    for candidate in range(palette_size)
                ])
                scores[color_index][small_pixels] = -1
                best = scores.argmax(axis=0)
                replace = small_pixels & (scores.max(axis=0) > 0)
                result[replace] = best[replace]
            changed = True
        if not changed:
            break
    return result


def component_masks(color_map: np.ndarray, color_index: int):
    components, count = ndimage.label(color_map == color_index, structure=FOUR_CONNECTED)
    objects = ndimage.find_objects(components)
    found = []
    for component_id in range(1, count + 1):
        bounds = objects[component_id - 1]
        if bounds is None:
            continue
        local = components[bounds] == component_id
        area = int(local.sum())
        found.append((bounds[0].start, bounds[1].start, area, bounds, local))
    return sorted(found)


def boundary_edges(mask: np.ndarray, x_offset: int, y_offset: int):
    edges = []
    height, width = mask.shape
    for local_y, local_x in np.argwhere(mask):
        x = int(local_x + x_offset)
        y = int(local_y + y_offset)
        if local_y == 0 or not mask[local_y - 1, local_x]:
            edges.append(((x, y), (x + 1, y)))
        if local_x == width - 1 or not mask[local_y, local_x + 1]:
            edges.append(((x + 1, y), (x + 1, y + 1)))
        if local_y == height - 1 or not mask[local_y + 1, local_x]:
            edges.append(((x + 1, y + 1), (x, y + 1)))
        if local_x == 0 or not mask[local_y, local_x - 1]:
            edges.append(((x, y + 1), (x, y)))
    return edges


def direction(start, end) -> int:
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    return {(1, 0): 0, (0, 1): 1, (-1, 0): 2, (0, -1): 3}[(dx, dy)]


def trace_loops(edges):
    outgoing = defaultdict(list)
    remaining = set()
    for start, end in edges:
        outgoing[start].append(end)
        remaining.add((start, end))

    loops = []
    while remaining:
        first_start, first_end = min(remaining)
        remaining.remove((first_start, first_end))
        points = [first_start, first_end]
        previous_direction = direction(first_start, first_end)
        current = first_end

        while current != first_start:
            candidates = [end for end in outgoing[current] if (current, end) in remaining]
            if not candidates:
                raise RuntimeError(f"Open region boundary at {current}")

            # Keep the painted pixels on the right side of the path.  The turn
            # preference disambiguates boundaries that touch at one corner.
            preference = {1: 0, 0: 1, 3: 2, 2: 3}
            next_end = min(
                candidates,
                key=lambda end: preference[(direction(current, end) - previous_direction) % 4],
            )
            remaining.remove((current, next_end))
            points.append(next_end)
            previous_direction = direction(current, next_end)
            current = next_end

        loops.append(remove_collinear(points[:-1]))
    return loops


def remove_collinear(points):
    if len(points) < 4:
        return points
    result = []
    for index, point in enumerate(points):
        previous = points[index - 1]
        following = points[(index + 1) % len(points)]
        if (point[0] - previous[0], point[1] - previous[1]) == (
            following[0] - point[0], following[1] - point[1]
        ):
            continue
        result.append(point)
    return result


def path_data(loops) -> str:
    commands = []
    for points in loops:
        if not points:
            continue
        commands.append(f"M{points[0][0]} {points[0][1]}")
        current_x, current_y = points[0]
        for x, y in points[1:]:
            if y == current_y:
                commands.append(f"H{x}")
            elif x == current_x:
                commands.append(f"V{y}")
            else:
                commands.append(f"L{x} {y}")
            current_x, current_y = x, y
        commands.append("Z")
    return "".join(commands)


def label_position(mask: np.ndarray, x_offset: int, y_offset: int):
    distances = ndimage.distance_transform_edt(mask)
    local_y, local_x = np.unravel_index(int(distances.argmax()), distances.shape)
    radius = float(distances[local_y, local_x])
    return x_offset + local_x + 0.5, y_offset + local_y + 0.5, radius


def rebuild_svg(project: dict) -> int:
    palette = project["palette"]
    color_map = initial_color_map(ASSETS / f"{project['id']}.webp", palette)
    color_map = merge_small_regions(color_map, len(palette))
    paths = []
    labels = []
    region_id = 0

    for color_index, color in enumerate(palette):
        for y, x, _area, _bounds, local_mask in component_masks(color_map, color_index):
            loops = trace_loops(boundary_edges(local_mask, x, y))
            data = path_data(loops)
            number = color_index + 1
            fill = color["hex"].lower()
            paths.append(
                f'<path class="paint-region" data-region-id="{region_id}" '
                f'data-number="{number}" data-color="{fill}" fill="{fill}" '
                f'fill-rule="evenodd" stroke="#716a64" stroke-width=".45" '
                f'stroke-linejoin="round" d="{data}"/>'
            )
            label_x, label_y, radius = label_position(local_mask, x, y)
            font_size = max(5.5, min(11.5, radius * 1.65))
            labels.append(
                f'<text class="label number-label" data-region-id="{region_id}" '
                f'x="{label_x:.1f}" y="{label_y:.1f}" font-size="{font_size:.1f}" '
                f'dominant-baseline="middle" text-anchor="middle">{number}</text>'
            )
            region_id += 1

    title = html.escape(project["id"].replace("-", " ").title())
    svg = (
        f'<svg width="100%" height="100%" viewBox="0 0 {MAP_WIDTH} {MAP_HEIGHT}" '
        'preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">'
        f'<title>{title} paint-by-number map</title>'
        '<g class="paint-regions">' + "".join(paths) + '</g>'
        '<g class="number-labels">' + "".join(labels) + '</g>'
        '</svg>\n'
    )
    (ASSETS / f"{project['id']}.svg").write_text(svg, encoding="utf-8")
    return region_id


def normalize_existing_numbers(project: dict) -> None:
    old_numbers = [int(re.search(r"\d+", item["name"]).group()) for item in project["palette"]]
    mapping = {old: new for new, old in enumerate(old_numbers, start=1)}
    if all(old == new for old, new in mapping.items()):
        return

    path = ASSETS / f"{project['id']}.svg"
    source = path.read_text(encoding="utf-8")
    for old, new in mapping.items():
        source = source.replace(f'data-number="{old}"', f'data-number="tmp-{new}"')
    source = re.sub(
        r'(<text\b[^>]*>)(\d+)(</text>)',
        lambda match: match.group(1) + str(mapping[int(match.group(2))]) + match.group(3),
        source,
    )
    source = re.sub(r'data-number="tmp-(\d+)"', r'data-number="\1"', source)
    path.write_text(source, encoding="utf-8")


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    for project in manifest:
        if project["id"] in REBUILD_IDS:
            project["regions"] = rebuild_svg(project)
            project["width"] = MAP_WIDTH
            project["height"] = MAP_HEIGHT
        else:
            normalize_existing_numbers(project)
        for number, color in enumerate(project["palette"], start=1):
            color["name"] = f"Color {number}"

    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    rebuilt = ", ".join(sorted(REBUILD_IDS))
    print(f"Rebuilt complete maps: {rebuilt}")


if __name__ == "__main__":
    main()
