import { ipcRenderer, contextBridge } from 'electron';
import { join, dirname, basename } from 'path';

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  ipcRenderer: {
    send: (channel: string, data: any) => ipcRenderer.send(channel, data),
    on: (channel: string, func: (...args: any[]) => void) => ipcRenderer.on(channel, func),
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  },
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
  },
} as ElectronAPI);
