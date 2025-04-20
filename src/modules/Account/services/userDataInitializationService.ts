import { useRepositoryStore } from "@/modules/Repository/stores/repositoryStore";
import { useSettingStore } from "@/modules/Setting/stores/settingStore";
import { useTaskStore } from "@/modules/Task/stores/taskStore";
import { useGoalStore } from "@/modules/Goal/stores/goalStore";

class UserDataInitializationService {
    private static instance: UserDataInitializationService;

    private constructor() {}

    public static getInstance(): UserDataInitializationService {
        if (!this.instance) {
            this.instance = new UserDataInitializationService();
        }
        return this.instance;
    }
    /**
     * 初始化用户数据
     * @returns {Promise<void>}
     */
    async initializeUserData() {
        try {
            // 并行加载所有数据
            await Promise.all([
                this.initializeRepositories(),
                this.initializeSettings(),
                this.initializeTasks(),
                this.initializeTargets()
            ]);
        } catch (error) {
            console.error('Failed to initialize user data:', error);
            throw error;
        }
    }

    private async initializeRepositories() {
        const repositoryStore = useRepositoryStore();
        await repositoryStore.initialize();
    }

    private async initializeSettings() {
        const settingsStore = useSettingStore();
        await settingsStore.initialize();
    }

    private async initializeTasks() {
        const taskStore = useTaskStore();
        await taskStore.initialize();
    }

    private async initializeTargets() {
        const targetStore = useGoalStore();
        await targetStore.initialize();
    }

    async clearUserData() {
        const stores = [
            useRepositoryStore(),
            useSettingStore(),
            useTaskStore(),
            useGoalStore()
        ];

        for (const store of stores) {
            store.$reset();
        }
    }
}

export const userDataInitializationService = UserDataInitializationService.getInstance();