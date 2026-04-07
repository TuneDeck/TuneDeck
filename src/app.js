const API_BASE = 'https://api.schmittdev.org/ncsplayer/public/api.php';

const state = {
  view: 'home',
  songs: [],
  recent: [],
  liked: [],
  playlists: [],
  queue: [],
  queueIndex: -1,
  currentTrack: null,
  genres: [],
  autoplay: true,
  displayMode: 'grid',
  history: ['home'],
  historyIndex: 0,
  searchResults: [],
  activeGenre: null,
  queueOpen: false,
  discoverPage: 1,
};

const audio = document.getElementById('audio');
const els = {
  views: {
    home: homeView,
    discover: discoverView,
    genres: genresView,
    search: searchView,
    library: libraryView,
  },
  navItems: [...document.querySelectorAll('.nav-item')],
  switchers: [...document.querySelectorAll('[data-switch-view]')],
  recentGrid,
  featuredRail,
  discoverGrid,
  genreGrid,
  genreSongsWrap,
  genreSongsGrid,
  genreSongsTitle,
  searchResults,
  searchState,
  likedSongsGrid,
  libraryPlaylists,
  playlistList,
  miniNowPlaying,
  globalSearch,
  searchInput,
  searchBtn,
  closeGenreSongs,
  createPlaylistBtn,
  heroPlayBtn,
  autoplayToggle,
  backBtn,
  forwardBtn,
  filterChips: [...document.querySelectorAll('.filter-chip')],
  playerTitle,
  playerArtist,
  playerCover,
  currentTime,
  durationTime,
  progressBar,
  playPauseBtn,
  nextBtn,
  prevBtn,
  shuffleBtn,
  queueBtn,
  queueCount,
  volumeBar,
  likeBtn,
  toastHost,
  queueDrawer,
  queueList,
  queueBackdrop,
  queueNowPlaying,
  openQueueBtn,
  closeQueueBtn,
  clearQueueBtn,
};

function escapeHtml(input = '') {
  return String(input)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function parseMaybeJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {}
    return trimmed.split(',').map((v) => v.trim()).filter(Boolean);
  }
  return [];
}

function normalizeSong(song) {
  if (!song) return null;
  const genres = parseMaybeJsonArray(song.genre || song.genres);
  const artists = parseMaybeJsonArray(song.artists || song.artist_raw || song.artist);
  const versions = parseMaybeJsonArray(song.versions);

  return {
    id: song.id ?? song.external_id ?? song.slug ?? crypto.randomUUID(),
    external_id: song.external_id ?? song.track_id ?? '',
    slug: song.slug ?? '',
    title: song.title ?? song.track ?? 'Unknown track',
    artists,
    genres,
    versions,
    page_url: song.page_url ?? '',
    audio_url: song.audio_url ?? song.stream_url ?? '',
    cover_url:
      song.cover_large_url ||
      song.cover_medium_url ||
      song.cover_url ||
      song.cover_thumb_url ||
      '',
    cover_thumb_url: song.cover_thumb_url || song.cover_url || '',
    description: song.description ?? '',
    preview_seconds: Number(song.preview_seconds || 0),
    release_date: song.release_date || '',
    source: song,
  };
}

async function apiRequest(params = {}) {
  const url = new URL(API_BASE);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`API request failed: ${res.status}`);
  return res.json();
}

async function fetchSongs(page = 1, limit = 80) {
  const data = await apiRequest({ action: 'songs', page, limit });
  const rows = Array.isArray(data.rows) ? data.rows : Array.isArray(data) ? data : [];
  return rows.map(normalizeSong).filter(Boolean);
}

async function searchSongs(query) {
  const data = await apiRequest({ action: 'search', q: query });
  const rows = Array.isArray(data.rows) ? data.rows : Array.isArray(data) ? data : [];
  return rows.map(normalizeSong).filter(Boolean);
}

