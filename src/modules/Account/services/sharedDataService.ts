import type { TResponse } from '../types/response';

/**
 * 共享数据服务类
 * 负责处理已保存账号信息的前端操作
 * 使用单例模式确保全局只有一个实例
 */
class SharedDataService {
    /** 单例实例 */
    private static instance: SharedDataService;

    /** 私有构造函数，防止外部直接实例化 */
    private constructor() {}

    /**
     * 获取 SharedDataService 的单例实例
     * @returns {SharedDataService} 服务实例
     */
    public static getInstance(): SharedDataService {
        if (!SharedDataService.instance) {
            SharedDataService.instance = new SharedDataService();
        }
        return SharedDataService.instance;
    }

    /**
     * 获取所有已保存的账号信息
     * @returns {Promise<TResponse>} 返回Promise
     * ```typescript
     * // 成功时返回
     * {
     *   success: true,
     *   message: "获取成功",
     *   data: [
     *     {
     *       username: string,
     *       password?: string,
     *       remember: boolean,
     *       lastLoginTime: string,
     *       token?: string
     *     }
     *   ]
     * }
     * ```
     * @throws 当获取失败时抛出错误
     */
    public async getAllSavedAccountInfo(): Promise<TResponse> {
        try {
            const response = await window.shared.ipcRenderer.invoke("sharedData:get-all-saved-account-info");
            if (response.success) {
                return response;
            } else {
                throw new Error(response.message || "获取已保存的账号信息失败");
            }
        } catch (error) {
            console.error("获取已保存的账号信息失败:", error);
            throw error;
        }
    }

    /**
     * 添加保存的账号信息
     * @param key - 账号唯一标识符（通常是用户名）
     * @param value - 要保存的账号信息对象
     * @returns {Promise<TResponse>} 返回Promise
     * ```typescript
     * {
     *   success: true,
     *   message: "保存成功"
     * }
     * ```
     */
    public async addSavedAccountInfo(key: string, value: any): Promise<TResponse> {
        try {
            return await window.shared.ipcRenderer.invoke(
                "sharedData:add-saved-account-info",
                key,
                value
            );
        } catch (error) {
            console.error("添加账号信息失败:", error);
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
     *   message: "删除成功"
     * }
     * ```
     */
    public async removeSavedAccountInfo(key: string): Promise<TResponse> {
        try {
            return await window.shared.ipcRenderer.invoke(
                "sharedData:remove-saved-account-info",
                key
            );
        } catch (error) {
            console.error("删除账号信息失败:", error);
            throw error;
        }
    }

    /**
     * 更新保存的账号信息
     * @param key - 要更新的账号标识符
     * @param value - 新的账号信息对象
     * @returns {Promise<TResponse>} 返回Promise
     * ```typescript
     * {
     *   success: true,
     *   message: "更新成功"
     * }
     * ```
     */
    public async updateSavedAccountInfo(key: string, value: any): Promise<TResponse> {
        try {
            return await window.shared.ipcRenderer.invoke(
                "sharedData:update-saved-account-info",
                key,
                value
            );
        } catch (error) {
            console.error("更新账号信息失败:", error);
            throw error;
        }
    }
}

// 导出单例实例
export const sharedDataService = SharedDataService.getInstance();