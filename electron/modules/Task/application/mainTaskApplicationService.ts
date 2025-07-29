import { TaskDomainService } from "../domain/services/taskDomainService";
import { TaskContainer } from "../infrastructure/di/taskContainer";
import type { ITaskTemplateRepository } from "../domain/repositories/iTaskTemplateRepository";
import type { ITaskInstanceRepository } from "../domain/repositories/iTaskInstanceRepository";
import type { ITaskMetaTemplateRepository } from "../domain/repositories/iTaskMetaTemplateRepository";
import { TaskTemplate } from "../domain/aggregates/taskTemplate";
import { TaskInstance } from "../domain/aggregates/taskInstance";
import { TaskMetaTemplate } from "../domain/aggregates/taskMetaTemplate";
import { TaskTemplateValidator } from "../validation/TaskTemplateValidator";
import type {
  ITaskTemplate,
  ITaskInstance,
  ITaskMetaTemplate
} from "../domain/types/task";
import type {
  TaskResponse,
} from "../../../../src/modules/Task/domain/types/task";

/**
 * MainTaskApplicationService
 * 主进程中的任务应用服务层，负责任务模板、任务实例、元模板的管理与协调。
 * 通过 IPC 为渲染进程提供服务，聚合领域服务与仓储，保证业务流程的完整性。
 */
export class MainTaskApplicationService {
  // ========== 仓库与领域服务 ==========
  private taskDomainService: TaskDomainService;
  private taskTemplateRepo: ITaskTemplateRepository;
  private taskInstanceRepo: ITaskInstanceRepository;
  private taskMetaTemplateRepo: ITaskMetaTemplateRepository;

  constructor() {
    // 依赖注入：获取各仓库与领域服务实例
    const container = TaskContainer.getInstance();
    this.taskTemplateRepo = container.getTaskTemplateRepository();
    this.taskInstanceRepo = container.getTaskInstanceRepository();
    this.taskMetaTemplateRepo = container.getTaskMetaTemplateRepository();
    this.taskDomainService = new TaskDomainService();
  }

  // ========== 类型适配与DTO转换 ==========

  /**
   * 将任意对象适配为 TaskMetaTemplate 实例（兼容渲染进程/主进程类型差异）
   * @param template 任意类型的元模板对象
   * @returns TaskMetaTemplate 实例
   */
  private adaptTaskMetaTemplate(template: any): TaskMetaTemplate {
    if (template instanceof TaskMetaTemplate) return template;
    const json = template.toDTO ? template.toDTO() : (template.toJSON ? template.toJSON() : template);
    return new TaskMetaTemplate(
      json.uuid,
      json.name,
      json.category,
      {
        description: json.description,
        defaultTimeConfig: json.defaultTimeConfig,
        defaultReminderConfig: json.defaultReminderConfig,
        defaultMetadata: json.defaultMetadata
      }
    );
  }

  /** TaskTemplate 实体转为纯对象 */
  private taskTemplateToData(template: TaskTemplate): ITaskTemplate {
    return JSON.parse(JSON.stringify(template.toDTO()));
  }
  /** TaskInstance 实体转为纯对象 */
  private taskInstanceToData(instance: TaskInstance): ITaskInstance {
    return JSON.parse(JSON.stringify(instance.toDTO()));
  }
  /** TaskMetaTemplate 实体转为纯对象 */
  private taskMetaTemplateToData(metaTemplate: TaskMetaTemplate): ITaskMetaTemplate {
    return JSON.parse(JSON.stringify(metaTemplate.toDTO()));
  }

  // ========== 元模板相关 ==========

  /**
   * 获取所有元模板
   * @param accountUuid 用户账号ID
   * @returns { success: boolean, data?: ITaskMetaTemplate[], message?: string }
   * 示例返回: { success: true, data: [ { uuid, name, ... } ] }
   */
  async getAllMetaTemplates(accountUuid: string): Promise<TaskResponse<ITaskMetaTemplate[]>> {
    try {
      const response = await this.taskMetaTemplateRepo.findAll(accountUuid);
      if (!response.success) return { success: false, message: response.message };
      const data = (response.data || [])
        .map(t => this.adaptTaskMetaTemplate(t))
        .map(t => this.taskMetaTemplateToData(t));
      return { success: true, data };
    } catch (error) {
      return { success: false, message: `Failed to get meta templates: ${error instanceof Error ? error.message : '未知错误'}` };
    }
  }

