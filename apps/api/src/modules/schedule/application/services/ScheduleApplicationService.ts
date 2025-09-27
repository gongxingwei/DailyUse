import type { ScheduleContracts } from '@dailyuse/contracts';
import {
  ScheduleStatus,
  ScheduleTaskType,
  SchedulePriority,
  AlertMethod,
} from '@dailyuse/contracts';
import { ScheduleDomainService } from '../../domain/services/ScheduleDomainService';

type CreateScheduleTaskRequestDto = ScheduleContracts.CreateScheduleTaskRequestDto;
type UpdateScheduleTaskRequestDto = ScheduleContracts.UpdateScheduleTaskRequestDto;
type ScheduleTaskResponseDto = ScheduleContracts.ScheduleTaskResponseDto;
type ScheduleTaskListResponseDto = ScheduleContracts.ScheduleTaskListResponseDto;
type IScheduleTaskQuery = ScheduleContracts.IScheduleTaskQuery;
type IScheduleTaskStatistics = ScheduleContracts.IScheduleTaskStatistics;
type UpcomingTasksResponseDto = ScheduleContracts.UpcomingTasksResponseDto;
type BatchScheduleTaskOperationRequestDto = ScheduleContracts.BatchScheduleTaskOperationRequestDto;
type BatchScheduleTaskOperationResponseDto =
  ScheduleContracts.BatchScheduleTaskOperationResponseDto;
type QuickReminderRequestDto = ScheduleContracts.QuickReminderRequestDto;
type SnoozeReminderRequestDto = ScheduleContracts.SnoozeReminderRequestDto;

/**
 * Schedule Application Service
 * 调度模块应用服务 - 协调业务流程，处理复杂用例
 */
export class ScheduleApplicationService {
  private static instance: ScheduleApplicationService;

  constructor(private scheduleDomainService: ScheduleDomainService) {}

  /**
   * 创建实例时注入依赖，支持默认选项
   */
  static async createInstance(
    scheduleDomainService?: ScheduleDomainService,
  ): Promise<ScheduleApplicationService> {
    if (!scheduleDomainService) {
      throw new Error('ScheduleDomainService is required');
    }

    return new ScheduleApplicationService(scheduleDomainService);
  }

  /**
   * 获取服务实例
   */
  static async getInstance(): Promise<ScheduleApplicationService> {
    if (!ScheduleApplicationService.instance) {
      throw new Error('ScheduleApplicationService not initialized. Call createInstance() first.');
    }
    return ScheduleApplicationService.instance;
  }

  // ========== 应用层协调逻辑 ==========

  /**
   * 创建调度任务并执行应用层业务逻辑
   */
  async createScheduleTaskWithValidation(
    accountUuid: string,
    request: CreateScheduleTaskRequestDto,
  ): Promise<ScheduleTaskResponseDto> {
    // 应用层可以添加额外的业务逻辑，比如：
    // 1. 权限验证
    // 2. 配额检查
    // 3. 业务规则验证
    // 4. 事件发布等

    // 调用领域服务
    const task = await this.scheduleDomainService.createScheduleTask(accountUuid, request);

    // 发布创建事件（如果需要）
    // await this.publishScheduleTaskCreatedEvent(task);

    return task;
  }

  /**
   * 获取调度任务
   */
  async getScheduleTask(
    accountUuid: string,
    uuid: string,
  ): Promise<ScheduleTaskResponseDto | null> {
    return await this.scheduleDomainService.getScheduleTaskByUuid(accountUuid, uuid);
  }

  /**
   * 获取调度任务列表
   */
  async getScheduleTasks(
    accountUuid: string,
    query: IScheduleTaskQuery,
  ): Promise<ScheduleTaskListResponseDto> {
    return await this.scheduleDomainService.getScheduleTasks(accountUuid, query);
  }

