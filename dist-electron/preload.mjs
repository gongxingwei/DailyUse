"use strict";
const electron = require("electron");
const path = require("path");
electron.contextBridge.exposeInMainWorld("electron", {
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
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
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
  // You can expose other APTs you need here.
  // ...
});
