import { fetchTracks } from '../albums/itunes.js';

const ICON_PLAY = 'M7 4.5v15L19.5 12 7 4.5Z';
const ICON_PAUSE = 'M6 5h4v14H6V5Zm8 0h4v14h-4V5Z';
const RESTART_THRESHOLD = 3;

export function createPlayer(root, { getSelectedAlbum, onShowAlbum, onAlbumEnd } = {}) {
  const control = (name) => root.querySelector(`[data-control="${name}"]`);
  const playButton = control('play');
  const playIcon = playButton.querySelector('path');
  const trackLabel = control('track');
  const position = control('position');
  const elapsed = control('elapsed');
  const remaining = control('remaining');
  const volume = control('volume');

  const audio = new Audio();
  let album = null;
  let tracks = [];
  let index = 0;
  let loading;
  let seeking = false;

  async function playAlbum(next) {
    if (album?.id === next.id) {
      if (tracks.length) audio.play();
      if (tracks.length || loading) return;
    }

    loading?.abort();
    const controller = new AbortController();
    loading = controller;
    album = next;
    tracks = [];
    audio.pause();
    audio.removeAttribute('src');
    resetProgress();
    trackLabel.textContent = 'Loading…';
    renderPlayState();

    try {
      tracks = await fetchTracks(next.id, { signal: controller.signal });
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error(error);
      trackLabel.textContent = "Couldn't load tracks";
      return;
    } finally {
      if (loading === controller) {
        loading = null;
        renderPlayState();
      }
    }

    if (tracks.length === 0) {
      trackLabel.textContent = 'No previews available';
      return;
    }
    playTrack(0);
  }

  function playTrack(nextIndex) {
    index = nextIndex;
    const track = tracks[index];
    resetProgress();
    audio.src = track.preview;
    audio.play().catch(() => {});
    trackLabel.textContent = `${track.title} — ${track.artist}`;
    updateMediaSession(track);
  }

  function isPlaying() {
    return Boolean(loading) || !audio.paused;
  }

  function togglePlayback() {
    const selected = getSelectedAlbum?.();
    if (selected && (selected.id !== album?.id || !tracks.length)) {
      playAlbum(selected);
      return;
    }
    if (!tracks.length) return;
    if (audio.paused) audio.play();
    else audio.pause();
  }

  function previous() {
    if (!tracks.length) return;
    if (audio.currentTime > RESTART_THRESHOLD || index === 0) audio.currentTime = 0;
    else playTrack(index - 1);
  }

  function next() {
    if (!tracks.length) return;
    if (index < tracks.length - 1) playTrack(index + 1);
    else onAlbumEnd?.(album);
  }

  function resetProgress() {
    seeking = false;
    position.disabled = true;
    position.value = 0;
    paintSlider(position);
    elapsed.textContent = formatTime(0);
    remaining.textContent = `-${formatTime(0)}`;
  }

  function updateMediaSession(track) {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: album.title,
      artwork: [{ src: album.artwork, sizes: '600x600', type: 'image/jpeg' }],
    });
  }

  function renderTime() {
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    if (!seeking) {
      position.value = audio.currentTime;
      paintSlider(position);
    }
    const current = seeking ? Number(position.value) : audio.currentTime;
    elapsed.textContent = formatTime(current);
    remaining.textContent = `-${formatTime(duration - current)}`;
  }

  function renderPlayState() {
    const playing = isPlaying();
    playIcon.setAttribute('d', playing ? ICON_PAUSE : ICON_PLAY);
    playButton.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    }
  }

  audio.addEventListener('play', renderPlayState);
  audio.addEventListener('pause', renderPlayState);
  audio.addEventListener('timeupdate', renderTime);
  audio.addEventListener('loadedmetadata', () => {
    position.max = audio.duration;
    position.disabled = false;
    renderTime();
  });
  audio.addEventListener('ended', next);

  playButton.addEventListener('click', togglePlayback);
  control('previous').addEventListener('click', previous);
  control('next').addEventListener('click', next);
  control('now-playing').addEventListener('click', () => album && onShowAlbum?.(album));

  position.addEventListener('input', () => {
    seeking = true;
    paintSlider(position);
    renderTime();
  });
  position.addEventListener('change', () => {
    audio.currentTime = Number(position.value);
    seeking = false;
  });

  volume.addEventListener('input', () => {
    audio.volume = volume.value / 100;
    paintSlider(volume);
  });
  audio.volume = volume.value / 100;
  paintSlider(volume);
  paintSlider(position);

  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => audio.play());
    navigator.mediaSession.setActionHandler('pause', () => audio.pause());
    navigator.mediaSession.setActionHandler('previoustrack', previous);
    navigator.mediaSession.setActionHandler('nexttrack', next);
  }

  return { playAlbum, togglePlayback, isPlaying };
}

function paintSlider(slider) {
  const range = slider.max - slider.min;
  const percent = range > 0 ? ((slider.value - slider.min) / range) * 100 : 0;
  slider.style.setProperty('--fill', `${percent}%`);
}

function formatTime(seconds) {
  const total = Math.max(0, Math.round(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
