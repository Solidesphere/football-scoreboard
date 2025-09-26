const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, callback) =>
    ipcRenderer.on(channel, (_, ...args) => callback(...args)),
  removeListener: (channel, callback) =>
    ipcRenderer.removeListener(channel, callback),
  handle: (channel, data) => ipcRenderer.invoke(channel, data),
});
