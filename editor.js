/**
 * editor.js
 * Collection Editor logic: live autocomplete search against RAWG, pick a
 * result, assign personal platforms (filtered by real compatibility),
 * save to Storage. Also handles platform management and import/export.
 */

let library = Storage.load();
let pendingGame = null; // normalized RAWG details awaiting platform assignment
let debounceTimer = null;
let activeResults = [];
let highlightedIndex = -1;
let editingGameId = null;

const el = {
  gameSearch: document.getElementById("gameSearch"),
  dropdown: document.getElementById("autocompleteDropdown"),
  platformPicker: document.getElementById("platformPicker"),
  selectedGameCard: document.getElementById("selectedGameCard"),
  platformCheckboxes: document.getElementById("platformCheckboxes"),
  confirmAddBtn: document.getElementById("confirmAddBtn"),
  newPlatformName: document.getElementById("newPlatformName"),
  newPlatformIcon: document.getElementById("newPlatformIcon"),
  addPlatformBtn: document.getElementById("addPlatformBtn"),
  collectionCount: document.getElementById("collectionCount"),
  collectionBody: document.getElementById("collectionBody"),
  exportBtn: document.getElementById("exportBtn"),
  importBtn: document.getElementById("importBtn"),
  importInput: document.getElementById("importInput"),
  editDrawer: document.getElementById("editDrawer"),
  editDrawerTitle: document.getElementById("editDrawerTitle"),
  drawerPlatformCheckboxes: document.getElementById("drawerPlatformCheckboxes"),
  drawerMoodCheckboxes: document.getElementById("drawerMoodCheckboxes"),
  drawerPlayTime: document.getElementById("drawerPlayTime"),
  drawerLastPlayed: document.getElementById("drawerLastPlayed"),
  drawerRating: document.getElementById("drawerRating"),
  drawerFavorite: document.getElementById("drawerFavorite"),
  saveDrawerBtn: document.getElementById("saveDrawerBtn"),
  cancelDrawerBtn: document.getElementById("cancelDrawerBtn"),
  closeDrawerBtn: document.getElementById("closeDrawerBtn"),
  platformTemplateSearch: document.getElementById("platformTemplateSearch"),
  platformTemplateDropdown: document.getElementById("platformTemplateDropdown")
};

// ---------- Live autocomplete ----------

el.gameSearch.addEventListener("input", () => {
  const q = el.gameSearch.value.trim();
  clearTimeout(debounceTimer);
  if (q.length < 2) {
    hideDropdown();
    return;
  }
  debounceTimer = setTimeout(() => runAutocomplete(q), 300);
});

el.gameSearch.addEventListener("keydown", (e) => {
  if (el.dropdown.classList.contains("hidden")) return;
  const items = el.dropdown.querySelectorAll(".autocomplete-item");
  if (e.key === "ArrowDown") {
    e.preventDefault();
    highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1);
    updateHighlight(items);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    highlightedIndex = Math.max(highlightedIndex - 1, 0);
    updateHighlight(items);
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (highlightedIndex >= 0 && activeResults[highlightedIndex]) {
      selectSearchResult(activeResults[highlightedIndex].rawgId);
    }
  } else if (e.key === "Escape") {
    hideDropdown();
  }
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".autocomplete-wrap")) hideDropdown();
});

function updateHighlight(items) {
  items.forEach((item, i) => item.classList.toggle("highlighted", i === highlightedIndex));
}

async function runAutocomplete(query) {
  el.dropdown.classList.remove("hidden");
  el.dropdown.innerHTML = `<div class="autocomplete-loading">Searching…</div>`;
  try {
    const results = await Rawg.search(query, 8);
    activeResults = results;
    highlightedIndex = -1;
    renderDropdown(results);
  } catch (err) {
    el.dropdown.innerHTML = `<div class="autocomplete-empty">Unable to reach the game database.</div>`;
  }
}