function toast(message) {
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  els.toastHost.appendChild(node);
  setTimeout(() => node.remove(), 2600);
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function songSubtitle(song) {
  const artistText = song.artists?.length ? song.artists.join(', ') : 'Unknown artist';
  const genreText = song.genres?.length ? song.genres.join(' · ') : '';
  return genreText ? `${artistText} · ${genreText}` : artistText;
}

function getSongKey(song) {
  return song.slug || song.external_id || song.id;
}

function isLiked(song) {
  return state.liked.includes(getSongKey(song));
}

async function persist(key, value) {
  if (window.ncsDesktop?.setStore) await window.ncsDesktop.setStore(key, value);
}

async function loadPersistedState() {
  if (!window.ncsDesktop?.getStore) return;
  state.liked = (await window.ncsDesktop.getStore('liked')) || [];
  state.playlists = (await window.ncsDesktop.getStore('playlists')) || [];
  state.autoplay = await window.ncsDesktop.getStore('autoplay');
  if (typeof state.autoplay !== 'boolean') state.autoplay = true;
  const volume = await window.ncsDesktop.getStore('volume');
  if (typeof volume === 'number') {
    audio.volume = volume;
    els.volumeBar.value = Math.round(volume * 100);
  }
}

function addToQueue(song, announce = true) {
  const normalized = normalizeSong(song);
  if (!normalized?.audio_url) return;
  state.queue.push(normalized);
  updateQueueUi();
  if (announce) toast(`Added to queue: ${normalized.title}`);
}

function createTrackCard(song) {
  const card = document.createElement('article');
  card.className = 'track-card';
  card.innerHTML = `
    <div class="track-card-cover" style="background-image:url('${escapeHtml(song.cover_url)}')">
      <div class="track-card-overlay">
        <button class="mini-play" data-action="play">▶</button>
        <button class="mini-queue" data-action="queue">＋</button>
      </div>
    </div>
    <h4>${escapeHtml(song.title)}</h4>
    <p>${escapeHtml(songSubtitle(song))}</p>
    <div class="track-tags">
      ${(song.genres || []).slice(0, 2).map((g) => `<span class="tag">${escapeHtml(g)}</span>`).join('')}
      ${song.release_date ? `<span class="tag">${escapeHtml(song.release_date)}</span>` : ''}
    </div>
  `;
  card.querySelector('[data-action="play"]').addEventListener('click', (e) => {
    e.stopPropagation();
    playTrack(song, state.queue.length ? state.queue : state.songs);
  });
  card.querySelector('[data-action="queue"]').addEventListener('click', (e) => {
    e.stopPropagation();
    addToQueue(song);
  });
  card.addEventListener('click', () => playTrack(song, state.queue.length ? state.queue : state.songs));
  return card;
}

function createDiscoverRow(song, songs) {
  const row = document.createElement('article');
  row.className = 'genre-song-row';
  row.innerHTML = `
    <div class="genre-song-main">
      <div class="genre-song-cover" style="background-image:url('${escapeHtml(song.cover_url)}')"></div>
      <div class="genre-song-meta">
        <strong>${escapeHtml(song.title)}</strong>
        <span>${escapeHtml(song.artists?.join(', ') || 'Unknown artist')}</span>
      </div>
    </div>
    <div class="genre-song-extra">${escapeHtml(song.genres?.join(' · ') || 'NCS')}</div>
    <div class="genre-song-extra">${escapeHtml(song.release_date || '—')}</div>
    <div class="genre-song-actions">
      <button class="ghost-btn play-row-btn" data-action="play">▶</button>
      <button class="ghost-btn play-row-btn" data-action="queue">＋</button>
    </div>
  `;
  row.querySelector('[data-action="play"]').addEventListener('click', (e) => {
    e.stopPropagation();
    playTrack(song, songs);
  });
  row.querySelector('[data-action="queue"]').addEventListener('click', (e) => {
    e.stopPropagation();
    addToQueue(song);
  });
  row.addEventListener('click', () => playTrack(song, songs));
  return row;
}

function createGenreSongRow(song, songs) {
  return createDiscoverRow(song, songs);
}

function renderRail(container, songs) {
  container.innerHTML = '';
  songs.forEach((song, index) => {
    const node = document.createElement('div');
    node.className = 'rail-card';
    node.style.background = `linear-gradient(135deg, rgba(124,92,255,${0.18 + (index % 3) * 0.04}), rgba(255,255,255,.03))`;
    node.innerHTML = `
      <div>
        <span class="eyebrow">${escapeHtml(song.genres?.[0] || 'NCS')}</span>
        <h3>${escapeHtml(song.title)}</h3>
        <p>${escapeHtml(song.artists.join(', ') || 'Unknown artist')}</p>
      </div>
    `;
    node.addEventListener('click', () => playTrack(song, songs));
    container.appendChild(node);
  });
}

function renderGrid(container, songs, mode = 'grid') {
  container.innerHTML = '';
  if (!songs.length) {
    container.innerHTML = '<div class="empty-state">No songs found yet.</div>';
    return;
  }
  if (mode === 'list') {
    container.classList.add('list-mode');
    songs.forEach((song) => container.appendChild(createDiscoverRow(song, songs)));
    return;
  }
  container.classList.remove('list-mode');
  songs.forEach((song) => container.appendChild(createTrackCard(song)));
}

function renderGenres() {
  const genreNames = new Set();
  state.songs.forEach((song) => {
    (song.genres.length ? song.genres : ['Unsorted']).forEach((genre) => genreNames.add(genre));
  });

  state.genres = [...genreNames.values()].sort((a, b) => a.localeCompare(b));
  els.genreGrid.innerHTML = '';

  state.genres.forEach((genre, idx) => {
    const card = document.createElement('button');
    card.className = 'genre-card';
    card.style.background = `linear-gradient(135deg, rgba(${80 + (idx % 4) * 30}, ${70 + (idx % 5) * 22}, ${180 - (idx % 4) * 20}, .32), rgba(255,255,255,.03))`;
    card.innerHTML = `<h4>${escapeHtml(genre)}</h4><p>Open genre</p>`;
    card.addEventListener('click', () => openGenre(genre));
    els.genreGrid.appendChild(card);
  });
}

function openGenre(name) {
  const songs = state.songs.filter((song) => (song.genres.length ? song.genres : ['Unsorted']).includes(name));
  state.activeGenre = name;
  els.genreSongsTitle.textContent = name;
  els.genreSongsGrid.innerHTML = '';

  if (!songs.length) {
    els.genreSongsGrid.innerHTML = '<div class="empty-state">No songs found in this genre.</div>';
  } else {
    songs.forEach((song) => els.genreSongsGrid.appendChild(createGenreSongRow(song, songs)));
  }

  els.genreGrid.classList.add('hidden');
  els.genreSongsWrap.classList.remove('hidden');
}

function closeGenre() {
  state.activeGenre = null;
  els.genreSongsWrap.classList.add('hidden');
  els.genreGrid.classList.remove('hidden');
}

function renderLiked() {
  renderGrid(els.likedSongsGrid, state.songs.filter((song) => isLiked(song)), 'grid');
}

function renderPlaylists() {
  const renderItems = (container) => {
    container.innerHTML = '';
    if (!state.playlists.length) {
      container.innerHTML = '<div class="empty-state">Create your first local playlist.</div>';
      return;
    }

    state.playlists.forEach((playlist) => {
      const item = document.createElement('div');
      item.className = 'playlist-item';
      item.innerHTML = `
        <div>
          <strong>${escapeHtml(playlist.name)}</strong>
          <small>${(playlist.tracks || []).length} tracks</small>
        </div>
        <div class="playlist-actions">
          <button class="ghost-btn" data-action="open">▶</button>
          <button class="ghost-btn" data-action="addCurrent">＋</button>
          <button class="ghost-btn" data-action="delete">×</button>
        </div>
      `;

      item.querySelector('[data-action="open"]').addEventListener('click', () => {
        const tracks = (playlist.tracks || []).map(normalizeSong).filter(Boolean);
        if (tracks.length) {
          switchView('library');
          renderGrid(els.likedSongsGrid, tracks, 'grid');
          playTrack(tracks[0], tracks);
          toast(`Opened playlist: ${playlist.name}`);
        }
      });

      item.querySelector('[data-action="addCurrent"]').addEventListener('click', async () => {
        if (!state.currentTrack) {
          toast('Play a song first.');
          return;
        }
        const existingKeys = new Set((playlist.tracks || []).map(getSongKey));
        if (!existingKeys.has(getSongKey(state.currentTrack))) {
          playlist.tracks = [...(playlist.tracks || []), state.currentTrack];
          await window.ncsDesktop?.updatePlaylist?.(playlist);
          renderPlaylists();
          toast(`Added to ${playlist.name}`);
        }
      });

      item.querySelector('[data-action="delete"]').addEventListener('click', async () => {
        state.playlists = state.playlists.filter((p) => p.id !== playlist.id);
        await window.ncsDesktop?.deletePlaylist?.(playlist.id);
        renderPlaylists();
        toast('Playlist removed');
      });

      container.appendChild(item);
    });
  };

  renderItems(els.playlistList);
  renderItems(els.libraryPlaylists);
}

function setMiniNowPlaying(song) {
  if (!song) return;
  els.miniNowPlaying.innerHTML = `
    <img class="mini-cover" src="${escapeHtml(song.cover_url)}" alt="${escapeHtml(song.title)}" />
    <div class="mini-meta">
      <strong>${escapeHtml(song.title)}</strong>
      <span>${escapeHtml(song.artists.join(', ') || 'Unknown artist')}</span>
    </div>
  `;
}

function setPlayerUi(song) {
  state.currentTrack = song;
  els.playerTitle.textContent = song?.title || 'Nothing playing';
  els.playerArtist.textContent = song ? songSubtitle(song) : 'Choose a song to start';
  els.playerCover.src = song?.cover_url || '';
  els.playerCover.alt = song?.title || '';
  els.likeBtn.textContent = song && isLiked(song) ? '♥' : '♡';
  setMiniNowPlaying(song);
  renderQueueDrawer();
}

async function pushRecent(song) {
  const key = getSongKey(song);
  state.recent = [song, ...state.recent.filter((s) => getSongKey(s) !== key)].slice(0, 12);
  await persist('recent', state.recent);
  renderGrid(els.recentGrid, state.recent, 'grid');
}

function updateQueueUi() {
  els.queueCount.textContent = `Queue: ${state.queue.length}`;
  renderQueueDrawer();
}

async function playTrack(song, queue = []) {
  const normalizedSong = normalizeSong(song);
  if (!normalizedSong?.audio_url) {
    toast('This track has no audio URL.');
    return;
  }

  const normalizedQueue = queue.map(normalizeSong).filter(Boolean);
  state.queue = normalizedQueue.length ? normalizedQueue : [normalizedSong];
  state.queueIndex = Math.max(0, state.queue.findIndex((item) => getSongKey(item) === getSongKey(normalizedSong)));
  if (state.queueIndex < 0) state.queueIndex = 0;
  updateQueueUi();

  audio.src = normalizedSong.audio_url;
  await audio.play();
  setPlayerUi(normalizedSong);
  els.playPauseBtn.textContent = '⏸';
  await pushRecent(normalizedSong);
}

function nextTrack(shuffle = false) {
  if (!state.queue.length) return;
  if (shuffle) state.queueIndex = Math.floor(Math.random() * state.queue.length);
  else if (state.queueIndex < state.queue.length - 1) state.queueIndex += 1;
  else if (state.autoplay) state.queueIndex = 0;
  playTrack(state.queue[state.queueIndex], state.queue);
}

function prevTrack() {
  if (!state.queue.length) return;
  state.queueIndex = Math.max(0, state.queueIndex - 1);
  playTrack(state.queue[state.queueIndex], state.queue);
}

async function toggleLike() {
  const song = state.currentTrack;
  if (!song) return;
  const key = getSongKey(song);
  if (state.liked.includes(key)) {
    state.liked = state.liked.filter((id) => id !== key);
    toast('Removed from liked songs');
  } else {
    state.liked.unshift(key);
    toast('Added to liked songs');
  }
  await persist('liked', state.liked);
  setPlayerUi(song);
  renderLiked();
}

async function createPlaylist() {
  const name = prompt('Playlist name');
  if (!name) return;
  const playlist = {
    id: crypto.randomUUID(),
    name: name.trim(),
    tracks: state.currentTrack ? [state.currentTrack] : [],
  };
  state.playlists.unshift(playlist);
  await window.ncsDesktop?.updatePlaylist?.(playlist);
  renderPlaylists();
  toast(`Playlist created: ${playlist.name}`);
}

function switchView(view, pushHistory = true) {
  state.view = view;
  Object.entries(els.views).forEach(([name, node]) => node.classList.toggle('active', name === view));
  els.navItems.forEach((btn) => btn.classList.toggle('active', btn.dataset.view === view));
  if (view !== 'genres') closeGenre();
  if (pushHistory) {
    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(view);
    state.historyIndex = state.history.length - 1;
  }
}

function goHistory(direction) {
  const nextIndex = state.historyIndex + direction;
  if (nextIndex < 0 || nextIndex >= state.history.length) return;
  state.historyIndex = nextIndex;
  switchView(state.history[state.historyIndex], false);
}

async function doSearch(raw) {
  const query = raw.trim();
  if (!query) {
    els.searchState.textContent = 'Start typing to search your API.';
    els.searchState.classList.remove('hidden');
    els.searchResults.innerHTML = '';
    return;
  }

  els.searchState.textContent = 'Searching...';
  els.searchState.classList.remove('hidden');
  try {
    const results = await searchSongs(query);
    state.searchResults = results;
    renderGrid(els.searchResults, results, 'grid');
    els.searchState.classList.toggle('hidden', results.length > 0);
    els.searchState.textContent = results.length ? '' : 'No results found.';
  } catch (err) {
    els.searchState.textContent = 'Search failed. Check your API.';
    console.error(err);
  }
}

function toggleQueueDrawer(force) {
  state.queueOpen = typeof force === 'boolean' ? force : !state.queueOpen;
  els.queueDrawer.classList.toggle('hidden', !state.queueOpen);
  els.queueBackdrop.classList.toggle('hidden', !state.queueOpen);
}

function removeFromQueue(index) {
  if (index < 0 || index >= state.queue.length) return;
  state.queue.splice(index, 1);
  if (state.queueIndex >= state.queue.length) state.queueIndex = state.queue.length - 1;
  if (state.queue.length === 0) {
    state.queueIndex = -1;
  }
  updateQueueUi();
}

function moveQueueItem(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= state.queue.length) return;
  [state.queue[index], state.queue[target]] = [state.queue[target], state.queue[index]];
  if (state.queueIndex === index) state.queueIndex = target;
  else if (state.queueIndex === target) state.queueIndex = index;
  updateQueueUi();
}

