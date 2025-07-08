import { Database } from "better-sqlite3";
import { getDatabase } from "../../../../config/database";
import { IAccountRepository } from "../../domain/repositories/accountRepository";
import { Account } from "../../domain/aggregates/account";
import { User } from "../../domain/entities/user";
import { Email } from "../../domain/valueObjects/email";
import { PhoneNumber } from "../../domain/valueObjects/phoneNumber";
import { AccountType } from "../../domain/types/account";

/**
 * SQLite 账号存储库实现
 * 负责账号数据的持久化和查询
 */
export class SqliteAccountRepository implements IAccountRepository {
  private db: Database | null = null;

  /**
   * 获取数据库连接
   */
  private async getDb(): Promise<Database> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  /**
   * 根据ID查找账号
   */
  async findById(id: string): Promise<Account | null> {
    try {
      const db = await this.getDb();
      const query = `
        SELECT * FROM users 
        WHERE uid = ?
      `;
      const row = db.prepare(query).get(id) as any;
      
      if (!row) {
        return null;
      }

      return this.mapRowToAccount(row);
    } catch (error) {
      console.error('查找账号失败 (ID):', error);
      throw error;
    }
  }

  /**
   * 根据用户名查找账号
   */
  async findByUsername(username: string): Promise<Account | null> {
    try {
      const db = await this.getDb();
      const query = `
        SELECT * FROM users 
        WHERE username = ?
      `;
      const row = db.prepare(query).get(username) as any;
      
      if (!row) {
        return null;
      }

      return this.mapRowToAccount(row);
    } catch (error) {
      console.error('查找账号失败 (用户名):', error);
      throw error;
    }
  }

  /**
   * 根据邮箱查找账号
   */
  async findByEmail(email: string): Promise<Account | null> {
    try {
      const db = await this.getDb();
      const query = `
        SELECT * FROM users 
        WHERE email = ?
      `;
      const row = db.prepare(query).get(email) as any;
      
      if (!row) {
        return null;
      }

      return this.mapRowToAccount(row);
    } catch (error) {
      console.error('查找账号失败 (邮箱):', error);
      throw error;
    }
  }

  /**
   * 获取所有账号
   */
  async findAll(): Promise<Account[]> {
    try {
      const db = await this.getDb();
      const query = `
        SELECT * FROM users 
        ORDER BY createdAt DESC
      `;
      const rows = db.prepare(query).all() as any[];
      
      return rows.map(row => this.mapRowToAccount(row));
    } catch (error) {
      console.error('获取所有账号失败:', error);
      throw error;
    }
  }

  /**
   * 根据手机号查找账号
   */
  async findByPhone(phone: string): Promise<Account | null> {
    try {
      const db = await this.getDb();
      const query = `
        SELECT * FROM users 
        WHERE phone = ?
      `;
      const row = db.prepare(query).get(phone) as any;
      
      if (!row) {
        return null;
      }

      return this.mapRowToAccount(row);
    } catch (error) {
      console.error('查找账号失败 (手机号):', error);
      throw error;
    }
  }

  /**
   * 根据状态查找账号
   */
  async findByStatus(_status: string): Promise<Account[]> {
    try {
      // 注意：当前数据库表没有status字段，返回空数组
      console.warn('数据库表中没有status字段，返回空数组');
      return [];
    } catch (error) {
      console.error('根据状态查找账号失败:', error);
      throw error;
    }
  }

  /**
   * 根据账号类型查找账号
   */
  async findByAccountType(accountType: string): Promise<Account[]> {
    try {
      const db = await this.getDb();
      const query = `
        SELECT * FROM users 
        WHERE accountType = ?
        ORDER BY createdAt DESC
      `;
      const rows = db.prepare(query).all(accountType) as any[];
      
      return rows.map(row => this.mapRowToAccount(row));
    } catch (error) {
      console.error('根据账号类型查找账号失败:', error);
      throw error;
    }
  }