function renderDropdown(results) {
  if (results.length === 0) {
    el.dropdown.innerHTML = `<div class="autocomplete-empty">No matches found.</div>`;
    return;
  }
  el.dropdown.innerHTML = "";
  results.forEach((r) => {
    const item = document.createElement("div");
    item.className = "autocomplete-item";
    item.innerHTML = `
      <img src="${r.cover || ""}" alt="" onerror="this.style.visibility='hidden'" />
      <div>
        <div class="ac-title">${r.title}</div>
        <div class="ac-sub">${r.year || "Unknown year"} · ${(r.officialPlatforms || []).slice(0, 3).join(", ")}</div>
      </div>
    `;
    item.onclick = () => selectSearchResult(r.rawgId);
    el.dropdown.appendChild(item);
  });
}

function hideDropdown() {
  el.dropdown.classList.add("hidden");
  el.dropdown.innerHTML = "";
  highlightedIndex = -1;
}

// ---------- Selecting a result ----------

async function selectSearchResult(rawgId) {
  hideDropdown();
  el.gameSearch.value = "Loading…";
  try {
    const details = await Rawg.details(rawgId);
    pendingGame = {
      ...details,
      moods: Moods.deriveAutoMoods(details),
      multiplayer: Multiplayer.deriveMultiplayerInfo(details)
    };
    el.gameSearch.value = details.title;
    renderSelectedGameCard();
    renderPlatformPicker();
  } catch (err) {
    el.gameSearch.value = "";
    alert("Unable to reach the game database. " + err.message);
  }
}

function renderSelectedGameCard() {
  el.selectedGameCard.innerHTML = `
    <img src="${pendingGame.cover || ""}" alt="" onerror="this.style.visibility='hidden'" />
    <div>
      <h3>${pendingGame.title} ${pendingGame.year ? `(${pendingGame.year})` : ""}</h3>
      <div class="official-platforms">Officially on: ${(pendingGame.officialPlatforms || []).join(", ") || "Unknown"}</div>
      <div class="official-platforms">${pendingGame.multiplayer && pendingGame.multiplayer.isMultiplayer ? `Multiplayer: up to ${pendingGame.multiplayer.maxPlayers || 2} players` : "Single-player / unknown multiplayer"}</div>
      <div class="moods-preview">${(pendingGame.moods || []).map((m) => `<span class="tag-pill">${Moods.MOOD_DEFS[m] ? Moods.MOOD_DEFS[m].emoji + " " + Moods.MOOD_DEFS[m].label : m}</span>`).join("")}</div>
    </div>
  `;
}

function renderPlatformPicker() {
  el.platformPicker.classList.remove("hidden");
  el.platformCheckboxes.innerHTML = "";
  const officialPlatforms = pendingGame.officialPlatforms || [];

  library.platforms.forEach((p) => {
    const supported = PlatformCompat.platformSupportsGame(p, officialPlatforms);
    const wrap = document.createElement("div");
    wrap.className = "platform-check" + (supported ? "" : " unsupported");
    wrap.innerHTML = `
      <input type="checkbox" id="plat_${p.id}" value="${p.id}" ${supported ? "checked" : ""} />
      <label for="plat_${p.id}">${p.icon || ""} ${p.name}</label>
    `;
    el.platformCheckboxes.appendChild(wrap);
  });
}