function clearQueue() {
  if (!state.currentTrack) {
    state.queue = [];
    state.queueIndex = -1;
  } else {
    state.queue = [state.currentTrack];
    state.queueIndex = 0;
  }
  updateQueueUi();
  toast('Queue cleared');
}

function renderQueueDrawer() {
  const current = state.queue[state.queueIndex] || state.currentTrack;
  els.queueNowPlaying.innerHTML = current
    ? `<strong>${escapeHtml(current.title)}</strong><span>${escapeHtml(songSubtitle(current))}</span>`
    : '<strong>No active track</strong><span>Start playback to build your queue.</span>';

  els.queueList.innerHTML = '';
  if (!state.queue.length) {
    els.queueList.innerHTML = '<div class="empty-state">Queue is empty.</div>';
    return;
  }

  state.queue.forEach((song, index) => {
    const row = document.createElement('article');
    row.className = `queue-item ${index === state.queueIndex ? 'active' : ''}`;
    row.innerHTML = `
      <div class="queue-item-main">
        <img src="${escapeHtml(song.cover_url)}" alt="${escapeHtml(song.title)}" />
        <div>
          <strong>${escapeHtml(song.title)}</strong>
          <span>${escapeHtml(song.artists.join(', ') || 'Unknown artist')}</span>
        </div>
      </div>
      <div class="queue-item-actions">
        <button class="ghost-btn" data-action="up">↑</button>
        <button class="ghost-btn" data-action="down">↓</button>
        <button class="ghost-btn" data-action="play">▶</button>
        <button class="ghost-btn" data-action="remove">✕</button>
      </div>
    `;

    row.querySelector('[data-action="up"]').addEventListener('click', (e) => {
      e.stopPropagation();
      moveQueueItem(index, -1);
    });
    row.querySelector('[data-action="down"]').addEventListener('click', (e) => {
      e.stopPropagation();
      moveQueueItem(index, 1);
    });
    row.querySelector('[data-action="play"]').addEventListener('click', async (e) => {
      e.stopPropagation();
      state.queueIndex = index;
      await playTrack(song, state.queue);
    });
    row.querySelector('[data-action="remove"]').addEventListener('click', (e) => {
      e.stopPropagation();
      removeFromQueue(index);
    });
    row.addEventListener('click', async () => {
      state.queueIndex = index;
      await playTrack(song, state.queue);
    });
    els.queueList.appendChild(row);
  });
}

