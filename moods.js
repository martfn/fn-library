/**
 * moods.js
 * Translates raw RAWG genres/tags into the app's personal mood vocabulary.
 * Automatic-first, manually overridable later in the Collection Editor.
 *
 * Design goals after user feedback ("everything is intense and there's
 * barely any other tag"):
 * - Weighted scoring instead of "any match adds the mood" — a game only
 *   gets a mood if it accumulates enough real signal for it, so common
 *   genres like Action don't blanket-tag half the library as "intense".
 * - Broader, more specific tag-text matching (RAWG tags are rich — use
 *   them, not just the 5-6 top-level genres) so moods actually vary.
 * - Cap of 3 moods per game to keep them meaningful rather than a junk
 *   drawer of every possible label.
 */

const MOOD_DEFS = {
  chill: { emoji: "\uD83D\uDE0C", label: "Chill" },
  intense: { emoji: "\uD83E\uDDE8", label: "Intense" },
  thinky: { emoji: "\uD83E\uDDE0", label: "Thinky" },
  fun: { emoji: "\uD83E\uDD2A", label: "Stupid / Fun" },
  retro: { emoji: "\uD83D\uDD79\uFE0F", label: "Retro" },
  adventure: { emoji: "\uD83D\uDDFA\uFE0F", label: "Adventure" },
  scary: { emoji: "\uD83D\uDC7B", label: "Scary" },
  emotional: { emoji: "\uD83E\uDD7A", label: "Emotional" },
  competitive: { emoji: "\uD83C\uDFC6", label: "Competitive" },
  cozy: { emoji: "\u2615", label: "Cozy" }
};

// Genre signal is weaker than specific tag signal, since genres are broad
// and shared by hundreds of very different games.
const GENRE_WEIGHTS = {
  "Casual": { chill: 2 },
  "Simulation": { chill: 1, cozy: 1 },
  "Puzzle": { thinky: 2 },
  "Strategy": { thinky: 2 },
  "Board Games": { thinky: 2 },
  "Shooter": { intense: 2 },
  "Fighting": { intense: 2, competitive: 1 },
  "Sports": { competitive: 2 },
  "Racing": { competitive: 1, fun: 1 },
  "Party": { fun: 2 },
  "Arcade": { retro: 1, fun: 1 },
  "Adventure": { adventure: 2 },
  "RPG": { adventure: 1, thinky: 1 },
  "Platformer": { fun: 1, adventure: 1 },
  "Action": { intense: 1 },
  "Indie": { chill: 1 },
  "Horror": { scary: 3 },
  "Massively Multiplayer": { competitive: 1 }
};

// Specific tags are stronger, more precise signal than broad genres.
const TAG_WEIGHTS = {
  "relaxing": { chill: 3, cozy: 2 },
  "cozy": { cozy: 3, chill: 2 },
  "atmospheric": { chill: 1, emotional: 1 },
  "difficult": { intense: 3 },
  "souls-like": { intense: 3 },
  "survival horror": { scary: 3, intense: 2 },
  "horror": { scary: 3 },
  "psychological horror": { scary: 3, thinky: 1 },
  "gore": { intense: 2 },
  "funny": { fun: 3 },
  "comedy": { fun: 3 },
  "sandbox": { chill: 1 },
  "story rich": { emotional: 2, adventure: 1 },
  "emotional": { emotional: 3 },
  "tragic": { emotional: 2 },
  "drama": { emotional: 2 },
  "competitive": { competitive: 3 },
  "pvp": { competitive: 2, intense: 1 },
  "esports": { competitive: 2 },
  "fast-paced": { intense: 2 },
  "tactical": { thinky: 2 },
  "turn-based": { thinky: 2 },
  "puzzle": { thinky: 2 },
  "exploration": { adventure: 2 },
  "open world": { adventure: 1 },
  "pixel graphics": { retro: 1 },
  "retro": { retro: 2 },
  "8-bit": { retro: 2 },
  "16-bit": { retro: 2 },
  "colorful": { fun: 1, cozy: 1 },
  "cute": { cozy: 2, fun: 1 },
  "family friendly": { chill: 1, fun: 1 },
  "silly": { fun: 2 }
};

const MOOD_THRESHOLD = 2; // minimum accumulated score before a mood is attached
const MAX_MOODS = 3;

function deriveAutoMoods({ genres = [], tags = [], year = null }) {
  const scores = {};
  const bump = (mood, amount) => {
    scores[mood] = (scores[mood] || 0) + amount;
  };

  genres.forEach((g) => {
    const weights = GENRE_WEIGHTS[g];
    if (weights) Object.entries(weights).forEach(([mood, amt]) => bump(mood, amt));
  });

  tags.forEach((t) => {
    const lower = t.toLowerCase();
    Object.entries(TAG_WEIGHTS).forEach(([keyword, weights]) => {
      if (lower.includes(keyword)) {
        Object.entries(weights).forEach(([mood, amt]) => bump(mood, amt));
      }
    });
  });

  if (year && year <= 2005) bump("retro", 2);

  const ranked = Object.entries(scores)
    .filter(([, score]) => score >= MOOD_THRESHOLD)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_MOODS)
    .map(([mood]) => mood);

  if (ranked.length === 0) ranked.push("adventure");

  return ranked;
}

const Moods = { MOOD_DEFS, deriveAutoMoods };
