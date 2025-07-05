import { TaskDomainService } from "../domain/services/taskDomainService";
import { TaskContainer } from "../infrastructure/di/taskContainer";
import { TimeUtils } from "@/shared/utils/myDateTimeUtils";
import type { ITaskTemplateRepository } from "../domain/repositories/iTaskTemplateRepository";
import type { ITaskInstanceRepository } from "../domain/repositories/iTaskInstanceRepository";
import type { ITaskMetaTemplateRepository } from "../domain/repositories/iTaskMetaTemplateRepository";
import { TaskTemplate } from "../domain/entities/taskTemplate";
import { TaskInstance } from "../domain/entities/taskInstance";
import { TaskMetaTemplate } from "../domain/entities/taskMetaTemplate";
import { TaskTemplateValidator } from "../validation/TaskTemplateValidator";
import type { 
  ITaskTemplate,
  ITaskInstance,
  ITaskMetaTemplate,
  TaskTimeConfig,
  TaskReminderConfig
} from "../domain/types/task";
import type { 
  TaskResponse,
  TaskStats,
  TaskTimeline
} from "../../../../src/modules/Task/domain/types/task";

/**
 * 主进程中的任务应用服务层
 * 负责任务相关的业务操作协调，包括任务模板、任务实例、元模板的管理
 * 通过 IPC 为渲染进程提供服务
 */
export class MainTaskApplicationService {
  private taskDomainService: TaskDomainService;
  private taskTemplateRepo: ITaskTemplateRepository;
  private taskInstanceRepo: ITaskInstanceRepository;
  private taskMetaTemplateRepo: ITaskMetaTemplateRepository;

  constructor() {
    const container = TaskContainer.getInstance();
    this.taskTemplateRepo = container.getTaskTemplateRepository();
    this.taskInstanceRepo = container.getTaskInstanceRepository();
    this.taskMetaTemplateRepo = container.getTaskMetaTemplateRepository();
    this.taskDomainService = new TaskDomainService();
  }

  // === 类型转换适配器 ===

  /**
   * 将渲染进程的 TaskMetaTemplate 转换为主进程的 TaskMetaTemplate
   * 这是一个临时解决方案，用于处理重构期间的类型不匹配问题
   */
  private adaptTaskMetaTemplate(template: any): TaskMetaTemplate {
    // 如果已经是主进程的类型，直接返回
    if (template instanceof TaskMetaTemplate) {
      return template;
    }

    // 从渲染进程的实体创建主进程的实体
    // 使用 JSON 序列化/反序列化来实现深拷贝和类型转换
    const json = template.toJSON ? template.toJSON() : template;
    
    // 使用正确的构造函数参数
    return new TaskMetaTemplate(
      json.id, 
      json.name, 
      json.category,
      {
        description: json.description,
        // 注意：这里可能需要根据实际的数据结构进行调整
        defaultTimeConfig: json.defaultTimeConfig,
        defaultReminderConfig: json.defaultReminderConfig,
        defaultMetadata: json.defaultMetadata
      }
    );
  }

  // === DTO 转换方法 ===

  /**
   * 将 TaskTemplate 转换为接口数据
   * 直接使用领域对象的 toJSON 方法，无需额外序列化
   */
  private taskTemplateToData(template: TaskTemplate): ITaskTemplate {
    return template.toJSON();
  }

  /**
   * 将 TaskInstance 转换为接口数据
   * 直接使用领域对象的 toJSON 方法，无需额外序列化
   */
  private taskInstanceToData(instance: TaskInstance): ITaskInstance {
    return instance.toJSON();
  }

  /**
   * 将 TaskMetaTemplate 转换为接口数据
   * 直接使用领域对象的 toJSON 方法，无需额外序列化
   */
  private taskMetaTemplateToData(metaTemplate: TaskMetaTemplate): ITaskMetaTemplate {
    return metaTemplate.toJSON();
  }

  // === MetaTemplate 相关方法 ===

