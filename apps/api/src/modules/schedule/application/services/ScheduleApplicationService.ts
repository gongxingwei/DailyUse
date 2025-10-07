import type { ScheduleContracts } from '@dailyuse/contracts';
import {
  ScheduleStatus,
  ScheduleTaskType,
  SchedulePriority,
  AlertMethod,
} from '@dailyuse/contracts';
import { ScheduleDomainService } from '../../domain/services/ScheduleDomainService';
import type { RecurringScheduleTaskDomainService } from '@dailyuse/domain-server';

/**
 * Schedule Application Service
 * 调度模块应用服务 - 协调业务流程，处理复杂用例
 *
 * 职责：
 * 1. 协调领域服务和仓储
 * 2. 处理应用级业务逻辑（权限验证、配额检查）
 * 3. 发布领域事件
 * 4. 数据转换和验证
 */
export class ScheduleApplicationService {
  private static instance: ScheduleApplicationService;

  constructor(
    private scheduleDomainService: ScheduleDomainService,
    private recurringScheduleTaskDomainService?: RecurringScheduleTaskDomainService,
  ) {}

  /**
   * 创建实例时注入依赖
   */
  static async createInstance(
    scheduleDomainService: ScheduleDomainService,
    recurringScheduleTaskDomainService?: RecurringScheduleTaskDomainService,
  ): Promise<ScheduleApplicationService> {
    if (!scheduleDomainService) {
      throw new Error('ScheduleDomainService is required');
    }

    ScheduleApplicationService.instance = new ScheduleApplicationService(
      scheduleDomainService,
      recurringScheduleTaskDomainService,
    );
    return ScheduleApplicationService.instance;
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

  // ========== 调度任务管理 ==========

  /**
   * 创建调度任务
   */
  async createScheduleTask(
    accountUuid: string,
    request: ScheduleContracts.CreateScheduleTaskRequestDto,
  ): Promise<ScheduleContracts.ScheduleTaskResponseDto> {
    // 应用层可以添加额外的业务逻辑：
    // 1. 权限验证
    // 2. 配额检查
    // 3. 业务规则验证

    const task = await this.scheduleDomainService.createScheduleTask(accountUuid, request);
    return task.toClient();
  }

  /**
   * 获取调度任务
   */
  async getScheduleTask(
    accountUuid: string,
    uuid: string,
  ): Promise<ScheduleContracts.ScheduleTaskResponseDto | null> {
    const task = await this.scheduleDomainService.getScheduleTaskByUuid(accountUuid, uuid);
    return task ? task.toClient() : null;
  }

  /**
   * 获取调度任务列表
   */
  async getScheduleTasks(
    accountUuid: string,
    query: ScheduleContracts.IScheduleTaskQuery,
  ): Promise<ScheduleContracts.ScheduleTaskListResponseDto> {
    const result = await this.scheduleDomainService.getScheduleTasks(accountUuid, query);
    return {
      tasks: result.tasks.map((task) => task.toClient()),
      total: result.total,
      pagination: result.pagination || {
        offset: 0,
        limit: result.tasks.length,
        hasMore: false,
      },
    };
  }

  /**
   * 更新调度任务
   */
  async updateScheduleTask(
    accountUuid: string,
    uuid: string,
    request: ScheduleContracts.UpdateScheduleTaskRequestDto,
  ): Promise<ScheduleContracts.ScheduleTaskResponseDto> {
    const task = await this.scheduleDomainService.updateScheduleTask(accountUuid, uuid, request);
    return task.toClient();
  }

  /**
   * 删除调度任务
   */
  async deleteScheduleTask(accountUuid: string, uuid: string): Promise<void> {
    await this.scheduleDomainService.deleteScheduleTask(accountUuid, uuid);
  }

  // ========== 任务状态管理 ==========

  /**
   * 启用调度任务
   */
  async enableScheduleTask(
    accountUuid: string,
    uuid: string,
  ): Promise<ScheduleContracts.ScheduleTaskResponseDto> {
    const task = await this.scheduleDomainService.enableScheduleTask(accountUuid, uuid);
    return task.toClient();
  }

  /**
   * 禁用调度任务
   */
  async disableScheduleTask(
    accountUuid: string,
    uuid: string,
  ): Promise<ScheduleContracts.ScheduleTaskResponseDto> {
    const task = await this.scheduleDomainService.disableScheduleTask(accountUuid, uuid);
    return task.toClient();
  }

  /**
   * 暂停调度任务
   */
  async pauseScheduleTask(
    accountUuid: string,
    uuid: string,
  ): Promise<ScheduleContracts.ScheduleTaskResponseDto> {
    const task = await this.scheduleDomainService.pauseScheduleTask(accountUuid, uuid);
    return task.toClient();
  }

  /**
   * 恢复调度任务
   */
  async resumeScheduleTask(
    accountUuid: string,
    uuid: string,
  ): Promise<ScheduleContracts.ScheduleTaskResponseDto> {
    const task = await this.scheduleDomainService.resumeScheduleTask(accountUuid, uuid);
    return task.toClient();
  }

  /**
   * 执行调度任务
   */
  async executeScheduleTask(accountUuid: string, uuid: string, force?: boolean): Promise<any> {
    return await this.scheduleDomainService.executeScheduleTask(accountUuid, uuid, force);
  }

  // ========== 批量操作 ==========

  /**
   * 批量操作调度任务
   */
  async batchOperateScheduleTasks(
    accountUuid: string,
    request: ScheduleContracts.BatchScheduleTaskOperationRequestDto,
  ): Promise<ScheduleContracts.BatchScheduleTaskOperationResponseDto> {
    const results: ScheduleContracts.BatchScheduleTaskOperationResponseDto = {
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

  // ========== 快捷操作 ==========

  /**
   * 快速创建提醒任务
   */
  async createQuickReminder(
    accountUuid: string,
    request: ScheduleContracts.QuickReminderRequestDto,
  ): Promise<ScheduleContracts.ScheduleTaskResponseDto> {
    const createRequest: ScheduleContracts.CreateScheduleTaskRequestDto = {
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
        snoozeOptions: [5, 10, 15, 30],
      },
      tags: request.tags || [],
    };

    return await this.createScheduleTask(accountUuid, createRequest);
  }

  /**
   * 延后提醒
   */
  async snoozeReminder(
    accountUuid: string,
    request: ScheduleContracts.SnoozeReminderRequestDto,
  ): Promise<ScheduleContracts.ScheduleTaskResponseDto> {
    const snoozeTime = new Date(Date.now() + request.snoozeMinutes * 60 * 1000);

    return await this.updateScheduleTask(accountUuid, request.taskUuid, {
      scheduledTime: snoozeTime,
      status: ScheduleStatus.PENDING,
    });
  }

  /**
   * 获取即将到来的任务
   * 包含一次性任务(ScheduleTask)和周期性任务(RecurringScheduleTask)
   */
  async getUpcomingTasks(
    accountUuid: string,
    withinMinutes: number = 60,
    limit?: number,
  ): Promise<ScheduleContracts.UpcomingTasksResponseDto> {
    const now = new Date();
    const endTime = new Date(Date.now() + withinMinutes * 60 * 1000);

    // 1. 查询一次性任务 (ScheduleTask)
    const query: ScheduleContracts.IScheduleTaskQuery = {
      createdBy: accountUuid,
      status: [ScheduleStatus.PENDING],
      enabled: true,
      timeRange: {
        start: now,
        end: endTime,
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

    const oneTimeTasksResult = await this.getScheduleTasks(accountUuid, query);

    let allTasks: any[] = [
      ...oneTimeTasksResult.tasks.map((task) => ({
        uuid: task.uuid,
        name: task.name,
        taskType: task.taskType,
        scheduledTime: task.scheduledTime,
        priority: task.priority,
        alertConfig: task.alertConfig,
        minutesUntil: Math.floor((task.scheduledTime.getTime() - now.getTime()) / (1000 * 60)),
      })),
    ];

    // 2. 查询周期性任务 (RecurringScheduleTask)
    if (this.recurringScheduleTaskDomainService) {
      try {
        // 获取所有已启用的周期性任务（不能直接按 accountUuid 过滤，因为表中没有此字段）
        // 需要通过 sourceModule 和对应的模板来间接查询
        // 这里我们先获取所有启用的任务，然后根据 sourceModule 过滤
        const allRecurringTasks = await this.recurringScheduleTaskDomainService.getAllTasks();

        // 过滤出在时间范围内且已启用的周期性任务
        // 注意：这里无法直接过滤 accountUuid，需要在应用层通过 sourceEntityId 关联查询
        // 为了性能考虑，我们只处理 enabled 和时间范围的过滤
        const upcomingRecurringTasks = allRecurringTasks
          .filter((task: any) => {
            const nextRun = task.nextRunAt;
            return (
              task.enabled &&
              task.status === 'ACTIVE' &&
              nextRun &&
              nextRun >= now &&
              nextRun <= endTime
            );
          })
          .map((task: any) => ({
            uuid: task.uuid,
            name: task.name,
            taskType: 'RECURRING' as ScheduleTaskType,
            scheduledTime: task.nextRunAt,
            priority: task.priority || SchedulePriority.NORMAL,
            alertConfig: task.metadata?.alertConfig,
            minutesUntil: Math.floor((task.nextRunAt.getTime() - now.getTime()) / (1000 * 60)),
          }));

        allTasks = [...allTasks, ...upcomingRecurringTasks];
      } catch (error) {
        console.error('[ScheduleApplicationService] 获取周期性任务失败:', error);
        // 继续执行，只返回一次性任务
      }
    }

    // 3. 按执行时间排序
    allTasks.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());

    // 4. 限制数量
    const limitedTasks = allTasks.slice(0, limit || 100);

    return {
      tasks: limitedTasks,
      withinHours: withinMinutes / 60,
      queryTime: now,
    };
  }

  /**
   * 获取统计信息
   */
  async getStatistics(accountUuid: string): Promise<ScheduleContracts.IScheduleTaskStatistics> {
    // 这个方法需要通过仓储层直接调用，因为统计逻辑比较复杂
    // 实际实现中应该通过仓储接口获取
    throw new Error('Statistics method not yet implemented');
  }

  /**
   * 初始化模块数据
   * 登录时调用，同步所有数据
   */
  async initializeModuleData(accountUuid: string): Promise<void> {
    console.log(`Initializing schedule module data for account: ${accountUuid}`);
    // 这里可以添加具体的初始化逻辑
  }
}
