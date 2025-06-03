
import fs from "fs/promises";
import { TResponse } from "@/shared/types/response";
import type { Database } from "better-sqlite3";
import { getDatabase } from "../../../config/database";

/**
 * 用户存储数据接口
 */
export interface UserStoreData {
  id: number;
  username: string;
  store_name: string;
  data: string;
  created_at: number;
  updated_at: number;
}

/**
 * 用户数据导出格式
 */
export interface UserDataExport {
  username: string;
  exportTime: number;
  stores: {
    [storeName: string]: any;
  };
  metadata: {
    totalStores: number;
    dataSize: number;
  };
}

/**
 * 本地账户存储服务
 * 负责处理用户数据的本地存储，包括用户信息的读写和用户目录的管理
 */
export class StoreService {
  // 单例实例
  private static instance: StoreService;
  private db: Database | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  /**
   * 私有构造函数，确保单例模式
   */
  private constructor() {}

  /**
   * 获取 StoreService 的单例实例
   * @returns StoreService 实例
   */
  public static getInstance(): StoreService {
    if (!StoreService.instance) {
      StoreService.instance = new StoreService();
    }
    return StoreService.instance;
  }

  /**
   * 确保服务已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) return;

    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = this.initializeAsync();
    await this.initPromise;
    this.isInitialized = true;
  }

  /**
   * 异步初始化
   */
  private async initializeAsync(): Promise<void> {
    try {
      this.db = await getDatabase();
    } catch (error) {
      console.error("StoreService 初始化失败:", error);
      throw error;
    }
  }

  /**
   * 获取数据库实例
   */
  private async getDB(): Promise<Database> {
    await this.ensureInitialized();
    if (!this.db) {
      throw new Error("数据库未初始化");
    }
    return this.db;
  }

