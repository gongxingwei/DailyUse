/**
 * 登录会话数据模型
 * 负责管理用户登录会话的持久化操作，包括保存、更新、查询和删除登录记录
 * 支持本地账号和在线账号的会话管理，提供记住密码、自动登录等功能
 */

import type { Database } from "better-sqlite3";
import { initializeDatabase } from "../../../config/database";
import type { TLoginSessionData } from "@/modules/Account/types/account";

export class LoginSessionModel {
  /** 数据库连接实例，初始化后不为空 */
  private db: Database | null = null;

  /**
   * 私有构造函数，防止直接实例化
   * 确保只能通过静态工厂方法创建实例，保证数据库连接的正确初始化
   */
  private constructor() {}

  /**
   * 静态工厂方法，创建并初始化 LoginSessionModel 实例
   * @returns {Promise<LoginSessionModel>} 已初始化的 LoginSessionModel 实例
   * @throws {Error} 当数据库初始化失败时抛出错误
   */
  public static async create(): Promise<LoginSessionModel> {
    const instance = new LoginSessionModel();
    instance.db = await initializeDatabase();
    return instance;
  }

  /**
   * 确保数据库连接存在的私有方法
   * 如果连接不存在则重新初始化，提供双重保障
   * @returns {Promise<Database>} 数据库连接实例
   * @private
   */
  private async ensureDatabase(): Promise<Database> {
    if (!this.db) {
      this.db = await initializeDatabase();
    }
    return this.db;
  }

