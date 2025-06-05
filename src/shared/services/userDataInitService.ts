import { UserStoreService } from "./userStoreService";
import { useGoalStore } from "@/modules/Goal/stores/goalStore";
import { useTaskStore } from "@/modules/Task/stores/taskStore";
import { useGoalDirStore } from "@/modules/Goal/stores/goalDirStore";
import { useGoalReviewStore } from "@/modules/Goal/stores/goalReviewStore";
import { useReminderStore } from "@/modules/Reminder/stores/reminderStore";
import { useRepositoryStore } from "@/modules/Repository/stores/repositoryStore";
import { useSettingStore } from "@/modules/Setting/stores/settingStore";
import type { IGoal, IRecord, IGoalDir } from "@/modules/Goal/types/goal";
import type { ITaskInstance, ITaskTemplate } from "@/modules/Task/types/task";
import type { Review } from "@/modules/Goal/stores/goalReviewStore";
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
        this.initGoalDirData(targetUsername),
        this.initGoalReviewData(targetUsername),
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
   */
  private static async initGoalData(username: string): Promise<void> {
    try {
      const goalStore = useGoalStore();

      const [goalsResponse, recordsResponse] = await Promise.all([
        UserStoreService.readWithUsername<IGoal[]>(username, "goals"),
        UserStoreService.readWithUsername<IRecord[]>(username, "records"),
      ]);

      goalStore.$patch({
        goals: goalsResponse.success && goalsResponse.data ? goalsResponse.data : [],
        records: recordsResponse.success && recordsResponse.data ? recordsResponse.data : [],
      });

      const goalsCount = goalsResponse.success && goalsResponse.data ? goalsResponse.data.length : 0;
      const recordsCount = recordsResponse.success && recordsResponse.data ? recordsResponse.data.length : 0;

      console.log(`加载了 ${goalsCount} 个目标和 ${recordsCount} 条记录`);
    } catch (error) {
      console.error("目标数据初始化失败:", error);
      const goalStore = useGoalStore();
      goalStore.$patch({
        goals: [],
        records: [],
      });
      throw error;
    }
  }

  /**
   * 初始化任务模块数据
   */
  private static async initTaskData(username: string): Promise<void> {
    try {
      const taskStore = useTaskStore();

      const [templatesResponse, instancesResponse] = await Promise.all([
        UserStoreService.readWithUsername<ITaskTemplate[]>(username, "taskTemplates"),
        UserStoreService.readWithUsername<ITaskInstance[]>(username, "taskInstances"),
      ]);

      taskStore.$patch({
        taskTemplates: templatesResponse.success && templatesResponse.data ? templatesResponse.data : [],
        taskInstances: instancesResponse.success && instancesResponse.data ? instancesResponse.data : [],
      });

      const templatesCount = templatesResponse.success && templatesResponse.data ? templatesResponse.data.length : 0;
      const instancesCount = instancesResponse.success && instancesResponse.data ? instancesResponse.data.length : 0;

      console.log(`加载了 ${templatesCount} 个任务模板和 ${instancesCount} 个任务实例`);
    } catch (error) {
      console.error("任务数据初始化失败:", error);
      const taskStore = useTaskStore();
      taskStore.$patch({
        taskTemplates: [],
        taskInstances: [],
      });
      throw error;
    }
  }

  /**
   * 初始化目标目录数据
   */
  private static async initGoalDirData(username: string): Promise<void> {
    try {
      const goalDirStore = useGoalDirStore();

      const dirsResponse = await UserStoreService.readWithUsername<IGoalDir[]>(username, "goalDirs");

      goalDirStore.$patch({
        userDirs: dirsResponse.success && dirsResponse.data ? dirsResponse.data : [],
      });

      const dirsCount = dirsResponse.success && dirsResponse.data ? dirsResponse.data.length : 0;
      console.log(`加载了 ${dirsCount} 个目标目录`);
    } catch (error) {
      console.error("目标目录数据初始化失败:", error);
      const goalDirStore = useGoalDirStore();
      goalDirStore.$patch({
        userDirs: [],
      });
      throw error;
    }
  }

  /**
   * 初始化目标复盘数据
   */
  private static async initGoalReviewData(username: string): Promise<void> {
    try {
      const goalReviewStore = useGoalReviewStore();

      const reviewsResponse = await UserStoreService.readWithUsername<Review[]>(username, "goalReviews");

      goalReviewStore.$patch({
        reviews: reviewsResponse.success && reviewsResponse.data ? reviewsResponse.data : [],
      });

      const reviewsCount = reviewsResponse.success && reviewsResponse.data ? reviewsResponse.data.length : 0;
      console.log(`加载了 ${reviewsCount} 个目标复盘记录`);
    } catch (error) {
      console.error("目标复盘数据初始化失败:", error);
      const goalReviewStore = useGoalReviewStore();
      goalReviewStore.$patch({
        reviews: [],
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
      const goalDirStore = useGoalDirStore();
      const goalReviewStore = useGoalReviewStore();
      const reminderStore = useReminderStore();
      const repositoryStore = useRepositoryStore();

      // 重置各个 store
      goalStore.goals = [];
      goalStore.records = [];
      goalStore.initTempGoal();
      goalStore.initTempKeyResult();

      taskStore.taskTemplates = [];
      taskStore.taskInstances = [];
      taskStore.resetTempTaskTemplate();

      goalDirStore.userDirs = [];
      goalDirStore.initTempDir();

      goalReviewStore.reviews = [];
      goalReviewStore.tempReview = null;

      reminderStore.reminders = [];

      repositoryStore.repositories = [];

      console.log("所有 store 数据已清空");
    } catch (error) {
      console.error("清空 store 数据失败:", error);
    }
  }

  /**
   * 保存用户数据到存储
   */
  static async saveUserData(): Promise<void> {
    try {
      if (!UserStoreService.isUserLoggedIn()) {
        throw new Error("用户未登录，无法保存数据");
      }

      const goalStore = useGoalStore();
      const taskStore = useTaskStore();
      const goalDirStore = useGoalDirStore();
      const goalReviewStore = useGoalReviewStore();
      const reminderStore = useReminderStore();
      const repositoryStore = useRepositoryStore();
      const settingStore = useSettingStore();

      // 并行保存所有数据
      const results = await Promise.all([
        UserStoreService.write("goals", goalStore.goals),
        UserStoreService.write("records", goalStore.records),
        UserStoreService.write("taskTemplates", taskStore.taskTemplates),
        UserStoreService.write("taskInstances", taskStore.taskInstances),
        UserStoreService.write("goalDirs", goalDirStore.userDirs),
        UserStoreService.write("goalReviews", goalReviewStore.reviews),
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

      console.log(`用户数据保存成功`);
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