function bindEvents() {
  els.navItems.forEach((btn) => btn.addEventListener('click', () => switchView(btn.dataset.view)));
  els.switchers.forEach((btn) => btn.addEventListener('click', () => switchView(btn.dataset.switchView)));
  els.heroPlayBtn.addEventListener('click', () => {
    if (state.songs.length) playTrack(state.songs[0], state.songs);
  });
  els.closeGenreSongs.addEventListener('click', closeGenre);
  els.searchBtn.addEventListener('click', () => doSearch(els.searchInput.value));
  els.searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch(els.searchInput.value);
  });
  els.globalSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      els.searchInput.value = els.globalSearch.value;
      switchView('search');
      doSearch(els.globalSearch.value);
    }
  });
  els.createPlaylistBtn.addEventListener('click', createPlaylist);
  els.autoplayToggle.addEventListener('click', async () => {
    state.autoplay = !state.autoplay;
    els.autoplayToggle.textContent = state.autoplay ? 'Autoplay on' : 'Autoplay off';
    els.autoplayToggle.classList.toggle('active', state.autoplay);
    await persist('autoplay', state.autoplay);
  });
  els.backBtn.addEventListener('click', () => goHistory(-1));
  els.forwardBtn.addEventListener('click', () => goHistory(1));
  els.filterChips.forEach((chip) =>
    chip.addEventListener('click', () => {
      els.filterChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.displayMode = chip.dataset.display;
      renderGrid(els.discoverGrid, state.songs, state.displayMode);
    }),
  );
  els.playPauseBtn.addEventListener('click', async () => {
    if (!audio.src) {
      if (state.songs.length) await playTrack(state.songs[0], state.songs);
      return;
    }
    if (audio.paused) {
      await audio.play();
      els.playPauseBtn.textContent = '⏸';
    } else {
      audio.pause();
      els.playPauseBtn.textContent = '▶';
    }
  });
  els.nextBtn.addEventListener('click', () => nextTrack());
  els.prevBtn.addEventListener('click', prevTrack);
  els.shuffleBtn.addEventListener('click', () => nextTrack(true));
  els.queueBtn.addEventListener('click', () => toggleQueueDrawer());
  els.openQueueBtn.addEventListener('click', () => toggleQueueDrawer(true));
  els.closeQueueBtn.addEventListener('click', () => toggleQueueDrawer(false));
  els.queueBackdrop.addEventListener('click', () => toggleQueueDrawer(false));
  els.clearQueueBtn.addEventListener('click', clearQueue);
  els.volumeBar.addEventListener('input', async () => {
    audio.volume = Number(els.volumeBar.value) / 100;
    await persist('volume', audio.volume);
  });
  els.likeBtn.addEventListener('click', toggleLike);
  els.progressBar.addEventListener('input', () => {
    if (!audio.duration) return;
    audio.currentTime = (Number(els.progressBar.value) / 100) * audio.duration;
  });
  audio.addEventListener('timeupdate', () => {
    els.currentTime.textContent = formatTime(audio.currentTime);
    els.durationTime.textContent = formatTime(audio.duration);
    els.progressBar.value = audio.duration ? Math.round((audio.currentTime / audio.duration) * 100) : 0;
  });
  audio.addEventListener('play', () => (els.playPauseBtn.textContent = '⏸'));
  audio.addEventListener('pause', () => (els.playPauseBtn.textContent = '▶'));
  audio.addEventListener('ended', () => {
    if (state.autoplay) nextTrack();
  });
}

async function init() {
  bindEvents();
  await loadPersistedState();
  els.autoplayToggle.textContent = state.autoplay ? 'Autoplay on' : 'Autoplay off';
  els.autoplayToggle.classList.toggle('active', state.autoplay);

  try {
    const songs = await fetchSongs(1, 120);
    state.songs = songs;
    state.queue = [...songs];
    state.queueIndex = songs.length ? 0 : -1;
    updateQueueUi();
    renderGrid(els.recentGrid, songs.slice(0, 6), 'grid');
    renderRail(els.featuredRail, songs.slice(0, 8));
    renderGrid(els.discoverGrid, songs, 'grid');
    renderGenres();
    renderLiked();
    renderPlaylists();
    toast(songs.length ? `Loaded ${songs.length} tracks from your API` : 'No songs came back from your API.');
  } catch (err) {
    console.error(err);
    toast('Could not load API data. Check API URL or CORS.');
    els.recentGrid.innerHTML = '<div class="empty-state">API could not be reached.</div>';
    els.discoverGrid.innerHTML = '<div class="empty-state">Please check https://api.schmittdev.org/ncsplayer/public/api.php</div>';
  }
}

init();
