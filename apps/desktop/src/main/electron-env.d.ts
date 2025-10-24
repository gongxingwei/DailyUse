/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string;
    /** /dist/ or /public/ */
    VITE_PUBLIC: string;
  }
}

// Used in Renderer process, expose in `preload.ts`

// declare global {
//   interface Window {
//     electron: import('./electron-api').ElectronAPI;
//   }
// }

interface Window {
  ipcRenderer: import('electron').IpcRenderer;
  env?: {
    argv?: string[];
  };
}

interface File {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: File[];
  expanded?: boolean;
}

interface TreeNode {
  title: string;
  key: string;
  fileType: string;
  children?: TreeNode[];
  isLeaf?: boolean;
}

declare namespace Electron {
  interface App {
    isQuitting?: boolean;
  }
}

interface Window {
  shared: SharedAPI;
}
