import type { IScheduleTaskRepository } from '@dailyuse/domain-server';
import type { ScheduleContracts } from '@dailyuse/contracts';

type CreateScheduleTaskRequestDto = ScheduleContracts.CreateScheduleTaskRequestDto;
type UpdateScheduleTaskRequestDto = ScheduleContracts.UpdateScheduleTaskRequestDto;
type ScheduleTaskResponseDto = ScheduleContracts.ScheduleTaskResponseDto;
type ScheduleTaskListResponseDto = ScheduleContracts.ScheduleTaskListResponseDto;
type IScheduleTaskQuery = ScheduleContracts.IScheduleTaskQuery;

/**
 * Schedule Domain Service
 * 调度模块领域服务 - 处理核心业务逻辑
 */
export class ScheduleDomainService {
  constructor(private scheduleRepository: IScheduleTaskRepository) {}

  /**
   * 创建调度任务 - 包含业务规则验证
   */
  async createScheduleTask(
    accountUuid: string,
    request: CreateScheduleTaskRequestDto,
  ): Promise<ScheduleTaskResponseDto> {
    // 业务规则验证
    await this.validateScheduleTaskCreation(accountUuid, request);

    // 创建任务
    return await this.scheduleRepository.create(request, accountUuid);
  }

  /**
   * 获取调度任务
   */
  async getScheduleTaskByUuid(
    accountUuid: string,
    uuid: string,
  ): Promise<ScheduleTaskResponseDto | null> {
    const task = await this.scheduleRepository.findByUuid(uuid);

    // 验证权限
    if (task && task.createdBy !== accountUuid) {
      return null; // 或抛出权限错误
    }

    return task;
  }

  /**
   * 获取调度任务列表
   */
  async getScheduleTasks(
    accountUuid: string,
    query: IScheduleTaskQuery,
  ): Promise<ScheduleTaskListResponseDto> {
    // 添加账户过滤
    const accountQuery: IScheduleTaskQuery = {
      ...query,
      createdBy: accountUuid, // 确保只获取该账户的任务
    };

    return await this.scheduleRepository.findMany(accountQuery);
  }

  /**
   * 更新调度任务
   */
  async updateScheduleTask(
    accountUuid: string,
    uuid: string,
    request: UpdateScheduleTaskRequestDto,
  ): Promise<ScheduleTaskResponseDto> {
    // 验证权限
    const existing = await this.getScheduleTaskByUuid(accountUuid, uuid);
    if (!existing) {
      throw new Error('Schedule task not found or access denied');
    }

    // 业务规则验证
    await this.validateScheduleTaskUpdate(accountUuid, uuid, request);

    return await this.scheduleRepository.update(uuid, request);
  }

  /**
   * 删除调度任务
   */
  async deleteScheduleTask(accountUuid: string, uuid: string): Promise<void> {
    // 验证权限
    const existing = await this.getScheduleTaskByUuid(accountUuid, uuid);
    if (!existing) {
      throw new Error('Schedule task not found or access denied');
    }

    await this.scheduleRepository.delete(uuid);
  }

  /**
   * 启用调度任务
   */
  async enableScheduleTask(accountUuid: string, uuid: string): Promise<ScheduleTaskResponseDto> {
    return await this.scheduleRepository.enable(uuid);
  }

  /**
   * 禁用调度任务
   */
  async disableScheduleTask(accountUuid: string, uuid: string): Promise<ScheduleTaskResponseDto> {
    return await this.scheduleRepository.disable(uuid);
  }

  /**
   * 暂停调度任务
   */
  async pauseScheduleTask(accountUuid: string, uuid: string): Promise<ScheduleTaskResponseDto> {
    return await this.scheduleRepository.pause(uuid);
  }

  /**
   * 恢复调度任务
   */
  async resumeScheduleTask(accountUuid: string, uuid: string): Promise<ScheduleTaskResponseDto> {
    return await this.scheduleRepository.resume(uuid);
  }

  /**
   * 执行调度任务
   */
  async executeScheduleTask(accountUuid: string, uuid: string, force?: boolean): Promise<any> {
    // 验证权限
    const task = await this.getScheduleTaskByUuid(accountUuid, uuid);
    if (!task) {
      throw new Error('Schedule task not found or access denied');
    }

    return await this.scheduleRepository.execute(uuid, force);
  }

