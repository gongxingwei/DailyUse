// domains
import { TaskTemplate } from "@/modules/Task/domain/aggregates/taskTemplate";
import { TaskInstance } from "@/modules/Task/domain/aggregates/taskInstance";
import { TaskMetaTemplate } from "../../domain/aggregates/taskMetaTemplate";
// ipcs
import { taskIpcClient } from "@/modules/Task/infrastructure/ipc/taskIpcClient";
import type { ITaskStateRepository } from "@/modules/Task/domain/repositories/ITaskStateRepository";
import { PiniaTaskStateRepository } from "@/modules/Task/infrastructure/repositories/piniaTaskStateRepository";
import type {
  TaskStats,
  TaskTimeline,
  ITaskTemplateDTO,
  ITaskInstanceDTO,
} from "@common/modules/task/types/task";

/**
 * 任务应用服务 - 符合 DDD 架构
 * 位于 Application 层，负责协调业务操作、数据转换和 IPC 通信
 *
 * 职责：
 * 1. 调用基础设施层的 IPC 客户端
 * 2. 使用 Mapper 自动转换 DTO 为领域对象
 * 3. 为 UI 层提供简洁的业务接口
 * 4. 处理错误和异常情况
 * 5. 通过抽象状态仓库自动同步前端状态，保持状态管理一致性
 */
export class TaskDomainApplicationService {
  private stateRepository: ITaskStateRepository;

  constructor(stateRepository?: ITaskStateRepository) {
    // 默认使用 Pinia 实现，但支持依赖注入其他实现
    this.stateRepository = stateRepository || new PiniaTaskStateRepository();
  }

  /**
   * 自动同步状态数据 - 确保与数据库一致性
   */
  private async syncAllState() {
    try {
      if (!this.stateRepository.isAvailable()) {
        console.warn("⚠️ 状态仓库不可用，跳过同步");
        return;
      }

      console.log("🔄 开始同步任务数据到状态仓库...");

      // 并行获取所有数据
      const [templatesResponse, instancesResponse, metaTemplatesResponse] =
        await Promise.all([
          taskIpcClient.getAllTaskTemplates(),
          taskIpcClient.getAllTaskInstances(),
          taskIpcClient.getAllMetaTemplates(),
        ]);

      // 批量同步所有数据
      const templates =
        templatesResponse.success && templatesResponse.data
          ? await Promise.all(
              templatesResponse.data.map((item) => TaskTemplate.fromDTO(item))
            )
          : [];
      const instances =
        instancesResponse.success && instancesResponse.data
          ? await Promise.all(
              instancesResponse.data.map((item) => TaskInstance.fromDTO(item))
            )
          : [];
      const metaTemplates =
        metaTemplatesResponse.success && metaTemplatesResponse.data
          ? await Promise.all(
              metaTemplatesResponse.data.map((item) =>
                TaskMetaTemplate.fromDTO(item)
              )
            )
          : [];

      await this.stateRepository.syncAllTaskData(
        templates,
        instances,
        metaTemplates
      );
      console.log("✅ 任务数据同步完成");
    } catch (error) {
      console.error("❌ 同步任务数据失败:", error);
    }
  }

  /**
   * 同步单个任务模板
   */
  private async syncTaskTemplate(templateUuid: string) {
    try {
      if (!this.stateRepository.isAvailable()) {
        console.warn("⚠️ 状态仓库不可用，跳过同步");
        return;
      }

      const response = await taskIpcClient.getTaskTemplate(templateUuid);
      if (response.success && response.data) {
        const template = TaskTemplate.fromDTO(response.data);
        await this.stateRepository.updateTaskTemplate(template);
        console.log(`✓ 同步任务模板: ${templateUuid}`);
      }
    } catch (error) {
      console.error(`❌ 同步任务模板失败: ${templateUuid}`, error);
    }
  }

