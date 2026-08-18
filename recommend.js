/**
 * recommend.js
 * Scoring-based recommendation engine. No AI needed.
 * Score = moodMatch*5 + timeMatch*3 + neverPlayed*4 + longTimeSincePlayed*2 + random
 */

function daysSince(dateStr) {
  if (!dateStr) return null;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

function timeMatches(game, timeBudget) {
  if (!timeBudget || timeBudget === "any") return 1;
  if (!game.playTime) return 0.5; // unknown, neutral-ish
  return game.playTime === timeBudget ? 1 : 0;
}

function moodMatches(game, mood) {
  if (!mood || mood === "any") return 1;
  return (game.moods || []).includes(mood) ? 1 : 0;
}

function scoreGame(game, { mood, timeBudget }) {
  const moodMatch = moodMatches(game, mood);
  const timeMatch = timeMatches(game, timeBudget);
  const neverPlayed = game.lastPlayed ? 0 : 1;
  const since = daysSince(game.lastPlayed);
  const longTimeSincePlayed = since === null ? 0 : Math.min(since / 90, 1); // caps at ~3 months
  const randomFactor = Math.random();

  return (
    moodMatch * 5 +
    timeMatch * 3 +
    neverPlayed * 4 +
    longTimeSincePlayed * 2 +
    randomFactor
  );
}

function recommend(games, filters = {}) {
  const candidates = games.filter((g) => {
    if (filters.platform && filters.platform !== "all") {
      if (!(g.personalPlatforms || []).includes(filters.platform)) return false;
    }
    return true;
  });

  if (candidates.length === 0) return null;

  const scored = candidates
    .map((g) => ({ game: g, score: scoreGame(g, filters) }))
    .sort((a, b) => b.score - a.score);

  // Pick from the top few instead of always the single best, to keep it playful.
  const topPool = scored.slice(0, Math.min(3, scored.length));
  const pick = topPool[Math.floor(Math.random() * topPool.length)];
  return pick.game;
}

function surpriseMe(games, platformFilter = "all") {
  const pool =
    platformFilter === "all"
      ? games
      : games.filter((g) => (g.personalPlatforms || []).includes(platformFilter));
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

const Recommend = { recommend, surpriseMe, daysSince };
