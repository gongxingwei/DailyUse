import { TaskTemplate } from "../aggregates/taskTemplate";
import { TaskMetaTemplate } from "../aggregates/taskMetaTemplate";
import { taskInstanceService } from "./taskInstanceService";
import type { TaskTimeConfig, TaskReminderConfig } from "../types/task";
import { v4 as uuidv4 } from "uuid";

/**
 * TaskTemplate 领域服务
 * 
 * 职责：
 * - 处理 TaskTemplate 实体的业务逻辑
 * - 管理 TaskTemplate 的创建、验证、状态转换
 * - 提供 TaskTemplate 相关的业务操作
 * 
 * 层次关系: TaskMetaTemplate -> TaskTemplate -> TaskInstance
 * 
 * 常用场景：模板创建、模板校验、模板状态流转、模板克隆等
 */
export class TaskTemplateService {
  /**
   * 从 TaskMetaTemplate 创建 TaskTemplate
   * 
   * 基于 TaskMetaTemplate 的默认配置创建一个新的 TaskTemplate 实例。
   * TaskMetaTemplate 提供基础配置模板，TaskTemplate 在此基础上可以进行个性化定制。
   * 
   * @param metaTemplate 任务元模板，包含默认配置
   * @returns 新创建的 TaskTemplate 实例
   * @example
   * ```ts
   * const template = taskTemplateService.createFromMetaTemplate(metaTemplate);
   * ```
   */
  createFromMetaTemplate(metaTemplate: TaskMetaTemplate): TaskTemplate {
    const mergedTimeConfig = {
      ...metaTemplate.defaultTimeConfig,
      timezone:
        metaTemplate.defaultTimeConfig.timezone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone,
    } as TaskTimeConfig;

    const mergedReminderConfig = {
      ...metaTemplate.defaultReminderConfig,
    } as TaskReminderConfig;

    const mergedOptions = {
      ...metaTemplate.defaultMetadata,
      category: metaTemplate.category,
    };

    const template = new TaskTemplate(
      uuidv4(),
      "",
      mergedTimeConfig,
      mergedReminderConfig,
      mergedOptions
    );

    return template;
  }

  /**
   * 验证 TaskTemplate 状态转换是否合法
   * 
   * TaskTemplate 具有生命周期状态，只允许特定的状态转换：
   * - draft: 草稿状态，可以转换为 active 或 archived
   * - active: 活跃状态，可以转换为 paused 或 archived  
   * - paused: 暂停状态，可以转换为 active 或 archived
   * - archived: 归档状态，只能转换为 active
   * 
   * @param template 要检查的 TaskTemplate
   * @param newStatus 目标状态字符串（"draft"|"active"|"paused"|"archived"）
   * @returns 是否允许状态转换
   * @example
   * ```ts
   * if (taskTemplateService.canChangeStatus(template, "paused")) { ... }
   * ```
   */
  canChangeStatus(template: TaskTemplate, newStatus: string): boolean {
    const currentStatus = template.lifecycle.status;

    const allowedTransitions: Record<
      "draft" | "active" | "paused" | "archived",
      string[]
    > = {
      draft: ["active", "archived"],
      active: ["paused", "archived"],
      paused: ["active", "archived"],
      archived: ["active"],
    };

    return allowedTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  /**
   * 验证 TaskTemplate 配置的有效性
   * 
   * 检查 TaskTemplate 的配置是否合法和完整，包括：
   * - 标题不能为空
   * - 时间配置的逻辑正确性
   * - 其他业务规则验证
   * 
   * @param template 要验证的 TaskTemplate
   * @returns 验证结果对象，包含 valid（是否有效）和 errors（错误信息数组）
   * @example
   * ```ts
   * const result = taskTemplateService.validateConfiguration(template);
   * if (!result.valid) { alert(result.errors.join('\n')); }
   * ```
   * 返回示例：
   * {
   *   valid: false,
   *   errors: ['模板标题不能为空', '结束时间必须晚于开始时间']
   * }
   */
  validateConfiguration(template: TaskTemplate): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!template.title.trim()) {
      errors.push("模板标题不能为空");
    }

    if (
      template.timeConfig.baseTime.end &&
      template.timeConfig.baseTime.end.timestamp <=
        template.timeConfig.baseTime.start.timestamp
    ) {
      errors.push("结束时间必须晚于开始时间");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 计算 TaskTemplate 的下一次执行时间
   * 
   * 根据 TaskTemplate 的循环配置计算下一次应该创建 TaskInstance 的时间。
   * 这是 TaskTemplate 与 TaskInstance 的关键连接点：
   * - TaskTemplate 定义执行规则（如每天、每周等）
   * - TaskInstance 是具体的执行实例（如 2025-07-01 09:00 的具体任务）
   * 
   * @param template 要计算的 TaskTemplate
   * @returns 下一次执行时间（Date），如果是一次性任务则返回 null
   * @example
   * ```ts
   * const nextTime = taskTemplateService.calculateNextExecution(template);
   * // nextTime: Date | null
   * ```
   */
  calculateNextExecution(template: TaskTemplate): Date | null {
    if (template.timeConfig.recurrence.type === "none") {
      return null;
    }

    const instances = taskInstanceService.generateInstancesFromTemplate(
      template,
      1
    );
    return instances.length > 0
      ? new Date(instances[0].scheduledTime.timestamp)
      : null;
  }

  /**
   * 克隆 TaskTemplate
   * 
   * 创建 TaskTemplate 的副本，可选择性修改标题。
   * 保持所有配置不变，但生成新的 ID。
   * 
   * @param template 要克隆的 TaskTemplate
   * @param newTitle 新标题（可选）
   * @returns 克隆的 TaskTemplate 实例
   * @example
   * ```ts
   * const copy = taskTemplateService.cloneTemplate(template, "新副本标题");
   * ```
   */
  cloneTemplate(template: TaskTemplate, newTitle?: string): TaskTemplate {
    const cloned = template.clone();

    if (newTitle) {
      cloned.updateTitle(newTitle);
    } else {
      cloned.updateTitle(`${template.title} (副本)`);
    }

    return cloned;
  }
}

/**
 * 单例导出，方便直接使用
 * @example
 * import { taskTemplateService } from '.../taskTemplateService'
 * taskTemplateService.createFromMetaTemplate(...)
 */
export const taskTemplateService = new TaskTemplateService();