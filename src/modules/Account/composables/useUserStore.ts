import { useAuthStore } from '../stores/authStore';
import { userDataService } from '../services/userDataService';

/**
 * 用户数据操作 composable
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
        
        return await userDataService.readUserData<T>(userId, storeName);
    };

    /**
     * 保存用户特定数据
     */
    const saveUserData = async (data: T): Promise<void> => {
        const userId = authStore.currentUser?.id;
        if (!userId) throw new Error('用户未登录');
        
        await userDataService.saveUserData<T>(userId, storeName, data);
    };

    return {
        loadUserData,
        saveUserData
    };
}