"use strict";
const electron = require("electron");
const path = require("path");
electron.contextBridge.exposeInMainWorld("electron", {
  platform: process.platform,
  ipcRenderer: {
    send: (channel, data) => electron.ipcRenderer.send(channel, data),
    on: (channel, func) => electron.ipcRenderer.on(channel, func),
    invoke: (channel, ...args) => electron.ipcRenderer.invoke(channel, ...args)
  },
  createFolder: (currentPath) => electron.ipcRenderer.invoke("createFolder", currentPath),
  createFile: (currentPath, content) => electron.ipcRenderer.invoke("createFile", currentPath, content),
  deleteFileOrFolder: (path2, isDirectory) => electron.ipcRenderer.invoke("deleteFileOrFolder", path2, isDirectory),
  renameFileOrFolder: (oldPath, newPath) => electron.ipcRenderer.invoke("renameFileOrFolder", oldPath, newPath),
  readFile: (path2) => electron.ipcRenderer.invoke("readFile", path2),
  writeFile: (path2, content) => electron.ipcRenderer.invoke("writeFile", path2, content),
  selectFolder: () => electron.ipcRenderer.invoke("selectFolder"),
  selectFile: () => electron.ipcRenderer.invoke("selectFile"),
  getRootDir: () => electron.ipcRenderer.invoke("getRootDir"),
  readClipboard: () => electron.ipcRenderer.invoke("readClipboard"),
  writeClipboard: (text) => electron.ipcRenderer.invoke("writeClipboard", text),
  readClipboardFiles: () => electron.ipcRenderer.invoke("readClipboardFiles"),
  writeClipboardFiles: (filePaths) => electron.ipcRenderer.invoke("writeClipboardFiles", filePaths),
  refreshFolder: (path2) => electron.ipcRenderer.invoke("refreshFolder", path2),
  windowControl: (command) => electron.ipcRenderer.send("window-control", command),
  path: {
    join: (...args) => path.join(...args),
    dirname: (p) => path.dirname(p),
    basename: (p) => path.basename(p)
  }
});
