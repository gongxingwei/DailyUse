import type { IScheduleTaskRepository } from '@dailyuse/domain-server';
import { ScheduleTask } from '@dailyuse/domain-core';
import type { ScheduleContracts } from '@dailyuse/contracts';
import { ScheduleStatus } from '@dailyuse/contracts';

/**
 * Schedule 领域服务
 *
 * 职责：
 * - 处理 ScheduleTask 的核心业务逻辑
 * - 通过 IScheduleTaskRepository 接口操作数据
 * - 验证业务规则（时间范围、重复规则、提醒配置等）
 * - 管理调度任务的状态转换
 *
 * 设计原则：
 * - 依赖倒置：只依赖 IScheduleTaskRepository 接口
 * - 单一职责：只处理 Schedule 相关的领域逻辑
 * - 与技术解耦：无任何基础设施细节
 * - 可移植：可安全移动到 @dailyuse/domain-server 包
 */
export class ScheduleDomainService {
  constructor(private readonly scheduleRepository: IScheduleTaskRepository) {}

  // ==================== ScheduleTask CRUD 操作 ====================

  /**
   * 创建调度任务
   * 业务规则：
   * 1. 调度时间不能是过去时间
   * 2. 重复规则合理性验证
   * 3. 提醒配置验证
   * 4. 任务数量限制检查（最多1000个活跃任务）
   */
  async createScheduleTask(
    accountUuid: string,
    request: ScheduleContracts.CreateScheduleTaskRequestDto,
  ): Promise<ScheduleTask> {
    // 业务规则验证
    await this.validateScheduleTaskCreation(accountUuid, request);

    // 创建任务
    return await this.scheduleRepository.create(request, accountUuid);
  }

  /**
   * 获取调度任务
   */
  async getScheduleTaskByUuid(accountUuid: string, uuid: string): Promise<ScheduleTask | null> {
    const task = await this.scheduleRepository.findByUuid(uuid);

    // 验证权限 - 通过 metadata.accountUuid 检查
    if (task && task.metadata?.accountUuid !== accountUuid) {
      return null;
    }

    return task;
  }

  /**
   * 获取调度任务列表
   */
  async getScheduleTasks(
    accountUuid: string,
    query: ScheduleContracts.IScheduleTaskQuery,
  ): Promise<{
    tasks: ScheduleTask[];
    total: number;
    pagination?: {
      offset: number;
      limit: number;
      hasMore: boolean;
    };
  }> {
    // 添加账户过滤
    const accountQuery: ScheduleContracts.IScheduleTaskQuery = {
      ...query,
      createdBy: accountUuid,
    };

    return await this.scheduleRepository.findMany(accountQuery);
  }

  /**
   * 更新调度任务
   * 业务规则：
   * 1. 任务必须存在
   * 2. 更新后的时间范围合理
   * 3. 重复规则和提醒配置验证
   */
  async updateScheduleTask(
    accountUuid: string,
    uuid: string,
    request: ScheduleContracts.UpdateScheduleTaskRequestDto,
  ): Promise<ScheduleTask> {
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
    const existing = await this.getScheduleTaskByUuid(accountUuid, uuid);
    if (!existing) {
      throw new Error('Schedule task not found or access denied');
    }

    await this.scheduleRepository.delete(uuid);
  }

  // ==================== ScheduleTask 状态管理 ====================

  /**
   * 启用调度任务
   */
  async enableScheduleTask(accountUuid: string, uuid: string): Promise<ScheduleTask> {
    return await this.scheduleRepository.enable(uuid);
  }

  /**
   * 禁用调度任务
   */
  async disableScheduleTask(accountUuid: string, uuid: string): Promise<ScheduleTask> {
    return await this.scheduleRepository.disable(uuid);
  }

  /**
   * 暂停调度任务
   */
  async pauseScheduleTask(accountUuid: string, uuid: string): Promise<ScheduleTask> {
    return await this.scheduleRepository.pause(uuid);
  }

  /**
   * 恢复调度任务
   */
  async resumeScheduleTask(accountUuid: string, uuid: string): Promise<ScheduleTask> {
    return await this.scheduleRepository.resume(uuid);
  }

  /**
   * 执行调度任务
   */
  async executeScheduleTask(accountUuid: string, uuid: string, force?: boolean): Promise<any> {
    const task = await this.getScheduleTaskByUuid(accountUuid, uuid);
    if (!task) {
      throw new Error('Schedule task not found or access denied');
    }

    // TODO: Implement task execution logic
    return { success: true, message: 'Task execution initiated', taskUuid: uuid };
  }

  // ==================== 私有方法 - 业务规则验证 ====================

  /**
   * 验证调度任务创建的业务规则
   */
  private async validateScheduleTaskCreation(
    accountUuid: string,
    request: ScheduleContracts.CreateScheduleTaskRequestDto,
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

    // 4. 验证任务数量限制
    const existingTasks = await this.scheduleRepository.findMany({
      createdBy: accountUuid,
      status: [ScheduleStatus.PENDING, ScheduleStatus.RUNNING],
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
    request: ScheduleContracts.UpdateScheduleTaskRequestDto,
  ): Promise<void> {
    // 1. 验证调度时间不能是过去时间
    if (request.scheduledTime && request.scheduledTime < new Date()) {
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
