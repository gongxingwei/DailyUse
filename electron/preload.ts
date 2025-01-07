import { ipcRenderer, contextBridge } from 'electron';
import { join, dirname, basename } from 'path';

contextBridge.exposeInMainWorld('electron', {
  createFolder: (currentPath: string) => ipcRenderer.invoke('createFolder', currentPath),
  createFile: (currentPath: string, content: string) => ipcRenderer.invoke('createFile', currentPath, content),
  deleteFileOrFolder: (path: string, isDirectory: boolean) => ipcRenderer.invoke('deleteFileOrFolder', path, isDirectory),
  renameFileOrFolder: (oldPath: string, newPath: string) => ipcRenderer.invoke('renameFileOrFolder', oldPath, newPath),
  readFile: (path: string) => ipcRenderer.invoke('readFile', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('writeFile', path, content),
  selectFolder: () => ipcRenderer.invoke('selectFolder'),
  selectFile: () => ipcRenderer.invoke('selectFile'),
  getRootDir: () => ipcRenderer.invoke('getRootDir'),
  readClipboard: () => ipcRenderer.invoke('readClipboard'),
  writeClipboard: (text: string) => ipcRenderer.invoke('writeClipboard', text),
  readClipboardFiles: () => ipcRenderer.invoke('readClipboardFiles'),
  writeClipboardFiles: (filePaths: string[]) => ipcRenderer.invoke('writeClipboardFiles', filePaths),
  refreshFolder: (path: string) => ipcRenderer.invoke('refreshFolder', path),
  windowControl: (command: string) => ipcRenderer.send('window-control', command),
  path: {
    join: (...args: string[]) => join(...args),
    dirname: (p: string) => dirname(p),
    basename: (p: string) => basename(p)
  }
} as ElectronAPI);


// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})