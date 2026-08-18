/**
 * app.js
 * Main mobile app UI logic. Reads/writes via Storage, scores via Recommend.
 */

let library = Storage.load();
let activePlatform = "all";
let wizardMood = "any";

const el = {
  count: document.getElementById("gameCount"),
  platformFilters: document.getElementById("platformFilters"),
  searchInput: document.getElementById("searchInput"),
  multiplayerFilter: document.getElementById("multiplayerFilter"),
  minPlayersFilter: document.getElementById("minPlayersFilter"),
  resultCard: document.getElementById("resultCard"),
  libraryList: document.getElementById("libraryList"),
  surpriseBtn: document.getElementById("surpriseBtn"),
  dontKnowBtn: document.getElementById("dontKnowBtn"),
  wizard: document.getElementById("wizard"),
  wizardStep1: document.getElementById("wizardStep1"),
  wizardStep2: document.getElementById("wizardStep2"),
  moodGrid: document.getElementById("moodGrid"),
  closeWizard: document.getElementById("closeWizard")
};

function gameMultiplayer(game) {
  return game.multiplayer || Multiplayer.deriveMultiplayerInfo(game);
}

function platformName(id) {
  const p = (library.platforms || []).find((x) => x.id === id);
  return p ? `${p.icon ? p.icon + " " : ""}${p.name}` : id;
}

function multiplayerLabel(game) {
  const info = gameMultiplayer(game);
  if (!info.isMultiplayer) return "Solo";
  const parts = [];
  if (info.isLocal) parts.push("Local");
  if (info.isOnline) parts.push("Online");
  if (!parts.length) parts.push("Multiplayer");
  return `${parts.join(" + ")} · up to ${info.maxPlayers || 2} players`;
}

function renderPlatformFilters() {
  const chips = [{ id: "all", name: "All", icon: "⭐" }, ...library.platforms];
  el.platformFilters.innerHTML = "";
  chips.forEach((p) => {
    const chip = document.createElement("div");
    chip.className = "platform-chip" + (p.id === activePlatform ? " active" : "");
    chip.textContent = `${p.icon || ""} ${p.name}`.trim();
    chip.onclick = () => {
      activePlatform = p.id;
      renderPlatformFilters();
      renderLibraryList();
    };
    el.platformFilters.appendChild(chip);
  });
}

function filteredGames() {
  const query = el.searchInput.value.trim().toLowerCase();
  const multiplayerMode = el.multiplayerFilter.value;
  const minPlayers = Number(el.minPlayersFilter.value || 1);

  return library.games.filter((g) => {
    const info = gameMultiplayer(g);
    const platformOk = activePlatform === "all" || (g.personalPlatforms || []).includes(activePlatform);
    const searchOk = !query || g.title.toLowerCase().includes(query);
    const multiplayerOk =
      (multiplayerMode === "all") ||
      (multiplayerMode === "multiplayer" && info.isMultiplayer) ||
      (multiplayerMode === "local" && info.isLocal) ||
      (multiplayerMode === "online" && info.isOnline) ||
      (multiplayerMode === "solo" && !info.isMultiplayer);
    const playerCountOk = minPlayers <= 1 || (info.maxPlayers || 1) >= minPlayers;
    return platformOk && searchOk && multiplayerOk && playerCountOk;
  }).sort((a, b) => {
    const ai = gameMultiplayer(a);
    const bi = gameMultiplayer(b);
    const modeActive = multiplayerMode !== "all" || minPlayers > 1;
    if (modeActive) {
      if ((bi.isMultiplayer ? 1 : 0) !== (ai.isMultiplayer ? 1 : 0)) return (bi.isMultiplayer ? 1 : 0) - (ai.isMultiplayer ? 1 : 0);
      if ((bi.maxPlayers || 1) !== (ai.maxPlayers || 1)) return (bi.maxPlayers || 1) - (ai.maxPlayers || 1);
    }
    return a.title.localeCompare(b.title);
  });
}

