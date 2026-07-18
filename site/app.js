(function () {
  "use strict";

  const projects = window.PAINT_PROJECTS || [];
  const categoryNames = {
    puppies: "Puppies",
    landscapes: "Landscapes",
    flowers: "Flowers",
    gardens: "Gardens",
    nature: "Nature & more"
  };
  const STORAGE_KEY = "palette-by-number-progress-v1";
  const LAST_KEY = "palette-by-number-last-project";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const grid = $("#projectGrid");
  const studio = $("#studio");
  const artboard = $("#artboard");
  const paletteList = $("#paletteList");
  const toast = $("#toast");
  let currentProject = null;
  let currentState = {};
  let selectedNumber = 1;
  let undoHistory = [];
  let numbersVisible = true;
  let zoom = 1;
  let completionShown = false;
  let toastTimer;

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

  function attrsToString(attrs) {
    return Object.entries(attrs)
      .map(([key, value]) => `${key}="${String(value).replace(/"/g, "&quot;")}"`)
      .join(" ");
  }

  function colorFor(project, region, completed, state) {
    const isPainted = completed || Boolean(state && state[region.id]);
    return isPainted ? project.palette[region.n - 1].hex : "#fbfaf6";
  }

  function makeSvg(project, options = {}) {
    const { completed = false, state = {}, labels = false, interactive = false, className = "" } = options;
    const regionMarkup = project.regions.map((r) => {
      const color = colorFor(project, r, completed, state);
      const isLine = r.type === "line";
      const paintAttrs = isLine
        ? `fill="none" stroke="${color}"`
        : `fill="${color}" stroke="#4b4640" stroke-width="1.35" stroke-linejoin="round"`;
      const interaction = interactive
        ? `class="paint-region" data-region-id="${r.id}" data-number="${r.n}" tabindex="0" role="button" aria-label="Paint area number ${r.n}"`
        : "";
      return `<${r.type} ${attrsToString(r.attrs)} ${paintAttrs} ${interaction}></${r.type}>`;
    }).join("");

    const labelMarkup = labels
      ? project.regions.filter((r) => !state[r.id]).map((r) => {
          const size = r.type === "circle" && Number(r.attrs.r) < 16 ? 8 : 11;
          return `<text class="number-label" x="${r.label[0]}" y="${r.label[1]}" font-size="${size}" text-anchor="middle" dominant-baseline="central">${r.n}</text>`;
        }).join("")
      : "";

    return `<svg class="${className}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 620" role="img" aria-label="${project.title} paint-by-number illustration">${regionMarkup}${labelMarkup}</svg>`;
  }

  function projectProgress(project) {
    const saved = loadAllProgress()[project.id] || {};
    return Math.round((Object.keys(saved).length / project.regions.length) * 100);
  }

  function difficultyDots(level) {
    return `<span class="difficulty" aria-label="Difficulty ${level} out of 3">${[1,2,3].map((n) => `<i class="${n <= level ? "on" : ""}"></i>`).join("")}</span>`;
  }

  function renderGallery(filter = "all") {
    const visible = filter === "all" ? projects : projects.filter((p) => p.category === filter);
    grid.innerHTML = visible.map((project) => {
      const progress = projectProgress(project);
      const action = progress === 100 ? "View artwork" : progress > 0 ? "Continue painting" : "Begin painting";
      return `
        <article class="project-card" data-category="${project.category}">
          <div class="project-art-wrap">
            ${makeSvg(project, { completed: true })}
            <div class="card-progress" style="--progress:${progress}%"></div>
            <div class="card-overlay">
              <button class="start-project" type="button" data-project="${project.id}" aria-label="${action}: ${project.title}">${action} →</button>
            </div>
          </div>
          <div class="card-meta">
            <div><h3>${project.title}</h3><p>${categoryNames[project.category]} · ${progress ? `${progress}% complete` : project.description}</p></div>
            ${difficultyDots(project.difficulty)}
          </div>
        </article>`;
    }).join("");

    $$(".start-project", grid).forEach((button) => {
      button.addEventListener("click", () => openStudio(button.dataset.project));
    });
  }

  function renderHero() {
    const hero = $("#heroPreview");
    if (hero && projects[0]) hero.innerHTML = makeSvg(projects[0], { completed: true });
  }

  function openStudio(projectId) {
    currentProject = projects.find((p) => p.id === projectId) || projects[0];
    if (!currentProject) return;
    currentState = { ...(loadAllProgress()[currentProject.id] || {}) };
    selectedNumber = findFirstIncompleteColor();
    undoHistory = [];
    zoom = 1;
    numbersVisible = true;
    completionShown = false;
    $("#studioTitle").textContent = currentProject.title;
    $("#studioCategory").textContent = categoryNames[currentProject.category];
    $("#hintButton").textContent = "Numbers on";
    $("#hintButton").setAttribute("aria-pressed", "true");
    updateZoom();
    renderStudio();
    studio.hidden = false;
    document.body.classList.add("studio-open");
    window.history.replaceState(null, "", `#paint=${currentProject.id}`);
    localStorage.setItem(LAST_KEY, currentProject.id);
    setTimeout(() => $("#closeStudio").focus(), 50);
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

  function findFirstIncompleteColor() {
    if (!currentProject) return 1;
    for (let n = 1; n <= currentProject.palette.length; n++) {
      if (currentProject.regions.some((r) => r.n === n && !currentState[r.id])) return n;
    }
    return 1;
  }

  function remainingFor(number) {
    return currentProject.regions.filter((r) => r.n === number && !currentState[r.id]).length;
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
    $$(".color-button", paletteList).forEach((button) => {
      button.addEventListener("click", () => {
        selectedNumber = Number(button.dataset.colorNumber);
        renderPalette();
        updateSelectionStatus();
      });
    });
  }

  function renderArtwork() {
    artboard.innerHTML = makeSvg(currentProject, { state: currentState, labels: true, interactive: true, className: numbersVisible ? "" : "hide-numbers" });
    $$(".paint-region", artboard).forEach((element) => {
      const activate = () => paintRegion(element);
      element.addEventListener("click", activate);
      element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(); }
      });
    });
  }

  function paintRegion(element) {
    const id = element.dataset.regionId;
    const number = Number(element.dataset.number);
    if (currentState[id]) {
      showToast("That space is already painted.");
      return;
    }
    if (number !== selectedNumber) {
      element.classList.remove("wrong");
      void element.getBoundingClientRect();
      element.classList.add("wrong");
      showToast(`Try color ${number} for this space.`);
      return;
    }
    currentState[id] = number;
    undoHistory.push(id);
    saveProgress();
    if (remainingFor(selectedNumber) === 0) {
      const next = findFirstIncompleteColor();
      showToast(`Color ${selectedNumber} complete${progressPercent() < 100 ? ` — color ${next} is next.` : "!"}`);
      selectedNumber = next;
    }
    renderStudio();
    if (progressPercent() === 100 && !completionShown) {
      completionShown = true;
      setTimeout(() => { $("#completionDialog").hidden = false; $("#dialogDownload").focus(); }, 420);
    }
  }

  function progressPercent() {
    return Math.round((Object.keys(currentState).length / currentProject.regions.length) * 100);
  }

  function updateProgress() {
    const value = progressPercent();
    $("#progressText").textContent = `${value}% complete`;
    $("#progressBar").style.width = `${value}%`;
    const track = $(".progress-track");
    track.setAttribute("aria-valuenow", String(value));
  }

  function updateSelectionStatus() {
    const color = currentProject.palette[selectedNumber - 1];
    const remaining = remainingFor(selectedNumber);
    $("#selectionStatus").textContent = remaining
      ? `Color ${selectedNumber} · ${color.name} · ${remaining} ${remaining === 1 ? "space" : "spaces"} left`
      : "Every space is beautifully complete.";
  }

  function renderStudio() {
    renderPalette();
    renderArtwork();
    updateProgress();
    updateSelectionStatus();
    $("#undoButton").disabled = undoHistory.length === 0;
  }

  function undo() {
    const id = undoHistory.pop();
    if (!id) return;
    const number = currentState[id];
    delete currentState[id];
    selectedNumber = number;
    saveProgress();
    renderStudio();
    showToast("Last space cleared.");
  }

  function resetProject() {
    if (!Object.keys(currentState).length) { showToast("This canvas is already fresh."); return; }
    if (!window.confirm("Start this project over? Your painted spaces will be cleared.")) return;
    currentState = {};
    undoHistory = [];
    selectedNumber = 1;
    completionShown = false;
    saveProgress();
    renderStudio();
    showToast("A fresh canvas is ready.");
  }

  function toggleNumbers() {
    numbersVisible = !numbersVisible;
    $("#hintButton").textContent = numbersVisible ? "Numbers on" : "Numbers off";
    $("#hintButton").setAttribute("aria-pressed", String(numbersVisible));
    const svg = $("svg", artboard);
    if (svg) svg.classList.toggle("hide-numbers", !numbersVisible);
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
    if (!currentProject) return;
    const svgMarkup = makeSvg(currentProject, { state: currentState, labels: false, interactive: false });
    const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1600;
      canvas.height = 1240;
      const context = canvas.getContext("2d");
      context.fillStyle = "#fbfaf6";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((png) => {
        if (!png) { showToast("We couldn’t prepare the image. Please try again."); return; }
        const link = document.createElement("a");
        link.href = URL.createObjectURL(png);
        link.download = `${currentProject.id}-palette-by-number.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
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
    const last = localStorage.getItem(LAST_KEY);
    const project = projects.find((p) => p.id === last);
    button.hidden = !project;
    if (project) {
      button.dataset.project = project.id;
      const progress = projectProgress(project);
      button.firstChild.textContent = progress === 100 ? "View finished artwork " : "Continue painting ";
    }
  }

  function bindEvents() {
    $$(".filter-button").forEach((button) => {
      button.addEventListener("click", () => {
        $$(".filter-button").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        renderGallery(button.dataset.filter);
      });
    });
    $("#continueButton").addEventListener("click", (event) => openStudio(event.currentTarget.dataset.project));
    $("#closeStudio").addEventListener("click", closeStudio);
    $("#undoButton").addEventListener("click", undo);
    $("#resetButton").addEventListener("click", resetProject);
    $("#hintButton").addEventListener("click", toggleNumbers);
    $("#zoomOut").addEventListener("click", () => changeZoom(-.25));
    $("#zoomIn").addEventListener("click", () => changeZoom(.25));
    $("#downloadButton").addEventListener("click", downloadArtwork);
    $("#dialogDownload").addEventListener("click", () => { downloadArtwork(); $("#completionDialog").hidden = true; });
    $("#dismissCompletion").addEventListener("click", () => { $("#completionDialog").hidden = true; });
    $("#completionDialog").addEventListener("click", (event) => { if (event.target === event.currentTarget) event.currentTarget.hidden = true; });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (!$("#completionDialog").hidden) $("#completionDialog").hidden = true;
      else if (!studio.hidden) closeStudio();
    });
  }

  function init() {
    $("#year").textContent = new Date().getFullYear();
    renderHero();
    renderGallery();
    bindEvents();
    updateContinueButton();
    const match = location.hash.match(/^#paint=([a-z0-9-]+)$/);
    if (match && projects.some((p) => p.id === match[1])) openStudio(match[1]);
  }

  init();
})();
