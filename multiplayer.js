/**
 * multiplayer.js
 * Derives multiplayer facts from RAWG metadata in a conservative,
 * hangout-friendly way:
 * - Online should only be set from strong explicit online signals.
 * - Generic "multiplayer" without an online signal is treated as local,
 *   since that is much more useful for couch/hangout filtering and avoids
 *   ancient solo games being mislabeled as online.
 */

const MULTIPLAYER_TAG_KEYWORDS = [
  "multiplayer",
  "co-op",
  "coop",
  "cooperative",
  "local co-op",
  "online co-op",
  "local multiplayer",
  "online multiplayer",
  "split screen",
  "splitscreen",
  "shared/split screen",
  "couch co-op",
  "pvp",
  "versus",
  "battle royale",
  "party game",
  "massively multiplayer",
  "mmo"
];

const ONLINE_TAG_KEYWORDS = [
  "online multiplayer",
  "online co-op",
  "competitive multiplayer",
  "massively multiplayer",
  "mmo",
  "battle royale"
];

const LOCAL_TAG_KEYWORDS = [
  "local multiplayer",
  "local co-op",
  "split screen",
  "splitscreen",
  "shared/split screen",
  "couch co-op",
  "party game"
];

const SINGLEPLAYER_TAG_KEYWORDS = ["singleplayer", "single-player", "1 player"];

function normalizeTexts(parts) {
  return parts
    .filter(Boolean)
    .map((t) => String(t).toLowerCase().replace(/\s+/g, ' ').trim());
}

function hasKeyword(texts, keywords) {
  return texts.some((text) => keywords.some((keyword) => text.includes(keyword)));
}

function extractMaxPlayers(tagTexts) {
  let max = null;
  tagTexts.forEach((t) => {
    const rangeMatch = t.match(/(\d+)\s*[-–]\s*(\d+)\s*players?/i);
    if (rangeMatch) {
      const n = parseInt(rangeMatch[2], 10);
      if (!max || n > max) max = n;
      return;
    }

    const upToMatch = t.match(/up to\s*(\d+)\s*players?/i);
    if (upToMatch) {
      const n = parseInt(upToMatch[1], 10);
      if (!max || n > max) max = n;
      return;
    }

    const singleMatch = t.match(/(\d+)\s*players?/i);
    if (singleMatch) {
      const n = parseInt(singleMatch[1], 10);
      if (!max || n > max) max = n;
    }
  });
  return max;
}

function deriveMultiplayerInfo({ genres = [], tags = [] } = {}) {
  const genreTexts = normalizeTexts(genres);
  const tagTexts = normalizeTexts(tags);
  const allText = [...genreTexts, ...tagTexts];

  const hasExplicitSingleplayer = hasKeyword(allText, SINGLEPLAYER_TAG_KEYWORDS);
  const hasExplicitMultiplayer =
    genreTexts.includes('massively multiplayer') ||
    hasKeyword(allText, MULTIPLAYER_TAG_KEYWORDS);

  const hasExplicitOnline =
    genreTexts.includes('massively multiplayer') ||
    hasKeyword(allText, ONLINE_TAG_KEYWORDS);

  const hasExplicitLocal = hasKeyword(allText, LOCAL_TAG_KEYWORDS);
  const maxPlayers = extractMaxPlayers(allText);

  let isMultiplayer = hasExplicitMultiplayer || (maxPlayers && maxPlayers > 1);
  if (hasExplicitSingleplayer && !hasExplicitMultiplayer && !(maxPlayers && maxPlayers > 1)) {
    isMultiplayer = false;
  }

  let isOnline = isMultiplayer && hasExplicitOnline;
  let isLocal = isMultiplayer && hasExplicitLocal;

  if (isMultiplayer && !isOnline && !isLocal) {
    isLocal = true;
  }

  return {
    isMultiplayer,
    isOnline,
    isLocal,
    maxPlayers: isMultiplayer ? (maxPlayers || 2) : 1
  };
}

const Multiplayer = { deriveMultiplayerInfo, MULTIPLAYER_TAG_KEYWORDS };
