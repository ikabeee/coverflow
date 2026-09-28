import { searchAlbums } from './albums/itunes.js';
import { createCoverflow } from './coverflow/coverflow.js';
import { createPlayer } from './player/player.js';

const DEFAULT_TERM = 'Moving Mountains';
const SEARCH_DELAY = 400;
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
  onAlbumEnd() {
    if (coverflow.selectNext()) audioPlayer.playAlbum(coverflow.getSelected());
  },
});

let controller;
let debounce;
let failedTerm = null;

async function search(term) {
  term = term.trim() || DEFAULT_TERM;

  controller?.abort();
  controller = new AbortController();

  coverflow.setStatus('Loading…');
  try {
    const albums = await searchAlbums(term, { signal: controller.signal });
    failedTerm = null;
    coverflow.setAlbums(albums);
  } catch (error) {
    if (error.name === 'AbortError') return;
    console.error(error);
    failedTerm = term;
    coverflow.setStatus(navigator.onLine ? "Couldn't reach iTunes" : "You're offline");
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

window.addEventListener('online', () => {
  if (failedTerm) search(failedTerm);
});

if ('serviceWorker' in navigator) {
  try {
    await navigator.serviceWorker.register('./sw.js');
  } catch (error) {
    console.error('Service Worker registration failed', error);
  }
}

await search(DEFAULT_TERM);
