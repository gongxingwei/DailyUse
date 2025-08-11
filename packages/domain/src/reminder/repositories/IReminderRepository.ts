import { ReminderTemplate } from '../entities/ReminderTemplate';
import { ReminderTemplateGroup } from '../aggregates/ReminderTemplateGroup';

export interface IReminderTemplateRepository {
  findById(id: string): Promise<ReminderTemplate | null>;
  findByGroupId(groupId: string): Promise<ReminderTemplate[]>;
  save(template: ReminderTemplate): Promise<void>;
  delete(templateId: string): Promise<void>;
}

export interface IReminderTemplateGroupRepository {
  findById(id: string): Promise<ReminderTemplateGroup | null>;
  findAll(): Promise<ReminderTemplateGroup[]>;
  findByName(name: string): Promise<ReminderTemplateGroup | null>;
  save(group: ReminderTemplateGroup): Promise<void>;
  delete(groupId: string): Promise<void>;
}