  /**
   * 更新调度任务
   */
  async updateScheduleTask(
    accountUuid: string,
    uuid: string,
    request: UpdateScheduleTaskRequestDto,
  ): Promise<ScheduleTaskResponseDto> {
    const updatedTask = await this.scheduleDomainService.updateScheduleTask(
      accountUuid,
      uuid,
      request,
    );

    // 发布更新事件（如果需要）
    // await this.publishScheduleTaskUpdatedEvent(updatedTask);

    return updatedTask;
  }

  /**
   * 删除调度任务
   */
  async deleteScheduleTask(accountUuid: string, uuid: string): Promise<void> {
    await this.scheduleDomainService.deleteScheduleTask(accountUuid, uuid);

    // 发布删除事件（如果需要）
    // await this.publishScheduleTaskDeletedEvent(uuid);
  }

  /**
   * 启用调度任务
   */
  async enableScheduleTask(accountUuid: string, uuid: string): Promise<ScheduleTaskResponseDto> {
    const task = await this.scheduleDomainService.enableScheduleTask(accountUuid, uuid);

    // 发布启用事件（如果需要）
    // await this.publishScheduleTaskEnabledEvent(task);

    return task;
  }

  /**
   * 禁用调度任务
   */
  async disableScheduleTask(accountUuid: string, uuid: string): Promise<ScheduleTaskResponseDto> {
    const task = await this.scheduleDomainService.disableScheduleTask(accountUuid, uuid);

    // 发布禁用事件（如果需要）
    // await this.publishScheduleTaskDisabledEvent(task);

    return task;
  }

  /**
   * 暂停调度任务
   */
  async pauseScheduleTask(accountUuid: string, uuid: string): Promise<ScheduleTaskResponseDto> {
    return await this.scheduleDomainService.pauseScheduleTask(accountUuid, uuid);
  }

  /**
   * 恢复调度任务
   */
  async resumeScheduleTask(accountUuid: string, uuid: string): Promise<ScheduleTaskResponseDto> {
    return await this.scheduleDomainService.resumeScheduleTask(accountUuid, uuid);
  }

  /**
   * 执行调度任务
   */
  async executeScheduleTask(accountUuid: string, uuid: string, force?: boolean): Promise<any> {
    return await this.scheduleDomainService.executeScheduleTask(accountUuid, uuid, force);
  }

