/**
 * platformCompat.js
 * Maps each personal platform to the official RAWG platform names it can
 * plausibly run, based on the user's real hardware capabilities
 * (backwards compatibility, emulation, homebrew). This lets the editor
 * only suggest realistic personal platforms for a given game instead of
 * showing every console regardless of whether the game could ever run there.
 *
 * This is a starting point, not a certified compatibility database
 * (per the plan: "exact technical compatibility should not be assumed
 * automatically without verification"). It can be edited freely.
 */

const PLATFORM_COMPAT = {
  gbp: ["game boy", "game boy color"],
  "2ds": [
    "nintendo 3ds",
    "nintendo ds",
    "nintendo dsi",
    "game boy advance",
    "game boy color",
    "game boy"
  ],
  psp: ["psp", "playstation"],
  wii: ["wii", "gamecube", "nes", "snes", "nintendo 64"],
  ps3: ["playstation 3", "playstation 2", "playstation"],
  switch: ["nintendo switch"],
  mac: ["pc", "macos", "mac", "linux"]
};

function platformSupportsGame(personalPlatformId, officialPlatforms = []) {
  const compatList = PLATFORM_COMPAT[personalPlatformId];
  if (!compatList) return true; // unknown/custom platform: don't hide it, just don't filter it
  const lowerOfficial = officialPlatforms.map((p) => p.toLowerCase());
  return compatList.some((compat) =>
    lowerOfficial.some((official) => official.includes(compat) || compat.includes(official))
  );
}

const PlatformCompat = { PLATFORM_COMPAT, platformSupportsGame };