  /**
   * 根据ID获取元模板
   * @param accountUuid 用户账号ID
   * @param uuid 元模板ID
   * @returns { success: boolean, data?: ITaskMetaTemplate, message?: string }
   * 示例返回: { success: true, data: { uuid, name, ... } }
   */
  async getMetaTemplate(accountUuid: string, uuid: string): Promise<TaskResponse<ITaskMetaTemplate>> {
    try {
      const response = await this.taskMetaTemplateRepo.findById(accountUuid, uuid);
      if (!response.success || !response.data) {
        return { success: false, message: `Meta template with id ${uuid} not found` };
      }
      const adaptedTemplate = this.adaptTaskMetaTemplate(response.data);
      return { success: true, data: this.taskMetaTemplateToData(adaptedTemplate) };
    } catch (error) {
      return { success: false, message: `Failed to get meta template: ${error instanceof Error ? error.message : '未知错误'}` };
    }
  }

  /**
   * 根据分类获取元模板
   * @param accountUuid 用户账号ID
   * @param category 分类名
   * @returns { success: boolean, data?: ITaskMetaTemplate[], message?: string }
   */
  async getMetaTemplatesByCategory(accountUuid: string, category: string): Promise<TaskResponse<ITaskMetaTemplate[]>> {
    try {
      const response = await this.taskMetaTemplateRepo.findByCategory(accountUuid, category);
      if (!response.success) return { success: false, message: response.message };
      const data = (response.data || [])
        .map(t => this.adaptTaskMetaTemplate(t))
        .map(t => this.taskMetaTemplateToData(t));
      return { success: true, data };
    } catch (error) {
      return { success: false, message: `Failed to get meta templates by category: ${error instanceof Error ? error.message : '未知错误'}` };
    }
  }

  // ========== 任务模板相关 ==========

  /**
   * 获取所有任务模板
   * @param accountUuid 用户账号ID
   * @returns { success: boolean, data?: ITaskTemplate[], message?: string }
   */
  async getAllTaskTemplates(accountUuid: string): Promise<TaskResponse<ITaskTemplate[]>> {
    try {
      const response = await this.taskTemplateRepo.findAll(accountUuid);
      if (!response.success) return { success: false, message: response.message };
      const data = (response.data || []).map(t => this.taskTemplateToData(t));
      return { success: true, data };
    } catch (error) {
      return { success: false, message: `Failed to get task templates: ${error instanceof Error ? error.message : '未知错误'}` };
    }
  }

  /**
   * 根据ID获取任务模板
   * @param accountUuid 用户账号ID
   * @param taskTemplateId 任务模板ID
   * @returns { success: boolean, data?: ITaskTemplate, message?: string }
   */
  async getTaskTemplate(accountUuid: string, taskTemplateId: string): Promise<TaskResponse<ITaskTemplate>> {
    try {
      const response = await this.taskTemplateRepo.findById(accountUuid, taskTemplateId);
      if (!response.success || !response.data) {
        return { success: false, message: `Task template with id ${taskTemplateId} not found` };
      }
      return { success: true, data: this.taskTemplateToData(response.data) };
    } catch (error) {
      return { success: false, message: `Failed to get task template: ${error instanceof Error ? error.message : '未知错误'}` };
    }
  }

  /**
   * 根据关键结果获取任务模板
   * @param accountUuid 用户账号ID
   * @param goalUuid 目标ID
   * @param keyResultId 关键结果ID
   * @returns { success: boolean, data?: ITaskTemplate[], message?: string }
   */
  async getTaskTemplateForKeyResult(accountUuid: string, goalUuid: string, keyResultId: string): Promise<TaskResponse<ITaskTemplate[]>> {
    try {
      const response = await this.taskTemplateRepo.findByKeyResult(accountUuid, goalUuid, keyResultId);
      if (!response.success) return { success: false, message: response.message };
      const data = (response.data || []).map(t => this.taskTemplateToData(t));
      return { success: true, data };
    } catch (error) {
      return { success: false, message: `Failed to get task templates for key result: ${error instanceof Error ? error.message : '未知错误'}` };
    }
  }