  /**
   * 批量操作调度任务
   */
  async batchOperateScheduleTasks(
    accountUuid: string,
    request: BatchScheduleTaskOperationRequestDto,
  ): Promise<BatchScheduleTaskOperationResponseDto> {
    const results: BatchScheduleTaskOperationResponseDto = {
      success: [],
      failed: [],
      summary: {
        total: request.taskUuids.length,
        success: 0,
        failed: 0,
      },
    };

    for (const taskUuid of request.taskUuids) {
      try {
        switch (request.operation) {
          case 'enable':
            await this.enableScheduleTask(accountUuid, taskUuid);
            break;
          case 'disable':
            await this.disableScheduleTask(accountUuid, taskUuid);
            break;
          case 'pause':
            await this.pauseScheduleTask(accountUuid, taskUuid);
            break;
          case 'resume':
            await this.resumeScheduleTask(accountUuid, taskUuid);
            break;
          case 'delete':
            await this.deleteScheduleTask(accountUuid, taskUuid);
            break;
          case 'cancel':
            // 取消操作可以通过更新状态实现
            await this.updateScheduleTask(accountUuid, taskUuid, {
              status: ScheduleStatus.CANCELLED,
            });
            break;
          default:
            throw new Error(`Unsupported operation: ${request.operation}`);
        }

        results.success.push(taskUuid);
        results.summary.success++;
      } catch (error) {
        results.failed.push({
          taskUuid,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        results.summary.failed++;
      }
    }

    return results;
  }

  /**
   * 快速创建提醒任务
   */
  async createQuickReminder(
    accountUuid: string,
    request: QuickReminderRequestDto,
  ): Promise<ScheduleTaskResponseDto> {
    // 将快速提醒转换为完整的调度任务创建请求
    const createRequest: CreateScheduleTaskRequestDto = {
      name: request.title,
      description: request.message,
      taskType: ScheduleTaskType.GENERAL_REMINDER,
      payload: {
        type: ScheduleTaskType.GENERAL_REMINDER,
        data: {
          title: request.title,
          message: request.message,
        },
      },
      scheduledTime: request.reminderTime,
      priority: request.priority || SchedulePriority.NORMAL,
      alertConfig: {
        methods: request.methods || [AlertMethod.POPUP, AlertMethod.SYSTEM_NOTIFICATION],
        allowSnooze: request.allowSnooze !== false,
        snoozeOptions: [5, 10, 15, 30], // 默认延后选项
      },
      tags: request.tags || [],
    };

    return await this.createScheduleTaskWithValidation(accountUuid, createRequest);
  }

  /**
   * 延后提醒
   */
  async snoozeReminder(
    accountUuid: string,
    request: SnoozeReminderRequestDto,
  ): Promise<ScheduleTaskResponseDto> {
    const snoozeTime = new Date(Date.now() + request.snoozeMinutes * 60 * 1000);

    return await this.updateScheduleTask(accountUuid, request.taskUuid, {
      scheduledTime: snoozeTime,
      status: ScheduleStatus.PENDING, // 重置为待执行状态
    });
  }

  /**
   * 获取即将到来的任务
   */
  async getUpcomingTasks(
    accountUuid: string,
    withinMinutes: number = 60,
    limit?: number,
  ): Promise<UpcomingTasksResponseDto> {
    // 这里需要通过仓储层获取，但由于我们的领域服务没有直接提供这个方法，
    // 我们需要通过查询实现
    const query: IScheduleTaskQuery = {
      createdBy: accountUuid,
      status: [ScheduleStatus.PENDING],
      enabled: true,
      timeRange: {
        start: new Date(),
        end: new Date(Date.now() + withinMinutes * 60 * 1000),
      },
      sorting: {
        field: 'scheduledTime',
        order: 'asc',
      },
      pagination: {
        offset: 0,
        limit: limit || 100,
      },
    };

    const result = await this.getScheduleTasks(accountUuid, query);

    // 转换为即将到来的任务格式
    const now = new Date();
    return {
      tasks: result.tasks.map((task) => ({
        uuid: task.uuid,
        name: task.name,
        taskType: task.taskType,
        scheduledTime: task.scheduledTime,
        priority: task.priority,
        alertConfig: task.alertConfig,
        minutesUntil: Math.floor((task.scheduledTime.getTime() - now.getTime()) / (1000 * 60)),
      })),
      withinHours: withinMinutes / 60,
      queryTime: now,
    };
  }

  /**
   * 获取统计信息
   */
  async getStatistics(accountUuid: string): Promise<IScheduleTaskStatistics> {
    // 这个方法需要通过仓储层直接调用，因为统计逻辑比较复杂
    // 实际实现中应该通过仓储接口获取
    throw new Error('Statistics method not yet implemented');
  }

  /**
   * 初始化模块数据
   * 登录时调用，同步所有数据
   */
  async initializeModuleData(accountUuid: string): Promise<void> {
    // 执行初始化逻辑，比如：
    // 1. 加载用户的调度任务
    // 2. 检查和恢复中断的任务
    // 3. 清理过期任务等

    console.log(`Initializing schedule module data for account: ${accountUuid}`);

    // 这里可以添加具体的初始化逻辑
    // 比如获取用户的活跃任务并进行状态检查等
  }

  // ========== 私有辅助方法 ==========

  /**
   * 验证账户权限（示例方法）
   */
  private async validateAccountPermission(accountUuid: string, taskUuid: string): Promise<void> {
    const task = await this.getScheduleTask(accountUuid, taskUuid);
    if (!task) {
      throw new Error('Task not found or access denied');
    }
  }
}
