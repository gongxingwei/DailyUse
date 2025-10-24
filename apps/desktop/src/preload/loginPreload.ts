import { contextBridge, ipcRenderer } from 'electron';

/**
 * 登录窗口的 preload 脚本
 * 提供登录窗口与主进程的安全通信接口
 */

// 为渲染进程提供登录相关API
contextBridge.exposeInMainWorld('electronAPI', {
  // 登录认证相关
  login: (credentials: { username: string; password: string }) => {
    return ipcRenderer.invoke('authentication:login', credentials);
  },

  // 认证相关API
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
  },
});

// 为了兼容性，也暴露 shared 对象
contextBridge.exposeInMainWorld('shared', {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
    on: (channel: string, listener: (event: any, ...args: any[]) => void) =>
      ipcRenderer.on(channel, listener),
    off: (channel: string, listener: (event: any, ...args: any[]) => void) =>
      ipcRenderer.off(channel, listener),
    removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
    send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
  },
});

// 为开发环境提供调试功能
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('electronDev', {
    openDevTools: () => {
      // 在登录窗口中打开开发者工具
      console.log('Opening dev tools for login window');
    },
  });
}

// 页面加载完成后的初始化
window.addEventListener('DOMContentLoaded', () => {
  console.log('🔐 [LoginPreload] 登录窗口预加载脚本已加载');
});
