import { app, BrowserWindow, ipcMain, dialog } from "electron";
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
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "DailyUse.svg"),
    webPreferences: {
      webSecurity: false,
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
app.whenReady().then(createWindow);
ipcMain.handle("readFile", async (_event, filePath) => {
  try {
    await promises.mkdir(path.dirname(filePath), { recursive: true });
    return await promises.readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      throw error;
    }
    throw error;
  }
});
ipcMain.handle("writeFile", async (_event, filePath, content) => {
  try {
    await promises.mkdir(path.dirname(filePath), { recursive: true });
    await promises.writeFile(filePath, content, "utf8");
  } catch (error) {
    throw error;
  }
});
ipcMain.handle("selectFile", async (_event, _options) => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile", "createDirectory"],
    filters: [
      { name: "Markdown", extensions: ["md"] }
    ]
  });
  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
