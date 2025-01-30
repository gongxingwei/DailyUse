import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    ipcRenderer: {
      send: (channel: string, data: any) => {
        ipcRenderer.send(channel, data)
      },
      on: (channel: string, func: Function) => {
        ipcRenderer.on(channel, (_event, ...args) => func(...args))
      },
      invoke: (channel: string, ...args: any[]) => {
        return ipcRenderer.invoke(channel, ...args)
      },
      removeListener: (channel: string, func: Function) => {
        ipcRenderer.removeListener(channel, func as any)
      }
    }
  }
)
