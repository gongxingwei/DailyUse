import type { Database } from "better-sqlite3";
import { User } from "../../domain/entities/user";
import type { IUserRepository } from "../../index";
import { getDatabase } from "../../../../shared/database/index";
/**
 * User 实体的 SQLite 仓库实现
 */
export class SqliteUserRepository implements IUserRepository {
  private db: Database | null = null;
  /**
   * 获取数据库实例
   */
  private async getDB(): Promise<Database> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  async findById(id: string): Promise<User | null> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT * FROM user_profiles WHERE uuid = ?
      `);

      const row = stmt.get(id) as any;
      if (!row) return null;

      return this.mapRowToUser(row);
    } catch (error) {
      console.error("Error finding user by uuid:", error);
      throw error;
    }
  }

  async findByName(firstName: string, lastName: string): Promise<User[]> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT * FROM user_profiles 
        WHERE first_name = ? AND last_name = ?
      `);

      const rows = stmt.all(firstName, lastName) as any[];
      return rows.map((row) => this.mapRowToUser(row));
    } catch (error) {
      console.error("Error finding users by name:", error);
      throw error;
    }
  }

  async findByAccountId(accountId: string): Promise<User | null> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT * FROM user_profiles WHERE account_uuid = ?
      `);

      const row = stmt.get(accountId) as any;
      if (!row) return null;

      return this.mapRowToUser(row);
    } catch (error) {
      console.error("Error finding user by uuid:", error);
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT * FROM user_profiles
      `);

      const rows = stmt.all() as any[];
      return rows.map((row) => this.mapRowToUser(row));
    } catch (error) {
      console.error("Error finding all users:", error);
      throw error;
    }
  }

  async save(user: User,account_uuid: string): Promise<void> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        INSERT INTO user_profiles (
          uuid, account_uuid, first_name, last_name, sex, avatar_url, bio, social_accounts, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const now = Date.now();
      stmt.run(
        user.id,
        account_uuid,
        user.firstName,
        user.lastName,
        user.sex,
        user.avatar,
        user.bio,
        JSON.stringify(Object.fromEntries(user.socialAccounts)),
        now,
        now
      );
    } catch (error) {
      console.error("Error saving user:", error);
      throw error;
    }
  }

  async update(user: User): Promise<void> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        UPDATE user_profiles 
        SET first_name = ?, last_name = ?, sex = ?, avatar_url = ?, bio = ?, 
            social_accounts = ?, updated_at = ?
        WHERE uuid = ?
      `);

      stmt.run(
        user.firstName,
        user.lastName,
        user.sex,
        user.avatar,
        user.bio,
        JSON.stringify(Object.fromEntries(user.socialAccounts)),
        Date.now(),
        user.id
      );
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        DELETE FROM user_profiles WHERE uuid = ?
      `);

      stmt.run(id);
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }
  private mapRowToUser(row: any): User {
    const user = new User(
      row.uuid,
      row.first_name,
      row.last_name,
      row.sex,
      row.avatar_url,
      row.bio
    );

    // 恢复社交账号
    if (row.social_accounts) {
      try {
        const socialAccountsObj = JSON.parse(row.social_accounts);
        for (const [platform, accountId] of Object.entries(socialAccountsObj)) {
          user.addSocialAccount(platform, accountId as string);
        }
      } catch (error) {
        console.warn("Failed to parse social accounts:", error);
      }
    }
    console.log("[spliteUserRepository::mapRowToUser]", user)
    return user;
  }
}
