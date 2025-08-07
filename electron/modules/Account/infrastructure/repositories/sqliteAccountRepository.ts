import { Database } from "better-sqlite3";
import { getDatabase } from "../../../../shared/database/index";
import { IAccountRepository } from "../../index";
import { IUserRepository } from "../../index";
import { Account } from "../../domain/aggregates/account";
import { SqliteUserRepository } from "./sqliteUserRepository";

/**
 * SQLite 账号存储库实现
 * 负责账号数据的持久化和查询
 */
export class SqliteAccountRepository implements IAccountRepository {
  private db: Database | null = null;
  private userRepository: IUserRepository;
  constructor() {
    // 初始化 User 仓库
    this.userRepository = new SqliteUserRepository();
  }

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
  async findById(uuid: string): Promise<Account | null> {
    try {
      const db = await this.getDb();
      const query = `
        SELECT * FROM accounts 
        WHERE uuid = ?
      `;
      const row = db.prepare(query).get(uuid) as any;

      if (!row) {
        return null;
      }

      return await this.mapRowToAccount(row);
    } catch (error) {
      console.error("查找账号失败 (ID):", error);
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
        SELECT * FROM accounts 
        WHERE username = ?
      `;
      const row = db.prepare(query).get(username) as any;

      if (!row) {
        return null;
      }

      return await this.mapRowToAccount(row);
    } catch (error) {
      console.error("查找账号失败 (用户名):", error);
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
        SELECT * FROM accounts 
        WHERE email = ?
      `;
      const row = db.prepare(query).get(email) as any;

      if (!row) {
        return null;
      }

      return this.mapRowToAccount(row);
    } catch (error) {
      console.error("查找账号失败 (邮箱):", error);
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
        SELECT * FROM accounts 
        ORDER BY created_at DESC
      `;
      const rows = db.prepare(query).all() as any[];

      const accounts = [];
      for (const row of rows) {
        const account = await this.mapRowToAccount(row);
        accounts.push(account);
      }

      return accounts;
    } catch (error) {
      console.error("获取所有账号失败:", error);
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
        SELECT * FROM accounts 
        WHERE phone = ?
      `;
      const row = db.prepare(query).get(phone) as any;

      if (!row) {
        return null;
      }

      return this.mapRowToAccount(row);
    } catch (error) {
      console.error("查找账号失败 (手机号):", error);
      throw error;
    }
  }

