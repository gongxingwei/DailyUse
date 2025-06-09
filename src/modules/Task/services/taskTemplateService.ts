import { useTaskStore } from "../stores/taskStore";
import { TaskReminderService } from "./taskReminderService";
import type { TaskTemplate } from "../types/task";
import type { TResponse } from "@/shared/types/response";
import { v4 as uuidv4, validate } from "uuid";
import { TimeUtils } from "../utils/timeUtils"
import { taskInstanceService } from "./taskInstanceService";
export class TaskTemplateService {
  private taskStore = useTaskStore();
  private reminderService = TaskReminderService.getInstance();

  async addTaskTemplate(tempTemplate: TaskTemplate): Promise<TResponse<void>> {
    try {
      const validation = this.validateTaskTemplateForAdd(tempTemplate);
      if (!validation.isValid) {
        return {
          success: false,
          message: `添加任务模板失败: ${validation.errors.join(", ")}`,
          data: undefined,
        };
      }

      // 添加到存储
      this.taskStore.addTaskTemplate(tempTemplate);
      await this.taskStore.saveTaskTemplates();

      return { success: true, message: "成功添加任务模板", data: undefined };
    } catch (error) {
      return {
        success: false,
        data: undefined,
        message: `添加任务模板异常: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }

  async updateTaskTemplate(template: TaskTemplate): Promise<TResponse<void>> {
    try {
      const validation = this.validateTaskTemplateForUpdate(template);
      if (!validation.isValid) {
        return {
          success: false,
          data: undefined,
          message: `更新任务模板失败: ${validation.errors.join(", ")}`,
        };
      }

      // 更新时间戳
      const updatedTemplate: TaskTemplate = {
        ...template,
        lifecycle: {
          ...template.lifecycle,
          updatedAt: TimeUtils.fromISOString(new Date().toISOString()),
        },
      };

      this.taskStore.updateTaskTemplate(updatedTemplate);
      return { success: true, message: "更新完成", data: undefined };
    } catch (error) {
      return {
        success: false,
        data: undefined,
        message: `更新任务模板异常: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }

  private validateTaskTemplateForAdd(template: TaskTemplate): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 基础字段验证
    if (!template.title?.trim()) {
      errors.push("任务标题不能为空");
    }

    if (template.title && template.title.length > 100) {
      errors.push("任务标题不能超过100个字符");
    }

    if (template.description && template.description.length > 1000) {
      errors.push("任务描述不能超过1000个字符");
    }

    // 时间配置验证
    if (!template.timeConfig) {
      errors.push("时间配置不能为空");
    } else {
      const timeErrors = this.validateTimeConfig(template.timeConfig);
      errors.push(...timeErrors);
    }

    // 元数据验证
    if (!template.metadata) {
      errors.push("元数据不能为空");
    } else {
      const metadataErrors = this.validateMetadata(template.metadata);
      errors.push(...metadataErrors);
    }

    // 优先级验证
    if (template.priority && ![1, 2, 3, 4].includes(template.priority)) {
      errors.push("优先级必须在1-4之间");
    }

    // 版本号验证
    if (typeof template.version !== "number" || template.version < 1) {
      errors.push("版本号必须是大于0的数字");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateTaskTemplateForUpdate(template: TaskTemplate): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // ID 验证
    if (!template.id || !validate(template.id)) {
      errors.push("任务模板ID无效");
    }

    // 复用添加时的验证逻辑
    const addValidation = this.validateTaskTemplateForAdd(template);
    errors.push(...addValidation.errors);

    // 生命周期状态验证
    if (
      !template.lifecycle?.status ||
      !["draft", "active", "paused", "archived"].includes(
        template.lifecycle.status
      )
    ) {
      errors.push("生命周期状态无效");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateTimeConfig(timeConfig: any): string[] {
    const errors: string[] = [];

    if (
      !timeConfig.type ||
      !["allDay", "timed", "timeRange"].includes(timeConfig.type)
    ) {
      errors.push("时间类型无效");
    }

    if (!timeConfig.baseTime) {
      errors.push("基础时间信息不能为空");
    } else {
      if (!timeConfig.baseTime.start) {
        errors.push("开始时间不能为空");
      }

      if (timeConfig.type === "timeRange" && !timeConfig.baseTime.end) {
        errors.push("时间段类型必须设置结束时间");
      }

      if (timeConfig.baseTime.start && timeConfig.baseTime.end) {
        if (
          timeConfig.baseTime.start.timestamp >=
          timeConfig.baseTime.end.timestamp
        ) {
          errors.push("结束时间必须晚于开始时间");
        }
      }
    }

    if (!timeConfig.recurrence) {
      errors.push("重复规则不能为空");
    }

    if (!timeConfig.reminder) {
      errors.push("提醒规则不能为空");
    }

    if (!timeConfig.timezone) {
      errors.push("时区信息不能为空");
    }

    return errors;
  }

  private validateMetadata(metadata: any): string[] {
    const errors: string[] = [];

    if (!metadata.category?.trim()) {
      errors.push("分类不能为空");
    }

    if (!Array.isArray(metadata.tags)) {
      errors.push("标签必须是数组");
    }

    if (
      metadata.estimatedDuration &&
      (typeof metadata.estimatedDuration !== "number" ||
        metadata.estimatedDuration <= 0)
    ) {
      errors.push("预估时长必须是大于0的数字");
    }

    if (
      !metadata.difficulty ||
      ![1, 2, 3, 4, 5].includes(metadata.difficulty)
    ) {
      errors.push("难度必须在1-5之间");
    }

    return errors;
  }
}

export const taskTemplateService = new TaskTemplateService();
