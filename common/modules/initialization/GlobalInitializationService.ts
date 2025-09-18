import { GoalWebApplicationService } from '../../../apps/web/src/modules/goal/application/services/GoalWebApplicationService';
import { TaskWebApplicationService } from '../../../apps/web/src/modules/task/application/services/TaskWebApplicationService';
import { RepositoryWebApplicationService } from '../../../apps/web/src/modules/repository/application/services/RepositoryWebApplicationService';
import { EditorWebApplicationService } from '../../../apps/web/src/modules/editor/application/services/EditorWebApplicationService';

/**
 * 全局应用初始化服务
 * 负责协调所有模块的数据同步和初始化
 * 提供统一的初始化入口点，管理模块间依赖关系
 */
export class GlobalInitializationService {
  private goalService: GoalWebApplicationService | null = null;
  private taskService: TaskWebApplicationService | null = null;
  private repositoryService: RepositoryWebApplicationService | null = null;
  private editorService: EditorWebApplicationService | null = null;

  private isInitialized = false;
  private isInitializing = false;

  /**
   * 懒加载获取应用服务实例
   */
  private getGoalService() {
    if (!this.goalService) {
      this.goalService = new GoalWebApplicationService();
    }
    return this.goalService;
  }

  private getTaskService() {
    if (!this.taskService) {
      this.taskService = new TaskWebApplicationService();
    }
    return this.taskService;
  }

  private getRepositoryService() {
    if (!this.repositoryService) {
      this.repositoryService = new RepositoryWebApplicationService();
    }
    return this.repositoryService;
  }

  private getEditorService() {
    if (!this.editorService) {
      this.editorService = new EditorWebApplicationService();
    }
    return this.editorService;
  }