  /**
   * 根据状态查找账号
   */
  async findByStatus(_status: string): Promise<Account[]> {
    try {
      // 注意：当前数据库表没有status字段，返回空数组
      console.warn("数据库表中没有status字段，返回空数组");
      return [];
    } catch (error) {
      console.error("根据状态查找账号失败:", error);
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
        SELECT * FROM accounts 
        WHERE account_type = ?
        ORDER BY created_at DESC
      `;
      const rows = db.prepare(query).all(accountType) as any[];

      const accounts = [];
      for (const row of rows) {
        const account = await this.mapRowToAccount(row);
        accounts.push(account);
      }

      return accounts;
    } catch (error) {
      console.error("根据账号类型查找账号失败:", error);
      throw error;
    }
  }

  /**
   * 检查手机号是否存在
   */
  async existsByPhone(phone: string): Promise<boolean> {
    try {
      const db = await this.getDb();
      const query = `SELECT 1 FROM accounts WHERE phone = ?`;
      const result = db.prepare(query).get(phone);
      return result !== undefined;
    } catch (error) {
      console.error("检查手机号存在性失败:", error);
      throw error;
    }
  }

  /**
   * 保存账号
   */
  async save(account: Account): Promise<void> {
    try {
      // 检查账号是否已存在
      const existing = await this.findById(account.uuid);

      if (existing) {
        console.log(`账号 ${account.uuid} 已存在，执行更新操作`);
        await this.updateAccount(account);
      } else {
        console.log(`账号 ${account.uuid} 不存在，执行插入操作`);
        await this.insertAccount(account);
      }

      
    } catch (error) {
      console.error("保存账号失败:", error);
      throw error;
    }
  }

  /**
   * 删除账号
   */
  async delete(uuid: string): Promise<void> {
    try {
      const db = await this.getDb();

      // 先删除用户资料
      await this.userRepository.delete(uuid);

      // 再删除账号
      const query = `DELETE FROM accounts WHERE uuid = ?`;
      const result = db.prepare(query).run(uuid);

      if (result.changes === 0) {
        throw new Error("账号不存在或删除失败");
      }

      console.log(`账号 ${uuid} 删除成功`);
    } catch (error) {
      console.error("删除账号失败:", error);
      throw error;
    }
  }

  /**
   * 检查用户名是否存在
   */
  async existsByUsername(username: string): Promise<boolean> {
    try {
      const db = await this.getDb();
      const query = `SELECT 1 FROM accounts WHERE username = ?`;
      const result = db.prepare(query).get(username);
      return result !== undefined;
    } catch (error) {
      console.error("检查用户名存在性失败:", error);
      throw error;
    }
  }

  /**
   * 检查邮箱是否存在
   */
  async existsByEmail(email: string): Promise<boolean> {
    try {
      const db = await this.getDb();
      const query = `SELECT 1 FROM accounts WHERE email = ?`;
      const result = db.prepare(query).get(email);
      return result !== undefined;
    } catch (error) {
      console.error("检查邮箱存在性失败:", error);
      throw error;
    }
  }

  /**
   * 插入新账号
   */
  private async insertAccount(account: Account): Promise<void> {
    const db = await this.getDb();
    const query = `
      INSERT INTO accounts (
        uuid, username, email, phone, 
        account_type, status, role_ids, created_at, updated_at,
        last_login_at, email_verification_token, phone_verification_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const stmt = db.prepare(query);
    const now = Date.now();
    stmt.run(
      account.uuid,
      account.username,
      account.email?.value,
      account.phoneNumber?.number,
      account.accountType,
      account.status,
      JSON.stringify(Array.from(account.roleIds)),
      now,
      now,
      account.lastLoginAt?.getTime() || null,
      null, // emailVerificationToken - 需要通过getter获取
      null, // phoneVerificationCode - 需要通过getter获取
    );
    await this.userRepository.save(account.user, account.uuid);
    console.log(`账号 ${account.username} 创建成功`);
  }

  /**
   * 更新账号
   */
  private async updateAccount(account: Account): Promise<void> {
    // 先更新 User 实体
    await this.userRepository.update(account.user);

    const db = await this.getDb();
    const query = `
      UPDATE accounts SET 
        username = ?, email = ?, phone = ?, 
        account_type = ?, status = ?, role_ids = ?, updated_at = ?,
        last_login_at = ?, email_verification_token = ?, phone_verification_code = ?
      WHERE uuid = ?
    `;

    const stmt = db.prepare(query);
    const result = stmt.run(
      account.username,
      account.email?.value,
      account.phoneNumber?.number,
      account.accountType,
      account.status,
      JSON.stringify(Array.from(account.roleIds)),
      Date.now(),
      account.lastLoginAt?.getTime() || null,
      null, // emailVerificationToken - 需要通过getter获取
      null, // phoneVerificationCode - 需要通过getter获取
      account.uuid
    );

    if (result.changes === 0) {
      throw new Error("账号更新失败，未找到目标记录");
    }

    console.log(`账号 ${account.username} 更新成功`);
  }

  /**
   * 将数据库行映射为 Account 聚合根
   */
  private async mapRowToAccount(row: any): Promise<Account> {
    // 从 user_profiles 表获取 User 实体信息
    const user = await this.userRepository.findByAccountUuid(row.uuid);
    if (!user) {
      throw new Error(`User profile not found for account: ${row.uuid}`);
    }
    const userDTO = user.toDTO();
    console.log('UserDTO:', userDTO);
    // 解析角色ID (暂时不使用，预留用于将来扩展)
    // let roleIds: Set<string> = new Set();
    // if (row.roleIds) {
    //   try {
    //     const roleIdArray = JSON.parse(row.roleIds);
    //     roleIds = new Set(roleIdArray);
    //   } catch (error) {
    //     console.warn("Failed to parse role IDs:", error);
    //   }
    // }
    const accountDTO = {
      uuid: row.uuid,
      username: row.username,
      email: row.email,
      phone: row.phone,
      accountType: row.account_type,
      status: row.status,
      roleIds: JSON.parse(row.role_ids || '[]'),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : undefined,
      isEmailVerified: row.is_email_verified,
      isPhoneVerified: row.is_phone_verified,
      user: userDTO
    }
    console.log(accountDTO)
    // 创建账号聚合根
    const account = Account.fromDTO(accountDTO);
    console.log('[sqliteAccountRepo::Account]', account)

    return account;
  }
}
