import { Injectable } from '@nestjs/common';
import { ScheduleTask } from '@dailyuse/domain-core';
import { ScheduleContracts } from '@dailyuse/contracts';
import type { IScheduleTaskRepository } from '../repositories/IRecurringScheduleTaskRepository';
import { SchedulerService } from './SchedulerService';
import { generateUUID } from '@dailyuse/utils';

/**
 * ScheduleTask 领域服务（统一设计）
 *
 * 职责：
 * 1. 创建和管理定时任务（使用统一的 Cron 表达式）
 * 2. 与 SchedulerService 集成
 * 3. 处理任务的 CRUD 操作
 */
@Injectable()
export class ScheduleTaskDomainService {
  constructor(
    private readonly repository: IScheduleTaskRepository,
    private readonly schedulerService: SchedulerService,
  ) {}

  /**
   * 创建新任务
   *
   * @example
   * // 单次任务
   * createTask({
   *   name: '提醒: 会议',
   *   cronExpression: '0 14 15 1 * 2025', // 2025年1月15日14:00
   *   sourceModule: 'reminder',
   *   sourceEntityId: 'template-uuid-123'
   * })
   *
   * @example
   * // 重复任务
   * createTask({
   *   name: '每日提醒',
   *   cronExpression: '0 9 * * 1-5', // 工作日每天9:00
   *   sourceModule: 'reminder',
   *   sourceEntityId: 'template-uuid-456'
   * })
   */
  async createTask(dto: ScheduleContracts.CreateScheduleTaskDTO): Promise<ScheduleTask> {
    const task = ScheduleTask.create({
      uuid: generateUUID(),
      name: dto.name,
      description: dto.description,
      cronExpression: dto.cronExpression,
      sourceModule: dto.sourceModule,
      sourceEntityId: dto.sourceEntityId,
      metadata: dto.metadata,
      enabled: dto.enabled ?? true,
    });

    // 保存到数据库
    const savedTask = await this.repository.save(task);

    // 注册到调度器
    await this.schedulerService.registerTask(savedTask);

    console.log(`✅ 创建定时任务成功: ${savedTask.name} (${savedTask.uuid})`);
    return savedTask;
  }

  /**
   * 更新任务
   */
  async updateTask(
    uuid: string,
    dto: ScheduleContracts.UpdateScheduleTaskDTO,
  ): Promise<ScheduleTask> {
    const task = await this.repository.findByUuid(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    // 更新基本信息
    if (dto.name || dto.description || dto.metadata) {
      task.updateBasicInfo({
        name: dto.name,
        description: dto.description,
        metadata: dto.metadata,
      });
    }

    // 更新 cron 表达式
    if (dto.cronExpression) {
      task.updateCronExpression(dto.cronExpression);
    }

    // 更新启用状态
    if (dto.enabled !== undefined) {
      if (dto.enabled) {
        task.enable();
      } else {
        task.disable();
      }
    }

    // 更新状态
    if (dto.status) {
      switch (dto.status) {
        case ScheduleContracts.ScheduleTaskStatus.PAUSED:
          task.pause();
          break;
        case ScheduleContracts.ScheduleTaskStatus.ACTIVE:
          task.resume();
          break;
        case ScheduleContracts.ScheduleTaskStatus.CANCELLED:
          task.cancel();
          break;
        case ScheduleContracts.ScheduleTaskStatus.COMPLETED:
          task.complete();
          break;
      }
    }

    // 保存到数据库
    const updatedTask = await this.repository.update(task);

    // 更新调度器
    await this.schedulerService.updateTask(updatedTask);

    console.log(`✅ 更新定时任务成功: ${updatedTask.name} (${updatedTask.uuid})`);
    return updatedTask;
  }

  /**
   * 删除任务
   */
  async deleteTask(uuid: string): Promise<void> {
    // 从调度器注销
    await this.schedulerService.unregisterTask(uuid);

    // 从数据库删除
    await this.repository.delete(uuid);

    console.log(`✅ 删除定时任务成功: ${uuid}`);
  }

  /**
   * 根据源模块和源实体 ID 查找任务
   */
  async findBySource(sourceModule: string, sourceEntityId: string): Promise<ScheduleTask[]> {
    return this.repository.findBySource(sourceModule, sourceEntityId);
  }

  /**
   * 根据源模块和源实体 ID 删除所有任务
   */
  async deleteBySource(sourceModule: string, sourceEntityId: string): Promise<void> {
    const tasks = await this.findBySource(sourceModule, sourceEntityId);

    for (const task of tasks) {
      await this.deleteTask(task.uuid);
    }

    console.log(
      `✅ 删除源实体的所有任务: ${sourceModule}/${sourceEntityId}, 共 ${tasks.length} 个`,
    );
  }

  /**
   * 加载并启动所有启用的任务
   */
  async loadAndStartEnabledTasks(): Promise<void> {
    const enabledTasks = await this.repository.findAllEnabled();

    for (const task of enabledTasks) {
      await this.schedulerService.registerTask(task);
    }

    console.log(`✅ 加载并启动了 ${enabledTasks.length} 个启用的任务`);
  }

  /**
   * 获取任务详情
   */
  async getTask(uuid: string): Promise<ScheduleTask | null> {
    return this.repository.findByUuid(uuid);
  }

  /**
   * 获取所有任务
   */
  async getAllTasks(): Promise<ScheduleTask[]> {
    return this.repository.findAll();
  }

  /**
   * 启用任务
   */
  async enableTask(uuid: string): Promise<void> {
    const task = await this.repository.findByUuid(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.enable();
    await this.repository.update(task);
    await this.schedulerService.registerTask(task);

    console.log(`✅ 启用任务: ${task.name} (${uuid})`);
  }

  /**
   * 禁用任务
   */
  async disableTask(uuid: string): Promise<void> {
    const task = await this.repository.findByUuid(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.disable();
    await this.repository.update(task);
    await this.schedulerService.unregisterTask(uuid);

    console.log(`✅ 禁用任务: ${task.name} (${uuid})`);
  }
}
