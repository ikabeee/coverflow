const BASE_URL = 'https://itunes.apple.com';
const ARTWORK_SIZE = 600;
const SEARCH_COUNTRIES = ['US', 'MX'];

export async function searchAlbums(term, { limit = 30, countries = SEARCH_COUNTRIES, signal } = {}) {
  const batches = await Promise.allSettled(
    countries.map((country) =>
      request('/search', { term, media: 'music', entity: 'album', limit, country }, signal).then((results) => ({
        country,
        results,
      })),
    ),
  );

  const fulfilled = batches.filter((batch) => batch.status === 'fulfilled').map((batch) => batch.value);
  if (fulfilled.length === 0) throw batches[0].reason;

  const seen = new Map();
  for (const { country, results } of fulfilled) {
    for (const result of results) {
      if (result.wrapperType !== 'collection' || !result.artworkUrl100) continue;
      const key = `${result.artistName}\u0000${result.collectionName}`.toLowerCase();
      if (!seen.has(key)) seen.set(key, toAlbum(result, country));
    }
  }
  return [...seen.values()];
}

export async function fetchTracks(albumId, { country = 'US', signal } = {}) {
  const results = await request('/lookup', { id: albumId, entity: 'song', limit: 200, country }, signal);
  return results
    .filter((result) => result.wrapperType === 'track' && result.previewUrl)
    .sort((a, b) => a.discNumber - b.discNumber || a.trackNumber - b.trackNumber)
    .map(toTrack);
}

async function request(path, params, signal) {
  const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));
  const response = await fetch(`${BASE_URL}${path}?${query}`, { signal });
  if (response.status === 403 || response.status === 429) {
    throw Object.assign(new Error('iTunes Search API rate limit exceeded'), { name: 'RateLimitError' });
  }
  if (!response.ok) {
    throw new Error(`iTunes Search API responded with ${response.status}`);
  }
  const { results } = await response.json();
  return results;
}

function toAlbum(result, country) {
  return {
    id: result.collectionId,
    country,
    artist: result.artistName,
    title: result.collectionName,
    artwork: result.artworkUrl100.replace(/\/\d+x\d+bb\./, `/${ARTWORK_SIZE}x${ARTWORK_SIZE}bb.`),
    url: result.collectionViewUrl,
    year: result.releaseDate?.slice(0, 4),
  };
}

function toTrack(result) {
  return {
    id: result.trackId,
    title: result.trackName,
    artist: result.artistName,
    preview: result.previewUrl,
  };
}
