export function createCoverflow(root, { onChange, onSelect, onActivate } = {}) {
  const track = root.querySelector('.coverflow__track');
  const primary = root.querySelector('.coverflow__artist');
  const secondary = root.querySelector('.coverflow__album');
  let albums = [];
  let items = [];
  let current = 0;

  function setAlbums(next) {
    albums = next;
    current = Math.floor(albums.length / 2);
    items = albums.map((album, index) => createItem(album, () => (index === current ? activate() : select(index))));
    track.replaceChildren(...items);

    if (albums.length === 0) {
      setStatus('No albums found');
      return;
    }
    root.dataset.state = 'ready';
    render();
  }

  function setStatus(message) {
    root.dataset.state = 'status';
    primary.textContent = message;
    secondary.textContent = '';
  }

  function select(index, { focus = false } = {}) {
    if (albums.length === 0) return false;
    const next = Math.max(0, Math.min(albums.length - 1, index));
    if (next === current) return false;
    current = next;
    render();
    if (focus) {
      items[current]?.querySelector('.cover')?.focus();
    }
    onSelect?.(albums[current], current);
    return true;
  }

  function activate() {
    if (albums.length) onActivate?.(albums[current]);
  }

  function showAlbum(id) {
    const index = albums.findIndex((album) => album.id === id);
    if (index !== -1) select(index);
  }

  function render() {
    items.forEach((item, index) => {
      const offset = index - current;
      item.style.setProperty('--side', Math.sign(offset));
      item.style.setProperty('--distance', Math.abs(offset));
      item.style.zIndex = albums.length - Math.abs(offset);
      item.toggleAttribute('data-active', offset === 0);
      const cover = item.querySelector('.cover');
      if (cover) cover.tabIndex = offset === 0 ? 0 : -1;
    });

    const album = albums[current];
    primary.textContent = album.artist;
    secondary.textContent = album.title;
    onChange?.(album, current);
  }

  root.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') select(current - 1, { focus: true });
    else if (event.key === 'ArrowRight') select(current + 1, { focus: true });
    else if (event.key === 'Enter') activate();
    else return;
    event.preventDefault();
  });

  return {
    setAlbums,
    setStatus,
    select,
    showAlbum,
    selectNext: () => select(current + 1),
    getSelected: () => albums[current],
  };
}

function createItem(album, onSelect) {
  const item = document.createElement('li');
  item.className = 'coverflow__item';

  const cover = document.createElement('button');
  cover.className = 'cover';
  cover.type = 'button';
  cover.tabIndex = -1;
  cover.setAttribute('aria-label', `${album.title} by ${album.artist}`);
  cover.addEventListener('click', onSelect);

  const reflection = createArtwork(album);
  reflection.classList.add('cover__reflection');
  reflection.setAttribute('aria-hidden', 'true');

  cover.append(createArtwork(album), reflection);
  item.append(cover);
  return item;
}

function createArtwork(album) {
  const art = document.createElement('div');
  art.className = 'cover__art';

  const image = document.createElement('img');
  image.crossOrigin = 'anonymous';
  image.src = album.artwork;
  image.alt = '';
  image.decoding = 'async';
  image.draggable = false;
  image.addEventListener('error', () => image.remove(), { once: true });

  art.append(image);
  return art;
}