  /**
   * 读取用户特定的存储数据
   * @param username 用户名
   * @param storeName 存储名称
   * @returns 存储的数据或null
   */
  public async readUserStore<T>(
    username: string,
    storeName: string
  ): Promise<TResponse<T | null>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT data FROM user_store_data 
        WHERE username = ? AND store_name = ?
      `);
      const result = stmt.get(username, storeName) as { data: string } | undefined;

      if (result) {
        const parsedData = JSON.parse(result.data);
        return {
          success: true,
          data: parsedData,
          message: "读取数据成功"
        };
      }

      return {
        success: true,
        data: null,
        message: "未找到数据"
      };
    } catch (error) {
      console.error(`读取用户数据失败 (${storeName}):`, error);
      return {
        success: false,
        data: null,
        message: `读取数据失败: ${error instanceof Error ? error.message : '未知错误'}`
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
  public async writeUserStore<T>(
    username: string,
    storeName: string,
    data: T
  ): Promise<TResponse<void>> {
    try {
      console.log(`写入用户数据 (${storeName})`, { username, data }, typeof data);
      const db = await this.getDB();
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO user_store_data 
        (username, store_name, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);

      const now = Date.now();
      // 检查是否已存在数据来决定是否更新 created_at
      const existingStmt = db.prepare(`
        SELECT created_at FROM user_store_data 
        WHERE username = ? AND store_name = ?
      `);
      const existing = existingStmt.get(username, storeName) as { created_at: number } | undefined;
      const createdAt = existing ? existing.created_at : now;

      stmt.run(
        username,
        storeName,
        data,
        createdAt,
        now
      );

      return {
        success: true,
        data: undefined,
        message: "写入数据成功"
      };
    } catch (error) {
      console.error(`写入用户数据失败 (${storeName}):`, error);
      return {
        success: false,
        data: undefined,
        message: `写入数据失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 删除用户特定的存储数据
   * @param username 用户名
   * @param storeName 存储名称
   */
  public async deleteUserStore(
    username: string,
    storeName: string
  ): Promise<TResponse<void>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        DELETE FROM user_store_data 
        WHERE username = ? AND store_name = ?
      `);
      const result = stmt.run(username, storeName);

      return {
        success: true,
        data: undefined,
        message: `删除数据成功，影响行数: ${result.changes}`
      };
    } catch (error) {
      console.error(`删除用户数据失败 (${storeName}):`, error);
      return {
        success: false,
        data: undefined,
        message: `删除数据失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 获取用户所有存储数据的列表
   * @param username 用户名
   */
  public async getUserStoreList(username: string): Promise<TResponse<string[]>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT store_name FROM user_store_data 
        WHERE username = ?
        ORDER BY store_name
      `);
      const results = stmt.all(username) as { store_name: string }[];
      const storeNames = results.map(row => row.store_name);

      return {
        success: true,
        data: storeNames,
        message: `找到 ${storeNames.length} 个存储`
      };
    } catch (error) {
      console.error("获取用户存储列表失败:", error);
      return {
        success: false,
        data: [],
        message: `获取存储列表失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 导出用户所有数据
   * @param username 用户名
   * @param exportPath 导出文件路径（可选）
   */
  public async exportUserData(
    username: string,
    exportPath?: string
  ): Promise<TResponse<UserDataExport>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT store_name, data, created_at, updated_at 
        FROM user_store_data 
        WHERE username = ?
        ORDER BY store_name
      `);
      const results = stmt.all(username) as Array<{
        store_name: string;
        data: string;
        created_at: number;
        updated_at: number;
      }>;

      const stores: { [storeName: string]: any } = {};
      let totalSize = 0;

      for (const row of results) {
        try {
          stores[row.store_name] = JSON.parse(row.data);
          totalSize += row.data.length;
        } catch (parseError) {
          console.warn(`解析存储数据失败 (${row.store_name}):`, parseError);
          stores[row.store_name] = { _error: "数据解析失败", _rawData: row.data };
        }
      }

      const exportData: UserDataExport = {
        username,
        exportTime: Date.now(),
        stores,
        metadata: {
          totalStores: Object.keys(stores).length,
          dataSize: totalSize
        }
      };

      // 如果指定了导出路径，则写入文件
      if (exportPath) {
        try {
          await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2), 'utf-8');
        } catch (writeError) {
          console.error("写入导出文件失败:", writeError);
          return {
            success: false,
            data: exportData,
            message: `导出数据成功但写入文件失败: ${writeError instanceof Error ? writeError.message : '未知错误'}`
          };
        }
      }

      return {
        success: true,
        data: exportData,
        message: `导出 ${exportData.metadata.totalStores} 个存储数据成功`
      };
    } catch (error) {
      console.error("导出用户数据失败:", error);
      return {
        success: false,
        data: {} as UserDataExport,
        message: `导出数据失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 导入用户数据
   * @param username 用户名
   * @param importData 要导入的数据
   * @param overwrite 是否覆盖现有数据
   */
  public async importUserData(
    username: string,
    importData: UserDataExport,
    overwrite: boolean = false
  ): Promise<TResponse<{ imported: number; skipped: number; errors: number }>> {
    try {
      const db = await this.getDB();
      const insertStmt = db.prepare(`
        INSERT OR ${overwrite ? 'REPLACE' : 'IGNORE'} INTO user_store_data 
        (username, store_name, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);

      let imported = 0;
      let skipped = 0;
      let errors = 0;
      const now = Date.now();

      // 开始事务
      const transaction = db.transaction(() => {
        for (const [storeName, storeData] of Object.entries(importData.stores)) {
          try {
            const result = insertStmt.run(
              username,
              storeName,
              JSON.stringify(storeData),
              now,
              now
            );
            
            if (result.changes > 0) {
              imported++;
            } else {
              skipped++;
            }
          } catch (storeError) {
            console.error(`导入存储数据失败 (${storeName}):`, storeError);
            errors++;
          }
        }
      });

      transaction();

      return {
        success: true,
        data: { imported, skipped, errors },
        message: `导入完成: ${imported} 个成功, ${skipped} 个跳过, ${errors} 个错误`
      };
    } catch (error) {
      console.error("导入用户数据失败:", error);
      return {
        success: false,
        data: { imported: 0, skipped: 0, errors: 0 },
        message: `导入数据失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 删除用户所有数据
   * @param username 用户名
   */
  public async clearUserData(username: string): Promise<TResponse<number>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`DELETE FROM user_store_data WHERE username = ?`);
      const result = stmt.run(username);

      return {
        success: true,
        data: result.changes,
        message: `删除了 ${result.changes} 条用户数据`
      };
    } catch (error) {
      console.error("清除用户数据失败:", error);
      return {
        success: false,
        data: 0,
        message: `清除数据失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 获取用户数据统计信息
   * @param username 用户名
   */
  public async getUserDataStats(username: string): Promise<TResponse<{
    totalStores: number;
    totalSize: number;
    lastUpdated: number | null;
    storeDetails: Array<{
      storeName: string;
      size: number;
      createdAt: number;
      updatedAt: number;
    }>;
  }>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT store_name, LENGTH(data) as size, created_at, updated_at
        FROM user_store_data 
        WHERE username = ?
        ORDER BY updated_at DESC
      `);
      const results = stmt.all(username) as Array<{
        store_name: string;
        size: number;
        created_at: number;
        updated_at: number;
      }>;

      const totalSize = results.reduce((sum, row) => sum + row.size, 0);
      const lastUpdated = results.length > 0 ? results[0].updated_at : null;
      
      const storeDetails = results.map(row => ({
        storeName: row.store_name,
        size: row.size,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      return {
        success: true,
        data: {
          totalStores: results.length,
          totalSize,
          lastUpdated,
          storeDetails
        },
        message: "获取统计信息成功"
      };
    } catch (error) {
      console.error("获取用户数据统计失败:", error);
      return {
        success: false,
        data: {
          totalStores: 0,
          totalSize: 0,
          lastUpdated: null,
          storeDetails: []
        },
        message: `获取统计信息失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 检查存储是否存在
   * @param username 用户名
   * @param storeName 存储名称
   */
  public async hasUserStore(username: string, storeName: string): Promise<TResponse<boolean>> {
    try {
      const db = await this.getDB();
      const stmt = db.prepare(`
        SELECT 1 FROM user_store_data 
        WHERE username = ? AND store_name = ?
      `);
      const result = stmt.get(username, storeName);

      return {
        success: true,
        data: !!result,
        message: result ? "存储存在" : "存储不存在"
      };
    } catch (error) {
      console.error("检查存储存在性失败:", error);
      return {
        success: false,
        data: false,
        message: `检查失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }
}

// 导出 StoreService 的单例实例
export const storeService = StoreService.getInstance();