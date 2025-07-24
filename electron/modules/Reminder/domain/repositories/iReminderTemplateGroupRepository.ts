import type { ReminderTemplateGroup } from "../aggregates/reminderTemplateGroup";
import type { ReminderTemplate } from "../entities/reminderTemplate";

export interface IReminderTemplateGroupRepository {
  create(accountUuid: string, group: ReminderTemplateGroup): Promise<boolean>;
  update(accountUuid: string, group: ReminderTemplateGroup): Promise<boolean>;
  delete(accountUuid: string, uuid: string): Promise<void>;
  getAll(accountUuid: string): Promise<ReminderTemplateGroup[]>;
  getById(accountUuid: string, uuid: string): Promise<ReminderTemplateGroup | null>;
}