el.confirmAddBtn.onclick = () => {
  if (!pendingGame) return;
  const checked = Array.from(
    el.platformCheckboxes.querySelectorAll("input:checked")
  ).map((i) => i.value);

  const duplicate = library.games.find((g) =>
    (pendingGame.rawgId && g.rawgId === pendingGame.rawgId) ||
    (g.title || "").trim().toLowerCase() === pendingGame.title.trim().toLowerCase() && String(g.year || "") === String(pendingGame.year || "")
  );

  if (duplicate) {
    const mergedPlatforms = Array.from(new Set([...(duplicate.personalPlatforms || []), ...checked]));
    Storage.updateGame(library, duplicate.id, {
      rawgId: pendingGame.rawgId,
      year: pendingGame.year,
      cover: pendingGame.cover,
      genres: pendingGame.genres,
      tags: pendingGame.tags,
      officialPlatforms: pendingGame.officialPlatforms,
      personalPlatforms: mergedPlatforms,
      moods: pendingGame.moods,
      multiplayer: pendingGame.multiplayer
    });
    library = Storage.load();
    pendingGame = null;
    el.platformPicker.classList.add("hidden");
    el.gameSearch.value = "";
    renderCollectionTable();
    alert(`"${duplicate.title}" was already in your library, so I updated the existing entry instead of adding a duplicate.`);
    return;
  }

  const game = {
    id: `game_${pendingGame.rawgId}_${Date.now()}`,
    rawgId: pendingGame.rawgId,
    title: pendingGame.title,
    year: pendingGame.year,
    cover: pendingGame.cover,
    genres: pendingGame.genres,
    tags: pendingGame.tags,
    officialPlatforms: pendingGame.officialPlatforms,
    personalPlatforms: checked,
    moods: pendingGame.moods,
    multiplayer: pendingGame.multiplayer,
    lastPlayed: null,
    personalRating: null,
    playTime: null,
    favorite: false
  };

  Storage.addGame(library, game);
  library = Storage.load();
  pendingGame = null;
  el.platformPicker.classList.add("hidden");
  el.gameSearch.value = "";
  renderCollectionTable();
};

// ---------- Platform management ----------

function renderPlatformList() {
  const container = document.getElementById("platformList");
  if (!container) return;
  if (library.platforms.length === 0) {
    container.innerHTML = `<p class="subtitle" style="margin-bottom:14px">No platforms yet — add your first system below.</p>`;
    return;
  }
  container.innerHTML = "";
  library.platforms.forEach((p) => {
    const row = document.createElement("div");
    row.className = "platform-row";
    const iconFallback = String.fromCodePoint(0x1f3ae);
    row.innerHTML = `
      <span class="platform-row-icon">${p.icon || iconFallback}</span>
      <input type="text" class="styled-input platform-row-name" value="${p.name.replace(/"/g, "&quot;")}" data-id="${p.id}" />
      <button class="btn small-btn remove-platform-btn" data-id="${p.id}">Remove</button>
    `;
    const nameInput = row.querySelector(".platform-row-name");
    nameInput.addEventListener("change", () => {
      const newName = nameInput.value.trim();
      if (!newName) { nameInput.value = p.name; return; }
      Storage.updatePlatform(library, p.id, { name: newName });
      library = Storage.load();
      renderCollectionTable();
    });
    row.querySelector(".remove-platform-btn").onclick = () => {
      if (!confirm(`Remove "${p.name}"? Games will keep their other platforms.`)) return;
      Storage.removePlatform(library, p.id);
      library = Storage.load();
      renderPlatformList();
      renderCollectionTable();
      if (editingGameId) openEditDrawer(editingGameId);
    };
    container.appendChild(row);
  });
}

el.addPlatformBtn.onclick = () => {
  const name = el.newPlatformName.value.trim();
  if (!name) return;
  const id = name.toLowerCase().replace(/\s+/g, "-");
  if (library.platforms.some((p) => p.id === id)) {
    alert(`You already have a platform called "${name}".`);
    return;
  }
  Storage.addPlatform(library, {
    id,
    name,
    icon: el.newPlatformIcon.value.trim(),
    officialMatches: null // custom platform: not tied to a known template, PlatformCompat treats it as unfiltered
  });
  library = Storage.load();
  el.newPlatformName.value = "";
  el.newPlatformIcon.value = "";
  renderPlatformList();
  renderCollectionTable();
  if (editingGameId) openEditDrawer(editingGameId);
};

// ---------- Platform template search (standardized systems) ----------