  /**
   * 创建任务模板
   * @param accountUuid 用户账号ID
   * @param dto 任务模板DTO对象
   * @returns { success: boolean, data?: ITaskTemplate, message?: string }
   * 业务流程：DTO转领域实体 -> 验证 -> 激活 -> 保存 -> 自动生成任务实例
   */
  async createTaskTemplate(accountUuid: string, dto: ITaskTemplate): Promise<TaskResponse<ITaskTemplate>> {
    try {
      // 1. DTO 转领域实体
      const template = TaskTemplate.fromDTO(dto);

      // 2. 验证
      const validation = TaskTemplateValidator.validate(template);
      if (!validation.isValid) {
        return { success: false, message: validation.errors.join(", ") };
      }

      // 3. 激活模板
      template.activate();

      // 4. 保存到数据库
      const response = await this.taskTemplateRepo.save(accountUuid, template);
      if (!response.success) {
        return { success: false, message: response.message };
      }

      // 5. 自动生成任务实例
      try {
        const instances = await this.taskDomainService.generateInstancesWithBusinessRules(
          template,
          this.taskInstanceRepo,
          { maxInstances: 10 }
        );
        for (const instance of instances) {
          await this.taskInstanceRepo.save(accountUuid, instance);
        }
      } catch (scheduleError) {
        // 生成实例失败不影响模板创建
      }

      // 6. 返回DTO
      return { success: true, data: this.taskTemplateToData(template) };
    } catch (error) {
      return { success: false, message: `Failed to create task template: ${error instanceof Error ? error.message : '未知错误'}` };
    }
  }

  /**
   * 更新任务模板
   * @param accountUuid 用户账号ID
   * @param dto 任务模板DTO对象
   * @returns { success: boolean, data?: ITaskTemplate, message?: string }
   */
  async updateTaskTemplate(accountUuid: string, dto: ITaskTemplate): Promise<TaskResponse<ITaskTemplate>> {
    try {
      const response = await this.taskTemplateRepo.findById(accountUuid, dto.uuid);
      if (!response.success || !response.data) {
        return { success: false, message: `Task template with id ${dto.uuid} not found` };
      }
      const template = response.data;
      // 更新属性
      if (dto.title) template.updateTitle(dto.title);
      if (dto.description !== undefined) template.updateDescription(dto.description);

      const validation = TaskTemplateValidator.validate(template);
      if (!validation.isValid) {
        return { success: false, message: validation.errors.join(", ") };
      }

      const updateResponse = await this.taskDomainService.updateTaskTemplate(
        template,
        this.taskTemplateRepo,
        this.taskInstanceRepo,
        accountUuid
      );
      if (!updateResponse.success) {
        return { success: false, message: updateResponse.message };
      }
      return { success: true, data: this.taskTemplateToData(template) };
    } catch (error) {
      return { success: false, message: `Failed to update task template: ${error instanceof Error ? error.message : '未知错误'}` };
    }
  }

  /**
   * 删除任务模板
   * @param accountUuid 用户账号ID
   * @param templateId 任务模板ID
   * @returns { success: boolean, message: string }
   */
  async deleteTaskTemplate(accountUuid: string, templateId: string): Promise<TaskResponse<void>> {
    try {
      const response = await this.taskTemplateRepo.findById(accountUuid, templateId);
      if (!response.success || !response.data) {
        return { success: false, message: `Task template with id ${templateId} not found` };
      }
      const deleteResponse = await this.taskDomainService.deleteTaskTemplate(
        response.data,
        this.taskTemplateRepo,
        this.taskInstanceRepo,
        true,
        accountUuid
      );
      return { success: deleteResponse.success, message: deleteResponse.message };
    } catch (error) {
      return { success: false, message: `Failed to delete task template: ${error instanceof Error ? error.message : '未知错误'}` };
    }
  }

