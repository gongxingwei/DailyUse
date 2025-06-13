var Ll = Object.defineProperty;
var Al = (t, e, r) => e in t ? Ll(t, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : t[e] = r;
var $ = (t, e, r) => Al(t, typeof e != "symbol" ? e + "" : e, r);
import { BrowserWindow as Yt, ipcMain as p, dialog as jt, app as ne, shell as at, globalShortcut as ai, screen as Pl, protocol as Wl, clipboard as Rr, nativeImage as Ul, Tray as $l, Menu as zl } from "electron";
import { fileURLToPath as $a } from "node:url";
import me, { resolve as oi, join as Vl, relative as jl, sep as Hl } from "node:path";
import { exec as Gl, spawn as Bl } from "child_process";
import * as k from "path";
import Ae from "path";
import ci, { lstat as ui, stat as ql, readdir as Yl, realpath as Zl } from "node:fs/promises";
import "node:fs";
import Jl from "better-sqlite3";
import li from "bcrypt";
import ur, { randomFillSync as Kl, randomUUID as Xl } from "crypto";
import ue, { realpath as os, stat as yn, lstat as Ql, open as ef, readdir as tf } from "fs/promises";
import { Buffer as rf } from "buffer";
import { Buffer as sf } from "node:buffer";
import za, { unwatchFile as fi, watchFile as nf, watch as af, stat as of } from "fs";
import Va from "tty";
import cf from "util";
import uf, { type as lf } from "os";
import { EventEmitter as ff } from "node:events";
import df, { EventEmitter as hf } from "events";
import { Readable as mf } from "node:stream";
class gf {
  constructor() {
    $(this, "plugins", /* @__PURE__ */ new Map());
    $(this, "initialized", !1);
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
      } catch (s) {
        console.error(`[PluginManager] 插件 ${e} 初始化失败:`, s);
      }
  }
  async destroyAll() {
    for (const e of this.plugins.values())
      await e.destroy();
    this.plugins.clear(), this.initialized = !1;
  }
  getPlugin(e) {
    return this.plugins.get(e);
  }
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }
}
class pf {
  constructor() {
    $(this, "metadata", {
      name: "quickLauncher",
      version: "1.0.0",
      description: "Quick application launcher with shortcuts",
      author: "bakersean"
    });
    $(this, "quickLauncherWindow", null);
  }
  createQuickLauncherWindow() {
    if (this.quickLauncherWindow) {
      this.quickLauncherWindow.isVisible() ? this.quickLauncherWindow.hide() : (this.quickLauncherWindow.show(), this.quickLauncherWindow.focus());
      return;
    }
    const e = Ae.resolve(ns, "quickLauncher_preload.mjs");
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
    }), this.quickLauncherWindow.webContents.session.webRequest.onHeadersReceived((r, s) => {
      s({
        responseHeaders: {
          ...r.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
          ]
        }
      });
    }), this.quickLauncherWindow.once("ready-to-show", () => {
      this.quickLauncherWindow && (this.quickLauncherWindow.show(), this.quickLauncherWindow.focus());
    }), St ? this.quickLauncherWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/src/plugins/quickLauncher/index.html`) : this.quickLauncherWindow.loadFile(
      Ae.join(or, "src/plugins/quickLauncher/index.html")
    ), this.quickLauncherWindow.on("closed", () => {
      this.quickLauncherWindow = null;
    });
  }
  async init() {
    this.registerIpcHandlers(), this.registerShortcuts();
  }
  registerIpcHandlers() {
    p.handle("launch-application", async (e, r) => new Promise((s, n) => {
      const i = { windowsHide: !1 };
      Gl(`start "" "${r}"`, i, (a) => {
        a ? (console.error("[QuickLauncherMain] 启动应用失败:", a), n(a)) : s(!0);
      });
    })), p.handle("select-file", async () => await jt.showOpenDialog({
      properties: ["openFile"]
    })), p.handle("get-file-icon", async (e, r) => {
      try {
        return (await ne.getFileIcon(r, {
          size: "large"
          // 可选值: 'small', 'normal', 'large'
        })).toDataURL();
      } catch (s) {
        return console.error("获取文件图标失败:", s), null;
      }
    }), p.handle("get-link-file-target-path", async (e, r) => {
      try {
        const s = Ae.win32.normalize(r);
        return at.readShortcutLink(s).target;
      } catch (s) {
        return console.error("Failed to read shortcut target path:", s), "";
      }
    }), p.handle("reveal-in-explorer", async (e, r) => {
      try {
        return at.showItemInFolder(r), !0;
      } catch (s) {
        return console.error("Failed to reveal in explorer:", s), !1;
      }
    }), p.handle("hide-window", async () => {
      var e;
      try {
        return (e = this.quickLauncherWindow) == null || e.hide(), !0;
      } catch (r) {
        return console.error("failed to hide window", r), !1;
      }
    });
  }
  registerShortcuts() {
    ai.register("Alt+Space", () => {
      this.quickLauncherWindow ? this.quickLauncherWindow.isVisible() ? this.quickLauncherWindow.hide() : (this.quickLauncherWindow.show(), this.quickLauncherWindow.focus()) : this.createQuickLauncherWindow();
    });
  }
  async destroy() {
    ai.unregister("Alt+Space"), p.removeHandler("launch-application"), p.removeHandler("select-file"), this.quickLauncherWindow && (this.quickLauncherWindow.close(), this.quickLauncherWindow = null);
  }
}
const ja = $a(import.meta.url), yf = me.dirname(ja);
globalThis.__filename = ja;
globalThis.__dirname = yf;
let Y = null, lr = !1;
async function Ht() {
  if (Y !== null) return Y;
  if (lr) {
    for (; lr; )
      await new Promise((t) => setTimeout(t, 50));
    if (Y !== null) return Y;
  }
  lr = !0;
  try {
    const t = me.join(ne.getPath("userData"), "database");
    try {
      await ci.access(t);
    } catch {
      await ci.mkdir(t, { recursive: !0 });
    }
    const e = me.join(t, "dailyuse.db");
    Y = new Jl(e, {
      verbose: process.env.NODE_ENV !== "production" ? console.log : void 0
    }), Y.pragma("journal_mode = WAL"), Y.exec(`
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        avatar TEXT,
        email TEXT,
        phone TEXT,
        accountType TEXT DEFAULT 'local',
        onlineId TEXT,
        createdAt INTEGER NOT NULL
      )
    `), Y.exec(`
      CREATE TABLE IF NOT EXISTS login_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password TEXT, -- 加密存储，只有记住密码时才有值
        token TEXT, -- 存储会话令牌
        accountType TEXT NOT NULL CHECK(accountType IN ('local', 'online')) DEFAULT 'local',
        rememberMe BOOLEAN NOT NULL DEFAULT 0,
        lastLoginTime INTEGER NOT NULL,
        autoLogin BOOLEAN NOT NULL DEFAULT 0,
        isActive BOOLEAN NOT NULL DEFAULT 0,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        UNIQUE(username, accountType) -- 同一用户名和账户类型组合唯一
      )
    `), Y.exec(`
      CREATE TABLE IF NOT EXISTS user_store_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        store_name TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(username, store_name),
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
      )
    `);
    try {
      Y.exec("ALTER TABLE login_sessions ADD COLUMN token TEXT");
    } catch (r) {
      r instanceof Error && r.message.includes("duplicate column name") || console.error("添加 token 字段失败:", r);
    }
    return Y.exec(`
      CREATE INDEX IF NOT EXISTS idx_login_sessions_username ON login_sessions(username);
      CREATE INDEX IF NOT EXISTS idx_login_sessions_active ON login_sessions(isActive);
      CREATE INDEX IF NOT EXISTS idx_login_sessions_auto_login ON login_sessions(autoLogin);
    `), Y.exec(`
      CREATE INDEX IF NOT EXISTS idx_user_store_username ON user_store_data(username);
      CREATE INDEX IF NOT EXISTS idx_user_store_name ON user_store_data(store_name);
    `), Y;
  } catch (t) {
    throw console.error("数据库初始化失败:", t), t;
  } finally {
    lr = !1;
  }
}
async function wf() {
  return Y === null ? await Ht() : Y;
}
async function di() {
  if (Y)
    try {
      Y.close(), Y = null;
    } catch (t) {
      console.error("关闭数据库失败:", t);
    }
}
typeof process < "u" && (process.on("exit", () => {
  if (Y)
    try {
      Y.close();
    } catch (t) {
      console.error("退出时关闭数据库失败:", t);
    }
}), process.on("SIGINT", async () => {
  await di(), process.exit(0);
}), process.on("SIGTERM", async () => {
  await di(), process.exit(0);
}));
class wn {
  /**
   * 私有构造函数，防止直接实例化
   */
  constructor() {
    $(this, "db", null);
  }
  /**
   * 静态方法创建实例
   * @returns UserModel 实例
   */
  static async create() {
    const e = new wn();
    return e.db = await Ht(), e;
  }
  /**
   * 确保数据库连接存在
   */
  async ensureDatabase() {
    return this.db || (this.db = await Ht()), this.db;
  }
  /**
   * 添加新用户
   * @param userData 用户数据对象
   * @returns 添加是否成功
   */
  async addUser(e) {
    try {
      return (await this.ensureDatabase()).prepare(`
        INSERT INTO users (
          username,
          password,
          avatar,
          email,
          phone,
          accountType,
          onlineId,
          createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
        e.username,
        e.password,
        e.avatar || null,
        e.email || null,
        e.phone || null,
        e.accountType || "local",
        e.onlineId || null,
        e.createdAt
      ).changes > 0;
    } catch (r) {
      return console.error("添加用户失败:", r), !1;
    }
  }
  /**
   * 删除用户
   * @param username 用户名
   * @returns 删除是否成功
   */
  async removeUser(e) {
    try {
      return (await this.ensureDatabase()).prepare("DELETE FROM users WHERE username = ?").run(e).changes > 0;
    } catch (r) {
      return console.error("删除用户失败:", r), !1;
    }
  }
  /**
   * 通过用户名查找用户
   * @param username 用户名
   * @returns 用户对象，未找到则返回null
   */
  async findUserByUsername(e) {
    try {
      return (await this.ensureDatabase()).prepare("SELECT * FROM users WHERE username = ?").get(e) || null;
    } catch (r) {
      return console.error("查找用户失败:", r), null;
    }
  }
  /**
   * 获取所有用户
   * @returns 用户对象数组
   */
  async getAllUsers() {
    try {
      return (await this.ensureDatabase()).prepare("SELECT * FROM users").all();
    } catch (e) {
      return console.error("failed to get all users:", e), [];
    }
  }
  /**
   * 按账户类型查询用户
   * @param accountType 账户类型（例如：'local', 'online'）
   * @returns 用户对象数组
   */
  async findUsersByAccountType(e) {
    try {
      return (await this.ensureDatabase()).prepare("SELECT * FROM users WHERE accountType = ?").all(e);
    } catch (r) {
      return console.error(`获取${e}类型用户列表失败:`, r), [];
    }
  }
  /**
   * 更新用户信息
   * @param username 用户名（主键，不可更改）
   * @param userData 需要更新的用户数据，可以是部分字段
   * @returns 更新是否成功
   */
  async updateUser(e, r) {
    try {
      const s = await this.ensureDatabase(), { username: n, ...i } = r;
      if (Object.keys(i).length === 0)
        return !0;
      const o = `UPDATE users SET ${Object.keys(i).map((f) => `${f} = ?`).join(", ")} WHERE username = ?`, c = [...Object.values(i), e];
      return s.prepare(o).run(...c).changes > 0;
    } catch (s) {
      return console.error("更新用户信息失败:", s), !1;
    }
  }
  /**
   * 检查用户是否存在
   * @param username 用户名
   * @returns 用户是否存在
   */
  async userExists(e) {
    try {
      return (await this.ensureDatabase()).prepare("SELECT 1 FROM users WHERE username = ?").get(e) !== void 0;
    } catch (r) {
      return console.error("检查用户存在失败:", r), !1;
    }
  }
  /**
   * 获取用户总数
   * @returns 用户总数
   */
  async getUserCount() {
    try {
      return (await this.ensureDatabase()).prepare("SELECT COUNT(*) as count FROM users").get().count;
    } catch (e) {
      return console.error("获取用户数量失败:", e), 0;
    }
  }
  /**
   * 更新用户在线状态
   * @param username 用户名
   * @param onlineId 在线ID
   * @returns 更新是否成功
   */
  async updateUserOnlineStatus(e, r) {
    try {
      return (await this.ensureDatabase()).prepare(`
        UPDATE users 
        SET accountType = 'online', onlineId = ? 
        WHERE username = ?
      `).run(r, e).changes > 0;
    } catch (s) {
      return console.error("更新用户在线状态失败:", s), !1;
    }
  }
}
const J = [];
for (let t = 0; t < 256; ++t)
  J.push((t + 256).toString(16).slice(1));
function vf(t, e = 0) {
  return (J[t[e + 0]] + J[t[e + 1]] + J[t[e + 2]] + J[t[e + 3]] + "-" + J[t[e + 4]] + J[t[e + 5]] + "-" + J[t[e + 6]] + J[t[e + 7]] + "-" + J[t[e + 8]] + J[t[e + 9]] + "-" + J[t[e + 10]] + J[t[e + 11]] + J[t[e + 12]] + J[t[e + 13]] + J[t[e + 14]] + J[t[e + 15]]).toLowerCase();
}
const Tr = new Uint8Array(256);
let fr = Tr.length;
function _f() {
  return fr > Tr.length - 16 && (Kl(Tr), fr = 0), Tr.slice(fr, fr += 16);
}
const hi = { randomUUID: Xl };
function Tf(t, e, r) {
  var n;
  if (hi.randomUUID && !t)
    return hi.randomUUID();
  t = t || {};
  const s = t.random ?? ((n = t.rng) == null ? void 0 : n.call(t)) ?? _f();
  if (s.length < 16)
    throw new Error("Random bytes length must be >= 16");
  return s[6] = s[6] & 15 | 64, s[8] = s[8] & 63 | 128, vf(s);
}
const st = class st {
  /**
   * 私有构造函数，初始化用户数据模型
   */
  constructor(e) {
    $(this, "userModel");
    this.userModel = e;
  }
  /**
   * 获取UserService单例
   * @returns UserService实例
   */
  static async getInstance() {
    if (!st.instance) {
      const e = await wn.create();
      st.instance = new st(e);
    }
    return st.instance;
  }
  /**
   * 用户注册
   * @param data 注册数据
   * @returns 响应结果
   */
  async register(e) {
    try {
      if (!e.username || !e.password)
        return {
          success: !1,
          message: "用户名和密码不能为空"
        };
      if (e.password !== e.confirmPassword)
        return {
          success: !1,
          message: "两次输入的密码不一致"
        };
      if (await this.userModel.findUserByUsername(e.username))
        return {
          success: !1,
          message: "用户名已存在"
        };
      const s = await this.hashPassword(e.password), n = {
        id: Tf(),
        // 使用UUID生成唯一ID
        username: e.username,
        password: s,
        email: e.email,
        phone: e.phone,
        accountType: "local",
        createdAt: Date.now()
      };
      return await this.userModel.addUser(n) ? {
        success: !0,
        message: "注册成功",
        data: {
          username: n.username,
          avatar: n.avatar,
          email: n.email,
          phone: n.phone,
          accountType: n.accountType,
          createdAt: n.createdAt
        }
      } : {
        success: !1,
        message: "注册失败，请重试"
      };
    } catch (r) {
      return console.error("注册过程中发生错误:", r), {
        success: !1,
        message: "注册失败，服务器错误"
      };
    }
  }
  /**
   * 用户登录
   * @param data 登录数据
   * @returns 响应结果
   */
  async login(e) {
    try {
      if (!e.username || !e.password)
        return {
          success: !1,
          message: "用户名和密码不能为空"
        };
      const r = await this.userModel.findUserByUsername(e.username);
      return r ? await this.verifyPassword(e.password, r.password) ? {
        success: !0,
        message: "登录成功",
        data: {
          username: r.username,
          avatar: r.avatar,
          email: r.email,
          phone: r.phone,
          accountType: r.accountType,
          onlineId: r.onlineId,
          createdAt: r.createdAt
        }
      } : {
        success: !1,
        message: "密码错误"
      } : {
        success: !1,
        message: "用户不存在"
      };
    } catch (r) {
      return console.error("登录过程中发生错误:", r), {
        success: !1,
        message: "登录失败，服务器错误"
      };
    }
  }
  /**
   * 获取用户信息
   * @param username 用户名
   * @returns 响应结果
   */
  async getUserInfo(e) {
    try {
      if (!e)
        return {
          success: !1,
          message: "用户名不能为空"
        };
      const r = await this.userModel.findUserByUsername(e);
      return r ? {
        success: !0,
        message: "获取用户信息成功",
        data: {
          username: r.username,
          avatar: r.avatar,
          email: r.email,
          phone: r.phone,
          accountType: r.accountType,
          onlineId: r.onlineId,
          createdAt: r.createdAt
        }
      } : {
        success: !1,
        message: "用户不存在"
      };
    } catch (r) {
      return console.error("获取用户信息失败:", r), {
        success: !1,
        message: "获取用户信息失败"
      };
    }
  }
  /**
   * 更新用户信息
   * @param username 用户名
   * @param data 更新数据
   * @returns 响应结果
   */
  async updateUserInfo(e, r) {
    try {
      return e ? await this.userModel.findUserByUsername(e) ? (r.password && (r.password = await this.hashPassword(r.password)), await this.userModel.updateUser(e, r) ? {
        success: !0,
        message: "更新成功"
      } : {
        success: !1,
        message: "更新失败"
      }) : {
        success: !1,
        message: "用户不存在"
      } : {
        success: !1,
        message: "用户名不能为空"
      };
    } catch (s) {
      return console.error("更新用户信息失败:", s), {
        success: !1,
        message: "更新失败，服务器错误"
      };
    }
  }
  /**
   * 删除用户账号
   * @param username 用户名
   * @returns 响应结果
   */
  async deleteUser(e) {
    try {
      return e ? await this.userModel.findUserByUsername(e) ? await this.userModel.removeUser(e) ? {
        success: !0,
        message: "账号删除成功"
      } : {
        success: !1,
        message: "删除失败"
      } : {
        success: !1,
        message: "用户不存在"
      } : {
        success: !1,
        message: "用户名不能为空"
      };
    } catch (r) {
      return console.error("删除用户失败:", r), {
        success: !1,
        message: "删除失败，服务器错误"
      };
    }
  }
  /**
   * 升级为在线账号
   * @param username 用户名
   * @param onlineId 在线ID
   * @returns 响应结果
   */
  async upgradeToOnlineAccount(e, r) {
    try {
      return !e || !r ? {
        success: !1,
        message: "参数不能为空"
      } : await this.userModel.findUserByUsername(e) ? await this.userModel.updateUserOnlineStatus(e, r) ? {
        success: !0,
        message: "升级为在线账号成功"
      } : {
        success: !1,
        message: "升级失败"
      } : {
        success: !1,
        message: "用户不存在"
      };
    } catch (s) {
      return console.error("升级账号失败:", s), {
        success: !1,
        message: "升级失败，服务器错误"
      };
    }
  }
  /**
   * 获取所有用户列表
   * @returns 响应结果
   */
  async getAllUsers() {
    try {
      return {
        success: !0,
        message: "获取用户列表成功",
        data: (await this.userModel.getAllUsers()).map((s) => ({
          username: s.username,
          avatar: s.avatar,
          email: s.email,
          phone: s.phone,
          accountType: s.accountType,
          onlineId: s.onlineId,
          createdAt: s.createdAt
        }))
      };
    } catch (e) {
      return console.error("获取用户列表失败:", e), {
        success: !1,
        message: "获取用户列表失败"
      };
    }
  }
  /**
   * 密码哈希加密
   * @param password 原始密码
   * @returns 加密后的密码
   */
  async hashPassword(e) {
    return await li.hash(e, 10);
  }
  /**
   * 验证密码
   * @param password 输入的原始密码
   * @param hashedPassword 数据库中的加密密码
   * @returns 密码是否匹配
   */
  async verifyPassword(e, r) {
    return await li.compare(e, r);
  }
};
$(st, "instance");
let Mr = st;
const Ha = Mr.getInstance(), bf = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  UserService: Mr,
  userService: Ha
}, Symbol.toStringTag, { value: "Module" }));
async function Ef() {
  try {
    const t = await Ha;
    p.handle("user:register", async (e, r) => {
      try {
        return await t.register(r);
      } catch (s) {
        return console.error("IPC: 注册异常", s), {
          success: !1,
          message: s instanceof Error ? s.message : "注册失败，未知错误"
        };
      }
    }), p.handle("user:login", async (e, r) => {
      try {
        return await t.login(r);
      } catch (s) {
        return console.error("IPC: 登录异常", s), {
          success: !1,
          message: s instanceof Error ? s.message : "登录失败，未知错误"
        };
      }
    }), p.handle("user:getUserInfo", async (e, r) => {
      try {
        return await t.getUserInfo(r);
      } catch (s) {
        return console.error("IPC: 获取用户信息异常", s), {
          success: !1,
          message: s instanceof Error ? s.message : "获取用户信息失败，未知错误"
        };
      }
    }), p.handle("user:update", async (e, r, s) => {
      try {
        return await t.updateUserInfo(r, s);
      } catch (n) {
        return console.error("IPC: 更新用户信息异常", n), {
          success: !1,
          message: n instanceof Error ? n.message : "更新用户信息失败，未知错误"
        };
      }
    }), p.handle("user:deregistration", async (e, r) => {
      try {
        return await t.deleteUser(r);
      } catch (s) {
        return console.error("IPC: 删除用户账号异常", s), {
          success: !1,
          message: s instanceof Error ? s.message : "删除账号失败，未知错误"
        };
      }
    }), p.handle("user:upgradeToOnline", async (e, r, s) => {
      try {
        return await t.upgradeToOnlineAccount(r, s);
      } catch (n) {
        return console.error("IPC: 升级为在线账号异常", n), {
          success: !1,
          message: n instanceof Error ? n.message : "升级账号失败，未知错误"
        };
      }
    }), p.handle("user:getAllUsers", async (e) => {
      var r;
      try {
        const s = await t.getAllUsers();
        return console.log("IPC: 获取用户列表结果", {
          success: s.success,
          userCount: ((r = s.data) == null ? void 0 : r.length) || 0
        }), s;
      } catch (s) {
        return console.error("IPC: 获取用户列表异常", s), {
          success: !1,
          message: s instanceof Error ? s.message : "获取用户列表失败，未知错误"
        };
      }
    }), p.handle("user:verifyPassword", async (e, r, s) => {
      try {
        return (await t.login({ username: r, password: s, remember: !1 })).success ? {
          success: !0,
          message: "密码验证成功"
        } : {
          success: !1,
          message: "密码验证失败"
        };
      } catch (n) {
        return console.error("IPC: 验证密码异常", n), {
          success: !1,
          message: n instanceof Error ? n.message : "密码验证失败，未知错误"
        };
      }
    }), p.handle("user:changePassword", async (e, r, s, n) => {
      try {
        if (!(await t.login({ username: r, password: s, remember: !1 })).success)
          return {
            success: !1,
            message: "当前密码验证失败"
          };
        const a = await t.updateUserInfo(r, { password: n });
        return a.success ? {
          success: !0,
          message: "密码修改成功"
        } : a;
      } catch (i) {
        return console.error("IPC: 修改密码异常", i), {
          success: !1,
          message: i instanceof Error ? i.message : "修改密码失败，未知错误"
        };
      }
    });
  } catch (t) {
    throw console.error("设置用户 IPC 处理器失败:", t), t;
  }
}
class vn {
  /**
   * 私有构造函数，防止直接实例化
   * 确保只能通过静态工厂方法创建实例，保证数据库连接的正确初始化
   */
  constructor() {
    /** 数据库连接实例，初始化后不为空 */
    $(this, "db", null);
  }
  /**
   * 静态工厂方法，创建并初始化 LoginSessionModel 实例
   * @returns {Promise<LoginSessionModel>} 已初始化的 LoginSessionModel 实例
   * @throws {Error} 当数据库初始化失败时抛出错误
   */
  static async create() {
    const e = new vn();
    return e.db = await Ht(), e;
  }
  /**
   * 确保数据库连接存在的私有方法
   * 如果连接不存在则重新初始化，提供双重保障
   * @returns {Promise<Database>} 数据库连接实例
   * @private
   */
  async ensureDatabase() {
    return this.db || (this.db = await Ht()), this.db;
  }
  /**
   * 添加新的登录会话记录
   * 使用 INSERT 策略，仅插入新记录，如果存在重复记录会失败
   * 适用于确定要创建新记录的场景
   * 
   * @param {Omit<TLoginSessionData, "id" | "createdAt" | "updatedAt">} sessionData - 会话数据
   * @returns {Promise<boolean>} 添加是否成功
   */
  async addLoginSession(e) {
    try {
      const r = await this.ensureDatabase(), s = Date.now();
      return r.prepare(`
          INSERT INTO login_sessions (
            username,
            accountType,
            rememberMe,
            password,
            token,
            lastLoginTime,
            autoLogin,
            isActive,
            createdAt,
            updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
        e.username,
        e.accountType,
        e.rememberMe ? 1 : 0,
        e.password || null,
        e.token || null,
        e.lastLoginTime,
        e.autoLogin ? 1 : 0,
        e.isActive ? 1 : 0,
        s,
        s
      ).changes > 0;
    } catch (r) {
      return console.error("添加登录会话失败:", r), !1;
    }
  }
  /**
   * 获取指定用户的登录会话信息
   * 通过用户名和账户类型精确查询记录
   * 
   * @param {string} username - 用户名
   * @param {string} accountType - 账户类型（'local' 或 'online'）
   * @returns {Promise<TLoginSessionData | null>} 登录会话数据，如果不存在则返回 null
   */
  async getSession(e, r) {
    try {
      return (await this.ensureDatabase()).prepare(`
          SELECT * FROM login_sessions 
          WHERE username = ? AND accountType = ?
        `).get(e, r) || null;
    } catch (s) {
      return console.error("获取登录会话失败:", s), null;
    }
  }
  /**
   * 更新指定用户的会话信息
   * 通过用户名和账户类型定位记录，更新传入的字段
   * 自动过滤不可更新的字段（id, username, accountType, createdAt）
   * 自动更新 updatedAt 字段为当前时间
   * 
   * @param {string} username - 用户名，用于定位记录
   * @param {string} accountType - 账户类型，用于定位记录
   * @param {Partial<TLoginSessionData>} updates - 要更新的字段集合
   * @returns {Promise<boolean>} 更新是否成功，如果没有匹配的记录则返回 false
   */
  async updateSession(e, r, s) {
    try {
      const n = await this.ensureDatabase(), i = Object.keys(s).filter(
        (l) => !["id", "username", "accountType", "createdAt"].includes(l)
      ).map((l) => `${l} = ?`);
      if (i.length === 0) return !0;
      i.push("updatedAt = ?");
      const a = `UPDATE login_sessions SET ${i.join(
        ", "
      )} WHERE username = ? AND accountType = ?`, o = [
        ...Object.keys(s).filter(
          (l) => !["id", "username", "accountType", "createdAt"].includes(l)
        ).map((l) => s[l]),
        Date.now(),
        // updatedAt 的值
        e,
        // WHERE 条件：用户名
        r
        // WHERE 条件：账户类型
      ];
      return n.prepare(a).run(...o).changes > 0;
    } catch (n) {
      return console.error("更新会话失败:", n), !1;
    }
  }
  /**
   * 删除指定的登录会话记录
   * 通过用户名和账户类型的组合精确删除记录
   * 
   * @param {string} username - 用户名
   * @param {string} accountType - 账户类型（'local' 或 'online'）
   * @returns {Promise<boolean>} 删除是否成功，如果记录不存在则返回 false
   */
  async deleteSession(e, r) {
    try {
      return (await this.ensureDatabase()).prepare(
        "DELETE FROM login_sessions WHERE username = ? AND accountType = ?"
      ).run(e, r).changes > 0;
    } catch (s) {
      return console.error("删除会话失败:", s), !1;
    }
  }
  /**
   * 获取所有登录会话历史记录
   * 按最后登录时间降序排列，最近的登录记录排在前面
   * 
   * @returns {Promise<TLoginSessionData[]>} 所有登录会话数据数组，失败时返回空数组
   */
  async getAllLoginSessions() {
    try {
      return (await this.ensureDatabase()).prepare(`
          SELECT * FROM login_sessions 
          ORDER BY lastLoginTime DESC
        `).all();
    } catch (e) {
      return console.error("获取登录历史失败:", e), [];
    }
  }
  /**
   * 获取所有记住密码的会话记录
   * 返回 rememberMe 为 true 的所有会话，按最后登录时间降序排列
   * 用于登录页面显示历史登录账号列表
   * 
   * @returns {Promise<TLoginSessionData[]>} 记住密码的会话数据数组，失败时返回空数组
   */
  async getRememberedSessions() {
    try {
      return (await this.ensureDatabase()).prepare(`
          SELECT * FROM login_sessions 
          WHERE rememberMe = 1 
          ORDER BY lastLoginTime DESC
        `).all();
    } catch (e) {
      return console.error("获取记住的会话失败:", e), [];
    }
  }
  /**
   * 获取设置为自动登录的会话记录
   * 返回最近一次设置为自动登录的会话，用于应用启动时的自动登录功能
   * 
   * @returns {Promise<TLoginSessionData | null>} 自动登录会话数据，不存在时返回 null
   */
  async getAutoLoginSession() {
    try {
      return (await this.ensureDatabase()).prepare(`
          SELECT * FROM login_sessions 
          WHERE autoLogin = 1 
          ORDER BY lastLoginTime DESC 
          LIMIT 1
        `).get() || null;
    } catch (e) {
      return console.error("获取自动登录会话失败:", e), null;
    }
  }
  /**
   * 获取当前活跃的会话记录
   * 返回标记为活跃状态的会话，正常情况下应该只有一个活跃会话
   * 用于获取当前登录用户的信息
   * 
   * @returns {Promise<TLoginSessionData | null>} 当前活跃会话数据，不存在时返回 null
   */
  async getActiveSession() {
    try {
      return (await this.ensureDatabase()).prepare(`
          SELECT * FROM login_sessions 
          WHERE isActive = 1 
          LIMIT 1
        `).get() || null;
    } catch (e) {
      return console.error("获取活跃会话失败:", e), null;
    }
  }
  /**
   * 清除所有登录会话记录
   * 删除数据库中的所有会话数据，用于重置或清理功能
   * 注意：此操作不可逆，请谨慎使用
   * 
   * @returns {Promise<boolean>} 清除是否成功，即使没有记录也返回 true
   */
  async clearAllSessions() {
    try {
      return (await this.ensureDatabase()).prepare("DELETE FROM login_sessions").run().changes >= 0;
    } catch (e) {
      return console.error("清除所有会话失败:", e), !1;
    }
  }
}
const nt = class nt {
  // 256位密钥
  /**
   * 私有构造函数，初始化登录会话模型和加密配置
   */
  constructor(e) {
    $(this, "loginSessionModel");
    // AES加密配置
    $(this, "algorithm", "aes-256-cbc");
    $(this, "secretKey");
    $(this, "keyLength", 32);
    this.loginSessionModel = e, this.secretKey = this.generateSecretKey();
  }
  /**
   * 获取 LoginSessionService 单例
   * @returns LoginSessionService 实例
   */
  static async getInstance() {
    if (!nt.instance) {
      const e = await vn.create();
      nt.instance = new nt(e);
    }
    return nt.instance;
  }
  /**
   * 创建登录会话
   * 用户登录成功后调用此方法保存会话信息
   *
   * @param sessionData 会话数据
   * @param sessionData.username 用户名
   * @param sessionData.password 原始密码（如果记住密码）
   * @param sessionData.accountType 账户类型
   * @param sessionData.rememberMe 是否记住密码
   * @param sessionData.autoLogin 是否自动登录
   * @returns 操作结果
   */
  async addSession(e) {
    try {
      if (!e.username || !e.accountType)
        return {
          success: !1,
          message: "用户名和账户类型不能为空"
        };
      let r;
      e.rememberMe && e.password && (r = await this.encryptPassword(e.password));
      const s = {
        username: e.username,
        password: r,
        token: e.token,
        accountType: e.accountType,
        rememberMe: e.rememberMe ? 1 : 0,
        lastLoginTime: Date.now(),
        autoLogin: e.autoLogin ? 1 : 0,
        isActive: 1
        // 使用数字而不是布尔值
      };
      return await this.loginSessionModel.addLoginSession(
        s
      ) ? {
        success: !0,
        message: "会话创建成功",
        data: {
          username: e.username,
          accountType: e.accountType,
          rememberMe: e.rememberMe,
          autoLogin: e.autoLogin
        }
      } : {
        success: !1,
        message: "会话创建失败"
      };
    } catch (r) {
      return console.error("创建登录会话失败:", r), {
        success: !1,
        message: "创建会话失败，服务器错误"
      };
    }
  }
  /**
   * 获取登录会话
   * 根据用户名和账户类型获取会话信息
   *
   * @param username 用户名
   * @param accountType 账户类型
   * @returns 会话数据
   */
  async getSession(e, r) {
    try {
      if (!e || !r)
        return {
          success: !1,
          message: "用户名和账户类型不能为空"
        };
      const s = await this.loginSessionModel.getSession(
        e,
        r
      );
      if (s) {
        const { password: n, ...i } = s;
        return {
          success: !0,
          message: "获取会话成功",
          data: i
        };
      } else
        return {
          success: !1,
          message: "未找到会话信息"
        };
    } catch (s) {
      return console.error("获取登录会话失败:", s), {
        success: !1,
        message: "获取会话失败，服务器错误"
      };
    }
  }
  /**
   * 快速登录
   * 使用保存的加密密码进行快速登录
   *
   * @param username 用户名
   * @param accountType 账户类型
   * @returns 登录结果
   */
  async quickLogin(e, r) {
    try {
      if (!e || !r)
        return {
          success: !1,
          message: "用户名和账户类型不能为空"
        };
      const n = (await this.loginSessionModel.getRememberedSessions()).find(
        (i) => i.username === e && i.accountType === r
      );
      if (!n || !n.password)
        return {
          success: !1,
          message: "未找到保存的登录信息"
        };
      try {
        const i = await this.decryptPassword(
          n.password
        ), { userService: a } = await Promise.resolve().then(() => bf), c = await (await a).login({
          username: e,
          password: i,
          remember: !0
        });
        return c.success ? (await this.loginSessionModel.updateSession(e, r, {
          lastLoginTime: Date.now(),
          isActive: 1
        }), {
          success: !0,
          message: "快速登录成功",
          data: c.data
        }) : (await this.loginSessionModel.updateSession(e, r, {
          password: void 0,
          rememberMe: 0,
          isActive: 0
        }), {
          success: !1,
          message: "保存的密码已失效，请重新登录"
        });
      } catch (i) {
        return console.error("解密密码失败:", i), await this.loginSessionModel.updateSession(e, r, {
          password: void 0,
          rememberMe: 0,
          isActive: 0
        }), {
          success: !1,
          message: "登录信息已损坏，请重新登录"
        };
      }
    } catch (s) {
      return console.error("快速登录失败:", s), {
        success: !1,
        message: "快速登录失败，服务器错误"
      };
    }
  }
  /**
   * 更新会话信息
   * 更新指定用户的会话数据
   *
   * @param username 用户名
   * @param accountType 账户类型
   * @param updates 要更新的字段
   * @returns 操作结果
   */
  async updateSession(e, r, s) {
    try {
      if (!e || !r)
        return {
          success: !1,
          message: "用户名和账户类型不能为空"
        };
      const n = { ...s };
      return typeof n.rememberMe == "boolean" && (n.rememberMe = n.rememberMe ? 1 : 0), typeof n.autoLogin == "boolean" && (n.autoLogin = n.autoLogin ? 1 : 0), typeof n.isActive == "boolean" && (n.isActive = n.isActive ? 1 : 0), s.password && (n.password = await this.encryptPassword(s.password)), n.lastLoginTime = Date.now(), await this.loginSessionModel.updateSession(
        e,
        r,
        n
      ) ? {
        success: !0,
        message: "会话更新成功"
      } : {
        success: !1,
        message: "会话不存在或更新失败"
      };
    } catch (n) {
      return console.error("更新会话失败:", n), {
        success: !1,
        message: "更新会话失败，服务器错误"
      };
    }
  }
  /**
   * 获取记住密码的用户列表
   * 用于登录页面显示历史登录用户
   *
   * @returns 记住密码的用户列表（消除了敏感信息）
   * ```typescript
   * {
   *   success: boolean;      // 操作是否成功
   *   message: string;      // 信息（错误信息 || 成功信息）
   *   data: Array<{
   *     username: string;    // 用户名
   *     accountType: string;  // 账户类型
   *     lastLoginTime: number; // 最后登录时间
   *     autoLogin: boolean;    // 是否启用自动登录
   *  }>;
   * ```
   */
  async getRememberedUsers() {
    try {
      return {
        success: !0,
        message: "获取记住的用户列表成功",
        data: (await this.loginSessionModel.getRememberedSessions()).map((s) => ({
          username: s.username,
          accountType: s.accountType,
          lastLoginTime: s.lastLoginTime,
          autoLogin: !!s.autoLogin
        }))
      };
    } catch (e) {
      return console.error("获取记住的用户失败:", e), {
        success: !1,
        message: "获取用户列表失败"
      };
    }
  }
  /**
   * 验证记住的密码
   * 用于快速登录时验证保存的密码
   *
   * @param username 用户名
   * @param accountType 账户类型
   * @param inputPassword 用户输入的密码
   * @returns 验证结果
   */
  async validateRememberedPassword(e, r, s) {
    try {
      if (!e || !r || !s)
        return {
          success: !1,
          message: "参数不能为空"
        };
      const i = (await this.loginSessionModel.getRememberedSessions()).find(
        (a) => a.username === e && a.accountType === r
      );
      if (!i || !i.password)
        return {
          success: !1,
          message: "未找到保存的密码信息"
        };
      try {
        const a = await this.decryptPassword(
          i.password
        );
        return s === a ? (await this.loginSessionModel.updateSession(e, r, {
          lastLoginTime: Date.now(),
          isActive: 1
        }), {
          success: !0,
          message: "密码验证成功"
        }) : {
          success: !1,
          message: "密码验证失败"
        };
      } catch (a) {
        return console.error("解密密码失败:", a), {
          success: !1,
          message: "密码信息已损坏，请重新登录"
        };
      }
    } catch (n) {
      return console.error("验证记住的密码失败:", n), {
        success: !1,
        message: "密码验证失败，服务器错误"
      };
    }
  }
  /**
   * 获取自动登录信息
   * 应用启动时检查是否有用户设置了自动登录
   *
   * @returns 自动登录信息
   */
  async getAutoLoginInfo() {
    try {
      const e = await this.loginSessionModel.getAutoLoginSession();
      return e ? {
        success: !0,
        message: "找到自动登录信息",
        data: {
          username: e.username,
          accountType: e.accountType,
          lastLoginTime: e.lastLoginTime,
          hasPassword: !!e.password
        }
      } : {
        success: !1,
        message: "未设置自动登录"
      };
    } catch (e) {
      return console.error("获取自动登录信息失败:", e), {
        success: !1,
        message: "获取自动登录信息失败"
      };
    }
  }
  /**
   * 获取当前活跃会话
   * 获取当前登录的用户信息
   *
   * @returns 当前活跃会话信息
   */
  async getCurrentSession() {
    try {
      const e = await this.loginSessionModel.getActiveSession();
      return e ? {
        success: !0,
        message: "获取当前会话成功",
        data: {
          username: e.username,
          accountType: e.accountType,
          lastLoginTime: e.lastLoginTime,
          autoLogin: !!e.autoLogin,
          rememberMe: !!e.rememberMe
        }
      } : {
        success: !1,
        message: "当前无活跃会话"
      };
    } catch (e) {
      return console.error("获取当前会话失败:", e), {
        success: !1,
        message: "获取当前会话失败"
      };
    }
  }
  /**
   * 删除指定用户的会话
   * 用于移除记住的用户信息
   *
   * @param username 用户名
   * @param accountType 账户类型
   * @returns 操作结果
   */
  async removeSession(e, r) {
    try {
      return !e || !r ? {
        success: !1,
        message: "用户名和账户类型不能为空"
      } : await this.loginSessionModel.deleteSession(
        e,
        r
      ) ? {
        success: !0,
        message: "会话删除成功"
      } : {
        success: !1,
        message: "会话不存在或删除失败"
      };
    } catch (s) {
      return console.error("删除会话失败:", s), {
        success: !1,
        message: "删除会话失败，服务器错误"
      };
    }
  }
  /**
   * 用户退出登录
   * 将当前活跃会话设为非活跃状态
   *
   * @param username 用户名
   * @param accountType 账户类型
   * @param keepRemembered 是否保留记住密码信息
   * @returns 操作结果
   */
  async logout(e, r, s = !0) {
    try {
      return !e || !r ? {
        success: !1,
        message: "用户名和账户类型不能为空"
      } : s ? await this.loginSessionModel.updateSession(
        e,
        r,
        {
          isActive: 0,
          autoLogin: 0
          // 退出时取消自动登录
        }
      ) ? {
        success: !0,
        message: "退出登录成功"
      } : {
        success: !1,
        message: "退出登录失败"
      } : await this.removeSession(e, r);
    } catch (n) {
      return console.error("退出登录失败:", n), {
        success: !1,
        message: "退出登录失败，服务器错误"
      };
    }
  }
  /**
   * 清除所有会话数据
   * 清理所有保存的登录信息，用于重置功能
   *
   * @returns 操作结果
   */
  async clearAllSessions() {
    try {
      return await this.loginSessionModel.clearAllSessions() ? {
        success: !0,
        message: "清除所有会话成功"
      } : {
        success: !1,
        message: "清除会话失败"
      };
    } catch (e) {
      return console.error("清除所有会话失败:", e), {
        success: !1,
        message: "清除会话失败，服务器错误"
      };
    }
  }
  /**
   * 获取登录历史记录
   * 获取所有登录会话的历史记录
   *
   * @returns 登录历史列表
   */
  async getLoginHistory() {
    try {
      return {
        success: !0,
        message: "获取登录历史成功",
        data: (await this.loginSessionModel.getAllLoginSessions()).map((s) => ({
          username: s.username,
          accountType: s.accountType,
          lastLoginTime: s.lastLoginTime,
          isActive: !!s.isActive,
          rememberMe: !!s.rememberMe,
          autoLogin: !!s.autoLogin
        }))
      };
    } catch (e) {
      return console.error("获取登录历史失败:", e), {
        success: !1,
        message: "获取登录历史失败"
      };
    }
  }
  /**
   * 生成应用程序密钥
   * 基于应用程序特定信息生成密钥
   *
   * @returns 32字节密钥
   * @private
   */
  generateSecretKey() {
    return ur.scryptSync("DailyUse-App-Secret-Key-2024", "session-salt", this.keyLength).toString("hex");
  }
  /**
   * AES密码加密
   * 使用AES-256-CBC算法对密码进行可逆加密
   *
   * @param password 原始密码
   * @returns 加密后的密码（包含IV）
   * @private
   */
  async encryptPassword(e) {
    try {
      const r = ur.randomBytes(16), s = Buffer.from(this.secretKey, "hex"), n = ur.createCipheriv(this.algorithm, s, r);
      let i = n.update(e, "utf8", "hex");
      return i += n.final("hex"), r.toString("hex") + ":" + i;
    } catch (r) {
      throw console.error("密码加密失败:", r), new Error("密码加密失败");
    }
  }
  /**
   * AES密码解密
   * 解密使用AES-256-CBC算法加密的密码
   *
   * @param encryptedData 加密的密码数据（包含IV）
   * @returns 解密后的原始密码
   * @private
   */
  async decryptPassword(e) {
    try {
      const r = e.split(":");
      if (r.length !== 2)
        throw new Error("加密数据格式错误");
      const s = Buffer.from(r[0], "hex"), n = r[1], i = Buffer.from(this.secretKey, "hex"), a = ur.createDecipheriv(this.algorithm, i, s);
      let o = a.update(n, "hex", "utf8");
      return o += a.final("utf8"), o;
    } catch (r) {
      throw console.error("密码解密失败:", r), new Error("密码解密失败");
    }
  }
};
$(nt, "instance");
let Ps = nt;
const mi = Ps.getInstance();
async function kf() {
  try {
    const t = await mi;
    p.handle(
      "session:saveSession",
      async (e, r) => {
        try {
          const s = await mi, n = await s.getSession(
            r.username,
            r.accountType
          );
          if (n.success && n.data) {
            const i = await s.updateSession(
              r.username,
              r.accountType,
              {
                password: r.password,
                token: r.token,
                rememberMe: r.rememberMe,
                autoLogin: r.autoLogin,
                isActive: !0
              }
            );
            return {
              ...i,
              message: i.success ? "会话更新成功" : i.message
            };
          } else {
            const i = await s.addSession(r);
            return {
              ...i,
              message: i.success ? "会话创建成功" : i.message
            };
          }
        } catch (s) {
          return console.error("IPC: 保存会话异常", s), {
            success: !1,
            message: s instanceof Error ? s.message : "保存会话失败，未知错误"
          };
        }
      }
    ), p.handle(
      "session:quickLogin",
      async (e, r, s) => {
        try {
          return await t.quickLogin(r, s);
        } catch (n) {
          return console.error("IPC: 快速登录异常", n), {
            success: !1,
            message: n instanceof Error ? n.message : "快速登录失败，未知错误"
          };
        }
      }
    ), p.handle(
      "session:create",
      async (e, r) => {
        console.log("IPC: 创建登录会话", {
          username: r.username,
          accountType: r.accountType
        });
        try {
          const s = await t.getSession(
            r.username,
            r.accountType
          );
          if (s.success && s.data) {
            console.log("IPC: 会话已存在，执行更新操作", {
              username: r.username,
              accountType: r.accountType
            });
            const n = await t.updateSession(
              r.username,
              r.accountType,
              {
                password: r.password,
                token: r.token,
                rememberMe: r.rememberMe,
                autoLogin: r.autoLogin,
                isActive: !0
              }
            );
            return {
              ...n,
              message: n.success ? "会话更新成功" : n.message
            };
          } else {
            console.log("IPC: 会话不存在，创建新会话", {
              username: r.username,
              accountType: r.accountType
            });
            const n = await t.addSession(r);
            return {
              ...n,
              message: n.success ? "会话创建成功" : n.message
            };
          }
        } catch (s) {
          return console.error("IPC: 创建会话异常", s), {
            success: !1,
            message: s instanceof Error ? s.message : "创建会话失败，未知错误"
          };
        }
      }
    ), p.handle(
      "session:update",
      async (e, r, s, n) => await t.updateSession(
        r,
        s,
        n
      )
    ), p.handle(
      "session:getRememberedUsers",
      async (e) => await t.getRememberedUsers()
    ), p.handle(
      "session:validatePassword",
      async (e, r, s, n) => await t.validateRememberedPassword(
        r,
        s,
        n
      )
    ), p.handle(
      "session:getAutoLoginInfo",
      async (e) => await t.getAutoLoginInfo()
    ), p.handle(
      "session:getCurrentSession",
      async (e) => await t.getCurrentSession()
    ), p.handle(
      "session:removeSession",
      async (e, r, s) => await t.removeSession(r, s)
    ), p.handle(
      "session:logout",
      async (e, r, s, n = !0) => (console.log("IPC: 用户退出登录", {
        username: r,
        accountType: s,
        keepRemembered: n
      }), await t.logout(
        r,
        s,
        n
      ))
    ), p.handle("session:clearAll", async (e) => await t.clearAllSessions()), p.handle(
      "session:getLoginHistory",
      async (e) => await t.getLoginHistory()
    );
  } catch (t) {
    throw console.error("设置登录会话 IPC 处理器失败:", t), t;
  }
}
const it = class it {
  /**
   * 私有构造函数，确保单例模式
   */
  constructor() {
    $(this, "db", null);
    $(this, "isInitialized", !1);
    $(this, "initPromise", null);
  }
  /**
   * 获取 StoreService 的单例实例
   * @returns StoreService 实例
   */
  static getInstance() {
    return it.instance || (it.instance = new it()), it.instance;
  }
  /**
   * 确保服务已初始化
   */
  async ensureInitialized() {
    if (!this.isInitialized) {
      if (this.initPromise) {
        await this.initPromise;
        return;
      }
      this.initPromise = this.initializeAsync(), await this.initPromise, this.isInitialized = !0;
    }
  }
  /**
   * 异步初始化
   */
  async initializeAsync() {
    try {
      this.db = await wf();
    } catch (e) {
      throw console.error("StoreService 初始化失败:", e), e;
    }
  }
  /**
   * 获取数据库实例
   */
  async getDB() {
    if (await this.ensureInitialized(), !this.db)
      throw new Error("数据库未初始化");
    return this.db;
  }
  /**
   * 读取用户特定的存储数据
   * @param username 用户名
   * @param storeName 存储名称
   * @returns 存储的数据或null
   */
  async readUserStore(e, r) {
    try {
      const i = (await this.getDB()).prepare(`
        SELECT data FROM user_store_data 
        WHERE username = ? AND store_name = ?
      `).get(e, r);
      return i ? {
        success: !0,
        data: JSON.parse(i.data),
        message: "读取数据成功"
      } : {
        success: !0,
        data: null,
        message: "未找到数据"
      };
    } catch (s) {
      return console.error(`读取用户数据失败 (${r}):`, s), {
        success: !1,
        data: null,
        message: `读取数据失败: ${s instanceof Error ? s.message : "未知错误"}`
      };
    }
  }
  /**
   * 写入用户特定的存储数据
   * @param username 用户名
   * @param storeName 存储名称
   * @param data 要存储的数据
   * 通过 IPC 传进来的数据是 JSON 格式的，先将其转换回对象，进行数据处理，再转回 JSON 字符串存储
   */
  async writeUserStore(e, r, s) {
    try {
      console.log(`写入用户数据 (${r})`, { username: e, data: s }, typeof s);
      const n = await this.getDB(), i = n.prepare(`
        INSERT OR REPLACE INTO user_store_data 
        (username, store_name, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `), a = Date.now(), c = n.prepare(`
        SELECT created_at FROM user_store_data 
        WHERE username = ? AND store_name = ?
      `).get(e, r), u = c ? c.created_at : a;
      return i.run(
        e,
        r,
        s,
        u,
        a
      ), {
        success: !0,
        data: void 0,
        message: "写入数据成功"
      };
    } catch (n) {
      return console.error(`写入用户数据失败 (${r}):`, n), {
        success: !1,
        data: void 0,
        message: `写入数据失败: ${n instanceof Error ? n.message : "未知错误"}`
      };
    }
  }
  /**
   * 删除用户特定的存储数据
   * @param username 用户名
   * @param storeName 存储名称
   */
  async deleteUserStore(e, r) {
    try {
      return {
        success: !0,
        data: void 0,
        message: `删除数据成功，影响行数: ${(await this.getDB()).prepare(`
        DELETE FROM user_store_data 
        WHERE username = ? AND store_name = ?
      `).run(e, r).changes}`
      };
    } catch (s) {
      return console.error(`删除用户数据失败 (${r}):`, s), {
        success: !1,
        data: void 0,
        message: `删除数据失败: ${s instanceof Error ? s.message : "未知错误"}`
      };
    }
  }
  /**
   * 获取用户所有存储数据的列表
   * @param username 用户名
   */
  async getUserStoreList(e) {
    try {
      const i = (await this.getDB()).prepare(`
        SELECT store_name FROM user_store_data 
        WHERE username = ?
        ORDER BY store_name
      `).all(e).map((a) => a.store_name);
      return {
        success: !0,
        data: i,
        message: `找到 ${i.length} 个存储`
      };
    } catch (r) {
      return console.error("获取用户存储列表失败:", r), {
        success: !1,
        data: [],
        message: `获取存储列表失败: ${r instanceof Error ? r.message : "未知错误"}`
      };
    }
  }
  /**
   * 导出用户所有数据
   * @param username 用户名
   * @param exportPath 导出文件路径（可选）
   */
  async exportUserData(e, r) {
    try {
      const i = (await this.getDB()).prepare(`
        SELECT store_name, data, created_at, updated_at 
        FROM user_store_data 
        WHERE username = ?
        ORDER BY store_name
      `).all(e), a = {};
      let o = 0;
      for (const u of i)
        try {
          a[u.store_name] = JSON.parse(u.data), o += u.data.length;
        } catch (l) {
          console.warn(`解析存储数据失败 (${u.store_name}):`, l), a[u.store_name] = { _error: "数据解析失败", _rawData: u.data };
        }
      const c = {
        username: e,
        exportTime: Date.now(),
        stores: a,
        metadata: {
          totalStores: Object.keys(a).length,
          dataSize: o
        }
      };
      if (r)
        try {
          await ue.writeFile(r, JSON.stringify(c, null, 2), "utf-8");
        } catch (u) {
          return console.error("写入导出文件失败:", u), {
            success: !1,
            data: c,
            message: `导出数据成功但写入文件失败: ${u instanceof Error ? u.message : "未知错误"}`
          };
        }
      return {
        success: !0,
        data: c,
        message: `导出 ${c.metadata.totalStores} 个存储数据成功`
      };
    } catch (s) {
      return console.error("导出用户数据失败:", s), {
        success: !1,
        data: {},
        message: `导出数据失败: ${s instanceof Error ? s.message : "未知错误"}`
      };
    }
  }
  /**
   * 导入用户数据
   * @param username 用户名
   * @param importData 要导入的数据
   * @param overwrite 是否覆盖现有数据
   */
  async importUserData(e, r, s = !1) {
    try {
      const n = await this.getDB(), i = n.prepare(`
        INSERT OR ${s ? "REPLACE" : "IGNORE"} INTO user_store_data 
        (username, store_name, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      let a = 0, o = 0, c = 0;
      const u = Date.now();
      return n.transaction(() => {
        for (const [f, d] of Object.entries(r.stores))
          try {
            i.run(
              e,
              f,
              JSON.stringify(d),
              u,
              u
            ).changes > 0 ? a++ : o++;
          } catch (h) {
            console.error(`导入存储数据失败 (${f}):`, h), c++;
          }
      })(), {
        success: !0,
        data: { imported: a, skipped: o, errors: c },
        message: `导入完成: ${a} 个成功, ${o} 个跳过, ${c} 个错误`
      };
    } catch (n) {
      return console.error("导入用户数据失败:", n), {
        success: !1,
        data: { imported: 0, skipped: 0, errors: 0 },
        message: `导入数据失败: ${n instanceof Error ? n.message : "未知错误"}`
      };
    }
  }
  /**
   * 删除用户所有数据
   * @param username 用户名
   */
  async clearUserData(e) {
    try {
      const n = (await this.getDB()).prepare("DELETE FROM user_store_data WHERE username = ?").run(e);
      return {
        success: !0,
        data: n.changes,
        message: `删除了 ${n.changes} 条用户数据`
      };
    } catch (r) {
      return console.error("清除用户数据失败:", r), {
        success: !1,
        data: 0,
        message: `清除数据失败: ${r instanceof Error ? r.message : "未知错误"}`
      };
    }
  }
  /**
   * 获取用户数据统计信息
   * @param username 用户名
   */
  async getUserDataStats(e) {
    try {
      const n = (await this.getDB()).prepare(`
        SELECT store_name, LENGTH(data) as size, created_at, updated_at
        FROM user_store_data 
        WHERE username = ?
        ORDER BY updated_at DESC
      `).all(e), i = n.reduce((c, u) => c + u.size, 0), a = n.length > 0 ? n[0].updated_at : null, o = n.map((c) => ({
        storeName: c.store_name,
        size: c.size,
        createdAt: c.created_at,
        updatedAt: c.updated_at
      }));
      return {
        success: !0,
        data: {
          totalStores: n.length,
          totalSize: i,
          lastUpdated: a,
          storeDetails: o
        },
        message: "获取统计信息成功"
      };
    } catch (r) {
      return console.error("获取用户数据统计失败:", r), {
        success: !1,
        data: {
          totalStores: 0,
          totalSize: 0,
          lastUpdated: null,
          storeDetails: []
        },
        message: `获取统计信息失败: ${r instanceof Error ? r.message : "未知错误"}`
      };
    }
  }
  /**
   * 检查存储是否存在
   * @param username 用户名
   * @param storeName 存储名称
   */
  async hasUserStore(e, r) {
    try {
      const i = (await this.getDB()).prepare(`
        SELECT 1 FROM user_store_data 
        WHERE username = ? AND store_name = ?
      `).get(e, r);
      return {
        success: !0,
        data: !!i,
        message: i ? "存储存在" : "存储不存在"
      };
    } catch (s) {
      return console.error("检查存储存在性失败:", s), {
        success: !1,
        data: !1,
        message: `检查失败: ${s instanceof Error ? s.message : "未知错误"}`
      };
    }
  }
};
// 单例实例
$(it, "instance");
let Ws = it;
const Ee = Ws.getInstance();
class Sf {
  /**
   * 注册所有 Store 相关的 IPC 处理程序
   */
  static registerHandlers() {
    p.handle("store:read", this.handleReadUserStore.bind(this)), p.handle("store:write", this.handleWriteUserStore.bind(this)), p.handle("store:delete", this.handleDeleteUserStore.bind(this)), p.handle("store:has", this.handleHasUserStore.bind(this)), p.handle("store:list", this.handleGetUserStoreList.bind(this)), p.handle("store:clear", this.handleClearUserData.bind(this)), p.handle("store:stats", this.handleGetUserDataStats.bind(this)), p.handle("store:export", this.handleExportUserData.bind(this)), p.handle("store:export-to-file", this.handleExportUserDataToFile.bind(this)), p.handle("store:import", this.handleImportUserData.bind(this)), p.handle("store:import-from-file", this.handleImportUserDataFromFile.bind(this));
  }
  /**
   * 移除所有 Store 相关的 IPC 处理程序
   */
  static removeHandlers() {
    [
      "store:read",
      "store:write",
      "store:delete",
      "store:has",
      "store:list",
      "store:clear",
      "store:stats",
      "store:export",
      "store:export-to-file",
      "store:import",
      "store:import-from-file"
    ].forEach((r) => {
      p.removeAllListeners(r);
    });
  }
  /**
   * 读取用户存储数据
   */
  static async handleReadUserStore(e, r, s) {
    try {
      return await Ee.readUserStore(r, s);
    } catch (n) {
      return console.error("IPC: 读取用户存储数据失败:", n), {
        success: !1,
        data: null,
        message: `读取失败: ${n instanceof Error ? n.message : "未知错误"}`
      };
    }
  }
  /**
   * 写入用户存储数据
   */
  static async handleWriteUserStore(e, r, s, n) {
    try {
      return await Ee.writeUserStore(r, s, n);
    } catch (i) {
      return console.error("IPC: 写入用户存储数据失败:", i), {
        success: !1,
        data: void 0,
        message: `写入失败: ${i instanceof Error ? i.message : "未知错误"}`
      };
    }
  }
  /**
   * 删除用户存储数据
   */
  static async handleDeleteUserStore(e, r, s) {
    try {
      return await Ee.deleteUserStore(r, s);
    } catch (n) {
      return console.error("IPC: 删除用户存储数据失败:", n), {
        success: !1,
        data: void 0,
        message: `删除失败: ${n instanceof Error ? n.message : "未知错误"}`
      };
    }
  }
  /**
   * 检查用户存储数据是否存在
   */
  static async handleHasUserStore(e, r, s) {
    try {
      return await Ee.hasUserStore(r, s);
    } catch (n) {
      return console.error("IPC: 检查用户存储数据失败:", n), {
        success: !1,
        data: !1,
        message: `检查失败: ${n instanceof Error ? n.message : "未知错误"}`
      };
    }
  }
  /**
   * 获取用户所有存储数据列表
   */
  static async handleGetUserStoreList(e, r) {
    try {
      return await Ee.getUserStoreList(r);
    } catch (s) {
      return console.error("IPC: 获取用户存储列表失败:", s), {
        success: !1,
        data: [],
        message: `获取列表失败: ${s instanceof Error ? s.message : "未知错误"}`
      };
    }
  }
  /**
   * 清除用户所有数据
   */
  static async handleClearUserData(e, r) {
    try {
      return await Ee.clearUserData(r);
    } catch (s) {
      return console.error("IPC: 清除用户数据失败:", s), {
        success: !1,
        data: 0,
        message: `清除失败: ${s instanceof Error ? s.message : "未知错误"}`
      };
    }
  }
  /**
   * 获取用户数据统计信息
   */
  static async handleGetUserDataStats(e, r) {
    try {
      return await Ee.getUserDataStats(r);
    } catch (s) {
      return console.error("IPC: 获取用户数据统计失败:", s), {
        success: !1,
        data: {
          totalStores: 0,
          totalSize: 0,
          lastUpdated: null,
          storeDetails: []
        },
        message: `获取统计失败: ${s instanceof Error ? s.message : "未知错误"}`
      };
    }
  }
  /**
   * 导出用户数据（仅返回数据，不写入文件）
   */
  static async handleExportUserData(e, r) {
    try {
      return await Ee.exportUserData(r);
    } catch (s) {
      return console.error("IPC: 导出用户数据失败:", s), {
        success: !1,
        data: {},
        message: `导出失败: ${s instanceof Error ? s.message : "未知错误"}`
      };
    }
  }
  /**
   * 导出用户数据到文件（显示保存对话框）
   */
  static async handleExportUserDataToFile(e, r) {
    try {
      const { canceled: s, filePath: n } = await jt.showSaveDialog({
        title: "导出用户数据",
        defaultPath: `${r}_data_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`,
        filters: [
          { name: "JSON 文件", extensions: ["json"] },
          { name: "所有文件", extensions: ["*"] }
        ]
      });
      return s || !n ? {
        success: !1,
        data: {},
        message: "用户取消了导出操作"
      } : await Ee.exportUserData(r, n);
    } catch (s) {
      return console.error("IPC: 导出用户数据到文件失败:", s), {
        success: !1,
        data: {},
        message: `导出失败: ${s instanceof Error ? s.message : "未知错误"}`
      };
    }
  }
  /**
   * 导入用户数据
   */
  static async handleImportUserData(e, r, s, n = !1) {
    try {
      return await Ee.importUserData(r, s, n);
    } catch (i) {
      return console.error("IPC: 导入用户数据失败:", i), {
        success: !1,
        data: { imported: 0, skipped: 0, errors: 0 },
        message: `导入失败: ${i instanceof Error ? i.message : "未知错误"}`
      };
    }
  }
  /**
   * 从文件导入用户数据（显示打开对话框）
   */
  static async handleImportUserDataFromFile(e, r, s = !1) {
    try {
      const { canceled: n, filePaths: i } = await jt.showOpenDialog({
        title: "选择导入文件",
        filters: [
          { name: "JSON 文件", extensions: ["json"] },
          { name: "所有文件", extensions: ["*"] }
        ],
        properties: ["openFile"]
      });
      if (n || i.length === 0)
        return {
          success: !1,
          data: { imported: 0, skipped: 0, errors: 0 },
          message: "用户取消了导入操作"
        };
      const a = i[0], c = await (await import("fs/promises")).readFile(a, "utf-8"), u = JSON.parse(c);
      return !u.username || !u.stores ? {
        success: !1,
        data: { imported: 0, skipped: 0, errors: 0 },
        message: "无效的数据格式"
      } : await Ee.importUserData(r, u, s);
    } catch (n) {
      return console.error("IPC: 从文件导入用户数据失败:", n), {
        success: !1,
        data: { imported: 0, skipped: 0, errors: 0 },
        message: `导入失败: ${n instanceof Error ? n.message : "未知错误"}`
      };
    }
  }
}
function Of() {
  p.handle("open-file-explorer", async () => {
    at.openPath(Ae.join(__dirname, "..", "..", "..", "src"));
  }), p.handle("open-file-in-explorer", async (e, r) => {
    try {
      if (await ue.access(r).then(() => !0).catch(() => !1))
        at.showItemInFolder(r);
      else
        throw new Error(`File does not exist: ${r}`);
    } catch (s) {
      throw console.error("Error opening file in explorer:", s), s;
    }
  }), p.handle("read-folder", async (e, r) => {
    try {
      return (await ue.readdir(r, { withFileTypes: !0 })).map((n) => ({
        name: n.name,
        path: Ae.join(r, n.name),
        isDirectory: n.isDirectory(),
        key: Ae.join(r, n.name)
      }));
    } catch (s) {
      throw console.error("Error reading folder:", s), s;
    }
  }), p.handle("select-folder", async () => {
    const e = await jt.showOpenDialog({
      properties: ["openDirectory"]
    });
    if (e.canceled)
      return {
        success: !1,
        message: "Folder selected canceled",
        data: null
      };
    {
      const r = e.filePaths[0], s = await ue.readdir(r).then(
        (n) => Promise.all(
          n.map(async (i) => {
            const a = Ae.join(r, i), o = await ue.lstat(a);
            return {
              name: i,
              path: a,
              isDirectory: o.isDirectory()
            };
          })
        )
      );
      return {
        success: !0,
        message: "Folder selected successfully",
        data: { folderPath: r, files: s }
      };
    }
  }), p.handle("file-or-folder-exists", async (e, r) => {
    try {
      return await ue.access(r), !0;
    } catch {
      return !1;
    }
  }), p.handle("create-folder", async (e, r) => {
    await ue.mkdir(r, { recursive: !0 });
  }), p.handle("create-file", async (e, r, s = "") => {
    await ue.writeFile(r, s, "utf8");
  }), p.handle("rename-file-or-folder", async (e, r, s) => {
    try {
      if (await ue.access(s).then(() => !0).catch(() => !1)) {
        const { response: i } = await jt.showMessageBox({
          type: "question",
          buttons: ["覆盖", "取消"],
          defaultId: 1,
          title: "确认覆盖",
          message: "目标已存在，是否覆盖？",
          detail: `目标路径: ${s}`
        });
        if (i === 1)
          return !1;
      }
      return await ue.rename(r, s), !0;
    } catch (n) {
      throw console.error("Rename error:", n), n;
    }
  }), p.handle("delete-file-or-folder", async (e, r, s) => {
    s ? await at.trashItem(r) : await at.trashItem(r);
  }), p.handle("read-file", async (e, r, s = "utf-8") => {
    try {
      return await ue.readFile(r, s);
    } catch (n) {
      throw console.error("读取文件失败:", n), n;
    }
  }), p.handle("write-file", async (e, r, s, n) => {
    try {
      const i = {
        encoding: n ?? (typeof s == "string" ? "utf-8" : null),
        flag: "w"
      };
      await ue.writeFile(r, s, i);
    } catch (i) {
      throw console.error("写入文件失败:", i), i;
    }
  }), p.handle("get-folder-tree", async (e, r) => await t(r));
  async function t(e) {
    try {
      const r = await ue.readdir(e, { withFileTypes: !0 });
      return (await Promise.all(
        r.map(async (n) => {
          const i = Ae.join(e, n.name), a = n.isDirectory() ? "directory" : Ae.extname(n.name).slice(1) || "file";
          return n.isDirectory() ? {
            title: n.name,
            key: i,
            fileType: a,
            children: await t(i)
          } : {
            title: n.name,
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
  p.handle("refresh-folder", async (e, r) => ({
    success: !0,
    message: "Folder refreshed successfully",
    data: {
      folderTreeData: await t(r),
      folderPath: r
    }
  })), p.handle("arrayBuffer-to-buffer", async (e, r) => rf.from(r));
}
var gi = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Ga(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
var Us = {}, Ba = {}, $s = { exports: {} }, dr = { exports: {} }, cs, pi;
function If() {
  if (pi) return cs;
  pi = 1;
  var t = 1e3, e = t * 60, r = e * 60, s = r * 24, n = s * 7, i = s * 365.25;
  cs = function(l, f) {
    f = f || {};
    var d = typeof l;
    if (d === "string" && l.length > 0)
      return a(l);
    if (d === "number" && isFinite(l))
      return f.long ? c(l) : o(l);
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
        var d = parseFloat(f[1]), h = (f[2] || "ms").toLowerCase();
        switch (h) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return d * i;
          case "weeks":
          case "week":
          case "w":
            return d * n;
          case "days":
          case "day":
          case "d":
            return d * s;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return d * r;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return d * e;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return d * t;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return d;
          default:
            return;
        }
      }
    }
  }
  function o(l) {
    var f = Math.abs(l);
    return f >= s ? Math.round(l / s) + "d" : f >= r ? Math.round(l / r) + "h" : f >= e ? Math.round(l / e) + "m" : f >= t ? Math.round(l / t) + "s" : l + "ms";
  }
  function c(l) {
    var f = Math.abs(l);
    return f >= s ? u(l, f, s, "day") : f >= r ? u(l, f, r, "hour") : f >= e ? u(l, f, e, "minute") : f >= t ? u(l, f, t, "second") : l + " ms";
  }
  function u(l, f, d, h) {
    var m = f >= d * 1.5;
    return Math.round(l / d) + " " + h + (m ? "s" : "");
  }
  return cs;
}
var us, yi;
function qa() {
  if (yi) return us;
  yi = 1;
  function t(e) {
    s.debug = s, s.default = s, s.coerce = u, s.disable = o, s.enable = i, s.enabled = c, s.humanize = If(), s.destroy = l, Object.keys(e).forEach((f) => {
      s[f] = e[f];
    }), s.names = [], s.skips = [], s.formatters = {};
    function r(f) {
      let d = 0;
      for (let h = 0; h < f.length; h++)
        d = (d << 5) - d + f.charCodeAt(h), d |= 0;
      return s.colors[Math.abs(d) % s.colors.length];
    }
    s.selectColor = r;
    function s(f) {
      let d, h = null, m, T;
      function S(..._) {
        if (!S.enabled)
          return;
        const M = S, U = Number(/* @__PURE__ */ new Date()), re = U - (d || U);
        M.diff = re, M.prev = d, M.curr = U, d = U, _[0] = s.coerce(_[0]), typeof _[0] != "string" && _.unshift("%O");
        let K = 0;
        _[0] = _[0].replace(/%([a-zA-Z%])/g, (Ke, xt) => {
          if (Ke === "%%")
            return "%";
          K++;
          const De = s.formatters[xt];
          if (typeof De == "function") {
            const Fe = _[K];
            Ke = De.call(M, Fe), _.splice(K, 1), K--;
          }
          return Ke;
        }), s.formatArgs.call(M, _), (M.log || s.log).apply(M, _);
      }
      return S.namespace = f, S.useColors = s.useColors(), S.color = s.selectColor(f), S.extend = n, S.destroy = s.destroy, Object.defineProperty(S, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => h !== null ? h : (m !== s.namespaces && (m = s.namespaces, T = s.enabled(f)), T),
        set: (_) => {
          h = _;
        }
      }), typeof s.init == "function" && s.init(S), S;
    }
    function n(f, d) {
      const h = s(this.namespace + (typeof d > "u" ? ":" : d) + f);
      return h.log = this.log, h;
    }
    function i(f) {
      s.save(f), s.namespaces = f, s.names = [], s.skips = [];
      const d = (typeof f == "string" ? f : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const h of d)
        h[0] === "-" ? s.skips.push(h.slice(1)) : s.names.push(h);
    }
    function a(f, d) {
      let h = 0, m = 0, T = -1, S = 0;
      for (; h < f.length; )
        if (m < d.length && (d[m] === f[h] || d[m] === "*"))
          d[m] === "*" ? (T = m, S = h, m++) : (h++, m++);
        else if (T !== -1)
          m = T + 1, S++, h = S;
        else
          return !1;
      for (; m < d.length && d[m] === "*"; )
        m++;
      return m === d.length;
    }
    function o() {
      const f = [
        ...s.names,
        ...s.skips.map((d) => "-" + d)
      ].join(",");
      return s.enable(""), f;
    }
    function c(f) {
      for (const d of s.skips)
        if (a(f, d))
          return !1;
      for (const d of s.names)
        if (a(f, d))
          return !0;
      return !1;
    }
    function u(f) {
      return f instanceof Error ? f.stack || f.message : f;
    }
    function l() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    return s.enable(s.load()), s;
  }
  return us = t, us;
}
var wi;
function Cf() {
  return wi || (wi = 1, function(t, e) {
    e.formatArgs = s, e.save = n, e.load = i, e.useColors = r, e.storage = a(), e.destroy = /* @__PURE__ */ (() => {
      let c = !1;
      return () => {
        c || (c = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
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
      let c;
      return typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator < "u" && navigator.userAgent && (c = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(c[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function s(c) {
      if (c[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + c[0] + (this.useColors ? "%c " : " ") + "+" + t.exports.humanize(this.diff), !this.useColors)
        return;
      const u = "color: " + this.color;
      c.splice(1, 0, u, "color: inherit");
      let l = 0, f = 0;
      c[0].replace(/%[a-zA-Z%]/g, (d) => {
        d !== "%%" && (l++, d === "%c" && (f = l));
      }), c.splice(f, 0, u);
    }
    e.log = console.debug || console.log || (() => {
    });
    function n(c) {
      try {
        c ? e.storage.setItem("debug", c) : e.storage.removeItem("debug");
      } catch {
      }
    }
    function i() {
      let c;
      try {
        c = e.storage.getItem("debug") || e.storage.getItem("DEBUG");
      } catch {
      }
      return !c && typeof process < "u" && "env" in process && (c = process.env.DEBUG), c;
    }
    function a() {
      try {
        return localStorage;
      } catch {
      }
    }
    t.exports = qa()(e);
    const { formatters: o } = t.exports;
    o.j = function(c) {
      try {
        return JSON.stringify(c);
      } catch (u) {
        return "[UnexpectedJSONParseError]: " + u.message;
      }
    };
  }(dr, dr.exports)), dr.exports;
}
var hr = { exports: {} }, ls, vi;
function Df() {
  return vi || (vi = 1, ls = (t, e = process.argv) => {
    const r = t.startsWith("-") ? "" : t.length === 1 ? "-" : "--", s = e.indexOf(r + t), n = e.indexOf("--");
    return s !== -1 && (n === -1 || s < n);
  }), ls;
}
var fs, _i;
function Rf() {
  if (_i) return fs;
  _i = 1;
  const t = uf, e = Va, r = Df(), { env: s } = process;
  let n;
  r("no-color") || r("no-colors") || r("color=false") || r("color=never") ? n = 0 : (r("color") || r("colors") || r("color=true") || r("color=always")) && (n = 1), "FORCE_COLOR" in s && (s.FORCE_COLOR === "true" ? n = 1 : s.FORCE_COLOR === "false" ? n = 0 : n = s.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(s.FORCE_COLOR, 10), 3));
  function i(c) {
    return c === 0 ? !1 : {
      level: c,
      hasBasic: !0,
      has256: c >= 2,
      has16m: c >= 3
    };
  }
  function a(c, u) {
    if (n === 0)
      return 0;
    if (r("color=16m") || r("color=full") || r("color=truecolor"))
      return 3;
    if (r("color=256"))
      return 2;
    if (c && !u && n === void 0)
      return 0;
    const l = n || 0;
    if (s.TERM === "dumb")
      return l;
    if (process.platform === "win32") {
      const f = t.release().split(".");
      return Number(f[0]) >= 10 && Number(f[2]) >= 10586 ? Number(f[2]) >= 14931 ? 3 : 2 : 1;
    }
    if ("CI" in s)
      return ["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE"].some((f) => f in s) || s.CI_NAME === "codeship" ? 1 : l;
    if ("TEAMCITY_VERSION" in s)
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(s.TEAMCITY_VERSION) ? 1 : 0;
    if (s.COLORTERM === "truecolor")
      return 3;
    if ("TERM_PROGRAM" in s) {
      const f = parseInt((s.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (s.TERM_PROGRAM) {
        case "iTerm.app":
          return f >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    return /-256(color)?$/i.test(s.TERM) ? 2 : /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(s.TERM) || "COLORTERM" in s ? 1 : l;
  }
  function o(c) {
    const u = a(c, c && c.isTTY);
    return i(u);
  }
  return fs = {
    supportsColor: o,
    stdout: i(a(!0, e.isatty(1))),
    stderr: i(a(!0, e.isatty(2)))
  }, fs;
}
var Ti;
function Mf() {
  return Ti || (Ti = 1, function(t, e) {
    const r = Va, s = cf;
    e.init = l, e.log = o, e.formatArgs = i, e.save = c, e.load = u, e.useColors = n, e.destroy = s.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    ), e.colors = [6, 2, 3, 4, 5, 1];
    try {
      const d = Rf();
      d && (d.stderr || d).level >= 2 && (e.colors = [
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
    e.inspectOpts = Object.keys(process.env).filter((d) => /^debug_/i.test(d)).reduce((d, h) => {
      const m = h.substring(6).toLowerCase().replace(/_([a-z])/g, (S, _) => _.toUpperCase());
      let T = process.env[h];
      return /^(yes|on|true|enabled)$/i.test(T) ? T = !0 : /^(no|off|false|disabled)$/i.test(T) ? T = !1 : T === "null" ? T = null : T = Number(T), d[m] = T, d;
    }, {});
    function n() {
      return "colors" in e.inspectOpts ? !!e.inspectOpts.colors : r.isatty(process.stderr.fd);
    }
    function i(d) {
      const { namespace: h, useColors: m } = this;
      if (m) {
        const T = this.color, S = "\x1B[3" + (T < 8 ? T : "8;5;" + T), _ = `  ${S};1m${h} \x1B[0m`;
        d[0] = _ + d[0].split(`
`).join(`
` + _), d.push(S + "m+" + t.exports.humanize(this.diff) + "\x1B[0m");
      } else
        d[0] = a() + h + " " + d[0];
    }
    function a() {
      return e.inspectOpts.hideDate ? "" : (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function o(...d) {
      return process.stderr.write(s.formatWithOptions(e.inspectOpts, ...d) + `
`);
    }
    function c(d) {
      d ? process.env.DEBUG = d : delete process.env.DEBUG;
    }
    function u() {
      return process.env.DEBUG;
    }
    function l(d) {
      d.inspectOpts = {};
      const h = Object.keys(e.inspectOpts);
      for (let m = 0; m < h.length; m++)
        d.inspectOpts[h[m]] = e.inspectOpts[h[m]];
    }
    t.exports = qa()(e);
    const { formatters: f } = t.exports;
    f.o = function(d) {
      return this.inspectOpts.colors = this.useColors, s.inspect(d, this.inspectOpts).split(`
`).map((h) => h.trim()).join(" ");
    }, f.O = function(d) {
      return this.inspectOpts.colors = this.useColors, s.inspect(d, this.inspectOpts);
    };
  }(hr, hr.exports)), hr.exports;
}
typeof process > "u" || process.type === "renderer" || process.browser === !0 || process.__nwjs ? $s.exports = Cf() : $s.exports = Mf();
var Ya = $s.exports;
const zs = /* @__PURE__ */ Ga(Ya);
(function(t) {
  var e = gi && gi.__importDefault || function(o) {
    return o && o.__esModule ? o : { default: o };
  };
  Object.defineProperty(t, "__esModule", { value: !0 });
  const r = za, n = e(Ya).default("@kwsites/file-exists");
  function i(o, c, u) {
    n("checking %s", o);
    try {
      const l = r.statSync(o);
      return l.isFile() && c ? (n("[OK] path represents a file"), !0) : l.isDirectory() && u ? (n("[OK] path represents a directory"), !0) : (n("[FAIL] path represents something other than a file or directory"), !1);
    } catch (l) {
      if (l.code === "ENOENT")
        return n("[FAIL] path is not accessible: %o", l), !1;
      throw n("[FATAL] %o", l), l;
    }
  }
  function a(o, c = t.READABLE) {
    return i(o, (c & t.FILE) > 0, (c & t.FOLDER) > 0);
  }
  t.exists = a, t.FILE = 1, t.FOLDER = 2, t.READABLE = t.FILE + t.FOLDER;
})(Ba);
(function(t) {
  function e(r) {
    for (var s in r) t.hasOwnProperty(s) || (t[s] = r[s]);
  }
  Object.defineProperty(t, "__esModule", { value: !0 }), e(Ba);
})(Us);
var bt = {};
Object.defineProperty(bt, "__esModule", { value: !0 });
var Za = bt.createDeferred = yt = bt.deferred = void 0;
function _n() {
  let t, e, r = "pending";
  return {
    promise: new Promise((n, i) => {
      t = n, e = i;
    }),
    done(n) {
      r === "pending" && (r = "resolved", t(n));
    },
    fail(n) {
      r === "pending" && (r = "rejected", e(n));
    },
    get fulfilled() {
      return r !== "pending";
    },
    get status() {
      return r;
    }
  };
}
var yt = bt.deferred = _n;
Za = bt.createDeferred = _n;
bt.default = _n;
var Tn = Object.defineProperty, Nf = Object.getOwnPropertyDescriptor, bn = Object.getOwnPropertyNames, xf = Object.prototype.hasOwnProperty, y = (t, e) => function() {
  return t && (e = (0, t[bn(t)[0]])(t = 0)), e;
}, Ff = (t, e) => function() {
  return e || (0, t[bn(t)[0]])((e = { exports: {} }).exports, e), e.exports;
}, q = (t, e) => {
  for (var r in e)
    Tn(t, r, { get: e[r], enumerable: !0 });
}, Lf = (t, e, r, s) => {
  if (e && typeof e == "object" || typeof e == "function")
    for (let n of bn(e))
      !xf.call(t, n) && n !== r && Tn(t, n, { get: () => e[n], enumerable: !(s = Nf(e, n)) || s.enumerable });
  return t;
}, j = (t) => Lf(Tn({}, "__esModule", { value: !0 }), t);
function Af(...t) {
  const e = new String(t);
  return jr.set(e, t), e;
}
function Nr(t) {
  return t instanceof String && jr.has(t);
}
function bi(t) {
  return jr.get(t) || [];
}
var jr, Zt = y({
  "src/lib/args/pathspec.ts"() {
    jr = /* @__PURE__ */ new WeakMap();
  }
}), Ue, Je = y({
  "src/lib/errors/git-error.ts"() {
    Ue = class extends Error {
      constructor(t, e) {
        super(e), this.task = t, Object.setPrototypeOf(this, new.target.prototype);
      }
    };
  }
}), Jt, Ot = y({
  "src/lib/errors/git-response-error.ts"() {
    Je(), Jt = class extends Ue {
      constructor(t, e) {
        super(void 0, e || String(t)), this.git = t;
      }
    };
  }
}), Ja, Ka = y({
  "src/lib/errors/task-configuration-error.ts"() {
    Je(), Ja = class extends Ue {
      constructor(t) {
        super(void 0, t);
      }
    };
  }
});
function Xa(t) {
  return typeof t != "function" ? dt : t;
}
function Qa(t) {
  return typeof t == "function" && t !== dt;
}
function eo(t, e) {
  const r = t.indexOf(e);
  return r <= 0 ? [t, ""] : [t.substr(0, r), t.substr(r + 1)];
}
function to(t, e = 0) {
  return ro(t) && t.length > e ? t[e] : void 0;
}
function ft(t, e = 0) {
  if (ro(t) && t.length > e)
    return t[t.length - 1 - e];
}
function ro(t) {
  return !!(t && typeof t.length == "number");
}
function Kt(t = "", e = !0, r = `
`) {
  return t.split(r).reduce((s, n) => {
    const i = e ? n.trim() : n;
    return i && s.push(i), s;
  }, []);
}
function En(t, e) {
  return Kt(t, !0).map((r) => e(r));
}
function kn(t) {
  return Us.exists(t, Us.FOLDER);
}
function x(t, e) {
  return Array.isArray(t) ? t.includes(e) || t.push(e) : t.add(e), e;
}
function so(t, e) {
  return Array.isArray(t) && !t.includes(e) && t.push(e), t;
}
function Hr(t, e) {
  if (Array.isArray(t)) {
    const r = t.indexOf(e);
    r >= 0 && t.splice(r, 1);
  } else
    t.delete(e);
  return e;
}
function Me(t) {
  return Array.isArray(t) ? t : [t];
}
function no(t) {
  return t.replace(/[\s-]+(.)/g, (e, r) => r.toUpperCase());
}
function io(t) {
  return Me(t).map(String);
}
function W(t, e = 0) {
  if (t == null)
    return e;
  const r = parseInt(t, 10);
  return isNaN(r) ? e : r;
}
function Gt(t, e) {
  const r = [];
  for (let s = 0, n = t.length; s < n; s++)
    r.push(e, t[s]);
  return r;
}
function Bt(t) {
  return (Array.isArray(t) ? sf.concat(t) : t).toString("utf-8");
}
function ao(t, e) {
  return Object.assign(
    {},
    ...e.map((r) => r in t ? { [r]: t[r] } : {})
  );
}
function Vs(t = 0) {
  return new Promise((e) => setTimeout(e, t));
}
function js(t) {
  if (t !== !1)
    return t;
}
var Et, dt, Xt, Gr = y({
  "src/lib/utils/util.ts"() {
    Et = "\0", dt = () => {
    }, Xt = Object.prototype.toString.call.bind(Object.prototype.toString);
  }
});
function Ne(t, e, r) {
  return e(t) ? t : arguments.length > 2 ? r : void 0;
}
function Hs(t, e) {
  const r = Nr(t) ? "string" : typeof t;
  return /number|string|boolean/.test(r) && (!e || !e.includes(r));
}
function Br(t) {
  return !!t && Xt(t) === "[object Object]";
}
function oo(t) {
  return typeof t == "function";
}
var Qt, ee, co, xr, Sn, uo = y({
  "src/lib/utils/argument-filters.ts"() {
    Gr(), Zt(), Qt = (t) => Array.isArray(t), ee = (t) => typeof t == "string", co = (t) => Array.isArray(t) && t.every(ee), xr = (t) => ee(t) || Array.isArray(t) && t.every(ee), Sn = (t) => t == null || "number|boolean|function".includes(typeof t) ? !1 : Array.isArray(t) || typeof t == "string" || typeof t.length == "number";
  }
}), Gs, Pf = y({
  "src/lib/utils/exit-codes.ts"() {
    Gs = /* @__PURE__ */ ((t) => (t[t.SUCCESS = 0] = "SUCCESS", t[t.ERROR = 1] = "ERROR", t[t.NOT_FOUND = -2] = "NOT_FOUND", t[t.UNCLEAN = 128] = "UNCLEAN", t))(Gs || {});
  }
}), Fr, Wf = y({
  "src/lib/utils/git-output-streams.ts"() {
    Fr = class lo {
      constructor(e, r) {
        this.stdOut = e, this.stdErr = r;
      }
      asStrings() {
        return new lo(this.stdOut.toString("utf8"), this.stdErr.toString("utf8"));
      }
    };
  }
}), R, Be, Uf = y({
  "src/lib/utils/line-parser.ts"() {
    R = class {
      constructor(t, e) {
        this.matches = [], this.parse = (r, s) => (this.resetMatches(), this._regExp.every((n, i) => this.addMatch(n, i, r(i))) ? this.useMatches(s, this.prepareMatches()) !== !1 : !1), this._regExp = Array.isArray(t) ? t : [t], e && (this.useMatches = e);
      }
      // @ts-ignore
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
        const s = r && t.exec(r);
        return s && this.pushMatch(e, s), !!s;
      }
      pushMatch(t, e) {
        this.matches.push(...e.slice(1));
      }
    }, Be = class extends R {
      addMatch(t, e, r) {
        return /^remote:\s/.test(String(r)) && super.addMatch(t, e, r);
      }
      pushMatch(t, e) {
        (t > 0 || e.length > 1) && super.pushMatch(t, e);
      }
    };
  }
});
function fo(...t) {
  const e = process.cwd(), r = Object.assign(
    { baseDir: e, ...ho },
    ...t.filter((s) => typeof s == "object" && s)
  );
  return r.baseDir = r.baseDir || e, r.trimmed = r.trimmed === !0, r;
}
var ho, $f = y({
  "src/lib/utils/simple-git-options.ts"() {
    ho = {
      binary: "git",
      maxConcurrentProcesses: 5,
      config: [],
      trimmed: !1
    };
  }
});
function On(t, e = []) {
  return Br(t) ? Object.keys(t).reduce((r, s) => {
    const n = t[s];
    if (Nr(n))
      r.push(n);
    else if (Hs(n, ["boolean"]))
      r.push(s + "=" + n);
    else if (Array.isArray(n))
      for (const i of n)
        Hs(i, ["string", "number"]) || r.push(s + "=" + i);
    else
      r.push(s);
    return r;
  }, e) : e;
}
function ae(t, e = 0, r = !1) {
  const s = [];
  for (let n = 0, i = e < 0 ? t.length : e; n < i; n++)
    "string|number".includes(typeof t[n]) && s.push(String(t[n]));
  return On(In(t), s), r || s.push(...zf(t)), s;
}
function zf(t) {
  const e = typeof ft(t) == "function";
  return Ne(ft(t, e ? 1 : 0), Qt, []);
}
function In(t) {
  const e = oo(ft(t));
  return Ne(ft(t, e ? 1 : 0), Br);
}
function G(t, e = !0) {
  const r = Xa(ft(t));
  return e || Qa(r) ? r : void 0;
}
var Vf = y({
  "src/lib/utils/task-options.ts"() {
    uo(), Gr(), Zt();
  }
});
function Bs(t, e) {
  return t(e.stdOut, e.stdErr);
}
function ce(t, e, r, s = !0) {
  return Me(r).forEach((n) => {
    for (let i = Kt(n, s), a = 0, o = i.length; a < o; a++) {
      const c = (u = 0) => {
        if (!(a + u >= o))
          return i[a + u];
      };
      e.some(({ parse: u }) => u(c, t));
    }
  }), t;
}
var jf = y({
  "src/lib/utils/task-parser.ts"() {
    Gr();
  }
}), mo = {};
q(mo, {
  ExitCodes: () => Gs,
  GitOutputStreams: () => Fr,
  LineParser: () => R,
  NOOP: () => dt,
  NULL: () => Et,
  RemoteLineParser: () => Be,
  append: () => x,
  appendTaskOptions: () => On,
  asArray: () => Me,
  asCamelCase: () => no,
  asFunction: () => Xa,
  asNumber: () => W,
  asStringArray: () => io,
  bufferToString: () => Bt,
  callTaskParser: () => Bs,
  createInstanceConfig: () => fo,
  delay: () => Vs,
  filterArray: () => Qt,
  filterFunction: () => oo,
  filterHasLength: () => Sn,
  filterPlainObject: () => Br,
  filterPrimitives: () => Hs,
  filterString: () => ee,
  filterStringArray: () => co,
  filterStringOrStringArray: () => xr,
  filterType: () => Ne,
  first: () => to,
  folderExists: () => kn,
  forEachLineWithContent: () => En,
  getTrailingOptions: () => ae,
  including: () => so,
  isUserFunction: () => Qa,
  last: () => ft,
  objectToString: () => Xt,
  orVoid: () => js,
  parseStringResponse: () => ce,
  pick: () => ao,
  prefixedArray: () => Gt,
  remove: () => Hr,
  splitOn: () => eo,
  toLinesWithContent: () => Kt,
  trailingFunctionArgument: () => G,
  trailingOptionsArgument: () => In
});
var C = y({
  "src/lib/utils/index.ts"() {
    uo(), Pf(), Wf(), Uf(), $f(), Vf(), jf(), Gr();
  }
}), go = {};
q(go, {
  CheckRepoActions: () => qs,
  checkIsBareRepoTask: () => yo,
  checkIsRepoRootTask: () => po,
  checkIsRepoTask: () => Hf
});
function Hf(t) {
  switch (t) {
    case "bare":
      return yo();
    case "root":
      return po();
  }
  return {
    commands: ["rev-parse", "--is-inside-work-tree"],
    format: "utf-8",
    onError: qr,
    parser: Cn
  };
}
function po() {
  return {
    commands: ["rev-parse", "--git-dir"],
    format: "utf-8",
    onError: qr,
    parser(e) {
      return /^\.(git)?$/.test(e.trim());
    }
  };
}
function yo() {
  return {
    commands: ["rev-parse", "--is-bare-repository"],
    format: "utf-8",
    onError: qr,
    parser: Cn
  };
}
function Gf(t) {
  return /(Not a git repository|Kein Git-Repository)/i.test(String(t));
}
var qs, qr, Cn, wo = y({
  "src/lib/tasks/check-is-repo.ts"() {
    C(), qs = /* @__PURE__ */ ((t) => (t.BARE = "bare", t.IN_TREE = "tree", t.IS_REPO_ROOT = "root", t))(qs || {}), qr = ({ exitCode: t }, e, r, s) => {
      if (t === 128 && Gf(e))
        return r(Buffer.from("false"));
      s(e);
    }, Cn = (t) => t.trim() === "true";
  }
});
function Bf(t, e) {
  const r = new vo(t), s = t ? To : _o;
  return Kt(e).forEach((n) => {
    const i = n.replace(s, "");
    r.paths.push(i), (bo.test(i) ? r.folders : r.files).push(i);
  }), r;
}
var vo, _o, To, bo, qf = y({
  "src/lib/responses/CleanSummary.ts"() {
    C(), vo = class {
      constructor(t) {
        this.dryRun = t, this.paths = [], this.files = [], this.folders = [];
      }
    }, _o = /^[a-z]+\s*/i, To = /^[a-z]+\s+[a-z]+\s*/i, bo = /\/$/;
  }
}), Ys = {};
q(Ys, {
  EMPTY_COMMANDS: () => Yr,
  adhocExecTask: () => Eo,
  configurationErrorTask: () => oe,
  isBufferTask: () => So,
  isEmptyTask: () => Oo,
  straightThroughBufferTask: () => ko,
  straightThroughStringTask: () => ie
});
function Eo(t) {
  return {
    commands: Yr,
    format: "empty",
    parser: t
  };
}
function oe(t) {
  return {
    commands: Yr,
    format: "empty",
    parser() {
      throw typeof t == "string" ? new Ja(t) : t;
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
function ko(t) {
  return {
    commands: t,
    format: "buffer",
    parser(e) {
      return e;
    }
  };
}
function So(t) {
  return t.format === "buffer";
}
function Oo(t) {
  return t.format === "empty" || !t.commands.length;
}
var Yr, B = y({
  "src/lib/tasks/task.ts"() {
    Ka(), Yr = [];
  }
}), Io = {};
q(Io, {
  CONFIG_ERROR_INTERACTIVE_MODE: () => Dn,
  CONFIG_ERROR_MODE_REQUIRED: () => Rn,
  CONFIG_ERROR_UNKNOWN_OPTION: () => Mn,
  CleanOptions: () => br,
  cleanTask: () => Co,
  cleanWithOptionsTask: () => Yf,
  isCleanOptionsArray: () => Zf
});
function Yf(t, e) {
  const { cleanMode: r, options: s, valid: n } = Jf(t);
  return r ? n.options ? (s.push(...e), s.some(Qf) ? oe(Dn) : Co(r, s)) : oe(Mn + JSON.stringify(t)) : oe(Rn);
}
function Co(t, e) {
  return {
    commands: ["clean", `-${t}`, ...e],
    format: "utf-8",
    parser(s) {
      return Bf(t === "n", s);
    }
  };
}
function Zf(t) {
  return Array.isArray(t) && t.every((e) => Nn.has(e));
}
function Jf(t) {
  let e, r = [], s = { cleanMode: !1, options: !0 };
  return t.replace(/[^a-z]i/g, "").split("").forEach((n) => {
    Kf(n) ? (e = n, s.cleanMode = !0) : s.options = s.options && Xf(r[r.length] = `-${n}`);
  }), {
    cleanMode: e,
    options: r,
    valid: s
  };
}
function Kf(t) {
  return t === "f" || t === "n";
}
function Xf(t) {
  return /^-[a-z]$/i.test(t) && Nn.has(t.charAt(1));
}
function Qf(t) {
  return /^-[^\-]/.test(t) ? t.indexOf("i") > 0 : t === "--interactive";
}
var Dn, Rn, Mn, br, Nn, Do = y({
  "src/lib/tasks/clean.ts"() {
    qf(), C(), B(), Dn = "Git clean interactive mode is not supported", Rn = 'Git clean mode parameter ("n" or "f") is required', Mn = "Git clean unknown option found in: ", br = /* @__PURE__ */ ((t) => (t.DRY_RUN = "n", t.FORCE = "f", t.IGNORED_INCLUDED = "x", t.IGNORED_ONLY = "X", t.EXCLUDING = "e", t.QUIET = "q", t.RECURSIVE = "d", t))(br || {}), Nn = /* @__PURE__ */ new Set([
      "i",
      ...io(Object.values(br))
    ]);
  }
});
function ed(t) {
  const e = new Mo();
  for (const r of Ro(t))
    e.addValue(r.file, String(r.key), r.value);
  return e;
}
function td(t, e) {
  let r = null;
  const s = [], n = /* @__PURE__ */ new Map();
  for (const i of Ro(t, e))
    i.key === e && (s.push(r = i.value), n.has(i.file) || n.set(i.file, []), n.get(i.file).push(r));
  return {
    key: e,
    paths: Array.from(n.keys()),
    scopes: n,
    value: r,
    values: s
  };
}
function rd(t) {
  return t.replace(/^(file):/, "");
}
function* Ro(t, e = null) {
  const r = t.split("\0");
  for (let s = 0, n = r.length - 1; s < n; ) {
    const i = rd(r[s++]);
    let a = r[s++], o = e;
    if (a.includes(`
`)) {
      const c = eo(a, `
`);
      o = c[0], a = c[1];
    }
    yield { file: i, key: o, value: a };
  }
}
var Mo, sd = y({
  "src/lib/responses/ConfigList.ts"() {
    C(), Mo = class {
      constructor() {
        this.files = [], this.values = /* @__PURE__ */ Object.create(null);
      }
      get all() {
        return this._all || (this._all = this.files.reduce((t, e) => Object.assign(t, this.values[e]), {})), this._all;
      }
      addFile(t) {
        if (!(t in this.values)) {
          const e = ft(this.files);
          this.values[t] = e ? Object.create(this.values[e]) : {}, this.files.push(t);
        }
        return this.values[t];
      }
      addValue(t, e, r) {
        const s = this.addFile(t);
        s.hasOwnProperty(e) ? Array.isArray(s[e]) ? s[e].push(r) : s[e] = [s[e], r] : s[e] = r, this._all = void 0;
      }
    };
  }
});
function ds(t, e) {
  return typeof t == "string" && Zs.hasOwnProperty(t) ? t : e;
}
function nd(t, e, r, s) {
  const n = ["config", `--${s}`];
  return r && n.push("--add"), n.push(t, e), {
    commands: n,
    format: "utf-8",
    parser(i) {
      return i;
    }
  };
}
function id(t, e) {
  const r = ["config", "--null", "--show-origin", "--get-all", t];
  return e && r.splice(1, 0, `--${e}`), {
    commands: r,
    format: "utf-8",
    parser(s) {
      return td(s, t);
    }
  };
}
function ad(t) {
  const e = ["config", "--list", "--show-origin", "--null"];
  return t && e.push(`--${t}`), {
    commands: e,
    format: "utf-8",
    parser(r) {
      return ed(r);
    }
  };
}
function od() {
  return {
    addConfig(t, e, ...r) {
      return this._runTask(
        nd(
          t,
          e,
          r[0] === !0,
          ds(
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
        id(t, ds(e, void 0)),
        G(arguments)
      );
    },
    listConfig(...t) {
      return this._runTask(
        ad(ds(t[0], void 0)),
        G(arguments)
      );
    }
  };
}
var Zs, No = y({
  "src/lib/tasks/config.ts"() {
    sd(), C(), Zs = /* @__PURE__ */ ((t) => (t.system = "system", t.global = "global", t.local = "local", t.worktree = "worktree", t))(Zs || {});
  }
});
function cd(t) {
  return xo.has(t);
}
var hs, xo, Fo = y({
  "src/lib/tasks/diff-name-status.ts"() {
    hs = /* @__PURE__ */ ((t) => (t.ADDED = "A", t.COPIED = "C", t.DELETED = "D", t.MODIFIED = "M", t.RENAMED = "R", t.CHANGED = "T", t.UNMERGED = "U", t.UNKNOWN = "X", t.BROKEN = "B", t))(hs || {}), xo = new Set(Object.values(hs));
  }
});
function ud(...t) {
  return new Ao().param(...t);
}
function ld(t) {
  const e = /* @__PURE__ */ new Set(), r = {};
  return En(t, (s) => {
    const [n, i, a] = s.split(Et);
    e.add(n), (r[n] = r[n] || []).push({
      line: W(i),
      path: n,
      preview: a
    });
  }), {
    paths: e,
    results: r
  };
}
function fd() {
  return {
    grep(t) {
      const e = G(arguments), r = ae(arguments);
      for (const n of Lo)
        if (r.includes(n))
          return this._runTask(
            oe(`git.grep: use of "${n}" is not supported.`),
            e
          );
      typeof t == "string" && (t = ud().param(t));
      const s = ["grep", "--null", "-n", "--full-name", ...r, ...t];
      return this._runTask(
        {
          commands: s,
          format: "utf-8",
          parser(n) {
            return ld(n);
          }
        },
        e
      );
    }
  };
}
var Lo, Ft, Ei, Ao, Po = y({
  "src/lib/tasks/grep.ts"() {
    C(), B(), Lo = ["-h"], Ft = Symbol("grepQuery"), Ao = class {
      constructor() {
        this[Ei] = [];
      }
      *[(Ei = Ft, Symbol.iterator)]() {
        for (const t of this[Ft])
          yield t;
      }
      and(...t) {
        return t.length && this[Ft].push("--and", "(", ...Gt(t, "-e"), ")"), this;
      }
      param(...t) {
        return this[Ft].push(...Gt(t, "-e")), this;
      }
    };
  }
}), Wo = {};
q(Wo, {
  ResetMode: () => Er,
  getResetMode: () => hd,
  resetTask: () => dd
});
function dd(t, e) {
  const r = ["reset"];
  return Uo(t) && r.push(`--${t}`), r.push(...e), ie(r);
}
function hd(t) {
  if (Uo(t))
    return t;
  switch (typeof t) {
    case "string":
    case "undefined":
      return "soft";
  }
}
function Uo(t) {
  return $o.includes(t);
}
var Er, $o, zo = y({
  "src/lib/tasks/reset.ts"() {
    B(), Er = /* @__PURE__ */ ((t) => (t.MIXED = "mixed", t.SOFT = "soft", t.HARD = "hard", t.MERGE = "merge", t.KEEP = "keep", t))(Er || {}), $o = Array.from(Object.values(Er));
  }
});
function md() {
  return zs("simple-git");
}
function ki(t, e, r) {
  return !e || !String(e).replace(/\s*/, "") ? r ? (s, ...n) => {
    t(s, ...n), r(s, ...n);
  } : t : (s, ...n) => {
    t(`%s ${s}`, e, ...n), r && r(s, ...n);
  };
}
function gd(t, e, { namespace: r }) {
  if (typeof t == "string")
    return t;
  const s = e && e.namespace || "";
  return s.startsWith(r) ? s.substr(r.length + 1) : s || r;
}
function xn(t, e, r, s = md()) {
  const n = t && `[${t}]` || "", i = [], a = typeof e == "string" ? s.extend(e) : e, o = gd(Ne(e, ee), a, s);
  return u(r);
  function c(l, f) {
    return x(
      i,
      xn(t, o.replace(/^[^:]+/, l), f, s)
    );
  }
  function u(l) {
    const f = l && `[${l}]` || "", d = a && ki(a, f) || dt, h = ki(s, `${n} ${f}`, d);
    return Object.assign(a ? d : h, {
      label: t,
      sibling: c,
      info: h,
      step: u
    });
  }
}
var Vo = y({
  "src/lib/git-logger.ts"() {
    C(), zs.formatters.L = (t) => String(Sn(t) ? t.length : "-"), zs.formatters.B = (t) => Buffer.isBuffer(t) ? t.toString("utf8") : Xt(t);
  }
}), jo, pd = y({
  "src/lib/runners/tasks-pending-queue.ts"() {
    var t;
    Je(), Vo(), jo = (t = class {
      constructor(r = "GitExecutor") {
        this.logLabel = r, this._queue = /* @__PURE__ */ new Map();
      }
      withProgress(r) {
        return this._queue.get(r);
      }
      createProgress(r) {
        const s = t.getName(r.commands[0]), n = xn(this.logLabel, s);
        return {
          task: r,
          logger: n,
          name: s
        };
      }
      push(r) {
        const s = this.createProgress(r);
        return s.logger("Adding task to the queue, commands = %o", r.commands), this._queue.set(r, s), s;
      }
      fatal(r) {
        for (const [s, { logger: n }] of Array.from(this._queue.entries()))
          s === r.task ? (n.info("Failed %o", r), n(
            "Fatal exception, any as-yet un-started tasks run through this executor will not be attempted"
          )) : n.info(
            "A fatal exception occurred in a previous task, the queue has been purged: %o",
            r.message
          ), this.complete(s);
        if (this._queue.size !== 0)
          throw new Error(`Queue size should be zero after fatal: ${this._queue.size}`);
      }
      complete(r) {
        this.withProgress(r) && this._queue.delete(r);
      }
      attempt(r) {
        const s = this.withProgress(r);
        if (!s)
          throw new Ue(void 0, "TasksPendingQueue: attempt called for an unknown task");
        return s.logger("Starting task"), s;
      }
      static getName(r = "empty") {
        return `task:${r}:${++t.counter}`;
      }
    }, t.counter = 0, t);
  }
});
function Xe(t, e) {
  return {
    method: to(t.commands) || "",
    commands: e
  };
}
function yd(t, e) {
  return (r) => {
    e("[ERROR] child process exception %o", r), t.push(Buffer.from(String(r.stack), "ascii"));
  };
}
function Si(t, e, r, s) {
  return (n) => {
    r("%s received %L bytes", e, n), s("%B", n), t.push(n);
  };
}
var Js, wd = y({
  "src/lib/runners/git-executor-chain.ts"() {
    Je(), B(), C(), pd(), Js = class {
      constructor(t, e, r) {
        this._executor = t, this._scheduler = e, this._plugins = r, this._chain = Promise.resolve(), this._queue = new jo();
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
      async attemptTask(t) {
        const e = await this._scheduler.next(), r = () => this._queue.complete(t);
        try {
          const { logger: s } = this._queue.attempt(t);
          return await (Oo(t) ? this.attemptEmptyTask(t, s) : this.attemptRemoteTask(t, s));
        } catch (s) {
          throw this.onFatalException(t, s);
        } finally {
          r(), e();
        }
      }
      onFatalException(t, e) {
        const r = e instanceof Ue ? Object.assign(e, { task: t }) : new Ue(t, e && String(e));
        return this._chain = Promise.resolve(), this._queue.fatal(r), r;
      }
      async attemptRemoteTask(t, e) {
        const r = this._plugins.exec("spawn.binary", "", Xe(t, t.commands)), s = this._plugins.exec(
          "spawn.args",
          [...t.commands],
          Xe(t, t.commands)
        ), n = await this.gitResponse(
          t,
          r,
          s,
          this.outputHandler,
          e.step("SPAWN")
        ), i = await this.handleTaskData(t, s, n, e.step("HANDLE"));
        return e("passing response to task's parser as a %s", t.format), So(t) ? Bs(t.parser, i) : Bs(t.parser, i.asStrings());
      }
      async attemptEmptyTask(t, e) {
        return e("empty task bypassing child process to call to task's parser"), t.parser(this);
      }
      handleTaskData(t, e, r, s) {
        const { exitCode: n, rejection: i, stdOut: a, stdErr: o } = r;
        return new Promise((c, u) => {
          s("Preparing to handle process response exitCode=%d stdOut=", n);
          const { error: l } = this._plugins.exec(
            "task.error",
            { error: i },
            {
              ...Xe(t, e),
              ...r
            }
          );
          if (l && t.onError)
            return s.info("exitCode=%s handling with custom error handler"), t.onError(
              r,
              l,
              (f) => {
                s.info("custom error handler treated as success"), s("custom error returned a %s", Xt(f)), c(
                  new Fr(
                    Array.isArray(f) ? Buffer.concat(f) : f,
                    Buffer.concat(o)
                  )
                );
              },
              u
            );
          if (l)
            return s.info(
              "handling as error: exitCode=%s stdErr=%s rejection=%o",
              n,
              o.length,
              i
            ), u(l);
          s.info("retrieving task output complete"), c(new Fr(Buffer.concat(a), Buffer.concat(o)));
        });
      }
      async gitResponse(t, e, r, s, n) {
        const i = n.sibling("output"), a = this._plugins.exec(
          "spawn.options",
          {
            cwd: this.cwd,
            env: this.env,
            windowsHide: !0
          },
          Xe(t, t.commands)
        );
        return new Promise((o) => {
          const c = [], u = [];
          n.info("%s %o", e, r), n("%O", a);
          let l = this._beforeSpawn(t, r);
          if (l)
            return o({
              stdOut: c,
              stdErr: u,
              exitCode: 9901,
              rejection: l
            });
          this._plugins.exec("spawn.before", void 0, {
            ...Xe(t, r),
            kill(d) {
              l = d || l;
            }
          });
          const f = Bl(e, r, a);
          f.stdout.on(
            "data",
            Si(c, "stdOut", n, i.step("stdOut"))
          ), f.stderr.on(
            "data",
            Si(u, "stdErr", n, i.step("stdErr"))
          ), f.on("error", yd(u, n)), s && (n("Passing child process stdOut/stdErr to custom outputHandler"), s(e, f.stdout, f.stderr, [...r])), this._plugins.exec("spawn.after", void 0, {
            ...Xe(t, r),
            spawned: f,
            close(d, h) {
              o({
                stdOut: c,
                stdErr: u,
                exitCode: d,
                rejection: l || h
              });
            },
            kill(d) {
              f.killed || (l = d, f.kill("SIGINT"));
            }
          });
        });
      }
      _beforeSpawn(t, e) {
        let r;
        return this._plugins.exec("spawn.before", void 0, {
          ...Xe(t, e),
          kill(s) {
            r = s || r;
          }
        }), r;
      }
    };
  }
}), Ho = {};
q(Ho, {
  GitExecutor: () => Go
});
var Go, vd = y({
  "src/lib/runners/git-executor.ts"() {
    wd(), Go = class {
      constructor(t, e, r) {
        this.cwd = t, this._scheduler = e, this._plugins = r, this._chain = new Js(this, this._scheduler, this._plugins);
      }
      chain() {
        return new Js(this, this._scheduler, this._plugins);
      }
      push(t) {
        return this._chain.push(t);
      }
    };
  }
});
function _d(t, e, r = dt) {
  const s = (i) => {
    r(null, i);
  }, n = (i) => {
    (i == null ? void 0 : i.task) === t && r(
      i instanceof Jt ? Td(i) : i,
      void 0
    );
  };
  e.then(s, n);
}
function Td(t) {
  let e = (s) => {
    console.warn(
      `simple-git deprecation notice: accessing GitResponseError.${s} should be GitResponseError.git.${s}, this will no longer be available in version 3`
    ), e = dt;
  };
  return Object.create(t, Object.getOwnPropertyNames(t.git).reduce(r, {}));
  function r(s, n) {
    return n in t || (s[n] = {
      enumerable: !1,
      configurable: !1,
      get() {
        return e(n), t.git[n];
      }
    }), s;
  }
}
var bd = y({
  "src/lib/task-callback.ts"() {
    Ot(), C();
  }
});
function Oi(t, e) {
  return Eo((r) => {
    if (!kn(t))
      throw new Error(`Git.cwd: cannot change to non-directory "${t}"`);
    return (e || r).cwd = t;
  });
}
var Ed = y({
  "src/lib/tasks/change-working-directory.ts"() {
    C(), B();
  }
});
function ms(t) {
  const e = ["checkout", ...t];
  return e[1] === "-b" && e.includes("-B") && (e[1] = Hr(e, "-B")), ie(e);
}
function kd() {
  return {
    checkout() {
      return this._runTask(
        ms(ae(arguments, 1)),
        G(arguments)
      );
    },
    checkoutBranch(t, e) {
      return this._runTask(
        ms(["-b", t, e, ...ae(arguments)]),
        G(arguments)
      );
    },
    checkoutLocalBranch(t) {
      return this._runTask(
        ms(["-b", t, ...ae(arguments)]),
        G(arguments)
      );
    }
  };
}
var Sd = y({
  "src/lib/tasks/checkout.ts"() {
    C(), B();
  }
});
function Od() {
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
function Id() {
  return {
    countObjects() {
      return this._runTask({
        commands: ["count-objects", "--verbose"],
        format: "utf-8",
        parser(t) {
          return ce(Od(), [Bo], t);
        }
      });
    }
  };
}
var Bo, Cd = y({
  "src/lib/tasks/count-objects.ts"() {
    C(), Bo = new R(
      /([a-z-]+): (\d+)$/,
      (t, [e, r]) => {
        const s = no(e);
        t.hasOwnProperty(s) && (t[s] = W(r));
      }
    );
  }
});
function Dd(t) {
  return ce({
    author: null,
    branch: "",
    commit: "",
    root: !1,
    summary: {
      changes: 0,
      insertions: 0,
      deletions: 0
    }
  }, qo, t);
}
var qo, Rd = y({
  "src/lib/parsers/parse-commit.ts"() {
    C(), qo = [
      new R(/^\[([^\s]+)( \([^)]+\))? ([^\]]+)/, (t, [e, r, s]) => {
        t.branch = e, t.commit = s, t.root = !!r;
      }),
      new R(/\s*Author:\s(.+)/i, (t, [e]) => {
        const r = e.split("<"), s = r.pop();
        !s || !s.includes("@") || (t.author = {
          email: s.substr(0, s.length - 1),
          name: r.join("<").trim()
        });
      }),
      new R(
        /(\d+)[^,]*(?:,\s*(\d+)[^,]*)(?:,\s*(\d+))/g,
        (t, [e, r, s]) => {
          t.summary.changes = parseInt(e, 10) || 0, t.summary.insertions = parseInt(r, 10) || 0, t.summary.deletions = parseInt(s, 10) || 0;
        }
      ),
      new R(
        /^(\d+)[^,]*(?:,\s*(\d+)[^(]+\(([+-]))?/,
        (t, [e, r, s]) => {
          t.summary.changes = parseInt(e, 10) || 0;
          const n = parseInt(r, 10) || 0;
          s === "-" ? t.summary.deletions = n : s === "+" && (t.summary.insertions = n);
        }
      )
    ];
  }
});
function Md(t, e, r) {
  return {
    commands: [
      "-c",
      "core.abbrev=40",
      "commit",
      ...Gt(t, "-m"),
      ...e,
      ...r
    ],
    format: "utf-8",
    parser: Dd
  };
}
function Nd() {
  return {
    commit(e, ...r) {
      const s = G(arguments), n = t(e) || Md(
        Me(e),
        Me(Ne(r[0], xr, [])),
        [...Ne(r[1], Qt, []), ...ae(arguments, 0, !0)]
      );
      return this._runTask(n, s);
    }
  };
  function t(e) {
    return !xr(e) && oe(
      "git.commit: requires the commit message to be supplied as a string/string[]"
    );
  }
}
var xd = y({
  "src/lib/tasks/commit.ts"() {
    Rd(), C(), B();
  }
});
function Fd() {
  return {
    firstCommit() {
      return this._runTask(
        ie(["rev-list", "--max-parents=0", "HEAD"], !0),
        G(arguments)
      );
    }
  };
}
var Ld = y({
  "src/lib/tasks/first-commit.ts"() {
    C(), B();
  }
});
function Ad(t, e) {
  const r = ["hash-object", t];
  return e && r.push("-w"), ie(r, !0);
}
var Pd = y({
  "src/lib/tasks/hash-object.ts"() {
    B();
  }
});
function Wd(t, e, r) {
  const s = String(r).trim();
  let n;
  if (n = Yo.exec(s))
    return new kr(t, e, !1, n[1]);
  if (n = Zo.exec(s))
    return new kr(t, e, !0, n[1]);
  let i = "";
  const a = s.split(" ");
  for (; a.length; )
    if (a.shift() === "in") {
      i = a.join(" ");
      break;
    }
  return new kr(t, e, /^re/i.test(s), i);
}
var kr, Yo, Zo, Ud = y({
  "src/lib/responses/InitSummary.ts"() {
    kr = class {
      constructor(t, e, r, s) {
        this.bare = t, this.path = e, this.existing = r, this.gitDir = s;
      }
    }, Yo = /^Init.+ repository in (.+)$/, Zo = /^Rein.+ in (.+)$/;
  }
});
function $d(t) {
  return t.includes(Fn);
}
function zd(t = !1, e, r) {
  const s = ["init", ...r];
  return t && !$d(s) && s.splice(1, 0, Fn), {
    commands: s,
    format: "utf-8",
    parser(n) {
      return Wd(s.includes("--bare"), e, n);
    }
  };
}
var Fn, Vd = y({
  "src/lib/tasks/init.ts"() {
    Ud(), Fn = "--bare";
  }
});
function Ln(t) {
  for (let e = 0; e < t.length; e++) {
    const r = An.exec(t[e]);
    if (r)
      return `--${r[1]}`;
  }
  return "";
}
function jd(t) {
  return An.test(t);
}
var An, er = y({
  "src/lib/args/log-format.ts"() {
    An = /^--(stat|numstat|name-only|name-status)(=|$)/;
  }
}), Jo, Hd = y({
  "src/lib/responses/DiffSummary.ts"() {
    Jo = class {
      constructor() {
        this.changed = 0, this.deletions = 0, this.insertions = 0, this.files = [];
      }
    };
  }
});
function Ko(t = "") {
  const e = Xo[t];
  return (r) => ce(new Jo(), e, r, !1);
}
var gs, Ii, Ci, Di, Xo, Qo = y({
  "src/lib/parsers/parse-diff-summary.ts"() {
    er(), Hd(), Fo(), C(), gs = [
      new R(
        /^(.+)\s+\|\s+(\d+)(\s+[+\-]+)?$/,
        (t, [e, r, s = ""]) => {
          t.files.push({
            file: e.trim(),
            changes: W(r),
            insertions: s.replace(/[^+]/g, "").length,
            deletions: s.replace(/[^-]/g, "").length,
            binary: !1
          });
        }
      ),
      new R(
        /^(.+) \|\s+Bin ([0-9.]+) -> ([0-9.]+) ([a-z]+)/,
        (t, [e, r, s]) => {
          t.files.push({
            file: e.trim(),
            before: W(r),
            after: W(s),
            binary: !0
          });
        }
      ),
      new R(
        /(\d+) files? changed\s*((?:, \d+ [^,]+){0,2})/,
        (t, [e, r]) => {
          const s = /(\d+) i/.exec(r), n = /(\d+) d/.exec(r);
          t.changed = W(e), t.insertions = W(s == null ? void 0 : s[1]), t.deletions = W(n == null ? void 0 : n[1]);
        }
      )
    ], Ii = [
      new R(
        /(\d+)\t(\d+)\t(.+)$/,
        (t, [e, r, s]) => {
          const n = W(e), i = W(r);
          t.changed++, t.insertions += n, t.deletions += i, t.files.push({
            file: s,
            changes: n + i,
            insertions: n,
            deletions: i,
            binary: !1
          });
        }
      ),
      new R(/-\t-\t(.+)$/, (t, [e]) => {
        t.changed++, t.files.push({
          file: e,
          after: 0,
          before: 0,
          binary: !0
        });
      })
    ], Ci = [
      new R(/(.+)$/, (t, [e]) => {
        t.changed++, t.files.push({
          file: e,
          changes: 0,
          insertions: 0,
          deletions: 0,
          binary: !1
        });
      })
    ], Di = [
      new R(
        /([ACDMRTUXB])([0-9]{0,3})\t(.[^\t]*)(\t(.[^\t]*))?$/,
        (t, [e, r, s, n, i]) => {
          t.changed++, t.files.push({
            file: i ?? s,
            changes: 0,
            insertions: 0,
            deletions: 0,
            binary: !1,
            status: js(cd(e) && e),
            from: js(!!i && s !== i && s),
            similarity: W(r)
          });
        }
      )
    ], Xo = {
      "": gs,
      "--stat": gs,
      "--numstat": Ii,
      "--name-status": Di,
      "--name-only": Ci
    };
  }
});
function Gd(t, e) {
  return e.reduce(
    (r, s, n) => (r[s] = t[n] || "", r),
    /* @__PURE__ */ Object.create({ diff: null })
  );
}
function ec(t = Un, e = tc, r = "") {
  const s = Ko(r);
  return function(n) {
    const i = Kt(
      n.trim(),
      !1,
      Pn
    ).map(function(a) {
      const o = a.split(Wn), c = Gd(o[0].split(t), e);
      return o.length > 1 && o[1].trim() && (c.diff = s(o[1])), c;
    });
    return {
      all: i,
      latest: i.length && i[0] || null,
      total: i.length
    };
  };
}
var Pn, Wn, Un, tc, rc = y({
  "src/lib/parsers/parse-list-log-summary.ts"() {
    C(), Qo(), er(), Pn = "òòòòòò ", Wn = " òò", Un = " ò ", tc = ["hash", "date", "message", "refs", "author_name", "author_email"];
  }
}), sc = {};
q(sc, {
  diffSummaryTask: () => Bd,
  validateLogFormatConfig: () => Zr
});
function Bd(t) {
  let e = Ln(t);
  const r = ["diff"];
  return e === "" && (e = "--stat", r.push("--stat=4096")), r.push(...t), Zr(r) || {
    commands: r,
    format: "utf-8",
    parser: Ko(e)
  };
}
function Zr(t) {
  const e = t.filter(jd);
  if (e.length > 1)
    return oe(
      `Summary flags are mutually exclusive - pick one of ${e.join(",")}`
    );
  if (e.length && t.includes("-z"))
    return oe(
      `Summary flag ${e} parsing is not compatible with null termination option '-z'`
    );
}
var $n = y({
  "src/lib/tasks/diff.ts"() {
    er(), Qo(), B();
  }
});
function qd(t, e) {
  const r = [], s = [];
  return Object.keys(t).forEach((n) => {
    r.push(n), s.push(String(t[n]));
  }), [r, s.join(e)];
}
function Yd(t) {
  return Object.keys(t).reduce((e, r) => (r in Ks || (e[r] = t[r]), e), {});
}
function nc(t = {}, e = []) {
  const r = Ne(t.splitter, ee, Un), s = Br(t.format) ? t.format : {
    hash: "%H",
    date: t.strictDate === !1 ? "%ai" : "%aI",
    message: "%s",
    refs: "%D",
    body: t.multiLine ? "%B" : "%b",
    author_name: t.mailMap !== !1 ? "%aN" : "%an",
    author_email: t.mailMap !== !1 ? "%aE" : "%ae"
  }, [n, i] = qd(s, r), a = [], o = [
    `--pretty=format:${Pn}${i}${Wn}`,
    ...e
  ], c = t.n || t["max-count"] || t.maxCount;
  if (c && o.push(`--max-count=${c}`), t.from || t.to) {
    const u = t.symmetric !== !1 ? "..." : "..";
    a.push(`${t.from || ""}${u}${t.to || ""}`);
  }
  return ee(t.file) && o.push("--follow", Af(t.file)), On(Yd(t), o), {
    fields: n,
    splitter: r,
    commands: [...o, ...a]
  };
}
function Zd(t, e, r) {
  const s = ec(t, e, Ln(r));
  return {
    commands: ["log", ...r],
    format: "utf-8",
    parser: s
  };
}
function Jd() {
  return {
    log(...r) {
      const s = G(arguments), n = nc(
        In(arguments),
        Ne(arguments[0], Qt)
      ), i = e(...r) || Zr(n.commands) || t(n);
      return this._runTask(i, s);
    }
  };
  function t(r) {
    return Zd(r.splitter, r.fields, r.commands);
  }
  function e(r, s) {
    return ee(r) && ee(s) && oe(
      "git.log(string, string) should be replaced with git.log({ from: string, to: string })"
    );
  }
}
var Ks, ic = y({
  "src/lib/tasks/log.ts"() {
    er(), Zt(), rc(), C(), B(), $n(), Ks = /* @__PURE__ */ ((t) => (t[t["--pretty"] = 0] = "--pretty", t[t["max-count"] = 1] = "max-count", t[t.maxCount = 2] = "maxCount", t[t.n = 3] = "n", t[t.file = 4] = "file", t[t.format = 5] = "format", t[t.from = 6] = "from", t[t.to = 7] = "to", t[t.splitter = 8] = "splitter", t[t.symmetric = 9] = "symmetric", t[t.mailMap = 10] = "mailMap", t[t.multiLine = 11] = "multiLine", t[t.strictDate = 12] = "strictDate", t))(Ks || {});
  }
}), Sr, ac, Kd = y({
  "src/lib/responses/MergeSummary.ts"() {
    Sr = class {
      constructor(t, e = null, r) {
        this.reason = t, this.file = e, this.meta = r;
      }
      toString() {
        return `${this.file}:${this.reason}`;
      }
    }, ac = class {
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
}), Xs, oc, Xd = y({
  "src/lib/responses/PullSummary.ts"() {
    Xs = class {
      constructor() {
        this.remoteMessages = {
          all: []
        }, this.created = [], this.deleted = [], this.files = [], this.deletions = {}, this.insertions = {}, this.summary = {
          changes: 0,
          deletions: 0,
          insertions: 0
        };
      }
    }, oc = class {
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
function ps(t) {
  return t.objects = t.objects || {
    compressing: 0,
    counting: 0,
    enumerating: 0,
    packReused: 0,
    reused: { count: 0, delta: 0 },
    total: { count: 0, delta: 0 }
  };
}
function Ri(t) {
  const e = /^\s*(\d+)/.exec(t), r = /delta (\d+)/i.exec(t);
  return {
    count: W(e && e[1] || "0"),
    delta: W(r && r[1] || "0")
  };
}
var cc, Qd = y({
  "src/lib/parsers/parse-remote-objects.ts"() {
    C(), cc = [
      new Be(
        /^remote:\s*(enumerating|counting|compressing) objects: (\d+),/i,
        (t, [e, r]) => {
          const s = e.toLowerCase(), n = ps(t.remoteMessages);
          Object.assign(n, { [s]: W(r) });
        }
      ),
      new Be(
        /^remote:\s*(enumerating|counting|compressing) objects: \d+% \(\d+\/(\d+)\),/i,
        (t, [e, r]) => {
          const s = e.toLowerCase(), n = ps(t.remoteMessages);
          Object.assign(n, { [s]: W(r) });
        }
      ),
      new Be(
        /total ([^,]+), reused ([^,]+), pack-reused (\d+)/i,
        (t, [e, r, s]) => {
          const n = ps(t.remoteMessages);
          n.total = Ri(e), n.reused = Ri(r), n.packReused = W(s);
        }
      )
    ];
  }
});
function uc(t, e) {
  return ce({ remoteMessages: new fc() }, lc, e);
}
var lc, fc, dc = y({
  "src/lib/parsers/parse-remote-messages.ts"() {
    C(), Qd(), lc = [
      new Be(/^remote:\s*(.+)$/, (t, [e]) => (t.remoteMessages.all.push(e.trim()), !1)),
      ...cc,
      new Be(
        [/create a (?:pull|merge) request/i, /\s(https?:\/\/\S+)$/],
        (t, [e]) => {
          t.remoteMessages.pullRequestUrl = e;
        }
      ),
      new Be(
        [/found (\d+) vulnerabilities.+\(([^)]+)\)/i, /\s(https?:\/\/\S+)$/],
        (t, [e, r, s]) => {
          t.remoteMessages.vulnerabilities = {
            count: W(e),
            summary: r,
            url: s
          };
        }
      )
    ], fc = class {
      constructor() {
        this.all = [];
      }
    };
  }
});
function eh(t, e) {
  const r = ce(new oc(), hc, [t, e]);
  return r.message && r;
}
var Mi, Ni, xi, Fi, hc, Li, zn, mc = y({
  "src/lib/parsers/parse-pull.ts"() {
    Xd(), C(), dc(), Mi = /^\s*(.+?)\s+\|\s+\d+\s*(\+*)(-*)/, Ni = /(\d+)\D+((\d+)\D+\(\+\))?(\D+(\d+)\D+\(-\))?/, xi = /^(create|delete) mode \d+ (.+)/, Fi = [
      new R(Mi, (t, [e, r, s]) => {
        t.files.push(e), r && (t.insertions[e] = r.length), s && (t.deletions[e] = s.length);
      }),
      new R(Ni, (t, [e, , r, , s]) => r !== void 0 || s !== void 0 ? (t.summary.changes = +e || 0, t.summary.insertions = +r || 0, t.summary.deletions = +s || 0, !0) : !1),
      new R(xi, (t, [e, r]) => {
        x(t.files, r), x(e === "create" ? t.created : t.deleted, r);
      })
    ], hc = [
      new R(/^from\s(.+)$/i, (t, [e]) => void (t.remote = e)),
      new R(/^fatal:\s(.+)$/, (t, [e]) => void (t.message = e)),
      new R(
        /([a-z0-9]+)\.\.([a-z0-9]+)\s+(\S+)\s+->\s+(\S+)$/,
        (t, [e, r, s, n]) => {
          t.branch.local = s, t.hash.local = e, t.branch.remote = n, t.hash.remote = r;
        }
      )
    ], Li = (t, e) => ce(new Xs(), Fi, [t, e]), zn = (t, e) => Object.assign(
      new Xs(),
      Li(t, e),
      uc(t, e)
    );
  }
}), Ai, gc, Pi, th = y({
  "src/lib/parsers/parse-merge.ts"() {
    Kd(), C(), mc(), Ai = [
      new R(/^Auto-merging\s+(.+)$/, (t, [e]) => {
        t.merges.push(e);
      }),
      new R(/^CONFLICT\s+\((.+)\): Merge conflict in (.+)$/, (t, [e, r]) => {
        t.conflicts.push(new Sr(e, r));
      }),
      new R(
        /^CONFLICT\s+\((.+\/delete)\): (.+) deleted in (.+) and/,
        (t, [e, r, s]) => {
          t.conflicts.push(new Sr(e, r, { deleteRef: s }));
        }
      ),
      new R(/^CONFLICT\s+\((.+)\):/, (t, [e]) => {
        t.conflicts.push(new Sr(e, null));
      }),
      new R(/^Automatic merge failed;\s+(.+)$/, (t, [e]) => {
        t.result = e;
      })
    ], gc = (t, e) => Object.assign(Pi(t, e), zn(t, e)), Pi = (t) => ce(new ac(), Ai, t);
  }
});
function Wi(t) {
  return t.length ? {
    commands: ["merge", ...t],
    format: "utf-8",
    parser(e, r) {
      const s = gc(e, r);
      if (s.failed)
        throw new Jt(s);
      return s;
    }
  } : oe("Git.merge requires at least one option");
}
var rh = y({
  "src/lib/tasks/merge.ts"() {
    Ot(), th(), B();
  }
});
function sh(t, e, r) {
  const s = r.includes("deleted"), n = r.includes("tag") || /^refs\/tags/.test(t), i = !r.includes("new");
  return {
    deleted: s,
    tag: n,
    branch: !n,
    new: !i,
    alreadyUpdated: i,
    local: t,
    remote: e
  };
}
var Ui, pc, $i, nh = y({
  "src/lib/parsers/parse-push.ts"() {
    C(), dc(), Ui = [
      new R(/^Pushing to (.+)$/, (t, [e]) => {
        t.repo = e;
      }),
      new R(/^updating local tracking ref '(.+)'/, (t, [e]) => {
        t.ref = {
          ...t.ref || {},
          local: e
        };
      }),
      new R(/^[=*-]\s+([^:]+):(\S+)\s+\[(.+)]$/, (t, [e, r, s]) => {
        t.pushed.push(sh(e, r, s));
      }),
      new R(
        /^Branch '([^']+)' set up to track remote branch '([^']+)' from '([^']+)'/,
        (t, [e, r, s]) => {
          t.branch = {
            ...t.branch || {},
            local: e,
            remote: r,
            remoteName: s
          };
        }
      ),
      new R(
        /^([^:]+):(\S+)\s+([a-z0-9]+)\.\.([a-z0-9]+)$/,
        (t, [e, r, s, n]) => {
          t.update = {
            head: {
              local: e,
              remote: r
            },
            hash: {
              from: s,
              to: n
            }
          };
        }
      )
    ], pc = (t, e) => {
      const r = $i(t, e), s = uc(t, e);
      return {
        ...r,
        ...s
      };
    }, $i = (t, e) => ce({ pushed: [] }, Ui, [t, e]);
  }
}), yc = {};
q(yc, {
  pushTagsTask: () => ih,
  pushTask: () => Vn
});
function ih(t = {}, e) {
  return x(e, "--tags"), Vn(t, e);
}
function Vn(t = {}, e) {
  const r = ["push", ...e];
  return t.branch && r.splice(1, 0, t.branch), t.remote && r.splice(1, 0, t.remote), Hr(r, "-v"), x(r, "--verbose"), x(r, "--porcelain"), {
    commands: r,
    format: "utf-8",
    parser: pc
  };
}
var wc = y({
  "src/lib/tasks/push.ts"() {
    nh(), C();
  }
});
function ah() {
  return {
    showBuffer() {
      const t = ["show", ...ae(arguments, 1)];
      return t.includes("--binary") || t.splice(1, 0, "--binary"), this._runTask(
        ko(t),
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
var oh = y({
  "src/lib/tasks/show.ts"() {
    C(), B();
  }
}), zi, vc, ch = y({
  "src/lib/responses/FileStatusSummary.ts"() {
    zi = /^(.+)\0(.+)$/, vc = class {
      constructor(t, e, r) {
        if (this.path = t, this.index = e, this.working_dir = r, e === "R" || r === "R") {
          const s = zi.exec(t) || [null, t, t];
          this.from = s[2] || "", this.path = s[1] || "";
        }
      }
    };
  }
});
function Vi(t) {
  const [e, r] = t.split(Et);
  return {
    from: r || e,
    to: e
  };
}
function le(t, e, r) {
  return [`${t}${e}`, r];
}
function ys(t, ...e) {
  return e.map((r) => le(t, r, (s, n) => x(s.conflicted, n)));
}
function uh(t, e) {
  const r = e.trim();
  switch (" ") {
    case r.charAt(2):
      return s(r.charAt(0), r.charAt(1), r.substr(3));
    case r.charAt(1):
      return s(" ", r.charAt(0), r.substr(2));
    default:
      return;
  }
  function s(n, i, a) {
    const o = `${n}${i}`, c = _c.get(o);
    c && c(t, a), o !== "##" && o !== "!!" && t.files.push(new vc(a, n, i));
  }
}
var ji, _c, Tc, lh = y({
  "src/lib/responses/StatusSummary.ts"() {
    C(), ch(), ji = class {
      constructor() {
        this.not_added = [], this.conflicted = [], this.created = [], this.deleted = [], this.ignored = void 0, this.modified = [], this.renamed = [], this.files = [], this.staged = [], this.ahead = 0, this.behind = 0, this.current = null, this.tracking = null, this.detached = !1, this.isClean = () => !this.files.length;
      }
    }, _c = new Map([
      le(
        " ",
        "A",
        (t, e) => x(t.created, e)
      ),
      le(
        " ",
        "D",
        (t, e) => x(t.deleted, e)
      ),
      le(
        " ",
        "M",
        (t, e) => x(t.modified, e)
      ),
      le(
        "A",
        " ",
        (t, e) => x(t.created, e) && x(t.staged, e)
      ),
      le(
        "A",
        "M",
        (t, e) => x(t.created, e) && x(t.staged, e) && x(t.modified, e)
      ),
      le(
        "D",
        " ",
        (t, e) => x(t.deleted, e) && x(t.staged, e)
      ),
      le(
        "M",
        " ",
        (t, e) => x(t.modified, e) && x(t.staged, e)
      ),
      le(
        "M",
        "M",
        (t, e) => x(t.modified, e) && x(t.staged, e)
      ),
      le("R", " ", (t, e) => {
        x(t.renamed, Vi(e));
      }),
      le("R", "M", (t, e) => {
        const r = Vi(e);
        x(t.renamed, r), x(t.modified, r.to);
      }),
      le("!", "!", (t, e) => {
        x(t.ignored = t.ignored || [], e);
      }),
      le(
        "?",
        "?",
        (t, e) => x(t.not_added, e)
      ),
      ...ys(
        "A",
        "A",
        "U"
        /* UNMERGED */
      ),
      ...ys(
        "D",
        "D",
        "U"
        /* UNMERGED */
      ),
      ...ys(
        "U",
        "A",
        "D",
        "U"
        /* UNMERGED */
      ),
      [
        "##",
        (t, e) => {
          const r = /ahead (\d+)/, s = /behind (\d+)/, n = /^(.+?(?=(?:\.{3}|\s|$)))/, i = /\.{3}(\S*)/, a = /\son\s([\S]+)$/;
          let o;
          o = r.exec(e), t.ahead = o && +o[1] || 0, o = s.exec(e), t.behind = o && +o[1] || 0, o = n.exec(e), t.current = o && o[1], o = i.exec(e), t.tracking = o && o[1], o = a.exec(e), t.current = o && o[1] || t.current, t.detached = /\(no branch\)/.test(e);
        }
      ]
    ]), Tc = function(t) {
      const e = t.split(Et), r = new ji();
      for (let s = 0, n = e.length; s < n; ) {
        let i = e[s++].trim();
        i && (i.charAt(0) === "R" && (i += Et + (e[s++] || "")), uh(r, i));
      }
      return r;
    };
  }
});
function fh(t) {
  return {
    format: "utf-8",
    commands: [
      "status",
      "--porcelain",
      "-b",
      "-u",
      "--null",
      ...t.filter((r) => !bc.includes(r))
    ],
    parser(r) {
      return Tc(r);
    }
  };
}
var bc, dh = y({
  "src/lib/tasks/status.ts"() {
    lh(), bc = ["--null", "-z"];
  }
});
function Lr(t = 0, e = 0, r = 0, s = "", n = !0) {
  return Object.defineProperty(
    {
      major: t,
      minor: e,
      patch: r,
      agent: s,
      installed: n
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
function hh() {
  return Lr(0, 0, 0, "", !1);
}
function mh() {
  return {
    version() {
      return this._runTask({
        commands: ["--version"],
        format: "utf-8",
        parser: gh,
        onError(t, e, r, s) {
          if (t.exitCode === -2)
            return r(Buffer.from(jn));
          s(e);
        }
      });
    }
  };
}
function gh(t) {
  return t === jn ? hh() : ce(Lr(0, 0, 0, t), Ec, t);
}
var jn, Ec, ph = y({
  "src/lib/tasks/version.ts"() {
    C(), jn = "installed=false", Ec = [
      new R(
        /version (\d+)\.(\d+)\.(\d+)(?:\s*\((.+)\))?/,
        (t, [e, r, s, n = ""]) => {
          Object.assign(
            t,
            Lr(W(e), W(r), W(s), n)
          );
        }
      ),
      new R(
        /version (\d+)\.(\d+)\.(\D+)(.+)?$/,
        (t, [e, r, s, n = ""]) => {
          Object.assign(t, Lr(W(e), W(r), s, n));
        }
      )
    ];
  }
}), kc = {};
q(kc, {
  SimpleGitApi: () => Qs
});
var Qs, yh = y({
  "src/lib/simple-git-api.ts"() {
    bd(), Ed(), Sd(), Cd(), xd(), No(), Ld(), Po(), Pd(), Vd(), ic(), rh(), wc(), oh(), dh(), B(), ph(), C(), Qs = class {
      constructor(t) {
        this._executor = t;
      }
      _runTask(t, e) {
        const r = this._executor.chain(), s = r.push(t);
        return e && _d(t, s, e), Object.create(this, {
          then: { value: s.then.bind(s) },
          catch: { value: s.catch.bind(s) },
          _executor: { value: r }
        });
      }
      add(t) {
        return this._runTask(
          ie(["add", ...Me(t)]),
          G(arguments)
        );
      }
      cwd(t) {
        const e = G(arguments);
        return typeof t == "string" ? this._runTask(Oi(t, this._executor), e) : typeof (t == null ? void 0 : t.path) == "string" ? this._runTask(
          Oi(
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
          Ad(t, e === !0),
          G(arguments)
        );
      }
      init(t) {
        return this._runTask(
          zd(t === !0, this._executor.cwd, ae(arguments)),
          G(arguments)
        );
      }
      merge() {
        return this._runTask(
          Wi(ae(arguments)),
          G(arguments)
        );
      }
      mergeFromTo(t, e) {
        return ee(t) && ee(e) ? this._runTask(
          Wi([t, e, ...ae(arguments)]),
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
        const t = Vn(
          {
            remote: Ne(arguments[0], ee),
            branch: Ne(arguments[1], ee)
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
          fh(ae(arguments)),
          G(arguments)
        );
      }
    }, Object.assign(
      Qs.prototype,
      kd(),
      Nd(),
      od(),
      Id(),
      Fd(),
      fd(),
      Jd(),
      ah(),
      mh()
    );
  }
}), Sc = {};
q(Sc, {
  Scheduler: () => Oc
});
var Hi, Oc, wh = y({
  "src/lib/runners/scheduler.ts"() {
    C(), Vo(), Hi = /* @__PURE__ */ (() => {
      let t = 0;
      return () => {
        t++;
        const { promise: e, done: r } = Za();
        return {
          promise: e,
          done: r,
          id: t
        };
      };
    })(), Oc = class {
      constructor(t = 2) {
        this.concurrency = t, this.logger = xn("", "scheduler"), this.pending = [], this.running = [], this.logger("Constructed, concurrency=%s", t);
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
        const t = x(this.running, this.pending.shift());
        this.logger("Attempting id=%s", t.id), t.done(() => {
          this.logger("Completing id=", t.id), Hr(this.running, t), this.schedule();
        });
      }
      next() {
        const { promise: t, id: e } = x(this.pending, Hi());
        return this.logger("Scheduling id=%s", e), this.schedule(), t;
      }
    };
  }
}), Ic = {};
q(Ic, {
  applyPatchTask: () => vh
});
function vh(t, e) {
  return ie(["apply", ...e, ...t]);
}
var _h = y({
  "src/lib/tasks/apply-patch.ts"() {
    B();
  }
});
function Th(t, e) {
  return {
    branch: t,
    hash: e,
    success: !0
  };
}
function bh(t) {
  return {
    branch: t,
    hash: null,
    success: !1
  };
}
var Cc, Eh = y({
  "src/lib/responses/BranchDeleteSummary.ts"() {
    Cc = class {
      constructor() {
        this.all = [], this.branches = {}, this.errors = [];
      }
      get success() {
        return !this.errors.length;
      }
    };
  }
});
function Dc(t, e) {
  return e === 1 && en.test(t);
}
var Gi, en, Bi, Jr, kh = y({
  "src/lib/parsers/parse-branch-delete.ts"() {
    Eh(), C(), Gi = /(\S+)\s+\(\S+\s([^)]+)\)/, en = /^error[^']+'([^']+)'/m, Bi = [
      new R(Gi, (t, [e, r]) => {
        const s = Th(e, r);
        t.all.push(s), t.branches[e] = s;
      }),
      new R(en, (t, [e]) => {
        const r = bh(e);
        t.errors.push(r), t.all.push(r), t.branches[e] = r;
      })
    ], Jr = (t, e) => ce(new Cc(), Bi, [t, e]);
  }
}), Rc, Sh = y({
  "src/lib/responses/BranchSummary.ts"() {
    Rc = class {
      constructor() {
        this.all = [], this.branches = {}, this.current = "", this.detached = !1;
      }
      push(t, e, r, s, n) {
        t === "*" && (this.detached = e, this.current = r), this.all.push(r), this.branches[r] = {
          current: t === "*",
          linkedWorkTree: t === "+",
          name: r,
          commit: s,
          label: n
        };
      }
    };
  }
});
function qi(t) {
  return t ? t.charAt(0) : "";
}
function Mc(t) {
  return ce(new Rc(), Nc, t);
}
var Nc, Oh = y({
  "src/lib/parsers/parse-branch.ts"() {
    Sh(), C(), Nc = [
      new R(
        /^([*+]\s)?\((?:HEAD )?detached (?:from|at) (\S+)\)\s+([a-z0-9]+)\s(.*)$/,
        (t, [e, r, s, n]) => {
          t.push(qi(e), !0, r, s, n);
        }
      ),
      new R(
        /^([*+]\s)?(\S+)\s+([a-z0-9]+)\s?(.*)$/s,
        (t, [e, r, s, n]) => {
          t.push(qi(e), !1, r, s, n);
        }
      )
    ];
  }
}), xc = {};
q(xc, {
  branchLocalTask: () => Ch,
  branchTask: () => Ih,
  containsDeleteBranchCommand: () => Fc,
  deleteBranchTask: () => Rh,
  deleteBranchesTask: () => Dh
});
function Fc(t) {
  const e = ["-d", "-D", "--delete"];
  return t.some((r) => e.includes(r));
}
function Ih(t) {
  const e = Fc(t), r = ["branch", ...t];
  return r.length === 1 && r.push("-a"), r.includes("-v") || r.splice(1, 0, "-v"), {
    format: "utf-8",
    commands: r,
    parser(s, n) {
      return e ? Jr(s, n).all[0] : Mc(s);
    }
  };
}
function Ch() {
  return {
    format: "utf-8",
    commands: ["branch", "-v"],
    parser: Mc
  };
}
function Dh(t, e = !1) {
  return {
    format: "utf-8",
    commands: ["branch", "-v", e ? "-D" : "-d", ...t],
    parser(r, s) {
      return Jr(r, s);
    },
    onError({ exitCode: r, stdOut: s }, n, i, a) {
      if (!Dc(String(n), r))
        return a(n);
      i(s);
    }
  };
}
function Rh(t, e = !1) {
  const r = {
    format: "utf-8",
    commands: ["branch", "-v", e ? "-D" : "-d", t],
    parser(s, n) {
      return Jr(s, n).branches[t];
    },
    onError({ exitCode: s, stdErr: n, stdOut: i }, a, o, c) {
      if (!Dc(String(a), s))
        return c(a);
      throw new Jt(
        r.parser(Bt(i), Bt(n)),
        String(a)
      );
    }
  };
  return r;
}
var Mh = y({
  "src/lib/tasks/branch.ts"() {
    Ot(), kh(), Oh(), C();
  }
}), Lc, Nh = y({
  "src/lib/responses/CheckIgnore.ts"() {
    Lc = (t) => t.split(/\n/g).map((e) => e.trim()).filter((e) => !!e);
  }
}), Ac = {};
q(Ac, {
  checkIgnoreTask: () => xh
});
function xh(t) {
  return {
    commands: ["check-ignore", ...t],
    format: "utf-8",
    parser: Lc
  };
}
var Fh = y({
  "src/lib/tasks/check-ignore.ts"() {
    Nh();
  }
}), Pc = {};
q(Pc, {
  cloneMirrorTask: () => Ah,
  cloneTask: () => Wc
});
function Lh(t) {
  return /^--upload-pack(=|$)/.test(t);
}
function Wc(t, e, r) {
  const s = ["clone", ...r];
  return ee(t) && s.push(t), ee(e) && s.push(e), s.find(Lh) ? oe("git.fetch: potential exploit argument blocked.") : ie(s);
}
function Ah(t, e, r) {
  return x(r, "--mirror"), Wc(t, e, r);
}
var Ph = y({
  "src/lib/tasks/clone.ts"() {
    B(), C();
  }
});
function Wh(t, e) {
  return ce({
    raw: t,
    remote: null,
    branches: [],
    tags: [],
    updated: [],
    deleted: []
  }, Uc, [t, e]);
}
var Uc, Uh = y({
  "src/lib/parsers/parse-fetch.ts"() {
    C(), Uc = [
      new R(/From (.+)$/, (t, [e]) => {
        t.remote = e;
      }),
      new R(/\* \[new branch]\s+(\S+)\s*-> (.+)$/, (t, [e, r]) => {
        t.branches.push({
          name: e,
          tracking: r
        });
      }),
      new R(/\* \[new tag]\s+(\S+)\s*-> (.+)$/, (t, [e, r]) => {
        t.tags.push({
          name: e,
          tracking: r
        });
      }),
      new R(/- \[deleted]\s+\S+\s*-> (.+)$/, (t, [e]) => {
        t.deleted.push({
          tracking: e
        });
      }),
      new R(
        /\s*([^.]+)\.\.(\S+)\s+(\S+)\s*-> (.+)$/,
        (t, [e, r, s, n]) => {
          t.updated.push({
            name: s,
            tracking: n,
            to: r,
            from: e
          });
        }
      )
    ];
  }
}), $c = {};
q($c, {
  fetchTask: () => zh
});
function $h(t) {
  return /^--upload-pack(=|$)/.test(t);
}
function zh(t, e, r) {
  const s = ["fetch", ...r];
  return t && e && s.push(t, e), s.find($h) ? oe("git.fetch: potential exploit argument blocked.") : {
    commands: s,
    format: "utf-8",
    parser: Wh
  };
}
var Vh = y({
  "src/lib/tasks/fetch.ts"() {
    Uh(), B();
  }
});
function jh(t) {
  return ce({ moves: [] }, zc, t);
}
var zc, Hh = y({
  "src/lib/parsers/parse-move.ts"() {
    C(), zc = [
      new R(/^Renaming (.+) to (.+)$/, (t, [e, r]) => {
        t.moves.push({ from: e, to: r });
      })
    ];
  }
}), Vc = {};
q(Vc, {
  moveTask: () => Gh
});
function Gh(t, e) {
  return {
    commands: ["mv", "-v", ...Me(t), e],
    format: "utf-8",
    parser: jh
  };
}
var Bh = y({
  "src/lib/tasks/move.ts"() {
    Hh(), C();
  }
}), jc = {};
q(jc, {
  pullTask: () => qh
});
function qh(t, e, r) {
  const s = ["pull", ...r];
  return t && e && s.splice(1, 0, t, e), {
    commands: s,
    format: "utf-8",
    parser(n, i) {
      return zn(n, i);
    },
    onError(n, i, a, o) {
      const c = eh(
        Bt(n.stdOut),
        Bt(n.stdErr)
      );
      if (c)
        return o(new Jt(c));
      o(i);
    }
  };
}
var Yh = y({
  "src/lib/tasks/pull.ts"() {
    Ot(), mc(), C();
  }
});
function Zh(t) {
  const e = {};
  return Hc(t, ([r]) => e[r] = { name: r }), Object.values(e);
}
function Jh(t) {
  const e = {};
  return Hc(t, ([r, s, n]) => {
    e.hasOwnProperty(r) || (e[r] = {
      name: r,
      refs: { fetch: "", push: "" }
    }), n && s && (e[r].refs[n.replace(/[^a-z]/g, "")] = s);
  }), Object.values(e);
}
function Hc(t, e) {
  En(t, (r) => e(r.split(/\s+/)));
}
var Kh = y({
  "src/lib/responses/GetRemoteSummary.ts"() {
    C();
  }
}), Gc = {};
q(Gc, {
  addRemoteTask: () => Xh,
  getRemotesTask: () => Qh,
  listRemotesTask: () => em,
  remoteTask: () => tm,
  removeRemoteTask: () => rm
});
function Xh(t, e, r) {
  return ie(["remote", "add", ...r, t, e]);
}
function Qh(t) {
  const e = ["remote"];
  return t && e.push("-v"), {
    commands: e,
    format: "utf-8",
    parser: t ? Jh : Zh
  };
}
function em(t) {
  const e = [...t];
  return e[0] !== "ls-remote" && e.unshift("ls-remote"), ie(e);
}
function tm(t) {
  const e = [...t];
  return e[0] !== "remote" && e.unshift("remote"), ie(e);
}
function rm(t) {
  return ie(["remote", "remove", t]);
}
var sm = y({
  "src/lib/tasks/remote.ts"() {
    Kh(), B();
  }
}), Bc = {};
q(Bc, {
  stashListTask: () => nm
});
function nm(t = {}, e) {
  const r = nc(t), s = ["stash", "list", ...r.commands, ...e], n = ec(
    r.splitter,
    r.fields,
    Ln(s)
  );
  return Zr(s) || {
    commands: s,
    format: "utf-8",
    parser: n
  };
}
var im = y({
  "src/lib/tasks/stash-list.ts"() {
    er(), rc(), $n(), ic();
  }
}), qc = {};
q(qc, {
  addSubModuleTask: () => am,
  initSubModuleTask: () => om,
  subModuleTask: () => Kr,
  updateSubModuleTask: () => cm
});
function am(t, e) {
  return Kr(["add", t, e]);
}
function om(t) {
  return Kr(["init", ...t]);
}
function Kr(t) {
  const e = [...t];
  return e[0] !== "submodule" && e.unshift("submodule"), ie(e);
}
function cm(t) {
  return Kr(["update", ...t]);
}
var um = y({
  "src/lib/tasks/sub-module.ts"() {
    B();
  }
});
function lm(t, e) {
  const r = isNaN(t), s = isNaN(e);
  return r !== s ? r ? 1 : -1 : r ? Yc(t, e) : 0;
}
function Yc(t, e) {
  return t === e ? 0 : t > e ? 1 : -1;
}
function fm(t) {
  return t.trim();
}
function mr(t) {
  return typeof t == "string" && parseInt(t.replace(/^\D+/g, ""), 10) || 0;
}
var Yi, Zc, dm = y({
  "src/lib/responses/TagList.ts"() {
    Yi = class {
      constructor(t, e) {
        this.all = t, this.latest = e;
      }
    }, Zc = function(t, e = !1) {
      const r = t.split(`
`).map(fm).filter(Boolean);
      e || r.sort(function(n, i) {
        const a = n.split("."), o = i.split(".");
        if (a.length === 1 || o.length === 1)
          return lm(mr(a[0]), mr(o[0]));
        for (let c = 0, u = Math.max(a.length, o.length); c < u; c++) {
          const l = Yc(mr(a[c]), mr(o[c]));
          if (l)
            return l;
        }
        return 0;
      });
      const s = e ? r[0] : [...r].reverse().find((n) => n.indexOf(".") >= 0);
      return new Yi(r, s);
    };
  }
}), Jc = {};
q(Jc, {
  addAnnotatedTagTask: () => gm,
  addTagTask: () => mm,
  tagListTask: () => hm
});
function hm(t = []) {
  const e = t.some((r) => /^--sort=/.test(r));
  return {
    format: "utf-8",
    commands: ["tag", "-l", ...t],
    parser(r) {
      return Zc(r, e);
    }
  };
}
function mm(t) {
  return {
    format: "utf-8",
    commands: ["tag", t],
    parser() {
      return { name: t };
    }
  };
}
function gm(t, e) {
  return {
    format: "utf-8",
    commands: ["tag", "-a", "-m", e, t],
    parser() {
      return { name: t };
    }
  };
}
var pm = y({
  "src/lib/tasks/tag.ts"() {
    dm();
  }
}), ym = Ff({
  "src/git.js"(t, e) {
    var { GitExecutor: r } = (vd(), j(Ho)), { SimpleGitApi: s } = (yh(), j(kc)), { Scheduler: n } = (wh(), j(Sc)), { configurationErrorTask: i } = (B(), j(Ys)), {
      asArray: a,
      filterArray: o,
      filterPrimitives: c,
      filterString: u,
      filterStringOrStringArray: l,
      filterType: f,
      getTrailingOptions: d,
      trailingFunctionArgument: h,
      trailingOptionsArgument: m
    } = (C(), j(mo)), { applyPatchTask: T } = (_h(), j(Ic)), {
      branchTask: S,
      branchLocalTask: _,
      deleteBranchesTask: M,
      deleteBranchTask: U
    } = (Mh(), j(xc)), { checkIgnoreTask: re } = (Fh(), j(Ac)), { checkIsRepoTask: K } = (wo(), j(go)), { cloneTask: cr, cloneMirrorTask: Ke } = (Ph(), j(Pc)), { cleanWithOptionsTask: xt, isCleanOptionsArray: De } = (Do(), j(Io)), { diffSummaryTask: Fe } = ($n(), j(sc)), { fetchTask: is } = (Vh(), j($c)), { moveTask: pl } = (Bh(), j(Vc)), { pullTask: yl } = (Yh(), j(jc)), { pushTagsTask: wl } = (wc(), j(yc)), {
      addRemoteTask: vl,
      getRemotesTask: _l,
      listRemotesTask: Tl,
      remoteTask: bl,
      removeRemoteTask: El
    } = (sm(), j(Gc)), { getResetMode: kl, resetTask: Sl } = (zo(), j(Wo)), { stashListTask: Ol } = (im(), j(Bc)), {
      addSubModuleTask: Il,
      initSubModuleTask: Cl,
      subModuleTask: Dl,
      updateSubModuleTask: Rl
    } = (um(), j(qc)), { addAnnotatedTagTask: Ml, addTagTask: Nl, tagListTask: xl } = (pm(), j(Jc)), { straightThroughBufferTask: Fl, straightThroughStringTask: Re } = (B(), j(Ys));
    function E(g, b) {
      this._plugins = b, this._executor = new r(
        g.baseDir,
        new n(g.maxConcurrentProcesses),
        b
      ), this._trimmed = g.trimmed;
    }
    (E.prototype = Object.create(s.prototype)).constructor = E, E.prototype.customBinary = function(g) {
      return this._plugins.reconfigure("binary", g), this;
    }, E.prototype.env = function(g, b) {
      return arguments.length === 1 && typeof g == "object" ? this._executor.env = g : (this._executor.env = this._executor.env || {})[g] = b, this;
    }, E.prototype.stashList = function(g) {
      return this._runTask(
        Ol(
          m(arguments) || {},
          o(g) && g || []
        ),
        h(arguments)
      );
    };
    function ii(g, b, P, se) {
      return typeof P != "string" ? i(`git.${g}() requires a string 'repoPath'`) : b(P, f(se, u), d(arguments));
    }
    E.prototype.clone = function() {
      return this._runTask(
        ii("clone", cr, ...arguments),
        h(arguments)
      );
    }, E.prototype.mirror = function() {
      return this._runTask(
        ii("mirror", Ke, ...arguments),
        h(arguments)
      );
    }, E.prototype.mv = function(g, b) {
      return this._runTask(pl(g, b), h(arguments));
    }, E.prototype.checkoutLatestTag = function(g) {
      var b = this;
      return this.pull(function() {
        b.tags(function(P, se) {
          b.checkout(se.latest, g);
        });
      });
    }, E.prototype.pull = function(g, b, P, se) {
      return this._runTask(
        yl(
          f(g, u),
          f(b, u),
          d(arguments)
        ),
        h(arguments)
      );
    }, E.prototype.fetch = function(g, b) {
      return this._runTask(
        is(
          f(g, u),
          f(b, u),
          d(arguments)
        ),
        h(arguments)
      );
    }, E.prototype.silent = function(g) {
      return console.warn(
        "simple-git deprecation notice: git.silent: logging should be configured using the `debug` library / `DEBUG` environment variable, this will be an error in version 3"
      ), this;
    }, E.prototype.tags = function(g, b) {
      return this._runTask(
        xl(d(arguments)),
        h(arguments)
      );
    }, E.prototype.rebase = function() {
      return this._runTask(
        Re(["rebase", ...d(arguments)]),
        h(arguments)
      );
    }, E.prototype.reset = function(g) {
      return this._runTask(
        Sl(kl(g), d(arguments)),
        h(arguments)
      );
    }, E.prototype.revert = function(g) {
      const b = h(arguments);
      return typeof g != "string" ? this._runTask(i("Commit must be a string"), b) : this._runTask(
        Re(["revert", ...d(arguments, 0, !0), g]),
        b
      );
    }, E.prototype.addTag = function(g) {
      const b = typeof g == "string" ? Nl(g) : i("Git.addTag requires a tag name");
      return this._runTask(b, h(arguments));
    }, E.prototype.addAnnotatedTag = function(g, b) {
      return this._runTask(
        Ml(g, b),
        h(arguments)
      );
    }, E.prototype.deleteLocalBranch = function(g, b, P) {
      return this._runTask(
        U(g, typeof b == "boolean" ? b : !1),
        h(arguments)
      );
    }, E.prototype.deleteLocalBranches = function(g, b, P) {
      return this._runTask(
        M(g, typeof b == "boolean" ? b : !1),
        h(arguments)
      );
    }, E.prototype.branch = function(g, b) {
      return this._runTask(
        S(d(arguments)),
        h(arguments)
      );
    }, E.prototype.branchLocal = function(g) {
      return this._runTask(_(), h(arguments));
    }, E.prototype.raw = function(g) {
      const b = !Array.isArray(g), P = [].slice.call(b ? arguments : g, 0);
      for (let be = 0; be < P.length && b; be++)
        if (!c(P[be])) {
          P.splice(be, P.length - be);
          break;
        }
      P.push(...d(arguments, 0, !0));
      var se = h(arguments);
      return P.length ? this._runTask(Re(P, this._trimmed), se) : this._runTask(
        i("Raw: must supply one or more command to execute"),
        se
      );
    }, E.prototype.submoduleAdd = function(g, b, P) {
      return this._runTask(Il(g, b), h(arguments));
    }, E.prototype.submoduleUpdate = function(g, b) {
      return this._runTask(
        Rl(d(arguments, !0)),
        h(arguments)
      );
    }, E.prototype.submoduleInit = function(g, b) {
      return this._runTask(
        Cl(d(arguments, !0)),
        h(arguments)
      );
    }, E.prototype.subModule = function(g, b) {
      return this._runTask(
        Dl(d(arguments)),
        h(arguments)
      );
    }, E.prototype.listRemote = function() {
      return this._runTask(
        Tl(d(arguments)),
        h(arguments)
      );
    }, E.prototype.addRemote = function(g, b, P) {
      return this._runTask(
        vl(g, b, d(arguments)),
        h(arguments)
      );
    }, E.prototype.removeRemote = function(g, b) {
      return this._runTask(El(g), h(arguments));
    }, E.prototype.getRemotes = function(g, b) {
      return this._runTask(_l(g === !0), h(arguments));
    }, E.prototype.remote = function(g, b) {
      return this._runTask(
        bl(d(arguments)),
        h(arguments)
      );
    }, E.prototype.tag = function(g, b) {
      const P = d(arguments);
      return P[0] !== "tag" && P.unshift("tag"), this._runTask(Re(P), h(arguments));
    }, E.prototype.updateServerInfo = function(g) {
      return this._runTask(
        Re(["update-server-info"]),
        h(arguments)
      );
    }, E.prototype.pushTags = function(g, b) {
      const P = wl(
        { remote: f(g, u) },
        d(arguments)
      );
      return this._runTask(P, h(arguments));
    }, E.prototype.rm = function(g) {
      return this._runTask(
        Re(["rm", "-f", ...a(g)]),
        h(arguments)
      );
    }, E.prototype.rmKeepLocal = function(g) {
      return this._runTask(
        Re(["rm", "--cached", ...a(g)]),
        h(arguments)
      );
    }, E.prototype.catFile = function(g, b) {
      return this._catFile("utf-8", arguments);
    }, E.prototype.binaryCatFile = function() {
      return this._catFile("buffer", arguments);
    }, E.prototype._catFile = function(g, b) {
      var P = h(b), se = ["cat-file"], be = b[0];
      if (typeof be == "string")
        return this._runTask(
          i("Git.catFile: options must be supplied as an array of strings"),
          P
        );
      Array.isArray(be) && se.push.apply(se, be);
      const as = g === "buffer" ? Fl(se) : Re(se);
      return this._runTask(as, P);
    }, E.prototype.diff = function(g, b) {
      const P = u(g) ? i(
        "git.diff: supplying options as a single string is no longer supported, switch to an array of strings"
      ) : Re(["diff", ...d(arguments)]);
      return this._runTask(P, h(arguments));
    }, E.prototype.diffSummary = function() {
      return this._runTask(
        Fe(d(arguments, 1)),
        h(arguments)
      );
    }, E.prototype.applyPatch = function(g) {
      const b = l(g) ? T(a(g), d([].slice.call(arguments, 1))) : i(
        "git.applyPatch requires one or more string patches as the first argument"
      );
      return this._runTask(b, h(arguments));
    }, E.prototype.revparse = function() {
      const g = ["rev-parse", ...d(arguments, !0)];
      return this._runTask(
        Re(g, !0),
        h(arguments)
      );
    }, E.prototype.clean = function(g, b, P) {
      const se = De(g), be = se && g.join("") || f(g, u) || "", as = d([].slice.call(arguments, se ? 1 : 0));
      return this._runTask(
        xt(be, as),
        h(arguments)
      );
    }, E.prototype.exec = function(g) {
      const b = {
        commands: [],
        format: "utf-8",
        parser() {
          typeof g == "function" && g();
        }
      };
      return this._runTask(b);
    }, E.prototype.clearQueue = function() {
      return this;
    }, E.prototype.checkIgnore = function(g, b) {
      return this._runTask(
        re(a(f(g, l, []))),
        h(arguments)
      );
    }, E.prototype.checkIsRepo = function(g, b) {
      return this._runTask(
        K(f(g, u)),
        h(arguments)
      );
    }, e.exports = E;
  }
});
Zt();
Je();
var wm = class extends Ue {
  constructor(t, e) {
    super(void 0, e), this.config = t;
  }
};
Je();
Je();
var Pe = class extends Ue {
  constructor(t, e, r) {
    super(t, r), this.task = t, this.plugin = e, Object.setPrototypeOf(this, new.target.prototype);
  }
};
Ot();
Ka();
wo();
Do();
No();
Fo();
Po();
zo();
function vm(t) {
  return t ? [{
    type: "spawn.before",
    action(s, n) {
      t.aborted && n.kill(new Pe(void 0, "abort", "Abort already signaled"));
    }
  }, {
    type: "spawn.after",
    action(s, n) {
      function i() {
        n.kill(new Pe(void 0, "abort", "Abort signal received"));
      }
      t.addEventListener("abort", i), n.spawned.on("close", () => t.removeEventListener("abort", i));
    }
  }] : void 0;
}
function _m(t) {
  return typeof t == "string" && t.trim().toLowerCase() === "-c";
}
function Tm(t, e) {
  if (_m(t) && /^\s*protocol(.[a-z]+)?.allow/.test(e))
    throw new Pe(
      void 0,
      "unsafe",
      "Configuring protocol.allow is not permitted without enabling allowUnsafeExtProtocol"
    );
}
function bm(t, e) {
  if (/^\s*--(upload|receive)-pack/.test(t))
    throw new Pe(
      void 0,
      "unsafe",
      "Use of --upload-pack or --receive-pack is not permitted without enabling allowUnsafePack"
    );
  if (e === "clone" && /^\s*-u\b/.test(t))
    throw new Pe(
      void 0,
      "unsafe",
      "Use of clone with option -u is not permitted without enabling allowUnsafePack"
    );
  if (e === "push" && /^\s*--exec\b/.test(t))
    throw new Pe(
      void 0,
      "unsafe",
      "Use of push with option --exec is not permitted without enabling allowUnsafePack"
    );
}
function Em({
  allowUnsafeProtocolOverride: t = !1,
  allowUnsafePack: e = !1
} = {}) {
  return {
    type: "spawn.args",
    action(r, s) {
      return r.forEach((n, i) => {
        const a = i < r.length ? r[i + 1] : "";
        t || Tm(n, a), e || bm(n, s.method);
      }), r;
    }
  };
}
C();
function km(t) {
  const e = Gt(t, "-c");
  return {
    type: "spawn.args",
    action(r) {
      return [...e, ...r];
    }
  };
}
C();
var Zi = yt().promise;
function Sm({
  onClose: t = !0,
  onExit: e = 50
} = {}) {
  function r() {
    let n = -1;
    const i = {
      close: yt(),
      closeTimeout: yt(),
      exit: yt(),
      exitTimeout: yt()
    }, a = Promise.race([
      t === !1 ? Zi : i.closeTimeout.promise,
      e === !1 ? Zi : i.exitTimeout.promise
    ]);
    return s(t, i.close, i.closeTimeout), s(e, i.exit, i.exitTimeout), {
      close(o) {
        n = o, i.close.done();
      },
      exit(o) {
        n = o, i.exit.done();
      },
      get exitCode() {
        return n;
      },
      result: a
    };
  }
  function s(n, i, a) {
    n !== !1 && (n === !0 ? i.promise : i.promise.then(() => Vs(n))).then(a.done);
  }
  return {
    type: "spawn.after",
    async action(n, { spawned: i, close: a }) {
      var l, f;
      const o = r();
      let c = !0, u = () => void (c = !1);
      (l = i.stdout) == null || l.on("data", u), (f = i.stderr) == null || f.on("data", u), i.on("error", u), i.on("close", (d) => o.close(d)), i.on("exit", (d) => o.exit(d));
      try {
        await o.result, c && await Vs(50), a(o.exitCode);
      } catch (d) {
        a(o.exitCode, d);
      }
    }
  };
}
C();
var Om = "Invalid value supplied for custom binary, requires a single string or an array containing either one or two strings", Ji = "Invalid value supplied for custom binary, restricted characters must be removed or supply the unsafe.allowUnsafeCustomBinary option";
function Im(t) {
  return !t || !/^([a-z]:)?([a-z0-9/.\\_-]+)$/i.test(t);
}
function Ki(t, e) {
  if (t.length < 1 || t.length > 2)
    throw new Pe(void 0, "binary", Om);
  if (t.some(Im))
    if (e)
      console.warn(Ji);
    else
      throw new Pe(void 0, "binary", Ji);
  const [s, n] = t;
  return {
    binary: s,
    prefix: n
  };
}
function Cm(t, e = ["git"], r = !1) {
  let s = Ki(Me(e), r);
  t.on("binary", (n) => {
    s = Ki(Me(n), r);
  }), t.append("spawn.binary", () => s.binary), t.append("spawn.args", (n) => s.prefix ? [s.prefix, ...n] : n);
}
Je();
function Dm(t) {
  return !!(t.exitCode && t.stdErr.length);
}
function Rm(t) {
  return Buffer.concat([...t.stdOut, ...t.stdErr]);
}
function Mm(t = !1, e = Dm, r = Rm) {
  return (s, n) => !t && s || !e(n) ? s : r(n);
}
function Xi(t) {
  return {
    type: "task.error",
    action(e, r) {
      const s = t(e.error, {
        stdErr: r.stdErr,
        stdOut: r.stdOut,
        exitCode: r.exitCode
      });
      return Buffer.isBuffer(s) ? { error: new Ue(void 0, s.toString("utf-8")) } : {
        error: s
      };
    }
  };
}
C();
var Nm = class {
  constructor() {
    this.plugins = /* @__PURE__ */ new Set(), this.events = new ff();
  }
  on(t, e) {
    this.events.on(t, e);
  }
  reconfigure(t, e) {
    this.events.emit(t, e);
  }
  append(t, e) {
    const r = x(this.plugins, { type: t, action: e });
    return () => this.plugins.delete(r);
  }
  add(t) {
    const e = [];
    return Me(t).forEach((r) => r && this.plugins.add(x(e, r))), () => {
      e.forEach((r) => this.plugins.delete(r));
    };
  }
  exec(t, e, r) {
    let s = e;
    const n = Object.freeze(Object.create(r));
    for (const i of this.plugins)
      i.type === t && (s = i.action(s, n));
    return s;
  }
};
C();
function xm(t) {
  const e = "--progress", r = ["checkout", "clone", "fetch", "pull", "push"];
  return [{
    type: "spawn.args",
    action(i, a) {
      return r.includes(a.method) ? so(i, e) : i;
    }
  }, {
    type: "spawn.after",
    action(i, a) {
      var o;
      a.commands.includes(e) && ((o = a.spawned.stderr) == null || o.on("data", (c) => {
        const u = /^([\s\S]+?):\s*(\d+)% \((\d+)\/(\d+)\)/.exec(c.toString("utf8"));
        u && t({
          method: a.method,
          stage: Fm(u[1]),
          progress: W(u[2]),
          processed: W(u[3]),
          total: W(u[4])
        });
      }));
    }
  }];
}
function Fm(t) {
  return String(t.toLowerCase().split(" ", 1)) || "unknown";
}
C();
function Lm(t) {
  const e = ao(t, ["uid", "gid"]);
  return {
    type: "spawn.options",
    action(r) {
      return { ...e, ...r };
    }
  };
}
function Am({
  block: t,
  stdErr: e = !0,
  stdOut: r = !0
}) {
  if (t > 0)
    return {
      type: "spawn.after",
      action(s, n) {
        var u, l;
        let i;
        function a() {
          i && clearTimeout(i), i = setTimeout(c, t);
        }
        function o() {
          var f, d;
          (f = n.spawned.stdout) == null || f.off("data", a), (d = n.spawned.stderr) == null || d.off("data", a), n.spawned.off("exit", o), n.spawned.off("close", o), i && clearTimeout(i);
        }
        function c() {
          o(), n.kill(new Pe(void 0, "timeout", "block timeout reached"));
        }
        r && ((u = n.spawned.stdout) == null || u.on("data", a)), e && ((l = n.spawned.stderr) == null || l.on("data", a)), n.spawned.on("exit", o), n.spawned.on("close", o), a();
      }
    };
}
Zt();
function Pm() {
  return {
    type: "spawn.args",
    action(t) {
      const e = [];
      let r;
      function s(n) {
        (r = r || []).push(...n);
      }
      for (let n = 0; n < t.length; n++) {
        const i = t[n];
        if (Nr(i)) {
          s(bi(i));
          continue;
        }
        if (i === "--") {
          s(
            t.slice(n + 1).flatMap((a) => Nr(a) && bi(a) || a)
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
var Wm = ym();
function Um(t, e) {
  var n;
  const r = new Nm(), s = fo(
    t && (typeof t == "string" ? { baseDir: t } : t) || {},
    e
  );
  if (!kn(s.baseDir))
    throw new wm(
      s,
      "Cannot use simple-git on a directory that does not exist"
    );
  return Array.isArray(s.config) && r.add(km(s.config)), r.add(Em(s.unsafe)), r.add(Pm()), r.add(Sm(s.completion)), s.abort && r.add(vm(s.abort)), s.progress && r.add(xm(s.progress)), s.timeout && r.add(Am(s.timeout)), s.spawnOptions && r.add(Lm(s.spawnOptions)), r.add(Xi(Mm(!0))), s.errors && r.add(Xi(s.errors)), Cm(r, s.binary, (n = s.unsafe) == null ? void 0 : n.allowUnsafeCustomBinary), new Wm(s, r);
}
Ot();
var ws = Um;
const he = {
  FILE_TYPE: "files",
  DIR_TYPE: "directories",
  FILE_DIR_TYPE: "files_directories",
  EVERYTHING_TYPE: "all"
}, tn = {
  root: ".",
  fileFilter: (t) => !0,
  directoryFilter: (t) => !0,
  type: he.FILE_TYPE,
  lstat: !1,
  depth: 2147483648,
  alwaysStat: !1,
  highWaterMark: 4096
};
Object.freeze(tn);
const Kc = "READDIRP_RECURSIVE_ERROR", $m = /* @__PURE__ */ new Set(["ENOENT", "EPERM", "EACCES", "ELOOP", Kc]), Qi = [
  he.DIR_TYPE,
  he.EVERYTHING_TYPE,
  he.FILE_DIR_TYPE,
  he.FILE_TYPE
], zm = /* @__PURE__ */ new Set([
  he.DIR_TYPE,
  he.EVERYTHING_TYPE,
  he.FILE_DIR_TYPE
]), Vm = /* @__PURE__ */ new Set([
  he.EVERYTHING_TYPE,
  he.FILE_DIR_TYPE,
  he.FILE_TYPE
]), jm = (t) => $m.has(t.code), Hm = process.platform === "win32", ea = (t) => !0, ta = (t) => {
  if (t === void 0)
    return ea;
  if (typeof t == "function")
    return t;
  if (typeof t == "string") {
    const e = t.trim();
    return (r) => r.basename === e;
  }
  if (Array.isArray(t)) {
    const e = t.map((r) => r.trim());
    return (r) => e.some((s) => r.basename === s);
  }
  return ea;
};
class Gm extends mf {
  constructor(e = {}) {
    super({
      objectMode: !0,
      autoDestroy: !0,
      highWaterMark: e.highWaterMark
    });
    const r = { ...tn, ...e }, { root: s, type: n } = r;
    this._fileFilter = ta(r.fileFilter), this._directoryFilter = ta(r.directoryFilter);
    const i = r.lstat ? ui : ql;
    Hm ? this._stat = (a) => i(a, { bigint: !0 }) : this._stat = i, this._maxDepth = r.depth ?? tn.depth, this._wantsDir = n ? zm.has(n) : !1, this._wantsFile = n ? Vm.has(n) : !1, this._wantsEverything = n === he.EVERYTHING_TYPE, this._root = oi(s), this._isDirent = !r.alwaysStat, this._statsProp = this._isDirent ? "dirent" : "stats", this._rdOptions = { encoding: "utf8", withFileTypes: this._isDirent }, this.parents = [this._exploreDir(s, 1)], this.reading = !1, this.parent = void 0;
  }
  async _read(e) {
    if (!this.reading) {
      this.reading = !0;
      try {
        for (; !this.destroyed && e > 0; ) {
          const r = this.parent, s = r && r.files;
          if (s && s.length > 0) {
            const { path: n, depth: i } = r, a = s.splice(0, e).map((c) => this._formatEntry(c, n)), o = await Promise.all(a);
            for (const c of o) {
              if (!c)
                continue;
              if (this.destroyed)
                return;
              const u = await this._getEntryType(c);
              u === "directory" && this._directoryFilter(c) ? (i <= this._maxDepth && this.parents.push(this._exploreDir(c.fullPath, i + 1)), this._wantsDir && (this.push(c), e--)) : (u === "file" || this._includeAsFile(c)) && this._fileFilter(c) && this._wantsFile && (this.push(c), e--);
            }
          } else {
            const n = this.parents.pop();
            if (!n) {
              this.push(null);
              break;
            }
            if (this.parent = await n, this.destroyed)
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
    let s;
    try {
      s = await Yl(e, this._rdOptions);
    } catch (n) {
      this._onError(n);
    }
    return { files: s, depth: r, path: e };
  }
  async _formatEntry(e, r) {
    let s;
    const n = this._isDirent ? e.name : e;
    try {
      const i = oi(Vl(r, n));
      s = { path: jl(this._root, i), fullPath: i, basename: n }, s[this._statsProp] = this._isDirent ? e : await this._stat(i);
    } catch (i) {
      this._onError(i);
      return;
    }
    return s;
  }
  _onError(e) {
    jm(e) && !this.destroyed ? this.emit("warn", e) : this.destroy(e);
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
      const s = e.fullPath;
      try {
        const n = await Zl(s), i = await ui(n);
        if (i.isFile())
          return "file";
        if (i.isDirectory()) {
          const a = n.length;
          if (s.startsWith(n) && s.substr(a, 1) === Hl) {
            const o = new Error(`Circular symlink detected: "${s}" points to "${n}"`);
            return o.code = Kc, this._onError(o);
          }
          return "directory";
        }
      } catch (n) {
        return this._onError(n), "";
      }
    }
  }
  _includeAsFile(e) {
    const r = e && e[this._statsProp];
    return r && this._wantsEverything && !r.isDirectory();
  }
}
function Bm(t, e = {}) {
  let r = e.entryType || e.type;
  if (r === "both" && (r = he.FILE_DIR_TYPE), r && (e.type = r), t) {
    if (typeof t != "string")
      throw new TypeError("readdirp: root argument must be a string. Usage: readdirp(root, options)");
    if (r && !Qi.includes(r))
      throw new Error(`readdirp: Invalid type passed. Use one of ${Qi.join(", ")}`);
  } else throw new Error("readdirp: root argument is required. Usage: readdirp(root, options)");
  return e.root = t, new Gm(e);
}
const qm = "data", Xc = "end", Ym = "close", Hn = () => {
}, Xr = process.platform, Qc = Xr === "win32", Zm = Xr === "darwin", Jm = Xr === "linux", Km = Xr === "freebsd", Xm = lf() === "OS400", H = {
  ALL: "all",
  READY: "ready",
  ADD: "add",
  CHANGE: "change",
  ADD_DIR: "addDir",
  UNLINK: "unlink",
  UNLINK_DIR: "unlinkDir",
  RAW: "raw",
  ERROR: "error"
}, Oe = H, Qm = "watch", eg = { lstat: Ql, stat: yn }, ct = "listeners", Or = "errHandlers", vt = "rawEmitters", tg = [ct, Or, vt], rg = /* @__PURE__ */ new Set([
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
]), sg = (t) => rg.has(k.extname(t).slice(1).toLowerCase()), rn = (t, e) => {
  t instanceof Set ? t.forEach(e) : e(t);
}, $t = (t, e, r) => {
  let s = t[e];
  s instanceof Set || (t[e] = s = /* @__PURE__ */ new Set([s])), s.add(r);
}, ng = (t) => (e) => {
  const r = t[e];
  r instanceof Set ? r.clear() : delete t[e];
}, zt = (t, e, r) => {
  const s = t[e];
  s instanceof Set ? s.delete(r) : s === r && delete t[e];
}, eu = (t) => t instanceof Set ? t.size === 0 : !t, Ir = /* @__PURE__ */ new Map();
function ra(t, e, r, s, n) {
  const i = (a, o) => {
    r(t), n(a, o, { watchedPath: t }), o && t !== o && Cr(k.resolve(t, o), ct, k.join(t, o));
  };
  try {
    return af(t, {
      persistent: e.persistent
    }, i);
  } catch (a) {
    s(a);
    return;
  }
}
const Cr = (t, e, r, s, n) => {
  const i = Ir.get(t);
  i && rn(i[e], (a) => {
    a(r, s, n);
  });
}, ig = (t, e, r, s) => {
  const { listener: n, errHandler: i, rawEmitter: a } = s;
  let o = Ir.get(e), c;
  if (!r.persistent)
    return c = ra(t, r, n, i, a), c ? c.close.bind(c) : void 0;
  if (o)
    $t(o, ct, n), $t(o, Or, i), $t(o, vt, a);
  else {
    if (c = ra(
      t,
      r,
      Cr.bind(null, e, ct),
      i,
      // no need to use broadcast here
      Cr.bind(null, e, vt)
    ), !c)
      return;
    c.on(Oe.ERROR, async (u) => {
      const l = Cr.bind(null, e, Or);
      if (o && (o.watcherUnusable = !0), Qc && u.code === "EPERM")
        try {
          await (await ef(t, "r")).close(), l(u);
        } catch {
        }
      else
        l(u);
    }), o = {
      listeners: n,
      errHandlers: i,
      rawEmitters: a,
      watcher: c
    }, Ir.set(e, o);
  }
  return () => {
    zt(o, ct, n), zt(o, Or, i), zt(o, vt, a), eu(o.listeners) && (o.watcher.close(), Ir.delete(e), tg.forEach(ng(o)), o.watcher = void 0, Object.freeze(o));
  };
}, vs = /* @__PURE__ */ new Map(), ag = (t, e, r, s) => {
  const { listener: n, rawEmitter: i } = s;
  let a = vs.get(e);
  const o = a && a.options;
  return o && (o.persistent < r.persistent || o.interval > r.interval) && (fi(e), a = void 0), a ? ($t(a, ct, n), $t(a, vt, i)) : (a = {
    listeners: n,
    rawEmitters: i,
    options: r,
    watcher: nf(e, r, (c, u) => {
      rn(a.rawEmitters, (f) => {
        f(Oe.CHANGE, e, { curr: c, prev: u });
      });
      const l = c.mtimeMs;
      (c.size !== u.size || l > u.mtimeMs || l === 0) && rn(a.listeners, (f) => f(t, c));
    })
  }, vs.set(e, a)), () => {
    zt(a, ct, n), zt(a, vt, i), eu(a.listeners) && (vs.delete(e), fi(e), a.options = a.watcher = void 0, Object.freeze(a));
  };
};
class og {
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
    const s = this.fsw.options, n = k.dirname(e), i = k.basename(e);
    this.fsw._getWatchedDir(n).add(i);
    const o = k.resolve(e), c = {
      persistent: s.persistent
    };
    r || (r = Hn);
    let u;
    if (s.usePolling) {
      const l = s.interval !== s.binaryInterval;
      c.interval = l && sg(i) ? s.binaryInterval : s.interval, u = ag(e, o, c, {
        listener: r,
        rawEmitter: this.fsw._emitRaw
      });
    } else
      u = ig(e, o, c, {
        listener: r,
        errHandler: this._boundHandleError,
        rawEmitter: this.fsw._emitRaw
      });
    return u;
  }
  /**
   * Watch a file and emit add event if warranted.
   * @returns closer for the watcher instance
   */
  _handleFile(e, r, s) {
    if (this.fsw.closed)
      return;
    const n = k.dirname(e), i = k.basename(e), a = this.fsw._getWatchedDir(n);
    let o = r;
    if (a.has(i))
      return;
    const c = async (l, f) => {
      if (this.fsw._throttle(Qm, e, 5)) {
        if (!f || f.mtimeMs === 0)
          try {
            const d = await yn(e);
            if (this.fsw.closed)
              return;
            const h = d.atimeMs, m = d.mtimeMs;
            if ((!h || h <= m || m !== o.mtimeMs) && this.fsw._emit(Oe.CHANGE, e, d), (Zm || Jm || Km) && o.ino !== d.ino) {
              this.fsw._closeFile(l), o = d;
              const T = this._watchWithNodeFs(e, c);
              T && this.fsw._addPathCloser(l, T);
            } else
              o = d;
          } catch {
            this.fsw._remove(n, i);
          }
        else if (a.has(i)) {
          const d = f.atimeMs, h = f.mtimeMs;
          (!d || d <= h || h !== o.mtimeMs) && this.fsw._emit(Oe.CHANGE, e, f), o = f;
        }
      }
    }, u = this._watchWithNodeFs(e, c);
    if (!(s && this.fsw.options.ignoreInitial) && this.fsw._isntIgnored(e)) {
      if (!this.fsw._throttle(Oe.ADD, e, 0))
        return;
      this.fsw._emit(Oe.ADD, e, r);
    }
    return u;
  }
  /**
   * Handle symlinks encountered while reading a dir.
   * @param entry returned by readdirp
   * @param directory path of dir being read
   * @param path of this item
   * @param item basename of this item
   * @returns true if no more processing is needed for this entry.
   */
  async _handleSymlink(e, r, s, n) {
    if (this.fsw.closed)
      return;
    const i = e.fullPath, a = this.fsw._getWatchedDir(r);
    if (!this.fsw.options.followSymlinks) {
      this.fsw._incrReadyCount();
      let o;
      try {
        o = await os(s);
      } catch {
        return this.fsw._emitReady(), !0;
      }
      return this.fsw.closed ? void 0 : (a.has(n) ? this.fsw._symlinkPaths.get(i) !== o && (this.fsw._symlinkPaths.set(i, o), this.fsw._emit(Oe.CHANGE, s, e.stats)) : (a.add(n), this.fsw._symlinkPaths.set(i, o), this.fsw._emit(Oe.ADD, s, e.stats)), this.fsw._emitReady(), !0);
    }
    if (this.fsw._symlinkPaths.has(i))
      return !0;
    this.fsw._symlinkPaths.set(i, !0);
  }
  _handleRead(e, r, s, n, i, a, o) {
    if (e = k.join(e, ""), o = this.fsw._throttle("readdir", e, 1e3), !o)
      return;
    const c = this.fsw._getWatchedDir(s.path), u = /* @__PURE__ */ new Set();
    let l = this.fsw._readdirp(e, {
      fileFilter: (f) => s.filterPath(f),
      directoryFilter: (f) => s.filterDir(f)
    });
    if (l)
      return l.on(qm, async (f) => {
        if (this.fsw.closed) {
          l = void 0;
          return;
        }
        const d = f.path;
        let h = k.join(e, d);
        if (u.add(d), !(f.stats.isSymbolicLink() && await this._handleSymlink(f, e, h, d))) {
          if (this.fsw.closed) {
            l = void 0;
            return;
          }
          (d === n || !n && !c.has(d)) && (this.fsw._incrReadyCount(), h = k.join(i, k.relative(i, h)), this._addToNodeFs(h, r, s, a + 1));
        }
      }).on(Oe.ERROR, this._boundHandleError), new Promise((f, d) => {
        if (!l)
          return d();
        l.once(Xc, () => {
          if (this.fsw.closed) {
            l = void 0;
            return;
          }
          const h = o ? o.clear() : !1;
          f(void 0), c.getChildren().filter((m) => m !== e && !u.has(m)).forEach((m) => {
            this.fsw._remove(e, m);
          }), l = void 0, h && this._handleRead(e, !1, s, n, i, a, o);
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
  async _handleDir(e, r, s, n, i, a, o) {
    const c = this.fsw._getWatchedDir(k.dirname(e)), u = c.has(k.basename(e));
    !(s && this.fsw.options.ignoreInitial) && !i && !u && this.fsw._emit(Oe.ADD_DIR, e, r), c.add(k.basename(e)), this.fsw._getWatchedDir(e);
    let l, f;
    const d = this.fsw.options.depth;
    if ((d == null || n <= d) && !this.fsw._symlinkPaths.has(o)) {
      if (!i && (await this._handleRead(e, s, a, i, e, n, l), this.fsw.closed))
        return;
      f = this._watchWithNodeFs(e, (h, m) => {
        m && m.mtimeMs === 0 || this._handleRead(h, !1, a, i, e, n, l);
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
  async _addToNodeFs(e, r, s, n, i) {
    const a = this.fsw._emitReady;
    if (this.fsw._isIgnored(e) || this.fsw.closed)
      return a(), !1;
    const o = this.fsw._getWatchHelpers(e);
    s && (o.filterPath = (c) => s.filterPath(c), o.filterDir = (c) => s.filterDir(c));
    try {
      const c = await eg[o.statMethod](o.watchPath);
      if (this.fsw.closed)
        return;
      if (this.fsw._isIgnored(o.watchPath, c))
        return a(), !1;
      const u = this.fsw.options.followSymlinks;
      let l;
      if (c.isDirectory()) {
        const f = k.resolve(e), d = u ? await os(e) : e;
        if (this.fsw.closed || (l = await this._handleDir(o.watchPath, c, r, n, i, o, d), this.fsw.closed))
          return;
        f !== d && d !== void 0 && this.fsw._symlinkPaths.set(f, d);
      } else if (c.isSymbolicLink()) {
        const f = u ? await os(e) : e;
        if (this.fsw.closed)
          return;
        const d = k.dirname(o.watchPath);
        if (this.fsw._getWatchedDir(d).add(o.watchPath), this.fsw._emit(Oe.ADD, o.watchPath, c), l = await this._handleDir(d, c, r, n, e, o, f), this.fsw.closed)
          return;
        f !== void 0 && this.fsw._symlinkPaths.set(k.resolve(e), f);
      } else
        l = this._handleFile(o.watchPath, c, r);
      return a(), l && this.fsw._addPathCloser(e, l), !1;
    } catch (c) {
      if (this.fsw._handleError(c))
        return a(), e;
    }
  }
}
/*! chokidar - MIT License (c) 2012 Paul Miller (paulmillr.com) */
const _s = "/", cg = "//", tu = ".", ug = "..", lg = "string", fg = /\\/g, sa = /\/\//, dg = /\..*\.(sw[px])$|~$|\.subl.*\.tmp/, hg = /^\.[/\\]/;
function Ar(t) {
  return Array.isArray(t) ? t : [t];
}
const Ts = (t) => typeof t == "object" && t !== null && !(t instanceof RegExp);
function mg(t) {
  return typeof t == "function" ? t : typeof t == "string" ? (e) => t === e : t instanceof RegExp ? (e) => t.test(e) : typeof t == "object" && t !== null ? (e) => {
    if (t.path === e)
      return !0;
    if (t.recursive) {
      const r = k.relative(t.path, e);
      return r ? !r.startsWith("..") && !k.isAbsolute(r) : !1;
    }
    return !1;
  } : () => !1;
}
function gg(t) {
  if (typeof t != "string")
    throw new Error("string expected");
  t = k.normalize(t), t = t.replace(/\\/g, "/");
  let e = !1;
  t.startsWith("//") && (e = !0);
  const r = /\/\//;
  for (; t.match(r); )
    t = t.replace(r, "/");
  return e && (t = "/" + t), t;
}
function pg(t, e, r) {
  const s = gg(e);
  for (let n = 0; n < t.length; n++) {
    const i = t[n];
    if (i(s, r))
      return !0;
  }
  return !1;
}
function yg(t, e) {
  if (t == null)
    throw new TypeError("anymatch: specify first argument");
  const s = Ar(t).map((n) => mg(n));
  return (n, i) => pg(s, n, i);
}
const na = (t) => {
  const e = Ar(t).flat();
  if (!e.every((r) => typeof r === lg))
    throw new TypeError(`Non-string provided as watch path: ${e}`);
  return e.map(ru);
}, ia = (t) => {
  let e = t.replace(fg, _s), r = !1;
  for (e.startsWith(cg) && (r = !0); e.match(sa); )
    e = e.replace(sa, _s);
  return r && (e = _s + e), e;
}, ru = (t) => ia(k.normalize(ia(t))), aa = (t = "") => (e) => typeof e == "string" ? ru(k.isAbsolute(e) ? e : k.join(t, e)) : e, wg = (t, e) => k.isAbsolute(t) ? t : k.join(e, t), vg = Object.freeze(/* @__PURE__ */ new Set());
class _g {
  constructor(e, r) {
    this.path = e, this._removeWatcher = r, this.items = /* @__PURE__ */ new Set();
  }
  add(e) {
    const { items: r } = this;
    r && e !== tu && e !== ug && r.add(e);
  }
  async remove(e) {
    const { items: r } = this;
    if (!r || (r.delete(e), r.size > 0))
      return;
    const s = this.path;
    try {
      await tf(s);
    } catch {
      this._removeWatcher && this._removeWatcher(k.dirname(s), k.basename(s));
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
    this.items.clear(), this.path = "", this._removeWatcher = Hn, this.items = vg, Object.freeze(this);
  }
}
const Tg = "stat", bg = "lstat";
class Eg {
  constructor(e, r, s) {
    this.fsw = s;
    const n = e;
    this.path = e = e.replace(hg, ""), this.watchPath = n, this.fullWatchPath = k.resolve(n), this.dirParts = [], this.dirParts.forEach((i) => {
      i.length > 1 && i.pop();
    }), this.followSymlinks = r, this.statMethod = r ? Tg : bg;
  }
  entryPath(e) {
    return k.join(this.watchPath, k.relative(this.watchPath, e.fullPath));
  }
  filterPath(e) {
    const { stats: r } = e;
    if (r && r.isSymbolicLink())
      return this.filterDir(e);
    const s = this.entryPath(e);
    return this.fsw._isntIgnored(s, r) && this.fsw._hasReadPermissions(r);
  }
  filterDir(e) {
    return this.fsw._isntIgnored(this.entryPath(e), e.stats);
  }
}
class su extends hf {
  // Not indenting methods for history sake; for now.
  constructor(e = {}) {
    super(), this.closed = !1, this._closers = /* @__PURE__ */ new Map(), this._ignoredPaths = /* @__PURE__ */ new Set(), this._throttled = /* @__PURE__ */ new Map(), this._streams = /* @__PURE__ */ new Set(), this._symlinkPaths = /* @__PURE__ */ new Map(), this._watched = /* @__PURE__ */ new Map(), this._pendingWrites = /* @__PURE__ */ new Map(), this._pendingUnlinks = /* @__PURE__ */ new Map(), this._readyCount = 0, this._readyEmitted = !1;
    const r = e.awaitWriteFinish, s = { stabilityThreshold: 2e3, pollInterval: 100 }, n = {
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
      ignored: e.ignored ? Ar(e.ignored) : Ar([]),
      awaitWriteFinish: r === !0 ? s : typeof r == "object" ? { ...s, ...r } : !1
    };
    Xm && (n.usePolling = !0), n.atomic === void 0 && (n.atomic = !n.usePolling);
    const i = process.env.CHOKIDAR_USEPOLLING;
    if (i !== void 0) {
      const c = i.toLowerCase();
      c === "false" || c === "0" ? n.usePolling = !1 : c === "true" || c === "1" ? n.usePolling = !0 : n.usePolling = !!c;
    }
    const a = process.env.CHOKIDAR_INTERVAL;
    a && (n.interval = Number.parseInt(a, 10));
    let o = 0;
    this._emitReady = () => {
      o++, o >= this._readyCount && (this._emitReady = Hn, this._readyEmitted = !0, process.nextTick(() => this.emit(H.READY)));
    }, this._emitRaw = (...c) => this.emit(H.RAW, ...c), this._boundRemove = this._remove.bind(this), this.options = n, this._nodeFsHandler = new og(this), Object.freeze(n);
  }
  _addIgnoredPath(e) {
    if (Ts(e)) {
      for (const r of this._ignoredPaths)
        if (Ts(r) && r.path === e.path && r.recursive === e.recursive)
          return;
    }
    this._ignoredPaths.add(e);
  }
  _removeIgnoredPath(e) {
    if (this._ignoredPaths.delete(e), typeof e == "string")
      for (const r of this._ignoredPaths)
        Ts(r) && r.path === e && this._ignoredPaths.delete(r);
  }
  // Public methods
  /**
   * Adds paths to be watched on an existing FSWatcher instance.
   * @param paths_ file or file list. Other arguments are unused
   */
  add(e, r, s) {
    const { cwd: n } = this.options;
    this.closed = !1, this._closePromise = void 0;
    let i = na(e);
    return n && (i = i.map((a) => wg(a, n))), i.forEach((a) => {
      this._removeIgnoredPath(a);
    }), this._userIgnored = void 0, this._readyCount || (this._readyCount = 0), this._readyCount += i.length, Promise.all(i.map(async (a) => {
      const o = await this._nodeFsHandler._addToNodeFs(a, !s, void 0, 0, r);
      return o && this._emitReady(), o;
    })).then((a) => {
      this.closed || a.forEach((o) => {
        o && this.add(k.dirname(o), k.basename(r || o));
      });
    }), this;
  }
  /**
   * Close watchers or start ignoring events from specified paths.
   */
  unwatch(e) {
    if (this.closed)
      return this;
    const r = na(e), { cwd: s } = this.options;
    return r.forEach((n) => {
      !k.isAbsolute(n) && !this._closers.has(n) && (s && (n = k.join(s, n)), n = k.resolve(n)), this._closePath(n), this._addIgnoredPath(n), this._watched.has(n) && this._addIgnoredPath({
        path: n,
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
    return this._closers.forEach((r) => r.forEach((s) => {
      const n = s();
      n instanceof Promise && e.push(n);
    })), this._streams.forEach((r) => r.destroy()), this._userIgnored = void 0, this._readyCount = 0, this._readyEmitted = !1, this._watched.forEach((r) => r.dispose()), this._closers.clear(), this._watched.clear(), this._streams.clear(), this._symlinkPaths.clear(), this._throttled.clear(), this._closePromise = e.length ? Promise.all(e).then(() => {
    }) : Promise.resolve(), this._closePromise;
  }
  /**
   * Expose list of watched paths
   * @returns for chaining
   */
  getWatched() {
    const e = {};
    return this._watched.forEach((r, s) => {
      const i = (this.options.cwd ? k.relative(this.options.cwd, s) : s) || tu;
      e[i] = r.getChildren().sort();
    }), e;
  }
  emitWithAll(e, r) {
    this.emit(e, ...r), e !== H.ERROR && this.emit(H.ALL, e, ...r);
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
  async _emit(e, r, s) {
    if (this.closed)
      return;
    const n = this.options;
    Qc && (r = k.normalize(r)), n.cwd && (r = k.relative(n.cwd, r));
    const i = [r];
    s != null && i.push(s);
    const a = n.awaitWriteFinish;
    let o;
    if (a && (o = this._pendingWrites.get(r)))
      return o.lastChange = /* @__PURE__ */ new Date(), this;
    if (n.atomic) {
      if (e === H.UNLINK)
        return this._pendingUnlinks.set(r, [e, ...i]), setTimeout(() => {
          this._pendingUnlinks.forEach((c, u) => {
            this.emit(...c), this.emit(H.ALL, ...c), this._pendingUnlinks.delete(u);
          });
        }, typeof n.atomic == "number" ? n.atomic : 100), this;
      e === H.ADD && this._pendingUnlinks.has(r) && (e = H.CHANGE, this._pendingUnlinks.delete(r));
    }
    if (a && (e === H.ADD || e === H.CHANGE) && this._readyEmitted) {
      const c = (u, l) => {
        u ? (e = H.ERROR, i[0] = u, this.emitWithAll(e, i)) : l && (i.length > 1 ? i[1] = l : i.push(l), this.emitWithAll(e, i));
      };
      return this._awaitWriteFinish(r, a.stabilityThreshold, e, c), this;
    }
    if (e === H.CHANGE && !this._throttle(H.CHANGE, r, 50))
      return this;
    if (n.alwaysStat && s === void 0 && (e === H.ADD || e === H.ADD_DIR || e === H.CHANGE)) {
      const c = n.cwd ? k.join(n.cwd, r) : r;
      let u;
      try {
        u = await yn(c);
      } catch {
      }
      if (!u || this.closed)
        return;
      i.push(u);
    }
    return this.emitWithAll(e, i), this;
  }
  /**
   * Common handler for errors
   * @returns The error if defined, otherwise the value of the FSWatcher instance's `closed` flag
   */
  _handleError(e) {
    const r = e && e.code;
    return e && r !== "ENOENT" && r !== "ENOTDIR" && (!this.options.ignorePermissionErrors || r !== "EPERM" && r !== "EACCES") && this.emit(H.ERROR, e), e || this.closed;
  }
  /**
   * Helper utility for throttling
   * @param actionType type being throttled
   * @param path being acted upon
   * @param timeout duration of time to suppress duplicate actions
   * @returns tracking object or false if action should be suppressed
   */
  _throttle(e, r, s) {
    this._throttled.has(e) || this._throttled.set(e, /* @__PURE__ */ new Map());
    const n = this._throttled.get(e);
    if (!n)
      throw new Error("invalid throttle");
    const i = n.get(r);
    if (i)
      return i.count++, !1;
    let a;
    const o = () => {
      const u = n.get(r), l = u ? u.count : 0;
      return n.delete(r), clearTimeout(a), u && clearTimeout(u.timeoutObject), l;
    };
    a = setTimeout(o, s);
    const c = { timeoutObject: a, clear: o, count: 0 };
    return n.set(r, c), c;
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
  _awaitWriteFinish(e, r, s, n) {
    const i = this.options.awaitWriteFinish;
    if (typeof i != "object")
      return;
    const a = i.pollInterval;
    let o, c = e;
    this.options.cwd && !k.isAbsolute(e) && (c = k.join(this.options.cwd, e));
    const u = /* @__PURE__ */ new Date(), l = this._pendingWrites;
    function f(d) {
      of(c, (h, m) => {
        if (h || !l.has(e)) {
          h && h.code !== "ENOENT" && n(h);
          return;
        }
        const T = Number(/* @__PURE__ */ new Date());
        d && m.size !== d.size && (l.get(e).lastChange = T);
        const S = l.get(e);
        T - S.lastChange >= r ? (l.delete(e), n(void 0, m)) : o = setTimeout(f, a, m);
      });
    }
    l.has(e) || (l.set(e, {
      lastChange: u,
      cancelWait: () => (l.delete(e), clearTimeout(o), s)
    }), o = setTimeout(f, a));
  }
  /**
   * Determines whether user has asked to ignore this path.
   */
  _isIgnored(e, r) {
    if (this.options.atomic && dg.test(e))
      return !0;
    if (!this._userIgnored) {
      const { cwd: s } = this.options, i = (this.options.ignored || []).map(aa(s)), o = [...[...this._ignoredPaths].map(aa(s)), ...i];
      this._userIgnored = yg(o);
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
    return new Eg(e, this.options.followSymlinks, this);
  }
  // Directory helpers
  // -----------------
  /**
   * Provides directory tracking objects
   * @param directory path of the directory
   */
  _getWatchedDir(e) {
    const r = k.resolve(e);
    return this._watched.has(r) || this._watched.set(r, new _g(r, this._boundRemove)), this._watched.get(r);
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
  _remove(e, r, s) {
    const n = k.join(e, r), i = k.resolve(n);
    if (s = s ?? (this._watched.has(n) || this._watched.has(i)), !this._throttle("remove", n, 100))
      return;
    !s && this._watched.size === 1 && this.add(e, r, !0), this._getWatchedDir(n).getChildren().forEach((d) => this._remove(n, d));
    const c = this._getWatchedDir(e), u = c.has(r);
    c.remove(r), this._symlinkPaths.has(i) && this._symlinkPaths.delete(i);
    let l = n;
    if (this.options.cwd && (l = k.relative(this.options.cwd, n)), this.options.awaitWriteFinish && this._pendingWrites.has(l) && this._pendingWrites.get(l).cancelWait() === H.ADD)
      return;
    this._watched.delete(n), this._watched.delete(i);
    const f = s ? H.UNLINK_DIR : H.UNLINK;
    u && !this._isIgnored(n) && this._emit(f, n), this._closePath(n);
  }
  /**
   * Closes all watchers for a path
   */
  _closePath(e) {
    this._closeFile(e);
    const r = k.dirname(e);
    this._getWatchedDir(r).remove(k.basename(e));
  }
  /**
   * Closes only file-specific watchers
   */
  _closeFile(e) {
    const r = this._closers.get(e);
    r && (r.forEach((s) => s()), this._closers.delete(e));
  }
  _addPathCloser(e, r) {
    if (!r)
      return;
    let s = this._closers.get(e);
    s || (s = [], this._closers.set(e, s)), s.push(r);
  }
  _readdirp(e, r) {
    if (this.closed)
      return;
    const s = { type: H.ALL, alwaysStat: !0, lstat: !0, ...r, depth: 0 };
    let n = Bm(e, s);
    return this._streams.add(n), n.once(Ym, () => {
      n = void 0;
    }), n.once(Xc, () => {
      n && (this._streams.delete(n), n = void 0);
    }), n;
  }
}
function kg(t, e = {}) {
  const r = new su(e);
  return r.add(t), r;
}
const Sg = { watch: kg, FSWatcher: su };
class Og {
  constructor() {
    $(this, "git", null);
    $(this, "watcher", null);
    $(this, "workingDirectory", "");
    $(this, "debounceTimeout", null);
  }
  initializeWatcher() {
    this.watcher && this.watcher.close(), this.watcher = Sg.watch(this.workingDirectory, {
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
      p.emit("git:status-changed", e);
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
      this.git = ws(e);
      const r = await this.git.checkIsRepo();
      if (this.workingDirectory = e, this.initializeWatcher(), !r)
        return {
          success: !1,
          error: "Not a git repository"
        };
      const s = await this.git.status([
        "--untracked-files=all",
        "--ignored=no",
        "--porcelain=v1"
      ]), n = s.isClean();
      return {
        success: !0,
        data: {
          current: s.current || "",
          tracking: s.tracking || "",
          ahead: s.ahead,
          behind: s.behind,
          staged: s.staged,
          not_added: s.not_added,
          created: s.created,
          modified: s.modified,
          deleted: s.deleted,
          conflicted: s.conflicted,
          files: s.files,
          isClean: n,
          detached: s.detached
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
      return await ws(e).checkIsRepo();
    } catch (r) {
      return console.error("Failed to check git repository:", r), !1;
    }
  }
  async initRepo(e) {
    try {
      const r = ws(e);
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
      const e = await this.git.log([]), r = e.all.map((s) => ({
        hash: s.hash,
        date: s.date,
        message: s.message,
        refs: s.refs,
        body: s.body,
        author_name: s.author_name,
        author_email: s.author_email
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
const ye = new Og();
function Ig() {
  p.handle("git:initialize", async (t, e) => await ye.initialize(e)), p.handle("git:checkIsRepo", async (t, e) => await ye.checkIsRepo(e)), p.handle("git:init", async (t, e) => await ye.initRepo(e)), p.handle("git:status", async () => await ye.getStatus()), p.handle("git:add", async (t, e) => await ye.add(e)), p.handle("git:stage", async (t, e) => await ye.stage(e)), p.handle("git:unstage", async (t, e) => await ye.unstage(e)), p.handle("git:commit", async (t, e) => await ye.commit(e)), p.handle("git:stageAll", async () => await ye.stageAll()), p.handle("git:unstageAll", async () => await ye.unstageAll()), p.handle("git:discardAll", async () => await ye.discardAll()), p.handle("git:getLog", async () => await ye.getLog());
}
var pe = {};
Object.defineProperty(pe, "__esModule", { value: !0 });
class ht extends Error {
}
class Cg extends ht {
  constructor(e) {
    super(`Invalid DateTime: ${e.toMessage()}`);
  }
}
class Dg extends ht {
  constructor(e) {
    super(`Invalid Interval: ${e.toMessage()}`);
  }
}
class Rg extends ht {
  constructor(e) {
    super(`Invalid Duration: ${e.toMessage()}`);
  }
}
class wt extends ht {
}
class nu extends ht {
  constructor(e) {
    super(`Invalid unit ${e}`);
  }
}
class X extends ht {
}
class ze extends ht {
  constructor() {
    super("Zone is an abstract class");
  }
}
const w = "numeric", Ce = "short", ge = "long", Pr = {
  year: w,
  month: w,
  day: w
}, iu = {
  year: w,
  month: Ce,
  day: w
}, Mg = {
  year: w,
  month: Ce,
  day: w,
  weekday: Ce
}, au = {
  year: w,
  month: ge,
  day: w
}, ou = {
  year: w,
  month: ge,
  day: w,
  weekday: ge
}, cu = {
  hour: w,
  minute: w
}, uu = {
  hour: w,
  minute: w,
  second: w
}, lu = {
  hour: w,
  minute: w,
  second: w,
  timeZoneName: Ce
}, fu = {
  hour: w,
  minute: w,
  second: w,
  timeZoneName: ge
}, du = {
  hour: w,
  minute: w,
  hourCycle: "h23"
}, hu = {
  hour: w,
  minute: w,
  second: w,
  hourCycle: "h23"
}, mu = {
  hour: w,
  minute: w,
  second: w,
  hourCycle: "h23",
  timeZoneName: Ce
}, gu = {
  hour: w,
  minute: w,
  second: w,
  hourCycle: "h23",
  timeZoneName: ge
}, pu = {
  year: w,
  month: w,
  day: w,
  hour: w,
  minute: w
}, yu = {
  year: w,
  month: w,
  day: w,
  hour: w,
  minute: w,
  second: w
}, wu = {
  year: w,
  month: Ce,
  day: w,
  hour: w,
  minute: w
}, vu = {
  year: w,
  month: Ce,
  day: w,
  hour: w,
  minute: w,
  second: w
}, Ng = {
  year: w,
  month: Ce,
  day: w,
  weekday: Ce,
  hour: w,
  minute: w
}, _u = {
  year: w,
  month: ge,
  day: w,
  hour: w,
  minute: w,
  timeZoneName: Ce
}, Tu = {
  year: w,
  month: ge,
  day: w,
  hour: w,
  minute: w,
  second: w,
  timeZoneName: Ce
}, bu = {
  year: w,
  month: ge,
  day: w,
  weekday: ge,
  hour: w,
  minute: w,
  timeZoneName: ge
}, Eu = {
  year: w,
  month: ge,
  day: w,
  weekday: ge,
  hour: w,
  minute: w,
  second: w,
  timeZoneName: ge
};
class It {
  /**
   * The type of zone
   * @abstract
   * @type {string}
   */
  get type() {
    throw new ze();
  }
  /**
   * The name of this zone.
   * @abstract
   * @type {string}
   */
  get name() {
    throw new ze();
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
    throw new ze();
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
    throw new ze();
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
    throw new ze();
  }
  /**
   * Return the offset in minutes for this zone at the specified timestamp.
   * @abstract
   * @param {number} ts - Epoch milliseconds for which to compute the offset
   * @return {number}
   */
  offset(e) {
    throw new ze();
  }
  /**
   * Return whether this Zone is equal to another zone
   * @abstract
   * @param {Zone} otherZone - the zone to compare
   * @return {boolean}
   */
  equals(e) {
    throw new ze();
  }
  /**
   * Return whether this Zone is valid.
   * @abstract
   * @type {boolean}
   */
  get isValid() {
    throw new ze();
  }
}
let bs = null;
class tr extends It {
  /**
   * Get a singleton instance of the local zone
   * @return {SystemZone}
   */
  static get instance() {
    return bs === null && (bs = new tr()), bs;
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
    locale: s
  }) {
    return Lu(e, r, s);
  }
  /** @override **/
  formatOffset(e, r) {
    return Vt(this.offset(e), r);
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
const sn = /* @__PURE__ */ new Map();
function xg(t) {
  let e = sn.get(t);
  return e === void 0 && (e = new Intl.DateTimeFormat("en-US", {
    hour12: !1,
    timeZone: t,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    era: "short"
  }), sn.set(t, e)), e;
}
const Fg = {
  year: 0,
  month: 1,
  day: 2,
  era: 3,
  hour: 4,
  minute: 5,
  second: 6
};
function Lg(t, e) {
  const r = t.format(e).replace(/\u200E/g, ""), s = /(\d+)\/(\d+)\/(\d+) (AD|BC),? (\d+):(\d+):(\d+)/.exec(r), [, n, i, a, o, c, u, l] = s;
  return [a, n, i, o, c, u, l];
}
function Ag(t, e) {
  const r = t.formatToParts(e), s = [];
  for (let n = 0; n < r.length; n++) {
    const {
      type: i,
      value: a
    } = r[n], o = Fg[i];
    i === "era" ? s[o] = a : I(o) || (s[o] = parseInt(a, 10));
  }
  return s;
}
const Es = /* @__PURE__ */ new Map();
class xe extends It {
  /**
   * @param {string} name - Zone name
   * @return {IANAZone}
   */
  static create(e) {
    let r = Es.get(e);
    return r === void 0 && Es.set(e, r = new xe(e)), r;
  }
  /**
   * Reset local caches. Should only be necessary in testing scenarios.
   * @return {void}
   */
  static resetCache() {
    Es.clear(), sn.clear();
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
    super(), this.zoneName = e, this.valid = xe.isValidZone(e);
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
    locale: s
  }) {
    return Lu(e, r, s, this.name);
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
    return Vt(this.offset(e), r);
  }
  /**
   * Return the offset in minutes for this zone at the specified timestamp.
   * @override
   * @param {number} ts - Epoch milliseconds for which to compute the offset
   * @return {number}
   */
  offset(e) {
    if (!this.valid) return NaN;
    const r = new Date(e);
    if (isNaN(r)) return NaN;
    const s = xg(this.name);
    let [n, i, a, o, c, u, l] = s.formatToParts ? Ag(s, r) : Lg(s, r);
    o === "BC" && (n = -Math.abs(n) + 1);
    const d = es({
      year: n,
      month: i,
      day: a,
      hour: c === 24 ? 0 : c,
      minute: u,
      second: l,
      millisecond: 0
    });
    let h = +r;
    const m = h % 1e3;
    return h -= m >= 0 ? m : 1e3 + m, (d - h) / (60 * 1e3);
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
let oa = {};
function Pg(t, e = {}) {
  const r = JSON.stringify([t, e]);
  let s = oa[r];
  return s || (s = new Intl.ListFormat(t, e), oa[r] = s), s;
}
const nn = /* @__PURE__ */ new Map();
function an(t, e = {}) {
  const r = JSON.stringify([t, e]);
  let s = nn.get(r);
  return s === void 0 && (s = new Intl.DateTimeFormat(t, e), nn.set(r, s)), s;
}
const on = /* @__PURE__ */ new Map();
function Wg(t, e = {}) {
  const r = JSON.stringify([t, e]);
  let s = on.get(r);
  return s === void 0 && (s = new Intl.NumberFormat(t, e), on.set(r, s)), s;
}
const cn = /* @__PURE__ */ new Map();
function Ug(t, e = {}) {
  const {
    base: r,
    ...s
  } = e, n = JSON.stringify([t, s]);
  let i = cn.get(n);
  return i === void 0 && (i = new Intl.RelativeTimeFormat(t, e), cn.set(n, i)), i;
}
let At = null;
function $g() {
  return At || (At = new Intl.DateTimeFormat().resolvedOptions().locale, At);
}
const un = /* @__PURE__ */ new Map();
function ku(t) {
  let e = un.get(t);
  return e === void 0 && (e = new Intl.DateTimeFormat(t).resolvedOptions(), un.set(t, e)), e;
}
const ln = /* @__PURE__ */ new Map();
function zg(t) {
  let e = ln.get(t);
  if (!e) {
    const r = new Intl.Locale(t);
    e = "getWeekInfo" in r ? r.getWeekInfo() : r.weekInfo, "minimalDays" in e || (e = {
      ...Su,
      ...e
    }), ln.set(t, e);
  }
  return e;
}
function Vg(t) {
  const e = t.indexOf("-x-");
  e !== -1 && (t = t.substring(0, e));
  const r = t.indexOf("-u-");
  if (r === -1)
    return [t];
  {
    let s, n;
    try {
      s = an(t).resolvedOptions(), n = t;
    } catch {
      const c = t.substring(0, r);
      s = an(c).resolvedOptions(), n = c;
    }
    const {
      numberingSystem: i,
      calendar: a
    } = s;
    return [n, i, a];
  }
}
function jg(t, e, r) {
  return (r || e) && (t.includes("-u-") || (t += "-u"), r && (t += `-ca-${r}`), e && (t += `-nu-${e}`)), t;
}
function Hg(t) {
  const e = [];
  for (let r = 1; r <= 12; r++) {
    const s = O.utc(2009, r, 1);
    e.push(t(s));
  }
  return e;
}
function Gg(t) {
  const e = [];
  for (let r = 1; r <= 7; r++) {
    const s = O.utc(2016, 11, 13 + r);
    e.push(t(s));
  }
  return e;
}
function gr(t, e, r, s) {
  const n = t.listingMode();
  return n === "error" ? null : n === "en" ? r(e) : s(e);
}
function Bg(t) {
  return t.numberingSystem && t.numberingSystem !== "latn" ? !1 : t.numberingSystem === "latn" || !t.locale || t.locale.startsWith("en") || ku(t.locale).numberingSystem === "latn";
}
class qg {
  constructor(e, r, s) {
    this.padTo = s.padTo || 0, this.floor = s.floor || !1;
    const {
      padTo: n,
      floor: i,
      ...a
    } = s;
    if (!r || Object.keys(a).length > 0) {
      const o = {
        useGrouping: !1,
        ...s
      };
      s.padTo > 0 && (o.minimumIntegerDigits = s.padTo), this.inf = Wg(e, o);
    }
  }
  format(e) {
    if (this.inf) {
      const r = this.floor ? Math.floor(e) : e;
      return this.inf.format(r);
    } else {
      const r = this.floor ? Math.floor(e) : Zn(e, 3);
      return Z(r, this.padTo);
    }
  }
}
class Yg {
  constructor(e, r, s) {
    this.opts = s, this.originalZone = void 0;
    let n;
    if (this.opts.timeZone)
      this.dt = e;
    else if (e.zone.type === "fixed") {
      const a = -1 * (e.offset / 60), o = a >= 0 ? `Etc/GMT+${a}` : `Etc/GMT${a}`;
      e.offset !== 0 && xe.create(o).valid ? (n = o, this.dt = e) : (n = "UTC", this.dt = e.offset === 0 ? e : e.setZone("UTC").plus({
        minutes: e.offset
      }), this.originalZone = e.zone);
    } else e.zone.type === "system" ? this.dt = e : e.zone.type === "iana" ? (this.dt = e, n = e.zone.name) : (n = "UTC", this.dt = e.setZone("UTC").plus({
      minutes: e.offset
    }), this.originalZone = e.zone);
    const i = {
      ...this.opts
    };
    i.timeZone = i.timeZone || n, this.dtf = an(r, i);
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
        const s = this.originalZone.offsetName(this.dt.ts, {
          locale: this.dt.locale,
          format: this.opts.timeZoneName
        });
        return {
          ...r,
          value: s
        };
      } else
        return r;
    }) : e;
  }
  resolvedOptions() {
    return this.dtf.resolvedOptions();
  }
}
class Zg {
  constructor(e, r, s) {
    this.opts = {
      style: "long",
      ...s
    }, !r && xu() && (this.rtf = Ug(e, s));
  }
  format(e, r) {
    return this.rtf ? this.rtf.format(e, r) : pp(r, e, this.opts.numeric, this.opts.style !== "long");
  }
  formatToParts(e, r) {
    return this.rtf ? this.rtf.formatToParts(e, r) : [];
  }
}
const Su = {
  firstDay: 1,
  minimalDays: 4,
  weekend: [6, 7]
};
class L {
  static fromOpts(e) {
    return L.create(e.locale, e.numberingSystem, e.outputCalendar, e.weekSettings, e.defaultToEN);
  }
  static create(e, r, s, n, i = !1) {
    const a = e || V.defaultLocale, o = a || (i ? "en-US" : $g()), c = r || V.defaultNumberingSystem, u = s || V.defaultOutputCalendar, l = dn(n) || V.defaultWeekSettings;
    return new L(o, c, u, l, a);
  }
  static resetCache() {
    At = null, nn.clear(), on.clear(), cn.clear(), un.clear(), ln.clear();
  }
  static fromObject({
    locale: e,
    numberingSystem: r,
    outputCalendar: s,
    weekSettings: n
  } = {}) {
    return L.create(e, r, s, n);
  }
  constructor(e, r, s, n, i) {
    const [a, o, c] = Vg(e);
    this.locale = a, this.numberingSystem = r || o || null, this.outputCalendar = s || c || null, this.weekSettings = n, this.intl = jg(this.locale, this.numberingSystem, this.outputCalendar), this.weekdaysCache = {
      format: {},
      standalone: {}
    }, this.monthsCache = {
      format: {},
      standalone: {}
    }, this.meridiemCache = null, this.eraCache = {}, this.specifiedLocale = i, this.fastNumbersCached = null;
  }
  get fastNumbers() {
    return this.fastNumbersCached == null && (this.fastNumbersCached = Bg(this)), this.fastNumbersCached;
  }
  listingMode() {
    const e = this.isEnglish(), r = (this.numberingSystem === null || this.numberingSystem === "latn") && (this.outputCalendar === null || this.outputCalendar === "gregory");
    return e && r ? "en" : "intl";
  }
  clone(e) {
    return !e || Object.getOwnPropertyNames(e).length === 0 ? this : L.create(e.locale || this.specifiedLocale, e.numberingSystem || this.numberingSystem, e.outputCalendar || this.outputCalendar, dn(e.weekSettings) || this.weekSettings, e.defaultToEN || !1);
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
    return gr(this, e, Wu, () => {
      const s = r ? {
        month: e,
        day: "numeric"
      } : {
        month: e
      }, n = r ? "format" : "standalone";
      return this.monthsCache[n][e] || (this.monthsCache[n][e] = Hg((i) => this.extract(i, s, "month"))), this.monthsCache[n][e];
    });
  }
  weekdays(e, r = !1) {
    return gr(this, e, zu, () => {
      const s = r ? {
        weekday: e,
        year: "numeric",
        month: "long",
        day: "numeric"
      } : {
        weekday: e
      }, n = r ? "format" : "standalone";
      return this.weekdaysCache[n][e] || (this.weekdaysCache[n][e] = Gg((i) => this.extract(i, s, "weekday"))), this.weekdaysCache[n][e];
    });
  }
  meridiems() {
    return gr(this, void 0, () => Vu, () => {
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
    return gr(this, e, ju, () => {
      const r = {
        era: e
      };
      return this.eraCache[e] || (this.eraCache[e] = [O.utc(-40, 1, 1), O.utc(2017, 1, 1)].map((s) => this.extract(s, r, "era"))), this.eraCache[e];
    });
  }
  extract(e, r, s) {
    const n = this.dtFormatter(e, r), i = n.formatToParts(), a = i.find((o) => o.type.toLowerCase() === s);
    return a ? a.value : null;
  }
  numberFormatter(e = {}) {
    return new qg(this.intl, e.forceSimple || this.fastNumbers, e);
  }
  dtFormatter(e, r = {}) {
    return new Yg(e, this.intl, r);
  }
  relFormatter(e = {}) {
    return new Zg(this.intl, this.isEnglish(), e);
  }
  listFormatter(e = {}) {
    return Pg(this.intl, e);
  }
  isEnglish() {
    return this.locale === "en" || this.locale.toLowerCase() === "en-us" || ku(this.intl).locale.startsWith("en-us");
  }
  getWeekSettings() {
    return this.weekSettings ? this.weekSettings : Fu() ? zg(this.locale) : Su;
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
let ks = null;
class te extends It {
  /**
   * Get a singleton instance of UTC
   * @return {FixedOffsetZone}
   */
  static get utcInstance() {
    return ks === null && (ks = new te(0)), ks;
  }
  /**
   * Get an instance with a specified offset
   * @param {number} offset - The offset in minutes
   * @return {FixedOffsetZone}
   */
  static instance(e) {
    return e === 0 ? te.utcInstance : new te(e);
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
        return new te(ts(r[1], r[2]));
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
    return this.fixed === 0 ? "UTC" : `UTC${Vt(this.fixed, "narrow")}`;
  }
  /**
   * The IANA name of this zone, i.e. `Etc/UTC` or `Etc/GMT+/-nn`
   *
   * @override
   * @type {string}
   */
  get ianaName() {
    return this.fixed === 0 ? "Etc/UTC" : `Etc/GMT${Vt(-this.fixed, "narrow")}`;
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
    return Vt(this.fixed, r);
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
class Ou extends It {
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
function Ge(t, e) {
  if (I(t) || t === null)
    return e;
  if (t instanceof It)
    return t;
  if (tp(t)) {
    const r = t.toLowerCase();
    return r === "default" ? e : r === "local" || r === "system" ? tr.instance : r === "utc" || r === "gmt" ? te.utcInstance : te.parseSpecifier(r) || xe.create(t);
  } else return qe(t) ? te.instance(t) : typeof t == "object" && "offset" in t && typeof t.offset == "function" ? t : new Ou(t);
}
const Gn = {
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
}, ca = {
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
}, Jg = Gn.hanidec.replace(/[\[|\]]/g, "").split("");
function Kg(t) {
  let e = parseInt(t, 10);
  if (isNaN(e)) {
    e = "";
    for (let r = 0; r < t.length; r++) {
      const s = t.charCodeAt(r);
      if (t[r].search(Gn.hanidec) !== -1)
        e += Jg.indexOf(t[r]);
      else
        for (const n in ca) {
          const [i, a] = ca[n];
          s >= i && s <= a && (e += s - i);
        }
    }
    return parseInt(e, 10);
  } else
    return e;
}
const fn = /* @__PURE__ */ new Map();
function Xg() {
  fn.clear();
}
function ke({
  numberingSystem: t
}, e = "") {
  const r = t || "latn";
  let s = fn.get(r);
  s === void 0 && (s = /* @__PURE__ */ new Map(), fn.set(r, s));
  let n = s.get(e);
  return n === void 0 && (n = new RegExp(`${Gn[r]}${e}`), s.set(e, n)), n;
}
let ua = () => Date.now(), la = "system", fa = null, da = null, ha = null, ma = 60, ga, pa = null;
class V {
  /**
   * Get the callback for returning the current timestamp.
   * @type {function}
   */
  static get now() {
    return ua;
  }
  /**
   * Set the callback for returning the current timestamp.
   * The function should return a number, which will be interpreted as an Epoch millisecond count
   * @type {function}
   * @example Settings.now = () => Date.now() + 3000 // pretend it is 3 seconds in the future
   * @example Settings.now = () => 0 // always pretend it's Jan 1, 1970 at midnight in UTC time
   */
  static set now(e) {
    ua = e;
  }
  /**
   * Set the default time zone to create DateTimes in. Does not affect existing instances.
   * Use the value "system" to reset this value to the system's time zone.
   * @type {string}
   */
  static set defaultZone(e) {
    la = e;
  }
  /**
   * Get the default time zone object currently used to create DateTimes. Does not affect existing instances.
   * The default value is the system's time zone (the one set on the machine that runs this code).
   * @type {Zone}
   */
  static get defaultZone() {
    return Ge(la, tr.instance);
  }
  /**
   * Get the default locale to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static get defaultLocale() {
    return fa;
  }
  /**
   * Set the default locale to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static set defaultLocale(e) {
    fa = e;
  }
  /**
   * Get the default numbering system to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static get defaultNumberingSystem() {
    return da;
  }
  /**
   * Set the default numbering system to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static set defaultNumberingSystem(e) {
    da = e;
  }
  /**
   * Get the default output calendar to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static get defaultOutputCalendar() {
    return ha;
  }
  /**
   * Set the default output calendar to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static set defaultOutputCalendar(e) {
    ha = e;
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
    return pa;
  }
  /**
   * Allows overriding the default locale week settings, i.e. the start of the week, the weekend and
   * how many days are required in the first week of a year.
   * Does not affect existing instances.
   *
   * @param {WeekSettings|null} weekSettings
   */
  static set defaultWeekSettings(e) {
    pa = dn(e);
  }
  /**
   * Get the cutoff year for whether a 2-digit year string is interpreted in the current or previous century. Numbers higher than the cutoff will be considered to mean 19xx and numbers lower or equal to the cutoff will be considered 20xx.
   * @type {number}
   */
  static get twoDigitCutoffYear() {
    return ma;
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
    ma = e % 100;
  }
  /**
   * Get whether Luxon will throw when it encounters invalid DateTimes, Durations, or Intervals
   * @type {boolean}
   */
  static get throwOnInvalid() {
    return ga;
  }
  /**
   * Set whether Luxon will throw when it encounters invalid DateTimes, Durations, or Intervals
   * @type {boolean}
   */
  static set throwOnInvalid(e) {
    ga = e;
  }
  /**
   * Reset Luxon's global caches. Should only be necessary in testing scenarios.
   * @return {void}
   */
  static resetCaches() {
    L.resetCache(), xe.resetCache(), O.resetCache(), Xg();
  }
}
class Ie {
  constructor(e, r) {
    this.reason = e, this.explanation = r;
  }
  toMessage() {
    return this.explanation ? `${this.reason}: ${this.explanation}` : this.reason;
  }
}
const Iu = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334], Cu = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
function ve(t, e) {
  return new Ie("unit out of range", `you specified ${e} (of type ${typeof e}) as a ${t}, which is invalid`);
}
function Bn(t, e, r) {
  const s = new Date(Date.UTC(t, e - 1, r));
  t < 100 && t >= 0 && s.setUTCFullYear(s.getUTCFullYear() - 1900);
  const n = s.getUTCDay();
  return n === 0 ? 7 : n;
}
function Du(t, e, r) {
  return r + (rr(t) ? Cu : Iu)[e - 1];
}
function Ru(t, e) {
  const r = rr(t) ? Cu : Iu, s = r.findIndex((i) => i < e), n = e - r[s];
  return {
    month: s + 1,
    day: n
  };
}
function qn(t, e) {
  return (t - e + 7) % 7 + 1;
}
function Wr(t, e = 4, r = 1) {
  const {
    year: s,
    month: n,
    day: i
  } = t, a = Du(s, n, i), o = qn(Bn(s, n, i), r);
  let c = Math.floor((a - o + 14 - e) / 7), u;
  return c < 1 ? (u = s - 1, c = qt(u, e, r)) : c > qt(s, e, r) ? (u = s + 1, c = 1) : u = s, {
    weekYear: u,
    weekNumber: c,
    weekday: o,
    ...rs(t)
  };
}
function ya(t, e = 4, r = 1) {
  const {
    weekYear: s,
    weekNumber: n,
    weekday: i
  } = t, a = qn(Bn(s, 1, e), r), o = _t(s);
  let c = n * 7 + i - a - 7 + e, u;
  c < 1 ? (u = s - 1, c += _t(u)) : c > o ? (u = s + 1, c -= _t(s)) : u = s;
  const {
    month: l,
    day: f
  } = Ru(u, c);
  return {
    year: u,
    month: l,
    day: f,
    ...rs(t)
  };
}
function Ss(t) {
  const {
    year: e,
    month: r,
    day: s
  } = t, n = Du(e, r, s);
  return {
    year: e,
    ordinal: n,
    ...rs(t)
  };
}
function wa(t) {
  const {
    year: e,
    ordinal: r
  } = t, {
    month: s,
    day: n
  } = Ru(e, r);
  return {
    year: e,
    month: s,
    day: n,
    ...rs(t)
  };
}
function va(t, e) {
  if (!I(t.localWeekday) || !I(t.localWeekNumber) || !I(t.localWeekYear)) {
    if (!I(t.weekday) || !I(t.weekNumber) || !I(t.weekYear))
      throw new wt("Cannot mix locale-based week fields with ISO-based week fields");
    return I(t.localWeekday) || (t.weekday = t.localWeekday), I(t.localWeekNumber) || (t.weekNumber = t.localWeekNumber), I(t.localWeekYear) || (t.weekYear = t.localWeekYear), delete t.localWeekday, delete t.localWeekNumber, delete t.localWeekYear, {
      minDaysInFirstWeek: e.getMinDaysInFirstWeek(),
      startOfWeek: e.getStartOfWeek()
    };
  } else
    return {
      minDaysInFirstWeek: 4,
      startOfWeek: 1
    };
}
function Qg(t, e = 4, r = 1) {
  const s = Qr(t.weekYear), n = _e(t.weekNumber, 1, qt(t.weekYear, e, r)), i = _e(t.weekday, 1, 7);
  return s ? n ? i ? !1 : ve("weekday", t.weekday) : ve("week", t.weekNumber) : ve("weekYear", t.weekYear);
}
function ep(t) {
  const e = Qr(t.year), r = _e(t.ordinal, 1, _t(t.year));
  return e ? r ? !1 : ve("ordinal", t.ordinal) : ve("year", t.year);
}
function Mu(t) {
  const e = Qr(t.year), r = _e(t.month, 1, 12), s = _e(t.day, 1, Ur(t.year, t.month));
  return e ? r ? s ? !1 : ve("day", t.day) : ve("month", t.month) : ve("year", t.year);
}
function Nu(t) {
  const {
    hour: e,
    minute: r,
    second: s,
    millisecond: n
  } = t, i = _e(e, 0, 23) || e === 24 && r === 0 && s === 0 && n === 0, a = _e(r, 0, 59), o = _e(s, 0, 59), c = _e(n, 0, 999);
  return i ? a ? o ? c ? !1 : ve("millisecond", n) : ve("second", s) : ve("minute", r) : ve("hour", e);
}
function I(t) {
  return typeof t > "u";
}
function qe(t) {
  return typeof t == "number";
}
function Qr(t) {
  return typeof t == "number" && t % 1 === 0;
}
function tp(t) {
  return typeof t == "string";
}
function rp(t) {
  return Object.prototype.toString.call(t) === "[object Date]";
}
function xu() {
  try {
    return typeof Intl < "u" && !!Intl.RelativeTimeFormat;
  } catch {
    return !1;
  }
}
function Fu() {
  try {
    return typeof Intl < "u" && !!Intl.Locale && ("weekInfo" in Intl.Locale.prototype || "getWeekInfo" in Intl.Locale.prototype);
  } catch {
    return !1;
  }
}
function sp(t) {
  return Array.isArray(t) ? t : [t];
}
function _a(t, e, r) {
  if (t.length !== 0)
    return t.reduce((s, n) => {
      const i = [e(n), n];
      return s && r(s[0], i[0]) === s[0] ? s : i;
    }, null)[1];
}
function np(t, e) {
  return e.reduce((r, s) => (r[s] = t[s], r), {});
}
function kt(t, e) {
  return Object.prototype.hasOwnProperty.call(t, e);
}
function dn(t) {
  if (t == null)
    return null;
  if (typeof t != "object")
    throw new X("Week settings must be an object");
  if (!_e(t.firstDay, 1, 7) || !_e(t.minimalDays, 1, 7) || !Array.isArray(t.weekend) || t.weekend.some((e) => !_e(e, 1, 7)))
    throw new X("Invalid week settings");
  return {
    firstDay: t.firstDay,
    minimalDays: t.minimalDays,
    weekend: Array.from(t.weekend)
  };
}
function _e(t, e, r) {
  return Qr(t) && t >= e && t <= r;
}
function ip(t, e) {
  return t - e * Math.floor(t / e);
}
function Z(t, e = 2) {
  const r = t < 0;
  let s;
  return r ? s = "-" + ("" + -t).padStart(e, "0") : s = ("" + t).padStart(e, "0"), s;
}
function He(t) {
  if (!(I(t) || t === null || t === ""))
    return parseInt(t, 10);
}
function Qe(t) {
  if (!(I(t) || t === null || t === ""))
    return parseFloat(t);
}
function Yn(t) {
  if (!(I(t) || t === null || t === "")) {
    const e = parseFloat("0." + t) * 1e3;
    return Math.floor(e);
  }
}
function Zn(t, e, r = !1) {
  const s = 10 ** e;
  return (r ? Math.trunc : Math.round)(t * s) / s;
}
function rr(t) {
  return t % 4 === 0 && (t % 100 !== 0 || t % 400 === 0);
}
function _t(t) {
  return rr(t) ? 366 : 365;
}
function Ur(t, e) {
  const r = ip(e - 1, 12) + 1, s = t + (e - r) / 12;
  return r === 2 ? rr(s) ? 29 : 28 : [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][r - 1];
}
function es(t) {
  let e = Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second, t.millisecond);
  return t.year < 100 && t.year >= 0 && (e = new Date(e), e.setUTCFullYear(t.year, t.month - 1, t.day)), +e;
}
function Ta(t, e, r) {
  return -qn(Bn(t, 1, e), r) + e - 1;
}
function qt(t, e = 4, r = 1) {
  const s = Ta(t, e, r), n = Ta(t + 1, e, r);
  return (_t(t) - s + n) / 7;
}
function hn(t) {
  return t > 99 ? t : t > V.twoDigitCutoffYear ? 1900 + t : 2e3 + t;
}
function Lu(t, e, r, s = null) {
  const n = new Date(t), i = {
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  };
  s && (i.timeZone = s);
  const a = {
    timeZoneName: e,
    ...i
  }, o = new Intl.DateTimeFormat(r, a).formatToParts(n).find((c) => c.type.toLowerCase() === "timezonename");
  return o ? o.value : null;
}
function ts(t, e) {
  let r = parseInt(t, 10);
  Number.isNaN(r) && (r = 0);
  const s = parseInt(e, 10) || 0, n = r < 0 || Object.is(r, -0) ? -s : s;
  return r * 60 + n;
}
function Au(t) {
  const e = Number(t);
  if (typeof t == "boolean" || t === "" || Number.isNaN(e)) throw new X(`Invalid unit value ${t}`);
  return e;
}
function $r(t, e) {
  const r = {};
  for (const s in t)
    if (kt(t, s)) {
      const n = t[s];
      if (n == null) continue;
      r[e(s)] = Au(n);
    }
  return r;
}
function Vt(t, e) {
  const r = Math.trunc(Math.abs(t / 60)), s = Math.trunc(Math.abs(t % 60)), n = t >= 0 ? "+" : "-";
  switch (e) {
    case "short":
      return `${n}${Z(r, 2)}:${Z(s, 2)}`;
    case "narrow":
      return `${n}${r}${s > 0 ? `:${s}` : ""}`;
    case "techie":
      return `${n}${Z(r, 2)}${Z(s, 2)}`;
    default:
      throw new RangeError(`Value format ${e} is out of range for property format`);
  }
}
function rs(t) {
  return np(t, ["hour", "minute", "second", "millisecond"]);
}
const ap = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], Pu = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], op = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
function Wu(t) {
  switch (t) {
    case "narrow":
      return [...op];
    case "short":
      return [...Pu];
    case "long":
      return [...ap];
    case "numeric":
      return ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
    case "2-digit":
      return ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    default:
      return null;
  }
}
const Uu = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], $u = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], cp = ["M", "T", "W", "T", "F", "S", "S"];
function zu(t) {
  switch (t) {
    case "narrow":
      return [...cp];
    case "short":
      return [...$u];
    case "long":
      return [...Uu];
    case "numeric":
      return ["1", "2", "3", "4", "5", "6", "7"];
    default:
      return null;
  }
}
const Vu = ["AM", "PM"], up = ["Before Christ", "Anno Domini"], lp = ["BC", "AD"], fp = ["B", "A"];
function ju(t) {
  switch (t) {
    case "narrow":
      return [...fp];
    case "short":
      return [...lp];
    case "long":
      return [...up];
    default:
      return null;
  }
}
function dp(t) {
  return Vu[t.hour < 12 ? 0 : 1];
}
function hp(t, e) {
  return zu(e)[t.weekday - 1];
}
function mp(t, e) {
  return Wu(e)[t.month - 1];
}
function gp(t, e) {
  return ju(e)[t.year < 0 ? 0 : 1];
}
function pp(t, e, r = "always", s = !1) {
  const n = {
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
        return f ? "tomorrow" : `next ${n[t][0]}`;
      case -1:
        return f ? "yesterday" : `last ${n[t][0]}`;
      case 0:
        return f ? "today" : `this ${n[t][0]}`;
    }
  }
  const a = Object.is(e, -0) || e < 0, o = Math.abs(e), c = o === 1, u = n[t], l = s ? c ? u[1] : u[2] || u[1] : c ? n[t][0] : t;
  return a ? `${o} ${l} ago` : `in ${o} ${l}`;
}
function ba(t, e) {
  let r = "";
  for (const s of t)
    s.literal ? r += s.val : r += e(s.val);
  return r;
}
const yp = {
  D: Pr,
  DD: iu,
  DDD: au,
  DDDD: ou,
  t: cu,
  tt: uu,
  ttt: lu,
  tttt: fu,
  T: du,
  TT: hu,
  TTT: mu,
  TTTT: gu,
  f: pu,
  ff: wu,
  fff: _u,
  ffff: bu,
  F: yu,
  FF: vu,
  FFF: Tu,
  FFFF: Eu
};
class Q {
  static create(e, r = {}) {
    return new Q(e, r);
  }
  static parseFormat(e) {
    let r = null, s = "", n = !1;
    const i = [];
    for (let a = 0; a < e.length; a++) {
      const o = e.charAt(a);
      o === "'" ? (s.length > 0 && i.push({
        literal: n || /^\s+$/.test(s),
        val: s
      }), r = null, s = "", n = !n) : n || o === r ? s += o : (s.length > 0 && i.push({
        literal: /^\s+$/.test(s),
        val: s
      }), s = o, r = o);
    }
    return s.length > 0 && i.push({
      literal: n || /^\s+$/.test(s),
      val: s
    }), i;
  }
  static macroTokenToFormatOpts(e) {
    return yp[e];
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
      return Z(e, r);
    const s = {
      ...this.opts
    };
    return r > 0 && (s.padTo = r), this.loc.numberFormatter(s).format(e);
  }
  formatDateTimeFromString(e, r) {
    const s = this.loc.listingMode() === "en", n = this.loc.outputCalendar && this.loc.outputCalendar !== "gregory", i = (h, m) => this.loc.extract(e, h, m), a = (h) => e.isOffsetFixed && e.offset === 0 && h.allowZ ? "Z" : e.isValid ? e.zone.formatOffset(e.ts, h.format) : "", o = () => s ? dp(e) : i({
      hour: "numeric",
      hourCycle: "h12"
    }, "dayperiod"), c = (h, m) => s ? mp(e, h) : i(m ? {
      month: h
    } : {
      month: h,
      day: "numeric"
    }, "month"), u = (h, m) => s ? hp(e, h) : i(m ? {
      weekday: h
    } : {
      weekday: h,
      month: "long",
      day: "numeric"
    }, "weekday"), l = (h) => {
      const m = Q.macroTokenToFormatOpts(h);
      return m ? this.formatWithSystemDefault(e, m) : h;
    }, f = (h) => s ? gp(e, h) : i({
      era: h
    }, "era"), d = (h) => {
      switch (h) {
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
          return n ? i({
            day: "numeric"
          }, "day") : this.num(e.day);
        case "dd":
          return n ? i({
            day: "2-digit"
          }, "day") : this.num(e.day, 2);
        case "c":
          return this.num(e.weekday);
        case "ccc":
          return u("short", !0);
        case "cccc":
          return u("long", !0);
        case "ccccc":
          return u("narrow", !0);
        case "E":
          return this.num(e.weekday);
        case "EEE":
          return u("short", !1);
        case "EEEE":
          return u("long", !1);
        case "EEEEE":
          return u("narrow", !1);
        case "L":
          return n ? i({
            month: "numeric",
            day: "numeric"
          }, "month") : this.num(e.month);
        case "LL":
          return n ? i({
            month: "2-digit",
            day: "numeric"
          }, "month") : this.num(e.month, 2);
        case "LLL":
          return c("short", !0);
        case "LLLL":
          return c("long", !0);
        case "LLLLL":
          return c("narrow", !0);
        case "M":
          return n ? i({
            month: "numeric"
          }, "month") : this.num(e.month);
        case "MM":
          return n ? i({
            month: "2-digit"
          }, "month") : this.num(e.month, 2);
        case "MMM":
          return c("short", !1);
        case "MMMM":
          return c("long", !1);
        case "MMMMM":
          return c("narrow", !1);
        case "y":
          return n ? i({
            year: "numeric"
          }, "year") : this.num(e.year);
        case "yy":
          return n ? i({
            year: "2-digit"
          }, "year") : this.num(e.year.toString().slice(-2), 2);
        case "yyyy":
          return n ? i({
            year: "numeric"
          }, "year") : this.num(e.year, 4);
        case "yyyyyy":
          return n ? i({
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
          return l(h);
      }
    };
    return ba(Q.parseFormat(r), d);
  }
  formatDurationFromString(e, r) {
    const s = (c) => {
      switch (c[0]) {
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
    }, n = (c) => (u) => {
      const l = s(u);
      return l ? this.num(c.get(l), u.length) : u;
    }, i = Q.parseFormat(r), a = i.reduce((c, {
      literal: u,
      val: l
    }) => u ? c : c.concat(l), []), o = e.shiftTo(...a.map(s).filter((c) => c));
    return ba(i, n(o));
  }
}
const Hu = /[A-Za-z_+-]{1,256}(?::?\/[A-Za-z0-9_+-]{1,256}(?:\/[A-Za-z0-9_+-]{1,256})?)?/;
function Ct(...t) {
  const e = t.reduce((r, s) => r + s.source, "");
  return RegExp(`^${e}$`);
}
function Dt(...t) {
  return (e) => t.reduce(([r, s, n], i) => {
    const [a, o, c] = i(e, n);
    return [{
      ...r,
      ...a
    }, o || s, c];
  }, [{}, null, 1]).slice(0, 2);
}
function Rt(t, ...e) {
  if (t == null)
    return [null, null];
  for (const [r, s] of e) {
    const n = r.exec(t);
    if (n)
      return s(n);
  }
  return [null, null];
}
function Gu(...t) {
  return (e, r) => {
    const s = {};
    let n;
    for (n = 0; n < t.length; n++)
      s[t[n]] = He(e[r + n]);
    return [s, null, r + n];
  };
}
const Bu = /(?:(Z)|([+-]\d\d)(?::?(\d\d))?)/, wp = `(?:${Bu.source}?(?:\\[(${Hu.source})\\])?)?`, Jn = /(\d\d)(?::?(\d\d)(?::?(\d\d)(?:[.,](\d{1,30}))?)?)?/, qu = RegExp(`${Jn.source}${wp}`), Kn = RegExp(`(?:T${qu.source})?`), vp = /([+-]\d{6}|\d{4})(?:-?(\d\d)(?:-?(\d\d))?)?/, _p = /(\d{4})-?W(\d\d)(?:-?(\d))?/, Tp = /(\d{4})-?(\d{3})/, bp = Gu("weekYear", "weekNumber", "weekDay"), Ep = Gu("year", "ordinal"), kp = /(\d{4})-(\d\d)-(\d\d)/, Yu = RegExp(`${Jn.source} ?(?:${Bu.source}|(${Hu.source}))?`), Sp = RegExp(`(?: ${Yu.source})?`);
function Tt(t, e, r) {
  const s = t[e];
  return I(s) ? r : He(s);
}
function Op(t, e) {
  return [{
    year: Tt(t, e),
    month: Tt(t, e + 1, 1),
    day: Tt(t, e + 2, 1)
  }, null, e + 3];
}
function Mt(t, e) {
  return [{
    hours: Tt(t, e, 0),
    minutes: Tt(t, e + 1, 0),
    seconds: Tt(t, e + 2, 0),
    milliseconds: Yn(t[e + 3])
  }, null, e + 4];
}
function sr(t, e) {
  const r = !t[e] && !t[e + 1], s = ts(t[e + 1], t[e + 2]), n = r ? null : te.instance(s);
  return [{}, n, e + 3];
}
function nr(t, e) {
  const r = t[e] ? xe.create(t[e]) : null;
  return [{}, r, e + 1];
}
const Ip = RegExp(`^T?${Jn.source}$`), Cp = /^-?P(?:(?:(-?\d{1,20}(?:\.\d{1,20})?)Y)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20}(?:\.\d{1,20})?)W)?(?:(-?\d{1,20}(?:\.\d{1,20})?)D)?(?:T(?:(-?\d{1,20}(?:\.\d{1,20})?)H)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20})(?:[.,](-?\d{1,20}))?S)?)?)$/;
function Dp(t) {
  const [e, r, s, n, i, a, o, c, u] = t, l = e[0] === "-", f = c && c[0] === "-", d = (h, m = !1) => h !== void 0 && (m || h && l) ? -h : h;
  return [{
    years: d(Qe(r)),
    months: d(Qe(s)),
    weeks: d(Qe(n)),
    days: d(Qe(i)),
    hours: d(Qe(a)),
    minutes: d(Qe(o)),
    seconds: d(Qe(c), c === "-0"),
    milliseconds: d(Yn(u), f)
  }];
}
const Rp = {
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
function Xn(t, e, r, s, n, i, a) {
  const o = {
    year: e.length === 2 ? hn(He(e)) : He(e),
    month: Pu.indexOf(r) + 1,
    day: He(s),
    hour: He(n),
    minute: He(i)
  };
  return a && (o.second = He(a)), t && (o.weekday = t.length > 3 ? Uu.indexOf(t) + 1 : $u.indexOf(t) + 1), o;
}
const Mp = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|(?:([+-]\d\d)(\d\d)))$/;
function Np(t) {
  const [, e, r, s, n, i, a, o, c, u, l, f] = t, d = Xn(e, n, s, r, i, a, o);
  let h;
  return c ? h = Rp[c] : u ? h = 0 : h = ts(l, f), [d, new te(h)];
}
function xp(t) {
  return t.replace(/\([^()]*\)|[\n\t]/g, " ").replace(/(\s\s+)/g, " ").trim();
}
const Fp = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d\d) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d\d):(\d\d):(\d\d) GMT$/, Lp = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\d\d)-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d\d) (\d\d):(\d\d):(\d\d) GMT$/, Ap = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ( \d|\d\d) (\d\d):(\d\d):(\d\d) (\d{4})$/;
function Ea(t) {
  const [, e, r, s, n, i, a, o] = t;
  return [Xn(e, n, s, r, i, a, o), te.utcInstance];
}
function Pp(t) {
  const [, e, r, s, n, i, a, o] = t;
  return [Xn(e, o, r, s, n, i, a), te.utcInstance];
}
const Wp = Ct(vp, Kn), Up = Ct(_p, Kn), $p = Ct(Tp, Kn), zp = Ct(qu), Zu = Dt(Op, Mt, sr, nr), Vp = Dt(bp, Mt, sr, nr), jp = Dt(Ep, Mt, sr, nr), Hp = Dt(Mt, sr, nr);
function Gp(t) {
  return Rt(t, [Wp, Zu], [Up, Vp], [$p, jp], [zp, Hp]);
}
function Bp(t) {
  return Rt(xp(t), [Mp, Np]);
}
function qp(t) {
  return Rt(t, [Fp, Ea], [Lp, Ea], [Ap, Pp]);
}
function Yp(t) {
  return Rt(t, [Cp, Dp]);
}
const Zp = Dt(Mt);
function Jp(t) {
  return Rt(t, [Ip, Zp]);
}
const Kp = Ct(kp, Sp), Xp = Ct(Yu), Qp = Dt(Mt, sr, nr);
function ey(t) {
  return Rt(t, [Kp, Zu], [Xp, Qp]);
}
const ka = "Invalid Duration", Ju = {
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
}, ty = {
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
  ...Ju
}, we = 146097 / 400, mt = 146097 / 4800, ry = {
  years: {
    quarters: 4,
    months: 12,
    weeks: we / 7,
    days: we,
    hours: we * 24,
    minutes: we * 24 * 60,
    seconds: we * 24 * 60 * 60,
    milliseconds: we * 24 * 60 * 60 * 1e3
  },
  quarters: {
    months: 3,
    weeks: we / 28,
    days: we / 4,
    hours: we * 24 / 4,
    minutes: we * 24 * 60 / 4,
    seconds: we * 24 * 60 * 60 / 4,
    milliseconds: we * 24 * 60 * 60 * 1e3 / 4
  },
  months: {
    weeks: mt / 7,
    days: mt,
    hours: mt * 24,
    minutes: mt * 24 * 60,
    seconds: mt * 24 * 60 * 60,
    milliseconds: mt * 24 * 60 * 60 * 1e3
  },
  ...Ju
}, ot = ["years", "quarters", "months", "weeks", "days", "hours", "minutes", "seconds", "milliseconds"], sy = ot.slice(0).reverse();
function Ve(t, e, r = !1) {
  const s = {
    values: r ? e.values : {
      ...t.values,
      ...e.values || {}
    },
    loc: t.loc.clone(e.loc),
    conversionAccuracy: e.conversionAccuracy || t.conversionAccuracy,
    matrix: e.matrix || t.matrix
  };
  return new N(s);
}
function Ku(t, e) {
  var r;
  let s = (r = e.milliseconds) != null ? r : 0;
  for (const n of sy.slice(1))
    e[n] && (s += e[n] * t[n].milliseconds);
  return s;
}
function Sa(t, e) {
  const r = Ku(t, e) < 0 ? -1 : 1;
  ot.reduceRight((s, n) => {
    if (I(e[n]))
      return s;
    if (s) {
      const i = e[s] * r, a = t[n][s], o = Math.floor(i / a);
      e[n] += o * r, e[s] -= o * a * r;
    }
    return n;
  }, null), ot.reduce((s, n) => {
    if (I(e[n]))
      return s;
    if (s) {
      const i = e[s] % 1;
      e[s] -= i, e[n] += i * t[s][n];
    }
    return n;
  }, null);
}
function ny(t) {
  const e = {};
  for (const [r, s] of Object.entries(t))
    s !== 0 && (e[r] = s);
  return e;
}
class N {
  /**
   * @private
   */
  constructor(e) {
    const r = e.conversionAccuracy === "longterm" || !1;
    let s = r ? ry : ty;
    e.matrix && (s = e.matrix), this.values = e.values, this.loc = e.loc || L.create(), this.conversionAccuracy = r ? "longterm" : "casual", this.invalid = e.invalid || null, this.matrix = s, this.isLuxonDuration = !0;
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
    return N.fromObject({
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
      throw new X(`Duration.fromObject: argument expected to be an object, got ${e === null ? "null" : typeof e}`);
    return new N({
      values: $r(e, N.normalizeUnit),
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
      return N.fromMillis(e);
    if (N.isDuration(e))
      return e;
    if (typeof e == "object")
      return N.fromObject(e);
    throw new X(`Unknown duration argument ${e} of type ${typeof e}`);
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
    const [s] = Yp(e);
    return s ? N.fromObject(s, r) : N.invalid("unparsable", `the input "${e}" can't be parsed as ISO 8601`);
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
    const [s] = Jp(e);
    return s ? N.fromObject(s, r) : N.invalid("unparsable", `the input "${e}" can't be parsed as ISO 8601`);
  }
  /**
   * Create an invalid Duration.
   * @param {string} reason - simple string of why this datetime is invalid. Should not contain parameters or anything else data-dependent
   * @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
   * @return {Duration}
   */
  static invalid(e, r = null) {
    if (!e)
      throw new X("need to specify a reason the Duration is invalid");
    const s = e instanceof Ie ? e : new Ie(e, r);
    if (V.throwOnInvalid)
      throw new Rg(s);
    return new N({
      invalid: s
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
    if (!r) throw new nu(e);
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
    const s = {
      ...r,
      floor: r.round !== !1 && r.floor !== !1
    };
    return this.isValid ? Q.create(this.loc, s).formatDurationFromString(this, e) : ka;
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
    if (!this.isValid) return ka;
    const r = ot.map((s) => {
      const n = this.values[s];
      return I(n) ? null : this.loc.numberFormatter({
        style: "unit",
        unitDisplay: "long",
        ...e,
        unit: s.slice(0, -1)
      }).format(n);
    }).filter((s) => s);
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
    return this.years !== 0 && (e += this.years + "Y"), (this.months !== 0 || this.quarters !== 0) && (e += this.months + this.quarters * 3 + "M"), this.weeks !== 0 && (e += this.weeks + "W"), this.days !== 0 && (e += this.days + "D"), (this.hours !== 0 || this.minutes !== 0 || this.seconds !== 0 || this.milliseconds !== 0) && (e += "T"), this.hours !== 0 && (e += this.hours + "H"), this.minutes !== 0 && (e += this.minutes + "M"), (this.seconds !== 0 || this.milliseconds !== 0) && (e += Zn(this.seconds + this.milliseconds / 1e3, 3) + "S"), e === "P" && (e += "T0S"), e;
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
    return this.isValid ? Ku(this.matrix, this.values) : NaN;
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
    const r = N.fromDurationLike(e), s = {};
    for (const n of ot)
      (kt(r.values, n) || kt(this.values, n)) && (s[n] = r.get(n) + this.get(n));
    return Ve(this, {
      values: s
    }, !0);
  }
  /**
   * Make this Duration shorter by the specified amount. Return a newly-constructed Duration.
   * @param {Duration|Object|number} duration - The amount to subtract. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   * @return {Duration}
   */
  minus(e) {
    if (!this.isValid) return this;
    const r = N.fromDurationLike(e);
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
    for (const s of Object.keys(this.values))
      r[s] = Au(e(this.values[s], s));
    return Ve(this, {
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
    return this[N.normalizeUnit(e)];
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
      ...$r(e, N.normalizeUnit)
    };
    return Ve(this, {
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
    conversionAccuracy: s,
    matrix: n
  } = {}) {
    const a = {
      loc: this.loc.clone({
        locale: e,
        numberingSystem: r
      }),
      matrix: n,
      conversionAccuracy: s
    };
    return Ve(this, a);
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
    return Sa(this.matrix, e), Ve(this, {
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
    const e = ny(this.normalize().shiftToAll().toObject());
    return Ve(this, {
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
    e = e.map((a) => N.normalizeUnit(a));
    const r = {}, s = {}, n = this.toObject();
    let i;
    for (const a of ot)
      if (e.indexOf(a) >= 0) {
        i = a;
        let o = 0;
        for (const u in s)
          o += this.matrix[u][a] * s[u], s[u] = 0;
        qe(n[a]) && (o += n[a]);
        const c = Math.trunc(o);
        r[a] = c, s[a] = (o * 1e3 - c * 1e3) / 1e3;
      } else qe(n[a]) && (s[a] = n[a]);
    for (const a in s)
      s[a] !== 0 && (r[i] += a === i ? s[a] : s[a] / this.matrix[i][a]);
    return Sa(this.matrix, r), Ve(this, {
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
    return Ve(this, {
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
    function r(s, n) {
      return s === void 0 || s === 0 ? n === void 0 || n === 0 : s === n;
    }
    for (const s of ot)
      if (!r(this.values[s], e.values[s]))
        return !1;
    return !0;
  }
}
const gt = "Invalid Interval";
function iy(t, e) {
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
      throw new X("need to specify a reason the Interval is invalid");
    const s = e instanceof Ie ? e : new Ie(e, r);
    if (V.throwOnInvalid)
      throw new Dg(s);
    return new z({
      invalid: s
    });
  }
  /**
   * Create an Interval from a start DateTime and an end DateTime. Inclusive of the start but not the end.
   * @param {DateTime|Date|Object} start
   * @param {DateTime|Date|Object} end
   * @return {Interval}
   */
  static fromDateTimes(e, r) {
    const s = Lt(e), n = Lt(r), i = iy(s, n);
    return i ?? new z({
      start: s,
      end: n
    });
  }
  /**
   * Create an Interval from a start DateTime and a Duration to extend to.
   * @param {DateTime|Date|Object} start
   * @param {Duration|Object|number} duration - the length of the Interval.
   * @return {Interval}
   */
  static after(e, r) {
    const s = N.fromDurationLike(r), n = Lt(e);
    return z.fromDateTimes(n, n.plus(s));
  }
  /**
   * Create an Interval from an end DateTime and a Duration to extend backwards to.
   * @param {DateTime|Date|Object} end
   * @param {Duration|Object|number} duration - the length of the Interval.
   * @return {Interval}
   */
  static before(e, r) {
    const s = N.fromDurationLike(r), n = Lt(e);
    return z.fromDateTimes(n.minus(s), n);
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
    const [s, n] = (e || "").split("/", 2);
    if (s && n) {
      let i, a;
      try {
        i = O.fromISO(s, r), a = i.isValid;
      } catch {
        a = !1;
      }
      let o, c;
      try {
        o = O.fromISO(n, r), c = o.isValid;
      } catch {
        c = !1;
      }
      if (a && c)
        return z.fromDateTimes(i, o);
      if (a) {
        const u = N.fromISO(n, r);
        if (u.isValid)
          return z.after(i, u);
      } else if (c) {
        const u = N.fromISO(s, r);
        if (u.isValid)
          return z.before(o, u);
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
   * Returns the last DateTime included in the interval (since end is not part of the interval)
   * @type {DateTime}
   */
  get lastDateTime() {
    return this.isValid && this.e ? this.e.minus(1) : null;
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
    const s = this.start.startOf(e, r);
    let n;
    return r != null && r.useLocaleWeeks ? n = this.end.reconfigure({
      locale: s.locale
    }) : n = this.end, n = n.startOf(e, r), Math.floor(n.diff(s, e).get(e)) + (n.valueOf() !== this.end.valueOf());
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
    const r = e.map(Lt).filter((a) => this.contains(a)).sort((a, o) => a.toMillis() - o.toMillis()), s = [];
    let {
      s: n
    } = this, i = 0;
    for (; n < this.e; ) {
      const a = r[i] || this.e, o = +a > +this.e ? this.e : a;
      s.push(z.fromDateTimes(n, o)), n = o, i += 1;
    }
    return s;
  }
  /**
   * Split this Interval into smaller Intervals, each of the specified length.
   * Left over time is grouped into a smaller interval
   * @param {Duration|Object|number} duration - The length of each resulting interval.
   * @return {Array}
   */
  splitBy(e) {
    const r = N.fromDurationLike(e);
    if (!this.isValid || !r.isValid || r.as("milliseconds") === 0)
      return [];
    let {
      s
    } = this, n = 1, i;
    const a = [];
    for (; s < this.e; ) {
      const o = this.start.plus(r.mapUnits((c) => c * n));
      i = +o > +this.e ? this.e : o, a.push(z.fromDateTimes(s, i)), s = i, n += 1;
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
    const r = this.s > e.s ? this.s : e.s, s = this.e < e.e ? this.e : e.e;
    return r >= s ? null : z.fromDateTimes(r, s);
  }
  /**
   * Return an Interval representing the union of this Interval and the specified Interval.
   * Specifically, the resulting Interval has the minimum start time and the maximum end time of the two Intervals.
   * @param {Interval} other
   * @return {Interval}
   */
  union(e) {
    if (!this.isValid) return this;
    const r = this.s < e.s ? this.s : e.s, s = this.e > e.e ? this.e : e.e;
    return z.fromDateTimes(r, s);
  }
  /**
   * Merge an array of Intervals into an equivalent minimal set of Intervals.
   * Combines overlapping and adjacent Intervals.
   * The resulting array will contain the Intervals in ascending order, that is, starting with the earliest Interval
   * and ending with the latest.
   *
   * @param {Array} intervals
   * @return {Array}
   */
  static merge(e) {
    const [r, s] = e.sort((n, i) => n.s - i.s).reduce(([n, i], a) => i ? i.overlaps(a) || i.abutsStart(a) ? [n, i.union(a)] : [n.concat([i]), a] : [n, a], [[], null]);
    return s && r.push(s), r;
  }
  /**
   * Return an array of Intervals representing the spans of time that only appear in one of the specified Intervals.
   * @param {Array} intervals
   * @return {Array}
   */
  static xor(e) {
    let r = null, s = 0;
    const n = [], i = e.map((c) => [{
      time: c.s,
      type: "s"
    }, {
      time: c.e,
      type: "e"
    }]), a = Array.prototype.concat(...i), o = a.sort((c, u) => c.time - u.time);
    for (const c of o)
      s += c.type === "s" ? 1 : -1, s === 1 ? r = c.time : (r && +r != +c.time && n.push(z.fromDateTimes(r, c.time)), r = null);
    return z.merge(n);
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
    return this.isValid ? `[${this.s.toISO()} – ${this.e.toISO()})` : gt;
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
  toLocaleString(e = Pr, r = {}) {
    return this.isValid ? Q.create(this.s.loc.clone(r), e).formatInterval(this) : gt;
  }
  /**
   * Returns an ISO 8601-compliant string representation of this Interval.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @param {Object} opts - The same options as {@link DateTime#toISO}
   * @return {string}
   */
  toISO(e) {
    return this.isValid ? `${this.s.toISO(e)}/${this.e.toISO(e)}` : gt;
  }
  /**
   * Returns an ISO 8601-compliant string representation of date of this Interval.
   * The time components are ignored.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @return {string}
   */
  toISODate() {
    return this.isValid ? `${this.s.toISODate()}/${this.e.toISODate()}` : gt;
  }
  /**
   * Returns an ISO 8601-compliant string representation of time of this Interval.
   * The date components are ignored.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @param {Object} opts - The same options as {@link DateTime#toISO}
   * @return {string}
   */
  toISOTime(e) {
    return this.isValid ? `${this.s.toISOTime(e)}/${this.e.toISOTime(e)}` : gt;
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
    return this.isValid ? `${this.s.toFormat(e)}${r}${this.e.toFormat(e)}` : gt;
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
    return this.isValid ? this.e.diff(this.s, e, r) : N.invalid(this.invalidReason);
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
class Pt {
  /**
   * Return whether the specified zone contains a DST.
   * @param {string|Zone} [zone='local'] - Zone to check. Defaults to the environment's local zone.
   * @return {boolean}
   */
  static hasDST(e = V.defaultZone) {
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
    return xe.isValidZone(e);
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
    return Ge(e, V.defaultZone);
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
    numberingSystem: s = null,
    locObj: n = null,
    outputCalendar: i = "gregory"
  } = {}) {
    return (n || L.create(r, s, i)).months(e);
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
    numberingSystem: s = null,
    locObj: n = null,
    outputCalendar: i = "gregory"
  } = {}) {
    return (n || L.create(r, s, i)).months(e, !0);
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
    numberingSystem: s = null,
    locObj: n = null
  } = {}) {
    return (n || L.create(r, s, null)).weekdays(e);
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
    numberingSystem: s = null,
    locObj: n = null
  } = {}) {
    return (n || L.create(r, s, null)).weekdays(e, !0);
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
      relative: xu(),
      localeWeek: Fu()
    };
  }
}
function Oa(t, e) {
  const r = (n) => n.toUTC(0, {
    keepLocalTime: !0
  }).startOf("day").valueOf(), s = r(e) - r(t);
  return Math.floor(N.fromMillis(s).as("days"));
}
function ay(t, e, r) {
  const s = [["years", (c, u) => u.year - c.year], ["quarters", (c, u) => u.quarter - c.quarter + (u.year - c.year) * 4], ["months", (c, u) => u.month - c.month + (u.year - c.year) * 12], ["weeks", (c, u) => {
    const l = Oa(c, u);
    return (l - l % 7) / 7;
  }], ["days", Oa]], n = {}, i = t;
  let a, o;
  for (const [c, u] of s)
    r.indexOf(c) >= 0 && (a = c, n[c] = u(t, e), o = i.plus(n), o > e ? (n[c]--, t = i.plus(n), t > e && (o = t, n[c]--, t = i.plus(n))) : t = o);
  return [t, n, o, a];
}
function oy(t, e, r, s) {
  let [n, i, a, o] = ay(t, e, r);
  const c = e - n, u = r.filter((f) => ["hours", "minutes", "seconds", "milliseconds"].indexOf(f) >= 0);
  u.length === 0 && (a < e && (a = n.plus({
    [o]: 1
  })), a !== n && (i[o] = (i[o] || 0) + c / (a - n)));
  const l = N.fromObject(i, s);
  return u.length > 0 ? N.fromMillis(c, s).shiftTo(...u).plus(l) : l;
}
const cy = "missing Intl.DateTimeFormat.formatToParts support";
function F(t, e = (r) => r) {
  return {
    regex: t,
    deser: ([r]) => e(Kg(r))
  };
}
const uy = " ", Xu = `[ ${uy}]`, Qu = new RegExp(Xu, "g");
function ly(t) {
  return t.replace(/\./g, "\\.?").replace(Qu, Xu);
}
function Ia(t) {
  return t.replace(/\./g, "").replace(Qu, " ").toLowerCase();
}
function Se(t, e) {
  return t === null ? null : {
    regex: RegExp(t.map(ly).join("|")),
    deser: ([r]) => t.findIndex((s) => Ia(r) === Ia(s)) + e
  };
}
function Ca(t, e) {
  return {
    regex: t,
    deser: ([, r, s]) => ts(r, s),
    groups: e
  };
}
function pr(t) {
  return {
    regex: t,
    deser: ([e]) => e
  };
}
function fy(t) {
  return t.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
}
function dy(t, e) {
  const r = ke(e), s = ke(e, "{2}"), n = ke(e, "{3}"), i = ke(e, "{4}"), a = ke(e, "{6}"), o = ke(e, "{1,2}"), c = ke(e, "{1,3}"), u = ke(e, "{1,6}"), l = ke(e, "{1,9}"), f = ke(e, "{2,4}"), d = ke(e, "{4,6}"), h = (S) => ({
    regex: RegExp(fy(S.val)),
    deser: ([_]) => _,
    literal: !0
  }), T = ((S) => {
    if (t.literal)
      return h(S);
    switch (S.val) {
      case "G":
        return Se(e.eras("short"), 0);
      case "GG":
        return Se(e.eras("long"), 0);
      case "y":
        return F(u);
      case "yy":
        return F(f, hn);
      case "yyyy":
        return F(i);
      case "yyyyy":
        return F(d);
      case "yyyyyy":
        return F(a);
      case "M":
        return F(o);
      case "MM":
        return F(s);
      case "MMM":
        return Se(e.months("short", !0), 1);
      case "MMMM":
        return Se(e.months("long", !0), 1);
      case "L":
        return F(o);
      case "LL":
        return F(s);
      case "LLL":
        return Se(e.months("short", !1), 1);
      case "LLLL":
        return Se(e.months("long", !1), 1);
      case "d":
        return F(o);
      case "dd":
        return F(s);
      case "o":
        return F(c);
      case "ooo":
        return F(n);
      case "HH":
        return F(s);
      case "H":
        return F(o);
      case "hh":
        return F(s);
      case "h":
        return F(o);
      case "mm":
        return F(s);
      case "m":
        return F(o);
      case "q":
        return F(o);
      case "qq":
        return F(s);
      case "s":
        return F(o);
      case "ss":
        return F(s);
      case "S":
        return F(c);
      case "SSS":
        return F(n);
      case "u":
        return pr(l);
      case "uu":
        return pr(o);
      case "uuu":
        return F(r);
      case "a":
        return Se(e.meridiems(), 0);
      case "kkkk":
        return F(i);
      case "kk":
        return F(f, hn);
      case "W":
        return F(o);
      case "WW":
        return F(s);
      case "E":
      case "c":
        return F(r);
      case "EEE":
        return Se(e.weekdays("short", !1), 1);
      case "EEEE":
        return Se(e.weekdays("long", !1), 1);
      case "ccc":
        return Se(e.weekdays("short", !0), 1);
      case "cccc":
        return Se(e.weekdays("long", !0), 1);
      case "Z":
      case "ZZ":
        return Ca(new RegExp(`([+-]${o.source})(?::(${s.source}))?`), 2);
      case "ZZZ":
        return Ca(new RegExp(`([+-]${o.source})(${s.source})?`), 2);
      case "z":
        return pr(/[a-z_+-/]{1,256}?/i);
      case " ":
        return pr(/[^\S\n\r]/);
      default:
        return h(S);
    }
  })(t) || {
    invalidReason: cy
  };
  return T.token = t, T;
}
const hy = {
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
function my(t, e, r) {
  const {
    type: s,
    value: n
  } = t;
  if (s === "literal") {
    const c = /^\s+$/.test(n);
    return {
      literal: !c,
      val: c ? " " : n
    };
  }
  const i = e[s];
  let a = s;
  s === "hour" && (e.hour12 != null ? a = e.hour12 ? "hour12" : "hour24" : e.hourCycle != null ? e.hourCycle === "h11" || e.hourCycle === "h12" ? a = "hour12" : a = "hour24" : a = r.hour12 ? "hour12" : "hour24");
  let o = hy[a];
  if (typeof o == "object" && (o = o[i]), o)
    return {
      literal: !1,
      val: o
    };
}
function gy(t) {
  return [`^${t.map((r) => r.regex).reduce((r, s) => `${r}(${s.source})`, "")}$`, t];
}
function py(t, e, r) {
  const s = t.match(e);
  if (s) {
    const n = {};
    let i = 1;
    for (const a in r)
      if (kt(r, a)) {
        const o = r[a], c = o.groups ? o.groups + 1 : 1;
        !o.literal && o.token && (n[o.token.val[0]] = o.deser(s.slice(i, i + c))), i += c;
      }
    return [s, n];
  } else
    return [s, {}];
}
function yy(t) {
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
  let r = null, s;
  return I(t.z) || (r = xe.create(t.z)), I(t.Z) || (r || (r = new te(t.Z)), s = t.Z), I(t.q) || (t.M = (t.q - 1) * 3 + 1), I(t.h) || (t.h < 12 && t.a === 1 ? t.h += 12 : t.h === 12 && t.a === 0 && (t.h = 0)), t.G === 0 && t.y && (t.y = -t.y), I(t.u) || (t.S = Yn(t.u)), [Object.keys(t).reduce((i, a) => {
    const o = e(a);
    return o && (i[o] = t[a]), i;
  }, {}), r, s];
}
let Os = null;
function wy() {
  return Os || (Os = O.fromMillis(1555555555555)), Os;
}
function vy(t, e) {
  if (t.literal)
    return t;
  const r = Q.macroTokenToFormatOpts(t.val), s = sl(r, e);
  return s == null || s.includes(void 0) ? t : s;
}
function el(t, e) {
  return Array.prototype.concat(...t.map((r) => vy(r, e)));
}
class tl {
  constructor(e, r) {
    if (this.locale = e, this.format = r, this.tokens = el(Q.parseFormat(r), e), this.units = this.tokens.map((s) => dy(s, e)), this.disqualifyingUnit = this.units.find((s) => s.invalidReason), !this.disqualifyingUnit) {
      const [s, n] = gy(this.units);
      this.regex = RegExp(s, "i"), this.handlers = n;
    }
  }
  explainFromTokens(e) {
    if (this.isValid) {
      const [r, s] = py(e, this.regex, this.handlers), [n, i, a] = s ? yy(s) : [null, null, void 0];
      if (kt(s, "a") && kt(s, "H"))
        throw new wt("Can't include meridiem when specifying 24-hour format");
      return {
        input: e,
        tokens: this.tokens,
        regex: this.regex,
        rawMatches: r,
        matches: s,
        result: n,
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
function rl(t, e, r) {
  return new tl(t, r).explainFromTokens(e);
}
function _y(t, e, r) {
  const {
    result: s,
    zone: n,
    specificOffset: i,
    invalidReason: a
  } = rl(t, e, r);
  return [s, n, i, a];
}
function sl(t, e) {
  if (!t)
    return null;
  const s = Q.create(e, t).dtFormatter(wy()), n = s.formatToParts(), i = s.resolvedOptions();
  return n.map((a) => my(a, t, i));
}
const Is = "Invalid DateTime", Da = 864e13;
function Wt(t) {
  return new Ie("unsupported zone", `the zone "${t.name}" is not supported`);
}
function Cs(t) {
  return t.weekData === null && (t.weekData = Wr(t.c)), t.weekData;
}
function Ds(t) {
  return t.localWeekData === null && (t.localWeekData = Wr(t.c, t.loc.getMinDaysInFirstWeek(), t.loc.getStartOfWeek())), t.localWeekData;
}
function et(t, e) {
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
function nl(t, e, r) {
  let s = t - e * 60 * 1e3;
  const n = r.offset(s);
  if (e === n)
    return [s, e];
  s -= (n - e) * 60 * 1e3;
  const i = r.offset(s);
  return n === i ? [s, n] : [t - Math.min(n, i) * 60 * 1e3, Math.max(n, i)];
}
function yr(t, e) {
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
function Dr(t, e, r) {
  return nl(es(t), e, r);
}
function Ra(t, e) {
  const r = t.o, s = t.c.year + Math.trunc(e.years), n = t.c.month + Math.trunc(e.months) + Math.trunc(e.quarters) * 3, i = {
    ...t.c,
    year: s,
    month: n,
    day: Math.min(t.c.day, Ur(s, n)) + Math.trunc(e.days) + Math.trunc(e.weeks) * 7
  }, a = N.fromObject({
    years: e.years - Math.trunc(e.years),
    quarters: e.quarters - Math.trunc(e.quarters),
    months: e.months - Math.trunc(e.months),
    weeks: e.weeks - Math.trunc(e.weeks),
    days: e.days - Math.trunc(e.days),
    hours: e.hours,
    minutes: e.minutes,
    seconds: e.seconds,
    milliseconds: e.milliseconds
  }).as("milliseconds"), o = es(i);
  let [c, u] = nl(o, r, t.zone);
  return a !== 0 && (c += a, u = t.zone.offset(c)), {
    ts: c,
    o: u
  };
}
function pt(t, e, r, s, n, i) {
  const {
    setZone: a,
    zone: o
  } = r;
  if (t && Object.keys(t).length !== 0 || e) {
    const c = e || o, u = O.fromObject(t, {
      ...r,
      zone: c,
      specificOffset: i
    });
    return a ? u : u.setZone(o);
  } else
    return O.invalid(new Ie("unparsable", `the input "${n}" can't be parsed as ${s}`));
}
function wr(t, e, r = !0) {
  return t.isValid ? Q.create(L.create("en-US"), {
    allowZ: r,
    forceSimple: !0
  }).formatDateTimeFromString(t, e) : null;
}
function Rs(t, e) {
  const r = t.c.year > 9999 || t.c.year < 0;
  let s = "";
  return r && t.c.year >= 0 && (s += "+"), s += Z(t.c.year, r ? 6 : 4), e ? (s += "-", s += Z(t.c.month), s += "-", s += Z(t.c.day)) : (s += Z(t.c.month), s += Z(t.c.day)), s;
}
function Ma(t, e, r, s, n, i) {
  let a = Z(t.c.hour);
  return e ? (a += ":", a += Z(t.c.minute), (t.c.millisecond !== 0 || t.c.second !== 0 || !r) && (a += ":")) : a += Z(t.c.minute), (t.c.millisecond !== 0 || t.c.second !== 0 || !r) && (a += Z(t.c.second), (t.c.millisecond !== 0 || !s) && (a += ".", a += Z(t.c.millisecond, 3))), n && (t.isOffsetFixed && t.offset === 0 && !i ? a += "Z" : t.o < 0 ? (a += "-", a += Z(Math.trunc(-t.o / 60)), a += ":", a += Z(Math.trunc(-t.o % 60))) : (a += "+", a += Z(Math.trunc(t.o / 60)), a += ":", a += Z(Math.trunc(t.o % 60)))), i && (a += "[" + t.zone.ianaName + "]"), a;
}
const il = {
  month: 1,
  day: 1,
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0
}, Ty = {
  weekNumber: 1,
  weekday: 1,
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0
}, by = {
  ordinal: 1,
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0
}, al = ["year", "month", "day", "hour", "minute", "second", "millisecond"], Ey = ["weekYear", "weekNumber", "weekday", "hour", "minute", "second", "millisecond"], ky = ["year", "ordinal", "hour", "minute", "second", "millisecond"];
function Sy(t) {
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
  if (!e) throw new nu(t);
  return e;
}
function Na(t) {
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
      return Sy(t);
  }
}
function Oy(t) {
  if (Ut === void 0 && (Ut = V.now()), t.type !== "iana")
    return t.offset(Ut);
  const e = t.name;
  let r = mn.get(e);
  return r === void 0 && (r = t.offset(Ut), mn.set(e, r)), r;
}
function xa(t, e) {
  const r = Ge(e.zone, V.defaultZone);
  if (!r.isValid)
    return O.invalid(Wt(r));
  const s = L.fromObject(e);
  let n, i;
  if (I(t.year))
    n = V.now();
  else {
    for (const c of al)
      I(t[c]) && (t[c] = il[c]);
    const a = Mu(t) || Nu(t);
    if (a)
      return O.invalid(a);
    const o = Oy(r);
    [n, i] = Dr(t, o, r);
  }
  return new O({
    ts: n,
    zone: r,
    loc: s,
    o: i
  });
}
function Fa(t, e, r) {
  const s = I(r.round) ? !0 : r.round, n = (a, o) => (a = Zn(a, s || r.calendary ? 0 : 2, !0), e.loc.clone(r).relFormatter(r).format(a, o)), i = (a) => r.calendary ? e.hasSame(t, a) ? 0 : e.startOf(a).diff(t.startOf(a), a).get(a) : e.diff(t, a).get(a);
  if (r.unit)
    return n(i(r.unit), r.unit);
  for (const a of r.units) {
    const o = i(a);
    if (Math.abs(o) >= 1)
      return n(o, a);
  }
  return n(t > e ? -0 : 0, r.units[r.units.length - 1]);
}
function La(t) {
  let e = {}, r;
  return t.length > 0 && typeof t[t.length - 1] == "object" ? (e = t[t.length - 1], r = Array.from(t).slice(0, t.length - 1)) : r = Array.from(t), [e, r];
}
let Ut;
const mn = /* @__PURE__ */ new Map();
class O {
  /**
   * @access private
   */
  constructor(e) {
    const r = e.zone || V.defaultZone;
    let s = e.invalid || (Number.isNaN(e.ts) ? new Ie("invalid input") : null) || (r.isValid ? null : Wt(r));
    this.ts = I(e.ts) ? V.now() : e.ts;
    let n = null, i = null;
    if (!s)
      if (e.old && e.old.ts === this.ts && e.old.zone.equals(r))
        [n, i] = [e.old.c, e.old.o];
      else {
        const o = qe(e.o) && !e.old ? e.o : r.offset(this.ts);
        n = yr(this.ts, o), s = Number.isNaN(n.year) ? new Ie("invalid input") : null, n = s ? null : n, i = s ? null : o;
      }
    this._zone = r, this.loc = e.loc || L.create(), this.invalid = s, this.weekData = null, this.localWeekData = null, this.c = n, this.o = i, this.isLuxonDateTime = !0;
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
    const [e, r] = La(arguments), [s, n, i, a, o, c, u] = r;
    return xa({
      year: s,
      month: n,
      day: i,
      hour: a,
      minute: o,
      second: c,
      millisecond: u
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
    const [e, r] = La(arguments), [s, n, i, a, o, c, u] = r;
    return e.zone = te.utcInstance, xa({
      year: s,
      month: n,
      day: i,
      hour: a,
      minute: o,
      second: c,
      millisecond: u
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
    const s = rp(e) ? e.valueOf() : NaN;
    if (Number.isNaN(s))
      return O.invalid("invalid input");
    const n = Ge(r.zone, V.defaultZone);
    return n.isValid ? new O({
      ts: s,
      zone: n,
      loc: L.fromObject(r)
    }) : O.invalid(Wt(n));
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
      return e < -Da || e > Da ? O.invalid("Timestamp out of range") : new O({
        ts: e,
        zone: Ge(r.zone, V.defaultZone),
        loc: L.fromObject(r)
      });
    throw new X(`fromMillis requires a numerical input, but received a ${typeof e} with value ${e}`);
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
        zone: Ge(r.zone, V.defaultZone),
        loc: L.fromObject(r)
      });
    throw new X("fromSeconds requires a numerical input");
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
    const s = Ge(r.zone, V.defaultZone);
    if (!s.isValid)
      return O.invalid(Wt(s));
    const n = L.fromObject(r), i = $r(e, Na), {
      minDaysInFirstWeek: a,
      startOfWeek: o
    } = va(i, n), c = V.now(), u = I(r.specificOffset) ? s.offset(c) : r.specificOffset, l = !I(i.ordinal), f = !I(i.year), d = !I(i.month) || !I(i.day), h = f || d, m = i.weekYear || i.weekNumber;
    if ((h || l) && m)
      throw new wt("Can't mix weekYear/weekNumber units with year/month/day or ordinals");
    if (d && l)
      throw new wt("Can't mix ordinal dates with month/day");
    const T = m || i.weekday && !h;
    let S, _, M = yr(c, u);
    T ? (S = Ey, _ = Ty, M = Wr(M, a, o)) : l ? (S = ky, _ = by, M = Ss(M)) : (S = al, _ = il);
    let U = !1;
    for (const Fe of S) {
      const is = i[Fe];
      I(is) ? U ? i[Fe] = _[Fe] : i[Fe] = M[Fe] : U = !0;
    }
    const re = T ? Qg(i, a, o) : l ? ep(i) : Mu(i), K = re || Nu(i);
    if (K)
      return O.invalid(K);
    const cr = T ? ya(i, a, o) : l ? wa(i) : i, [Ke, xt] = Dr(cr, u, s), De = new O({
      ts: Ke,
      zone: s,
      o: xt,
      loc: n
    });
    return i.weekday && h && e.weekday !== De.weekday ? O.invalid("mismatched weekday", `you can't specify both a weekday of ${i.weekday} and a date of ${De.toISO()}`) : De.isValid ? De : O.invalid(De.invalid);
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
    const [s, n] = Gp(e);
    return pt(s, n, r, "ISO 8601", e);
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
    const [s, n] = Bp(e);
    return pt(s, n, r, "RFC 2822", e);
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
    const [s, n] = qp(e);
    return pt(s, n, r, "HTTP", r);
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
  static fromFormat(e, r, s = {}) {
    if (I(e) || I(r))
      throw new X("fromFormat requires an input string and a format");
    const {
      locale: n = null,
      numberingSystem: i = null
    } = s, a = L.fromOpts({
      locale: n,
      numberingSystem: i,
      defaultToEN: !0
    }), [o, c, u, l] = _y(a, e, r);
    return l ? O.invalid(l) : pt(o, c, s, `format ${r}`, e, u);
  }
  /**
   * @deprecated use fromFormat instead
   */
  static fromString(e, r, s = {}) {
    return O.fromFormat(e, r, s);
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
    const [s, n] = ey(e);
    return pt(s, n, r, "SQL", e);
  }
  /**
   * Create an invalid DateTime.
   * @param {string} reason - simple string of why this DateTime is invalid. Should not contain parameters or anything else data-dependent.
   * @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
   * @return {DateTime}
   */
  static invalid(e, r = null) {
    if (!e)
      throw new X("need to specify a reason the DateTime is invalid");
    const s = e instanceof Ie ? e : new Ie(e, r);
    if (V.throwOnInvalid)
      throw new Cg(s);
    return new O({
      invalid: s
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
    const s = sl(e, L.fromObject(r));
    return s ? s.map((n) => n ? n.val : null).join("") : null;
  }
  /**
   * Produce the the fully expanded format token for the locale
   * Does NOT quote characters, so quoted tokens will not round trip correctly
   * @param fmt
   * @param localeOpts
   * @returns {string}
   */
  static expandFormat(e, r = {}) {
    return el(Q.parseFormat(e), L.fromObject(r)).map((n) => n.val).join("");
  }
  static resetCache() {
    Ut = void 0, mn.clear();
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
    return this.isValid ? Cs(this).weekYear : NaN;
  }
  /**
   * Get the week number of the week year (1-52ish).
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2017, 5, 25).weekNumber //=> 21
   * @type {number}
   */
  get weekNumber() {
    return this.isValid ? Cs(this).weekNumber : NaN;
  }
  /**
   * Get the day of the week.
   * 1 is Monday and 7 is Sunday
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2014, 11, 31).weekday //=> 4
   * @type {number}
   */
  get weekday() {
    return this.isValid ? Cs(this).weekday : NaN;
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
    return this.isValid ? Ds(this).weekday : NaN;
  }
  /**
   * Get the week number of the week year according to the locale. Different locales assign week numbers differently,
   * because the week can start on different days of the week (see localWeekday) and because a different number of days
   * is required for a week to count as the first week of a year.
   * @returns {number}
   */
  get localWeekNumber() {
    return this.isValid ? Ds(this).weekNumber : NaN;
  }
  /**
   * Get the week year according to the locale. Different locales assign week numbers (and therefor week years)
   * differently, see localWeekNumber.
   * @returns {number}
   */
  get localWeekYear() {
    return this.isValid ? Ds(this).weekYear : NaN;
  }
  /**
   * Get the ordinal (meaning the day of the year)
   * @example DateTime.local(2017, 5, 25).ordinal //=> 145
   * @type {number|DateTime}
   */
  get ordinal() {
    return this.isValid ? Ss(this.c).ordinal : NaN;
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
    const e = 864e5, r = 6e4, s = es(this.c), n = this.zone.offset(s - e), i = this.zone.offset(s + e), a = this.zone.offset(s - n * r), o = this.zone.offset(s - i * r);
    if (a === o)
      return [this];
    const c = s - a * r, u = s - o * r, l = yr(c, a), f = yr(u, o);
    return l.hour === f.hour && l.minute === f.minute && l.second === f.second && l.millisecond === f.millisecond ? [et(this, {
      ts: c
    }), et(this, {
      ts: u
    })] : [this];
  }
  /**
   * Returns true if this DateTime is in a leap year, false otherwise
   * @example DateTime.local(2016).isInLeapYear //=> true
   * @example DateTime.local(2013).isInLeapYear //=> false
   * @type {boolean}
   */
  get isInLeapYear() {
    return rr(this.year);
  }
  /**
   * Returns the number of days in this DateTime's month
   * @example DateTime.local(2016, 2).daysInMonth //=> 29
   * @example DateTime.local(2016, 3).daysInMonth //=> 31
   * @type {number}
   */
  get daysInMonth() {
    return Ur(this.year, this.month);
  }
  /**
   * Returns the number of days in this DateTime's year
   * @example DateTime.local(2016).daysInYear //=> 366
   * @example DateTime.local(2013).daysInYear //=> 365
   * @type {number}
   */
  get daysInYear() {
    return this.isValid ? _t(this.year) : NaN;
  }
  /**
   * Returns the number of weeks in this DateTime's year
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2004).weeksInWeekYear //=> 53
   * @example DateTime.local(2013).weeksInWeekYear //=> 52
   * @type {number}
   */
  get weeksInWeekYear() {
    return this.isValid ? qt(this.weekYear) : NaN;
  }
  /**
   * Returns the number of weeks in this DateTime's local week year
   * @example DateTime.local(2020, 6, {locale: 'en-US'}).weeksInLocalWeekYear //=> 52
   * @example DateTime.local(2020, 6, {locale: 'de-DE'}).weeksInLocalWeekYear //=> 53
   * @type {number}
   */
  get weeksInLocalWeekYear() {
    return this.isValid ? qt(this.localWeekYear, this.loc.getMinDaysInFirstWeek(), this.loc.getStartOfWeek()) : NaN;
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
      numberingSystem: s,
      calendar: n
    } = Q.create(this.loc.clone(e), e).resolvedOptions(this);
    return {
      locale: r,
      numberingSystem: s,
      outputCalendar: n
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
    return this.setZone(te.instance(e), r);
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
    keepCalendarTime: s = !1
  } = {}) {
    if (e = Ge(e, V.defaultZone), e.equals(this.zone))
      return this;
    if (e.isValid) {
      let n = this.ts;
      if (r || s) {
        const i = e.offset(this.ts), a = this.toObject();
        [n] = Dr(a, i, e);
      }
      return et(this, {
        ts: n,
        zone: e
      });
    } else
      return O.invalid(Wt(e));
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
    outputCalendar: s
  } = {}) {
    const n = this.loc.clone({
      locale: e,
      numberingSystem: r,
      outputCalendar: s
    });
    return et(this, {
      loc: n
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
    const r = $r(e, Na), {
      minDaysInFirstWeek: s,
      startOfWeek: n
    } = va(r, this.loc), i = !I(r.weekYear) || !I(r.weekNumber) || !I(r.weekday), a = !I(r.ordinal), o = !I(r.year), c = !I(r.month) || !I(r.day), u = o || c, l = r.weekYear || r.weekNumber;
    if ((u || a) && l)
      throw new wt("Can't mix weekYear/weekNumber units with year/month/day or ordinals");
    if (c && a)
      throw new wt("Can't mix ordinal dates with month/day");
    let f;
    i ? f = ya({
      ...Wr(this.c, s, n),
      ...r
    }, s, n) : I(r.ordinal) ? (f = {
      ...this.toObject(),
      ...r
    }, I(r.day) && (f.day = Math.min(Ur(f.year, f.month), f.day))) : f = wa({
      ...Ss(this.c),
      ...r
    });
    const [d, h] = Dr(f, this.o, this.zone);
    return et(this, {
      ts: d,
      o: h
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
    const r = N.fromDurationLike(e);
    return et(this, Ra(this, r));
  }
  /**
   * Subtract a period of time to this DateTime and return the resulting DateTime
   * See {@link DateTime#plus}
   * @param {Duration|Object|number} duration - The amount to subtract. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   @return {DateTime}
   */
  minus(e) {
    if (!this.isValid) return this;
    const r = N.fromDurationLike(e).negate();
    return et(this, Ra(this, r));
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
    const s = {}, n = N.normalizeUnit(e);
    switch (n) {
      case "years":
        s.month = 1;
      case "quarters":
      case "months":
        s.day = 1;
      case "weeks":
      case "days":
        s.hour = 0;
      case "hours":
        s.minute = 0;
      case "minutes":
        s.second = 0;
      case "seconds":
        s.millisecond = 0;
        break;
    }
    if (n === "weeks")
      if (r) {
        const i = this.loc.getStartOfWeek(), {
          weekday: a
        } = this;
        a < i && (s.weekNumber = this.weekNumber - 1), s.weekday = i;
      } else
        s.weekday = 1;
    if (n === "quarters") {
      const i = Math.ceil(this.month / 3);
      s.month = (i - 1) * 3 + 1;
    }
    return this.set(s);
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
    return this.isValid ? Q.create(this.loc.redefaultToEN(r)).formatDateTimeFromString(this, e) : Is;
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
  toLocaleString(e = Pr, r = {}) {
    return this.isValid ? Q.create(this.loc.clone(r), e).formatDateTime(this) : Is;
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
    return this.isValid ? Q.create(this.loc.clone(e), e).formatDateTimeParts(this) : [];
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
   * @return {string|null}
   */
  toISO({
    format: e = "extended",
    suppressSeconds: r = !1,
    suppressMilliseconds: s = !1,
    includeOffset: n = !0,
    extendedZone: i = !1
  } = {}) {
    if (!this.isValid)
      return null;
    const a = e === "extended";
    let o = Rs(this, a);
    return o += "T", o += Ma(this, a, r, s, n, i), o;
  }
  /**
   * Returns an ISO 8601-compliant string representation of this DateTime's date component
   * @param {Object} opts - options
   * @param {string} [opts.format='extended'] - choose between the basic and extended format
   * @example DateTime.utc(1982, 5, 25).toISODate() //=> '1982-05-25'
   * @example DateTime.utc(1982, 5, 25).toISODate({ format: 'basic' }) //=> '19820525'
   * @return {string|null}
   */
  toISODate({
    format: e = "extended"
  } = {}) {
    return this.isValid ? Rs(this, e === "extended") : null;
  }
  /**
   * Returns an ISO 8601-compliant string representation of this DateTime's week date
   * @example DateTime.utc(1982, 5, 25).toISOWeekDate() //=> '1982-W21-2'
   * @return {string}
   */
  toISOWeekDate() {
    return wr(this, "kkkk-'W'WW-c");
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
    includeOffset: s = !0,
    includePrefix: n = !1,
    extendedZone: i = !1,
    format: a = "extended"
  } = {}) {
    return this.isValid ? (n ? "T" : "") + Ma(this, a === "extended", r, e, s, i) : null;
  }
  /**
   * Returns an RFC 2822-compatible string representation of this DateTime
   * @example DateTime.utc(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 +0000'
   * @example DateTime.local(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 -0400'
   * @return {string}
   */
  toRFC2822() {
    return wr(this, "EEE, dd LLL yyyy HH:mm:ss ZZZ", !1);
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
    return wr(this.toUTC(), "EEE, dd LLL yyyy HH:mm:ss 'GMT'");
  }
  /**
   * Returns a string representation of this DateTime appropriate for use in SQL Date
   * @example DateTime.utc(2014, 7, 13).toSQLDate() //=> '2014-07-13'
   * @return {string|null}
   */
  toSQLDate() {
    return this.isValid ? Rs(this, !0) : null;
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
    includeOffsetSpace: s = !0
  } = {}) {
    let n = "HH:mm:ss.SSS";
    return (r || e) && (s && (n += " "), r ? n += "z" : e && (n += "ZZ")), wr(this, n, !0);
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
    return this.isValid ? this.toISO() : Is;
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
   * Returns the epoch seconds (including milliseconds in the fractional part) of this DateTime.
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
  diff(e, r = "milliseconds", s = {}) {
    if (!this.isValid || !e.isValid)
      return N.invalid("created by diffing an invalid DateTime");
    const n = {
      locale: this.locale,
      numberingSystem: this.numberingSystem,
      ...s
    }, i = sp(r).map(N.normalizeUnit), a = e.valueOf() > this.valueOf(), o = a ? this : e, c = a ? e : this, u = oy(o, c, i, n);
    return a ? u.negate() : u;
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
   * @return {Interval|DateTime}
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
  hasSame(e, r, s) {
    if (!this.isValid) return !1;
    const n = e.valueOf(), i = this.setZone(e.zone, {
      keepLocalTime: !0
    });
    return i.startOf(r, s) <= n && n <= i.endOf(r, s);
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
    }), s = e.padding ? this < r ? -e.padding : e.padding : 0;
    let n = ["years", "months", "days", "hours", "minutes", "seconds"], i = e.unit;
    return Array.isArray(e.unit) && (n = e.unit, i = void 0), Fa(r, this.plus(s), {
      ...e,
      numeric: "always",
      units: n,
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
    return this.isValid ? Fa(e.base || O.fromObject({}, {
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
      throw new X("min requires all arguments be DateTimes");
    return _a(e, (r) => r.valueOf(), Math.min);
  }
  /**
   * Return the max of several date times
   * @param {...DateTime} dateTimes - the DateTimes from which to choose the maximum
   * @return {DateTime} the max DateTime, or undefined if called with no argument
   */
  static max(...e) {
    if (!e.every(O.isDateTime))
      throw new X("max requires all arguments be DateTimes");
    return _a(e, (r) => r.valueOf(), Math.max);
  }
  // MISC
  /**
   * Explain how a string would be parsed by fromFormat()
   * @param {string} text - the string to parse
   * @param {string} fmt - the format the string is expected to be in (see description)
   * @param {Object} options - options taken by fromFormat()
   * @return {Object}
   */
  static fromFormatExplain(e, r, s = {}) {
    const {
      locale: n = null,
      numberingSystem: i = null
    } = s, a = L.fromOpts({
      locale: n,
      numberingSystem: i,
      defaultToEN: !0
    });
    return rl(a, e, r);
  }
  /**
   * @deprecated use fromFormatExplain instead
   */
  static fromStringExplain(e, r, s = {}) {
    return O.fromFormatExplain(e, r, s);
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
      locale: s = null,
      numberingSystem: n = null
    } = r, i = L.fromOpts({
      locale: s,
      numberingSystem: n,
      defaultToEN: !0
    });
    return new tl(i, e);
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
  static fromFormatParser(e, r, s = {}) {
    if (I(e) || I(r))
      throw new X("fromFormatParser requires an input string and a format parser");
    const {
      locale: n = null,
      numberingSystem: i = null
    } = s, a = L.fromOpts({
      locale: n,
      numberingSystem: i,
      defaultToEN: !0
    });
    if (!a.equals(r.locale))
      throw new X(`fromFormatParser called with a locale of ${a}, but the format parser was created for ${r.locale}`);
    const {
      result: o,
      zone: c,
      specificOffset: u,
      invalidReason: l
    } = r.explainFromTokens(e);
    return l ? O.invalid(l) : pt(o, c, s, `format ${r.format}`, e, u);
  }
  // FORMAT PRESETS
  /**
   * {@link DateTime#toLocaleString} format like 10/14/1983
   * @type {Object}
   */
  static get DATE_SHORT() {
    return Pr;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Oct 14, 1983'
   * @type {Object}
   */
  static get DATE_MED() {
    return iu;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Fri, Oct 14, 1983'
   * @type {Object}
   */
  static get DATE_MED_WITH_WEEKDAY() {
    return Mg;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'October 14, 1983'
   * @type {Object}
   */
  static get DATE_FULL() {
    return au;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Tuesday, October 14, 1983'
   * @type {Object}
   */
  static get DATE_HUGE() {
    return ou;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_SIMPLE() {
    return cu;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_WITH_SECONDS() {
    return uu;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 AM EDT'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_WITH_SHORT_OFFSET() {
    return lu;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 AM Eastern Daylight Time'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_WITH_LONG_OFFSET() {
    return fu;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_SIMPLE() {
    return du;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_WITH_SECONDS() {
    return hu;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 EDT', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_WITH_SHORT_OFFSET() {
    return mu;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 Eastern Daylight Time', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_WITH_LONG_OFFSET() {
    return gu;
  }
  /**
   * {@link DateTime#toLocaleString} format like '10/14/1983, 9:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_SHORT() {
    return pu;
  }
  /**
   * {@link DateTime#toLocaleString} format like '10/14/1983, 9:30:33 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_SHORT_WITH_SECONDS() {
    return yu;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Oct 14, 1983, 9:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_MED() {
    return wu;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Oct 14, 1983, 9:30:33 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_MED_WITH_SECONDS() {
    return vu;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Fri, 14 Oct 1983, 9:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_MED_WITH_WEEKDAY() {
    return Ng;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'October 14, 1983, 9:30 AM EDT'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_FULL() {
    return _u;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'October 14, 1983, 9:30:33 AM EDT'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_FULL_WITH_SECONDS() {
    return Tu;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Friday, October 14, 1983, 9:30 AM Eastern Daylight Time'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_HUGE() {
    return bu;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Friday, October 14, 1983, 9:30:33 AM Eastern Daylight Time'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_HUGE_WITH_SECONDS() {
    return Eu;
  }
}
function Lt(t) {
  if (O.isDateTime(t))
    return t;
  if (t && t.valueOf && qe(t.valueOf()))
    return O.fromJSDate(t);
  if (t && typeof t == "object")
    return O.fromObject(t);
  throw new X(`Unknown datetime argument: ${t}, of type ${typeof t}`);
}
const Iy = "3.6.1";
pe.DateTime = O;
pe.Duration = N;
pe.FixedOffsetZone = te;
pe.IANAZone = xe;
pe.Info = Pt;
pe.Interval = z;
pe.InvalidZone = Ou;
pe.Settings = V;
pe.SystemZone = tr;
pe.VERSION = Iy;
pe.Zone = It;
var tt = pe;
D.prototype.addYear = function() {
  this._date = this._date.plus({ years: 1 });
};
D.prototype.addMonth = function() {
  this._date = this._date.plus({ months: 1 }).startOf("month");
};
D.prototype.addDay = function() {
  this._date = this._date.plus({ days: 1 }).startOf("day");
};
D.prototype.addHour = function() {
  var t = this._date;
  this._date = this._date.plus({ hours: 1 }).startOf("hour"), this._date <= t && (this._date = this._date.plus({ hours: 1 }));
};
D.prototype.addMinute = function() {
  var t = this._date;
  this._date = this._date.plus({ minutes: 1 }).startOf("minute"), this._date < t && (this._date = this._date.plus({ hours: 1 }));
};
D.prototype.addSecond = function() {
  var t = this._date;
  this._date = this._date.plus({ seconds: 1 }).startOf("second"), this._date < t && (this._date = this._date.plus({ hours: 1 }));
};
D.prototype.subtractYear = function() {
  this._date = this._date.minus({ years: 1 });
};
D.prototype.subtractMonth = function() {
  this._date = this._date.minus({ months: 1 }).endOf("month").startOf("second");
};
D.prototype.subtractDay = function() {
  this._date = this._date.minus({ days: 1 }).endOf("day").startOf("second");
};
D.prototype.subtractHour = function() {
  var t = this._date;
  this._date = this._date.minus({ hours: 1 }).endOf("hour").startOf("second"), this._date >= t && (this._date = this._date.minus({ hours: 1 }));
};
D.prototype.subtractMinute = function() {
  var t = this._date;
  this._date = this._date.minus({ minutes: 1 }).endOf("minute").startOf("second"), this._date > t && (this._date = this._date.minus({ hours: 1 }));
};
D.prototype.subtractSecond = function() {
  var t = this._date;
  this._date = this._date.minus({ seconds: 1 }).startOf("second"), this._date > t && (this._date = this._date.minus({ hours: 1 }));
};
D.prototype.getDate = function() {
  return this._date.day;
};
D.prototype.getFullYear = function() {
  return this._date.year;
};
D.prototype.getDay = function() {
  var t = this._date.weekday;
  return t == 7 ? 0 : t;
};
D.prototype.getMonth = function() {
  return this._date.month - 1;
};
D.prototype.getHours = function() {
  return this._date.hour;
};
D.prototype.getMinutes = function() {
  return this._date.minute;
};
D.prototype.getSeconds = function() {
  return this._date.second;
};
D.prototype.getMilliseconds = function() {
  return this._date.millisecond;
};
D.prototype.getTime = function() {
  return this._date.valueOf();
};
D.prototype.getUTCDate = function() {
  return this._getUTC().day;
};
D.prototype.getUTCFullYear = function() {
  return this._getUTC().year;
};
D.prototype.getUTCDay = function() {
  var t = this._getUTC().weekday;
  return t == 7 ? 0 : t;
};
D.prototype.getUTCMonth = function() {
  return this._getUTC().month - 1;
};
D.prototype.getUTCHours = function() {
  return this._getUTC().hour;
};
D.prototype.getUTCMinutes = function() {
  return this._getUTC().minute;
};
D.prototype.getUTCSeconds = function() {
  return this._getUTC().second;
};
D.prototype.toISOString = function() {
  return this._date.toUTC().toISO();
};
D.prototype.toJSON = function() {
  return this._date.toJSON();
};
D.prototype.setDate = function(t) {
  this._date = this._date.set({ day: t });
};
D.prototype.setFullYear = function(t) {
  this._date = this._date.set({ year: t });
};
D.prototype.setDay = function(t) {
  this._date = this._date.set({ weekday: t });
};
D.prototype.setMonth = function(t) {
  this._date = this._date.set({ month: t + 1 });
};
D.prototype.setHours = function(t) {
  this._date = this._date.set({ hour: t });
};
D.prototype.setMinutes = function(t) {
  this._date = this._date.set({ minute: t });
};
D.prototype.setSeconds = function(t) {
  this._date = this._date.set({ second: t });
};
D.prototype.setMilliseconds = function(t) {
  this._date = this._date.set({ millisecond: t });
};
D.prototype._getUTC = function() {
  return this._date.toUTC();
};
D.prototype.toString = function() {
  return this.toDate().toString();
};
D.prototype.toDate = function() {
  return this._date.toJSDate();
};
D.prototype.isLastDayOfMonth = function() {
  var t = this._date.plus({ days: 1 }).startOf("day");
  return this._date.month !== t.month;
};
D.prototype.isLastWeekdayOfMonth = function() {
  var t = this._date.plus({ days: 7 }).startOf("day");
  return this._date.month !== t.month;
};
function D(t, e) {
  var r = { zone: e };
  if (t ? t instanceof D ? this._date = t._date : t instanceof Date ? this._date = tt.DateTime.fromJSDate(t, r) : typeof t == "number" ? this._date = tt.DateTime.fromMillis(t, r) : typeof t == "string" && (this._date = tt.DateTime.fromISO(t, r), this._date.isValid || (this._date = tt.DateTime.fromRFC2822(t, r)), this._date.isValid || (this._date = tt.DateTime.fromSQL(t, r)), this._date.isValid || (this._date = tt.DateTime.fromFormat(t, "EEE, d MMM yyyy HH:mm:ss", r))) : this._date = tt.DateTime.local(), !this._date || !this._date.isValid)
    throw new Error("CronDate: unhandled timestamp: " + JSON.stringify(t));
  e && e !== this._date.zoneName && (this._date = this._date.setZone(e));
}
var Qn = D;
function rt(t) {
  return {
    start: t,
    count: 1
  };
}
function Aa(t, e) {
  t.end = e, t.step = e - t.start, t.count = 2;
}
function Ms(t, e, r) {
  e && (e.count === 2 ? (t.push(rt(e.start)), t.push(rt(e.end))) : t.push(e)), r && t.push(r);
}
function Cy(t) {
  for (var e = [], r = void 0, s = 0; s < t.length; s++) {
    var n = t[s];
    typeof n != "number" ? (Ms(e, r, rt(n)), r = void 0) : r ? r.count === 1 ? Aa(r, n) : r.step === n - r.end ? (r.count++, r.end = n) : r.count === 2 ? (e.push(rt(r.start)), r = rt(r.end), Aa(r, n)) : (Ms(e, r), r = rt(n)) : r = rt(n);
  }
  return Ms(e, r), e;
}
var Dy = Cy, Ry = Dy;
function My(t, e, r) {
  var s = Ry(t);
  if (s.length === 1) {
    var n = s[0], i = n.step;
    if (i === 1 && n.start === e && n.end === r)
      return "*";
    if (i !== 1 && n.start === e && n.end === r - i + 1)
      return "*/" + i;
  }
  for (var a = [], o = 0, c = s.length; o < c; ++o) {
    var u = s[o];
    if (u.count === 1) {
      a.push(u.start);
      continue;
    }
    var i = u.step;
    if (u.step === 1) {
      a.push(u.start + "-" + u.end);
      continue;
    }
    var l = u.start == 0 ? u.count - 1 : u.count;
    u.step * l > u.end ? a = a.concat(
      Array.from({ length: u.end - u.start + 1 }).map(function(d, h) {
        var m = u.start + h;
        return (m - u.start) % u.step === 0 ? m : null;
      }).filter(function(d) {
        return d != null;
      })
    ) : u.end === r - u.step + 1 ? a.push(u.start + "/" + u.step) : a.push(u.start + "-" + u.end + "/" + u.step);
  }
  return a.join(",");
}
var Ny = My, ut = Qn, xy = Ny, Pa = 1e4;
function v(t, e) {
  this._options = e, this._utc = e.utc || !1, this._tz = this._utc ? "UTC" : e.tz, this._currentDate = new ut(e.currentDate, this._tz), this._startDate = e.startDate ? new ut(e.startDate, this._tz) : null, this._endDate = e.endDate ? new ut(e.endDate, this._tz) : null, this._isIterator = e.iterator || !1, this._hasIterated = !1, this._nthDayOfWeek = e.nthDayOfWeek || 0, this.fields = v._freezeFields(t);
}
v.map = ["second", "minute", "hour", "dayOfMonth", "month", "dayOfWeek"];
v.predefined = {
  "@yearly": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@hourly": "0 * * * *"
};
v.constraints = [
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
v.daysInMonth = [
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
v.aliases = {
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
v.parseDefaults = ["0", "*", "*", "*", "*", "*"];
v.standardValidCharacters = /^[,*\d/-]+$/;
v.dayOfWeekValidCharacters = /^[?,*\dL#/-]+$/;
v.dayOfMonthValidCharacters = /^[?,*\dL/-]+$/;
v.validCharacters = {
  second: v.standardValidCharacters,
  minute: v.standardValidCharacters,
  hour: v.standardValidCharacters,
  dayOfMonth: v.dayOfMonthValidCharacters,
  month: v.standardValidCharacters,
  dayOfWeek: v.dayOfWeekValidCharacters
};
v._isValidConstraintChar = function(e, r) {
  return typeof r != "string" ? !1 : e.chars.some(function(s) {
    return r.indexOf(s) > -1;
  });
};
v._parseField = function(e, r, s) {
  switch (e) {
    case "month":
    case "dayOfWeek":
      var n = v.aliases[e];
      r = r.replace(/[a-z]{3}/gi, function(c) {
        if (c = c.toLowerCase(), typeof n[c] < "u")
          return n[c];
        throw new Error('Validation error, cannot resolve alias "' + c + '"');
      });
      break;
  }
  if (!v.validCharacters[e].test(r))
    throw new Error("Invalid characters, got value: " + r);
  r.indexOf("*") !== -1 ? r = r.replace(/\*/g, s.min + "-" + s.max) : r.indexOf("?") !== -1 && (r = r.replace(/\?/g, s.min + "-" + s.max));
  function i(c) {
    var u = [];
    function l(m) {
      if (m instanceof Array)
        for (var T = 0, S = m.length; T < S; T++) {
          var _ = m[T];
          if (v._isValidConstraintChar(s, _)) {
            u.push(_);
            continue;
          }
          if (typeof _ != "number" || Number.isNaN(_) || _ < s.min || _ > s.max)
            throw new Error(
              "Constraint error, got value " + _ + " expected range " + s.min + "-" + s.max
            );
          u.push(_);
        }
      else {
        if (v._isValidConstraintChar(s, m)) {
          u.push(m);
          return;
        }
        var M = +m;
        if (Number.isNaN(M) || M < s.min || M > s.max)
          throw new Error(
            "Constraint error, got value " + m + " expected range " + s.min + "-" + s.max
          );
        e === "dayOfWeek" && (M = M % 7), u.push(M);
      }
    }
    var f = c.split(",");
    if (!f.every(function(m) {
      return m.length > 0;
    }))
      throw new Error("Invalid list value format");
    if (f.length > 1)
      for (var d = 0, h = f.length; d < h; d++)
        l(a(f[d]));
    else
      l(a(c));
    return u.sort(v._sortCompareFn), u;
  }
  function a(c) {
    var u = 1, l = c.split("/");
    if (l.length > 2)
      throw new Error("Invalid repeat: " + c);
    return l.length > 1 ? (l[0] == +l[0] && (l = [l[0] + "-" + s.max, l[1]]), o(l[0], l[l.length - 1])) : o(c, u);
  }
  function o(c, u) {
    var l = [], f = c.split("-");
    if (f.length > 1) {
      if (f.length < 2)
        return +c;
      if (!f[0].length) {
        if (!f[1].length)
          throw new Error("Invalid range: " + c);
        return +c;
      }
      var d = +f[0], h = +f[1];
      if (Number.isNaN(d) || Number.isNaN(h) || d < s.min || h > s.max)
        throw new Error(
          "Constraint error, got range " + d + "-" + h + " expected range " + s.min + "-" + s.max
        );
      if (d > h)
        throw new Error("Invalid range: " + c);
      var m = +u;
      if (Number.isNaN(m) || m <= 0)
        throw new Error("Constraint error, cannot repeat at every " + m + " time.");
      e === "dayOfWeek" && h % 7 === 0 && l.push(0);
      for (var T = d, S = h; T <= S; T++) {
        var _ = l.indexOf(T) !== -1;
        !_ && m > 0 && m % u === 0 ? (m = 1, l.push(T)) : m++;
      }
      return l;
    }
    return Number.isNaN(+c) ? c : +c;
  }
  return i(r);
};
v._sortCompareFn = function(t, e) {
  var r = typeof t == "number", s = typeof e == "number";
  return r && s ? t - e : !r && s ? 1 : r && !s ? -1 : t.localeCompare(e);
};
v._handleMaxDaysInMonth = function(t) {
  if (t.month.length === 1) {
    var e = v.daysInMonth[t.month[0] - 1];
    if (t.dayOfMonth[0] > e)
      throw new Error("Invalid explicit day of month definition");
    return t.dayOfMonth.filter(function(r) {
      return r === "L" ? !0 : r <= e;
    }).sort(v._sortCompareFn);
  }
};
v._freezeFields = function(t) {
  for (var e = 0, r = v.map.length; e < r; ++e) {
    var s = v.map[e], n = t[s];
    t[s] = Object.freeze(n);
  }
  return Object.freeze(t);
};
v.prototype._applyTimezoneShift = function(t, e, r) {
  if (r === "Month" || r === "Day") {
    var s = t.getTime();
    t[e + r]();
    var n = t.getTime();
    s === n && (t.getMinutes() === 0 && t.getSeconds() === 0 ? t.addHour() : t.getMinutes() === 59 && t.getSeconds() === 59 && t.subtractHour());
  } else {
    var i = t.getHours();
    t[e + r]();
    var a = t.getHours(), o = a - i;
    o === 2 ? this.fields.hour.length !== 24 && (this._dstStart = a) : o === 0 && t.getMinutes() === 0 && t.getSeconds() === 0 && this.fields.hour.length !== 24 && (this._dstEnd = a);
  }
};
v.prototype._findSchedule = function(e) {
  function r(_, M) {
    for (var U = 0, re = M.length; U < re; U++)
      if (M[U] >= _)
        return M[U] === _;
    return M[0] === _;
  }
  function s(_, M) {
    if (M < 6) {
      if (_.getDate() < 8 && M === 1)
        return !0;
      var U = _.getDate() % 7 ? 1 : 0, re = _.getDate() - _.getDate() % 7, K = Math.floor(re / 7) + U;
      return K === M;
    }
    return !1;
  }
  function n(_) {
    return _.length > 0 && _.some(function(M) {
      return typeof M == "string" && M.indexOf("L") >= 0;
    });
  }
  e = e || !1;
  var i = e ? "subtract" : "add", a = new ut(this._currentDate, this._tz), o = this._startDate, c = this._endDate, u = a.getTime(), l = 0;
  function f(_) {
    return _.some(function(M) {
      if (!n([M]))
        return !1;
      var U = Number.parseInt(M[0]) % 7;
      if (Number.isNaN(U))
        throw new Error("Invalid last weekday of the month expression: " + M);
      return a.getDay() === U && a.isLastWeekdayOfMonth();
    });
  }
  for (; l < Pa; ) {
    if (l++, e) {
      if (o && a.getTime() - o.getTime() < 0)
        throw new Error("Out of the timespan range");
    } else if (c && c.getTime() - a.getTime() < 0)
      throw new Error("Out of the timespan range");
    var d = r(a.getDate(), this.fields.dayOfMonth);
    n(this.fields.dayOfMonth) && (d = d || a.isLastDayOfMonth());
    var h = r(a.getDay(), this.fields.dayOfWeek);
    n(this.fields.dayOfWeek) && (h = h || f(this.fields.dayOfWeek));
    var m = this.fields.dayOfMonth.length >= v.daysInMonth[a.getMonth()], T = this.fields.dayOfWeek.length === v.constraints[5].max - v.constraints[5].min + 1, S = a.getHours();
    if (!d && (!h || T)) {
      this._applyTimezoneShift(a, i, "Day");
      continue;
    }
    if (!m && T && !d) {
      this._applyTimezoneShift(a, i, "Day");
      continue;
    }
    if (m && !T && !h) {
      this._applyTimezoneShift(a, i, "Day");
      continue;
    }
    if (this._nthDayOfWeek > 0 && !s(a, this._nthDayOfWeek)) {
      this._applyTimezoneShift(a, i, "Day");
      continue;
    }
    if (!r(a.getMonth() + 1, this.fields.month)) {
      this._applyTimezoneShift(a, i, "Month");
      continue;
    }
    if (r(S, this.fields.hour)) {
      if (this._dstEnd === S && !e) {
        this._dstEnd = null, this._applyTimezoneShift(a, "add", "Hour");
        continue;
      }
    } else if (this._dstStart !== S) {
      this._dstStart = null, this._applyTimezoneShift(a, i, "Hour");
      continue;
    } else if (!r(S - 1, this.fields.hour)) {
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
    if (u === a.getTime()) {
      i === "add" || a.getMilliseconds() === 0 ? this._applyTimezoneShift(a, i, "Second") : a.setMilliseconds(0);
      continue;
    }
    break;
  }
  if (l >= Pa)
    throw new Error("Invalid expression, loop limit exceeded");
  return this._currentDate = new ut(a, this._tz), this._hasIterated = !0, a;
};
v.prototype.next = function() {
  var e = this._findSchedule();
  return this._isIterator ? {
    value: e,
    done: !this.hasNext()
  } : e;
};
v.prototype.prev = function() {
  var e = this._findSchedule(!0);
  return this._isIterator ? {
    value: e,
    done: !this.hasPrev()
  } : e;
};
v.prototype.hasNext = function() {
  var t = this._currentDate, e = this._hasIterated;
  try {
    return this._findSchedule(), !0;
  } catch {
    return !1;
  } finally {
    this._currentDate = t, this._hasIterated = e;
  }
};
v.prototype.hasPrev = function() {
  var t = this._currentDate, e = this._hasIterated;
  try {
    return this._findSchedule(!0), !0;
  } catch {
    return !1;
  } finally {
    this._currentDate = t, this._hasIterated = e;
  }
};
v.prototype.iterate = function(e, r) {
  var s = [];
  if (e >= 0)
    for (var n = 0, i = e; n < i; n++)
      try {
        var a = this.next();
        s.push(a), r && r(a, n);
      } catch {
        break;
      }
  else
    for (var n = 0, i = e; n > i; n--)
      try {
        var a = this.prev();
        s.push(a), r && r(a, n);
      } catch {
        break;
      }
  return s;
};
v.prototype.reset = function(e) {
  this._currentDate = new ut(e || this._options.currentDate);
};
v.prototype.stringify = function(e) {
  for (var r = [], s = e ? 0 : 1, n = v.map.length; s < n; ++s) {
    var i = v.map[s], a = this.fields[i], o = v.constraints[s];
    i === "dayOfMonth" && this.fields.month.length === 1 ? o = { min: 1, max: v.daysInMonth[this.fields.month[0] - 1] } : i === "dayOfWeek" && (o = { min: 0, max: 6 }, a = a[a.length - 1] === 7 ? a.slice(0, -1) : a), r.push(xy(a, o.min, o.max));
  }
  return r.join(" ");
};
v.parse = function(e, r) {
  var s = this;
  typeof r == "function" && (r = {});
  function n(i, a) {
    a || (a = {}), typeof a.currentDate > "u" && (a.currentDate = new ut(void 0, s._tz)), v.predefined[i] && (i = v.predefined[i]);
    var o = [], c = (i + "").trim().split(/\s+/);
    if (c.length > 6)
      throw new Error("Invalid cron expression");
    for (var u = v.map.length - c.length, l = 0, f = v.map.length; l < f; ++l) {
      var d = v.map[l], h = c[c.length > f ? l : l - u];
      if (l < u || !h)
        o.push(
          v._parseField(
            d,
            v.parseDefaults[l],
            v.constraints[l]
          )
        );
      else {
        var m = d === "dayOfWeek" ? M(h) : h;
        o.push(
          v._parseField(
            d,
            m,
            v.constraints[l]
          )
        );
      }
    }
    for (var T = {}, l = 0, f = v.map.length; l < f; l++) {
      var S = v.map[l];
      T[S] = o[l];
    }
    var _ = v._handleMaxDaysInMonth(T);
    return T.dayOfMonth = _ || T.dayOfMonth, new v(T, a);
    function M(U) {
      var re = U.split("#");
      if (re.length > 1) {
        var K = +re[re.length - 1];
        if (/,/.test(U))
          throw new Error("Constraint error, invalid dayOfWeek `#` and `,` special characters are incompatible");
        if (/\//.test(U))
          throw new Error("Constraint error, invalid dayOfWeek `#` and `/` special characters are incompatible");
        if (/-/.test(U))
          throw new Error("Constraint error, invalid dayOfWeek `#` and `-` special characters are incompatible");
        if (re.length > 2 || Number.isNaN(K) || K < 1 || K > 5)
          throw new Error("Constraint error, invalid dayOfWeek occurrence number (#)");
        return a.nthDayOfWeek = K, re[0];
      }
      return U;
    }
  }
  return n(e, r);
};
v.fieldsToExpression = function(e, r) {
  function s(d, h, m) {
    if (!h)
      throw new Error("Validation error, Field " + d + " is missing");
    if (h.length === 0)
      throw new Error("Validation error, Field " + d + " contains no values");
    for (var T = 0, S = h.length; T < S; T++) {
      var _ = h[T];
      if (!v._isValidConstraintChar(m, _) && (typeof _ != "number" || Number.isNaN(_) || _ < m.min || _ > m.max))
        throw new Error(
          "Constraint error, got value " + _ + " expected range " + m.min + "-" + m.max
        );
    }
  }
  for (var n = {}, i = 0, a = v.map.length; i < a; ++i) {
    var o = v.map[i], c = e[o];
    s(
      o,
      c,
      v.constraints[i]
    );
    for (var u = [], l = -1; ++l < c.length; )
      u[l] = c[l];
    if (c = u.sort(v._sortCompareFn).filter(function(d, h, m) {
      return !h || d !== m[h - 1];
    }), c.length !== u.length)
      throw new Error("Validation error, Field " + o + " contains duplicate values");
    n[o] = c;
  }
  var f = v._handleMaxDaysInMonth(n);
  return n.dayOfMonth = f || n.dayOfMonth, new v(n, r || {});
};
var Fy = v, zr = Fy;
function Ze() {
}
Ze._parseEntry = function(e) {
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
Ze.parseExpression = function(e, r) {
  return zr.parse(e, r);
};
Ze.fieldsToExpression = function(e, r) {
  return zr.fieldsToExpression(e, r);
};
Ze.parseString = function(e) {
  for (var r = e.split(`
`), s = {
    variables: {},
    expressions: [],
    errors: {}
  }, n = 0, i = r.length; n < i; n++) {
    var a = r[n], o = null, c = a.trim();
    if (c.length > 0) {
      if (c.match(/^#/))
        continue;
      if (o = c.match(/^(.*)=(.*)$/))
        s.variables[o[1]] = o[2];
      else {
        var u = null;
        try {
          u = Ze._parseEntry("0 " + c), s.expressions.push(u.interval);
        } catch (l) {
          s.errors[c] = l;
        }
      }
    }
  }
  return s;
};
Ze.parseFile = function(e, r) {
  za.readFile(e, function(s, n) {
    if (s) {
      r(s);
      return;
    }
    return r(null, Ze.parseString(n.toString()));
  });
};
var Ly = Ze, Te = {};
Te.add = Ay;
Te.addFromFront = Py;
Te.remove = Hy;
Te.has = jy;
Te.eq = ei;
Te.lte = Wy;
Te.lt = Uy;
Te.gte = $y;
Te.gt = zy;
Te.nearest = Vy;
function $e(t, e) {
  return t === e ? 0 : t < e ? -1 : 1;
}
function Ay(t, e, r) {
  r || (r = $e);
  for (var s = t.push(e) - 1; s; ) {
    if (r(t[s - 1], e) < 0) return;
    t[s] = t[s - 1], t[s - 1] = e, s--;
  }
}
function Py(t, e, r) {
  r || (r = $e);
  for (var s = t.unshift(e) - 1, n = 0; n < s; n++) {
    if (r(e, t[n + 1]) < 0) return;
    t[n] = t[n + 1], t[n + 1] = e;
  }
}
function Wy(t, e, r) {
  r || (r = $e);
  var s = ir(t, e, r);
  if (s === -1) return -1;
  for (; s >= 0; s--) {
    var n = r(t[s], e);
    if (n <= 0) return s;
  }
  return -1;
}
function Uy(t, e, r) {
  r || (r = $e);
  var s = ir(t, e, r);
  if (s === -1) return -1;
  for (; s >= 0; s--) {
    var n = r(t[s], e);
    if (n < 0) return s;
  }
  return -1;
}
function $y(t, e, r) {
  r || (r = $e);
  var s = ir(t, e, r);
  if (s === -1) return -1;
  for (; s < t.length; s++) {
    var n = r(t[s], e);
    if (n >= 0) return s;
  }
  return -1;
}
function zy(t, e, r) {
  r || (r = $e);
  var s = ir(t, e, r);
  if (s === -1) return -1;
  for (; s < t.length; s++) {
    var n = r(t[s], e);
    if (n > 0) return s;
  }
  return -1;
}
function ei(t, e, r) {
  r || (r = $e);
  var s = ir(t, e, r);
  return s === -1 ? -1 : r(t[s], e) === 0 ? s : -1;
}
function Vy(t, e, r) {
  r || (r = $e);
  for (var s = t.length, n = s - 1, i = 0, a = -1, o = 1; n >= i && i >= 0 && n < s; ) {
    a = Math.floor((n + i) / 2);
    var c = r(t[a], e);
    if (c === 0) return a;
    if (c >= 0) {
      if (o === 1) o = 0;
      else if (o === 2)
        return Math.abs(t[a] - e) > Math.abs(t[a - 1] - e) ? a - 1 : a;
      n = a - 1;
    } else {
      if (o === 1) o = 2;
      else if (o === 0) return a;
      i = a + 1;
    }
  }
  return a;
}
function ir(t, e, r) {
  r || (r = $e);
  for (var s = t.length, n = s - 1, i = 0, a = -1; n >= i && i >= 0 && n < s; ) {
    a = Math.floor((n + i) / 2);
    var o = r(t[a], e);
    if (o === 0) return a;
    o >= 0 ? n = a - 1 : i = a + 1;
  }
  return a;
}
function jy(t, e, r) {
  return ei(t, e, r) > -1;
}
function Hy(t, e, r) {
  var s = ei(t, e, r);
  return s === -1 ? !1 : (t.splice(s, 1), !0);
}
var ol = {};
(function(t) {
  var e = 2147483647;
  t.setTimeout = function(n, i) {
    return new r(n, i);
  }, t.setInterval = function(n, i) {
    return new s(n, i);
  }, t.clearTimeout = function(n) {
    n && n.close();
  }, t.clearInterval = t.clearTimeout, t.Timeout = r, t.Interval = s;
  function r(n, i) {
    this.listener = n, this.after = i, this.unreffed = !1, this.start();
  }
  r.prototype.unref = function() {
    this.unreffed || (this.unreffed = !0, this.timeout.unref());
  }, r.prototype.ref = function() {
    this.unreffed && (this.unreffed = !1, this.timeout.ref());
  }, r.prototype.start = function() {
    if (this.after <= e)
      this.timeout = setTimeout(this.listener, this.after);
    else {
      var n = this;
      this.timeout = setTimeout(function() {
        n.after -= e, n.start();
      }, e);
    }
    this.unreffed && this.timeout.unref();
  }, r.prototype.close = function() {
    clearTimeout(this.timeout);
  };
  function s(n, i) {
    this.listener = n, this.after = this.timeLeft = i, this.unreffed = !1, this.start();
  }
  s.prototype.unref = function() {
    this.unreffed || (this.unreffed = !0, this.timeout.unref());
  }, s.prototype.ref = function() {
    this.unreffed && (this.unreffed = !1, this.timeout.ref());
  }, s.prototype.start = function() {
    var n = this;
    this.timeLeft <= e ? this.timeout = setTimeout(function() {
      n.listener(), n.timeLeft = n.after, n.start();
    }, this.timeLeft) : this.timeout = setTimeout(function() {
      n.timeLeft -= e, n.start();
    }, e), this.unreffed && this.timeout.unref();
  }, s.prototype.close = function() {
    r.prototype.close.apply(this, arguments);
  };
})(ol);
const ti = ol, Ye = Qn, Gy = Te, lt = [];
let de = null;
const cl = new Nt();
cl.recurs = !1;
function ul(t, e, r, s) {
  this.job = t, this.fireDate = e, this.endDate = s, this.recurrenceRule = r || cl, this.timerID = null;
}
function ll(t, e) {
  return t.fireDate.getTime() - e.fireDate.getTime();
}
function ss(t, e, r) {
  this.start = t || 0, this.end = e || 60, this.step = r || 1;
}
ss.prototype.contains = function(t) {
  if (this.step === null || this.step === 1)
    return t >= this.start && t <= this.end;
  for (let e = this.start; e < this.end; e += this.step)
    if (e === t)
      return !0;
  return !1;
};
function Nt(t, e, r, s, n, i, a) {
  this.recurs = !0, this.year = t ?? null, this.month = e ?? null, this.date = r ?? null, this.dayOfWeek = s ?? null, this.hour = n ?? null, this.minute = i ?? null, this.second = a ?? 0;
}
Nt.prototype.isValid = function() {
  function t(e) {
    return Array.isArray(e) || e instanceof Array ? e.every(function(r) {
      return t(r);
    }) : !(Number.isNaN(Number(e)) && !(e instanceof ss));
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
Nt.prototype.nextInvocationDate = function(t) {
  const e = this._nextInvocationDate(t);
  return e ? e.toDate() : null;
};
Nt.prototype._nextInvocationDate = function(t) {
  if (t = t instanceof Ye || t instanceof Date ? t : /* @__PURE__ */ new Date(), !this.recurs || !this.isValid())
    return null;
  let r = new Ye(Date.now(), this.tz).getFullYear();
  if (this.year !== null && typeof this.year == "number" && this.year < r)
    return null;
  let s = new Ye(t.getTime(), this.tz);
  for (s.addSecond(); ; ) {
    if (this.year !== null) {
      if (r = s.getFullYear(), typeof this.year == "number" && this.year < r) {
        s = null;
        break;
      }
      if (!je(r, this.year)) {
        s.addYear(), s.setMonth(0), s.setDate(1), s.setHours(0), s.setMinutes(0), s.setSeconds(0);
        continue;
      }
    }
    if (this.month != null && !je(s.getMonth(), this.month)) {
      s.addMonth();
      continue;
    }
    if (this.date != null && !je(s.getDate(), this.date)) {
      s.addDay();
      continue;
    }
    if (this.dayOfWeek != null && !je(s.getDay(), this.dayOfWeek)) {
      s.addDay();
      continue;
    }
    if (this.hour != null && !je(s.getHours(), this.hour)) {
      s.addHour();
      continue;
    }
    if (this.minute != null && !je(s.getMinutes(), this.minute)) {
      s.addMinute();
      continue;
    }
    if (this.second != null && !je(s.getSeconds(), this.second)) {
      s.addSecond();
      continue;
    }
    break;
  }
  return s;
};
function je(t, e) {
  if (e == null)
    return !0;
  if (typeof e == "number")
    return t === e;
  if (typeof e == "string")
    return t === Number(e);
  if (e instanceof ss)
    return e.contains(t);
  if (Array.isArray(e) || e instanceof Array) {
    for (let r = 0; r < e.length; r++)
      if (je(t, e[r]))
        return !0;
  }
  return !1;
}
function fl(t, e) {
  const r = Date.now(), s = t.getTime();
  return ti.setTimeout(function() {
    s > Date.now() ? fl(t, e) : e();
  }, s < r ? 0 : s - r);
}
function dl(t) {
  Gy.add(lt, t, ll), ri();
  const e = t.fireDate instanceof Ye ? t.fireDate.toDate() : t.fireDate;
  t.job.emit("scheduled", e);
}
function ri() {
  if (lt.length > 0 && de !== lt[0]) {
    de !== null && (ti.clearTimeout(de.timerID), de.timerID = null, de = null), de = lt[0];
    const t = de.job, e = de;
    de.timerID = fl(de.fireDate, function() {
      if (By(), t.callback && t.callback(), e.recurrenceRule.recurs || e.recurrenceRule._endDate === null) {
        const r = hl(e.recurrenceRule, e.job, e.fireDate, e.endDate);
        r !== null && r.job.trackInvocation(r);
      }
      t.stopTrackingInvocation(e);
      try {
        const r = t.invoke(e.fireDate instanceof Ye ? e.fireDate.toDate() : e.fireDate);
        t.emit("run"), t.running += 1, r instanceof Promise ? r.then(function(s) {
          t.emit("success", s), t.running -= 1;
        }).catch(function(s) {
          t.emit("error", s), t.running -= 1;
        }) : (t.emit("success", r), t.running -= 1);
      } catch (r) {
        t.emit("error", r), t.running -= 1;
      }
      t.isOneTimeJob && t.deleteFromSchedule();
    });
  }
}
function By() {
  lt.shift(), de = null, ri();
}
function qy(t) {
  const e = lt.indexOf(t);
  e > -1 && (lt.splice(e, 1), t.timerID !== null && ti.clearTimeout(t.timerID), de === t && (de = null), t.job.emit("canceled", t.fireDate), ri());
}
function hl(t, e, r, s) {
  r = r instanceof Ye ? r : new Ye();
  const n = t instanceof Nt ? t._nextInvocationDate(r) : t.next();
  if (n === null || s instanceof Ye && n.getTime() > s.getTime())
    return null;
  const i = new ul(e, n, t, s);
  return dl(i), i;
}
var ml = {
  Range: ss,
  RecurrenceRule: Nt,
  Invocation: ul,
  cancelInvocation: qy,
  scheduleInvocation: dl,
  scheduleNextRecurrence: hl,
  sorter: ll
};
function Yy(t) {
  return t.getTime() === t.getTime();
}
var Zy = {
  isValidDate: Yy
};
const Jy = df, Ky = Ly, Ns = Qn, Xy = Te, { scheduleNextRecurrence: Vr, scheduleInvocation: Qy, cancelInvocation: xs, RecurrenceRule: Wa, sorter: ew, Invocation: tw } = ml, { isValidDate: Fs } = Zy, si = {};
let vr = 0;
function rw() {
  const t = /* @__PURE__ */ new Date();
  return vr === Number.MAX_SAFE_INTEGER && (vr = 0), vr++, `<Anonymous Job ${vr} ${t.toISOString()}>`;
}
function ar(t, e, r) {
  this.pendingInvocations = [];
  let s = 0;
  const n = t && typeof t == "string" ? t : rw();
  this.job = t && typeof t == "function" ? t : e, this.job === t ? this.callback = typeof e == "function" ? e : !1 : this.callback = typeof r == "function" ? r : !1, this.running = 0, typeof this.job == "function" && this.job.prototype && this.job.prototype.next && (this.job = (function() {
    return this.next().value;
  }).bind(this.job.call(this))), Object.defineProperty(this, "name", {
    value: n,
    writable: !1,
    enumerable: !0
  }), this.trackInvocation = function(i) {
    return Xy.add(this.pendingInvocations, i, ew), !0;
  }, this.stopTrackingInvocation = function(i) {
    const a = this.pendingInvocations.indexOf(i);
    return a > -1 ? (this.pendingInvocations.splice(a, 1), !0) : !1;
  }, this.triggeredJobs = function() {
    return s;
  }, this.setTriggeredJobs = function(i) {
    s = i;
  }, this.deleteFromSchedule = function() {
    sw(this.name);
  }, this.cancel = function(i) {
    i = typeof i == "boolean" ? i : !1;
    let a, o;
    const c = [];
    for (let u = 0; u < this.pendingInvocations.length; u++)
      a = this.pendingInvocations[u], xs(a), i && (a.recurrenceRule.recurs || a.recurrenceRule.next) && (o = Vr(a.recurrenceRule, this, a.fireDate, a.endDate), o !== null && c.push(o));
    this.pendingInvocations = [];
    for (let u = 0; u < c.length; u++)
      this.trackInvocation(c[u]);
    return i || this.deleteFromSchedule(), !0;
  }, this.cancelNext = function(i) {
    if (i = typeof i == "boolean" ? i : !0, !this.pendingInvocations.length)
      return !1;
    let a;
    const o = this.pendingInvocations.shift();
    return xs(o), i && (o.recurrenceRule.recurs || o.recurrenceRule.next) && (a = Vr(o.recurrenceRule, this, o.fireDate, o.endDate), a !== null && this.trackInvocation(a)), !0;
  }, this.reschedule = function(i) {
    let a;
    const o = this.pendingInvocations.slice();
    for (let c = 0; c < o.length; c++)
      a = o[c], xs(a);
    return this.pendingInvocations = [], this.schedule(i) ? (this.setTriggeredJobs(0), !0) : (this.pendingInvocations = o, !1);
  }, this.nextInvocation = function() {
    return this.pendingInvocations.length ? this.pendingInvocations[0].fireDate : null;
  };
}
Object.setPrototypeOf(ar.prototype, Jy.EventEmitter.prototype);
ar.prototype.invoke = function(t) {
  return this.setTriggeredJobs(this.triggeredJobs() + 1), this.job(t);
};
ar.prototype.runOnDate = function(t) {
  return this.schedule(t);
};
ar.prototype.schedule = function(t) {
  const e = this;
  let r = !1, s, n, i, a;
  typeof t == "object" && "tz" in t && (a = t.tz), typeof t == "object" && t.rule && (n = t.start || void 0, i = t.end || void 0, t = t.rule, n && (n instanceof Date || (n = new Date(n)), n = new Ns(n, a), (!Fs(n) || n.getTime() < Date.now()) && (n = void 0)), i && !(i instanceof Date) && !Fs(i = new Date(i)) && (i = void 0), i && (i = new Ns(i, a)));
  try {
    const o = Ky.parseExpression(t, { currentDate: n, tz: a });
    s = Vr(o, e, n, i), s !== null && (r = e.trackInvocation(s));
  } catch {
    const c = typeof t;
    if ((c === "string" || c === "number") && (t = new Date(t)), t instanceof Date && Fs(t))
      t = new Ns(t), e.isOneTimeJob = !0, t.getTime() >= Date.now() && (s = new tw(e, t), Qy(s), r = e.trackInvocation(s));
    else if (c === "object") {
      if (e.isOneTimeJob = !1, !(t instanceof Wa)) {
        const u = new Wa();
        "year" in t && (u.year = t.year), "month" in t && (u.month = t.month), "date" in t && (u.date = t.date), "dayOfWeek" in t && (u.dayOfWeek = t.dayOfWeek), "hour" in t && (u.hour = t.hour), "minute" in t && (u.minute = t.minute), "second" in t && (u.second = t.second), t = u;
      }
      t.tz = a, s = Vr(t, e, n, i), s !== null && (r = e.trackInvocation(s));
    }
  }
  return si[this.name] = this, r;
};
function sw(t) {
  t && delete si[t];
}
var gl = {
  Job: ar,
  scheduledJobs: si
};
const { Job: ni, scheduledJobs: We } = gl;
function nw() {
  if (arguments.length < 2)
    throw new RangeError("Invalid number of arguments");
  const t = arguments.length >= 3 && typeof arguments[0] == "string" ? arguments[0] : null, e = t ? arguments[1] : arguments[0], r = t ? arguments[2] : arguments[1], s = t ? arguments[3] : arguments[2];
  if (typeof r != "function")
    throw new RangeError("The job method must be a function.");
  const n = new ni(t, r, s);
  return n.schedule(e) ? n : null;
}
function iw(t, e) {
  if (t instanceof ni) {
    if (t.reschedule(e))
      return t;
  } else if (typeof t == "string")
    if (Object.prototype.hasOwnProperty.call(We, t)) {
      if (We[t].reschedule(e))
        return We[t];
    } else
      throw new Error("Cannot reschedule one-off job by name, pass job reference instead");
  return null;
}
function aw(t) {
  let e = !1;
  return t instanceof ni ? e = t.cancel() : (typeof t == "string" || t instanceof String) && t in We && Object.prototype.hasOwnProperty.call(We, t) && (e = We[t].cancel()), e;
}
function ow() {
  const t = Object.keys(We).map((r) => We[r]);
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
      for (let s = 0; s < t.length; s++)
        if (t[s].running > 0)
          return;
      r();
    }, 500) : r();
  });
}
var cw = {
  scheduleJob: nw,
  rescheduleJob: iw,
  scheduledJobs: We,
  cancelJob: aw,
  gracefulShutdown: ow
};
const { cancelJob: uw, rescheduleJob: lw, scheduledJobs: fw, scheduleJob: dw, gracefulShutdown: hw } = cw, { Invocation: mw, RecurrenceRule: gw, Range: pw } = ml, { Job: yw } = gl;
var ww = {
  Job: yw,
  Invocation: mw,
  Range: pw,
  RecurrenceRule: gw,
  cancelJob: uw,
  rescheduleJob: lw,
  scheduledJobs: fw,
  scheduleJob: dw,
  gracefulShutdown: hw
};
const Ua = /* @__PURE__ */ Ga(ww), Le = /* @__PURE__ */ new Map();
function vw() {
  p.handle("create-schedule", async (t, e) => {
    var r;
    try {
      Le.has(e.id) && ((r = Le.get(e.id)) == null || r.cancel());
      const s = Ua.scheduleJob(e.cron, () => {
        t.sender.send("schedule-triggered", {
          id: e.id,
          task: e.task
        });
      });
      return Le.set(e.id, s), !0;
    } catch (s) {
      return console.error("Failed to create schedule:", s), !1;
    }
  }), p.handle("cancel-schedule", (t, e) => {
    const r = Le.get(e);
    return r ? (r.cancel(), Le.delete(e), !0) : !1;
  }), p.handle("update-schedule", async (t, e) => {
    var r;
    try {
      Le.has(e.id) && ((r = Le.get(e.id)) == null || r.cancel());
      const s = Ua.scheduleJob(e.cron, () => {
        t.sender.send("schedule-triggered", {
          id: e.id,
          task: e.task
        });
      });
      return Le.set(e.id, s), !0;
    } catch (s) {
      return console.error("Failed to create schedule:", s), !1;
    }
  }), p.handle("get-schedules", () => Array.from(Le.keys()));
}
const fe = class fe {
  constructor() {
    $(this, "windows", /* @__PURE__ */ new Map());
  }
  /**
   * 创建通知窗口
   */
  createWindow(e) {
    this.closeWindow(e.id);
    const r = this.calculatePosition(), s = this.buildWindow(r);
    return this.setupWindowEvents(s, e.id), this.windows.set(e.id, s), console.log("NotificationWindowManager - Window created:", e.id), s;
  }
  /**
   * 关闭指定窗口
   */
  closeWindow(e) {
    const r = this.windows.get(e);
    return r && !r.isDestroyed() ? (r.close(), !0) : !1;
  }
  /**
   * 获取窗口
   */
  getWindow(e) {
    return this.windows.get(e);
  }
  /**
   * 获取所有窗口
   */
  getAllWindows() {
    return new Map(this.windows);
  }
  /**
   * 计算窗口位置
   */
  calculatePosition() {
    const e = Pl.getPrimaryDisplay(), { width: r } = e.workAreaSize, s = r - fe.WINDOW_CONFIG.WIDTH - fe.WINDOW_CONFIG.MARGIN, n = fe.WINDOW_CONFIG.MARGIN + this.windows.size * (fe.WINDOW_CONFIG.HEIGHT + fe.WINDOW_CONFIG.MARGIN);
    return { x: s, y: n };
  }
  /**
   * 构建窗口
   */
  buildWindow(e) {
    return new Yt({
      width: fe.WINDOW_CONFIG.WIDTH,
      height: fe.WINDOW_CONFIG.HEIGHT,
      x: e.x,
      y: e.y,
      frame: !1,
      transparent: !0,
      resizable: !1,
      skipTaskbar: !0,
      alwaysOnTop: !0,
      show: !1,
      backgroundColor: "#00000000",
      webPreferences: {
        preload: me.join(ns, "main_preload.mjs"),
        contextIsolation: !0,
        nodeIntegration: !0,
        webSecurity: !1
      }
    });
  }
  /**
   * 设置窗口事件
   */
  setupWindowEvents(e, r) {
    e.webContents.session.webRequest.onHeadersReceived((s, n) => {
      n({
        responseHeaders: {
          ...s.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
          ]
        }
      });
    }), e.on("closed", () => {
      this.windows.delete(r), this.reorderWindows();
    });
  }
  /**
   * 重新排列窗口位置
   */
  reorderWindows() {
    let e = 0;
    for (const [, r] of this.windows)
      if (!r.isDestroyed()) {
        const s = fe.WINDOW_CONFIG.MARGIN + e * (fe.WINDOW_CONFIG.HEIGHT + fe.WINDOW_CONFIG.MARGIN);
        r.setPosition(r.getPosition()[0], s), e++;
      }
  }
  /**
   * 构建通知URL
   */
  buildNotificationUrl(e) {
    const r = new URLSearchParams({
      id: e.id,
      title: e.title,
      body: e.body,
      urgency: e.urgency || "normal"
    });
    return e.icon && r.append("icon", e.icon), e.actions && r.append("actions", encodeURIComponent(JSON.stringify(e.actions))), St ? `${St}#/notification?${r.toString()}` : `file://${or}/index.html#/notification?${r.toString()}`;
  }
};
$(fe, "WINDOW_CONFIG", {
  WIDTH: 620,
  HEIGHT: 920,
  MARGIN: 10
});
let gn = fe;
class _w {
  constructor() {
    $(this, "windowManagementService", new gn());
  }
  async showNotification(e) {
    try {
      const r = this.windowManagementService.createWindow(e), s = this.windowManagementService.buildNotificationUrl(e);
      return await r.loadURL(s), r.show(), {
        success: !0,
        message: "Notification displayed successfully"
      };
    } catch (r) {
      return console.error("NotificationService - showNotification Error:", r), {
        success: !1,
        message: r instanceof Error ? r.message : "Unknown error"
      };
    }
  }
  closeNotification(e) {
    try {
      if (!this.windowManagementService.closeWindow(e))
        throw new Error(
          `Notification with ID ${e} not found or already closed`
        );
      return {
        success: !0,
        message: "Notification closed successfully"
      };
    } catch (r) {
      return console.error("NotificationService - closeNotification Error:", r), {
        success: !1,
        message: r instanceof Error ? r.message : "Unknown error"
      };
    }
  }
  handleNotificationAction(e, r) {
    const s = this.windowManagementService.getWindow(e);
    s ? ((r.type === "cancel" || r.type === "confirm") && s.close(), s.webContents.send("notification-action", { id: e, action: r })) : console.warn(`Notification with ID ${e} not found.`);
  }
}
const Ls = new _w();
function Tw() {
  p.handle("show-notification", async (t, e) => {
    try {
      return await Ls.showNotification(e);
    } catch (r) {
      throw console.error("IPC Error - show-notification:", r), r;
    }
  }), p.on("close-notification", (t, e) => {
    try {
      return Ls.closeNotification(e);
    } catch (r) {
      console.error("IPC Error - close-notification:", r);
    }
  }), p.on("notification-action", (t, e, r) => {
    try {
      return Ls.handleNotificationAction(e, r);
    } catch (s) {
      console.error("IPC Error - notification-action:", s);
    }
  });
}
function bw() {
  console.log("Setting up Account modules..."), Ef(), kf(), Sf.registerHandlers(), console.log("✓ Account modules ready");
}
function Ew() {
  console.log("Setting up Shared modules..."), Of(), Ig(), console.log("✓ Shared modules ready");
}
function kw() {
  console.log("Setting up Window modules..."), Tw(), vw(), console.log("✓ Window modules ready");
}
function Sw() {
  Ew(), bw();
}
function Ow() {
  Sw(), kw();
}
ne.setName("DailyUse");
const Iw = me.dirname($a(import.meta.url));
process.env.APP_ROOT = me.join(Iw, "..");
const St = process.env.VITE_DEV_SERVER_URL, ns = me.join(process.env.APP_ROOT, "dist-electron"), or = me.join(process.env.APP_ROOT, "dist");
process.env.MAIN_DIST = ns;
process.env.RENDERER_DIST = or;
process.env.VITE_PUBLIC = St ? me.join(process.env.APP_ROOT, "public") : or;
let A, _r = null, As = null;
function pn() {
  A = new Yt({
    frame: !1,
    icon: me.join(process.env.VITE_PUBLIC, "DailyUse.svg"),
    webPreferences: {
      nodeIntegration: !0,
      contextIsolation: !0,
      webSecurity: !0,
      preload: me.join(ns, "main_preload.mjs"),
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
    "img-src": ["'self'", "data:", "blob:", "local:"],
    "connect-src": ["'self'", "ws:", "wss:", "http:", "https:", "local:"]
  };
  A.webContents.session.webRequest.onHeadersReceived((e, r) => {
    const s = Object.entries(t).map(([n, i]) => `${n} ${i.join(" ")}`).join("; ");
    r({
      responseHeaders: {
        ...e.responseHeaders,
        "Content-Security-Policy": [s]
      }
    });
  }), As = new gf(), A && (As.register(new pf()), As.initializeAll()), St ? A.loadURL(St) : A.loadFile(me.join(or, "index.html")), A.setMinimumSize(800, 600), Cw(A), A.on("close", (e) => (ne.isQuitting || (e.preventDefault(), A == null || A.hide()), !1));
}
function Cw(t) {
  const e = Ul.createFromPath(me.join(process.env.VITE_PUBLIC, "DailyUse-16.png"));
  _r = new $l(e), _r.setToolTip("DailyUse");
  const r = zl.buildFromTemplate([
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
        ne.quit();
      }
    }
  ]);
  _r.setContextMenu(r), _r.on("click", () => {
    t.show();
  });
}
ne.on("window-all-closed", () => {
  process.platform !== "darwin" && (ne.quit(), A = null);
});
ne.on("activate", () => {
  Yt.getAllWindows().length === 0 && pn();
});
ne.whenReady().then(() => {
  pn(), A && Ow(), Wl.registerFileProtocol("local", (t, e) => {
    const r = t.url.replace("local://", "");
    try {
      return e(decodeURIComponent(r));
    } catch (s) {
      console.error(s);
    }
  }), ne.on("activate", () => {
    Yt.getAllWindows().length === 0 && pn();
  });
});
p.handle("readClipboard", () => Rr.readText());
p.handle("writeClipboard", (t, e) => {
  Rr.writeText(e);
});
p.handle("readClipboardFiles", () => Rr.availableFormats().includes("FileNameW") ? Rr.read("FileNameW").split("\0").filter(Boolean) : []);
p.on("window-control", (t, e) => {
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
p.handle("open-external-url", async (t, e) => {
  try {
    await at.openExternal(e);
  } catch (r) {
    console.error("Failed to open URL:", r);
  }
});
p.handle("get-auto-launch", () => ne.getLoginItemSettings().openAtLogin);
p.handle("set-auto-launch", (t, e) => (process.platform === "win32" && ne.setLoginItemSettings({
  openAtLogin: e,
  path: process.execPath
}), ne.getLoginItemSettings().openAtLogin));
ne.on("before-quit", () => {
  ne.isQuitting = !0;
});
export {
  ns as MAIN_DIST,
  or as RENDERER_DIST,
  St as VITE_DEV_SERVER_URL
};
