import { useAuthStore } from '@/modules/Account/stores/authStore';

/**
 * 用户数据存储 composable
 * @param storeName 存储名称
 */
export function useUserStore<T>(storeName: string) {
    const authStore = useAuthStore();

    /**
     * 加载用户特定数据
     */
    const loadUserData = async (): Promise<T | null> => {
        const userId = authStore.currentUser?.id;
        if (!userId) return null;
        
        return await window.shared.ipcRenderer.invoke('userStore:read', userId, storeName);
    };

    /**
     * 保存用户特定数据
     */
    const saveUserData = async (data: T): Promise<void> => {
        const userId = authStore.currentUser?.id;
        if (!userId) throw new Error('用户未登录');
        // 确保数据是可序列化的
        const serializableData = JSON.parse(JSON.stringify(data));
        
        await window.shared.ipcRenderer.invoke('userStore-write', userId, storeName, serializableData);
    };

    return {
        loadUserData,
        saveUserData
    };
}