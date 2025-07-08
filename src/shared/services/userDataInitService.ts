import { UserStoreService } from "./userStoreService";
import { useGoalStore } from "@/modules/Goal/presentation/stores/goalStore";
import { useTaskStore } from "@/modules/Task/presentation/stores/taskStore";
import { useReminderStore } from "@/modules/Reminder/stores/reminderStore";
import { useRepositoryStore } from "@/modules/Repository/stores/repositoryStore";
import { useSettingStore } from "@/modules/Setting/stores/settingStore";
import { getTaskDomainApplicationService } from "@/modules/Task/application/services/taskDomainApplicationService";
import { getGoalDomainApplicationService } from "@/modules/Goal/application/services/goalDomainApplicationService";
import type { Reminder } from "@/modules/Reminder/stores/reminderStore";
import type { Repository } from "@/modules/Repository/stores/repositoryStore";
import type { AppSetting } from "@/modules/Setting/stores/settingStore";


/**
 * 用户数据初始化服务
 * 负责用户登录时从存储中加载各个模块的数据到对应的 store
 */
export class UserDataInitService {
  /**
   * 初始化用户所有数据
   * @param username 用户名（可选，如果不提供则使用当前登录用户）
   */
  static async initUserData(username?: string): Promise<void> {
    try {
      const targetUsername = username || UserStoreService.getCurrentUser();

      if (!targetUsername) {
        throw new Error("没有找到用户信息，无法初始化数据");
      }

      console.log(`开始初始化用户 ${targetUsername} 的数据...`);

      // 并行加载各个模块的数据
      await Promise.all([
        this.initGoalData(targetUsername),
        this.initTaskData(targetUsername),
        this.initReminderData(targetUsername),
        this.initRepositoryData(targetUsername),
        this.initSettingData(targetUsername),
      ]);

      console.log(`用户 ${targetUsername} 数据初始化完成`);
    } catch (error) {
      console.error(`用户数据初始化失败:`, error);
      throw error;
    }
  }

  /**
   * 初始化目标模块数据
   * 现在使用新的独立数据库，通过IPC调用主进程获取数据
   */
  private static async initGoalData(username: string): Promise<void> {
    try {
      console.log(`开始初始化目标数据 (用户: ${username})...`);
      // 通过调用服务同步目标数据
      const goalService = getGoalDomainApplicationService();
      await goalService.syncAllData();
      
      console.log(`✅ 目标数据初始化完成`);
    } catch (error) {
      console.error("❌ 目标数据初始化失败:", error);
      const goalStore = useGoalStore();
      goalStore.$patch({
        goals: [],
        goalDirs: [],
      });
      throw error;
    }
  }

  /**
   * 初始化任务模块数据
   * 现在使用新的独立数据库，通过IPC调用主进程获取数据
   */
  private static async initTaskData(username: string): Promise<void> {
    try {
      console.log(`开始初始化任务数据 (用户: ${username})...`);
      // 通过调用服务同步任务数据
      const taskService = getTaskDomainApplicationService();
      await taskService.syncAllData();
      
    
    } catch (error) {
      console.error("❌ 任务数据初始化失败:", error);
      const taskStore = useTaskStore();
      taskStore.$patch({
        taskTemplates: [],
        taskInstances: [],
        metaTemplates: [],
      });
      throw error;
    }
  }

  /**
   * 初始化提醒数据
   */
  private static async initReminderData(username: string): Promise<void> {
    try {
      const reminderStore = useReminderStore();

      const remindersResponse = await UserStoreService.readWithUsername<Reminder[]>(username, "reminders");

      reminderStore.$patch({
        reminders: remindersResponse.success && remindersResponse.data ? remindersResponse.data : [],
      });

      const remindersCount = remindersResponse.success && remindersResponse.data ? remindersResponse.data.length : 0;
      console.log(`加载了 ${remindersCount} 个提醒`);
    } catch (error) {
      console.error("提醒数据初始化失败:", error);
      const reminderStore = useReminderStore();
      reminderStore.$patch({
        reminders: [],
      });
      throw error;
    }
  }

  /**
   * 初始化仓库数据
   */
  private static async initRepositoryData(username: string): Promise<void> {
    try {
      const repositoryStore = useRepositoryStore();

      const repositoriesResponse = await UserStoreService.readWithUsername<Repository[]>(username, "repositories");

      repositoryStore.$patch({
        repositories: repositoriesResponse.success && repositoriesResponse.data ? repositoriesResponse.data : [],
      });

      const repositoriesCount = repositoriesResponse.success && repositoriesResponse.data ? repositoriesResponse.data.length : 0;
      console.log(`加载了 ${repositoriesCount} 个仓库`);
    } catch (error) {
      console.error("仓库数据初始化失败:", error);
      const repositoryStore = useRepositoryStore();
      repositoryStore.$patch({
        repositories: [],
      });
      throw error;
    }
  }

  /**
   * 初始化设置数据
   */
  private static async initSettingData(username: string): Promise<void> {
    try {
      const settingStore = useSettingStore();

      const settingsResponse = await UserStoreService.readWithUsername<AppSetting>(username, "settings");

      if (settingsResponse.success && settingsResponse.data) {
        settingStore.$patch(settingsResponse.data);
      }

      console.log(`设置数据加载完成`);
    } catch (error) {
      console.error("设置数据初始化失败:", error);
      // 设置数据失败时保持默认值
      throw error;
    }
  }

  /**
   * 清空所有 store 数据（用户退出登录时调用）
   */
  static clearAllStoreData(): void {
    try {
      const goalStore = useGoalStore();
      const taskStore = useTaskStore();
      const reminderStore = useReminderStore();
      const repositoryStore = useRepositoryStore();

      // 重置各个 store
      goalStore.$patch({
        goals: [],
        goalDirs: [],
        tempGoalDir: null,
      });

      taskStore.$patch({
        taskTemplates: [],
        taskInstances: [],
        metaTemplates: [],
      });

      reminderStore.$patch({
        reminders: [],
      });

      repositoryStore.$patch({
        repositories: [],
      });

      console.log("所有 store 数据已清空");
    } catch (error) {
      console.error("清空 store 数据失败:", error);
    }
  }

  /**
   * 保存用户数据到存储
   * 注意：任务数据和目标数据现在使用独立数据库，不再保存到文件存储中
   */
  static async saveUserData(): Promise<void> {
    try {
      if (!UserStoreService.isUserLoggedIn()) {
        throw new Error("用户未登录，无法保存数据");
      }

      const reminderStore = useReminderStore();
      const repositoryStore = useRepositoryStore();
      const settingStore = useSettingStore();

      // 并行保存所有数据（不包括任务和目标数据，因为它们现在使用独立数据库）
      const results = await Promise.all([
        UserStoreService.write("reminders", reminderStore.reminders),
        UserStoreService.write("repositories", repositoryStore.repositories),
        UserStoreService.write("settings", settingStore.$state),
      ]);

      // 检查保存结果
      const failedSaves = results.filter((result) => !result.success);
      if (failedSaves.length > 0) {
        console.error("部分数据保存失败:", failedSaves);
        throw new Error("部分数据保存失败");
      }

      console.log(`用户数据保存成功 (任务和目标数据自动保存到独立数据库)`);
    } catch (error) {
      console.error(`用户数据保存失败:`, error);
      throw error;
    }
  }

  /**
   * 获取用户存储列表
   */
  static async getUserStoreList(): Promise<string[]> {
    try {
      const response = await UserStoreService.list();
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error("获取用户存储列表失败:", error);
      return [];
    }
  }
}