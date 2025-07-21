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
    const json = template.toDTO ? template.toDTO() : (template.toJSON ? template.toJSON() : template);
    
    // 使用正确的构造函数参数
    return new TaskMetaTemplate(
      json.uuid, 
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
   * 直接使用领域对象的 toDTO 方法，并确保数据可序列化
   */
  private taskTemplateToData(template: TaskTemplate): ITaskTemplate {
    const dto = template.toDTO();
    // 确保返回的数据是可序列化的纯对象
    return JSON.parse(JSON.stringify(dto));
  }

  /**
   * 将 TaskInstance 转换为接口数据
   * 直接使用领域对象的 toDTO 方法，并确保数据可序列化
   */
  private taskInstanceToData(instance: TaskInstance): ITaskInstance {
    const dto = instance.toDTO();
    // 确保返回的数据是可序列化的纯对象
    return JSON.parse(JSON.stringify(dto));
  }

  /**
   * 将 TaskMetaTemplate 转换为接口数据
   * 直接使用领域对象的 toDTO 方法，并确保数据可序列化
   */
  private taskMetaTemplateToData(metaTemplate: TaskMetaTemplate): ITaskMetaTemplate {
    const dto = metaTemplate.toDTO();
    // 确保返回的数据是可序列化的纯对象
    return JSON.parse(JSON.stringify(dto));
  }

  // === MetaTemplate 相关方法 ===

  /**
   * 获取所有元模板
   */
  async getAllMetaTemplates(accountUuid: string): Promise<TaskResponse<ITaskMetaTemplate[]>> {
    try {
      const response = await this.taskMetaTemplateRepo.findAll(accountUuid);
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
  async getMetaTemplate(accountUuid: string, uuid: string): Promise<TaskResponse<ITaskMetaTemplate>> {
    try {
      const response = await this.taskMetaTemplateRepo.findById(accountUuid, uuid);
      if (!response.success || !response.data) {
        return { success: false, message: `Meta template with id ${uuid} not found` };
      }
      const adaptedTemplate = this.adaptTaskMetaTemplate(response.data);
      console.log(this.taskMetaTemplateToData(adaptedTemplate))
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
  async getMetaTemplatesByCategory(accountUuid: string, category: string): Promise<TaskResponse<ITaskMetaTemplate[]>> {
    try {
      const response = await this.taskMetaTemplateRepo.findByCategory(accountUuid, category);
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
  async getTaskTemplate(accountUuid: string, taskTemplateId: string): Promise<TaskResponse<ITaskTemplate>> {
    try {
      const response = await this.taskTemplateRepo.findById(accountUuid, taskTemplateId);
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
  async getAllTaskTemplates(accountUuid: string): Promise<TaskResponse<ITaskTemplate[]>> {
    try {
      const response = await this.taskTemplateRepo.findAll(accountUuid);
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
  async getTaskTemplateForKeyResult(accountUuid: string, goalUuid: string, keyResultId: string): Promise<TaskResponse<ITaskTemplate[]>> {
    try {
      const response = await this.taskTemplateRepo.findByKeyResult(accountUuid, goalUuid, keyResultId);
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
   * 流程第3步：主进程应用服务 - 将DTO转换为领域实体并保存
   * 自动激活模板，并创建任务实例和提醒
   */
  async createTaskTemplate(accountUuid: string, dto: ITaskTemplate): Promise<TaskResponse<ITaskTemplate>> {
    console.log('🔄 [主进程-步骤3] 应用服务：开始创建任务模板');
    console.log('📋 [主进程-步骤3] 接收到的账户ID:', accountUuid);
    console.log('📋 [主进程-步骤3] 接收到的DTO数据类型:', typeof dto);
    console.log('📋 [主进程-步骤3] 接收到的DTO数据:', dto);
    
    try {
      // 这里需要将 DTO 转换为领域实体
      console.log('🔄 [主进程-步骤3] 开始将DTO转换为领域实体');
      const template = TaskTemplate.fromDTO(dto);
      console.log('✅ [主进程-步骤3] DTO转换为领域实体成功:', template);
      
      // 验证任务模板
      console.log('🔄 [主进程-步骤3] 开始验证任务模板');
      const validation = TaskTemplateValidator.validate(template);
      if (!validation.isValid) {
        console.error('❌ [主进程-步骤3] 任务模板验证失败:', validation.errors);
        return { success: false, message: validation.errors.join(", ") };
      }
      console.log('✅ [主进程-步骤3] 任务模板验证通过');

      // 自动激活模板（跳过草稿状态）
      console.log('🔄 [主进程-步骤3] 自动激活模板');
      template.activate();
      console.log('✅ [主进程-步骤3] 模板已激活');

      // 保存到数据库
      console.log('🔄 [主进程-步骤3] 开始保存到数据库');
      const response = await this.taskTemplateRepo.save(accountUuid, template);
      if (!response.success) {
        console.error('❌ [主进程-步骤3] 数据库保存失败:', response.message);
        return { success: false, message: response.message };
      }
      console.log('✅ [主进程-步骤3] 数据库保存成功');
      
      // 创建任务实例和提醒
      console.log('🔄 [主进程-步骤3] 开始创建任务实例和提醒');
      try {
        const instances = await this.taskDomainService.generateInstancesWithBusinessRules(
          template,
          this.taskInstanceRepo,
          { maxInstances: 10 } // 最多生成10个实例
        );
        
        // 保存生成的实例
        for (const instance of instances) {
          const saveInstanceResponse = await this.taskInstanceRepo.save(accountUuid, instance);
          if (!saveInstanceResponse.success) {
            console.warn('⚠️ [主进程-步骤3] 保存任务实例失败:', saveInstanceResponse.message);
          }
        }
        
        console.log(`✅ [主进程-步骤3] 成功创建 ${instances.length} 个任务实例`);
      } catch (scheduleError) {
        console.warn('⚠️ [主进程-步骤3] 创建任务实例时发生错误，但不影响模板创建:', scheduleError);
      }
      
      // 转换为DTO并返回
      console.log('🔄 [主进程-步骤3] 开始将结果转换为DTO');
      const resultData = this.taskTemplateToData(template);
      console.log('✅ [主进程-步骤3] 结果转换完成，准备返回:', resultData);
      
      return { success: true, data: resultData };
    } catch (error) {
      console.error('❌ [主进程-步骤3] 创建任务模板过程中发生错误:', error);
      return { 
        success: false, 
        message: `Failed to create task template: ${error instanceof Error ? error.message : '未知错误'}` 
      };
    }
  }

  /**
   * 更新任务模板
   */
  async updateTaskTemplate(accountUuid: string, dto: ITaskTemplate): Promise<TaskResponse<ITaskTemplate>> {
    try {
      const response = await this.taskTemplateRepo.findById(accountUuid, dto.uuid);
      if (!response.success || !response.data) {
        return { success: false, message: `Task template with id ${dto.uuid} not found` };
      }

      const template = response.data;
      // 更新模板属性（这里需要根据具体的更新逻辑来实现）
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
      return { 
        success: false, 
        message: `Failed to update task template: ${error instanceof Error ? error.message : '未知错误'}` 
      };
    }
  }

  /**
   * 删除任务模板
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

  /**
   * 删除所有任务模板
   * 批量删除所有任务模板及其关联的任务实例
   */
  async deleteAllTaskTemplates(accountUuid: string): Promise<TaskResponse<void>> {
    try {
      console.log('🔄 [主进程] 开始删除所有任务模板');
      
      // 获取所有任务模板
      const allTemplatesResponse = await this.taskTemplateRepo.findAll(accountUuid);
      if (!allTemplatesResponse.success) {
        return { success: false, message: allTemplatesResponse.message };
      }

      const templates = allTemplatesResponse.data || [];
      console.log(`📋 [主进程] 找到 ${templates.length} 个任务模板需要删除`);

      if (templates.length === 0) {
        return { success: true, message: "No task templates to delete" };
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // 逐个删除任务模板（包括其关联的任务实例）
      for (const template of templates) {
        try {
          const deleteResponse = await this.taskDomainService.deleteTaskTemplate(
            template,
            this.taskTemplateRepo,
            this.taskInstanceRepo,
            true, // 同时删除关联的任务实例
            accountUuid
          );
          
          if (deleteResponse.success) {
            successCount++;
            console.log(`✅ [主进程] 成功删除任务模板: ${template.title}`);
          } else {
            errorCount++;
            errors.push(`Failed to delete template "${template.title}": ${deleteResponse.message}`);
            console.error(`❌ [主进程] 删除任务模板失败: ${template.title}`, deleteResponse.message);
          }
        } catch (error) {
          errorCount++;
          const errorMessage = error instanceof Error ? error.message : '未知错误';
          errors.push(`Error deleting template "${template.title}": ${errorMessage}`);
          console.error(`❌ [主进程] 删除任务模板时发生异常: ${template.title}`, error);
        }
      }

      console.log(`📊 [主进程] 删除操作完成 - 成功: ${successCount}, 失败: ${errorCount}`);

      // 根据结果返回相应的响应
      if (errorCount === 0) {
        return { 
          success: true, 
          message: `Successfully deleted all ${successCount} task templates` 
        };
      } else if (successCount === 0) {
        return { 
          success: false, 
          message: `Failed to delete all task templates: ${errors.join('; ')}` 
        };
      } else {
        return { 
          success: true, 
          message: `Partially completed: ${successCount} templates deleted successfully, ${errorCount} failed. Errors: ${errors.join('; ')}` 
        };
      }
    } catch (error) {
      console.error('❌ [主进程] 删除所有任务模板时发生严重错误:', error);
      return { 
        success: false, 
        message: `Failed to delete all task templates: ${error instanceof Error ? error.message : '未知错误'}` 
      };
    }
  }

  // === 任务实例相关操作 ===

  /**
   * 根据ID获取任务实例
   */
  async getTaskInstance(accountUuid: string, taskInstanceId: string): Promise<TaskResponse<ITaskInstance>> {
    try {
      const response = await this.taskInstanceRepo.findById(accountUuid, taskInstanceId);
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
  async getAllTaskInstances(accountUuid: string): Promise<TaskResponse<ITaskInstance[]>> {
    try {
      const response = await this.taskInstanceRepo.findAll(accountUuid);
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
  async getTodayTasks(accountUuid: string): Promise<TaskResponse<ITaskInstance[]>> {
    try {
      const response = await this.taskInstanceRepo.findTodayTasks(accountUuid);
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
  async completeTask(accountUuid: string, taskInstanceId: string): Promise<TaskResponse<void>> {
    try {
      const response = await this.taskInstanceRepo.findById(accountUuid, taskInstanceId);
      if (!response.success || !response.data) {
        return { success: false, message: "Task instance not found" };
      }

      const taskInstance = response.data;
      taskInstance.complete();
      
      const updateResponse = await this.taskInstanceRepo.update(accountUuid, taskInstance);
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

      taskInstance.undoComplete();
      
      const updateResponse = await this.taskInstanceRepo.update(accountUuid, taskInstance);
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
  async startTask(accountUuid: string, taskInstanceId: string): Promise<TaskResponse<void>> {
    try {
      const response = await this.taskInstanceRepo.findById(accountUuid, taskInstanceId);
      if (!response.success || !response.data) {
        return { success: false, message: "Task instance not found" };
      }

      response.data.start();
      const updateResponse = await this.taskInstanceRepo.update(accountUuid, response.data);
      
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
  async cancelTask(accountUuid: string, taskInstanceId: string): Promise<TaskResponse<void>> {
    try {
      const response = await this.taskInstanceRepo.findById(accountUuid, taskInstanceId);
      if (!response.success || !response.data) {
        return { success: false, message: "Task instance not found" };
      }

      response.data.cancel();
      const updateResponse = await this.taskInstanceRepo.update(accountUuid, response.data);
      
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
  async getTaskStatsForGoal(accountUuid: string, _goalUuid: string): Promise<TaskResponse<TaskStats>> {
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
  async getTaskCompletionTimeline(accountUuid: string, _goalUuid: string, _startDate: string, _endDate: string): Promise<TaskResponse<TaskTimeline[]>> {
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
  async activateTemplate(accountUuid: string, taskTemplateId: string): Promise<boolean> {
    try {
      const response = await this.taskTemplateRepo.findById(accountUuid, taskTemplateId);
      if (!response.success || !response.data) {
        console.error("Task template not found:", taskTemplateId);
        return false;
      }

      response.data.activate();
      const updateResponse = await this.taskTemplateRepo.update(accountUuid, response.data);
      return updateResponse.success;
    } catch (error) {
      console.error(`✗ 激活任务模板 ${taskTemplateId} 失败:`, error);
      return false;
    }
  }

  /**
   * 暂停任务模板
   */
  async pauseTemplate(accountUuid: string, taskTemplateId: string): Promise<boolean> {
    try {
      const response = await this.taskTemplateRepo.findById(accountUuid, taskTemplateId);
      if (!response.success || !response.data) {
        console.error("Task template not found:", taskTemplateId);
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
      console.error(`✗ 暂停任务模板 ${taskTemplateId} 失败:`, error);
      return false;
    }
  }

  /**
   * 恢复任务模板
   */
  async resumeTemplate(accountUuid: string, taskTemplateId: string): Promise<boolean> {
    try {
      const response = await this.taskTemplateRepo.findById(accountUuid, taskTemplateId);
      if (!response.success || !response.data) {
        console.error("Task template not found:", taskTemplateId);
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
      console.error(`✗ 恢复任务模板 ${taskTemplateId} 失败:`, error);
      return false;
    }
  }

  /**
   * 归档任务模板
   */
  async archiveTemplate(accountUuid: string, taskTemplateId: string): Promise<boolean> {
    try {
      const response = await this.taskTemplateRepo.findById(accountUuid, taskTemplateId);
      if (!response.success || !response.data) {
        console.error("Task template not found:", taskTemplateId);
        return false;
      }

      response.data.archive();
      const updateResponse = await this.taskTemplateRepo.update(accountUuid, response.data);
      return updateResponse.success;
    } catch (error) {
      console.error(`✗ 归档任务模板 ${taskTemplateId} 失败:`, error);
      return false;
    }
  }

  /**
   * 从元模板创建任务模板
   * 修复后架构：主进程只创建模板对象但不保存，等用户编辑完成后再保存
   */
  async createTaskTemplateFromMetaTemplate(
    accountUuid: string,
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
      const metaTemplateResponse = await this.taskMetaTemplateRepo.findById(accountUuid, metaTemplateId);
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

      // 注意：这里不保存到数据库，只返回创建的模板对象
      // 等用户在前端编辑完成后，再通过 createTaskTemplate 保存
      console.log('✅ [主进程] 从元模板创建任务模板成功（未保存）:', taskTemplate.title);
      
      return { success: true, message: 'Task template created from meta template (not saved yet)', data: this.taskTemplateToData(taskTemplate) };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to create task template from meta template: ${error instanceof Error ? error.message : '未知错误'}` 
      };
    }
  }

  async initializeSystemTemplates(accountUuid: string): Promise<TResponse<void>> {
      try {
        const result = await this.taskDomainService.initializeSystemTemplates(
          this.taskMetaTemplateRepo,
          accountUuid
        );
        return result;
      } catch (error) {
        return { 
          success: false, 
          message: `Failed to initialize system templates: ${error instanceof Error ? error.message : '未知错误'}` 
        };
      }
    }
}