  /**
   * 批量删除所有任务模板及其关联的任务实例
   * @param accountUuid 用户账号ID
   * @returns { success: boolean, message: string }
   */
  async deleteAllTaskTemplates(accountUuid: string): Promise<TaskResponse<void>> {
    try {
      const allTemplatesResponse = await this.taskTemplateRepo.findAll(accountUuid);
      if (!allTemplatesResponse.success) {
        return { success: false, message: allTemplatesResponse.message };
      }
      const templates = allTemplatesResponse.data || [];
      if (templates.length === 0) {
        return { success: true, message: "No task templates to delete" };
      }
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      for (const template of templates) {
        try {
          const deleteResponse = await this.taskDomainService.deleteTaskTemplate(
            template,
            this.taskTemplateRepo,
            this.taskInstanceRepo,
            true,
            accountUuid
          );
          if (deleteResponse.success) {
            successCount++;
          } else {
            errorCount++;
            errors.push(`Failed to delete template "${template.title}": ${deleteResponse.message}`);
          }
        } catch (error) {
          errorCount++;
          const errorMessage = error instanceof Error ? error.message : '未知错误';
          errors.push(`Error deleting template "${template.title}": ${errorMessage}`);
        }
      }
      if (errorCount === 0) {
        return { success: true, message: `Successfully deleted all ${successCount} task templates` };
      } else if (successCount === 0) {
        return { success: false, message: `Failed to delete all task templates: ${errors.join('; ')}` };
      } else {
        return { success: true, message: `Partially completed: ${successCount} templates deleted successfully, ${errorCount} failed. Errors: ${errors.join('; ')}` };
      }
    } catch (error) {
      return { success: false, message: `Failed to delete all task templates: ${error instanceof Error ? error.message : '未知错误'}` };
    }
  }

  // ========== 任务实例相关 ==========

  /**
   * 获取所有任务实例
   * @param accountUuid 用户账号ID
   * @returns { success: boolean, data?: ITaskInstance[], message?: string }
   */
  async getAllTaskInstances(accountUuid: string): Promise<TaskResponse<ITaskInstance[]>> {
    try {
      const response = await this.taskInstanceRepo.findAll(accountUuid);
      if (!response.success) return { success: false, message: response.message };
      const data = (response.data || []).map(i => this.taskInstanceToData(i));
      return { success: true, data };
    } catch (error) {
      return { success: false, message: `Failed to get task instances: ${error instanceof Error ? error.message : '未知错误'}` };
    }
  }

  /**
   * 根据ID获取任务实例
   * @param accountUuid 用户账号ID
   * @param taskInstanceId 任务实例ID
   * @returns { success: boolean, data?: ITaskInstance, message?: string }
   */
  async getTaskInstance(accountUuid: string, taskInstanceId: string): Promise<TaskResponse<ITaskInstance>> {
    try {
      const response = await this.taskInstanceRepo.findById(accountUuid, taskInstanceId);
      if (!response.success || !response.data) {
        return { success: false, message: `Task instance with id ${taskInstanceId} not found` };
      }
      return { success: true, data: this.taskInstanceToData(response.data) };
    } catch (error) {
      return { success: false, message: `Failed to get task instance: ${error instanceof Error ? error.message : '未知错误'}` };
    }
  }

  /**
   * 获取今日任务实例
   * @param accountUuid 用户账号ID
   * @returns { success: boolean, data?: ITaskInstance[], message?: string }
   */
  async getTodayTasks(accountUuid: string): Promise<TaskResponse<ITaskInstance[]>> {
    try {
      const response = await this.taskInstanceRepo.findTodayTasks(accountUuid);
      if (!response.success) return { success: false, message: response.message };
      const data = (response.data || []).map(i => this.taskInstanceToData(i));
      return { success: true, data };
    } catch (error) {
      return { success: false, message: `Failed to get today tasks: ${error instanceof Error ? error.message : '未知错误'}` };
    }
  }

