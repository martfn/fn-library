/**
 * multiplayer.js
 * Derives real multiplayer facts (not vibes) from a game's RAWG tags/genres:
 * whether it supports multiplayer at all, whether that's local/couch,
 * online, or both, and a best-guess max player count parsed out of tag
 * text like "4 Player Local" or "Co-op Campaign". This is what powers
 * "sort by multiplayer" and "show me games for N people" in the main app,
 * separate from mood tags entirely.
 */

const MULTIPLAYER_TAG_KEYWORDS = [
  "multiplayer",
  "co-op",
  "coop",
  "online co-op",
  "local co-op",
  "split screen",
  "splitscreen",
  "couch co-op",
  "pvp",
  "massively multiplayer",
  "mmo",
  "battle royale",
  "party",
  "versus",
  "4 player local",
  "party game"
];

const ONLINE_TAG_KEYWORDS = ["online co-op", "online multiplayer", "mmo", "massively multiplayer", "pvp", "battle royale", "online"];
const LOCAL_TAG_KEYWORDS = ["local co-op", "split screen", "splitscreen", "couch co-op", "local multiplayer", "shared/split screen", "4 player local"];

function extractMaxPlayers(tagTexts) {
  let max = null;
  tagTexts.forEach((t) => {
    // Matches things like "4 player", "4-player", "2-4 players", "8 Player Local"
    const rangeMatch = t.match(/(\d+)\s*[-–]\s*(\d+)\s*player/i);
    if (rangeMatch) {
      const n = parseInt(rangeMatch[2], 10);
      if (!max || n > max) max = n;
      return;
    }
    const singleMatch = t.match(/(\d+)\s*player/i);
    if (singleMatch) {
      const n = parseInt(singleMatch[1], 10);
      if (!max || n > max) max = n;
    }
  });
  return max;
}

function deriveMultiplayerInfo({ genres = [], tags = [] } = {}) {
  const allText = [...genres, ...tags].map((t) => t.toLowerCase());
  const isMassivelyMultiplayer = genres.some((g) => g.toLowerCase() === "massively multiplayer");

  const isMultiplayer =
    isMassivelyMultiplayer || allText.some((t) => MULTIPLAYER_TAG_KEYWORDS.some((k) => t.includes(k)));

  const isOnline = allText.some((t) => ONLINE_TAG_KEYWORDS.some((k) => t.includes(k)));
  const isLocal = allText.some((t) => LOCAL_TAG_KEYWORDS.some((k) => t.includes(k)));

  const maxPlayers = extractMaxPlayers(allText);

  return {
    isMultiplayer,
    isOnline,
    isLocal,
    maxPlayers: maxPlayers || (isMultiplayer ? 2 : 1) // if we know it's multiplayer but can't parse a number, assume at least 2
  };
}

const Multiplayer = { deriveMultiplayerInfo, MULTIPLAYER_TAG_KEYWORDS };
