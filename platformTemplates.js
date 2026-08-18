/**
 * platformTemplates.js
 * A curated catalog of known personal-platform "templates", each pinned to
 * the EXACT official platform names RAWG uses in its API. This is what
 * lets the editor understand that "Game Boy Pocket" really means the
 * RAWG platform "Game Boy", or that "2DS" means "Nintendo 3DS" +
 * "Nintendo DS" + "Game Boy Advance", instead of relying on informal
 * free-text guesses.
 *
 * officialMatches values are matched case-insensitively against the
 * `platforms.platform.name` values RAWG returns for each game.
 * Reference: https://api.rawg.io/api/platforms (RAWG's own platform list).
 *
 * This list reflects the user's real hardware setup and how each device
 * is actually used for backwards compatibility / emulation:
 * - Game Boy Pocket: native Game Boy hardware.
 * - Nintendo 2DS: native 3DS, plus DS and GBA via built-in/homebrew compatibility.
 * - PSP: native PSP, plus PS1 Classics.
 * - Wii: native Wii, plus GameCube (native BC) and SNES/NES/N64 via Virtual Console/homebrew.
 * - PS3: native PS3, plus PS2 and PS1 backwards compatibility.
 * - Switch: native Switch titles.
 * - Mac: native macOS, Windows/Steam via CrossOver/Proton-like tooling, plus
 *   Dreamcast and SEGA Saturn emulation (the two systems not easily covered
 *   by any other device in this collection).
 */

const PLATFORM_TEMPLATES = [
  {
    id: "gbp",
    name: "Game Boy Pocket",
    icon: "\u{1F532}",
    officialMatches: ["Game Boy", "Game Boy Color"],
    aliases: ["game boy pocket", "gb pocket", "gbp", "gameboy pocket", "game boy"]
  },
  {
    id: "2ds",
    name: "Nintendo 2DS",
    icon: "\u{1F3AE}",
    officialMatches: ["Nintendo 3DS", "Nintendo DS", "Game Boy Advance"],
    aliases: ["2ds", "nintendo 2ds", "n2ds", "3ds", "nintendo 3ds", "ds", "nintendo ds"]
  },
  {
    id: "psp",
    name: "PSP",
    icon: "\u{1F4F1}",
    officialMatches: ["PSP", "PlayStation"],
    aliases: ["psp", "playstation portable"]
  },
  {
    id: "wii",
    name: "Nintendo Wii",
    icon: "\u{1F7E2}",
    officialMatches: ["Wii", "GameCube", "Nintendo 64", "SNES", "NES"],
    aliases: ["wii", "nintendo wii"]
  },
  {
    id: "ps3",
    name: "PlayStation 3",
    icon: "\u{1F535}",
    officialMatches: ["PlayStation 3", "PlayStation 2", "PlayStation"],
    aliases: ["ps3", "playstation 3"]
  },
  {
    id: "switch",
    name: "Nintendo Switch",
    icon: "\u{1F534}",
    officialMatches: ["Nintendo Switch"],
    aliases: ["switch", "nintendo switch"]
  },
  {
    id: "mac",
    name: "Mac",
    icon: "\u{1F4BB}",
    officialMatches: ["PC", "macOS", "Linux", "Dreamcast", "SEGA Saturn"],
    aliases: ["mac", "macbook", "macos", "pc", "steam", "dreamcast", "saturn", "sega saturn"]
  }
];

function normalize(s) {
  return (s || "").toLowerCase().trim();
}

function searchTemplates(query) {
  const q = normalize(query);
  if (!q) return [];
  return PLATFORM_TEMPLATES.filter((t) => {
    if (normalize(t.name).includes(q)) return true;
    return (t.aliases || []).some((a) => normalize(a).includes(q));
  });
}

function findTemplateById(id) {
  return PLATFORM_TEMPLATES.find((t) => t.id === id) || null;
}

const PlatformTemplates = { PLATFORM_TEMPLATES, searchTemplates, findTemplateById };
