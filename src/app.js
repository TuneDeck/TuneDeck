const API_BASE = 'https://api.schmittdev.org/ncsplayer/public/api.php';

const $ = (id) => document.getElementById(id);
const audio = $('audio');
const player = new window.TuneDeckPlayerAdapter({ audioEl: audio });

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
  repeatOne: false,
  displayMode: 'grid',
  history: ['home'],
  historyIndex: 0,
  searchResults: [],
  activeGenre: null,
  queueOpen: false,
  settingsOpen: false,
  currentSongView: null,
  currentArtist: null,
  currentPlaylist: null,
  pendingPlaylistSong: null,
  visibleSongs: [],
  songsPage: 1,
  songsTotal: 0,
  songsPerPage: 100,
  isLoadingMoreSongs: false,
  audioEngine: {
    mode: 'dual-output-prep',
    localReady: true,
    broadcastReady: false,
  },
};

const els = {
  views: {
    home: $('homeView'),
    discover: $('discoverView'),
    genres: $('genresView'),
    search: $('searchView'),
    library: $('libraryView'),
    song: $('songView'),
    artist: $('artistView'),
    playlist: $('playlistView'),
  },
  navItems: [...document.querySelectorAll('.nav-item')],
  switchers: [...document.querySelectorAll('[data-switch-view]')],
  filterChips: [...document.querySelectorAll('.filter-chip')],
  contentScroll: $('contentScroll'),
  recentGrid: $('recentGrid'),
  featuredRail: $('featuredRail'),
  discoverGrid: $('discoverGrid'),
  genreGrid: $('genreGrid'),
  genreSongsWrap: $('genreSongsWrap'),
  genreSongsGrid: $('genreSongsGrid'),
  genreSongsTitle: $('genreSongsTitle'),
  searchResults: $('searchResults'),
  searchState: $('searchState'),
  likedSongsGrid: $('likedSongsGrid'),
  libraryPlaylists: $('libraryPlaylists'),
  playlistList: $('playlistList'),
  miniNowPlaying: $('miniNowPlaying'),
  playlistPicker: $('playlistPicker'),
  playlistPickerCard: $('playlistPickerCard'),
  playlistPickerList: $('playlistPickerList'),
  closePlaylistPickerBtn: $('closePlaylistPickerBtn'),
  newPlaylistFromPickerBtn: $('newPlaylistFromPickerBtn'),
  globalSearch: $('globalSearch'),
  searchInput: $('searchInput'),
  searchBtn: $('searchBtn'),
  closeGenreSongs: $('closeGenreSongs'),
  createPlaylistBtn: $('createPlaylistBtn'),
  heroPlayBtn: $('heroPlayBtn'),
  repeatBtn: $('repeatBtn'),
  playerCoverButton: $('playerCoverButton'),
  backBtn: $('backBtn'),
  forwardBtn: $('forwardBtn'),
  playerTitle: $('playerTitle'),
  playerArtist: $('playerArtist'),
  playerCover: $('playerCover'),
  currentTime: $('currentTime'),
  durationTime: $('durationTime'),
  progressBar: $('progressBar'),
  playPauseBtn: $('playPauseBtn'),
  nextBtn: $('nextBtn'),
  prevBtn: $('prevBtn'),
  shuffleBtn: $('shuffleBtn'),
  openQueueBtn: $('openQueueBtn'),
  queueBtn: $('queueBtn'),
  queueCount: $('queueCount'),
  volumeBar: $('volumeBar'),
  likeBtn: $('likeBtn'),
  toastHost: $('toastHost'),
  queueDrawer: $('queueDrawer'),
  queueList: $('queueList'),
  queueBackdrop: $('queueBackdrop'),
  queueNowPlaying: $('queueNowPlaying'),
  closeQueueBtn: $('closeQueueBtn'),
  clearQueueBtn: $('clearQueueBtn'),
  settingsDrawer: $('settingsDrawer'),
  settingsBackdrop: $('settingsBackdrop'),
  openSettingsBtn: $('openSettingsBtn'),
  closeSettingsBtn: $('closeSettingsBtn'),
  songHero: $('songHero'),
  songMeta: $('songMeta'),
  songActions: $('songActions'),
  songDescription: $('songDescription'),
  relatedSongs: $('relatedSongs'),
  artistHero: $('artistHero'),
  artistSongs: $('artistSongs'),
  artistPlayBtn: $('artistPlayBtn'),
  playlistHero: $('playlistHero'),
  playlistSongs: $('playlistSongs'),
  playlistPlayBtn: $('playlistPlayBtn'),
  playlistModal: $('playlistModal'),
  playlistNameInput: $('playlistNameInput'),
  confirmPlaylistBtn: $('confirmPlaylistBtn'),
  cancelPlaylistBtn: $('cancelPlaylistBtn'),
  closePlaylistModalBtn: $('closePlaylistModalBtn'),
  licenseModal: $('licenseModal'),
  licenseFrame: $('licenseFrame'),
  licenseModalTitle: $('licenseModalTitle'),
  openGplLicenseBtn: $('openGplLicenseBtn'),
  openNcsLicenseBtn: $('openNcsLicenseBtn'),
  closeLicenseModalBtn: $('closeLicenseModalBtn'),
  windowMinBtn: $('windowMinBtn'),
  windowMaxBtn: $('windowMaxBtn'),
  windowCloseBtn: $('windowCloseBtn'),
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
  const cover = song.cover_large_url || song.cover_medium_url || song.cover_url || song.cover_thumb_url || '';
  return {
    id: song.id ?? song.external_id ?? song.slug ?? Math.random().toString(36).slice(2),
    external_id: song.external_id ?? song.track_id ?? '',
    slug: song.slug ?? '',
    title: song.title ?? song.track ?? 'Unknown track',
    artists,
    genres,
    versions,
    page_url: song.page_url ?? '',
    audio_url: song.audio_url ?? song.stream_url ?? '',
    cover_url: cover,
    cover_thumb_url: song.cover_thumb_url || cover,
    description: song.description ?? '',
    preview_seconds: Number(song.preview_seconds || 0),
    duration_seconds: Number(song.duration_seconds || song.duration || 0),
    release_date: song.release_date || '',
    source: song,
  };
}

