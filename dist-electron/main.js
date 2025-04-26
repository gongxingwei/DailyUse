var Fl = Object.defineProperty;
var Ml = (t, e, r) => e in t ? Fl(t, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : t[e] = r;
var ce = (t, e, r) => Ml(t, typeof e != "symbol" ? e + "" : e, r);
import { BrowserWindow as Yt, ipcMain as _, dialog as jt, app as se, shell as yt, globalShortcut as si, screen as Rl, protocol as Nl, clipboard as Ar, nativeImage as Pl, Tray as Al, Menu as Ll } from "electron";
import { fileURLToPath as Wl } from "node:url";
import Pe from "node:path";
import * as S from "path";
import $, { resolve as ii, join as La, relative as $l, sep as Ul } from "path";
import { exec as zl, spawn as Vl } from "child_process";
import M, { readdir as Wa, realpath as br, lstat as Vn, stat as Br, open as jl } from "fs/promises";
import { Buffer as Hl } from "buffer";
import ql, { EventEmitter as Gl } from "events";
import $a, { unwatchFile as ai, watchFile as Bl, watch as Zl, stat as Yl } from "fs";
import Ua from "tty";
import Jl from "util";
import Ql, { type as Kl } from "os";
import { EventEmitter as Xl } from "node:events";
import { Readable as ef } from "stream";
import tf, { randomFillSync as rf, randomUUID as nf } from "crypto";
class sf {
  constructor() {
    ce(this, "plugins", /* @__PURE__ */ new Map());
    ce(this, "initialized", !1);
  }
  async register(e) {
    if (this.plugins.has(e.metadata.name))
      throw console.error(`[PluginManager] 错误: 插件 ${e.metadata.name} 已经注册过了`), new Error(`Plugin ${e.metadata.name} is already registered`);
    this.plugins.set(e.metadata.name, e), this.initialized && await e.init();
  }
  async unregister(e) {
    const r = this.plugins.get(e);
    r && (await r.destroy(), this.plugins.delete(e));
  }
  async initializeAll() {
    this.initialized = !0;
    for (const [e, r] of this.plugins)
      try {
        await r.init();
      } catch (n) {
        console.error(`[PluginManager] 插件 ${e} 初始化失败:`, n);
      }
    console.log("[PluginManager] 所有插件初始化完成");
  }
  async destroyAll() {
    for (const e of this.plugins.values())
      await e.destroy();
    this.plugins.clear(), this.initialized = !1;
  }
  getPlugin(e) {
    return console.log(`[PluginManager] 获取插件: ${e}`), this.plugins.get(e);
  }
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }
}
class af {
  constructor() {
    ce(this, "metadata", {
      name: "quickLauncher",
      version: "1.0.0",
      description: "Quick application launcher with shortcuts",
      author: "bakersean"
    });
    ce(this, "quickLauncherWindow", null);
  }
  createQuickLauncherWindow() {
    if (this.quickLauncherWindow) {
      this.quickLauncherWindow.isVisible() ? this.quickLauncherWindow.hide() : (this.quickLauncherWindow.show(), this.quickLauncherWindow.focus());
      return;
    }
    const e = $.resolve(hn, "quickLauncher_preload.mjs");
    this.quickLauncherWindow = new Yt({
      width: 1024,
      height: 576,
      frame: !1,
      skipTaskbar: !0,
      show: !1,
      webPreferences: {
        nodeIntegration: !0,
        contextIsolation: !0,
        sandbox: !1,
        preload: e,
        webSecurity: !0
      }
    }), this.quickLauncherWindow.webContents.session.webRequest.onHeadersReceived((r, n) => {
      n({
        responseHeaders: {
          ...r.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
          ]
        }
      });
    }), this.quickLauncherWindow.once("ready-to-show", () => {
      this.quickLauncherWindow && (this.quickLauncherWindow.show(), this.quickLauncherWindow.focus());
    }), Zt ? this.quickLauncherWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/src/plugins/quickLauncher/index.html`) : this.quickLauncherWindow.loadFile(
      $.join(ur, "src/plugins/quickLauncher/index.html")
    ), this.quickLauncherWindow.on("closed", () => {
      this.quickLauncherWindow = null;
    });
  }
  async init() {
    this.registerIpcHandlers(), this.registerShortcuts();
  }
  registerIpcHandlers() {
    _.handle("launch-application", async (e, r) => new Promise((n, s) => {
      const i = { windowsHide: !1 };
      zl(`start "" "${r}"`, i, (a) => {
        a ? (console.error("[QuickLauncherMain] 启动应用失败:", a), s(a)) : (console.log("[QuickLauncherMain] 启动应用成功"), n(!0));
      });
    })), _.handle("select-file", async () => await jt.showOpenDialog({
      properties: ["openFile"]
    })), _.handle("get-file-icon", async (e, r) => {
      try {
        return (await se.getFileIcon(r, {
          size: "large"
          // 可选值: 'small', 'normal', 'large'
        })).toDataURL();
      } catch (n) {
        return console.error("获取文件图标失败:", n), null;
      }
    }), _.handle("get-link-file-target-path", async (e, r) => {
      try {
        const n = $.win32.normalize(r);
        return yt.readShortcutLink(n).target;
      } catch (n) {
        return console.error("Failed to read shortcut target path:", n), "";
      }
    }), _.handle("reveal-in-explorer", async (e, r) => {
      try {
        return yt.showItemInFolder(r), !0;
      } catch (n) {
        return console.error("Failed to reveal in explorer:", n), !1;
      }
    }), _.handle("hide-window", async () => {
      var e;
      try {
        return (e = this.quickLauncherWindow) == null || e.hide(), !0;
      } catch (r) {
        return console.error("failed to hide window", r), !1;
      }
    });
  }
  registerShortcuts() {
    si.register("Alt+Space", () => {
      this.quickLauncherWindow ? this.quickLauncherWindow.isVisible() ? this.quickLauncherWindow.hide() : (this.quickLauncherWindow.show(), this.quickLauncherWindow.focus()) : this.createQuickLauncherWindow();
    });
  }
  async destroy() {
    si.unregister("Alt+Space"), _.removeHandler("launch-application"), _.removeHandler("select-file"), this.quickLauncherWindow && (this.quickLauncherWindow.close(), this.quickLauncherWindow = null);
  }
}
function of() {
  _.handle("open-file-explorer", async () => {
    yt.openPath($.join(__dirname, "..", "..", "..", "src"));
  }), _.handle("read-folder", async (e, r) => {
    try {
      return (await M.readdir(r, { withFileTypes: !0 })).map((s) => ({
        name: s.name,
        path: $.join(r, s.name),
        isDirectory: s.isDirectory(),
        key: $.join(r, s.name)
      }));
    } catch (n) {
      throw console.error("Error reading folder:", n), n;
    }
  }), _.handle("select-folder", async () => {
    const e = await jt.showOpenDialog({
      properties: ["openDirectory"]
    });
    if (e.canceled)
      return null;
    {
      const r = e.filePaths[0], n = await M.readdir(r).then(
        (s) => Promise.all(
          s.map(async (i) => {
            const a = $.join(r, i), o = await M.lstat(a);
            return {
              name: i,
              path: a,
              isDirectory: o.isDirectory()
            };
          })
        )
      );
      return { folderPath: r, files: n };
    }
  }), _.handle("file-or-folder-exists", async (e, r) => {
    try {
      return await M.access(r), !0;
    } catch {
      return !1;
    }
  }), _.handle("create-folder", async (e, r) => {
    await M.mkdir(r, { recursive: !0 });
  }), _.handle("create-file", async (e, r, n = "") => {
    await M.writeFile(r, n, "utf8");
  }), _.handle("rename-file-or-folder", async (e, r, n) => {
    try {
      if (await M.access(n).then(() => !0).catch(() => !1)) {
        const { response: i } = await jt.showMessageBox({
          type: "question",
          buttons: ["覆盖", "取消"],
          defaultId: 1,
          title: "确认覆盖",
          message: "目标已存在，是否覆盖？",
          detail: `目标路径: ${n}`
        });
        if (i === 1)
          return !1;
      }
      return await M.rename(r, n), !0;
    } catch (s) {
      throw console.error("Rename error:", s), s;
    }
  }), _.handle("delete-file-or-folder", async (e, r, n) => {
    n ? await yt.trashItem(r) : await yt.trashItem(r);
  }), _.handle("read-file", async (e, r, n = "utf-8") => {
    try {
      return await M.readFile(r, n);
    } catch (s) {
      throw console.error("读取文件失败:", s), s;
    }
  }), _.handle("write-file", async (e, r, n, s) => {
    try {
      const i = {
        encoding: s ?? (typeof n == "string" ? "utf-8" : null),
        flag: "w"
      };
      await M.writeFile(r, n, i);
    } catch (i) {
      throw console.error("写入文件失败:", i), i;
    }
  }), _.handle("get-folder-tree", async (e, r) => await t(r));
  async function t(e) {
    try {
      const r = await M.readdir(e, { withFileTypes: !0 });
      return (await Promise.all(
        r.map(async (s) => {
          const i = $.join(e, s.name), a = s.isDirectory() ? "directory" : $.extname(s.name).slice(1) || "file";
          return s.isDirectory() ? {
            title: s.name,
            key: i,
            fileType: a,
            children: await t(i)
          } : {
            title: s.name,
            key: i,
            fileType: a,
            isLeaf: !0
          };
        })
      )).filter(Boolean);
    } catch (r) {
      return console.error(`Error reading directory ${e}:`, r), [];
    }
  }
  _.handle("refresh-folder", async (e, r) => ({ folderTreeData: await t(r), folderPath: r })), _.handle("arrayBuffer-to-buffer", async (e, r) => Hl.from(r));
}
const Ne = /* @__PURE__ */ new Map(), za = 620, ps = 920, Wt = 10;
function uf() {
  const t = Rl.getPrimaryDisplay(), { width: e } = t.workAreaSize, r = e - za - Wt, n = Wt + Ne.size * (ps + Wt);
  return { x: r, y: n };
}
function oi() {
  let t = 0;
  for (const [, e] of Ne) {
    const r = Wt + t * (ps + Wt);
    e.setPosition(e.getPosition()[0], r), t++;
  }
}
function cf(t, e, r, n) {
  _.handle("show-notification", async (s, i) => {
    if (!t)
      return;
    if (Ne.has(i.id)) {
      const f = Ne.get(i.id);
      f == null || f.close(), Ne.delete(i.id), oi();
    }
    const { x: a, y: o } = uf(), u = new Yt({
      width: za,
      height: ps,
      x: a,
      y: o,
      frame: !1,
      transparent: !0,
      resizable: !1,
      skipTaskbar: !0,
      alwaysOnTop: !0,
      show: !1,
      backgroundColor: "#00000000",
      webPreferences: {
        preload: Pe.join(e, "main_preload.mjs"),
        contextIsolation: !0,
        nodeIntegration: !0,
        webSecurity: !1
      }
    });
    u.webContents.session.webRequest.onHeadersReceived((f, h) => {
      h({
        responseHeaders: {
          ...f.responseHeaders,
          "Content-Security-Policy": ["default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"]
        }
      });
    }), Ne.set(i.id, u), u.on("closed", () => {
      Ne.delete(i.id), oi();
    });
    const c = new URLSearchParams({
      id: i.id,
      title: i.title,
      body: i.body,
      urgency: i.urgency || "normal"
    });
    i.icon && c.append("icon", i.icon), i.actions && c.append("actions", encodeURIComponent(JSON.stringify(i.actions)));
    const l = n ? `${n}#/notification?${c.toString()}` : `file://${r}/index.html#/notification?${c.toString()}`;
    return await u.loadURL(l), u.show(), i.id;
  }), _.on("close-notification", (s, i) => {
    const a = Ne.get(i);
    a && !a.isDestroyed() && a.close();
  }), _.on("notification-action", (s, i, a) => {
    const o = Ne.get(i);
    if (o && !o.isDestroyed()) {
      const u = {
        text: a.text,
        type: a.type
      };
      (a.type === "confirm" || a.type === "cancel") && o.close(), t.webContents.send("notification-action-received", i, u);
    }
  });
}
var ui = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Va(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
var me = {};
Object.defineProperty(me, "__esModule", { value: !0 });
class ct extends Error {
}
class lf extends ct {
  constructor(e) {
    super(`Invalid DateTime: ${e.toMessage()}`);
  }
}
class ff extends ct {
  constructor(e) {
    super(`Invalid Interval: ${e.toMessage()}`);
  }
}
class hf extends ct {
  constructor(e) {
    super(`Invalid Duration: ${e.toMessage()}`);
  }
}
class pt extends ct {
}
class ja extends ct {
  constructor(e) {
    super(`Invalid unit ${e}`);
  }
}
class K extends ct {
}
class Ue extends ct {
  constructor() {
    super("Zone is an abstract class");
  }
}
const y = "numeric", Oe = "short", de = "long", Lr = {
  year: y,
  month: y,
  day: y
}, Ha = {
  year: y,
  month: Oe,
  day: y
}, df = {
  year: y,
  month: Oe,
  day: y,
  weekday: Oe
}, qa = {
  year: y,
  month: de,
  day: y
}, Ga = {
  year: y,
  month: de,
  day: y,
  weekday: de
}, Ba = {
  hour: y,
  minute: y
}, Za = {
  hour: y,
  minute: y,
  second: y
}, Ya = {
  hour: y,
  minute: y,
  second: y,
  timeZoneName: Oe
}, Ja = {
  hour: y,
  minute: y,
  second: y,
  timeZoneName: de
}, Qa = {
  hour: y,
  minute: y,
  hourCycle: "h23"
}, Ka = {
  hour: y,
  minute: y,
  second: y,
  hourCycle: "h23"
}, Xa = {
  hour: y,
  minute: y,
  second: y,
  hourCycle: "h23",
  timeZoneName: Oe
}, eo = {
  hour: y,
  minute: y,
  second: y,
  hourCycle: "h23",
  timeZoneName: de
}, to = {
  year: y,
  month: y,
  day: y,
  hour: y,
  minute: y
}, ro = {
  year: y,
  month: y,
  day: y,
  hour: y,
  minute: y,
  second: y
}, no = {
  year: y,
  month: Oe,
  day: y,
  hour: y,
  minute: y
}, so = {
  year: y,
  month: Oe,
  day: y,
  hour: y,
  minute: y,
  second: y
}, mf = {
  year: y,
  month: Oe,
  day: y,
  weekday: Oe,
  hour: y,
  minute: y
}, io = {
  year: y,
  month: de,
  day: y,
  hour: y,
  minute: y,
  timeZoneName: Oe
}, ao = {
  year: y,
  month: de,
  day: y,
  hour: y,
  minute: y,
  second: y,
  timeZoneName: Oe
}, oo = {
  year: y,
  month: de,
  day: y,
  weekday: de,
  hour: y,
  minute: y,
  timeZoneName: de
}, uo = {
  year: y,
  month: de,
  day: y,
  weekday: de,
  hour: y,
  minute: y,
  second: y,
  timeZoneName: de
};
class St {
  /**
   * The type of zone
   * @abstract
   * @type {string}
   */
  get type() {
    throw new Ue();
  }
  /**
   * The name of this zone.
   * @abstract
   * @type {string}
   */
  get name() {
    throw new Ue();
  }
  /**
   * The IANA name of this zone.
   * Defaults to `name` if not overwritten by a subclass.
   * @abstract
   * @type {string}
   */
  get ianaName() {
    return this.name;
  }
  /**
   * Returns whether the offset is known to be fixed for the whole year.
   * @abstract
   * @type {boolean}
   */
  get isUniversal() {
    throw new Ue();
  }
  /**
   * Returns the offset's common name (such as EST) at the specified timestamp
   * @abstract
   * @param {number} ts - Epoch milliseconds for which to get the name
   * @param {Object} opts - Options to affect the format
   * @param {string} opts.format - What style of offset to return. Accepts 'long' or 'short'.
   * @param {string} opts.locale - What locale to return the offset name in.
   * @return {string}
   */
  offsetName(e, r) {
    throw new Ue();
  }
  /**
   * Returns the offset's value as a string
   * @abstract
   * @param {number} ts - Epoch milliseconds for which to get the offset
   * @param {string} format - What style of offset to return.
   *                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
   * @return {string}
   */
  formatOffset(e, r) {
    throw new Ue();
  }
  /**
   * Return the offset in minutes for this zone at the specified timestamp.
   * @abstract
   * @param {number} ts - Epoch milliseconds for which to compute the offset
   * @return {number}
   */
  offset(e) {
    throw new Ue();
  }
  /**
   * Return whether this Zone is equal to another zone
   * @abstract
   * @param {Zone} otherZone - the zone to compare
   * @return {boolean}
   */
  equals(e) {
    throw new Ue();
  }
  /**
   * Return whether this Zone is valid.
   * @abstract
   * @type {boolean}
   */
  get isValid() {
    throw new Ue();
  }
}
let pn = null;
class Jt extends St {
  /**
   * Get a singleton instance of the local zone
   * @return {SystemZone}
   */
  static get instance() {
    return pn === null && (pn = new Jt()), pn;
  }
  /** @override **/
  get type() {
    return "system";
  }
  /** @override **/
  get name() {
    return new Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  /** @override **/
  get isUniversal() {
    return !1;
  }
  /** @override **/
  offsetName(e, {
    format: r,
    locale: n
  }) {
    return vo(e, r, n);
  }
  /** @override **/
  formatOffset(e, r) {
    return $t(this.offset(e), r);
  }
  /** @override **/
  offset(e) {
    return -new Date(e).getTimezoneOffset();
  }
  /** @override **/
  equals(e) {
    return e.type === "system";
  }
  /** @override **/
  get isValid() {
    return !0;
  }
}
let Sr = {};
function pf(t) {
  return Sr[t] || (Sr[t] = new Intl.DateTimeFormat("en-US", {
    hour12: !1,
    timeZone: t,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    era: "short"
  })), Sr[t];
}
const gf = {
  year: 0,
  month: 1,
  day: 2,
  era: 3,
  hour: 4,
  minute: 5,
  second: 6
};
function yf(t, e) {
  const r = t.format(e).replace(/\u200E/g, ""), n = /(\d+)\/(\d+)\/(\d+) (AD|BC),? (\d+):(\d+):(\d+)/.exec(r), [, s, i, a, o, u, c, l] = n;
  return [a, s, i, o, u, c, l];
}
function wf(t, e) {
  const r = t.formatToParts(e), n = [];
  for (let s = 0; s < r.length; s++) {
    const {
      type: i,
      value: a
    } = r[s], o = gf[i];
    i === "era" ? n[o] = a : D(o) || (n[o] = parseInt(a, 10));
  }
  return n;
}
let lr = {};
class Ie extends St {
  /**
   * @param {string} name - Zone name
   * @return {IANAZone}
   */
  static create(e) {
    return lr[e] || (lr[e] = new Ie(e)), lr[e];
  }
  /**
   * Reset local caches. Should only be necessary in testing scenarios.
   * @return {void}
   */
  static resetCache() {
    lr = {}, Sr = {};
  }
  /**
   * Returns whether the provided string is a valid specifier. This only checks the string's format, not that the specifier identifies a known zone; see isValidZone for that.
   * @param {string} s - The string to check validity on
   * @example IANAZone.isValidSpecifier("America/New_York") //=> true
   * @example IANAZone.isValidSpecifier("Sport~~blorp") //=> false
   * @deprecated For backward compatibility, this forwards to isValidZone, better use `isValidZone()` directly instead.
   * @return {boolean}
   */
  static isValidSpecifier(e) {
    return this.isValidZone(e);
  }
  /**
   * Returns whether the provided string identifies a real zone
   * @param {string} zone - The string to check
   * @example IANAZone.isValidZone("America/New_York") //=> true
   * @example IANAZone.isValidZone("Fantasia/Castle") //=> false
   * @example IANAZone.isValidZone("Sport~~blorp") //=> false
   * @return {boolean}
   */
  static isValidZone(e) {
    if (!e)
      return !1;
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: e
      }).format(), !0;
    } catch {
      return !1;
    }
  }
  constructor(e) {
    super(), this.zoneName = e, this.valid = Ie.isValidZone(e);
  }
  /**
   * The type of zone. `iana` for all instances of `IANAZone`.
   * @override
   * @type {string}
   */
  get type() {
    return "iana";
  }
  /**
   * The name of this zone (i.e. the IANA zone name).
   * @override
   * @type {string}
   */
  get name() {
    return this.zoneName;
  }
  /**
   * Returns whether the offset is known to be fixed for the whole year:
   * Always returns false for all IANA zones.
   * @override
   * @type {boolean}
   */
  get isUniversal() {
    return !1;
  }
  /**
   * Returns the offset's common name (such as EST) at the specified timestamp
   * @override
   * @param {number} ts - Epoch milliseconds for which to get the name
   * @param {Object} opts - Options to affect the format
   * @param {string} opts.format - What style of offset to return. Accepts 'long' or 'short'.
   * @param {string} opts.locale - What locale to return the offset name in.
   * @return {string}
   */
  offsetName(e, {
    format: r,
    locale: n
  }) {
    return vo(e, r, n, this.name);
  }
  /**
   * Returns the offset's value as a string
   * @override
   * @param {number} ts - Epoch milliseconds for which to get the offset
   * @param {string} format - What style of offset to return.
   *                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
   * @return {string}
   */
  formatOffset(e, r) {
    return $t(this.offset(e), r);
  }
  /**
   * Return the offset in minutes for this zone at the specified timestamp.
   * @override
   * @param {number} ts - Epoch milliseconds for which to compute the offset
   * @return {number}
   */
  offset(e) {
    const r = new Date(e);
    if (isNaN(r)) return NaN;
    const n = pf(this.name);
    let [s, i, a, o, u, c, l] = n.formatToParts ? wf(n, r) : yf(n, r);
    o === "BC" && (s = -Math.abs(s) + 1);
    const h = Yr({
      year: s,
      month: i,
      day: a,
      hour: u === 24 ? 0 : u,
      minute: c,
      second: l,
      millisecond: 0
    });
    let d = +r;
    const m = d % 1e3;
    return d -= m >= 0 ? m : 1e3 + m, (h - d) / (60 * 1e3);
  }
  /**
   * Return whether this Zone is equal to another zone
   * @override
   * @param {Zone} otherZone - the zone to compare
   * @return {boolean}
   */
  equals(e) {
    return e.type === "iana" && e.name === this.name;
  }
  /**
   * Return whether this Zone is valid.
   * @override
   * @type {boolean}
   */
  get isValid() {
    return this.valid;
  }
}
let ci = {};
function vf(t, e = {}) {
  const r = JSON.stringify([t, e]);
  let n = ci[r];
  return n || (n = new Intl.ListFormat(t, e), ci[r] = n), n;
}
let jn = {};
function Hn(t, e = {}) {
  const r = JSON.stringify([t, e]);
  let n = jn[r];
  return n || (n = new Intl.DateTimeFormat(t, e), jn[r] = n), n;
}
let qn = {};
function _f(t, e = {}) {
  const r = JSON.stringify([t, e]);
  let n = qn[r];
  return n || (n = new Intl.NumberFormat(t, e), qn[r] = n), n;
}
let Gn = {};
function kf(t, e = {}) {
  const {
    base: r,
    ...n
  } = e, s = JSON.stringify([t, n]);
  let i = Gn[s];
  return i || (i = new Intl.RelativeTimeFormat(t, e), Gn[s] = i), i;
}
let Nt = null;
function Tf() {
  return Nt || (Nt = new Intl.DateTimeFormat().resolvedOptions().locale, Nt);
}
let li = {};
function bf(t) {
  let e = li[t];
  if (!e) {
    const r = new Intl.Locale(t);
    e = "getWeekInfo" in r ? r.getWeekInfo() : r.weekInfo, li[t] = e;
  }
  return e;
}
function Sf(t) {
  const e = t.indexOf("-x-");
  e !== -1 && (t = t.substring(0, e));
  const r = t.indexOf("-u-");
  if (r === -1)
    return [t];
  {
    let n, s;
    try {
      n = Hn(t).resolvedOptions(), s = t;
    } catch {
      const u = t.substring(0, r);
      n = Hn(u).resolvedOptions(), s = u;
    }
    const {
      numberingSystem: i,
      calendar: a
    } = n;
    return [s, i, a];
  }
}
function Ef(t, e, r) {
  return (r || e) && (t.includes("-u-") || (t += "-u"), r && (t += `-ca-${r}`), e && (t += `-nu-${e}`)), t;
}
function Of(t) {
  const e = [];
  for (let r = 1; r <= 12; r++) {
    const n = O.utc(2009, r, 1);
    e.push(t(n));
  }
  return e;
}
function Df(t) {
  const e = [];
  for (let r = 1; r <= 7; r++) {
    const n = O.utc(2016, 11, 13 + r);
    e.push(t(n));
  }
  return e;
}
function fr(t, e, r, n) {
  const s = t.listingMode();
  return s === "error" ? null : s === "en" ? r(e) : n(e);
}
function Cf(t) {
  return t.numberingSystem && t.numberingSystem !== "latn" ? !1 : t.numberingSystem === "latn" || !t.locale || t.locale.startsWith("en") || new Intl.DateTimeFormat(t.intl).resolvedOptions().numberingSystem === "latn";
}
class If {
  constructor(e, r, n) {
    this.padTo = n.padTo || 0, this.floor = n.floor || !1;
    const {
      padTo: s,
      floor: i,
      ...a
    } = n;
    if (!r || Object.keys(a).length > 0) {
      const o = {
        useGrouping: !1,
        ...n
      };
      n.padTo > 0 && (o.minimumIntegerDigits = n.padTo), this.inf = _f(e, o);
    }
  }
  format(e) {
    if (this.inf) {
      const r = this.floor ? Math.floor(e) : e;
      return this.inf.format(r);
    } else {
      const r = this.floor ? Math.floor(e) : _s(e, 3);
      return Y(r, this.padTo);
    }
  }
}
class xf {
  constructor(e, r, n) {
    this.opts = n, this.originalZone = void 0;
    let s;
    if (this.opts.timeZone)
      this.dt = e;
    else if (e.zone.type === "fixed") {
      const a = -1 * (e.offset / 60), o = a >= 0 ? `Etc/GMT+${a}` : `Etc/GMT${a}`;
      e.offset !== 0 && Ie.create(o).valid ? (s = o, this.dt = e) : (s = "UTC", this.dt = e.offset === 0 ? e : e.setZone("UTC").plus({
        minutes: e.offset
      }), this.originalZone = e.zone);
    } else e.zone.type === "system" ? this.dt = e : e.zone.type === "iana" ? (this.dt = e, s = e.zone.name) : (s = "UTC", this.dt = e.setZone("UTC").plus({
      minutes: e.offset
    }), this.originalZone = e.zone);
    const i = {
      ...this.opts
    };
    i.timeZone = i.timeZone || s, this.dtf = Hn(r, i);
  }
  format() {
    return this.originalZone ? this.formatToParts().map(({
      value: e
    }) => e).join("") : this.dtf.format(this.dt.toJSDate());
  }
  formatToParts() {
    const e = this.dtf.formatToParts(this.dt.toJSDate());
    return this.originalZone ? e.map((r) => {
      if (r.type === "timeZoneName") {
        const n = this.originalZone.offsetName(this.dt.ts, {
          locale: this.dt.locale,
          format: this.opts.timeZoneName
        });
        return {
          ...r,
          value: n
        };
      } else
        return r;
    }) : e;
  }
  resolvedOptions() {
    return this.dtf.resolvedOptions();
  }
}
class Ff {
  constructor(e, r, n) {
    this.opts = {
      style: "long",
      ...n
    }, !r && yo() && (this.rtf = kf(e, n));
  }
  format(e, r) {
    return this.rtf ? this.rtf.format(e, r) : Xf(r, e, this.opts.numeric, this.opts.style !== "long");
  }
  formatToParts(e, r) {
    return this.rtf ? this.rtf.formatToParts(e, r) : [];
  }
}
const Mf = {
  firstDay: 1,
  minimalDays: 4,
  weekend: [6, 7]
};
class L {
  static fromOpts(e) {
    return L.create(e.locale, e.numberingSystem, e.outputCalendar, e.weekSettings, e.defaultToEN);
  }
  static create(e, r, n, s, i = !1) {
    const a = e || j.defaultLocale, o = a || (i ? "en-US" : Tf()), u = r || j.defaultNumberingSystem, c = n || j.defaultOutputCalendar, l = Bn(s) || j.defaultWeekSettings;
    return new L(o, u, c, l, a);
  }
  static resetCache() {
    Nt = null, jn = {}, qn = {}, Gn = {};
  }
  static fromObject({
    locale: e,
    numberingSystem: r,
    outputCalendar: n,
    weekSettings: s
  } = {}) {
    return L.create(e, r, n, s);
  }
  constructor(e, r, n, s, i) {
    const [a, o, u] = Sf(e);
    this.locale = a, this.numberingSystem = r || o || null, this.outputCalendar = n || u || null, this.weekSettings = s, this.intl = Ef(this.locale, this.numberingSystem, this.outputCalendar), this.weekdaysCache = {
      format: {},
      standalone: {}
    }, this.monthsCache = {
      format: {},
      standalone: {}
    }, this.meridiemCache = null, this.eraCache = {}, this.specifiedLocale = i, this.fastNumbersCached = null;
  }
  get fastNumbers() {
    return this.fastNumbersCached == null && (this.fastNumbersCached = Cf(this)), this.fastNumbersCached;
  }
  listingMode() {
    const e = this.isEnglish(), r = (this.numberingSystem === null || this.numberingSystem === "latn") && (this.outputCalendar === null || this.outputCalendar === "gregory");
    return e && r ? "en" : "intl";
  }
  clone(e) {
    return !e || Object.getOwnPropertyNames(e).length === 0 ? this : L.create(e.locale || this.specifiedLocale, e.numberingSystem || this.numberingSystem, e.outputCalendar || this.outputCalendar, Bn(e.weekSettings) || this.weekSettings, e.defaultToEN || !1);
  }
  redefaultToEN(e = {}) {
    return this.clone({
      ...e,
      defaultToEN: !0
    });
  }
  redefaultToSystem(e = {}) {
    return this.clone({
      ...e,
      defaultToEN: !1
    });
  }
  months(e, r = !1) {
    return fr(this, e, To, () => {
      const n = r ? {
        month: e,
        day: "numeric"
      } : {
        month: e
      }, s = r ? "format" : "standalone";
      return this.monthsCache[s][e] || (this.monthsCache[s][e] = Of((i) => this.extract(i, n, "month"))), this.monthsCache[s][e];
    });
  }
  weekdays(e, r = !1) {
    return fr(this, e, Eo, () => {
      const n = r ? {
        weekday: e,
        year: "numeric",
        month: "long",
        day: "numeric"
      } : {
        weekday: e
      }, s = r ? "format" : "standalone";
      return this.weekdaysCache[s][e] || (this.weekdaysCache[s][e] = Df((i) => this.extract(i, n, "weekday"))), this.weekdaysCache[s][e];
    });
  }
  meridiems() {
    return fr(this, void 0, () => Oo, () => {
      if (!this.meridiemCache) {
        const e = {
          hour: "numeric",
          hourCycle: "h12"
        };
        this.meridiemCache = [O.utc(2016, 11, 13, 9), O.utc(2016, 11, 13, 19)].map((r) => this.extract(r, e, "dayperiod"));
      }
      return this.meridiemCache;
    });
  }
  eras(e) {
    return fr(this, e, Do, () => {
      const r = {
        era: e
      };
      return this.eraCache[e] || (this.eraCache[e] = [O.utc(-40, 1, 1), O.utc(2017, 1, 1)].map((n) => this.extract(n, r, "era"))), this.eraCache[e];
    });
  }
  extract(e, r, n) {
    const s = this.dtFormatter(e, r), i = s.formatToParts(), a = i.find((o) => o.type.toLowerCase() === n);
    return a ? a.value : null;
  }
  numberFormatter(e = {}) {
    return new If(this.intl, e.forceSimple || this.fastNumbers, e);
  }
  dtFormatter(e, r = {}) {
    return new xf(e, this.intl, r);
  }
  relFormatter(e = {}) {
    return new Ff(this.intl, this.isEnglish(), e);
  }
  listFormatter(e = {}) {
    return vf(this.intl, e);
  }
  isEnglish() {
    return this.locale === "en" || this.locale.toLowerCase() === "en-us" || new Intl.DateTimeFormat(this.intl).resolvedOptions().locale.startsWith("en-us");
  }
  getWeekSettings() {
    return this.weekSettings ? this.weekSettings : wo() ? bf(this.locale) : Mf;
  }
  getStartOfWeek() {
    return this.getWeekSettings().firstDay;
  }
  getMinDaysInFirstWeek() {
    return this.getWeekSettings().minimalDays;
  }
  getWeekendDays() {
    return this.getWeekSettings().weekend;
  }
  equals(e) {
    return this.locale === e.locale && this.numberingSystem === e.numberingSystem && this.outputCalendar === e.outputCalendar;
  }
  toString() {
    return `Locale(${this.locale}, ${this.numberingSystem}, ${this.outputCalendar})`;
  }
}
let gn = null;
class ee extends St {
  /**
   * Get a singleton instance of UTC
   * @return {FixedOffsetZone}
   */
  static get utcInstance() {
    return gn === null && (gn = new ee(0)), gn;
  }
  /**
   * Get an instance with a specified offset
   * @param {number} offset - The offset in minutes
   * @return {FixedOffsetZone}
   */
  static instance(e) {
    return e === 0 ? ee.utcInstance : new ee(e);
  }
  /**
   * Get an instance of FixedOffsetZone from a UTC offset string, like "UTC+6"
   * @param {string} s - The offset string to parse
   * @example FixedOffsetZone.parseSpecifier("UTC+6")
   * @example FixedOffsetZone.parseSpecifier("UTC+06")
   * @example FixedOffsetZone.parseSpecifier("UTC-6:00")
   * @return {FixedOffsetZone}
   */
  static parseSpecifier(e) {
    if (e) {
      const r = e.match(/^utc(?:([+-]\d{1,2})(?::(\d{2}))?)?$/i);
      if (r)
        return new ee(Jr(r[1], r[2]));
    }
    return null;
  }
  constructor(e) {
    super(), this.fixed = e;
  }
  /**
   * The type of zone. `fixed` for all instances of `FixedOffsetZone`.
   * @override
   * @type {string}
   */
  get type() {
    return "fixed";
  }
  /**
   * The name of this zone.
   * All fixed zones' names always start with "UTC" (plus optional offset)
   * @override
   * @type {string}
   */
  get name() {
    return this.fixed === 0 ? "UTC" : `UTC${$t(this.fixed, "narrow")}`;
  }
  /**
   * The IANA name of this zone, i.e. `Etc/UTC` or `Etc/GMT+/-nn`
   *
   * @override
   * @type {string}
   */
  get ianaName() {
    return this.fixed === 0 ? "Etc/UTC" : `Etc/GMT${$t(-this.fixed, "narrow")}`;
  }
  /**
   * Returns the offset's common name at the specified timestamp.
   *
   * For fixed offset zones this equals to the zone name.
   * @override
   */
  offsetName() {
    return this.name;
  }
  /**
   * Returns the offset's value as a string
   * @override
   * @param {number} ts - Epoch milliseconds for which to get the offset
   * @param {string} format - What style of offset to return.
   *                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
   * @return {string}
   */
  formatOffset(e, r) {
    return $t(this.fixed, r);
  }
  /**
   * Returns whether the offset is known to be fixed for the whole year:
   * Always returns true for all fixed offset zones.
   * @override
   * @type {boolean}
   */
  get isUniversal() {
    return !0;
  }
  /**
   * Return the offset in minutes for this zone at the specified timestamp.
   *
   * For fixed offset zones, this is constant and does not depend on a timestamp.
   * @override
   * @return {number}
   */
  offset() {
    return this.fixed;
  }
  /**
   * Return whether this Zone is equal to another zone (i.e. also fixed and same offset)
   * @override
   * @param {Zone} otherZone - the zone to compare
   * @return {boolean}
   */
  equals(e) {
    return e.type === "fixed" && e.fixed === this.fixed;
  }
  /**
   * Return whether this Zone is valid:
   * All fixed offset zones are valid.
   * @override
   * @type {boolean}
   */
  get isValid() {
    return !0;
  }
}
class co extends St {
  constructor(e) {
    super(), this.zoneName = e;
  }
  /** @override **/
  get type() {
    return "invalid";
  }
  /** @override **/
  get name() {
    return this.zoneName;
  }
  /** @override **/
  get isUniversal() {
    return !1;
  }
  /** @override **/
  offsetName() {
    return null;
  }
  /** @override **/
  formatOffset() {
    return "";
  }
  /** @override **/
  offset() {
    return NaN;
  }
  /** @override **/
  equals() {
    return !1;
  }
  /** @override **/
  get isValid() {
    return !1;
  }
}
function He(t, e) {
  if (D(t) || t === null)
    return e;
  if (t instanceof St)
    return t;
  if (Wf(t)) {
    const r = t.toLowerCase();
    return r === "default" ? e : r === "local" || r === "system" ? Jt.instance : r === "utc" || r === "gmt" ? ee.utcInstance : ee.parseSpecifier(r) || Ie.create(t);
  } else return qe(t) ? ee.instance(t) : typeof t == "object" && "offset" in t && typeof t.offset == "function" ? t : new co(t);
}
const gs = {
  arab: "[٠-٩]",
  arabext: "[۰-۹]",
  bali: "[᭐-᭙]",
  beng: "[০-৯]",
  deva: "[०-९]",
  fullwide: "[０-９]",
  gujr: "[૦-૯]",
  hanidec: "[〇|一|二|三|四|五|六|七|八|九]",
  khmr: "[០-៩]",
  knda: "[೦-೯]",
  laoo: "[໐-໙]",
  limb: "[᥆-᥏]",
  mlym: "[൦-൯]",
  mong: "[᠐-᠙]",
  mymr: "[၀-၉]",
  orya: "[୦-୯]",
  tamldec: "[௦-௯]",
  telu: "[౦-౯]",
  thai: "[๐-๙]",
  tibt: "[༠-༩]",
  latn: "\\d"
}, fi = {
  arab: [1632, 1641],
  arabext: [1776, 1785],
  bali: [6992, 7001],
  beng: [2534, 2543],
  deva: [2406, 2415],
  fullwide: [65296, 65303],
  gujr: [2790, 2799],
  khmr: [6112, 6121],
  knda: [3302, 3311],
  laoo: [3792, 3801],
  limb: [6470, 6479],
  mlym: [3430, 3439],
  mong: [6160, 6169],
  mymr: [4160, 4169],
  orya: [2918, 2927],
  tamldec: [3046, 3055],
  telu: [3174, 3183],
  thai: [3664, 3673],
  tibt: [3872, 3881]
}, Rf = gs.hanidec.replace(/[\[|\]]/g, "").split("");
function Nf(t) {
  let e = parseInt(t, 10);
  if (isNaN(e)) {
    e = "";
    for (let r = 0; r < t.length; r++) {
      const n = t.charCodeAt(r);
      if (t[r].search(gs.hanidec) !== -1)
        e += Rf.indexOf(t[r]);
      else
        for (const s in fi) {
          const [i, a] = fi[s];
          n >= i && n <= a && (e += n - i);
        }
    }
    return parseInt(e, 10);
  } else
    return e;
}
let mt = {};
function Pf() {
  mt = {};
}
function Te({
  numberingSystem: t
}, e = "") {
  const r = t || "latn";
  return mt[r] || (mt[r] = {}), mt[r][e] || (mt[r][e] = new RegExp(`${gs[r]}${e}`)), mt[r][e];
}
let hi = () => Date.now(), di = "system", mi = null, pi = null, gi = null, yi = 60, wi, vi = null;
class j {
  /**
   * Get the callback for returning the current timestamp.
   * @type {function}
   */
  static get now() {
    return hi;
  }
  /**
   * Set the callback for returning the current timestamp.
   * The function should return a number, which will be interpreted as an Epoch millisecond count
   * @type {function}
   * @example Settings.now = () => Date.now() + 3000 // pretend it is 3 seconds in the future
   * @example Settings.now = () => 0 // always pretend it's Jan 1, 1970 at midnight in UTC time
   */
  static set now(e) {
    hi = e;
  }
  /**
   * Set the default time zone to create DateTimes in. Does not affect existing instances.
   * Use the value "system" to reset this value to the system's time zone.
   * @type {string}
   */
  static set defaultZone(e) {
    di = e;
  }
  /**
   * Get the default time zone object currently used to create DateTimes. Does not affect existing instances.
   * The default value is the system's time zone (the one set on the machine that runs this code).
   * @type {Zone}
   */
  static get defaultZone() {
    return He(di, Jt.instance);
  }
  /**
   * Get the default locale to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static get defaultLocale() {
    return mi;
  }
  /**
   * Set the default locale to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static set defaultLocale(e) {
    mi = e;
  }
  /**
   * Get the default numbering system to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static get defaultNumberingSystem() {
    return pi;
  }
  /**
   * Set the default numbering system to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static set defaultNumberingSystem(e) {
    pi = e;
  }
  /**
   * Get the default output calendar to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static get defaultOutputCalendar() {
    return gi;
  }
  /**
   * Set the default output calendar to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static set defaultOutputCalendar(e) {
    gi = e;
  }
  /**
   * @typedef {Object} WeekSettings
   * @property {number} firstDay
   * @property {number} minimalDays
   * @property {number[]} weekend
   */
  /**
   * @return {WeekSettings|null}
   */
  static get defaultWeekSettings() {
    return vi;
  }
  /**
   * Allows overriding the default locale week settings, i.e. the start of the week, the weekend and
   * how many days are required in the first week of a year.
   * Does not affect existing instances.
   *
   * @param {WeekSettings|null} weekSettings
   */
  static set defaultWeekSettings(e) {
    vi = Bn(e);
  }
  /**
   * Get the cutoff year for whether a 2-digit year string is interpreted in the current or previous century. Numbers higher than the cutoff will be considered to mean 19xx and numbers lower or equal to the cutoff will be considered 20xx.
   * @type {number}
   */
  static get twoDigitCutoffYear() {
    return yi;
  }
  /**
   * Set the cutoff year for whether a 2-digit year string is interpreted in the current or previous century. Numbers higher than the cutoff will be considered to mean 19xx and numbers lower or equal to the cutoff will be considered 20xx.
   * @type {number}
   * @example Settings.twoDigitCutoffYear = 0 // all 'yy' are interpreted as 20th century
   * @example Settings.twoDigitCutoffYear = 99 // all 'yy' are interpreted as 21st century
   * @example Settings.twoDigitCutoffYear = 50 // '49' -> 2049; '50' -> 1950
   * @example Settings.twoDigitCutoffYear = 1950 // interpreted as 50
   * @example Settings.twoDigitCutoffYear = 2050 // ALSO interpreted as 50
   */
  static set twoDigitCutoffYear(e) {
    yi = e % 100;
  }
  /**
   * Get whether Luxon will throw when it encounters invalid DateTimes, Durations, or Intervals
   * @type {boolean}
   */
  static get throwOnInvalid() {
    return wi;
  }
  /**
   * Set whether Luxon will throw when it encounters invalid DateTimes, Durations, or Intervals
   * @type {boolean}
   */
  static set throwOnInvalid(e) {
    wi = e;
  }
  /**
   * Reset Luxon's global caches. Should only be necessary in testing scenarios.
   * @return {void}
   */
  static resetCaches() {
    L.resetCache(), Ie.resetCache(), O.resetCache(), Pf();
  }
}
class Ee {
  constructor(e, r) {
    this.reason = e, this.explanation = r;
  }
  toMessage() {
    return this.explanation ? `${this.reason}: ${this.explanation}` : this.reason;
  }
}
const lo = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334], fo = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
function we(t, e) {
  return new Ee("unit out of range", `you specified ${e} (of type ${typeof e}) as a ${t}, which is invalid`);
}
function ys(t, e, r) {
  const n = new Date(Date.UTC(t, e - 1, r));
  t < 100 && t >= 0 && n.setUTCFullYear(n.getUTCFullYear() - 1900);
  const s = n.getUTCDay();
  return s === 0 ? 7 : s;
}
function ho(t, e, r) {
  return r + (Qt(t) ? fo : lo)[e - 1];
}
function mo(t, e) {
  const r = Qt(t) ? fo : lo, n = r.findIndex((i) => i < e), s = e - r[n];
  return {
    month: n + 1,
    day: s
  };
}
function ws(t, e) {
  return (t - e + 7) % 7 + 1;
}
function Wr(t, e = 4, r = 1) {
  const {
    year: n,
    month: s,
    day: i
  } = t, a = ho(n, s, i), o = ws(ys(n, s, i), r);
  let u = Math.floor((a - o + 14 - e) / 7), c;
  return u < 1 ? (c = n - 1, u = Ht(c, e, r)) : u > Ht(n, e, r) ? (c = n + 1, u = 1) : c = n, {
    weekYear: c,
    weekNumber: u,
    weekday: o,
    ...Qr(t)
  };
}
function _i(t, e = 4, r = 1) {
  const {
    weekYear: n,
    weekNumber: s,
    weekday: i
  } = t, a = ws(ys(n, 1, e), r), o = wt(n);
  let u = s * 7 + i - a - 7 + e, c;
  u < 1 ? (c = n - 1, u += wt(c)) : u > o ? (c = n + 1, u -= wt(n)) : c = n;
  const {
    month: l,
    day: f
  } = mo(c, u);
  return {
    year: c,
    month: l,
    day: f,
    ...Qr(t)
  };
}
function yn(t) {
  const {
    year: e,
    month: r,
    day: n
  } = t, s = ho(e, r, n);
  return {
    year: e,
    ordinal: s,
    ...Qr(t)
  };
}
function ki(t) {
  const {
    year: e,
    ordinal: r
  } = t, {
    month: n,
    day: s
  } = mo(e, r);
  return {
    year: e,
    month: n,
    day: s,
    ...Qr(t)
  };
}
function Ti(t, e) {
  if (!D(t.localWeekday) || !D(t.localWeekNumber) || !D(t.localWeekYear)) {
    if (!D(t.weekday) || !D(t.weekNumber) || !D(t.weekYear))
      throw new pt("Cannot mix locale-based week fields with ISO-based week fields");
    return D(t.localWeekday) || (t.weekday = t.localWeekday), D(t.localWeekNumber) || (t.weekNumber = t.localWeekNumber), D(t.localWeekYear) || (t.weekYear = t.localWeekYear), delete t.localWeekday, delete t.localWeekNumber, delete t.localWeekYear, {
      minDaysInFirstWeek: e.getMinDaysInFirstWeek(),
      startOfWeek: e.getStartOfWeek()
    };
  } else
    return {
      minDaysInFirstWeek: 4,
      startOfWeek: 1
    };
}
function Af(t, e = 4, r = 1) {
  const n = Zr(t.weekYear), s = ve(t.weekNumber, 1, Ht(t.weekYear, e, r)), i = ve(t.weekday, 1, 7);
  return n ? s ? i ? !1 : we("weekday", t.weekday) : we("week", t.weekNumber) : we("weekYear", t.weekYear);
}
function Lf(t) {
  const e = Zr(t.year), r = ve(t.ordinal, 1, wt(t.year));
  return e ? r ? !1 : we("ordinal", t.ordinal) : we("year", t.year);
}
function po(t) {
  const e = Zr(t.year), r = ve(t.month, 1, 12), n = ve(t.day, 1, $r(t.year, t.month));
  return e ? r ? n ? !1 : we("day", t.day) : we("month", t.month) : we("year", t.year);
}
function go(t) {
  const {
    hour: e,
    minute: r,
    second: n,
    millisecond: s
  } = t, i = ve(e, 0, 23) || e === 24 && r === 0 && n === 0 && s === 0, a = ve(r, 0, 59), o = ve(n, 0, 59), u = ve(s, 0, 999);
  return i ? a ? o ? u ? !1 : we("millisecond", s) : we("second", n) : we("minute", r) : we("hour", e);
}
function D(t) {
  return typeof t > "u";
}
function qe(t) {
  return typeof t == "number";
}
function Zr(t) {
  return typeof t == "number" && t % 1 === 0;
}
function Wf(t) {
  return typeof t == "string";
}
function $f(t) {
  return Object.prototype.toString.call(t) === "[object Date]";
}
function yo() {
  try {
    return typeof Intl < "u" && !!Intl.RelativeTimeFormat;
  } catch {
    return !1;
  }
}
function wo() {
  try {
    return typeof Intl < "u" && !!Intl.Locale && ("weekInfo" in Intl.Locale.prototype || "getWeekInfo" in Intl.Locale.prototype);
  } catch {
    return !1;
  }
}
function Uf(t) {
  return Array.isArray(t) ? t : [t];
}
function bi(t, e, r) {
  if (t.length !== 0)
    return t.reduce((n, s) => {
      const i = [e(s), s];
      return n && r(n[0], i[0]) === n[0] ? n : i;
    }, null)[1];
}
function zf(t, e) {
  return e.reduce((r, n) => (r[n] = t[n], r), {});
}
function kt(t, e) {
  return Object.prototype.hasOwnProperty.call(t, e);
}
function Bn(t) {
  if (t == null)
    return null;
  if (typeof t != "object")
    throw new K("Week settings must be an object");
  if (!ve(t.firstDay, 1, 7) || !ve(t.minimalDays, 1, 7) || !Array.isArray(t.weekend) || t.weekend.some((e) => !ve(e, 1, 7)))
    throw new K("Invalid week settings");
  return {
    firstDay: t.firstDay,
    minimalDays: t.minimalDays,
    weekend: Array.from(t.weekend)
  };
}
function ve(t, e, r) {
  return Zr(t) && t >= e && t <= r;
}
function Vf(t, e) {
  return t - e * Math.floor(t / e);
}
function Y(t, e = 2) {
  const r = t < 0;
  let n;
  return r ? n = "-" + ("" + -t).padStart(e, "0") : n = ("" + t).padStart(e, "0"), n;
}
function je(t) {
  if (!(D(t) || t === null || t === ""))
    return parseInt(t, 10);
}
function Ke(t) {
  if (!(D(t) || t === null || t === ""))
    return parseFloat(t);
}
function vs(t) {
  if (!(D(t) || t === null || t === "")) {
    const e = parseFloat("0." + t) * 1e3;
    return Math.floor(e);
  }
}
function _s(t, e, r = !1) {
  const n = 10 ** e;
  return (r ? Math.trunc : Math.round)(t * n) / n;
}
function Qt(t) {
  return t % 4 === 0 && (t % 100 !== 0 || t % 400 === 0);
}
function wt(t) {
  return Qt(t) ? 366 : 365;
}
function $r(t, e) {
  const r = Vf(e - 1, 12) + 1, n = t + (e - r) / 12;
  return r === 2 ? Qt(n) ? 29 : 28 : [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][r - 1];
}
function Yr(t) {
  let e = Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second, t.millisecond);
  return t.year < 100 && t.year >= 0 && (e = new Date(e), e.setUTCFullYear(t.year, t.month - 1, t.day)), +e;
}
function Si(t, e, r) {
  return -ws(ys(t, 1, e), r) + e - 1;
}
function Ht(t, e = 4, r = 1) {
  const n = Si(t, e, r), s = Si(t + 1, e, r);
  return (wt(t) - n + s) / 7;
}
function Zn(t) {
  return t > 99 ? t : t > j.twoDigitCutoffYear ? 1900 + t : 2e3 + t;
}
function vo(t, e, r, n = null) {
  const s = new Date(t), i = {
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  };
  n && (i.timeZone = n);
  const a = {
    timeZoneName: e,
    ...i
  }, o = new Intl.DateTimeFormat(r, a).formatToParts(s).find((u) => u.type.toLowerCase() === "timezonename");
  return o ? o.value : null;
}
function Jr(t, e) {
  let r = parseInt(t, 10);
  Number.isNaN(r) && (r = 0);
  const n = parseInt(e, 10) || 0, s = r < 0 || Object.is(r, -0) ? -n : n;
  return r * 60 + s;
}
function _o(t) {
  const e = Number(t);
  if (typeof t == "boolean" || t === "" || Number.isNaN(e)) throw new K(`Invalid unit value ${t}`);
  return e;
}
function Ur(t, e) {
  const r = {};
  for (const n in t)
    if (kt(t, n)) {
      const s = t[n];
      if (s == null) continue;
      r[e(n)] = _o(s);
    }
  return r;
}
function $t(t, e) {
  const r = Math.trunc(Math.abs(t / 60)), n = Math.trunc(Math.abs(t % 60)), s = t >= 0 ? "+" : "-";
  switch (e) {
    case "short":
      return `${s}${Y(r, 2)}:${Y(n, 2)}`;
    case "narrow":
      return `${s}${r}${n > 0 ? `:${n}` : ""}`;
    case "techie":
      return `${s}${Y(r, 2)}${Y(n, 2)}`;
    default:
      throw new RangeError(`Value format ${e} is out of range for property format`);
  }
}
function Qr(t) {
  return zf(t, ["hour", "minute", "second", "millisecond"]);
}
const jf = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], ko = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], Hf = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
function To(t) {
  switch (t) {
    case "narrow":
      return [...Hf];
    case "short":
      return [...ko];
    case "long":
      return [...jf];
    case "numeric":
      return ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
    case "2-digit":
      return ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    default:
      return null;
  }
}
const bo = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], So = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], qf = ["M", "T", "W", "T", "F", "S", "S"];
function Eo(t) {
  switch (t) {
    case "narrow":
      return [...qf];
    case "short":
      return [...So];
    case "long":
      return [...bo];
    case "numeric":
      return ["1", "2", "3", "4", "5", "6", "7"];
    default:
      return null;
  }
}
const Oo = ["AM", "PM"], Gf = ["Before Christ", "Anno Domini"], Bf = ["BC", "AD"], Zf = ["B", "A"];
function Do(t) {
  switch (t) {
    case "narrow":
      return [...Zf];
    case "short":
      return [...Bf];
    case "long":
      return [...Gf];
    default:
      return null;
  }
}
function Yf(t) {
  return Oo[t.hour < 12 ? 0 : 1];
}
function Jf(t, e) {
  return Eo(e)[t.weekday - 1];
}
function Qf(t, e) {
  return To(e)[t.month - 1];
}
function Kf(t, e) {
  return Do(e)[t.year < 0 ? 0 : 1];
}
function Xf(t, e, r = "always", n = !1) {
  const s = {
    years: ["year", "yr."],
    quarters: ["quarter", "qtr."],
    months: ["month", "mo."],
    weeks: ["week", "wk."],
    days: ["day", "day", "days"],
    hours: ["hour", "hr."],
    minutes: ["minute", "min."],
    seconds: ["second", "sec."]
  }, i = ["hours", "minutes", "seconds"].indexOf(t) === -1;
  if (r === "auto" && i) {
    const f = t === "days";
    switch (e) {
      case 1:
        return f ? "tomorrow" : `next ${s[t][0]}`;
      case -1:
        return f ? "yesterday" : `last ${s[t][0]}`;
      case 0:
        return f ? "today" : `this ${s[t][0]}`;
    }
  }
  const a = Object.is(e, -0) || e < 0, o = Math.abs(e), u = o === 1, c = s[t], l = n ? u ? c[1] : c[2] || c[1] : u ? s[t][0] : t;
  return a ? `${o} ${l} ago` : `in ${o} ${l}`;
}
function Ei(t, e) {
  let r = "";
  for (const n of t)
    n.literal ? r += n.val : r += e(n.val);
  return r;
}
const eh = {
  D: Lr,
  DD: Ha,
  DDD: qa,
  DDDD: Ga,
  t: Ba,
  tt: Za,
  ttt: Ya,
  tttt: Ja,
  T: Qa,
  TT: Ka,
  TTT: Xa,
  TTTT: eo,
  f: to,
  ff: no,
  fff: io,
  ffff: oo,
  F: ro,
  FF: so,
  FFF: ao,
  FFFF: uo
};
class X {
  static create(e, r = {}) {
    return new X(e, r);
  }
  static parseFormat(e) {
    let r = null, n = "", s = !1;
    const i = [];
    for (let a = 0; a < e.length; a++) {
      const o = e.charAt(a);
      o === "'" ? (n.length > 0 && i.push({
        literal: s || /^\s+$/.test(n),
        val: n
      }), r = null, n = "", s = !s) : s || o === r ? n += o : (n.length > 0 && i.push({
        literal: /^\s+$/.test(n),
        val: n
      }), n = o, r = o);
    }
    return n.length > 0 && i.push({
      literal: s || /^\s+$/.test(n),
      val: n
    }), i;
  }
  static macroTokenToFormatOpts(e) {
    return eh[e];
  }
  constructor(e, r) {
    this.opts = r, this.loc = e, this.systemLoc = null;
  }
  formatWithSystemDefault(e, r) {
    return this.systemLoc === null && (this.systemLoc = this.loc.redefaultToSystem()), this.systemLoc.dtFormatter(e, {
      ...this.opts,
      ...r
    }).format();
  }
  dtFormatter(e, r = {}) {
    return this.loc.dtFormatter(e, {
      ...this.opts,
      ...r
    });
  }
  formatDateTime(e, r) {
    return this.dtFormatter(e, r).format();
  }
  formatDateTimeParts(e, r) {
    return this.dtFormatter(e, r).formatToParts();
  }
  formatInterval(e, r) {
    return this.dtFormatter(e.start, r).dtf.formatRange(e.start.toJSDate(), e.end.toJSDate());
  }
  resolvedOptions(e, r) {
    return this.dtFormatter(e, r).resolvedOptions();
  }
  num(e, r = 0) {
    if (this.opts.forceSimple)
      return Y(e, r);
    const n = {
      ...this.opts
    };
    return r > 0 && (n.padTo = r), this.loc.numberFormatter(n).format(e);
  }
  formatDateTimeFromString(e, r) {
    const n = this.loc.listingMode() === "en", s = this.loc.outputCalendar && this.loc.outputCalendar !== "gregory", i = (d, m) => this.loc.extract(e, d, m), a = (d) => e.isOffsetFixed && e.offset === 0 && d.allowZ ? "Z" : e.isValid ? e.zone.formatOffset(e.ts, d.format) : "", o = () => n ? Yf(e) : i({
      hour: "numeric",
      hourCycle: "h12"
    }, "dayperiod"), u = (d, m) => n ? Qf(e, d) : i(m ? {
      month: d
    } : {
      month: d,
      day: "numeric"
    }, "month"), c = (d, m) => n ? Jf(e, d) : i(m ? {
      weekday: d
    } : {
      weekday: d,
      month: "long",
      day: "numeric"
    }, "weekday"), l = (d) => {
      const m = X.macroTokenToFormatOpts(d);
      return m ? this.formatWithSystemDefault(e, m) : d;
    }, f = (d) => n ? Kf(e, d) : i({
      era: d
    }, "era"), h = (d) => {
      switch (d) {
        case "S":
          return this.num(e.millisecond);
        case "u":
        case "SSS":
          return this.num(e.millisecond, 3);
        case "s":
          return this.num(e.second);
        case "ss":
          return this.num(e.second, 2);
        case "uu":
          return this.num(Math.floor(e.millisecond / 10), 2);
        case "uuu":
          return this.num(Math.floor(e.millisecond / 100));
        case "m":
          return this.num(e.minute);
        case "mm":
          return this.num(e.minute, 2);
        case "h":
          return this.num(e.hour % 12 === 0 ? 12 : e.hour % 12);
        case "hh":
          return this.num(e.hour % 12 === 0 ? 12 : e.hour % 12, 2);
        case "H":
          return this.num(e.hour);
        case "HH":
          return this.num(e.hour, 2);
        case "Z":
          return a({
            format: "narrow",
            allowZ: this.opts.allowZ
          });
        case "ZZ":
          return a({
            format: "short",
            allowZ: this.opts.allowZ
          });
        case "ZZZ":
          return a({
            format: "techie",
            allowZ: this.opts.allowZ
          });
        case "ZZZZ":
          return e.zone.offsetName(e.ts, {
            format: "short",
            locale: this.loc.locale
          });
        case "ZZZZZ":
          return e.zone.offsetName(e.ts, {
            format: "long",
            locale: this.loc.locale
          });
        case "z":
          return e.zoneName;
        case "a":
          return o();
        case "d":
          return s ? i({
            day: "numeric"
          }, "day") : this.num(e.day);
        case "dd":
          return s ? i({
            day: "2-digit"
          }, "day") : this.num(e.day, 2);
        case "c":
          return this.num(e.weekday);
        case "ccc":
          return c("short", !0);
        case "cccc":
          return c("long", !0);
        case "ccccc":
          return c("narrow", !0);
        case "E":
          return this.num(e.weekday);
        case "EEE":
          return c("short", !1);
        case "EEEE":
          return c("long", !1);
        case "EEEEE":
          return c("narrow", !1);
        case "L":
          return s ? i({
            month: "numeric",
            day: "numeric"
          }, "month") : this.num(e.month);
        case "LL":
          return s ? i({
            month: "2-digit",
            day: "numeric"
          }, "month") : this.num(e.month, 2);
        case "LLL":
          return u("short", !0);
        case "LLLL":
          return u("long", !0);
        case "LLLLL":
          return u("narrow", !0);
        case "M":
          return s ? i({
            month: "numeric"
          }, "month") : this.num(e.month);
        case "MM":
          return s ? i({
            month: "2-digit"
          }, "month") : this.num(e.month, 2);
        case "MMM":
          return u("short", !1);
        case "MMMM":
          return u("long", !1);
        case "MMMMM":
          return u("narrow", !1);
        case "y":
          return s ? i({
            year: "numeric"
          }, "year") : this.num(e.year);
        case "yy":
          return s ? i({
            year: "2-digit"
          }, "year") : this.num(e.year.toString().slice(-2), 2);
        case "yyyy":
          return s ? i({
            year: "numeric"
          }, "year") : this.num(e.year, 4);
        case "yyyyyy":
          return s ? i({
            year: "numeric"
          }, "year") : this.num(e.year, 6);
        case "G":
          return f("short");
        case "GG":
          return f("long");
        case "GGGGG":
          return f("narrow");
        case "kk":
          return this.num(e.weekYear.toString().slice(-2), 2);
        case "kkkk":
          return this.num(e.weekYear, 4);
        case "W":
          return this.num(e.weekNumber);
        case "WW":
          return this.num(e.weekNumber, 2);
        case "n":
          return this.num(e.localWeekNumber);
        case "nn":
          return this.num(e.localWeekNumber, 2);
        case "ii":
          return this.num(e.localWeekYear.toString().slice(-2), 2);
        case "iiii":
          return this.num(e.localWeekYear, 4);
        case "o":
          return this.num(e.ordinal);
        case "ooo":
          return this.num(e.ordinal, 3);
        case "q":
          return this.num(e.quarter);
        case "qq":
          return this.num(e.quarter, 2);
        case "X":
          return this.num(Math.floor(e.ts / 1e3));
        case "x":
          return this.num(e.ts);
        default:
          return l(d);
      }
    };
    return Ei(X.parseFormat(r), h);
  }
  formatDurationFromString(e, r) {
    const n = (u) => {
      switch (u[0]) {
        case "S":
          return "millisecond";
        case "s":
          return "second";
        case "m":
          return "minute";
        case "h":
          return "hour";
        case "d":
          return "day";
        case "w":
          return "week";
        case "M":
          return "month";
        case "y":
          return "year";
        default:
          return null;
      }
    }, s = (u) => (c) => {
      const l = n(c);
      return l ? this.num(u.get(l), c.length) : c;
    }, i = X.parseFormat(r), a = i.reduce((u, {
      literal: c,
      val: l
    }) => c ? u : u.concat(l), []), o = e.shiftTo(...a.map(n).filter((u) => u));
    return Ei(i, s(o));
  }
}
const Co = /[A-Za-z_+-]{1,256}(?::?\/[A-Za-z0-9_+-]{1,256}(?:\/[A-Za-z0-9_+-]{1,256})?)?/;
function Et(...t) {
  const e = t.reduce((r, n) => r + n.source, "");
  return RegExp(`^${e}$`);
}
function Ot(...t) {
  return (e) => t.reduce(([r, n, s], i) => {
    const [a, o, u] = i(e, s);
    return [{
      ...r,
      ...a
    }, o || n, u];
  }, [{}, null, 1]).slice(0, 2);
}
function Dt(t, ...e) {
  if (t == null)
    return [null, null];
  for (const [r, n] of e) {
    const s = r.exec(t);
    if (s)
      return n(s);
  }
  return [null, null];
}
function Io(...t) {
  return (e, r) => {
    const n = {};
    let s;
    for (s = 0; s < t.length; s++)
      n[t[s]] = je(e[r + s]);
    return [n, null, r + s];
  };
}
const xo = /(?:(Z)|([+-]\d\d)(?::?(\d\d))?)/, th = `(?:${xo.source}?(?:\\[(${Co.source})\\])?)?`, ks = /(\d\d)(?::?(\d\d)(?::?(\d\d)(?:[.,](\d{1,30}))?)?)?/, Fo = RegExp(`${ks.source}${th}`), Ts = RegExp(`(?:T${Fo.source})?`), rh = /([+-]\d{6}|\d{4})(?:-?(\d\d)(?:-?(\d\d))?)?/, nh = /(\d{4})-?W(\d\d)(?:-?(\d))?/, sh = /(\d{4})-?(\d{3})/, ih = Io("weekYear", "weekNumber", "weekDay"), ah = Io("year", "ordinal"), oh = /(\d{4})-(\d\d)-(\d\d)/, Mo = RegExp(`${ks.source} ?(?:${xo.source}|(${Co.source}))?`), uh = RegExp(`(?: ${Mo.source})?`);
function vt(t, e, r) {
  const n = t[e];
  return D(n) ? r : je(n);
}
function ch(t, e) {
  return [{
    year: vt(t, e),
    month: vt(t, e + 1, 1),
    day: vt(t, e + 2, 1)
  }, null, e + 3];
}
function Ct(t, e) {
  return [{
    hours: vt(t, e, 0),
    minutes: vt(t, e + 1, 0),
    seconds: vt(t, e + 2, 0),
    milliseconds: vs(t[e + 3])
  }, null, e + 4];
}
function Kt(t, e) {
  const r = !t[e] && !t[e + 1], n = Jr(t[e + 1], t[e + 2]), s = r ? null : ee.instance(n);
  return [{}, s, e + 3];
}
function Xt(t, e) {
  const r = t[e] ? Ie.create(t[e]) : null;
  return [{}, r, e + 1];
}
const lh = RegExp(`^T?${ks.source}$`), fh = /^-?P(?:(?:(-?\d{1,20}(?:\.\d{1,20})?)Y)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20}(?:\.\d{1,20})?)W)?(?:(-?\d{1,20}(?:\.\d{1,20})?)D)?(?:T(?:(-?\d{1,20}(?:\.\d{1,20})?)H)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20})(?:[.,](-?\d{1,20}))?S)?)?)$/;
function hh(t) {
  const [e, r, n, s, i, a, o, u, c] = t, l = e[0] === "-", f = u && u[0] === "-", h = (d, m = !1) => d !== void 0 && (m || d && l) ? -d : d;
  return [{
    years: h(Ke(r)),
    months: h(Ke(n)),
    weeks: h(Ke(s)),
    days: h(Ke(i)),
    hours: h(Ke(a)),
    minutes: h(Ke(o)),
    seconds: h(Ke(u), u === "-0"),
    milliseconds: h(vs(c), f)
  }];
}
const dh = {
  GMT: 0,
  EDT: -4 * 60,
  EST: -5 * 60,
  CDT: -5 * 60,
  CST: -6 * 60,
  MDT: -6 * 60,
  MST: -7 * 60,
  PDT: -7 * 60,
  PST: -8 * 60
};
function bs(t, e, r, n, s, i, a) {
  const o = {
    year: e.length === 2 ? Zn(je(e)) : je(e),
    month: ko.indexOf(r) + 1,
    day: je(n),
    hour: je(s),
    minute: je(i)
  };
  return a && (o.second = je(a)), t && (o.weekday = t.length > 3 ? bo.indexOf(t) + 1 : So.indexOf(t) + 1), o;
}
const mh = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|(?:([+-]\d\d)(\d\d)))$/;
function ph(t) {
  const [, e, r, n, s, i, a, o, u, c, l, f] = t, h = bs(e, s, n, r, i, a, o);
  let d;
  return u ? d = dh[u] : c ? d = 0 : d = Jr(l, f), [h, new ee(d)];
}
function gh(t) {
  return t.replace(/\([^()]*\)|[\n\t]/g, " ").replace(/(\s\s+)/g, " ").trim();
}
const yh = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d\d) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d\d):(\d\d):(\d\d) GMT$/, wh = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\d\d)-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d\d) (\d\d):(\d\d):(\d\d) GMT$/, vh = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ( \d|\d\d) (\d\d):(\d\d):(\d\d) (\d{4})$/;
function Oi(t) {
  const [, e, r, n, s, i, a, o] = t;
  return [bs(e, s, n, r, i, a, o), ee.utcInstance];
}
function _h(t) {
  const [, e, r, n, s, i, a, o] = t;
  return [bs(e, o, r, n, s, i, a), ee.utcInstance];
}
const kh = Et(rh, Ts), Th = Et(nh, Ts), bh = Et(sh, Ts), Sh = Et(Fo), Ro = Ot(ch, Ct, Kt, Xt), Eh = Ot(ih, Ct, Kt, Xt), Oh = Ot(ah, Ct, Kt, Xt), Dh = Ot(Ct, Kt, Xt);
function Ch(t) {
  return Dt(t, [kh, Ro], [Th, Eh], [bh, Oh], [Sh, Dh]);
}
function Ih(t) {
  return Dt(gh(t), [mh, ph]);
}
function xh(t) {
  return Dt(t, [yh, Oi], [wh, Oi], [vh, _h]);
}
function Fh(t) {
  return Dt(t, [fh, hh]);
}
const Mh = Ot(Ct);
function Rh(t) {
  return Dt(t, [lh, Mh]);
}
const Nh = Et(oh, uh), Ph = Et(Mo), Ah = Ot(Ct, Kt, Xt);
function Lh(t) {
  return Dt(t, [Nh, Ro], [Ph, Ah]);
}
const Di = "Invalid Duration", No = {
  weeks: {
    days: 7,
    hours: 7 * 24,
    minutes: 7 * 24 * 60,
    seconds: 7 * 24 * 60 * 60,
    milliseconds: 7 * 24 * 60 * 60 * 1e3
  },
  days: {
    hours: 24,
    minutes: 24 * 60,
    seconds: 24 * 60 * 60,
    milliseconds: 24 * 60 * 60 * 1e3
  },
  hours: {
    minutes: 60,
    seconds: 60 * 60,
    milliseconds: 60 * 60 * 1e3
  },
  minutes: {
    seconds: 60,
    milliseconds: 60 * 1e3
  },
  seconds: {
    milliseconds: 1e3
  }
}, Wh = {
  years: {
    quarters: 4,
    months: 12,
    weeks: 52,
    days: 365,
    hours: 365 * 24,
    minutes: 365 * 24 * 60,
    seconds: 365 * 24 * 60 * 60,
    milliseconds: 365 * 24 * 60 * 60 * 1e3
  },
  quarters: {
    months: 3,
    weeks: 13,
    days: 91,
    hours: 91 * 24,
    minutes: 91 * 24 * 60,
    seconds: 91 * 24 * 60 * 60,
    milliseconds: 91 * 24 * 60 * 60 * 1e3
  },
  months: {
    weeks: 4,
    days: 30,
    hours: 30 * 24,
    minutes: 30 * 24 * 60,
    seconds: 30 * 24 * 60 * 60,
    milliseconds: 30 * 24 * 60 * 60 * 1e3
  },
  ...No
}, pe = 146097 / 400, ft = 146097 / 4800, $h = {
  years: {
    quarters: 4,
    months: 12,
    weeks: pe / 7,
    days: pe,
    hours: pe * 24,
    minutes: pe * 24 * 60,
    seconds: pe * 24 * 60 * 60,
    milliseconds: pe * 24 * 60 * 60 * 1e3
  },
  quarters: {
    months: 3,
    weeks: pe / 28,
    days: pe / 4,
    hours: pe * 24 / 4,
    minutes: pe * 24 * 60 / 4,
    seconds: pe * 24 * 60 * 60 / 4,
    milliseconds: pe * 24 * 60 * 60 * 1e3 / 4
  },
  months: {
    weeks: ft / 7,
    days: ft,
    hours: ft * 24,
    minutes: ft * 24 * 60,
    seconds: ft * 24 * 60 * 60,
    milliseconds: ft * 24 * 60 * 60 * 1e3
  },
  ...No
}, it = ["years", "quarters", "months", "weeks", "days", "hours", "minutes", "seconds", "milliseconds"], Uh = it.slice(0).reverse();
function ze(t, e, r = !1) {
  const n = {
    values: r ? e.values : {
      ...t.values,
      ...e.values || {}
    },
    loc: t.loc.clone(e.loc),
    conversionAccuracy: e.conversionAccuracy || t.conversionAccuracy,
    matrix: e.matrix || t.matrix
  };
  return new R(n);
}
function Po(t, e) {
  var r;
  let n = (r = e.milliseconds) != null ? r : 0;
  for (const s of Uh.slice(1))
    e[s] && (n += e[s] * t[s].milliseconds);
  return n;
}
function Ci(t, e) {
  const r = Po(t, e) < 0 ? -1 : 1;
  it.reduceRight((n, s) => {
    if (D(e[s]))
      return n;
    if (n) {
      const i = e[n] * r, a = t[s][n], o = Math.floor(i / a);
      e[s] += o * r, e[n] -= o * a * r;
    }
    return s;
  }, null), it.reduce((n, s) => {
    if (D(e[s]))
      return n;
    if (n) {
      const i = e[n] % 1;
      e[n] -= i, e[s] += i * t[n][s];
    }
    return s;
  }, null);
}
function zh(t) {
  const e = {};
  for (const [r, n] of Object.entries(t))
    n !== 0 && (e[r] = n);
  return e;
}
class R {
  /**
   * @private
   */
  constructor(e) {
    const r = e.conversionAccuracy === "longterm" || !1;
    let n = r ? $h : Wh;
    e.matrix && (n = e.matrix), this.values = e.values, this.loc = e.loc || L.create(), this.conversionAccuracy = r ? "longterm" : "casual", this.invalid = e.invalid || null, this.matrix = n, this.isLuxonDuration = !0;
  }
  /**
   * Create Duration from a number of milliseconds.
   * @param {number} count of milliseconds
   * @param {Object} opts - options for parsing
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @return {Duration}
   */
  static fromMillis(e, r) {
    return R.fromObject({
      milliseconds: e
    }, r);
  }
  /**
   * Create a Duration from a JavaScript object with keys like 'years' and 'hours'.
   * If this object is empty then a zero milliseconds duration is returned.
   * @param {Object} obj - the object to create the DateTime from
   * @param {number} obj.years
   * @param {number} obj.quarters
   * @param {number} obj.months
   * @param {number} obj.weeks
   * @param {number} obj.days
   * @param {number} obj.hours
   * @param {number} obj.minutes
   * @param {number} obj.seconds
   * @param {number} obj.milliseconds
   * @param {Object} [opts=[]] - options for creating this Duration
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the preset conversion system to use
   * @param {string} [opts.matrix=Object] - the custom conversion system to use
   * @return {Duration}
   */
  static fromObject(e, r = {}) {
    if (e == null || typeof e != "object")
      throw new K(`Duration.fromObject: argument expected to be an object, got ${e === null ? "null" : typeof e}`);
    return new R({
      values: Ur(e, R.normalizeUnit),
      loc: L.fromObject(r),
      conversionAccuracy: r.conversionAccuracy,
      matrix: r.matrix
    });
  }
  /**
   * Create a Duration from DurationLike.
   *
   * @param {Object | number | Duration} durationLike
   * One of:
   * - object with keys like 'years' and 'hours'.
   * - number representing milliseconds
   * - Duration instance
   * @return {Duration}
   */
  static fromDurationLike(e) {
    if (qe(e))
      return R.fromMillis(e);
    if (R.isDuration(e))
      return e;
    if (typeof e == "object")
      return R.fromObject(e);
    throw new K(`Unknown duration argument ${e} of type ${typeof e}`);
  }
  /**
   * Create a Duration from an ISO 8601 duration string.
   * @param {string} text - text to parse
   * @param {Object} opts - options for parsing
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the preset conversion system to use
   * @param {string} [opts.matrix=Object] - the preset conversion system to use
   * @see https://en.wikipedia.org/wiki/ISO_8601#Durations
   * @example Duration.fromISO('P3Y6M1W4DT12H30M5S').toObject() //=> { years: 3, months: 6, weeks: 1, days: 4, hours: 12, minutes: 30, seconds: 5 }
   * @example Duration.fromISO('PT23H').toObject() //=> { hours: 23 }
   * @example Duration.fromISO('P5Y3M').toObject() //=> { years: 5, months: 3 }
   * @return {Duration}
   */
  static fromISO(e, r) {
    const [n] = Fh(e);
    return n ? R.fromObject(n, r) : R.invalid("unparsable", `the input "${e}" can't be parsed as ISO 8601`);
  }
  /**
   * Create a Duration from an ISO 8601 time string.
   * @param {string} text - text to parse
   * @param {Object} opts - options for parsing
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the preset conversion system to use
   * @param {string} [opts.matrix=Object] - the conversion system to use
   * @see https://en.wikipedia.org/wiki/ISO_8601#Times
   * @example Duration.fromISOTime('11:22:33.444').toObject() //=> { hours: 11, minutes: 22, seconds: 33, milliseconds: 444 }
   * @example Duration.fromISOTime('11:00').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @example Duration.fromISOTime('T11:00').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @example Duration.fromISOTime('1100').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @example Duration.fromISOTime('T1100').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @return {Duration}
   */
  static fromISOTime(e, r) {
    const [n] = Rh(e);
    return n ? R.fromObject(n, r) : R.invalid("unparsable", `the input "${e}" can't be parsed as ISO 8601`);
  }
  /**
   * Create an invalid Duration.
   * @param {string} reason - simple string of why this datetime is invalid. Should not contain parameters or anything else data-dependent
   * @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
   * @return {Duration}
   */
  static invalid(e, r = null) {
    if (!e)
      throw new K("need to specify a reason the Duration is invalid");
    const n = e instanceof Ee ? e : new Ee(e, r);
    if (j.throwOnInvalid)
      throw new hf(n);
    return new R({
      invalid: n
    });
  }
  /**
   * @private
   */
  static normalizeUnit(e) {
    const r = {
      year: "years",
      years: "years",
      quarter: "quarters",
      quarters: "quarters",
      month: "months",
      months: "months",
      week: "weeks",
      weeks: "weeks",
      day: "days",
      days: "days",
      hour: "hours",
      hours: "hours",
      minute: "minutes",
      minutes: "minutes",
      second: "seconds",
      seconds: "seconds",
      millisecond: "milliseconds",
      milliseconds: "milliseconds"
    }[e && e.toLowerCase()];
    if (!r) throw new ja(e);
    return r;
  }
  /**
   * Check if an object is a Duration. Works across context boundaries
   * @param {object} o
   * @return {boolean}
   */
  static isDuration(e) {
    return e && e.isLuxonDuration || !1;
  }
  /**
   * Get  the locale of a Duration, such 'en-GB'
   * @type {string}
   */
  get locale() {
    return this.isValid ? this.loc.locale : null;
  }
  /**
   * Get the numbering system of a Duration, such 'beng'. The numbering system is used when formatting the Duration
   *
   * @type {string}
   */
  get numberingSystem() {
    return this.isValid ? this.loc.numberingSystem : null;
  }
  /**
   * Returns a string representation of this Duration formatted according to the specified format string. You may use these tokens:
   * * `S` for milliseconds
   * * `s` for seconds
   * * `m` for minutes
   * * `h` for hours
   * * `d` for days
   * * `w` for weeks
   * * `M` for months
   * * `y` for years
   * Notes:
   * * Add padding by repeating the token, e.g. "yy" pads the years to two digits, "hhhh" pads the hours out to four digits
   * * Tokens can be escaped by wrapping with single quotes.
   * * The duration will be converted to the set of units in the format string using {@link Duration#shiftTo} and the Durations's conversion accuracy setting.
   * @param {string} fmt - the format string
   * @param {Object} opts - options
   * @param {boolean} [opts.floor=true] - floor numerical values
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("y d s") //=> "1 6 2"
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("yy dd sss") //=> "01 06 002"
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("M S") //=> "12 518402000"
   * @return {string}
   */
  toFormat(e, r = {}) {
    const n = {
      ...r,
      floor: r.round !== !1 && r.floor !== !1
    };
    return this.isValid ? X.create(this.loc, n).formatDurationFromString(this, e) : Di;
  }
  /**
   * Returns a string representation of a Duration with all units included.
   * To modify its behavior, use `listStyle` and any Intl.NumberFormat option, though `unitDisplay` is especially relevant.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#options
   * @param {Object} opts - Formatting options. Accepts the same keys as the options parameter of the native `Intl.NumberFormat` constructor, as well as `listStyle`.
   * @param {string} [opts.listStyle='narrow'] - How to format the merged list. Corresponds to the `style` property of the options parameter of the native `Intl.ListFormat` constructor.
   * @example
   * ```js
   * var dur = Duration.fromObject({ days: 1, hours: 5, minutes: 6 })
   * dur.toHuman() //=> '1 day, 5 hours, 6 minutes'
   * dur.toHuman({ listStyle: "long" }) //=> '1 day, 5 hours, and 6 minutes'
   * dur.toHuman({ unitDisplay: "short" }) //=> '1 day, 5 hr, 6 min'
   * ```
   */
  toHuman(e = {}) {
    if (!this.isValid) return Di;
    const r = it.map((n) => {
      const s = this.values[n];
      return D(s) ? null : this.loc.numberFormatter({
        style: "unit",
        unitDisplay: "long",
        ...e,
        unit: n.slice(0, -1)
      }).format(s);
    }).filter((n) => n);
    return this.loc.listFormatter({
      type: "conjunction",
      style: e.listStyle || "narrow",
      ...e
    }).format(r);
  }
  /**
   * Returns a JavaScript object with this Duration's values.
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toObject() //=> { years: 1, days: 6, seconds: 2 }
   * @return {Object}
   */
  toObject() {
    return this.isValid ? {
      ...this.values
    } : {};
  }
  /**
   * Returns an ISO 8601-compliant string representation of this Duration.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Durations
   * @example Duration.fromObject({ years: 3, seconds: 45 }).toISO() //=> 'P3YT45S'
   * @example Duration.fromObject({ months: 4, seconds: 45 }).toISO() //=> 'P4MT45S'
   * @example Duration.fromObject({ months: 5 }).toISO() //=> 'P5M'
   * @example Duration.fromObject({ minutes: 5 }).toISO() //=> 'PT5M'
   * @example Duration.fromObject({ milliseconds: 6 }).toISO() //=> 'PT0.006S'
   * @return {string}
   */
  toISO() {
    if (!this.isValid) return null;
    let e = "P";
    return this.years !== 0 && (e += this.years + "Y"), (this.months !== 0 || this.quarters !== 0) && (e += this.months + this.quarters * 3 + "M"), this.weeks !== 0 && (e += this.weeks + "W"), this.days !== 0 && (e += this.days + "D"), (this.hours !== 0 || this.minutes !== 0 || this.seconds !== 0 || this.milliseconds !== 0) && (e += "T"), this.hours !== 0 && (e += this.hours + "H"), this.minutes !== 0 && (e += this.minutes + "M"), (this.seconds !== 0 || this.milliseconds !== 0) && (e += _s(this.seconds + this.milliseconds / 1e3, 3) + "S"), e === "P" && (e += "T0S"), e;
  }
  /**
   * Returns an ISO 8601-compliant string representation of this Duration, formatted as a time of day.
   * Note that this will return null if the duration is invalid, negative, or equal to or greater than 24 hours.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Times
   * @param {Object} opts - options
   * @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
   * @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
   * @param {boolean} [opts.includePrefix=false] - include the `T` prefix
   * @param {string} [opts.format='extended'] - choose between the basic and extended format
   * @example Duration.fromObject({ hours: 11 }).toISOTime() //=> '11:00:00.000'
   * @example Duration.fromObject({ hours: 11 }).toISOTime({ suppressMilliseconds: true }) //=> '11:00:00'
   * @example Duration.fromObject({ hours: 11 }).toISOTime({ suppressSeconds: true }) //=> '11:00'
   * @example Duration.fromObject({ hours: 11 }).toISOTime({ includePrefix: true }) //=> 'T11:00:00.000'
   * @example Duration.fromObject({ hours: 11 }).toISOTime({ format: 'basic' }) //=> '110000.000'
   * @return {string}
   */
  toISOTime(e = {}) {
    if (!this.isValid) return null;
    const r = this.toMillis();
    return r < 0 || r >= 864e5 ? null : (e = {
      suppressMilliseconds: !1,
      suppressSeconds: !1,
      includePrefix: !1,
      format: "extended",
      ...e,
      includeOffset: !1
    }, O.fromMillis(r, {
      zone: "UTC"
    }).toISOTime(e));
  }
  /**
   * Returns an ISO 8601 representation of this Duration appropriate for use in JSON.
   * @return {string}
   */
  toJSON() {
    return this.toISO();
  }
  /**
   * Returns an ISO 8601 representation of this Duration appropriate for use in debugging.
   * @return {string}
   */
  toString() {
    return this.toISO();
  }
  /**
   * Returns a string representation of this Duration appropriate for the REPL.
   * @return {string}
   */
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return this.isValid ? `Duration { values: ${JSON.stringify(this.values)} }` : `Duration { Invalid, reason: ${this.invalidReason} }`;
  }
  /**
   * Returns an milliseconds value of this Duration.
   * @return {number}
   */
  toMillis() {
    return this.isValid ? Po(this.matrix, this.values) : NaN;
  }
  /**
   * Returns an milliseconds value of this Duration. Alias of {@link toMillis}
   * @return {number}
   */
  valueOf() {
    return this.toMillis();
  }
  /**
   * Make this Duration longer by the specified amount. Return a newly-constructed Duration.
   * @param {Duration|Object|number} duration - The amount to add. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   * @return {Duration}
   */
  plus(e) {
    if (!this.isValid) return this;
    const r = R.fromDurationLike(e), n = {};
    for (const s of it)
      (kt(r.values, s) || kt(this.values, s)) && (n[s] = r.get(s) + this.get(s));
    return ze(this, {
      values: n
    }, !0);
  }
  /**
   * Make this Duration shorter by the specified amount. Return a newly-constructed Duration.
   * @param {Duration|Object|number} duration - The amount to subtract. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   * @return {Duration}
   */
  minus(e) {
    if (!this.isValid) return this;
    const r = R.fromDurationLike(e);
    return this.plus(r.negate());
  }
  /**
   * Scale this Duration by the specified amount. Return a newly-constructed Duration.
   * @param {function} fn - The function to apply to each unit. Arity is 1 or 2: the value of the unit and, optionally, the unit name. Must return a number.
   * @example Duration.fromObject({ hours: 1, minutes: 30 }).mapUnits(x => x * 2) //=> { hours: 2, minutes: 60 }
   * @example Duration.fromObject({ hours: 1, minutes: 30 }).mapUnits((x, u) => u === "hours" ? x * 2 : x) //=> { hours: 2, minutes: 30 }
   * @return {Duration}
   */
  mapUnits(e) {
    if (!this.isValid) return this;
    const r = {};
    for (const n of Object.keys(this.values))
      r[n] = _o(e(this.values[n], n));
    return ze(this, {
      values: r
    }, !0);
  }
  /**
   * Get the value of unit.
   * @param {string} unit - a unit such as 'minute' or 'day'
   * @example Duration.fromObject({years: 2, days: 3}).get('years') //=> 2
   * @example Duration.fromObject({years: 2, days: 3}).get('months') //=> 0
   * @example Duration.fromObject({years: 2, days: 3}).get('days') //=> 3
   * @return {number}
   */
  get(e) {
    return this[R.normalizeUnit(e)];
  }
  /**
   * "Set" the values of specified units. Return a newly-constructed Duration.
   * @param {Object} values - a mapping of units to numbers
   * @example dur.set({ years: 2017 })
   * @example dur.set({ hours: 8, minutes: 30 })
   * @return {Duration}
   */
  set(e) {
    if (!this.isValid) return this;
    const r = {
      ...this.values,
      ...Ur(e, R.normalizeUnit)
    };
    return ze(this, {
      values: r
    });
  }
  /**
   * "Set" the locale and/or numberingSystem.  Returns a newly-constructed Duration.
   * @example dur.reconfigure({ locale: 'en-GB' })
   * @return {Duration}
   */
  reconfigure({
    locale: e,
    numberingSystem: r,
    conversionAccuracy: n,
    matrix: s
  } = {}) {
    const a = {
      loc: this.loc.clone({
        locale: e,
        numberingSystem: r
      }),
      matrix: s,
      conversionAccuracy: n
    };
    return ze(this, a);
  }
  /**
   * Return the length of the duration in the specified unit.
   * @param {string} unit - a unit such as 'minutes' or 'days'
   * @example Duration.fromObject({years: 1}).as('days') //=> 365
   * @example Duration.fromObject({years: 1}).as('months') //=> 12
   * @example Duration.fromObject({hours: 60}).as('days') //=> 2.5
   * @return {number}
   */
  as(e) {
    return this.isValid ? this.shiftTo(e).get(e) : NaN;
  }
  /**
   * Reduce this Duration to its canonical representation in its current units.
   * Assuming the overall value of the Duration is positive, this means:
   * - excessive values for lower-order units are converted to higher-order units (if possible, see first and second example)
   * - negative lower-order units are converted to higher order units (there must be such a higher order unit, otherwise
   *   the overall value would be negative, see third example)
   * - fractional values for higher-order units are converted to lower-order units (if possible, see fourth example)
   *
   * If the overall value is negative, the result of this method is equivalent to `this.negate().normalize().negate()`.
   * @example Duration.fromObject({ years: 2, days: 5000 }).normalize().toObject() //=> { years: 15, days: 255 }
   * @example Duration.fromObject({ days: 5000 }).normalize().toObject() //=> { days: 5000 }
   * @example Duration.fromObject({ hours: 12, minutes: -45 }).normalize().toObject() //=> { hours: 11, minutes: 15 }
   * @example Duration.fromObject({ years: 2.5, days: 0, hours: 0 }).normalize().toObject() //=> { years: 2, days: 182, hours: 12 }
   * @return {Duration}
   */
  normalize() {
    if (!this.isValid) return this;
    const e = this.toObject();
    return Ci(this.matrix, e), ze(this, {
      values: e
    }, !0);
  }
  /**
   * Rescale units to its largest representation
   * @example Duration.fromObject({ milliseconds: 90000 }).rescale().toObject() //=> { minutes: 1, seconds: 30 }
   * @return {Duration}
   */
  rescale() {
    if (!this.isValid) return this;
    const e = zh(this.normalize().shiftToAll().toObject());
    return ze(this, {
      values: e
    }, !0);
  }
  /**
   * Convert this Duration into its representation in a different set of units.
   * @example Duration.fromObject({ hours: 1, seconds: 30 }).shiftTo('minutes', 'milliseconds').toObject() //=> { minutes: 60, milliseconds: 30000 }
   * @return {Duration}
   */
  shiftTo(...e) {
    if (!this.isValid) return this;
    if (e.length === 0)
      return this;
    e = e.map((a) => R.normalizeUnit(a));
    const r = {}, n = {}, s = this.toObject();
    let i;
    for (const a of it)
      if (e.indexOf(a) >= 0) {
        i = a;
        let o = 0;
        for (const c in n)
          o += this.matrix[c][a] * n[c], n[c] = 0;
        qe(s[a]) && (o += s[a]);
        const u = Math.trunc(o);
        r[a] = u, n[a] = (o * 1e3 - u * 1e3) / 1e3;
      } else qe(s[a]) && (n[a] = s[a]);
    for (const a in n)
      n[a] !== 0 && (r[i] += a === i ? n[a] : n[a] / this.matrix[i][a]);
    return Ci(this.matrix, r), ze(this, {
      values: r
    }, !0);
  }
  /**
   * Shift this Duration to all available units.
   * Same as shiftTo("years", "months", "weeks", "days", "hours", "minutes", "seconds", "milliseconds")
   * @return {Duration}
   */
  shiftToAll() {
    return this.isValid ? this.shiftTo("years", "months", "weeks", "days", "hours", "minutes", "seconds", "milliseconds") : this;
  }
  /**
   * Return the negative of this Duration.
   * @example Duration.fromObject({ hours: 1, seconds: 30 }).negate().toObject() //=> { hours: -1, seconds: -30 }
   * @return {Duration}
   */
  negate() {
    if (!this.isValid) return this;
    const e = {};
    for (const r of Object.keys(this.values))
      e[r] = this.values[r] === 0 ? 0 : -this.values[r];
    return ze(this, {
      values: e
    }, !0);
  }
  /**
   * Get the years.
   * @type {number}
   */
  get years() {
    return this.isValid ? this.values.years || 0 : NaN;
  }
  /**
   * Get the quarters.
   * @type {number}
   */
  get quarters() {
    return this.isValid ? this.values.quarters || 0 : NaN;
  }
  /**
   * Get the months.
   * @type {number}
   */
  get months() {
    return this.isValid ? this.values.months || 0 : NaN;
  }
  /**
   * Get the weeks
   * @type {number}
   */
  get weeks() {
    return this.isValid ? this.values.weeks || 0 : NaN;
  }
  /**
   * Get the days.
   * @type {number}
   */
  get days() {
    return this.isValid ? this.values.days || 0 : NaN;
  }
  /**
   * Get the hours.
   * @type {number}
   */
  get hours() {
    return this.isValid ? this.values.hours || 0 : NaN;
  }
  /**
   * Get the minutes.
   * @type {number}
   */
  get minutes() {
    return this.isValid ? this.values.minutes || 0 : NaN;
  }
  /**
   * Get the seconds.
   * @return {number}
   */
  get seconds() {
    return this.isValid ? this.values.seconds || 0 : NaN;
  }
  /**
   * Get the milliseconds.
   * @return {number}
   */
  get milliseconds() {
    return this.isValid ? this.values.milliseconds || 0 : NaN;
  }
  /**
   * Returns whether the Duration is invalid. Invalid durations are returned by diff operations
   * on invalid DateTimes or Intervals.
   * @return {boolean}
   */
  get isValid() {
    return this.invalid === null;
  }
  /**
   * Returns an error code if this Duration became invalid, or null if the Duration is valid
   * @return {string}
   */
  get invalidReason() {
    return this.invalid ? this.invalid.reason : null;
  }
  /**
   * Returns an explanation of why this Duration became invalid, or null if the Duration is valid
   * @type {string}
   */
  get invalidExplanation() {
    return this.invalid ? this.invalid.explanation : null;
  }
  /**
   * Equality check
   * Two Durations are equal iff they have the same units and the same values for each unit.
   * @param {Duration} other
   * @return {boolean}
   */
  equals(e) {
    if (!this.isValid || !e.isValid || !this.loc.equals(e.loc))
      return !1;
    function r(n, s) {
      return n === void 0 || n === 0 ? s === void 0 || s === 0 : n === s;
    }
    for (const n of it)
      if (!r(this.values[n], e.values[n]))
        return !1;
    return !0;
  }
}
const ht = "Invalid Interval";
function Vh(t, e) {
  return !t || !t.isValid ? V.invalid("missing or invalid start") : !e || !e.isValid ? V.invalid("missing or invalid end") : e < t ? V.invalid("end before start", `The end of an interval must be after its start, but you had start=${t.toISO()} and end=${e.toISO()}`) : null;
}
class V {
  /**
   * @private
   */
  constructor(e) {
    this.s = e.start, this.e = e.end, this.invalid = e.invalid || null, this.isLuxonInterval = !0;
  }
  /**
   * Create an invalid Interval.
   * @param {string} reason - simple string of why this Interval is invalid. Should not contain parameters or anything else data-dependent
   * @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
   * @return {Interval}
   */
  static invalid(e, r = null) {
    if (!e)
      throw new K("need to specify a reason the Interval is invalid");
    const n = e instanceof Ee ? e : new Ee(e, r);
    if (j.throwOnInvalid)
      throw new ff(n);
    return new V({
      invalid: n
    });
  }
  /**
   * Create an Interval from a start DateTime and an end DateTime. Inclusive of the start but not the end.
   * @param {DateTime|Date|Object} start
   * @param {DateTime|Date|Object} end
   * @return {Interval}
   */
  static fromDateTimes(e, r) {
    const n = Mt(e), s = Mt(r), i = Vh(n, s);
    return i ?? new V({
      start: n,
      end: s
    });
  }
  /**
   * Create an Interval from a start DateTime and a Duration to extend to.
   * @param {DateTime|Date|Object} start
   * @param {Duration|Object|number} duration - the length of the Interval.
   * @return {Interval}
   */
  static after(e, r) {
    const n = R.fromDurationLike(r), s = Mt(e);
    return V.fromDateTimes(s, s.plus(n));
  }
  /**
   * Create an Interval from an end DateTime and a Duration to extend backwards to.
   * @param {DateTime|Date|Object} end
   * @param {Duration|Object|number} duration - the length of the Interval.
   * @return {Interval}
   */
  static before(e, r) {
    const n = R.fromDurationLike(r), s = Mt(e);
    return V.fromDateTimes(s.minus(n), s);
  }
  /**
   * Create an Interval from an ISO 8601 string.
   * Accepts `<start>/<end>`, `<start>/<duration>`, and `<duration>/<end>` formats.
   * @param {string} text - the ISO string to parse
   * @param {Object} [opts] - options to pass {@link DateTime#fromISO} and optionally {@link Duration#fromISO}
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @return {Interval}
   */
  static fromISO(e, r) {
    const [n, s] = (e || "").split("/", 2);
    if (n && s) {
      let i, a;
      try {
        i = O.fromISO(n, r), a = i.isValid;
      } catch {
        a = !1;
      }
      let o, u;
      try {
        o = O.fromISO(s, r), u = o.isValid;
      } catch {
        u = !1;
      }
      if (a && u)
        return V.fromDateTimes(i, o);
      if (a) {
        const c = R.fromISO(s, r);
        if (c.isValid)
          return V.after(i, c);
      } else if (u) {
        const c = R.fromISO(n, r);
        if (c.isValid)
          return V.before(o, c);
      }
    }
    return V.invalid("unparsable", `the input "${e}" can't be parsed as ISO 8601`);
  }
  /**
   * Check if an object is an Interval. Works across context boundaries
   * @param {object} o
   * @return {boolean}
   */
  static isInterval(e) {
    return e && e.isLuxonInterval || !1;
  }
  /**
   * Returns the start of the Interval
   * @type {DateTime}
   */
  get start() {
    return this.isValid ? this.s : null;
  }
  /**
   * Returns the end of the Interval
   * @type {DateTime}
   */
  get end() {
    return this.isValid ? this.e : null;
  }
  /**
   * Returns whether this Interval's end is at least its start, meaning that the Interval isn't 'backwards'.
   * @type {boolean}
   */
  get isValid() {
    return this.invalidReason === null;
  }
  /**
   * Returns an error code if this Interval is invalid, or null if the Interval is valid
   * @type {string}
   */
  get invalidReason() {
    return this.invalid ? this.invalid.reason : null;
  }
  /**
   * Returns an explanation of why this Interval became invalid, or null if the Interval is valid
   * @type {string}
   */
  get invalidExplanation() {
    return this.invalid ? this.invalid.explanation : null;
  }
  /**
   * Returns the length of the Interval in the specified unit.
   * @param {string} unit - the unit (such as 'hours' or 'days') to return the length in.
   * @return {number}
   */
  length(e = "milliseconds") {
    return this.isValid ? this.toDuration(e).get(e) : NaN;
  }
  /**
   * Returns the count of minutes, hours, days, months, or years included in the Interval, even in part.
   * Unlike {@link Interval#length} this counts sections of the calendar, not periods of time, e.g. specifying 'day'
   * asks 'what dates are included in this interval?', not 'how many days long is this interval?'
   * @param {string} [unit='milliseconds'] - the unit of time to count.
   * @param {Object} opts - options
   * @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week; this operation will always use the locale of the start DateTime
   * @return {number}
   */
  count(e = "milliseconds", r) {
    if (!this.isValid) return NaN;
    const n = this.start.startOf(e, r);
    let s;
    return r != null && r.useLocaleWeeks ? s = this.end.reconfigure({
      locale: n.locale
    }) : s = this.end, s = s.startOf(e, r), Math.floor(s.diff(n, e).get(e)) + (s.valueOf() !== this.end.valueOf());
  }
  /**
   * Returns whether this Interval's start and end are both in the same unit of time
   * @param {string} unit - the unit of time to check sameness on
   * @return {boolean}
   */
  hasSame(e) {
    return this.isValid ? this.isEmpty() || this.e.minus(1).hasSame(this.s, e) : !1;
  }
  /**
   * Return whether this Interval has the same start and end DateTimes.
   * @return {boolean}
   */
  isEmpty() {
    return this.s.valueOf() === this.e.valueOf();
  }
  /**
   * Return whether this Interval's start is after the specified DateTime.
   * @param {DateTime} dateTime
   * @return {boolean}
   */
  isAfter(e) {
    return this.isValid ? this.s > e : !1;
  }
  /**
   * Return whether this Interval's end is before the specified DateTime.
   * @param {DateTime} dateTime
   * @return {boolean}
   */
  isBefore(e) {
    return this.isValid ? this.e <= e : !1;
  }
  /**
   * Return whether this Interval contains the specified DateTime.
   * @param {DateTime} dateTime
   * @return {boolean}
   */
  contains(e) {
    return this.isValid ? this.s <= e && this.e > e : !1;
  }
  /**
   * "Sets" the start and/or end dates. Returns a newly-constructed Interval.
   * @param {Object} values - the values to set
   * @param {DateTime} values.start - the starting DateTime
   * @param {DateTime} values.end - the ending DateTime
   * @return {Interval}
   */
  set({
    start: e,
    end: r
  } = {}) {
    return this.isValid ? V.fromDateTimes(e || this.s, r || this.e) : this;
  }
  /**
   * Split this Interval at each of the specified DateTimes
   * @param {...DateTime} dateTimes - the unit of time to count.
   * @return {Array}
   */
  splitAt(...e) {
    if (!this.isValid) return [];
    const r = e.map(Mt).filter((a) => this.contains(a)).sort((a, o) => a.toMillis() - o.toMillis()), n = [];
    let {
      s
    } = this, i = 0;
    for (; s < this.e; ) {
      const a = r[i] || this.e, o = +a > +this.e ? this.e : a;
      n.push(V.fromDateTimes(s, o)), s = o, i += 1;
    }
    return n;
  }
  /**
   * Split this Interval into smaller Intervals, each of the specified length.
   * Left over time is grouped into a smaller interval
   * @param {Duration|Object|number} duration - The length of each resulting interval.
   * @return {Array}
   */
  splitBy(e) {
    const r = R.fromDurationLike(e);
    if (!this.isValid || !r.isValid || r.as("milliseconds") === 0)
      return [];
    let {
      s: n
    } = this, s = 1, i;
    const a = [];
    for (; n < this.e; ) {
      const o = this.start.plus(r.mapUnits((u) => u * s));
      i = +o > +this.e ? this.e : o, a.push(V.fromDateTimes(n, i)), n = i, s += 1;
    }
    return a;
  }
  /**
   * Split this Interval into the specified number of smaller intervals.
   * @param {number} numberOfParts - The number of Intervals to divide the Interval into.
   * @return {Array}
   */
  divideEqually(e) {
    return this.isValid ? this.splitBy(this.length() / e).slice(0, e) : [];
  }
  /**
   * Return whether this Interval overlaps with the specified Interval
   * @param {Interval} other
   * @return {boolean}
   */
  overlaps(e) {
    return this.e > e.s && this.s < e.e;
  }
  /**
   * Return whether this Interval's end is adjacent to the specified Interval's start.
   * @param {Interval} other
   * @return {boolean}
   */
  abutsStart(e) {
    return this.isValid ? +this.e == +e.s : !1;
  }
  /**
   * Return whether this Interval's start is adjacent to the specified Interval's end.
   * @param {Interval} other
   * @return {boolean}
   */
  abutsEnd(e) {
    return this.isValid ? +e.e == +this.s : !1;
  }
  /**
   * Returns true if this Interval fully contains the specified Interval, specifically if the intersect (of this Interval and the other Interval) is equal to the other Interval; false otherwise.
   * @param {Interval} other
   * @return {boolean}
   */
  engulfs(e) {
    return this.isValid ? this.s <= e.s && this.e >= e.e : !1;
  }
  /**
   * Return whether this Interval has the same start and end as the specified Interval.
   * @param {Interval} other
   * @return {boolean}
   */
  equals(e) {
    return !this.isValid || !e.isValid ? !1 : this.s.equals(e.s) && this.e.equals(e.e);
  }
  /**
   * Return an Interval representing the intersection of this Interval and the specified Interval.
   * Specifically, the resulting Interval has the maximum start time and the minimum end time of the two Intervals.
   * Returns null if the intersection is empty, meaning, the intervals don't intersect.
   * @param {Interval} other
   * @return {Interval}
   */
  intersection(e) {
    if (!this.isValid) return this;
    const r = this.s > e.s ? this.s : e.s, n = this.e < e.e ? this.e : e.e;
    return r >= n ? null : V.fromDateTimes(r, n);
  }
  /**
   * Return an Interval representing the union of this Interval and the specified Interval.
   * Specifically, the resulting Interval has the minimum start time and the maximum end time of the two Intervals.
   * @param {Interval} other
   * @return {Interval}
   */
  union(e) {
    if (!this.isValid) return this;
    const r = this.s < e.s ? this.s : e.s, n = this.e > e.e ? this.e : e.e;
    return V.fromDateTimes(r, n);
  }
  /**
   * Merge an array of Intervals into a equivalent minimal set of Intervals.
   * Combines overlapping and adjacent Intervals.
   * @param {Array} intervals
   * @return {Array}
   */
  static merge(e) {
    const [r, n] = e.sort((s, i) => s.s - i.s).reduce(([s, i], a) => i ? i.overlaps(a) || i.abutsStart(a) ? [s, i.union(a)] : [s.concat([i]), a] : [s, a], [[], null]);
    return n && r.push(n), r;
  }
  /**
   * Return an array of Intervals representing the spans of time that only appear in one of the specified Intervals.
   * @param {Array} intervals
   * @return {Array}
   */
  static xor(e) {
    let r = null, n = 0;
    const s = [], i = e.map((u) => [{
      time: u.s,
      type: "s"
    }, {
      time: u.e,
      type: "e"
    }]), a = Array.prototype.concat(...i), o = a.sort((u, c) => u.time - c.time);
    for (const u of o)
      n += u.type === "s" ? 1 : -1, n === 1 ? r = u.time : (r && +r != +u.time && s.push(V.fromDateTimes(r, u.time)), r = null);
    return V.merge(s);
  }
  /**
   * Return an Interval representing the span of time in this Interval that doesn't overlap with any of the specified Intervals.
   * @param {...Interval} intervals
   * @return {Array}
   */
  difference(...e) {
    return V.xor([this].concat(e)).map((r) => this.intersection(r)).filter((r) => r && !r.isEmpty());
  }
  /**
   * Returns a string representation of this Interval appropriate for debugging.
   * @return {string}
   */
  toString() {
    return this.isValid ? `[${this.s.toISO()} – ${this.e.toISO()})` : ht;
  }
  /**
   * Returns a string representation of this Interval appropriate for the REPL.
   * @return {string}
   */
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return this.isValid ? `Interval { start: ${this.s.toISO()}, end: ${this.e.toISO()} }` : `Interval { Invalid, reason: ${this.invalidReason} }`;
  }
  /**
   * Returns a localized string representing this Interval. Accepts the same options as the
   * Intl.DateTimeFormat constructor and any presets defined by Luxon, such as
   * {@link DateTime.DATE_FULL} or {@link DateTime.TIME_SIMPLE}. The exact behavior of this method
   * is browser-specific, but in general it will return an appropriate representation of the
   * Interval in the assigned locale. Defaults to the system's locale if no locale has been
   * specified.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
   * @param {Object} [formatOpts=DateTime.DATE_SHORT] - Either a DateTime preset or
   * Intl.DateTimeFormat constructor options.
   * @param {Object} opts - Options to override the configuration of the start DateTime.
   * @example Interval.fromISO('2022-11-07T09:00Z/2022-11-08T09:00Z').toLocaleString(); //=> 11/7/2022 – 11/8/2022
   * @example Interval.fromISO('2022-11-07T09:00Z/2022-11-08T09:00Z').toLocaleString(DateTime.DATE_FULL); //=> November 7 – 8, 2022
   * @example Interval.fromISO('2022-11-07T09:00Z/2022-11-08T09:00Z').toLocaleString(DateTime.DATE_FULL, { locale: 'fr-FR' }); //=> 7–8 novembre 2022
   * @example Interval.fromISO('2022-11-07T17:00Z/2022-11-07T19:00Z').toLocaleString(DateTime.TIME_SIMPLE); //=> 6:00 – 8:00 PM
   * @example Interval.fromISO('2022-11-07T17:00Z/2022-11-07T19:00Z').toLocaleString({ weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }); //=> Mon, Nov 07, 6:00 – 8:00 p
   * @return {string}
   */
  toLocaleString(e = Lr, r = {}) {
    return this.isValid ? X.create(this.s.loc.clone(r), e).formatInterval(this) : ht;
  }
  /**
   * Returns an ISO 8601-compliant string representation of this Interval.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @param {Object} opts - The same options as {@link DateTime#toISO}
   * @return {string}
   */
  toISO(e) {
    return this.isValid ? `${this.s.toISO(e)}/${this.e.toISO(e)}` : ht;
  }
  /**
   * Returns an ISO 8601-compliant string representation of date of this Interval.
   * The time components are ignored.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @return {string}
   */
  toISODate() {
    return this.isValid ? `${this.s.toISODate()}/${this.e.toISODate()}` : ht;
  }
  /**
   * Returns an ISO 8601-compliant string representation of time of this Interval.
   * The date components are ignored.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @param {Object} opts - The same options as {@link DateTime#toISO}
   * @return {string}
   */
  toISOTime(e) {
    return this.isValid ? `${this.s.toISOTime(e)}/${this.e.toISOTime(e)}` : ht;
  }
  /**
   * Returns a string representation of this Interval formatted according to the specified format
   * string. **You may not want this.** See {@link Interval#toLocaleString} for a more flexible
   * formatting tool.
   * @param {string} dateFormat - The format string. This string formats the start and end time.
   * See {@link DateTime#toFormat} for details.
   * @param {Object} opts - Options.
   * @param {string} [opts.separator =  ' – '] - A separator to place between the start and end
   * representations.
   * @return {string}
   */
  toFormat(e, {
    separator: r = " – "
  } = {}) {
    return this.isValid ? `${this.s.toFormat(e)}${r}${this.e.toFormat(e)}` : ht;
  }
  /**
   * Return a Duration representing the time spanned by this interval.
   * @param {string|string[]} [unit=['milliseconds']] - the unit or units (such as 'hours' or 'days') to include in the duration.
   * @param {Object} opts - options that affect the creation of the Duration
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @example Interval.fromDateTimes(dt1, dt2).toDuration().toObject() //=> { milliseconds: 88489257 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration('days').toObject() //=> { days: 1.0241812152777778 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration(['hours', 'minutes']).toObject() //=> { hours: 24, minutes: 34.82095 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration(['hours', 'minutes', 'seconds']).toObject() //=> { hours: 24, minutes: 34, seconds: 49.257 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration('seconds').toObject() //=> { seconds: 88489.257 }
   * @return {Duration}
   */
  toDuration(e, r) {
    return this.isValid ? this.e.diff(this.s, e, r) : R.invalid(this.invalidReason);
  }
  /**
   * Run mapFn on the interval start and end, returning a new Interval from the resulting DateTimes
   * @param {function} mapFn
   * @return {Interval}
   * @example Interval.fromDateTimes(dt1, dt2).mapEndpoints(endpoint => endpoint.toUTC())
   * @example Interval.fromDateTimes(dt1, dt2).mapEndpoints(endpoint => endpoint.plus({ hours: 2 }))
   */
  mapEndpoints(e) {
    return V.fromDateTimes(e(this.s), e(this.e));
  }
}
class Pt {
  /**
   * Return whether the specified zone contains a DST.
   * @param {string|Zone} [zone='local'] - Zone to check. Defaults to the environment's local zone.
   * @return {boolean}
   */
  static hasDST(e = j.defaultZone) {
    const r = O.now().setZone(e).set({
      month: 12
    });
    return !e.isUniversal && r.offset !== r.set({
      month: 6
    }).offset;
  }
  /**
   * Return whether the specified zone is a valid IANA specifier.
   * @param {string} zone - Zone to check
   * @return {boolean}
   */
  static isValidIANAZone(e) {
    return Ie.isValidZone(e);
  }
  /**
   * Converts the input into a {@link Zone} instance.
   *
   * * If `input` is already a Zone instance, it is returned unchanged.
   * * If `input` is a string containing a valid time zone name, a Zone instance
   *   with that name is returned.
   * * If `input` is a string that doesn't refer to a known time zone, a Zone
   *   instance with {@link Zone#isValid} == false is returned.
   * * If `input is a number, a Zone instance with the specified fixed offset
   *   in minutes is returned.
   * * If `input` is `null` or `undefined`, the default zone is returned.
   * @param {string|Zone|number} [input] - the value to be converted
   * @return {Zone}
   */
  static normalizeZone(e) {
    return He(e, j.defaultZone);
  }
  /**
   * Get the weekday on which the week starts according to the given locale.
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @returns {number} the start of the week, 1 for Monday through 7 for Sunday
   */
  static getStartOfWeek({
    locale: e = null,
    locObj: r = null
  } = {}) {
    return (r || L.create(e)).getStartOfWeek();
  }
  /**
   * Get the minimum number of days necessary in a week before it is considered part of the next year according
   * to the given locale.
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @returns {number}
   */
  static getMinimumDaysInFirstWeek({
    locale: e = null,
    locObj: r = null
  } = {}) {
    return (r || L.create(e)).getMinDaysInFirstWeek();
  }
  /**
   * Get the weekdays, which are considered the weekend according to the given locale
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @returns {number[]} an array of weekdays, 1 for Monday through 7 for Sunday
   */
  static getWeekendWeekdays({
    locale: e = null,
    locObj: r = null
  } = {}) {
    return (r || L.create(e)).getWeekendDays().slice();
  }
  /**
   * Return an array of standalone month names.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
   * @param {string} [length='long'] - the length of the month representation, such as "numeric", "2-digit", "narrow", "short", "long"
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @param {string} [opts.outputCalendar='gregory'] - the calendar
   * @example Info.months()[0] //=> 'January'
   * @example Info.months('short')[0] //=> 'Jan'
   * @example Info.months('numeric')[0] //=> '1'
   * @example Info.months('short', { locale: 'fr-CA' } )[0] //=> 'janv.'
   * @example Info.months('numeric', { locale: 'ar' })[0] //=> '١'
   * @example Info.months('long', { outputCalendar: 'islamic' })[0] //=> 'Rabiʻ I'
   * @return {Array}
   */
  static months(e = "long", {
    locale: r = null,
    numberingSystem: n = null,
    locObj: s = null,
    outputCalendar: i = "gregory"
  } = {}) {
    return (s || L.create(r, n, i)).months(e);
  }
  /**
   * Return an array of format month names.
   * Format months differ from standalone months in that they're meant to appear next to the day of the month. In some languages, that
   * changes the string.
   * See {@link Info#months}
   * @param {string} [length='long'] - the length of the month representation, such as "numeric", "2-digit", "narrow", "short", "long"
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @param {string} [opts.outputCalendar='gregory'] - the calendar
   * @return {Array}
   */
  static monthsFormat(e = "long", {
    locale: r = null,
    numberingSystem: n = null,
    locObj: s = null,
    outputCalendar: i = "gregory"
  } = {}) {
    return (s || L.create(r, n, i)).months(e, !0);
  }
  /**
   * Return an array of standalone week names.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
   * @param {string} [length='long'] - the length of the weekday representation, such as "narrow", "short", "long".
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @example Info.weekdays()[0] //=> 'Monday'
   * @example Info.weekdays('short')[0] //=> 'Mon'
   * @example Info.weekdays('short', { locale: 'fr-CA' })[0] //=> 'lun.'
   * @example Info.weekdays('short', { locale: 'ar' })[0] //=> 'الاثنين'
   * @return {Array}
   */
  static weekdays(e = "long", {
    locale: r = null,
    numberingSystem: n = null,
    locObj: s = null
  } = {}) {
    return (s || L.create(r, n, null)).weekdays(e);
  }
  /**
   * Return an array of format week names.
   * Format weekdays differ from standalone weekdays in that they're meant to appear next to more date information. In some languages, that
   * changes the string.
   * See {@link Info#weekdays}
   * @param {string} [length='long'] - the length of the month representation, such as "narrow", "short", "long".
   * @param {Object} opts - options
   * @param {string} [opts.locale=null] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @return {Array}
   */
  static weekdaysFormat(e = "long", {
    locale: r = null,
    numberingSystem: n = null,
    locObj: s = null
  } = {}) {
    return (s || L.create(r, n, null)).weekdays(e, !0);
  }
  /**
   * Return an array of meridiems.
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @example Info.meridiems() //=> [ 'AM', 'PM' ]
   * @example Info.meridiems({ locale: 'my' }) //=> [ 'နံနက်', 'ညနေ' ]
   * @return {Array}
   */
  static meridiems({
    locale: e = null
  } = {}) {
    return L.create(e).meridiems();
  }
  /**
   * Return an array of eras, such as ['BC', 'AD']. The locale can be specified, but the calendar system is always Gregorian.
   * @param {string} [length='short'] - the length of the era representation, such as "short" or "long".
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @example Info.eras() //=> [ 'BC', 'AD' ]
   * @example Info.eras('long') //=> [ 'Before Christ', 'Anno Domini' ]
   * @example Info.eras('long', { locale: 'fr' }) //=> [ 'avant Jésus-Christ', 'après Jésus-Christ' ]
   * @return {Array}
   */
  static eras(e = "short", {
    locale: r = null
  } = {}) {
    return L.create(r, null, "gregory").eras(e);
  }
  /**
   * Return the set of available features in this environment.
   * Some features of Luxon are not available in all environments. For example, on older browsers, relative time formatting support is not available. Use this function to figure out if that's the case.
   * Keys:
   * * `relative`: whether this environment supports relative time formatting
   * * `localeWeek`: whether this environment supports different weekdays for the start of the week based on the locale
   * @example Info.features() //=> { relative: false, localeWeek: true }
   * @return {Object}
   */
  static features() {
    return {
      relative: yo(),
      localeWeek: wo()
    };
  }
}
function Ii(t, e) {
  const r = (s) => s.toUTC(0, {
    keepLocalTime: !0
  }).startOf("day").valueOf(), n = r(e) - r(t);
  return Math.floor(R.fromMillis(n).as("days"));
}
function jh(t, e, r) {
  const n = [["years", (u, c) => c.year - u.year], ["quarters", (u, c) => c.quarter - u.quarter + (c.year - u.year) * 4], ["months", (u, c) => c.month - u.month + (c.year - u.year) * 12], ["weeks", (u, c) => {
    const l = Ii(u, c);
    return (l - l % 7) / 7;
  }], ["days", Ii]], s = {}, i = t;
  let a, o;
  for (const [u, c] of n)
    r.indexOf(u) >= 0 && (a = u, s[u] = c(t, e), o = i.plus(s), o > e ? (s[u]--, t = i.plus(s), t > e && (o = t, s[u]--, t = i.plus(s))) : t = o);
  return [t, s, o, a];
}
function Hh(t, e, r, n) {
  let [s, i, a, o] = jh(t, e, r);
  const u = e - s, c = r.filter((f) => ["hours", "minutes", "seconds", "milliseconds"].indexOf(f) >= 0);
  c.length === 0 && (a < e && (a = s.plus({
    [o]: 1
  })), a !== s && (i[o] = (i[o] || 0) + u / (a - s)));
  const l = R.fromObject(i, n);
  return c.length > 0 ? R.fromMillis(u, n).shiftTo(...c).plus(l) : l;
}
const qh = "missing Intl.DateTimeFormat.formatToParts support";
function P(t, e = (r) => r) {
  return {
    regex: t,
    deser: ([r]) => e(Nf(r))
  };
}
const Gh = " ", Ao = `[ ${Gh}]`, Lo = new RegExp(Ao, "g");
function Bh(t) {
  return t.replace(/\./g, "\\.?").replace(Lo, Ao);
}
function xi(t) {
  return t.replace(/\./g, "").replace(Lo, " ").toLowerCase();
}
function be(t, e) {
  return t === null ? null : {
    regex: RegExp(t.map(Bh).join("|")),
    deser: ([r]) => t.findIndex((n) => xi(r) === xi(n)) + e
  };
}
function Fi(t, e) {
  return {
    regex: t,
    deser: ([, r, n]) => Jr(r, n),
    groups: e
  };
}
function hr(t) {
  return {
    regex: t,
    deser: ([e]) => e
  };
}
function Zh(t) {
  return t.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
}
function Yh(t, e) {
  const r = Te(e), n = Te(e, "{2}"), s = Te(e, "{3}"), i = Te(e, "{4}"), a = Te(e, "{6}"), o = Te(e, "{1,2}"), u = Te(e, "{1,3}"), c = Te(e, "{1,6}"), l = Te(e, "{1,9}"), f = Te(e, "{2,4}"), h = Te(e, "{4,6}"), d = (E) => ({
    regex: RegExp(Zh(E.val)),
    deser: ([v]) => v,
    literal: !0
  }), k = ((E) => {
    if (t.literal)
      return d(E);
    switch (E.val) {
      case "G":
        return be(e.eras("short"), 0);
      case "GG":
        return be(e.eras("long"), 0);
      case "y":
        return P(c);
      case "yy":
        return P(f, Zn);
      case "yyyy":
        return P(i);
      case "yyyyy":
        return P(h);
      case "yyyyyy":
        return P(a);
      case "M":
        return P(o);
      case "MM":
        return P(n);
      case "MMM":
        return be(e.months("short", !0), 1);
      case "MMMM":
        return be(e.months("long", !0), 1);
      case "L":
        return P(o);
      case "LL":
        return P(n);
      case "LLL":
        return be(e.months("short", !1), 1);
      case "LLLL":
        return be(e.months("long", !1), 1);
      case "d":
        return P(o);
      case "dd":
        return P(n);
      case "o":
        return P(u);
      case "ooo":
        return P(s);
      case "HH":
        return P(n);
      case "H":
        return P(o);
      case "hh":
        return P(n);
      case "h":
        return P(o);
      case "mm":
        return P(n);
      case "m":
        return P(o);
      case "q":
        return P(o);
      case "qq":
        return P(n);
      case "s":
        return P(o);
      case "ss":
        return P(n);
      case "S":
        return P(u);
      case "SSS":
        return P(s);
      case "u":
        return hr(l);
      case "uu":
        return hr(o);
      case "uuu":
        return P(r);
      case "a":
        return be(e.meridiems(), 0);
      case "kkkk":
        return P(i);
      case "kk":
        return P(f, Zn);
      case "W":
        return P(o);
      case "WW":
        return P(n);
      case "E":
      case "c":
        return P(r);
      case "EEE":
        return be(e.weekdays("short", !1), 1);
      case "EEEE":
        return be(e.weekdays("long", !1), 1);
      case "ccc":
        return be(e.weekdays("short", !0), 1);
      case "cccc":
        return be(e.weekdays("long", !0), 1);
      case "Z":
      case "ZZ":
        return Fi(new RegExp(`([+-]${o.source})(?::(${n.source}))?`), 2);
      case "ZZZ":
        return Fi(new RegExp(`([+-]${o.source})(${n.source})?`), 2);
      case "z":
        return hr(/[a-z_+-/]{1,256}?/i);
      case " ":
        return hr(/[^\S\n\r]/);
      default:
        return d(E);
    }
  })(t) || {
    invalidReason: qh
  };
  return k.token = t, k;
}
const Jh = {
  year: {
    "2-digit": "yy",
    numeric: "yyyyy"
  },
  month: {
    numeric: "M",
    "2-digit": "MM",
    short: "MMM",
    long: "MMMM"
  },
  day: {
    numeric: "d",
    "2-digit": "dd"
  },
  weekday: {
    short: "EEE",
    long: "EEEE"
  },
  dayperiod: "a",
  dayPeriod: "a",
  hour12: {
    numeric: "h",
    "2-digit": "hh"
  },
  hour24: {
    numeric: "H",
    "2-digit": "HH"
  },
  minute: {
    numeric: "m",
    "2-digit": "mm"
  },
  second: {
    numeric: "s",
    "2-digit": "ss"
  },
  timeZoneName: {
    long: "ZZZZZ",
    short: "ZZZ"
  }
};
function Qh(t, e, r) {
  const {
    type: n,
    value: s
  } = t;
  if (n === "literal") {
    const u = /^\s+$/.test(s);
    return {
      literal: !u,
      val: u ? " " : s
    };
  }
  const i = e[n];
  let a = n;
  n === "hour" && (e.hour12 != null ? a = e.hour12 ? "hour12" : "hour24" : e.hourCycle != null ? e.hourCycle === "h11" || e.hourCycle === "h12" ? a = "hour12" : a = "hour24" : a = r.hour12 ? "hour12" : "hour24");
  let o = Jh[a];
  if (typeof o == "object" && (o = o[i]), o)
    return {
      literal: !1,
      val: o
    };
}
function Kh(t) {
  return [`^${t.map((r) => r.regex).reduce((r, n) => `${r}(${n.source})`, "")}$`, t];
}
function Xh(t, e, r) {
  const n = t.match(e);
  if (n) {
    const s = {};
    let i = 1;
    for (const a in r)
      if (kt(r, a)) {
        const o = r[a], u = o.groups ? o.groups + 1 : 1;
        !o.literal && o.token && (s[o.token.val[0]] = o.deser(n.slice(i, i + u))), i += u;
      }
    return [n, s];
  } else
    return [n, {}];
}
function ed(t) {
  const e = (i) => {
    switch (i) {
      case "S":
        return "millisecond";
      case "s":
        return "second";
      case "m":
        return "minute";
      case "h":
      case "H":
        return "hour";
      case "d":
        return "day";
      case "o":
        return "ordinal";
      case "L":
      case "M":
        return "month";
      case "y":
        return "year";
      case "E":
      case "c":
        return "weekday";
      case "W":
        return "weekNumber";
      case "k":
        return "weekYear";
      case "q":
        return "quarter";
      default:
        return null;
    }
  };
  let r = null, n;
  return D(t.z) || (r = Ie.create(t.z)), D(t.Z) || (r || (r = new ee(t.Z)), n = t.Z), D(t.q) || (t.M = (t.q - 1) * 3 + 1), D(t.h) || (t.h < 12 && t.a === 1 ? t.h += 12 : t.h === 12 && t.a === 0 && (t.h = 0)), t.G === 0 && t.y && (t.y = -t.y), D(t.u) || (t.S = vs(t.u)), [Object.keys(t).reduce((i, a) => {
    const o = e(a);
    return o && (i[o] = t[a]), i;
  }, {}), r, n];
}
let wn = null;
function td() {
  return wn || (wn = O.fromMillis(1555555555555)), wn;
}
function rd(t, e) {
  if (t.literal)
    return t;
  const r = X.macroTokenToFormatOpts(t.val), n = zo(r, e);
  return n == null || n.includes(void 0) ? t : n;
}
function Wo(t, e) {
  return Array.prototype.concat(...t.map((r) => rd(r, e)));
}
class $o {
  constructor(e, r) {
    if (this.locale = e, this.format = r, this.tokens = Wo(X.parseFormat(r), e), this.units = this.tokens.map((n) => Yh(n, e)), this.disqualifyingUnit = this.units.find((n) => n.invalidReason), !this.disqualifyingUnit) {
      const [n, s] = Kh(this.units);
      this.regex = RegExp(n, "i"), this.handlers = s;
    }
  }
  explainFromTokens(e) {
    if (this.isValid) {
      const [r, n] = Xh(e, this.regex, this.handlers), [s, i, a] = n ? ed(n) : [null, null, void 0];
      if (kt(n, "a") && kt(n, "H"))
        throw new pt("Can't include meridiem when specifying 24-hour format");
      return {
        input: e,
        tokens: this.tokens,
        regex: this.regex,
        rawMatches: r,
        matches: n,
        result: s,
        zone: i,
        specificOffset: a
      };
    } else
      return {
        input: e,
        tokens: this.tokens,
        invalidReason: this.invalidReason
      };
  }
  get isValid() {
    return !this.disqualifyingUnit;
  }
  get invalidReason() {
    return this.disqualifyingUnit ? this.disqualifyingUnit.invalidReason : null;
  }
}
function Uo(t, e, r) {
  return new $o(t, r).explainFromTokens(e);
}
function nd(t, e, r) {
  const {
    result: n,
    zone: s,
    specificOffset: i,
    invalidReason: a
  } = Uo(t, e, r);
  return [n, s, i, a];
}
function zo(t, e) {
  if (!t)
    return null;
  const n = X.create(e, t).dtFormatter(td()), s = n.formatToParts(), i = n.resolvedOptions();
  return s.map((a) => Qh(a, t, i));
}
const vn = "Invalid DateTime", Mi = 864e13;
function At(t) {
  return new Ee("unsupported zone", `the zone "${t.name}" is not supported`);
}
function _n(t) {
  return t.weekData === null && (t.weekData = Wr(t.c)), t.weekData;
}
function kn(t) {
  return t.localWeekData === null && (t.localWeekData = Wr(t.c, t.loc.getMinDaysInFirstWeek(), t.loc.getStartOfWeek())), t.localWeekData;
}
function Xe(t, e) {
  const r = {
    ts: t.ts,
    zone: t.zone,
    c: t.c,
    o: t.o,
    loc: t.loc,
    invalid: t.invalid
  };
  return new O({
    ...r,
    ...e,
    old: r
  });
}
function Vo(t, e, r) {
  let n = t - e * 60 * 1e3;
  const s = r.offset(n);
  if (e === s)
    return [n, e];
  n -= (s - e) * 60 * 1e3;
  const i = r.offset(n);
  return s === i ? [n, s] : [t - Math.min(s, i) * 60 * 1e3, Math.max(s, i)];
}
function dr(t, e) {
  t += e * 60 * 1e3;
  const r = new Date(t);
  return {
    year: r.getUTCFullYear(),
    month: r.getUTCMonth() + 1,
    day: r.getUTCDate(),
    hour: r.getUTCHours(),
    minute: r.getUTCMinutes(),
    second: r.getUTCSeconds(),
    millisecond: r.getUTCMilliseconds()
  };
}
function Er(t, e, r) {
  return Vo(Yr(t), e, r);
}
function Ri(t, e) {
  const r = t.o, n = t.c.year + Math.trunc(e.years), s = t.c.month + Math.trunc(e.months) + Math.trunc(e.quarters) * 3, i = {
    ...t.c,
    year: n,
    month: s,
    day: Math.min(t.c.day, $r(n, s)) + Math.trunc(e.days) + Math.trunc(e.weeks) * 7
  }, a = R.fromObject({
    years: e.years - Math.trunc(e.years),
    quarters: e.quarters - Math.trunc(e.quarters),
    months: e.months - Math.trunc(e.months),
    weeks: e.weeks - Math.trunc(e.weeks),
    days: e.days - Math.trunc(e.days),
    hours: e.hours,
    minutes: e.minutes,
    seconds: e.seconds,
    milliseconds: e.milliseconds
  }).as("milliseconds"), o = Yr(i);
  let [u, c] = Vo(o, r, t.zone);
  return a !== 0 && (u += a, c = t.zone.offset(u)), {
    ts: u,
    o: c
  };
}
function dt(t, e, r, n, s, i) {
  const {
    setZone: a,
    zone: o
  } = r;
  if (t && Object.keys(t).length !== 0 || e) {
    const u = e || o, c = O.fromObject(t, {
      ...r,
      zone: u,
      specificOffset: i
    });
    return a ? c : c.setZone(o);
  } else
    return O.invalid(new Ee("unparsable", `the input "${s}" can't be parsed as ${n}`));
}
function mr(t, e, r = !0) {
  return t.isValid ? X.create(L.create("en-US"), {
    allowZ: r,
    forceSimple: !0
  }).formatDateTimeFromString(t, e) : null;
}
function Tn(t, e) {
  const r = t.c.year > 9999 || t.c.year < 0;
  let n = "";
  return r && t.c.year >= 0 && (n += "+"), n += Y(t.c.year, r ? 6 : 4), e ? (n += "-", n += Y(t.c.month), n += "-", n += Y(t.c.day)) : (n += Y(t.c.month), n += Y(t.c.day)), n;
}
function Ni(t, e, r, n, s, i) {
  let a = Y(t.c.hour);
  return e ? (a += ":", a += Y(t.c.minute), (t.c.millisecond !== 0 || t.c.second !== 0 || !r) && (a += ":")) : a += Y(t.c.minute), (t.c.millisecond !== 0 || t.c.second !== 0 || !r) && (a += Y(t.c.second), (t.c.millisecond !== 0 || !n) && (a += ".", a += Y(t.c.millisecond, 3))), s && (t.isOffsetFixed && t.offset === 0 && !i ? a += "Z" : t.o < 0 ? (a += "-", a += Y(Math.trunc(-t.o / 60)), a += ":", a += Y(Math.trunc(-t.o % 60))) : (a += "+", a += Y(Math.trunc(t.o / 60)), a += ":", a += Y(Math.trunc(t.o % 60)))), i && (a += "[" + t.zone.ianaName + "]"), a;
}
const jo = {
  month: 1,
  day: 1,
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0
}, sd = {
  weekNumber: 1,
  weekday: 1,
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0
}, id = {
  ordinal: 1,
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0
}, Ho = ["year", "month", "day", "hour", "minute", "second", "millisecond"], ad = ["weekYear", "weekNumber", "weekday", "hour", "minute", "second", "millisecond"], od = ["year", "ordinal", "hour", "minute", "second", "millisecond"];
function ud(t) {
  const e = {
    year: "year",
    years: "year",
    month: "month",
    months: "month",
    day: "day",
    days: "day",
    hour: "hour",
    hours: "hour",
    minute: "minute",
    minutes: "minute",
    quarter: "quarter",
    quarters: "quarter",
    second: "second",
    seconds: "second",
    millisecond: "millisecond",
    milliseconds: "millisecond",
    weekday: "weekday",
    weekdays: "weekday",
    weeknumber: "weekNumber",
    weeksnumber: "weekNumber",
    weeknumbers: "weekNumber",
    weekyear: "weekYear",
    weekyears: "weekYear",
    ordinal: "ordinal"
  }[t.toLowerCase()];
  if (!e) throw new ja(t);
  return e;
}
function Pi(t) {
  switch (t.toLowerCase()) {
    case "localweekday":
    case "localweekdays":
      return "localWeekday";
    case "localweeknumber":
    case "localweeknumbers":
      return "localWeekNumber";
    case "localweekyear":
    case "localweekyears":
      return "localWeekYear";
    default:
      return ud(t);
  }
}
function cd(t) {
  return Dr[t] || (Or === void 0 && (Or = j.now()), Dr[t] = t.offset(Or)), Dr[t];
}
function Ai(t, e) {
  const r = He(e.zone, j.defaultZone);
  if (!r.isValid)
    return O.invalid(At(r));
  const n = L.fromObject(e);
  let s, i;
  if (D(t.year))
    s = j.now();
  else {
    for (const u of Ho)
      D(t[u]) && (t[u] = jo[u]);
    const a = po(t) || go(t);
    if (a)
      return O.invalid(a);
    const o = cd(r);
    [s, i] = Er(t, o, r);
  }
  return new O({
    ts: s,
    zone: r,
    loc: n,
    o: i
  });
}
function Li(t, e, r) {
  const n = D(r.round) ? !0 : r.round, s = (a, o) => (a = _s(a, n || r.calendary ? 0 : 2, !0), e.loc.clone(r).relFormatter(r).format(a, o)), i = (a) => r.calendary ? e.hasSame(t, a) ? 0 : e.startOf(a).diff(t.startOf(a), a).get(a) : e.diff(t, a).get(a);
  if (r.unit)
    return s(i(r.unit), r.unit);
  for (const a of r.units) {
    const o = i(a);
    if (Math.abs(o) >= 1)
      return s(o, a);
  }
  return s(t > e ? -0 : 0, r.units[r.units.length - 1]);
}
function Wi(t) {
  let e = {}, r;
  return t.length > 0 && typeof t[t.length - 1] == "object" ? (e = t[t.length - 1], r = Array.from(t).slice(0, t.length - 1)) : r = Array.from(t), [e, r];
}
let Or, Dr = {};
class O {
  /**
   * @access private
   */
  constructor(e) {
    const r = e.zone || j.defaultZone;
    let n = e.invalid || (Number.isNaN(e.ts) ? new Ee("invalid input") : null) || (r.isValid ? null : At(r));
    this.ts = D(e.ts) ? j.now() : e.ts;
    let s = null, i = null;
    if (!n)
      if (e.old && e.old.ts === this.ts && e.old.zone.equals(r))
        [s, i] = [e.old.c, e.old.o];
      else {
        const o = qe(e.o) && !e.old ? e.o : r.offset(this.ts);
        s = dr(this.ts, o), n = Number.isNaN(s.year) ? new Ee("invalid input") : null, s = n ? null : s, i = n ? null : o;
      }
    this._zone = r, this.loc = e.loc || L.create(), this.invalid = n, this.weekData = null, this.localWeekData = null, this.c = s, this.o = i, this.isLuxonDateTime = !0;
  }
  // CONSTRUCT
  /**
   * Create a DateTime for the current instant, in the system's time zone.
   *
   * Use Settings to override these default values if needed.
   * @example DateTime.now().toISO() //~> now in the ISO format
   * @return {DateTime}
   */
  static now() {
    return new O({});
  }
  /**
   * Create a local DateTime
   * @param {number} [year] - The calendar year. If omitted (as in, call `local()` with no arguments), the current time will be used
   * @param {number} [month=1] - The month, 1-indexed
   * @param {number} [day=1] - The day of the month, 1-indexed
   * @param {number} [hour=0] - The hour of the day, in 24-hour time
   * @param {number} [minute=0] - The minute of the hour, meaning a number between 0 and 59
   * @param {number} [second=0] - The second of the minute, meaning a number between 0 and 59
   * @param {number} [millisecond=0] - The millisecond of the second, meaning a number between 0 and 999
   * @example DateTime.local()                                  //~> now
   * @example DateTime.local({ zone: "America/New_York" })      //~> now, in US east coast time
   * @example DateTime.local(2017)                              //~> 2017-01-01T00:00:00
   * @example DateTime.local(2017, 3)                           //~> 2017-03-01T00:00:00
   * @example DateTime.local(2017, 3, 12, { locale: "fr" })     //~> 2017-03-12T00:00:00, with a French locale
   * @example DateTime.local(2017, 3, 12, 5)                    //~> 2017-03-12T05:00:00
   * @example DateTime.local(2017, 3, 12, 5, { zone: "utc" })   //~> 2017-03-12T05:00:00, in UTC
   * @example DateTime.local(2017, 3, 12, 5, 45)                //~> 2017-03-12T05:45:00
   * @example DateTime.local(2017, 3, 12, 5, 45, 10)            //~> 2017-03-12T05:45:10
   * @example DateTime.local(2017, 3, 12, 5, 45, 10, 765)       //~> 2017-03-12T05:45:10.765
   * @return {DateTime}
   */
  static local() {
    const [e, r] = Wi(arguments), [n, s, i, a, o, u, c] = r;
    return Ai({
      year: n,
      month: s,
      day: i,
      hour: a,
      minute: o,
      second: u,
      millisecond: c
    }, e);
  }
  /**
   * Create a DateTime in UTC
   * @param {number} [year] - The calendar year. If omitted (as in, call `utc()` with no arguments), the current time will be used
   * @param {number} [month=1] - The month, 1-indexed
   * @param {number} [day=1] - The day of the month
   * @param {number} [hour=0] - The hour of the day, in 24-hour time
   * @param {number} [minute=0] - The minute of the hour, meaning a number between 0 and 59
   * @param {number} [second=0] - The second of the minute, meaning a number between 0 and 59
   * @param {number} [millisecond=0] - The millisecond of the second, meaning a number between 0 and 999
   * @param {Object} options - configuration options for the DateTime
   * @param {string} [options.locale] - a locale to set on the resulting DateTime instance
   * @param {string} [options.outputCalendar] - the output calendar to set on the resulting DateTime instance
   * @param {string} [options.numberingSystem] - the numbering system to set on the resulting DateTime instance
   * @param {string} [options.weekSettings] - the week settings to set on the resulting DateTime instance
   * @example DateTime.utc()                                              //~> now
   * @example DateTime.utc(2017)                                          //~> 2017-01-01T00:00:00Z
   * @example DateTime.utc(2017, 3)                                       //~> 2017-03-01T00:00:00Z
   * @example DateTime.utc(2017, 3, 12)                                   //~> 2017-03-12T00:00:00Z
   * @example DateTime.utc(2017, 3, 12, 5)                                //~> 2017-03-12T05:00:00Z
   * @example DateTime.utc(2017, 3, 12, 5, 45)                            //~> 2017-03-12T05:45:00Z
   * @example DateTime.utc(2017, 3, 12, 5, 45, { locale: "fr" })          //~> 2017-03-12T05:45:00Z with a French locale
   * @example DateTime.utc(2017, 3, 12, 5, 45, 10)                        //~> 2017-03-12T05:45:10Z
   * @example DateTime.utc(2017, 3, 12, 5, 45, 10, 765, { locale: "fr" }) //~> 2017-03-12T05:45:10.765Z with a French locale
   * @return {DateTime}
   */
  static utc() {
    const [e, r] = Wi(arguments), [n, s, i, a, o, u, c] = r;
    return e.zone = ee.utcInstance, Ai({
      year: n,
      month: s,
      day: i,
      hour: a,
      minute: o,
      second: u,
      millisecond: c
    }, e);
  }
  /**
   * Create a DateTime from a JavaScript Date object. Uses the default zone.
   * @param {Date} date - a JavaScript Date object
   * @param {Object} options - configuration options for the DateTime
   * @param {string|Zone} [options.zone='local'] - the zone to place the DateTime into
   * @return {DateTime}
   */
  static fromJSDate(e, r = {}) {
    const n = $f(e) ? e.valueOf() : NaN;
    if (Number.isNaN(n))
      return O.invalid("invalid input");
    const s = He(r.zone, j.defaultZone);
    return s.isValid ? new O({
      ts: n,
      zone: s,
      loc: L.fromObject(r)
    }) : O.invalid(At(s));
  }
  /**
   * Create a DateTime from a number of milliseconds since the epoch (meaning since 1 January 1970 00:00:00 UTC). Uses the default zone.
   * @param {number} milliseconds - a number of milliseconds since 1970 UTC
   * @param {Object} options - configuration options for the DateTime
   * @param {string|Zone} [options.zone='local'] - the zone to place the DateTime into
   * @param {string} [options.locale] - a locale to set on the resulting DateTime instance
   * @param {string} options.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} options.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @param {string} options.weekSettings - the week settings to set on the resulting DateTime instance
   * @return {DateTime}
   */
  static fromMillis(e, r = {}) {
    if (qe(e))
      return e < -Mi || e > Mi ? O.invalid("Timestamp out of range") : new O({
        ts: e,
        zone: He(r.zone, j.defaultZone),
        loc: L.fromObject(r)
      });
    throw new K(`fromMillis requires a numerical input, but received a ${typeof e} with value ${e}`);
  }
  /**
   * Create a DateTime from a number of seconds since the epoch (meaning since 1 January 1970 00:00:00 UTC). Uses the default zone.
   * @param {number} seconds - a number of seconds since 1970 UTC
   * @param {Object} options - configuration options for the DateTime
   * @param {string|Zone} [options.zone='local'] - the zone to place the DateTime into
   * @param {string} [options.locale] - a locale to set on the resulting DateTime instance
   * @param {string} options.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} options.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @param {string} options.weekSettings - the week settings to set on the resulting DateTime instance
   * @return {DateTime}
   */
  static fromSeconds(e, r = {}) {
    if (qe(e))
      return new O({
        ts: e * 1e3,
        zone: He(r.zone, j.defaultZone),
        loc: L.fromObject(r)
      });
    throw new K("fromSeconds requires a numerical input");
  }
  /**
   * Create a DateTime from a JavaScript object with keys like 'year' and 'hour' with reasonable defaults.
   * @param {Object} obj - the object to create the DateTime from
   * @param {number} obj.year - a year, such as 1987
   * @param {number} obj.month - a month, 1-12
   * @param {number} obj.day - a day of the month, 1-31, depending on the month
   * @param {number} obj.ordinal - day of the year, 1-365 or 366
   * @param {number} obj.weekYear - an ISO week year
   * @param {number} obj.weekNumber - an ISO week number, between 1 and 52 or 53, depending on the year
   * @param {number} obj.weekday - an ISO weekday, 1-7, where 1 is Monday and 7 is Sunday
   * @param {number} obj.localWeekYear - a week year, according to the locale
   * @param {number} obj.localWeekNumber - a week number, between 1 and 52 or 53, depending on the year, according to the locale
   * @param {number} obj.localWeekday - a weekday, 1-7, where 1 is the first and 7 is the last day of the week, according to the locale
   * @param {number} obj.hour - hour of the day, 0-23
   * @param {number} obj.minute - minute of the hour, 0-59
   * @param {number} obj.second - second of the minute, 0-59
   * @param {number} obj.millisecond - millisecond of the second, 0-999
   * @param {Object} opts - options for creating this DateTime
   * @param {string|Zone} [opts.zone='local'] - interpret the numbers in the context of a particular zone. Can take any value taken as the first argument to setZone()
   * @param {string} [opts.locale='system\'s locale'] - a locale to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
   * @example DateTime.fromObject({ year: 1982, month: 5, day: 25}).toISODate() //=> '1982-05-25'
   * @example DateTime.fromObject({ year: 1982 }).toISODate() //=> '1982-01-01'
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }) //~> today at 10:26:06
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'utc' }),
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'local' })
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'America/New_York' })
   * @example DateTime.fromObject({ weekYear: 2016, weekNumber: 2, weekday: 3 }).toISODate() //=> '2016-01-13'
   * @example DateTime.fromObject({ localWeekYear: 2022, localWeekNumber: 1, localWeekday: 1 }, { locale: "en-US" }).toISODate() //=> '2021-12-26'
   * @return {DateTime}
   */
  static fromObject(e, r = {}) {
    e = e || {};
    const n = He(r.zone, j.defaultZone);
    if (!n.isValid)
      return O.invalid(At(n));
    const s = L.fromObject(r), i = Ur(e, Pi), {
      minDaysInFirstWeek: a,
      startOfWeek: o
    } = Ti(i, s), u = j.now(), c = D(r.specificOffset) ? n.offset(u) : r.specificOffset, l = !D(i.ordinal), f = !D(i.year), h = !D(i.month) || !D(i.day), d = f || h, m = i.weekYear || i.weekNumber;
    if ((d || l) && m)
      throw new pt("Can't mix weekYear/weekNumber units with year/month/day or ordinals");
    if (h && l)
      throw new pt("Can't mix ordinal dates with month/day");
    const k = m || i.weekday && !d;
    let E, v, F = dr(u, c);
    k ? (E = ad, v = sd, F = Wr(F, a, o)) : l ? (E = od, v = id, F = yn(F)) : (E = Ho, v = jo);
    let z = !1;
    for (const Me of E) {
      const dn = i[Me];
      D(dn) ? z ? i[Me] = v[Me] : i[Me] = F[Me] : z = !0;
    }
    const re = k ? Af(i, a, o) : l ? Lf(i) : po(i), Q = re || go(i);
    if (Q)
      return O.invalid(Q);
    const cr = k ? _i(i, a, o) : l ? ki(i) : i, [Qe, Ft] = Er(cr, c, n), De = new O({
      ts: Qe,
      zone: n,
      o: Ft,
      loc: s
    });
    return i.weekday && d && e.weekday !== De.weekday ? O.invalid("mismatched weekday", `you can't specify both a weekday of ${i.weekday} and a date of ${De.toISO()}`) : De.isValid ? De : O.invalid(De.invalid);
  }
  /**
   * Create a DateTime from an ISO 8601 string
   * @param {string} text - the ISO string
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - use this zone if no offset is specified in the input string itself. Will also convert the time to this zone
   * @param {boolean} [opts.setZone=false] - override the zone with a fixed-offset zone specified in the string itself, if it specifies one
   * @param {string} [opts.locale='system's locale'] - a locale to set on the resulting DateTime instance
   * @param {string} [opts.outputCalendar] - the output calendar to set on the resulting DateTime instance
   * @param {string} [opts.numberingSystem] - the numbering system to set on the resulting DateTime instance
   * @param {string} [opts.weekSettings] - the week settings to set on the resulting DateTime instance
   * @example DateTime.fromISO('2016-05-25T09:08:34.123')
   * @example DateTime.fromISO('2016-05-25T09:08:34.123+06:00')
   * @example DateTime.fromISO('2016-05-25T09:08:34.123+06:00', {setZone: true})
   * @example DateTime.fromISO('2016-05-25T09:08:34.123', {zone: 'utc'})
   * @example DateTime.fromISO('2016-W05-4')
   * @return {DateTime}
   */
  static fromISO(e, r = {}) {
    const [n, s] = Ch(e);
    return dt(n, s, r, "ISO 8601", e);
  }
  /**
   * Create a DateTime from an RFC 2822 string
   * @param {string} text - the RFC 2822 string
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - convert the time to this zone. Since the offset is always specified in the string itself, this has no effect on the interpretation of string, merely the zone the resulting DateTime is expressed in.
   * @param {boolean} [opts.setZone=false] - override the zone with a fixed-offset zone specified in the string itself, if it specifies one
   * @param {string} [opts.locale='system's locale'] - a locale to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
   * @example DateTime.fromRFC2822('25 Nov 2016 13:23:12 GMT')
   * @example DateTime.fromRFC2822('Fri, 25 Nov 2016 13:23:12 +0600')
   * @example DateTime.fromRFC2822('25 Nov 2016 13:23 Z')
   * @return {DateTime}
   */
  static fromRFC2822(e, r = {}) {
    const [n, s] = Ih(e);
    return dt(n, s, r, "RFC 2822", e);
  }
  /**
   * Create a DateTime from an HTTP header date
   * @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.3.1
   * @param {string} text - the HTTP header date
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - convert the time to this zone. Since HTTP dates are always in UTC, this has no effect on the interpretation of string, merely the zone the resulting DateTime is expressed in.
   * @param {boolean} [opts.setZone=false] - override the zone with the fixed-offset zone specified in the string. For HTTP dates, this is always UTC, so this option is equivalent to setting the `zone` option to 'utc', but this option is included for consistency with similar methods.
   * @param {string} [opts.locale='system's locale'] - a locale to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
   * @example DateTime.fromHTTP('Sun, 06 Nov 1994 08:49:37 GMT')
   * @example DateTime.fromHTTP('Sunday, 06-Nov-94 08:49:37 GMT')
   * @example DateTime.fromHTTP('Sun Nov  6 08:49:37 1994')
   * @return {DateTime}
   */
  static fromHTTP(e, r = {}) {
    const [n, s] = xh(e);
    return dt(n, s, r, "HTTP", r);
  }
  /**
   * Create a DateTime from an input string and format string.
   * Defaults to en-US if no locale has been specified, regardless of the system's locale. For a table of tokens and their interpretations, see [here](https://moment.github.io/luxon/#/parsing?id=table-of-tokens).
   * @param {string} text - the string to parse
   * @param {string} fmt - the format the string is expected to be in (see the link below for the formats)
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - use this zone if no offset is specified in the input string itself. Will also convert the DateTime to this zone
   * @param {boolean} [opts.setZone=false] - override the zone with a zone specified in the string itself, if it specifies one
   * @param {string} [opts.locale='en-US'] - a locale string to use when parsing. Will also set the DateTime to this locale
   * @param {string} opts.numberingSystem - the numbering system to use when parsing. Will also set the resulting DateTime to this numbering system
   * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @return {DateTime}
   */
  static fromFormat(e, r, n = {}) {
    if (D(e) || D(r))
      throw new K("fromFormat requires an input string and a format");
    const {
      locale: s = null,
      numberingSystem: i = null
    } = n, a = L.fromOpts({
      locale: s,
      numberingSystem: i,
      defaultToEN: !0
    }), [o, u, c, l] = nd(a, e, r);
    return l ? O.invalid(l) : dt(o, u, n, `format ${r}`, e, c);
  }
  /**
   * @deprecated use fromFormat instead
   */
  static fromString(e, r, n = {}) {
    return O.fromFormat(e, r, n);
  }
  /**
   * Create a DateTime from a SQL date, time, or datetime
   * Defaults to en-US if no locale has been specified, regardless of the system's locale
   * @param {string} text - the string to parse
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - use this zone if no offset is specified in the input string itself. Will also convert the DateTime to this zone
   * @param {boolean} [opts.setZone=false] - override the zone with a zone specified in the string itself, if it specifies one
   * @param {string} [opts.locale='en-US'] - a locale string to use when parsing. Will also set the DateTime to this locale
   * @param {string} opts.numberingSystem - the numbering system to use when parsing. Will also set the resulting DateTime to this numbering system
   * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @example DateTime.fromSQL('2017-05-15')
   * @example DateTime.fromSQL('2017-05-15 09:12:34')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342+06:00')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342 America/Los_Angeles')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342 America/Los_Angeles', { setZone: true })
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342', { zone: 'America/Los_Angeles' })
   * @example DateTime.fromSQL('09:12:34.342')
   * @return {DateTime}
   */
  static fromSQL(e, r = {}) {
    const [n, s] = Lh(e);
    return dt(n, s, r, "SQL", e);
  }
  /**
   * Create an invalid DateTime.
   * @param {string} reason - simple string of why this DateTime is invalid. Should not contain parameters or anything else data-dependent.
   * @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
   * @return {DateTime}
   */
  static invalid(e, r = null) {
    if (!e)
      throw new K("need to specify a reason the DateTime is invalid");
    const n = e instanceof Ee ? e : new Ee(e, r);
    if (j.throwOnInvalid)
      throw new lf(n);
    return new O({
      invalid: n
    });
  }
  /**
   * Check if an object is an instance of DateTime. Works across context boundaries
   * @param {object} o
   * @return {boolean}
   */
  static isDateTime(e) {
    return e && e.isLuxonDateTime || !1;
  }
  /**
   * Produce the format string for a set of options
   * @param formatOpts
   * @param localeOpts
   * @returns {string}
   */
  static parseFormatForOpts(e, r = {}) {
    const n = zo(e, L.fromObject(r));
    return n ? n.map((s) => s ? s.val : null).join("") : null;
  }
  /**
   * Produce the the fully expanded format token for the locale
   * Does NOT quote characters, so quoted tokens will not round trip correctly
   * @param fmt
   * @param localeOpts
   * @returns {string}
   */
  static expandFormat(e, r = {}) {
    return Wo(X.parseFormat(e), L.fromObject(r)).map((s) => s.val).join("");
  }
  static resetCache() {
    Or = void 0, Dr = {};
  }
  // INFO
  /**
   * Get the value of unit.
   * @param {string} unit - a unit such as 'minute' or 'day'
   * @example DateTime.local(2017, 7, 4).get('month'); //=> 7
   * @example DateTime.local(2017, 7, 4).get('day'); //=> 4
   * @return {number}
   */
  get(e) {
    return this[e];
  }
  /**
   * Returns whether the DateTime is valid. Invalid DateTimes occur when:
   * * The DateTime was created from invalid calendar information, such as the 13th month or February 30
   * * The DateTime was created by an operation on another invalid date
   * @type {boolean}
   */
  get isValid() {
    return this.invalid === null;
  }
  /**
   * Returns an error code if this DateTime is invalid, or null if the DateTime is valid
   * @type {string}
   */
  get invalidReason() {
    return this.invalid ? this.invalid.reason : null;
  }
  /**
   * Returns an explanation of why this DateTime became invalid, or null if the DateTime is valid
   * @type {string}
   */
  get invalidExplanation() {
    return this.invalid ? this.invalid.explanation : null;
  }
  /**
   * Get the locale of a DateTime, such 'en-GB'. The locale is used when formatting the DateTime
   *
   * @type {string}
   */
  get locale() {
    return this.isValid ? this.loc.locale : null;
  }
  /**
   * Get the numbering system of a DateTime, such 'beng'. The numbering system is used when formatting the DateTime
   *
   * @type {string}
   */
  get numberingSystem() {
    return this.isValid ? this.loc.numberingSystem : null;
  }
  /**
   * Get the output calendar of a DateTime, such 'islamic'. The output calendar is used when formatting the DateTime
   *
   * @type {string}
   */
  get outputCalendar() {
    return this.isValid ? this.loc.outputCalendar : null;
  }
  /**
   * Get the time zone associated with this DateTime.
   * @type {Zone}
   */
  get zone() {
    return this._zone;
  }
  /**
   * Get the name of the time zone.
   * @type {string}
   */
  get zoneName() {
    return this.isValid ? this.zone.name : null;
  }
  /**
   * Get the year
   * @example DateTime.local(2017, 5, 25).year //=> 2017
   * @type {number}
   */
  get year() {
    return this.isValid ? this.c.year : NaN;
  }
  /**
   * Get the quarter
   * @example DateTime.local(2017, 5, 25).quarter //=> 2
   * @type {number}
   */
  get quarter() {
    return this.isValid ? Math.ceil(this.c.month / 3) : NaN;
  }
  /**
   * Get the month (1-12).
   * @example DateTime.local(2017, 5, 25).month //=> 5
   * @type {number}
   */
  get month() {
    return this.isValid ? this.c.month : NaN;
  }
  /**
   * Get the day of the month (1-30ish).
   * @example DateTime.local(2017, 5, 25).day //=> 25
   * @type {number}
   */
  get day() {
    return this.isValid ? this.c.day : NaN;
  }
  /**
   * Get the hour of the day (0-23).
   * @example DateTime.local(2017, 5, 25, 9).hour //=> 9
   * @type {number}
   */
  get hour() {
    return this.isValid ? this.c.hour : NaN;
  }
  /**
   * Get the minute of the hour (0-59).
   * @example DateTime.local(2017, 5, 25, 9, 30).minute //=> 30
   * @type {number}
   */
  get minute() {
    return this.isValid ? this.c.minute : NaN;
  }
  /**
   * Get the second of the minute (0-59).
   * @example DateTime.local(2017, 5, 25, 9, 30, 52).second //=> 52
   * @type {number}
   */
  get second() {
    return this.isValid ? this.c.second : NaN;
  }
  /**
   * Get the millisecond of the second (0-999).
   * @example DateTime.local(2017, 5, 25, 9, 30, 52, 654).millisecond //=> 654
   * @type {number}
   */
  get millisecond() {
    return this.isValid ? this.c.millisecond : NaN;
  }
  /**
   * Get the week year
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2014, 12, 31).weekYear //=> 2015
   * @type {number}
   */
  get weekYear() {
    return this.isValid ? _n(this).weekYear : NaN;
  }
  /**
   * Get the week number of the week year (1-52ish).
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2017, 5, 25).weekNumber //=> 21
   * @type {number}
   */
  get weekNumber() {
    return this.isValid ? _n(this).weekNumber : NaN;
  }
  /**
   * Get the day of the week.
   * 1 is Monday and 7 is Sunday
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2014, 11, 31).weekday //=> 4
   * @type {number}
   */
  get weekday() {
    return this.isValid ? _n(this).weekday : NaN;
  }
  /**
   * Returns true if this date is on a weekend according to the locale, false otherwise
   * @returns {boolean}
   */
  get isWeekend() {
    return this.isValid && this.loc.getWeekendDays().includes(this.weekday);
  }
  /**
   * Get the day of the week according to the locale.
   * 1 is the first day of the week and 7 is the last day of the week.
   * If the locale assigns Sunday as the first day of the week, then a date which is a Sunday will return 1,
   * @returns {number}
   */
  get localWeekday() {
    return this.isValid ? kn(this).weekday : NaN;
  }
  /**
   * Get the week number of the week year according to the locale. Different locales assign week numbers differently,
   * because the week can start on different days of the week (see localWeekday) and because a different number of days
   * is required for a week to count as the first week of a year.
   * @returns {number}
   */
  get localWeekNumber() {
    return this.isValid ? kn(this).weekNumber : NaN;
  }
  /**
   * Get the week year according to the locale. Different locales assign week numbers (and therefor week years)
   * differently, see localWeekNumber.
   * @returns {number}
   */
  get localWeekYear() {
    return this.isValid ? kn(this).weekYear : NaN;
  }
  /**
   * Get the ordinal (meaning the day of the year)
   * @example DateTime.local(2017, 5, 25).ordinal //=> 145
   * @type {number|DateTime}
   */
  get ordinal() {
    return this.isValid ? yn(this.c).ordinal : NaN;
  }
  /**
   * Get the human readable short month name, such as 'Oct'.
   * Defaults to the system's locale if no locale has been specified
   * @example DateTime.local(2017, 10, 30).monthShort //=> Oct
   * @type {string}
   */
  get monthShort() {
    return this.isValid ? Pt.months("short", {
      locObj: this.loc
    })[this.month - 1] : null;
  }
  /**
   * Get the human readable long month name, such as 'October'.
   * Defaults to the system's locale if no locale has been specified
   * @example DateTime.local(2017, 10, 30).monthLong //=> October
   * @type {string}
   */
  get monthLong() {
    return this.isValid ? Pt.months("long", {
      locObj: this.loc
    })[this.month - 1] : null;
  }
  /**
   * Get the human readable short weekday, such as 'Mon'.
   * Defaults to the system's locale if no locale has been specified
   * @example DateTime.local(2017, 10, 30).weekdayShort //=> Mon
   * @type {string}
   */
  get weekdayShort() {
    return this.isValid ? Pt.weekdays("short", {
      locObj: this.loc
    })[this.weekday - 1] : null;
  }
  /**
   * Get the human readable long weekday, such as 'Monday'.
   * Defaults to the system's locale if no locale has been specified
   * @example DateTime.local(2017, 10, 30).weekdayLong //=> Monday
   * @type {string}
   */
  get weekdayLong() {
    return this.isValid ? Pt.weekdays("long", {
      locObj: this.loc
    })[this.weekday - 1] : null;
  }
  /**
   * Get the UTC offset of this DateTime in minutes
   * @example DateTime.now().offset //=> -240
   * @example DateTime.utc().offset //=> 0
   * @type {number}
   */
  get offset() {
    return this.isValid ? +this.o : NaN;
  }
  /**
   * Get the short human name for the zone's current offset, for example "EST" or "EDT".
   * Defaults to the system's locale if no locale has been specified
   * @type {string}
   */
  get offsetNameShort() {
    return this.isValid ? this.zone.offsetName(this.ts, {
      format: "short",
      locale: this.locale
    }) : null;
  }
  /**
   * Get the long human name for the zone's current offset, for example "Eastern Standard Time" or "Eastern Daylight Time".
   * Defaults to the system's locale if no locale has been specified
   * @type {string}
   */
  get offsetNameLong() {
    return this.isValid ? this.zone.offsetName(this.ts, {
      format: "long",
      locale: this.locale
    }) : null;
  }
  /**
   * Get whether this zone's offset ever changes, as in a DST.
   * @type {boolean}
   */
  get isOffsetFixed() {
    return this.isValid ? this.zone.isUniversal : null;
  }
  /**
   * Get whether the DateTime is in a DST.
   * @type {boolean}
   */
  get isInDST() {
    return this.isOffsetFixed ? !1 : this.offset > this.set({
      month: 1,
      day: 1
    }).offset || this.offset > this.set({
      month: 5
    }).offset;
  }
  /**
   * Get those DateTimes which have the same local time as this DateTime, but a different offset from UTC
   * in this DateTime's zone. During DST changes local time can be ambiguous, for example
   * `2023-10-29T02:30:00` in `Europe/Berlin` can have offset `+01:00` or `+02:00`.
   * This method will return both possible DateTimes if this DateTime's local time is ambiguous.
   * @returns {DateTime[]}
   */
  getPossibleOffsets() {
    if (!this.isValid || this.isOffsetFixed)
      return [this];
    const e = 864e5, r = 6e4, n = Yr(this.c), s = this.zone.offset(n - e), i = this.zone.offset(n + e), a = this.zone.offset(n - s * r), o = this.zone.offset(n - i * r);
    if (a === o)
      return [this];
    const u = n - a * r, c = n - o * r, l = dr(u, a), f = dr(c, o);
    return l.hour === f.hour && l.minute === f.minute && l.second === f.second && l.millisecond === f.millisecond ? [Xe(this, {
      ts: u
    }), Xe(this, {
      ts: c
    })] : [this];
  }
  /**
   * Returns true if this DateTime is in a leap year, false otherwise
   * @example DateTime.local(2016).isInLeapYear //=> true
   * @example DateTime.local(2013).isInLeapYear //=> false
   * @type {boolean}
   */
  get isInLeapYear() {
    return Qt(this.year);
  }
  /**
   * Returns the number of days in this DateTime's month
   * @example DateTime.local(2016, 2).daysInMonth //=> 29
   * @example DateTime.local(2016, 3).daysInMonth //=> 31
   * @type {number}
   */
  get daysInMonth() {
    return $r(this.year, this.month);
  }
  /**
   * Returns the number of days in this DateTime's year
   * @example DateTime.local(2016).daysInYear //=> 366
   * @example DateTime.local(2013).daysInYear //=> 365
   * @type {number}
   */
  get daysInYear() {
    return this.isValid ? wt(this.year) : NaN;
  }
  /**
   * Returns the number of weeks in this DateTime's year
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2004).weeksInWeekYear //=> 53
   * @example DateTime.local(2013).weeksInWeekYear //=> 52
   * @type {number}
   */
  get weeksInWeekYear() {
    return this.isValid ? Ht(this.weekYear) : NaN;
  }
  /**
   * Returns the number of weeks in this DateTime's local week year
   * @example DateTime.local(2020, 6, {locale: 'en-US'}).weeksInLocalWeekYear //=> 52
   * @example DateTime.local(2020, 6, {locale: 'de-DE'}).weeksInLocalWeekYear //=> 53
   * @type {number}
   */
  get weeksInLocalWeekYear() {
    return this.isValid ? Ht(this.localWeekYear, this.loc.getMinDaysInFirstWeek(), this.loc.getStartOfWeek()) : NaN;
  }
  /**
   * Returns the resolved Intl options for this DateTime.
   * This is useful in understanding the behavior of formatting methods
   * @param {Object} opts - the same options as toLocaleString
   * @return {Object}
   */
  resolvedLocaleOptions(e = {}) {
    const {
      locale: r,
      numberingSystem: n,
      calendar: s
    } = X.create(this.loc.clone(e), e).resolvedOptions(this);
    return {
      locale: r,
      numberingSystem: n,
      outputCalendar: s
    };
  }
  // TRANSFORM
  /**
   * "Set" the DateTime's zone to UTC. Returns a newly-constructed DateTime.
   *
   * Equivalent to {@link DateTime#setZone}('utc')
   * @param {number} [offset=0] - optionally, an offset from UTC in minutes
   * @param {Object} [opts={}] - options to pass to `setZone()`
   * @return {DateTime}
   */
  toUTC(e = 0, r = {}) {
    return this.setZone(ee.instance(e), r);
  }
  /**
   * "Set" the DateTime's zone to the host's local zone. Returns a newly-constructed DateTime.
   *
   * Equivalent to `setZone('local')`
   * @return {DateTime}
   */
  toLocal() {
    return this.setZone(j.defaultZone);
  }
  /**
   * "Set" the DateTime's zone to specified zone. Returns a newly-constructed DateTime.
   *
   * By default, the setter keeps the underlying time the same (as in, the same timestamp), but the new instance will report different local times and consider DSTs when making computations, as with {@link DateTime#plus}. You may wish to use {@link DateTime#toLocal} and {@link DateTime#toUTC} which provide simple convenience wrappers for commonly used zones.
   * @param {string|Zone} [zone='local'] - a zone identifier. As a string, that can be any IANA zone supported by the host environment, or a fixed-offset name of the form 'UTC+3', or the strings 'local' or 'utc'. You may also supply an instance of a {@link DateTime#Zone} class.
   * @param {Object} opts - options
   * @param {boolean} [opts.keepLocalTime=false] - If true, adjust the underlying time so that the local time stays the same, but in the target zone. You should rarely need this.
   * @return {DateTime}
   */
  setZone(e, {
    keepLocalTime: r = !1,
    keepCalendarTime: n = !1
  } = {}) {
    if (e = He(e, j.defaultZone), e.equals(this.zone))
      return this;
    if (e.isValid) {
      let s = this.ts;
      if (r || n) {
        const i = e.offset(this.ts), a = this.toObject();
        [s] = Er(a, i, e);
      }
      return Xe(this, {
        ts: s,
        zone: e
      });
    } else
      return O.invalid(At(e));
  }
  /**
   * "Set" the locale, numberingSystem, or outputCalendar. Returns a newly-constructed DateTime.
   * @param {Object} properties - the properties to set
   * @example DateTime.local(2017, 5, 25).reconfigure({ locale: 'en-GB' })
   * @return {DateTime}
   */
  reconfigure({
    locale: e,
    numberingSystem: r,
    outputCalendar: n
  } = {}) {
    const s = this.loc.clone({
      locale: e,
      numberingSystem: r,
      outputCalendar: n
    });
    return Xe(this, {
      loc: s
    });
  }
  /**
   * "Set" the locale. Returns a newly-constructed DateTime.
   * Just a convenient alias for reconfigure({ locale })
   * @example DateTime.local(2017, 5, 25).setLocale('en-GB')
   * @return {DateTime}
   */
  setLocale(e) {
    return this.reconfigure({
      locale: e
    });
  }
  /**
   * "Set" the values of specified units. Returns a newly-constructed DateTime.
   * You can only set units with this method; for "setting" metadata, see {@link DateTime#reconfigure} and {@link DateTime#setZone}.
   *
   * This method also supports setting locale-based week units, i.e. `localWeekday`, `localWeekNumber` and `localWeekYear`.
   * They cannot be mixed with ISO-week units like `weekday`.
   * @param {Object} values - a mapping of units to numbers
   * @example dt.set({ year: 2017 })
   * @example dt.set({ hour: 8, minute: 30 })
   * @example dt.set({ weekday: 5 })
   * @example dt.set({ year: 2005, ordinal: 234 })
   * @return {DateTime}
   */
  set(e) {
    if (!this.isValid) return this;
    const r = Ur(e, Pi), {
      minDaysInFirstWeek: n,
      startOfWeek: s
    } = Ti(r, this.loc), i = !D(r.weekYear) || !D(r.weekNumber) || !D(r.weekday), a = !D(r.ordinal), o = !D(r.year), u = !D(r.month) || !D(r.day), c = o || u, l = r.weekYear || r.weekNumber;
    if ((c || a) && l)
      throw new pt("Can't mix weekYear/weekNumber units with year/month/day or ordinals");
    if (u && a)
      throw new pt("Can't mix ordinal dates with month/day");
    let f;
    i ? f = _i({
      ...Wr(this.c, n, s),
      ...r
    }, n, s) : D(r.ordinal) ? (f = {
      ...this.toObject(),
      ...r
    }, D(r.day) && (f.day = Math.min($r(f.year, f.month), f.day))) : f = ki({
      ...yn(this.c),
      ...r
    });
    const [h, d] = Er(f, this.o, this.zone);
    return Xe(this, {
      ts: h,
      o: d
    });
  }
  /**
   * Add a period of time to this DateTime and return the resulting DateTime
   *
   * Adding hours, minutes, seconds, or milliseconds increases the timestamp by the right number of milliseconds. Adding days, months, or years shifts the calendar, accounting for DSTs and leap years along the way. Thus, `dt.plus({ hours: 24 })` may result in a different time than `dt.plus({ days: 1 })` if there's a DST shift in between.
   * @param {Duration|Object|number} duration - The amount to add. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   * @example DateTime.now().plus(123) //~> in 123 milliseconds
   * @example DateTime.now().plus({ minutes: 15 }) //~> in 15 minutes
   * @example DateTime.now().plus({ days: 1 }) //~> this time tomorrow
   * @example DateTime.now().plus({ days: -1 }) //~> this time yesterday
   * @example DateTime.now().plus({ hours: 3, minutes: 13 }) //~> in 3 hr, 13 min
   * @example DateTime.now().plus(Duration.fromObject({ hours: 3, minutes: 13 })) //~> in 3 hr, 13 min
   * @return {DateTime}
   */
  plus(e) {
    if (!this.isValid) return this;
    const r = R.fromDurationLike(e);
    return Xe(this, Ri(this, r));
  }
  /**
   * Subtract a period of time to this DateTime and return the resulting DateTime
   * See {@link DateTime#plus}
   * @param {Duration|Object|number} duration - The amount to subtract. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   @return {DateTime}
   */
  minus(e) {
    if (!this.isValid) return this;
    const r = R.fromDurationLike(e).negate();
    return Xe(this, Ri(this, r));
  }
  /**
   * "Set" this DateTime to the beginning of a unit of time.
   * @param {string} unit - The unit to go to the beginning of. Can be 'year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', or 'millisecond'.
   * @param {Object} opts - options
   * @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week
   * @example DateTime.local(2014, 3, 3).startOf('month').toISODate(); //=> '2014-03-01'
   * @example DateTime.local(2014, 3, 3).startOf('year').toISODate(); //=> '2014-01-01'
   * @example DateTime.local(2014, 3, 3).startOf('week').toISODate(); //=> '2014-03-03', weeks always start on Mondays
   * @example DateTime.local(2014, 3, 3, 5, 30).startOf('day').toISOTime(); //=> '00:00.000-05:00'
   * @example DateTime.local(2014, 3, 3, 5, 30).startOf('hour').toISOTime(); //=> '05:00:00.000-05:00'
   * @return {DateTime}
   */
  startOf(e, {
    useLocaleWeeks: r = !1
  } = {}) {
    if (!this.isValid) return this;
    const n = {}, s = R.normalizeUnit(e);
    switch (s) {
      case "years":
        n.month = 1;
      case "quarters":
      case "months":
        n.day = 1;
      case "weeks":
      case "days":
        n.hour = 0;
      case "hours":
        n.minute = 0;
      case "minutes":
        n.second = 0;
      case "seconds":
        n.millisecond = 0;
        break;
    }
    if (s === "weeks")
      if (r) {
        const i = this.loc.getStartOfWeek(), {
          weekday: a
        } = this;
        a < i && (n.weekNumber = this.weekNumber - 1), n.weekday = i;
      } else
        n.weekday = 1;
    if (s === "quarters") {
      const i = Math.ceil(this.month / 3);
      n.month = (i - 1) * 3 + 1;
    }
    return this.set(n);
  }
  /**
   * "Set" this DateTime to the end (meaning the last millisecond) of a unit of time
   * @param {string} unit - The unit to go to the end of. Can be 'year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', or 'millisecond'.
   * @param {Object} opts - options
   * @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week
   * @example DateTime.local(2014, 3, 3).endOf('month').toISO(); //=> '2014-03-31T23:59:59.999-05:00'
   * @example DateTime.local(2014, 3, 3).endOf('year').toISO(); //=> '2014-12-31T23:59:59.999-05:00'
   * @example DateTime.local(2014, 3, 3).endOf('week').toISO(); // => '2014-03-09T23:59:59.999-05:00', weeks start on Mondays
   * @example DateTime.local(2014, 3, 3, 5, 30).endOf('day').toISO(); //=> '2014-03-03T23:59:59.999-05:00'
   * @example DateTime.local(2014, 3, 3, 5, 30).endOf('hour').toISO(); //=> '2014-03-03T05:59:59.999-05:00'
   * @return {DateTime}
   */
  endOf(e, r) {
    return this.isValid ? this.plus({
      [e]: 1
    }).startOf(e, r).minus(1) : this;
  }
  // OUTPUT
  /**
   * Returns a string representation of this DateTime formatted according to the specified format string.
   * **You may not want this.** See {@link DateTime#toLocaleString} for a more flexible formatting tool. For a table of tokens and their interpretations, see [here](https://moment.github.io/luxon/#/formatting?id=table-of-tokens).
   * Defaults to en-US if no locale has been specified, regardless of the system's locale.
   * @param {string} fmt - the format string
   * @param {Object} opts - opts to override the configuration options on this DateTime
   * @example DateTime.now().toFormat('yyyy LLL dd') //=> '2017 Apr 22'
   * @example DateTime.now().setLocale('fr').toFormat('yyyy LLL dd') //=> '2017 avr. 22'
   * @example DateTime.now().toFormat('yyyy LLL dd', { locale: "fr" }) //=> '2017 avr. 22'
   * @example DateTime.now().toFormat("HH 'hours and' mm 'minutes'") //=> '20 hours and 55 minutes'
   * @return {string}
   */
  toFormat(e, r = {}) {
    return this.isValid ? X.create(this.loc.redefaultToEN(r)).formatDateTimeFromString(this, e) : vn;
  }
  /**
   * Returns a localized string representing this date. Accepts the same options as the Intl.DateTimeFormat constructor and any presets defined by Luxon, such as `DateTime.DATE_FULL` or `DateTime.TIME_SIMPLE`.
   * The exact behavior of this method is browser-specific, but in general it will return an appropriate representation
   * of the DateTime in the assigned locale.
   * Defaults to the system's locale if no locale has been specified
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
   * @param formatOpts {Object} - Intl.DateTimeFormat constructor options and configuration options
   * @param {Object} opts - opts to override the configuration options on this DateTime
   * @example DateTime.now().toLocaleString(); //=> 4/20/2017
   * @example DateTime.now().setLocale('en-gb').toLocaleString(); //=> '20/04/2017'
   * @example DateTime.now().toLocaleString(DateTime.DATE_FULL); //=> 'April 20, 2017'
   * @example DateTime.now().toLocaleString(DateTime.DATE_FULL, { locale: 'fr' }); //=> '28 août 2022'
   * @example DateTime.now().toLocaleString(DateTime.TIME_SIMPLE); //=> '11:32 AM'
   * @example DateTime.now().toLocaleString(DateTime.DATETIME_SHORT); //=> '4/20/2017, 11:32 AM'
   * @example DateTime.now().toLocaleString({ weekday: 'long', month: 'long', day: '2-digit' }); //=> 'Thursday, April 20'
   * @example DateTime.now().toLocaleString({ weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }); //=> 'Thu, Apr 20, 11:27 AM'
   * @example DateTime.now().toLocaleString({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); //=> '11:32'
   * @return {string}
   */
  toLocaleString(e = Lr, r = {}) {
    return this.isValid ? X.create(this.loc.clone(r), e).formatDateTime(this) : vn;
  }
  /**
   * Returns an array of format "parts", meaning individual tokens along with metadata. This is allows callers to post-process individual sections of the formatted output.
   * Defaults to the system's locale if no locale has been specified
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat/formatToParts
   * @param opts {Object} - Intl.DateTimeFormat constructor options, same as `toLocaleString`.
   * @example DateTime.now().toLocaleParts(); //=> [
   *                                   //=>   { type: 'day', value: '25' },
   *                                   //=>   { type: 'literal', value: '/' },
   *                                   //=>   { type: 'month', value: '05' },
   *                                   //=>   { type: 'literal', value: '/' },
   *                                   //=>   { type: 'year', value: '1982' }
   *                                   //=> ]
   */
  toLocaleParts(e = {}) {
    return this.isValid ? X.create(this.loc.clone(e), e).formatDateTimeParts(this) : [];
  }
  /**
   * Returns an ISO 8601-compliant string representation of this DateTime
   * @param {Object} opts - options
   * @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
   * @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @param {boolean} [opts.extendedZone=false] - add the time zone format extension
   * @param {string} [opts.format='extended'] - choose between the basic and extended format
   * @example DateTime.utc(1983, 5, 25).toISO() //=> '1982-05-25T00:00:00.000Z'
   * @example DateTime.now().toISO() //=> '2017-04-22T20:47:05.335-04:00'
   * @example DateTime.now().toISO({ includeOffset: false }) //=> '2017-04-22T20:47:05.335'
   * @example DateTime.now().toISO({ format: 'basic' }) //=> '20170422T204705.335-0400'
   * @return {string}
   */
  toISO({
    format: e = "extended",
    suppressSeconds: r = !1,
    suppressMilliseconds: n = !1,
    includeOffset: s = !0,
    extendedZone: i = !1
  } = {}) {
    if (!this.isValid)
      return null;
    const a = e === "extended";
    let o = Tn(this, a);
    return o += "T", o += Ni(this, a, r, n, s, i), o;
  }
  /**
   * Returns an ISO 8601-compliant string representation of this DateTime's date component
   * @param {Object} opts - options
   * @param {string} [opts.format='extended'] - choose between the basic and extended format
   * @example DateTime.utc(1982, 5, 25).toISODate() //=> '1982-05-25'
   * @example DateTime.utc(1982, 5, 25).toISODate({ format: 'basic' }) //=> '19820525'
   * @return {string}
   */
  toISODate({
    format: e = "extended"
  } = {}) {
    return this.isValid ? Tn(this, e === "extended") : null;
  }
  /**
   * Returns an ISO 8601-compliant string representation of this DateTime's week date
   * @example DateTime.utc(1982, 5, 25).toISOWeekDate() //=> '1982-W21-2'
   * @return {string}
   */
  toISOWeekDate() {
    return mr(this, "kkkk-'W'WW-c");
  }
  /**
   * Returns an ISO 8601-compliant string representation of this DateTime's time component
   * @param {Object} opts - options
   * @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
   * @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @param {boolean} [opts.extendedZone=true] - add the time zone format extension
   * @param {boolean} [opts.includePrefix=false] - include the `T` prefix
   * @param {string} [opts.format='extended'] - choose between the basic and extended format
   * @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime() //=> '07:34:19.361Z'
   * @example DateTime.utc().set({ hour: 7, minute: 34, seconds: 0, milliseconds: 0 }).toISOTime({ suppressSeconds: true }) //=> '07:34Z'
   * @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime({ format: 'basic' }) //=> '073419.361Z'
   * @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime({ includePrefix: true }) //=> 'T07:34:19.361Z'
   * @return {string}
   */
  toISOTime({
    suppressMilliseconds: e = !1,
    suppressSeconds: r = !1,
    includeOffset: n = !0,
    includePrefix: s = !1,
    extendedZone: i = !1,
    format: a = "extended"
  } = {}) {
    return this.isValid ? (s ? "T" : "") + Ni(this, a === "extended", r, e, n, i) : null;
  }
  /**
   * Returns an RFC 2822-compatible string representation of this DateTime
   * @example DateTime.utc(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 +0000'
   * @example DateTime.local(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 -0400'
   * @return {string}
   */
  toRFC2822() {
    return mr(this, "EEE, dd LLL yyyy HH:mm:ss ZZZ", !1);
  }
  /**
   * Returns a string representation of this DateTime appropriate for use in HTTP headers. The output is always expressed in GMT.
   * Specifically, the string conforms to RFC 1123.
   * @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.3.1
   * @example DateTime.utc(2014, 7, 13).toHTTP() //=> 'Sun, 13 Jul 2014 00:00:00 GMT'
   * @example DateTime.utc(2014, 7, 13, 19).toHTTP() //=> 'Sun, 13 Jul 2014 19:00:00 GMT'
   * @return {string}
   */
  toHTTP() {
    return mr(this.toUTC(), "EEE, dd LLL yyyy HH:mm:ss 'GMT'");
  }
  /**
   * Returns a string representation of this DateTime appropriate for use in SQL Date
   * @example DateTime.utc(2014, 7, 13).toSQLDate() //=> '2014-07-13'
   * @return {string}
   */
  toSQLDate() {
    return this.isValid ? Tn(this, !0) : null;
  }
  /**
   * Returns a string representation of this DateTime appropriate for use in SQL Time
   * @param {Object} opts - options
   * @param {boolean} [opts.includeZone=false] - include the zone, such as 'America/New_York'. Overrides includeOffset.
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @param {boolean} [opts.includeOffsetSpace=true] - include the space between the time and the offset, such as '05:15:16.345 -04:00'
   * @example DateTime.utc().toSQL() //=> '05:15:16.345'
   * @example DateTime.now().toSQL() //=> '05:15:16.345 -04:00'
   * @example DateTime.now().toSQL({ includeOffset: false }) //=> '05:15:16.345'
   * @example DateTime.now().toSQL({ includeZone: false }) //=> '05:15:16.345 America/New_York'
   * @return {string}
   */
  toSQLTime({
    includeOffset: e = !0,
    includeZone: r = !1,
    includeOffsetSpace: n = !0
  } = {}) {
    let s = "HH:mm:ss.SSS";
    return (r || e) && (n && (s += " "), r ? s += "z" : e && (s += "ZZ")), mr(this, s, !0);
  }
  /**
   * Returns a string representation of this DateTime appropriate for use in SQL DateTime
   * @param {Object} opts - options
   * @param {boolean} [opts.includeZone=false] - include the zone, such as 'America/New_York'. Overrides includeOffset.
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @param {boolean} [opts.includeOffsetSpace=true] - include the space between the time and the offset, such as '05:15:16.345 -04:00'
   * @example DateTime.utc(2014, 7, 13).toSQL() //=> '2014-07-13 00:00:00.000 Z'
   * @example DateTime.local(2014, 7, 13).toSQL() //=> '2014-07-13 00:00:00.000 -04:00'
   * @example DateTime.local(2014, 7, 13).toSQL({ includeOffset: false }) //=> '2014-07-13 00:00:00.000'
   * @example DateTime.local(2014, 7, 13).toSQL({ includeZone: true }) //=> '2014-07-13 00:00:00.000 America/New_York'
   * @return {string}
   */
  toSQL(e = {}) {
    return this.isValid ? `${this.toSQLDate()} ${this.toSQLTime(e)}` : null;
  }
  /**
   * Returns a string representation of this DateTime appropriate for debugging
   * @return {string}
   */
  toString() {
    return this.isValid ? this.toISO() : vn;
  }
  /**
   * Returns a string representation of this DateTime appropriate for the REPL.
   * @return {string}
   */
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return this.isValid ? `DateTime { ts: ${this.toISO()}, zone: ${this.zone.name}, locale: ${this.locale} }` : `DateTime { Invalid, reason: ${this.invalidReason} }`;
  }
  /**
   * Returns the epoch milliseconds of this DateTime. Alias of {@link DateTime#toMillis}
   * @return {number}
   */
  valueOf() {
    return this.toMillis();
  }
  /**
   * Returns the epoch milliseconds of this DateTime.
   * @return {number}
   */
  toMillis() {
    return this.isValid ? this.ts : NaN;
  }
  /**
   * Returns the epoch seconds of this DateTime.
   * @return {number}
   */
  toSeconds() {
    return this.isValid ? this.ts / 1e3 : NaN;
  }
  /**
   * Returns the epoch seconds (as a whole number) of this DateTime.
   * @return {number}
   */
  toUnixInteger() {
    return this.isValid ? Math.floor(this.ts / 1e3) : NaN;
  }
  /**
   * Returns an ISO 8601 representation of this DateTime appropriate for use in JSON.
   * @return {string}
   */
  toJSON() {
    return this.toISO();
  }
  /**
   * Returns a BSON serializable equivalent to this DateTime.
   * @return {Date}
   */
  toBSON() {
    return this.toJSDate();
  }
  /**
   * Returns a JavaScript object with this DateTime's year, month, day, and so on.
   * @param opts - options for generating the object
   * @param {boolean} [opts.includeConfig=false] - include configuration attributes in the output
   * @example DateTime.now().toObject() //=> { year: 2017, month: 4, day: 22, hour: 20, minute: 49, second: 42, millisecond: 268 }
   * @return {Object}
   */
  toObject(e = {}) {
    if (!this.isValid) return {};
    const r = {
      ...this.c
    };
    return e.includeConfig && (r.outputCalendar = this.outputCalendar, r.numberingSystem = this.loc.numberingSystem, r.locale = this.loc.locale), r;
  }
  /**
   * Returns a JavaScript Date equivalent to this DateTime.
   * @return {Date}
   */
  toJSDate() {
    return new Date(this.isValid ? this.ts : NaN);
  }
  // COMPARE
  /**
   * Return the difference between two DateTimes as a Duration.
   * @param {DateTime} otherDateTime - the DateTime to compare this one to
   * @param {string|string[]} [unit=['milliseconds']] - the unit or array of units (such as 'hours' or 'days') to include in the duration.
   * @param {Object} opts - options that affect the creation of the Duration
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @example
   * var i1 = DateTime.fromISO('1982-05-25T09:45'),
   *     i2 = DateTime.fromISO('1983-10-14T10:30');
   * i2.diff(i1).toObject() //=> { milliseconds: 43807500000 }
   * i2.diff(i1, 'hours').toObject() //=> { hours: 12168.75 }
   * i2.diff(i1, ['months', 'days']).toObject() //=> { months: 16, days: 19.03125 }
   * i2.diff(i1, ['months', 'days', 'hours']).toObject() //=> { months: 16, days: 19, hours: 0.75 }
   * @return {Duration}
   */
  diff(e, r = "milliseconds", n = {}) {
    if (!this.isValid || !e.isValid)
      return R.invalid("created by diffing an invalid DateTime");
    const s = {
      locale: this.locale,
      numberingSystem: this.numberingSystem,
      ...n
    }, i = Uf(r).map(R.normalizeUnit), a = e.valueOf() > this.valueOf(), o = a ? this : e, u = a ? e : this, c = Hh(o, u, i, s);
    return a ? c.negate() : c;
  }
  /**
   * Return the difference between this DateTime and right now.
   * See {@link DateTime#diff}
   * @param {string|string[]} [unit=['milliseconds']] - the unit or units units (such as 'hours' or 'days') to include in the duration
   * @param {Object} opts - options that affect the creation of the Duration
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @return {Duration}
   */
  diffNow(e = "milliseconds", r = {}) {
    return this.diff(O.now(), e, r);
  }
  /**
   * Return an Interval spanning between this DateTime and another DateTime
   * @param {DateTime} otherDateTime - the other end point of the Interval
   * @return {Interval}
   */
  until(e) {
    return this.isValid ? V.fromDateTimes(this, e) : this;
  }
  /**
   * Return whether this DateTime is in the same unit of time as another DateTime.
   * Higher-order units must also be identical for this function to return `true`.
   * Note that time zones are **ignored** in this comparison, which compares the **local** calendar time. Use {@link DateTime#setZone} to convert one of the dates if needed.
   * @param {DateTime} otherDateTime - the other DateTime
   * @param {string} unit - the unit of time to check sameness on
   * @param {Object} opts - options
   * @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week; only the locale of this DateTime is used
   * @example DateTime.now().hasSame(otherDT, 'day'); //~> true if otherDT is in the same current calendar day
   * @return {boolean}
   */
  hasSame(e, r, n) {
    if (!this.isValid) return !1;
    const s = e.valueOf(), i = this.setZone(e.zone, {
      keepLocalTime: !0
    });
    return i.startOf(r, n) <= s && s <= i.endOf(r, n);
  }
  /**
   * Equality check
   * Two DateTimes are equal if and only if they represent the same millisecond, have the same zone and location, and are both valid.
   * To compare just the millisecond values, use `+dt1 === +dt2`.
   * @param {DateTime} other - the other DateTime
   * @return {boolean}
   */
  equals(e) {
    return this.isValid && e.isValid && this.valueOf() === e.valueOf() && this.zone.equals(e.zone) && this.loc.equals(e.loc);
  }
  /**
   * Returns a string representation of a this time relative to now, such as "in two days". Can only internationalize if your
   * platform supports Intl.RelativeTimeFormat. Rounds down by default.
   * @param {Object} options - options that affect the output
   * @param {DateTime} [options.base=DateTime.now()] - the DateTime to use as the basis to which this time is compared. Defaults to now.
   * @param {string} [options.style="long"] - the style of units, must be "long", "short", or "narrow"
   * @param {string|string[]} options.unit - use a specific unit or array of units; if omitted, or an array, the method will pick the best unit. Use an array or one of "years", "quarters", "months", "weeks", "days", "hours", "minutes", or "seconds"
   * @param {boolean} [options.round=true] - whether to round the numbers in the output.
   * @param {number} [options.padding=0] - padding in milliseconds. This allows you to round up the result if it fits inside the threshold. Don't use in combination with {round: false} because the decimal output will include the padding.
   * @param {string} options.locale - override the locale of this DateTime
   * @param {string} options.numberingSystem - override the numberingSystem of this DateTime. The Intl system may choose not to honor this
   * @example DateTime.now().plus({ days: 1 }).toRelative() //=> "in 1 day"
   * @example DateTime.now().setLocale("es").toRelative({ days: 1 }) //=> "dentro de 1 día"
   * @example DateTime.now().plus({ days: 1 }).toRelative({ locale: "fr" }) //=> "dans 23 heures"
   * @example DateTime.now().minus({ days: 2 }).toRelative() //=> "2 days ago"
   * @example DateTime.now().minus({ days: 2 }).toRelative({ unit: "hours" }) //=> "48 hours ago"
   * @example DateTime.now().minus({ hours: 36 }).toRelative({ round: false }) //=> "1.5 days ago"
   */
  toRelative(e = {}) {
    if (!this.isValid) return null;
    const r = e.base || O.fromObject({}, {
      zone: this.zone
    }), n = e.padding ? this < r ? -e.padding : e.padding : 0;
    let s = ["years", "months", "days", "hours", "minutes", "seconds"], i = e.unit;
    return Array.isArray(e.unit) && (s = e.unit, i = void 0), Li(r, this.plus(n), {
      ...e,
      numeric: "always",
      units: s,
      unit: i
    });
  }
  /**
   * Returns a string representation of this date relative to today, such as "yesterday" or "next month".
   * Only internationalizes on platforms that supports Intl.RelativeTimeFormat.
   * @param {Object} options - options that affect the output
   * @param {DateTime} [options.base=DateTime.now()] - the DateTime to use as the basis to which this time is compared. Defaults to now.
   * @param {string} options.locale - override the locale of this DateTime
   * @param {string} options.unit - use a specific unit; if omitted, the method will pick the unit. Use one of "years", "quarters", "months", "weeks", or "days"
   * @param {string} options.numberingSystem - override the numberingSystem of this DateTime. The Intl system may choose not to honor this
   * @example DateTime.now().plus({ days: 1 }).toRelativeCalendar() //=> "tomorrow"
   * @example DateTime.now().setLocale("es").plus({ days: 1 }).toRelative() //=> ""mañana"
   * @example DateTime.now().plus({ days: 1 }).toRelativeCalendar({ locale: "fr" }) //=> "demain"
   * @example DateTime.now().minus({ days: 2 }).toRelativeCalendar() //=> "2 days ago"
   */
  toRelativeCalendar(e = {}) {
    return this.isValid ? Li(e.base || O.fromObject({}, {
      zone: this.zone
    }), this, {
      ...e,
      numeric: "auto",
      units: ["years", "months", "days"],
      calendary: !0
    }) : null;
  }
  /**
   * Return the min of several date times
   * @param {...DateTime} dateTimes - the DateTimes from which to choose the minimum
   * @return {DateTime} the min DateTime, or undefined if called with no argument
   */
  static min(...e) {
    if (!e.every(O.isDateTime))
      throw new K("min requires all arguments be DateTimes");
    return bi(e, (r) => r.valueOf(), Math.min);
  }
  /**
   * Return the max of several date times
   * @param {...DateTime} dateTimes - the DateTimes from which to choose the maximum
   * @return {DateTime} the max DateTime, or undefined if called with no argument
   */
  static max(...e) {
    if (!e.every(O.isDateTime))
      throw new K("max requires all arguments be DateTimes");
    return bi(e, (r) => r.valueOf(), Math.max);
  }
  // MISC
  /**
   * Explain how a string would be parsed by fromFormat()
   * @param {string} text - the string to parse
   * @param {string} fmt - the format the string is expected to be in (see description)
   * @param {Object} options - options taken by fromFormat()
   * @return {Object}
   */
  static fromFormatExplain(e, r, n = {}) {
    const {
      locale: s = null,
      numberingSystem: i = null
    } = n, a = L.fromOpts({
      locale: s,
      numberingSystem: i,
      defaultToEN: !0
    });
    return Uo(a, e, r);
  }
  /**
   * @deprecated use fromFormatExplain instead
   */
  static fromStringExplain(e, r, n = {}) {
    return O.fromFormatExplain(e, r, n);
  }
  /**
   * Build a parser for `fmt` using the given locale. This parser can be passed
   * to {@link DateTime.fromFormatParser} to a parse a date in this format. This
   * can be used to optimize cases where many dates need to be parsed in a
   * specific format.
   *
   * @param {String} fmt - the format the string is expected to be in (see
   * description)
   * @param {Object} options - options used to set locale and numberingSystem
   * for parser
   * @returns {TokenParser} - opaque object to be used
   */
  static buildFormatParser(e, r = {}) {
    const {
      locale: n = null,
      numberingSystem: s = null
    } = r, i = L.fromOpts({
      locale: n,
      numberingSystem: s,
      defaultToEN: !0
    });
    return new $o(i, e);
  }
  /**
   * Create a DateTime from an input string and format parser.
   *
   * The format parser must have been created with the same locale as this call.
   *
   * @param {String} text - the string to parse
   * @param {TokenParser} formatParser - parser from {@link DateTime.buildFormatParser}
   * @param {Object} opts - options taken by fromFormat()
   * @returns {DateTime}
   */
  static fromFormatParser(e, r, n = {}) {
    if (D(e) || D(r))
      throw new K("fromFormatParser requires an input string and a format parser");
    const {
      locale: s = null,
      numberingSystem: i = null
    } = n, a = L.fromOpts({
      locale: s,
      numberingSystem: i,
      defaultToEN: !0
    });
    if (!a.equals(r.locale))
      throw new K(`fromFormatParser called with a locale of ${a}, but the format parser was created for ${r.locale}`);
    const {
      result: o,
      zone: u,
      specificOffset: c,
      invalidReason: l
    } = r.explainFromTokens(e);
    return l ? O.invalid(l) : dt(o, u, n, `format ${r.format}`, e, c);
  }
  // FORMAT PRESETS
  /**
   * {@link DateTime#toLocaleString} format like 10/14/1983
   * @type {Object}
   */
  static get DATE_SHORT() {
    return Lr;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Oct 14, 1983'
   * @type {Object}
   */
  static get DATE_MED() {
    return Ha;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Fri, Oct 14, 1983'
   * @type {Object}
   */
  static get DATE_MED_WITH_WEEKDAY() {
    return df;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'October 14, 1983'
   * @type {Object}
   */
  static get DATE_FULL() {
    return qa;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Tuesday, October 14, 1983'
   * @type {Object}
   */
  static get DATE_HUGE() {
    return Ga;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_SIMPLE() {
    return Ba;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_WITH_SECONDS() {
    return Za;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 AM EDT'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_WITH_SHORT_OFFSET() {
    return Ya;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 AM Eastern Daylight Time'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_WITH_LONG_OFFSET() {
    return Ja;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_SIMPLE() {
    return Qa;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_WITH_SECONDS() {
    return Ka;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 EDT', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_WITH_SHORT_OFFSET() {
    return Xa;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 Eastern Daylight Time', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_WITH_LONG_OFFSET() {
    return eo;
  }
  /**
   * {@link DateTime#toLocaleString} format like '10/14/1983, 9:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_SHORT() {
    return to;
  }
  /**
   * {@link DateTime#toLocaleString} format like '10/14/1983, 9:30:33 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_SHORT_WITH_SECONDS() {
    return ro;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Oct 14, 1983, 9:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_MED() {
    return no;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Oct 14, 1983, 9:30:33 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_MED_WITH_SECONDS() {
    return so;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Fri, 14 Oct 1983, 9:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_MED_WITH_WEEKDAY() {
    return mf;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'October 14, 1983, 9:30 AM EDT'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_FULL() {
    return io;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'October 14, 1983, 9:30:33 AM EDT'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_FULL_WITH_SECONDS() {
    return ao;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Friday, October 14, 1983, 9:30 AM Eastern Daylight Time'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_HUGE() {
    return oo;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Friday, October 14, 1983, 9:30:33 AM Eastern Daylight Time'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_HUGE_WITH_SECONDS() {
    return uo;
  }
}
function Mt(t) {
  if (O.isDateTime(t))
    return t;
  if (t && t.valueOf && qe(t.valueOf()))
    return O.fromJSDate(t);
  if (t && typeof t == "object")
    return O.fromObject(t);
  throw new K(`Unknown datetime argument: ${t}, of type ${typeof t}`);
}
const ld = "3.5.0";
me.DateTime = O;
me.Duration = R;
me.FixedOffsetZone = ee;
me.IANAZone = Ie;
me.Info = Pt;
me.Interval = V;
me.InvalidZone = co;
me.Settings = j;
me.SystemZone = Jt;
me.VERSION = ld;
me.Zone = St;
var et = me;
I.prototype.addYear = function() {
  this._date = this._date.plus({ years: 1 });
};
I.prototype.addMonth = function() {
  this._date = this._date.plus({ months: 1 }).startOf("month");
};
I.prototype.addDay = function() {
  this._date = this._date.plus({ days: 1 }).startOf("day");
};
I.prototype.addHour = function() {
  var t = this._date;
  this._date = this._date.plus({ hours: 1 }).startOf("hour"), this._date <= t && (this._date = this._date.plus({ hours: 1 }));
};
I.prototype.addMinute = function() {
  var t = this._date;
  this._date = this._date.plus({ minutes: 1 }).startOf("minute"), this._date < t && (this._date = this._date.plus({ hours: 1 }));
};
I.prototype.addSecond = function() {
  var t = this._date;
  this._date = this._date.plus({ seconds: 1 }).startOf("second"), this._date < t && (this._date = this._date.plus({ hours: 1 }));
};
I.prototype.subtractYear = function() {
  this._date = this._date.minus({ years: 1 });
};
I.prototype.subtractMonth = function() {
  this._date = this._date.minus({ months: 1 }).endOf("month").startOf("second");
};
I.prototype.subtractDay = function() {
  this._date = this._date.minus({ days: 1 }).endOf("day").startOf("second");
};
I.prototype.subtractHour = function() {
  var t = this._date;
  this._date = this._date.minus({ hours: 1 }).endOf("hour").startOf("second"), this._date >= t && (this._date = this._date.minus({ hours: 1 }));
};
I.prototype.subtractMinute = function() {
  var t = this._date;
  this._date = this._date.minus({ minutes: 1 }).endOf("minute").startOf("second"), this._date > t && (this._date = this._date.minus({ hours: 1 }));
};
I.prototype.subtractSecond = function() {
  var t = this._date;
  this._date = this._date.minus({ seconds: 1 }).startOf("second"), this._date > t && (this._date = this._date.minus({ hours: 1 }));
};
I.prototype.getDate = function() {
  return this._date.day;
};
I.prototype.getFullYear = function() {
  return this._date.year;
};
I.prototype.getDay = function() {
  var t = this._date.weekday;
  return t == 7 ? 0 : t;
};
I.prototype.getMonth = function() {
  return this._date.month - 1;
};
I.prototype.getHours = function() {
  return this._date.hour;
};
I.prototype.getMinutes = function() {
  return this._date.minute;
};
I.prototype.getSeconds = function() {
  return this._date.second;
};
I.prototype.getMilliseconds = function() {
  return this._date.millisecond;
};
I.prototype.getTime = function() {
  return this._date.valueOf();
};
I.prototype.getUTCDate = function() {
  return this._getUTC().day;
};
I.prototype.getUTCFullYear = function() {
  return this._getUTC().year;
};
I.prototype.getUTCDay = function() {
  var t = this._getUTC().weekday;
  return t == 7 ? 0 : t;
};
I.prototype.getUTCMonth = function() {
  return this._getUTC().month - 1;
};
I.prototype.getUTCHours = function() {
  return this._getUTC().hour;
};
I.prototype.getUTCMinutes = function() {
  return this._getUTC().minute;
};
I.prototype.getUTCSeconds = function() {
  return this._getUTC().second;
};
I.prototype.toISOString = function() {
  return this._date.toUTC().toISO();
};
I.prototype.toJSON = function() {
  return this._date.toJSON();
};
I.prototype.setDate = function(t) {
  this._date = this._date.set({ day: t });
};
I.prototype.setFullYear = function(t) {
  this._date = this._date.set({ year: t });
};
I.prototype.setDay = function(t) {
  this._date = this._date.set({ weekday: t });
};
I.prototype.setMonth = function(t) {
  this._date = this._date.set({ month: t + 1 });
};
I.prototype.setHours = function(t) {
  this._date = this._date.set({ hour: t });
};
I.prototype.setMinutes = function(t) {
  this._date = this._date.set({ minute: t });
};
I.prototype.setSeconds = function(t) {
  this._date = this._date.set({ second: t });
};
I.prototype.setMilliseconds = function(t) {
  this._date = this._date.set({ millisecond: t });
};
I.prototype._getUTC = function() {
  return this._date.toUTC();
};
I.prototype.toString = function() {
  return this.toDate().toString();
};
I.prototype.toDate = function() {
  return this._date.toJSDate();
};
I.prototype.isLastDayOfMonth = function() {
  var t = this._date.plus({ days: 1 }).startOf("day");
  return this._date.month !== t.month;
};
I.prototype.isLastWeekdayOfMonth = function() {
  var t = this._date.plus({ days: 7 }).startOf("day");
  return this._date.month !== t.month;
};
function I(t, e) {
  var r = { zone: e };
  if (t ? t instanceof I ? this._date = t._date : t instanceof Date ? this._date = et.DateTime.fromJSDate(t, r) : typeof t == "number" ? this._date = et.DateTime.fromMillis(t, r) : typeof t == "string" && (this._date = et.DateTime.fromISO(t, r), this._date.isValid || (this._date = et.DateTime.fromRFC2822(t, r)), this._date.isValid || (this._date = et.DateTime.fromSQL(t, r)), this._date.isValid || (this._date = et.DateTime.fromFormat(t, "EEE, d MMM yyyy HH:mm:ss", r))) : this._date = et.DateTime.local(), !this._date || !this._date.isValid)
    throw new Error("CronDate: unhandled timestamp: " + JSON.stringify(t));
  e && e !== this._date.zoneName && (this._date = this._date.setZone(e));
}
var Ss = I;
function rt(t) {
  return {
    start: t,
    count: 1
  };
}
function $i(t, e) {
  t.end = e, t.step = e - t.start, t.count = 2;
}
function bn(t, e, r) {
  e && (e.count === 2 ? (t.push(rt(e.start)), t.push(rt(e.end))) : t.push(e)), r && t.push(r);
}
function fd(t) {
  for (var e = [], r = void 0, n = 0; n < t.length; n++) {
    var s = t[n];
    typeof s != "number" ? (bn(e, r, rt(s)), r = void 0) : r ? r.count === 1 ? $i(r, s) : r.step === s - r.end ? (r.count++, r.end = s) : r.count === 2 ? (e.push(rt(r.start)), r = rt(r.end), $i(r, s)) : (bn(e, r), r = rt(s)) : r = rt(s);
  }
  return bn(e, r), e;
}
var hd = fd, dd = hd;
function md(t, e, r) {
  var n = dd(t);
  if (n.length === 1) {
    var s = n[0], i = s.step;
    if (i === 1 && s.start === e && s.end === r)
      return "*";
    if (i !== 1 && s.start === e && s.end === r - i + 1)
      return "*/" + i;
  }
  for (var a = [], o = 0, u = n.length; o < u; ++o) {
    var c = n[o];
    if (c.count === 1) {
      a.push(c.start);
      continue;
    }
    var i = c.step;
    if (c.step === 1) {
      a.push(c.start + "-" + c.end);
      continue;
    }
    var l = c.start == 0 ? c.count - 1 : c.count;
    c.step * l > c.end ? a = a.concat(
      Array.from({ length: c.end - c.start + 1 }).map(function(h, d) {
        var m = c.start + d;
        return (m - c.start) % c.step === 0 ? m : null;
      }).filter(function(h) {
        return h != null;
      })
    ) : c.end === r - c.step + 1 ? a.push(c.start + "/" + c.step) : a.push(c.start + "-" + c.end + "/" + c.step);
  }
  return a.join(",");
}
var pd = md, at = Ss, gd = pd, Ui = 1e4;
function w(t, e) {
  this._options = e, this._utc = e.utc || !1, this._tz = this._utc ? "UTC" : e.tz, this._currentDate = new at(e.currentDate, this._tz), this._startDate = e.startDate ? new at(e.startDate, this._tz) : null, this._endDate = e.endDate ? new at(e.endDate, this._tz) : null, this._isIterator = e.iterator || !1, this._hasIterated = !1, this._nthDayOfWeek = e.nthDayOfWeek || 0, this.fields = w._freezeFields(t);
}
w.map = ["second", "minute", "hour", "dayOfMonth", "month", "dayOfWeek"];
w.predefined = {
  "@yearly": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@hourly": "0 * * * *"
};
w.constraints = [
  { min: 0, max: 59, chars: [] },
  // Second
  { min: 0, max: 59, chars: [] },
  // Minute
  { min: 0, max: 23, chars: [] },
  // Hour
  { min: 1, max: 31, chars: ["L"] },
  // Day of month
  { min: 1, max: 12, chars: [] },
  // Month
  { min: 0, max: 7, chars: ["L"] }
  // Day of week
];
w.daysInMonth = [
  31,
  29,
  31,
  30,
  31,
  30,
  31,
  31,
  30,
  31,
  30,
  31
];
w.aliases = {
  month: {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12
  },
  dayOfWeek: {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6
  }
};
w.parseDefaults = ["0", "*", "*", "*", "*", "*"];
w.standardValidCharacters = /^[,*\d/-]+$/;
w.dayOfWeekValidCharacters = /^[?,*\dL#/-]+$/;
w.dayOfMonthValidCharacters = /^[?,*\dL/-]+$/;
w.validCharacters = {
  second: w.standardValidCharacters,
  minute: w.standardValidCharacters,
  hour: w.standardValidCharacters,
  dayOfMonth: w.dayOfMonthValidCharacters,
  month: w.standardValidCharacters,
  dayOfWeek: w.dayOfWeekValidCharacters
};
w._isValidConstraintChar = function(e, r) {
  return typeof r != "string" ? !1 : e.chars.some(function(n) {
    return r.indexOf(n) > -1;
  });
};
w._parseField = function(e, r, n) {
  switch (e) {
    case "month":
    case "dayOfWeek":
      var s = w.aliases[e];
      r = r.replace(/[a-z]{3}/gi, function(u) {
        if (u = u.toLowerCase(), typeof s[u] < "u")
          return s[u];
        throw new Error('Validation error, cannot resolve alias "' + u + '"');
      });
      break;
  }
  if (!w.validCharacters[e].test(r))
    throw new Error("Invalid characters, got value: " + r);
  r.indexOf("*") !== -1 ? r = r.replace(/\*/g, n.min + "-" + n.max) : r.indexOf("?") !== -1 && (r = r.replace(/\?/g, n.min + "-" + n.max));
  function i(u) {
    var c = [];
    function l(m) {
      if (m instanceof Array)
        for (var k = 0, E = m.length; k < E; k++) {
          var v = m[k];
          if (w._isValidConstraintChar(n, v)) {
            c.push(v);
            continue;
          }
          if (typeof v != "number" || Number.isNaN(v) || v < n.min || v > n.max)
            throw new Error(
              "Constraint error, got value " + v + " expected range " + n.min + "-" + n.max
            );
          c.push(v);
        }
      else {
        if (w._isValidConstraintChar(n, m)) {
          c.push(m);
          return;
        }
        var F = +m;
        if (Number.isNaN(F) || F < n.min || F > n.max)
          throw new Error(
            "Constraint error, got value " + m + " expected range " + n.min + "-" + n.max
          );
        e === "dayOfWeek" && (F = F % 7), c.push(F);
      }
    }
    var f = u.split(",");
    if (!f.every(function(m) {
      return m.length > 0;
    }))
      throw new Error("Invalid list value format");
    if (f.length > 1)
      for (var h = 0, d = f.length; h < d; h++)
        l(a(f[h]));
    else
      l(a(u));
    return c.sort(w._sortCompareFn), c;
  }
  function a(u) {
    var c = 1, l = u.split("/");
    if (l.length > 2)
      throw new Error("Invalid repeat: " + u);
    return l.length > 1 ? (l[0] == +l[0] && (l = [l[0] + "-" + n.max, l[1]]), o(l[0], l[l.length - 1])) : o(u, c);
  }
  function o(u, c) {
    var l = [], f = u.split("-");
    if (f.length > 1) {
      if (f.length < 2)
        return +u;
      if (!f[0].length) {
        if (!f[1].length)
          throw new Error("Invalid range: " + u);
        return +u;
      }
      var h = +f[0], d = +f[1];
      if (Number.isNaN(h) || Number.isNaN(d) || h < n.min || d > n.max)
        throw new Error(
          "Constraint error, got range " + h + "-" + d + " expected range " + n.min + "-" + n.max
        );
      if (h > d)
        throw new Error("Invalid range: " + u);
      var m = +c;
      if (Number.isNaN(m) || m <= 0)
        throw new Error("Constraint error, cannot repeat at every " + m + " time.");
      e === "dayOfWeek" && d % 7 === 0 && l.push(0);
      for (var k = h, E = d; k <= E; k++) {
        var v = l.indexOf(k) !== -1;
        !v && m > 0 && m % c === 0 ? (m = 1, l.push(k)) : m++;
      }
      return l;
    }
    return Number.isNaN(+u) ? u : +u;
  }
  return i(r);
};
w._sortCompareFn = function(t, e) {
  var r = typeof t == "number", n = typeof e == "number";
  return r && n ? t - e : !r && n ? 1 : r && !n ? -1 : t.localeCompare(e);
};
w._handleMaxDaysInMonth = function(t) {
  if (t.month.length === 1) {
    var e = w.daysInMonth[t.month[0] - 1];
    if (t.dayOfMonth[0] > e)
      throw new Error("Invalid explicit day of month definition");
    return t.dayOfMonth.filter(function(r) {
      return r === "L" ? !0 : r <= e;
    }).sort(w._sortCompareFn);
  }
};
w._freezeFields = function(t) {
  for (var e = 0, r = w.map.length; e < r; ++e) {
    var n = w.map[e], s = t[n];
    t[n] = Object.freeze(s);
  }
  return Object.freeze(t);
};
w.prototype._applyTimezoneShift = function(t, e, r) {
  if (r === "Month" || r === "Day") {
    var n = t.getTime();
    t[e + r]();
    var s = t.getTime();
    n === s && (t.getMinutes() === 0 && t.getSeconds() === 0 ? t.addHour() : t.getMinutes() === 59 && t.getSeconds() === 59 && t.subtractHour());
  } else {
    var i = t.getHours();
    t[e + r]();
    var a = t.getHours(), o = a - i;
    o === 2 ? this.fields.hour.length !== 24 && (this._dstStart = a) : o === 0 && t.getMinutes() === 0 && t.getSeconds() === 0 && this.fields.hour.length !== 24 && (this._dstEnd = a);
  }
};
w.prototype._findSchedule = function(e) {
  function r(v, F) {
    for (var z = 0, re = F.length; z < re; z++)
      if (F[z] >= v)
        return F[z] === v;
    return F[0] === v;
  }
  function n(v, F) {
    if (F < 6) {
      if (v.getDate() < 8 && F === 1)
        return !0;
      var z = v.getDate() % 7 ? 1 : 0, re = v.getDate() - v.getDate() % 7, Q = Math.floor(re / 7) + z;
      return Q === F;
    }
    return !1;
  }
  function s(v) {
    return v.length > 0 && v.some(function(F) {
      return typeof F == "string" && F.indexOf("L") >= 0;
    });
  }
  e = e || !1;
  var i = e ? "subtract" : "add", a = new at(this._currentDate, this._tz), o = this._startDate, u = this._endDate, c = a.getTime(), l = 0;
  function f(v) {
    return v.some(function(F) {
      if (!s([F]))
        return !1;
      var z = Number.parseInt(F[0]) % 7;
      if (Number.isNaN(z))
        throw new Error("Invalid last weekday of the month expression: " + F);
      return a.getDay() === z && a.isLastWeekdayOfMonth();
    });
  }
  for (; l < Ui; ) {
    if (l++, e) {
      if (o && a.getTime() - o.getTime() < 0)
        throw new Error("Out of the timespan range");
    } else if (u && u.getTime() - a.getTime() < 0)
      throw new Error("Out of the timespan range");
    var h = r(a.getDate(), this.fields.dayOfMonth);
    s(this.fields.dayOfMonth) && (h = h || a.isLastDayOfMonth());
    var d = r(a.getDay(), this.fields.dayOfWeek);
    s(this.fields.dayOfWeek) && (d = d || f(this.fields.dayOfWeek));
    var m = this.fields.dayOfMonth.length >= w.daysInMonth[a.getMonth()], k = this.fields.dayOfWeek.length === w.constraints[5].max - w.constraints[5].min + 1, E = a.getHours();
    if (!h && (!d || k)) {
      this._applyTimezoneShift(a, i, "Day");
      continue;
    }
    if (!m && k && !h) {
      this._applyTimezoneShift(a, i, "Day");
      continue;
    }
    if (m && !k && !d) {
      this._applyTimezoneShift(a, i, "Day");
      continue;
    }
    if (this._nthDayOfWeek > 0 && !n(a, this._nthDayOfWeek)) {
      this._applyTimezoneShift(a, i, "Day");
      continue;
    }
    if (!r(a.getMonth() + 1, this.fields.month)) {
      this._applyTimezoneShift(a, i, "Month");
      continue;
    }
    if (r(E, this.fields.hour)) {
      if (this._dstEnd === E && !e) {
        this._dstEnd = null, this._applyTimezoneShift(a, "add", "Hour");
        continue;
      }
    } else if (this._dstStart !== E) {
      this._dstStart = null, this._applyTimezoneShift(a, i, "Hour");
      continue;
    } else if (!r(E - 1, this.fields.hour)) {
      a[i + "Hour"]();
      continue;
    }
    if (!r(a.getMinutes(), this.fields.minute)) {
      this._applyTimezoneShift(a, i, "Minute");
      continue;
    }
    if (!r(a.getSeconds(), this.fields.second)) {
      this._applyTimezoneShift(a, i, "Second");
      continue;
    }
    if (c === a.getTime()) {
      i === "add" || a.getMilliseconds() === 0 ? this._applyTimezoneShift(a, i, "Second") : a.setMilliseconds(0);
      continue;
    }
    break;
  }
  if (l >= Ui)
    throw new Error("Invalid expression, loop limit exceeded");
  return this._currentDate = new at(a, this._tz), this._hasIterated = !0, a;
};
w.prototype.next = function() {
  var e = this._findSchedule();
  return this._isIterator ? {
    value: e,
    done: !this.hasNext()
  } : e;
};
w.prototype.prev = function() {
  var e = this._findSchedule(!0);
  return this._isIterator ? {
    value: e,
    done: !this.hasPrev()
  } : e;
};
w.prototype.hasNext = function() {
  var t = this._currentDate, e = this._hasIterated;
  try {
    return this._findSchedule(), !0;
  } catch {
    return !1;
  } finally {
    this._currentDate = t, this._hasIterated = e;
  }
};
w.prototype.hasPrev = function() {
  var t = this._currentDate, e = this._hasIterated;
  try {
    return this._findSchedule(!0), !0;
  } catch {
    return !1;
  } finally {
    this._currentDate = t, this._hasIterated = e;
  }
};
w.prototype.iterate = function(e, r) {
  var n = [];
  if (e >= 0)
    for (var s = 0, i = e; s < i; s++)
      try {
        var a = this.next();
        n.push(a), r && r(a, s);
      } catch {
        break;
      }
  else
    for (var s = 0, i = e; s > i; s--)
      try {
        var a = this.prev();
        n.push(a), r && r(a, s);
      } catch {
        break;
      }
  return n;
};
w.prototype.reset = function(e) {
  this._currentDate = new at(e || this._options.currentDate);
};
w.prototype.stringify = function(e) {
  for (var r = [], n = e ? 0 : 1, s = w.map.length; n < s; ++n) {
    var i = w.map[n], a = this.fields[i], o = w.constraints[n];
    i === "dayOfMonth" && this.fields.month.length === 1 ? o = { min: 1, max: w.daysInMonth[this.fields.month[0] - 1] } : i === "dayOfWeek" && (o = { min: 0, max: 6 }, a = a[a.length - 1] === 7 ? a.slice(0, -1) : a), r.push(gd(a, o.min, o.max));
  }
  return r.join(" ");
};
w.parse = function(e, r) {
  var n = this;
  typeof r == "function" && (r = {});
  function s(i, a) {
    a || (a = {}), typeof a.currentDate > "u" && (a.currentDate = new at(void 0, n._tz)), w.predefined[i] && (i = w.predefined[i]);
    var o = [], u = (i + "").trim().split(/\s+/);
    if (u.length > 6)
      throw new Error("Invalid cron expression");
    for (var c = w.map.length - u.length, l = 0, f = w.map.length; l < f; ++l) {
      var h = w.map[l], d = u[u.length > f ? l : l - c];
      if (l < c || !d)
        o.push(
          w._parseField(
            h,
            w.parseDefaults[l],
            w.constraints[l]
          )
        );
      else {
        var m = h === "dayOfWeek" ? F(d) : d;
        o.push(
          w._parseField(
            h,
            m,
            w.constraints[l]
          )
        );
      }
    }
    for (var k = {}, l = 0, f = w.map.length; l < f; l++) {
      var E = w.map[l];
      k[E] = o[l];
    }
    var v = w._handleMaxDaysInMonth(k);
    return k.dayOfMonth = v || k.dayOfMonth, new w(k, a);
    function F(z) {
      var re = z.split("#");
      if (re.length > 1) {
        var Q = +re[re.length - 1];
        if (/,/.test(z))
          throw new Error("Constraint error, invalid dayOfWeek `#` and `,` special characters are incompatible");
        if (/\//.test(z))
          throw new Error("Constraint error, invalid dayOfWeek `#` and `/` special characters are incompatible");
        if (/-/.test(z))
          throw new Error("Constraint error, invalid dayOfWeek `#` and `-` special characters are incompatible");
        if (re.length > 2 || Number.isNaN(Q) || Q < 1 || Q > 5)
          throw new Error("Constraint error, invalid dayOfWeek occurrence number (#)");
        return a.nthDayOfWeek = Q, re[0];
      }
      return z;
    }
  }
  return s(e, r);
};
w.fieldsToExpression = function(e, r) {
  function n(h, d, m) {
    if (!d)
      throw new Error("Validation error, Field " + h + " is missing");
    if (d.length === 0)
      throw new Error("Validation error, Field " + h + " contains no values");
    for (var k = 0, E = d.length; k < E; k++) {
      var v = d[k];
      if (!w._isValidConstraintChar(m, v) && (typeof v != "number" || Number.isNaN(v) || v < m.min || v > m.max))
        throw new Error(
          "Constraint error, got value " + v + " expected range " + m.min + "-" + m.max
        );
    }
  }
  for (var s = {}, i = 0, a = w.map.length; i < a; ++i) {
    var o = w.map[i], u = e[o];
    n(
      o,
      u,
      w.constraints[i]
    );
    for (var c = [], l = -1; ++l < u.length; )
      c[l] = u[l];
    if (u = c.sort(w._sortCompareFn).filter(function(h, d, m) {
      return !d || h !== m[d - 1];
    }), u.length !== c.length)
      throw new Error("Validation error, Field " + o + " contains duplicate values");
    s[o] = u;
  }
  var f = w._handleMaxDaysInMonth(s);
  return s.dayOfMonth = f || s.dayOfMonth, new w(s, r || {});
};
var yd = w, zr = yd;
function Ye() {
}
Ye._parseEntry = function(e) {
  var r = e.split(" ");
  if (r.length === 6)
    return {
      interval: zr.parse(e)
    };
  if (r.length > 6)
    return {
      interval: zr.parse(
        r.slice(0, 6).join(" ")
      ),
      command: r.slice(6, r.length)
    };
  throw new Error("Invalid entry: " + e);
};
Ye.parseExpression = function(e, r) {
  return zr.parse(e, r);
};
Ye.fieldsToExpression = function(e, r) {
  return zr.fieldsToExpression(e, r);
};
Ye.parseString = function(e) {
  for (var r = e.split(`
`), n = {
    variables: {},
    expressions: [],
    errors: {}
  }, s = 0, i = r.length; s < i; s++) {
    var a = r[s], o = null, u = a.trim();
    if (u.length > 0) {
      if (u.match(/^#/))
        continue;
      if (o = u.match(/^(.*)=(.*)$/))
        n.variables[o[1]] = o[2];
      else {
        var c = null;
        try {
          c = Ye._parseEntry("0 " + u), n.expressions.push(c.interval);
        } catch (l) {
          n.errors[u] = l;
        }
      }
    }
  }
  return n;
};
Ye.parseFile = function(e, r) {
  $a.readFile(e, function(n, s) {
    if (n) {
      r(n);
      return;
    }
    return r(null, Ye.parseString(s.toString()));
  });
};
var wd = Ye, _e = {};
_e.add = vd;
_e.addFromFront = _d;
_e.remove = Dd;
_e.has = Od;
_e.eq = Es;
_e.lte = kd;
_e.lt = Td;
_e.gte = bd;
_e.gt = Sd;
_e.nearest = Ed;
function $e(t, e) {
  return t === e ? 0 : t < e ? -1 : 1;
}
function vd(t, e, r) {
  r || (r = $e);
  for (var n = t.push(e) - 1; n; ) {
    if (r(t[n - 1], e) < 0) return;
    t[n] = t[n - 1], t[n - 1] = e, n--;
  }
}
function _d(t, e, r) {
  r || (r = $e);
  for (var n = t.unshift(e) - 1, s = 0; s < n; s++) {
    if (r(e, t[s + 1]) < 0) return;
    t[s] = t[s + 1], t[s + 1] = e;
  }
}
function kd(t, e, r) {
  r || (r = $e);
  var n = er(t, e, r);
  if (n === -1) return -1;
  for (; n >= 0; n--) {
    var s = r(t[n], e);
    if (s <= 0) return n;
  }
  return -1;
}
function Td(t, e, r) {
  r || (r = $e);
  var n = er(t, e, r);
  if (n === -1) return -1;
  for (; n >= 0; n--) {
    var s = r(t[n], e);
    if (s < 0) return n;
  }
  return -1;
}
function bd(t, e, r) {
  r || (r = $e);
  var n = er(t, e, r);
  if (n === -1) return -1;
  for (; n < t.length; n++) {
    var s = r(t[n], e);
    if (s >= 0) return n;
  }
  return -1;
}
function Sd(t, e, r) {
  r || (r = $e);
  var n = er(t, e, r);
  if (n === -1) return -1;
  for (; n < t.length; n++) {
    var s = r(t[n], e);
    if (s > 0) return n;
  }
  return -1;
}
function Es(t, e, r) {
  r || (r = $e);
  var n = er(t, e, r);
  return n === -1 ? -1 : r(t[n], e) === 0 ? n : -1;
}
function Ed(t, e, r) {
  r || (r = $e);
  for (var n = t.length, s = n - 1, i = 0, a = -1, o = 1; s >= i && i >= 0 && s < n; ) {
    a = Math.floor((s + i) / 2);
    var u = r(t[a], e);
    if (u === 0) return a;
    if (u >= 0) {
      if (o === 1) o = 0;
      else if (o === 2)
        return Math.abs(t[a] - e) > Math.abs(t[a - 1] - e) ? a - 1 : a;
      s = a - 1;
    } else {
      if (o === 1) o = 2;
      else if (o === 0) return a;
      i = a + 1;
    }
  }
  return a;
}
function er(t, e, r) {
  r || (r = $e);
  for (var n = t.length, s = n - 1, i = 0, a = -1; s >= i && i >= 0 && s < n; ) {
    a = Math.floor((s + i) / 2);
    var o = r(t[a], e);
    if (o === 0) return a;
    o >= 0 ? s = a - 1 : i = a + 1;
  }
  return a;
}
function Od(t, e, r) {
  return Es(t, e, r) > -1;
}
function Dd(t, e, r) {
  var n = Es(t, e, r);
  return n === -1 ? !1 : (t.splice(n, 1), !0);
}
var qo = {};
(function(t) {
  var e = 2147483647;
  t.setTimeout = function(s, i) {
    return new r(s, i);
  }, t.setInterval = function(s, i) {
    return new n(s, i);
  }, t.clearTimeout = function(s) {
    s && s.close();
  }, t.clearInterval = t.clearTimeout, t.Timeout = r, t.Interval = n;
  function r(s, i) {
    this.listener = s, this.after = i, this.unreffed = !1, this.start();
  }
  r.prototype.unref = function() {
    this.unreffed || (this.unreffed = !0, this.timeout.unref());
  }, r.prototype.ref = function() {
    this.unreffed && (this.unreffed = !1, this.timeout.ref());
  }, r.prototype.start = function() {
    if (this.after <= e)
      this.timeout = setTimeout(this.listener, this.after);
    else {
      var s = this;
      this.timeout = setTimeout(function() {
        s.after -= e, s.start();
      }, e);
    }
    this.unreffed && this.timeout.unref();
  }, r.prototype.close = function() {
    clearTimeout(this.timeout);
  };
  function n(s, i) {
    this.listener = s, this.after = this.timeLeft = i, this.unreffed = !1, this.start();
  }
  n.prototype.unref = function() {
    this.unreffed || (this.unreffed = !0, this.timeout.unref());
  }, n.prototype.ref = function() {
    this.unreffed && (this.unreffed = !1, this.timeout.ref());
  }, n.prototype.start = function() {
    var s = this;
    this.timeLeft <= e ? this.timeout = setTimeout(function() {
      s.listener(), s.timeLeft = s.after, s.start();
    }, this.timeLeft) : this.timeout = setTimeout(function() {
      s.timeLeft -= e, s.start();
    }, e), this.unreffed && this.timeout.unref();
  }, n.prototype.close = function() {
    r.prototype.close.apply(this, arguments);
  };
})(qo);
const Os = qo, Ge = Ss, Cd = _e, Be = [];
let fe = null;
const Go = new It();
Go.recurs = !1;
function Bo(t, e, r, n) {
  this.job = t, this.fireDate = e, this.endDate = n, this.recurrenceRule = r || Go, this.timerID = null;
}
function Zo(t, e) {
  return t.fireDate.getTime() - e.fireDate.getTime();
}
function Kr(t, e, r) {
  this.start = t || 0, this.end = e || 60, this.step = r || 1;
}
Kr.prototype.contains = function(t) {
  if (this.step === null || this.step === 1)
    return t >= this.start && t <= this.end;
  for (let e = this.start; e < this.end; e += this.step)
    if (e === t)
      return !0;
  return !1;
};
function It(t, e, r, n, s, i, a) {
  this.recurs = !0, this.year = t ?? null, this.month = e ?? null, this.date = r ?? null, this.dayOfWeek = n ?? null, this.hour = s ?? null, this.minute = i ?? null, this.second = a ?? 0;
}
It.prototype.isValid = function() {
  function t(e) {
    return Array.isArray(e) || e instanceof Array ? e.every(function(r) {
      return t(r);
    }) : !(Number.isNaN(Number(e)) && !(e instanceof Kr));
  }
  if (this.month !== null && (this.month < 0 || this.month > 11 || !t(this.month)) || this.dayOfWeek !== null && (this.dayOfWeek < 0 || this.dayOfWeek > 6 || !t(this.dayOfWeek)) || this.hour !== null && (this.hour < 0 || this.hour > 23 || !t(this.hour)) || this.minute !== null && (this.minute < 0 || this.minute > 59 || !t(this.minute)) || this.second !== null && (this.second < 0 || this.second > 59 || !t(this.second)))
    return !1;
  if (this.date !== null) {
    if (!t(this.date))
      return !1;
    switch (this.month) {
      case 3:
      case 5:
      case 8:
      case 10:
        if (this.date < 1 || this.date > 30)
          return !1;
        break;
      case 1:
        if (this.date < 1 || this.date > 29)
          return !1;
        break;
      default:
        if (this.date < 1 || this.date > 31)
          return !1;
    }
  }
  return !0;
};
It.prototype.nextInvocationDate = function(t) {
  const e = this._nextInvocationDate(t);
  return e ? e.toDate() : null;
};
It.prototype._nextInvocationDate = function(t) {
  if (t = t instanceof Ge || t instanceof Date ? t : /* @__PURE__ */ new Date(), !this.recurs || !this.isValid())
    return null;
  let r = new Ge(Date.now(), this.tz).getFullYear();
  if (this.year !== null && typeof this.year == "number" && this.year < r)
    return null;
  let n = new Ge(t.getTime(), this.tz);
  for (n.addSecond(); ; ) {
    if (this.year !== null) {
      if (r = n.getFullYear(), typeof this.year == "number" && this.year < r) {
        n = null;
        break;
      }
      if (!Ve(r, this.year)) {
        n.addYear(), n.setMonth(0), n.setDate(1), n.setHours(0), n.setMinutes(0), n.setSeconds(0);
        continue;
      }
    }
    if (this.month != null && !Ve(n.getMonth(), this.month)) {
      n.addMonth();
      continue;
    }
    if (this.date != null && !Ve(n.getDate(), this.date)) {
      n.addDay();
      continue;
    }
    if (this.dayOfWeek != null && !Ve(n.getDay(), this.dayOfWeek)) {
      n.addDay();
      continue;
    }
    if (this.hour != null && !Ve(n.getHours(), this.hour)) {
      n.addHour();
      continue;
    }
    if (this.minute != null && !Ve(n.getMinutes(), this.minute)) {
      n.addMinute();
      continue;
    }
    if (this.second != null && !Ve(n.getSeconds(), this.second)) {
      n.addSecond();
      continue;
    }
    break;
  }
  return n;
};
function Ve(t, e) {
  if (e == null)
    return !0;
  if (typeof e == "number")
    return t === e;
  if (typeof e == "string")
    return t === Number(e);
  if (e instanceof Kr)
    return e.contains(t);
  if (Array.isArray(e) || e instanceof Array) {
    for (let r = 0; r < e.length; r++)
      if (Ve(t, e[r]))
        return !0;
  }
  return !1;
}
function Yo(t, e) {
  const r = Date.now(), n = t.getTime();
  return Os.setTimeout(function() {
    n > Date.now() ? Yo(t, e) : e();
  }, n < r ? 0 : n - r);
}
function Jo(t) {
  Cd.add(Be, t, Zo), Ds();
  const e = t.fireDate instanceof Ge ? t.fireDate.toDate() : t.fireDate;
  t.job.emit("scheduled", e);
}
function Ds() {
  if (Be.length > 0 && fe !== Be[0]) {
    fe !== null && (Os.clearTimeout(fe.timerID), fe.timerID = null, fe = null), fe = Be[0];
    const t = fe.job, e = fe;
    fe.timerID = Yo(fe.fireDate, function() {
      if (Id(), t.callback && t.callback(), e.recurrenceRule.recurs || e.recurrenceRule._endDate === null) {
        const r = Qo(e.recurrenceRule, e.job, e.fireDate, e.endDate);
        r !== null && r.job.trackInvocation(r);
      }
      t.stopTrackingInvocation(e);
      try {
        const r = t.invoke(e.fireDate instanceof Ge ? e.fireDate.toDate() : e.fireDate);
        t.emit("run"), t.running += 1, r instanceof Promise ? r.then(function(n) {
          t.emit("success", n), t.running -= 1;
        }).catch(function(n) {
          t.emit("error", n), t.running -= 1;
        }) : (t.emit("success", r), t.running -= 1);
      } catch (r) {
        t.emit("error", r), t.running -= 1;
      }
      t.isOneTimeJob && t.deleteFromSchedule();
    });
  }
}
function Id() {
  Be.shift(), fe = null, Ds();
}
function xd(t) {
  const e = Be.indexOf(t);
  e > -1 && (Be.splice(e, 1), t.timerID !== null && Os.clearTimeout(t.timerID), fe === t && (fe = null), t.job.emit("canceled", t.fireDate), Ds());
}
function Qo(t, e, r, n) {
  r = r instanceof Ge ? r : new Ge();
  const s = t instanceof It ? t._nextInvocationDate(r) : t.next();
  if (s === null || n instanceof Ge && s.getTime() > n.getTime())
    return null;
  const i = new Bo(e, s, t, n);
  return Jo(i), i;
}
var Ko = {
  Range: Kr,
  RecurrenceRule: It,
  Invocation: Bo,
  cancelInvocation: xd,
  scheduleInvocation: Jo,
  scheduleNextRecurrence: Qo,
  sorter: Zo,
  _invocations: Be
};
function Fd(t) {
  return t.getTime() === t.getTime();
}
var Md = {
  isValidDate: Fd
};
const Rd = ql, Nd = wd, Sn = Ss, Pd = _e, { scheduleNextRecurrence: Vr, scheduleInvocation: Ad, cancelInvocation: En, RecurrenceRule: zi, sorter: Ld, Invocation: Wd } = Ko, { isValidDate: On } = Md, Cs = {};
let pr = 0;
function $d() {
  const t = /* @__PURE__ */ new Date();
  return pr === Number.MAX_SAFE_INTEGER && (pr = 0), pr++, `<Anonymous Job ${pr} ${t.toISOString()}>`;
}
function tr(t, e, r) {
  this.pendingInvocations = [];
  let n = 0;
  const s = t && typeof t == "string" ? t : $d();
  this.job = t && typeof t == "function" ? t : e, this.job === t ? this.callback = typeof e == "function" ? e : !1 : this.callback = typeof r == "function" ? r : !1, this.running = 0, typeof this.job == "function" && this.job.prototype && this.job.prototype.next && (this.job = (function() {
    return this.next().value;
  }).bind(this.job.call(this))), Object.defineProperty(this, "name", {
    value: s,
    writable: !1,
    enumerable: !0
  }), this.trackInvocation = function(i) {
    return Pd.add(this.pendingInvocations, i, Ld), !0;
  }, this.stopTrackingInvocation = function(i) {
    const a = this.pendingInvocations.indexOf(i);
    return a > -1 ? (this.pendingInvocations.splice(a, 1), !0) : !1;
  }, this.triggeredJobs = function() {
    return n;
  }, this.setTriggeredJobs = function(i) {
    n = i;
  }, this.deleteFromSchedule = function() {
    Xo(this.name);
  }, this.cancel = function(i) {
    i = typeof i == "boolean" ? i : !1;
    let a, o;
    const u = [];
    for (let c = 0; c < this.pendingInvocations.length; c++)
      a = this.pendingInvocations[c], En(a), i && (a.recurrenceRule.recurs || a.recurrenceRule.next) && (o = Vr(a.recurrenceRule, this, a.fireDate, a.endDate), o !== null && u.push(o));
    this.pendingInvocations = [];
    for (let c = 0; c < u.length; c++)
      this.trackInvocation(u[c]);
    return i || this.deleteFromSchedule(), !0;
  }, this.cancelNext = function(i) {
    if (i = typeof i == "boolean" ? i : !0, !this.pendingInvocations.length)
      return !1;
    let a;
    const o = this.pendingInvocations.shift();
    return En(o), i && (o.recurrenceRule.recurs || o.recurrenceRule.next) && (a = Vr(o.recurrenceRule, this, o.fireDate, o.endDate), a !== null && this.trackInvocation(a)), !0;
  }, this.reschedule = function(i) {
    let a;
    const o = this.pendingInvocations.slice();
    for (let u = 0; u < o.length; u++)
      a = o[u], En(a);
    return this.pendingInvocations = [], this.schedule(i) ? (this.setTriggeredJobs(0), !0) : (this.pendingInvocations = o, !1);
  }, this.nextInvocation = function() {
    return this.pendingInvocations.length ? this.pendingInvocations[0].fireDate : null;
  };
}
Object.setPrototypeOf(tr.prototype, Rd.EventEmitter.prototype);
tr.prototype.invoke = function(t) {
  return this.setTriggeredJobs(this.triggeredJobs() + 1), this.job(t);
};
tr.prototype.runOnDate = function(t) {
  return this.schedule(t);
};
tr.prototype.schedule = function(t) {
  const e = this;
  let r = !1, n, s, i, a;
  typeof t == "object" && "tz" in t && (a = t.tz), typeof t == "object" && t.rule && (s = t.start || void 0, i = t.end || void 0, t = t.rule, s && (s instanceof Date || (s = new Date(s)), s = new Sn(s, a), (!On(s) || s.getTime() < Date.now()) && (s = void 0)), i && !(i instanceof Date) && !On(i = new Date(i)) && (i = void 0), i && (i = new Sn(i, a)));
  try {
    const o = Nd.parseExpression(t, { currentDate: s, tz: a });
    n = Vr(o, e, s, i), n !== null && (r = e.trackInvocation(n));
  } catch {
    const u = typeof t;
    if ((u === "string" || u === "number") && (t = new Date(t)), t instanceof Date && On(t))
      t = new Sn(t), e.isOneTimeJob = !0, t.getTime() >= Date.now() && (n = new Wd(e, t), Ad(n), r = e.trackInvocation(n));
    else if (u === "object") {
      if (e.isOneTimeJob = !1, !(t instanceof zi)) {
        const c = new zi();
        "year" in t && (c.year = t.year), "month" in t && (c.month = t.month), "date" in t && (c.date = t.date), "dayOfWeek" in t && (c.dayOfWeek = t.dayOfWeek), "hour" in t && (c.hour = t.hour), "minute" in t && (c.minute = t.minute), "second" in t && (c.second = t.second), t = c;
      }
      t.tz = a, n = Vr(t, e, s, i), n !== null && (r = e.trackInvocation(n));
    }
  }
  return Cs[this.name] = this, r;
};
function Xo(t) {
  t && delete Cs[t];
}
var eu = {
  Job: tr,
  deleteScheduledJob: Xo,
  scheduledJobs: Cs
};
const { Job: Is, scheduledJobs: Ae } = eu;
function Ud() {
  if (arguments.length < 2)
    throw new RangeError("Invalid number of arguments");
  const t = arguments.length >= 3 && typeof arguments[0] == "string" ? arguments[0] : null, e = t ? arguments[1] : arguments[0], r = t ? arguments[2] : arguments[1], n = t ? arguments[3] : arguments[2];
  if (typeof r != "function")
    throw new RangeError("The job method must be a function.");
  const s = new Is(t, r, n);
  return s.schedule(e) ? s : null;
}
function zd(t, e) {
  if (t instanceof Is) {
    if (t.reschedule(e))
      return t;
  } else if (typeof t == "string")
    if (Object.prototype.hasOwnProperty.call(Ae, t)) {
      if (Ae[t].reschedule(e))
        return Ae[t];
    } else
      throw new Error("Cannot reschedule one-off job by name, pass job reference instead");
  return null;
}
function Vd(t) {
  let e = !1;
  return t instanceof Is ? e = t.cancel() : (typeof t == "string" || t instanceof String) && t in Ae && Object.prototype.hasOwnProperty.call(Ae, t) && (e = Ae[t].cancel()), e;
}
function jd() {
  const t = Object.keys(Ae).map((r) => Ae[r]);
  t.forEach(function(r) {
    r.cancel();
  });
  let e = !1;
  for (let r = 0; r < t.length; r++)
    if (t[r].running > 0) {
      e = !0;
      break;
    }
  return new Promise(function(r) {
    e ? setInterval(function() {
      for (let n = 0; n < t.length; n++)
        if (t[n].running > 0)
          return;
      r();
    }, 500) : r();
  });
}
var Hd = {
  scheduleJob: Ud,
  rescheduleJob: zd,
  scheduledJobs: Ae,
  cancelJob: Vd,
  gracefulShutdown: jd
};
const { cancelJob: qd, rescheduleJob: Gd, scheduledJobs: Bd, scheduleJob: Zd, gracefulShutdown: Yd } = Hd, { Invocation: Jd, RecurrenceRule: Qd, Range: Kd } = Ko, { Job: Xd } = eu;
var em = {
  Job: Xd,
  Invocation: Jd,
  Range: Kd,
  RecurrenceRule: Qd,
  cancelJob: qd,
  rescheduleJob: Gd,
  scheduledJobs: Bd,
  scheduleJob: Zd,
  gracefulShutdown: Yd
};
const Vi = /* @__PURE__ */ Va(em), Re = /* @__PURE__ */ new Map();
function tm() {
  _.handle("create-schedule", async (t, e) => {
    var r;
    try {
      Re.has(e.id) && ((r = Re.get(e.id)) == null || r.cancel());
      const n = Vi.scheduleJob(e.cron, () => {
        t.sender.send("schedule-triggered", {
          id: e.id,
          task: e.task
        });
      });
      return Re.set(e.id, n), !0;
    } catch (n) {
      return console.error("Failed to create schedule:", n), !1;
    }
  }), _.handle("cancel-schedule", (t, e) => {
    const r = Re.get(e);
    return r ? (r.cancel(), Re.delete(e), !0) : !1;
  }), _.handle("update-schedule", async (t, e) => {
    var r;
    try {
      Re.has(e.id) && ((r = Re.get(e.id)) == null || r.cancel());
      const n = Vi.scheduleJob(e.cron, () => {
        t.sender.send("schedule-triggered", {
          id: e.id,
          task: e.task
        });
      });
      return Re.set(e.id, n), !0;
    } catch (n) {
      return console.error("Failed to create schedule:", n), !1;
    }
  }), _.handle("get-schedules", () => Array.from(Re.keys()));
}
var Yn = {}, tu = {}, Jn = { exports: {} }, gr = { exports: {} }, Dn, ji;
function rm() {
  if (ji) return Dn;
  ji = 1;
  var t = 1e3, e = t * 60, r = e * 60, n = r * 24, s = n * 7, i = n * 365.25;
  Dn = function(l, f) {
    f = f || {};
    var h = typeof l;
    if (h === "string" && l.length > 0)
      return a(l);
    if (h === "number" && isFinite(l))
      return f.long ? u(l) : o(l);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(l)
    );
  };
  function a(l) {
    if (l = String(l), !(l.length > 100)) {
      var f = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        l
      );
      if (f) {
        var h = parseFloat(f[1]), d = (f[2] || "ms").toLowerCase();
        switch (d) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return h * i;
          case "weeks":
          case "week":
          case "w":
            return h * s;
          case "days":
          case "day":
          case "d":
            return h * n;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return h * r;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return h * e;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return h * t;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return h;
          default:
            return;
        }
      }
    }
  }
  function o(l) {
    var f = Math.abs(l);
    return f >= n ? Math.round(l / n) + "d" : f >= r ? Math.round(l / r) + "h" : f >= e ? Math.round(l / e) + "m" : f >= t ? Math.round(l / t) + "s" : l + "ms";
  }
  function u(l) {
    var f = Math.abs(l);
    return f >= n ? c(l, f, n, "day") : f >= r ? c(l, f, r, "hour") : f >= e ? c(l, f, e, "minute") : f >= t ? c(l, f, t, "second") : l + " ms";
  }
  function c(l, f, h, d) {
    var m = f >= h * 1.5;
    return Math.round(l / h) + " " + d + (m ? "s" : "");
  }
  return Dn;
}
var Cn, Hi;
function ru() {
  if (Hi) return Cn;
  Hi = 1;
  function t(e) {
    n.debug = n, n.default = n, n.coerce = c, n.disable = o, n.enable = i, n.enabled = u, n.humanize = rm(), n.destroy = l, Object.keys(e).forEach((f) => {
      n[f] = e[f];
    }), n.names = [], n.skips = [], n.formatters = {};
    function r(f) {
      let h = 0;
      for (let d = 0; d < f.length; d++)
        h = (h << 5) - h + f.charCodeAt(d), h |= 0;
      return n.colors[Math.abs(h) % n.colors.length];
    }
    n.selectColor = r;
    function n(f) {
      let h, d = null, m, k;
      function E(...v) {
        if (!E.enabled)
          return;
        const F = E, z = Number(/* @__PURE__ */ new Date()), re = z - (h || z);
        F.diff = re, F.prev = h, F.curr = z, h = z, v[0] = n.coerce(v[0]), typeof v[0] != "string" && v.unshift("%O");
        let Q = 0;
        v[0] = v[0].replace(/%([a-zA-Z%])/g, (Qe, Ft) => {
          if (Qe === "%%")
            return "%";
          Q++;
          const De = n.formatters[Ft];
          if (typeof De == "function") {
            const Me = v[Q];
            Qe = De.call(F, Me), v.splice(Q, 1), Q--;
          }
          return Qe;
        }), n.formatArgs.call(F, v), (F.log || n.log).apply(F, v);
      }
      return E.namespace = f, E.useColors = n.useColors(), E.color = n.selectColor(f), E.extend = s, E.destroy = n.destroy, Object.defineProperty(E, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => d !== null ? d : (m !== n.namespaces && (m = n.namespaces, k = n.enabled(f)), k),
        set: (v) => {
          d = v;
        }
      }), typeof n.init == "function" && n.init(E), E;
    }
    function s(f, h) {
      const d = n(this.namespace + (typeof h > "u" ? ":" : h) + f);
      return d.log = this.log, d;
    }
    function i(f) {
      n.save(f), n.namespaces = f, n.names = [], n.skips = [];
      const h = (typeof f == "string" ? f : "").trim().replace(" ", ",").split(",").filter(Boolean);
      for (const d of h)
        d[0] === "-" ? n.skips.push(d.slice(1)) : n.names.push(d);
    }
    function a(f, h) {
      let d = 0, m = 0, k = -1, E = 0;
      for (; d < f.length; )
        if (m < h.length && (h[m] === f[d] || h[m] === "*"))
          h[m] === "*" ? (k = m, E = d, m++) : (d++, m++);
        else if (k !== -1)
          m = k + 1, E++, d = E;
        else
          return !1;
      for (; m < h.length && h[m] === "*"; )
        m++;
      return m === h.length;
    }
    function o() {
      const f = [
        ...n.names,
        ...n.skips.map((h) => "-" + h)
      ].join(",");
      return n.enable(""), f;
    }
    function u(f) {
      for (const h of n.skips)
        if (a(f, h))
          return !1;
      for (const h of n.names)
        if (a(f, h))
          return !0;
      return !1;
    }
    function c(f) {
      return f instanceof Error ? f.stack || f.message : f;
    }
    function l() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    return n.enable(n.load()), n;
  }
  return Cn = t, Cn;
}
var qi;
function nm() {
  return qi || (qi = 1, function(t, e) {
    e.formatArgs = n, e.save = s, e.load = i, e.useColors = r, e.storage = a(), e.destroy = /* @__PURE__ */ (() => {
      let u = !1;
      return () => {
        u || (u = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
      };
    })(), e.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function r() {
      if (typeof window < "u" && window.process && (window.process.type === "renderer" || window.process.__nwjs))
        return !0;
      if (typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))
        return !1;
      let u;
      return typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator < "u" && navigator.userAgent && (u = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(u[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function n(u) {
      if (u[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + u[0] + (this.useColors ? "%c " : " ") + "+" + t.exports.humanize(this.diff), !this.useColors)
        return;
      const c = "color: " + this.color;
      u.splice(1, 0, c, "color: inherit");
      let l = 0, f = 0;
      u[0].replace(/%[a-zA-Z%]/g, (h) => {
        h !== "%%" && (l++, h === "%c" && (f = l));
      }), u.splice(f, 0, c);
    }
    e.log = console.debug || console.log || (() => {
    });
    function s(u) {
      try {
        u ? e.storage.setItem("debug", u) : e.storage.removeItem("debug");
      } catch {
      }
    }
    function i() {
      let u;
      try {
        u = e.storage.getItem("debug");
      } catch {
      }
      return !u && typeof process < "u" && "env" in process && (u = process.env.DEBUG), u;
    }
    function a() {
      try {
        return localStorage;
      } catch {
      }
    }
    t.exports = ru()(e);
    const { formatters: o } = t.exports;
    o.j = function(u) {
      try {
        return JSON.stringify(u);
      } catch (c) {
        return "[UnexpectedJSONParseError]: " + c.message;
      }
    };
  }(gr, gr.exports)), gr.exports;
}
var yr = { exports: {} }, In, Gi;
function sm() {
  return Gi || (Gi = 1, In = (t, e = process.argv) => {
    const r = t.startsWith("-") ? "" : t.length === 1 ? "-" : "--", n = e.indexOf(r + t), s = e.indexOf("--");
    return n !== -1 && (s === -1 || n < s);
  }), In;
}
var xn, Bi;
function im() {
  if (Bi) return xn;
  Bi = 1;
  const t = Ql, e = Ua, r = sm(), { env: n } = process;
  let s;
  r("no-color") || r("no-colors") || r("color=false") || r("color=never") ? s = 0 : (r("color") || r("colors") || r("color=true") || r("color=always")) && (s = 1), "FORCE_COLOR" in n && (n.FORCE_COLOR === "true" ? s = 1 : n.FORCE_COLOR === "false" ? s = 0 : s = n.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(n.FORCE_COLOR, 10), 3));
  function i(u) {
    return u === 0 ? !1 : {
      level: u,
      hasBasic: !0,
      has256: u >= 2,
      has16m: u >= 3
    };
  }
  function a(u, c) {
    if (s === 0)
      return 0;
    if (r("color=16m") || r("color=full") || r("color=truecolor"))
      return 3;
    if (r("color=256"))
      return 2;
    if (u && !c && s === void 0)
      return 0;
    const l = s || 0;
    if (n.TERM === "dumb")
      return l;
    if (process.platform === "win32") {
      const f = t.release().split(".");
      return Number(f[0]) >= 10 && Number(f[2]) >= 10586 ? Number(f[2]) >= 14931 ? 3 : 2 : 1;
    }
    if ("CI" in n)
      return ["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE"].some((f) => f in n) || n.CI_NAME === "codeship" ? 1 : l;
    if ("TEAMCITY_VERSION" in n)
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(n.TEAMCITY_VERSION) ? 1 : 0;
    if (n.COLORTERM === "truecolor")
      return 3;
    if ("TERM_PROGRAM" in n) {
      const f = parseInt((n.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (n.TERM_PROGRAM) {
        case "iTerm.app":
          return f >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    return /-256(color)?$/i.test(n.TERM) ? 2 : /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(n.TERM) || "COLORTERM" in n ? 1 : l;
  }
  function o(u) {
    const c = a(u, u && u.isTTY);
    return i(c);
  }
  return xn = {
    supportsColor: o,
    stdout: i(a(!0, e.isatty(1))),
    stderr: i(a(!0, e.isatty(2)))
  }, xn;
}
var Zi;
function am() {
  return Zi || (Zi = 1, function(t, e) {
    const r = Ua, n = Jl;
    e.init = l, e.log = o, e.formatArgs = i, e.save = u, e.load = c, e.useColors = s, e.destroy = n.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    ), e.colors = [6, 2, 3, 4, 5, 1];
    try {
      const h = im();
      h && (h.stderr || h).level >= 2 && (e.colors = [
        20,
        21,
        26,
        27,
        32,
        33,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        56,
        57,
        62,
        63,
        68,
        69,
        74,
        75,
        76,
        77,
        78,
        79,
        80,
        81,
        92,
        93,
        98,
        99,
        112,
        113,
        128,
        129,
        134,
        135,
        148,
        149,
        160,
        161,
        162,
        163,
        164,
        165,
        166,
        167,
        168,
        169,
        170,
        171,
        172,
        173,
        178,
        179,
        184,
        185,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        203,
        204,
        205,
        206,
        207,
        208,
        209,
        214,
        215,
        220,
        221
      ]);
    } catch {
    }
    e.inspectOpts = Object.keys(process.env).filter((h) => /^debug_/i.test(h)).reduce((h, d) => {
      const m = d.substring(6).toLowerCase().replace(/_([a-z])/g, (E, v) => v.toUpperCase());
      let k = process.env[d];
      return /^(yes|on|true|enabled)$/i.test(k) ? k = !0 : /^(no|off|false|disabled)$/i.test(k) ? k = !1 : k === "null" ? k = null : k = Number(k), h[m] = k, h;
    }, {});
    function s() {
      return "colors" in e.inspectOpts ? !!e.inspectOpts.colors : r.isatty(process.stderr.fd);
    }
    function i(h) {
      const { namespace: d, useColors: m } = this;
      if (m) {
        const k = this.color, E = "\x1B[3" + (k < 8 ? k : "8;5;" + k), v = `  ${E};1m${d} \x1B[0m`;
        h[0] = v + h[0].split(`
`).join(`
` + v), h.push(E + "m+" + t.exports.humanize(this.diff) + "\x1B[0m");
      } else
        h[0] = a() + d + " " + h[0];
    }
    function a() {
      return e.inspectOpts.hideDate ? "" : (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function o(...h) {
      return process.stderr.write(n.formatWithOptions(e.inspectOpts, ...h) + `
`);
    }
    function u(h) {
      h ? process.env.DEBUG = h : delete process.env.DEBUG;
    }
    function c() {
      return process.env.DEBUG;
    }
    function l(h) {
      h.inspectOpts = {};
      const d = Object.keys(e.inspectOpts);
      for (let m = 0; m < d.length; m++)
        h.inspectOpts[d[m]] = e.inspectOpts[d[m]];
    }
    t.exports = ru()(e);
    const { formatters: f } = t.exports;
    f.o = function(h) {
      return this.inspectOpts.colors = this.useColors, n.inspect(h, this.inspectOpts).split(`
`).map((d) => d.trim()).join(" ");
    }, f.O = function(h) {
      return this.inspectOpts.colors = this.useColors, n.inspect(h, this.inspectOpts);
    };
  }(yr, yr.exports)), yr.exports;
}
typeof process > "u" || process.type === "renderer" || process.browser === !0 || process.__nwjs ? Jn.exports = nm() : Jn.exports = am();
var nu = Jn.exports;
const Qn = /* @__PURE__ */ Va(nu);
(function(t) {
  var e = ui && ui.__importDefault || function(o) {
    return o && o.__esModule ? o : { default: o };
  };
  Object.defineProperty(t, "__esModule", { value: !0 });
  const r = $a, s = e(nu).default("@kwsites/file-exists");
  function i(o, u, c) {
    s("checking %s", o);
    try {
      const l = r.statSync(o);
      return l.isFile() && u ? (s("[OK] path represents a file"), !0) : l.isDirectory() && c ? (s("[OK] path represents a directory"), !0) : (s("[FAIL] path represents something other than a file or directory"), !1);
    } catch (l) {
      if (l.code === "ENOENT")
        return s("[FAIL] path is not accessible: %o", l), !1;
      throw s("[FATAL] %o", l), l;
    }
  }
  function a(o, u = t.READABLE) {
    return i(o, (u & t.FILE) > 0, (u & t.FOLDER) > 0);
  }
  t.exists = a, t.FILE = 1, t.FOLDER = 2, t.READABLE = t.FILE + t.FOLDER;
})(tu);
(function(t) {
  function e(r) {
    for (var n in r) t.hasOwnProperty(n) || (t[n] = r[n]);
  }
  Object.defineProperty(t, "__esModule", { value: !0 }), e(tu);
})(Yn);
var Tt = {};
Object.defineProperty(Tt, "__esModule", { value: !0 });
var su = Tt.createDeferred = gt = Tt.deferred = void 0;
function xs() {
  let t, e, r = "pending";
  return {
    promise: new Promise((s, i) => {
      t = s, e = i;
    }),
    done(s) {
      r === "pending" && (r = "resolved", t(s));
    },
    fail(s) {
      r === "pending" && (r = "rejected", e(s));
    },
    get fulfilled() {
      return r !== "pending";
    },
    get status() {
      return r;
    }
  };
}
var gt = Tt.deferred = xs;
su = Tt.createDeferred = xs;
Tt.default = xs;
var Xr = Object.defineProperty, om = Object.defineProperties, um = Object.getOwnPropertyDescriptor, cm = Object.getOwnPropertyDescriptors, Fs = Object.getOwnPropertyNames, Yi = Object.getOwnPropertySymbols, iu = Object.prototype.hasOwnProperty, lm = Object.prototype.propertyIsEnumerable, Ji = (t, e, r) => e in t ? Xr(t, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : t[e] = r, ye = (t, e) => {
  for (var r in e || (e = {}))
    iu.call(e, r) && Ji(t, r, e[r]);
  if (Yi)
    for (var r of Yi(e))
      lm.call(e, r) && Ji(t, r, e[r]);
  return t;
}, Ut = (t, e) => om(t, cm(e)), g = (t, e) => function() {
  return t && (e = (0, t[Fs(t)[0]])(t = 0)), e;
}, fm = (t, e) => function() {
  return e || (0, t[Fs(t)[0]])((e = { exports: {} }).exports, e), e.exports;
}, Z = (t, e) => {
  for (var r in e)
    Xr(t, r, { get: e[r], enumerable: !0 });
}, hm = (t, e, r, n) => {
  if (e && typeof e == "object" || typeof e == "function")
    for (let s of Fs(e))
      !iu.call(t, s) && s !== r && Xr(t, s, { get: () => e[s], enumerable: !(n = um(e, s)) || n.enumerable });
  return t;
}, H = (t) => hm(Xr({}, "__esModule", { value: !0 }), t), Lt = (t, e, r) => new Promise((n, s) => {
  var i = (u) => {
    try {
      o(r.next(u));
    } catch (c) {
      s(c);
    }
  }, a = (u) => {
    try {
      o(r.throw(u));
    } catch (c) {
      s(c);
    }
  }, o = (u) => u.done ? n(u.value) : Promise.resolve(u.value).then(i, a);
  o((r = r.apply(t, e)).next());
});
function dm(...t) {
  const e = new String(t);
  return en.set(e, t), e;
}
function jr(t) {
  return t instanceof String && en.has(t);
}
function Qi(t) {
  return en.get(t) || [];
}
var en, rr = g({
  "src/lib/args/pathspec.ts"() {
    en = /* @__PURE__ */ new WeakMap();
  }
}), We, Je = g({
  "src/lib/errors/git-error.ts"() {
    We = class extends Error {
      constructor(t, e) {
        super(e), this.task = t, Object.setPrototypeOf(this, new.target.prototype);
      }
    };
  }
}), nr, xt = g({
  "src/lib/errors/git-response-error.ts"() {
    Je(), nr = class extends We {
      constructor(t, e) {
        super(void 0, e || String(t)), this.git = t;
      }
    };
  }
}), au, ou = g({
  "src/lib/errors/task-configuration-error.ts"() {
    Je(), au = class extends We {
      constructor(t) {
        super(void 0, t);
      }
    };
  }
});
function uu(t) {
  return typeof t == "function" ? t : lt;
}
function cu(t) {
  return typeof t == "function" && t !== lt;
}
function lu(t, e) {
  const r = t.indexOf(e);
  return r <= 0 ? [t, ""] : [t.substr(0, r), t.substr(r + 1)];
}
function fu(t, e = 0) {
  return hu(t) && t.length > e ? t[e] : void 0;
}
function ut(t, e = 0) {
  if (hu(t) && t.length > e)
    return t[t.length - 1 - e];
}
function hu(t) {
  return !!(t && typeof t.length == "number");
}
function sr(t = "", e = !0, r = `
`) {
  return t.split(r).reduce((n, s) => {
    const i = e ? s.trim() : s;
    return i && n.push(i), n;
  }, []);
}
function Ms(t, e) {
  return sr(t, !0).map((r) => e(r));
}
function Rs(t) {
  return Yn.exists(t, Yn.FOLDER);
}
function N(t, e) {
  return Array.isArray(t) ? t.includes(e) || t.push(e) : t.add(e), e;
}
function du(t, e) {
  return Array.isArray(t) && !t.includes(e) && t.push(e), t;
}
function tn(t, e) {
  if (Array.isArray(t)) {
    const r = t.indexOf(e);
    r >= 0 && t.splice(r, 1);
  } else
    t.delete(e);
  return e;
}
function xe(t) {
  return Array.isArray(t) ? t : [t];
}
function mu(t) {
  return t.replace(/[\s-]+(.)/g, (e, r) => r.toUpperCase());
}
function pu(t) {
  return xe(t).map(String);
}
function U(t, e = 0) {
  if (t == null)
    return e;
  const r = parseInt(t, 10);
  return isNaN(r) ? e : r;
}
function qt(t, e) {
  const r = [];
  for (let n = 0, s = t.length; n < s; n++)
    r.push(e, t[n]);
  return r;
}
function Gt(t) {
  return (Array.isArray(t) ? Buffer.concat(t) : t).toString("utf-8");
}
function gu(t, e) {
  return Object.assign(
    {},
    ...e.map((r) => r in t ? { [r]: t[r] } : {})
  );
}
function Kn(t = 0) {
  return new Promise((e) => setTimeout(e, t));
}
function Xn(t) {
  if (t !== !1)
    return t;
}
var bt, lt, ir, rn = g({
  "src/lib/utils/util.ts"() {
    bt = "\0", lt = () => {
    }, ir = Object.prototype.toString.call.bind(Object.prototype.toString);
  }
});
function Fe(t, e, r) {
  return e(t) ? t : arguments.length > 2 ? r : void 0;
}
function Ns(t, e) {
  const r = jr(t) ? "string" : typeof t;
  return /number|string|boolean/.test(r) && (!e || !e.includes(r));
}
function Ps(t) {
  return !!t && ir(t) === "[object Object]";
}
function yu(t) {
  return typeof t == "function";
}
var ar, te, wu, Hr, As, vu = g({
  "src/lib/utils/argument-filters.ts"() {
    rn(), rr(), ar = (t) => Array.isArray(t), te = (t) => typeof t == "string", wu = (t) => Array.isArray(t) && t.every(te), Hr = (t) => te(t) || Array.isArray(t) && t.every(te), As = (t) => t == null || "number|boolean|function".includes(typeof t) ? !1 : Array.isArray(t) || typeof t == "string" || typeof t.length == "number";
  }
}), es, mm = g({
  "src/lib/utils/exit-codes.ts"() {
    es = /* @__PURE__ */ ((t) => (t[t.SUCCESS = 0] = "SUCCESS", t[t.ERROR = 1] = "ERROR", t[t.NOT_FOUND = -2] = "NOT_FOUND", t[t.UNCLEAN = 128] = "UNCLEAN", t))(es || {});
  }
}), Bt, pm = g({
  "src/lib/utils/git-output-streams.ts"() {
    Bt = class {
      constructor(t, e) {
        this.stdOut = t, this.stdErr = e;
      }
      asStrings() {
        return new Bt(this.stdOut.toString("utf8"), this.stdErr.toString("utf8"));
      }
    };
  }
}), x, Ze, gm = g({
  "src/lib/utils/line-parser.ts"() {
    x = class {
      constructor(t, e) {
        this.matches = [], this.parse = (r, n) => (this.resetMatches(), this._regExp.every((s, i) => this.addMatch(s, i, r(i))) ? this.useMatches(n, this.prepareMatches()) !== !1 : !1), this._regExp = Array.isArray(t) ? t : [t], e && (this.useMatches = e);
      }
      useMatches(t, e) {
        throw new Error("LineParser:useMatches not implemented");
      }
      resetMatches() {
        this.matches.length = 0;
      }
      prepareMatches() {
        return this.matches;
      }
      addMatch(t, e, r) {
        const n = r && t.exec(r);
        return n && this.pushMatch(e, n), !!n;
      }
      pushMatch(t, e) {
        this.matches.push(...e.slice(1));
      }
    }, Ze = class extends x {
      addMatch(t, e, r) {
        return /^remote:\s/.test(String(r)) && super.addMatch(t, e, r);
      }
      pushMatch(t, e) {
        (t > 0 || e.length > 1) && super.pushMatch(t, e);
      }
    };
  }
});
function _u(...t) {
  const e = process.cwd(), r = Object.assign(
    ye({ baseDir: e }, ku),
    ...t.filter((n) => typeof n == "object" && n)
  );
  return r.baseDir = r.baseDir || e, r.trimmed = r.trimmed === !0, r;
}
var ku, ym = g({
  "src/lib/utils/simple-git-options.ts"() {
    ku = {
      binary: "git",
      maxConcurrentProcesses: 5,
      config: [],
      trimmed: !1
    };
  }
});
function Ls(t, e = []) {
  return Ps(t) ? Object.keys(t).reduce((r, n) => {
    const s = t[n];
    return jr(s) ? r.push(s) : Ns(s, ["boolean"]) ? r.push(n + "=" + s) : r.push(n), r;
  }, e) : e;
}
function ae(t, e = 0, r = !1) {
  const n = [];
  for (let s = 0, i = e < 0 ? t.length : e; s < i; s++)
    "string|number".includes(typeof t[s]) && n.push(String(t[s]));
  return Ls(Ws(t), n), r || n.push(...wm(t)), n;
}
function wm(t) {
  const e = typeof ut(t) == "function";
  return Fe(ut(t, e ? 1 : 0), ar, []);
}
function Ws(t) {
  const e = yu(ut(t));
  return Fe(ut(t, e ? 1 : 0), Ps);
}
function G(t, e = !0) {
  const r = uu(ut(t));
  return e || cu(r) ? r : void 0;
}
var vm = g({
  "src/lib/utils/task-options.ts"() {
    vu(), rn(), rr();
  }
});
function ts(t, e) {
  return t(e.stdOut, e.stdErr);
}
function ue(t, e, r, n = !0) {
  return xe(r).forEach((s) => {
    for (let i = sr(s, n), a = 0, o = i.length; a < o; a++) {
      const u = (c = 0) => {
        if (!(a + c >= o))
          return i[a + c];
      };
      e.some(({ parse: c }) => c(u, t));
    }
  }), t;
}
var _m = g({
  "src/lib/utils/task-parser.ts"() {
    rn();
  }
}), Tu = {};
Z(Tu, {
  ExitCodes: () => es,
  GitOutputStreams: () => Bt,
  LineParser: () => x,
  NOOP: () => lt,
  NULL: () => bt,
  RemoteLineParser: () => Ze,
  append: () => N,
  appendTaskOptions: () => Ls,
  asArray: () => xe,
  asCamelCase: () => mu,
  asFunction: () => uu,
  asNumber: () => U,
  asStringArray: () => pu,
  bufferToString: () => Gt,
  callTaskParser: () => ts,
  createInstanceConfig: () => _u,
  delay: () => Kn,
  filterArray: () => ar,
  filterFunction: () => yu,
  filterHasLength: () => As,
  filterPlainObject: () => Ps,
  filterPrimitives: () => Ns,
  filterString: () => te,
  filterStringArray: () => wu,
  filterStringOrStringArray: () => Hr,
  filterType: () => Fe,
  first: () => fu,
  folderExists: () => Rs,
  forEachLineWithContent: () => Ms,
  getTrailingOptions: () => ae,
  including: () => du,
  isUserFunction: () => cu,
  last: () => ut,
  objectToString: () => ir,
  orVoid: () => Xn,
  parseStringResponse: () => ue,
  pick: () => gu,
  prefixedArray: () => qt,
  remove: () => tn,
  splitOn: () => lu,
  toLinesWithContent: () => sr,
  trailingFunctionArgument: () => G,
  trailingOptionsArgument: () => Ws
});
var C = g({
  "src/lib/utils/index.ts"() {
    vu(), mm(), pm(), gm(), ym(), vm(), _m(), rn();
  }
}), bu = {};
Z(bu, {
  CheckRepoActions: () => rs,
  checkIsBareRepoTask: () => Eu,
  checkIsRepoRootTask: () => Su,
  checkIsRepoTask: () => km
});
function km(t) {
  switch (t) {
    case "bare":
      return Eu();
    case "root":
      return Su();
  }
  return {
    commands: ["rev-parse", "--is-inside-work-tree"],
    format: "utf-8",
    onError: nn,
    parser: $s
  };
}
function Su() {
  return {
    commands: ["rev-parse", "--git-dir"],
    format: "utf-8",
    onError: nn,
    parser(e) {
      return /^\.(git)?$/.test(e.trim());
    }
  };
}
function Eu() {
  return {
    commands: ["rev-parse", "--is-bare-repository"],
    format: "utf-8",
    onError: nn,
    parser: $s
  };
}
function Tm(t) {
  return /(Not a git repository|Kein Git-Repository)/i.test(String(t));
}
var rs, nn, $s, Ou = g({
  "src/lib/tasks/check-is-repo.ts"() {
    C(), rs = /* @__PURE__ */ ((t) => (t.BARE = "bare", t.IN_TREE = "tree", t.IS_REPO_ROOT = "root", t))(rs || {}), nn = ({ exitCode: t }, e, r, n) => {
      if (t === 128 && Tm(e))
        return r(Buffer.from("false"));
      n(e);
    }, $s = (t) => t.trim() === "true";
  }
});
function bm(t, e) {
  const r = new Du(t), n = t ? Iu : Cu;
  return sr(e).forEach((s) => {
    const i = s.replace(n, "");
    r.paths.push(i), (xu.test(i) ? r.folders : r.files).push(i);
  }), r;
}
var Du, Cu, Iu, xu, Sm = g({
  "src/lib/responses/CleanSummary.ts"() {
    C(), Du = class {
      constructor(t) {
        this.dryRun = t, this.paths = [], this.files = [], this.folders = [];
      }
    }, Cu = /^[a-z]+\s*/i, Iu = /^[a-z]+\s+[a-z]+\s*/i, xu = /\/$/;
  }
}), ns = {};
Z(ns, {
  EMPTY_COMMANDS: () => sn,
  adhocExecTask: () => Fu,
  configurationErrorTask: () => oe,
  isBufferTask: () => Ru,
  isEmptyTask: () => Nu,
  straightThroughBufferTask: () => Mu,
  straightThroughStringTask: () => ie
});
function Fu(t) {
  return {
    commands: sn,
    format: "empty",
    parser: t
  };
}
function oe(t) {
  return {
    commands: sn,
    format: "empty",
    parser() {
      throw typeof t == "string" ? new au(t) : t;
    }
  };
}
function ie(t, e = !1) {
  return {
    commands: t,
    format: "utf-8",
    parser(r) {
      return e ? String(r).trim() : r;
    }
  };
}
function Mu(t) {
  return {
    commands: t,
    format: "buffer",
    parser(e) {
      return e;
    }
  };
}
function Ru(t) {
  return t.format === "buffer";
}
function Nu(t) {
  return t.format === "empty" || !t.commands.length;
}
var sn, B = g({
  "src/lib/tasks/task.ts"() {
    ou(), sn = [];
  }
}), Pu = {};
Z(Pu, {
  CONFIG_ERROR_INTERACTIVE_MODE: () => Us,
  CONFIG_ERROR_MODE_REQUIRED: () => zs,
  CONFIG_ERROR_UNKNOWN_OPTION: () => Vs,
  CleanOptions: () => Cr,
  cleanTask: () => Au,
  cleanWithOptionsTask: () => Em,
  isCleanOptionsArray: () => Om
});
function Em(t, e) {
  const { cleanMode: r, options: n, valid: s } = Dm(t);
  return r ? s.options ? (n.push(...e), n.some(xm) ? oe(Us) : Au(r, n)) : oe(Vs + JSON.stringify(t)) : oe(zs);
}
function Au(t, e) {
  return {
    commands: ["clean", `-${t}`, ...e],
    format: "utf-8",
    parser(n) {
      return bm(t === "n", n);
    }
  };
}
function Om(t) {
  return Array.isArray(t) && t.every((e) => js.has(e));
}
function Dm(t) {
  let e, r = [], n = { cleanMode: !1, options: !0 };
  return t.replace(/[^a-z]i/g, "").split("").forEach((s) => {
    Cm(s) ? (e = s, n.cleanMode = !0) : n.options = n.options && Im(r[r.length] = `-${s}`);
  }), {
    cleanMode: e,
    options: r,
    valid: n
  };
}
function Cm(t) {
  return t === "f" || t === "n";
}
function Im(t) {
  return /^-[a-z]$/i.test(t) && js.has(t.charAt(1));
}
function xm(t) {
  return /^-[^\-]/.test(t) ? t.indexOf("i") > 0 : t === "--interactive";
}
var Us, zs, Vs, Cr, js, Lu = g({
  "src/lib/tasks/clean.ts"() {
    Sm(), C(), B(), Us = "Git clean interactive mode is not supported", zs = 'Git clean mode parameter ("n" or "f") is required', Vs = "Git clean unknown option found in: ", Cr = /* @__PURE__ */ ((t) => (t.DRY_RUN = "n", t.FORCE = "f", t.IGNORED_INCLUDED = "x", t.IGNORED_ONLY = "X", t.EXCLUDING = "e", t.QUIET = "q", t.RECURSIVE = "d", t))(Cr || {}), js = /* @__PURE__ */ new Set([
      "i",
      ...pu(Object.values(Cr))
    ]);
  }
});
function Fm(t) {
  const e = new $u();
  for (const r of Wu(t))
    e.addValue(r.file, String(r.key), r.value);
  return e;
}
function Mm(t, e) {
  let r = null;
  const n = [], s = /* @__PURE__ */ new Map();
  for (const i of Wu(t, e))
    i.key === e && (n.push(r = i.value), s.has(i.file) || s.set(i.file, []), s.get(i.file).push(r));
  return {
    key: e,
    paths: Array.from(s.keys()),
    scopes: s,
    value: r,
    values: n
  };
}
function Rm(t) {
  return t.replace(/^(file):/, "");
}
function* Wu(t, e = null) {
  const r = t.split("\0");
  for (let n = 0, s = r.length - 1; n < s; ) {
    const i = Rm(r[n++]);
    let a = r[n++], o = e;
    if (a.includes(`
`)) {
      const u = lu(a, `
`);
      o = u[0], a = u[1];
    }
    yield { file: i, key: o, value: a };
  }
}
var $u, Nm = g({
  "src/lib/responses/ConfigList.ts"() {
    C(), $u = class {
      constructor() {
        this.files = [], this.values = /* @__PURE__ */ Object.create(null);
      }
      get all() {
        return this._all || (this._all = this.files.reduce((t, e) => Object.assign(t, this.values[e]), {})), this._all;
      }
      addFile(t) {
        if (!(t in this.values)) {
          const e = ut(this.files);
          this.values[t] = e ? Object.create(this.values[e]) : {}, this.files.push(t);
        }
        return this.values[t];
      }
      addValue(t, e, r) {
        const n = this.addFile(t);
        n.hasOwnProperty(e) ? Array.isArray(n[e]) ? n[e].push(r) : n[e] = [n[e], r] : n[e] = r, this._all = void 0;
      }
    };
  }
});
function Fn(t, e) {
  return typeof t == "string" && ss.hasOwnProperty(t) ? t : e;
}
function Pm(t, e, r, n) {
  const s = ["config", `--${n}`];
  return r && s.push("--add"), s.push(t, e), {
    commands: s,
    format: "utf-8",
    parser(i) {
      return i;
    }
  };
}
function Am(t, e) {
  const r = ["config", "--null", "--show-origin", "--get-all", t];
  return e && r.splice(1, 0, `--${e}`), {
    commands: r,
    format: "utf-8",
    parser(n) {
      return Mm(n, t);
    }
  };
}
function Lm(t) {
  const e = ["config", "--list", "--show-origin", "--null"];
  return t && e.push(`--${t}`), {
    commands: e,
    format: "utf-8",
    parser(r) {
      return Fm(r);
    }
  };
}
function Wm() {
  return {
    addConfig(t, e, ...r) {
      return this._runTask(
        Pm(
          t,
          e,
          r[0] === !0,
          Fn(
            r[1],
            "local"
            /* local */
          )
        ),
        G(arguments)
      );
    },
    getConfig(t, e) {
      return this._runTask(
        Am(t, Fn(e, void 0)),
        G(arguments)
      );
    },
    listConfig(...t) {
      return this._runTask(
        Lm(Fn(t[0], void 0)),
        G(arguments)
      );
    }
  };
}
var ss, Uu = g({
  "src/lib/tasks/config.ts"() {
    Nm(), C(), ss = /* @__PURE__ */ ((t) => (t.system = "system", t.global = "global", t.local = "local", t.worktree = "worktree", t))(ss || {});
  }
});
function $m(t) {
  return zu.has(t);
}
var Mn, zu, Vu = g({
  "src/lib/tasks/diff-name-status.ts"() {
    Mn = /* @__PURE__ */ ((t) => (t.ADDED = "A", t.COPIED = "C", t.DELETED = "D", t.MODIFIED = "M", t.RENAMED = "R", t.CHANGED = "T", t.UNMERGED = "U", t.UNKNOWN = "X", t.BROKEN = "B", t))(Mn || {}), zu = new Set(Object.values(Mn));
  }
});
function Um(...t) {
  return new Hu().param(...t);
}
function zm(t) {
  const e = /* @__PURE__ */ new Set(), r = {};
  return Ms(t, (n) => {
    const [s, i, a] = n.split(bt);
    e.add(s), (r[s] = r[s] || []).push({
      line: U(i),
      path: s,
      preview: a
    });
  }), {
    paths: e,
    results: r
  };
}
function Vm() {
  return {
    grep(t) {
      const e = G(arguments), r = ae(arguments);
      for (const s of ju)
        if (r.includes(s))
          return this._runTask(
            oe(`git.grep: use of "${s}" is not supported.`),
            e
          );
      typeof t == "string" && (t = Um().param(t));
      const n = ["grep", "--null", "-n", "--full-name", ...r, ...t];
      return this._runTask(
        {
          commands: n,
          format: "utf-8",
          parser(s) {
            return zm(s);
          }
        },
        e
      );
    }
  };
}
var ju, Rt, Ki, Hu, qu = g({
  "src/lib/tasks/grep.ts"() {
    C(), B(), ju = ["-h"], Rt = Symbol("grepQuery"), Hu = class {
      constructor() {
        this[Ki] = [];
      }
      *[(Ki = Rt, Symbol.iterator)]() {
        for (const t of this[Rt])
          yield t;
      }
      and(...t) {
        return t.length && this[Rt].push("--and", "(", ...qt(t, "-e"), ")"), this;
      }
      param(...t) {
        return this[Rt].push(...qt(t, "-e")), this;
      }
    };
  }
}), Gu = {};
Z(Gu, {
  ResetMode: () => Ir,
  getResetMode: () => Hm,
  resetTask: () => jm
});
function jm(t, e) {
  const r = ["reset"];
  return Bu(t) && r.push(`--${t}`), r.push(...e), ie(r);
}
function Hm(t) {
  if (Bu(t))
    return t;
  switch (typeof t) {
    case "string":
    case "undefined":
      return "soft";
  }
}
function Bu(t) {
  return Zu.includes(t);
}
var Ir, Zu, Yu = g({
  "src/lib/tasks/reset.ts"() {
    B(), Ir = /* @__PURE__ */ ((t) => (t.MIXED = "mixed", t.SOFT = "soft", t.HARD = "hard", t.MERGE = "merge", t.KEEP = "keep", t))(Ir || {}), Zu = Array.from(Object.values(Ir));
  }
});
function qm() {
  return Qn("simple-git");
}
function Xi(t, e, r) {
  return !e || !String(e).replace(/\s*/, "") ? r ? (n, ...s) => {
    t(n, ...s), r(n, ...s);
  } : t : (n, ...s) => {
    t(`%s ${n}`, e, ...s), r && r(n, ...s);
  };
}
function Gm(t, e, { namespace: r }) {
  if (typeof t == "string")
    return t;
  const n = e && e.namespace || "";
  return n.startsWith(r) ? n.substr(r.length + 1) : n || r;
}
function Hs(t, e, r, n = qm()) {
  const s = t && `[${t}]` || "", i = [], a = typeof e == "string" ? n.extend(e) : e, o = Gm(Fe(e, te), a, n);
  return c(r);
  function u(l, f) {
    return N(
      i,
      Hs(t, o.replace(/^[^:]+/, l), f, n)
    );
  }
  function c(l) {
    const f = l && `[${l}]` || "", h = a && Xi(a, f) || lt, d = Xi(n, `${s} ${f}`, h);
    return Object.assign(a ? h : d, {
      label: t,
      sibling: u,
      info: d,
      step: c
    });
  }
}
var Ju = g({
  "src/lib/git-logger.ts"() {
    C(), Qn.formatters.L = (t) => String(As(t) ? t.length : "-"), Qn.formatters.B = (t) => Buffer.isBuffer(t) ? t.toString("utf8") : ir(t);
  }
}), wr, is, Bm = g({
  "src/lib/runners/tasks-pending-queue.ts"() {
    Je(), Ju(), wr = class {
      constructor(t = "GitExecutor") {
        this.logLabel = t, this._queue = /* @__PURE__ */ new Map();
      }
      withProgress(t) {
        return this._queue.get(t);
      }
      createProgress(t) {
        const e = wr.getName(t.commands[0]), r = Hs(this.logLabel, e);
        return {
          task: t,
          logger: r,
          name: e
        };
      }
      push(t) {
        const e = this.createProgress(t);
        return e.logger("Adding task to the queue, commands = %o", t.commands), this._queue.set(t, e), e;
      }
      fatal(t) {
        for (const [e, { logger: r }] of Array.from(this._queue.entries()))
          e === t.task ? (r.info("Failed %o", t), r(
            "Fatal exception, any as-yet un-started tasks run through this executor will not be attempted"
          )) : r.info(
            "A fatal exception occurred in a previous task, the queue has been purged: %o",
            t.message
          ), this.complete(e);
        if (this._queue.size !== 0)
          throw new Error(`Queue size should be zero after fatal: ${this._queue.size}`);
      }
      complete(t) {
        this.withProgress(t) && this._queue.delete(t);
      }
      attempt(t) {
        const e = this.withProgress(t);
        if (!e)
          throw new We(void 0, "TasksPendingQueue: attempt called for an unknown task");
        return e.logger("Starting task"), e;
      }
      static getName(t = "empty") {
        return `task:${t}:${++wr.counter}`;
      }
    }, is = wr, is.counter = 0;
  }
});
function tt(t, e) {
  return {
    method: fu(t.commands) || "",
    commands: e
  };
}
function Zm(t, e) {
  return (r) => {
    e("[ERROR] child process exception %o", r), t.push(Buffer.from(String(r.stack), "ascii"));
  };
}
function ea(t, e, r, n) {
  return (s) => {
    r("%s received %L bytes", e, s), n("%B", s), t.push(s);
  };
}
var as, Ym = g({
  "src/lib/runners/git-executor-chain.ts"() {
    Je(), B(), C(), Bm(), as = class {
      constructor(t, e, r) {
        this._executor = t, this._scheduler = e, this._plugins = r, this._chain = Promise.resolve(), this._queue = new is();
      }
      get cwd() {
        return this._cwd || this._executor.cwd;
      }
      set cwd(t) {
        this._cwd = t;
      }
      get env() {
        return this._executor.env;
      }
      get outputHandler() {
        return this._executor.outputHandler;
      }
      chain() {
        return this;
      }
      push(t) {
        return this._queue.push(t), this._chain = this._chain.then(() => this.attemptTask(t));
      }
      attemptTask(t) {
        return Lt(this, null, function* () {
          const e = yield this._scheduler.next(), r = () => this._queue.complete(t);
          try {
            const { logger: n } = this._queue.attempt(t);
            return yield Nu(t) ? this.attemptEmptyTask(t, n) : this.attemptRemoteTask(t, n);
          } catch (n) {
            throw this.onFatalException(t, n);
          } finally {
            r(), e();
          }
        });
      }
      onFatalException(t, e) {
        const r = e instanceof We ? Object.assign(e, { task: t }) : new We(t, e && String(e));
        return this._chain = Promise.resolve(), this._queue.fatal(r), r;
      }
      attemptRemoteTask(t, e) {
        return Lt(this, null, function* () {
          const r = this._plugins.exec("spawn.binary", "", tt(t, t.commands)), n = this._plugins.exec(
            "spawn.args",
            [...t.commands],
            tt(t, t.commands)
          ), s = yield this.gitResponse(
            t,
            r,
            n,
            this.outputHandler,
            e.step("SPAWN")
          ), i = yield this.handleTaskData(t, n, s, e.step("HANDLE"));
          return e("passing response to task's parser as a %s", t.format), Ru(t) ? ts(t.parser, i) : ts(t.parser, i.asStrings());
        });
      }
      attemptEmptyTask(t, e) {
        return Lt(this, null, function* () {
          return e("empty task bypassing child process to call to task's parser"), t.parser(this);
        });
      }
      handleTaskData(t, e, r, n) {
        const { exitCode: s, rejection: i, stdOut: a, stdErr: o } = r;
        return new Promise((u, c) => {
          n("Preparing to handle process response exitCode=%d stdOut=", s);
          const { error: l } = this._plugins.exec(
            "task.error",
            { error: i },
            ye(ye({}, tt(t, e)), r)
          );
          if (l && t.onError)
            return n.info("exitCode=%s handling with custom error handler"), t.onError(
              r,
              l,
              (f) => {
                n.info("custom error handler treated as success"), n("custom error returned a %s", ir(f)), u(
                  new Bt(
                    Array.isArray(f) ? Buffer.concat(f) : f,
                    Buffer.concat(o)
                  )
                );
              },
              c
            );
          if (l)
            return n.info(
              "handling as error: exitCode=%s stdErr=%s rejection=%o",
              s,
              o.length,
              i
            ), c(l);
          n.info("retrieving task output complete"), u(new Bt(Buffer.concat(a), Buffer.concat(o)));
        });
      }
      gitResponse(t, e, r, n, s) {
        return Lt(this, null, function* () {
          const i = s.sibling("output"), a = this._plugins.exec(
            "spawn.options",
            {
              cwd: this.cwd,
              env: this.env,
              windowsHide: !0
            },
            tt(t, t.commands)
          );
          return new Promise((o) => {
            const u = [], c = [];
            s.info("%s %o", e, r), s("%O", a);
            let l = this._beforeSpawn(t, r);
            if (l)
              return o({
                stdOut: u,
                stdErr: c,
                exitCode: 9901,
                rejection: l
              });
            this._plugins.exec("spawn.before", void 0, Ut(ye({}, tt(t, r)), {
              kill(h) {
                l = h || l;
              }
            }));
            const f = Vl(e, r, a);
            f.stdout.on(
              "data",
              ea(u, "stdOut", s, i.step("stdOut"))
            ), f.stderr.on(
              "data",
              ea(c, "stdErr", s, i.step("stdErr"))
            ), f.on("error", Zm(c, s)), n && (s("Passing child process stdOut/stdErr to custom outputHandler"), n(e, f.stdout, f.stderr, [...r])), this._plugins.exec("spawn.after", void 0, Ut(ye({}, tt(t, r)), {
              spawned: f,
              close(h, d) {
                o({
                  stdOut: u,
                  stdErr: c,
                  exitCode: h,
                  rejection: l || d
                });
              },
              kill(h) {
                f.killed || (l = h, f.kill("SIGINT"));
              }
            }));
          });
        });
      }
      _beforeSpawn(t, e) {
        let r;
        return this._plugins.exec("spawn.before", void 0, Ut(ye({}, tt(t, e)), {
          kill(n) {
            r = n || r;
          }
        })), r;
      }
    };
  }
}), Qu = {};
Z(Qu, {
  GitExecutor: () => Ku
});
var Ku, Jm = g({
  "src/lib/runners/git-executor.ts"() {
    Ym(), Ku = class {
      constructor(t, e, r) {
        this.cwd = t, this._scheduler = e, this._plugins = r, this._chain = new as(this, this._scheduler, this._plugins);
      }
      chain() {
        return new as(this, this._scheduler, this._plugins);
      }
      push(t) {
        return this._chain.push(t);
      }
    };
  }
});
function Qm(t, e, r = lt) {
  const n = (i) => {
    r(null, i);
  }, s = (i) => {
    (i == null ? void 0 : i.task) === t && r(
      i instanceof nr ? Km(i) : i,
      void 0
    );
  };
  e.then(n, s);
}
function Km(t) {
  let e = (n) => {
    console.warn(
      `simple-git deprecation notice: accessing GitResponseError.${n} should be GitResponseError.git.${n}, this will no longer be available in version 3`
    ), e = lt;
  };
  return Object.create(t, Object.getOwnPropertyNames(t.git).reduce(r, {}));
  function r(n, s) {
    return s in t || (n[s] = {
      enumerable: !1,
      configurable: !1,
      get() {
        return e(s), t.git[s];
      }
    }), n;
  }
}
var Xm = g({
  "src/lib/task-callback.ts"() {
    xt(), C();
  }
});
function ta(t, e) {
  return Fu((r) => {
    if (!Rs(t))
      throw new Error(`Git.cwd: cannot change to non-directory "${t}"`);
    return (e || r).cwd = t;
  });
}
var ep = g({
  "src/lib/tasks/change-working-directory.ts"() {
    C(), B();
  }
});
function Rn(t) {
  const e = ["checkout", ...t];
  return e[1] === "-b" && e.includes("-B") && (e[1] = tn(e, "-B")), ie(e);
}
function tp() {
  return {
    checkout() {
      return this._runTask(
        Rn(ae(arguments, 1)),
        G(arguments)
      );
    },
    checkoutBranch(t, e) {
      return this._runTask(
        Rn(["-b", t, e, ...ae(arguments)]),
        G(arguments)
      );
    },
    checkoutLocalBranch(t) {
      return this._runTask(
        Rn(["-b", t, ...ae(arguments)]),
        G(arguments)
      );
    }
  };
}
var rp = g({
  "src/lib/tasks/checkout.ts"() {
    C(), B();
  }
});
function np() {
  return {
    count: 0,
    garbage: 0,
    inPack: 0,
    packs: 0,
    prunePackable: 0,
    size: 0,
    sizeGarbage: 0,
    sizePack: 0
  };
}
function sp() {
  return {
    countObjects() {
      return this._runTask({
        commands: ["count-objects", "--verbose"],
        format: "utf-8",
        parser(t) {
          return ue(np(), [Xu], t);
        }
      });
    }
  };
}
var Xu, ip = g({
  "src/lib/tasks/count-objects.ts"() {
    C(), Xu = new x(
      /([a-z-]+): (\d+)$/,
      (t, [e, r]) => {
        const n = mu(e);
        t.hasOwnProperty(n) && (t[n] = U(r));
      }
    );
  }
});
function ap(t) {
  return ue({
    author: null,
    branch: "",
    commit: "",
    root: !1,
    summary: {
      changes: 0,
      insertions: 0,
      deletions: 0
    }
  }, ec, t);
}
var ec, op = g({
  "src/lib/parsers/parse-commit.ts"() {
    C(), ec = [
      new x(/^\[([^\s]+)( \([^)]+\))? ([^\]]+)/, (t, [e, r, n]) => {
        t.branch = e, t.commit = n, t.root = !!r;
      }),
      new x(/\s*Author:\s(.+)/i, (t, [e]) => {
        const r = e.split("<"), n = r.pop();
        !n || !n.includes("@") || (t.author = {
          email: n.substr(0, n.length - 1),
          name: r.join("<").trim()
        });
      }),
      new x(
        /(\d+)[^,]*(?:,\s*(\d+)[^,]*)(?:,\s*(\d+))/g,
        (t, [e, r, n]) => {
          t.summary.changes = parseInt(e, 10) || 0, t.summary.insertions = parseInt(r, 10) || 0, t.summary.deletions = parseInt(n, 10) || 0;
        }
      ),
      new x(
        /^(\d+)[^,]*(?:,\s*(\d+)[^(]+\(([+-]))?/,
        (t, [e, r, n]) => {
          t.summary.changes = parseInt(e, 10) || 0;
          const s = parseInt(r, 10) || 0;
          n === "-" ? t.summary.deletions = s : n === "+" && (t.summary.insertions = s);
        }
      )
    ];
  }
});
function up(t, e, r) {
  return {
    commands: [
      "-c",
      "core.abbrev=40",
      "commit",
      ...qt(t, "-m"),
      ...e,
      ...r
    ],
    format: "utf-8",
    parser: ap
  };
}
function cp() {
  return {
    commit(e, ...r) {
      const n = G(arguments), s = t(e) || up(
        xe(e),
        xe(Fe(r[0], Hr, [])),
        [...Fe(r[1], ar, []), ...ae(arguments, 0, !0)]
      );
      return this._runTask(s, n);
    }
  };
  function t(e) {
    return !Hr(e) && oe(
      "git.commit: requires the commit message to be supplied as a string/string[]"
    );
  }
}
var lp = g({
  "src/lib/tasks/commit.ts"() {
    op(), C(), B();
  }
});
function fp() {
  return {
    firstCommit() {
      return this._runTask(
        ie(["rev-list", "--max-parents=0", "HEAD"], !0),
        G(arguments)
      );
    }
  };
}
var hp = g({
  "src/lib/tasks/first-commit.ts"() {
    C(), B();
  }
});
function dp(t, e) {
  const r = ["hash-object", t];
  return e && r.push("-w"), ie(r, !0);
}
var mp = g({
  "src/lib/tasks/hash-object.ts"() {
    B();
  }
});
function pp(t, e, r) {
  const n = String(r).trim();
  let s;
  if (s = tc.exec(n))
    return new xr(t, e, !1, s[1]);
  if (s = rc.exec(n))
    return new xr(t, e, !0, s[1]);
  let i = "";
  const a = n.split(" ");
  for (; a.length; )
    if (a.shift() === "in") {
      i = a.join(" ");
      break;
    }
  return new xr(t, e, /^re/i.test(n), i);
}
var xr, tc, rc, gp = g({
  "src/lib/responses/InitSummary.ts"() {
    xr = class {
      constructor(t, e, r, n) {
        this.bare = t, this.path = e, this.existing = r, this.gitDir = n;
      }
    }, tc = /^Init.+ repository in (.+)$/, rc = /^Rein.+ in (.+)$/;
  }
});
function yp(t) {
  return t.includes(qs);
}
function wp(t = !1, e, r) {
  const n = ["init", ...r];
  return t && !yp(n) && n.splice(1, 0, qs), {
    commands: n,
    format: "utf-8",
    parser(s) {
      return pp(n.includes("--bare"), e, s);
    }
  };
}
var qs, vp = g({
  "src/lib/tasks/init.ts"() {
    gp(), qs = "--bare";
  }
});
function Gs(t) {
  for (let e = 0; e < t.length; e++) {
    const r = Bs.exec(t[e]);
    if (r)
      return `--${r[1]}`;
  }
  return "";
}
function _p(t) {
  return Bs.test(t);
}
var Bs, or = g({
  "src/lib/args/log-format.ts"() {
    Bs = /^--(stat|numstat|name-only|name-status)(=|$)/;
  }
}), nc, kp = g({
  "src/lib/responses/DiffSummary.ts"() {
    nc = class {
      constructor() {
        this.changed = 0, this.deletions = 0, this.insertions = 0, this.files = [];
      }
    };
  }
});
function sc(t = "") {
  const e = ic[t];
  return (r) => ue(new nc(), e, r, !1);
}
var Nn, ra, na, sa, ic, ac = g({
  "src/lib/parsers/parse-diff-summary.ts"() {
    or(), kp(), Vu(), C(), Nn = [
      new x(
        /^(.+)\s+\|\s+(\d+)(\s+[+\-]+)?$/,
        (t, [e, r, n = ""]) => {
          t.files.push({
            file: e.trim(),
            changes: U(r),
            insertions: n.replace(/[^+]/g, "").length,
            deletions: n.replace(/[^-]/g, "").length,
            binary: !1
          });
        }
      ),
      new x(
        /^(.+) \|\s+Bin ([0-9.]+) -> ([0-9.]+) ([a-z]+)/,
        (t, [e, r, n]) => {
          t.files.push({
            file: e.trim(),
            before: U(r),
            after: U(n),
            binary: !0
          });
        }
      ),
      new x(
        /(\d+) files? changed\s*((?:, \d+ [^,]+){0,2})/,
        (t, [e, r]) => {
          const n = /(\d+) i/.exec(r), s = /(\d+) d/.exec(r);
          t.changed = U(e), t.insertions = U(n == null ? void 0 : n[1]), t.deletions = U(s == null ? void 0 : s[1]);
        }
      )
    ], ra = [
      new x(
        /(\d+)\t(\d+)\t(.+)$/,
        (t, [e, r, n]) => {
          const s = U(e), i = U(r);
          t.changed++, t.insertions += s, t.deletions += i, t.files.push({
            file: n,
            changes: s + i,
            insertions: s,
            deletions: i,
            binary: !1
          });
        }
      ),
      new x(/-\t-\t(.+)$/, (t, [e]) => {
        t.changed++, t.files.push({
          file: e,
          after: 0,
          before: 0,
          binary: !0
        });
      })
    ], na = [
      new x(/(.+)$/, (t, [e]) => {
        t.changed++, t.files.push({
          file: e,
          changes: 0,
          insertions: 0,
          deletions: 0,
          binary: !1
        });
      })
    ], sa = [
      new x(
        /([ACDMRTUXB])([0-9]{0,3})\t(.[^\t]*)(\t(.[^\t]*))?$/,
        (t, [e, r, n, s, i]) => {
          t.changed++, t.files.push({
            file: i ?? n,
            changes: 0,
            insertions: 0,
            deletions: 0,
            binary: !1,
            status: Xn($m(e) && e),
            from: Xn(!!i && n !== i && n),
            similarity: U(r)
          });
        }
      )
    ], ic = {
      "": Nn,
      "--stat": Nn,
      "--numstat": ra,
      "--name-status": sa,
      "--name-only": na
    };
  }
});
function Tp(t, e) {
  return e.reduce(
    (r, n, s) => (r[n] = t[s] || "", r),
    /* @__PURE__ */ Object.create({ diff: null })
  );
}
function oc(t = Js, e = uc, r = "") {
  const n = sc(r);
  return function(s) {
    const i = sr(
      s.trim(),
      !1,
      Zs
    ).map(function(a) {
      const o = a.split(Ys), u = Tp(o[0].split(t), e);
      return o.length > 1 && o[1].trim() && (u.diff = n(o[1])), u;
    });
    return {
      all: i,
      latest: i.length && i[0] || null,
      total: i.length
    };
  };
}
var Zs, Ys, Js, uc, cc = g({
  "src/lib/parsers/parse-list-log-summary.ts"() {
    C(), ac(), or(), Zs = "òòòòòò ", Ys = " òò", Js = " ò ", uc = ["hash", "date", "message", "refs", "author_name", "author_email"];
  }
}), lc = {};
Z(lc, {
  diffSummaryTask: () => bp,
  validateLogFormatConfig: () => an
});
function bp(t) {
  let e = Gs(t);
  const r = ["diff"];
  return e === "" && (e = "--stat", r.push("--stat=4096")), r.push(...t), an(r) || {
    commands: r,
    format: "utf-8",
    parser: sc(e)
  };
}
function an(t) {
  const e = t.filter(_p);
  if (e.length > 1)
    return oe(
      `Summary flags are mutually exclusive - pick one of ${e.join(",")}`
    );
  if (e.length && t.includes("-z"))
    return oe(
      `Summary flag ${e} parsing is not compatible with null termination option '-z'`
    );
}
var Qs = g({
  "src/lib/tasks/diff.ts"() {
    or(), ac(), B();
  }
});
function Sp(t, e) {
  const r = [], n = [];
  return Object.keys(t).forEach((s) => {
    r.push(s), n.push(String(t[s]));
  }), [r, n.join(e)];
}
function Ep(t) {
  return Object.keys(t).reduce((e, r) => (r in os || (e[r] = t[r]), e), {});
}
function fc(t = {}, e = []) {
  const r = Fe(t.splitter, te, Js), n = !Ns(t.format) && t.format ? t.format : {
    hash: "%H",
    date: t.strictDate === !1 ? "%ai" : "%aI",
    message: "%s",
    refs: "%D",
    body: t.multiLine ? "%B" : "%b",
    author_name: t.mailMap !== !1 ? "%aN" : "%an",
    author_email: t.mailMap !== !1 ? "%aE" : "%ae"
  }, [s, i] = Sp(n, r), a = [], o = [
    `--pretty=format:${Zs}${i}${Ys}`,
    ...e
  ], u = t.n || t["max-count"] || t.maxCount;
  if (u && o.push(`--max-count=${u}`), t.from || t.to) {
    const c = t.symmetric !== !1 ? "..." : "..";
    a.push(`${t.from || ""}${c}${t.to || ""}`);
  }
  return te(t.file) && o.push("--follow", dm(t.file)), Ls(Ep(t), o), {
    fields: s,
    splitter: r,
    commands: [...o, ...a]
  };
}
function Op(t, e, r) {
  const n = oc(t, e, Gs(r));
  return {
    commands: ["log", ...r],
    format: "utf-8",
    parser: n
  };
}
function Dp() {
  return {
    log(...r) {
      const n = G(arguments), s = fc(
        Ws(arguments),
        Fe(arguments[0], ar)
      ), i = e(...r) || an(s.commands) || t(s);
      return this._runTask(i, n);
    }
  };
  function t(r) {
    return Op(r.splitter, r.fields, r.commands);
  }
  function e(r, n) {
    return te(r) && te(n) && oe(
      "git.log(string, string) should be replaced with git.log({ from: string, to: string })"
    );
  }
}
var os, hc = g({
  "src/lib/tasks/log.ts"() {
    or(), rr(), cc(), C(), B(), Qs(), os = /* @__PURE__ */ ((t) => (t[t["--pretty"] = 0] = "--pretty", t[t["max-count"] = 1] = "max-count", t[t.maxCount = 2] = "maxCount", t[t.n = 3] = "n", t[t.file = 4] = "file", t[t.format = 5] = "format", t[t.from = 6] = "from", t[t.to = 7] = "to", t[t.splitter = 8] = "splitter", t[t.symmetric = 9] = "symmetric", t[t.mailMap = 10] = "mailMap", t[t.multiLine = 11] = "multiLine", t[t.strictDate = 12] = "strictDate", t))(os || {});
  }
}), Fr, dc, Cp = g({
  "src/lib/responses/MergeSummary.ts"() {
    Fr = class {
      constructor(t, e = null, r) {
        this.reason = t, this.file = e, this.meta = r;
      }
      toString() {
        return `${this.file}:${this.reason}`;
      }
    }, dc = class {
      constructor() {
        this.conflicts = [], this.merges = [], this.result = "success";
      }
      get failed() {
        return this.conflicts.length > 0;
      }
      get reason() {
        return this.result;
      }
      toString() {
        return this.conflicts.length ? `CONFLICTS: ${this.conflicts.join(", ")}` : "OK";
      }
    };
  }
}), us, mc, Ip = g({
  "src/lib/responses/PullSummary.ts"() {
    us = class {
      constructor() {
        this.remoteMessages = {
          all: []
        }, this.created = [], this.deleted = [], this.files = [], this.deletions = {}, this.insertions = {}, this.summary = {
          changes: 0,
          deletions: 0,
          insertions: 0
        };
      }
    }, mc = class {
      constructor() {
        this.remote = "", this.hash = {
          local: "",
          remote: ""
        }, this.branch = {
          local: "",
          remote: ""
        }, this.message = "";
      }
      toString() {
        return this.message;
      }
    };
  }
});
function Pn(t) {
  return t.objects = t.objects || {
    compressing: 0,
    counting: 0,
    enumerating: 0,
    packReused: 0,
    reused: { count: 0, delta: 0 },
    total: { count: 0, delta: 0 }
  };
}
function ia(t) {
  const e = /^\s*(\d+)/.exec(t), r = /delta (\d+)/i.exec(t);
  return {
    count: U(e && e[1] || "0"),
    delta: U(r && r[1] || "0")
  };
}
var pc, xp = g({
  "src/lib/parsers/parse-remote-objects.ts"() {
    C(), pc = [
      new Ze(
        /^remote:\s*(enumerating|counting|compressing) objects: (\d+),/i,
        (t, [e, r]) => {
          const n = e.toLowerCase(), s = Pn(t.remoteMessages);
          Object.assign(s, { [n]: U(r) });
        }
      ),
      new Ze(
        /^remote:\s*(enumerating|counting|compressing) objects: \d+% \(\d+\/(\d+)\),/i,
        (t, [e, r]) => {
          const n = e.toLowerCase(), s = Pn(t.remoteMessages);
          Object.assign(s, { [n]: U(r) });
        }
      ),
      new Ze(
        /total ([^,]+), reused ([^,]+), pack-reused (\d+)/i,
        (t, [e, r, n]) => {
          const s = Pn(t.remoteMessages);
          s.total = ia(e), s.reused = ia(r), s.packReused = U(n);
        }
      )
    ];
  }
});
function gc(t, e) {
  return ue({ remoteMessages: new wc() }, yc, e);
}
var yc, wc, vc = g({
  "src/lib/parsers/parse-remote-messages.ts"() {
    C(), xp(), yc = [
      new Ze(/^remote:\s*(.+)$/, (t, [e]) => (t.remoteMessages.all.push(e.trim()), !1)),
      ...pc,
      new Ze(
        [/create a (?:pull|merge) request/i, /\s(https?:\/\/\S+)$/],
        (t, [e]) => {
          t.remoteMessages.pullRequestUrl = e;
        }
      ),
      new Ze(
        [/found (\d+) vulnerabilities.+\(([^)]+)\)/i, /\s(https?:\/\/\S+)$/],
        (t, [e, r, n]) => {
          t.remoteMessages.vulnerabilities = {
            count: U(e),
            summary: r,
            url: n
          };
        }
      )
    ], wc = class {
      constructor() {
        this.all = [];
      }
    };
  }
});
function Fp(t, e) {
  const r = ue(new mc(), _c, [t, e]);
  return r.message && r;
}
var aa, oa, ua, ca, _c, la, Ks, kc = g({
  "src/lib/parsers/parse-pull.ts"() {
    Ip(), C(), vc(), aa = /^\s*(.+?)\s+\|\s+\d+\s*(\+*)(-*)/, oa = /(\d+)\D+((\d+)\D+\(\+\))?(\D+(\d+)\D+\(-\))?/, ua = /^(create|delete) mode \d+ (.+)/, ca = [
      new x(aa, (t, [e, r, n]) => {
        t.files.push(e), r && (t.insertions[e] = r.length), n && (t.deletions[e] = n.length);
      }),
      new x(oa, (t, [e, , r, , n]) => r !== void 0 || n !== void 0 ? (t.summary.changes = +e || 0, t.summary.insertions = +r || 0, t.summary.deletions = +n || 0, !0) : !1),
      new x(ua, (t, [e, r]) => {
        N(t.files, r), N(e === "create" ? t.created : t.deleted, r);
      })
    ], _c = [
      new x(/^from\s(.+)$/i, (t, [e]) => void (t.remote = e)),
      new x(/^fatal:\s(.+)$/, (t, [e]) => void (t.message = e)),
      new x(
        /([a-z0-9]+)\.\.([a-z0-9]+)\s+(\S+)\s+->\s+(\S+)$/,
        (t, [e, r, n, s]) => {
          t.branch.local = n, t.hash.local = e, t.branch.remote = s, t.hash.remote = r;
        }
      )
    ], la = (t, e) => ue(new us(), ca, [t, e]), Ks = (t, e) => Object.assign(
      new us(),
      la(t, e),
      gc(t, e)
    );
  }
}), fa, Tc, ha, Mp = g({
  "src/lib/parsers/parse-merge.ts"() {
    Cp(), C(), kc(), fa = [
      new x(/^Auto-merging\s+(.+)$/, (t, [e]) => {
        t.merges.push(e);
      }),
      new x(/^CONFLICT\s+\((.+)\): Merge conflict in (.+)$/, (t, [e, r]) => {
        t.conflicts.push(new Fr(e, r));
      }),
      new x(
        /^CONFLICT\s+\((.+\/delete)\): (.+) deleted in (.+) and/,
        (t, [e, r, n]) => {
          t.conflicts.push(new Fr(e, r, { deleteRef: n }));
        }
      ),
      new x(/^CONFLICT\s+\((.+)\):/, (t, [e]) => {
        t.conflicts.push(new Fr(e, null));
      }),
      new x(/^Automatic merge failed;\s+(.+)$/, (t, [e]) => {
        t.result = e;
      })
    ], Tc = (t, e) => Object.assign(ha(t, e), Ks(t, e)), ha = (t) => ue(new dc(), fa, t);
  }
});
function da(t) {
  return t.length ? {
    commands: ["merge", ...t],
    format: "utf-8",
    parser(e, r) {
      const n = Tc(e, r);
      if (n.failed)
        throw new nr(n);
      return n;
    }
  } : oe("Git.merge requires at least one option");
}
var Rp = g({
  "src/lib/tasks/merge.ts"() {
    xt(), Mp(), B();
  }
});
function Np(t, e, r) {
  const n = r.includes("deleted"), s = r.includes("tag") || /^refs\/tags/.test(t), i = !r.includes("new");
  return {
    deleted: n,
    tag: s,
    branch: !s,
    new: !i,
    alreadyUpdated: i,
    local: t,
    remote: e
  };
}
var ma, bc, pa, Pp = g({
  "src/lib/parsers/parse-push.ts"() {
    C(), vc(), ma = [
      new x(/^Pushing to (.+)$/, (t, [e]) => {
        t.repo = e;
      }),
      new x(/^updating local tracking ref '(.+)'/, (t, [e]) => {
        t.ref = Ut(ye({}, t.ref || {}), {
          local: e
        });
      }),
      new x(/^[=*-]\s+([^:]+):(\S+)\s+\[(.+)]$/, (t, [e, r, n]) => {
        t.pushed.push(Np(e, r, n));
      }),
      new x(
        /^Branch '([^']+)' set up to track remote branch '([^']+)' from '([^']+)'/,
        (t, [e, r, n]) => {
          t.branch = Ut(ye({}, t.branch || {}), {
            local: e,
            remote: r,
            remoteName: n
          });
        }
      ),
      new x(
        /^([^:]+):(\S+)\s+([a-z0-9]+)\.\.([a-z0-9]+)$/,
        (t, [e, r, n, s]) => {
          t.update = {
            head: {
              local: e,
              remote: r
            },
            hash: {
              from: n,
              to: s
            }
          };
        }
      )
    ], bc = (t, e) => {
      const r = pa(t, e), n = gc(t, e);
      return ye(ye({}, r), n);
    }, pa = (t, e) => ue({ pushed: [] }, ma, [t, e]);
  }
}), Sc = {};
Z(Sc, {
  pushTagsTask: () => Ap,
  pushTask: () => Xs
});
function Ap(t = {}, e) {
  return N(e, "--tags"), Xs(t, e);
}
function Xs(t = {}, e) {
  const r = ["push", ...e];
  return t.branch && r.splice(1, 0, t.branch), t.remote && r.splice(1, 0, t.remote), tn(r, "-v"), N(r, "--verbose"), N(r, "--porcelain"), {
    commands: r,
    format: "utf-8",
    parser: bc
  };
}
var Ec = g({
  "src/lib/tasks/push.ts"() {
    Pp(), C();
  }
});
function Lp() {
  return {
    showBuffer() {
      const t = ["show", ...ae(arguments, 1)];
      return t.includes("--binary") || t.splice(1, 0, "--binary"), this._runTask(
        Mu(t),
        G(arguments)
      );
    },
    show() {
      const t = ["show", ...ae(arguments, 1)];
      return this._runTask(
        ie(t),
        G(arguments)
      );
    }
  };
}
var Wp = g({
  "src/lib/tasks/show.ts"() {
    C(), B();
  }
}), ga, Oc, $p = g({
  "src/lib/responses/FileStatusSummary.ts"() {
    ga = /^(.+)\0(.+)$/, Oc = class {
      constructor(t, e, r) {
        if (this.path = t, this.index = e, this.working_dir = r, e === "R" || r === "R") {
          const n = ga.exec(t) || [null, t, t];
          this.from = n[2] || "", this.path = n[1] || "";
        }
      }
    };
  }
});
function ya(t) {
  const [e, r] = t.split(bt);
  return {
    from: r || e,
    to: e
  };
}
function le(t, e, r) {
  return [`${t}${e}`, r];
}
function An(t, ...e) {
  return e.map((r) => le(t, r, (n, s) => N(n.conflicted, s)));
}
function Up(t, e) {
  const r = e.trim();
  switch (" ") {
    case r.charAt(2):
      return n(r.charAt(0), r.charAt(1), r.substr(3));
    case r.charAt(1):
      return n(" ", r.charAt(0), r.substr(2));
    default:
      return;
  }
  function n(s, i, a) {
    const o = `${s}${i}`, u = Dc.get(o);
    u && u(t, a), o !== "##" && o !== "!!" && t.files.push(new Oc(a, s, i));
  }
}
var wa, Dc, Cc, zp = g({
  "src/lib/responses/StatusSummary.ts"() {
    C(), $p(), wa = class {
      constructor() {
        this.not_added = [], this.conflicted = [], this.created = [], this.deleted = [], this.ignored = void 0, this.modified = [], this.renamed = [], this.files = [], this.staged = [], this.ahead = 0, this.behind = 0, this.current = null, this.tracking = null, this.detached = !1, this.isClean = () => !this.files.length;
      }
    }, Dc = new Map([
      le(
        " ",
        "A",
        (t, e) => N(t.created, e)
      ),
      le(
        " ",
        "D",
        (t, e) => N(t.deleted, e)
      ),
      le(
        " ",
        "M",
        (t, e) => N(t.modified, e)
      ),
      le(
        "A",
        " ",
        (t, e) => N(t.created, e) && N(t.staged, e)
      ),
      le(
        "A",
        "M",
        (t, e) => N(t.created, e) && N(t.staged, e) && N(t.modified, e)
      ),
      le(
        "D",
        " ",
        (t, e) => N(t.deleted, e) && N(t.staged, e)
      ),
      le(
        "M",
        " ",
        (t, e) => N(t.modified, e) && N(t.staged, e)
      ),
      le(
        "M",
        "M",
        (t, e) => N(t.modified, e) && N(t.staged, e)
      ),
      le("R", " ", (t, e) => {
        N(t.renamed, ya(e));
      }),
      le("R", "M", (t, e) => {
        const r = ya(e);
        N(t.renamed, r), N(t.modified, r.to);
      }),
      le("!", "!", (t, e) => {
        N(t.ignored = t.ignored || [], e);
      }),
      le(
        "?",
        "?",
        (t, e) => N(t.not_added, e)
      ),
      ...An(
        "A",
        "A",
        "U"
        /* UNMERGED */
      ),
      ...An(
        "D",
        "D",
        "U"
        /* UNMERGED */
      ),
      ...An(
        "U",
        "A",
        "D",
        "U"
        /* UNMERGED */
      ),
      [
        "##",
        (t, e) => {
          const r = /ahead (\d+)/, n = /behind (\d+)/, s = /^(.+?(?=(?:\.{3}|\s|$)))/, i = /\.{3}(\S*)/, a = /\son\s([\S]+)$/;
          let o;
          o = r.exec(e), t.ahead = o && +o[1] || 0, o = n.exec(e), t.behind = o && +o[1] || 0, o = s.exec(e), t.current = o && o[1], o = i.exec(e), t.tracking = o && o[1], o = a.exec(e), t.current = o && o[1] || t.current, t.detached = /\(no branch\)/.test(e);
        }
      ]
    ]), Cc = function(t) {
      const e = t.split(bt), r = new wa();
      for (let n = 0, s = e.length; n < s; ) {
        let i = e[n++].trim();
        i && (i.charAt(0) === "R" && (i += bt + (e[n++] || "")), Up(r, i));
      }
      return r;
    };
  }
});
function Vp(t) {
  return {
    format: "utf-8",
    commands: [
      "status",
      "--porcelain",
      "-b",
      "-u",
      "--null",
      ...t.filter((r) => !Ic.includes(r))
    ],
    parser(r) {
      return Cc(r);
    }
  };
}
var Ic, jp = g({
  "src/lib/tasks/status.ts"() {
    zp(), Ic = ["--null", "-z"];
  }
});
function qr(t = 0, e = 0, r = 0, n = "", s = !0) {
  return Object.defineProperty(
    {
      major: t,
      minor: e,
      patch: r,
      agent: n,
      installed: s
    },
    "toString",
    {
      value() {
        return `${this.major}.${this.minor}.${this.patch}`;
      },
      configurable: !1,
      enumerable: !1
    }
  );
}
function Hp() {
  return qr(0, 0, 0, "", !1);
}
function qp() {
  return {
    version() {
      return this._runTask({
        commands: ["--version"],
        format: "utf-8",
        parser: Gp,
        onError(t, e, r, n) {
          if (t.exitCode === -2)
            return r(Buffer.from(ei));
          n(e);
        }
      });
    }
  };
}
function Gp(t) {
  return t === ei ? Hp() : ue(qr(0, 0, 0, t), xc, t);
}
var ei, xc, Bp = g({
  "src/lib/tasks/version.ts"() {
    C(), ei = "installed=false", xc = [
      new x(
        /version (\d+)\.(\d+)\.(\d+)(?:\s*\((.+)\))?/,
        (t, [e, r, n, s = ""]) => {
          Object.assign(
            t,
            qr(U(e), U(r), U(n), s)
          );
        }
      ),
      new x(
        /version (\d+)\.(\d+)\.(\D+)(.+)?$/,
        (t, [e, r, n, s = ""]) => {
          Object.assign(t, qr(U(e), U(r), n, s));
        }
      )
    ];
  }
}), Fc = {};
Z(Fc, {
  SimpleGitApi: () => cs
});
var cs, Zp = g({
  "src/lib/simple-git-api.ts"() {
    Xm(), ep(), rp(), ip(), lp(), Uu(), hp(), qu(), mp(), vp(), hc(), Rp(), Ec(), Wp(), jp(), B(), Bp(), C(), cs = class {
      constructor(t) {
        this._executor = t;
      }
      _runTask(t, e) {
        const r = this._executor.chain(), n = r.push(t);
        return e && Qm(t, n, e), Object.create(this, {
          then: { value: n.then.bind(n) },
          catch: { value: n.catch.bind(n) },
          _executor: { value: r }
        });
      }
      add(t) {
        return this._runTask(
          ie(["add", ...xe(t)]),
          G(arguments)
        );
      }
      cwd(t) {
        const e = G(arguments);
        return typeof t == "string" ? this._runTask(ta(t, this._executor), e) : typeof (t == null ? void 0 : t.path) == "string" ? this._runTask(
          ta(
            t.path,
            t.root && this._executor || void 0
          ),
          e
        ) : this._runTask(
          oe("Git.cwd: workingDirectory must be supplied as a string"),
          e
        );
      }
      hashObject(t, e) {
        return this._runTask(
          dp(t, e === !0),
          G(arguments)
        );
      }
      init(t) {
        return this._runTask(
          wp(t === !0, this._executor.cwd, ae(arguments)),
          G(arguments)
        );
      }
      merge() {
        return this._runTask(
          da(ae(arguments)),
          G(arguments)
        );
      }
      mergeFromTo(t, e) {
        return te(t) && te(e) ? this._runTask(
          da([t, e, ...ae(arguments)]),
          G(arguments, !1)
        ) : this._runTask(
          oe(
            "Git.mergeFromTo requires that the 'remote' and 'branch' arguments are supplied as strings"
          )
        );
      }
      outputHandler(t) {
        return this._executor.outputHandler = t, this;
      }
      push() {
        const t = Xs(
          {
            remote: Fe(arguments[0], te),
            branch: Fe(arguments[1], te)
          },
          ae(arguments)
        );
        return this._runTask(t, G(arguments));
      }
      stash() {
        return this._runTask(
          ie(["stash", ...ae(arguments)]),
          G(arguments)
        );
      }
      status() {
        return this._runTask(
          Vp(ae(arguments)),
          G(arguments)
        );
      }
    }, Object.assign(
      cs.prototype,
      tp(),
      cp(),
      Wm(),
      sp(),
      fp(),
      Vm(),
      Dp(),
      Lp(),
      qp()
    );
  }
}), Mc = {};
Z(Mc, {
  Scheduler: () => Rc
});
var va, Rc, Yp = g({
  "src/lib/runners/scheduler.ts"() {
    C(), Ju(), va = /* @__PURE__ */ (() => {
      let t = 0;
      return () => {
        t++;
        const { promise: e, done: r } = su();
        return {
          promise: e,
          done: r,
          id: t
        };
      };
    })(), Rc = class {
      constructor(t = 2) {
        this.concurrency = t, this.logger = Hs("", "scheduler"), this.pending = [], this.running = [], this.logger("Constructed, concurrency=%s", t);
      }
      schedule() {
        if (!this.pending.length || this.running.length >= this.concurrency) {
          this.logger(
            "Schedule attempt ignored, pending=%s running=%s concurrency=%s",
            this.pending.length,
            this.running.length,
            this.concurrency
          );
          return;
        }
        const t = N(this.running, this.pending.shift());
        this.logger("Attempting id=%s", t.id), t.done(() => {
          this.logger("Completing id=", t.id), tn(this.running, t), this.schedule();
        });
      }
      next() {
        const { promise: t, id: e } = N(this.pending, va());
        return this.logger("Scheduling id=%s", e), this.schedule(), t;
      }
    };
  }
}), Nc = {};
Z(Nc, {
  applyPatchTask: () => Jp
});
function Jp(t, e) {
  return ie(["apply", ...e, ...t]);
}
var Qp = g({
  "src/lib/tasks/apply-patch.ts"() {
    B();
  }
});
function Kp(t, e) {
  return {
    branch: t,
    hash: e,
    success: !0
  };
}
function Xp(t) {
  return {
    branch: t,
    hash: null,
    success: !1
  };
}
var Pc, eg = g({
  "src/lib/responses/BranchDeleteSummary.ts"() {
    Pc = class {
      constructor() {
        this.all = [], this.branches = {}, this.errors = [];
      }
      get success() {
        return !this.errors.length;
      }
    };
  }
});
function Ac(t, e) {
  return e === 1 && ls.test(t);
}
var _a, ls, ka, on, tg = g({
  "src/lib/parsers/parse-branch-delete.ts"() {
    eg(), C(), _a = /(\S+)\s+\(\S+\s([^)]+)\)/, ls = /^error[^']+'([^']+)'/m, ka = [
      new x(_a, (t, [e, r]) => {
        const n = Kp(e, r);
        t.all.push(n), t.branches[e] = n;
      }),
      new x(ls, (t, [e]) => {
        const r = Xp(e);
        t.errors.push(r), t.all.push(r), t.branches[e] = r;
      })
    ], on = (t, e) => ue(new Pc(), ka, [t, e]);
  }
}), Lc, rg = g({
  "src/lib/responses/BranchSummary.ts"() {
    Lc = class {
      constructor() {
        this.all = [], this.branches = {}, this.current = "", this.detached = !1;
      }
      push(t, e, r, n, s) {
        t === "*" && (this.detached = e, this.current = r), this.all.push(r), this.branches[r] = {
          current: t === "*",
          linkedWorkTree: t === "+",
          name: r,
          commit: n,
          label: s
        };
      }
    };
  }
});
function Ta(t) {
  return t ? t.charAt(0) : "";
}
function Wc(t) {
  return ue(new Lc(), $c, t);
}
var $c, ng = g({
  "src/lib/parsers/parse-branch.ts"() {
    rg(), C(), $c = [
      new x(
        /^([*+]\s)?\((?:HEAD )?detached (?:from|at) (\S+)\)\s+([a-z0-9]+)\s(.*)$/,
        (t, [e, r, n, s]) => {
          t.push(Ta(e), !0, r, n, s);
        }
      ),
      new x(
        new RegExp("^([*+]\\s)?(\\S+)\\s+([a-z0-9]+)\\s?(.*)$", "s"),
        (t, [e, r, n, s]) => {
          t.push(Ta(e), !1, r, n, s);
        }
      )
    ];
  }
}), Uc = {};
Z(Uc, {
  branchLocalTask: () => ig,
  branchTask: () => sg,
  containsDeleteBranchCommand: () => zc,
  deleteBranchTask: () => og,
  deleteBranchesTask: () => ag
});
function zc(t) {
  const e = ["-d", "-D", "--delete"];
  return t.some((r) => e.includes(r));
}
function sg(t) {
  const e = zc(t), r = ["branch", ...t];
  return r.length === 1 && r.push("-a"), r.includes("-v") || r.splice(1, 0, "-v"), {
    format: "utf-8",
    commands: r,
    parser(n, s) {
      return e ? on(n, s).all[0] : Wc(n);
    }
  };
}
function ig() {
  return {
    format: "utf-8",
    commands: ["branch", "-v"],
    parser: Wc
  };
}
function ag(t, e = !1) {
  return {
    format: "utf-8",
    commands: ["branch", "-v", e ? "-D" : "-d", ...t],
    parser(r, n) {
      return on(r, n);
    },
    onError({ exitCode: r, stdOut: n }, s, i, a) {
      if (!Ac(String(s), r))
        return a(s);
      i(n);
    }
  };
}
function og(t, e = !1) {
  const r = {
    format: "utf-8",
    commands: ["branch", "-v", e ? "-D" : "-d", t],
    parser(n, s) {
      return on(n, s).branches[t];
    },
    onError({ exitCode: n, stdErr: s, stdOut: i }, a, o, u) {
      if (!Ac(String(a), n))
        return u(a);
      throw new nr(
        r.parser(Gt(i), Gt(s)),
        String(a)
      );
    }
  };
  return r;
}
var ug = g({
  "src/lib/tasks/branch.ts"() {
    xt(), tg(), ng(), C();
  }
}), Vc, cg = g({
  "src/lib/responses/CheckIgnore.ts"() {
    Vc = (t) => t.split(/\n/g).map((e) => e.trim()).filter((e) => !!e);
  }
}), jc = {};
Z(jc, {
  checkIgnoreTask: () => lg
});
function lg(t) {
  return {
    commands: ["check-ignore", ...t],
    format: "utf-8",
    parser: Vc
  };
}
var fg = g({
  "src/lib/tasks/check-ignore.ts"() {
    cg();
  }
}), Hc = {};
Z(Hc, {
  cloneMirrorTask: () => dg,
  cloneTask: () => qc
});
function hg(t) {
  return /^--upload-pack(=|$)/.test(t);
}
function qc(t, e, r) {
  const n = ["clone", ...r];
  return te(t) && n.push(t), te(e) && n.push(e), n.find(hg) ? oe("git.fetch: potential exploit argument blocked.") : ie(n);
}
function dg(t, e, r) {
  return N(r, "--mirror"), qc(t, e, r);
}
var mg = g({
  "src/lib/tasks/clone.ts"() {
    B(), C();
  }
});
function pg(t, e) {
  return ue({
    raw: t,
    remote: null,
    branches: [],
    tags: [],
    updated: [],
    deleted: []
  }, Gc, [t, e]);
}
var Gc, gg = g({
  "src/lib/parsers/parse-fetch.ts"() {
    C(), Gc = [
      new x(/From (.+)$/, (t, [e]) => {
        t.remote = e;
      }),
      new x(/\* \[new branch]\s+(\S+)\s*-> (.+)$/, (t, [e, r]) => {
        t.branches.push({
          name: e,
          tracking: r
        });
      }),
      new x(/\* \[new tag]\s+(\S+)\s*-> (.+)$/, (t, [e, r]) => {
        t.tags.push({
          name: e,
          tracking: r
        });
      }),
      new x(/- \[deleted]\s+\S+\s*-> (.+)$/, (t, [e]) => {
        t.deleted.push({
          tracking: e
        });
      }),
      new x(
        /\s*([^.]+)\.\.(\S+)\s+(\S+)\s*-> (.+)$/,
        (t, [e, r, n, s]) => {
          t.updated.push({
            name: n,
            tracking: s,
            to: r,
            from: e
          });
        }
      )
    ];
  }
}), Bc = {};
Z(Bc, {
  fetchTask: () => wg
});
function yg(t) {
  return /^--upload-pack(=|$)/.test(t);
}
function wg(t, e, r) {
  const n = ["fetch", ...r];
  return t && e && n.push(t, e), n.find(yg) ? oe("git.fetch: potential exploit argument blocked.") : {
    commands: n,
    format: "utf-8",
    parser: pg
  };
}
var vg = g({
  "src/lib/tasks/fetch.ts"() {
    gg(), B();
  }
});
function _g(t) {
  return ue({ moves: [] }, Zc, t);
}
var Zc, kg = g({
  "src/lib/parsers/parse-move.ts"() {
    C(), Zc = [
      new x(/^Renaming (.+) to (.+)$/, (t, [e, r]) => {
        t.moves.push({ from: e, to: r });
      })
    ];
  }
}), Yc = {};
Z(Yc, {
  moveTask: () => Tg
});
function Tg(t, e) {
  return {
    commands: ["mv", "-v", ...xe(t), e],
    format: "utf-8",
    parser: _g
  };
}
var bg = g({
  "src/lib/tasks/move.ts"() {
    kg(), C();
  }
}), Jc = {};
Z(Jc, {
  pullTask: () => Sg
});
function Sg(t, e, r) {
  const n = ["pull", ...r];
  return t && e && n.splice(1, 0, t, e), {
    commands: n,
    format: "utf-8",
    parser(s, i) {
      return Ks(s, i);
    },
    onError(s, i, a, o) {
      const u = Fp(
        Gt(s.stdOut),
        Gt(s.stdErr)
      );
      if (u)
        return o(new nr(u));
      o(i);
    }
  };
}
var Eg = g({
  "src/lib/tasks/pull.ts"() {
    xt(), kc(), C();
  }
});
function Og(t) {
  const e = {};
  return Qc(t, ([r]) => e[r] = { name: r }), Object.values(e);
}
function Dg(t) {
  const e = {};
  return Qc(t, ([r, n, s]) => {
    e.hasOwnProperty(r) || (e[r] = {
      name: r,
      refs: { fetch: "", push: "" }
    }), s && n && (e[r].refs[s.replace(/[^a-z]/g, "")] = n);
  }), Object.values(e);
}
function Qc(t, e) {
  Ms(t, (r) => e(r.split(/\s+/)));
}
var Cg = g({
  "src/lib/responses/GetRemoteSummary.ts"() {
    C();
  }
}), Kc = {};
Z(Kc, {
  addRemoteTask: () => Ig,
  getRemotesTask: () => xg,
  listRemotesTask: () => Fg,
  remoteTask: () => Mg,
  removeRemoteTask: () => Rg
});
function Ig(t, e, r) {
  return ie(["remote", "add", ...r, t, e]);
}
function xg(t) {
  const e = ["remote"];
  return t && e.push("-v"), {
    commands: e,
    format: "utf-8",
    parser: t ? Dg : Og
  };
}
function Fg(t) {
  const e = [...t];
  return e[0] !== "ls-remote" && e.unshift("ls-remote"), ie(e);
}
function Mg(t) {
  const e = [...t];
  return e[0] !== "remote" && e.unshift("remote"), ie(e);
}
function Rg(t) {
  return ie(["remote", "remove", t]);
}
var Ng = g({
  "src/lib/tasks/remote.ts"() {
    Cg(), B();
  }
}), Xc = {};
Z(Xc, {
  stashListTask: () => Pg
});
function Pg(t = {}, e) {
  const r = fc(t), n = ["stash", "list", ...r.commands, ...e], s = oc(
    r.splitter,
    r.fields,
    Gs(n)
  );
  return an(n) || {
    commands: n,
    format: "utf-8",
    parser: s
  };
}
var Ag = g({
  "src/lib/tasks/stash-list.ts"() {
    or(), cc(), Qs(), hc();
  }
}), el = {};
Z(el, {
  addSubModuleTask: () => Lg,
  initSubModuleTask: () => Wg,
  subModuleTask: () => un,
  updateSubModuleTask: () => $g
});
function Lg(t, e) {
  return un(["add", t, e]);
}
function Wg(t) {
  return un(["init", ...t]);
}
function un(t) {
  const e = [...t];
  return e[0] !== "submodule" && e.unshift("submodule"), ie(e);
}
function $g(t) {
  return un(["update", ...t]);
}
var Ug = g({
  "src/lib/tasks/sub-module.ts"() {
    B();
  }
});
function zg(t, e) {
  const r = isNaN(t), n = isNaN(e);
  return r !== n ? r ? 1 : -1 : r ? tl(t, e) : 0;
}
function tl(t, e) {
  return t === e ? 0 : t > e ? 1 : -1;
}
function Vg(t) {
  return t.trim();
}
function vr(t) {
  return typeof t == "string" && parseInt(t.replace(/^\D+/g, ""), 10) || 0;
}
var ba, rl, jg = g({
  "src/lib/responses/TagList.ts"() {
    ba = class {
      constructor(t, e) {
        this.all = t, this.latest = e;
      }
    }, rl = function(t, e = !1) {
      const r = t.split(`
`).map(Vg).filter(Boolean);
      e || r.sort(function(s, i) {
        const a = s.split("."), o = i.split(".");
        if (a.length === 1 || o.length === 1)
          return zg(vr(a[0]), vr(o[0]));
        for (let u = 0, c = Math.max(a.length, o.length); u < c; u++) {
          const l = tl(vr(a[u]), vr(o[u]));
          if (l)
            return l;
        }
        return 0;
      });
      const n = e ? r[0] : [...r].reverse().find((s) => s.indexOf(".") >= 0);
      return new ba(r, n);
    };
  }
}), nl = {};
Z(nl, {
  addAnnotatedTagTask: () => Gg,
  addTagTask: () => qg,
  tagListTask: () => Hg
});
function Hg(t = []) {
  const e = t.some((r) => /^--sort=/.test(r));
  return {
    format: "utf-8",
    commands: ["tag", "-l", ...t],
    parser(r) {
      return rl(r, e);
    }
  };
}
function qg(t) {
  return {
    format: "utf-8",
    commands: ["tag", t],
    parser() {
      return { name: t };
    }
  };
}
function Gg(t, e) {
  return {
    format: "utf-8",
    commands: ["tag", "-a", "-m", e, t],
    parser() {
      return { name: t };
    }
  };
}
var Bg = g({
  "src/lib/tasks/tag.ts"() {
    jg();
  }
}), Zg = fm({
  "src/git.js"(t, e) {
    var { GitExecutor: r } = (Jm(), H(Qu)), { SimpleGitApi: n } = (Zp(), H(Fc)), { Scheduler: s } = (Yp(), H(Mc)), { configurationErrorTask: i } = (B(), H(ns)), {
      asArray: a,
      filterArray: o,
      filterPrimitives: u,
      filterString: c,
      filterStringOrStringArray: l,
      filterType: f,
      getTrailingOptions: h,
      trailingFunctionArgument: d,
      trailingOptionsArgument: m
    } = (C(), H(Tu)), { applyPatchTask: k } = (Qp(), H(Nc)), {
      branchTask: E,
      branchLocalTask: v,
      deleteBranchesTask: F,
      deleteBranchTask: z
    } = (ug(), H(Uc)), { checkIgnoreTask: re } = (fg(), H(jc)), { checkIsRepoTask: Q } = (Ou(), H(bu)), { cloneTask: cr, cloneMirrorTask: Qe } = (mg(), H(Hc)), { cleanWithOptionsTask: Ft, isCleanOptionsArray: De } = (Lu(), H(Pu)), { diffSummaryTask: Me } = (Qs(), H(lc)), { fetchTask: dn } = (vg(), H(Bc)), { moveTask: hl } = (bg(), H(Yc)), { pullTask: dl } = (Eg(), H(Jc)), { pushTagsTask: ml } = (Ec(), H(Sc)), {
      addRemoteTask: pl,
      getRemotesTask: gl,
      listRemotesTask: yl,
      remoteTask: wl,
      removeRemoteTask: vl
    } = (Ng(), H(Kc)), { getResetMode: _l, resetTask: kl } = (Yu(), H(Gu)), { stashListTask: Tl } = (Ag(), H(Xc)), {
      addSubModuleTask: bl,
      initSubModuleTask: Sl,
      subModuleTask: El,
      updateSubModuleTask: Ol
    } = (Ug(), H(el)), { addAnnotatedTagTask: Dl, addTagTask: Cl, tagListTask: Il } = (Bg(), H(nl)), { straightThroughBufferTask: xl, straightThroughStringTask: Ce } = (B(), H(ns));
    function b(p, T) {
      this._plugins = T, this._executor = new r(
        p.baseDir,
        new s(p.maxConcurrentProcesses),
        T
      ), this._trimmed = p.trimmed;
    }
    (b.prototype = Object.create(n.prototype)).constructor = b, b.prototype.customBinary = function(p) {
      return this._plugins.reconfigure("binary", p), this;
    }, b.prototype.env = function(p, T) {
      return arguments.length === 1 && typeof p == "object" ? this._executor.env = p : (this._executor.env = this._executor.env || {})[p] = T, this;
    }, b.prototype.stashList = function(p) {
      return this._runTask(
        Tl(
          m(arguments) || {},
          o(p) && p || []
        ),
        d(arguments)
      );
    };
    function ni(p, T, W, ne) {
      return typeof W != "string" ? i(`git.${p}() requires a string 'repoPath'`) : T(W, f(ne, c), h(arguments));
    }
    b.prototype.clone = function() {
      return this._runTask(
        ni("clone", cr, ...arguments),
        d(arguments)
      );
    }, b.prototype.mirror = function() {
      return this._runTask(
        ni("mirror", Qe, ...arguments),
        d(arguments)
      );
    }, b.prototype.mv = function(p, T) {
      return this._runTask(hl(p, T), d(arguments));
    }, b.prototype.checkoutLatestTag = function(p) {
      var T = this;
      return this.pull(function() {
        T.tags(function(W, ne) {
          T.checkout(ne.latest, p);
        });
      });
    }, b.prototype.pull = function(p, T, W, ne) {
      return this._runTask(
        dl(
          f(p, c),
          f(T, c),
          h(arguments)
        ),
        d(arguments)
      );
    }, b.prototype.fetch = function(p, T) {
      return this._runTask(
        dn(
          f(p, c),
          f(T, c),
          h(arguments)
        ),
        d(arguments)
      );
    }, b.prototype.silent = function(p) {
      return console.warn(
        "simple-git deprecation notice: git.silent: logging should be configured using the `debug` library / `DEBUG` environment variable, this will be an error in version 3"
      ), this;
    }, b.prototype.tags = function(p, T) {
      return this._runTask(
        Il(h(arguments)),
        d(arguments)
      );
    }, b.prototype.rebase = function() {
      return this._runTask(
        Ce(["rebase", ...h(arguments)]),
        d(arguments)
      );
    }, b.prototype.reset = function(p) {
      return this._runTask(
        kl(_l(p), h(arguments)),
        d(arguments)
      );
    }, b.prototype.revert = function(p) {
      const T = d(arguments);
      return typeof p != "string" ? this._runTask(i("Commit must be a string"), T) : this._runTask(
        Ce(["revert", ...h(arguments, 0, !0), p]),
        T
      );
    }, b.prototype.addTag = function(p) {
      const T = typeof p == "string" ? Cl(p) : i("Git.addTag requires a tag name");
      return this._runTask(T, d(arguments));
    }, b.prototype.addAnnotatedTag = function(p, T) {
      return this._runTask(
        Dl(p, T),
        d(arguments)
      );
    }, b.prototype.deleteLocalBranch = function(p, T, W) {
      return this._runTask(
        z(p, typeof T == "boolean" ? T : !1),
        d(arguments)
      );
    }, b.prototype.deleteLocalBranches = function(p, T, W) {
      return this._runTask(
        F(p, typeof T == "boolean" ? T : !1),
        d(arguments)
      );
    }, b.prototype.branch = function(p, T) {
      return this._runTask(
        E(h(arguments)),
        d(arguments)
      );
    }, b.prototype.branchLocal = function(p) {
      return this._runTask(v(), d(arguments));
    }, b.prototype.raw = function(p) {
      const T = !Array.isArray(p), W = [].slice.call(T ? arguments : p, 0);
      for (let ke = 0; ke < W.length && T; ke++)
        if (!u(W[ke])) {
          W.splice(ke, W.length - ke);
          break;
        }
      W.push(...h(arguments, 0, !0));
      var ne = d(arguments);
      return W.length ? this._runTask(Ce(W, this._trimmed), ne) : this._runTask(
        i("Raw: must supply one or more command to execute"),
        ne
      );
    }, b.prototype.submoduleAdd = function(p, T, W) {
      return this._runTask(bl(p, T), d(arguments));
    }, b.prototype.submoduleUpdate = function(p, T) {
      return this._runTask(
        Ol(h(arguments, !0)),
        d(arguments)
      );
    }, b.prototype.submoduleInit = function(p, T) {
      return this._runTask(
        Sl(h(arguments, !0)),
        d(arguments)
      );
    }, b.prototype.subModule = function(p, T) {
      return this._runTask(
        El(h(arguments)),
        d(arguments)
      );
    }, b.prototype.listRemote = function() {
      return this._runTask(
        yl(h(arguments)),
        d(arguments)
      );
    }, b.prototype.addRemote = function(p, T, W) {
      return this._runTask(
        pl(p, T, h(arguments)),
        d(arguments)
      );
    }, b.prototype.removeRemote = function(p, T) {
      return this._runTask(vl(p), d(arguments));
    }, b.prototype.getRemotes = function(p, T) {
      return this._runTask(gl(p === !0), d(arguments));
    }, b.prototype.remote = function(p, T) {
      return this._runTask(
        wl(h(arguments)),
        d(arguments)
      );
    }, b.prototype.tag = function(p, T) {
      const W = h(arguments);
      return W[0] !== "tag" && W.unshift("tag"), this._runTask(Ce(W), d(arguments));
    }, b.prototype.updateServerInfo = function(p) {
      return this._runTask(
        Ce(["update-server-info"]),
        d(arguments)
      );
    }, b.prototype.pushTags = function(p, T) {
      const W = ml(
        { remote: f(p, c) },
        h(arguments)
      );
      return this._runTask(W, d(arguments));
    }, b.prototype.rm = function(p) {
      return this._runTask(
        Ce(["rm", "-f", ...a(p)]),
        d(arguments)
      );
    }, b.prototype.rmKeepLocal = function(p) {
      return this._runTask(
        Ce(["rm", "--cached", ...a(p)]),
        d(arguments)
      );
    }, b.prototype.catFile = function(p, T) {
      return this._catFile("utf-8", arguments);
    }, b.prototype.binaryCatFile = function() {
      return this._catFile("buffer", arguments);
    }, b.prototype._catFile = function(p, T) {
      var W = d(T), ne = ["cat-file"], ke = T[0];
      if (typeof ke == "string")
        return this._runTask(
          i("Git.catFile: options must be supplied as an array of strings"),
          W
        );
      Array.isArray(ke) && ne.push.apply(ne, ke);
      const mn = p === "buffer" ? xl(ne) : Ce(ne);
      return this._runTask(mn, W);
    }, b.prototype.diff = function(p, T) {
      const W = c(p) ? i(
        "git.diff: supplying options as a single string is no longer supported, switch to an array of strings"
      ) : Ce(["diff", ...h(arguments)]);
      return this._runTask(W, d(arguments));
    }, b.prototype.diffSummary = function() {
      return this._runTask(
        Me(h(arguments, 1)),
        d(arguments)
      );
    }, b.prototype.applyPatch = function(p) {
      const T = l(p) ? k(a(p), h([].slice.call(arguments, 1))) : i(
        "git.applyPatch requires one or more string patches as the first argument"
      );
      return this._runTask(T, d(arguments));
    }, b.prototype.revparse = function() {
      const p = ["rev-parse", ...h(arguments, !0)];
      return this._runTask(
        Ce(p, !0),
        d(arguments)
      );
    }, b.prototype.clean = function(p, T, W) {
      const ne = De(p), ke = ne && p.join("") || f(p, c) || "", mn = h([].slice.call(arguments, ne ? 1 : 0));
      return this._runTask(
        Ft(ke, mn),
        d(arguments)
      );
    }, b.prototype.exec = function(p) {
      const T = {
        commands: [],
        format: "utf-8",
        parser() {
          typeof p == "function" && p();
        }
      };
      return this._runTask(T);
    }, b.prototype.clearQueue = function() {
      return this;
    }, b.prototype.checkIgnore = function(p, T) {
      return this._runTask(
        re(a(f(p, l, []))),
        d(arguments)
      );
    }, b.prototype.checkIsRepo = function(p, T) {
      return this._runTask(
        Q(f(p, c)),
        d(arguments)
      );
    }, e.exports = b;
  }
});
rr();
Je();
var Yg = class extends We {
  constructor(t, e) {
    super(void 0, e), this.config = t;
  }
};
Je();
Je();
var Le = class extends We {
  constructor(t, e, r) {
    super(t, r), this.task = t, this.plugin = e, Object.setPrototypeOf(this, new.target.prototype);
  }
};
xt();
ou();
Ou();
Lu();
Uu();
Vu();
qu();
Yu();
function Jg(t) {
  return t ? [{
    type: "spawn.before",
    action(n, s) {
      t.aborted && s.kill(new Le(void 0, "abort", "Abort already signaled"));
    }
  }, {
    type: "spawn.after",
    action(n, s) {
      function i() {
        s.kill(new Le(void 0, "abort", "Abort signal received"));
      }
      t.addEventListener("abort", i), s.spawned.on("close", () => t.removeEventListener("abort", i));
    }
  }] : void 0;
}
function Qg(t) {
  return typeof t == "string" && t.trim().toLowerCase() === "-c";
}
function Kg(t, e) {
  if (Qg(t) && /^\s*protocol(.[a-z]+)?.allow/.test(e))
    throw new Le(
      void 0,
      "unsafe",
      "Configuring protocol.allow is not permitted without enabling allowUnsafeExtProtocol"
    );
}
function Xg(t, e) {
  if (/^\s*--(upload|receive)-pack/.test(t))
    throw new Le(
      void 0,
      "unsafe",
      "Use of --upload-pack or --receive-pack is not permitted without enabling allowUnsafePack"
    );
  if (e === "clone" && /^\s*-u\b/.test(t))
    throw new Le(
      void 0,
      "unsafe",
      "Use of clone with option -u is not permitted without enabling allowUnsafePack"
    );
  if (e === "push" && /^\s*--exec\b/.test(t))
    throw new Le(
      void 0,
      "unsafe",
      "Use of push with option --exec is not permitted without enabling allowUnsafePack"
    );
}
function ey({
  allowUnsafeProtocolOverride: t = !1,
  allowUnsafePack: e = !1
} = {}) {
  return {
    type: "spawn.args",
    action(r, n) {
      return r.forEach((s, i) => {
        const a = i < r.length ? r[i + 1] : "";
        t || Kg(s, a), e || Xg(s, n.method);
      }), r;
    }
  };
}
C();
function ty(t) {
  const e = qt(t, "-c");
  return {
    type: "spawn.args",
    action(r) {
      return [...e, ...r];
    }
  };
}
C();
var Sa = gt().promise;
function ry({
  onClose: t = !0,
  onExit: e = 50
} = {}) {
  function r() {
    let s = -1;
    const i = {
      close: gt(),
      closeTimeout: gt(),
      exit: gt(),
      exitTimeout: gt()
    }, a = Promise.race([
      t === !1 ? Sa : i.closeTimeout.promise,
      e === !1 ? Sa : i.exitTimeout.promise
    ]);
    return n(t, i.close, i.closeTimeout), n(e, i.exit, i.exitTimeout), {
      close(o) {
        s = o, i.close.done();
      },
      exit(o) {
        s = o, i.exit.done();
      },
      get exitCode() {
        return s;
      },
      result: a
    };
  }
  function n(s, i, a) {
    s !== !1 && (s === !0 ? i.promise : i.promise.then(() => Kn(s))).then(a.done);
  }
  return {
    type: "spawn.after",
    action(s, i) {
      return Lt(this, arguments, function* (a, { spawned: o, close: u }) {
        var c, l;
        const f = r();
        let h = !0, d = () => void (h = !1);
        (c = o.stdout) == null || c.on("data", d), (l = o.stderr) == null || l.on("data", d), o.on("error", d), o.on("close", (m) => f.close(m)), o.on("exit", (m) => f.exit(m));
        try {
          yield f.result, h && (yield Kn(50)), u(f.exitCode);
        } catch (m) {
          u(f.exitCode, m);
        }
      });
    }
  };
}
C();
var ny = "Invalid value supplied for custom binary, requires a single string or an array containing either one or two strings", Ea = "Invalid value supplied for custom binary, restricted characters must be removed or supply the unsafe.allowUnsafeCustomBinary option";
function sy(t) {
  return !t || !/^([a-z]:)?([a-z0-9/.\\_-]+)$/i.test(t);
}
function Oa(t, e) {
  if (t.length < 1 || t.length > 2)
    throw new Le(void 0, "binary", ny);
  if (t.some(sy))
    if (e)
      console.warn(Ea);
    else
      throw new Le(void 0, "binary", Ea);
  const [n, s] = t;
  return {
    binary: n,
    prefix: s
  };
}
function iy(t, e = ["git"], r = !1) {
  let n = Oa(xe(e), r);
  t.on("binary", (s) => {
    n = Oa(xe(s), r);
  }), t.append("spawn.binary", () => n.binary), t.append("spawn.args", (s) => n.prefix ? [n.prefix, ...s] : s);
}
Je();
function ay(t) {
  return !!(t.exitCode && t.stdErr.length);
}
function oy(t) {
  return Buffer.concat([...t.stdOut, ...t.stdErr]);
}
function uy(t = !1, e = ay, r = oy) {
  return (n, s) => !t && n || !e(s) ? n : r(s);
}
function Da(t) {
  return {
    type: "task.error",
    action(e, r) {
      const n = t(e.error, {
        stdErr: r.stdErr,
        stdOut: r.stdOut,
        exitCode: r.exitCode
      });
      return Buffer.isBuffer(n) ? { error: new We(void 0, n.toString("utf-8")) } : {
        error: n
      };
    }
  };
}
C();
var cy = class {
  constructor() {
    this.plugins = /* @__PURE__ */ new Set(), this.events = new Xl();
  }
  on(t, e) {
    this.events.on(t, e);
  }
  reconfigure(t, e) {
    this.events.emit(t, e);
  }
  append(t, e) {
    const r = N(this.plugins, { type: t, action: e });
    return () => this.plugins.delete(r);
  }
  add(t) {
    const e = [];
    return xe(t).forEach((r) => r && this.plugins.add(N(e, r))), () => {
      e.forEach((r) => this.plugins.delete(r));
    };
  }
  exec(t, e, r) {
    let n = e;
    const s = Object.freeze(Object.create(r));
    for (const i of this.plugins)
      i.type === t && (n = i.action(n, s));
    return n;
  }
};
C();
function ly(t) {
  const e = "--progress", r = ["checkout", "clone", "fetch", "pull", "push"];
  return [{
    type: "spawn.args",
    action(i, a) {
      return r.includes(a.method) ? du(i, e) : i;
    }
  }, {
    type: "spawn.after",
    action(i, a) {
      var o;
      a.commands.includes(e) && ((o = a.spawned.stderr) == null || o.on("data", (u) => {
        const c = /^([\s\S]+?):\s*(\d+)% \((\d+)\/(\d+)\)/.exec(u.toString("utf8"));
        c && t({
          method: a.method,
          stage: fy(c[1]),
          progress: U(c[2]),
          processed: U(c[3]),
          total: U(c[4])
        });
      }));
    }
  }];
}
function fy(t) {
  return String(t.toLowerCase().split(" ", 1)) || "unknown";
}
C();
function hy(t) {
  const e = gu(t, ["uid", "gid"]);
  return {
    type: "spawn.options",
    action(r) {
      return ye(ye({}, e), r);
    }
  };
}
function dy({
  block: t,
  stdErr: e = !0,
  stdOut: r = !0
}) {
  if (t > 0)
    return {
      type: "spawn.after",
      action(n, s) {
        var i, a;
        let o;
        function u() {
          o && clearTimeout(o), o = setTimeout(l, t);
        }
        function c() {
          var f, h;
          (f = s.spawned.stdout) == null || f.off("data", u), (h = s.spawned.stderr) == null || h.off("data", u), s.spawned.off("exit", c), s.spawned.off("close", c), o && clearTimeout(o);
        }
        function l() {
          c(), s.kill(new Le(void 0, "timeout", "block timeout reached"));
        }
        r && ((i = s.spawned.stdout) == null || i.on("data", u)), e && ((a = s.spawned.stderr) == null || a.on("data", u)), s.spawned.on("exit", c), s.spawned.on("close", c), u();
      }
    };
}
rr();
function my() {
  return {
    type: "spawn.args",
    action(t) {
      const e = [];
      let r;
      function n(s) {
        (r = r || []).push(...s);
      }
      for (let s = 0; s < t.length; s++) {
        const i = t[s];
        if (jr(i)) {
          n(Qi(i));
          continue;
        }
        if (i === "--") {
          n(
            t.slice(s + 1).flatMap((a) => jr(a) && Qi(a) || a)
          );
          break;
        }
        e.push(i);
      }
      return r ? [...e, "--", ...r.map(String)] : e;
    }
  };
}
C();
var py = Zg();
function gy(t, e) {
  var r;
  const n = new cy(), s = _u(
    t && (typeof t == "string" ? { baseDir: t } : t) || {},
    e
  );
  if (!Rs(s.baseDir))
    throw new Yg(
      s,
      "Cannot use simple-git on a directory that does not exist"
    );
  return Array.isArray(s.config) && n.add(ty(s.config)), n.add(ey(s.unsafe)), n.add(my()), n.add(ry(s.completion)), s.abort && n.add(Jg(s.abort)), s.progress && n.add(ly(s.progress)), s.timeout && n.add(dy(s.timeout)), s.spawnOptions && n.add(hy(s.spawnOptions)), n.add(Da(uy(!0))), s.errors && n.add(Da(s.errors)), iy(n, s.binary, (r = s.unsafe) == null ? void 0 : r.allowUnsafeCustomBinary), new py(s, n);
}
xt();
var Ln = gy;
function yy() {
  return {
    root: ".",
    fileFilter: (t) => !0,
    directoryFilter: (t) => !0,
    type: ti,
    lstat: !1,
    depth: 2147483648,
    alwaysStat: !1,
    highWaterMark: 4096
  };
}
const sl = "READDIRP_RECURSIVE_ERROR", wy = /* @__PURE__ */ new Set(["ENOENT", "EPERM", "EACCES", "ELOOP", sl]), ti = "files", il = "directories", cn = "files_directories", ln = "all", Ca = [ti, il, cn, ln], vy = /* @__PURE__ */ new Set([il, cn, ln]), _y = /* @__PURE__ */ new Set([ti, cn, ln]), ky = (t) => wy.has(t.code), Ty = process.platform === "win32", Ia = (t) => !0, xa = (t) => {
  if (t === void 0)
    return Ia;
  if (typeof t == "function")
    return t;
  if (typeof t == "string") {
    const e = t.trim();
    return (r) => r.basename === e;
  }
  if (Array.isArray(t)) {
    const e = t.map((r) => r.trim());
    return (r) => e.some((n) => r.basename === n);
  }
  return Ia;
};
class by extends ef {
  constructor(e = {}) {
    super({
      objectMode: !0,
      autoDestroy: !0,
      highWaterMark: e.highWaterMark
    });
    const r = { ...yy(), ...e }, { root: n, type: s } = r;
    this._fileFilter = xa(r.fileFilter), this._directoryFilter = xa(r.directoryFilter);
    const i = r.lstat ? Vn : Br;
    Ty ? this._stat = (a) => i(a, { bigint: !0 }) : this._stat = i, this._maxDepth = r.depth, this._wantsDir = vy.has(s), this._wantsFile = _y.has(s), this._wantsEverything = s === ln, this._root = ii(n), this._isDirent = !r.alwaysStat, this._statsProp = this._isDirent ? "dirent" : "stats", this._rdOptions = { encoding: "utf8", withFileTypes: this._isDirent }, this.parents = [this._exploreDir(n, 1)], this.reading = !1, this.parent = void 0;
  }
  async _read(e) {
    if (!this.reading) {
      this.reading = !0;
      try {
        for (; !this.destroyed && e > 0; ) {
          const r = this.parent, n = r && r.files;
          if (n && n.length > 0) {
            const { path: s, depth: i } = r, a = n.splice(0, e).map((u) => this._formatEntry(u, s)), o = await Promise.all(a);
            for (const u of o) {
              if (!u) {
                e--;
                return;
              }
              if (this.destroyed)
                return;
              const c = await this._getEntryType(u);
              c === "directory" && this._directoryFilter(u) ? (i <= this._maxDepth && this.parents.push(this._exploreDir(u.fullPath, i + 1)), this._wantsDir && (this.push(u), e--)) : (c === "file" || this._includeAsFile(u)) && this._fileFilter(u) && this._wantsFile && (this.push(u), e--);
            }
          } else {
            const s = this.parents.pop();
            if (!s) {
              this.push(null);
              break;
            }
            if (this.parent = await s, this.destroyed)
              return;
          }
        }
      } catch (r) {
        this.destroy(r);
      } finally {
        this.reading = !1;
      }
    }
  }
  async _exploreDir(e, r) {
    let n;
    try {
      n = await Wa(e, this._rdOptions);
    } catch (s) {
      this._onError(s);
    }
    return { files: n, depth: r, path: e };
  }
  async _formatEntry(e, r) {
    let n;
    const s = this._isDirent ? e.name : e;
    try {
      const i = ii(La(r, s));
      n = { path: $l(this._root, i), fullPath: i, basename: s }, n[this._statsProp] = this._isDirent ? e : await this._stat(i);
    } catch (i) {
      this._onError(i);
      return;
    }
    return n;
  }
  _onError(e) {
    ky(e) && !this.destroyed ? this.emit("warn", e) : this.destroy(e);
  }
  async _getEntryType(e) {
    if (!e && this._statsProp in e)
      return "";
    const r = e[this._statsProp];
    if (r.isFile())
      return "file";
    if (r.isDirectory())
      return "directory";
    if (r && r.isSymbolicLink()) {
      const n = e.fullPath;
      try {
        const s = await br(n), i = await Vn(s);
        if (i.isFile())
          return "file";
        if (i.isDirectory()) {
          const a = s.length;
          if (n.startsWith(s) && n.substr(a, 1) === Ul) {
            const o = new Error(`Circular symlink detected: "${n}" points to "${s}"`);
            return o.code = sl, this._onError(o);
          }
          return "directory";
        }
      } catch (s) {
        return this._onError(s), "";
      }
    }
  }
  _includeAsFile(e) {
    const r = e && e[this._statsProp];
    return r && this._wantsEverything && !r.isDirectory();
  }
}
const Sy = (t, e = {}) => {
  let r = e.entryType || e.type;
  if (r === "both" && (r = cn), r && (e.type = r), t) {
    if (typeof t != "string")
      throw new TypeError("readdirp: root argument must be a string. Usage: readdirp(root, options)");
    if (r && !Ca.includes(r))
      throw new Error(`readdirp: Invalid type passed. Use one of ${Ca.join(", ")}`);
  } else throw new Error("readdirp: root argument is required. Usage: readdirp(root, options)");
  return e.root = t, new by(e);
}, Ey = "data", al = "end", Oy = "close", ri = () => {
}, fn = process.platform, ol = fn === "win32", Dy = fn === "darwin", Cy = fn === "linux", Iy = fn === "freebsd", xy = Kl() === "OS400", q = {
  ALL: "all",
  READY: "ready",
  ADD: "add",
  CHANGE: "change",
  ADD_DIR: "addDir",
  UNLINK: "unlink",
  UNLINK_DIR: "unlinkDir",
  RAW: "raw",
  ERROR: "error"
}, Se = q, Fy = "watch", My = { lstat: Vn, stat: Br }, ot = "listeners", Mr = "errHandlers", _t = "rawEmitters", Ry = [ot, Mr, _t], Ny = /* @__PURE__ */ new Set([
  "3dm",
  "3ds",
  "3g2",
  "3gp",
  "7z",
  "a",
  "aac",
  "adp",
  "afdesign",
  "afphoto",
  "afpub",
  "ai",
  "aif",
  "aiff",
  "alz",
  "ape",
  "apk",
  "appimage",
  "ar",
  "arj",
  "asf",
  "au",
  "avi",
  "bak",
  "baml",
  "bh",
  "bin",
  "bk",
  "bmp",
  "btif",
  "bz2",
  "bzip2",
  "cab",
  "caf",
  "cgm",
  "class",
  "cmx",
  "cpio",
  "cr2",
  "cur",
  "dat",
  "dcm",
  "deb",
  "dex",
  "djvu",
  "dll",
  "dmg",
  "dng",
  "doc",
  "docm",
  "docx",
  "dot",
  "dotm",
  "dra",
  "DS_Store",
  "dsk",
  "dts",
  "dtshd",
  "dvb",
  "dwg",
  "dxf",
  "ecelp4800",
  "ecelp7470",
  "ecelp9600",
  "egg",
  "eol",
  "eot",
  "epub",
  "exe",
  "f4v",
  "fbs",
  "fh",
  "fla",
  "flac",
  "flatpak",
  "fli",
  "flv",
  "fpx",
  "fst",
  "fvt",
  "g3",
  "gh",
  "gif",
  "graffle",
  "gz",
  "gzip",
  "h261",
  "h263",
  "h264",
  "icns",
  "ico",
  "ief",
  "img",
  "ipa",
  "iso",
  "jar",
  "jpeg",
  "jpg",
  "jpgv",
  "jpm",
  "jxr",
  "key",
  "ktx",
  "lha",
  "lib",
  "lvp",
  "lz",
  "lzh",
  "lzma",
  "lzo",
  "m3u",
  "m4a",
  "m4v",
  "mar",
  "mdi",
  "mht",
  "mid",
  "midi",
  "mj2",
  "mka",
  "mkv",
  "mmr",
  "mng",
  "mobi",
  "mov",
  "movie",
  "mp3",
  "mp4",
  "mp4a",
  "mpeg",
  "mpg",
  "mpga",
  "mxu",
  "nef",
  "npx",
  "numbers",
  "nupkg",
  "o",
  "odp",
  "ods",
  "odt",
  "oga",
  "ogg",
  "ogv",
  "otf",
  "ott",
  "pages",
  "pbm",
  "pcx",
  "pdb",
  "pdf",
  "pea",
  "pgm",
  "pic",
  "png",
  "pnm",
  "pot",
  "potm",
  "potx",
  "ppa",
  "ppam",
  "ppm",
  "pps",
  "ppsm",
  "ppsx",
  "ppt",
  "pptm",
  "pptx",
  "psd",
  "pya",
  "pyc",
  "pyo",
  "pyv",
  "qt",
  "rar",
  "ras",
  "raw",
  "resources",
  "rgb",
  "rip",
  "rlc",
  "rmf",
  "rmvb",
  "rpm",
  "rtf",
  "rz",
  "s3m",
  "s7z",
  "scpt",
  "sgi",
  "shar",
  "snap",
  "sil",
  "sketch",
  "slk",
  "smv",
  "snk",
  "so",
  "stl",
  "suo",
  "sub",
  "swf",
  "tar",
  "tbz",
  "tbz2",
  "tga",
  "tgz",
  "thmx",
  "tif",
  "tiff",
  "tlz",
  "ttc",
  "ttf",
  "txz",
  "udf",
  "uvh",
  "uvi",
  "uvm",
  "uvp",
  "uvs",
  "uvu",
  "viv",
  "vob",
  "war",
  "wav",
  "wax",
  "wbmp",
  "wdp",
  "weba",
  "webm",
  "webp",
  "whl",
  "wim",
  "wm",
  "wma",
  "wmv",
  "wmx",
  "woff",
  "woff2",
  "wrm",
  "wvx",
  "xbm",
  "xif",
  "xla",
  "xlam",
  "xls",
  "xlsb",
  "xlsm",
  "xlsx",
  "xlt",
  "xltm",
  "xltx",
  "xm",
  "xmind",
  "xpi",
  "xpm",
  "xwd",
  "xz",
  "z",
  "zip",
  "zipx"
]), Py = (t) => Ny.has(S.extname(t).slice(1).toLowerCase()), fs = (t, e) => {
  t instanceof Set ? t.forEach(e) : e(t);
}, zt = (t, e, r) => {
  let n = t[e];
  n instanceof Set || (t[e] = n = /* @__PURE__ */ new Set([n])), n.add(r);
}, Ay = (t) => (e) => {
  const r = t[e];
  r instanceof Set ? r.clear() : delete t[e];
}, Vt = (t, e, r) => {
  const n = t[e];
  n instanceof Set ? n.delete(r) : n === r && delete t[e];
}, ul = (t) => t instanceof Set ? t.size === 0 : !t, Rr = /* @__PURE__ */ new Map();
function Fa(t, e, r, n, s) {
  const i = (a, o) => {
    r(t), s(a, o, { watchedPath: t }), o && t !== o && Nr(S.resolve(t, o), ot, S.join(t, o));
  };
  try {
    return Zl(t, {
      persistent: e.persistent
    }, i);
  } catch (a) {
    n(a);
    return;
  }
}
const Nr = (t, e, r, n, s) => {
  const i = Rr.get(t);
  i && fs(i[e], (a) => {
    a(r, n, s);
  });
}, Ly = (t, e, r, n) => {
  const { listener: s, errHandler: i, rawEmitter: a } = n;
  let o = Rr.get(e), u;
  if (!r.persistent)
    return u = Fa(t, r, s, i, a), u ? u.close.bind(u) : void 0;
  if (o)
    zt(o, ot, s), zt(o, Mr, i), zt(o, _t, a);
  else {
    if (u = Fa(
      t,
      r,
      Nr.bind(null, e, ot),
      i,
      // no need to use broadcast here
      Nr.bind(null, e, _t)
    ), !u)
      return;
    u.on(Se.ERROR, async (c) => {
      const l = Nr.bind(null, e, Mr);
      if (o && (o.watcherUnusable = !0), ol && c.code === "EPERM")
        try {
          await (await jl(t, "r")).close(), l(c);
        } catch {
        }
      else
        l(c);
    }), o = {
      listeners: s,
      errHandlers: i,
      rawEmitters: a,
      watcher: u
    }, Rr.set(e, o);
  }
  return () => {
    Vt(o, ot, s), Vt(o, Mr, i), Vt(o, _t, a), ul(o.listeners) && (o.watcher.close(), Rr.delete(e), Ry.forEach(Ay(o)), o.watcher = void 0, Object.freeze(o));
  };
}, Wn = /* @__PURE__ */ new Map(), Wy = (t, e, r, n) => {
  const { listener: s, rawEmitter: i } = n;
  let a = Wn.get(e);
  const o = a && a.options;
  return o && (o.persistent < r.persistent || o.interval > r.interval) && (ai(e), a = void 0), a ? (zt(a, ot, s), zt(a, _t, i)) : (a = {
    listeners: s,
    rawEmitters: i,
    options: r,
    watcher: Bl(e, r, (u, c) => {
      fs(a.rawEmitters, (f) => {
        f(Se.CHANGE, e, { curr: u, prev: c });
      });
      const l = u.mtimeMs;
      (u.size !== c.size || l > c.mtimeMs || l === 0) && fs(a.listeners, (f) => f(t, u));
    })
  }, Wn.set(e, a)), () => {
    Vt(a, ot, s), Vt(a, _t, i), ul(a.listeners) && (Wn.delete(e), ai(e), a.options = a.watcher = void 0, Object.freeze(a));
  };
};
class $y {
  constructor(e) {
    this.fsw = e, this._boundHandleError = (r) => e._handleError(r);
  }
  /**
   * Watch file for changes with fs_watchFile or fs_watch.
   * @param path to file or dir
   * @param listener on fs change
   * @returns closer for the watcher instance
   */
  _watchWithNodeFs(e, r) {
    const n = this.fsw.options, s = S.dirname(e), i = S.basename(e);
    this.fsw._getWatchedDir(s).add(i);
    const o = S.resolve(e), u = {
      persistent: n.persistent
    };
    r || (r = ri);
    let c;
    if (n.usePolling) {
      const l = n.interval !== n.binaryInterval;
      u.interval = l && Py(i) ? n.binaryInterval : n.interval, c = Wy(e, o, u, {
        listener: r,
        rawEmitter: this.fsw._emitRaw
      });
    } else
      c = Ly(e, o, u, {
        listener: r,
        errHandler: this._boundHandleError,
        rawEmitter: this.fsw._emitRaw
      });
    return c;
  }
  /**
   * Watch a file and emit add event if warranted.
   * @returns closer for the watcher instance
   */
  _handleFile(e, r, n) {
    if (this.fsw.closed)
      return;
    const s = S.dirname(e), i = S.basename(e), a = this.fsw._getWatchedDir(s);
    let o = r;
    if (a.has(i))
      return;
    const u = async (l, f) => {
      if (this.fsw._throttle(Fy, e, 5)) {
        if (!f || f.mtimeMs === 0)
          try {
            const h = await Br(e);
            if (this.fsw.closed)
              return;
            const d = h.atimeMs, m = h.mtimeMs;
            if ((!d || d <= m || m !== o.mtimeMs) && this.fsw._emit(Se.CHANGE, e, h), (Dy || Cy || Iy) && o.ino !== h.ino) {
              this.fsw._closeFile(l), o = h;
              const k = this._watchWithNodeFs(e, u);
              k && this.fsw._addPathCloser(l, k);
            } else
              o = h;
          } catch {
            this.fsw._remove(s, i);
          }
        else if (a.has(i)) {
          const h = f.atimeMs, d = f.mtimeMs;
          (!h || h <= d || d !== o.mtimeMs) && this.fsw._emit(Se.CHANGE, e, f), o = f;
        }
      }
    }, c = this._watchWithNodeFs(e, u);
    if (!(n && this.fsw.options.ignoreInitial) && this.fsw._isntIgnored(e)) {
      if (!this.fsw._throttle(Se.ADD, e, 0))
        return;
      this.fsw._emit(Se.ADD, e, r);
    }
    return c;
  }
  /**
   * Handle symlinks encountered while reading a dir.
   * @param entry returned by readdirp
   * @param directory path of dir being read
   * @param path of this item
   * @param item basename of this item
   * @returns true if no more processing is needed for this entry.
   */
  async _handleSymlink(e, r, n, s) {
    if (this.fsw.closed)
      return;
    const i = e.fullPath, a = this.fsw._getWatchedDir(r);
    if (!this.fsw.options.followSymlinks) {
      this.fsw._incrReadyCount();
      let o;
      try {
        o = await br(n);
      } catch {
        return this.fsw._emitReady(), !0;
      }
      return this.fsw.closed ? void 0 : (a.has(s) ? this.fsw._symlinkPaths.get(i) !== o && (this.fsw._symlinkPaths.set(i, o), this.fsw._emit(Se.CHANGE, n, e.stats)) : (a.add(s), this.fsw._symlinkPaths.set(i, o), this.fsw._emit(Se.ADD, n, e.stats)), this.fsw._emitReady(), !0);
    }
    if (this.fsw._symlinkPaths.has(i))
      return !0;
    this.fsw._symlinkPaths.set(i, !0);
  }
  _handleRead(e, r, n, s, i, a, o) {
    if (e = S.join(e, ""), o = this.fsw._throttle("readdir", e, 1e3), !o)
      return;
    const u = this.fsw._getWatchedDir(n.path), c = /* @__PURE__ */ new Set();
    let l = this.fsw._readdirp(e, {
      fileFilter: (f) => n.filterPath(f),
      directoryFilter: (f) => n.filterDir(f)
    });
    if (l)
      return l.on(Ey, async (f) => {
        if (this.fsw.closed) {
          l = void 0;
          return;
        }
        const h = f.path;
        let d = S.join(e, h);
        if (c.add(h), !(f.stats.isSymbolicLink() && await this._handleSymlink(f, e, d, h))) {
          if (this.fsw.closed) {
            l = void 0;
            return;
          }
          (h === s || !s && !u.has(h)) && (this.fsw._incrReadyCount(), d = S.join(i, S.relative(i, d)), this._addToNodeFs(d, r, n, a + 1));
        }
      }).on(Se.ERROR, this._boundHandleError), new Promise((f, h) => {
        if (!l)
          return h();
        l.once(al, () => {
          if (this.fsw.closed) {
            l = void 0;
            return;
          }
          const d = o ? o.clear() : !1;
          f(void 0), u.getChildren().filter((m) => m !== e && !c.has(m)).forEach((m) => {
            this.fsw._remove(e, m);
          }), l = void 0, d && this._handleRead(e, !1, n, s, i, a, o);
        });
      });
  }
  /**
   * Read directory to add / remove files from `@watched` list and re-read it on change.
   * @param dir fs path
   * @param stats
   * @param initialAdd
   * @param depth relative to user-supplied path
   * @param target child path targeted for watch
   * @param wh Common watch helpers for this path
   * @param realpath
   * @returns closer for the watcher instance.
   */
  async _handleDir(e, r, n, s, i, a, o) {
    const u = this.fsw._getWatchedDir(S.dirname(e)), c = u.has(S.basename(e));
    !(n && this.fsw.options.ignoreInitial) && !i && !c && this.fsw._emit(Se.ADD_DIR, e, r), u.add(S.basename(e)), this.fsw._getWatchedDir(e);
    let l, f;
    const h = this.fsw.options.depth;
    if ((h == null || s <= h) && !this.fsw._symlinkPaths.has(o)) {
      if (!i && (await this._handleRead(e, n, a, i, e, s, l), this.fsw.closed))
        return;
      f = this._watchWithNodeFs(e, (d, m) => {
        m && m.mtimeMs === 0 || this._handleRead(d, !1, a, i, e, s, l);
      });
    }
    return f;
  }
  /**
   * Handle added file, directory, or glob pattern.
   * Delegates call to _handleFile / _handleDir after checks.
   * @param path to file or ir
   * @param initialAdd was the file added at watch instantiation?
   * @param priorWh depth relative to user-supplied path
   * @param depth Child path actually targeted for watch
   * @param target Child path actually targeted for watch
   */
  async _addToNodeFs(e, r, n, s, i) {
    const a = this.fsw._emitReady;
    if (this.fsw._isIgnored(e) || this.fsw.closed)
      return a(), !1;
    const o = this.fsw._getWatchHelpers(e);
    n && (o.filterPath = (u) => n.filterPath(u), o.filterDir = (u) => n.filterDir(u));
    try {
      const u = await My[o.statMethod](o.watchPath);
      if (this.fsw.closed)
        return;
      if (this.fsw._isIgnored(o.watchPath, u))
        return a(), !1;
      const c = this.fsw.options.followSymlinks;
      let l;
      if (u.isDirectory()) {
        const f = S.resolve(e), h = c ? await br(e) : e;
        if (this.fsw.closed || (l = await this._handleDir(o.watchPath, u, r, s, i, o, h), this.fsw.closed))
          return;
        f !== h && h !== void 0 && this.fsw._symlinkPaths.set(f, h);
      } else if (u.isSymbolicLink()) {
        const f = c ? await br(e) : e;
        if (this.fsw.closed)
          return;
        const h = S.dirname(o.watchPath);
        if (this.fsw._getWatchedDir(h).add(o.watchPath), this.fsw._emit(Se.ADD, o.watchPath, u), l = await this._handleDir(h, u, r, s, e, o, f), this.fsw.closed)
          return;
        f !== void 0 && this.fsw._symlinkPaths.set(S.resolve(e), f);
      } else
        l = this._handleFile(o.watchPath, u, r);
      return a(), l && this.fsw._addPathCloser(e, l), !1;
    } catch (u) {
      if (this.fsw._handleError(u))
        return a(), e;
    }
  }
}
/*! chokidar - MIT License (c) 2012 Paul Miller (paulmillr.com) */
const $n = "/", Uy = "//", cl = ".", zy = "..", Vy = "string", jy = /\\/g, Ma = /\/\//, Hy = /\..*\.(sw[px])$|~$|\.subl.*\.tmp/, qy = /^\.[/\\]/;
function Gr(t) {
  return Array.isArray(t) ? t : [t];
}
const Un = (t) => typeof t == "object" && t !== null && !(t instanceof RegExp);
function Gy(t) {
  return typeof t == "function" ? t : typeof t == "string" ? (e) => t === e : t instanceof RegExp ? (e) => t.test(e) : typeof t == "object" && t !== null ? (e) => {
    if (t.path === e)
      return !0;
    if (t.recursive) {
      const r = S.relative(t.path, e);
      return r ? !r.startsWith("..") && !S.isAbsolute(r) : !1;
    }
    return !1;
  } : () => !1;
}
function By(t) {
  if (typeof t != "string")
    throw new Error("string expected");
  t = S.normalize(t), t = t.replace(/\\/g, "/");
  let e = !1;
  t.startsWith("//") && (e = !0);
  const r = /\/\//;
  for (; t.match(r); )
    t = t.replace(r, "/");
  return e && (t = "/" + t), t;
}
function Zy(t, e, r) {
  const n = By(e);
  for (let s = 0; s < t.length; s++) {
    const i = t[s];
    if (i(n, r))
      return !0;
  }
  return !1;
}
function Yy(t, e) {
  if (t == null)
    throw new TypeError("anymatch: specify first argument");
  const n = Gr(t).map((s) => Gy(s));
  return (s, i) => Zy(n, s, i);
}
const Ra = (t) => {
  const e = Gr(t).flat();
  if (!e.every((r) => typeof r === Vy))
    throw new TypeError(`Non-string provided as watch path: ${e}`);
  return e.map(ll);
}, Na = (t) => {
  let e = t.replace(jy, $n), r = !1;
  for (e.startsWith(Uy) && (r = !0); e.match(Ma); )
    e = e.replace(Ma, $n);
  return r && (e = $n + e), e;
}, ll = (t) => Na(S.normalize(Na(t))), Pa = (t = "") => (e) => typeof e == "string" ? ll(S.isAbsolute(e) ? e : S.join(t, e)) : e, Jy = (t, e) => S.isAbsolute(t) ? t : S.join(e, t), Qy = Object.freeze(/* @__PURE__ */ new Set());
class Ky {
  constructor(e, r) {
    this.path = e, this._removeWatcher = r, this.items = /* @__PURE__ */ new Set();
  }
  add(e) {
    const { items: r } = this;
    r && e !== cl && e !== zy && r.add(e);
  }
  async remove(e) {
    const { items: r } = this;
    if (!r || (r.delete(e), r.size > 0))
      return;
    const n = this.path;
    try {
      await Wa(n);
    } catch {
      this._removeWatcher && this._removeWatcher(S.dirname(n), S.basename(n));
    }
  }
  has(e) {
    const { items: r } = this;
    if (r)
      return r.has(e);
  }
  getChildren() {
    const { items: e } = this;
    return e ? [...e.values()] : [];
  }
  dispose() {
    this.items.clear(), this.path = "", this._removeWatcher = ri, this.items = Qy, Object.freeze(this);
  }
}
const Xy = "stat", ew = "lstat";
class tw {
  constructor(e, r, n) {
    this.fsw = n;
    const s = e;
    this.path = e = e.replace(qy, ""), this.watchPath = s, this.fullWatchPath = S.resolve(s), this.dirParts = [], this.dirParts.forEach((i) => {
      i.length > 1 && i.pop();
    }), this.followSymlinks = r, this.statMethod = r ? Xy : ew;
  }
  entryPath(e) {
    return S.join(this.watchPath, S.relative(this.watchPath, e.fullPath));
  }
  filterPath(e) {
    const { stats: r } = e;
    if (r && r.isSymbolicLink())
      return this.filterDir(e);
    const n = this.entryPath(e);
    return this.fsw._isntIgnored(n, r) && this.fsw._hasReadPermissions(r);
  }
  filterDir(e) {
    return this.fsw._isntIgnored(this.entryPath(e), e.stats);
  }
}
class fl extends Gl {
  // Not indenting methods for history sake; for now.
  constructor(e = {}) {
    super(), this.closed = !1, this._closers = /* @__PURE__ */ new Map(), this._ignoredPaths = /* @__PURE__ */ new Set(), this._throttled = /* @__PURE__ */ new Map(), this._streams = /* @__PURE__ */ new Set(), this._symlinkPaths = /* @__PURE__ */ new Map(), this._watched = /* @__PURE__ */ new Map(), this._pendingWrites = /* @__PURE__ */ new Map(), this._pendingUnlinks = /* @__PURE__ */ new Map(), this._readyCount = 0, this._readyEmitted = !1;
    const r = e.awaitWriteFinish, n = { stabilityThreshold: 2e3, pollInterval: 100 }, s = {
      // Defaults
      persistent: !0,
      ignoreInitial: !1,
      ignorePermissionErrors: !1,
      interval: 100,
      binaryInterval: 300,
      followSymlinks: !0,
      usePolling: !1,
      // useAsync: false,
      atomic: !0,
      // NOTE: overwritten later (depends on usePolling)
      ...e,
      // Change format
      ignored: e.ignored ? Gr(e.ignored) : Gr([]),
      awaitWriteFinish: r === !0 ? n : typeof r == "object" ? { ...n, ...r } : !1
    };
    xy && (s.usePolling = !0), s.atomic === void 0 && (s.atomic = !s.usePolling);
    const i = process.env.CHOKIDAR_USEPOLLING;
    if (i !== void 0) {
      const u = i.toLowerCase();
      u === "false" || u === "0" ? s.usePolling = !1 : u === "true" || u === "1" ? s.usePolling = !0 : s.usePolling = !!u;
    }
    const a = process.env.CHOKIDAR_INTERVAL;
    a && (s.interval = Number.parseInt(a, 10));
    let o = 0;
    this._emitReady = () => {
      o++, o >= this._readyCount && (this._emitReady = ri, this._readyEmitted = !0, process.nextTick(() => this.emit(q.READY)));
    }, this._emitRaw = (...u) => this.emit(q.RAW, ...u), this._boundRemove = this._remove.bind(this), this.options = s, this._nodeFsHandler = new $y(this), Object.freeze(s);
  }
  _addIgnoredPath(e) {
    if (Un(e)) {
      for (const r of this._ignoredPaths)
        if (Un(r) && r.path === e.path && r.recursive === e.recursive)
          return;
    }
    this._ignoredPaths.add(e);
  }
  _removeIgnoredPath(e) {
    if (this._ignoredPaths.delete(e), typeof e == "string")
      for (const r of this._ignoredPaths)
        Un(r) && r.path === e && this._ignoredPaths.delete(r);
  }
  // Public methods
  /**
   * Adds paths to be watched on an existing FSWatcher instance.
   * @param paths_ file or file list. Other arguments are unused
   */
  add(e, r, n) {
    const { cwd: s } = this.options;
    this.closed = !1, this._closePromise = void 0;
    let i = Ra(e);
    return s && (i = i.map((a) => Jy(a, s))), i.forEach((a) => {
      this._removeIgnoredPath(a);
    }), this._userIgnored = void 0, this._readyCount || (this._readyCount = 0), this._readyCount += i.length, Promise.all(i.map(async (a) => {
      const o = await this._nodeFsHandler._addToNodeFs(a, !n, void 0, 0, r);
      return o && this._emitReady(), o;
    })).then((a) => {
      this.closed || a.forEach((o) => {
        o && this.add(S.dirname(o), S.basename(r || o));
      });
    }), this;
  }
  /**
   * Close watchers or start ignoring events from specified paths.
   */
  unwatch(e) {
    if (this.closed)
      return this;
    const r = Ra(e), { cwd: n } = this.options;
    return r.forEach((s) => {
      !S.isAbsolute(s) && !this._closers.has(s) && (n && (s = S.join(n, s)), s = S.resolve(s)), this._closePath(s), this._addIgnoredPath(s), this._watched.has(s) && this._addIgnoredPath({
        path: s,
        recursive: !0
      }), this._userIgnored = void 0;
    }), this;
  }
  /**
   * Close watchers and remove all listeners from watched paths.
   */
  close() {
    if (this._closePromise)
      return this._closePromise;
    this.closed = !0, this.removeAllListeners();
    const e = [];
    return this._closers.forEach((r) => r.forEach((n) => {
      const s = n();
      s instanceof Promise && e.push(s);
    })), this._streams.forEach((r) => r.destroy()), this._userIgnored = void 0, this._readyCount = 0, this._readyEmitted = !1, this._watched.forEach((r) => r.dispose()), this._closers.clear(), this._watched.clear(), this._streams.clear(), this._symlinkPaths.clear(), this._throttled.clear(), this._closePromise = e.length ? Promise.all(e).then(() => {
    }) : Promise.resolve(), this._closePromise;
  }
  /**
   * Expose list of watched paths
   * @returns for chaining
   */
  getWatched() {
    const e = {};
    return this._watched.forEach((r, n) => {
      const i = (this.options.cwd ? S.relative(this.options.cwd, n) : n) || cl;
      e[i] = r.getChildren().sort();
    }), e;
  }
  emitWithAll(e, r) {
    this.emit(e, ...r), e !== q.ERROR && this.emit(q.ALL, e, ...r);
  }
  // Common helpers
  // --------------
  /**
   * Normalize and emit events.
   * Calling _emit DOES NOT MEAN emit() would be called!
   * @param event Type of event
   * @param path File or directory path
   * @param stats arguments to be passed with event
   * @returns the error if defined, otherwise the value of the FSWatcher instance's `closed` flag
   */
  async _emit(e, r, n) {
    if (this.closed)
      return;
    const s = this.options;
    ol && (r = S.normalize(r)), s.cwd && (r = S.relative(s.cwd, r));
    const i = [r];
    n != null && i.push(n);
    const a = s.awaitWriteFinish;
    let o;
    if (a && (o = this._pendingWrites.get(r)))
      return o.lastChange = /* @__PURE__ */ new Date(), this;
    if (s.atomic) {
      if (e === q.UNLINK)
        return this._pendingUnlinks.set(r, [e, ...i]), setTimeout(() => {
          this._pendingUnlinks.forEach((u, c) => {
            this.emit(...u), this.emit(q.ALL, ...u), this._pendingUnlinks.delete(c);
          });
        }, typeof s.atomic == "number" ? s.atomic : 100), this;
      e === q.ADD && this._pendingUnlinks.has(r) && (e = q.CHANGE, this._pendingUnlinks.delete(r));
    }
    if (a && (e === q.ADD || e === q.CHANGE) && this._readyEmitted) {
      const u = (c, l) => {
        c ? (e = q.ERROR, i[0] = c, this.emitWithAll(e, i)) : l && (i.length > 1 ? i[1] = l : i.push(l), this.emitWithAll(e, i));
      };
      return this._awaitWriteFinish(r, a.stabilityThreshold, e, u), this;
    }
    if (e === q.CHANGE && !this._throttle(q.CHANGE, r, 50))
      return this;
    if (s.alwaysStat && n === void 0 && (e === q.ADD || e === q.ADD_DIR || e === q.CHANGE)) {
      const u = s.cwd ? S.join(s.cwd, r) : r;
      let c;
      try {
        c = await Br(u);
      } catch {
      }
      if (!c || this.closed)
        return;
      i.push(c);
    }
    return this.emitWithAll(e, i), this;
  }
  /**
   * Common handler for errors
   * @returns The error if defined, otherwise the value of the FSWatcher instance's `closed` flag
   */
  _handleError(e) {
    const r = e && e.code;
    return e && r !== "ENOENT" && r !== "ENOTDIR" && (!this.options.ignorePermissionErrors || r !== "EPERM" && r !== "EACCES") && this.emit(q.ERROR, e), e || this.closed;
  }
  /**
   * Helper utility for throttling
   * @param actionType type being throttled
   * @param path being acted upon
   * @param timeout duration of time to suppress duplicate actions
   * @returns tracking object or false if action should be suppressed
   */
  _throttle(e, r, n) {
    this._throttled.has(e) || this._throttled.set(e, /* @__PURE__ */ new Map());
    const s = this._throttled.get(e);
    if (!s)
      throw new Error("invalid throttle");
    const i = s.get(r);
    if (i)
      return i.count++, !1;
    let a;
    const o = () => {
      const c = s.get(r), l = c ? c.count : 0;
      return s.delete(r), clearTimeout(a), c && clearTimeout(c.timeoutObject), l;
    };
    a = setTimeout(o, n);
    const u = { timeoutObject: a, clear: o, count: 0 };
    return s.set(r, u), u;
  }
  _incrReadyCount() {
    return this._readyCount++;
  }
  /**
   * Awaits write operation to finish.
   * Polls a newly created file for size variations. When files size does not change for 'threshold' milliseconds calls callback.
   * @param path being acted upon
   * @param threshold Time in milliseconds a file size must be fixed before acknowledging write OP is finished
   * @param event
   * @param awfEmit Callback to be called when ready for event to be emitted.
   */
  _awaitWriteFinish(e, r, n, s) {
    const i = this.options.awaitWriteFinish;
    if (typeof i != "object")
      return;
    const a = i.pollInterval;
    let o, u = e;
    this.options.cwd && !S.isAbsolute(e) && (u = S.join(this.options.cwd, e));
    const c = /* @__PURE__ */ new Date(), l = this._pendingWrites;
    function f(h) {
      Yl(u, (d, m) => {
        if (d || !l.has(e)) {
          d && d.code !== "ENOENT" && s(d);
          return;
        }
        const k = Number(/* @__PURE__ */ new Date());
        h && m.size !== h.size && (l.get(e).lastChange = k);
        const E = l.get(e);
        k - E.lastChange >= r ? (l.delete(e), s(void 0, m)) : o = setTimeout(f, a, m);
      });
    }
    l.has(e) || (l.set(e, {
      lastChange: c,
      cancelWait: () => (l.delete(e), clearTimeout(o), n)
    }), o = setTimeout(f, a));
  }
  /**
   * Determines whether user has asked to ignore this path.
   */
  _isIgnored(e, r) {
    if (this.options.atomic && Hy.test(e))
      return !0;
    if (!this._userIgnored) {
      const { cwd: n } = this.options, i = (this.options.ignored || []).map(Pa(n)), o = [...[...this._ignoredPaths].map(Pa(n)), ...i];
      this._userIgnored = Yy(o);
    }
    return this._userIgnored(e, r);
  }
  _isntIgnored(e, r) {
    return !this._isIgnored(e, r);
  }
  /**
   * Provides a set of common helpers and properties relating to symlink handling.
   * @param path file or directory pattern being watched
   */
  _getWatchHelpers(e) {
    return new tw(e, this.options.followSymlinks, this);
  }
  // Directory helpers
  // -----------------
  /**
   * Provides directory tracking objects
   * @param directory path of the directory
   */
  _getWatchedDir(e) {
    const r = S.resolve(e);
    return this._watched.has(r) || this._watched.set(r, new Ky(r, this._boundRemove)), this._watched.get(r);
  }
  // File helpers
  // ------------
  /**
   * Check for read permissions: https://stackoverflow.com/a/11781404/1358405
   */
  _hasReadPermissions(e) {
    return this.options.ignorePermissionErrors ? !0 : !!(Number(e.mode) & 256);
  }
  /**
   * Handles emitting unlink events for
   * files and directories, and via recursion, for
   * files and directories within directories that are unlinked
   * @param directory within which the following item is located
   * @param item      base path of item/directory
   */
  _remove(e, r, n) {
    const s = S.join(e, r), i = S.resolve(s);
    if (n = n ?? (this._watched.has(s) || this._watched.has(i)), !this._throttle("remove", s, 100))
      return;
    !n && this._watched.size === 1 && this.add(e, r, !0), this._getWatchedDir(s).getChildren().forEach((h) => this._remove(s, h));
    const u = this._getWatchedDir(e), c = u.has(r);
    u.remove(r), this._symlinkPaths.has(i) && this._symlinkPaths.delete(i);
    let l = s;
    if (this.options.cwd && (l = S.relative(this.options.cwd, s)), this.options.awaitWriteFinish && this._pendingWrites.has(l) && this._pendingWrites.get(l).cancelWait() === q.ADD)
      return;
    this._watched.delete(s), this._watched.delete(i);
    const f = n ? q.UNLINK_DIR : q.UNLINK;
    c && !this._isIgnored(s) && this._emit(f, s), this._closePath(s);
  }
  /**
   * Closes all watchers for a path
   */
  _closePath(e) {
    this._closeFile(e);
    const r = S.dirname(e);
    this._getWatchedDir(r).remove(S.basename(e));
  }
  /**
   * Closes only file-specific watchers
   */
  _closeFile(e) {
    const r = this._closers.get(e);
    r && (r.forEach((n) => n()), this._closers.delete(e));
  }
  _addPathCloser(e, r) {
    if (!r)
      return;
    let n = this._closers.get(e);
    n || (n = [], this._closers.set(e, n)), n.push(r);
  }
  _readdirp(e, r) {
    if (this.closed)
      return;
    const n = { type: q.ALL, alwaysStat: !0, lstat: !0, ...r, depth: 0 };
    let s = Sy(e, n);
    return this._streams.add(s), s.once(Oy, () => {
      s = void 0;
    }), s.once(al, () => {
      s && (this._streams.delete(s), s = void 0);
    }), s;
  }
}
function rw(t, e = {}) {
  const r = new fl(e);
  return r.add(t), r;
}
const nw = { watch: rw, FSWatcher: fl };
class sw {
  constructor() {
    ce(this, "git", null);
    ce(this, "watcher", null);
    ce(this, "workingDirectory", "");
    ce(this, "debounceTimeout", null);
  }
  initializeWatcher() {
    this.watcher && this.watcher.close(), this.watcher = nw.watch(this.workingDirectory, {
      ignored: [
        /(^|[\/\\])\../,
        // 忽略隐藏文件
        "**/node_modules/**",
        "**/.git/**"
      ],
      persistent: !0
    }), this.watcher.on("add", () => this.notifyChanges()).on("change", () => this.notifyChanges()).on("unlink", () => this.notifyChanges()), console.log(`Watching for file changes in ${this.workingDirectory}`);
  }
  async notifyChanges() {
    this.debounceTimeout && clearTimeout(this.debounceTimeout), this.debounceTimeout = setTimeout(async () => {
      const e = await this.getStatus();
      _.emit("git:status-changed", e);
    }, 300);
  }
  dispose() {
    this.watcher && (this.watcher.close(), this.watcher = null), this.debounceTimeout && clearTimeout(this.debounceTimeout);
  }
  async getStatus() {
    if (!this.git)
      return {
        success: !1,
        error: "Git not initialized"
      };
    try {
      const e = await this.git.status([
        "--untracked-files=all",
        "--ignored=no",
        "--porcelain=v1"
      ]), r = e.isClean();
      return {
        success: !0,
        data: {
          current: e.current || "",
          tracking: e.tracking || "",
          ahead: e.ahead,
          behind: e.behind,
          staged: e.staged,
          not_added: e.not_added,
          created: e.created,
          modified: e.modified,
          deleted: e.deleted,
          conflicted: e.conflicted,
          files: e.files,
          isClean: r,
          detached: e.detached
        }
      };
    } catch (e) {
      return console.error("Git status error:", e), {
        success: !1,
        error: "Failed to get status"
      };
    }
  }
  async initialize(e) {
    try {
      this.git = Ln(e);
      const r = await this.git.checkIsRepo();
      if (this.workingDirectory = e, this.initializeWatcher(), !r)
        return {
          success: !1,
          error: "Not a git repository"
        };
      const n = await this.git.status([
        "--untracked-files=all",
        "--ignored=no",
        "--porcelain=v1"
      ]), s = n.isClean();
      return {
        success: !0,
        data: {
          current: n.current || "",
          tracking: n.tracking || "",
          ahead: n.ahead,
          behind: n.behind,
          staged: n.staged,
          not_added: n.not_added,
          created: n.created,
          modified: n.modified,
          deleted: n.deleted,
          conflicted: n.conflicted,
          files: n.files,
          isClean: s,
          detached: n.detached
        }
      };
    } catch (r) {
      return console.error("Git initialization error:", r), {
        success: !1,
        error: "Failed to initialize git"
      };
    }
  }
  async checkIsRepo(e) {
    try {
      return await Ln(e).checkIsRepo();
    } catch (r) {
      return console.error("Failed to check git repository:", r), !1;
    }
  }
  async initRepo(e) {
    try {
      const r = Ln(e);
      return await r.init(), this.git = r, !0;
    } catch (r) {
      return console.error("Failed to initialize repository:", r), !1;
    }
  }
  async add(e) {
    if (!this.git) throw new Error("Git not initialized");
    await this.git.add(e), await this.notifyChanges();
  }
  async stage(e) {
    if (!this.git) throw new Error("Git not initialized");
    return await this.git.add(e);
  }
  async unstage(e) {
    if (!this.git) throw new Error("Git not initialized");
    return await this.git.reset(["--", ...e]);
  }
  async commit(e) {
    if (!this.git) throw new Error("Git not initialized");
    return await this.git.commit(e);
  }
  async stageAll() {
    if (!this.git) throw new Error("Git not initialized");
    await this.git.add(".");
  }
  async unstageAll() {
    if (!this.git)
      return { success: !1, error: "Git not initialized" };
    try {
      return await this.hasCommits() ? await this.git.reset(["HEAD"]) : await this.git.reset(), { success: !0 };
    } catch (e) {
      return console.error("Git unstage all error:", e), { success: !1, error: "Failed to unstage all changes" };
    }
  }
  // 添加辅助方法检查是否有提交
  async hasCommits() {
    try {
      return this.git ? (await this.git.log(["--oneline"])).total > 0 : !1;
    } catch {
      return !1;
    }
  }
  async discardAll() {
    if (!this.git) throw new Error("Git not initialized");
    await this.git.checkout(["--", "."]);
  }
  async getLog() {
    if (!this.git)
      return { success: !1, error: "Git not initialized" };
    try {
      const e = await this.git.log([]), r = e.all.map((n) => ({
        hash: n.hash,
        date: n.date,
        message: n.message,
        refs: n.refs,
        body: n.body,
        author_name: n.author_name,
        author_email: n.author_email
      }));
      return console.log("Commits:", e), {
        success: !0,
        data: { commits: r }
      };
    } catch (e) {
      return console.error("Git log error:", e), {
        success: !1,
        error: "Failed to get commit history"
      };
    }
  }
}
const ge = new sw();
function iw() {
  _.handle("git:initialize", async (t, e) => await ge.initialize(e)), _.handle("git:checkIsRepo", async (t, e) => await ge.checkIsRepo(e)), _.handle("git:init", async (t, e) => await ge.initRepo(e)), _.handle("git:status", async () => await ge.getStatus()), _.handle("git:add", async (t, e) => await ge.add(e)), _.handle("git:stage", async (t, e) => await ge.stage(e)), _.handle("git:unstage", async (t, e) => await ge.unstage(e)), _.handle("git:commit", async (t, e) => await ge.commit(e)), _.handle("git:stageAll", async () => await ge.stageAll()), _.handle("git:unstageAll", async () => await ge.unstageAll()), _.handle("git:discardAll", async () => await ge.discardAll()), _.handle("git:getLog", async () => await ge.getLog());
}
const J = [];
for (let t = 0; t < 256; ++t)
  J.push((t + 256).toString(16).slice(1));
function aw(t, e = 0) {
  return (J[t[e + 0]] + J[t[e + 1]] + J[t[e + 2]] + J[t[e + 3]] + "-" + J[t[e + 4]] + J[t[e + 5]] + "-" + J[t[e + 6]] + J[t[e + 7]] + "-" + J[t[e + 8]] + J[t[e + 9]] + "-" + J[t[e + 10]] + J[t[e + 11]] + J[t[e + 12]] + J[t[e + 13]] + J[t[e + 14]] + J[t[e + 15]]).toLowerCase();
}
const Pr = new Uint8Array(256);
let _r = Pr.length;
function ow() {
  return _r > Pr.length - 16 && (rf(Pr), _r = 0), Pr.slice(_r, _r += 16);
}
const Aa = { randomUUID: nf };
function uw(t, e, r) {
  var s;
  if (Aa.randomUUID && !e && !t)
    return Aa.randomUUID();
  t = t || {};
  const n = t.random ?? ((s = t.rng) == null ? void 0 : s.call(t)) ?? ow();
  if (n.length < 16)
    throw new Error("Random bytes length must be >= 16");
  return n[6] = n[6] & 15 | 64, n[8] = n[8] & 63 | 128, aw(n);
}
const nt = class nt {
  /**
   * 私有构造函数，确保单例模式
   * 初始化存储路径并创建必要的目录结构
   */
  constructor() {
    // 用户数据目录路径
    ce(this, "userDataPath");
    // 用户数据文件路径
    ce(this, "usersFile");
    this.userDataPath = $.join(se.getPath("userData"), "accounts"), this.usersFile = $.join(this.userDataPath, "users.json"), this.initStorage();
  }
  /**
   * 获取 LocalAccountStorageService 的单例实例
   * @returns LocalAccountStorageService 实例
   */
  static getInstance() {
    return nt.instance || (nt.instance = new nt()), nt.instance;
  }
  /**
   * 初始化存储系统
   * 创建必要的目录和文件结构
   */
  async initStorage() {
    try {
      await M.mkdir(this.userDataPath, { recursive: !0 });
      try {
        await M.access(this.usersFile);
      } catch {
        await M.writeFile(this.usersFile, JSON.stringify({}));
      }
    } catch (e) {
      console.error("初始化存储失败:", e);
    }
  }
  /**
   * 读取所有用户数据
   * @returns 包含所有用户信息的对象
   */
  async readUsers() {
    try {
      const e = await M.readFile(this.usersFile, "utf-8");
      return JSON.parse(e);
    } catch {
      return {};
    }
  }
  /**
   * 写入用户数据
   * @param users - 要写入的用户数据对象
   */
  async writeUsers(e) {
    await M.writeFile(this.usersFile, JSON.stringify(e, null, 2));
  }
  /**
   * 创建用户专属目录
   * @param userId - 用户ID
   */
  async createUserDirectory(e) {
    const r = $.join(this.userDataPath, e);
    await M.mkdir(r, { recursive: !0 }), await M.writeFile(
      $.join(r, "config.json"),
      JSON.stringify({ createdAt: (/* @__PURE__ */ new Date()).toISOString() })
    );
  }
  /**
   * 获取用户数据目录路径
   * @param userId 用户ID
   * @returns 用户数据目录的完整路径
   */
  getUserDataPath(e) {
    return $.join(this.userDataPath, e);
  }
  /**
   * 读取用户特定的数据文件
   * @param userId 用户ID
   * @param storeName 存储名称（如 'goals', 'tasks' 等）
   */
  async readUserStore(e, r) {
    try {
      const n = $.join(this.getUserDataPath(e), `${r}.json`), s = await M.readFile(n, "utf-8");
      return JSON.parse(s);
    } catch {
      return null;
    }
  }
  /**
   * 写入用户特定的数据文件
   * @param userId 用户ID
   * @param storeName 存储名称
   * @param data 要存储的数据
   */
  async writeUserStore(e, r, n) {
    const s = this.getUserDataPath(e);
    await M.mkdir(s, { recursive: !0 });
    const i = $.join(s, `${r}.json`);
    await M.writeFile(i, JSON.stringify(n, null, 2));
  }
  /**
   * 迁移用户数据
   * @param fromUserId 源用户ID
   * @param toUserId 目标用户ID
   */
  async migrateUserData(e, r) {
    const n = this.getUserDataPath(e), s = this.getUserDataPath(r);
    try {
      const i = await M.readdir(n);
      await M.mkdir(s, { recursive: !0 });
      for (const a of i) {
        const o = $.join(n, a), u = $.join(s, a);
        await M.copyFile(o, u);
      }
    } catch (i) {
      throw console.error("数据迁移失败:", i), i;
    }
  }
  /**
  * 导出用户数据到指定目录
  * @param userId 用户ID
  * @param exportPath 导出目标文件夹路径
  */
  async exportUserData(e, r) {
    const n = $.join(this.userDataPath, e), s = $.join(r, `user_data_${e}_${Date.now()}`);
    try {
      await M.mkdir(s, { recursive: !0 });
      const i = async (a, o) => {
        const u = await M.readdir(a);
        for (const c of u) {
          const l = $.join(a, c), f = $.join(o, c);
          (await M.stat(l)).isDirectory() ? (await M.mkdir(f, { recursive: !0 }), await i(l, f)) : await M.copyFile(l, f);
        }
      };
      await i(n, s);
    } catch (i) {
      throw console.error("导出用户数据失败:", i), new Error("导出用户数据失败");
    }
  }
  /**
   * 导入用户数据
   * @param userId 用户ID
   * @param importPath 导入源文件夹路径
   */
  async importUserData(e, r) {
    const n = $.join(this.userDataPath, e);
    try {
      await M.mkdir(n, { recursive: !0 });
      const s = async (i, a) => {
        const o = await M.readdir(i);
        for (const u of o) {
          const c = $.join(i, u), l = $.join(a, u);
          (await M.stat(c)).isDirectory() ? (await M.mkdir(l, { recursive: !0 }), await s(c, l)) : await M.copyFile(c, l);
        }
      };
      await s(r, n);
    } catch (s) {
      throw console.error("导入用户数据失败:", s), new Error("导入用户数据失败");
    }
  }
  /**
   * 清除用户数据
   * @param userId 用户ID
   */
  async clearUserData(e) {
    const r = $.join(this.userDataPath, e);
    try {
      await M.rm(r, { recursive: !0, force: !0 }), await M.mkdir(r);
    } catch (n) {
      throw console.error("清除用户数据失败:", n), new Error("清除用户数据失败");
    }
  }
  /**
   * 获取用户数据大小（字节）
   * @param userId 用户ID
   */
  async getUserDataSize(e) {
    const r = $.join(this.userDataPath, e);
    let n = 0;
    async function s(i) {
      const a = await M.readdir(i);
      for (const o of a) {
        const u = $.join(i, o), c = await M.stat(u);
        c.isDirectory() ? await s(u) : n += c.size;
      }
    }
    return await s(r), n;
  }
};
// 单例实例
ce(nt, "instance");
let hs = nt;
const he = hs.getInstance(), st = class st {
  /**
   * 私有构造函数，确保单例模式
   */
  constructor() {
  }
  /**
   * 获取 AuthService 的单例实例
   * @returns AuthService 实例
   */
  static getInstance() {
    return st.instance || (st.instance = new st()), st.instance;
  }
  /**
   * 密码加密方法
   * 使用 SHA-256 算法对密码进行单向加密
   * @param password 原始密码
   * @returns 加密后的密码哈希值
   */
  hashPassword(e) {
    return tf.createHash("sha256").update(e).digest("hex");
  }
  /**
   * 用户注册
   * @param form 注册表单数据，包含用户名、密码和邮箱
   * @returns 注册成功的用户信息（不包含密码）
   * @throws 当用户名已存在或注册过程出错时抛出错误
   */
  async register(e) {
    try {
      const r = await he.readUsers();
      if (r[e.username])
        throw new Error("用户名已存在");
      const n = uw(), s = (/* @__PURE__ */ new Date()).toISOString(), i = {
        id: n,
        username: e.username,
        email: e.email,
        passwordHash: this.hashPassword(e.password),
        createdAt: s,
        updatedAt: s
      };
      r[e.username] = i, await he.writeUsers(r), await he.createUserDirectory(n);
      const { passwordHash: a, ...o } = i;
      return o;
    } catch (r) {
      throw console.error("注册失败:", r), new Error(r instanceof Error ? r.message : "注册失败");
    }
  }
  /**
   * 用户登录
   * @param credentials 登录凭证，包含用户名和密码
   * @returns 登录成功的用户信息（不包含密码）
   * @throws 当用户名或密码错误时抛出错误
   */
  async login(e) {
    const n = (await he.readUsers())[e.username];
    if (!n || n.passwordHash !== this.hashPassword(e.password))
      throw new Error("用户名或密码错误");
    const { passwordHash: s, ...i } = n;
    return i;
  }
  /**
   * 用户登出
   * 目前为本地登出，无需特殊处理
   */
  async logout() {
  }
  /**
   * 检查用户认证状态
   * @returns 当前登录的用户信息，如果未登录则返回 null
   * TODO: 实现持久化存储的认证状态检查
   */
  async checkAuth() {
    return null;
  }
};
// 单例实例
ce(st, "instance");
let ds = st;
const kr = ds.getInstance();
async function cw() {
  _.handle("auth:register", async (t, e) => {
    try {
      return { success: !0, user: await kr.register(e) };
    } catch (r) {
      return { success: !1, message: r instanceof Error ? r.message : "An unknown error occurred" };
    }
  }), _.handle("auth:login", async (t, e) => {
    try {
      return { success: !0, user: await kr.login(e) };
    } catch (r) {
      return { success: !1, message: r instanceof Error ? r.message : "An unknown error occurred" };
    }
  }), _.handle("auth:logout", async () => {
    try {
      return await kr.logout(), { success: !0 };
    } catch (t) {
      return { success: !1, message: t instanceof Error ? t.message : "An unknown error occurred" };
    }
  }), _.handle("auth:check", async () => {
    try {
      return { success: !0, user: await kr.checkAuth() };
    } catch (t) {
      return { success: !1, message: t instanceof Error ? t.message : "An unknown error occurred" };
    }
  });
}
function lw() {
  _.handle("userStore:read", async (t, e, r) => {
    try {
      return await he.readUserStore(e, r);
    } catch (n) {
      throw console.error(`读取用户存储失败 (${r}):`, n), n instanceof Error ? new Error(`读取用户数据失败: ${n.message}`) : new Error("读取用户数据失败: 未知错误");
    }
  }), _.handle("userStore-write", async (t, e, r, n) => {
    try {
      await he.writeUserStore(e, r, n);
    } catch (s) {
      throw console.error(`写入用户存储失败 (${r}):`, s), s instanceof Error ? new Error(`读取用户数据失败: ${s.message}`) : new Error("读取用户数据失败: 未知错误");
    }
  }), _.handle("userStore:migrate", async (t, e, r) => {
    try {
      await he.migrateUserData(e, r);
    } catch (n) {
      throw console.error("迁移用户数据失败:", n), n instanceof Error ? new Error(`读取用户数据失败: ${n.message}`) : new Error("读取用户数据失败: 未知错误");
    }
  }), _.handle("userStore:getPath", (t, e) => {
    try {
      return he.getUserDataPath(e);
    } catch (r) {
      throw console.error("获取用户数据路径失败:", r), r instanceof Error ? new Error(`读取用户数据失败: ${r.message}`) : new Error("读取用户数据失败: 未知错误");
    }
  }), _.handle("userStore:createDirectory", async (t, e) => {
    try {
      await he.createUserDirectory(e);
    } catch (r) {
      throw console.error("创建用户目录失败:", r), r instanceof Error ? new Error(`读取用户数据失败: ${r.message}`) : new Error("读取用户数据失败: 未知错误");
    }
  }), _.handle("userStore:export", async (t, e) => {
    try {
      const { filePaths: r } = await jt.showOpenDialog({
        properties: ["openDirectory", "createDirectory"],
        title: "选择导出目录",
        buttonLabel: "导出到此处"
      });
      return r.length > 0 ? (await he.exportUserData(e, r[0]), { success: !0, path: r[0] }) : { success: !1, reason: "cancelled" };
    } catch (r) {
      return console.error("导出用户数据失败:", r), {
        success: !1,
        error: r instanceof Error ? r.message : "未知错误"
      };
    }
  }), _.handle("userStore:import", async (t, e) => {
    try {
      const { filePaths: r } = await jt.showOpenDialog({
        properties: ["openDirectory"],
        title: "选择导入目录",
        buttonLabel: "从此处导入"
      });
      return r.length > 0 ? (await he.importUserData(e, r[0]), { success: !0 }) : { success: !1, reason: "cancelled" };
    } catch (r) {
      return console.error("导入用户数据失败:", r), {
        success: !1,
        error: r instanceof Error ? r.message : "未知错误"
      };
    }
  }), _.handle("userData:clear", async (t, e) => {
    try {
      return await he.clearUserData(e), { success: !0 };
    } catch (r) {
      return console.error("清除用户数据失败:", r), { success: !1, error: r instanceof Error ? r.message : "未知错误" };
    }
  }), _.handle("userData:getSize", async (t, e) => {
    try {
      return { success: !0, size: await he.getUserDataSize(e) };
    } catch (r) {
      return console.error("获取用户数据大小失败:", r), { success: !1, error: r instanceof Error ? r.message : "未知错误" };
    }
  });
}
se.setName("DailyUse");
const fw = Pe.dirname(Wl(import.meta.url));
process.env.APP_ROOT = Pe.join(fw, "..");
const Zt = process.env.VITE_DEV_SERVER_URL, hn = Pe.join(process.env.APP_ROOT, "dist-electron"), ur = Pe.join(process.env.APP_ROOT, "dist");
process.env.MAIN_DIST = hn;
process.env.RENDERER_DIST = ur;
process.env.VITE_PUBLIC = Zt ? Pe.join(process.env.APP_ROOT, "public") : ur;
let A, Tr = null, zn = null;
function ms() {
  A = new Yt({
    frame: !1,
    icon: Pe.join(process.env.VITE_PUBLIC, "DailyUse.svg"),
    webPreferences: {
      nodeIntegration: !0,
      contextIsolation: !0,
      webSecurity: !0,
      preload: Pe.join(hn, "main_preload.mjs"),
      additionalArguments: ["--enable-features=SharedArrayBuffer"],
      allowRunningInsecureContent: !1
    },
    width: 1400,
    height: 800
  }), A.webContents.openDevTools();
  const t = {
    "default-src": ["'self'", "local:"],
    "script-src": ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "local:"]
  };
  A.webContents.session.webRequest.onHeadersReceived((e, r) => {
    const n = Object.entries(t).map(([s, i]) => `${s} ${i.join(" ")}`).join("; ");
    r({
      responseHeaders: {
        ...e.responseHeaders,
        "Content-Security-Policy": [n]
      }
    });
  }), zn = new sf(), A && (zn.register(new af()), zn.initializeAll()), Zt ? A.loadURL(Zt) : A.loadFile(Pe.join(ur, "index.html")), A.setMinimumSize(800, 600), hw(A), A.on("close", (e) => (se.isQuitting || (e.preventDefault(), A == null || A.hide()), !1));
}
function hw(t) {
  const e = Pl.createFromPath(La(process.env.VITE_PUBLIC, "DailyUse-16.png"));
  Tr = new Al(e), Tr.setToolTip("DailyUse");
  const r = Ll.buildFromTemplate([
    {
      label: "显示主窗口",
      click: () => {
        t.show();
      }
    },
    {
      label: "设置",
      click: () => {
        t.show(), t.webContents.send("navigate-to", "/setting");
      }
    },
    { type: "separator" },
    {
      label: "退出",
      click: () => {
        se.quit();
      }
    }
  ]);
  Tr.setContextMenu(r), Tr.on("click", () => {
    t.show();
  });
}
se.on("window-all-closed", () => {
  process.platform !== "darwin" && (se.quit(), A = null);
});
se.on("activate", () => {
  Yt.getAllWindows().length === 0 && ms();
});
se.whenReady().then(() => {
  ms(), of(), iw(), cw(), lw(), A && (cf(A, hn, ur, Zt), tm()), Nl.registerFileProtocol("local", (t, e) => {
    const r = t.url.replace("local://", "");
    try {
      return e(decodeURIComponent(r));
    } catch (n) {
      console.error(n);
    }
  }), se.on("activate", () => {
    Yt.getAllWindows().length === 0 && ms();
  });
});
_.handle("readClipboard", () => Ar.readText());
_.handle("writeClipboard", (t, e) => {
  Ar.writeText(e);
});
_.handle("readClipboardFiles", () => Ar.availableFormats().includes("FileNameW") ? Ar.read("FileNameW").split("\0").filter(Boolean) : []);
_.on("window-control", (t, e) => {
  switch (e) {
    case "minimize":
      A == null || A.minimize();
      break;
    case "maximize":
      A != null && A.isMaximized() ? A == null || A.unmaximize() : A == null || A.maximize();
      break;
    case "close":
      A == null || A.close();
      break;
  }
});
_.handle("open-external-url", async (t, e) => {
  try {
    await yt.openExternal(e);
  } catch (r) {
    console.error("Failed to open URL:", r);
  }
});
_.handle("get-auto-launch", () => se.getLoginItemSettings().openAtLogin);
_.handle("set-auto-launch", (t, e) => (process.platform === "win32" && se.setLoginItemSettings({
  openAtLogin: e,
  path: process.execPath
}), se.getLoginItemSettings().openAtLogin));
se.on("before-quit", () => {
  se.isQuitting = !0;
});
export {
  hn as MAIN_DIST,
  ur as RENDERER_DIST,
  Zt as VITE_DEV_SERVER_URL
};
