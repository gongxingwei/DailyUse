/**
 * TaskTemplate 仓储接口 (Server)
 * 任务模板仓储
 */

import { TaskTemplate } from '../aggregates';
import type { TaskContracts } from '@dailyuse/contracts';

type TaskTemplateStatus = TaskContracts.TaskTemplateStatus;

/**
 * TaskTemplate 仓储接口
 *
 * DDD 仓储职责：
 * - 聚合根的持久化
 * - 聚合根的查询
 * - 是基础设施层的抽象
 */
export interface ITaskTemplateRepository {
  /**
   * 保存任务模板
   */
  save(template: TaskTemplate): Promise<void>;

  /**
   * 根据 UUID 查找任务模板
   */
  findByUuid(uuid: string): Promise<TaskTemplate | null>;

  /**
   * 根据 UUID 查找任务模板（包含子实体）
   */
  findByUuidWithChildren(uuid: string): Promise<TaskTemplate | null>;

  /**
   * 根据账户 UUID 查找任务模板
   */
  findByAccount(accountUuid: string): Promise<TaskTemplate[]>;

  /**
   * 根据状态查找任务模板
   */
  findByStatus(accountUuid: string, status: TaskTemplateStatus): Promise<TaskTemplate[]>;

  /**
   * 查找活跃的任务模板
   */
  findActiveTemplates(accountUuid: string): Promise<TaskTemplate[]>;

  /**
   * 根据文件夹查找任务模板
   */
  findByFolder(folderUuid: string): Promise<TaskTemplate[]>;

  /**
   * 根据目标查找任务模板
   */
  findByGoal(goalUuid: string): Promise<TaskTemplate[]>;

  /**
   * 根据标签查找任务模板
   */
  findByTags(accountUuid: string, tags: string[]): Promise<TaskTemplate[]>;

  /**
   * 查找需要生成实例的模板
   */
  findNeedGenerateInstances(toDate: number): Promise<TaskTemplate[]>;

  /**
   * 删除任务模板
   */
  delete(uuid: string): Promise<void>;

  /**
   * 软删除任务模板
   */
  softDelete(uuid: string): Promise<void>;

  /**
   * 恢复任务模板
   */
  restore(uuid: string): Promise<void>;
}
