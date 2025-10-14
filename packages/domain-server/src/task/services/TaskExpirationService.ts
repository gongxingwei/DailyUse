/**
 * TaskExpirationService - 任务过期处理服务
 *
 * 领域服务职责：
 * - 检查并标记过期的任务实例
 * - 处理过期任务的业务逻辑
 */

import { TaskInstance } from '../aggregates';
import type { ITaskInstanceRepository } from '../repositories';

export class TaskExpirationService {
  constructor(private readonly instanceRepository: ITaskInstanceRepository) {}

  /**
   * 检查并标记过期的任务实例
   */
  async checkAndMarkExpiredInstances(accountUuid: string): Promise<TaskInstance[]> {
    // 查找所有过期的任务实例
    const overdueInstances = await this.instanceRepository.findOverdueInstances(accountUuid);

    // 标记为过期
    const expiredInstances: TaskInstance[] = [];
    for (const instance of overdueInstances) {
      if (instance.canSkip()) {
        instance.markExpired();
        await this.instanceRepository.save(instance);
        expiredInstances.push(instance);
      }
    }

    return expiredInstances;
  }

  /**
   * 检查单个实例是否过期
   */
  async checkInstanceExpiration(instanceUuid: string): Promise<boolean> {
    const instance = await this.instanceRepository.findByUuid(instanceUuid);
    if (!instance) {
      return false;
    }

    if (instance.isOverdue() && instance.canSkip()) {
      instance.markExpired();
      await this.instanceRepository.save(instance);
      return true;
    }

    return false;
  }

  /**
   * 批量检查实例是否过期
   */
  async checkInstancesExpiration(instanceUuids: string[]): Promise<Map<string, boolean>> {
    const result = new Map<string, boolean>();

    for (const uuid of instanceUuids) {
      const isExpired = await this.checkInstanceExpiration(uuid);
      result.set(uuid, isExpired);
    }

    return result;
  }

  /**
   * 定时任务：检查所有账户的过期任务
   */
  async scheduleExpirationCheck(accountUuids: string[]): Promise<void> {
    for (const accountUuid of accountUuids) {
      await this.checkAndMarkExpiredInstances(accountUuid);
    }
  }

  /**
   * 获取指定日期范围内的过期任务数量
   */
  async getExpiredInstanceCount(
    accountUuid: string,
    startDate: number,
    endDate: number,
  ): Promise<number> {
    const instances = await this.instanceRepository.findByDateRange(
      accountUuid,
      startDate,
      endDate,
    );

    return instances.filter((i) => i.status === 'EXPIRED').length;
  }
}
