import { useTaskStore } from "../stores/taskStore";
import type { TaskTemplate } from "../types/task";
import type { TResponse } from "@/shared/types/response";
import { TimeUtils } from "../utils/timeUtils";
import { TaskTemplateValidator } from "./validation";

export class TaskTemplateService {
  private taskStore = useTaskStore();

  async addTaskTemplate(tempTemplate: TaskTemplate): Promise<TResponse<void>> {
    try {
      // 使用新的验证系统
      const validation = TaskTemplateValidator.validateForCreate(tempTemplate);
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
      // 使用新的验证系统
      const validation = TaskTemplateValidator.validateForUpdate(template);
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
        }`,      };
    }
  }
}

export const taskTemplateService = new TaskTemplateService();
