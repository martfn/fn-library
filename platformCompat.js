/**
 * platformCompat.js
 * Determines which official RAWG platform names a personal platform can
 * plausibly run.
 *
 * Preferred source of truth: the platform object's own `officialMatches`
 * array, which is set automatically when a platform is added from a known
 * template (see platformTemplates.js) — covering both native hardware and
 * real emulation capability (e.g. the Mac covers dozens of retro consoles
 * via emulation, the 2DS covers NES/Game Boy/DS/Virtual Boy, etc.)
 *
 * Fallback: a legacy map (PLATFORM_COMPAT) keyed by platform id, kept in
 * sync with platformTemplates.js, for platforms created before templates
 * existed or the built-in default platform ids. Fully custom platforms
 * with no known mapping are left unfiltered (every checkbox shown, none
 * dimmed) rather than guessed at, per the plan: "exact technical
 * compatibility should not be assumed automatically without verification."
 */

const PLATFORM_COMPAT = {
  gbp: ["game boy", "game boy color"],
  "2ds": [
    "nintendo 3ds",
    "nintendo ds",
    "nintendo dsi",
    "game boy advance",
    "game boy color",
    "game boy",
    "nes",
    "virtual boy"
  ],
  psp: [
    "psp",
    "playstation",
    "sega master system",
    "game boy",
    "game boy color",
    "game boy advance",
    "nes",
    "snes"
  ],
  wii: [
    "wii",
    "gamecube",
    "nintendo 64",
    "snes",
    "nes",
    "genesis",
    "sega cd",
    "sega master system",
    "game gear"
  ],
  ps3: ["playstation 3", "playstation 2", "playstation"],
  switch: ["nintendo switch", "nes", "snes", "nintendo 64", "genesis", "virtual boy"],
  mac: [
    "pc",
    "macos",
    "mac",
    "linux",
    "dreamcast",
    "sega saturn",
    "sega cd",
    "sega master system",
    "game gear",
    "genesis",
    "nes",
    "snes",
    "nintendo 64",
    "gamecube",
    "wii",
    "nintendo switch",
    "game boy",
    "game boy color",
    "game boy advance",
    "nintendo ds",
    "nintendo dsi",
    "nintendo 3ds",
    "virtual boy",
    "playstation",
    "playstation 2",
    "psp",
    "playstation vita",
    "xbox",
    "neo geo",
    "atari 2600",
    "atari 5200",
    "atari 7800",
    "jaguar",
    "3do",
    "wonderswan",
    "commodore / amiga"
  ]
};

function resolveCompatList(personalPlatformIdOrObject) {
  if (personalPlatformIdOrObject && typeof personalPlatformIdOrObject === "object") {
    if (Array.isArray(personalPlatformIdOrObject.officialMatches) && personalPlatformIdOrObject.officialMatches.length) {
      return personalPlatformIdOrObject.officialMatches.map((s) => s.toLowerCase());
    }
    return PLATFORM_COMPAT[personalPlatformIdOrObject.id] || null;
  }
  return PLATFORM_COMPAT[personalPlatformIdOrObject] || null;
}

function platformSupportsGame(personalPlatformIdOrObject, officialPlatforms = []) {
  const compatList = resolveCompatList(personalPlatformIdOrObject);
  if (!compatList) return true; // unknown/custom platform: don't hide it, just don't filter it
  const lowerOfficial = officialPlatforms.map((p) => p.toLowerCase());
  return compatList.some((compat) =>
    lowerOfficial.some((official) => official === compat || official.includes(compat))
  );
}

const PlatformCompat = { PLATFORM_COMPAT, platformSupportsGame };
