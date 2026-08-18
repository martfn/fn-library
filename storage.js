/**
 * storage.js
 * Local persistence layer for the personal game library.
 * The rest of the app should never touch localStorage directly.
 */

const STORAGE_KEY = "personalGameLibrary.v1";

const DEFAULT_PLATFORMS = [
  { id: "gbp", name: "Game Boy Pocket", icon: "\uD83D\uDD32" },
  { id: "2ds", name: "Nintendo 2DS", icon: "\uD83C\uDFAE" },
  { id: "psp", name: "PSP", icon: "\uD83D\uDCF1" },
  { id: "wii", name: "Wii", icon: "\uD83D\uDFE2" },
  { id: "ps3", name: "PS3", icon: "\uD83D\uDD35" },
  { id: "switch", name: "Nintendo Switch", icon: "\uD83D\uDD34" },
  { id: "mac", name: "Mac", icon: "\uD83D\uDCBB" }
];

function emptyLibrary() {
  return {
    version: 1,
    platforms: DEFAULT_PLATFORMS,
    games: []
  };
}

const Storage = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyLibrary();
      const parsed = JSON.parse(raw);
      if (!parsed.platforms) parsed.platforms = DEFAULT_PLATFORMS;
      if (!parsed.games) parsed.games = [];
      return parsed;
    } catch (err) {
      console.error("Failed to load library, starting fresh.", err);
      return emptyLibrary();
    }
  },

  save(library) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
  },

  addGame(library, game) {
    library.games.push(game);
    this.save(library);
    return library;
  },

  updateGame(library, gameId, patch) {
    const idx = library.games.findIndex((g) => g.id === gameId);
    if (idx === -1) return library;
    library.games[idx] = { ...library.games[idx], ...patch };
    this.save(library);
    return library;
  },

  removeGame(library, gameId) {
    library.games = library.games.filter((g) => g.id !== gameId);
    this.save(library);
    return library;
  },

  addPlatform(library, platform) {
    library.platforms.push(platform);
    this.save(library);
    return library;
  },

  exportToFile(library) {
    const blob = new Blob([JSON.stringify(library, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-game-library.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          this.save(parsed);
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },

  emptyLibrary,
  DEFAULT_PLATFORMS
};