  /**
   * 同步单个任务实例
   */
  private async syncTaskInstance(instanceId: string) {
    try {
      if (!this.stateRepository.isAvailable()) {
        console.warn("⚠️ 状态仓库不可用，跳过同步");
        return;
      }

      const response = await taskIpcClient.getTaskInstance(instanceId);
      if (response.success && response.data) {
        const taskInstance = TaskInstance.fromDTO(response.data);
        await this.stateRepository.updateTaskInstance(taskInstance);
        console.log(`✓ 同步任务实例: ${instanceId}`);
      }
    } catch (error) {
      console.error(`❌ 同步任务实例失败: ${instanceId}`, error);
    }
  }

  /**
   * 从状态仓库中删除任务模板
   */
  private async removeTaskTemplateFromState(templateUuid: string) {
    try {
      if (!this.stateRepository.isAvailable()) {
        console.warn("⚠️ 状态仓库不可用，跳过删除");
        return;
      }

      await this.stateRepository.removeTaskTemplate(templateUuid);
      console.log(`✓ 从状态删除任务模板: ${templateUuid}`);
    } catch (error) {
      console.error(`❌ 从状态删除任务模板失败: ${templateUuid}`, error);
    }
  }

  /**
   * 从状态仓库中删除任务实例
   */
  private async removeTaskInstanceFromState(instanceId: string) {
    try {
      if (!this.stateRepository.isAvailable()) {
        console.warn("⚠️ 状态仓库不可用，跳过删除");
        return;
      }

      await this.stateRepository.removeTaskInstance(instanceId);
      console.log(`✓ 从状态删除任务实例: ${instanceId}`);
    } catch (error) {
      console.error(`❌ 从状态删除任务实例失败: ${instanceId}`, error);
    }
  }

  /**
   * 批量同步数据 - 公开方法，供外部调用
   */
  async syncAllData(): Promise<void> {
    await this.syncAllState();
  }

  // === MetaTemplate 相关操作 ===

  /**
   * 获取所有元模板
   */
  async getAllMetaTemplates() {
    try {
      const response = await taskIpcClient.getAllMetaTemplates();
      return response.success ? response.data || [] : [];
    } catch (error) {
      console.error("Failed to get meta templates:", error);
      return [];
    }
  }

  /**
   * 根据ID获取元模板
   */
  async getMetaTemplate(uuid: string) {
    try {
      const response = await taskIpcClient.getMetaTemplate(uuid);
      return response.success ? response.data || null : null;
    } catch (error) {
      console.error("Failed to get meta template:", error);
      return null;
    }
  }

  /**
   * 根据分类获取元模板
   */
  async getMetaTemplatesByCategory(category: string) {
    try {
      const response = await taskIpcClient.getMetaTemplatesByCategory(category);
      return response.success ? response.data || [] : [];
    } catch (error) {
      console.error("Failed to get meta templates by category:", error);
      return [];
    }
  }

  // === TaskTemplate 相关操作 ===

  /**
   * 根据ID获取任务模板（返回领域对象）
   */
  async getTaskTemplate(
    taskTemplateUuid: string
  ): Promise<TaskTemplate | null> {
    try {
      const response = await taskIpcClient.getTaskTemplate(taskTemplateUuid);
      if (response.success && response.data) {
        return TaskTemplate.fromDTO(response.data);
      }
      return null;
    } catch (error) {
      console.error("Failed to get task template:", error);
      return null;
    }
  }

  /**
   * 获取所有任务模板（返回领域对象数组）
   */
  async getAllTaskTemplates(): Promise<TaskTemplate[]> {
    try {
      const response = await taskIpcClient.getAllTaskTemplates();
      if (response.success && response.data) {
        return Promise.all(response.data.map(TaskTemplate.fromDTO));
      }
      return [];
    } catch (error) {
      console.error("Failed to get all task templates:", error);
      return [];
    }
  }

  /**
   * 根据关键结果获取任务模板（返回领域对象数组）
   */
  async getTaskTemplateForKeyResult(
    goalUuid: string,
    keyResultId: string
  ): Promise<TaskTemplate[]> {
    try {
      const response = await taskIpcClient.getTaskTemplateForKeyResult(
        goalUuid,
        keyResultId
      );
      if (response.success && response.data) {
        return Promise.all(response.data.map(TaskTemplate.fromDTO));
      }
      return [];
    } catch (error) {
      console.error("Failed to get task templates for key result:", error);
      return [];
    }
  }

