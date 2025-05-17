import { app } from "electron";
import path from "path";
import fs from "fs/promises";
import { TResponse } from "@/modules/Account/types/response";
/**
 * 本地账户存储服务
 * 负责处理用户数据的本地存储，包括用户信息的读写和用户目录的管理
 */
export class LocalAccountStorageService {
  // 单例实例
  private static instance: LocalAccountStorageService;
  // 用户数据目录路径
  private userDataPath: string;
  // 用户数据文件路径
  private usersFile: string;

  /**
   * 私有构造函数，确保单例模式
   * 初始化存储路径并创建必要的目录结构
   */
  private constructor() {
    this.userDataPath = path.join(app.getPath("userData"), "accounts");
    this.usersFile = path.join(this.userDataPath, "users.json");
    this.initStorage();
  }

  /**
   * 获取 LocalAccountStorageService 的单例实例
   * @returns LocalAccountStorageService 实例
   */
  public static getInstance(): LocalAccountStorageService {
    if (!LocalAccountStorageService.instance) {
      LocalAccountStorageService.instance = new LocalAccountStorageService();
    }
    return LocalAccountStorageService.instance;
  }

  /**
   * 初始化存储系统
   * 创建必要的目录和文件结构
   */
  private async initStorage() {
    try {
      // 确保用户数据目录存在
      await fs.mkdir(this.userDataPath, { recursive: true });
      try {
        // 检查用户数据文件是否存在
        await fs.access(this.usersFile);
      } catch {
        // 如果文件不存在，创建空的用户数据文件
        await fs.writeFile(this.usersFile, JSON.stringify({}));
      }
    } catch (error) {
      console.error("初始化存储失败:", error);
    }
  }