  /**
   * 完成任务实例
   * @param accountUuid 用户账号ID
   * @param taskInstanceId 任务实例ID
   * @returns { success: boolean, message: string }
   */
  async completeTask(accountUuid: string, taskInstanceId: string): Promise<TaskResponse<void>> {
    try {
      const response = await this.taskInstanceRepo.findById(accountUuid, taskInstanceId);
      if (!response.success || !response.data) {
        return { success: false, message: "Task instance not found" };
      }
      const taskInstance = response.data;
      taskInstance.complete(accountUuid);
      const updateResponse = await this.taskInstanceRepo.update(accountUuid, taskInstance);
      if (!updateResponse.success) {
        return { success: false, message: updateResponse.message };
      }
      // 可在此发布领域事件
      return { success: true, message: "Task instance completed successfully" };
    } catch (error) {
      return { success: false, message: `Failed to complete task instance ${taskInstanceId}: ${error instanceof Error ? error.message : "未知错误"}` };
    }
  }

  /**
   * 撤销完成任务实例
   * @param accountUuid 用户账号ID
   * @param taskInstanceId 任务实例ID
   * @returns { success: boolean, message: string }
   */
  async undoCompleteTask(accountUuid: string, taskInstanceId: string): Promise<TaskResponse<void>> {
    try {
      const response = await this.taskInstanceRepo.findById(accountUuid, taskInstanceId);
      if (!response.success || !response.data) {
        return { success: false, message: "Task instance not found" };
      }
      const taskInstance = response.data;
      if (!taskInstance.isCompleted()) {
        return { success: false, message: "Task instance is not completed, cannot undo completion" };
      }
      taskInstance.undoComplete(accountUuid);
      const updateResponse = await this.taskInstanceRepo.update(accountUuid, taskInstance);
      if (!updateResponse.success) {
        return { success: false, message: updateResponse.message };
      }
      // 可在此发布领域事件
      return { success: true, message: "Task instance undone successfully" };
    } catch (error) {
      return { success: false, message: `Failed to undo task instance ${taskInstanceId} completion: ${error instanceof Error ? error.message : "未知错误"}` };
    }
  }

  /**
   * 开始任务实例
   * @param accountUuid 用户账号ID
   * @param taskInstanceId 任务实例ID
   * @returns { success: boolean, message: string }
   */
  async startTask(accountUuid: string, taskInstanceId: string): Promise<TaskResponse<void>> {
    try {
      const response = await this.taskInstanceRepo.findById(accountUuid, taskInstanceId);
      if (!response.success || !response.data) {
        return { success: false, message: "Task instance not found" };
      }
      response.data.start();
      const updateResponse = await this.taskInstanceRepo.update(accountUuid, response.data);
      return { success: updateResponse.success, message: updateResponse.success ? "Task instance started successfully" : updateResponse.message };
    } catch (error) {
      return { success: false, message: `Failed to start task instance ${taskInstanceId}: ${error instanceof Error ? error.message : "未知错误"}` };
    }
  }

  /**
   * 取消任务实例
   * @param accountUuid 用户账号ID
   * @param taskInstanceId 任务实例ID
   * @returns { success: boolean, message: string }
   */
  async cancelTask(accountUuid: string, taskInstanceId: string): Promise<TaskResponse<void>> {
    try {
      const response = await this.taskInstanceRepo.findById(accountUuid, taskInstanceId);
      if (!response.success || !response.data) {
        return { success: false, message: "Task instance not found" };
      }
      response.data.cancel();
      const updateResponse = await this.taskInstanceRepo.update(accountUuid, response.data);
      return { success: updateResponse.success, message: updateResponse.success ? "Task instance cancelled successfully" : updateResponse.message };
    } catch (error) {
      return { success: false, message: `Failed to cancel task instance ${taskInstanceId}: ${error instanceof Error ? error.message : "未知错误"}` };
    }
  }

  // ========== 任务模板状态管理 ==========

