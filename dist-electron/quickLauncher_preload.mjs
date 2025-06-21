"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld(
  "shared",
  {
    ipcRenderer: {
      send: (channel, data) => {
        electron.ipcRenderer.send(channel, data);
      },
      on: (channel, func) => {
        electron.ipcRenderer.on(channel, (_event, ...args) => func(...args));
      },
      invoke: (channel, ...args) => {
        return electron.ipcRenderer.invoke(channel, ...args);
      },
      removeListener: (channel, func) => {
        electron.ipcRenderer.removeListener(channel, func);
      }
    }
  }
);
