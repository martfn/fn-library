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

function renderPlatformFilters() {
  const chips = [{ id: "all", name: "All", icon: "\u2b50" }, ...library.platforms];
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
  return library.games.filter((g) => {
    const platformOk =
      activePlatform === "all" || (g.personalPlatforms || []).includes(activePlatform);
    const searchOk = !query || g.title.toLowerCase().includes(query);
    return platformOk && searchOk;
  });
}

function renderLibraryList() {
  const games = filteredGames();
  el.count.textContent = `${library.games.length} games available`;
  el.libraryList.innerHTML = "";

  if (games.length === 0) {
    el.libraryList.innerHTML = `<p style="color:var(--muted)">No games match. Add some in the Collection Editor.</p>`;
    return;
  }

  games.forEach((g) => {
    const row = document.createElement("div");
    row.className = "game-row";
    row.innerHTML = `
      <img src="${g.cover || ""}" alt="" onerror="this.style.visibility='hidden'" />
      <div>
        <div class="title">${g.title}</div>
        <div class="sub">${(g.personalPlatforms || []).join(", ")}</div>
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
    <div class="meta">${(game.moods || []).join(" \u00b7 ")} \u00b7 ${(game.personalPlatforms || []).join(", ")}</div>
    <p>${lastPlayedText}</p>
    <div class="actions-row">
      <button class="btn btn-primary" id="thatsTheOne">\ud83c\udfae That's the one</button>
      <button class="btn btn-secondary" id="giveAnother">\ud83c\udfb2 Give me another</button>
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
    const next = Recommend.surpriseMe(library.games, activePlatform);
    showResultCard(next);
  };
}

el.surpriseBtn.onclick = () => {
  const game = Recommend.surpriseMe(library.games, activePlatform);
  showResultCard(game);
};

function renderMoodGrid() {
  el.moodGrid.innerHTML = "";
  const entries = Object.entries(Moods.MOOD_DEFS);
  entries.push(["any", { emoji: "\ud83c\udfb2", label: "I don't care" }]);
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
      platform: activePlatform
    });
    el.wizard.classList.add("hidden");
    showResultCard(game);
  };
});

el.searchInput.addEventListener("input", renderLibraryList);

renderMoodGrid();
renderPlatformFilters();
renderLibraryList();