  /**
   * 读取所有用户数据
   * @returns 包含所有用户信息的对象
   */
  async readUsers(): Promise<Record<string, any>> {
    try {
      const data = await fs.readFile(this.usersFile, "utf-8");
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  /**
   * 写入用户数据
   * @param users - 要写入的用户数据对象
   */
  async writeUsers(users: Record<string, any>): Promise<void> {
    await fs.writeFile(this.usersFile, JSON.stringify(users, null, 2));
  }

  /**
   * 保存认证token
   * @param token - 认证token
   * @param userId - 用户ID
   * @returns - Promise<void>
   * @throws - 当保存失败时抛出错误
   */
  async saveAuthToken(token: string, userId: string): Promise<TResponse> {
    const authData = {
      token,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天过期
    };

    // 将 auth.json 存储在用户特定目录下
    const userDir = this.getUserDataPath(userId);
    const authFile = path.join(userDir, "auth.json");

    try {
      await fs.mkdir(userDir, { recursive: true });
      await fs.writeFile(authFile, JSON.stringify(authData, null, 2));
      return {
        success: true,
        message: "success to save token",
        data: {
          token,
          userId,
        },
      };
    } catch (error) {
      console.error("保存认证token失败:", error);
      return {
        success: false,
        message: "faild to save token",
        data: {
          token: undefined,
          userId: undefined,
        },
      }
    }
  }

  /**
   * 获取认证token
   * @param userId - 用户ID
   * @returns - Promise<TResponse>
   * @description - 返回一个包含以下结构的 Promise:
   * ```typescript
   * {
   *   success: boolean;      // 获取是否成功
   *  message: string;      // 信息（错误信息 || 成功信息）
   *  data: {
   *    token: string | undefined; // 认证token
   *   userId: string | undefined; // 用户ID
   *  }
   * @throws - 当获取失败时抛出错误
   * @description - 如果token过期，则清除token
   */
  async getAuthToken(userId: string): Promise<TResponse> {
    try {
      const authFile = path.join(this.getUserDataPath(userId), "auth.json");
      const data = await fs.readFile(authFile, "utf-8");
      const authData = JSON.parse(data);

      // 检查token是否过期
      if (new Date(authData.expiresAt) < new Date()) {
        await this.clearAuthToken(userId);
        return {
          success: false,
          message: "token已过期",
          data: {
            token: undefined,
            userId: undefined,
          },
        };
      }

      return {
        success: true,
        message: "获取token成功",
        data: {
          token: authData.token,
          userId: authData.userId,
        },
      };
    } catch (error) {
      console.error("获取认证token失败:", error);
      return {
        success: false,
        message: "获取token失败",
        data: {
          token: undefined,
          userId: undefined,
        },
      };
    }
  }

  /**
   * 清除认证token
   * @param userId - 用户ID
   * @returns - Promise<void>
   * @throws - 当清除失败时抛出错误
   * @description - 清除用户目录下的auth.json文件
   * 如果文件不存在，则不抛出错误
   * @description - 如果文件存在，则删除文件
   * @description - 如果文件删除失败，则抛出错误
   * @description - 如果文件删除成功，则返回成功
   */
  async clearAuthToken(userId: string): Promise<void> {
    try {
      const authFile = path.join(this.getUserDataPath(userId), "auth.json");
      await fs.writeFile(authFile, JSON.stringify({}));
    } catch (error) {
      console.error("清除认证token失败:", error);
    }
  }
  /**
   * 创建用户专属目录
   * @param userId - 用户ID
   */
  public async createUserDirectory(userId: string): Promise<void> {
    // 创建用户专属目录
    const userDir = path.join(this.userDataPath, userId);
    await fs.mkdir(userDir, { recursive: true });

    // 创建用户配置文件
    await fs.writeFile(
      path.join(userDir, "config.json"),
      JSON.stringify({ createdAt: new Date().toISOString() })
    );
  }

  /**
   * 获取用户数据目录路径
   * @param userId 用户ID
   * @returns 用户数据目录的完整路径
   */
  public getUserDataPath(userId: string): string {
    return path.join(this.userDataPath, userId);
  }

  /**
   * 读取用户特定的数据文件
   * @param userId 用户ID
   * @param storeName 存储名称（如 'goals', 'tasks' 等）
   */
  public async readUserStore<T>(
    userId: string,
    storeName: string
  ): Promise<T | null> {
    try {
      const filePath = path.join(
        this.getUserDataPath(userId),
        `${storeName}.json`
      );
      const data = await fs.readFile(filePath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  /**
   * 写入用户特定的数据文件
   * @param userId 用户ID
   * @param storeName 存储名称
   * @param data 要存储的数据
   */
  public async writeUserStore<T>(
    userId: string,
    storeName: string,
    data: T
  ): Promise<void> {
    const userDir = this.getUserDataPath(userId);
    await fs.mkdir(userDir, { recursive: true });
    const filePath = path.join(userDir, `${storeName}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  /**
   * 迁移用户数据
   * @param fromUserId 源用户ID
   * @param toUserId 目标用户ID
   */
  public async migrateUserData(
    fromUserId: string,
    toUserId: string
  ): Promise<void> {
    const fromDir = this.getUserDataPath(fromUserId);
    const toDir = this.getUserDataPath(toUserId);

    try {
      const files = await fs.readdir(fromDir);
      await fs.mkdir(toDir, { recursive: true });

      for (const file of files) {
        const sourcePath = path.join(fromDir, file);
        const targetPath = path.join(toDir, file);
        await fs.copyFile(sourcePath, targetPath);
      }
    } catch (error) {
      console.error("数据迁移失败:", error);
      throw error;
    }
  }

  /**
   * 导出用户数据到指定目录
   * @param userId 用户ID
   * @param exportPath 导出目标文件夹路径
   */
  public async exportUserData(
    userId: string,
    exportPath: string
  ): Promise<void> {
    const userDir = path.join(this.userDataPath, userId);
    const targetDir = path.join(
      exportPath,
      `user_data_${userId}_${Date.now()}`
    );

    try {
      // 创建导出目录
      await fs.mkdir(targetDir, { recursive: true });

      // 复制所有文件和目录
      const copyFiles = async (sourcePath: string, targetPath: string) => {
        const files = await fs.readdir(sourcePath);

        for (const file of files) {
          const sourceFilePath = path.join(sourcePath, file);
          const targetFilePath = path.join(targetPath, file);

          const stats = await fs.stat(sourceFilePath);

          if (stats.isDirectory()) {
            // 如果是目录，递归复制
            await fs.mkdir(targetFilePath, { recursive: true });
            await copyFiles(sourceFilePath, targetFilePath);
          } else {
            // 如果是文件，直接复制
            await fs.copyFile(sourceFilePath, targetFilePath);
          }
        }
      };

      await copyFiles(userDir, targetDir);
    } catch (error) {
      console.error("导出用户数据失败:", error);
      throw new Error("导出用户数据失败");
    }
  }

  /**
   * 导入用户数据
   * @param userId 用户ID
   * @param importPath 导入源文件夹路径
   */
  public async importUserData(
    userId: string,
    importPath: string
  ): Promise<void> {
    const userDir = path.join(this.userDataPath, userId);

    try {
      // 确保用户目录存在
      await fs.mkdir(userDir, { recursive: true });

      // 复制所有文件和目录
      const copyFiles = async (sourcePath: string, targetPath: string) => {
        const files = await fs.readdir(sourcePath);

        for (const file of files) {
          const sourceFilePath = path.join(sourcePath, file);
          const targetFilePath = path.join(targetPath, file);

          const stats = await fs.stat(sourceFilePath);

          if (stats.isDirectory()) {
            await fs.mkdir(targetFilePath, { recursive: true });
            await copyFiles(sourceFilePath, targetFilePath);
          } else {
            await fs.copyFile(sourceFilePath, targetFilePath);
          }
        }
      };

      await copyFiles(importPath, userDir);
    } catch (error) {
      console.error("导入用户数据失败:", error);
      throw new Error("导入用户数据失败");
    }
  }

  /**
   * 清除用户数据
   * @param userId 用户ID
   */
  public async clearUserData(userId: string): Promise<void> {
    const userDir = path.join(this.userDataPath, userId);

    try {
      await fs.rm(userDir, { recursive: true, force: true });
      await fs.mkdir(userDir); // 重新创建空目录
    } catch (error) {
      console.error("清除用户数据失败:", error);
      throw new Error("清除用户数据失败");
    }
  }

  /**
   * 获取用户数据大小（字节）
   * @param userId 用户ID
   */
  public async getUserDataSize(userId: string): Promise<number> {
    const userDir = path.join(this.userDataPath, userId);
    let size = 0;

    async function calculateSize(dirPath: string): Promise<void> {
      const files = await fs.readdir(dirPath);
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        if (stats.isDirectory()) {
          await calculateSize(filePath);
        } else {
          size += stats.size;
        }
      }
    }

    await calculateSize(userDir);
    return size;
  }
}

// 导出 LocalAccountStorageService 的单例实例
export const localAccountStorageService =
  LocalAccountStorageService.getInstance();
