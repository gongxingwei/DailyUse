import { app, BrowserWindow, ipcMain, dialog, clipboard, nativeImage, Tray, Menu, screen } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { promises } from "fs";
import { join } from "path";
const notificationWindows = /* @__PURE__ */ new Map();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
let tray = null;
function createWindow() {
  win = new BrowserWindow({
    frame: false,
    icon: path.join(process.env.VITE_PUBLIC, "DailyUse.svg"),
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.mjs")
    },
    width: 1400,
    height: 800
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
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
  const icon = nativeImage.createFromPath(join(__dirname, "../public/DailyUse-16.png"));
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
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
ipcMain.handle("createFolder", async (_event, filePath) => {
  await promises.mkdir(filePath, { recursive: true });
});
ipcMain.handle("createFile", async (_event, filePath, content = "") => {
  await promises.writeFile(filePath, content, "utf8");
});
ipcMain.handle("deleteFileOrFolder", async (_event, path2, isDirectory) => {
  if (isDirectory) {
    await promises.rm(path2, { recursive: true, force: true });
  } else {
    await promises.unlink(path2);
  }
});
ipcMain.handle("selectFolder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"]
  });
  if (result.canceled) {
    return null;
  } else {
    const folderPath = result.filePaths[0];
    const files = await promises.readdir(folderPath).then(
      (fileNames) => Promise.all(
        fileNames.map(async (fileName) => {
          const filePath = path.join(folderPath, fileName);
          const stats = await promises.lstat(filePath);
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
ipcMain.handle("readFile", async (_event, filePath) => {
  return await promises.readFile(filePath, "utf8");
});
ipcMain.handle("writeFile", async (_event, filePath, content) => {
  try {
    await promises.writeFile(filePath, content, "utf8");
    return true;
  } catch (error) {
    console.error("写入文件失败:", error);
    throw error;
  }
});
ipcMain.handle("getRootDir", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"]
  });
  if (!result.canceled) {
    const directoryPath = result.filePaths[0];
    const folderTreeData = await generateTree(directoryPath);
    return { folderTreeData, directoryPath };
  }
  return null;
});
async function generateTree(dir) {
  try {
    const items = await promises.readdir(dir, { withFileTypes: true });
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
ipcMain.handle("show-notification", async (_event, options) => {
  console.log("主进程收到显示通知请求:", options);
  if (!win) {
    console.error("主窗口未创建，无法显示通知");
    return;
  }
  if (notificationWindows.has(options.id)) {
    console.log("关闭已存在的相同ID通知:", options.id);
    const existingWindow = notificationWindows.get(options.id);
    existingWindow == null ? void 0 : existingWindow.close();
    notificationWindows.delete(options.id);
    reorderNotifications();
  }
  const { x, y } = getNotificationPosition();
  console.log("新通知位置:", { x, y });
  console.log("创建通知窗口...");
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
      preload: path.join(MAIN_DIST, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: true,
      webSecurity: false
    }
  });
  notificationWindows.set(options.id, notificationWindow);
  console.log("通知窗口已存储，当前活动通知数:", notificationWindows.size);
  notificationWindow.once("ready-to-show", () => {
    console.log("通知窗口准备就绪");
    if (!notificationWindow.isDestroyed()) {
      notificationWindow.show();
      console.log("通知窗口已显示");
    }
  });
  notificationWindow.on("closed", () => {
    console.log("通知窗口已关闭:", options.id);
    notificationWindows.delete(options.id);
    reorderNotifications();
  });
  try {
    const url = VITE_DEV_SERVER_URL ? `${VITE_DEV_SERVER_URL}#/notification?${new URLSearchParams(options)}` : `file://${path.join(RENDERER_DIST, "index.html")}#/notification?${new URLSearchParams(options)}`;
    console.log("加载通知页面:", url);
    if (VITE_DEV_SERVER_URL) {
      await notificationWindow.loadURL(url);
    } else {
      await notificationWindow.loadFile(path.join(RENDERER_DIST, "index.html"), {
        hash: `/notification?${new URLSearchParams(options)}`
      });
    }
    console.log("通知页面加载成功");
  } catch (error) {
    console.error("加载通知页面失败:", error);
    notificationWindow.close();
    return options.id;
  }
  return options.id;
});
ipcMain.on("notification-action", (_event, id, action) => {
  const window = notificationWindows.get(id);
  if (window) {
    window.close();
    notificationWindows.delete(id);
    reorderNotifications();
  }
  win == null ? void 0 : win.webContents.send("notification-action", id, action);
});
ipcMain.on("close-notification", (_event, id) => {
  const window = notificationWindows.get(id);
  if (window) {
    window.close();
    notificationWindows.delete(id);
    reorderNotifications();
    win == null ? void 0 : win.webContents.send("notification-action", id, { text: "close", type: "action" });
  }
});
ipcMain.handle("renameFileOrFolder", async (_event, oldPath, newPath) => {
  try {
    const exists = await promises.access(newPath).then(() => true).catch(() => false);
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
    await promises.rename(oldPath, newPath);
    return true;
  } catch (error) {
    console.error("Rename error:", error);
    throw error;
  }
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
ipcMain.handle("writeClipboardFiles", (_event, filePaths) => {
  clipboard.writeBuffer("FileNameW", Buffer.from(filePaths.join("\0") + "\0", "ucs2"));
});
ipcMain.handle("refreshFolder", async (_event, directoryPath) => {
  const folderTreeData = await generateTree(directoryPath);
  return { folderTreeData, directoryPath };
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
