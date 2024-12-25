import { app as o, BrowserWindow as c, ipcMain as a, dialog as _ } from "electron";
import { fileURLToPath as h } from "node:url";
import e from "node:path";
import { promises as t } from "fs";
const d = e.dirname(h(import.meta.url));
process.env.APP_ROOT = e.join(d, "..");
const s = process.env.VITE_DEV_SERVER_URL, v = e.join(process.env.APP_ROOT, "dist-electron"), p = e.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = s ? e.join(process.env.APP_ROOT, "public") : p;
let r;
function m() {
  r = new c({
    icon: e.join(process.env.VITE_PUBLIC, "DailyUse.svg"),
    webPreferences: {
      webSecurity: !1,
      preload: e.join(d, "preload.mjs")
    },
    width: 1400,
    height: 800
  }), r.webContents.on("did-finish-load", () => {
    r == null || r.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), s ? r.loadURL(s) : r.loadFile(e.join(p, "index.html")), r.setMinimumSize(800, 600);
}
o.on("window-all-closed", () => {
  process.platform !== "darwin" && (o.quit(), r = null);
});
o.on("activate", () => {
  c.getAllWindows().length === 0 && m();
});
o.whenReady().then(m);
a.handle("readFile", async (l, n) => {
  try {
    return await t.mkdir(e.dirname(n), { recursive: !0 }), await t.readFile(n, "utf8");
  } catch (i) {
    throw i.code === "ENOENT", i;
  }
});
a.handle("writeFile", async (l, n, i) => {
  try {
    await t.mkdir(e.dirname(n), { recursive: !0 }), await t.writeFile(n, i, "utf8");
  } catch (w) {
    throw w;
  }
});
a.handle("selectFile", async (l, n) => {
  const i = await _.showOpenDialog({
    properties: ["openFile", "createDirectory"],
    filters: [
      { name: "Markdown", extensions: ["md"] }
    ]
  });
  return i.canceled ? null : i.filePaths[0];
});
export {
  v as MAIN_DIST,
  p as RENDERER_DIST,
  s as VITE_DEV_SERVER_URL
};