  // ========== 私有方法 - 业务规则验证 ==========

  /**
   * 验证调度任务创建的业务规则
   */
  private async validateScheduleTaskCreation(
    accountUuid: string,
    request: CreateScheduleTaskRequestDto,
  ): Promise<void> {
    // 1. 验证调度时间不能是过去时间
    if (request.scheduledTime < new Date()) {
      throw new Error('Scheduled time cannot be in the past');
    }

    // 2. 验证重复规则的合理性
    if (request.recurrence) {
      this.validateRecurrenceRule(request.recurrence);
    }

    // 3. 验证提醒配置
    if (request.alertConfig) {
      this.validateAlertConfig(request.alertConfig);
    }

    // 4. 验证任务数量限制（可选）
    const existingTasks = await this.scheduleRepository.findMany({
      createdBy: accountUuid,
      status: ['PENDING', 'RUNNING'],
      pagination: { offset: 0, limit: 1000 },
    });

    if (existingTasks.total > 1000) {
      throw new Error('Maximum number of active schedule tasks exceeded (1000)');
    }
  }

  /**
   * 验证调度任务更新的业务规则
   */
  private async validateScheduleTaskUpdate(
    accountUuid: string,
    uuid: string,
    request: UpdateScheduleTaskRequestDto,
  ): Promise<void> {
    // 1. 验证调度时间不能是过去时间（如果要更新的话）
    if (request.scheduledTime && request.scheduledTime < new Date()) {
      throw new Error('Scheduled time cannot be in the past');
    }

    // 2. 验证重复规则的合理性（如果要更新的话）
    if (request.recurrence) {
      this.validateRecurrenceRule(request.recurrence);
    }

    // 3. 验证提醒配置（如果要更新的话）
    if (request.alertConfig) {
      this.validateAlertConfig(request.alertConfig);
    }
  }

  /**
   * 验证重复规则
   */
  private validateRecurrenceRule(recurrence: ScheduleContracts.IRecurrenceRule): void {
    // 验证间隔值
    if (recurrence.interval <= 0) {
      throw new Error('Recurrence interval must be greater than 0');
    }

    // 验证结束日期
    if (recurrence.endDate && recurrence.endDate < new Date()) {
      throw new Error('Recurrence end date cannot be in the past');
    }

    // 验证最大执行次数
    if (recurrence.maxOccurrences && recurrence.maxOccurrences <= 0) {
      throw new Error('Maximum occurrences must be greater than 0');
    }

    // 验证星期几设置
    if (recurrence.daysOfWeek) {
      const validDays = recurrence.daysOfWeek.every((day) => day >= 0 && day <= 6);
      if (!validDays) {
        throw new Error('Days of week must be between 0 (Sunday) and 6 (Saturday)');
      }
    }

    // 验证月份中的天数
    if (recurrence.dayOfMonth && (recurrence.dayOfMonth < 1 || recurrence.dayOfMonth > 31)) {
      throw new Error('Day of month must be between 1 and 31');
    }
  }

  /**
   * 验证提醒配置
   */
  private validateAlertConfig(alertConfig: ScheduleContracts.IAlertConfig): void {
    // 验证提醒方式不为空
    if (!alertConfig.methods || alertConfig.methods.length === 0) {
      throw new Error('At least one alert method must be specified');
    }

    // 验证音量范围
    if (alertConfig.soundVolume && (alertConfig.soundVolume < 0 || alertConfig.soundVolume > 100)) {
      throw new Error('Sound volume must be between 0 and 100');
    }

    // 验证弹窗持续时间
    if (alertConfig.popupDuration && alertConfig.popupDuration < 0) {
      throw new Error('Popup duration must be non-negative');
    }

    // 验证延后选项
    if (alertConfig.snoozeOptions) {
      const validOptions = alertConfig.snoozeOptions.every((option) => option > 0);
      if (!validOptions) {
        throw new Error('Snooze options must be positive numbers');
      }
    }
  }
}
