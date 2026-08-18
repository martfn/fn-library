/**
 * storage.js
 * Local persistence layer for the personal game library.
 * The rest of the app should never touch localStorage directly.
 */

const STORAGE_KEY = "personalGameLibrary.v1";

// officialMatches pins each default platform to the exact RAWG official
// platform names it can run (native + real backwards compatibility /
// emulation), matching platformTemplates.js. This is what lets the app
// understand that e.g. "2DS" really means Nintendo 3DS + Nintendo DS +
// Game Boy Advance games, instead of a vague free-text label.
const DEFAULT_PLATFORMS = [
  { id: "gbp", name: "Game Boy Pocket", icon: "\uD83D\uDD32", officialMatches: ["Game Boy", "Game Boy Color"] },
  { id: "2ds", name: "Nintendo 2DS", icon: "\uD83C\uDFAE", officialMatches: ["Nintendo 3DS", "Nintendo DS", "Game Boy Advance"] },
  { id: "psp", name: "PSP", icon: "\uD83D\uDCF1", officialMatches: ["PSP", "PlayStation"] },
  { id: "wii", name: "Wii", icon: "\uD83D\uDFE2", officialMatches: ["Wii", "GameCube", "Nintendo 64", "SNES", "NES"] },
  { id: "ps3", name: "PS3", icon: "\uD83D\uDD35", officialMatches: ["PlayStation 3", "PlayStation 2", "PlayStation"] },
  { id: "switch", name: "Nintendo Switch", icon: "\uD83D\uDD34", officialMatches: ["Nintendo Switch"] },
  { id: "mac", name: "Mac", icon: "\uD83D\uDCBB", officialMatches: ["PC", "macOS", "Linux", "Dreamcast", "SEGA Saturn"] }
];

function emptyLibrary() {
  return {
    version: 1,
    platforms: DEFAULT_PLATFORMS,
    games: []
  };
}

// Backfills officialMatches onto platforms that were created before
// templates existed (e.g. the built-in defaults saved in an older browser
// session), so "2DS" etc. become properly standardized without the user
// having to delete and re-add them.
function migratePlatforms(platforms) {
  return platforms.map((p) => {
    if (Array.isArray(p.officialMatches) && p.officialMatches.length) return p;
    const defaultMatch = DEFAULT_PLATFORMS.find((d) => d.id === p.id);
    if (defaultMatch) return { ...p, officialMatches: defaultMatch.officialMatches };
    return p;
  });
}

const Storage = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyLibrary();
      const parsed = JSON.parse(raw);
      if (!parsed.platforms) parsed.platforms = DEFAULT_PLATFORMS;
      else parsed.platforms = migratePlatforms(parsed.platforms);
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

  updatePlatform(library, platformId, patch) {
    const idx = library.platforms.findIndex((p) => p.id === platformId);
    if (idx === -1) return library;
    library.platforms[idx] = { ...library.platforms[idx], ...patch };
    this.save(library);
    return library;
  },

  removePlatform(library, platformId) {
    library.platforms = library.platforms.filter((p) => p.id !== platformId);
    library.games.forEach((g) => {
      g.personalPlatforms = (g.personalPlatforms || []).filter((id) => id !== platformId);
    });
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
