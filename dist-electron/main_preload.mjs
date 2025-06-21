"use strict";
const electron = require("electron");
const path = require("node:path");
electron.contextBridge.exposeInMainWorld("shared", {
  ipcRenderer: {
    on(...args) {
      const [channel, listener] = args;
      return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
    },
    off(...args) {
      const [channel, ...omit] = args;
      return electron.ipcRenderer.off(channel, ...omit);
    },
    send(...args) {
      const [channel, ...omit] = args;
      return electron.ipcRenderer.send(channel, ...omit);
    },
    invoke(...args) {
      const [channel, ...omit] = args;
      return electron.ipcRenderer.invoke(channel, ...omit);
    }
  },
  path: {
    join(...args) {
      return path.join(...args);
    },
    basename(...args) {
      return path.basename(...args);
    },
    dirname(...args) {
      return path.dirname(...args);
    },
    extname(...args) {
      return path.extname(...args);
    },
    resolve(...args) {
      return path.resolve(...args);
    }
  }
  // You can expose other APTs you need here.
  // ...
});
electron.contextBridge.exposeInMainWorld("git", {
  initialize: (workingDirectory) => electron.ipcRenderer.invoke("git:initialize", workingDirectory),
  init: (workingDirectory) => electron.ipcRenderer.invoke("git:init", workingDirectory),
  getStatus: () => electron.ipcRenderer.invoke("git:status"),
  add: (files) => electron.ipcRenderer.invoke("git:add", files),
  stage: (files) => electron.ipcRenderer.invoke("git:stage", files),
  unstage: (files) => electron.ipcRenderer.invoke("git:unstage", files),
  checkIsRepo: (workingDirectory) => electron.ipcRenderer.invoke("git:checkIsRepo", workingDirectory),
  commit: (message) => electron.ipcRenderer.invoke("git:commit", message),
  onStatusChanged: (callback) => {
    electron.ipcRenderer.on("git:status-changed", (_event, status) => callback(status));
  },
  stageAll: () => electron.ipcRenderer.invoke("git:stageAll"),
  unstageAll: () => electron.ipcRenderer.invoke("git:unstageAll"),
  discardAll: () => electron.ipcRenderer.invoke("git:discardAll"),
  getLog: () => electron.ipcRenderer.invoke("git:getLog")
});
