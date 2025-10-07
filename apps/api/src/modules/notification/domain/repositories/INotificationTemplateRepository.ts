import { NotificationTemplate } from '../aggregates/NotificationTemplate';
import { NotificationType } from '@dailyuse/contracts';

/**
 * 模板查询选项
 */
export interface TemplateQueryOptions {
  type?: NotificationType;
  enabled?: boolean;
  nameContains?: string;
  limit?: number;
  offset?: number;
}

/**
 * NotificationTemplate 仓储接口
 *
 * 职责：
 * - 持久化 NotificationTemplate 聚合根
 * - 查询模板
 * - 管理模板库
 */
export interface INotificationTemplateRepository {
  /**
   * 保存模板（创建或更新）
   */
  save(template: NotificationTemplate): Promise<NotificationTemplate>;

  /**
   * 根据 UUID 查找模板
   */
  findByUuid(uuid: string): Promise<NotificationTemplate | null>;

  /**
   * 根据名称查找模板
   */
  findByName(name: string): Promise<NotificationTemplate | null>;

  /**
   * 根据类型查找模板
   */
  findByType(type: NotificationType): Promise<NotificationTemplate[]>;

  /**
   * 查询模板
   */
  query(options: TemplateQueryOptions): Promise<{
    templates: NotificationTemplate[];
    total: number;
  }>;

  /**
   * 获取所有启用的模板
   */
  findAllEnabled(): Promise<NotificationTemplate[]>;

  /**
   * 检查模板名称是否已存在
   */
  existsByName(name: string, excludeUuid?: string): Promise<boolean>;

  /**
   * 删除模板
   */
  delete(uuid: string): Promise<void>;
}