function coverOrPlaceholder(song) {
  return song?.cover_url || './assets/note-placeholder.svg';
}

function estimateDurationSeconds(song) {
  return Number(song?.duration_seconds || 0) || Number(song?.preview_seconds || 0) || 0;
}

function formatPlaylistDuration(totalSeconds) {
  if (!totalSeconds) return 'Duration not available yet';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours} hr ${minutes} min`;
  return `${minutes} min`;
}

async function apiRequest(params = {}) {
  const url = new URL(API_BASE);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });
  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`Unable to retrieve content: ${res.status}`);
  return res.json();
}

async function fetchSongsPage(page = 1, limit = 100) {
  const data = await apiRequest({ action: 'songs', page, limit });
  const rows = Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : [];
  return {
    rows: rows.map(normalizeSong).filter(Boolean),
    total: Number(data?.total || rows.length),
    page: Number(data?.page || page),
    limit: Number(data?.limit || limit),
  };
}

async function searchSongs(query) {
  const data = await apiRequest({ action: 'search', q: query });
  const rows = Array.isArray(data.rows) ? data.rows : Array.isArray(data) ? data : [];
  return rows.map(normalizeSong).filter(Boolean);
}


function getRecentGenreSet() {
  const genres = new Set();
  (state.recent || []).forEach((song) => (song.genres || []).forEach((genre) => genres.add(genre)));
  return genres;
}

function scoreSong(song) {
  let score = 0;
  const key = getSongKey(song);
  const likedSet = new Set(state.liked || []);
  const recentGenres = getRecentGenreSet();

  if (likedSet.has(key)) score += 90;
  if ((song.genres || []).some((genre) => recentGenres.has(genre))) score += 28;
  if ((state.recent || []).some((recent) => (recent.artists || []).some((artist) => (song.artists || []).includes(artist)))) score += 16;

  if (song.release_date) {
    const ts = Date.parse(song.release_date);
    if (!Number.isNaN(ts)) {
      const ageDays = Math.max(0, (Date.now() - ts) / 86400000);
      score += Math.max(0, 24 - Math.min(24, ageDays / 14));
    }
  }

  return score;
}

function rankSongsForHome(songs) {
  return [...songs].sort((a, b) => scoreSong(b) - scoreSong(a));
}

function renderHomeSections() {
  const source = state.songs.length ? rankSongsForHome(state.songs) : [];
  renderGrid(els.recentGrid, state.recent.length ? state.recent : source.slice(0, 6), 'grid');
  renderRail(els.featuredRail, source.slice(0, 8));
}

function renderDiscoverFeed() {
  renderGrid(els.discoverGrid, state.visibleSongs, 'grid');
}

function canLoadMoreSongs() {
  return state.visibleSongs.length < state.songs.length || (state.songsTotal && state.songs.length < state.songsTotal);
}

async function loadMoreSongs() {
  if (state.isLoadingMoreSongs) return;
  if (!canLoadMoreSongs()) return;

  // reveal more already-loaded songs first
  if (state.visibleSongs.length < state.songs.length) {
    state.visibleSongs = state.songs.slice(0, Math.min(state.songs.length, state.visibleSongs.length + 100));
    renderDiscoverFeed();
    return;
  }

  state.isLoadingMoreSongs = true;
  try {
    const nextPage = state.songsPage + 1;
    const result = await fetchSongsPage(nextPage, state.songsPerPage);
    if (result.rows.length) {
      const merged = new Map(state.songs.map((song) => [getSongKey(song), song]));
      result.rows.forEach((song) => merged.set(getSongKey(song), song));
      state.songs = [...merged.values()];
      state.songsPage = result.page;
      state.songsTotal = result.total || state.songsTotal;
      state.visibleSongs = state.songs.slice(0, Math.min(state.songs.length, state.visibleSongs.length + 100));
      renderHomeSections();
      renderDiscoverFeed();
      renderGenres();
      renderLiked();
    }
  } catch (err) {
    console.warn('Could not load more songs', err);
  } finally {
    state.isLoadingMoreSongs = false;
  }
}

function setupInfiniteScroll() {
  if (!els.contentScroll) return;
  els.contentScroll.addEventListener('scroll', async () => {
    const activeView = document.querySelector('.view.active');
    if (!activeView || activeView.id !== 'discoverView') return;
    const nearBottom = els.contentScroll.scrollTop + els.contentScroll.clientHeight >= els.contentScroll.scrollHeight - 240;
    if (nearBottom) await loadMoreSongs();
  });
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
  return song.slug || song.external_id || String(song.id);
}

function isLiked(song) {
  return state.liked.includes(getSongKey(song));
}

function toast(message) {
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  els.toastHost.appendChild(node);
  setTimeout(() => node.remove(), 2600);
}

async function persist(key, value) {
  if (window.ncsDesktop?.setStore) await window.ncsDesktop.setStore(key, value);
}

async function loadPersistedState() {
  if (!window.ncsDesktop?.getStore) return;
  state.liked = (await window.ncsDesktop.getStore('liked')) || [];
  state.playlists = (await window.ncsDesktop.getStore('playlists')) || [];
  state.recent = ((await window.ncsDesktop.getStore('recent')) || []).map(normalizeSong).filter(Boolean);
  state.autoplay = true;
  state.repeatOne = await window.ncsDesktop.getStore('repeatOne');
  if (typeof state.repeatOne !== 'boolean') state.repeatOne = false;
  const volume = await window.ncsDesktop.getStore('volume');
  if (typeof volume === 'number') {
    els.volumeBar.value = Math.round(volume * 100);
  }
}

function artistLinks(song) {
  if (!song.artists?.length) return '<span>Unknown artist</span>';
  return song.artists
    .map((artist) => `<button class="inline-artist-link" data-artist="${escapeHtml(artist)}">${escapeHtml(artist)}</button>`)
    .join(', ');
}

function attachArtistLinkEvents(scope = document) {
  scope.querySelectorAll('[data-artist]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openArtist(btn.dataset.artist);
    });
  });
}

function attachSongLinkEvents(scope = document) {
  scope.querySelectorAll('[data-song-key]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const song = state.songs.find((item) => getSongKey(item) === btn.dataset.songKey)
        || state.queue.find((item) => getSongKey(item) === btn.dataset.songKey)
        || state.recent.find((item) => getSongKey(item) === btn.dataset.songKey);
      if (song) openSongDetail(song);
    });
  });
}

function playlistGradient(name = '') {
  let hash = 0;
  for (const ch of String(name)) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  const a = Math.abs(hash) % 360;
  const b = (a + 55) % 360;
  return `linear-gradient(135deg, hsla(${a}, 72%, 58%, .95), hsla(${b}, 78%, 42%, .96))`;
}

function playlistArtworkMarkup(playlist) {
  const count = (playlist.tracks || []).length;
  const safeName = escapeHtml(playlist.name || 'Playlist');
  return `
    <div class="playlist-art square-playlist-art apple-style-playlist" style="background:${playlistGradient(playlist.name)}">
      <div class="playlist-bars">
        <span></span><span></span><span></span><span></span><span></span>
      </div>
      <div class="playlist-art-bottom">
        <strong>${safeName}</strong>
        <small>${count} track${count === 1 ? '' : 's'}</small>
      </div>
    </div>`;
}

function openLicenseModal(title, src) {
  els.licenseModalTitle.textContent = title;
  els.licenseFrame.src = src;
  els.licenseModal.classList.remove('hidden');
}

function closeLicenseModal() {
  els.licenseFrame.src = 'about:blank';
  els.licenseModal.classList.add('hidden');
}

function createTrackCard(song, songs = state.songs) {
  const card = document.createElement('article');
  card.className = 'track-card';
  card.innerHTML = `
    <div class="track-card-cover-wrap">
      <img class="track-card-cover track-cover-link" data-song-key="${escapeHtml(getSongKey(song))}" src="${escapeHtml(coverOrPlaceholder(song))}" alt="${escapeHtml(song.title)}" />
      <div class="track-card-overlay">
        <button class="mini-play" data-action="play">▶</button>
        <button class="mini-queue" data-action="queue">＋</button>
      </div>
    </div>
    <button class="song-link card-song-link" data-song-key="${escapeHtml(getSongKey(song))}">${escapeHtml(song.title)}</button>
    <p>${artistLinks(song)}</p>
    <div class="track-tags">
      ${(song.genres || []).slice(0, 2).map((g) => `<span class="tag">${escapeHtml(g)}</span>`).join('')}
      ${song.release_date ? `<span class="tag">${escapeHtml(song.release_date)}</span>` : ''}
    </div>
  `;
  card.querySelector('[data-action="play"]').addEventListener('click', async (e) => {
    e.stopPropagation();
    await playTrack(song, songs);
  });
  card.querySelector('[data-action="queue"]').addEventListener('click', (e) => {
    e.stopPropagation();
    openPlaylistPicker(song, e.currentTarget);
  });
  card.addEventListener('click', () => openSongDetail(song));
  attachArtistLinkEvents(card);
  attachSongLinkEvents(card);
  return card;
}

function createDiscoverRow(song, songs) {
  const row = document.createElement('article');
  row.className = 'genre-song-row';
  row.innerHTML = `
    <div class="genre-song-main">
      <img class="genre-song-cover track-cover-link" data-song-key="${escapeHtml(getSongKey(song))}" src="${escapeHtml(coverOrPlaceholder(song))}" alt="${escapeHtml(song.title)}" />
      <div class="genre-song-meta">
        <button class="song-link row-song-link" data-song-key="${escapeHtml(getSongKey(song))}">${escapeHtml(song.title)}</button>
        <span>${artistLinks(song)}</span>
      </div>
    </div>
    <div class="genre-song-extra">${escapeHtml(song.genres?.join(' · ') || 'NCS')}</div>
    <div class="genre-song-extra">${escapeHtml(song.release_date || '—')}</div>
    <div class="genre-song-actions">
      <button class="ghost-btn play-row-btn" data-action="play">▶</button>
      <button class="ghost-btn play-row-btn" data-action="queue">＋</button>
    </div>
  `;
  row.querySelector('[data-action="play"]').addEventListener('click', async (e) => {
    e.stopPropagation();
    await playTrack(song, songs);
  });
  row.querySelector('[data-action="queue"]').addEventListener('click', (e) => {
    e.stopPropagation();
    addToQueue(song);
  });
  row.addEventListener('click', () => openSongDetail(song));
  attachArtistLinkEvents(row);
  attachSongLinkEvents(row);
  return row;
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
  songs.forEach((song) => container.appendChild(createTrackCard(song, songs)));
}

function renderRail(container, songs) {
  container.innerHTML = '';
  songs.forEach((song, index) => {
    const node = document.createElement('div');
    node.className = 'rail-card';
    node.style.background = `linear-gradient(135deg, rgba(124,92,255,${0.18 + (index % 3) * 0.04}), rgba(255,255,255,.03))`;
    node.innerHTML = `<div><span class="eyebrow">${escapeHtml(song.genres?.[0] || 'NCS')}</span><h3>${escapeHtml(song.title)}</h3><p>${escapeHtml(song.artists.join(', ') || 'Unknown artist')}</p></div>`;
    node.addEventListener('click', () => openSongDetail(song));
    container.appendChild(node);
  });
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
  if (!songs.length) els.genreSongsGrid.innerHTML = '<div class="empty-state">No songs found in this genre.</div>';
  else songs.forEach((song) => els.genreSongsGrid.appendChild(createDiscoverRow(song, songs)));
  els.genreGrid.classList.add('hidden');
  els.genreSongsWrap.classList.remove('hidden');
}


function updateRangeVisual(input, value) {
  if (!input) return;
  const min = Number(input.min || 0);
  const max = Number(input.max || 100);
  const current = Number(value ?? input.value ?? min);
  const pct = max === min ? 0 : ((current - min) / (max - min)) * 100;
  input.style.setProperty('--value', `${Math.max(0, Math.min(100, pct))}%`);
}

function closeGenre() {
  state.activeGenre = null;
  els.genreSongsWrap.classList.add('hidden');
  els.genreGrid.classList.remove('hidden');
}

function setMiniNowPlaying(song) {
  if (!els.miniNowPlaying || !song) return;
  els.miniNowPlaying.innerHTML = `
    <img class="mini-cover track-cover-link" data-song-key="${escapeHtml(getSongKey(song))}" src="${escapeHtml(coverOrPlaceholder(song))}" alt="${escapeHtml(song.title)}" />
    <div class="mini-meta">
      <button class="song-link mini-song-link" data-song-key="${escapeHtml(getSongKey(song))}">${escapeHtml(song.title)}</button>
      <span>${artistLinks(song)}</span>
    </div>`;
  attachArtistLinkEvents(els.miniNowPlaying);
  attachSongLinkEvents(els.miniNowPlaying);
}

function setPlayerUi(song) {
  state.currentTrack = song;
  if (song) {
    els.playerTitle.innerHTML = `<button class="song-link player-song-link" data-song-key="${escapeHtml(getSongKey(song))}">${escapeHtml(song.title)}</button>`;
    els.playerArtist.innerHTML = artistLinks(song);
  } else {
    els.playerTitle.textContent = 'Nothing playing';
    els.playerArtist.textContent = 'Choose a song to start';
  }
  if (els.repeatBtn) els.repeatBtn.classList.toggle('active', state.repeatOne);
  els.playerCover.src = coverOrPlaceholder(song);
  els.playerCover.alt = song?.title || 'TuneDeck';
  els.playerCover.dataset.songKey = song ? getSongKey(song) : '';
  els.likeBtn.textContent = song && isLiked(song) ? '♥' : '♡';
  setMiniNowPlaying(song);
  attachArtistLinkEvents(document.querySelector('.player-left'));
  attachSongLinkEvents(document.querySelector('.player-left'));
  renderQueueDrawer();
}

async function pushRecent(song) {
  const key = getSongKey(song);
  state.recent = [song, ...state.recent.filter((s) => getSongKey(s) !== key)].slice(0, 12);
  await persist('recent', state.recent);
  renderGrid(els.recentGrid, state.recent, 'grid');
}

function addToQueue(song, announce = true) {
  const normalized = normalizeSong(song);
  if (!normalized?.audio_url) return;
  state.queue.push(normalized);
  updateQueueUi();
  if (announce) toast(`Added to queue: ${normalized.title}`);
}

function updateQueueUi() {
  if (els.queueCount) els.queueCount.textContent = String(state.queue.length);
  renderQueueDrawer();
}

async function playTrack(song, queue = []) {
  const normalizedSong = normalizeSong(song);
  if (!normalizedSong?.audio_url) {
    toast('This track has no audio URL.');
    return;
  }
  const normalizedQueue = queue.map(normalizeSong).filter(Boolean);
  if (normalizedQueue.length) {
    state.queue = normalizedQueue;
    state.queueIndex = Math.max(0, state.queue.findIndex((item) => getSongKey(item) === getSongKey(normalizedSong)));
    if (state.queueIndex < 0) state.queueIndex = 0;
  } else if (!state.queue.length) {
    state.queue = [normalizedSong];
    state.queueIndex = 0;
  }
  updateQueueUi();
  await player.play(normalizedSong);
  setPlayerUi(normalizedSong);
  await pushRecent(normalizedSong);
}

function nextTrack(shuffle = false) {
  if (!state.queue.length) return;
  if (state.repeatOne && state.currentTrack && !shuffle) {
    playTrack(state.currentTrack, state.queue);
    return;
  }
  if (shuffle) state.queueIndex = Math.floor(Math.random() * state.queue.length);
  else if (state.queueIndex < state.queue.length - 1) state.queueIndex += 1;
  else if (state.autoplay) state.queueIndex = 0;
  else return;
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
  if (state.currentSongView && getSongKey(state.currentSongView) === key) renderSongDetail(song, false);
}

function renderLiked() {
  renderGrid(els.likedSongsGrid, state.songs.filter((song) => isLiked(song)), 'grid');
}

async function savePlaylist(playlist) {
  const result = await window.ncsDesktop?.updatePlaylist?.(playlist);
  if (Array.isArray(result)) state.playlists = result;
}

function openPlaylistModal() {
  els.playlistModal.classList.remove('hidden');
  els.playlistNameInput.value = '';
  els.playlistNameInput.focus();
}

function closePlaylistModal() {
  els.playlistModal.classList.add('hidden');
}

async function createPlaylist() {
  const name = els.playlistNameInput.value.trim();
  if (!name) {
    toast('Please enter a playlist name.');
    return;
  }
  const playlist = {
    id: crypto.randomUUID(),
    name,
    tracks: [],
  };
  state.playlists.unshift(playlist);
  await savePlaylist(playlist);
  closePlaylistModal();
  if (state.pendingPlaylistSong) {
    const pending = state.pendingPlaylistSong;
    state.pendingPlaylistSong = null;
    await addSongToPlaylist(pending, playlist.id);
  }
  renderPlaylists();
  openPlaylist(playlist.id);
  toast(`Playlist created: ${playlist.name}`);
}


function playlistHasSong(playlist, song) {
  const key = getSongKey(song);
  return new Set((playlist.tracks || []).map(getSongKey)).has(key);
}

async function removeSongFromPlaylist(song, playlistId) {
  const playlist = state.playlists.find((p) => p.id === playlistId);
  if (!playlist) return;
  const key = getSongKey(song);
  playlist.tracks = (playlist.tracks || []).filter((track) => getSongKey(track) !== key);
  await savePlaylist(playlist);
  renderPlaylists();
  if (state.currentPlaylist?.id === playlist.id) openPlaylist(playlist.id, false);
}

function closePlaylistPicker() {
  if (!els.playlistPicker) return;
  els.playlistPicker.classList.add('hidden');
}

function openPlaylistPicker(song, anchorEl = null) {
  if (!els.playlistPicker || !els.playlistPickerList) return;
  if (!state.playlists.length) {
    state.pendingPlaylistSong = song;
    openPlaylistModal();
    return;
  }

  state.pendingPlaylistSong = song;
  els.playlistPickerList.innerHTML = '';
  state.playlists.forEach((playlist) => {
    const checked = playlistHasSong(playlist, song);
    const row = document.createElement('label');
    row.className = 'playlist-picker-item';
    row.innerHTML = `
      <input type="checkbox" ${checked ? 'checked' : ''} />
      ${playlistArtworkMarkup(playlist)}
      <div class="playlist-picker-meta">
        <strong>${escapeHtml(playlist.name)}</strong>
        <span>${(playlist.tracks || []).length} track${(playlist.tracks || []).length === 1 ? '' : 's'}</span>
      </div>
    `;
    const checkbox = row.querySelector('input');
    checkbox.addEventListener('change', async () => {
      if (checkbox.checked) {
        await addSongToPlaylist(song, playlist.id, true);
      } else {
        await removeSongFromPlaylist(song, playlist.id);
        toast(`Removed from ${playlist.name}`);
      }
      renderPlaylistPicker(song);
    });
    els.playlistPickerList.appendChild(row);
  });

  renderPlaylistPicker(song);
  els.playlistPicker.classList.remove('hidden');

  const card = els.playlistPickerCard;
  if (card) {
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      const cardWidth = 320;
      const left = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, rect.left));
      const top = Math.max(60, rect.bottom + 10);
      card.style.left = `${left}px`;
      card.style.top = `${top}px`;
    } else {
      card.style.left = '50%';
      card.style.top = '50%';
      card.style.transform = 'translate(-50%, -50%)';
    }
  }
}

function renderPlaylistPicker(song = state.pendingPlaylistSong) {
  if (!els.playlistPickerList || !song) return;
  const previousScroll = els.playlistPickerList.scrollTop;
  els.playlistPickerList.innerHTML = '';
  state.playlists.forEach((playlist) => {
    const checked = playlistHasSong(playlist, song);
    const row = document.createElement('label');
    row.className = 'playlist-picker-item';
    row.innerHTML = `
      <input type="checkbox" ${checked ? 'checked' : ''} />
      ${playlistArtworkMarkup(playlist)}
      <div class="playlist-picker-meta">
        <strong>${escapeHtml(playlist.name)}</strong>
        <span>${(playlist.tracks || []).length} track${(playlist.tracks || []).length === 1 ? '' : 's'}</span>
      </div>
    `;
    const checkbox = row.querySelector('input');
    checkbox.addEventListener('change', async () => {
      if (checkbox.checked) {
        await addSongToPlaylist(song, playlist.id, true);
      } else {
        await removeSongFromPlaylist(song, playlist.id);
        toast(`Removed from ${playlist.name}`);
      }
      renderPlaylistPicker(song);
    });
    els.playlistPickerList.appendChild(row);
  });
  els.playlistPickerList.scrollTop = previousScroll;
}

async function addSongToPlaylist(song, playlistId = null, silent = false) {
  if (!state.playlists.length) {
    openPlaylistModal();
    return;
  }
  let targetId = playlistId || state.currentPlaylist?.id || state.playlists[0]?.id;
  const playlist = state.playlists.find((p) => p.id === targetId);
  if (!playlist) return;
  const key = getSongKey(song);
  const existingKeys = new Set((playlist.tracks || []).map(getSongKey));
  if (existingKeys.has(key)) {
    if (!silent) toast(`Already in ${playlist.name}`);
    return;
  }
  playlist.tracks = [...(playlist.tracks || []), song];
  await savePlaylist(playlist);
  renderPlaylists();
  if (state.currentPlaylist?.id === playlist.id) openPlaylist(playlist.id, false);
  if (!silent) toast(`Added to ${playlist.name}`);
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
        <button class="playlist-card-main" data-action="open">
          ${playlistArtworkMarkup(playlist)}
        </button>
        <div class="playlist-actions">
          <button class="ghost-btn" data-action="play">▶</button>
          <button class="ghost-btn" data-action="addCurrent">＋</button>
          <button class="ghost-btn" data-action="delete">×</button>
        </div>`;
      item.querySelector('[data-action="open"]').addEventListener('click', () => openPlaylist(playlist.id));
      item.querySelector('[data-action="play"]').addEventListener('click', async (e) => {
        e.stopPropagation();
        const tracks = (playlist.tracks || []).map(normalizeSong).filter(Boolean);
        if (tracks.length) {
          await playTrack(tracks[0], tracks);
          openPlaylist(playlist.id, false);
          toast(`Playing playlist: ${playlist.name}`);
        }
      });
      item.querySelector('[data-action="addCurrent"]').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!state.currentTrack) return toast('Play a song first.');
        await addSongToPlaylist(state.currentTrack, playlist.id);
      });
      item.querySelector('[data-action="delete"]').addEventListener('click', async (e) => {
        e.stopPropagation();
        state.playlists = state.playlists.filter((p) => p.id !== playlist.id);
        const result = await window.ncsDesktop?.deletePlaylist?.(playlist.id);
        if (Array.isArray(result)) state.playlists = result;
        if (state.currentPlaylist?.id === playlist.id) switchView('library');
        renderPlaylists();
        toast('Playlist removed');
      });
      container.appendChild(item);
    });
  };
  renderItems(els.playlistList);
  renderItems(els.libraryPlaylists);
}