function addPlatformFromTemplate(templateId) {
  const template = PlatformTemplates.findTemplateById(templateId);
  if (!template) return;
  if (library.platforms.some((p) => p.id === template.id)) {
    alert(`"${template.name}" is already in your personal platforms.`);
    return;
  }
  Storage.addPlatform(library, {
    id: template.id,
    name: template.name,
    icon: template.icon,
    officialMatches: template.officialMatches
  });
  library = Storage.load();
  el.platformTemplateSearch.value = "";
  hideTemplateDropdown();
  renderPlatformList();
  renderCollectionTable();
  if (editingGameId) openEditDrawer(editingGameId);
}

function hideTemplateDropdown() {
  el.platformTemplateDropdown.classList.add("hidden");
  el.platformTemplateDropdown.innerHTML = "";
}

function renderTemplateDropdown(matches) {
  if (matches.length === 0) {
    el.platformTemplateDropdown.classList.remove("hidden");
    el.platformTemplateDropdown.innerHTML = `<div class="autocomplete-empty">No known system matches that — use the custom field below.</div>`;
    return;
  }
  el.platformTemplateDropdown.classList.remove("hidden");
  el.platformTemplateDropdown.innerHTML = "";
  matches.forEach((t) => {
    const already = library.platforms.some((p) => p.id === t.id);
    const item = document.createElement("div");
    item.className = "autocomplete-item";
    item.innerHTML = `
      <span class="platform-row-icon">${t.icon}</span>
      <div>
        <div class="ac-title">${t.name}${already ? " (already added)" : ""}</div>
        <div class="ac-sub">Covers: ${t.officialMatches.join(", ")}</div>
      </div>
    `;
    if (!already) item.onclick = () => addPlatformFromTemplate(t.id);
    else item.style.opacity = "0.45";
    el.platformTemplateDropdown.appendChild(item);
  });
}

el.platformTemplateSearch.addEventListener("input", () => {
  const q = el.platformTemplateSearch.value.trim();
  if (q.length < 1) {
    hideTemplateDropdown();
    return;
  }
  renderTemplateDropdown(PlatformTemplates.searchTemplates(q));
});

document.addEventListener("click", (e) => {
  if (!e.target.closest("#platformTemplateSearch") && !e.target.closest("#platformTemplateDropdown")) {
    hideTemplateDropdown();
  }
});

renderPlatformList();

// ---------- Collection table ----------

function getPlatformMeta(platformId) {
  return library.platforms.find((p) => p.id === platformId) || null;
}

function formatPlatformList(platformIds = []) {
  if (!platformIds.length) return "—";
  return platformIds.map((id) => {
    const p = getPlatformMeta(id);
    const label = p ? `${p.icon ? p.icon + " " : ""}${p.name}` : id;
    return `<span class="inline-pill">${label}</span>`;
  }).join(" ");
}

function formatMoodList(moods = []) {
  if (!moods.length) return "—";
  return moods.map((m) => {
    const def = Moods.MOOD_DEFS[m];
    return def ? `${def.emoji} ${def.label}` : m;
  }).join(", ");
}