  /**
   * 添加新的登录会话记录
   * 使用 INSERT 策略，仅插入新记录，如果存在重复记录会失败
   * 适用于确定要创建新记录的场景
   * 
   * @param {Omit<TLoginSessionData, "id" | "createdAt" | "updatedAt">} sessionData - 会话数据
   * @returns {Promise<boolean>} 添加是否成功
   */
  async addLoginSession(
    sessionData: Omit<TLoginSessionData, "id" | "createdAt" | "updatedAt">
  ): Promise<boolean> {
    try {
      const db = await this.ensureDatabase();
      const now = Date.now();

      // 纯插入操作，不处理重复记录
      const stmt = db.prepare(`
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
        `);

      const result = stmt.run(
        sessionData.username,
        sessionData.accountType,
        sessionData.rememberMe ? 1 : 0,
        sessionData.password || null,
        sessionData.token || null,
        sessionData.lastLoginTime,
        sessionData.autoLogin ? 1 : 0,
        sessionData.isActive ? 1 : 0,
        now,
        now
      );

      return result.changes > 0;
    } catch (error) {
      console.error("添加登录会话失败:", error);
      return false;
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
  async getSession(
    username: string,
    accountType: string
  ): Promise<TLoginSessionData | null> {
    try {
      const db = await this.ensureDatabase();
      const stmt = db.prepare(`
          SELECT * FROM login_sessions 
          WHERE username = ? AND accountType = ?
        `);
      const session = stmt.get(username, accountType) as TLoginSessionData | undefined;
      return session || null; // 如果没有找到记录，返回 null
    } catch (error) {
      console.error("获取登录会话失败:", error);
      return null;
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
  async updateSession(
    username: string,
    accountType: string,
    updates: Partial<TLoginSessionData>
  ): Promise<boolean> {
    try {
      const db = await this.ensureDatabase();

      // 过滤出可以更新的字段，排除主键和不可变字段
      const fields = Object.keys(updates)
        .filter(
          (key) => !["id", "username", "accountType", "createdAt"].includes(key)
        )
        .map((key) => `${key} = ?`);

      // 如果没有需要更新的字段，直接返回成功
      if (fields.length === 0) return true;

      // 添加 updatedAt 字段的更新
      fields.push("updatedAt = ?");

      // 构建动态 SQL 更新语句
      const sql = `UPDATE login_sessions SET ${fields.join(
        ", "
      )} WHERE username = ? AND accountType = ?`;

      // 构建参数数组，包含更新值、当前时间戳和查询条件
      const values = [
        ...Object.keys(updates)
          .filter(
            (key) =>
              !["id", "username", "accountType", "createdAt"].includes(key)
          )
          .map((key) => updates[key as keyof typeof updates]),
        Date.now(), // updatedAt 的值
        username,    // WHERE 条件：用户名
        accountType, // WHERE 条件：账户类型
      ];

      const stmt = db.prepare(sql);
      const result = stmt.run(...values);

      // 返回是否有记录被更新
      return result.changes > 0;
    } catch (error) {
      console.error("更新会话失败:", error);
      return false;
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
  async deleteSession(username: string, accountType: string): Promise<boolean> {
    try {
      const db = await this.ensureDatabase();
      const stmt = db.prepare(
        "DELETE FROM login_sessions WHERE username = ? AND accountType = ?"
      );
      const result = stmt.run(username, accountType);
      return result.changes > 0;
    } catch (error) {
      console.error("删除会话失败:", error);
      return false;
    }
  }

  /**
   * 获取所有登录会话历史记录
   * 按最后登录时间降序排列，最近的登录记录排在前面
   * 
   * @returns {Promise<TLoginSessionData[]>} 所有登录会话数据数组，失败时返回空数组
   */
  async getAllLoginSessions(): Promise<TLoginSessionData[]> {
    try {
      const db = await this.ensureDatabase();
      const stmt = db.prepare(`
          SELECT * FROM login_sessions 
          ORDER BY lastLoginTime DESC
        `);
      return stmt.all() as TLoginSessionData[];
    } catch (error) {
      console.error("获取登录历史失败:", error);
      return [];
    }
  }

  /**
   * 获取所有记住密码的会话记录
   * 返回 rememberMe 为 true 的所有会话，按最后登录时间降序排列
   * 用于登录页面显示历史登录账号列表
   * 
   * @returns {Promise<TLoginSessionData[]>} 记住密码的会话数据数组，失败时返回空数组
   */
  async getRememberedSessions(): Promise<TLoginSessionData[]> {
    try {
      const db = await this.ensureDatabase();
      const stmt = db.prepare(`
          SELECT * FROM login_sessions 
          WHERE rememberMe = 1 
          ORDER BY lastLoginTime DESC
        `);
      return stmt.all() as TLoginSessionData[];
    } catch (error) {
      console.error("获取记住的会话失败:", error);
      return [];
    }
  }

  /**
   * 获取设置为自动登录的会话记录
   * 返回最近一次设置为自动登录的会话，用于应用启动时的自动登录功能
   * 
   * @returns {Promise<TLoginSessionData | null>} 自动登录会话数据，不存在时返回 null
   */
  async getAutoLoginSession(): Promise<TLoginSessionData | null> {
    try {
      const db = await this.ensureDatabase();
      const stmt = db.prepare(`
          SELECT * FROM login_sessions 
          WHERE autoLogin = 1 
          ORDER BY lastLoginTime DESC 
          LIMIT 1
        `);
      return (stmt.get() as TLoginSessionData) || null;
    } catch (error) {
      console.error("获取自动登录会话失败:", error);
      return null;
    }
  }

  /**
   * 获取当前活跃的会话记录
   * 返回标记为活跃状态的会话，正常情况下应该只有一个活跃会话
   * 用于获取当前登录用户的信息
   * 
   * @returns {Promise<TLoginSessionData | null>} 当前活跃会话数据，不存在时返回 null
   */
  async getActiveSession(): Promise<TLoginSessionData | null> {
    try {
      const db = await this.ensureDatabase();
      const stmt = db.prepare(`
          SELECT * FROM login_sessions 
          WHERE isActive = 1 
          LIMIT 1
        `);
      return (stmt.get() as TLoginSessionData) || null;
    } catch (error) {
      console.error("获取活跃会话失败:", error);
      return null;
    }
  }

  /**
   * 清除所有登录会话记录
   * 删除数据库中的所有会话数据，用于重置或清理功能
   * 注意：此操作不可逆，请谨慎使用
   * 
   * @returns {Promise<boolean>} 清除是否成功，即使没有记录也返回 true
   */
  async clearAllSessions(): Promise<boolean> {
    try {
      const db = await this.ensureDatabase();
      const stmt = db.prepare("DELETE FROM login_sessions");
      const result = stmt.run();
      // 即使没有记录被删除，也认为操作成功
      return result.changes >= 0;
    } catch (error) {
      console.error("清除所有会话失败:", error);
      return false;
    }
  }
}