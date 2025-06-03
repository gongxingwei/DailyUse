import { StoreApi } from "@/shared/apis/storeApi";
import type { TResponse } from "@/shared/types/response";
import { useAuthStore } from "@/modules/Account/stores/authStore";

/**
 * 用户存储服务 - 业务逻辑层
 * 结合当前用户信息，提供更便捷的存储操作
 */
export class UserStoreService {
  /**
   * 获取当前用户名
   * @returns 当前用户名，如果没有则返回 null
   */
  private static getCurrentUsername(): string | null {
    try {
      const authStore = useAuthStore();
      return authStore.currentUser?.username || null;
    } catch (error) {
      console.error('获取当前用户信息失败:', error);
      return null;
    }
  }

  /**
   * 检查用户是否已登录
   * @returns 检查结果
   */
  private static checkUserAuth(): TResponse<string> {
    const currentUsername = this.getCurrentUsername();
    
    if (!currentUsername) {
      return {
        success: false,
        message: "用户未登录，无法执行存储操作",
      };
    }

    return {
      success: true,
      message: "用户验证成功",
      data: currentUsername,
    };
  }

  /**
   * 读取当前用户的存储数据
   * @param storeName 存储名称
   * @returns 存储数据
   */
  static async read<T>(storeName: string): Promise<TResponse<T | null>> {
    const authCheck = this.checkUserAuth();
    if (!authCheck.success) {
      return {
        success: false,
        message: authCheck.message,
        data: null,
      };
    }

    return StoreApi.readUserStore<T>(authCheck.data!, storeName);
  }

  /**
   * 写入当前用户的存储数据
   * @param storeName 存储名称
   * @param data 要存储的数据
   * @returns 操作结果
   */
  static async write<T>(
    storeName: string,
    data: T
  ): Promise<TResponse<void>> {
    const authCheck = this.checkUserAuth();
    if (!authCheck.success) {
      return {
        success: false,
        message: authCheck.message,
      };
    }

    return StoreApi.writeUserStore(authCheck.data!, storeName, data);
  }

  /**
   * 删除当前用户的存储数据
   * @param storeName 存储名称
   * @returns 操作结果
   */
  static async delete(storeName: string): Promise<TResponse<void>> {
    const authCheck = this.checkUserAuth();
    if (!authCheck.success) {
      return {
        success: false,
        message: authCheck.message,
      };
    }

    return StoreApi.deleteUserStore(authCheck.data!, storeName);
  }

  /**
   * 检查当前用户的存储是否存在
   * @param storeName 存储名称
   * @returns 检查结果
   */
  static async has(storeName: string): Promise<TResponse<boolean>> {
    const authCheck = this.checkUserAuth();
    if (!authCheck.success) {
      return {
        success: false,
        message: authCheck.message,
        data: false,
      };
    }

    return StoreApi.hasUserStore(authCheck.data!, storeName);
  }

  /**
   * 获取当前用户的所有存储列表
   * @returns 存储列表
   */
  static async list(): Promise<TResponse<string[]>> {
    const authCheck = this.checkUserAuth();
    if (!authCheck.success) {
      return {
        success: false,
        message: authCheck.message,
        data: [],
      };
    }

    return StoreApi.getUserStoreList(authCheck.data!);
  }

  /**
   * 导出当前用户数据
   * @returns 导出结果
   */
  static async export(): Promise<TResponse<any>> {
    const authCheck = this.checkUserAuth();
    if (!authCheck.success) {
      return {
        success: false,
        message: authCheck.message,
      };
    }

    return StoreApi.exportUserDataToFile(authCheck.data!);
  }

  /**
   * 导入当前用户数据
   * @param overwrite 是否覆盖现有数据，默认为 false
   * @returns 导入结果
   */
  static async import(overwrite: boolean = false): Promise<TResponse<any>> {
    const authCheck = this.checkUserAuth();
    if (!authCheck.success) {
      return {
        success: false,
        message: authCheck.message,
      };
    }

    return StoreApi.importUserDataFromFile(authCheck.data!, overwrite);
  }

  /**
   * 清除当前用户的所有数据
   * @returns 清除结果
   */
  static async clear(): Promise<TResponse<number>> {
    const authCheck = this.checkUserAuth();
    if (!authCheck.success) {
      return {
        success: false,
        message: authCheck.message,
        data: 0,
      };
    }

    return StoreApi.clearUserData(authCheck.data!);
  }

  /**
   * 手动指定用户名进行操作（用于特殊情况，如登录时初始化数据）
   */
  static async readWithUsername<T>(
    username: string,
    storeName: string
  ): Promise<TResponse<T | null>> {
    if (!username) {
      return {
        success: false,
        message: "用户名不能为空",
        data: null,
      };
    }

    return StoreApi.readUserStore<T>(username, storeName);
  }

  /**
   * 手动指定用户名进行写入操作（用于特殊情况）
   */
  static async writeWithUsername<T>(
    username: string,
    storeName: string,
    data: T
  ): Promise<TResponse<void>> {
    if (!username) {
      return {
        success: false,
        message: "用户名不能为空",
      };
    }

    return StoreApi.writeUserStore(username, storeName, data);
  }

  /**
   * 获取当前登录用户名（公开方法）
   * @returns 当前用户名或 null
   */
  static getCurrentUser(): string | null {
    return this.getCurrentUsername();
  }

  /**
   * 检查当前用户是否已登录（公开方法）
   * @returns 是否已登录
   */
  static isUserLoggedIn(): boolean {
    return this.getCurrentUsername() !== null;
  }
}