const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const { spawn } = require('node:child_process');
const Store = require('electron-store').default;

const store = new Store({
  defaults: {
    playlists: [],
    liked: [],
    volume: 0.75,
    recent: [],
    autoplay: true,
  },
});

let bridgeProcess = null;
let bridgeState = {
  bridgeReady: false,
  pluginConnected: false,
  localOutputReady: true,
  broadcastOutputReady: false,
  sampleRate: 48000,
  channels: 2,
  mode: 'dual-output-prep',
  running: false,
};

function startBridgeProcess() {
  if (bridgeProcess) return bridgeState;
  const scriptPath = path.join(__dirname, 'bridge', 'tunedeck-audio-bridge-mock.js');
  bridgeProcess = spawn(process.execPath, [scriptPath], {
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  bridgeState.running = true;

  bridgeProcess.stdout.setEncoding('utf8');
  bridgeProcess.stdout.on('data', (chunk) => {
    const lines = chunk.split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      try {
        const msg = JSON.parse(line);
        if (msg.type === 'status' || msg.type === 'pong' || msg.type === 'ack') {
          bridgeState = {
            ...bridgeState,
            ...msg,
            running: true,
          };
        }
      } catch {}
    }
  });

  bridgeProcess.on('exit', () => {
    bridgeProcess = null;
    bridgeState = {
      ...bridgeState,
      bridgeReady: false,
      pluginConnected: false,
      broadcastOutputReady: false,
      running: false,
    };
  });

  return bridgeState;
}

function stopBridgeProcess() {
  if (bridgeProcess) {
    bridgeProcess.kill();
    bridgeProcess = null;
  }
  bridgeState = {
    ...bridgeState,
    bridgeReady: false,
    pluginConnected: false,
    broadcastOutputReady: false,
    running: false,
  };
  return bridgeState;
}

function sendBridgeMessage(message) {
  if (!bridgeProcess || !bridgeProcess.stdin.writable) return false;
  bridgeProcess.stdin.write(JSON.stringify(message) + '\n');
  return true;
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1520,
    height: 960,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: '#070a11',
    icon: path.join(__dirname, 'build', 'icon.png'),
    titleBarStyle: 'hidden',
    titleBarOverlay: process.platform !== 'darwin'
      ? {
          color: '#0a0f18',
          symbolColor: '#f3f5f7',
          height: 42,
        }
      : false,
    trafficLightPosition: { x: 18, y: 14 },
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
}

app.whenReady().then(() => {
  startBridgeProcess();
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

ipcMain.handle('window:minimize', () => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  win?.minimize();
  return true;
});
ipcMain.handle('window:toggleMaximize', () => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  if (!win) return false;
  if (win.isMaximized()) win.unmaximize();
  else win.maximize();
  return win.isMaximized();
});
ipcMain.handle('window:close', () => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  win?.close();
  return true;
});
ipcMain.handle('window:isMaximized', () => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  return !!win?.isMaximized();
});


ipcMain.handle('audio-engine:status', () => ({
  mode: 'dual-output-prep',
  localReady: true,
  broadcastReady: false,
  bridgeConnected: false,
}));


ipcMain.handle('bridge:start', () => {
  startBridgeProcess();
  return bridgeState;
});

ipcMain.handle('bridge:stop', () => stopBridgeProcess());

ipcMain.handle('bridge:status', () => bridgeState);

ipcMain.handle('bridge:connect-plugin-mock', () => {
  startBridgeProcess();
  sendBridgeMessage({ type: 'bridge.connect' });
  return bridgeState;
});

ipcMain.handle('bridge:disconnect-plugin-mock', () => {
  if (bridgeProcess) sendBridgeMessage({ type: 'bridge.disconnect' });
  return bridgeState;
});
