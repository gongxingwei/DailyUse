class UserDataService {
    private static instance: UserDataService;
    private constructor() {}
    public static getInstance(): UserDataService {
        if (!UserDataService.instance) {
            UserDataService.instance = new UserDataService();
        }
        return UserDataService.instance;
    }

    /**
     * 读取用户特定数据
     * @param userId - 用户 ID
     * @param storeName - 存储名称
     * @returns T | null - 读取的数据或null
     */
    public async readUserData<T>(userId: string, storeName: string): Promise<T | null> {
        return await window.shared.ipcRenderer.invoke('userStore:read', userId, storeName);
    }

    /**
     * 保存用户特定数据
     * @param userId - 用户 ID
     * @param storeName - 存储名称
     * @param data - 要保存的数据
     */
    public async saveUserData<T>(userId: string, storeName: string, data: T): Promise<void> {
        // 确保数据是可序列化的
        const serializableData = JSON.parse(JSON.stringify(data));
        await window.shared.ipcRenderer.invoke('userStore:write', userId, storeName, serializableData);
    }
    
    /**
     * 导出用户数据
     * @param userId - 用户 ID
     * @returns bolean - 是否成功导出
     */
    public async exportUserData(userId: string): Promise<boolean> {
        return await window.shared.ipcRenderer.invoke('userStore:export', userId);
    }
    /**
     * 导入用户数据
     * @param userId - 用户 ID
     * @returns bolean - 是否成功导入
     */
    public async importUserData(userId: string): Promise<boolean> {
        return await window.shared.ipcRenderer.invoke('userStore:import', userId);
    }

    /**
     * 删除用户数据
     * @param userId - 用户 ID
     * @returns bolean - 是否成功删除
     */
    public async clearUserData(userId: string): Promise<boolean> {
        return await window.shared.ipcRenderer.invoke('userStore:clear', userId);
    }

    /**
     * 获取用户数据大小
     * @param userId - 用户 ID
     * @returns bolean - 是否成功获取
     */
    public async getUserDataSize(userId: string): Promise<number> {
        return await window.shared.ipcRenderer.invoke('userStore:size', userId);
    }

    
}

export const userDataService = UserDataService.getInstance();