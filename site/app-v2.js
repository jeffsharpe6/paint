(function () {
  "use strict";

  const meta = window.PAINT_PROJECTS_META || [];
  const categoryNames = { puppies: "Puppies", landscapes: "Landscapes", flowers: "Flowers", gardens: "Gardens", nature: "Nature & more" };
  const STORAGE_KEY = "palette-by-number-progress-v3";
  const LAST_KEY = "palette-by-number-last-project-v3";
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const asset = (id, extension) => `assets/projects/${id}.${extension}`;

  let projects = [];
  let currentProject = null;
  let currentState = {};
  let selectedNumber = 1;
  let undoHistory = [];
  let numbersVisible = true;
  let zoom = 1;
  let completionShown = false;
  let toastTimer;

  const grid = $("#projectGrid");
  const studio = $("#studio");
  const artboard = $("#artboard");
  const paletteList = $("#paletteList");
  const toast = $("#toast");

  function loadAllProgress() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  }

  function saveProgress() {
    if (!currentProject) return;
    const all = loadAllProgress();
    all[currentProject.id] = currentState;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    localStorage.setItem(LAST_KEY, currentProject.id);
    updateContinueButton();
  }

  function projectProgress(project) {
    const saved = loadAllProgress()[project.id] || {};
    return project.regions ? Math.min(100, Math.round((Object.keys(saved).length / project.regions) * 100)) : 0;
  }

  function difficultyDots(level) {
    return `<span class="difficulty" aria-label="Difficulty ${level} out of 3">${[1,2,3].map(n => `<i class="${n <= level ? "on" : ""}"></i>`).join("")}</span>`;
  }

  function friendlyColorName(hex) {
    const rgb = hex.match(/[a-f\d]{2}/gi).map(value => parseInt(value, 16) / 255);
    const max = Math.max(...rgb), min = Math.min(...rgb);
    const light = (max + min) / 2;
    const delta = max - min;
    if (delta < .09) return light > .82 ? "Porcelain" : light > .62 ? "Warm stone" : light > .38 ? "Soft slate" : "Charcoal";
    let hue = 0;
    if (max === rgb[0]) hue = ((rgb[1] - rgb[2]) / delta) % 6;
    else if (max === rgb[1]) hue = (rgb[2] - rgb[0]) / delta + 2;
    else hue = (rgb[0] - rgb[1]) / delta + 4;
    hue = (hue * 60 + 360) % 360;
    const base = hue < 12 ? "Coral" : hue < 28 ? "Terracotta" : hue < 48 ? "Amber" : hue < 68 ? "Ochre" : hue < 92 ? "Olive" : hue < 155 ? "Sage" : hue < 185 ? "Teal" : hue < 220 ? "Blue" : hue < 260 ? "Indigo" : hue < 305 ? "Plum" : hue < 342 ? "Rose" : "Berry";
    const prefix = light > .78 ? "Pale " : light > .62 ? "Soft " : light < .29 ? "Deep " : "";
    return prefix + base.toLowerCase().replace(/^./, character => character.toUpperCase());
  }

  function renderGallery(filter = "all") {
    const visible = filter === "all" ? projects : projects.filter(project => project.category === filter);
    grid.innerHTML = visible.map(project => {
      const progress = projectProgress(project);
      const action = progress === 100 ? "View artwork" : progress > 0 ? "Continue painting" : "Begin painting";
      return `
        <article class="project-card" data-category="${project.category}">
          <div class="project-art-wrap">
            <img src="${asset(project.id, "webp")}" alt="Completed preview of ${project.title}" loading="lazy" width="800" height="600">
            <div class="card-progress" style="--progress:${progress}%"></div>
            <div class="card-overlay"><button class="start-project" type="button" data-project="${project.id}" aria-label="${action}: ${project.title}">${action} →</button></div>
          </div>
          <div class="card-meta">
            <div><h3>${project.title}</h3><p>${categoryNames[project.category]} · ${progress ? `${progress}% complete` : project.description}</p></div>
            ${difficultyDots(project.difficulty)}
          </div>
        </article>`;
    }).join("");
    $$(".start-project", grid).forEach(button => button.addEventListener("click", () => openStudio(button.dataset.project)));
  }

  function renderHero() {
    const hero = $("#heroPreview");
    if (hero) hero.innerHTML = `<img src="${asset("golden-hour-pup", "webp")}" alt="" width="800" height="600">`;
  }

  async function openStudio(projectId) {
    currentProject = projects.find(project => project.id === projectId) || projects[0];
    if (!currentProject) return;
    currentState = { ...(loadAllProgress()[currentProject.id] || {}) };
    selectedNumber = 1;
    undoHistory = [];
    zoom = 1;
    numbersVisible = true;
    completionShown = false;
    $("#studioTitle").textContent = currentProject.title;
    $("#studioCategory").textContent = categoryNames[currentProject.category];
    $("#hintButton").textContent = "Numbers on";
    $("#hintButton").setAttribute("aria-pressed", "true");
    artboard.innerHTML = '<div class="art-loading"><span></span>Preparing your canvas…</div>';
    studio.hidden = false;
    document.body.classList.add("studio-open");
    window.history.replaceState(null, "", `#paint=${currentProject.id}`);
    localStorage.setItem(LAST_KEY, currentProject.id);
    updateZoom();
    try {
      const response = await fetch(asset(currentProject.id, "svg"));
      if (!response.ok) throw new Error(`Artwork returned ${response.status}`);
      artboard.innerHTML = await response.text();
      prepareArtwork();
      selectedNumber = findFirstIncompleteColor();
      renderStudioControls();
      setTimeout(() => $("#closeStudio").focus(), 50);
    } catch (error) {
      console.error(error);
      artboard.innerHTML = '<div class="art-error">This canvas could not be opened. Please return to the collection and try again.</div>';
      showToast("The artwork could not be loaded.");
    }
  }

  function prepareArtwork() {
    const svg = $("svg", artboard);
    if (!svg) throw new Error("Artwork is not a valid SVG");
    const regions = $$(".paint-region", svg);
    const regionIds = new Set(regions.map(path => path.dataset.regionId));
    const paletteNumbers = new Set(currentProject.palette.map((_, index) => String(index + 1)));
    if (regions.length !== currentProject.regions || regionIds.size !== regions.length ||
        regions.some(path => !paletteNumbers.has(path.dataset.number))) {
      throw new Error("Artwork region map is incomplete or does not match its palette");
    }
    currentState = Object.fromEntries(Object.entries(currentState).filter(([id]) => regionIds.has(id)));
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", `${currentProject.title} paint-by-number canvas`);
    svg.classList.toggle("hide-numbers", !numbersVisible);
    regions.forEach(path => {
      const id = path.dataset.regionId;
      const painted = Boolean(currentState[id]);
      path.style.fill = painted ? path.dataset.color : "#fbfaf6";
      path.setAttribute("tabindex", "0");
      path.setAttribute("role", "button");
      path.setAttribute("aria-label", `Paint area number ${path.dataset.number}`);
      path.addEventListener("click", () => paintRegion(path));
      path.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); paintRegion(path); }
      });
      const label = labelFor(id);
      if (label) label.hidden = painted;
    });
  }

  function closeStudio() {
    if (!currentProject) return;
    saveProgress();
    studio.hidden = true;
    document.body.classList.remove("studio-open");
    window.history.replaceState(null, "", "#projects");
    renderGallery($(".filter-button.active")?.dataset.filter || "all");
    const cardButton = $(`[data-project="${currentProject.id}"]`);
    if (cardButton) setTimeout(() => cardButton.focus(), 20);
  }

  function pathsFor(number) {
    return $$(`.paint-region[data-number="${number}"]`, artboard);
  }

  function labelFor(id) {
    return $(`.label[data-region-id="${id}"]`, artboard);
  }

  function findFirstIncompleteColor() {
    for (let number = 1; number <= currentProject.palette.length; number++) {
      if (pathsFor(number).some(path => !currentState[path.dataset.regionId])) return number;
    }
    return 1;
  }

  function remainingFor(number) {
    return pathsFor(number).filter(path => !currentState[path.dataset.regionId]).length;
  }

  function renderPalette() {
    paletteList.innerHTML = currentProject.palette.map((color, index) => {
      const number = index + 1;
      const remaining = remainingFor(number);
      return `
        <button class="color-button ${selectedNumber === number ? "active" : ""} ${remaining === 0 ? "complete" : ""}" type="button" data-color-number="${number}" aria-pressed="${selectedNumber === number}">
          <span class="color-dot" style="background:${color.hex}">${remaining === 0 ? "✓" : number}</span>
          <span class="color-name">${color.name}</span>
          <span class="color-count">${remaining === 0 ? "Complete" : `${remaining} left`}</span>
        </button>`;
    }).join("");
    $$(".color-button", paletteList).forEach(button => button.addEventListener("click", () => {
      selectedNumber = Number(button.dataset.colorNumber);
      renderPalette();
      updateSelectionStatus();
    }));
  }

  function paintRegion(path) {
    const id = path.dataset.regionId;
    const number = Number(path.dataset.number);
    if (currentState[id]) { showToast("That space is already painted."); return; }
    if (number !== selectedNumber) {
      path.classList.remove("wrong");
      void path.getBoundingClientRect();
      path.classList.add("wrong");
      showToast(`Try color ${number} for this space.`);
      return;
    }
    currentState[id] = number;
    undoHistory.push(id);
    path.style.fill = path.dataset.color;
    const label = labelFor(id);
    if (label) label.hidden = true;
    saveProgress();
    if (remainingFor(selectedNumber) === 0) {
      const next = findFirstIncompleteColor();
      showToast(`Color ${selectedNumber} complete${progressPercent() < 100 ? ` — color ${next} is next.` : "!"}`);
      selectedNumber = next;
    }
    renderStudioControls();
    if (progressPercent() === 100 && !completionShown) {
      completionShown = true;
      setTimeout(() => { $("#completionDialog").hidden = false; $("#dialogDownload").focus(); }, 420);
    }
  }

  function progressPercent() {
    return Math.round((Object.keys(currentState).length / currentProject.regions) * 100);
  }

  function updateProgress() {
    const value = progressPercent();
    $("#progressText").textContent = `${value}% complete`;
    $("#progressBar").style.width = `${value}%`;
    $(".progress-track").setAttribute("aria-valuenow", String(value));
  }

  function updateSelectionStatus() {
    const color = currentProject.palette[selectedNumber - 1];
    const remaining = remainingFor(selectedNumber);
    $("#selectionStatus").textContent = remaining
      ? `Color ${selectedNumber} · ${color.name} · ${remaining} ${remaining === 1 ? "space" : "spaces"} left`
      : "Every space is beautifully complete.";
  }

  function renderStudioControls() {
    renderPalette();
    updateProgress();
    updateSelectionStatus();
    $("#undoButton").disabled = undoHistory.length === 0;
  }

  function undo() {
    const id = undoHistory.pop();
    if (!id) return;
    const number = currentState[id];
    delete currentState[id];
    const path = $(`.paint-region[data-region-id="${id}"]`, artboard);
    if (path) path.style.fill = "#fbfaf6";
    const label = labelFor(id);
    if (label) label.hidden = false;
    selectedNumber = number;
    saveProgress();
    renderStudioControls();
    showToast("Last space cleared.");
  }

  function resetProject() {
    if (!Object.keys(currentState).length) { showToast("This canvas is already fresh."); return; }
    if (!window.confirm("Start this project over? Your painted spaces will be cleared.")) return;
    currentState = {};
    undoHistory = [];
    selectedNumber = 1;
    completionShown = false;
    $$(".paint-region", artboard).forEach(path => { path.style.fill = "#fbfaf6"; });
    $$(".label", artboard).forEach(label => { label.hidden = false; });
    saveProgress();
    renderStudioControls();
    showToast("A fresh canvas is ready.");
  }

  function toggleNumbers() {
    numbersVisible = !numbersVisible;
    $("#hintButton").textContent = numbersVisible ? "Numbers on" : "Numbers off";
    $("#hintButton").setAttribute("aria-pressed", String(numbersVisible));
    $("svg", artboard)?.classList.toggle("hide-numbers", !numbersVisible);
  }

  function updateZoom() {
    artboard.style.transform = `scale(${zoom})`;
    $("#zoomText").textContent = `${Math.round(zoom * 100)}%`;
  }

  function changeZoom(delta) {
    zoom = Math.min(1.5, Math.max(.75, Math.round((zoom + delta) * 100) / 100));
    updateZoom();
  }

  function downloadArtwork() {
    const source = $("svg", artboard);
    if (!source) return;
    const clone = source.cloneNode(true);
    $$(".label", clone).forEach(label => label.remove());
    $$(".paint-region", clone).forEach(path => {
      const painted = currentState[path.dataset.regionId];
      const fill = painted ? path.dataset.color : "#fbfaf6";
      path.style.fill = fill;
      path.style.stroke = painted ? fill : "#d7d0c8";
      path.removeAttribute("tabindex");
      path.removeAttribute("role");
      path.removeAttribute("aria-label");
      path.classList.remove("wrong");
    });
    clone.setAttribute("width", "1600");
    clone.setAttribute("height", "1200");
    const svgText = new XMLSerializer().serializeToString(clone);
    const url = URL.createObjectURL(new Blob([svgText], { type: "image/svg+xml;charset=utf-8" }));
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1600; canvas.height = 1200;
      const context = canvas.getContext("2d");
      context.fillStyle = "#fbfaf6"; context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(png => {
        if (!png) { showToast("We couldn’t prepare the image. Please try again."); return; }
        const link = document.createElement("a");
        link.href = URL.createObjectURL(png);
        link.download = `${currentProject.id}-palette-by-number.png`;
        document.body.appendChild(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
        showToast("Your artwork is downloading.");
      }, "image/png");
    };
    image.onerror = () => { URL.revokeObjectURL(url); showToast("We couldn’t prepare the image. Please try again."); };
    image.src = url;
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
  }

  function updateContinueButton() {
    const button = $("#continueButton");
    const project = projects.find(item => item.id === localStorage.getItem(LAST_KEY));
    button.hidden = !project;
    if (project) {
      button.dataset.project = project.id;
      button.firstChild.textContent = projectProgress(project) === 100 ? "View finished artwork " : "Continue painting ";
    }
  }

  function bindEvents() {
    $$(".filter-button").forEach(button => button.addEventListener("click", () => {
      $$(".filter-button").forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      renderGallery(button.dataset.filter);
    }));
    $("#continueButton").addEventListener("click", event => openStudio(event.currentTarget.dataset.project));
    $("#closeStudio").addEventListener("click", closeStudio);
    $("#undoButton").addEventListener("click", undo);
    $("#resetButton").addEventListener("click", resetProject);
    $("#hintButton").addEventListener("click", toggleNumbers);
    $("#zoomOut").addEventListener("click", () => changeZoom(-.25));
    $("#zoomIn").addEventListener("click", () => changeZoom(.25));
    $("#downloadButton").addEventListener("click", downloadArtwork);
    $("#dialogDownload").addEventListener("click", () => { downloadArtwork(); $("#completionDialog").hidden = true; });
    $("#dismissCompletion").addEventListener("click", () => { $("#completionDialog").hidden = true; });
    $("#completionDialog").addEventListener("click", event => { if (event.target === event.currentTarget) event.currentTarget.hidden = true; });
    document.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;
      if (!$("#completionDialog").hidden) $("#completionDialog").hidden = true;
      else if (!studio.hidden) closeStudio();
    });
  }

  async function init() {
    try {
      const response = await fetch("assets/projects/manifest.json");
      if (!response.ok) throw new Error("Project manifest unavailable");
      const assets = await response.json();
      const assetMap = new Map(assets.map(item => [item.id, item]));
      projects = meta.map(item => ({ ...item, ...assetMap.get(item.id) })).filter(item => item.palette && item.regions);
      projects.forEach(project => project.palette.forEach(color => { color.name = friendlyColorName(color.hex); }));
      $("#year").textContent = new Date().getFullYear();
      renderHero();
      renderGallery();
      bindEvents();
      updateContinueButton();
      const match = location.hash.match(/^#paint=([a-z0-9-]+)$/);
      if (match && projects.some(project => project.id === match[1])) openStudio(match[1]);
    } catch (error) {
      console.error(error);
      grid.innerHTML = '<p class="project-empty">The collection could not be loaded. Please refresh the page.</p>';
    }
  }

  init();
})();
