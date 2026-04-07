const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const Store = require('electron-store').default;

const store = new Store({
  defaults: {
    playlists: [],
    liked: [],
    volume: 0.75,
    recent: [],
    autoplay: true
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1520,
    height: 960,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: '#09090b',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, 'src', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('store:get', (_event, key) => store.get(key));
ipcMain.handle('store:set', (_event, key, value) => {
  store.set(key, value);
  return true;
});
ipcMain.handle('store:updatePlaylist', (_event, playlist) => {
  const playlists = store.get('playlists', []);
  const idx = playlists.findIndex((p) => p.id === playlist.id);
  if (idx >= 0) playlists[idx] = playlist;
  else playlists.unshift(playlist);
  store.set('playlists', playlists);
  return playlists;
});
ipcMain.handle('store:deletePlaylist', (_event, playlistId) => {
  const playlists = store.get('playlists', []).filter((p) => p.id !== playlistId);
  store.set('playlists', playlists);
  return playlists;
});