function renderCollectionTable() {
  el.collectionCount.textContent = library.games.length;
  el.collectionBody.innerHTML = "";
  if (library.games.length === 0) {
    el.collectionBody.innerHTML = `<tr><td colspan="5" style="color:var(--muted);text-align:center;padding:24px">No games yet — search above to add your first one.</td></tr>`;
    return;
  }
  library.games.forEach((g) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="cover-cell"><img src="${g.cover || ""}" alt="" onerror="this.style.visibility='hidden'" />${g.title}</td>
      <td>${formatPlatformList(g.personalPlatforms || [])}</td>
      <td>${formatMoodList(g.moods || [])}</td>
      <td>${g.lastPlayed ? new Date(g.lastPlayed).toLocaleDateString() : "Never"}</td>
      <td>
        <div class="table-actions">
          <button class="btn small-btn edit-btn" data-id="${g.id}">Edit</button>
          <button class="btn small-btn remove-btn" data-id="${g.id}">Remove</button>
        </div>
      </td>
    `;
    tr.querySelector(".edit-btn").onclick = () => openEditDrawer(g.id);
    tr.querySelector(".remove-btn").onclick = () => {
      Storage.removeGame(library, g.id);
      library = Storage.load();
      if (editingGameId === g.id) closeEditDrawer();
      renderCollectionTable();
    };
    el.collectionBody.appendChild(tr);
  });
}

function renderDrawerPlatformCheckboxes(game) {
  el.drawerPlatformCheckboxes.innerHTML = "";
  const selected = new Set(game.personalPlatforms || []);
  library.platforms.forEach((p) => {
    const supported = PlatformCompat.platformSupportsGame(p, game.officialPlatforms || []);
    const wrap = document.createElement("div");
    wrap.className = "platform-check" + (supported ? "" : " unsupported");
    wrap.innerHTML = `
      <input type="checkbox" id="drawer_plat_${p.id}" value="${p.id}" ${selected.has(p.id) ? "checked" : ""} />
      <label for="drawer_plat_${p.id}">${p.icon || ""} ${p.name}</label>
    `;
    el.drawerPlatformCheckboxes.appendChild(wrap);
  });
}

function renderDrawerMoodCheckboxes(game) {
  el.drawerMoodCheckboxes.innerHTML = "";
  const selected = new Set(game.moods || []);
  Object.entries(Moods.MOOD_DEFS).forEach(([id, def]) => {
    const wrap = document.createElement("div");
    wrap.className = "platform-check";
    wrap.innerHTML = `
      <input type="checkbox" id="drawer_mood_${id}" value="${id}" ${selected.has(id) ? "checked" : ""} />
      <label for="drawer_mood_${id}">${def.emoji} ${def.label}</label>
    `;
    el.drawerMoodCheckboxes.appendChild(wrap);
  });
}

function openEditDrawer(gameId) {
  const game = library.games.find((g) => g.id === gameId);
  if (!game) return;
  editingGameId = gameId;
  el.editDrawerTitle.textContent = `Edit ${game.title}`;
  renderDrawerPlatformCheckboxes(game);
  renderDrawerMoodCheckboxes(game);
  el.drawerPlayTime.value = game.playTime || "";
  el.drawerLastPlayed.value = game.lastPlayed || "";
  el.drawerRating.value = game.personalRating != null ? String(game.personalRating) : "";
  el.drawerFavorite.checked = Boolean(game.favorite);
  el.editDrawer.classList.remove("hidden");
  el.editDrawer.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeEditDrawer() {
  editingGameId = null;
  el.editDrawer.classList.add("hidden");
}

el.closeDrawerBtn.onclick = closeEditDrawer;
el.cancelDrawerBtn.onclick = closeEditDrawer;
el.saveDrawerBtn.onclick = () => {
  if (!editingGameId) return;
  const personalPlatforms = Array.from(el.drawerPlatformCheckboxes.querySelectorAll("input:checked")).map((i) => i.value);
  const moods = Array.from(el.drawerMoodCheckboxes.querySelectorAll("input:checked")).map((i) => i.value);
  Storage.updateGame(library, editingGameId, {
    personalPlatforms,
    moods,
    playTime: el.drawerPlayTime.value || null,
    lastPlayed: el.drawerLastPlayed.value || null,
    personalRating: el.drawerRating.value ? Number(el.drawerRating.value) : null,
    favorite: el.drawerFavorite.checked
  });
  library = Storage.load();
  renderCollectionTable();
  closeEditDrawer();
};

// ---------- Import / export ----------

el.exportBtn.onclick = () => Storage.exportToFile(library);
el.importBtn.onclick = () => el.importInput.click();
el.importInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  library = await Storage.importFromFile(file);
  closeEditDrawer();
  renderCollectionTable();
});

renderCollectionTable();
