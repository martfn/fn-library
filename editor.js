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
  closeDrawerBtn: document.getElementById("closeDrawerBtn")
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
  el.dropdown.innerHTML = `<div class="autocomplete-loading">Searching\u2026</div>`;
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
        <div class="ac-sub">${r.year || "Unknown year"} \u00b7 ${(r.officialPlatforms || []).slice(0, 3).join(", ")}</div>
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
  el.gameSearch.value = "Loading\u2026";
  try {
    const details = await Rawg.details(rawgId);
    pendingGame = {
      ...details,
      moods: Moods.deriveAutoMoods(details)
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
      <div class="moods-preview">${(pendingGame.moods || []).map((m) => `<span class="tag-pill">${Moods.MOOD_DEFS[m] ? Moods.MOOD_DEFS[m].emoji + " " + Moods.MOOD_DEFS[m].label : m}</span>`).join("")}</div>
    </div>
  `;
}

function renderPlatformPicker() {
  el.platformPicker.classList.remove("hidden");
  el.platformCheckboxes.innerHTML = "";
  const officialPlatforms = pendingGame.officialPlatforms || [];

  library.platforms.forEach((p) => {
    const supported = PlatformCompat.platformSupportsGame(p.id, officialPlatforms);
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

  const game = {
    id: `game_${pendingGame.rawgId}_${Date.now()}`,
    rawgId: pendingGame.rawgId,
    title: pendingGame.title,
    year: pendingGame.year,
    cover: pendingGame.cover,
    genres: pendingGame.genres,
    officialPlatforms: pendingGame.officialPlatforms,
    personalPlatforms: checked,
    moods: pendingGame.moods,
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

el.addPlatformBtn.onclick = () => {
  const name = el.newPlatformName.value.trim();
  if (!name) return;
  const id = name.toLowerCase().replace(/\s+/g, "-");
  Storage.addPlatform(library, { id, name, icon: el.newPlatformIcon.value.trim() });
  library = Storage.load();
  el.newPlatformName.value = "";
  el.newPlatformIcon.value = "";
  renderCollectionTable();
  if (editingGameId) openEditDrawer(editingGameId);
};

// ---------- Collection table ----------

function renderCollectionTable() {
  el.collectionCount.textContent = library.games.length;
  el.collectionBody.innerHTML = "";
  if (library.games.length === 0) {
    el.collectionBody.innerHTML = `<tr><td colspan="5" style="color:var(--muted);text-align:center;padding:24px">No games yet \u2014 search above to add your first one.</td></tr>`;
    return;
  }
  library.games.forEach((g) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="cover-cell"><img src="${g.cover || ""}" alt="" onerror="this.style.visibility='hidden'" />${g.title}</td>
      <td>${(g.personalPlatforms || []).join(", ") || "\u2014"}</td>
      <td>${(g.moods || []).join(", ") || "\u2014"}</td>
      <td>${g.lastPlayed ? new Date(g.lastPlayed).toLocaleDateString() : "Never"}</td>
      <td><button class="btn small-btn" data-id="${g.id}">Remove</button></td>
    `;
    tr.querySelector("button").onclick = () => {
      Storage.removeGame(library, g.id);
      library = Storage.load();
      renderCollectionTable();
    };
    el.collectionBody.appendChild(tr);
  });
}

// ---------- Import / export ----------

el.exportBtn.onclick = () => Storage.exportToFile(library);
el.importBtn.onclick = () => el.importInput.click();
el.importInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  library = await Storage.importFromFile(file);
  renderCollectionTable();
});

renderCollectionTable();
