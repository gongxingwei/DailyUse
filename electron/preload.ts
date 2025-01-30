import { ipcRenderer, contextBridge } from 'electron';
import { join, dirname, basename } from 'path';

// Define the ElectronAPI interface
interface ElectronAPI {
  platform: string;
  ipcRenderer: {
    send(channel: string, data: any): void;
    on(channel: string, func: (...args: any[]) => void): void;
    invoke(channel: string, ...args: any[]): Promise<any>;
    removeAllListeners(channel: string): void;
  };
  createFolder(currentPath: string): Promise<void>;
  createFile(currentPath: string, content: string): Promise<void>;
  deleteFileOrFolder(path: string, isDirectory: boolean): Promise<void>;
  renameFileOrFolder(oldPath: string, newPath: string): Promise<void>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  selectFolder(): Promise<string>;
  selectFile(): Promise<string>;
  getRootDir(): Promise<string>;
  readClipboard(): Promise<string>;
  writeClipboard(text: string): Promise<void>;
  readClipboardFiles(): Promise<string[]>;
  writeClipboardFiles(filePaths: string[]): Promise<void>;
  refreshFolder(path: string): Promise<void>;
  windowControl(command: string): void;
  getAutoLaunch(): Promise<boolean>;
  setAutoLaunch(enable: boolean): Promise<void>;
  path: {
    join(...args: string[]): string;
    dirname(p: string): string;
    basename(p: string): string;
  };
  quickLauncher: {
    add: (name: string, command: string) => Promise<void>;
    remove: (name: string) => Promise<void>;
    list: () => Promise<string[]>;
  };
}

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  ipcRenderer: {
    send: (channel: string, data: any) => ipcRenderer.send(channel, data),
    on: (channel: string, func: (...args: any[]) => void) => {
      ipcRenderer.on(channel, (_event, ...args) => func(...args));
    },
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
    removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
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
  getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),
  setAutoLaunch: (enable: boolean) => ipcRenderer.invoke('set-auto-launch', enable),
  path: {
    join: (...args: string[]) => join(...args),
    dirname: (p: string) => dirname(p),
    basename: (p: string) => basename(p)
  },
  quickLauncher: {
    add: (name: string, command: string) => ipcRenderer.invoke('quick-launcher-add', name, command),
    remove: (name: string) => ipcRenderer.invoke('quick-launcher-remove', name),
    list: () => ipcRenderer.invoke('quick-launcher-list'),
  },
} as ElectronAPI);