  /**
   * 获取所有元模板
   */
  async getAllMetaTemplates(): Promise<TaskResponse<ITaskMetaTemplate[]>> {
    try {
      const response = await this.taskMetaTemplateRepo.findAll();
      if (!response.success) {
        return { success: false, message: response.message };
      }
      const adaptedTemplates = (response.data || []).map(template => this.adaptTaskMetaTemplate(template));
      const data = adaptedTemplates.map(template => this.taskMetaTemplateToData(template));
      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to get meta templates: ${error instanceof Error ? error.message : '未知错误'}` 
      };
    }
  }

  /**
   * 根据ID获取元模板
   */
  async getMetaTemplate(id: string): Promise<TaskResponse<ITaskMetaTemplate>> {
    try {
      const response = await this.taskMetaTemplateRepo.findById(id);
      if (!response.success || !response.data) {
        return { success: false, message: `Meta template with id ${id} not found` };
      }
      const adaptedTemplate = this.adaptTaskMetaTemplate(response.data);
      return { success: true, data: this.taskMetaTemplateToData(adaptedTemplate) };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to get meta template: ${error instanceof Error ? error.message : '未知错误'}` 
      };
    }
  }

  /**
   * 根据分类获取元模板
   */
  async getMetaTemplatesByCategory(category: string): Promise<TaskResponse<ITaskMetaTemplate[]>> {
    try {
      const response = await this.taskMetaTemplateRepo.findByCategory(category);
      if (!response.success) {
        return { success: false, message: response.message };
      }
      const adaptedTemplates = (response.data || []).map(template => this.adaptTaskMetaTemplate(template));
      const data = adaptedTemplates.map(template => this.taskMetaTemplateToData(template));
      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to get meta templates by category: ${error instanceof Error ? error.message : '未知错误'}` 
      };
    }
  }

  // === 任务模板相关操作 ===

  /**
   * 根据ID获取任务模板
   */
  async getTaskTemplate(taskTemplateId: string): Promise<TaskResponse<ITaskTemplate>> {
    try {
      const response = await this.taskTemplateRepo.findById(taskTemplateId);
      if (!response.success || !response.data) {
        return { success: false, message: `Task template with id ${taskTemplateId} not found` };
      }
      return { success: true, data: this.taskTemplateToData(response.data) };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to get task template: ${error instanceof Error ? error.message : '未知错误'}` 
      };
    }
  }

  /**
   * 获取所有任务模板
   */
  async getAllTaskTemplates(): Promise<TaskResponse<ITaskTemplate[]>> {
    try {
      const response = await this.taskTemplateRepo.findAll();
      if (!response.success) {
        return { success: false, message: response.message };
      }
      const data = (response.data || []).map(template => this.taskTemplateToData(template));
      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to get task templates: ${error instanceof Error ? error.message : '未知错误'}` 
      };
    }
  }

  /**
   * 根据关键结果获取任务模板
   */
  async getTaskTemplateForKeyResult(goalId: string, keyResultId: string): Promise<TaskResponse<ITaskTemplate[]>> {
    try {
      const response = await this.taskTemplateRepo.findByKeyResult(goalId, keyResultId);
      if (!response.success) {
        return { success: false, message: response.message };
      }
      const data = (response.data || []).map(template => this.taskTemplateToData(template));
      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to get task templates for key result: ${error instanceof Error ? error.message : '未知错误'}` 
      };
    }
  }

  /**
   * 创建任务模板
   */
  async createTaskTemplate(dto: ITaskTemplate): Promise<TaskResponse<ITaskTemplate>> {
    try {
      // 这里需要将 DTO 转换为领域实体
      // 由于原始构造函数的复杂性，这里简化处理
      const template = TaskTemplate.fromJSON(dto);
      
      const validation = TaskTemplateValidator.validate(template);
      if (!validation.isValid) {
        return { success: false, message: validation.errors.join(", ") };
      }

      const response = await this.taskTemplateRepo.save(template);
      if (!response.success) {
        return { success: false, message: response.message };
      }
      
      return { success: true, data: this.taskTemplateToData(template) };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to create task template: ${error instanceof Error ? error.message : '未知错误'}` 
      };
    }
  }

  /**
   * 更新任务模板
   */
  async updateTaskTemplate(dto: ITaskTemplate): Promise<TaskResponse<ITaskTemplate>> {
    try {
      const response = await this.taskTemplateRepo.findById(dto.id);
      if (!response.success || !response.data) {
        return { success: false, message: `Task template with id ${dto.id} not found` };
      }

      const template = response.data;
      // 更新模板属性（这里需要根据具体的更新逻辑来实现）
      if (dto.title) template.updateTitle(dto.title);
      if (dto.description !== undefined) template.updateDescription(dto.description);
      // 其他属性的更新...

      const validation = TaskTemplateValidator.validate(template);
      if (!validation.isValid) {
        return { success: false, message: validation.errors.join(", ") };
      }

      const updateResponse = await this.taskDomainService.updateTaskTemplate(
        template,
        this.taskTemplateRepo,
        this.taskInstanceRepo
      );
      
      if (!updateResponse.success) {
        return { success: false, message: updateResponse.message };
      }
      
      return { success: true, data: this.taskTemplateToData(template) };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to update task template: ${error instanceof Error ? error.message : '未知错误'}` 
      };
    }
  }

  /**
   * 删除任务模板
   */
  async deleteTaskTemplate(templateId: string): Promise<TaskResponse<void>> {
    try {
      const response = await this.taskTemplateRepo.findById(templateId);
      if (!response.success || !response.data) {
        return { success: false, message: `Task template with id ${templateId} not found` };
      }

      const deleteResponse = await this.taskDomainService.deleteTaskTemplate(
        response.data,
        this.taskTemplateRepo,
        this.taskInstanceRepo,
        true
      );
      
      return { 
        success: deleteResponse.success, 
        message: deleteResponse.message 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to delete task template: ${error instanceof Error ? error.message : '未知错误'}` 
      };
    }
  }

  // === 任务实例相关操作 ===

  /**
   * 根据ID获取任务实例
   */
  async getTaskInstance(taskInstanceId: string): Promise<TaskResponse<ITaskInstance>> {
    try {
      const response = await this.taskInstanceRepo.findById(taskInstanceId);
      if (!response.success || !response.data) {
        return { success: false, message: `Task instance with id ${taskInstanceId} not found` };
      }
      return { success: true, data: this.taskInstanceToData(response.data) };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to get task instance: ${error instanceof Error ? error.message : '未知错误'}` 
      };
    }
  }

  /**
   * 获取所有任务实例
   */
  async getAllTaskInstances(): Promise<TaskResponse<ITaskInstance[]>> {
    try {
      const response = await this.taskInstanceRepo.findAll();
      if (!response.success) {
        return { success: false, message: response.message };
      }
      const data = (response.data || []).map(instance => this.taskInstanceToData(instance));
      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to get task instances: ${error instanceof Error ? error.message : '未知错误'}` 
      };
    }
  }

  /**
   * 获取今日任务实例
   */
  async getTodayTasks(): Promise<TaskResponse<ITaskInstance[]>> {
    try {
      const response = await this.taskInstanceRepo.findTodayTasks();
      if (!response.success) {
        return { success: false, message: response.message };
      }
      const data = (response.data || []).map(instance => this.taskInstanceToData(instance));
      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to get today tasks: ${error instanceof Error ? error.message : '未知错误'}` 
      };
    }
  }

  /**
   * 完成任务实例
   */
  async completeTask(taskInstanceId: string): Promise<TaskResponse<void>> {
    try {
      const response = await this.taskInstanceRepo.findById(taskInstanceId);
      if (!response.success || !response.data) {
        return { success: false, message: "Task instance not found" };
      }

      const taskInstance = response.data;
      taskInstance.complete();
      
      const updateResponse = await this.taskInstanceRepo.update(taskInstance);
      if (!updateResponse.success) {
        return { success: false, message: updateResponse.message };
      }

      // 发布领域事件
      const domainEvents = taskInstance.getUncommittedDomainEvents();
      for (const event of domainEvents) {
        // 这里需要实现事件发布逻辑
        console.log(`发布事件: ${event.eventType}`);
      }

      return { success: true, message: "Task instance completed successfully" };
    } catch (error) {
      return {
        success: false,
        message: `Failed to complete task instance ${taskInstanceId}: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }

  /**
   * 撤销完成任务实例
   */
  async undoCompleteTask(taskInstanceId: string): Promise<TaskResponse<void>> {
    try {
      const response = await this.taskInstanceRepo.findById(taskInstanceId);
      if (!response.success || !response.data) {
        return { success: false, message: "Task instance not found" };
      }

      const taskInstance = response.data;

      if (!taskInstance.isCompleted()) {
        return { success: false, message: "Task instance is not completed, cannot undo completion" };
      }

      taskInstance.undoComplete();
      
      const updateResponse = await this.taskInstanceRepo.update(taskInstance);
      if (!updateResponse.success) {
        return { success: false, message: updateResponse.message };
      }

      // 发布领域事件
      const domainEvents = taskInstance.getUncommittedDomainEvents();
      for (const event of domainEvents) {
        console.log(`发布事件: ${event.eventType}`);
      }

      return { success: true, message: "Task instance undone successfully" };
    } catch (error) {
      return {
        success: false,
        message: `Failed to undo task instance ${taskInstanceId} completion: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }

  /**
   * 开始任务实例
   */
  async startTask(taskInstanceId: string): Promise<TaskResponse<void>> {
    try {
      const response = await this.taskInstanceRepo.findById(taskInstanceId);
      if (!response.success || !response.data) {
        return { success: false, message: "Task instance not found" };
      }

      response.data.start();
      const updateResponse = await this.taskInstanceRepo.update(response.data);
      
      return { 
        success: updateResponse.success, 
        message: updateResponse.success ? "Task instance started successfully" : updateResponse.message 
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to start task instance ${taskInstanceId}: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }

  /**
   * 取消任务实例
   */
  async cancelTask(taskInstanceId: string): Promise<TaskResponse<void>> {
    try {
      const response = await this.taskInstanceRepo.findById(taskInstanceId);
      if (!response.success || !response.data) {
        return { success: false, message: "Task instance not found" };
      }

      response.data.cancel();
      const updateResponse = await this.taskInstanceRepo.update(response.data);
      
      return { 
        success: updateResponse.success, 
        message: updateResponse.success ? "Task instance cancelled successfully" : updateResponse.message 
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to cancel task instance ${taskInstanceId}: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }

  // === 统计分析 ===

  /**
   * 获取目标相关的任务统计信息
   */
  async getTaskStatsForGoal(_goalId: string): Promise<TaskResponse<TaskStats>> {
    try {
      // 这里需要实现统计逻辑，可能需要调用其他服务获取目标信息
      // 暂时返回空的统计数据
      const stats: TaskStats = {
        overall: {
          total: 0,
          completed: 0,
          incomplete: 0,
          completionRate: 0,
          missedTasks: 0,
        },
        taskDetails: [],
      };
      
      return { success: true, data: stats };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get task stats for goal: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }

  /**
   * 获取任务完成时间线
   */
  async getTaskCompletionTimeline(_goalId: string, _startDate: string, _endDate: string): Promise<TaskResponse<TaskTimeline[]>> {
    try {
      // 这里需要实现时间线逻辑
      const timeline: TaskTimeline[] = [];
      
      return { success: true, data: timeline };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get task completion timeline: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }

  // === 任务模板状态管理 ===

  /**
   * 激活任务模板
   */
  async activateTemplate(taskTemplateId: string): Promise<boolean> {
    try {
      const response = await this.taskTemplateRepo.findById(taskTemplateId);
      if (!response.success || !response.data) {
        console.error("Task template not found:", taskTemplateId);
        return false;
      }

      response.data.activate();
      const updateResponse = await this.taskTemplateRepo.update(response.data);
      return updateResponse.success;
    } catch (error) {
      console.error(`✗ 激活任务模板 ${taskTemplateId} 失败:`, error);
      return false;
    }
  }

  /**
   * 暂停任务模板
   */
  async pauseTemplate(taskTemplateId: string): Promise<boolean> {
    try {
      const response = await this.taskTemplateRepo.findById(taskTemplateId);
      if (!response.success || !response.data) {
        console.error("Task template not found:", taskTemplateId);
        return false;
      }

      const pauseResponse = await this.taskDomainService.pauseTaskTemplate(
        response.data,
        this.taskTemplateRepo,
        this.taskInstanceRepo
      );
      return pauseResponse.success;
    } catch (error) {
      console.error(`✗ 暂停任务模板 ${taskTemplateId} 失败:`, error);
      return false;
    }
  }

  /**
   * 恢复任务模板
   */
  async resumeTemplate(taskTemplateId: string): Promise<boolean> {
    try {
      const response = await this.taskTemplateRepo.findById(taskTemplateId);
      if (!response.success || !response.data) {
        console.error("Task template not found:", taskTemplateId);
        return false;
      }

      const resumeResponse = await this.taskDomainService.resumeTaskTemplate(
        response.data,
        this.taskTemplateRepo,
        this.taskInstanceRepo
      );
      return resumeResponse.success;
    } catch (error) {
      console.error(`✗ 恢复任务模板 ${taskTemplateId} 失败:`, error);
      return false;
    }
  }

  /**
   * 归档任务模板
   */
  async archiveTemplate(taskTemplateId: string): Promise<boolean> {
    try {
      const response = await this.taskTemplateRepo.findById(taskTemplateId);
      if (!response.success || !response.data) {
        console.error("Task template not found:", taskTemplateId);
        return false;
      }

      response.data.archive();
      const updateResponse = await this.taskTemplateRepo.update(response.data);
      return updateResponse.success;
    } catch (error) {
      console.error(`✗ 归档任务模板 ${taskTemplateId} 失败:`, error);
      return false;
    }
  }

  /**
   * 从元模板创建任务模板
   * 新架构：主进程直接返回完整的任务模板对象，渲染进程只需要修改和展示
   */
  async createTaskTemplateFromMetaTemplate(
    metaTemplateId: string, 
    title: string, 
    customOptions?: {
      description?: string;
      priority?: 1 | 2 | 3 | 4 | 5; // 优先级
      tags?: string[];
    }
  ): Promise<TaskResponse<ITaskTemplate>> {
    try {
      // 获取元模板
      const metaTemplateResponse = await this.taskMetaTemplateRepo.findById(metaTemplateId);
      if (!metaTemplateResponse.success || !metaTemplateResponse.data) {
        return { success: false, message: `Meta template with id ${metaTemplateId} not found` };
      }

      const metaTemplate = metaTemplateResponse.data;
      
      // 从元模板创建完整的任务模板
      const taskTemplate = metaTemplate.createTaskTemplate(title, customOptions);
      
      // 验证任务模板
      const validation = TaskTemplateValidator.validate(taskTemplate);
      if (!validation.isValid) {
        return { success: false, message: validation.errors.join(", ") };
      }

      // 保存任务模板
      const saveResponse = await this.taskTemplateRepo.save(taskTemplate);
      if (!saveResponse.success) {
        return { success: false, message: saveResponse.message };
      }
      
      return { success: true, data: this.taskTemplateToData(taskTemplate) };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to create task template from meta template: ${error instanceof Error ? error.message : '未知错误'}` 
      };
    }
  }

  /**
   * 生成任务模板ID
   */
  private generateId(): string {
    return `task-template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取默认时间配置
   */
  private getDefaultTimeConfig(): TaskTimeConfig {
    return {
      type: 'timed',
      baseTime: {
        start: TimeUtils.now(),
        end: TimeUtils.addMinutes(TimeUtils.now(), 60),
        duration: 60
      },
      recurrence: { type: 'none' },
      timezone: 'UTC',
      dstHandling: 'auto'
    };
  }

  /**
   * 获取默认提醒配置
   */
  private getDefaultReminderConfig(): TaskReminderConfig {
    return {
      enabled: false,
      alerts: [],
      snooze: {
        enabled: false,
        interval: 5,
        maxCount: 1
      }
    };
  }
}
