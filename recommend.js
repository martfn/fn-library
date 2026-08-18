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
  if (!game.playTime) return 0.5;
  return game.playTime === timeBudget ? 1 : 0;
}

function moodMatches(game, mood) {
  if (!mood || mood === "any") return 1;
  return (game.moods || []).includes(mood) ? 1 : 0;
}

function multiplayerInfo(game) {
  return Multiplayer.deriveMultiplayerInfo(game);
}

function multiplayerMatches(game, filters = {}) {
  const info = multiplayerInfo(game);
  const mode = filters.multiplayerMode || "all";
  const minPlayers = Number(filters.minPlayers || 1);

  if (mode === "multiplayer" && !info.isMultiplayer) return false;
  if (mode === "local" && !info.isLocal) return false;
  if (mode === "online" && !info.isOnline) return false;
  if (mode === "solo" && info.isMultiplayer) return false;
  if (minPlayers > 1 && (info.maxPlayers || 1) < minPlayers) return false;

  return true;
}

function isExcluded(game, filters = {}) {
  return (filters.excludeIds || []).includes(game.id);
}

function scoreGame(game, { mood, timeBudget }) {
  const moodMatch = moodMatches(game, mood);
  const timeMatch = timeMatches(game, timeBudget);
  const neverPlayed = game.lastPlayed ? 0 : 1;
  const since = daysSince(game.lastPlayed);
  const longTimeSincePlayed = since === null ? 0 : Math.min(since / 90, 1);
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
    if (isExcluded(g, filters)) return false;
    if (!multiplayerMatches(g, filters)) return false;
    return true;
  });

  if (candidates.length === 0) return null;

  const scored = candidates
    .map((g) => ({ game: g, score: scoreGame(g, filters) }))
    .sort((a, b) => b.score - a.score);

  const topPool = scored.slice(0, Math.min(3, scored.length));
  const pick = topPool[Math.floor(Math.random() * topPool.length)];
  return pick.game;
}

function surpriseMe(games, platformFilter = "all", extraFilters = {}) {
  const pool = games.filter((g) => {
    if (platformFilter !== "all" && !(g.personalPlatforms || []).includes(platformFilter)) return false;
    if (isExcluded(g, extraFilters)) return false;
    if (!multiplayerMatches(g, extraFilters)) return false;
    return true;
  });
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

const Recommend = { recommend, surpriseMe, daysSince };
