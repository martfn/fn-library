/**
 * platformCompat.js
 * Determines which official RAWG platform names a personal platform can
 * plausibly run.
 *
 * Preferred source of truth: the platform object's own `officialMatches`
 * array, which is set automatically when a platform is added from a known
 * template (see platformTemplates.js) — e.g. "Nintendo 2DS" carries
 * ["Nintendo 3DS", "Nintendo DS", "Game Boy Advance"] because that's what
 * the 2DS can actually run via native support/homebrew.
 *
 * Fallback: a small legacy map (PLATFORM_COMPAT) keyed by platform id, kept
 * for platforms created before templates existed, or for the built-in
 * default platform ids. Fully custom platforms with no known mapping are
 * left unfiltered (every checkbox shown, none dimmed) rather than guessed at,
 * per the plan: "exact technical compatibility should not be assumed
 * automatically without verification."
 */

const PLATFORM_COMPAT = {
  gbp: ["game boy", "game boy color"],
  "2ds": ["nintendo 3ds", "nintendo ds", "nintendo dsi", "game boy advance"],
  psp: ["psp", "playstation"],
  wii: ["wii", "gamecube", "nes", "snes", "nintendo 64"],
  ps3: ["playstation 3", "playstation 2", "playstation"],
  switch: ["nintendo switch"],
  mac: ["pc", "macos", "mac", "linux", "dreamcast", "sega saturn"]
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
