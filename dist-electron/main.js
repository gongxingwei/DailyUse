import { app, BrowserWindow, ipcMain, dialog, clipboard, screen } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { promises } from "fs";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
let popupWindow;
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
}
function createPopupWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const popupWidth = 950;
  const popupHeight = 1400;
  popupWindow = new BrowserWindow({
    width: popupWidth,
    height: popupHeight,
    frame: true,
    title: "弹窗",
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    parent: win || void 0,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      webSecurity: false,
      nodeIntegration: true
    }
  });
  const x = width - popupWidth - 10;
  const y = height - popupHeight - 10;
  popupWindow.setBounds({ x, y, width: popupWidth, height: popupHeight });
  if (process.env.VITE_DEV_SERVER_URL) {
    popupWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/#/popup`);
  } else {
    popupWindow.loadFile(path.join(__dirname, "../dist/index.html"), { hash: "popup" });
  }
  popupWindow.on("closed", () => {
    popupWindow = null;
  });
  popupWindow.once("ready-to-show", () => {
    popupWindow == null ? void 0 : popupWindow.show();
    popupWindow == null ? void 0 : popupWindow.setTitle("弹窗");
    popupWindow == null ? void 0 : popupWindow.webContents.openDevTools();
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
  ipcMain.on("newPopup", () => {
    if (!popupWindow) {
      createPopupWindow();
    } else {
      popupWindow.show();
    }
  });
  ipcMain.on("closePopup", () => {
    if (popupWindow) {
      popupWindow.close();
      popupWindow = null;
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
ipcMain.handle("getRootDir", async (event) => {
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
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
