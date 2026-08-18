/**
 * rawg.js
 * Isolated external metadata API layer (RAWG.io).
 * Nothing else in the app should know RAWG's URL shape or response format.
 * Swap this file out to change data providers.
 *
 * NOTE: This is a personal, non-public tool. Per RAWG's free-tier terms,
 * attribute RAWG as the data source and keep an active link back to rawg.io
 * anywhere this data is displayed. https://rawg.io/apidocs
 */

const RAWG_BASE = "https://api.rawg.io/api";

// Fill this in with your own key from https://rawg.io/apidocs
const RAWG_API_KEY = "YOUR_RAWG_API_KEY_HERE";

async function rawgSearch(query, pageSize = 10) {
  // Fetch a wider pool than we display so the true best match is likely
  // inside the pool before we re-rank it ourselves with text-match +
  // popularity scoring. NOTE: search_precise is deliberately NOT used here
  // — it disables RAWG's fuzzy matching, which causes short/generic titles
  // like "Golf" or "Tennis" (real 1989 Game Boy launch titles) to return
  // zero or wrong results. Fuzzy search + our own re-ranking below is what
  // reliably surfaces both obscure exact titles and popular ones.
  const fetchSize = Math.max(pageSize * 3, 20);
  const url = `${RAWG_BASE}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(
    query
  )}&page_size=${fetchSize}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`RAWG search failed: ${res.status}`);
  const data = await res.json();

  return data.results
    .map(normalizeSearchResult)
    .sort((a, b) => scoreSearchResult(b, query) - scoreSearchResult(a, query))
    .slice(0, pageSize);
}

async function rawgDetails(rawgId) {
  const url = `${RAWG_BASE}/games/${rawgId}?key=${RAWG_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`RAWG details failed: ${res.status}`);
  const data = await res.json();
  return normalizeDetails(data);
}

function normalizeSearchResult(r) {
  return {
    rawgId: r.id,
    title: r.name,
    year: r.released ? new Date(r.released).getFullYear() : null,
    cover: r.background_image || null,
    officialPlatforms: (r.platforms || []).map((p) => p.platform.name),
    rating: r.rating || 0,
    ratingsCount: r.ratings_count || 0,
    suggestionsCount: r.suggestions_count || 0,
    added: r.added || 0,
    released: r.released || null
  };
}

function normalizeDetails(d) {
  return {
    rawgId: d.id,
    title: d.name,
    year: d.released ? new Date(d.released).getFullYear() : null,
    cover: d.background_image || null,
    description: (d.description_raw || "").slice(0, 500),
    genres: (d.genres || []).map((g) => g.name),
    tags: (d.tags || []).slice(0, 20).map((t) => t.name),
    officialPlatforms: (d.platforms || []).map((p) => p.platform.name),
    developers: (d.developers || []).map((dv) => dv.name),
    publishers: (d.publishers || []).map((p) => p.name)
  };
}

function scoreSearchResult(result, query) {
  const q = query.trim().toLowerCase();
  const title = result.title.toLowerCase();
  const titleWords = title.split(/[^a-z0-9]+/).filter(Boolean);
  const queryWords = q.split(/[^a-z0-9]+/).filter(Boolean);

  let score = 0;

  if (title === q) score += 1000;
  if (title.startsWith(q)) score += 220;
  if (title.includes(q)) score += 120;

  queryWords.forEach((word) => {
    if (titleWords.includes(word)) score += 40;
    else if (title.includes(word)) score += 18;
  });

  const popularity = Math.log10((result.added || 0) + 1) * 35;
  const ratingsVolume = Math.log10((result.ratingsCount || 0) + 1) * 18;
  const ratingQuality = (result.rating || 0) * 4;
  const suggestions = Math.log10((result.suggestionsCount || 0) + 1) * 10;

  score += popularity + ratingsVolume + ratingQuality + suggestions;

  // Small preference for results that begin with the user's query, so
  // "Harvest Moon" reliably outranks some obscure exact-ish "Harvest" title.
  if (title.startsWith(q + " ")) score += 90;

  return score;
}

const Rawg = { search: rawgSearch, details: rawgDetails };