  /**
   * 创建任务模板
   */
  async createTaskTemplate(
    dto: ITaskTemplateDTO
  ): Promise<TResponse<TaskTemplate>> {
    try {
      const response = await taskIpcClient.createTaskTemplate(dto);

      if (!response.success || !response.data) {
        return { success: false, message: response.message || "任务模板创建失败" };
      }
      const templateDomain = TaskTemplate.fromDTO(response.data);
      await this.stateRepository.addTaskTemplate(templateDomain);
      console.log(`✅ 创建任务模板成功并同步到状态: ${response.data.uuid}`);

      const createdTemplate = TaskTemplate.fromDTO(response.data);
      return {
        success: true,
        data: createdTemplate,
        message: response.message || "任务模板创建成功",
      };
    } catch (error) {
      console.error("Failed to create task template:", error);
      return { success: false, message: "Failed to create task template" };
    }
  }

  /**
   * 更新任务模板
   */
  async updateTaskTemplate(dto: ITaskTemplateDTO): Promise<TResponse<TaskTemplate>> {
    try {
      const response = await taskIpcClient.updateTaskTemplate(dto);

      if (!response.success || !response.data) {
        return { success: false, message: response.message || "任务模板更新失败" };
      }

      const templateDomain = TaskTemplate.fromDTO(response.data);
      await this.stateRepository.updateTaskTemplate(templateDomain);
      console.log(`✅ 更新任务模板成功并同步到状态: ${response.data.uuid}`);

      return {
        success: true,
        data: templateDomain,
        message: response.message || "任务模板更新成功",
      };
    } catch (error) {
      console.error("Failed to update task template:", error);
      return { success: false, message: "Failed to update task template" };
    }
  }

