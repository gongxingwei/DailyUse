
import type { IReminderTemplateGroup } from "../types";
import type { ReminderTemplateGroup } from "../aggregates/reminderTemplateGroup";

export interface IReminderTemplateGroupRepository {
  setCurrentAccountUuid(accountUuid: string): void;
  create(group: ReminderTemplateGroup): Promise<boolean>;
  update(group: ReminderTemplateGroup): Promise<boolean>;
  delete(id: string): Promise<void>;
  getAll(): Promise<ReminderTemplateGroup[]>;
  getById(id: string): Promise<ReminderTemplateGroup | null>;
}
