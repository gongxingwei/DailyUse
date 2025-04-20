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
        return await window.shared.ipcRenderer.invoke('userStore:delete', userId);
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