  /**
   * 删除任务模板
   */
  async deleteTaskTemplate(
    taskTemplateId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await taskIpcClient.deleteTaskTemplate(taskTemplateId);

      if (response.success) {
        // 自动同步状态：删除模板和相关实例
        await this.removeTaskTemplateFromState(taskTemplateId);
        await this.stateRepository.removeInstancesByTemplateId(taskTemplateId);
        console.log(`✅ 删除任务模板成功并同步到状态: ${taskTemplateId}`);
      }

      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error("Failed to delete task template:", error);
      return { success: false, message: "Failed to delete task template" };
    }
  }

  /**
   * 删除所有任务模板
   */
  async deleteAllTaskTemplates(): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      console.log("🔄 [渲染进程] 开始删除所有任务模板");

      const response = await taskIpcClient.deleteAllTaskTemplates();

      if (response.success) {
        // 自动同步状态：清空所有模板和实例
        await this.stateRepository.clearAllTaskTemplates();
        await this.stateRepository.clearAllTaskInstances();
        console.log("✅ 删除所有任务模板成功并清空状态");
      }

      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error("Failed to delete all task templates:", error);
      return { success: false, message: "Failed to delete all task templates" };
    }
  }

  /**
   * 激活任务模板
   */
  async activateTaskTemplate(
    taskTemplateId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await taskIpcClient.activateTaskTemplate(taskTemplateId);

      if (response.success) {
        // 自动同步状态：重新获取更新后的模板
        await this.syncTaskTemplate(taskTemplateId);
        console.log(`✅ 激活任务模板成功并同步到状态: ${taskTemplateId}`);
      }

      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error("Failed to activate task template:", error);
      return { success: false, message: "Failed to activate task template" };
    }
  }

  /**
   * 暂停任务模板
   */
  async pauseTaskTemplate(
    taskTemplateId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await taskIpcClient.pauseTaskTemplate(taskTemplateId);

      if (response.success) {
        // 自动同步状态：重新获取更新后的模板
        await this.syncTaskTemplate(taskTemplateId);
        console.log(`✅ 暂停任务模板成功并同步到状态: ${taskTemplateId}`);
      }

      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error("Failed to pause task template:", error);
      return { success: false, message: "Failed to pause task template" };
    }
  }

  /**
   * 恢复任务模板
   */
  async resumeTaskTemplate(
    taskTemplateId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await taskIpcClient.resumeTaskTemplate(taskTemplateId);

      if (response.success) {
        // 自动同步状态：重新获取更新后的模板
        await this.syncTaskTemplate(taskTemplateId);
        console.log(`✅ 恢复任务模板成功并同步到状态: ${taskTemplateId}`);
      }

      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error("Failed to resume task template:", error);
      return { success: false, message: "Failed to resume task template" };
    }
  }

  /**
   * 归档任务模板
   */
  async archiveTaskTemplate(
    taskTemplateId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await taskIpcClient.archiveTaskTemplate(taskTemplateId);

      if (response.success) {
        // 自动同步状态：重新获取更新后的模板
        await this.syncTaskTemplate(taskTemplateId);
        console.log(`✅ 归档任务模板成功并同步到状态: ${taskTemplateId}`);
      }

      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error("Failed to archive task template:", error);
      return { success: false, message: "Failed to archive task template" };
    }
  }

  /**
   * 从元模板创建任务模板（新架构推荐方式）
   * 主进程返回完整的任务模板对象，渲染进程只需要修改和展示
   */
  async createTaskTemplateFromMetaTemplate(
    metaTemplateId: string,
    title: string,
    customOptions?: {
      description?: string;
      priority?: number;
      tags?: string[];
    }
  ): Promise<TaskTemplate> {
    try {
      const response = await taskIpcClient.createTaskTemplateFromMetaTemplate(
        metaTemplateId,
        title,
        customOptions
      );

      if (!response.success || !response.data) {
        throw new Error(
          response.message ||
            "Failed to create task template from meta template"
        );
      }

      // 注意：这里不同步状态，因为模板还没有保存到数据库
      // 只返回创建的模板对象供前端编辑
      console.log(
        `✅ 从元模板创建任务模板成功（待保存）: ${response.data.uuid}`
      );

      return TaskTemplate.fromDTO(response.data);
    } catch (error) {
      console.error("Error creating task template from meta template:", error);
      throw error;
    }
  }

  // === TaskInstance 相关操作 ===

  /**
   * 根据ID获取任务实例（返回领域对象）
   */
  async getTaskInstance(taskInstanceUuid: string): Promise<TaskInstance | null> {
    try {
      const response = await taskIpcClient.getTaskInstance(taskInstanceUuid);
      if (response.success && response.data) {
        return TaskInstance.fromDTO(response.data);
      }
      return null;
    } catch (error) {
      console.error("Failed to get task instance:", error);
      return null;
    }
  }

  /**
   * 获取所有任务实例（返回领域对象数组）
   */
  async getAllTaskInstances(): Promise<TaskInstance[]> {
    try {
      const response = await taskIpcClient.getAllTaskInstances();
      if (response.success && response.data) {
        return response.data.map(TaskInstance.fromDTO);
      }
      return [];
    } catch (error) {
      console.error("Failed to get all task instances:", error);
      return [];
    }
  }

  /**
   * 获取今日任务（返回领域对象数组）
   */
  async getTodayTasks(): Promise<TaskInstance[]> {
    try {
      const response = await taskIpcClient.getTodayTasks();
      if (response.success && response.data) {
        return response.data.map(TaskInstance.fromDTO);
      }
      return [];
    } catch (error) {
      console.error("Failed to get today tasks:", error);
      return [];
    }
  }

  /**
   * 创建任务实例
   */
  async createTaskInstance(dto: ITaskInstanceDTO): Promise<TResponse<TaskInstance>> {
    try {
      const response = await taskIpcClient.createTaskInstance(dto);

      if (!response.success || !response.data) {
        return { success: false, message: response.message || "任务实例创建失败" };
      }

      const instanceDomain = TaskInstance.fromDTO(response.data);
      await this.stateRepository.addTaskInstance(instanceDomain);
      console.log(`✅ 创建任务实例成功并同步到状态: ${instanceDomain.uuid}`);

      return {
        success: true,
        data: instanceDomain,
        message: response.message || "任务实例创建成功",
      };
    } catch (error) {
      console.error("Failed to create task instance:", error);
      return { success: false, message: "Failed to create task instance" };
    }
  }

  /**
   * 开始执行任务实例
   */
  async startTaskInstance(
    taskInstanceUuid: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await taskIpcClient.startTaskInstance(taskInstanceUuid);

      if (response.success) {
        // 自动同步状态：重新获取更新后的实例
        await this.syncTaskInstance(taskInstanceUuid);
        console.log(`✅ 开始任务实例成功并同步到状态: ${taskInstanceUuid}`);
      }

      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error("Failed to start task instance:", error);
      return { success: false, message: "Failed to start task instance" };
    }
  }

  /**
   * 完成任务实例
   */
  async completeTaskInstance(
    taskInstanceUuid: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await taskIpcClient.completeTaskInstance(taskInstanceUuid);

      if (response.success) {
        // 自动同步状态：重新获取更新后的实例
        await this.syncTaskInstance(taskInstanceUuid);
        console.log(`✅ 完成任务实例成功并同步到状态: ${taskInstanceUuid}`);
      }

      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error("Failed to complete task instance:", error);
      return { success: false, message: "Failed to complete task instance" };
    }
  }

  /**
   * 撤销完成任务实例
   */
  async undoCompleteTaskInstance(
    taskInstanceUuid: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await taskIpcClient.undoCompleteTaskInstance(
        taskInstanceUuid
      );

      if (response.success) {
        // 自动同步状态：重新获取更新后的实例
        await this.syncTaskInstance(taskInstanceUuid);
        console.log(`✅ 撤销完成任务实例成功并同步到状态: ${taskInstanceUuid}`);
      }

      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error("Failed to undo complete task instance:", error);
      return {
        success: false,
        message: "Failed to undo complete task instance",
      };
    }
  }

  /**
   * 取消任务实例
   */
  async cancelTaskInstance(
    taskInstanceUuid: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await taskIpcClient.cancelTaskInstance(taskInstanceUuid);

      if (response.success) {
        // 自动同步状态：重新获取更新后的实例
        await this.syncTaskInstance(taskInstanceUuid);
        console.log(`✅ 取消任务实例成功并同步到状态: ${taskInstanceUuid}`);
      }

      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error("Failed to cancel task instance:", error);
      return { success: false, message: "Failed to cancel task instance" };
    }
  }

  /**
   * 延期任务实例
   */
  async rescheduleTaskInstance(
    taskInstanceUuid: string,
    newScheduledTime: string,
    newEndTime?: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await taskIpcClient.rescheduleTaskInstance(
        taskInstanceUuid,
        newScheduledTime,
        newEndTime
      );

      if (response.success) {
        // 自动同步状态：重新获取更新后的实例
        await this.syncTaskInstance(taskInstanceUuid);
        console.log(`✅ 延期任务实例成功并同步到状态: ${taskInstanceUuid}`);
      }

      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error("Failed to reschedule task instance:", error);
      return { success: false, message: "Failed to reschedule task instance" };
    }
  }

  /**
   * 删除任务实例
   */
  async deleteTaskInstance(
    taskInstanceUuid: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await taskIpcClient.deleteTaskInstance(taskInstanceUuid);

      if (response.success) {
        // 自动同步状态：删除实例
        await this.removeTaskInstanceFromState(taskInstanceUuid);
        console.log(`✅ 删除任务实例成功并同步到状态: ${taskInstanceUuid}`);
      }

      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error("Failed to delete task instance:", error);
      return { success: false, message: "Failed to delete task instance" };
    }
  }

  // === 提醒相关操作 ===

  /**
   * 触发提醒
   */
  async triggerReminder(
    instanceId: string,
    alertId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await taskIpcClient.triggerReminder(instanceId, alertId);
      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error("Failed to trigger reminder:", error);
      return { success: false, message: "Failed to trigger reminder" };
    }
  }

  /**
   * 延迟提醒
   */
  async snoozeReminder(
    instanceId: string,
    alertId: string,
    snoozeUntil: string,
    reason?: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await taskIpcClient.snoozeReminder(
        instanceId,
        alertId,
        snoozeUntil,
        reason
      );
      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error("Failed to snooze reminder:", error);
      return { success: false, message: "Failed to snooze reminder" };
    }
  }

  /**
   * 忽略提醒
   */
  async dismissReminder(
    instanceId: string,
    alertId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await taskIpcClient.dismissReminder(instanceId, alertId);
      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error("Failed to dismiss reminder:", error);
      return { success: false, message: "Failed to dismiss reminder" };
    }
  }

  /**
   * 启用提醒
   */
  async enableReminders(
    instanceId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await taskIpcClient.enableReminders(instanceId);
      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error("Failed to enable reminders:", error);
      return { success: false, message: "Failed to enable reminders" };
    }
  }

  /**
   * 禁用提醒
   */
  async disableReminders(
    instanceId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await taskIpcClient.disableReminders(instanceId);
      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error("Failed to disable reminders:", error);
      return { success: false, message: "Failed to disable reminders" };
    }
  }

  /**
   * 初始化任务提醒系统
   */
  async initializeTaskReminders(): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const response = await taskIpcClient.initializeTaskReminders();
      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error("Failed to initialize task reminders:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "初始化提醒失败",
      };
    }
  }

  /**
   * 刷新任务提醒
   */
  async refreshTaskReminders(): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const response = await taskIpcClient.refreshTaskReminders();
      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error("Failed to refresh task reminders:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "刷新提醒失败",
      };
    }
  }

  // === 统计分析相关操作 ===

  /**
   * 获取目标下的任务统计
   */
  async getTaskStatsForGoal(goalUuid: string): Promise<TaskStats | null> {
    try {
      const response = await taskIpcClient.getTaskStatsForGoal(goalUuid);
      return response.success ? response.data || null : null;
    } catch (error) {
      console.error("Failed to get task stats for goal:", error);
      return null;
    }
  }

  /**
   * 获取任务完成时间线
   */
  async getTaskCompletionTimeline(
    goalUuid: string,
    startDate: string,
    endDate: string
  ): Promise<TaskTimeline[]> {
    try {
      const response = await taskIpcClient.getTaskCompletionTimeline(
        goalUuid,
        startDate,
        endDate
      );
      return response.success ? response.data || [] : [];
    } catch (error) {
      console.error("Failed to get task completion timeline:", error);
      return [];
    }
  }

  // ============ 渲染进程自我实现的业务 ============

  async createTaskTemplateByMetaTemplate(
    metaTemplateUuid: string
  ): Promise<TaskTemplate | null> {
    try {
      const metaTemplate = await this.stateRepository.getMetaTemplateByUuid(
        metaTemplateUuid
      );
      const createdTaskTemplate = metaTemplate.createTaskTemplate();
      return createdTaskTemplate;
    } catch (error) {
      console.error("Failed to create task template:", error);
      return null;
    }
  }
}


/**
 * 创建任务应用服务实例的工厂方法
 * 支持依赖注入，便于测试和扩展
 */
export function createTaskDomainApplicationService(
  stateRepository?: ITaskStateRepository
): TaskDomainApplicationService {
  return new TaskDomainApplicationService(stateRepository);
}

/**
 * 延迟初始化的任务应用服务单例
 * 避免在模块加载时就创建实例，防止 Pinia 未初始化的问题
 */
let _taskDomainApplicationServiceInstance: TaskDomainApplicationService | null =
  null;

/**
 * 获取任务应用服务实例（延迟初始化）
 * 确保在 Pinia 初始化后才创建实例
 */
export function getTaskDomainApplicationService(): TaskDomainApplicationService {
  if (!_taskDomainApplicationServiceInstance) {
    _taskDomainApplicationServiceInstance = new TaskDomainApplicationService();
  }
  return _taskDomainApplicationServiceInstance;
}