  /**
   * 检查手机号是否存在
   */
  async existsByPhone(phone: string): Promise<boolean> {
    try {
      const db = await this.getDb();
      const query = `SELECT 1 FROM users WHERE phone = ?`;
      const result = db.prepare(query).get(phone);
      return result !== undefined;
    } catch (error) {
      console.error('检查手机号存在性失败:', error);
      throw error;
    }
  }

  /**
   * 保存账号
   */
  async save(account: Account): Promise<void> {
    try {
      // 检查账号是否已存在
      const existing = await this.findById(account.id);
      
      if (existing) {
        await this.updateAccount(account);
      } else {
        await this.insertAccount(account);
      }
    } catch (error) {
      console.error('保存账号失败:', error);
      throw error;
    }
  }

  /**
   * 删除账号
   */
  async delete(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      const query = `DELETE FROM users WHERE uid = ?`;
      const result = db.prepare(query).run(id);
      
      if (result.changes === 0) {
        throw new Error('账号不存在或删除失败');
      }
      
      console.log(`账号 ${id} 删除成功`);
    } catch (error) {
      console.error('删除账号失败:', error);
      throw error;
    }
  }

  /**
   * 检查用户名是否存在
   */
  async existsByUsername(username: string): Promise<boolean> {
    try {
      const db = await this.getDb();
      const query = `SELECT 1 FROM users WHERE username = ?`;
      const result = db.prepare(query).get(username);
      return result !== undefined;
    } catch (error) {
      console.error('检查用户名存在性失败:', error);
      throw error;
    }
  }

  /**
   * 检查邮箱是否存在
   */
  async existsByEmail(email: string): Promise<boolean> {
    try {
      const db = await this.getDb();
      const query = `SELECT 1 FROM users WHERE email = ?`;
      const result = db.prepare(query).get(email);
      return result !== undefined;
    } catch (error) {
      console.error('检查邮箱存在性失败:', error);
      throw error;
    }
  }

  /**
   * 插入新账号
   */
  private async insertAccount(account: Account): Promise<void> {
    const db = await this.getDb();
    const query = `
      INSERT INTO users (
        uid, username, avatar, email, phone, 
        accountType, onlineId, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const stmt = db.prepare(query);
    stmt.run(
      account.id,
      account.username,
      account.user.avatar,
      account.email?.value,
      account.phoneNumber?.number,
      account.accountType,
      null, // onlineId
      account.createdAt.getTime()
    );
    
    console.log(`账号 ${account.username} 创建成功`);
  }

  /**
   * 更新账号
   */
  private async updateAccount(account: Account): Promise<void> {
    const db = await this.getDb();
    const query = `
      UPDATE users SET 
        username = ?, avatar = ?, email = ?, 
        phone = ?, accountType = ?, onlineId = ?
      WHERE uid = ?
    `;
    
    const stmt = db.prepare(query);
    const result = stmt.run(
      account.username,
      account.user.avatar,
      account.email?.value,
      account.phoneNumber?.number,
      account.accountType,
      null, // onlineId
      account.id
    );
    
    if (result.changes === 0) {
      throw new Error('账号更新失败，未找到目标记录');
    }
    
    console.log(`账号 ${account.username} 更新成功`);
  }

  /**
   * 将数据库行映射为 Account 聚合根
   */
  private mapRowToAccount(row: any): Account {
    // 创建 User 实体
    const user = new User(
      row.uid + '_user', // 为用户实体生成ID
      row.username,      // firstName
      '',                // lastName - 使用空字符串而不是undefined
      '',                // bio - 使用空字符串而不是undefined
      row.avatar
    );

    // 创建邮箱值对象（如果存在）
    let email: Email | undefined;
    if (row.email) {
      email = new Email(row.email, true); // 假设数据库中的邮箱已验证
    }

    // 创建手机号值对象（如果存在）
    let phoneNumber: PhoneNumber | undefined;
    if (row.phone) {
      phoneNumber = new PhoneNumber(row.phone);
    }

    // 创建账号聚合根（不包含密码）
    const account = new Account(
      row.uid,
      row.username,
      row.accountType as AccountType || AccountType.LOCAL,
      user,
      email,
      phoneNumber
    );

    return account;
  }
}
