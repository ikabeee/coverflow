// iTunes Search API: https://performance-partners.apple.com/search-api
// The endpoints send CORS headers, so they can be called straight from the browser.

const BASE_URL = 'https://itunes.apple.com';
const ARTWORK_SIZE = 600;

export async function searchAlbums(term, { limit = 30, country = 'US', signal } = {}) {
  const results = await request('/search', { term, media: 'music', entity: 'album', limit, country }, signal);
  return results
    .filter((result) => result.wrapperType === 'collection' && result.artworkUrl100)
    .map(toAlbum);
}

// The API only offers 30-second previews, not full songs.
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
  if (!response.ok) {
    throw new Error(`iTunes Search API responded with ${response.status}`);
  }
  const { results } = await response.json();
  return results;
}

function toAlbum(result) {
  return {
    id: result.collectionId,
    artist: result.artistName,
    title: result.collectionName,
    // Apple only lists small thumbnails; the size segment of the URL can be swapped for a larger one.
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
