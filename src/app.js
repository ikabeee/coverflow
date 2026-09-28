import { searchAlbums } from './albums/itunes.js';
import { createCoverflow } from './coverflow/coverflow.js';
import { createPlayer } from './player/player.js';

const DEFAULT_TERM = 'Moving Mountains';
const SEARCH_DELAY = 400;
// Wait for the flow to settle before switching albums, so browsing quickly
// doesn't fire a track lookup per cover (the API allows ~20 calls a minute).
const SWITCH_DELAY = 350;

const player = document.querySelector('.player');
let switchTimer;
const searchForm = document.querySelector('.search');
const searchInput = searchForm.elements.term;

const coverflow = createCoverflow(document.querySelector('.coverflow'), {
  onChange(album) {
    player.style.setProperty('--ambient-image', `url("${album.artwork}")`);
  },
  onSelect(album) {
    clearTimeout(switchTimer);
    if (audioPlayer.isPlaying()) {
      switchTimer = setTimeout(() => audioPlayer.playAlbum(album), SWITCH_DELAY);
    }
  },
  onActivate: (album) => audioPlayer.playAlbum(album),
});

const audioPlayer = createPlayer(document.querySelector('.toolbar'), {
  getSelectedAlbum: coverflow.getSelected,
  onShowAlbum: (album) => coverflow.showAlbum(album.id),
  // Keep playing through the results, like an album queue.
  onAlbumEnd() {
    if (coverflow.selectNext()) audioPlayer.playAlbum(coverflow.getSelected());
  },
});

let controller;
let debounce;

async function search(term) {
  term = term.trim() || DEFAULT_TERM;

  // Only the latest search may update the covers.
  controller?.abort();
  controller = new AbortController();

  coverflow.setStatus('Loading…');
  try {
    const albums = await searchAlbums(term, { signal: controller.signal });
    coverflow.setAlbums(albums);
  } catch (error) {
    if (error.name === 'AbortError') return;
    console.error(error);
    coverflow.setStatus("Couldn't reach iTunes");
  }
}

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  clearTimeout(debounce);
  search(searchInput.value);
});

searchInput.addEventListener('input', () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => search(searchInput.value), SEARCH_DELAY);
});

await search(DEFAULT_TERM);