  /**
   * 激活任务模板
   * @param accountUuid 用户账号ID
   * @param taskTemplateId 任务模板ID
   * @returns 是否激活成功
   */
  async activateTemplate(accountUuid: string, taskTemplateId: string): Promise<boolean> {
    try {
      const response = await this.taskTemplateRepo.findById(accountUuid, taskTemplateId);
      if (!response.success || !response.data) {
        return false;
      }
      response.data.activate();
      const updateResponse = await this.taskTemplateRepo.update(accountUuid, response.data);
      return updateResponse.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * 暂停任务模板
   * @param accountUuid 用户账号ID
   * @param taskTemplateId 任务模板ID
   * @returns 是否暂停成功
   */
  async pauseTemplate(accountUuid: string, taskTemplateId: string): Promise<boolean> {
    try {
      const response = await this.taskTemplateRepo.findById(accountUuid, taskTemplateId);
      if (!response.success || !response.data) {
        return false;
      }
      const pauseResponse = await this.taskDomainService.pauseTaskTemplate(
        response.data,
        this.taskTemplateRepo,
        this.taskInstanceRepo,
        accountUuid
      );
      return pauseResponse.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * 恢复任务模板
   * @param accountUuid 用户账号ID
   * @param taskTemplateId 任务模板ID
   * @returns 是否恢复成功
   */
  async resumeTemplate(accountUuid: string, taskTemplateId: string): Promise<boolean> {
    try {
      const response = await this.taskTemplateRepo.findById(accountUuid, taskTemplateId);
      if (!response.success || !response.data) {
        return false;
      }
      const resumeResponse = await this.taskDomainService.resumeTaskTemplate(
        response.data,
        this.taskTemplateRepo,
        this.taskInstanceRepo,
        accountUuid
      );
      return resumeResponse.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * 归档任务模板
   * @param accountUuid 用户账号ID
   * @param taskTemplateId 任务模板ID
   * @returns 是否归档成功
   */
  async archiveTemplate(accountUuid: string, taskTemplateId: string): Promise<boolean> {
    try {
      const response = await this.taskTemplateRepo.findById(accountUuid, taskTemplateId);
      if (!response.success || !response.data) {
        return false;
      }
      response.data.archive();
      const updateResponse = await this.taskTemplateRepo.update(accountUuid, response.data);
      return updateResponse.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * 从元模板创建任务模板（不保存，仅返回对象，前端编辑后再保存）
   * @param accountUuid 用户账号ID
   * @param metaTemplateId 元模板ID
   * @param title 任务标题
   * @param customOptions 可选自定义项
   * @returns { success: boolean, data?: ITaskTemplate, message?: string }
   */
  async createTaskTemplateFromMetaTemplate(
    accountUuid: string,
    metaTemplateId: string,
    title: string,
    customOptions?: {
      description?: string;
      priority?: 1 | 2 | 3 | 4 | 5;
      tags?: string[];
    }
  ): Promise<TaskResponse<ITaskTemplate>> {
    try {
      const metaTemplateResponse = await this.taskMetaTemplateRepo.findById(accountUuid, metaTemplateId);
      if (!metaTemplateResponse.success || !metaTemplateResponse.data) {
        return { success: false, message: `Meta template with id ${metaTemplateId} not found` };
      }
      const metaTemplate = metaTemplateResponse.data;
      const taskTemplate = metaTemplate.createTaskTemplate(title, customOptions);
      const validation = TaskTemplateValidator.validate(taskTemplate);
      if (!validation.isValid) {
        return { success: false, message: validation.errors.join(", ") };
      }
      return { success: true, message: 'Task template created from meta template (not saved yet)', data: this.taskTemplateToData(taskTemplate) };
    } catch (error) {
      return { success: false, message: `Failed to create task template from meta template: ${error instanceof Error ? error.message : '未知错误'}` };
    }
  }

  /**
   * 初始化系统内置元模板（如首次启动时调用）
   * @param accountUuid 用户账号ID
   * @returns { success: boolean, message: string }
   */
  async initializeSystemTemplates(accountUuid: string): Promise<TResponse<void>> {
    try {
      const result = await this.taskDomainService.initializeSystemTemplates(
        this.taskMetaTemplateRepo,
        accountUuid
      );
      return result;
    } catch (error) {
      return { success: false, message: `Failed to initialize system templates: ${error instanceof Error ? error.message : '未知错误'}` };
    }
  }
}