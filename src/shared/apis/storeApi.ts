import { TResponse } from "@/shared/types/response";
import type { UserDataExport } from "@electron/modules/Account/services/storeService";

export interface UserDataStats {
  totalStores: number;
  totalSize: number;
  lastUpdated: number | null;
  storeDetails: Array<{
    storeName: string;
    size: number;
    createdAt: number;
    updatedAt: number;
  }>;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: number;
}

/**
 * Store API - 用户数据存储接口
 */
export class StoreApi {
  /**
   * 读取用户存储数据
   */
  static async readUserStore<T>(
    username: string,
    storeName: string
  ): Promise<TResponse<T | null>> {
    return window.shared.ipcRenderer.invoke("store:read", username, storeName);
  }

  /**
   * 写入用户存储数据
   */
  static async writeUserStore<T>(
    username: string,
    storeName: string,
    data: T
  ): Promise<TResponse<void>> {
    return window.shared.ipcRenderer.invoke("store:write", username, storeName, data);
  }

  /**
   * 删除用户存储数据
   */
  static async deleteUserStore(
    username: string,
    storeName: string
  ): Promise<TResponse<void>> {
    return window.shared.ipcRenderer.invoke("store:delete", username, storeName);
  }

  /**
   * 检查存储是否存在
   */
  static async hasUserStore(
    username: string,
    storeName: string
  ): Promise<TResponse<boolean>> {
    return window.shared.ipcRenderer.invoke("store:has", username, storeName);
  }

  /**
   * 获取用户所有存储列表
   */
  static async getUserStoreList(username: string): Promise<TResponse<string[]>> {
    return window.shared.ipcRenderer.invoke("store:list", username);
  }

  /**
   * 清除用户所有数据
   */
  static async clearUserData(username: string): Promise<TResponse<number>> {
    return window.shared.ipcRenderer.invoke("store:clear", username);
  }

  /**
   * 获取用户数据统计
   */
  static async getUserDataStats(username: string): Promise<TResponse<UserDataStats>> {
    return window.shared.ipcRenderer.invoke("store:stats", username);
  }

  /**
   * 导出用户数据
   */
  static async exportUserData(username: string): Promise<TResponse<UserDataExport>> {
    return window.shared.ipcRenderer.invoke("store:export", username);
  }

  /**
   * 导出用户数据到文件
   */
  static async exportUserDataToFile(username: string): Promise<TResponse<UserDataExport>> {
    return window.shared.ipcRenderer.invoke("store:export-to-file", username);
  }

  /**
   * 导入用户数据
   */
  static async importUserData(
    username: string,
    importData: UserDataExport,
    overwrite?: boolean
  ): Promise<TResponse<ImportResult>> {
    return window.shared.ipcRenderer.invoke("store:import", username, importData, overwrite);
  }

  /**
   * 从文件导入用户数据
   */
  static async importUserDataFromFile(
    username: string,
    overwrite?: boolean
  ): Promise<TResponse<ImportResult>> {
    return window.shared.ipcRenderer.invoke("store:import-from-file", username, overwrite);
  }
}