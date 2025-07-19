import { ReminderTemplate } from "../aggregates/reminderTemplate";

export interface IReminderTemplateRepository {

    setCurrentAccountUuid(accountUuid: string): void;
    /**
     * 创建新的提醒模板
     * @param template 提醒模板实体
     */
    create(template: ReminderTemplate): Promise<boolean>;
    
    /**
     * 更新现有的提醒模板
     * @param template 提醒模板实体
     */
    update(template: ReminderTemplate): Promise<boolean>;
    
    /**
     * 删除提醒模板
     * @param id 提醒模板 ID
     */
    delete(id: string): Promise<void>;
    
    /**
     * 获取所有提醒模板
     */
    getAll(): Promise<ReminderTemplate[]>;
    
    /**
     * 根据 ID 获取提醒模板
     * @param id 提醒模板 ID
     */
    getById(id: string): Promise<ReminderTemplate | null>;
}