/**
 * platformTemplates.js
 * A curated catalog of known personal-platform "templates", each pinned to
 * the EXACT official platform names RAWG uses in its API. This is what
 * lets the editor understand that "Game Boy Pocket" really means the
 * RAWG platform "Game Boy", or that "2DS" means "Nintendo 3DS" plus
 * everything it can realistically emulate, instead of relying on informal
 * free-text guesses.
 *
 * officialMatches values are matched case-insensitively against the
 * `platforms.platform.name` values RAWG returns for each game.
 * Reference: https://api.rawg.io/api/platforms (RAWG's own platform list).
 *
 * These lists go beyond "what the box says on the label" and reflect the
 * user's actual real-world emulation capability per device:
 *
 * - Game Boy Pocket: native Game Boy / Game Boy Color hardware only.
 * - Nintendo 2DS: native 3DS, plus NES, Game Boy, Game Boy Color, Game Boy
 *   Advance, Nintendo DS, and Virtual Boy via homebrew/emulation.
 * - PSP: native PSP, plus PS1 Classics, Sega Master System, Game Boy,
 *   Game Boy Color, Game Boy Advance, NES, and SNES via homebrew.
 * - Wii: native Wii, GameCube (real hardware BC), plus N64, SNES, NES,
 *   Genesis/Mega Drive, Sega CD, Sega Master System, and Game Gear via
 *   Virtual Console/homebrew.
 * - PS3: native PS3, plus PS2 and PS1 backwards compatibility.
 * - Switch: native Switch, plus NES, SNES, N64, Genesis/Mega Drive, and
 *   Virtual Boy via homebrew emulation.
 * - Mac: essentially everything realistic to emulate on modern desktop
 *   hardware — native macOS/PC/Linux (Steam, CrossOver), practically all
 *   pre-2005 consoles and handhelds (NES through GameCube/Wii/Switch,
 *   every Game Boy/DS/3DS generation, Genesis through Dreamcast/Saturn),
 *   PS1/PS2/PSP/PS Vita, original Xbox, Neo Geo, Atari, 3DO, and WonderSwan.
 *   PS3 emulation is excluded here as unreliable/unverified rather than
 *   assumed.
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
    officialMatches: [
      "Nintendo 3DS",
      "Nintendo DS",
      "Nintendo DSi",
      "Game Boy Advance",
      "Game Boy Color",
      "Game Boy",
      "NES",
      "Virtual Boy"
    ],
    aliases: ["2ds", "nintendo 2ds", "n2ds", "3ds", "nintendo 3ds", "ds", "nintendo ds"]
  },
  {
    id: "psp",
    name: "PSP",
    icon: "\u{1F4F1}",
    officialMatches: [
      "PSP",
      "PlayStation",
      "SEGA Master System",
      "Game Boy",
      "Game Boy Color",
      "Game Boy Advance",
      "NES",
      "SNES"
    ],
    aliases: ["psp", "playstation portable"]
  },
  {
    id: "wii",
    name: "Nintendo Wii",
    icon: "\u{1F7E2}",
    officialMatches: [
      "Wii",
      "GameCube",
      "Nintendo 64",
      "SNES",
      "NES",
      "Genesis",
      "SEGA CD",
      "SEGA Master System",
      "Game Gear"
    ],
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
    officialMatches: ["Nintendo Switch", "NES", "SNES", "Nintendo 64", "Genesis", "Virtual Boy"],
    aliases: ["switch", "nintendo switch"]
  },
  {
    id: "mac",
    name: "Mac",
    icon: "\u{1F4BB}",
    officialMatches: [
      "PC",
      "macOS",
      "Linux",
      "Dreamcast",
      "SEGA Saturn",
      "SEGA CD",
      "SEGA Master System",
      "Game Gear",
      "Genesis",
      "NES",
      "SNES",
      "Nintendo 64",
      "GameCube",
      "Wii",
      "Nintendo Switch",
      "Game Boy",
      "Game Boy Color",
      "Game Boy Advance",
      "Nintendo DS",
      "Nintendo DSi",
      "Nintendo 3DS",
      "Virtual Boy",
      "PlayStation",
      "PlayStation 2",
      "PSP",
      "PlayStation Vita",
      "Xbox",
      "Neo Geo",
      "Atari 2600",
      "Atari 5200",
      "Atari 7800",
      "Jaguar",
      "3DO",
      "Wonderswan",
      "Commodore / Amiga"
    ],
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
