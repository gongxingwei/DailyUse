import type { Database } from "better-sqlite3";
import { initializeDatabase } from "../../../config/database";
import type { TUser } from "@/modules/Account/types/user";

/**
 * 用户数据模型类
 * 负责用户数据的持久化操作，包括增删改查
 */
export class UserModel {
  private db: Database | null = null;

  /**
   * 私有构造函数，防止直接实例化
   */
  private constructor() {}

  /**
   * 静态方法创建实例
   * @returns UserModel 实例
   */
  public static async create(): Promise<UserModel> {
    const instance = new UserModel();
    instance.db = await initializeDatabase();
    return instance;
  }

  /**
   * 确保数据库连接存在
   */
  private async ensureDatabase(): Promise<Database> {
    if (!this.db) {
      this.db = await initializeDatabase();
    }
    return this.db;
  }

  /**
   * 添加新用户
   * @param userData 用户数据对象
   * @returns 添加是否成功
   */
  async addUser(userData: TUser): Promise<boolean> {
    try {
      const db = await this.ensureDatabase();
      const stmt = db.prepare(`
        INSERT INTO users (
          username,
          password,
          avatar,
          email,
          phone,
          accountType,
          onlineId,
          createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

      const result = stmt.run(
        userData.username,
        userData.password,
        userData.avatar || null,
        userData.email || null,
        userData.phone || null,
        userData.accountType || "local",
        userData.onlineId || null,
        userData.createdAt
      );
      return result.changes > 0;
    } catch (error) {
      console.error("添加用户失败:", error);
      return false;
    }
  }

  /**
   * 删除用户
   * @param username 用户名
   * @returns 删除是否成功
   */
  async removeUser(username: string): Promise<boolean> {
    try {
      const db = await this.ensureDatabase();
      const stmt = db.prepare("DELETE FROM users WHERE username = ?");
      const result = stmt.run(username);

      return result.changes > 0;
    } catch (error) {
      console.error("删除用户失败:", error);
      return false;
    }
  }

  /**
   * 通过用户名查找用户
   * @param username 用户名
   * @returns 用户对象，未找到则返回null
   */
  async findUserByUsername(username: string): Promise<TUser | null> {
    try {
      const db = await this.ensureDatabase();
      const stmt = db.prepare("SELECT * FROM users WHERE username = ?");
      const user = stmt.get(username) as TUser | undefined;

      return user || null;
    } catch (error) {
      console.error("查找用户失败:", error);
      return null;
    }
  }

  /**
   * 获取所有用户
   * @returns 用户对象数组
   */
  async getAllUsers(): Promise<TUser[]> {
    try {
      const db = await this.ensureDatabase();
      const stmt = db.prepare("SELECT * FROM users");
      return stmt.all() as TUser[];
    } catch (error) {
      console.error("failed to get all users:", error);
      return [];
    }
  }

  /**
   * 按账户类型查询用户
   * @param accountType 账户类型（例如：'local', 'online'）
   * @returns 用户对象数组
   */
  async findUsersByAccountType(accountType: string): Promise<TUser[]> {
    try {
      const db = await this.ensureDatabase();
      const stmt = db.prepare("SELECT * FROM users WHERE accountType = ?");
      return stmt.all(accountType) as TUser[];
    } catch (error) {
      console.error(`获取${accountType}类型用户列表失败:`, error);
      return [];
    }
  }

  /**
   * 更新用户信息
   * @param username 用户名（主键，不可更改）
   * @param userData 需要更新的用户数据，可以是部分字段
   * @returns 更新是否成功
   */
  async updateUser(username: string, userData: Partial<TUser>): Promise<boolean> {
    try {
      const db = await this.ensureDatabase();
      
      // 剔除username，不允许更新主键
      const { username: _, ...updateData } = userData;

      // 如果没有要更新的字段，直接返回成功
      if (Object.keys(updateData).length === 0) {
        return true;
      }

      // 构建动态更新SQL语句
      const fields = Object.keys(updateData).map((key) => `${key} = ?`);

      const sql = `UPDATE users SET ${fields.join(", ")} WHERE username = ?`;

      // 构建参数数组
      const values = [...Object.values(updateData), username];

      const stmt = db.prepare(sql);
      const result = stmt.run(...values);

      return result.changes > 0;
    } catch (error) {
      console.error("更新用户信息失败:", error);
      return false;
    }
  }

  /**
   * 检查用户是否存在
   * @param username 用户名
   * @returns 用户是否存在
   */
  async userExists(username: string): Promise<boolean> {
    try {
      const db = await this.ensureDatabase();
      const stmt = db.prepare("SELECT 1 FROM users WHERE username = ?");
      const result = stmt.get(username);
      return result !== undefined;
    } catch (error) {
      console.error("检查用户存在失败:", error);
      return false;
    }
  }

  /**
   * 获取用户总数
   * @returns 用户总数
   */
  async getUserCount(): Promise<number> {
    try {
      const db = await this.ensureDatabase();
      const stmt = db.prepare("SELECT COUNT(*) as count FROM users");
      const result = stmt.get() as { count: number };
      return result.count;
    } catch (error) {
      console.error("获取用户数量失败:", error);
      return 0;
    }
  }

  /**
   * 更新用户在线状态
   * @param username 用户名
   * @param onlineId 在线ID
   * @returns 更新是否成功
   */
  async updateUserOnlineStatus(username: string, onlineId: string): Promise<boolean> {
    try {
      const db = await this.ensureDatabase();
      const stmt = db.prepare(`
        UPDATE users 
        SET accountType = 'online', onlineId = ? 
        WHERE username = ?
      `);

      const result = stmt.run(onlineId, username);
      return result.changes > 0;
    } catch (error) {
      console.error("更新用户在线状态失败:", error);
      return false;
    }
  }
}
