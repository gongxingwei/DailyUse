import { app } from "electron";
import path from "path";
import fs from "fs/promises";
import { TResponse } from "@/modules/Account/types/response";

/**
 * 共享数据服务类
 * 用于管理需要在应用程序中持久化的共享数据（如已保存的账号信息）
 * 使用单例模式确保全局只有一个实例
 */
class SharedDataService {
  private static instance: SharedDataService;
  /** 共享数据目录路径 */
  private sharedDataPath: string;
  /** 共享数据文件路径 */
  private sharedDataFile: string;

  /**
   * 私有构造函数
   * 初始化数据存储路径并确保存储目录和文件存在
   */
  private constructor() {
    this.sharedDataPath = path.join(app.getPath("userData"), "sharedData");
    this.sharedDataFile = path.join(this.sharedDataPath, "data.json");
    this.initStorage();
  }

  /**
   * 获取 SharedDataService 的单例实例
   * @returns SharedDataService 实例
   */
  public static getInstance(): SharedDataService {
    if (!SharedDataService.instance) {
      SharedDataService.instance = new SharedDataService();
    }
    return SharedDataService.instance;
  }

  /**
   * 初始化存储系统
   * 创建必要的目录和文件结构
   */
  private async initStorage() {
    try {
      // 创建共享数据目录（如果不存在）
      await fs.mkdir(this.sharedDataPath, { recursive: true });
      try {
        // 检查数据文件是否存在
        await fs.access(this.sharedDataFile);
      } catch {
        // 如果文件不存在，创建一个空的 JSON 文件
        await fs.writeFile(this.sharedDataFile, JSON.stringify({}));
      }
    } catch (error) {
      console.error("初始化存储失败:", error);
    }
  }

  /**
   * 添加保存的账号信息
   * @param key - 账号唯一标识符（通常是用户名）
   * @param value - 要保存的账号信息
   * @returns {Promise<TResponse>} 返回Promise
   * ```typescript
   * {
   *   success: true,
   *   message: "数据添加成功"
   * }
   * ```
   * @throws 当添加失败时抛出错误
   */
  public async addSavedAccountInfo(
    key: string,
    value: any
  ): Promise<TResponse> {
    try {
      const data = await fs.readFile(this.sharedDataFile, "utf-8");
      const jsonData = JSON.parse(data);
      jsonData[key] = value;
      console.log("jsonData", jsonData);
      await fs.writeFile(this.sharedDataFile, JSON.stringify(jsonData));
      return {
        success: true,
        message: "数据添加成功",
      };
    } catch (error) {
      console.error("添加数据失败:", error);
      throw error;
    }
  }
  /**
   * 删除保存的账号信息
   * @param key - 要删除的账号标识符
   * @returns {Promise<TResponse>} 返回Promise
   * ```typescript
   * {
   *   success: true,
   *   message: "数据删除成功"
   * }
   * ```
   * @throws 当删除失败时抛出错误
   */
  public async removeSavedAccountInfo(key: string): Promise<TResponse> {
    try {
      const data = await fs.readFile(this.sharedDataFile, "utf-8");
      const jsonData = JSON.parse(data);
      delete jsonData[key];
      await fs.writeFile(this.sharedDataFile, JSON.stringify(jsonData));
      return {
        success: true,
        message: "数据删除成功",
      };
    } catch (error) {
      console.error("删除数据失败:", error);
      throw error;
    }
  }

  /**
   * 获取所有保存的账号信息
   * @returns {Promise<TResponse>} 返回Promise
   * ```typescript
   * // 成功时
   * {
   *   success: true,
   *   message: "数据读取成功",
   *   data: [
   *     { username: string, password?: string, remember: boolean, ... }
   *   ]
   * }
   * 
   * // 失败时
   * {
   *   success: false,
   *   message: "读取数据失败",
   *   data: []
   * }
   * ```
   */
  public async getAllSavedAccountInfo(): Promise<TResponse> {
    try {
      const data = await fs.readFile(this.sharedDataFile, "utf-8");
      const jsonData = JSON.parse(data);
      // 将对象转换为数组
      const accountsArray = Object.values(jsonData);
      return {
        success: true,
        message: "数据读取成功",
        data: accountsArray,
      };
    } catch (error) {
      console.error("读取数据失败:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "读取数据失败",
        data: [] // 失败时返回空数组
    };
    }
  }

  /**
   * 更新保存的账号信息
   * @param key - 要更新的账号标识符
   * @param value - 新的账号信息
   * @returns {Promise<TResponse>} 返回Promise
   * ```typescript
   * {
   *   success: true,
   *   message: "数据更新成功"
   * }
   * ```
   * @throws 当更新失败时抛出错误
   */
  public async updateSavedAccountInfo(
    key: string,
    value: any
  ): Promise<TResponse> {
    try {
      const data = await fs.readFile(this.sharedDataFile, "utf-8");
      const jsonData = JSON.parse(data);
      jsonData[key] = value;
      await fs.writeFile(this.sharedDataFile, JSON.stringify(jsonData));
      return {
        success: true,
        message: "数据更新成功",
      };
    } catch (error) {
      console.error("更新数据失败:", error);
      throw error;
    }
  }
}

export const sharedDataService = SharedDataService.getInstance();