function renderLibraryList() {
  const games = filteredGames();
  el.count.textContent = `${games.length} of ${library.games.length} games shown`;
  el.libraryList.innerHTML = "";

  if (games.length === 0) {
    el.libraryList.innerHTML = `<p style="color:var(--muted)">No games match. Try loosening the hangout filters or add more in the Collection Editor.</p>`;
    return;
  }

  games.forEach((g) => {
    const row = document.createElement("div");
    row.className = "game-row";
    row.innerHTML = `
      <img src="${g.cover || ""}" alt="" onerror="this.style.visibility='hidden'" />
      <div>
        <div class="title">${g.title}</div>
        <div class="sub">${(g.personalPlatforms || []).map(platformName).join(", ")}</div>
        <div class="sub">${multiplayerLabel(g)}</div>
      </div>
    `;
    el.libraryList.appendChild(row);
  });
}

function showResultCard(game) {
  if (!game) {
    el.resultCard.classList.add("hidden");
    return;
  }
  const since = Recommend.daysSince(game.lastPlayed);
  const lastPlayedText = game.lastPlayed
    ? since < 60
      ? `You last played this ${Math.round(since)} days ago.`
      : `You haven't played this in ${Math.round(since / 30)} months.`
    : "You've never played this one.";

  el.resultCard.innerHTML = `
    <h2>${game.title}</h2>
    <div class="meta">${(game.moods || []).join(" · ")} · ${multiplayerLabel(game)} · ${(game.personalPlatforms || []).map(platformName).join(", ")}</div>
    <p>${lastPlayedText}</p>
    <div class="actions-row">
      <button class="btn btn-primary" id="thatsTheOne">🎮 That's the one</button>
      <button class="btn btn-secondary" id="giveAnother">🎲 Give me another</button>
    </div>
  `;
  el.resultCard.classList.remove("hidden");

  document.getElementById("thatsTheOne").onclick = () => {
    Storage.updateGame(library, game.id, { lastPlayed: new Date().toISOString() });
    library = Storage.load();
    renderLibraryList();
    el.resultCard.classList.add("hidden");
  };
  document.getElementById("giveAnother").onclick = () => {
    const next = Recommend.surpriseMe(library.games, activePlatform, {
      multiplayerMode: el.multiplayerFilter.value,
      minPlayers: Number(el.minPlayersFilter.value || 1)
    });
    showResultCard(next);
  };
}

el.surpriseBtn.onclick = () => {
  const game = Recommend.surpriseMe(library.games, activePlatform, {
    multiplayerMode: el.multiplayerFilter.value,
    minPlayers: Number(el.minPlayersFilter.value || 1)
  });
  showResultCard(game);
};

function renderMoodGrid() {
  el.moodGrid.innerHTML = "";
  const entries = Object.entries(Moods.MOOD_DEFS);
  entries.push(["any", { emoji: "🎲", label: "I don't care" }]);
  entries.forEach(([key, def]) => {
    const btn = document.createElement("button");
    btn.className = "btn mood-btn";
    btn.textContent = `${def.emoji} ${def.label}`;
    btn.onclick = () => {
      wizardMood = key;
      el.wizardStep1.classList.add("hidden");
      el.wizardStep2.classList.remove("hidden");
    };
    el.moodGrid.appendChild(btn);
  });
}

el.dontKnowBtn.onclick = () => {
  el.wizardStep1.classList.remove("hidden");
  el.wizardStep2.classList.add("hidden");
  el.wizard.classList.remove("hidden");
};

el.closeWizard.onclick = () => el.wizard.classList.add("hidden");

document.querySelectorAll(".time-btn").forEach((btn) => {
  btn.onclick = () => {
    const timeBudget = btn.dataset.time;
    const game = Recommend.recommend(library.games, {
      mood: wizardMood,
      timeBudget,
      platform: activePlatform,
      multiplayerMode: el.multiplayerFilter.value,
      minPlayers: Number(el.minPlayersFilter.value || 1)
    });
    el.wizard.classList.add("hidden");
    showResultCard(game);
  };
});

el.searchInput.addEventListener("input", renderLibraryList);
el.multiplayerFilter.addEventListener("change", renderLibraryList);
el.minPlayersFilter.addEventListener("change", renderLibraryList);

renderMoodGrid();
renderPlatformFilters();
renderLibraryList();
