const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ncsDesktop', {
  getStore: (key) => ipcRenderer.invoke('store:get', key),
  setStore: (key, value) => ipcRenderer.invoke('store:set', key, value),
  updatePlaylist: (playlist) => ipcRenderer.invoke('store:updatePlaylist', playlist),
  deletePlaylist: (playlistId) => ipcRenderer.invoke('store:deletePlaylist', playlistId),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('window:toggleMaximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isWindowMaximized: () => ipcRenderer.invoke('window:isMaximized'),
});
