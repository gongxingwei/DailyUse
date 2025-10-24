import { ReminderTemplate } from '../entities/reminderTemplate';

export interface IReminderTemplateRepository {
  /**
   * 创建新的提醒模板
   * @param accountUuid 账户ID
   * @param template 提醒模板实体
   */
  create(accountUuid: string, template: ReminderTemplate): Promise<boolean>;

  /**
   * 更新现有的提醒模板
   * @param template 提醒模板实体
   */
  update(accountUuid: string, template: ReminderTemplate): Promise<boolean>;

  /**
   * 删除提醒模板
   * @param id 提醒模板 ID
   */
  delete(accountUuid: string, uuid: string): Promise<void>;

  /**
   * 获取所有提醒模板
   * @param accountUuid 账户ID
   */
  getAll(accountUuid: string): Promise<ReminderTemplate[]>;

  /**
   * 根据 ID 获取提醒模板
   * @param id 提醒模板 ID
   */
  getById(accountUuid: string, uuid: string): Promise<ReminderTemplate | null>;
}
