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

// 添加认证相关 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 认证相关
  authLogin: (request: any) => {
    return ipcRenderer.invoke('authentication:login', request);
  },
  
  authLogout: (sessionId?: string) => {
    return ipcRenderer.invoke('authentication:logout', sessionId || '');
  },
  
  authVerifySession: (sessionId: string) => {
    return ipcRenderer.invoke('authentication:verify-session', sessionId);
  },
  
  // 账户相关
  accountDeactivate: (request: any) => {
    return ipcRenderer.invoke('account:deactivate', request);
  },
  
  // 登录相关
  login: (credentials: { username: string; password: string }) => {
    return ipcRenderer.invoke('authentication:login', credentials);
  },
  
  logout: () => {
    return ipcRenderer.invoke('authentication:logout');
  },

  // 窗口控制
  windowControl: (command: string) => {
    return ipcRenderer.send('window-control', command);
  },

  // 监听登录结果
  onLoginResult: (callback: (result: any) => void) => {
    ipcRenderer.on('login:result', (_event, result) => callback(result));
  },

  // 监听错误消息
  onLoginError: (callback: (error: string) => void) => {
    ipcRenderer.on('login:show-error', (_event, error) => callback(error));
  },

  // 监听状态变化
  onLoginState: (callback: (state: string) => void) => {
    ipcRenderer.on('login:set-state', (_event, state) => callback(state));
  },

  // 监听表单重置
  onResetForm: (callback: () => void) => {
    ipcRenderer.on('login:reset-form', callback);
  },

  // 发送登录状态到主进程
  sendLoginSuccess: (userData: any) => {
    ipcRenderer.send('login:success', userData);
  },

  sendLoginFailed: (error: string) => {
    ipcRenderer.send('login:failed', error);
  },

  sendLoginCancelled: () => {
    ipcRenderer.send('login:cancelled');
  },
  
  // 通用功能
  readClipboard: () => {
    return ipcRenderer.invoke('readClipboard');
  },
  
  writeClipboard: (text: string) => {
    return ipcRenderer.invoke('writeClipboard', text);
  },
  
  readClipboardFiles: () => {
    return ipcRenderer.invoke('readClipboardFiles');
  },
  
  openExternalUrl: (url: string) => {
    return ipcRenderer.invoke('open-external-url', url);
  },
  
  getAutoLaunch: () => {
    return ipcRenderer.invoke('get-auto-launch');
  },
  
  setAutoLaunch: (enable: boolean) => {
    return ipcRenderer.invoke('set-auto-launch', enable);
  },
  
  getModuleStatus: () => {
    return ipcRenderer.invoke('get-module-status');
  },

  // 移除监听器
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
});