function scrollContentToTop() {
  if (els.contentScroll) {
    els.contentScroll.scrollTop = 0;
  }
}

function switchView(view, pushHistory = true) {
  state.view = view;
  Object.entries(els.views).forEach(([name, node]) => node.classList.toggle('active', name === view));
  els.navItems.forEach((btn) => btn.classList.toggle('active', btn.dataset.view === view));
  if (view !== 'genres') closeGenre();
  scrollContentToTop();
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

function openQueueDrawer() {
  state.queueOpen = true;
  try {
    renderQueueDrawer();
  } catch (err) {
    console.error('Queue render failed:', err);
  }
  if (els.queueDrawer) {
    els.queueDrawer.classList.remove('hidden');
    els.queueDrawer.style.display = 'block';
  }
  if (els.queueBackdrop) {
    els.queueBackdrop.classList.remove('hidden');
    els.queueBackdrop.style.display = 'block';
  }
}

function closeQueueDrawer() {
  state.queueOpen = false;
  if (els.queueDrawer) {
    els.queueDrawer.classList.add('hidden');
    els.queueDrawer.style.display = 'none';
  }
  if (els.queueBackdrop) {
    els.queueBackdrop.classList.add('hidden');
    els.queueBackdrop.style.display = 'none';
  }
}

function toggleQueueDrawer(force) {
  if (typeof force === 'boolean') {
    return force ? openQueueDrawer() : closeQueueDrawer();
  }
  return state.queueOpen ? closeQueueDrawer() : openQueueDrawer();
}

function toggleSettingsDrawer(force) {
  state.settingsOpen = typeof force === 'boolean' ? force : !state.settingsOpen;
  els.settingsDrawer.classList.toggle('hidden', !state.settingsOpen);
  els.settingsBackdrop.classList.toggle('hidden', !state.settingsOpen);
}

function removeFromQueue(index) {
  if (index < 0 || index >= state.queue.length) return;
  state.queue.splice(index, 1);
  if (state.queueIndex >= state.queue.length) state.queueIndex = state.queue.length - 1;
  if (state.queue.length === 0) state.queueIndex = -1;
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
  if (!els.queueNowPlaying || !els.queueList) return;
  els.queueNowPlaying.innerHTML = current
    ? `<strong>Now playing</strong><span><button class="song-link queue-song-link" data-song-key="${escapeHtml(getSongKey(current))}">${escapeHtml(current.title)}</button> · ${escapeHtml(songSubtitle(current))}</span>`
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
        <img class="track-cover-link" data-song-key="${escapeHtml(getSongKey(song))}" src="${escapeHtml(coverOrPlaceholder(song))}" alt="${escapeHtml(song.title)}" />
        <div>
          <button class="song-link queue-song-link" data-song-key="${escapeHtml(getSongKey(song))}">${escapeHtml(song.title)}</button>
          <span>${artistLinks(song)}</span>
        </div>
      </div>
      <div class="queue-item-actions">
        <button class="ghost-btn" data-action="up">↑</button>
        <button class="ghost-btn" data-action="down">↓</button>
        <button class="ghost-btn" data-action="play">▶</button>
        <button class="ghost-btn" data-action="remove">✕</button>
      </div>`;
    row.querySelector('[data-action="up"]').addEventListener('click', (e) => { e.stopPropagation(); moveQueueItem(index, -1); });
    row.querySelector('[data-action="down"]').addEventListener('click', (e) => { e.stopPropagation(); moveQueueItem(index, 1); });
    row.querySelector('[data-action="play"]').addEventListener('click', async (e) => { e.stopPropagation(); state.queueIndex = index; await playTrack(song, state.queue); });
    row.querySelector('[data-action="remove"]').addEventListener('click', (e) => { e.stopPropagation(); removeFromQueue(index); });
    row.addEventListener('click', async () => { state.queueIndex = index; await playTrack(song, state.queue); });
    attachArtistLinkEvents(row);
    attachSongLinkEvents(row);
    els.queueList.appendChild(row);
  });
  attachSongLinkEvents(els.queueNowPlaying);
}

function getSongsByArtist(artist) {
  return state.songs.filter((song) => song.artists.some((name) => name.toLowerCase() === artist.toLowerCase()));
}

function openSongDetail(song, pushHistory = true) {
  if (!song) return;
  state.currentSongView = song;
  switchView('song', pushHistory);
  scrollContentToTop();
  scrollContentToTop();
  els.songHero.innerHTML = `
    <img class="detail-cover apple-detail-cover" src="${escapeHtml(coverOrPlaceholder(song))}" alt="${escapeHtml(song.title)}" />
    <div class="detail-copy apple-detail-copy">
      <span class="eyebrow">Single</span>
      <h2>${escapeHtml(song.title)}</h2>
      <div class="detail-subline">${artistLinks(song)}</div>
      <p class="detail-muted">${escapeHtml(song.genres.join(' · ') || 'NCS Release')}${song.release_date ? ` · ${escapeHtml(song.release_date)}` : ''}</p>
    </div>`;
  attachArtistLinkEvents(els.songHero);
  els.songMeta.innerHTML = `
    <div class="detail-stat"><span>Versions</span><strong>${escapeHtml(song.versions.join(', ') || 'Regular')}</strong></div>
    <div class="detail-stat"><span>Release</span><strong>${song.release_date ? escapeHtml(song.release_date) : 'NCS release'}</strong></div>`;
  els.songActions.innerHTML = `
    <button class="primary-btn" id="songPlayNow">Play now</button>
    <button class="secondary-btn" id="songQueueAdd">Add to queue</button>
    <button class="secondary-btn" id="songPlaylistAdd">Add to playlist</button>`;
  $('songPlayNow')?.addEventListener('click', () => playTrack(song, state.queue.length ? state.queue : state.songs));
  $('songQueueAdd')?.addEventListener('click', () => addToQueue(song));
  $('songPlaylistAdd')?.addEventListener('click', (e) => openPlaylistPicker(song, e.currentTarget));
  els.songDescription.innerHTML = song.description ? `<p>${escapeHtml(song.description)}</p>` : '<div class="empty-state">No additional description came back from the API for this song yet.</div>';
  const related = state.songs
    .filter((item) => getSongKey(item) !== getSongKey(song))
    .filter((item) => item.genres.some((genre) => song.genres.includes(genre)) || item.artists.some((artist) => song.artists.includes(artist)))
    .slice(0, 8);
  renderGrid(els.relatedSongs, related, 'grid');
}

function renderSongDetail(song, pushHistory = true) {
  openSongDetail(song, pushHistory);
}


function openArtist(name, pushHistory = true) {
  state.currentArtist = name;
  const songs = getSongsByArtist(name);
  switchView('artist', pushHistory);
  scrollContentToTop();
  els.artistHero.innerHTML = `
    <span class="eyebrow">Artist</span>
    <h2>${escapeHtml(name)}</h2>
    <p>${songs.length} track${songs.length === 1 ? '' : 's'} in your current API library.</p>`;
  renderArtistSongs(name);
}

function renderArtistSongs(name) {
  const songs = getSongsByArtist(name);
  els.artistSongs.innerHTML = '';
  if (!songs.length) return (els.artistSongs.innerHTML = '<div class="empty-state">No songs found for this artist.</div>');
  songs.forEach((song) => els.artistSongs.appendChild(createDiscoverRow(song, songs)));
}

function openPlaylist(playlistId, pushHistory = true) {
  const playlist = state.playlists.find((p) => p.id === playlistId);
  if (!playlist) return;
  state.currentPlaylist = playlist;
  switchView('playlist', pushHistory);
  scrollContentToTop();
  renderPlaylistDetail();
}

function renderPlaylistDetail() {
  const playlist = state.currentPlaylist;
  if (!playlist) return;
  const tracks = (playlist.tracks || []).map(normalizeSong).filter(Boolean);
  const totalSeconds = tracks.reduce((sum, song) => sum + estimateDurationSeconds(song), 0);
  els.playlistHero.innerHTML = `
    <div class="playlist-hero-grid">
      ${playlistArtworkMarkup(playlist)}
      <div class="playlist-hero-copy">
        <span class="eyebrow">Playlist</span>
        <h2>${escapeHtml(playlist.name)}</h2>
        <p>${tracks.length} track${tracks.length === 1 ? '' : 's'} • ${escapeHtml(formatPlaylistDuration(totalSeconds))}</p>
        <div class="playlist-hero-meta">Saved locally in TuneDeck</div>
      </div>
    </div>`;
  els.playlistSongs.innerHTML = '';
  if (!tracks.length) return (els.playlistSongs.innerHTML = '<div class="empty-state">This playlist is empty. Add songs from a song detail page or with the current-track add button in the sidebar.</div>');
  tracks.forEach((song, index) => {
    const row = createDiscoverRow(song, tracks);
    row.classList.add('playlist-song-row');
    row.insertAdjacentHTML('afterbegin', `<div class="playlist-row-index">${index + 1}</div>`);
    els.playlistSongs.appendChild(row);
  });
}

function updateWindowButtons() {
  if (!window.ncsDesktop?.isWindowMaximized) return;
  window.ncsDesktop.isWindowMaximized().then((maxed) => {
    if (els.windowMaxBtn) els.windowMaxBtn.textContent = maxed ? '❐' : '□';
  }).catch(() => {});
}


function renderBridgeStatus(status = {}) {
  state.audioEngine.mode = status.mode || state.audioEngine.mode;
  state.audioEngine.localReady = status.localOutputReady ?? state.audioEngine.localReady;
  state.audioEngine.broadcastReady = status.broadcastOutputReady ?? state.audioEngine.broadcastReady;
}

async function refreshBridgeStatus() {
  if (!window.ncsDesktop?.bridgeStatus) return;
  try {
    const status = await window.ncsDesktop.bridgeStatus();
    renderBridgeStatus(status || {});
  } catch (err) {
    console.error(err);
  }
}

function bindEvents() {
  els.navItems.forEach((btn) => btn.addEventListener('click', () => switchView(btn.dataset.view)));
  els.switchers.forEach((btn) => btn.addEventListener('click', () => switchView(btn.dataset.switchView)));
  els.heroPlayBtn?.addEventListener('click', async () => { if (state.songs.length) await playTrack(state.songs[0], state.songs); });
  els.closeGenreSongs.addEventListener('click', closeGenre);
  els.searchBtn.addEventListener('click', () => doSearch(els.searchInput.value));
  els.searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(els.searchInput.value); });
  els.globalSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      els.searchInput.value = els.globalSearch.value;
      switchView('search');
      doSearch(els.globalSearch.value);
    }
  });
  els.createPlaylistBtn.addEventListener('click', openPlaylistModal);
  els.confirmPlaylistBtn.addEventListener('click', createPlaylist);
  els.cancelPlaylistBtn.addEventListener('click', closePlaylistModal);
  els.closePlaylistModalBtn.addEventListener('click', closePlaylistModal);
  els.closeLicenseModalBtn.addEventListener('click', closeLicenseModal);
  els.licenseModal.addEventListener('click', (e) => { if (e.target === els.licenseModal) closeLicenseModal(); });
  els.playlistModal.addEventListener('click', (e) => { if (e.target === els.playlistModal) closePlaylistModal(); });
  els.playlistNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') createPlaylist(); });
  els.closePlaylistPickerBtn?.addEventListener('click', closePlaylistPicker);
  els.newPlaylistFromPickerBtn?.addEventListener('click', () => {
    closePlaylistPicker();
    openPlaylistModal();
  });
  els.playlistPicker?.addEventListener('click', (e) => { if (e.target === els.playlistPicker) closePlaylistPicker(); });
  els.repeatBtn?.addEventListener('click', async () => {
    state.repeatOne = !state.repeatOne;
    els.repeatBtn.classList.toggle('active', state.repeatOne);
    els.repeatBtn.textContent = state.repeatOne ? '↻1' : '↺';
    await persist('repeatOne', state.repeatOne);
    toast(state.repeatOne ? 'Repeat one enabled' : 'Repeat one disabled');
  });
  els.backBtn.addEventListener('click', () => goHistory(-1));
  els.forwardBtn.addEventListener('click', () => goHistory(1));
  els.filterChips.forEach((chip) => chip.addEventListener('click', () => {
    els.filterChips.forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    state.displayMode = chip.dataset.display;
    renderGrid(els.discoverGrid, state.songs, state.displayMode);
  }));
  els.playPauseBtn.addEventListener('click', async () => {
    const playerStatus = player.getStatus();
    if (!playerStatus?.track?.audio_url && !state.currentTrack) return state.songs.length ? playTrack(state.songs[0], state.songs) : null;
    if (playerStatus?.state === 'paused') await player.resume();
    else await player.pause();
  });
  els.nextBtn.addEventListener('click', () => nextTrack());
  els.prevBtn.addEventListener('click', prevTrack);
  els.shuffleBtn.addEventListener('click', () => nextTrack(true));
  els.openQueueBtn?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openQueueDrawer(); });
  els.queueBtn?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openQueueDrawer(); });
  els.closeQueueBtn?.addEventListener('click', () => closeQueueDrawer());
  els.queueBackdrop?.addEventListener('click', () => closeQueueDrawer());
  els.clearQueueBtn?.addEventListener('click', clearQueue);
  els.openSettingsBtn.addEventListener('click', () => toggleSettingsDrawer(true));
  els.closeSettingsBtn.addEventListener('click', () => toggleSettingsDrawer(false));
  els.settingsBackdrop.addEventListener('click', () => toggleSettingsDrawer(false));
  els.openGplLicenseBtn.addEventListener('click', () => openLicenseModal('GNU GPL v3', './licenses/gpl.html'));
  els.openNcsLicenseBtn.addEventListener('click', () => openLicenseModal('NCS / Music terms', './licenses/ncs-license.html'));
  els.volumeBar.addEventListener('input', async () => { const volume = Number(els.volumeBar.value) / 100; updateRangeVisual(els.volumeBar); await player.setVolume(volume); await persist('volume', volume); });
  els.likeBtn.addEventListener('click', toggleLike);
  els.playerCoverButton.addEventListener('click', () => { if (state.currentTrack) openSongDetail(state.currentTrack); });
  els.progressBar.addEventListener('input', async () => { const status = player.getStatus(); updateRangeVisual(els.progressBar); if (status.duration) await player.seek((Number(els.progressBar.value) / 100) * status.duration); });  player.on('status', (status) => {
    els.currentTime.textContent = formatTime(status.position || 0);
    els.durationTime.textContent = formatTime(status.duration || 0);
    els.progressBar.value = status.duration ? Math.round(((status.position || 0) / status.duration) * 100) : 0;
    updateRangeVisual(els.progressBar);
    els.playPauseBtn.textContent = status.state === 'playing' ? '❚❚' : '▶';
  });
  player.on('error', (error) => {
    console.error(error);
    toast(error?.message || 'Playback could not be started.');
  });
  player.on('broadcast-status', (broadcastStatus) => {
    state.audioEngine.broadcastReady = !!broadcastStatus?.connected;
  });
  audio.addEventListener('ended', () => { if (state.repeatOne) playTrack(state.currentTrack, state.queue); else nextTrack(); });
  els.artistPlayBtn.addEventListener('click', async () => {
    if (!state.currentArtist) return;
    const songs = getSongsByArtist(state.currentArtist);
    if (songs.length) await playTrack(songs[0], songs);
  });
  els.playlistPlayBtn.addEventListener('click', async () => {
    const tracks = (state.currentPlaylist?.tracks || []).map(normalizeSong).filter(Boolean);
    if (tracks.length) await playTrack(tracks[0], tracks);
  });
  els.windowMinBtn?.addEventListener('click', () => window.ncsDesktop?.minimizeWindow?.());
  els.windowMaxBtn?.addEventListener('click', async () => { await window.ncsDesktop?.toggleMaximizeWindow?.(); updateWindowButtons(); });
  els.windowCloseBtn?.addEventListener('click', () => window.ncsDesktop?.closeWindow?.());
  window.addEventListener('resize', updateWindowButtons);
}

async function init() {
  bindEvents();
  setupInfiniteScroll();
  await loadPersistedState();
  if (els.repeatBtn) { els.repeatBtn.classList.toggle('active', state.repeatOne); els.repeatBtn.textContent = state.repeatOne ? '↻1' : '↺'; }
  updateRangeVisual(els.progressBar, els.progressBar.value);
  updateRangeVisual(els.volumeBar, els.volumeBar.value);
  updateWindowButtons();
  await player.setVolume(Number(els.volumeBar.value || 75) / 100);
  try {
    const bridgeState = await window.ncsDesktop?.bridgeStart?.();
    renderBridgeStatus(bridgeState || {});
    window.setTimeout(refreshBridgeStatus, 150);
  } catch (err) {
    console.error(err);
  }
  try {
    const firstPage = await fetchSongsPage(1, state.songsPerPage);
    state.songs = firstPage.rows;
    state.songsPage = firstPage.page;
    state.songsTotal = firstPage.total || firstPage.rows.length;
    state.visibleSongs = firstPage.rows.slice(0, Math.min(150, firstPage.rows.length));
    state.queue = [...firstPage.rows];
    state.queueIndex = firstPage.rows.length ? 0 : -1;
    updateQueueUi();
    renderHomeSections();
    renderDiscoverFeed();
    renderGenres();
    renderLiked();
    renderPlaylists();
    toast(firstPage.rows.length ? `Loaded ${firstPage.rows.length} tracks initially` : 'No songs came back from your API.');
  } catch (err) {
    console.error(err);
    const message = err?.message ? escapeHtml(err.message) : 'Unknown error';
    toast('Could not load library data. Check API URL or CORS.');
    els.recentGrid.innerHTML = `<div class="empty-state">Unable to load music library at the moment.<br><small>${message}</small></div>`;
    els.discoverGrid.innerHTML = '<div class="empty-state">Please check https://api.schmittdev.org/ncsplayer/public/api.php</div>';
  }
}

init();
