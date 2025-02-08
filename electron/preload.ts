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
  }

  // You can expose other APTs you need here.
  // ...
})
