var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { BrowserWindow, ipcMain, dialog, app, shell, globalShortcut, screen, clipboard, nativeImage, Tray, Menu } from "electron";
import { fileURLToPath } from "node:url";
import path$1 from "node:path";
import path, { join } from "path";
import { exec } from "child_process";
import fs from "fs/promises";
class PluginManager {
  constructor() {
    __publicField(this, "plugins", /* @__PURE__ */ new Map());
    __publicField(this, "initialized", false);
  }
  async register(plugin) {
    if (this.plugins.has(plugin.metadata.name)) {
      console.error(`[PluginManager] 错误: 插件 ${plugin.metadata.name} 已经注册过了`);
      throw new Error(`Plugin ${plugin.metadata.name} is already registered`);
    }
    this.plugins.set(plugin.metadata.name, plugin);
    if (this.initialized) {
      await plugin.init();
    }
  }
  async unregister(pluginName) {
    const plugin = this.plugins.get(pluginName);
    if (plugin) {
      await plugin.destroy();
      this.plugins.delete(pluginName);
    }
  }
  async initializeAll() {
    this.initialized = true;
    for (const [name, plugin] of this.plugins) {
      try {
        await plugin.init();
      } catch (error) {
        console.error(`[PluginManager] 插件 ${name} 初始化失败:`, error);
      }
    }
    console.log("[PluginManager] 所有插件初始化完成");
  }
  async destroyAll() {
    for (const plugin of this.plugins.values()) {
      await plugin.destroy();
    }
    this.plugins.clear();
    this.initialized = false;
  }
  getPlugin(name) {
    console.log(`[PluginManager] 获取插件: ${name}`);
    return this.plugins.get(name);
  }
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }
}
const MAIN_DIST$1 = process.env.MAIN_DIST ?? path.join(process.env.APP_ROOT ?? process.cwd(), "dist-electron");
class QuickLauncherMainPlugin {
  constructor() {
    __publicField(this, "metadata", {
      name: "quickLauncher",
      version: "1.0.0",
      description: "Quick application launcher with shortcuts",
      author: "bakersean"
    });
    __publicField(this, "quickLauncherWindow", null);
  }
  createQuickLauncherWindow() {
    if (this.quickLauncherWindow) {
      if (this.quickLauncherWindow.isVisible()) {
        this.quickLauncherWindow.hide();
      } else {
        this.quickLauncherWindow.show();
        this.quickLauncherWindow.focus();
      }
      return;
    }
    const preloadPath = path.resolve(MAIN_DIST$1, "quickLauncher_preload.mjs");
    this.quickLauncherWindow = new BrowserWindow({
      width: 1024,
      height: 576,
      frame: false,
      skipTaskbar: true,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        sandbox: false,
        preload: preloadPath,
        webSecurity: true
      }
    });
    this.quickLauncherWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
          ]
        }
      });
    });
    this.quickLauncherWindow.once("ready-to-show", () => {
      if (this.quickLauncherWindow) {
        this.quickLauncherWindow.show();
        this.quickLauncherWindow.focus();
      }
    });
    if (process.env.VITE_DEV_SERVER_URL) {
      this.quickLauncherWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/src/plugins/quickLauncher/index.html`);
    } else {
      this.quickLauncherWindow.loadFile(
        path.join(process.env.APP_ROOT || "", "dist/src/plugins/quickLauncher/index.html")
      );
    }
    this.quickLauncherWindow.on("closed", () => {
      this.quickLauncherWindow = null;
    });
  }
  async init() {
    this.registerIpcHandlers();
    this.registerShortcuts();
  }
  registerIpcHandlers() {
    ipcMain.handle("launch-application", async (_, path2) => {
      return new Promise((resolve, reject) => {
        const options = { windowsHide: false };
        exec(`start "" "${path2}"`, options, (error) => {
          if (error) {
            console.error("[QuickLauncherMain] 启动应用失败:", error);
            reject(error);
          } else {
            console.log("[QuickLauncherMain] 启动应用成功");
            resolve(true);
          }
        });
      });
    });
    ipcMain.handle("select-file", async () => {
      const result = await dialog.showOpenDialog({
        properties: ["openFile"]
      });
      return result;
    });
    ipcMain.handle("get-file-icon", async (_event, filePath) => {
      try {
        const icon = await app.getFileIcon(filePath, {
          size: "large"
          // 可选值: 'small', 'normal', 'large'
        });
        return icon.toDataURL();
      } catch (error) {
        console.error("获取文件图标失败:", error);
        return null;
      }
    });
    ipcMain.handle("get-shortcut-target-path", async (_, shortcutPath) => {
      try {
        const normalizedPath = path.win32.normalize(shortcutPath);
        const target = shell.readShortcutLink(normalizedPath);
        const targetPath = target.target;
        return targetPath;
      } catch (error) {
        console.error("Failed to read shortcut target path:", error);
        return "";
      }
    });
  }
  registerShortcuts() {
    globalShortcut.register("Alt+Space", () => {
      if (this.quickLauncherWindow) {
        if (this.quickLauncherWindow.isVisible()) {
          this.quickLauncherWindow.hide();
        } else {
          this.quickLauncherWindow.show();
          this.quickLauncherWindow.focus();
        }
      } else {
        this.createQuickLauncherWindow();
      }
    });
  }
  async destroy() {
    globalShortcut.unregister("Alt+Space");
    ipcMain.removeHandler("launch-application");
    ipcMain.removeHandler("select-file");
    if (this.quickLauncherWindow) {
      this.quickLauncherWindow.close();
      this.quickLauncherWindow = null;
    }
  }
}
function registerFileSystemHandlers() {
  ipcMain.handle("open-file-explorer", async () => {
    shell.openPath(path.join(__dirname, "..", "..", "..", "src"));
  });
  ipcMain.handle("read-folder", async (_, folderPath) => {
    try {
      const files = await fs.readdir(folderPath, { withFileTypes: true });
      return files.map((file) => ({
        name: file.name,
        path: path.join(folderPath, file.name),
        isDirectory: file.isDirectory(),
        key: path.join(folderPath, file.name)
      }));
    } catch (error) {
      console.error("Error reading folder:", error);
      throw error;
    }
  });
  ipcMain.handle("select-folder", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"]
    });
    if (result.canceled) {
      return null;
    } else {
      const folderPath = result.filePaths[0];
      const files = await fs.readdir(folderPath).then(
        (fileNames) => Promise.all(
          fileNames.map(async (fileName) => {
            const filePath = path.join(folderPath, fileName);
            const stats = await fs.lstat(filePath);
            return {
              name: fileName,
              path: filePath,
              isDirectory: stats.isDirectory()
            };
          })
        )
      );
      return { folderPath, files };
    }
  });
  ipcMain.handle("create-folder", async (_event, filePath) => {
    await fs.mkdir(filePath, { recursive: true });
  });
  ipcMain.handle("create-file", async (_event, filePath, content = "") => {
    await fs.writeFile(filePath, content, "utf8");
  });
  ipcMain.handle("rename-file-or-folder", async (_event, oldPath, newPath) => {
    try {
      const exists = await fs.access(newPath).then(() => true).catch(() => false);
      if (exists) {
        const { response } = await dialog.showMessageBox({
          type: "question",
          buttons: ["覆盖", "取消"],
          defaultId: 1,
          title: "确认覆盖",
          message: "目标已存在，是否覆盖？",
          detail: `目标路径: ${newPath}`
        });
        if (response === 1) {
          return false;
        }
      }
      await fs.rename(oldPath, newPath);
      return true;
    } catch (error) {
      console.error("Rename error:", error);
      throw error;
    }
  });
  ipcMain.handle("delete-file-or-folder", async (_event, path2, isDirectory) => {
    if (isDirectory) {
      await shell.trashItem(path2);
    } else {
      await shell.trashItem(path2);
    }
  });
  ipcMain.handle("read-file", async (_event, filePath) => {
    return await fs.readFile(filePath, "utf8");
  });
  ipcMain.handle("write-file", async (_event, filePath, content) => {
    try {
      await fs.writeFile(filePath, content, "utf8");
      return true;
    } catch (error) {
      console.error("写入文件失败:", error);
      throw error;
    }
  });
  ipcMain.handle("get-folder-tree", async (_event, folderPath) => {
    const folderTreeData = await generateTree(folderPath);
    return folderTreeData;
  });
  async function generateTree(dir) {
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });
      const children = await Promise.all(
        items.map(async (item) => {
          const fullPath = path.join(dir, item.name);
          const fileType = item.isDirectory() ? "directory" : path.extname(item.name).slice(1) || "file";
          if (item.isDirectory()) {
            return {
              title: item.name,
              key: fullPath,
              fileType,
              children: await generateTree(fullPath)
            };
          } else {
            return {
              title: item.name,
              key: fullPath,
              fileType,
              isLeaf: true
            };
          }
        })
      );
      return children.filter(Boolean);
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error);
      return [];
    }
  }
  ipcMain.handle("refresh-folder", async (_event, folderPath) => {
    const folderTreeData = await generateTree(folderPath);
    return { folderTreeData, folderPath };
  });
}
const notificationWindows = /* @__PURE__ */ new Map();
const NOTIFICATION_WIDTH = 320;
const NOTIFICATION_HEIGHT = 120;
const NOTIFICATION_MARGIN = 10;
function getNotificationPosition() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth } = primaryDisplay.workAreaSize;
  const x = screenWidth - NOTIFICATION_WIDTH - NOTIFICATION_MARGIN;
  const y = NOTIFICATION_MARGIN + notificationWindows.size * (NOTIFICATION_HEIGHT + NOTIFICATION_MARGIN);
  return { x, y };
}
function reorderNotifications() {
  let index = 0;
  for (const [, window] of notificationWindows) {
    const y = NOTIFICATION_MARGIN + index * (NOTIFICATION_HEIGHT + NOTIFICATION_MARGIN);
    window.setPosition(window.getPosition()[0], y);
    index++;
  }
}
function setupNotificationHandlers(mainWindow, MAIN_DIST2, RENDERER_DIST2, VITE_DEV_SERVER_URL2) {
  ipcMain.handle("show-notification", async (_event, options) => {
    if (!mainWindow) {
      return;
    }
    if (notificationWindows.has(options.id)) {
      const existingWindow = notificationWindows.get(options.id);
      existingWindow == null ? void 0 : existingWindow.close();
      notificationWindows.delete(options.id);
      reorderNotifications();
    }
    const { x, y } = getNotificationPosition();
    const notificationWindow = new BrowserWindow({
      width: NOTIFICATION_WIDTH,
      height: NOTIFICATION_HEIGHT,
      x,
      y,
      frame: false,
      transparent: true,
      resizable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      show: false,
      webPreferences: {
        preload: path$1.join(MAIN_DIST2, "main_preload.mjs"),
        contextIsolation: true,
        nodeIntegration: true,
        webSecurity: false
      }
    });
    notificationWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": ["default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"]
        }
      });
    });
    notificationWindows.set(options.id, notificationWindow);
    notificationWindow.on("closed", () => {
      notificationWindows.delete(options.id);
      reorderNotifications();
    });
    const queryParams = new URLSearchParams({
      id: options.id,
      title: options.title,
      body: options.body,
      urgency: options.urgency || "normal"
    });
    if (options.icon) {
      queryParams.append("icon", options.icon);
    }
    if (options.actions) {
      queryParams.append("actions", encodeURIComponent(JSON.stringify(options.actions)));
    }
    const notificationUrl = VITE_DEV_SERVER_URL2 ? `${VITE_DEV_SERVER_URL2}#/notification?${queryParams.toString()}` : `file://${RENDERER_DIST2}/index.html#/notification?${queryParams.toString()}`;
    await notificationWindow.loadURL(notificationUrl);
    notificationWindow.show();
    return options.id;
  });
  ipcMain.on("close-notification", (_event, id) => {
    const window = notificationWindows.get(id);
    if (window && !window.isDestroyed()) {
      window.close();
    }
  });
  ipcMain.on("notification-action", (_event, id, action) => {
    const window = notificationWindows.get(id);
    if (window && !window.isDestroyed()) {
      if (action.type === "confirm" || action.type === "cancel") {
        window.close();
      }
      mainWindow.webContents.send("notification-action-received", id, action);
    }
  });
}
app.setName("DailyUse");
app.commandLine.appendSwitch("disable-webgl");
app.commandLine.appendSwitch("disable-webgl2");
app.commandLine.appendSwitch("use-gl", "swiftshader");
app.commandLine.appendSwitch("no-sandbox");
app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-software-rasterizer");
app.commandLine.appendSwitch("disable-gpu-compositing");
app.commandLine.appendSwitch("disable-gpu-rasterization");
app.commandLine.appendSwitch("disable-gpu-sandbox");
app.commandLine.appendSwitch("--no-sandbox");
app.disableHardwareAcceleration();
const __dirname$1 = path$1.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path$1.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path$1.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path$1.join(process.env.APP_ROOT, "dist");
process.env.MAIN_DIST = MAIN_DIST;
process.env.RENDERER_DIST = RENDERER_DIST;
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path$1.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
let tray = null;
let pluginManager = null;
function createWindow() {
  win = new BrowserWindow({
    frame: false,
    icon: path$1.join(process.env.VITE_PUBLIC, "DailyUse.svg"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: true,
      preload: path$1.join(MAIN_DIST, "main_preload.mjs"),
      additionalArguments: ["--enable-features=SharedArrayBuffer"]
    },
    width: 1400,
    height: 800
  });
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": ["default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"]
      }
    });
  });
  pluginManager = new PluginManager();
  if (win) {
    pluginManager.register(new QuickLauncherMainPlugin());
    pluginManager.initializeAll();
  }
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path$1.join(RENDERER_DIST, "index.html"));
  }
  win.setMinimumSize(800, 600);
  createTray(win);
  win.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      win == null ? void 0 : win.hide();
    }
    return false;
  });
}
function createTray(win2) {
  const icon = nativeImage.createFromPath(join(__dirname$1, "../public/DailyUse-16.png"));
  tray = new Tray(icon);
  tray.setToolTip("DailyUse");
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "显示主窗口",
      click: () => {
        win2.show();
      }
    },
    {
      label: "设置",
      click: () => {
        win2.show();
        win2.webContents.send("navigate-to", "/setting");
      }
    },
    { type: "separator" },
    {
      label: "退出",
      click: () => {
        app.quit();
      }
    }
  ]);
  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    win2.show();
  });
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  createWindow();
  registerFileSystemHandlers();
  if (win) {
    setupNotificationHandlers(win, MAIN_DIST, RENDERER_DIST, VITE_DEV_SERVER_URL);
  }
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
ipcMain.handle("readClipboard", () => {
  return clipboard.readText();
});
ipcMain.handle("writeClipboard", (_event, text) => {
  clipboard.writeText(text);
});
ipcMain.handle("readClipboardFiles", () => {
  const formats = clipboard.availableFormats();
  if (formats.includes("FileNameW")) {
    return clipboard.read("FileNameW").split("\0").filter(Boolean);
  }
  return [];
});
ipcMain.on("window-control", (_event, command) => {
  switch (command) {
    case "minimize":
      win == null ? void 0 : win.minimize();
      break;
    case "maximize":
      if (win == null ? void 0 : win.isMaximized()) {
        win == null ? void 0 : win.unmaximize();
      } else {
        win == null ? void 0 : win.maximize();
      }
      break;
    case "close":
      win == null ? void 0 : win.close();
      break;
  }
});
ipcMain.handle("get-auto-launch", () => {
  return app.getLoginItemSettings().openAtLogin;
});
ipcMain.handle("set-auto-launch", (_event, enable) => {
  if (process.platform === "win32") {
    app.setLoginItemSettings({
      openAtLogin: enable,
      path: process.execPath
    });
  }
  return app.getLoginItemSettings().openAtLogin;
});
app.on("before-quit", () => {
  app.isQuitting = true;
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
