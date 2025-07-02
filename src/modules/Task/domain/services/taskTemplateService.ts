import { TaskTemplate } from "../entities/taskTemplate";
import { TaskMetaTemplate } from "../entities/taskMetaTemplate";
import { taskInstanceService } from "./taskInstanceService";
import type {
  TaskTimeConfig,
  TaskReminderConfig,
} from "../types/task";
import { v4 as uuidv4 } from "uuid";

/**
 * TaskTemplate领域服务
 * 
 * 职责：
 * - 处理TaskTemplate实体的业务逻辑
 * - 管理TaskTemplate的创建、验证、状态转换
 * - 提供TaskTemplate相关的业务操作
 * 
 * 核心概念说明：
 * - TaskMetaTemplate: 任务元模板，定义任务类型的基础配置模板
 * - TaskTemplate: 任务模板，基于元模板创建的可重复使用的具体任务配置
 * - TaskInstance: 任务实例，基于TaskTemplate创建的具体执行任务
 * 
 * 层次关系: TaskMetaTemplate -> TaskTemplate -> TaskInstance
 */
export class TaskTemplateService {
  /**
   * 从TaskMetaTemplate创建TaskTemplate
   * 
   * 基于TaskMetaTemplate的默认配置创建一个新的TaskTemplate实例。
   * TaskMetaTemplate提供基础配置模板，TaskTemplate在此基础上可以进行个性化定制。
   * 
   * @param metaTemplate - 任务元模板，包含默认配置
   * @returns 新创建的TaskTemplate实例
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
   * 验证TaskTemplate状态转换是否合法
   * 
   * TaskTemplate具有生命周期状态，只允许特定的状态转换：
   * - draft: 草稿状态，可以转换为active或archived
   * - active: 活跃状态，可以转换为paused或archived  
   * - paused: 暂停状态，可以转换为active或archived
   * - archived: 归档状态，只能转换为active
   * 
   * @param template - 要检查的TaskTemplate
   * @param newStatus - 目标状态
   * @returns 是否允许状态转换
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
   * 验证TaskTemplate配置的有效性
   * 
   * 检查TaskTemplate的配置是否合法和完整，包括：
   * - 标题不能为空
   * - 时间配置的逻辑正确性
   * - 其他业务规则验证
   * 
   * @param template - 要验证的TaskTemplate
   * @returns 验证结果，包含是否有效和错误信息列表
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
   * 计算TaskTemplate的下一次执行时间
   * 
   * 根据TaskTemplate的循环配置计算下一次应该创建TaskInstance的时间。
   * 这是TaskTemplate与TaskInstance的关键连接点：
   * - TaskTemplate定义执行规则（如每天、每周等）
   * - TaskInstance是具体的执行实例（如2025-07-01 09:00的具体任务）
   * 
   * @param template - 要计算的TaskTemplate
   * @returns 下一次执行时间，如果是一次性任务则返回null
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
   * 克隆TaskTemplate
   * 
   * 创建TaskTemplate的副本，可选择性修改标题。
   * 保持所有配置不变，但生成新的ID。
   * 
   * @param template - 要克隆的TaskTemplate
   * @param newTitle - 新标题（可选）
   * @returns 克隆的TaskTemplate实例
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

export const taskTemplateService = new TaskTemplateService();
