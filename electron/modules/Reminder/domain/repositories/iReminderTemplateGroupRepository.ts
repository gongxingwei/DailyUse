import type { ReminderTemplateGroup } from "../aggregates/reminderTemplateGroup";

export interface IReminderTemplateGroupRepository {
  create(accountUuid: string, group: ReminderTemplateGroup): Promise<boolean>;
  update(accountUuid: string, group: ReminderTemplateGroup): Promise<boolean>;
  delete(accountUuid: string, uuid: string): Promise<void>;
  getAll(accountUuid: string): Promise<ReminderTemplateGroup[]>;
  getById(accountUuid: string, uuid: string): Promise<ReminderTemplateGroup | null>;
}
