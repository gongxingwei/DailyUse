// 导入各个模块的 Store
import { useRepositoryStore } from "@/modules/Repository/stores/repositoryStore";
import { useSettingStore } from "@/modules/Setting/stores/settingStore";
import { useTaskStore } from "@/modules/Task/stores/taskStore";
import { useGoalStore } from "@/modules/Goal/stores/goalStore";
import { useGoalDirStore } from "@/modules/Goal/stores/goalDirStore";
import { useGoalReviewStore } from "@/modules/Goal/stores/goalReviewStore";

/**
 * 用户数据初始化服务类
 * 使用单例模式确保全局只有一个实例
 */
class UserDataInitializationService {
    // 单例实例
    private static instance: UserDataInitializationService;

    // 私有构造函数，防止外部直接实例化
    private constructor() {}

    /**
     * 获取单例实例
     * 如果实例不存在则创建新实例
     */
    public static getInstance(): UserDataInitializationService {
        if (!this.instance) {
            this.instance = new UserDataInitializationService();
        }
        return this.instance;
    }

    /**
     * 初始化所有用户数据
     * 通过 Promise.all 并行加载所有数据以提高性能
     */
    async initializeUserData() {
        try {
            // 并行初始化所有模块数据
            await Promise.all([
                this.initializeRepositories(),  // 初始化仓库数据
                this.initializeSettings(),      // 初始化设置数据
                this.initializeTasks(),         // 初始化任务数据
                this.initializeTargets(),       // 初始化目标数据
                this.initializeGoalDirs(),      // 初始化目标文件夹数据
                this.initializeGoalReviews(),   // 初始化目标复盘数据
            ]);
        } catch (error) {
            console.error('用户数据初始化失败:', error);
            throw error;
        }
    }

    /**
     * 初始化仓库数据
     */
    private async initializeRepositories() {
        const repositoryStore = useRepositoryStore();
        await repositoryStore.initialize();
    }

    /**
     * 初始化用户设置
     */
    private async initializeSettings() {
        const settingsStore = useSettingStore();
        await settingsStore.initialize();
    }

    /**
     * 初始化任务数据
     */
    private async initializeTasks() {
        const taskStore = useTaskStore();
        await taskStore.initialize();
    }

    /**
     * 初始化目标数据
     */
    private async initializeTargets() {
        const targetStore = useGoalStore();
        await targetStore.initialize();
    }

    /**
     * 初始化目标文件夹数据
     */
    private async initializeGoalDirs() {
        const goalDirStore = useGoalDirStore();
        await goalDirStore.initialize();
    }

    /**
     * 初始化目标复盘数据
     */
    private async initializeGoalReviews() {
        const goalReviewStore = useGoalReviewStore();
        await goalReviewStore.initialize();
    }

    /**
     * 清除所有用户数据
     * 重置所有 Store 到初始状态
     */
    async clearUserData() {
        // 获取所有需要重置的 Store
        const stores = [
            useRepositoryStore(),
            useSettingStore(),
            useTaskStore(),
            useGoalStore(),
            useGoalDirStore(),
            useGoalReviewStore(),
        ];

        // 依次重置每个 Store
        for (const store of stores) {
            store.$reset();
        }
    }
}

// 导出单例实例
export const userDataInitializationService = UserDataInitializationService.getInstance();