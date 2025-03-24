var kl = Object.defineProperty;
var Tl = (t, e, r) => e in t ? kl(t, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : t[e] = r;
var Ie = (t, e, r) => Tl(t, typeof e != "symbol" ? e + "" : e, r);
import { BrowserWindow as qt, ipcMain as S, dialog as Nn, app as se, shell as dt, globalShortcut as Ys, screen as bl, protocol as Sl, clipboard as Dr, nativeImage as Ol, Tray as El, Menu as Cl } from "electron";
import { fileURLToPath as Dl } from "node:url";
import Re from "node:path";
import * as b from "path";
import Fe, { resolve as Js, join as Ca, relative as Il, sep as xl } from "path";
import { exec as Ml, spawn as Fl } from "child_process";
import ye, { readdir as Da, realpath as gr, lstat as An, stat as $r, open as Rl } from "fs/promises";
import { Buffer as Nl } from "buffer";
import Al, { EventEmitter as Ll } from "events";
import Ia, { unwatchFile as Qs, watchFile as Pl, watch as Wl, stat as $l } from "fs";
import xa from "tty";
import zl from "util";
import Vl, { type as Ul } from "os";
import { EventEmitter as jl } from "node:events";
import { Readable as ql } from "stream";
class Hl {
  constructor() {
    Ie(this, "plugins", /* @__PURE__ */ new Map());
    Ie(this, "initialized", !1);
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
class Gl {
  constructor() {
    Ie(this, "metadata", {
      name: "quickLauncher",
      version: "1.0.0",
      description: "Quick application launcher with shortcuts",
      author: "bakersean"
    });
    Ie(this, "quickLauncherWindow", null);
  }
  createQuickLauncherWindow() {
    if (this.quickLauncherWindow) {
      this.quickLauncherWindow.isVisible() ? this.quickLauncherWindow.hide() : (this.quickLauncherWindow.show(), this.quickLauncherWindow.focus());
      return;
    }
    const e = Fe.resolve(nn, "quickLauncher_preload.mjs");
    this.quickLauncherWindow = new qt({
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
    }), jt ? this.quickLauncherWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/src/plugins/quickLauncher/index.html`) : this.quickLauncherWindow.loadFile(
      Fe.join(nr, "src/plugins/quickLauncher/index.html")
    ), this.quickLauncherWindow.on("closed", () => {
      this.quickLauncherWindow = null;
    });
  }
  async init() {
    this.registerIpcHandlers(), this.registerShortcuts();
  }
  registerIpcHandlers() {
    S.handle("launch-application", async (e, r) => new Promise((n, s) => {
      const i = { windowsHide: !1 };
      Ml(`start "" "${r}"`, i, (a) => {
        a ? (console.error("[QuickLauncherMain] 启动应用失败:", a), s(a)) : (console.log("[QuickLauncherMain] 启动应用成功"), n(!0));
      });
    })), S.handle("select-file", async () => await Nn.showOpenDialog({
      properties: ["openFile"]
    })), S.handle("get-file-icon", async (e, r) => {
      try {
        return (await se.getFileIcon(r, {
          size: "large"
          // 可选值: 'small', 'normal', 'large'
        })).toDataURL();
      } catch (n) {
        return console.error("获取文件图标失败:", n), null;
      }
    }), S.handle("get-link-file-target-path", async (e, r) => {
      try {
        const n = Fe.win32.normalize(r);
        return dt.readShortcutLink(n).target;
      } catch (n) {
        return console.error("Failed to read shortcut target path:", n), "";
      }
    }), S.handle("reveal-in-explorer", async (e, r) => {
      try {
        return dt.showItemInFolder(r), !0;
      } catch (n) {
        return console.error("Failed to reveal in explorer:", n), !1;
      }
    }), S.handle("hide-window", async () => {
      var e;
      try {
        return (e = this.quickLauncherWindow) == null || e.hide(), !0;
      } catch (r) {
        return console.error("failed to hide window", r), !1;
      }
    });
  }
  registerShortcuts() {
    Ys.register("Alt+Space", () => {
      this.quickLauncherWindow ? this.quickLauncherWindow.isVisible() ? this.quickLauncherWindow.hide() : (this.quickLauncherWindow.show(), this.quickLauncherWindow.focus()) : this.createQuickLauncherWindow();
    });
  }
  async destroy() {
    Ys.unregister("Alt+Space"), S.removeHandler("launch-application"), S.removeHandler("select-file"), this.quickLauncherWindow && (this.quickLauncherWindow.close(), this.quickLauncherWindow = null);
  }
}
function Bl() {
  S.handle("open-file-explorer", async () => {
    dt.openPath(Fe.join(__dirname, "..", "..", "..", "src"));
  }), S.handle("read-folder", async (e, r) => {
    try {
      return (await ye.readdir(r, { withFileTypes: !0 })).map((s) => ({
        name: s.name,
        path: Fe.join(r, s.name),
        isDirectory: s.isDirectory(),
        key: Fe.join(r, s.name)
      }));
    } catch (n) {
      throw console.error("Error reading folder:", n), n;
    }
  }), S.handle("select-folder", async () => {
    const e = await Nn.showOpenDialog({
      properties: ["openDirectory"]
    });
    if (e.canceled)
      return null;
    {
      const r = e.filePaths[0], n = await ye.readdir(r).then(
        (s) => Promise.all(
          s.map(async (i) => {
            const a = Fe.join(r, i), o = await ye.lstat(a);
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
  }), S.handle("file-or-folder-exists", async (e, r) => {
    try {
      return await ye.access(r), !0;
    } catch {
      return !1;
    }
  }), S.handle("create-folder", async (e, r) => {
    await ye.mkdir(r, { recursive: !0 });
  }), S.handle("create-file", async (e, r, n = "") => {
    await ye.writeFile(r, n, "utf8");
  }), S.handle("rename-file-or-folder", async (e, r, n) => {
    try {
      if (await ye.access(n).then(() => !0).catch(() => !1)) {
        const { response: i } = await Nn.showMessageBox({
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
      return await ye.rename(r, n), !0;
    } catch (s) {
      throw console.error("Rename error:", s), s;
    }
  }), S.handle("delete-file-or-folder", async (e, r, n) => {
    n ? await dt.trashItem(r) : await dt.trashItem(r);
  }), S.handle("read-file", async (e, r, n = "utf-8") => {
    try {
      return await ye.readFile(r, n);
    } catch (s) {
      throw console.error("读取文件失败:", s), s;
    }
  }), S.handle("write-file", async (e, r, n, s) => {
    try {
      const i = {
        encoding: s ?? (typeof n == "string" ? "utf-8" : null),
        flag: "w"
      };
      await ye.writeFile(r, n, i);
    } catch (i) {
      throw console.error("写入文件失败:", i), i;
    }
  }), S.handle("get-folder-tree", async (e, r) => await t(r));
  async function t(e) {
    try {
      const r = await ye.readdir(e, { withFileTypes: !0 });
      return (await Promise.all(
        r.map(async (s) => {
          const i = Fe.join(e, s.name), a = s.isDirectory() ? "directory" : Fe.extname(s.name).slice(1) || "file";
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
  S.handle("refresh-folder", async (e, r) => ({ folderTreeData: await t(r), folderPath: r })), S.handle("arrayBuffer-to-buffer", async (e, r) => Nl.from(r));
}
const Me = /* @__PURE__ */ new Map(), Ma = 620, as = 920, Nt = 10;
function Zl() {
  const t = bl.getPrimaryDisplay(), { width: e } = t.workAreaSize, r = e - Ma - Nt, n = Nt + Me.size * (as + Nt);
  return { x: r, y: n };
}
function Ks() {
  let t = 0;
  for (const [, e] of Me) {
    const r = Nt + t * (as + Nt);
    e.setPosition(e.getPosition()[0], r), t++;
  }
}
function Yl(t, e, r, n) {
  S.handle("show-notification", async (s, i) => {
    if (!t)
      return;
    if (Me.has(i.id)) {
      const f = Me.get(i.id);
      f == null || f.close(), Me.delete(i.id), Ks();
    }
    const { x: a, y: o } = Zl(), u = new qt({
      width: Ma,
      height: as,
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
        preload: Re.join(e, "main_preload.mjs"),
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
    }), Me.set(i.id, u), u.on("closed", () => {
      Me.delete(i.id), Ks();
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
  }), S.on("close-notification", (s, i) => {
    const a = Me.get(i);
    a && !a.isDestroyed() && a.close();
  }), S.on("notification-action", (s, i, a) => {
    const o = Me.get(i);
    if (o && !o.isDestroyed()) {
      const u = {
        text: a.text,
        type: a.type
      };
      (a.type === "confirm" || a.type === "cancel") && o.close(), t.webContents.send("notification-action-received", i, u);
    }
  });
}
var Xs = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Fa(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
var ce = {};
Object.defineProperty(ce, "__esModule", { value: !0 });
class it extends Error {
}
class Jl extends it {
  constructor(e) {
    super(`Invalid DateTime: ${e.toMessage()}`);
  }
}
class Ql extends it {
  constructor(e) {
    super(`Invalid Interval: ${e.toMessage()}`);
  }
}
class Kl extends it {
  constructor(e) {
    super(`Invalid Duration: ${e.toMessage()}`);
  }
}
class ft extends it {
}
class Ra extends it {
  constructor(e) {
    super(`Invalid unit ${e}`);
  }
}
class Y extends it {
}
class We extends it {
  constructor() {
    super("Zone is an abstract class");
  }
}
const y = "numeric", Te = "short", ue = "long", Ir = {
  year: y,
  month: y,
  day: y
}, Na = {
  year: y,
  month: Te,
  day: y
}, Xl = {
  year: y,
  month: Te,
  day: y,
  weekday: Te
}, Aa = {
  year: y,
  month: ue,
  day: y
}, La = {
  year: y,
  month: ue,
  day: y,
  weekday: ue
}, Pa = {
  hour: y,
  minute: y
}, Wa = {
  hour: y,
  minute: y,
  second: y
}, $a = {
  hour: y,
  minute: y,
  second: y,
  timeZoneName: Te
}, za = {
  hour: y,
  minute: y,
  second: y,
  timeZoneName: ue
}, Va = {
  hour: y,
  minute: y,
  hourCycle: "h23"
}, Ua = {
  hour: y,
  minute: y,
  second: y,
  hourCycle: "h23"
}, ja = {
  hour: y,
  minute: y,
  second: y,
  hourCycle: "h23",
  timeZoneName: Te
}, qa = {
  hour: y,
  minute: y,
  second: y,
  hourCycle: "h23",
  timeZoneName: ue
}, Ha = {
  year: y,
  month: y,
  day: y,
  hour: y,
  minute: y
}, Ga = {
  year: y,
  month: y,
  day: y,
  hour: y,
  minute: y,
  second: y
}, Ba = {
  year: y,
  month: Te,
  day: y,
  hour: y,
  minute: y
}, Za = {
  year: y,
  month: Te,
  day: y,
  hour: y,
  minute: y,
  second: y
}, ef = {
  year: y,
  month: Te,
  day: y,
  weekday: Te,
  hour: y,
  minute: y
}, Ya = {
  year: y,
  month: ue,
  day: y,
  hour: y,
  minute: y,
  timeZoneName: Te
}, Ja = {
  year: y,
  month: ue,
  day: y,
  hour: y,
  minute: y,
  second: y,
  timeZoneName: Te
}, Qa = {
  year: y,
  month: ue,
  day: y,
  weekday: ue,
  hour: y,
  minute: y,
  timeZoneName: ue
}, Ka = {
  year: y,
  month: ue,
  day: y,
  weekday: ue,
  hour: y,
  minute: y,
  second: y,
  timeZoneName: ue
};
class _t {
  /**
   * The type of zone
   * @abstract
   * @type {string}
   */
  get type() {
    throw new We();
  }
  /**
   * The name of this zone.
   * @abstract
   * @type {string}
   */
  get name() {
    throw new We();
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
    throw new We();
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
    throw new We();
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
    throw new We();
  }
  /**
   * Return the offset in minutes for this zone at the specified timestamp.
   * @abstract
   * @param {number} ts - Epoch milliseconds for which to compute the offset
   * @return {number}
   */
  offset(e) {
    throw new We();
  }
  /**
   * Return whether this Zone is equal to another zone
   * @abstract
   * @param {Zone} otherZone - the zone to compare
   * @return {boolean}
   */
  equals(e) {
    throw new We();
  }
  /**
   * Return whether this Zone is valid.
   * @abstract
   * @type {boolean}
   */
  get isValid() {
    throw new We();
  }
}
let on = null;
class Ht extends _t {
  /**
   * Get a singleton instance of the local zone
   * @return {SystemZone}
   */
  static get instance() {
    return on === null && (on = new Ht()), on;
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
    return uo(e, r, n);
  }
  /** @override **/
  formatOffset(e, r) {
    return At(this.offset(e), r);
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
let yr = {};
function tf(t) {
  return yr[t] || (yr[t] = new Intl.DateTimeFormat("en-US", {
    hour12: !1,
    timeZone: t,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    era: "short"
  })), yr[t];
}
const rf = {
  year: 0,
  month: 1,
  day: 2,
  era: 3,
  hour: 4,
  minute: 5,
  second: 6
};
function nf(t, e) {
  const r = t.format(e).replace(/\u200E/g, ""), n = /(\d+)\/(\d+)\/(\d+) (AD|BC),? (\d+):(\d+):(\d+)/.exec(r), [, s, i, a, o, u, c, l] = n;
  return [a, s, i, o, u, c, l];
}
function sf(t, e) {
  const r = t.formatToParts(e), n = [];
  for (let s = 0; s < r.length; s++) {
    const {
      type: i,
      value: a
    } = r[s], o = rf[i];
    i === "era" ? n[o] = a : C(o) || (n[o] = parseInt(a, 10));
  }
  return n;
}
let ir = {};
class Oe extends _t {
  /**
   * @param {string} name - Zone name
   * @return {IANAZone}
   */
  static create(e) {
    return ir[e] || (ir[e] = new Oe(e)), ir[e];
  }
  /**
   * Reset local caches. Should only be necessary in testing scenarios.
   * @return {void}
   */
  static resetCache() {
    ir = {}, yr = {};
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
    super(), this.zoneName = e, this.valid = Oe.isValidZone(e);
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
    return uo(e, r, n, this.name);
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
    return At(this.offset(e), r);
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
    const n = tf(this.name);
    let [s, i, a, o, u, c, l] = n.formatToParts ? sf(n, r) : nf(n, r);
    o === "BC" && (s = -Math.abs(s) + 1);
    const h = Vr({
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
let ei = {};
function af(t, e = {}) {
  const r = JSON.stringify([t, e]);
  let n = ei[r];
  return n || (n = new Intl.ListFormat(t, e), ei[r] = n), n;
}
let Ln = {};
function Pn(t, e = {}) {
  const r = JSON.stringify([t, e]);
  let n = Ln[r];
  return n || (n = new Intl.DateTimeFormat(t, e), Ln[r] = n), n;
}
let Wn = {};
function of(t, e = {}) {
  const r = JSON.stringify([t, e]);
  let n = Wn[r];
  return n || (n = new Intl.NumberFormat(t, e), Wn[r] = n), n;
}
let $n = {};
function uf(t, e = {}) {
  const {
    base: r,
    ...n
  } = e, s = JSON.stringify([t, n]);
  let i = $n[s];
  return i || (i = new Intl.RelativeTimeFormat(t, e), $n[s] = i), i;
}
let xt = null;
function cf() {
  return xt || (xt = new Intl.DateTimeFormat().resolvedOptions().locale, xt);
}
let ti = {};
function lf(t) {
  let e = ti[t];
  if (!e) {
    const r = new Intl.Locale(t);
    e = "getWeekInfo" in r ? r.getWeekInfo() : r.weekInfo, ti[t] = e;
  }
  return e;
}
function ff(t) {
  const e = t.indexOf("-x-");
  e !== -1 && (t = t.substring(0, e));
  const r = t.indexOf("-u-");
  if (r === -1)
    return [t];
  {
    let n, s;
    try {
      n = Pn(t).resolvedOptions(), s = t;
    } catch {
      const u = t.substring(0, r);
      n = Pn(u).resolvedOptions(), s = u;
    }
    const {
      numberingSystem: i,
      calendar: a
    } = n;
    return [s, i, a];
  }
}
function hf(t, e, r) {
  return (r || e) && (t.includes("-u-") || (t += "-u"), r && (t += `-ca-${r}`), e && (t += `-nu-${e}`)), t;
}
function df(t) {
  const e = [];
  for (let r = 1; r <= 12; r++) {
    const n = E.utc(2009, r, 1);
    e.push(t(n));
  }
  return e;
}
function mf(t) {
  const e = [];
  for (let r = 1; r <= 7; r++) {
    const n = E.utc(2016, 11, 13 + r);
    e.push(t(n));
  }
  return e;
}
function ar(t, e, r, n) {
  const s = t.listingMode();
  return s === "error" ? null : s === "en" ? r(e) : n(e);
}
function pf(t) {
  return t.numberingSystem && t.numberingSystem !== "latn" ? !1 : t.numberingSystem === "latn" || !t.locale || t.locale.startsWith("en") || new Intl.DateTimeFormat(t.intl).resolvedOptions().numberingSystem === "latn";
}
class gf {
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
      n.padTo > 0 && (o.minimumIntegerDigits = n.padTo), this.inf = of(e, o);
    }
  }
  format(e) {
    if (this.inf) {
      const r = this.floor ? Math.floor(e) : e;
      return this.inf.format(r);
    } else {
      const r = this.floor ? Math.floor(e) : fs(e, 3);
      return B(r, this.padTo);
    }
  }
}
class yf {
  constructor(e, r, n) {
    this.opts = n, this.originalZone = void 0;
    let s;
    if (this.opts.timeZone)
      this.dt = e;
    else if (e.zone.type === "fixed") {
      const a = -1 * (e.offset / 60), o = a >= 0 ? `Etc/GMT+${a}` : `Etc/GMT${a}`;
      e.offset !== 0 && Oe.create(o).valid ? (s = o, this.dt = e) : (s = "UTC", this.dt = e.offset === 0 ? e : e.setZone("UTC").plus({
        minutes: e.offset
      }), this.originalZone = e.zone);
    } else e.zone.type === "system" ? this.dt = e : e.zone.type === "iana" ? (this.dt = e, s = e.zone.name) : (s = "UTC", this.dt = e.setZone("UTC").plus({
      minutes: e.offset
    }), this.originalZone = e.zone);
    const i = {
      ...this.opts
    };
    i.timeZone = i.timeZone || s, this.dtf = Pn(r, i);
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
class wf {
  constructor(e, r, n) {
    this.opts = {
      style: "long",
      ...n
    }, !r && ao() && (this.rtf = uf(e, n));
  }
  format(e, r) {
    return this.rtf ? this.rtf.format(e, r) : zf(r, e, this.opts.numeric, this.opts.style !== "long");
  }
  formatToParts(e, r) {
    return this.rtf ? this.rtf.formatToParts(e, r) : [];
  }
}
const vf = {
  firstDay: 1,
  minimalDays: 4,
  weekend: [6, 7]
};
class A {
  static fromOpts(e) {
    return A.create(e.locale, e.numberingSystem, e.outputCalendar, e.weekSettings, e.defaultToEN);
  }
  static create(e, r, n, s, i = !1) {
    const a = e || V.defaultLocale, o = a || (i ? "en-US" : cf()), u = r || V.defaultNumberingSystem, c = n || V.defaultOutputCalendar, l = zn(s) || V.defaultWeekSettings;
    return new A(o, u, c, l, a);
  }
  static resetCache() {
    xt = null, Ln = {}, Wn = {}, $n = {};
  }
  static fromObject({
    locale: e,
    numberingSystem: r,
    outputCalendar: n,
    weekSettings: s
  } = {}) {
    return A.create(e, r, n, s);
  }
  constructor(e, r, n, s, i) {
    const [a, o, u] = ff(e);
    this.locale = a, this.numberingSystem = r || o || null, this.outputCalendar = n || u || null, this.weekSettings = s, this.intl = hf(this.locale, this.numberingSystem, this.outputCalendar), this.weekdaysCache = {
      format: {},
      standalone: {}
    }, this.monthsCache = {
      format: {},
      standalone: {}
    }, this.meridiemCache = null, this.eraCache = {}, this.specifiedLocale = i, this.fastNumbersCached = null;
  }
  get fastNumbers() {
    return this.fastNumbersCached == null && (this.fastNumbersCached = pf(this)), this.fastNumbersCached;
  }
  listingMode() {
    const e = this.isEnglish(), r = (this.numberingSystem === null || this.numberingSystem === "latn") && (this.outputCalendar === null || this.outputCalendar === "gregory");
    return e && r ? "en" : "intl";
  }
  clone(e) {
    return !e || Object.getOwnPropertyNames(e).length === 0 ? this : A.create(e.locale || this.specifiedLocale, e.numberingSystem || this.numberingSystem, e.outputCalendar || this.outputCalendar, zn(e.weekSettings) || this.weekSettings, e.defaultToEN || !1);
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
    return ar(this, e, fo, () => {
      const n = r ? {
        month: e,
        day: "numeric"
      } : {
        month: e
      }, s = r ? "format" : "standalone";
      return this.monthsCache[s][e] || (this.monthsCache[s][e] = df((i) => this.extract(i, n, "month"))), this.monthsCache[s][e];
    });
  }
  weekdays(e, r = !1) {
    return ar(this, e, po, () => {
      const n = r ? {
        weekday: e,
        year: "numeric",
        month: "long",
        day: "numeric"
      } : {
        weekday: e
      }, s = r ? "format" : "standalone";
      return this.weekdaysCache[s][e] || (this.weekdaysCache[s][e] = mf((i) => this.extract(i, n, "weekday"))), this.weekdaysCache[s][e];
    });
  }
  meridiems() {
    return ar(this, void 0, () => go, () => {
      if (!this.meridiemCache) {
        const e = {
          hour: "numeric",
          hourCycle: "h12"
        };
        this.meridiemCache = [E.utc(2016, 11, 13, 9), E.utc(2016, 11, 13, 19)].map((r) => this.extract(r, e, "dayperiod"));
      }
      return this.meridiemCache;
    });
  }
  eras(e) {
    return ar(this, e, yo, () => {
      const r = {
        era: e
      };
      return this.eraCache[e] || (this.eraCache[e] = [E.utc(-40, 1, 1), E.utc(2017, 1, 1)].map((n) => this.extract(n, r, "era"))), this.eraCache[e];
    });
  }
  extract(e, r, n) {
    const s = this.dtFormatter(e, r), i = s.formatToParts(), a = i.find((o) => o.type.toLowerCase() === n);
    return a ? a.value : null;
  }
  numberFormatter(e = {}) {
    return new gf(this.intl, e.forceSimple || this.fastNumbers, e);
  }
  dtFormatter(e, r = {}) {
    return new yf(e, this.intl, r);
  }
  relFormatter(e = {}) {
    return new wf(this.intl, this.isEnglish(), e);
  }
  listFormatter(e = {}) {
    return af(this.intl, e);
  }
  isEnglish() {
    return this.locale === "en" || this.locale.toLowerCase() === "en-us" || new Intl.DateTimeFormat(this.intl).resolvedOptions().locale.startsWith("en-us");
  }
  getWeekSettings() {
    return this.weekSettings ? this.weekSettings : oo() ? lf(this.locale) : vf;
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
let un = null;
class Q extends _t {
  /**
   * Get a singleton instance of UTC
   * @return {FixedOffsetZone}
   */
  static get utcInstance() {
    return un === null && (un = new Q(0)), un;
  }
  /**
   * Get an instance with a specified offset
   * @param {number} offset - The offset in minutes
   * @return {FixedOffsetZone}
   */
  static instance(e) {
    return e === 0 ? Q.utcInstance : new Q(e);
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
        return new Q(Ur(r[1], r[2]));
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
    return this.fixed === 0 ? "UTC" : `UTC${At(this.fixed, "narrow")}`;
  }
  /**
   * The IANA name of this zone, i.e. `Etc/UTC` or `Etc/GMT+/-nn`
   *
   * @override
   * @type {string}
   */
  get ianaName() {
    return this.fixed === 0 ? "Etc/UTC" : `Etc/GMT${At(-this.fixed, "narrow")}`;
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
    return At(this.fixed, r);
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
class Xa extends _t {
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
function Ue(t, e) {
  if (C(t) || t === null)
    return e;
  if (t instanceof _t)
    return t;
  if (Of(t)) {
    const r = t.toLowerCase();
    return r === "default" ? e : r === "local" || r === "system" ? Ht.instance : r === "utc" || r === "gmt" ? Q.utcInstance : Q.parseSpecifier(r) || Oe.create(t);
  } else return je(t) ? Q.instance(t) : typeof t == "object" && "offset" in t && typeof t.offset == "function" ? t : new Xa(t);
}
const os = {
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
}, ri = {
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
}, _f = os.hanidec.replace(/[\[|\]]/g, "").split("");
function kf(t) {
  let e = parseInt(t, 10);
  if (isNaN(e)) {
    e = "";
    for (let r = 0; r < t.length; r++) {
      const n = t.charCodeAt(r);
      if (t[r].search(os.hanidec) !== -1)
        e += _f.indexOf(t[r]);
      else
        for (const s in ri) {
          const [i, a] = ri[s];
          n >= i && n <= a && (e += n - i);
        }
    }
    return parseInt(e, 10);
  } else
    return e;
}
let lt = {};
function Tf() {
  lt = {};
}
function we({
  numberingSystem: t
}, e = "") {
  const r = t || "latn";
  return lt[r] || (lt[r] = {}), lt[r][e] || (lt[r][e] = new RegExp(`${os[r]}${e}`)), lt[r][e];
}
let ni = () => Date.now(), si = "system", ii = null, ai = null, oi = null, ui = 60, ci, li = null;
class V {
  /**
   * Get the callback for returning the current timestamp.
   * @type {function}
   */
  static get now() {
    return ni;
  }
  /**
   * Set the callback for returning the current timestamp.
   * The function should return a number, which will be interpreted as an Epoch millisecond count
   * @type {function}
   * @example Settings.now = () => Date.now() + 3000 // pretend it is 3 seconds in the future
   * @example Settings.now = () => 0 // always pretend it's Jan 1, 1970 at midnight in UTC time
   */
  static set now(e) {
    ni = e;
  }
  /**
   * Set the default time zone to create DateTimes in. Does not affect existing instances.
   * Use the value "system" to reset this value to the system's time zone.
   * @type {string}
   */
  static set defaultZone(e) {
    si = e;
  }
  /**
   * Get the default time zone object currently used to create DateTimes. Does not affect existing instances.
   * The default value is the system's time zone (the one set on the machine that runs this code).
   * @type {Zone}
   */
  static get defaultZone() {
    return Ue(si, Ht.instance);
  }
  /**
   * Get the default locale to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static get defaultLocale() {
    return ii;
  }
  /**
   * Set the default locale to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static set defaultLocale(e) {
    ii = e;
  }
  /**
   * Get the default numbering system to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static get defaultNumberingSystem() {
    return ai;
  }
  /**
   * Set the default numbering system to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static set defaultNumberingSystem(e) {
    ai = e;
  }
  /**
   * Get the default output calendar to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static get defaultOutputCalendar() {
    return oi;
  }
  /**
   * Set the default output calendar to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static set defaultOutputCalendar(e) {
    oi = e;
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
    return li;
  }
  /**
   * Allows overriding the default locale week settings, i.e. the start of the week, the weekend and
   * how many days are required in the first week of a year.
   * Does not affect existing instances.
   *
   * @param {WeekSettings|null} weekSettings
   */
  static set defaultWeekSettings(e) {
    li = zn(e);
  }
  /**
   * Get the cutoff year for whether a 2-digit year string is interpreted in the current or previous century. Numbers higher than the cutoff will be considered to mean 19xx and numbers lower or equal to the cutoff will be considered 20xx.
   * @type {number}
   */
  static get twoDigitCutoffYear() {
    return ui;
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
    ui = e % 100;
  }
  /**
   * Get whether Luxon will throw when it encounters invalid DateTimes, Durations, or Intervals
   * @type {boolean}
   */
  static get throwOnInvalid() {
    return ci;
  }
  /**
   * Set whether Luxon will throw when it encounters invalid DateTimes, Durations, or Intervals
   * @type {boolean}
   */
  static set throwOnInvalid(e) {
    ci = e;
  }
  /**
   * Reset Luxon's global caches. Should only be necessary in testing scenarios.
   * @return {void}
   */
  static resetCaches() {
    A.resetCache(), Oe.resetCache(), E.resetCache(), Tf();
  }
}
class ke {
  constructor(e, r) {
    this.reason = e, this.explanation = r;
  }
  toMessage() {
    return this.explanation ? `${this.reason}: ${this.explanation}` : this.reason;
  }
}
const eo = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334], to = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
function de(t, e) {
  return new ke("unit out of range", `you specified ${e} (of type ${typeof e}) as a ${t}, which is invalid`);
}
function us(t, e, r) {
  const n = new Date(Date.UTC(t, e - 1, r));
  t < 100 && t >= 0 && n.setUTCFullYear(n.getUTCFullYear() - 1900);
  const s = n.getUTCDay();
  return s === 0 ? 7 : s;
}
function ro(t, e, r) {
  return r + (Gt(t) ? to : eo)[e - 1];
}
function no(t, e) {
  const r = Gt(t) ? to : eo, n = r.findIndex((i) => i < e), s = e - r[n];
  return {
    month: n + 1,
    day: s
  };
}
function cs(t, e) {
  return (t - e + 7) % 7 + 1;
}
function xr(t, e = 4, r = 1) {
  const {
    year: n,
    month: s,
    day: i
  } = t, a = ro(n, s, i), o = cs(us(n, s, i), r);
  let u = Math.floor((a - o + 14 - e) / 7), c;
  return u < 1 ? (c = n - 1, u = $t(c, e, r)) : u > $t(n, e, r) ? (c = n + 1, u = 1) : c = n, {
    weekYear: c,
    weekNumber: u,
    weekday: o,
    ...jr(t)
  };
}
function fi(t, e = 4, r = 1) {
  const {
    weekYear: n,
    weekNumber: s,
    weekday: i
  } = t, a = cs(us(n, 1, e), r), o = mt(n);
  let u = s * 7 + i - a - 7 + e, c;
  u < 1 ? (c = n - 1, u += mt(c)) : u > o ? (c = n + 1, u -= mt(n)) : c = n;
  const {
    month: l,
    day: f
  } = no(c, u);
  return {
    year: c,
    month: l,
    day: f,
    ...jr(t)
  };
}
function cn(t) {
  const {
    year: e,
    month: r,
    day: n
  } = t, s = ro(e, r, n);
  return {
    year: e,
    ordinal: s,
    ...jr(t)
  };
}
function hi(t) {
  const {
    year: e,
    ordinal: r
  } = t, {
    month: n,
    day: s
  } = no(e, r);
  return {
    year: e,
    month: n,
    day: s,
    ...jr(t)
  };
}
function di(t, e) {
  if (!C(t.localWeekday) || !C(t.localWeekNumber) || !C(t.localWeekYear)) {
    if (!C(t.weekday) || !C(t.weekNumber) || !C(t.weekYear))
      throw new ft("Cannot mix locale-based week fields with ISO-based week fields");
    return C(t.localWeekday) || (t.weekday = t.localWeekday), C(t.localWeekNumber) || (t.weekNumber = t.localWeekNumber), C(t.localWeekYear) || (t.weekYear = t.localWeekYear), delete t.localWeekday, delete t.localWeekNumber, delete t.localWeekYear, {
      minDaysInFirstWeek: e.getMinDaysInFirstWeek(),
      startOfWeek: e.getStartOfWeek()
    };
  } else
    return {
      minDaysInFirstWeek: 4,
      startOfWeek: 1
    };
}
function bf(t, e = 4, r = 1) {
  const n = zr(t.weekYear), s = me(t.weekNumber, 1, $t(t.weekYear, e, r)), i = me(t.weekday, 1, 7);
  return n ? s ? i ? !1 : de("weekday", t.weekday) : de("week", t.weekNumber) : de("weekYear", t.weekYear);
}
function Sf(t) {
  const e = zr(t.year), r = me(t.ordinal, 1, mt(t.year));
  return e ? r ? !1 : de("ordinal", t.ordinal) : de("year", t.year);
}
function so(t) {
  const e = zr(t.year), r = me(t.month, 1, 12), n = me(t.day, 1, Mr(t.year, t.month));
  return e ? r ? n ? !1 : de("day", t.day) : de("month", t.month) : de("year", t.year);
}
function io(t) {
  const {
    hour: e,
    minute: r,
    second: n,
    millisecond: s
  } = t, i = me(e, 0, 23) || e === 24 && r === 0 && n === 0 && s === 0, a = me(r, 0, 59), o = me(n, 0, 59), u = me(s, 0, 999);
  return i ? a ? o ? u ? !1 : de("millisecond", s) : de("second", n) : de("minute", r) : de("hour", e);
}
function C(t) {
  return typeof t > "u";
}
function je(t) {
  return typeof t == "number";
}
function zr(t) {
  return typeof t == "number" && t % 1 === 0;
}
function Of(t) {
  return typeof t == "string";
}
function Ef(t) {
  return Object.prototype.toString.call(t) === "[object Date]";
}
function ao() {
  try {
    return typeof Intl < "u" && !!Intl.RelativeTimeFormat;
  } catch {
    return !1;
  }
}
function oo() {
  try {
    return typeof Intl < "u" && !!Intl.Locale && ("weekInfo" in Intl.Locale.prototype || "getWeekInfo" in Intl.Locale.prototype);
  } catch {
    return !1;
  }
}
function Cf(t) {
  return Array.isArray(t) ? t : [t];
}
function mi(t, e, r) {
  if (t.length !== 0)
    return t.reduce((n, s) => {
      const i = [e(s), s];
      return n && r(n[0], i[0]) === n[0] ? n : i;
    }, null)[1];
}
function Df(t, e) {
  return e.reduce((r, n) => (r[n] = t[n], r), {});
}
function yt(t, e) {
  return Object.prototype.hasOwnProperty.call(t, e);
}
function zn(t) {
  if (t == null)
    return null;
  if (typeof t != "object")
    throw new Y("Week settings must be an object");
  if (!me(t.firstDay, 1, 7) || !me(t.minimalDays, 1, 7) || !Array.isArray(t.weekend) || t.weekend.some((e) => !me(e, 1, 7)))
    throw new Y("Invalid week settings");
  return {
    firstDay: t.firstDay,
    minimalDays: t.minimalDays,
    weekend: Array.from(t.weekend)
  };
}
function me(t, e, r) {
  return zr(t) && t >= e && t <= r;
}
function If(t, e) {
  return t - e * Math.floor(t / e);
}
function B(t, e = 2) {
  const r = t < 0;
  let n;
  return r ? n = "-" + ("" + -t).padStart(e, "0") : n = ("" + t).padStart(e, "0"), n;
}
function Ve(t) {
  if (!(C(t) || t === null || t === ""))
    return parseInt(t, 10);
}
function Je(t) {
  if (!(C(t) || t === null || t === ""))
    return parseFloat(t);
}
function ls(t) {
  if (!(C(t) || t === null || t === "")) {
    const e = parseFloat("0." + t) * 1e3;
    return Math.floor(e);
  }
}
function fs(t, e, r = !1) {
  const n = 10 ** e;
  return (r ? Math.trunc : Math.round)(t * n) / n;
}
function Gt(t) {
  return t % 4 === 0 && (t % 100 !== 0 || t % 400 === 0);
}
function mt(t) {
  return Gt(t) ? 366 : 365;
}
function Mr(t, e) {
  const r = If(e - 1, 12) + 1, n = t + (e - r) / 12;
  return r === 2 ? Gt(n) ? 29 : 28 : [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][r - 1];
}
function Vr(t) {
  let e = Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second, t.millisecond);
  return t.year < 100 && t.year >= 0 && (e = new Date(e), e.setUTCFullYear(t.year, t.month - 1, t.day)), +e;
}
function pi(t, e, r) {
  return -cs(us(t, 1, e), r) + e - 1;
}
function $t(t, e = 4, r = 1) {
  const n = pi(t, e, r), s = pi(t + 1, e, r);
  return (mt(t) - n + s) / 7;
}
function Vn(t) {
  return t > 99 ? t : t > V.twoDigitCutoffYear ? 1900 + t : 2e3 + t;
}
function uo(t, e, r, n = null) {
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
function Ur(t, e) {
  let r = parseInt(t, 10);
  Number.isNaN(r) && (r = 0);
  const n = parseInt(e, 10) || 0, s = r < 0 || Object.is(r, -0) ? -n : n;
  return r * 60 + s;
}
function co(t) {
  const e = Number(t);
  if (typeof t == "boolean" || t === "" || Number.isNaN(e)) throw new Y(`Invalid unit value ${t}`);
  return e;
}
function Fr(t, e) {
  const r = {};
  for (const n in t)
    if (yt(t, n)) {
      const s = t[n];
      if (s == null) continue;
      r[e(n)] = co(s);
    }
  return r;
}
function At(t, e) {
  const r = Math.trunc(Math.abs(t / 60)), n = Math.trunc(Math.abs(t % 60)), s = t >= 0 ? "+" : "-";
  switch (e) {
    case "short":
      return `${s}${B(r, 2)}:${B(n, 2)}`;
    case "narrow":
      return `${s}${r}${n > 0 ? `:${n}` : ""}`;
    case "techie":
      return `${s}${B(r, 2)}${B(n, 2)}`;
    default:
      throw new RangeError(`Value format ${e} is out of range for property format`);
  }
}
function jr(t) {
  return Df(t, ["hour", "minute", "second", "millisecond"]);
}
const xf = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], lo = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], Mf = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
function fo(t) {
  switch (t) {
    case "narrow":
      return [...Mf];
    case "short":
      return [...lo];
    case "long":
      return [...xf];
    case "numeric":
      return ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
    case "2-digit":
      return ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    default:
      return null;
  }
}
const ho = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], mo = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], Ff = ["M", "T", "W", "T", "F", "S", "S"];
function po(t) {
  switch (t) {
    case "narrow":
      return [...Ff];
    case "short":
      return [...mo];
    case "long":
      return [...ho];
    case "numeric":
      return ["1", "2", "3", "4", "5", "6", "7"];
    default:
      return null;
  }
}
const go = ["AM", "PM"], Rf = ["Before Christ", "Anno Domini"], Nf = ["BC", "AD"], Af = ["B", "A"];
function yo(t) {
  switch (t) {
    case "narrow":
      return [...Af];
    case "short":
      return [...Nf];
    case "long":
      return [...Rf];
    default:
      return null;
  }
}
function Lf(t) {
  return go[t.hour < 12 ? 0 : 1];
}
function Pf(t, e) {
  return po(e)[t.weekday - 1];
}
function Wf(t, e) {
  return fo(e)[t.month - 1];
}
function $f(t, e) {
  return yo(e)[t.year < 0 ? 0 : 1];
}
function zf(t, e, r = "always", n = !1) {
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
function gi(t, e) {
  let r = "";
  for (const n of t)
    n.literal ? r += n.val : r += e(n.val);
  return r;
}
const Vf = {
  D: Ir,
  DD: Na,
  DDD: Aa,
  DDDD: La,
  t: Pa,
  tt: Wa,
  ttt: $a,
  tttt: za,
  T: Va,
  TT: Ua,
  TTT: ja,
  TTTT: qa,
  f: Ha,
  ff: Ba,
  fff: Ya,
  ffff: Qa,
  F: Ga,
  FF: Za,
  FFF: Ja,
  FFFF: Ka
};
class J {
  static create(e, r = {}) {
    return new J(e, r);
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
    return Vf[e];
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
      return B(e, r);
    const n = {
      ...this.opts
    };
    return r > 0 && (n.padTo = r), this.loc.numberFormatter(n).format(e);
  }
  formatDateTimeFromString(e, r) {
    const n = this.loc.listingMode() === "en", s = this.loc.outputCalendar && this.loc.outputCalendar !== "gregory", i = (d, m) => this.loc.extract(e, d, m), a = (d) => e.isOffsetFixed && e.offset === 0 && d.allowZ ? "Z" : e.isValid ? e.zone.formatOffset(e.ts, d.format) : "", o = () => n ? Lf(e) : i({
      hour: "numeric",
      hourCycle: "h12"
    }, "dayperiod"), u = (d, m) => n ? Wf(e, d) : i(m ? {
      month: d
    } : {
      month: d,
      day: "numeric"
    }, "month"), c = (d, m) => n ? Pf(e, d) : i(m ? {
      weekday: d
    } : {
      weekday: d,
      month: "long",
      day: "numeric"
    }, "weekday"), l = (d) => {
      const m = J.macroTokenToFormatOpts(d);
      return m ? this.formatWithSystemDefault(e, m) : d;
    }, f = (d) => n ? $f(e, d) : i({
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
    return gi(J.parseFormat(r), h);
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
    }, i = J.parseFormat(r), a = i.reduce((u, {
      literal: c,
      val: l
    }) => c ? u : u.concat(l), []), o = e.shiftTo(...a.map(n).filter((u) => u));
    return gi(i, s(o));
  }
}
const wo = /[A-Za-z_+-]{1,256}(?::?\/[A-Za-z0-9_+-]{1,256}(?:\/[A-Za-z0-9_+-]{1,256})?)?/;
function kt(...t) {
  const e = t.reduce((r, n) => r + n.source, "");
  return RegExp(`^${e}$`);
}
function Tt(...t) {
  return (e) => t.reduce(([r, n, s], i) => {
    const [a, o, u] = i(e, s);
    return [{
      ...r,
      ...a
    }, o || n, u];
  }, [{}, null, 1]).slice(0, 2);
}
function bt(t, ...e) {
  if (t == null)
    return [null, null];
  for (const [r, n] of e) {
    const s = r.exec(t);
    if (s)
      return n(s);
  }
  return [null, null];
}
function vo(...t) {
  return (e, r) => {
    const n = {};
    let s;
    for (s = 0; s < t.length; s++)
      n[t[s]] = Ve(e[r + s]);
    return [n, null, r + s];
  };
}
const _o = /(?:(Z)|([+-]\d\d)(?::?(\d\d))?)/, Uf = `(?:${_o.source}?(?:\\[(${wo.source})\\])?)?`, hs = /(\d\d)(?::?(\d\d)(?::?(\d\d)(?:[.,](\d{1,30}))?)?)?/, ko = RegExp(`${hs.source}${Uf}`), ds = RegExp(`(?:T${ko.source})?`), jf = /([+-]\d{6}|\d{4})(?:-?(\d\d)(?:-?(\d\d))?)?/, qf = /(\d{4})-?W(\d\d)(?:-?(\d))?/, Hf = /(\d{4})-?(\d{3})/, Gf = vo("weekYear", "weekNumber", "weekDay"), Bf = vo("year", "ordinal"), Zf = /(\d{4})-(\d\d)-(\d\d)/, To = RegExp(`${hs.source} ?(?:${_o.source}|(${wo.source}))?`), Yf = RegExp(`(?: ${To.source})?`);
function pt(t, e, r) {
  const n = t[e];
  return C(n) ? r : Ve(n);
}
function Jf(t, e) {
  return [{
    year: pt(t, e),
    month: pt(t, e + 1, 1),
    day: pt(t, e + 2, 1)
  }, null, e + 3];
}
function St(t, e) {
  return [{
    hours: pt(t, e, 0),
    minutes: pt(t, e + 1, 0),
    seconds: pt(t, e + 2, 0),
    milliseconds: ls(t[e + 3])
  }, null, e + 4];
}
function Bt(t, e) {
  const r = !t[e] && !t[e + 1], n = Ur(t[e + 1], t[e + 2]), s = r ? null : Q.instance(n);
  return [{}, s, e + 3];
}
function Zt(t, e) {
  const r = t[e] ? Oe.create(t[e]) : null;
  return [{}, r, e + 1];
}
const Qf = RegExp(`^T?${hs.source}$`), Kf = /^-?P(?:(?:(-?\d{1,20}(?:\.\d{1,20})?)Y)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20}(?:\.\d{1,20})?)W)?(?:(-?\d{1,20}(?:\.\d{1,20})?)D)?(?:T(?:(-?\d{1,20}(?:\.\d{1,20})?)H)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20})(?:[.,](-?\d{1,20}))?S)?)?)$/;
function Xf(t) {
  const [e, r, n, s, i, a, o, u, c] = t, l = e[0] === "-", f = u && u[0] === "-", h = (d, m = !1) => d !== void 0 && (m || d && l) ? -d : d;
  return [{
    years: h(Je(r)),
    months: h(Je(n)),
    weeks: h(Je(s)),
    days: h(Je(i)),
    hours: h(Je(a)),
    minutes: h(Je(o)),
    seconds: h(Je(u), u === "-0"),
    milliseconds: h(ls(c), f)
  }];
}
const eh = {
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
function ms(t, e, r, n, s, i, a) {
  const o = {
    year: e.length === 2 ? Vn(Ve(e)) : Ve(e),
    month: lo.indexOf(r) + 1,
    day: Ve(n),
    hour: Ve(s),
    minute: Ve(i)
  };
  return a && (o.second = Ve(a)), t && (o.weekday = t.length > 3 ? ho.indexOf(t) + 1 : mo.indexOf(t) + 1), o;
}
const th = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|(?:([+-]\d\d)(\d\d)))$/;
function rh(t) {
  const [, e, r, n, s, i, a, o, u, c, l, f] = t, h = ms(e, s, n, r, i, a, o);
  let d;
  return u ? d = eh[u] : c ? d = 0 : d = Ur(l, f), [h, new Q(d)];
}
function nh(t) {
  return t.replace(/\([^()]*\)|[\n\t]/g, " ").replace(/(\s\s+)/g, " ").trim();
}
const sh = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d\d) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d\d):(\d\d):(\d\d) GMT$/, ih = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\d\d)-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d\d) (\d\d):(\d\d):(\d\d) GMT$/, ah = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ( \d|\d\d) (\d\d):(\d\d):(\d\d) (\d{4})$/;
function yi(t) {
  const [, e, r, n, s, i, a, o] = t;
  return [ms(e, s, n, r, i, a, o), Q.utcInstance];
}
function oh(t) {
  const [, e, r, n, s, i, a, o] = t;
  return [ms(e, o, r, n, s, i, a), Q.utcInstance];
}
const uh = kt(jf, ds), ch = kt(qf, ds), lh = kt(Hf, ds), fh = kt(ko), bo = Tt(Jf, St, Bt, Zt), hh = Tt(Gf, St, Bt, Zt), dh = Tt(Bf, St, Bt, Zt), mh = Tt(St, Bt, Zt);
function ph(t) {
  return bt(t, [uh, bo], [ch, hh], [lh, dh], [fh, mh]);
}
function gh(t) {
  return bt(nh(t), [th, rh]);
}
function yh(t) {
  return bt(t, [sh, yi], [ih, yi], [ah, oh]);
}
function wh(t) {
  return bt(t, [Kf, Xf]);
}
const vh = Tt(St);
function _h(t) {
  return bt(t, [Qf, vh]);
}
const kh = kt(Zf, Yf), Th = kt(To), bh = Tt(St, Bt, Zt);
function Sh(t) {
  return bt(t, [kh, bo], [Th, bh]);
}
const wi = "Invalid Duration", So = {
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
}, Oh = {
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
  ...So
}, le = 146097 / 400, ot = 146097 / 4800, Eh = {
  years: {
    quarters: 4,
    months: 12,
    weeks: le / 7,
    days: le,
    hours: le * 24,
    minutes: le * 24 * 60,
    seconds: le * 24 * 60 * 60,
    milliseconds: le * 24 * 60 * 60 * 1e3
  },
  quarters: {
    months: 3,
    weeks: le / 28,
    days: le / 4,
    hours: le * 24 / 4,
    minutes: le * 24 * 60 / 4,
    seconds: le * 24 * 60 * 60 / 4,
    milliseconds: le * 24 * 60 * 60 * 1e3 / 4
  },
  months: {
    weeks: ot / 7,
    days: ot,
    hours: ot * 24,
    minutes: ot * 24 * 60,
    seconds: ot * 24 * 60 * 60,
    milliseconds: ot * 24 * 60 * 60 * 1e3
  },
  ...So
}, tt = ["years", "quarters", "months", "weeks", "days", "hours", "minutes", "seconds", "milliseconds"], Ch = tt.slice(0).reverse();
function $e(t, e, r = !1) {
  const n = {
    values: r ? e.values : {
      ...t.values,
      ...e.values || {}
    },
    loc: t.loc.clone(e.loc),
    conversionAccuracy: e.conversionAccuracy || t.conversionAccuracy,
    matrix: e.matrix || t.matrix
  };
  return new F(n);
}
function Oo(t, e) {
  var r;
  let n = (r = e.milliseconds) != null ? r : 0;
  for (const s of Ch.slice(1))
    e[s] && (n += e[s] * t[s].milliseconds);
  return n;
}
function vi(t, e) {
  const r = Oo(t, e) < 0 ? -1 : 1;
  tt.reduceRight((n, s) => {
    if (C(e[s]))
      return n;
    if (n) {
      const i = e[n] * r, a = t[s][n], o = Math.floor(i / a);
      e[s] += o * r, e[n] -= o * a * r;
    }
    return s;
  }, null), tt.reduce((n, s) => {
    if (C(e[s]))
      return n;
    if (n) {
      const i = e[n] % 1;
      e[n] -= i, e[s] += i * t[n][s];
    }
    return s;
  }, null);
}
function Dh(t) {
  const e = {};
  for (const [r, n] of Object.entries(t))
    n !== 0 && (e[r] = n);
  return e;
}
class F {
  /**
   * @private
   */
  constructor(e) {
    const r = e.conversionAccuracy === "longterm" || !1;
    let n = r ? Eh : Oh;
    e.matrix && (n = e.matrix), this.values = e.values, this.loc = e.loc || A.create(), this.conversionAccuracy = r ? "longterm" : "casual", this.invalid = e.invalid || null, this.matrix = n, this.isLuxonDuration = !0;
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
    return F.fromObject({
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
      throw new Y(`Duration.fromObject: argument expected to be an object, got ${e === null ? "null" : typeof e}`);
    return new F({
      values: Fr(e, F.normalizeUnit),
      loc: A.fromObject(r),
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
    if (je(e))
      return F.fromMillis(e);
    if (F.isDuration(e))
      return e;
    if (typeof e == "object")
      return F.fromObject(e);
    throw new Y(`Unknown duration argument ${e} of type ${typeof e}`);
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
    const [n] = wh(e);
    return n ? F.fromObject(n, r) : F.invalid("unparsable", `the input "${e}" can't be parsed as ISO 8601`);
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
    const [n] = _h(e);
    return n ? F.fromObject(n, r) : F.invalid("unparsable", `the input "${e}" can't be parsed as ISO 8601`);
  }
  /**
   * Create an invalid Duration.
   * @param {string} reason - simple string of why this datetime is invalid. Should not contain parameters or anything else data-dependent
   * @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
   * @return {Duration}
   */
  static invalid(e, r = null) {
    if (!e)
      throw new Y("need to specify a reason the Duration is invalid");
    const n = e instanceof ke ? e : new ke(e, r);
    if (V.throwOnInvalid)
      throw new Kl(n);
    return new F({
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
    if (!r) throw new Ra(e);
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
    return this.isValid ? J.create(this.loc, n).formatDurationFromString(this, e) : wi;
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
    if (!this.isValid) return wi;
    const r = tt.map((n) => {
      const s = this.values[n];
      return C(s) ? null : this.loc.numberFormatter({
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
    return this.years !== 0 && (e += this.years + "Y"), (this.months !== 0 || this.quarters !== 0) && (e += this.months + this.quarters * 3 + "M"), this.weeks !== 0 && (e += this.weeks + "W"), this.days !== 0 && (e += this.days + "D"), (this.hours !== 0 || this.minutes !== 0 || this.seconds !== 0 || this.milliseconds !== 0) && (e += "T"), this.hours !== 0 && (e += this.hours + "H"), this.minutes !== 0 && (e += this.minutes + "M"), (this.seconds !== 0 || this.milliseconds !== 0) && (e += fs(this.seconds + this.milliseconds / 1e3, 3) + "S"), e === "P" && (e += "T0S"), e;
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
    }, E.fromMillis(r, {
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
    return this.isValid ? Oo(this.matrix, this.values) : NaN;
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
    const r = F.fromDurationLike(e), n = {};
    for (const s of tt)
      (yt(r.values, s) || yt(this.values, s)) && (n[s] = r.get(s) + this.get(s));
    return $e(this, {
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
    const r = F.fromDurationLike(e);
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
      r[n] = co(e(this.values[n], n));
    return $e(this, {
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
    return this[F.normalizeUnit(e)];
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
      ...Fr(e, F.normalizeUnit)
    };
    return $e(this, {
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
    return $e(this, a);
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
    return vi(this.matrix, e), $e(this, {
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
    const e = Dh(this.normalize().shiftToAll().toObject());
    return $e(this, {
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
    e = e.map((a) => F.normalizeUnit(a));
    const r = {}, n = {}, s = this.toObject();
    let i;
    for (const a of tt)
      if (e.indexOf(a) >= 0) {
        i = a;
        let o = 0;
        for (const c in n)
          o += this.matrix[c][a] * n[c], n[c] = 0;
        je(s[a]) && (o += s[a]);
        const u = Math.trunc(o);
        r[a] = u, n[a] = (o * 1e3 - u * 1e3) / 1e3;
      } else je(s[a]) && (n[a] = s[a]);
    for (const a in n)
      n[a] !== 0 && (r[i] += a === i ? n[a] : n[a] / this.matrix[i][a]);
    return vi(this.matrix, r), $e(this, {
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
    return $e(this, {
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
    for (const n of tt)
      if (!r(this.values[n], e.values[n]))
        return !1;
    return !0;
  }
}
const ut = "Invalid Interval";
function Ih(t, e) {
  return !t || !t.isValid ? z.invalid("missing or invalid start") : !e || !e.isValid ? z.invalid("missing or invalid end") : e < t ? z.invalid("end before start", `The end of an interval must be after its start, but you had start=${t.toISO()} and end=${e.toISO()}`) : null;
}
class z {
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
      throw new Y("need to specify a reason the Interval is invalid");
    const n = e instanceof ke ? e : new ke(e, r);
    if (V.throwOnInvalid)
      throw new Ql(n);
    return new z({
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
    const n = Dt(e), s = Dt(r), i = Ih(n, s);
    return i ?? new z({
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
    const n = F.fromDurationLike(r), s = Dt(e);
    return z.fromDateTimes(s, s.plus(n));
  }
  /**
   * Create an Interval from an end DateTime and a Duration to extend backwards to.
   * @param {DateTime|Date|Object} end
   * @param {Duration|Object|number} duration - the length of the Interval.
   * @return {Interval}
   */
  static before(e, r) {
    const n = F.fromDurationLike(r), s = Dt(e);
    return z.fromDateTimes(s.minus(n), s);
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
        i = E.fromISO(n, r), a = i.isValid;
      } catch {
        a = !1;
      }
      let o, u;
      try {
        o = E.fromISO(s, r), u = o.isValid;
      } catch {
        u = !1;
      }
      if (a && u)
        return z.fromDateTimes(i, o);
      if (a) {
        const c = F.fromISO(s, r);
        if (c.isValid)
          return z.after(i, c);
      } else if (u) {
        const c = F.fromISO(n, r);
        if (c.isValid)
          return z.before(o, c);
      }
    }
    return z.invalid("unparsable", `the input "${e}" can't be parsed as ISO 8601`);
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
    return this.isValid ? z.fromDateTimes(e || this.s, r || this.e) : this;
  }
  /**
   * Split this Interval at each of the specified DateTimes
   * @param {...DateTime} dateTimes - the unit of time to count.
   * @return {Array}
   */
  splitAt(...e) {
    if (!this.isValid) return [];
    const r = e.map(Dt).filter((a) => this.contains(a)).sort((a, o) => a.toMillis() - o.toMillis()), n = [];
    let {
      s
    } = this, i = 0;
    for (; s < this.e; ) {
      const a = r[i] || this.e, o = +a > +this.e ? this.e : a;
      n.push(z.fromDateTimes(s, o)), s = o, i += 1;
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
    const r = F.fromDurationLike(e);
    if (!this.isValid || !r.isValid || r.as("milliseconds") === 0)
      return [];
    let {
      s: n
    } = this, s = 1, i;
    const a = [];
    for (; n < this.e; ) {
      const o = this.start.plus(r.mapUnits((u) => u * s));
      i = +o > +this.e ? this.e : o, a.push(z.fromDateTimes(n, i)), n = i, s += 1;
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
    return r >= n ? null : z.fromDateTimes(r, n);
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
    return z.fromDateTimes(r, n);
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
      n += u.type === "s" ? 1 : -1, n === 1 ? r = u.time : (r && +r != +u.time && s.push(z.fromDateTimes(r, u.time)), r = null);
    return z.merge(s);
  }
  /**
   * Return an Interval representing the span of time in this Interval that doesn't overlap with any of the specified Intervals.
   * @param {...Interval} intervals
   * @return {Array}
   */
  difference(...e) {
    return z.xor([this].concat(e)).map((r) => this.intersection(r)).filter((r) => r && !r.isEmpty());
  }
  /**
   * Returns a string representation of this Interval appropriate for debugging.
   * @return {string}
   */
  toString() {
    return this.isValid ? `[${this.s.toISO()} – ${this.e.toISO()})` : ut;
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
  toLocaleString(e = Ir, r = {}) {
    return this.isValid ? J.create(this.s.loc.clone(r), e).formatInterval(this) : ut;
  }
  /**
   * Returns an ISO 8601-compliant string representation of this Interval.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @param {Object} opts - The same options as {@link DateTime#toISO}
   * @return {string}
   */
  toISO(e) {
    return this.isValid ? `${this.s.toISO(e)}/${this.e.toISO(e)}` : ut;
  }
  /**
   * Returns an ISO 8601-compliant string representation of date of this Interval.
   * The time components are ignored.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @return {string}
   */
  toISODate() {
    return this.isValid ? `${this.s.toISODate()}/${this.e.toISODate()}` : ut;
  }
  /**
   * Returns an ISO 8601-compliant string representation of time of this Interval.
   * The date components are ignored.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @param {Object} opts - The same options as {@link DateTime#toISO}
   * @return {string}
   */
  toISOTime(e) {
    return this.isValid ? `${this.s.toISOTime(e)}/${this.e.toISOTime(e)}` : ut;
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
    return this.isValid ? `${this.s.toFormat(e)}${r}${this.e.toFormat(e)}` : ut;
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
    return this.isValid ? this.e.diff(this.s, e, r) : F.invalid(this.invalidReason);
  }
  /**
   * Run mapFn on the interval start and end, returning a new Interval from the resulting DateTimes
   * @param {function} mapFn
   * @return {Interval}
   * @example Interval.fromDateTimes(dt1, dt2).mapEndpoints(endpoint => endpoint.toUTC())
   * @example Interval.fromDateTimes(dt1, dt2).mapEndpoints(endpoint => endpoint.plus({ hours: 2 }))
   */
  mapEndpoints(e) {
    return z.fromDateTimes(e(this.s), e(this.e));
  }
}
class Mt {
  /**
   * Return whether the specified zone contains a DST.
   * @param {string|Zone} [zone='local'] - Zone to check. Defaults to the environment's local zone.
   * @return {boolean}
   */
  static hasDST(e = V.defaultZone) {
    const r = E.now().setZone(e).set({
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
    return Oe.isValidZone(e);
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
    return Ue(e, V.defaultZone);
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
    return (r || A.create(e)).getStartOfWeek();
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
    return (r || A.create(e)).getMinDaysInFirstWeek();
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
    return (r || A.create(e)).getWeekendDays().slice();
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
    return (s || A.create(r, n, i)).months(e);
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
    return (s || A.create(r, n, i)).months(e, !0);
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
    return (s || A.create(r, n, null)).weekdays(e);
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
    return (s || A.create(r, n, null)).weekdays(e, !0);
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
    return A.create(e).meridiems();
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
    return A.create(r, null, "gregory").eras(e);
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
      relative: ao(),
      localeWeek: oo()
    };
  }
}
function _i(t, e) {
  const r = (s) => s.toUTC(0, {
    keepLocalTime: !0
  }).startOf("day").valueOf(), n = r(e) - r(t);
  return Math.floor(F.fromMillis(n).as("days"));
}
function xh(t, e, r) {
  const n = [["years", (u, c) => c.year - u.year], ["quarters", (u, c) => c.quarter - u.quarter + (c.year - u.year) * 4], ["months", (u, c) => c.month - u.month + (c.year - u.year) * 12], ["weeks", (u, c) => {
    const l = _i(u, c);
    return (l - l % 7) / 7;
  }], ["days", _i]], s = {}, i = t;
  let a, o;
  for (const [u, c] of n)
    r.indexOf(u) >= 0 && (a = u, s[u] = c(t, e), o = i.plus(s), o > e ? (s[u]--, t = i.plus(s), t > e && (o = t, s[u]--, t = i.plus(s))) : t = o);
  return [t, s, o, a];
}
function Mh(t, e, r, n) {
  let [s, i, a, o] = xh(t, e, r);
  const u = e - s, c = r.filter((f) => ["hours", "minutes", "seconds", "milliseconds"].indexOf(f) >= 0);
  c.length === 0 && (a < e && (a = s.plus({
    [o]: 1
  })), a !== s && (i[o] = (i[o] || 0) + u / (a - s)));
  const l = F.fromObject(i, n);
  return c.length > 0 ? F.fromMillis(u, n).shiftTo(...c).plus(l) : l;
}
const Fh = "missing Intl.DateTimeFormat.formatToParts support";
function N(t, e = (r) => r) {
  return {
    regex: t,
    deser: ([r]) => e(kf(r))
  };
}
const Rh = " ", Eo = `[ ${Rh}]`, Co = new RegExp(Eo, "g");
function Nh(t) {
  return t.replace(/\./g, "\\.?").replace(Co, Eo);
}
function ki(t) {
  return t.replace(/\./g, "").replace(Co, " ").toLowerCase();
}
function ve(t, e) {
  return t === null ? null : {
    regex: RegExp(t.map(Nh).join("|")),
    deser: ([r]) => t.findIndex((n) => ki(r) === ki(n)) + e
  };
}
function Ti(t, e) {
  return {
    regex: t,
    deser: ([, r, n]) => Ur(r, n),
    groups: e
  };
}
function or(t) {
  return {
    regex: t,
    deser: ([e]) => e
  };
}
function Ah(t) {
  return t.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
}
function Lh(t, e) {
  const r = we(e), n = we(e, "{2}"), s = we(e, "{3}"), i = we(e, "{4}"), a = we(e, "{6}"), o = we(e, "{1,2}"), u = we(e, "{1,3}"), c = we(e, "{1,6}"), l = we(e, "{1,9}"), f = we(e, "{2,4}"), h = we(e, "{4,6}"), d = (O) => ({
    regex: RegExp(Ah(O.val)),
    deser: ([v]) => v,
    literal: !0
  }), _ = ((O) => {
    if (t.literal)
      return d(O);
    switch (O.val) {
      case "G":
        return ve(e.eras("short"), 0);
      case "GG":
        return ve(e.eras("long"), 0);
      case "y":
        return N(c);
      case "yy":
        return N(f, Vn);
      case "yyyy":
        return N(i);
      case "yyyyy":
        return N(h);
      case "yyyyyy":
        return N(a);
      case "M":
        return N(o);
      case "MM":
        return N(n);
      case "MMM":
        return ve(e.months("short", !0), 1);
      case "MMMM":
        return ve(e.months("long", !0), 1);
      case "L":
        return N(o);
      case "LL":
        return N(n);
      case "LLL":
        return ve(e.months("short", !1), 1);
      case "LLLL":
        return ve(e.months("long", !1), 1);
      case "d":
        return N(o);
      case "dd":
        return N(n);
      case "o":
        return N(u);
      case "ooo":
        return N(s);
      case "HH":
        return N(n);
      case "H":
        return N(o);
      case "hh":
        return N(n);
      case "h":
        return N(o);
      case "mm":
        return N(n);
      case "m":
        return N(o);
      case "q":
        return N(o);
      case "qq":
        return N(n);
      case "s":
        return N(o);
      case "ss":
        return N(n);
      case "S":
        return N(u);
      case "SSS":
        return N(s);
      case "u":
        return or(l);
      case "uu":
        return or(o);
      case "uuu":
        return N(r);
      case "a":
        return ve(e.meridiems(), 0);
      case "kkkk":
        return N(i);
      case "kk":
        return N(f, Vn);
      case "W":
        return N(o);
      case "WW":
        return N(n);
      case "E":
      case "c":
        return N(r);
      case "EEE":
        return ve(e.weekdays("short", !1), 1);
      case "EEEE":
        return ve(e.weekdays("long", !1), 1);
      case "ccc":
        return ve(e.weekdays("short", !0), 1);
      case "cccc":
        return ve(e.weekdays("long", !0), 1);
      case "Z":
      case "ZZ":
        return Ti(new RegExp(`([+-]${o.source})(?::(${n.source}))?`), 2);
      case "ZZZ":
        return Ti(new RegExp(`([+-]${o.source})(${n.source})?`), 2);
      case "z":
        return or(/[a-z_+-/]{1,256}?/i);
      case " ":
        return or(/[^\S\n\r]/);
      default:
        return d(O);
    }
  })(t) || {
    invalidReason: Fh
  };
  return _.token = t, _;
}
const Ph = {
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
function Wh(t, e, r) {
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
  let o = Ph[a];
  if (typeof o == "object" && (o = o[i]), o)
    return {
      literal: !1,
      val: o
    };
}
function $h(t) {
  return [`^${t.map((r) => r.regex).reduce((r, n) => `${r}(${n.source})`, "")}$`, t];
}
function zh(t, e, r) {
  const n = t.match(e);
  if (n) {
    const s = {};
    let i = 1;
    for (const a in r)
      if (yt(r, a)) {
        const o = r[a], u = o.groups ? o.groups + 1 : 1;
        !o.literal && o.token && (s[o.token.val[0]] = o.deser(n.slice(i, i + u))), i += u;
      }
    return [n, s];
  } else
    return [n, {}];
}
function Vh(t) {
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
  return C(t.z) || (r = Oe.create(t.z)), C(t.Z) || (r || (r = new Q(t.Z)), n = t.Z), C(t.q) || (t.M = (t.q - 1) * 3 + 1), C(t.h) || (t.h < 12 && t.a === 1 ? t.h += 12 : t.h === 12 && t.a === 0 && (t.h = 0)), t.G === 0 && t.y && (t.y = -t.y), C(t.u) || (t.S = ls(t.u)), [Object.keys(t).reduce((i, a) => {
    const o = e(a);
    return o && (i[o] = t[a]), i;
  }, {}), r, n];
}
let ln = null;
function Uh() {
  return ln || (ln = E.fromMillis(1555555555555)), ln;
}
function jh(t, e) {
  if (t.literal)
    return t;
  const r = J.macroTokenToFormatOpts(t.val), n = Mo(r, e);
  return n == null || n.includes(void 0) ? t : n;
}
function Do(t, e) {
  return Array.prototype.concat(...t.map((r) => jh(r, e)));
}
class Io {
  constructor(e, r) {
    if (this.locale = e, this.format = r, this.tokens = Do(J.parseFormat(r), e), this.units = this.tokens.map((n) => Lh(n, e)), this.disqualifyingUnit = this.units.find((n) => n.invalidReason), !this.disqualifyingUnit) {
      const [n, s] = $h(this.units);
      this.regex = RegExp(n, "i"), this.handlers = s;
    }
  }
  explainFromTokens(e) {
    if (this.isValid) {
      const [r, n] = zh(e, this.regex, this.handlers), [s, i, a] = n ? Vh(n) : [null, null, void 0];
      if (yt(n, "a") && yt(n, "H"))
        throw new ft("Can't include meridiem when specifying 24-hour format");
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
function xo(t, e, r) {
  return new Io(t, r).explainFromTokens(e);
}
function qh(t, e, r) {
  const {
    result: n,
    zone: s,
    specificOffset: i,
    invalidReason: a
  } = xo(t, e, r);
  return [n, s, i, a];
}
function Mo(t, e) {
  if (!t)
    return null;
  const n = J.create(e, t).dtFormatter(Uh()), s = n.formatToParts(), i = n.resolvedOptions();
  return s.map((a) => Wh(a, t, i));
}
const fn = "Invalid DateTime", bi = 864e13;
function Ft(t) {
  return new ke("unsupported zone", `the zone "${t.name}" is not supported`);
}
function hn(t) {
  return t.weekData === null && (t.weekData = xr(t.c)), t.weekData;
}
function dn(t) {
  return t.localWeekData === null && (t.localWeekData = xr(t.c, t.loc.getMinDaysInFirstWeek(), t.loc.getStartOfWeek())), t.localWeekData;
}
function Qe(t, e) {
  const r = {
    ts: t.ts,
    zone: t.zone,
    c: t.c,
    o: t.o,
    loc: t.loc,
    invalid: t.invalid
  };
  return new E({
    ...r,
    ...e,
    old: r
  });
}
function Fo(t, e, r) {
  let n = t - e * 60 * 1e3;
  const s = r.offset(n);
  if (e === s)
    return [n, e];
  n -= (s - e) * 60 * 1e3;
  const i = r.offset(n);
  return s === i ? [n, s] : [t - Math.min(s, i) * 60 * 1e3, Math.max(s, i)];
}
function ur(t, e) {
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
function wr(t, e, r) {
  return Fo(Vr(t), e, r);
}
function Si(t, e) {
  const r = t.o, n = t.c.year + Math.trunc(e.years), s = t.c.month + Math.trunc(e.months) + Math.trunc(e.quarters) * 3, i = {
    ...t.c,
    year: n,
    month: s,
    day: Math.min(t.c.day, Mr(n, s)) + Math.trunc(e.days) + Math.trunc(e.weeks) * 7
  }, a = F.fromObject({
    years: e.years - Math.trunc(e.years),
    quarters: e.quarters - Math.trunc(e.quarters),
    months: e.months - Math.trunc(e.months),
    weeks: e.weeks - Math.trunc(e.weeks),
    days: e.days - Math.trunc(e.days),
    hours: e.hours,
    minutes: e.minutes,
    seconds: e.seconds,
    milliseconds: e.milliseconds
  }).as("milliseconds"), o = Vr(i);
  let [u, c] = Fo(o, r, t.zone);
  return a !== 0 && (u += a, c = t.zone.offset(u)), {
    ts: u,
    o: c
  };
}
function ct(t, e, r, n, s, i) {
  const {
    setZone: a,
    zone: o
  } = r;
  if (t && Object.keys(t).length !== 0 || e) {
    const u = e || o, c = E.fromObject(t, {
      ...r,
      zone: u,
      specificOffset: i
    });
    return a ? c : c.setZone(o);
  } else
    return E.invalid(new ke("unparsable", `the input "${s}" can't be parsed as ${n}`));
}
function cr(t, e, r = !0) {
  return t.isValid ? J.create(A.create("en-US"), {
    allowZ: r,
    forceSimple: !0
  }).formatDateTimeFromString(t, e) : null;
}
function mn(t, e) {
  const r = t.c.year > 9999 || t.c.year < 0;
  let n = "";
  return r && t.c.year >= 0 && (n += "+"), n += B(t.c.year, r ? 6 : 4), e ? (n += "-", n += B(t.c.month), n += "-", n += B(t.c.day)) : (n += B(t.c.month), n += B(t.c.day)), n;
}
function Oi(t, e, r, n, s, i) {
  let a = B(t.c.hour);
  return e ? (a += ":", a += B(t.c.minute), (t.c.millisecond !== 0 || t.c.second !== 0 || !r) && (a += ":")) : a += B(t.c.minute), (t.c.millisecond !== 0 || t.c.second !== 0 || !r) && (a += B(t.c.second), (t.c.millisecond !== 0 || !n) && (a += ".", a += B(t.c.millisecond, 3))), s && (t.isOffsetFixed && t.offset === 0 && !i ? a += "Z" : t.o < 0 ? (a += "-", a += B(Math.trunc(-t.o / 60)), a += ":", a += B(Math.trunc(-t.o % 60))) : (a += "+", a += B(Math.trunc(t.o / 60)), a += ":", a += B(Math.trunc(t.o % 60)))), i && (a += "[" + t.zone.ianaName + "]"), a;
}
const Ro = {
  month: 1,
  day: 1,
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0
}, Hh = {
  weekNumber: 1,
  weekday: 1,
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0
}, Gh = {
  ordinal: 1,
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0
}, No = ["year", "month", "day", "hour", "minute", "second", "millisecond"], Bh = ["weekYear", "weekNumber", "weekday", "hour", "minute", "second", "millisecond"], Zh = ["year", "ordinal", "hour", "minute", "second", "millisecond"];
function Yh(t) {
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
  if (!e) throw new Ra(t);
  return e;
}
function Ei(t) {
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
      return Yh(t);
  }
}
function Jh(t) {
  return _r[t] || (vr === void 0 && (vr = V.now()), _r[t] = t.offset(vr)), _r[t];
}
function Ci(t, e) {
  const r = Ue(e.zone, V.defaultZone);
  if (!r.isValid)
    return E.invalid(Ft(r));
  const n = A.fromObject(e);
  let s, i;
  if (C(t.year))
    s = V.now();
  else {
    for (const u of No)
      C(t[u]) && (t[u] = Ro[u]);
    const a = so(t) || io(t);
    if (a)
      return E.invalid(a);
    const o = Jh(r);
    [s, i] = wr(t, o, r);
  }
  return new E({
    ts: s,
    zone: r,
    loc: n,
    o: i
  });
}
function Di(t, e, r) {
  const n = C(r.round) ? !0 : r.round, s = (a, o) => (a = fs(a, n || r.calendary ? 0 : 2, !0), e.loc.clone(r).relFormatter(r).format(a, o)), i = (a) => r.calendary ? e.hasSame(t, a) ? 0 : e.startOf(a).diff(t.startOf(a), a).get(a) : e.diff(t, a).get(a);
  if (r.unit)
    return s(i(r.unit), r.unit);
  for (const a of r.units) {
    const o = i(a);
    if (Math.abs(o) >= 1)
      return s(o, a);
  }
  return s(t > e ? -0 : 0, r.units[r.units.length - 1]);
}
function Ii(t) {
  let e = {}, r;
  return t.length > 0 && typeof t[t.length - 1] == "object" ? (e = t[t.length - 1], r = Array.from(t).slice(0, t.length - 1)) : r = Array.from(t), [e, r];
}
let vr, _r = {};
class E {
  /**
   * @access private
   */
  constructor(e) {
    const r = e.zone || V.defaultZone;
    let n = e.invalid || (Number.isNaN(e.ts) ? new ke("invalid input") : null) || (r.isValid ? null : Ft(r));
    this.ts = C(e.ts) ? V.now() : e.ts;
    let s = null, i = null;
    if (!n)
      if (e.old && e.old.ts === this.ts && e.old.zone.equals(r))
        [s, i] = [e.old.c, e.old.o];
      else {
        const o = je(e.o) && !e.old ? e.o : r.offset(this.ts);
        s = ur(this.ts, o), n = Number.isNaN(s.year) ? new ke("invalid input") : null, s = n ? null : s, i = n ? null : o;
      }
    this._zone = r, this.loc = e.loc || A.create(), this.invalid = n, this.weekData = null, this.localWeekData = null, this.c = s, this.o = i, this.isLuxonDateTime = !0;
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
    return new E({});
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
    const [e, r] = Ii(arguments), [n, s, i, a, o, u, c] = r;
    return Ci({
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
    const [e, r] = Ii(arguments), [n, s, i, a, o, u, c] = r;
    return e.zone = Q.utcInstance, Ci({
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
    const n = Ef(e) ? e.valueOf() : NaN;
    if (Number.isNaN(n))
      return E.invalid("invalid input");
    const s = Ue(r.zone, V.defaultZone);
    return s.isValid ? new E({
      ts: n,
      zone: s,
      loc: A.fromObject(r)
    }) : E.invalid(Ft(s));
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
    if (je(e))
      return e < -bi || e > bi ? E.invalid("Timestamp out of range") : new E({
        ts: e,
        zone: Ue(r.zone, V.defaultZone),
        loc: A.fromObject(r)
      });
    throw new Y(`fromMillis requires a numerical input, but received a ${typeof e} with value ${e}`);
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
    if (je(e))
      return new E({
        ts: e * 1e3,
        zone: Ue(r.zone, V.defaultZone),
        loc: A.fromObject(r)
      });
    throw new Y("fromSeconds requires a numerical input");
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
    const n = Ue(r.zone, V.defaultZone);
    if (!n.isValid)
      return E.invalid(Ft(n));
    const s = A.fromObject(r), i = Fr(e, Ei), {
      minDaysInFirstWeek: a,
      startOfWeek: o
    } = di(i, s), u = V.now(), c = C(r.specificOffset) ? n.offset(u) : r.specificOffset, l = !C(i.ordinal), f = !C(i.year), h = !C(i.month) || !C(i.day), d = f || h, m = i.weekYear || i.weekNumber;
    if ((d || l) && m)
      throw new ft("Can't mix weekYear/weekNumber units with year/month/day or ordinals");
    if (h && l)
      throw new ft("Can't mix ordinal dates with month/day");
    const _ = m || i.weekday && !d;
    let O, v, M = ur(u, c);
    _ ? (O = Bh, v = Hh, M = xr(M, a, o)) : l ? (O = Zh, v = Gh, M = cn(M)) : (O = No, v = Ro);
    let $ = !1;
    for (const De of O) {
      const sn = i[De];
      C(sn) ? $ ? i[De] = v[De] : i[De] = M[De] : $ = !0;
    }
    const X = _ ? bf(i, a, o) : l ? Sf(i) : so(i), Z = X || io(i);
    if (Z)
      return E.invalid(Z);
    const sr = _ ? fi(i, a, o) : l ? hi(i) : i, [Ye, Ct] = wr(sr, c, n), be = new E({
      ts: Ye,
      zone: n,
      o: Ct,
      loc: s
    });
    return i.weekday && d && e.weekday !== be.weekday ? E.invalid("mismatched weekday", `you can't specify both a weekday of ${i.weekday} and a date of ${be.toISO()}`) : be.isValid ? be : E.invalid(be.invalid);
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
    const [n, s] = ph(e);
    return ct(n, s, r, "ISO 8601", e);
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
    const [n, s] = gh(e);
    return ct(n, s, r, "RFC 2822", e);
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
    const [n, s] = yh(e);
    return ct(n, s, r, "HTTP", r);
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
    if (C(e) || C(r))
      throw new Y("fromFormat requires an input string and a format");
    const {
      locale: s = null,
      numberingSystem: i = null
    } = n, a = A.fromOpts({
      locale: s,
      numberingSystem: i,
      defaultToEN: !0
    }), [o, u, c, l] = qh(a, e, r);
    return l ? E.invalid(l) : ct(o, u, n, `format ${r}`, e, c);
  }
  /**
   * @deprecated use fromFormat instead
   */
  static fromString(e, r, n = {}) {
    return E.fromFormat(e, r, n);
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
    const [n, s] = Sh(e);
    return ct(n, s, r, "SQL", e);
  }
  /**
   * Create an invalid DateTime.
   * @param {string} reason - simple string of why this DateTime is invalid. Should not contain parameters or anything else data-dependent.
   * @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
   * @return {DateTime}
   */
  static invalid(e, r = null) {
    if (!e)
      throw new Y("need to specify a reason the DateTime is invalid");
    const n = e instanceof ke ? e : new ke(e, r);
    if (V.throwOnInvalid)
      throw new Jl(n);
    return new E({
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
    const n = Mo(e, A.fromObject(r));
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
    return Do(J.parseFormat(e), A.fromObject(r)).map((s) => s.val).join("");
  }
  static resetCache() {
    vr = void 0, _r = {};
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
    return this.isValid ? hn(this).weekYear : NaN;
  }
  /**
   * Get the week number of the week year (1-52ish).
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2017, 5, 25).weekNumber //=> 21
   * @type {number}
   */
  get weekNumber() {
    return this.isValid ? hn(this).weekNumber : NaN;
  }
  /**
   * Get the day of the week.
   * 1 is Monday and 7 is Sunday
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2014, 11, 31).weekday //=> 4
   * @type {number}
   */
  get weekday() {
    return this.isValid ? hn(this).weekday : NaN;
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
    return this.isValid ? dn(this).weekday : NaN;
  }
  /**
   * Get the week number of the week year according to the locale. Different locales assign week numbers differently,
   * because the week can start on different days of the week (see localWeekday) and because a different number of days
   * is required for a week to count as the first week of a year.
   * @returns {number}
   */
  get localWeekNumber() {
    return this.isValid ? dn(this).weekNumber : NaN;
  }
  /**
   * Get the week year according to the locale. Different locales assign week numbers (and therefor week years)
   * differently, see localWeekNumber.
   * @returns {number}
   */
  get localWeekYear() {
    return this.isValid ? dn(this).weekYear : NaN;
  }
  /**
   * Get the ordinal (meaning the day of the year)
   * @example DateTime.local(2017, 5, 25).ordinal //=> 145
   * @type {number|DateTime}
   */
  get ordinal() {
    return this.isValid ? cn(this.c).ordinal : NaN;
  }
  /**
   * Get the human readable short month name, such as 'Oct'.
   * Defaults to the system's locale if no locale has been specified
   * @example DateTime.local(2017, 10, 30).monthShort //=> Oct
   * @type {string}
   */
  get monthShort() {
    return this.isValid ? Mt.months("short", {
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
    return this.isValid ? Mt.months("long", {
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
    return this.isValid ? Mt.weekdays("short", {
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
    return this.isValid ? Mt.weekdays("long", {
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
    const e = 864e5, r = 6e4, n = Vr(this.c), s = this.zone.offset(n - e), i = this.zone.offset(n + e), a = this.zone.offset(n - s * r), o = this.zone.offset(n - i * r);
    if (a === o)
      return [this];
    const u = n - a * r, c = n - o * r, l = ur(u, a), f = ur(c, o);
    return l.hour === f.hour && l.minute === f.minute && l.second === f.second && l.millisecond === f.millisecond ? [Qe(this, {
      ts: u
    }), Qe(this, {
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
    return Gt(this.year);
  }
  /**
   * Returns the number of days in this DateTime's month
   * @example DateTime.local(2016, 2).daysInMonth //=> 29
   * @example DateTime.local(2016, 3).daysInMonth //=> 31
   * @type {number}
   */
  get daysInMonth() {
    return Mr(this.year, this.month);
  }
  /**
   * Returns the number of days in this DateTime's year
   * @example DateTime.local(2016).daysInYear //=> 366
   * @example DateTime.local(2013).daysInYear //=> 365
   * @type {number}
   */
  get daysInYear() {
    return this.isValid ? mt(this.year) : NaN;
  }
  /**
   * Returns the number of weeks in this DateTime's year
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2004).weeksInWeekYear //=> 53
   * @example DateTime.local(2013).weeksInWeekYear //=> 52
   * @type {number}
   */
  get weeksInWeekYear() {
    return this.isValid ? $t(this.weekYear) : NaN;
  }
  /**
   * Returns the number of weeks in this DateTime's local week year
   * @example DateTime.local(2020, 6, {locale: 'en-US'}).weeksInLocalWeekYear //=> 52
   * @example DateTime.local(2020, 6, {locale: 'de-DE'}).weeksInLocalWeekYear //=> 53
   * @type {number}
   */
  get weeksInLocalWeekYear() {
    return this.isValid ? $t(this.localWeekYear, this.loc.getMinDaysInFirstWeek(), this.loc.getStartOfWeek()) : NaN;
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
    } = J.create(this.loc.clone(e), e).resolvedOptions(this);
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
    return this.setZone(Q.instance(e), r);
  }
  /**
   * "Set" the DateTime's zone to the host's local zone. Returns a newly-constructed DateTime.
   *
   * Equivalent to `setZone('local')`
   * @return {DateTime}
   */
  toLocal() {
    return this.setZone(V.defaultZone);
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
    if (e = Ue(e, V.defaultZone), e.equals(this.zone))
      return this;
    if (e.isValid) {
      let s = this.ts;
      if (r || n) {
        const i = e.offset(this.ts), a = this.toObject();
        [s] = wr(a, i, e);
      }
      return Qe(this, {
        ts: s,
        zone: e
      });
    } else
      return E.invalid(Ft(e));
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
    return Qe(this, {
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
    const r = Fr(e, Ei), {
      minDaysInFirstWeek: n,
      startOfWeek: s
    } = di(r, this.loc), i = !C(r.weekYear) || !C(r.weekNumber) || !C(r.weekday), a = !C(r.ordinal), o = !C(r.year), u = !C(r.month) || !C(r.day), c = o || u, l = r.weekYear || r.weekNumber;
    if ((c || a) && l)
      throw new ft("Can't mix weekYear/weekNumber units with year/month/day or ordinals");
    if (u && a)
      throw new ft("Can't mix ordinal dates with month/day");
    let f;
    i ? f = fi({
      ...xr(this.c, n, s),
      ...r
    }, n, s) : C(r.ordinal) ? (f = {
      ...this.toObject(),
      ...r
    }, C(r.day) && (f.day = Math.min(Mr(f.year, f.month), f.day))) : f = hi({
      ...cn(this.c),
      ...r
    });
    const [h, d] = wr(f, this.o, this.zone);
    return Qe(this, {
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
    const r = F.fromDurationLike(e);
    return Qe(this, Si(this, r));
  }
  /**
   * Subtract a period of time to this DateTime and return the resulting DateTime
   * See {@link DateTime#plus}
   * @param {Duration|Object|number} duration - The amount to subtract. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   @return {DateTime}
   */
  minus(e) {
    if (!this.isValid) return this;
    const r = F.fromDurationLike(e).negate();
    return Qe(this, Si(this, r));
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
    const n = {}, s = F.normalizeUnit(e);
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
    return this.isValid ? J.create(this.loc.redefaultToEN(r)).formatDateTimeFromString(this, e) : fn;
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
  toLocaleString(e = Ir, r = {}) {
    return this.isValid ? J.create(this.loc.clone(r), e).formatDateTime(this) : fn;
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
    return this.isValid ? J.create(this.loc.clone(e), e).formatDateTimeParts(this) : [];
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
    let o = mn(this, a);
    return o += "T", o += Oi(this, a, r, n, s, i), o;
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
    return this.isValid ? mn(this, e === "extended") : null;
  }
  /**
   * Returns an ISO 8601-compliant string representation of this DateTime's week date
   * @example DateTime.utc(1982, 5, 25).toISOWeekDate() //=> '1982-W21-2'
   * @return {string}
   */
  toISOWeekDate() {
    return cr(this, "kkkk-'W'WW-c");
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
    return this.isValid ? (s ? "T" : "") + Oi(this, a === "extended", r, e, n, i) : null;
  }
  /**
   * Returns an RFC 2822-compatible string representation of this DateTime
   * @example DateTime.utc(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 +0000'
   * @example DateTime.local(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 -0400'
   * @return {string}
   */
  toRFC2822() {
    return cr(this, "EEE, dd LLL yyyy HH:mm:ss ZZZ", !1);
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
    return cr(this.toUTC(), "EEE, dd LLL yyyy HH:mm:ss 'GMT'");
  }
  /**
   * Returns a string representation of this DateTime appropriate for use in SQL Date
   * @example DateTime.utc(2014, 7, 13).toSQLDate() //=> '2014-07-13'
   * @return {string}
   */
  toSQLDate() {
    return this.isValid ? mn(this, !0) : null;
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
    return (r || e) && (n && (s += " "), r ? s += "z" : e && (s += "ZZ")), cr(this, s, !0);
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
    return this.isValid ? this.toISO() : fn;
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
      return F.invalid("created by diffing an invalid DateTime");
    const s = {
      locale: this.locale,
      numberingSystem: this.numberingSystem,
      ...n
    }, i = Cf(r).map(F.normalizeUnit), a = e.valueOf() > this.valueOf(), o = a ? this : e, u = a ? e : this, c = Mh(o, u, i, s);
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
    return this.diff(E.now(), e, r);
  }
  /**
   * Return an Interval spanning between this DateTime and another DateTime
   * @param {DateTime} otherDateTime - the other end point of the Interval
   * @return {Interval}
   */
  until(e) {
    return this.isValid ? z.fromDateTimes(this, e) : this;
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
    const r = e.base || E.fromObject({}, {
      zone: this.zone
    }), n = e.padding ? this < r ? -e.padding : e.padding : 0;
    let s = ["years", "months", "days", "hours", "minutes", "seconds"], i = e.unit;
    return Array.isArray(e.unit) && (s = e.unit, i = void 0), Di(r, this.plus(n), {
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
    return this.isValid ? Di(e.base || E.fromObject({}, {
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
    if (!e.every(E.isDateTime))
      throw new Y("min requires all arguments be DateTimes");
    return mi(e, (r) => r.valueOf(), Math.min);
  }
  /**
   * Return the max of several date times
   * @param {...DateTime} dateTimes - the DateTimes from which to choose the maximum
   * @return {DateTime} the max DateTime, or undefined if called with no argument
   */
  static max(...e) {
    if (!e.every(E.isDateTime))
      throw new Y("max requires all arguments be DateTimes");
    return mi(e, (r) => r.valueOf(), Math.max);
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
    } = n, a = A.fromOpts({
      locale: s,
      numberingSystem: i,
      defaultToEN: !0
    });
    return xo(a, e, r);
  }
  /**
   * @deprecated use fromFormatExplain instead
   */
  static fromStringExplain(e, r, n = {}) {
    return E.fromFormatExplain(e, r, n);
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
    } = r, i = A.fromOpts({
      locale: n,
      numberingSystem: s,
      defaultToEN: !0
    });
    return new Io(i, e);
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
    if (C(e) || C(r))
      throw new Y("fromFormatParser requires an input string and a format parser");
    const {
      locale: s = null,
      numberingSystem: i = null
    } = n, a = A.fromOpts({
      locale: s,
      numberingSystem: i,
      defaultToEN: !0
    });
    if (!a.equals(r.locale))
      throw new Y(`fromFormatParser called with a locale of ${a}, but the format parser was created for ${r.locale}`);
    const {
      result: o,
      zone: u,
      specificOffset: c,
      invalidReason: l
    } = r.explainFromTokens(e);
    return l ? E.invalid(l) : ct(o, u, n, `format ${r.format}`, e, c);
  }
  // FORMAT PRESETS
  /**
   * {@link DateTime#toLocaleString} format like 10/14/1983
   * @type {Object}
   */
  static get DATE_SHORT() {
    return Ir;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Oct 14, 1983'
   * @type {Object}
   */
  static get DATE_MED() {
    return Na;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Fri, Oct 14, 1983'
   * @type {Object}
   */
  static get DATE_MED_WITH_WEEKDAY() {
    return Xl;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'October 14, 1983'
   * @type {Object}
   */
  static get DATE_FULL() {
    return Aa;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Tuesday, October 14, 1983'
   * @type {Object}
   */
  static get DATE_HUGE() {
    return La;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_SIMPLE() {
    return Pa;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_WITH_SECONDS() {
    return Wa;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 AM EDT'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_WITH_SHORT_OFFSET() {
    return $a;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 AM Eastern Daylight Time'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_WITH_LONG_OFFSET() {
    return za;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_SIMPLE() {
    return Va;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_WITH_SECONDS() {
    return Ua;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 EDT', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_WITH_SHORT_OFFSET() {
    return ja;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 Eastern Daylight Time', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_WITH_LONG_OFFSET() {
    return qa;
  }
  /**
   * {@link DateTime#toLocaleString} format like '10/14/1983, 9:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_SHORT() {
    return Ha;
  }
  /**
   * {@link DateTime#toLocaleString} format like '10/14/1983, 9:30:33 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_SHORT_WITH_SECONDS() {
    return Ga;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Oct 14, 1983, 9:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_MED() {
    return Ba;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Oct 14, 1983, 9:30:33 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_MED_WITH_SECONDS() {
    return Za;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Fri, 14 Oct 1983, 9:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_MED_WITH_WEEKDAY() {
    return ef;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'October 14, 1983, 9:30 AM EDT'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_FULL() {
    return Ya;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'October 14, 1983, 9:30:33 AM EDT'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_FULL_WITH_SECONDS() {
    return Ja;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Friday, October 14, 1983, 9:30 AM Eastern Daylight Time'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_HUGE() {
    return Qa;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Friday, October 14, 1983, 9:30:33 AM Eastern Daylight Time'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_HUGE_WITH_SECONDS() {
    return Ka;
  }
}
function Dt(t) {
  if (E.isDateTime(t))
    return t;
  if (t && t.valueOf && je(t.valueOf()))
    return E.fromJSDate(t);
  if (t && typeof t == "object")
    return E.fromObject(t);
  throw new Y(`Unknown datetime argument: ${t}, of type ${typeof t}`);
}
const Qh = "3.5.0";
ce.DateTime = E;
ce.Duration = F;
ce.FixedOffsetZone = Q;
ce.IANAZone = Oe;
ce.Info = Mt;
ce.Interval = z;
ce.InvalidZone = Xa;
ce.Settings = V;
ce.SystemZone = Ht;
ce.VERSION = Qh;
ce.Zone = _t;
var Ke = ce;
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
  if (t ? t instanceof I ? this._date = t._date : t instanceof Date ? this._date = Ke.DateTime.fromJSDate(t, r) : typeof t == "number" ? this._date = Ke.DateTime.fromMillis(t, r) : typeof t == "string" && (this._date = Ke.DateTime.fromISO(t, r), this._date.isValid || (this._date = Ke.DateTime.fromRFC2822(t, r)), this._date.isValid || (this._date = Ke.DateTime.fromSQL(t, r)), this._date.isValid || (this._date = Ke.DateTime.fromFormat(t, "EEE, d MMM yyyy HH:mm:ss", r))) : this._date = Ke.DateTime.local(), !this._date || !this._date.isValid)
    throw new Error("CronDate: unhandled timestamp: " + JSON.stringify(t));
  e && e !== this._date.zoneName && (this._date = this._date.setZone(e));
}
var ps = I;
function et(t) {
  return {
    start: t,
    count: 1
  };
}
function xi(t, e) {
  t.end = e, t.step = e - t.start, t.count = 2;
}
function pn(t, e, r) {
  e && (e.count === 2 ? (t.push(et(e.start)), t.push(et(e.end))) : t.push(e)), r && t.push(r);
}
function Kh(t) {
  for (var e = [], r = void 0, n = 0; n < t.length; n++) {
    var s = t[n];
    typeof s != "number" ? (pn(e, r, et(s)), r = void 0) : r ? r.count === 1 ? xi(r, s) : r.step === s - r.end ? (r.count++, r.end = s) : r.count === 2 ? (e.push(et(r.start)), r = et(r.end), xi(r, s)) : (pn(e, r), r = et(s)) : r = et(s);
  }
  return pn(e, r), e;
}
var Xh = Kh, ed = Xh;
function td(t, e, r) {
  var n = ed(t);
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
var rd = td, rt = ps, nd = rd, Mi = 1e4;
function w(t, e) {
  this._options = e, this._utc = e.utc || !1, this._tz = this._utc ? "UTC" : e.tz, this._currentDate = new rt(e.currentDate, this._tz), this._startDate = e.startDate ? new rt(e.startDate, this._tz) : null, this._endDate = e.endDate ? new rt(e.endDate, this._tz) : null, this._isIterator = e.iterator || !1, this._hasIterated = !1, this._nthDayOfWeek = e.nthDayOfWeek || 0, this.fields = w._freezeFields(t);
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
        for (var _ = 0, O = m.length; _ < O; _++) {
          var v = m[_];
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
        var M = +m;
        if (Number.isNaN(M) || M < n.min || M > n.max)
          throw new Error(
            "Constraint error, got value " + m + " expected range " + n.min + "-" + n.max
          );
        e === "dayOfWeek" && (M = M % 7), c.push(M);
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
      for (var _ = h, O = d; _ <= O; _++) {
        var v = l.indexOf(_) !== -1;
        !v && m > 0 && m % c === 0 ? (m = 1, l.push(_)) : m++;
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
  function r(v, M) {
    for (var $ = 0, X = M.length; $ < X; $++)
      if (M[$] >= v)
        return M[$] === v;
    return M[0] === v;
  }
  function n(v, M) {
    if (M < 6) {
      if (v.getDate() < 8 && M === 1)
        return !0;
      var $ = v.getDate() % 7 ? 1 : 0, X = v.getDate() - v.getDate() % 7, Z = Math.floor(X / 7) + $;
      return Z === M;
    }
    return !1;
  }
  function s(v) {
    return v.length > 0 && v.some(function(M) {
      return typeof M == "string" && M.indexOf("L") >= 0;
    });
  }
  e = e || !1;
  var i = e ? "subtract" : "add", a = new rt(this._currentDate, this._tz), o = this._startDate, u = this._endDate, c = a.getTime(), l = 0;
  function f(v) {
    return v.some(function(M) {
      if (!s([M]))
        return !1;
      var $ = Number.parseInt(M[0]) % 7;
      if (Number.isNaN($))
        throw new Error("Invalid last weekday of the month expression: " + M);
      return a.getDay() === $ && a.isLastWeekdayOfMonth();
    });
  }
  for (; l < Mi; ) {
    if (l++, e) {
      if (o && a.getTime() - o.getTime() < 0)
        throw new Error("Out of the timespan range");
    } else if (u && u.getTime() - a.getTime() < 0)
      throw new Error("Out of the timespan range");
    var h = r(a.getDate(), this.fields.dayOfMonth);
    s(this.fields.dayOfMonth) && (h = h || a.isLastDayOfMonth());
    var d = r(a.getDay(), this.fields.dayOfWeek);
    s(this.fields.dayOfWeek) && (d = d || f(this.fields.dayOfWeek));
    var m = this.fields.dayOfMonth.length >= w.daysInMonth[a.getMonth()], _ = this.fields.dayOfWeek.length === w.constraints[5].max - w.constraints[5].min + 1, O = a.getHours();
    if (!h && (!d || _)) {
      this._applyTimezoneShift(a, i, "Day");
      continue;
    }
    if (!m && _ && !h) {
      this._applyTimezoneShift(a, i, "Day");
      continue;
    }
    if (m && !_ && !d) {
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
    if (r(O, this.fields.hour)) {
      if (this._dstEnd === O && !e) {
        this._dstEnd = null, this._applyTimezoneShift(a, "add", "Hour");
        continue;
      }
    } else if (this._dstStart !== O) {
      this._dstStart = null, this._applyTimezoneShift(a, i, "Hour");
      continue;
    } else if (!r(O - 1, this.fields.hour)) {
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
  if (l >= Mi)
    throw new Error("Invalid expression, loop limit exceeded");
  return this._currentDate = new rt(a, this._tz), this._hasIterated = !0, a;
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
  this._currentDate = new rt(e || this._options.currentDate);
};
w.prototype.stringify = function(e) {
  for (var r = [], n = e ? 0 : 1, s = w.map.length; n < s; ++n) {
    var i = w.map[n], a = this.fields[i], o = w.constraints[n];
    i === "dayOfMonth" && this.fields.month.length === 1 ? o = { min: 1, max: w.daysInMonth[this.fields.month[0] - 1] } : i === "dayOfWeek" && (o = { min: 0, max: 6 }, a = a[a.length - 1] === 7 ? a.slice(0, -1) : a), r.push(nd(a, o.min, o.max));
  }
  return r.join(" ");
};
w.parse = function(e, r) {
  var n = this;
  typeof r == "function" && (r = {});
  function s(i, a) {
    a || (a = {}), typeof a.currentDate > "u" && (a.currentDate = new rt(void 0, n._tz)), w.predefined[i] && (i = w.predefined[i]);
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
        var m = h === "dayOfWeek" ? M(d) : d;
        o.push(
          w._parseField(
            h,
            m,
            w.constraints[l]
          )
        );
      }
    }
    for (var _ = {}, l = 0, f = w.map.length; l < f; l++) {
      var O = w.map[l];
      _[O] = o[l];
    }
    var v = w._handleMaxDaysInMonth(_);
    return _.dayOfMonth = v || _.dayOfMonth, new w(_, a);
    function M($) {
      var X = $.split("#");
      if (X.length > 1) {
        var Z = +X[X.length - 1];
        if (/,/.test($))
          throw new Error("Constraint error, invalid dayOfWeek `#` and `,` special characters are incompatible");
        if (/\//.test($))
          throw new Error("Constraint error, invalid dayOfWeek `#` and `/` special characters are incompatible");
        if (/-/.test($))
          throw new Error("Constraint error, invalid dayOfWeek `#` and `-` special characters are incompatible");
        if (X.length > 2 || Number.isNaN(Z) || Z < 1 || Z > 5)
          throw new Error("Constraint error, invalid dayOfWeek occurrence number (#)");
        return a.nthDayOfWeek = Z, X[0];
      }
      return $;
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
    for (var _ = 0, O = d.length; _ < O; _++) {
      var v = d[_];
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
var sd = w, Rr = sd;
function Be() {
}
Be._parseEntry = function(e) {
  var r = e.split(" ");
  if (r.length === 6)
    return {
      interval: Rr.parse(e)
    };
  if (r.length > 6)
    return {
      interval: Rr.parse(
        r.slice(0, 6).join(" ")
      ),
      command: r.slice(6, r.length)
    };
  throw new Error("Invalid entry: " + e);
};
Be.parseExpression = function(e, r) {
  return Rr.parse(e, r);
};
Be.fieldsToExpression = function(e, r) {
  return Rr.fieldsToExpression(e, r);
};
Be.parseString = function(e) {
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
          c = Be._parseEntry("0 " + u), n.expressions.push(c.interval);
        } catch (l) {
          n.errors[u] = l;
        }
      }
    }
  }
  return n;
};
Be.parseFile = function(e, r) {
  Ia.readFile(e, function(n, s) {
    if (n) {
      r(n);
      return;
    }
    return r(null, Be.parseString(s.toString()));
  });
};
var id = Be, pe = {};
pe.add = ad;
pe.addFromFront = od;
pe.remove = md;
pe.has = dd;
pe.eq = gs;
pe.lte = ud;
pe.lt = cd;
pe.gte = ld;
pe.gt = fd;
pe.nearest = hd;
function Pe(t, e) {
  return t === e ? 0 : t < e ? -1 : 1;
}
function ad(t, e, r) {
  r || (r = Pe);
  for (var n = t.push(e) - 1; n; ) {
    if (r(t[n - 1], e) < 0) return;
    t[n] = t[n - 1], t[n - 1] = e, n--;
  }
}
function od(t, e, r) {
  r || (r = Pe);
  for (var n = t.unshift(e) - 1, s = 0; s < n; s++) {
    if (r(e, t[s + 1]) < 0) return;
    t[s] = t[s + 1], t[s + 1] = e;
  }
}
function ud(t, e, r) {
  r || (r = Pe);
  var n = Yt(t, e, r);
  if (n === -1) return -1;
  for (; n >= 0; n--) {
    var s = r(t[n], e);
    if (s <= 0) return n;
  }
  return -1;
}
function cd(t, e, r) {
  r || (r = Pe);
  var n = Yt(t, e, r);
  if (n === -1) return -1;
  for (; n >= 0; n--) {
    var s = r(t[n], e);
    if (s < 0) return n;
  }
  return -1;
}
function ld(t, e, r) {
  r || (r = Pe);
  var n = Yt(t, e, r);
  if (n === -1) return -1;
  for (; n < t.length; n++) {
    var s = r(t[n], e);
    if (s >= 0) return n;
  }
  return -1;
}
function fd(t, e, r) {
  r || (r = Pe);
  var n = Yt(t, e, r);
  if (n === -1) return -1;
  for (; n < t.length; n++) {
    var s = r(t[n], e);
    if (s > 0) return n;
  }
  return -1;
}
function gs(t, e, r) {
  r || (r = Pe);
  var n = Yt(t, e, r);
  return n === -1 ? -1 : r(t[n], e) === 0 ? n : -1;
}
function hd(t, e, r) {
  r || (r = Pe);
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
function Yt(t, e, r) {
  r || (r = Pe);
  for (var n = t.length, s = n - 1, i = 0, a = -1; s >= i && i >= 0 && s < n; ) {
    a = Math.floor((s + i) / 2);
    var o = r(t[a], e);
    if (o === 0) return a;
    o >= 0 ? s = a - 1 : i = a + 1;
  }
  return a;
}
function dd(t, e, r) {
  return gs(t, e, r) > -1;
}
function md(t, e, r) {
  var n = gs(t, e, r);
  return n === -1 ? !1 : (t.splice(n, 1), !0);
}
var Ao = {};
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
})(Ao);
const ys = Ao, qe = ps, pd = pe, He = [];
let oe = null;
const Lo = new Ot();
Lo.recurs = !1;
function Po(t, e, r, n) {
  this.job = t, this.fireDate = e, this.endDate = n, this.recurrenceRule = r || Lo, this.timerID = null;
}
function Wo(t, e) {
  return t.fireDate.getTime() - e.fireDate.getTime();
}
function qr(t, e, r) {
  this.start = t || 0, this.end = e || 60, this.step = r || 1;
}
qr.prototype.contains = function(t) {
  if (this.step === null || this.step === 1)
    return t >= this.start && t <= this.end;
  for (let e = this.start; e < this.end; e += this.step)
    if (e === t)
      return !0;
  return !1;
};
function Ot(t, e, r, n, s, i, a) {
  this.recurs = !0, this.year = t ?? null, this.month = e ?? null, this.date = r ?? null, this.dayOfWeek = n ?? null, this.hour = s ?? null, this.minute = i ?? null, this.second = a ?? 0;
}
Ot.prototype.isValid = function() {
  function t(e) {
    return Array.isArray(e) || e instanceof Array ? e.every(function(r) {
      return t(r);
    }) : !(Number.isNaN(Number(e)) && !(e instanceof qr));
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
Ot.prototype.nextInvocationDate = function(t) {
  const e = this._nextInvocationDate(t);
  return e ? e.toDate() : null;
};
Ot.prototype._nextInvocationDate = function(t) {
  if (t = t instanceof qe || t instanceof Date ? t : /* @__PURE__ */ new Date(), !this.recurs || !this.isValid())
    return null;
  let r = new qe(Date.now(), this.tz).getFullYear();
  if (this.year !== null && typeof this.year == "number" && this.year < r)
    return null;
  let n = new qe(t.getTime(), this.tz);
  for (n.addSecond(); ; ) {
    if (this.year !== null) {
      if (r = n.getFullYear(), typeof this.year == "number" && this.year < r) {
        n = null;
        break;
      }
      if (!ze(r, this.year)) {
        n.addYear(), n.setMonth(0), n.setDate(1), n.setHours(0), n.setMinutes(0), n.setSeconds(0);
        continue;
      }
    }
    if (this.month != null && !ze(n.getMonth(), this.month)) {
      n.addMonth();
      continue;
    }
    if (this.date != null && !ze(n.getDate(), this.date)) {
      n.addDay();
      continue;
    }
    if (this.dayOfWeek != null && !ze(n.getDay(), this.dayOfWeek)) {
      n.addDay();
      continue;
    }
    if (this.hour != null && !ze(n.getHours(), this.hour)) {
      n.addHour();
      continue;
    }
    if (this.minute != null && !ze(n.getMinutes(), this.minute)) {
      n.addMinute();
      continue;
    }
    if (this.second != null && !ze(n.getSeconds(), this.second)) {
      n.addSecond();
      continue;
    }
    break;
  }
  return n;
};
function ze(t, e) {
  if (e == null)
    return !0;
  if (typeof e == "number")
    return t === e;
  if (typeof e == "string")
    return t === Number(e);
  if (e instanceof qr)
    return e.contains(t);
  if (Array.isArray(e) || e instanceof Array) {
    for (let r = 0; r < e.length; r++)
      if (ze(t, e[r]))
        return !0;
  }
  return !1;
}
function $o(t, e) {
  const r = Date.now(), n = t.getTime();
  return ys.setTimeout(function() {
    n > Date.now() ? $o(t, e) : e();
  }, n < r ? 0 : n - r);
}
function zo(t) {
  pd.add(He, t, Wo), ws();
  const e = t.fireDate instanceof qe ? t.fireDate.toDate() : t.fireDate;
  t.job.emit("scheduled", e);
}
function ws() {
  if (He.length > 0 && oe !== He[0]) {
    oe !== null && (ys.clearTimeout(oe.timerID), oe.timerID = null, oe = null), oe = He[0];
    const t = oe.job, e = oe;
    oe.timerID = $o(oe.fireDate, function() {
      if (gd(), t.callback && t.callback(), e.recurrenceRule.recurs || e.recurrenceRule._endDate === null) {
        const r = Vo(e.recurrenceRule, e.job, e.fireDate, e.endDate);
        r !== null && r.job.trackInvocation(r);
      }
      t.stopTrackingInvocation(e);
      try {
        const r = t.invoke(e.fireDate instanceof qe ? e.fireDate.toDate() : e.fireDate);
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
function gd() {
  He.shift(), oe = null, ws();
}
function yd(t) {
  const e = He.indexOf(t);
  e > -1 && (He.splice(e, 1), t.timerID !== null && ys.clearTimeout(t.timerID), oe === t && (oe = null), t.job.emit("canceled", t.fireDate), ws());
}
function Vo(t, e, r, n) {
  r = r instanceof qe ? r : new qe();
  const s = t instanceof Ot ? t._nextInvocationDate(r) : t.next();
  if (s === null || n instanceof qe && s.getTime() > n.getTime())
    return null;
  const i = new Po(e, s, t, n);
  return zo(i), i;
}
var Uo = {
  Range: qr,
  RecurrenceRule: Ot,
  Invocation: Po,
  cancelInvocation: yd,
  scheduleInvocation: zo,
  scheduleNextRecurrence: Vo,
  sorter: Wo,
  _invocations: He
};
function wd(t) {
  return t.getTime() === t.getTime();
}
var vd = {
  isValidDate: wd
};
const _d = Al, kd = id, gn = ps, Td = pe, { scheduleNextRecurrence: Nr, scheduleInvocation: bd, cancelInvocation: yn, RecurrenceRule: Fi, sorter: Sd, Invocation: Od } = Uo, { isValidDate: wn } = vd, vs = {};
let lr = 0;
function Ed() {
  const t = /* @__PURE__ */ new Date();
  return lr === Number.MAX_SAFE_INTEGER && (lr = 0), lr++, `<Anonymous Job ${lr} ${t.toISOString()}>`;
}
function Jt(t, e, r) {
  this.pendingInvocations = [];
  let n = 0;
  const s = t && typeof t == "string" ? t : Ed();
  this.job = t && typeof t == "function" ? t : e, this.job === t ? this.callback = typeof e == "function" ? e : !1 : this.callback = typeof r == "function" ? r : !1, this.running = 0, typeof this.job == "function" && this.job.prototype && this.job.prototype.next && (this.job = (function() {
    return this.next().value;
  }).bind(this.job.call(this))), Object.defineProperty(this, "name", {
    value: s,
    writable: !1,
    enumerable: !0
  }), this.trackInvocation = function(i) {
    return Td.add(this.pendingInvocations, i, Sd), !0;
  }, this.stopTrackingInvocation = function(i) {
    const a = this.pendingInvocations.indexOf(i);
    return a > -1 ? (this.pendingInvocations.splice(a, 1), !0) : !1;
  }, this.triggeredJobs = function() {
    return n;
  }, this.setTriggeredJobs = function(i) {
    n = i;
  }, this.deleteFromSchedule = function() {
    jo(this.name);
  }, this.cancel = function(i) {
    i = typeof i == "boolean" ? i : !1;
    let a, o;
    const u = [];
    for (let c = 0; c < this.pendingInvocations.length; c++)
      a = this.pendingInvocations[c], yn(a), i && (a.recurrenceRule.recurs || a.recurrenceRule.next) && (o = Nr(a.recurrenceRule, this, a.fireDate, a.endDate), o !== null && u.push(o));
    this.pendingInvocations = [];
    for (let c = 0; c < u.length; c++)
      this.trackInvocation(u[c]);
    return i || this.deleteFromSchedule(), !0;
  }, this.cancelNext = function(i) {
    if (i = typeof i == "boolean" ? i : !0, !this.pendingInvocations.length)
      return !1;
    let a;
    const o = this.pendingInvocations.shift();
    return yn(o), i && (o.recurrenceRule.recurs || o.recurrenceRule.next) && (a = Nr(o.recurrenceRule, this, o.fireDate, o.endDate), a !== null && this.trackInvocation(a)), !0;
  }, this.reschedule = function(i) {
    let a;
    const o = this.pendingInvocations.slice();
    for (let u = 0; u < o.length; u++)
      a = o[u], yn(a);
    return this.pendingInvocations = [], this.schedule(i) ? (this.setTriggeredJobs(0), !0) : (this.pendingInvocations = o, !1);
  }, this.nextInvocation = function() {
    return this.pendingInvocations.length ? this.pendingInvocations[0].fireDate : null;
  };
}
Object.setPrototypeOf(Jt.prototype, _d.EventEmitter.prototype);
Jt.prototype.invoke = function(t) {
  return this.setTriggeredJobs(this.triggeredJobs() + 1), this.job(t);
};
Jt.prototype.runOnDate = function(t) {
  return this.schedule(t);
};
Jt.prototype.schedule = function(t) {
  const e = this;
  let r = !1, n, s, i, a;
  typeof t == "object" && "tz" in t && (a = t.tz), typeof t == "object" && t.rule && (s = t.start || void 0, i = t.end || void 0, t = t.rule, s && (s instanceof Date || (s = new Date(s)), s = new gn(s, a), (!wn(s) || s.getTime() < Date.now()) && (s = void 0)), i && !(i instanceof Date) && !wn(i = new Date(i)) && (i = void 0), i && (i = new gn(i, a)));
  try {
    const o = kd.parseExpression(t, { currentDate: s, tz: a });
    n = Nr(o, e, s, i), n !== null && (r = e.trackInvocation(n));
  } catch {
    const u = typeof t;
    if ((u === "string" || u === "number") && (t = new Date(t)), t instanceof Date && wn(t))
      t = new gn(t), e.isOneTimeJob = !0, t.getTime() >= Date.now() && (n = new Od(e, t), bd(n), r = e.trackInvocation(n));
    else if (u === "object") {
      if (e.isOneTimeJob = !1, !(t instanceof Fi)) {
        const c = new Fi();
        "year" in t && (c.year = t.year), "month" in t && (c.month = t.month), "date" in t && (c.date = t.date), "dayOfWeek" in t && (c.dayOfWeek = t.dayOfWeek), "hour" in t && (c.hour = t.hour), "minute" in t && (c.minute = t.minute), "second" in t && (c.second = t.second), t = c;
      }
      t.tz = a, n = Nr(t, e, s, i), n !== null && (r = e.trackInvocation(n));
    }
  }
  return vs[this.name] = this, r;
};
function jo(t) {
  t && delete vs[t];
}
var qo = {
  Job: Jt,
  deleteScheduledJob: jo,
  scheduledJobs: vs
};
const { Job: _s, scheduledJobs: Ne } = qo;
function Cd() {
  if (arguments.length < 2)
    throw new RangeError("Invalid number of arguments");
  const t = arguments.length >= 3 && typeof arguments[0] == "string" ? arguments[0] : null, e = t ? arguments[1] : arguments[0], r = t ? arguments[2] : arguments[1], n = t ? arguments[3] : arguments[2];
  if (typeof r != "function")
    throw new RangeError("The job method must be a function.");
  const s = new _s(t, r, n);
  return s.schedule(e) ? s : null;
}
function Dd(t, e) {
  if (t instanceof _s) {
    if (t.reschedule(e))
      return t;
  } else if (typeof t == "string")
    if (Object.prototype.hasOwnProperty.call(Ne, t)) {
      if (Ne[t].reschedule(e))
        return Ne[t];
    } else
      throw new Error("Cannot reschedule one-off job by name, pass job reference instead");
  return null;
}
function Id(t) {
  let e = !1;
  return t instanceof _s ? e = t.cancel() : (typeof t == "string" || t instanceof String) && t in Ne && Object.prototype.hasOwnProperty.call(Ne, t) && (e = Ne[t].cancel()), e;
}
function xd() {
  const t = Object.keys(Ne).map((r) => Ne[r]);
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
var Md = {
  scheduleJob: Cd,
  rescheduleJob: Dd,
  scheduledJobs: Ne,
  cancelJob: Id,
  gracefulShutdown: xd
};
const { cancelJob: Fd, rescheduleJob: Rd, scheduledJobs: Nd, scheduleJob: Ad, gracefulShutdown: Ld } = Md, { Invocation: Pd, RecurrenceRule: Wd, Range: $d } = Uo, { Job: zd } = qo;
var Vd = {
  Job: zd,
  Invocation: Pd,
  Range: $d,
  RecurrenceRule: Wd,
  cancelJob: Fd,
  rescheduleJob: Rd,
  scheduledJobs: Nd,
  scheduleJob: Ad,
  gracefulShutdown: Ld
};
const Ri = /* @__PURE__ */ Fa(Vd), xe = /* @__PURE__ */ new Map();
function Ud() {
  S.handle("create-schedule", async (t, e) => {
    var r;
    try {
      xe.has(e.id) && ((r = xe.get(e.id)) == null || r.cancel());
      const n = Ri.scheduleJob(e.cron, () => {
        t.sender.send("schedule-triggered", {
          id: e.id,
          task: e.task
        });
      });
      return xe.set(e.id, n), !0;
    } catch (n) {
      return console.error("Failed to create schedule:", n), !1;
    }
  }), S.handle("cancel-schedule", (t, e) => {
    const r = xe.get(e);
    return r ? (r.cancel(), xe.delete(e), !0) : !1;
  }), S.handle("update-schedule", async (t, e) => {
    var r;
    try {
      xe.has(e.id) && ((r = xe.get(e.id)) == null || r.cancel());
      const n = Ri.scheduleJob(e.cron, () => {
        t.sender.send("schedule-triggered", {
          id: e.id,
          task: e.task
        });
      });
      return xe.set(e.id, n), !0;
    } catch (n) {
      return console.error("Failed to create schedule:", n), !1;
    }
  }), S.handle("get-schedules", () => Array.from(xe.keys()));
}
var Un = {}, Ho = {}, jn = { exports: {} }, fr = { exports: {} }, vn, Ni;
function jd() {
  if (Ni) return vn;
  Ni = 1;
  var t = 1e3, e = t * 60, r = e * 60, n = r * 24, s = n * 7, i = n * 365.25;
  vn = function(l, f) {
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
  return vn;
}
var _n, Ai;
function Go() {
  if (Ai) return _n;
  Ai = 1;
  function t(e) {
    n.debug = n, n.default = n, n.coerce = c, n.disable = o, n.enable = i, n.enabled = u, n.humanize = jd(), n.destroy = l, Object.keys(e).forEach((f) => {
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
      let h, d = null, m, _;
      function O(...v) {
        if (!O.enabled)
          return;
        const M = O, $ = Number(/* @__PURE__ */ new Date()), X = $ - (h || $);
        M.diff = X, M.prev = h, M.curr = $, h = $, v[0] = n.coerce(v[0]), typeof v[0] != "string" && v.unshift("%O");
        let Z = 0;
        v[0] = v[0].replace(/%([a-zA-Z%])/g, (Ye, Ct) => {
          if (Ye === "%%")
            return "%";
          Z++;
          const be = n.formatters[Ct];
          if (typeof be == "function") {
            const De = v[Z];
            Ye = be.call(M, De), v.splice(Z, 1), Z--;
          }
          return Ye;
        }), n.formatArgs.call(M, v), (M.log || n.log).apply(M, v);
      }
      return O.namespace = f, O.useColors = n.useColors(), O.color = n.selectColor(f), O.extend = s, O.destroy = n.destroy, Object.defineProperty(O, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => d !== null ? d : (m !== n.namespaces && (m = n.namespaces, _ = n.enabled(f)), _),
        set: (v) => {
          d = v;
        }
      }), typeof n.init == "function" && n.init(O), O;
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
      let d = 0, m = 0, _ = -1, O = 0;
      for (; d < f.length; )
        if (m < h.length && (h[m] === f[d] || h[m] === "*"))
          h[m] === "*" ? (_ = m, O = d, m++) : (d++, m++);
        else if (_ !== -1)
          m = _ + 1, O++, d = O;
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
  return _n = t, _n;
}
var Li;
function qd() {
  return Li || (Li = 1, function(t, e) {
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
    t.exports = Go()(e);
    const { formatters: o } = t.exports;
    o.j = function(u) {
      try {
        return JSON.stringify(u);
      } catch (c) {
        return "[UnexpectedJSONParseError]: " + c.message;
      }
    };
  }(fr, fr.exports)), fr.exports;
}
var hr = { exports: {} }, kn, Pi;
function Hd() {
  return Pi || (Pi = 1, kn = (t, e = process.argv) => {
    const r = t.startsWith("-") ? "" : t.length === 1 ? "-" : "--", n = e.indexOf(r + t), s = e.indexOf("--");
    return n !== -1 && (s === -1 || n < s);
  }), kn;
}
var Tn, Wi;
function Gd() {
  if (Wi) return Tn;
  Wi = 1;
  const t = Vl, e = xa, r = Hd(), { env: n } = process;
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
  return Tn = {
    supportsColor: o,
    stdout: i(a(!0, e.isatty(1))),
    stderr: i(a(!0, e.isatty(2)))
  }, Tn;
}
var $i;
function Bd() {
  return $i || ($i = 1, function(t, e) {
    const r = xa, n = zl;
    e.init = l, e.log = o, e.formatArgs = i, e.save = u, e.load = c, e.useColors = s, e.destroy = n.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    ), e.colors = [6, 2, 3, 4, 5, 1];
    try {
      const h = Gd();
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
      const m = d.substring(6).toLowerCase().replace(/_([a-z])/g, (O, v) => v.toUpperCase());
      let _ = process.env[d];
      return /^(yes|on|true|enabled)$/i.test(_) ? _ = !0 : /^(no|off|false|disabled)$/i.test(_) ? _ = !1 : _ === "null" ? _ = null : _ = Number(_), h[m] = _, h;
    }, {});
    function s() {
      return "colors" in e.inspectOpts ? !!e.inspectOpts.colors : r.isatty(process.stderr.fd);
    }
    function i(h) {
      const { namespace: d, useColors: m } = this;
      if (m) {
        const _ = this.color, O = "\x1B[3" + (_ < 8 ? _ : "8;5;" + _), v = `  ${O};1m${d} \x1B[0m`;
        h[0] = v + h[0].split(`
`).join(`
` + v), h.push(O + "m+" + t.exports.humanize(this.diff) + "\x1B[0m");
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
    t.exports = Go()(e);
    const { formatters: f } = t.exports;
    f.o = function(h) {
      return this.inspectOpts.colors = this.useColors, n.inspect(h, this.inspectOpts).split(`
`).map((d) => d.trim()).join(" ");
    }, f.O = function(h) {
      return this.inspectOpts.colors = this.useColors, n.inspect(h, this.inspectOpts);
    };
  }(hr, hr.exports)), hr.exports;
}
typeof process > "u" || process.type === "renderer" || process.browser === !0 || process.__nwjs ? jn.exports = qd() : jn.exports = Bd();
var Bo = jn.exports;
const qn = /* @__PURE__ */ Fa(Bo);
(function(t) {
  var e = Xs && Xs.__importDefault || function(o) {
    return o && o.__esModule ? o : { default: o };
  };
  Object.defineProperty(t, "__esModule", { value: !0 });
  const r = Ia, s = e(Bo).default("@kwsites/file-exists");
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
})(Ho);
(function(t) {
  function e(r) {
    for (var n in r) t.hasOwnProperty(n) || (t[n] = r[n]);
  }
  Object.defineProperty(t, "__esModule", { value: !0 }), e(Ho);
})(Un);
var wt = {};
Object.defineProperty(wt, "__esModule", { value: !0 });
var Zo = wt.createDeferred = ht = wt.deferred = void 0;
function ks() {
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
var ht = wt.deferred = ks;
Zo = wt.createDeferred = ks;
wt.default = ks;
var Hr = Object.defineProperty, Zd = Object.defineProperties, Yd = Object.getOwnPropertyDescriptor, Jd = Object.getOwnPropertyDescriptors, Ts = Object.getOwnPropertyNames, zi = Object.getOwnPropertySymbols, Yo = Object.prototype.hasOwnProperty, Qd = Object.prototype.propertyIsEnumerable, Vi = (t, e, r) => e in t ? Hr(t, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : t[e] = r, he = (t, e) => {
  for (var r in e || (e = {}))
    Yo.call(e, r) && Vi(t, r, e[r]);
  if (zi)
    for (var r of zi(e))
      Qd.call(e, r) && Vi(t, r, e[r]);
  return t;
}, Lt = (t, e) => Zd(t, Jd(e)), g = (t, e) => function() {
  return t && (e = (0, t[Ts(t)[0]])(t = 0)), e;
}, Kd = (t, e) => function() {
  return e || (0, t[Ts(t)[0]])((e = { exports: {} }).exports, e), e.exports;
}, G = (t, e) => {
  for (var r in e)
    Hr(t, r, { get: e[r], enumerable: !0 });
}, Xd = (t, e, r, n) => {
  if (e && typeof e == "object" || typeof e == "function")
    for (let s of Ts(e))
      !Yo.call(t, s) && s !== r && Hr(t, s, { get: () => e[s], enumerable: !(n = Yd(e, s)) || n.enumerable });
  return t;
}, U = (t) => Xd(Hr({}, "__esModule", { value: !0 }), t), Rt = (t, e, r) => new Promise((n, s) => {
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
function em(...t) {
  const e = new String(t);
  return Gr.set(e, t), e;
}
function Ar(t) {
  return t instanceof String && Gr.has(t);
}
function Ui(t) {
  return Gr.get(t) || [];
}
var Gr, Qt = g({
  "src/lib/args/pathspec.ts"() {
    Gr = /* @__PURE__ */ new WeakMap();
  }
}), Le, Ze = g({
  "src/lib/errors/git-error.ts"() {
    Le = class extends Error {
      constructor(t, e) {
        super(e), this.task = t, Object.setPrototypeOf(this, new.target.prototype);
      }
    };
  }
}), Kt, Et = g({
  "src/lib/errors/git-response-error.ts"() {
    Ze(), Kt = class extends Le {
      constructor(t, e) {
        super(void 0, e || String(t)), this.git = t;
      }
    };
  }
}), Jo, Qo = g({
  "src/lib/errors/task-configuration-error.ts"() {
    Ze(), Jo = class extends Le {
      constructor(t) {
        super(void 0, t);
      }
    };
  }
});
function Ko(t) {
  return typeof t == "function" ? t : at;
}
function Xo(t) {
  return typeof t == "function" && t !== at;
}
function eu(t, e) {
  const r = t.indexOf(e);
  return r <= 0 ? [t, ""] : [t.substr(0, r), t.substr(r + 1)];
}
function tu(t, e = 0) {
  return ru(t) && t.length > e ? t[e] : void 0;
}
function st(t, e = 0) {
  if (ru(t) && t.length > e)
    return t[t.length - 1 - e];
}
function ru(t) {
  return !!(t && typeof t.length == "number");
}
function Xt(t = "", e = !0, r = `
`) {
  return t.split(r).reduce((n, s) => {
    const i = e ? s.trim() : s;
    return i && n.push(i), n;
  }, []);
}
function bs(t, e) {
  return Xt(t, !0).map((r) => e(r));
}
function Ss(t) {
  return Un.exists(t, Un.FOLDER);
}
function R(t, e) {
  return Array.isArray(t) ? t.includes(e) || t.push(e) : t.add(e), e;
}
function nu(t, e) {
  return Array.isArray(t) && !t.includes(e) && t.push(e), t;
}
function Br(t, e) {
  if (Array.isArray(t)) {
    const r = t.indexOf(e);
    r >= 0 && t.splice(r, 1);
  } else
    t.delete(e);
  return e;
}
function Ee(t) {
  return Array.isArray(t) ? t : [t];
}
function su(t) {
  return t.replace(/[\s-]+(.)/g, (e, r) => r.toUpperCase());
}
function iu(t) {
  return Ee(t).map(String);
}
function W(t, e = 0) {
  if (t == null)
    return e;
  const r = parseInt(t, 10);
  return isNaN(r) ? e : r;
}
function zt(t, e) {
  const r = [];
  for (let n = 0, s = t.length; n < s; n++)
    r.push(e, t[n]);
  return r;
}
function Vt(t) {
  return (Array.isArray(t) ? Buffer.concat(t) : t).toString("utf-8");
}
function au(t, e) {
  return Object.assign(
    {},
    ...e.map((r) => r in t ? { [r]: t[r] } : {})
  );
}
function Hn(t = 0) {
  return new Promise((e) => setTimeout(e, t));
}
function Gn(t) {
  if (t !== !1)
    return t;
}
var vt, at, er, Zr = g({
  "src/lib/utils/util.ts"() {
    vt = "\0", at = () => {
    }, er = Object.prototype.toString.call.bind(Object.prototype.toString);
  }
});
function Ce(t, e, r) {
  return e(t) ? t : arguments.length > 2 ? r : void 0;
}
function Os(t, e) {
  const r = Ar(t) ? "string" : typeof t;
  return /number|string|boolean/.test(r) && (!e || !e.includes(r));
}
function Es(t) {
  return !!t && er(t) === "[object Object]";
}
function ou(t) {
  return typeof t == "function";
}
var tr, K, uu, Lr, Cs, cu = g({
  "src/lib/utils/argument-filters.ts"() {
    Zr(), Qt(), tr = (t) => Array.isArray(t), K = (t) => typeof t == "string", uu = (t) => Array.isArray(t) && t.every(K), Lr = (t) => K(t) || Array.isArray(t) && t.every(K), Cs = (t) => t == null || "number|boolean|function".includes(typeof t) ? !1 : Array.isArray(t) || typeof t == "string" || typeof t.length == "number";
  }
}), Bn, tm = g({
  "src/lib/utils/exit-codes.ts"() {
    Bn = /* @__PURE__ */ ((t) => (t[t.SUCCESS = 0] = "SUCCESS", t[t.ERROR = 1] = "ERROR", t[t.NOT_FOUND = -2] = "NOT_FOUND", t[t.UNCLEAN = 128] = "UNCLEAN", t))(Bn || {});
  }
}), Ut, rm = g({
  "src/lib/utils/git-output-streams.ts"() {
    Ut = class {
      constructor(t, e) {
        this.stdOut = t, this.stdErr = e;
      }
      asStrings() {
        return new Ut(this.stdOut.toString("utf8"), this.stdErr.toString("utf8"));
      }
    };
  }
}), x, Ge, nm = g({
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
    }, Ge = class extends x {
      addMatch(t, e, r) {
        return /^remote:\s/.test(String(r)) && super.addMatch(t, e, r);
      }
      pushMatch(t, e) {
        (t > 0 || e.length > 1) && super.pushMatch(t, e);
      }
    };
  }
});
function lu(...t) {
  const e = process.cwd(), r = Object.assign(
    he({ baseDir: e }, fu),
    ...t.filter((n) => typeof n == "object" && n)
  );
  return r.baseDir = r.baseDir || e, r.trimmed = r.trimmed === !0, r;
}
var fu, sm = g({
  "src/lib/utils/simple-git-options.ts"() {
    fu = {
      binary: "git",
      maxConcurrentProcesses: 5,
      config: [],
      trimmed: !1
    };
  }
});
function Ds(t, e = []) {
  return Es(t) ? Object.keys(t).reduce((r, n) => {
    const s = t[n];
    return Ar(s) ? r.push(s) : Os(s, ["boolean"]) ? r.push(n + "=" + s) : r.push(n), r;
  }, e) : e;
}
function re(t, e = 0, r = !1) {
  const n = [];
  for (let s = 0, i = e < 0 ? t.length : e; s < i; s++)
    "string|number".includes(typeof t[s]) && n.push(String(t[s]));
  return Ds(Is(t), n), r || n.push(...im(t)), n;
}
function im(t) {
  const e = typeof st(t) == "function";
  return Ce(st(t, e ? 1 : 0), tr, []);
}
function Is(t) {
  const e = ou(st(t));
  return Ce(st(t, e ? 1 : 0), Es);
}
function q(t, e = !0) {
  const r = Ko(st(t));
  return e || Xo(r) ? r : void 0;
}
var am = g({
  "src/lib/utils/task-options.ts"() {
    cu(), Zr(), Qt();
  }
});
function Zn(t, e) {
  return t(e.stdOut, e.stdErr);
}
function ie(t, e, r, n = !0) {
  return Ee(r).forEach((s) => {
    for (let i = Xt(s, n), a = 0, o = i.length; a < o; a++) {
      const u = (c = 0) => {
        if (!(a + c >= o))
          return i[a + c];
      };
      e.some(({ parse: c }) => c(u, t));
    }
  }), t;
}
var om = g({
  "src/lib/utils/task-parser.ts"() {
    Zr();
  }
}), hu = {};
G(hu, {
  ExitCodes: () => Bn,
  GitOutputStreams: () => Ut,
  LineParser: () => x,
  NOOP: () => at,
  NULL: () => vt,
  RemoteLineParser: () => Ge,
  append: () => R,
  appendTaskOptions: () => Ds,
  asArray: () => Ee,
  asCamelCase: () => su,
  asFunction: () => Ko,
  asNumber: () => W,
  asStringArray: () => iu,
  bufferToString: () => Vt,
  callTaskParser: () => Zn,
  createInstanceConfig: () => lu,
  delay: () => Hn,
  filterArray: () => tr,
  filterFunction: () => ou,
  filterHasLength: () => Cs,
  filterPlainObject: () => Es,
  filterPrimitives: () => Os,
  filterString: () => K,
  filterStringArray: () => uu,
  filterStringOrStringArray: () => Lr,
  filterType: () => Ce,
  first: () => tu,
  folderExists: () => Ss,
  forEachLineWithContent: () => bs,
  getTrailingOptions: () => re,
  including: () => nu,
  isUserFunction: () => Xo,
  last: () => st,
  objectToString: () => er,
  orVoid: () => Gn,
  parseStringResponse: () => ie,
  pick: () => au,
  prefixedArray: () => zt,
  remove: () => Br,
  splitOn: () => eu,
  toLinesWithContent: () => Xt,
  trailingFunctionArgument: () => q,
  trailingOptionsArgument: () => Is
});
var D = g({
  "src/lib/utils/index.ts"() {
    cu(), tm(), rm(), nm(), sm(), am(), om(), Zr();
  }
}), du = {};
G(du, {
  CheckRepoActions: () => Yn,
  checkIsBareRepoTask: () => pu,
  checkIsRepoRootTask: () => mu,
  checkIsRepoTask: () => um
});
function um(t) {
  switch (t) {
    case "bare":
      return pu();
    case "root":
      return mu();
  }
  return {
    commands: ["rev-parse", "--is-inside-work-tree"],
    format: "utf-8",
    onError: Yr,
    parser: xs
  };
}
function mu() {
  return {
    commands: ["rev-parse", "--git-dir"],
    format: "utf-8",
    onError: Yr,
    parser(e) {
      return /^\.(git)?$/.test(e.trim());
    }
  };
}
function pu() {
  return {
    commands: ["rev-parse", "--is-bare-repository"],
    format: "utf-8",
    onError: Yr,
    parser: xs
  };
}
function cm(t) {
  return /(Not a git repository|Kein Git-Repository)/i.test(String(t));
}
var Yn, Yr, xs, gu = g({
  "src/lib/tasks/check-is-repo.ts"() {
    D(), Yn = /* @__PURE__ */ ((t) => (t.BARE = "bare", t.IN_TREE = "tree", t.IS_REPO_ROOT = "root", t))(Yn || {}), Yr = ({ exitCode: t }, e, r, n) => {
      if (t === 128 && cm(e))
        return r(Buffer.from("false"));
      n(e);
    }, xs = (t) => t.trim() === "true";
  }
});
function lm(t, e) {
  const r = new yu(t), n = t ? vu : wu;
  return Xt(e).forEach((s) => {
    const i = s.replace(n, "");
    r.paths.push(i), (_u.test(i) ? r.folders : r.files).push(i);
  }), r;
}
var yu, wu, vu, _u, fm = g({
  "src/lib/responses/CleanSummary.ts"() {
    D(), yu = class {
      constructor(t) {
        this.dryRun = t, this.paths = [], this.files = [], this.folders = [];
      }
    }, wu = /^[a-z]+\s*/i, vu = /^[a-z]+\s+[a-z]+\s*/i, _u = /\/$/;
  }
}), Jn = {};
G(Jn, {
  EMPTY_COMMANDS: () => Jr,
  adhocExecTask: () => ku,
  configurationErrorTask: () => ne,
  isBufferTask: () => bu,
  isEmptyTask: () => Su,
  straightThroughBufferTask: () => Tu,
  straightThroughStringTask: () => te
});
function ku(t) {
  return {
    commands: Jr,
    format: "empty",
    parser: t
  };
}
function ne(t) {
  return {
    commands: Jr,
    format: "empty",
    parser() {
      throw typeof t == "string" ? new Jo(t) : t;
    }
  };
}
function te(t, e = !1) {
  return {
    commands: t,
    format: "utf-8",
    parser(r) {
      return e ? String(r).trim() : r;
    }
  };
}
function Tu(t) {
  return {
    commands: t,
    format: "buffer",
    parser(e) {
      return e;
    }
  };
}
function bu(t) {
  return t.format === "buffer";
}
function Su(t) {
  return t.format === "empty" || !t.commands.length;
}
var Jr, H = g({
  "src/lib/tasks/task.ts"() {
    Qo(), Jr = [];
  }
}), Ou = {};
G(Ou, {
  CONFIG_ERROR_INTERACTIVE_MODE: () => Ms,
  CONFIG_ERROR_MODE_REQUIRED: () => Fs,
  CONFIG_ERROR_UNKNOWN_OPTION: () => Rs,
  CleanOptions: () => kr,
  cleanTask: () => Eu,
  cleanWithOptionsTask: () => hm,
  isCleanOptionsArray: () => dm
});
function hm(t, e) {
  const { cleanMode: r, options: n, valid: s } = mm(t);
  return r ? s.options ? (n.push(...e), n.some(ym) ? ne(Ms) : Eu(r, n)) : ne(Rs + JSON.stringify(t)) : ne(Fs);
}
function Eu(t, e) {
  return {
    commands: ["clean", `-${t}`, ...e],
    format: "utf-8",
    parser(n) {
      return lm(t === "n", n);
    }
  };
}
function dm(t) {
  return Array.isArray(t) && t.every((e) => Ns.has(e));
}
function mm(t) {
  let e, r = [], n = { cleanMode: !1, options: !0 };
  return t.replace(/[^a-z]i/g, "").split("").forEach((s) => {
    pm(s) ? (e = s, n.cleanMode = !0) : n.options = n.options && gm(r[r.length] = `-${s}`);
  }), {
    cleanMode: e,
    options: r,
    valid: n
  };
}
function pm(t) {
  return t === "f" || t === "n";
}
function gm(t) {
  return /^-[a-z]$/i.test(t) && Ns.has(t.charAt(1));
}
function ym(t) {
  return /^-[^\-]/.test(t) ? t.indexOf("i") > 0 : t === "--interactive";
}
var Ms, Fs, Rs, kr, Ns, Cu = g({
  "src/lib/tasks/clean.ts"() {
    fm(), D(), H(), Ms = "Git clean interactive mode is not supported", Fs = 'Git clean mode parameter ("n" or "f") is required', Rs = "Git clean unknown option found in: ", kr = /* @__PURE__ */ ((t) => (t.DRY_RUN = "n", t.FORCE = "f", t.IGNORED_INCLUDED = "x", t.IGNORED_ONLY = "X", t.EXCLUDING = "e", t.QUIET = "q", t.RECURSIVE = "d", t))(kr || {}), Ns = /* @__PURE__ */ new Set([
      "i",
      ...iu(Object.values(kr))
    ]);
  }
});
function wm(t) {
  const e = new Iu();
  for (const r of Du(t))
    e.addValue(r.file, String(r.key), r.value);
  return e;
}
function vm(t, e) {
  let r = null;
  const n = [], s = /* @__PURE__ */ new Map();
  for (const i of Du(t, e))
    i.key === e && (n.push(r = i.value), s.has(i.file) || s.set(i.file, []), s.get(i.file).push(r));
  return {
    key: e,
    paths: Array.from(s.keys()),
    scopes: s,
    value: r,
    values: n
  };
}
function _m(t) {
  return t.replace(/^(file):/, "");
}
function* Du(t, e = null) {
  const r = t.split("\0");
  for (let n = 0, s = r.length - 1; n < s; ) {
    const i = _m(r[n++]);
    let a = r[n++], o = e;
    if (a.includes(`
`)) {
      const u = eu(a, `
`);
      o = u[0], a = u[1];
    }
    yield { file: i, key: o, value: a };
  }
}
var Iu, km = g({
  "src/lib/responses/ConfigList.ts"() {
    D(), Iu = class {
      constructor() {
        this.files = [], this.values = /* @__PURE__ */ Object.create(null);
      }
      get all() {
        return this._all || (this._all = this.files.reduce((t, e) => Object.assign(t, this.values[e]), {})), this._all;
      }
      addFile(t) {
        if (!(t in this.values)) {
          const e = st(this.files);
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
function bn(t, e) {
  return typeof t == "string" && Qn.hasOwnProperty(t) ? t : e;
}
function Tm(t, e, r, n) {
  const s = ["config", `--${n}`];
  return r && s.push("--add"), s.push(t, e), {
    commands: s,
    format: "utf-8",
    parser(i) {
      return i;
    }
  };
}
function bm(t, e) {
  const r = ["config", "--null", "--show-origin", "--get-all", t];
  return e && r.splice(1, 0, `--${e}`), {
    commands: r,
    format: "utf-8",
    parser(n) {
      return vm(n, t);
    }
  };
}
function Sm(t) {
  const e = ["config", "--list", "--show-origin", "--null"];
  return t && e.push(`--${t}`), {
    commands: e,
    format: "utf-8",
    parser(r) {
      return wm(r);
    }
  };
}
function Om() {
  return {
    addConfig(t, e, ...r) {
      return this._runTask(
        Tm(
          t,
          e,
          r[0] === !0,
          bn(
            r[1],
            "local"
            /* local */
          )
        ),
        q(arguments)
      );
    },
    getConfig(t, e) {
      return this._runTask(
        bm(t, bn(e, void 0)),
        q(arguments)
      );
    },
    listConfig(...t) {
      return this._runTask(
        Sm(bn(t[0], void 0)),
        q(arguments)
      );
    }
  };
}
var Qn, xu = g({
  "src/lib/tasks/config.ts"() {
    km(), D(), Qn = /* @__PURE__ */ ((t) => (t.system = "system", t.global = "global", t.local = "local", t.worktree = "worktree", t))(Qn || {});
  }
});
function Em(t) {
  return Mu.has(t);
}
var Sn, Mu, Fu = g({
  "src/lib/tasks/diff-name-status.ts"() {
    Sn = /* @__PURE__ */ ((t) => (t.ADDED = "A", t.COPIED = "C", t.DELETED = "D", t.MODIFIED = "M", t.RENAMED = "R", t.CHANGED = "T", t.UNMERGED = "U", t.UNKNOWN = "X", t.BROKEN = "B", t))(Sn || {}), Mu = new Set(Object.values(Sn));
  }
});
function Cm(...t) {
  return new Nu().param(...t);
}
function Dm(t) {
  const e = /* @__PURE__ */ new Set(), r = {};
  return bs(t, (n) => {
    const [s, i, a] = n.split(vt);
    e.add(s), (r[s] = r[s] || []).push({
      line: W(i),
      path: s,
      preview: a
    });
  }), {
    paths: e,
    results: r
  };
}
function Im() {
  return {
    grep(t) {
      const e = q(arguments), r = re(arguments);
      for (const s of Ru)
        if (r.includes(s))
          return this._runTask(
            ne(`git.grep: use of "${s}" is not supported.`),
            e
          );
      typeof t == "string" && (t = Cm().param(t));
      const n = ["grep", "--null", "-n", "--full-name", ...r, ...t];
      return this._runTask(
        {
          commands: n,
          format: "utf-8",
          parser(s) {
            return Dm(s);
          }
        },
        e
      );
    }
  };
}
var Ru, It, ji, Nu, Au = g({
  "src/lib/tasks/grep.ts"() {
    D(), H(), Ru = ["-h"], It = Symbol("grepQuery"), Nu = class {
      constructor() {
        this[ji] = [];
      }
      *[(ji = It, Symbol.iterator)]() {
        for (const t of this[It])
          yield t;
      }
      and(...t) {
        return t.length && this[It].push("--and", "(", ...zt(t, "-e"), ")"), this;
      }
      param(...t) {
        return this[It].push(...zt(t, "-e")), this;
      }
    };
  }
}), Lu = {};
G(Lu, {
  ResetMode: () => Tr,
  getResetMode: () => Mm,
  resetTask: () => xm
});
function xm(t, e) {
  const r = ["reset"];
  return Pu(t) && r.push(`--${t}`), r.push(...e), te(r);
}
function Mm(t) {
  if (Pu(t))
    return t;
  switch (typeof t) {
    case "string":
    case "undefined":
      return "soft";
  }
}
function Pu(t) {
  return Wu.includes(t);
}
var Tr, Wu, $u = g({
  "src/lib/tasks/reset.ts"() {
    H(), Tr = /* @__PURE__ */ ((t) => (t.MIXED = "mixed", t.SOFT = "soft", t.HARD = "hard", t.MERGE = "merge", t.KEEP = "keep", t))(Tr || {}), Wu = Array.from(Object.values(Tr));
  }
});
function Fm() {
  return qn("simple-git");
}
function qi(t, e, r) {
  return !e || !String(e).replace(/\s*/, "") ? r ? (n, ...s) => {
    t(n, ...s), r(n, ...s);
  } : t : (n, ...s) => {
    t(`%s ${n}`, e, ...s), r && r(n, ...s);
  };
}
function Rm(t, e, { namespace: r }) {
  if (typeof t == "string")
    return t;
  const n = e && e.namespace || "";
  return n.startsWith(r) ? n.substr(r.length + 1) : n || r;
}
function As(t, e, r, n = Fm()) {
  const s = t && `[${t}]` || "", i = [], a = typeof e == "string" ? n.extend(e) : e, o = Rm(Ce(e, K), a, n);
  return c(r);
  function u(l, f) {
    return R(
      i,
      As(t, o.replace(/^[^:]+/, l), f, n)
    );
  }
  function c(l) {
    const f = l && `[${l}]` || "", h = a && qi(a, f) || at, d = qi(n, `${s} ${f}`, h);
    return Object.assign(a ? h : d, {
      label: t,
      sibling: u,
      info: d,
      step: c
    });
  }
}
var zu = g({
  "src/lib/git-logger.ts"() {
    D(), qn.formatters.L = (t) => String(Cs(t) ? t.length : "-"), qn.formatters.B = (t) => Buffer.isBuffer(t) ? t.toString("utf8") : er(t);
  }
}), dr, Kn, Nm = g({
  "src/lib/runners/tasks-pending-queue.ts"() {
    Ze(), zu(), dr = class {
      constructor(t = "GitExecutor") {
        this.logLabel = t, this._queue = /* @__PURE__ */ new Map();
      }
      withProgress(t) {
        return this._queue.get(t);
      }
      createProgress(t) {
        const e = dr.getName(t.commands[0]), r = As(this.logLabel, e);
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
          throw new Le(void 0, "TasksPendingQueue: attempt called for an unknown task");
        return e.logger("Starting task"), e;
      }
      static getName(t = "empty") {
        return `task:${t}:${++dr.counter}`;
      }
    }, Kn = dr, Kn.counter = 0;
  }
});
function Xe(t, e) {
  return {
    method: tu(t.commands) || "",
    commands: e
  };
}
function Am(t, e) {
  return (r) => {
    e("[ERROR] child process exception %o", r), t.push(Buffer.from(String(r.stack), "ascii"));
  };
}
function Hi(t, e, r, n) {
  return (s) => {
    r("%s received %L bytes", e, s), n("%B", s), t.push(s);
  };
}
var Xn, Lm = g({
  "src/lib/runners/git-executor-chain.ts"() {
    Ze(), H(), D(), Nm(), Xn = class {
      constructor(t, e, r) {
        this._executor = t, this._scheduler = e, this._plugins = r, this._chain = Promise.resolve(), this._queue = new Kn();
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
        return Rt(this, null, function* () {
          const e = yield this._scheduler.next(), r = () => this._queue.complete(t);
          try {
            const { logger: n } = this._queue.attempt(t);
            return yield Su(t) ? this.attemptEmptyTask(t, n) : this.attemptRemoteTask(t, n);
          } catch (n) {
            throw this.onFatalException(t, n);
          } finally {
            r(), e();
          }
        });
      }
      onFatalException(t, e) {
        const r = e instanceof Le ? Object.assign(e, { task: t }) : new Le(t, e && String(e));
        return this._chain = Promise.resolve(), this._queue.fatal(r), r;
      }
      attemptRemoteTask(t, e) {
        return Rt(this, null, function* () {
          const r = this._plugins.exec("spawn.binary", "", Xe(t, t.commands)), n = this._plugins.exec(
            "spawn.args",
            [...t.commands],
            Xe(t, t.commands)
          ), s = yield this.gitResponse(
            t,
            r,
            n,
            this.outputHandler,
            e.step("SPAWN")
          ), i = yield this.handleTaskData(t, n, s, e.step("HANDLE"));
          return e("passing response to task's parser as a %s", t.format), bu(t) ? Zn(t.parser, i) : Zn(t.parser, i.asStrings());
        });
      }
      attemptEmptyTask(t, e) {
        return Rt(this, null, function* () {
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
            he(he({}, Xe(t, e)), r)
          );
          if (l && t.onError)
            return n.info("exitCode=%s handling with custom error handler"), t.onError(
              r,
              l,
              (f) => {
                n.info("custom error handler treated as success"), n("custom error returned a %s", er(f)), u(
                  new Ut(
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
          n.info("retrieving task output complete"), u(new Ut(Buffer.concat(a), Buffer.concat(o)));
        });
      }
      gitResponse(t, e, r, n, s) {
        return Rt(this, null, function* () {
          const i = s.sibling("output"), a = this._plugins.exec(
            "spawn.options",
            {
              cwd: this.cwd,
              env: this.env,
              windowsHide: !0
            },
            Xe(t, t.commands)
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
            this._plugins.exec("spawn.before", void 0, Lt(he({}, Xe(t, r)), {
              kill(h) {
                l = h || l;
              }
            }));
            const f = Fl(e, r, a);
            f.stdout.on(
              "data",
              Hi(u, "stdOut", s, i.step("stdOut"))
            ), f.stderr.on(
              "data",
              Hi(c, "stdErr", s, i.step("stdErr"))
            ), f.on("error", Am(c, s)), n && (s("Passing child process stdOut/stdErr to custom outputHandler"), n(e, f.stdout, f.stderr, [...r])), this._plugins.exec("spawn.after", void 0, Lt(he({}, Xe(t, r)), {
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
        return this._plugins.exec("spawn.before", void 0, Lt(he({}, Xe(t, e)), {
          kill(n) {
            r = n || r;
          }
        })), r;
      }
    };
  }
}), Vu = {};
G(Vu, {
  GitExecutor: () => Uu
});
var Uu, Pm = g({
  "src/lib/runners/git-executor.ts"() {
    Lm(), Uu = class {
      constructor(t, e, r) {
        this.cwd = t, this._scheduler = e, this._plugins = r, this._chain = new Xn(this, this._scheduler, this._plugins);
      }
      chain() {
        return new Xn(this, this._scheduler, this._plugins);
      }
      push(t) {
        return this._chain.push(t);
      }
    };
  }
});
function Wm(t, e, r = at) {
  const n = (i) => {
    r(null, i);
  }, s = (i) => {
    (i == null ? void 0 : i.task) === t && r(
      i instanceof Kt ? $m(i) : i,
      void 0
    );
  };
  e.then(n, s);
}
function $m(t) {
  let e = (n) => {
    console.warn(
      `simple-git deprecation notice: accessing GitResponseError.${n} should be GitResponseError.git.${n}, this will no longer be available in version 3`
    ), e = at;
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
var zm = g({
  "src/lib/task-callback.ts"() {
    Et(), D();
  }
});
function Gi(t, e) {
  return ku((r) => {
    if (!Ss(t))
      throw new Error(`Git.cwd: cannot change to non-directory "${t}"`);
    return (e || r).cwd = t;
  });
}
var Vm = g({
  "src/lib/tasks/change-working-directory.ts"() {
    D(), H();
  }
});
function On(t) {
  const e = ["checkout", ...t];
  return e[1] === "-b" && e.includes("-B") && (e[1] = Br(e, "-B")), te(e);
}
function Um() {
  return {
    checkout() {
      return this._runTask(
        On(re(arguments, 1)),
        q(arguments)
      );
    },
    checkoutBranch(t, e) {
      return this._runTask(
        On(["-b", t, e, ...re(arguments)]),
        q(arguments)
      );
    },
    checkoutLocalBranch(t) {
      return this._runTask(
        On(["-b", t, ...re(arguments)]),
        q(arguments)
      );
    }
  };
}
var jm = g({
  "src/lib/tasks/checkout.ts"() {
    D(), H();
  }
});
function qm() {
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
function Hm() {
  return {
    countObjects() {
      return this._runTask({
        commands: ["count-objects", "--verbose"],
        format: "utf-8",
        parser(t) {
          return ie(qm(), [ju], t);
        }
      });
    }
  };
}
var ju, Gm = g({
  "src/lib/tasks/count-objects.ts"() {
    D(), ju = new x(
      /([a-z-]+): (\d+)$/,
      (t, [e, r]) => {
        const n = su(e);
        t.hasOwnProperty(n) && (t[n] = W(r));
      }
    );
  }
});
function Bm(t) {
  return ie({
    author: null,
    branch: "",
    commit: "",
    root: !1,
    summary: {
      changes: 0,
      insertions: 0,
      deletions: 0
    }
  }, qu, t);
}
var qu, Zm = g({
  "src/lib/parsers/parse-commit.ts"() {
    D(), qu = [
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
function Ym(t, e, r) {
  return {
    commands: [
      "-c",
      "core.abbrev=40",
      "commit",
      ...zt(t, "-m"),
      ...e,
      ...r
    ],
    format: "utf-8",
    parser: Bm
  };
}
function Jm() {
  return {
    commit(e, ...r) {
      const n = q(arguments), s = t(e) || Ym(
        Ee(e),
        Ee(Ce(r[0], Lr, [])),
        [...Ce(r[1], tr, []), ...re(arguments, 0, !0)]
      );
      return this._runTask(s, n);
    }
  };
  function t(e) {
    return !Lr(e) && ne(
      "git.commit: requires the commit message to be supplied as a string/string[]"
    );
  }
}
var Qm = g({
  "src/lib/tasks/commit.ts"() {
    Zm(), D(), H();
  }
});
function Km() {
  return {
    firstCommit() {
      return this._runTask(
        te(["rev-list", "--max-parents=0", "HEAD"], !0),
        q(arguments)
      );
    }
  };
}
var Xm = g({
  "src/lib/tasks/first-commit.ts"() {
    D(), H();
  }
});
function ep(t, e) {
  const r = ["hash-object", t];
  return e && r.push("-w"), te(r, !0);
}
var tp = g({
  "src/lib/tasks/hash-object.ts"() {
    H();
  }
});
function rp(t, e, r) {
  const n = String(r).trim();
  let s;
  if (s = Hu.exec(n))
    return new br(t, e, !1, s[1]);
  if (s = Gu.exec(n))
    return new br(t, e, !0, s[1]);
  let i = "";
  const a = n.split(" ");
  for (; a.length; )
    if (a.shift() === "in") {
      i = a.join(" ");
      break;
    }
  return new br(t, e, /^re/i.test(n), i);
}
var br, Hu, Gu, np = g({
  "src/lib/responses/InitSummary.ts"() {
    br = class {
      constructor(t, e, r, n) {
        this.bare = t, this.path = e, this.existing = r, this.gitDir = n;
      }
    }, Hu = /^Init.+ repository in (.+)$/, Gu = /^Rein.+ in (.+)$/;
  }
});
function sp(t) {
  return t.includes(Ls);
}
function ip(t = !1, e, r) {
  const n = ["init", ...r];
  return t && !sp(n) && n.splice(1, 0, Ls), {
    commands: n,
    format: "utf-8",
    parser(s) {
      return rp(n.includes("--bare"), e, s);
    }
  };
}
var Ls, ap = g({
  "src/lib/tasks/init.ts"() {
    np(), Ls = "--bare";
  }
});
function Ps(t) {
  for (let e = 0; e < t.length; e++) {
    const r = Ws.exec(t[e]);
    if (r)
      return `--${r[1]}`;
  }
  return "";
}
function op(t) {
  return Ws.test(t);
}
var Ws, rr = g({
  "src/lib/args/log-format.ts"() {
    Ws = /^--(stat|numstat|name-only|name-status)(=|$)/;
  }
}), Bu, up = g({
  "src/lib/responses/DiffSummary.ts"() {
    Bu = class {
      constructor() {
        this.changed = 0, this.deletions = 0, this.insertions = 0, this.files = [];
      }
    };
  }
});
function Zu(t = "") {
  const e = Yu[t];
  return (r) => ie(new Bu(), e, r, !1);
}
var En, Bi, Zi, Yi, Yu, Ju = g({
  "src/lib/parsers/parse-diff-summary.ts"() {
    rr(), up(), Fu(), D(), En = [
      new x(
        /^(.+)\s+\|\s+(\d+)(\s+[+\-]+)?$/,
        (t, [e, r, n = ""]) => {
          t.files.push({
            file: e.trim(),
            changes: W(r),
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
            before: W(r),
            after: W(n),
            binary: !0
          });
        }
      ),
      new x(
        /(\d+) files? changed\s*((?:, \d+ [^,]+){0,2})/,
        (t, [e, r]) => {
          const n = /(\d+) i/.exec(r), s = /(\d+) d/.exec(r);
          t.changed = W(e), t.insertions = W(n == null ? void 0 : n[1]), t.deletions = W(s == null ? void 0 : s[1]);
        }
      )
    ], Bi = [
      new x(
        /(\d+)\t(\d+)\t(.+)$/,
        (t, [e, r, n]) => {
          const s = W(e), i = W(r);
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
    ], Zi = [
      new x(/(.+)$/, (t, [e]) => {
        t.changed++, t.files.push({
          file: e,
          changes: 0,
          insertions: 0,
          deletions: 0,
          binary: !1
        });
      })
    ], Yi = [
      new x(
        /([ACDMRTUXB])([0-9]{0,3})\t(.[^\t]*)(\t(.[^\t]*))?$/,
        (t, [e, r, n, s, i]) => {
          t.changed++, t.files.push({
            file: i ?? n,
            changes: 0,
            insertions: 0,
            deletions: 0,
            binary: !1,
            status: Gn(Em(e) && e),
            from: Gn(!!i && n !== i && n),
            similarity: W(r)
          });
        }
      )
    ], Yu = {
      "": En,
      "--stat": En,
      "--numstat": Bi,
      "--name-status": Yi,
      "--name-only": Zi
    };
  }
});
function cp(t, e) {
  return e.reduce(
    (r, n, s) => (r[n] = t[s] || "", r),
    /* @__PURE__ */ Object.create({ diff: null })
  );
}
function Qu(t = Vs, e = Ku, r = "") {
  const n = Zu(r);
  return function(s) {
    const i = Xt(
      s.trim(),
      !1,
      $s
    ).map(function(a) {
      const o = a.split(zs), u = cp(o[0].split(t), e);
      return o.length > 1 && o[1].trim() && (u.diff = n(o[1])), u;
    });
    return {
      all: i,
      latest: i.length && i[0] || null,
      total: i.length
    };
  };
}
var $s, zs, Vs, Ku, Xu = g({
  "src/lib/parsers/parse-list-log-summary.ts"() {
    D(), Ju(), rr(), $s = "òòòòòò ", zs = " òò", Vs = " ò ", Ku = ["hash", "date", "message", "refs", "author_name", "author_email"];
  }
}), ec = {};
G(ec, {
  diffSummaryTask: () => lp,
  validateLogFormatConfig: () => Qr
});
function lp(t) {
  let e = Ps(t);
  const r = ["diff"];
  return e === "" && (e = "--stat", r.push("--stat=4096")), r.push(...t), Qr(r) || {
    commands: r,
    format: "utf-8",
    parser: Zu(e)
  };
}
function Qr(t) {
  const e = t.filter(op);
  if (e.length > 1)
    return ne(
      `Summary flags are mutually exclusive - pick one of ${e.join(",")}`
    );
  if (e.length && t.includes("-z"))
    return ne(
      `Summary flag ${e} parsing is not compatible with null termination option '-z'`
    );
}
var Us = g({
  "src/lib/tasks/diff.ts"() {
    rr(), Ju(), H();
  }
});
function fp(t, e) {
  const r = [], n = [];
  return Object.keys(t).forEach((s) => {
    r.push(s), n.push(String(t[s]));
  }), [r, n.join(e)];
}
function hp(t) {
  return Object.keys(t).reduce((e, r) => (r in es || (e[r] = t[r]), e), {});
}
function tc(t = {}, e = []) {
  const r = Ce(t.splitter, K, Vs), n = !Os(t.format) && t.format ? t.format : {
    hash: "%H",
    date: t.strictDate === !1 ? "%ai" : "%aI",
    message: "%s",
    refs: "%D",
    body: t.multiLine ? "%B" : "%b",
    author_name: t.mailMap !== !1 ? "%aN" : "%an",
    author_email: t.mailMap !== !1 ? "%aE" : "%ae"
  }, [s, i] = fp(n, r), a = [], o = [
    `--pretty=format:${$s}${i}${zs}`,
    ...e
  ], u = t.n || t["max-count"] || t.maxCount;
  if (u && o.push(`--max-count=${u}`), t.from || t.to) {
    const c = t.symmetric !== !1 ? "..." : "..";
    a.push(`${t.from || ""}${c}${t.to || ""}`);
  }
  return K(t.file) && o.push("--follow", em(t.file)), Ds(hp(t), o), {
    fields: s,
    splitter: r,
    commands: [...o, ...a]
  };
}
function dp(t, e, r) {
  const n = Qu(t, e, Ps(r));
  return {
    commands: ["log", ...r],
    format: "utf-8",
    parser: n
  };
}
function mp() {
  return {
    log(...r) {
      const n = q(arguments), s = tc(
        Is(arguments),
        Ce(arguments[0], tr)
      ), i = e(...r) || Qr(s.commands) || t(s);
      return this._runTask(i, n);
    }
  };
  function t(r) {
    return dp(r.splitter, r.fields, r.commands);
  }
  function e(r, n) {
    return K(r) && K(n) && ne(
      "git.log(string, string) should be replaced with git.log({ from: string, to: string })"
    );
  }
}
var es, rc = g({
  "src/lib/tasks/log.ts"() {
    rr(), Qt(), Xu(), D(), H(), Us(), es = /* @__PURE__ */ ((t) => (t[t["--pretty"] = 0] = "--pretty", t[t["max-count"] = 1] = "max-count", t[t.maxCount = 2] = "maxCount", t[t.n = 3] = "n", t[t.file = 4] = "file", t[t.format = 5] = "format", t[t.from = 6] = "from", t[t.to = 7] = "to", t[t.splitter = 8] = "splitter", t[t.symmetric = 9] = "symmetric", t[t.mailMap = 10] = "mailMap", t[t.multiLine = 11] = "multiLine", t[t.strictDate = 12] = "strictDate", t))(es || {});
  }
}), Sr, nc, pp = g({
  "src/lib/responses/MergeSummary.ts"() {
    Sr = class {
      constructor(t, e = null, r) {
        this.reason = t, this.file = e, this.meta = r;
      }
      toString() {
        return `${this.file}:${this.reason}`;
      }
    }, nc = class {
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
}), ts, sc, gp = g({
  "src/lib/responses/PullSummary.ts"() {
    ts = class {
      constructor() {
        this.remoteMessages = {
          all: []
        }, this.created = [], this.deleted = [], this.files = [], this.deletions = {}, this.insertions = {}, this.summary = {
          changes: 0,
          deletions: 0,
          insertions: 0
        };
      }
    }, sc = class {
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
function Cn(t) {
  return t.objects = t.objects || {
    compressing: 0,
    counting: 0,
    enumerating: 0,
    packReused: 0,
    reused: { count: 0, delta: 0 },
    total: { count: 0, delta: 0 }
  };
}
function Ji(t) {
  const e = /^\s*(\d+)/.exec(t), r = /delta (\d+)/i.exec(t);
  return {
    count: W(e && e[1] || "0"),
    delta: W(r && r[1] || "0")
  };
}
var ic, yp = g({
  "src/lib/parsers/parse-remote-objects.ts"() {
    D(), ic = [
      new Ge(
        /^remote:\s*(enumerating|counting|compressing) objects: (\d+),/i,
        (t, [e, r]) => {
          const n = e.toLowerCase(), s = Cn(t.remoteMessages);
          Object.assign(s, { [n]: W(r) });
        }
      ),
      new Ge(
        /^remote:\s*(enumerating|counting|compressing) objects: \d+% \(\d+\/(\d+)\),/i,
        (t, [e, r]) => {
          const n = e.toLowerCase(), s = Cn(t.remoteMessages);
          Object.assign(s, { [n]: W(r) });
        }
      ),
      new Ge(
        /total ([^,]+), reused ([^,]+), pack-reused (\d+)/i,
        (t, [e, r, n]) => {
          const s = Cn(t.remoteMessages);
          s.total = Ji(e), s.reused = Ji(r), s.packReused = W(n);
        }
      )
    ];
  }
});
function ac(t, e) {
  return ie({ remoteMessages: new uc() }, oc, e);
}
var oc, uc, cc = g({
  "src/lib/parsers/parse-remote-messages.ts"() {
    D(), yp(), oc = [
      new Ge(/^remote:\s*(.+)$/, (t, [e]) => (t.remoteMessages.all.push(e.trim()), !1)),
      ...ic,
      new Ge(
        [/create a (?:pull|merge) request/i, /\s(https?:\/\/\S+)$/],
        (t, [e]) => {
          t.remoteMessages.pullRequestUrl = e;
        }
      ),
      new Ge(
        [/found (\d+) vulnerabilities.+\(([^)]+)\)/i, /\s(https?:\/\/\S+)$/],
        (t, [e, r, n]) => {
          t.remoteMessages.vulnerabilities = {
            count: W(e),
            summary: r,
            url: n
          };
        }
      )
    ], uc = class {
      constructor() {
        this.all = [];
      }
    };
  }
});
function wp(t, e) {
  const r = ie(new sc(), lc, [t, e]);
  return r.message && r;
}
var Qi, Ki, Xi, ea, lc, ta, js, fc = g({
  "src/lib/parsers/parse-pull.ts"() {
    gp(), D(), cc(), Qi = /^\s*(.+?)\s+\|\s+\d+\s*(\+*)(-*)/, Ki = /(\d+)\D+((\d+)\D+\(\+\))?(\D+(\d+)\D+\(-\))?/, Xi = /^(create|delete) mode \d+ (.+)/, ea = [
      new x(Qi, (t, [e, r, n]) => {
        t.files.push(e), r && (t.insertions[e] = r.length), n && (t.deletions[e] = n.length);
      }),
      new x(Ki, (t, [e, , r, , n]) => r !== void 0 || n !== void 0 ? (t.summary.changes = +e || 0, t.summary.insertions = +r || 0, t.summary.deletions = +n || 0, !0) : !1),
      new x(Xi, (t, [e, r]) => {
        R(t.files, r), R(e === "create" ? t.created : t.deleted, r);
      })
    ], lc = [
      new x(/^from\s(.+)$/i, (t, [e]) => void (t.remote = e)),
      new x(/^fatal:\s(.+)$/, (t, [e]) => void (t.message = e)),
      new x(
        /([a-z0-9]+)\.\.([a-z0-9]+)\s+(\S+)\s+->\s+(\S+)$/,
        (t, [e, r, n, s]) => {
          t.branch.local = n, t.hash.local = e, t.branch.remote = s, t.hash.remote = r;
        }
      )
    ], ta = (t, e) => ie(new ts(), ea, [t, e]), js = (t, e) => Object.assign(
      new ts(),
      ta(t, e),
      ac(t, e)
    );
  }
}), ra, hc, na, vp = g({
  "src/lib/parsers/parse-merge.ts"() {
    pp(), D(), fc(), ra = [
      new x(/^Auto-merging\s+(.+)$/, (t, [e]) => {
        t.merges.push(e);
      }),
      new x(/^CONFLICT\s+\((.+)\): Merge conflict in (.+)$/, (t, [e, r]) => {
        t.conflicts.push(new Sr(e, r));
      }),
      new x(
        /^CONFLICT\s+\((.+\/delete)\): (.+) deleted in (.+) and/,
        (t, [e, r, n]) => {
          t.conflicts.push(new Sr(e, r, { deleteRef: n }));
        }
      ),
      new x(/^CONFLICT\s+\((.+)\):/, (t, [e]) => {
        t.conflicts.push(new Sr(e, null));
      }),
      new x(/^Automatic merge failed;\s+(.+)$/, (t, [e]) => {
        t.result = e;
      })
    ], hc = (t, e) => Object.assign(na(t, e), js(t, e)), na = (t) => ie(new nc(), ra, t);
  }
});
function sa(t) {
  return t.length ? {
    commands: ["merge", ...t],
    format: "utf-8",
    parser(e, r) {
      const n = hc(e, r);
      if (n.failed)
        throw new Kt(n);
      return n;
    }
  } : ne("Git.merge requires at least one option");
}
var _p = g({
  "src/lib/tasks/merge.ts"() {
    Et(), vp(), H();
  }
});
function kp(t, e, r) {
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
var ia, dc, aa, Tp = g({
  "src/lib/parsers/parse-push.ts"() {
    D(), cc(), ia = [
      new x(/^Pushing to (.+)$/, (t, [e]) => {
        t.repo = e;
      }),
      new x(/^updating local tracking ref '(.+)'/, (t, [e]) => {
        t.ref = Lt(he({}, t.ref || {}), {
          local: e
        });
      }),
      new x(/^[=*-]\s+([^:]+):(\S+)\s+\[(.+)]$/, (t, [e, r, n]) => {
        t.pushed.push(kp(e, r, n));
      }),
      new x(
        /^Branch '([^']+)' set up to track remote branch '([^']+)' from '([^']+)'/,
        (t, [e, r, n]) => {
          t.branch = Lt(he({}, t.branch || {}), {
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
    ], dc = (t, e) => {
      const r = aa(t, e), n = ac(t, e);
      return he(he({}, r), n);
    }, aa = (t, e) => ie({ pushed: [] }, ia, [t, e]);
  }
}), mc = {};
G(mc, {
  pushTagsTask: () => bp,
  pushTask: () => qs
});
function bp(t = {}, e) {
  return R(e, "--tags"), qs(t, e);
}
function qs(t = {}, e) {
  const r = ["push", ...e];
  return t.branch && r.splice(1, 0, t.branch), t.remote && r.splice(1, 0, t.remote), Br(r, "-v"), R(r, "--verbose"), R(r, "--porcelain"), {
    commands: r,
    format: "utf-8",
    parser: dc
  };
}
var pc = g({
  "src/lib/tasks/push.ts"() {
    Tp(), D();
  }
});
function Sp() {
  return {
    showBuffer() {
      const t = ["show", ...re(arguments, 1)];
      return t.includes("--binary") || t.splice(1, 0, "--binary"), this._runTask(
        Tu(t),
        q(arguments)
      );
    },
    show() {
      const t = ["show", ...re(arguments, 1)];
      return this._runTask(
        te(t),
        q(arguments)
      );
    }
  };
}
var Op = g({
  "src/lib/tasks/show.ts"() {
    D(), H();
  }
}), oa, gc, Ep = g({
  "src/lib/responses/FileStatusSummary.ts"() {
    oa = /^(.+)\0(.+)$/, gc = class {
      constructor(t, e, r) {
        if (this.path = t, this.index = e, this.working_dir = r, e === "R" || r === "R") {
          const n = oa.exec(t) || [null, t, t];
          this.from = n[2] || "", this.path = n[1] || "";
        }
      }
    };
  }
});
function ua(t) {
  const [e, r] = t.split(vt);
  return {
    from: r || e,
    to: e
  };
}
function ae(t, e, r) {
  return [`${t}${e}`, r];
}
function Dn(t, ...e) {
  return e.map((r) => ae(t, r, (n, s) => R(n.conflicted, s)));
}
function Cp(t, e) {
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
    const o = `${s}${i}`, u = yc.get(o);
    u && u(t, a), o !== "##" && o !== "!!" && t.files.push(new gc(a, s, i));
  }
}
var ca, yc, wc, Dp = g({
  "src/lib/responses/StatusSummary.ts"() {
    D(), Ep(), ca = class {
      constructor() {
        this.not_added = [], this.conflicted = [], this.created = [], this.deleted = [], this.ignored = void 0, this.modified = [], this.renamed = [], this.files = [], this.staged = [], this.ahead = 0, this.behind = 0, this.current = null, this.tracking = null, this.detached = !1, this.isClean = () => !this.files.length;
      }
    }, yc = new Map([
      ae(
        " ",
        "A",
        (t, e) => R(t.created, e)
      ),
      ae(
        " ",
        "D",
        (t, e) => R(t.deleted, e)
      ),
      ae(
        " ",
        "M",
        (t, e) => R(t.modified, e)
      ),
      ae(
        "A",
        " ",
        (t, e) => R(t.created, e) && R(t.staged, e)
      ),
      ae(
        "A",
        "M",
        (t, e) => R(t.created, e) && R(t.staged, e) && R(t.modified, e)
      ),
      ae(
        "D",
        " ",
        (t, e) => R(t.deleted, e) && R(t.staged, e)
      ),
      ae(
        "M",
        " ",
        (t, e) => R(t.modified, e) && R(t.staged, e)
      ),
      ae(
        "M",
        "M",
        (t, e) => R(t.modified, e) && R(t.staged, e)
      ),
      ae("R", " ", (t, e) => {
        R(t.renamed, ua(e));
      }),
      ae("R", "M", (t, e) => {
        const r = ua(e);
        R(t.renamed, r), R(t.modified, r.to);
      }),
      ae("!", "!", (t, e) => {
        R(t.ignored = t.ignored || [], e);
      }),
      ae(
        "?",
        "?",
        (t, e) => R(t.not_added, e)
      ),
      ...Dn(
        "A",
        "A",
        "U"
        /* UNMERGED */
      ),
      ...Dn(
        "D",
        "D",
        "U"
        /* UNMERGED */
      ),
      ...Dn(
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
    ]), wc = function(t) {
      const e = t.split(vt), r = new ca();
      for (let n = 0, s = e.length; n < s; ) {
        let i = e[n++].trim();
        i && (i.charAt(0) === "R" && (i += vt + (e[n++] || "")), Cp(r, i));
      }
      return r;
    };
  }
});
function Ip(t) {
  return {
    format: "utf-8",
    commands: [
      "status",
      "--porcelain",
      "-b",
      "-u",
      "--null",
      ...t.filter((r) => !vc.includes(r))
    ],
    parser(r) {
      return wc(r);
    }
  };
}
var vc, xp = g({
  "src/lib/tasks/status.ts"() {
    Dp(), vc = ["--null", "-z"];
  }
});
function Pr(t = 0, e = 0, r = 0, n = "", s = !0) {
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
function Mp() {
  return Pr(0, 0, 0, "", !1);
}
function Fp() {
  return {
    version() {
      return this._runTask({
        commands: ["--version"],
        format: "utf-8",
        parser: Rp,
        onError(t, e, r, n) {
          if (t.exitCode === -2)
            return r(Buffer.from(Hs));
          n(e);
        }
      });
    }
  };
}
function Rp(t) {
  return t === Hs ? Mp() : ie(Pr(0, 0, 0, t), _c, t);
}
var Hs, _c, Np = g({
  "src/lib/tasks/version.ts"() {
    D(), Hs = "installed=false", _c = [
      new x(
        /version (\d+)\.(\d+)\.(\d+)(?:\s*\((.+)\))?/,
        (t, [e, r, n, s = ""]) => {
          Object.assign(
            t,
            Pr(W(e), W(r), W(n), s)
          );
        }
      ),
      new x(
        /version (\d+)\.(\d+)\.(\D+)(.+)?$/,
        (t, [e, r, n, s = ""]) => {
          Object.assign(t, Pr(W(e), W(r), n, s));
        }
      )
    ];
  }
}), kc = {};
G(kc, {
  SimpleGitApi: () => rs
});
var rs, Ap = g({
  "src/lib/simple-git-api.ts"() {
    zm(), Vm(), jm(), Gm(), Qm(), xu(), Xm(), Au(), tp(), ap(), rc(), _p(), pc(), Op(), xp(), H(), Np(), D(), rs = class {
      constructor(t) {
        this._executor = t;
      }
      _runTask(t, e) {
        const r = this._executor.chain(), n = r.push(t);
        return e && Wm(t, n, e), Object.create(this, {
          then: { value: n.then.bind(n) },
          catch: { value: n.catch.bind(n) },
          _executor: { value: r }
        });
      }
      add(t) {
        return this._runTask(
          te(["add", ...Ee(t)]),
          q(arguments)
        );
      }
      cwd(t) {
        const e = q(arguments);
        return typeof t == "string" ? this._runTask(Gi(t, this._executor), e) : typeof (t == null ? void 0 : t.path) == "string" ? this._runTask(
          Gi(
            t.path,
            t.root && this._executor || void 0
          ),
          e
        ) : this._runTask(
          ne("Git.cwd: workingDirectory must be supplied as a string"),
          e
        );
      }
      hashObject(t, e) {
        return this._runTask(
          ep(t, e === !0),
          q(arguments)
        );
      }
      init(t) {
        return this._runTask(
          ip(t === !0, this._executor.cwd, re(arguments)),
          q(arguments)
        );
      }
      merge() {
        return this._runTask(
          sa(re(arguments)),
          q(arguments)
        );
      }
      mergeFromTo(t, e) {
        return K(t) && K(e) ? this._runTask(
          sa([t, e, ...re(arguments)]),
          q(arguments, !1)
        ) : this._runTask(
          ne(
            "Git.mergeFromTo requires that the 'remote' and 'branch' arguments are supplied as strings"
          )
        );
      }
      outputHandler(t) {
        return this._executor.outputHandler = t, this;
      }
      push() {
        const t = qs(
          {
            remote: Ce(arguments[0], K),
            branch: Ce(arguments[1], K)
          },
          re(arguments)
        );
        return this._runTask(t, q(arguments));
      }
      stash() {
        return this._runTask(
          te(["stash", ...re(arguments)]),
          q(arguments)
        );
      }
      status() {
        return this._runTask(
          Ip(re(arguments)),
          q(arguments)
        );
      }
    }, Object.assign(
      rs.prototype,
      Um(),
      Jm(),
      Om(),
      Hm(),
      Km(),
      Im(),
      mp(),
      Sp(),
      Fp()
    );
  }
}), Tc = {};
G(Tc, {
  Scheduler: () => bc
});
var la, bc, Lp = g({
  "src/lib/runners/scheduler.ts"() {
    D(), zu(), la = /* @__PURE__ */ (() => {
      let t = 0;
      return () => {
        t++;
        const { promise: e, done: r } = Zo();
        return {
          promise: e,
          done: r,
          id: t
        };
      };
    })(), bc = class {
      constructor(t = 2) {
        this.concurrency = t, this.logger = As("", "scheduler"), this.pending = [], this.running = [], this.logger("Constructed, concurrency=%s", t);
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
        const t = R(this.running, this.pending.shift());
        this.logger("Attempting id=%s", t.id), t.done(() => {
          this.logger("Completing id=", t.id), Br(this.running, t), this.schedule();
        });
      }
      next() {
        const { promise: t, id: e } = R(this.pending, la());
        return this.logger("Scheduling id=%s", e), this.schedule(), t;
      }
    };
  }
}), Sc = {};
G(Sc, {
  applyPatchTask: () => Pp
});
function Pp(t, e) {
  return te(["apply", ...e, ...t]);
}
var Wp = g({
  "src/lib/tasks/apply-patch.ts"() {
    H();
  }
});
function $p(t, e) {
  return {
    branch: t,
    hash: e,
    success: !0
  };
}
function zp(t) {
  return {
    branch: t,
    hash: null,
    success: !1
  };
}
var Oc, Vp = g({
  "src/lib/responses/BranchDeleteSummary.ts"() {
    Oc = class {
      constructor() {
        this.all = [], this.branches = {}, this.errors = [];
      }
      get success() {
        return !this.errors.length;
      }
    };
  }
});
function Ec(t, e) {
  return e === 1 && ns.test(t);
}
var fa, ns, ha, Kr, Up = g({
  "src/lib/parsers/parse-branch-delete.ts"() {
    Vp(), D(), fa = /(\S+)\s+\(\S+\s([^)]+)\)/, ns = /^error[^']+'([^']+)'/m, ha = [
      new x(fa, (t, [e, r]) => {
        const n = $p(e, r);
        t.all.push(n), t.branches[e] = n;
      }),
      new x(ns, (t, [e]) => {
        const r = zp(e);
        t.errors.push(r), t.all.push(r), t.branches[e] = r;
      })
    ], Kr = (t, e) => ie(new Oc(), ha, [t, e]);
  }
}), Cc, jp = g({
  "src/lib/responses/BranchSummary.ts"() {
    Cc = class {
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
function da(t) {
  return t ? t.charAt(0) : "";
}
function Dc(t) {
  return ie(new Cc(), Ic, t);
}
var Ic, qp = g({
  "src/lib/parsers/parse-branch.ts"() {
    jp(), D(), Ic = [
      new x(
        /^([*+]\s)?\((?:HEAD )?detached (?:from|at) (\S+)\)\s+([a-z0-9]+)\s(.*)$/,
        (t, [e, r, n, s]) => {
          t.push(da(e), !0, r, n, s);
        }
      ),
      new x(
        new RegExp("^([*+]\\s)?(\\S+)\\s+([a-z0-9]+)\\s?(.*)$", "s"),
        (t, [e, r, n, s]) => {
          t.push(da(e), !1, r, n, s);
        }
      )
    ];
  }
}), xc = {};
G(xc, {
  branchLocalTask: () => Gp,
  branchTask: () => Hp,
  containsDeleteBranchCommand: () => Mc,
  deleteBranchTask: () => Zp,
  deleteBranchesTask: () => Bp
});
function Mc(t) {
  const e = ["-d", "-D", "--delete"];
  return t.some((r) => e.includes(r));
}
function Hp(t) {
  const e = Mc(t), r = ["branch", ...t];
  return r.length === 1 && r.push("-a"), r.includes("-v") || r.splice(1, 0, "-v"), {
    format: "utf-8",
    commands: r,
    parser(n, s) {
      return e ? Kr(n, s).all[0] : Dc(n);
    }
  };
}
function Gp() {
  return {
    format: "utf-8",
    commands: ["branch", "-v"],
    parser: Dc
  };
}
function Bp(t, e = !1) {
  return {
    format: "utf-8",
    commands: ["branch", "-v", e ? "-D" : "-d", ...t],
    parser(r, n) {
      return Kr(r, n);
    },
    onError({ exitCode: r, stdOut: n }, s, i, a) {
      if (!Ec(String(s), r))
        return a(s);
      i(n);
    }
  };
}
function Zp(t, e = !1) {
  const r = {
    format: "utf-8",
    commands: ["branch", "-v", e ? "-D" : "-d", t],
    parser(n, s) {
      return Kr(n, s).branches[t];
    },
    onError({ exitCode: n, stdErr: s, stdOut: i }, a, o, u) {
      if (!Ec(String(a), n))
        return u(a);
      throw new Kt(
        r.parser(Vt(i), Vt(s)),
        String(a)
      );
    }
  };
  return r;
}
var Yp = g({
  "src/lib/tasks/branch.ts"() {
    Et(), Up(), qp(), D();
  }
}), Fc, Jp = g({
  "src/lib/responses/CheckIgnore.ts"() {
    Fc = (t) => t.split(/\n/g).map((e) => e.trim()).filter((e) => !!e);
  }
}), Rc = {};
G(Rc, {
  checkIgnoreTask: () => Qp
});
function Qp(t) {
  return {
    commands: ["check-ignore", ...t],
    format: "utf-8",
    parser: Fc
  };
}
var Kp = g({
  "src/lib/tasks/check-ignore.ts"() {
    Jp();
  }
}), Nc = {};
G(Nc, {
  cloneMirrorTask: () => eg,
  cloneTask: () => Ac
});
function Xp(t) {
  return /^--upload-pack(=|$)/.test(t);
}
function Ac(t, e, r) {
  const n = ["clone", ...r];
  return K(t) && n.push(t), K(e) && n.push(e), n.find(Xp) ? ne("git.fetch: potential exploit argument blocked.") : te(n);
}
function eg(t, e, r) {
  return R(r, "--mirror"), Ac(t, e, r);
}
var tg = g({
  "src/lib/tasks/clone.ts"() {
    H(), D();
  }
});
function rg(t, e) {
  return ie({
    raw: t,
    remote: null,
    branches: [],
    tags: [],
    updated: [],
    deleted: []
  }, Lc, [t, e]);
}
var Lc, ng = g({
  "src/lib/parsers/parse-fetch.ts"() {
    D(), Lc = [
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
}), Pc = {};
G(Pc, {
  fetchTask: () => ig
});
function sg(t) {
  return /^--upload-pack(=|$)/.test(t);
}
function ig(t, e, r) {
  const n = ["fetch", ...r];
  return t && e && n.push(t, e), n.find(sg) ? ne("git.fetch: potential exploit argument blocked.") : {
    commands: n,
    format: "utf-8",
    parser: rg
  };
}
var ag = g({
  "src/lib/tasks/fetch.ts"() {
    ng(), H();
  }
});
function og(t) {
  return ie({ moves: [] }, Wc, t);
}
var Wc, ug = g({
  "src/lib/parsers/parse-move.ts"() {
    D(), Wc = [
      new x(/^Renaming (.+) to (.+)$/, (t, [e, r]) => {
        t.moves.push({ from: e, to: r });
      })
    ];
  }
}), $c = {};
G($c, {
  moveTask: () => cg
});
function cg(t, e) {
  return {
    commands: ["mv", "-v", ...Ee(t), e],
    format: "utf-8",
    parser: og
  };
}
var lg = g({
  "src/lib/tasks/move.ts"() {
    ug(), D();
  }
}), zc = {};
G(zc, {
  pullTask: () => fg
});
function fg(t, e, r) {
  const n = ["pull", ...r];
  return t && e && n.splice(1, 0, t, e), {
    commands: n,
    format: "utf-8",
    parser(s, i) {
      return js(s, i);
    },
    onError(s, i, a, o) {
      const u = wp(
        Vt(s.stdOut),
        Vt(s.stdErr)
      );
      if (u)
        return o(new Kt(u));
      o(i);
    }
  };
}
var hg = g({
  "src/lib/tasks/pull.ts"() {
    Et(), fc(), D();
  }
});
function dg(t) {
  const e = {};
  return Vc(t, ([r]) => e[r] = { name: r }), Object.values(e);
}
function mg(t) {
  const e = {};
  return Vc(t, ([r, n, s]) => {
    e.hasOwnProperty(r) || (e[r] = {
      name: r,
      refs: { fetch: "", push: "" }
    }), s && n && (e[r].refs[s.replace(/[^a-z]/g, "")] = n);
  }), Object.values(e);
}
function Vc(t, e) {
  bs(t, (r) => e(r.split(/\s+/)));
}
var pg = g({
  "src/lib/responses/GetRemoteSummary.ts"() {
    D();
  }
}), Uc = {};
G(Uc, {
  addRemoteTask: () => gg,
  getRemotesTask: () => yg,
  listRemotesTask: () => wg,
  remoteTask: () => vg,
  removeRemoteTask: () => _g
});
function gg(t, e, r) {
  return te(["remote", "add", ...r, t, e]);
}
function yg(t) {
  const e = ["remote"];
  return t && e.push("-v"), {
    commands: e,
    format: "utf-8",
    parser: t ? mg : dg
  };
}
function wg(t) {
  const e = [...t];
  return e[0] !== "ls-remote" && e.unshift("ls-remote"), te(e);
}
function vg(t) {
  const e = [...t];
  return e[0] !== "remote" && e.unshift("remote"), te(e);
}
function _g(t) {
  return te(["remote", "remove", t]);
}
var kg = g({
  "src/lib/tasks/remote.ts"() {
    pg(), H();
  }
}), jc = {};
G(jc, {
  stashListTask: () => Tg
});
function Tg(t = {}, e) {
  const r = tc(t), n = ["stash", "list", ...r.commands, ...e], s = Qu(
    r.splitter,
    r.fields,
    Ps(n)
  );
  return Qr(n) || {
    commands: n,
    format: "utf-8",
    parser: s
  };
}
var bg = g({
  "src/lib/tasks/stash-list.ts"() {
    rr(), Xu(), Us(), rc();
  }
}), qc = {};
G(qc, {
  addSubModuleTask: () => Sg,
  initSubModuleTask: () => Og,
  subModuleTask: () => Xr,
  updateSubModuleTask: () => Eg
});
function Sg(t, e) {
  return Xr(["add", t, e]);
}
function Og(t) {
  return Xr(["init", ...t]);
}
function Xr(t) {
  const e = [...t];
  return e[0] !== "submodule" && e.unshift("submodule"), te(e);
}
function Eg(t) {
  return Xr(["update", ...t]);
}
var Cg = g({
  "src/lib/tasks/sub-module.ts"() {
    H();
  }
});
function Dg(t, e) {
  const r = isNaN(t), n = isNaN(e);
  return r !== n ? r ? 1 : -1 : r ? Hc(t, e) : 0;
}
function Hc(t, e) {
  return t === e ? 0 : t > e ? 1 : -1;
}
function Ig(t) {
  return t.trim();
}
function mr(t) {
  return typeof t == "string" && parseInt(t.replace(/^\D+/g, ""), 10) || 0;
}
var ma, Gc, xg = g({
  "src/lib/responses/TagList.ts"() {
    ma = class {
      constructor(t, e) {
        this.all = t, this.latest = e;
      }
    }, Gc = function(t, e = !1) {
      const r = t.split(`
`).map(Ig).filter(Boolean);
      e || r.sort(function(s, i) {
        const a = s.split("."), o = i.split(".");
        if (a.length === 1 || o.length === 1)
          return Dg(mr(a[0]), mr(o[0]));
        for (let u = 0, c = Math.max(a.length, o.length); u < c; u++) {
          const l = Hc(mr(a[u]), mr(o[u]));
          if (l)
            return l;
        }
        return 0;
      });
      const n = e ? r[0] : [...r].reverse().find((s) => s.indexOf(".") >= 0);
      return new ma(r, n);
    };
  }
}), Bc = {};
G(Bc, {
  addAnnotatedTagTask: () => Rg,
  addTagTask: () => Fg,
  tagListTask: () => Mg
});
function Mg(t = []) {
  const e = t.some((r) => /^--sort=/.test(r));
  return {
    format: "utf-8",
    commands: ["tag", "-l", ...t],
    parser(r) {
      return Gc(r, e);
    }
  };
}
function Fg(t) {
  return {
    format: "utf-8",
    commands: ["tag", t],
    parser() {
      return { name: t };
    }
  };
}
function Rg(t, e) {
  return {
    format: "utf-8",
    commands: ["tag", "-a", "-m", e, t],
    parser() {
      return { name: t };
    }
  };
}
var Ng = g({
  "src/lib/tasks/tag.ts"() {
    xg();
  }
}), Ag = Kd({
  "src/git.js"(t, e) {
    var { GitExecutor: r } = (Pm(), U(Vu)), { SimpleGitApi: n } = (Ap(), U(kc)), { Scheduler: s } = (Lp(), U(Tc)), { configurationErrorTask: i } = (H(), U(Jn)), {
      asArray: a,
      filterArray: o,
      filterPrimitives: u,
      filterString: c,
      filterStringOrStringArray: l,
      filterType: f,
      getTrailingOptions: h,
      trailingFunctionArgument: d,
      trailingOptionsArgument: m
    } = (D(), U(hu)), { applyPatchTask: _ } = (Wp(), U(Sc)), {
      branchTask: O,
      branchLocalTask: v,
      deleteBranchesTask: M,
      deleteBranchTask: $
    } = (Yp(), U(xc)), { checkIgnoreTask: X } = (Kp(), U(Rc)), { checkIsRepoTask: Z } = (gu(), U(du)), { cloneTask: sr, cloneMirrorTask: Ye } = (tg(), U(Nc)), { cleanWithOptionsTask: Ct, isCleanOptionsArray: be } = (Cu(), U(Ou)), { diffSummaryTask: De } = (Us(), U(ec)), { fetchTask: sn } = (ag(), U(Pc)), { moveTask: rl } = (lg(), U($c)), { pullTask: nl } = (hg(), U(zc)), { pushTagsTask: sl } = (pc(), U(mc)), {
      addRemoteTask: il,
      getRemotesTask: al,
      listRemotesTask: ol,
      remoteTask: ul,
      removeRemoteTask: cl
    } = (kg(), U(Uc)), { getResetMode: ll, resetTask: fl } = ($u(), U(Lu)), { stashListTask: hl } = (bg(), U(jc)), {
      addSubModuleTask: dl,
      initSubModuleTask: ml,
      subModuleTask: pl,
      updateSubModuleTask: gl
    } = (Cg(), U(qc)), { addAnnotatedTagTask: yl, addTagTask: wl, tagListTask: vl } = (Ng(), U(Bc)), { straightThroughBufferTask: _l, straightThroughStringTask: Se } = (H(), U(Jn));
    function T(p, k) {
      this._plugins = k, this._executor = new r(
        p.baseDir,
        new s(p.maxConcurrentProcesses),
        k
      ), this._trimmed = p.trimmed;
    }
    (T.prototype = Object.create(n.prototype)).constructor = T, T.prototype.customBinary = function(p) {
      return this._plugins.reconfigure("binary", p), this;
    }, T.prototype.env = function(p, k) {
      return arguments.length === 1 && typeof p == "object" ? this._executor.env = p : (this._executor.env = this._executor.env || {})[p] = k, this;
    }, T.prototype.stashList = function(p) {
      return this._runTask(
        hl(
          m(arguments) || {},
          o(p) && p || []
        ),
        d(arguments)
      );
    };
    function Zs(p, k, P, ee) {
      return typeof P != "string" ? i(`git.${p}() requires a string 'repoPath'`) : k(P, f(ee, c), h(arguments));
    }
    T.prototype.clone = function() {
      return this._runTask(
        Zs("clone", sr, ...arguments),
        d(arguments)
      );
    }, T.prototype.mirror = function() {
      return this._runTask(
        Zs("mirror", Ye, ...arguments),
        d(arguments)
      );
    }, T.prototype.mv = function(p, k) {
      return this._runTask(rl(p, k), d(arguments));
    }, T.prototype.checkoutLatestTag = function(p) {
      var k = this;
      return this.pull(function() {
        k.tags(function(P, ee) {
          k.checkout(ee.latest, p);
        });
      });
    }, T.prototype.pull = function(p, k, P, ee) {
      return this._runTask(
        nl(
          f(p, c),
          f(k, c),
          h(arguments)
        ),
        d(arguments)
      );
    }, T.prototype.fetch = function(p, k) {
      return this._runTask(
        sn(
          f(p, c),
          f(k, c),
          h(arguments)
        ),
        d(arguments)
      );
    }, T.prototype.silent = function(p) {
      return console.warn(
        "simple-git deprecation notice: git.silent: logging should be configured using the `debug` library / `DEBUG` environment variable, this will be an error in version 3"
      ), this;
    }, T.prototype.tags = function(p, k) {
      return this._runTask(
        vl(h(arguments)),
        d(arguments)
      );
    }, T.prototype.rebase = function() {
      return this._runTask(
        Se(["rebase", ...h(arguments)]),
        d(arguments)
      );
    }, T.prototype.reset = function(p) {
      return this._runTask(
        fl(ll(p), h(arguments)),
        d(arguments)
      );
    }, T.prototype.revert = function(p) {
      const k = d(arguments);
      return typeof p != "string" ? this._runTask(i("Commit must be a string"), k) : this._runTask(
        Se(["revert", ...h(arguments, 0, !0), p]),
        k
      );
    }, T.prototype.addTag = function(p) {
      const k = typeof p == "string" ? wl(p) : i("Git.addTag requires a tag name");
      return this._runTask(k, d(arguments));
    }, T.prototype.addAnnotatedTag = function(p, k) {
      return this._runTask(
        yl(p, k),
        d(arguments)
      );
    }, T.prototype.deleteLocalBranch = function(p, k, P) {
      return this._runTask(
        $(p, typeof k == "boolean" ? k : !1),
        d(arguments)
      );
    }, T.prototype.deleteLocalBranches = function(p, k, P) {
      return this._runTask(
        M(p, typeof k == "boolean" ? k : !1),
        d(arguments)
      );
    }, T.prototype.branch = function(p, k) {
      return this._runTask(
        O(h(arguments)),
        d(arguments)
      );
    }, T.prototype.branchLocal = function(p) {
      return this._runTask(v(), d(arguments));
    }, T.prototype.raw = function(p) {
      const k = !Array.isArray(p), P = [].slice.call(k ? arguments : p, 0);
      for (let ge = 0; ge < P.length && k; ge++)
        if (!u(P[ge])) {
          P.splice(ge, P.length - ge);
          break;
        }
      P.push(...h(arguments, 0, !0));
      var ee = d(arguments);
      return P.length ? this._runTask(Se(P, this._trimmed), ee) : this._runTask(
        i("Raw: must supply one or more command to execute"),
        ee
      );
    }, T.prototype.submoduleAdd = function(p, k, P) {
      return this._runTask(dl(p, k), d(arguments));
    }, T.prototype.submoduleUpdate = function(p, k) {
      return this._runTask(
        gl(h(arguments, !0)),
        d(arguments)
      );
    }, T.prototype.submoduleInit = function(p, k) {
      return this._runTask(
        ml(h(arguments, !0)),
        d(arguments)
      );
    }, T.prototype.subModule = function(p, k) {
      return this._runTask(
        pl(h(arguments)),
        d(arguments)
      );
    }, T.prototype.listRemote = function() {
      return this._runTask(
        ol(h(arguments)),
        d(arguments)
      );
    }, T.prototype.addRemote = function(p, k, P) {
      return this._runTask(
        il(p, k, h(arguments)),
        d(arguments)
      );
    }, T.prototype.removeRemote = function(p, k) {
      return this._runTask(cl(p), d(arguments));
    }, T.prototype.getRemotes = function(p, k) {
      return this._runTask(al(p === !0), d(arguments));
    }, T.prototype.remote = function(p, k) {
      return this._runTask(
        ul(h(arguments)),
        d(arguments)
      );
    }, T.prototype.tag = function(p, k) {
      const P = h(arguments);
      return P[0] !== "tag" && P.unshift("tag"), this._runTask(Se(P), d(arguments));
    }, T.prototype.updateServerInfo = function(p) {
      return this._runTask(
        Se(["update-server-info"]),
        d(arguments)
      );
    }, T.prototype.pushTags = function(p, k) {
      const P = sl(
        { remote: f(p, c) },
        h(arguments)
      );
      return this._runTask(P, d(arguments));
    }, T.prototype.rm = function(p) {
      return this._runTask(
        Se(["rm", "-f", ...a(p)]),
        d(arguments)
      );
    }, T.prototype.rmKeepLocal = function(p) {
      return this._runTask(
        Se(["rm", "--cached", ...a(p)]),
        d(arguments)
      );
    }, T.prototype.catFile = function(p, k) {
      return this._catFile("utf-8", arguments);
    }, T.prototype.binaryCatFile = function() {
      return this._catFile("buffer", arguments);
    }, T.prototype._catFile = function(p, k) {
      var P = d(k), ee = ["cat-file"], ge = k[0];
      if (typeof ge == "string")
        return this._runTask(
          i("Git.catFile: options must be supplied as an array of strings"),
          P
        );
      Array.isArray(ge) && ee.push.apply(ee, ge);
      const an = p === "buffer" ? _l(ee) : Se(ee);
      return this._runTask(an, P);
    }, T.prototype.diff = function(p, k) {
      const P = c(p) ? i(
        "git.diff: supplying options as a single string is no longer supported, switch to an array of strings"
      ) : Se(["diff", ...h(arguments)]);
      return this._runTask(P, d(arguments));
    }, T.prototype.diffSummary = function() {
      return this._runTask(
        De(h(arguments, 1)),
        d(arguments)
      );
    }, T.prototype.applyPatch = function(p) {
      const k = l(p) ? _(a(p), h([].slice.call(arguments, 1))) : i(
        "git.applyPatch requires one or more string patches as the first argument"
      );
      return this._runTask(k, d(arguments));
    }, T.prototype.revparse = function() {
      const p = ["rev-parse", ...h(arguments, !0)];
      return this._runTask(
        Se(p, !0),
        d(arguments)
      );
    }, T.prototype.clean = function(p, k, P) {
      const ee = be(p), ge = ee && p.join("") || f(p, c) || "", an = h([].slice.call(arguments, ee ? 1 : 0));
      return this._runTask(
        Ct(ge, an),
        d(arguments)
      );
    }, T.prototype.exec = function(p) {
      const k = {
        commands: [],
        format: "utf-8",
        parser() {
          typeof p == "function" && p();
        }
      };
      return this._runTask(k);
    }, T.prototype.clearQueue = function() {
      return this;
    }, T.prototype.checkIgnore = function(p, k) {
      return this._runTask(
        X(a(f(p, l, []))),
        d(arguments)
      );
    }, T.prototype.checkIsRepo = function(p, k) {
      return this._runTask(
        Z(f(p, c)),
        d(arguments)
      );
    }, e.exports = T;
  }
});
Qt();
Ze();
var Lg = class extends Le {
  constructor(t, e) {
    super(void 0, e), this.config = t;
  }
};
Ze();
Ze();
var Ae = class extends Le {
  constructor(t, e, r) {
    super(t, r), this.task = t, this.plugin = e, Object.setPrototypeOf(this, new.target.prototype);
  }
};
Et();
Qo();
gu();
Cu();
xu();
Fu();
Au();
$u();
function Pg(t) {
  return t ? [{
    type: "spawn.before",
    action(n, s) {
      t.aborted && s.kill(new Ae(void 0, "abort", "Abort already signaled"));
    }
  }, {
    type: "spawn.after",
    action(n, s) {
      function i() {
        s.kill(new Ae(void 0, "abort", "Abort signal received"));
      }
      t.addEventListener("abort", i), s.spawned.on("close", () => t.removeEventListener("abort", i));
    }
  }] : void 0;
}
function Wg(t) {
  return typeof t == "string" && t.trim().toLowerCase() === "-c";
}
function $g(t, e) {
  if (Wg(t) && /^\s*protocol(.[a-z]+)?.allow/.test(e))
    throw new Ae(
      void 0,
      "unsafe",
      "Configuring protocol.allow is not permitted without enabling allowUnsafeExtProtocol"
    );
}
function zg(t, e) {
  if (/^\s*--(upload|receive)-pack/.test(t))
    throw new Ae(
      void 0,
      "unsafe",
      "Use of --upload-pack or --receive-pack is not permitted without enabling allowUnsafePack"
    );
  if (e === "clone" && /^\s*-u\b/.test(t))
    throw new Ae(
      void 0,
      "unsafe",
      "Use of clone with option -u is not permitted without enabling allowUnsafePack"
    );
  if (e === "push" && /^\s*--exec\b/.test(t))
    throw new Ae(
      void 0,
      "unsafe",
      "Use of push with option --exec is not permitted without enabling allowUnsafePack"
    );
}
function Vg({
  allowUnsafeProtocolOverride: t = !1,
  allowUnsafePack: e = !1
} = {}) {
  return {
    type: "spawn.args",
    action(r, n) {
      return r.forEach((s, i) => {
        const a = i < r.length ? r[i + 1] : "";
        t || $g(s, a), e || zg(s, n.method);
      }), r;
    }
  };
}
D();
function Ug(t) {
  const e = zt(t, "-c");
  return {
    type: "spawn.args",
    action(r) {
      return [...e, ...r];
    }
  };
}
D();
var pa = ht().promise;
function jg({
  onClose: t = !0,
  onExit: e = 50
} = {}) {
  function r() {
    let s = -1;
    const i = {
      close: ht(),
      closeTimeout: ht(),
      exit: ht(),
      exitTimeout: ht()
    }, a = Promise.race([
      t === !1 ? pa : i.closeTimeout.promise,
      e === !1 ? pa : i.exitTimeout.promise
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
    s !== !1 && (s === !0 ? i.promise : i.promise.then(() => Hn(s))).then(a.done);
  }
  return {
    type: "spawn.after",
    action(s, i) {
      return Rt(this, arguments, function* (a, { spawned: o, close: u }) {
        var c, l;
        const f = r();
        let h = !0, d = () => void (h = !1);
        (c = o.stdout) == null || c.on("data", d), (l = o.stderr) == null || l.on("data", d), o.on("error", d), o.on("close", (m) => f.close(m)), o.on("exit", (m) => f.exit(m));
        try {
          yield f.result, h && (yield Hn(50)), u(f.exitCode);
        } catch (m) {
          u(f.exitCode, m);
        }
      });
    }
  };
}
D();
var qg = "Invalid value supplied for custom binary, requires a single string or an array containing either one or two strings", ga = "Invalid value supplied for custom binary, restricted characters must be removed or supply the unsafe.allowUnsafeCustomBinary option";
function Hg(t) {
  return !t || !/^([a-z]:)?([a-z0-9/.\\_-]+)$/i.test(t);
}
function ya(t, e) {
  if (t.length < 1 || t.length > 2)
    throw new Ae(void 0, "binary", qg);
  if (t.some(Hg))
    if (e)
      console.warn(ga);
    else
      throw new Ae(void 0, "binary", ga);
  const [n, s] = t;
  return {
    binary: n,
    prefix: s
  };
}
function Gg(t, e = ["git"], r = !1) {
  let n = ya(Ee(e), r);
  t.on("binary", (s) => {
    n = ya(Ee(s), r);
  }), t.append("spawn.binary", () => n.binary), t.append("spawn.args", (s) => n.prefix ? [n.prefix, ...s] : s);
}
Ze();
function Bg(t) {
  return !!(t.exitCode && t.stdErr.length);
}
function Zg(t) {
  return Buffer.concat([...t.stdOut, ...t.stdErr]);
}
function Yg(t = !1, e = Bg, r = Zg) {
  return (n, s) => !t && n || !e(s) ? n : r(s);
}
function wa(t) {
  return {
    type: "task.error",
    action(e, r) {
      const n = t(e.error, {
        stdErr: r.stdErr,
        stdOut: r.stdOut,
        exitCode: r.exitCode
      });
      return Buffer.isBuffer(n) ? { error: new Le(void 0, n.toString("utf-8")) } : {
        error: n
      };
    }
  };
}
D();
var Jg = class {
  constructor() {
    this.plugins = /* @__PURE__ */ new Set(), this.events = new jl();
  }
  on(t, e) {
    this.events.on(t, e);
  }
  reconfigure(t, e) {
    this.events.emit(t, e);
  }
  append(t, e) {
    const r = R(this.plugins, { type: t, action: e });
    return () => this.plugins.delete(r);
  }
  add(t) {
    const e = [];
    return Ee(t).forEach((r) => r && this.plugins.add(R(e, r))), () => {
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
D();
function Qg(t) {
  const e = "--progress", r = ["checkout", "clone", "fetch", "pull", "push"];
  return [{
    type: "spawn.args",
    action(i, a) {
      return r.includes(a.method) ? nu(i, e) : i;
    }
  }, {
    type: "spawn.after",
    action(i, a) {
      var o;
      a.commands.includes(e) && ((o = a.spawned.stderr) == null || o.on("data", (u) => {
        const c = /^([\s\S]+?):\s*(\d+)% \((\d+)\/(\d+)\)/.exec(u.toString("utf8"));
        c && t({
          method: a.method,
          stage: Kg(c[1]),
          progress: W(c[2]),
          processed: W(c[3]),
          total: W(c[4])
        });
      }));
    }
  }];
}
function Kg(t) {
  return String(t.toLowerCase().split(" ", 1)) || "unknown";
}
D();
function Xg(t) {
  const e = au(t, ["uid", "gid"]);
  return {
    type: "spawn.options",
    action(r) {
      return he(he({}, e), r);
    }
  };
}
function ey({
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
          c(), s.kill(new Ae(void 0, "timeout", "block timeout reached"));
        }
        r && ((i = s.spawned.stdout) == null || i.on("data", u)), e && ((a = s.spawned.stderr) == null || a.on("data", u)), s.spawned.on("exit", c), s.spawned.on("close", c), u();
      }
    };
}
Qt();
function ty() {
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
        if (Ar(i)) {
          n(Ui(i));
          continue;
        }
        if (i === "--") {
          n(
            t.slice(s + 1).flatMap((a) => Ar(a) && Ui(a) || a)
          );
          break;
        }
        e.push(i);
      }
      return r ? [...e, "--", ...r.map(String)] : e;
    }
  };
}
D();
var ry = Ag();
function ny(t, e) {
  var r;
  const n = new Jg(), s = lu(
    t && (typeof t == "string" ? { baseDir: t } : t) || {},
    e
  );
  if (!Ss(s.baseDir))
    throw new Lg(
      s,
      "Cannot use simple-git on a directory that does not exist"
    );
  return Array.isArray(s.config) && n.add(Ug(s.config)), n.add(Vg(s.unsafe)), n.add(ty()), n.add(jg(s.completion)), s.abort && n.add(Pg(s.abort)), s.progress && n.add(Qg(s.progress)), s.timeout && n.add(ey(s.timeout)), s.spawnOptions && n.add(Xg(s.spawnOptions)), n.add(wa(Yg(!0))), s.errors && n.add(wa(s.errors)), Gg(n, s.binary, (r = s.unsafe) == null ? void 0 : r.allowUnsafeCustomBinary), new ry(s, n);
}
Et();
var In = ny;
function sy() {
  return {
    root: ".",
    fileFilter: (t) => !0,
    directoryFilter: (t) => !0,
    type: Gs,
    lstat: !1,
    depth: 2147483648,
    alwaysStat: !1,
    highWaterMark: 4096
  };
}
const Zc = "READDIRP_RECURSIVE_ERROR", iy = /* @__PURE__ */ new Set(["ENOENT", "EPERM", "EACCES", "ELOOP", Zc]), Gs = "files", Yc = "directories", en = "files_directories", tn = "all", va = [Gs, Yc, en, tn], ay = /* @__PURE__ */ new Set([Yc, en, tn]), oy = /* @__PURE__ */ new Set([Gs, en, tn]), uy = (t) => iy.has(t.code), cy = process.platform === "win32", _a = (t) => !0, ka = (t) => {
  if (t === void 0)
    return _a;
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
  return _a;
};
class ly extends ql {
  constructor(e = {}) {
    super({
      objectMode: !0,
      autoDestroy: !0,
      highWaterMark: e.highWaterMark
    });
    const r = { ...sy(), ...e }, { root: n, type: s } = r;
    this._fileFilter = ka(r.fileFilter), this._directoryFilter = ka(r.directoryFilter);
    const i = r.lstat ? An : $r;
    cy ? this._stat = (a) => i(a, { bigint: !0 }) : this._stat = i, this._maxDepth = r.depth, this._wantsDir = ay.has(s), this._wantsFile = oy.has(s), this._wantsEverything = s === tn, this._root = Js(n), this._isDirent = !r.alwaysStat, this._statsProp = this._isDirent ? "dirent" : "stats", this._rdOptions = { encoding: "utf8", withFileTypes: this._isDirent }, this.parents = [this._exploreDir(n, 1)], this.reading = !1, this.parent = void 0;
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
      n = await Da(e, this._rdOptions);
    } catch (s) {
      this._onError(s);
    }
    return { files: n, depth: r, path: e };
  }
  async _formatEntry(e, r) {
    let n;
    const s = this._isDirent ? e.name : e;
    try {
      const i = Js(Ca(r, s));
      n = { path: Il(this._root, i), fullPath: i, basename: s }, n[this._statsProp] = this._isDirent ? e : await this._stat(i);
    } catch (i) {
      this._onError(i);
      return;
    }
    return n;
  }
  _onError(e) {
    uy(e) && !this.destroyed ? this.emit("warn", e) : this.destroy(e);
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
        const s = await gr(n), i = await An(s);
        if (i.isFile())
          return "file";
        if (i.isDirectory()) {
          const a = s.length;
          if (n.startsWith(s) && n.substr(a, 1) === xl) {
            const o = new Error(`Circular symlink detected: "${n}" points to "${s}"`);
            return o.code = Zc, this._onError(o);
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
const fy = (t, e = {}) => {
  let r = e.entryType || e.type;
  if (r === "both" && (r = en), r && (e.type = r), t) {
    if (typeof t != "string")
      throw new TypeError("readdirp: root argument must be a string. Usage: readdirp(root, options)");
    if (r && !va.includes(r))
      throw new Error(`readdirp: Invalid type passed. Use one of ${va.join(", ")}`);
  } else throw new Error("readdirp: root argument is required. Usage: readdirp(root, options)");
  return e.root = t, new ly(e);
}, hy = "data", Jc = "end", dy = "close", Bs = () => {
}, rn = process.platform, Qc = rn === "win32", my = rn === "darwin", py = rn === "linux", gy = rn === "freebsd", yy = Ul() === "OS400", j = {
  ALL: "all",
  READY: "ready",
  ADD: "add",
  CHANGE: "change",
  ADD_DIR: "addDir",
  UNLINK: "unlink",
  UNLINK_DIR: "unlinkDir",
  RAW: "raw",
  ERROR: "error"
}, _e = j, wy = "watch", vy = { lstat: An, stat: $r }, nt = "listeners", Or = "errHandlers", gt = "rawEmitters", _y = [nt, Or, gt], ky = /* @__PURE__ */ new Set([
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
]), Ty = (t) => ky.has(b.extname(t).slice(1).toLowerCase()), ss = (t, e) => {
  t instanceof Set ? t.forEach(e) : e(t);
}, Pt = (t, e, r) => {
  let n = t[e];
  n instanceof Set || (t[e] = n = /* @__PURE__ */ new Set([n])), n.add(r);
}, by = (t) => (e) => {
  const r = t[e];
  r instanceof Set ? r.clear() : delete t[e];
}, Wt = (t, e, r) => {
  const n = t[e];
  n instanceof Set ? n.delete(r) : n === r && delete t[e];
}, Kc = (t) => t instanceof Set ? t.size === 0 : !t, Er = /* @__PURE__ */ new Map();
function Ta(t, e, r, n, s) {
  const i = (a, o) => {
    r(t), s(a, o, { watchedPath: t }), o && t !== o && Cr(b.resolve(t, o), nt, b.join(t, o));
  };
  try {
    return Wl(t, {
      persistent: e.persistent
    }, i);
  } catch (a) {
    n(a);
    return;
  }
}
const Cr = (t, e, r, n, s) => {
  const i = Er.get(t);
  i && ss(i[e], (a) => {
    a(r, n, s);
  });
}, Sy = (t, e, r, n) => {
  const { listener: s, errHandler: i, rawEmitter: a } = n;
  let o = Er.get(e), u;
  if (!r.persistent)
    return u = Ta(t, r, s, i, a), u ? u.close.bind(u) : void 0;
  if (o)
    Pt(o, nt, s), Pt(o, Or, i), Pt(o, gt, a);
  else {
    if (u = Ta(
      t,
      r,
      Cr.bind(null, e, nt),
      i,
      // no need to use broadcast here
      Cr.bind(null, e, gt)
    ), !u)
      return;
    u.on(_e.ERROR, async (c) => {
      const l = Cr.bind(null, e, Or);
      if (o && (o.watcherUnusable = !0), Qc && c.code === "EPERM")
        try {
          await (await Rl(t, "r")).close(), l(c);
        } catch {
        }
      else
        l(c);
    }), o = {
      listeners: s,
      errHandlers: i,
      rawEmitters: a,
      watcher: u
    }, Er.set(e, o);
  }
  return () => {
    Wt(o, nt, s), Wt(o, Or, i), Wt(o, gt, a), Kc(o.listeners) && (o.watcher.close(), Er.delete(e), _y.forEach(by(o)), o.watcher = void 0, Object.freeze(o));
  };
}, xn = /* @__PURE__ */ new Map(), Oy = (t, e, r, n) => {
  const { listener: s, rawEmitter: i } = n;
  let a = xn.get(e);
  const o = a && a.options;
  return o && (o.persistent < r.persistent || o.interval > r.interval) && (Qs(e), a = void 0), a ? (Pt(a, nt, s), Pt(a, gt, i)) : (a = {
    listeners: s,
    rawEmitters: i,
    options: r,
    watcher: Pl(e, r, (u, c) => {
      ss(a.rawEmitters, (f) => {
        f(_e.CHANGE, e, { curr: u, prev: c });
      });
      const l = u.mtimeMs;
      (u.size !== c.size || l > c.mtimeMs || l === 0) && ss(a.listeners, (f) => f(t, u));
    })
  }, xn.set(e, a)), () => {
    Wt(a, nt, s), Wt(a, gt, i), Kc(a.listeners) && (xn.delete(e), Qs(e), a.options = a.watcher = void 0, Object.freeze(a));
  };
};
class Ey {
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
    const n = this.fsw.options, s = b.dirname(e), i = b.basename(e);
    this.fsw._getWatchedDir(s).add(i);
    const o = b.resolve(e), u = {
      persistent: n.persistent
    };
    r || (r = Bs);
    let c;
    if (n.usePolling) {
      const l = n.interval !== n.binaryInterval;
      u.interval = l && Ty(i) ? n.binaryInterval : n.interval, c = Oy(e, o, u, {
        listener: r,
        rawEmitter: this.fsw._emitRaw
      });
    } else
      c = Sy(e, o, u, {
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
    const s = b.dirname(e), i = b.basename(e), a = this.fsw._getWatchedDir(s);
    let o = r;
    if (a.has(i))
      return;
    const u = async (l, f) => {
      if (this.fsw._throttle(wy, e, 5)) {
        if (!f || f.mtimeMs === 0)
          try {
            const h = await $r(e);
            if (this.fsw.closed)
              return;
            const d = h.atimeMs, m = h.mtimeMs;
            if ((!d || d <= m || m !== o.mtimeMs) && this.fsw._emit(_e.CHANGE, e, h), (my || py || gy) && o.ino !== h.ino) {
              this.fsw._closeFile(l), o = h;
              const _ = this._watchWithNodeFs(e, u);
              _ && this.fsw._addPathCloser(l, _);
            } else
              o = h;
          } catch {
            this.fsw._remove(s, i);
          }
        else if (a.has(i)) {
          const h = f.atimeMs, d = f.mtimeMs;
          (!h || h <= d || d !== o.mtimeMs) && this.fsw._emit(_e.CHANGE, e, f), o = f;
        }
      }
    }, c = this._watchWithNodeFs(e, u);
    if (!(n && this.fsw.options.ignoreInitial) && this.fsw._isntIgnored(e)) {
      if (!this.fsw._throttle(_e.ADD, e, 0))
        return;
      this.fsw._emit(_e.ADD, e, r);
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
        o = await gr(n);
      } catch {
        return this.fsw._emitReady(), !0;
      }
      return this.fsw.closed ? void 0 : (a.has(s) ? this.fsw._symlinkPaths.get(i) !== o && (this.fsw._symlinkPaths.set(i, o), this.fsw._emit(_e.CHANGE, n, e.stats)) : (a.add(s), this.fsw._symlinkPaths.set(i, o), this.fsw._emit(_e.ADD, n, e.stats)), this.fsw._emitReady(), !0);
    }
    if (this.fsw._symlinkPaths.has(i))
      return !0;
    this.fsw._symlinkPaths.set(i, !0);
  }
  _handleRead(e, r, n, s, i, a, o) {
    if (e = b.join(e, ""), o = this.fsw._throttle("readdir", e, 1e3), !o)
      return;
    const u = this.fsw._getWatchedDir(n.path), c = /* @__PURE__ */ new Set();
    let l = this.fsw._readdirp(e, {
      fileFilter: (f) => n.filterPath(f),
      directoryFilter: (f) => n.filterDir(f)
    });
    if (l)
      return l.on(hy, async (f) => {
        if (this.fsw.closed) {
          l = void 0;
          return;
        }
        const h = f.path;
        let d = b.join(e, h);
        if (c.add(h), !(f.stats.isSymbolicLink() && await this._handleSymlink(f, e, d, h))) {
          if (this.fsw.closed) {
            l = void 0;
            return;
          }
          (h === s || !s && !u.has(h)) && (this.fsw._incrReadyCount(), d = b.join(i, b.relative(i, d)), this._addToNodeFs(d, r, n, a + 1));
        }
      }).on(_e.ERROR, this._boundHandleError), new Promise((f, h) => {
        if (!l)
          return h();
        l.once(Jc, () => {
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
    const u = this.fsw._getWatchedDir(b.dirname(e)), c = u.has(b.basename(e));
    !(n && this.fsw.options.ignoreInitial) && !i && !c && this.fsw._emit(_e.ADD_DIR, e, r), u.add(b.basename(e)), this.fsw._getWatchedDir(e);
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
      const u = await vy[o.statMethod](o.watchPath);
      if (this.fsw.closed)
        return;
      if (this.fsw._isIgnored(o.watchPath, u))
        return a(), !1;
      const c = this.fsw.options.followSymlinks;
      let l;
      if (u.isDirectory()) {
        const f = b.resolve(e), h = c ? await gr(e) : e;
        if (this.fsw.closed || (l = await this._handleDir(o.watchPath, u, r, s, i, o, h), this.fsw.closed))
          return;
        f !== h && h !== void 0 && this.fsw._symlinkPaths.set(f, h);
      } else if (u.isSymbolicLink()) {
        const f = c ? await gr(e) : e;
        if (this.fsw.closed)
          return;
        const h = b.dirname(o.watchPath);
        if (this.fsw._getWatchedDir(h).add(o.watchPath), this.fsw._emit(_e.ADD, o.watchPath, u), l = await this._handleDir(h, u, r, s, e, o, f), this.fsw.closed)
          return;
        f !== void 0 && this.fsw._symlinkPaths.set(b.resolve(e), f);
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
const Mn = "/", Cy = "//", Xc = ".", Dy = "..", Iy = "string", xy = /\\/g, ba = /\/\//, My = /\..*\.(sw[px])$|~$|\.subl.*\.tmp/, Fy = /^\.[/\\]/;
function Wr(t) {
  return Array.isArray(t) ? t : [t];
}
const Fn = (t) => typeof t == "object" && t !== null && !(t instanceof RegExp);
function Ry(t) {
  return typeof t == "function" ? t : typeof t == "string" ? (e) => t === e : t instanceof RegExp ? (e) => t.test(e) : typeof t == "object" && t !== null ? (e) => {
    if (t.path === e)
      return !0;
    if (t.recursive) {
      const r = b.relative(t.path, e);
      return r ? !r.startsWith("..") && !b.isAbsolute(r) : !1;
    }
    return !1;
  } : () => !1;
}
function Ny(t) {
  if (typeof t != "string")
    throw new Error("string expected");
  t = b.normalize(t), t = t.replace(/\\/g, "/");
  let e = !1;
  t.startsWith("//") && (e = !0);
  const r = /\/\//;
  for (; t.match(r); )
    t = t.replace(r, "/");
  return e && (t = "/" + t), t;
}
function Ay(t, e, r) {
  const n = Ny(e);
  for (let s = 0; s < t.length; s++) {
    const i = t[s];
    if (i(n, r))
      return !0;
  }
  return !1;
}
function Ly(t, e) {
  if (t == null)
    throw new TypeError("anymatch: specify first argument");
  const n = Wr(t).map((s) => Ry(s));
  return (s, i) => Ay(n, s, i);
}
const Sa = (t) => {
  const e = Wr(t).flat();
  if (!e.every((r) => typeof r === Iy))
    throw new TypeError(`Non-string provided as watch path: ${e}`);
  return e.map(el);
}, Oa = (t) => {
  let e = t.replace(xy, Mn), r = !1;
  for (e.startsWith(Cy) && (r = !0); e.match(ba); )
    e = e.replace(ba, Mn);
  return r && (e = Mn + e), e;
}, el = (t) => Oa(b.normalize(Oa(t))), Ea = (t = "") => (e) => typeof e == "string" ? el(b.isAbsolute(e) ? e : b.join(t, e)) : e, Py = (t, e) => b.isAbsolute(t) ? t : b.join(e, t), Wy = Object.freeze(/* @__PURE__ */ new Set());
class $y {
  constructor(e, r) {
    this.path = e, this._removeWatcher = r, this.items = /* @__PURE__ */ new Set();
  }
  add(e) {
    const { items: r } = this;
    r && e !== Xc && e !== Dy && r.add(e);
  }
  async remove(e) {
    const { items: r } = this;
    if (!r || (r.delete(e), r.size > 0))
      return;
    const n = this.path;
    try {
      await Da(n);
    } catch {
      this._removeWatcher && this._removeWatcher(b.dirname(n), b.basename(n));
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
    this.items.clear(), this.path = "", this._removeWatcher = Bs, this.items = Wy, Object.freeze(this);
  }
}
const zy = "stat", Vy = "lstat";
class Uy {
  constructor(e, r, n) {
    this.fsw = n;
    const s = e;
    this.path = e = e.replace(Fy, ""), this.watchPath = s, this.fullWatchPath = b.resolve(s), this.dirParts = [], this.dirParts.forEach((i) => {
      i.length > 1 && i.pop();
    }), this.followSymlinks = r, this.statMethod = r ? zy : Vy;
  }
  entryPath(e) {
    return b.join(this.watchPath, b.relative(this.watchPath, e.fullPath));
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
class tl extends Ll {
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
      ignored: e.ignored ? Wr(e.ignored) : Wr([]),
      awaitWriteFinish: r === !0 ? n : typeof r == "object" ? { ...n, ...r } : !1
    };
    yy && (s.usePolling = !0), s.atomic === void 0 && (s.atomic = !s.usePolling);
    const i = process.env.CHOKIDAR_USEPOLLING;
    if (i !== void 0) {
      const u = i.toLowerCase();
      u === "false" || u === "0" ? s.usePolling = !1 : u === "true" || u === "1" ? s.usePolling = !0 : s.usePolling = !!u;
    }
    const a = process.env.CHOKIDAR_INTERVAL;
    a && (s.interval = Number.parseInt(a, 10));
    let o = 0;
    this._emitReady = () => {
      o++, o >= this._readyCount && (this._emitReady = Bs, this._readyEmitted = !0, process.nextTick(() => this.emit(j.READY)));
    }, this._emitRaw = (...u) => this.emit(j.RAW, ...u), this._boundRemove = this._remove.bind(this), this.options = s, this._nodeFsHandler = new Ey(this), Object.freeze(s);
  }
  _addIgnoredPath(e) {
    if (Fn(e)) {
      for (const r of this._ignoredPaths)
        if (Fn(r) && r.path === e.path && r.recursive === e.recursive)
          return;
    }
    this._ignoredPaths.add(e);
  }
  _removeIgnoredPath(e) {
    if (this._ignoredPaths.delete(e), typeof e == "string")
      for (const r of this._ignoredPaths)
        Fn(r) && r.path === e && this._ignoredPaths.delete(r);
  }
  // Public methods
  /**
   * Adds paths to be watched on an existing FSWatcher instance.
   * @param paths_ file or file list. Other arguments are unused
   */
  add(e, r, n) {
    const { cwd: s } = this.options;
    this.closed = !1, this._closePromise = void 0;
    let i = Sa(e);
    return s && (i = i.map((a) => Py(a, s))), i.forEach((a) => {
      this._removeIgnoredPath(a);
    }), this._userIgnored = void 0, this._readyCount || (this._readyCount = 0), this._readyCount += i.length, Promise.all(i.map(async (a) => {
      const o = await this._nodeFsHandler._addToNodeFs(a, !n, void 0, 0, r);
      return o && this._emitReady(), o;
    })).then((a) => {
      this.closed || a.forEach((o) => {
        o && this.add(b.dirname(o), b.basename(r || o));
      });
    }), this;
  }
  /**
   * Close watchers or start ignoring events from specified paths.
   */
  unwatch(e) {
    if (this.closed)
      return this;
    const r = Sa(e), { cwd: n } = this.options;
    return r.forEach((s) => {
      !b.isAbsolute(s) && !this._closers.has(s) && (n && (s = b.join(n, s)), s = b.resolve(s)), this._closePath(s), this._addIgnoredPath(s), this._watched.has(s) && this._addIgnoredPath({
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
      const i = (this.options.cwd ? b.relative(this.options.cwd, n) : n) || Xc;
      e[i] = r.getChildren().sort();
    }), e;
  }
  emitWithAll(e, r) {
    this.emit(e, ...r), e !== j.ERROR && this.emit(j.ALL, e, ...r);
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
    Qc && (r = b.normalize(r)), s.cwd && (r = b.relative(s.cwd, r));
    const i = [r];
    n != null && i.push(n);
    const a = s.awaitWriteFinish;
    let o;
    if (a && (o = this._pendingWrites.get(r)))
      return o.lastChange = /* @__PURE__ */ new Date(), this;
    if (s.atomic) {
      if (e === j.UNLINK)
        return this._pendingUnlinks.set(r, [e, ...i]), setTimeout(() => {
          this._pendingUnlinks.forEach((u, c) => {
            this.emit(...u), this.emit(j.ALL, ...u), this._pendingUnlinks.delete(c);
          });
        }, typeof s.atomic == "number" ? s.atomic : 100), this;
      e === j.ADD && this._pendingUnlinks.has(r) && (e = j.CHANGE, this._pendingUnlinks.delete(r));
    }
    if (a && (e === j.ADD || e === j.CHANGE) && this._readyEmitted) {
      const u = (c, l) => {
        c ? (e = j.ERROR, i[0] = c, this.emitWithAll(e, i)) : l && (i.length > 1 ? i[1] = l : i.push(l), this.emitWithAll(e, i));
      };
      return this._awaitWriteFinish(r, a.stabilityThreshold, e, u), this;
    }
    if (e === j.CHANGE && !this._throttle(j.CHANGE, r, 50))
      return this;
    if (s.alwaysStat && n === void 0 && (e === j.ADD || e === j.ADD_DIR || e === j.CHANGE)) {
      const u = s.cwd ? b.join(s.cwd, r) : r;
      let c;
      try {
        c = await $r(u);
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
    return e && r !== "ENOENT" && r !== "ENOTDIR" && (!this.options.ignorePermissionErrors || r !== "EPERM" && r !== "EACCES") && this.emit(j.ERROR, e), e || this.closed;
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
    this.options.cwd && !b.isAbsolute(e) && (u = b.join(this.options.cwd, e));
    const c = /* @__PURE__ */ new Date(), l = this._pendingWrites;
    function f(h) {
      $l(u, (d, m) => {
        if (d || !l.has(e)) {
          d && d.code !== "ENOENT" && s(d);
          return;
        }
        const _ = Number(/* @__PURE__ */ new Date());
        h && m.size !== h.size && (l.get(e).lastChange = _);
        const O = l.get(e);
        _ - O.lastChange >= r ? (l.delete(e), s(void 0, m)) : o = setTimeout(f, a, m);
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
    if (this.options.atomic && My.test(e))
      return !0;
    if (!this._userIgnored) {
      const { cwd: n } = this.options, i = (this.options.ignored || []).map(Ea(n)), o = [...[...this._ignoredPaths].map(Ea(n)), ...i];
      this._userIgnored = Ly(o);
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
    return new Uy(e, this.options.followSymlinks, this);
  }
  // Directory helpers
  // -----------------
  /**
   * Provides directory tracking objects
   * @param directory path of the directory
   */
  _getWatchedDir(e) {
    const r = b.resolve(e);
    return this._watched.has(r) || this._watched.set(r, new $y(r, this._boundRemove)), this._watched.get(r);
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
    const s = b.join(e, r), i = b.resolve(s);
    if (n = n ?? (this._watched.has(s) || this._watched.has(i)), !this._throttle("remove", s, 100))
      return;
    !n && this._watched.size === 1 && this.add(e, r, !0), this._getWatchedDir(s).getChildren().forEach((h) => this._remove(s, h));
    const u = this._getWatchedDir(e), c = u.has(r);
    u.remove(r), this._symlinkPaths.has(i) && this._symlinkPaths.delete(i);
    let l = s;
    if (this.options.cwd && (l = b.relative(this.options.cwd, s)), this.options.awaitWriteFinish && this._pendingWrites.has(l) && this._pendingWrites.get(l).cancelWait() === j.ADD)
      return;
    this._watched.delete(s), this._watched.delete(i);
    const f = n ? j.UNLINK_DIR : j.UNLINK;
    c && !this._isIgnored(s) && this._emit(f, s), this._closePath(s);
  }
  /**
   * Closes all watchers for a path
   */
  _closePath(e) {
    this._closeFile(e);
    const r = b.dirname(e);
    this._getWatchedDir(r).remove(b.basename(e));
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
    const n = { type: j.ALL, alwaysStat: !0, lstat: !0, ...r, depth: 0 };
    let s = fy(e, n);
    return this._streams.add(s), s.once(dy, () => {
      s = void 0;
    }), s.once(Jc, () => {
      s && (this._streams.delete(s), s = void 0);
    }), s;
  }
}
function jy(t, e = {}) {
  const r = new tl(e);
  return r.add(t), r;
}
const qy = { watch: jy, FSWatcher: tl };
class Hy {
  constructor() {
    Ie(this, "git", null);
    Ie(this, "watcher", null);
    Ie(this, "workingDirectory", "");
    Ie(this, "debounceTimeout", null);
  }
  initializeWatcher() {
    this.watcher && this.watcher.close(), this.watcher = qy.watch(this.workingDirectory, {
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
      S.emit("git:status-changed", e);
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
      this.git = In(e);
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
      return await In(e).checkIsRepo();
    } catch (r) {
      return console.error("Failed to check git repository:", r), !1;
    }
  }
  async initRepo(e) {
    try {
      const r = In(e);
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
const fe = new Hy();
function Gy() {
  S.handle("git:initialize", async (t, e) => await fe.initialize(e)), S.handle("git:checkIsRepo", async (t, e) => await fe.checkIsRepo(e)), S.handle("git:init", async (t, e) => await fe.initRepo(e)), S.handle("git:status", async () => await fe.getStatus()), S.handle("git:add", async (t, e) => await fe.add(e)), S.handle("git:stage", async (t, e) => await fe.stage(e)), S.handle("git:unstage", async (t, e) => await fe.unstage(e)), S.handle("git:commit", async (t, e) => await fe.commit(e)), S.handle("git:stageAll", async () => await fe.stageAll()), S.handle("git:unstageAll", async () => await fe.unstageAll()), S.handle("git:discardAll", async () => await fe.discardAll()), S.handle("git:getLog", async () => await fe.getLog());
}
se.setName("DailyUse");
const By = Re.dirname(Dl(import.meta.url));
process.env.APP_ROOT = Re.join(By, "..");
const jt = process.env.VITE_DEV_SERVER_URL, nn = Re.join(process.env.APP_ROOT, "dist-electron"), nr = Re.join(process.env.APP_ROOT, "dist");
process.env.MAIN_DIST = nn;
process.env.RENDERER_DIST = nr;
process.env.VITE_PUBLIC = jt ? Re.join(process.env.APP_ROOT, "public") : nr;
let L, pr = null, Rn = null;
function is() {
  L = new qt({
    frame: !1,
    icon: Re.join(process.env.VITE_PUBLIC, "DailyUse.svg"),
    webPreferences: {
      nodeIntegration: !0,
      contextIsolation: !0,
      webSecurity: !0,
      preload: Re.join(nn, "main_preload.mjs"),
      additionalArguments: ["--enable-features=SharedArrayBuffer"],
      allowRunningInsecureContent: !1
    },
    width: 1400,
    height: 800
  });
  const t = {
    "default-src": ["'self'", "local:"],
    "script-src": ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "local:"]
  };
  L.webContents.session.webRequest.onHeadersReceived((e, r) => {
    const n = Object.entries(t).map(([s, i]) => `${s} ${i.join(" ")}`).join("; ");
    r({
      responseHeaders: {
        ...e.responseHeaders,
        "Content-Security-Policy": [n]
      }
    });
  }), Rn = new Hl(), L && (Rn.register(new Gl()), Rn.initializeAll()), jt ? L.loadURL(jt) : L.loadFile(Re.join(nr, "index.html")), L.setMinimumSize(800, 600), Zy(L), L.on("close", (e) => (se.isQuitting || (e.preventDefault(), L == null || L.hide()), !1));
}
function Zy(t) {
  const e = Ol.createFromPath(Ca(process.env.VITE_PUBLIC, "DailyUse-16.png"));
  pr = new El(e), pr.setToolTip("DailyUse");
  const r = Cl.buildFromTemplate([
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
  pr.setContextMenu(r), pr.on("click", () => {
    t.show();
  });
}
se.on("window-all-closed", () => {
  process.platform !== "darwin" && (se.quit(), L = null);
});
se.on("activate", () => {
  qt.getAllWindows().length === 0 && is();
});
se.whenReady().then(() => {
  is(), Bl(), Gy(), L && (Yl(L, nn, nr, jt), Ud()), Sl.registerFileProtocol("local", (t, e) => {
    const r = t.url.replace("local://", "");
    try {
      return e(decodeURIComponent(r));
    } catch (n) {
      console.error(n);
    }
  }), se.on("activate", () => {
    qt.getAllWindows().length === 0 && is();
  });
});
S.handle("readClipboard", () => Dr.readText());
S.handle("writeClipboard", (t, e) => {
  Dr.writeText(e);
});
S.handle("readClipboardFiles", () => Dr.availableFormats().includes("FileNameW") ? Dr.read("FileNameW").split("\0").filter(Boolean) : []);
S.on("window-control", (t, e) => {
  switch (e) {
    case "minimize":
      L == null || L.minimize();
      break;
    case "maximize":
      L != null && L.isMaximized() ? L == null || L.unmaximize() : L == null || L.maximize();
      break;
    case "close":
      L == null || L.close();
      break;
  }
});
S.handle("open-external-url", async (t, e) => {
  try {
    await dt.openExternal(e);
  } catch (r) {
    console.error("Failed to open URL:", r);
  }
});
S.handle("get-auto-launch", () => se.getLoginItemSettings().openAtLogin);
S.handle("set-auto-launch", (t, e) => (process.platform === "win32" && se.setLoginItemSettings({
  openAtLogin: e,
  path: process.execPath
}), se.getLoginItemSettings().openAtLogin));
se.on("before-quit", () => {
  se.isQuitting = !0;
});
export {
  nn as MAIN_DIST,
  nr as RENDERER_DIST,
  jt as VITE_DEV_SERVER_URL
};
