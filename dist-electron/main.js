import { app as o, BrowserWindow as l, ipcMain as a, dialog as _ } from "electron";
import { fileURLToPath as h } from "node:url";
import e from "node:path";
import { promises as t } from "fs";
const d = e.dirname(h(import.meta.url));
process.env.APP_ROOT = e.join(d, "..");
const s = process.env.VITE_DEV_SERVER_URL, E = e.join(process.env.APP_ROOT, "dist-electron"), p = e.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = s ? e.join(process.env.APP_ROOT, "public") : p;
let r;
function m() {
  r = new l({
    icon: e.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
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
  l.getAllWindows().length === 0 && m();
});
o.whenReady().then(m);
a.handle("readFile", async (c, i) => {
  try {
    return await t.mkdir(e.dirname(i), { recursive: !0 }), await t.readFile(i, "utf8");
  } catch (n) {
    throw n.code === "ENOENT", n;
  }
});
a.handle("writeFile", async (c, i, n) => {
  try {
    await t.mkdir(e.dirname(i), { recursive: !0 }), await t.writeFile(i, n, "utf8");
  } catch (w) {
    throw w;
  }
});
a.handle("selectFile", async (c, i) => {
  const n = await _.showOpenDialog({
    properties: ["openFile", "createDirectory"],
    filters: [
      { name: "Markdown", extensions: ["md"] }
    ]
  });
  return n.canceled ? null : n.filePaths[0];
});
export {
  E as MAIN_DIST,
  p as RENDERER_DIST,
  s as VITE_DEV_SERVER_URL
};