  /**
   * 初始化所有模块
   * 按照依赖顺序初始化：Goal -> Task -> Repository -> Editor
   */
  async initializeAllModules(): Promise<{
    success: boolean;
    results: {
      goals?: { count: number };
      tasks?: { templatesCount: number; instancesCount: number; metaTemplatesCount: number };
      repositories?: { count: number };
      editor?: { filesCount: number; editorGroupsCount: number; repositoriesCount: number };
    };
    errors: string[];
  }> {
    if (this.isInitialized) {
      console.log('所有模块已经初始化，跳过重复初始化');
      return { success: true, results: {}, errors: [] };
    }

    if (this.isInitializing) {
      console.log('初始化正在进行中，等待完成...');
      // 简单的轮询等待，实际项目中可以使用 Promise 或事件机制
      while (this.isInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return { success: this.isInitialized, results: {}, errors: [] };
    }

    this.isInitializing = true;
    const results: any = {};
    const errors: string[] = [];

    try {
      console.log('开始初始化所有模块...');

      // 1. 初始化 Goal 模块
      try {
        console.log('初始化 Goal 模块...');
        await this.getGoalService().initialize();
        const goalResult = await this.getGoalService().syncAllGoals();
        results.goals = goalResult;
        console.log(
          `Goal 模块初始化完成: ${goalResult.goalsCount} 个目标, ${goalResult.goalDirsCount} 个目录`,
        );
      } catch (error) {
        const errorMsg = `Goal 模块初始化失败: ${error instanceof Error ? error.message : '未知错误'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }

      // 2. 初始化 Task 模块
      try {
        console.log('初始化 Task 模块...');
        await this.getTaskService().initialize();
        const taskResult = await this.getTaskService().syncAllTaskData();
        results.tasks = taskResult;
        console.log(
          `Task 模块初始化完成: ${taskResult.templatesCount} 个模板, ${taskResult.instancesCount} 个实例`,
        );
      } catch (error) {
        const errorMsg = `Task 模块初始化失败: ${error instanceof Error ? error.message : '未知错误'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }

      // 3. 初始化 Repository 模块
      try {
        console.log('初始化 Repository 模块...');
        await this.getRepositoryService().initialize();
        const repositoryResult = await this.getRepositoryService().syncAllRepositories();
        results.repositories = repositoryResult;
        console.log(`Repository 模块初始化完成: ${repositoryResult.repositoriesCount} 个仓库`);
      } catch (error) {
        const errorMsg = `Repository 模块初始化失败: ${error instanceof Error ? error.message : '未知错误'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }

      // 4. 初始化 Editor 模块
      try {
        console.log('初始化 Editor 模块...');
        await this.getEditorService().initialize();
        const editorResult = await this.getEditorService().syncAllEditorData();
        results.editor = editorResult;
        console.log(
          `Editor 模块初始化完成: ${editorResult.filesCount} 个文件, ${editorResult.editorGroupsCount} 个编辑器组`,
        );
      } catch (error) {
        const errorMsg = `Editor 模块初始化失败: ${error instanceof Error ? error.message : '未知错误'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }

      this.isInitialized = true;

      const successCount = 4 - errors.length;
      console.log(`模块初始化完成: ${successCount}/4 个模块成功初始化`);

      if (errors.length > 0) {
        console.warn('部分模块初始化失败:', errors);
      }

      return {
        success: errors.length === 0,
        results,
        errors,
      };
    } catch (error) {
      const errorMsg = `全局初始化失败: ${error instanceof Error ? error.message : '未知错误'}`;
      console.error(errorMsg);
      errors.push(errorMsg);

      return {
        success: false,
        results,
        errors,
      };
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * 强制重新初始化所有模块
   * 清除初始化状态并重新开始
   */
  async forceReinitialize(): Promise<{
    success: boolean;
    results: any;
    errors: string[];
  }> {
    console.log('强制重新初始化所有模块...');
    this.isInitialized = false;
    this.isInitializing = false;

    return await this.initializeAllModules();
  }

  /**
   * 强制同步所有模块数据
   * 不改变初始化状态，仅重新同步数据
   */
  async forceSyncAllData(): Promise<{
    success: boolean;
    results: any;
    errors: string[];
  }> {
    const results: any = {};
    const errors: string[] = [];

    try {
      console.log('强制同步所有模块数据...');

      // 并行同步所有模块数据
      const syncPromises = [
        this.getGoalService()
          .forceSync()
          .then((result) => ({ module: 'goals', result })),
        this.getTaskService()
          .forceSync()
          .then((result) => ({ module: 'tasks', result })),
        this.getRepositoryService()
          .forceSync()
          .then((result) => ({ module: 'repositories', result })),
        this.getEditorService()
          .forceSync()
          .then((result) => ({ module: 'editor', result })),
      ];

      const syncResults = await Promise.allSettled(syncPromises);

      syncResults.forEach((result, index) => {
        const moduleNames = ['goals', 'tasks', 'repositories', 'editor'];
        const moduleName = moduleNames[index];

        if (result.status === 'fulfilled') {
          results[result.value.module] = result.value.result;
          console.log(`${moduleName} 模块数据同步成功`);
        } else {
          const errorMsg = `${moduleName} 模块数据同步失败: ${result.reason}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      });

      return {
        success: errors.length === 0,
        results,
        errors,
      };
    } catch (error) {
      const errorMsg = `强制同步数据失败: ${error instanceof Error ? error.message : '未知错误'}`;
      console.error(errorMsg);
      errors.push(errorMsg);

      return {
        success: false,
        results,
        errors,
      };
    }
  }

  /**
   * 检查所有模块的同步状态
   */
  checkSyncStatus(): {
    goal: boolean;
    task: boolean;
    repository: boolean;
    editor: boolean;
    overall: boolean;
  } {
    const goalNeedsSync = this.getGoalService().shouldSyncData();
    const taskNeedsSync = this.getTaskService().shouldSyncData();
    const repositoryNeedsSync = this.getRepositoryService().shouldSyncData();
    const editorNeedsSync = this.getEditorService().shouldSyncData();

    return {
      goal: !goalNeedsSync,
      task: !taskNeedsSync,
      repository: !repositoryNeedsSync,
      editor: !editorNeedsSync,
      overall: !goalNeedsSync && !taskNeedsSync && !repositoryNeedsSync && !editorNeedsSync,
    };
  }

  /**
   * 获取初始化状态
   */
  getInitializationStatus(): {
    isInitialized: boolean;
    isInitializing: boolean;
  } {
    return {
      isInitialized: this.isInitialized,
      isInitializing: this.isInitializing,
    };
  }

  /**
   * 获取所有应用服务实例
   */
  getServices() {
    return {
      goal: this.getGoalService(),
      task: this.getTaskService(),
      repository: this.getRepositoryService(),
      editor: this.getEditorService(),
    };
  }

  /**
   * 用于登录后的快速初始化
   * 适用于用户登录后需要立即加载所有数据的场景
   */
  async initializeForUser(): Promise<{
    success: boolean;
    results: any;
    errors: string[];
  }> {
    console.log('用户登录后初始化所有模块...');
    return await this.initializeAllModules();
  }

  /**
   * 清理资源
   * 重置所有服务实例和状态
   */
  cleanup(): void {
    console.log('清理全局初始化服务...');
    this.goalService = null;
    this.taskService = null;
    this.repositoryService = null;
    this.editorService = null;
    this.isInitialized = false;
    this.isInitializing = false;
  }
}

// 单例实例
let globalInitializationServiceInstance: GlobalInitializationService | null = null;

/**
 * 获取全局初始化服务单例实例
 */
export function getGlobalInitializationService(): GlobalInitializationService {
  if (!globalInitializationServiceInstance) {
    globalInitializationServiceInstance = new GlobalInitializationService();
  }
  return globalInitializationServiceInstance;
}
