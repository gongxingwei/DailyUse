import { ipcRenderer, contextBridge } from 'electron';
import path from 'node:path';

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('shared', {
  ipcRenderer: {
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
  },
  path: {
    join(...args: Parameters<typeof path.join>) {
      return path.join(...args);
    },
    basename(...args: Parameters<typeof path.basename>) {
      return path.basename(...args);
    },
    dirname(...args: Parameters<typeof path.dirname>) {
      return path.dirname(...args);
    },
    extname(...args: Parameters<typeof path.extname>) {
      return path.extname(...args);
    },
    resolve(...args: Parameters<typeof path.resolve>) {
      return path.resolve(...args);
    }
  },
  

  // You can expose other APTs you need here.
  // ...
})
contextBridge.exposeInMainWorld('git', {
  initialize: (workingDirectory: string) => 
    ipcRenderer.invoke('git:initialize', workingDirectory),
  init: (workingDirectory: string) => 
    ipcRenderer.invoke('git:init', workingDirectory),
  getStatus: () => 
    ipcRenderer.invoke('git:status'),
  add: (files: string[]) => ipcRenderer.invoke('git:add', files),
  stage: (files: string[]) => 
    ipcRenderer.invoke('git:stage', files),
  
  unstage: (files: string[]) => 
    ipcRenderer.invoke('git:unstage', files),
  checkIsRepo: (workingDirectory: string) => 
    ipcRenderer.invoke('git:checkIsRepo', workingDirectory),
  commit: (message: string) => 
    ipcRenderer.invoke('git:commit', message),
  onStatusChanged: (callback: (status: any) => void) => {
    ipcRenderer.on('git:status-changed', (_event, status) => callback(status))
  },
  stageAll: () => ipcRenderer.invoke('git:stageAll'),
  unstageAll: () => ipcRenderer.invoke('git:unstageAll'),
  discardAll: () => ipcRenderer.invoke('git:discardAll'),
  getLog: () => ipcRenderer.invoke('git:getLog')
  
})

contextBridge.exposeInMainWorld('env', {
  argv: process.argv
});