/**
 * moods.js
 * Translates raw RAWG genres/tags into the app's personal mood vocabulary.
 * Automatic-first, manually overridable later in the Collection Editor.
 */

const MOOD_DEFS = {
  chill: { emoji: "\uD83D\uDE0C", label: "Chill" },
  intense: { emoji: "\uD83E\uDDE8", label: "Intense" },
  thinky: { emoji: "\uD83E\uDDE0", label: "Thinky" },
  fun: { emoji: "\uD83E\uDD2A", label: "Stupid / Fun" },
  retro: { emoji: "\uD83D\uDD79\uFE0F", label: "Retro" },
  adventure: { emoji: "\uD83D\uDDFA\uFE0F", label: "Adventure" },
  nostalgia: { emoji: "\u2764\uFE0F", label: "Nostalgia" },
  new: { emoji: "\uD83C\uDD95", label: "Something new" }
};

// genre/tag keyword -> mood
const GENRE_MAP = {
  "Casual": ["chill"],
  "Simulation": ["chill"],
  "Puzzle": ["thinky"],
  "Strategy": ["thinky"],
  "Board Games": ["thinky"],
  "Shooter": ["intense"],
  "Fighting": ["intense"],
  "Sports": ["intense", "fun"],
  "Racing": ["intense", "fun"],
  "Party": ["fun"],
  "Arcade": ["retro", "fun"],
  "Adventure": ["adventure"],
  "RPG": ["adventure", "thinky"],
  "Platformer": ["fun", "adventure"],
  "Action": ["intense"],
  "Indie": ["chill"]
};

function deriveAutoMoods({ genres = [], tags = [], year = null }) {
  const moods = new Set();

  genres.forEach((g) => {
    const mapped = GENRE_MAP[g];
    if (mapped) mapped.forEach((m) => moods.add(m));
  });

  const tagText = tags.join(" ").toLowerCase();
  if (tagText.includes("relaxing") || tagText.includes("cozy")) moods.add("chill");
  if (tagText.includes("difficult") || tagText.includes("souls-like")) moods.add("intense");
  if (tagText.includes("funny") || tagText.includes("comedy")) moods.add("fun");

  if (year && year <= 2005) moods.add("retro");

  if (moods.size === 0) moods.add("adventure");

  return Array.from(moods);
}

const Moods = { MOOD_DEFS, deriveAutoMoods };
