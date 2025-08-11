import { ReminderTemplate } from '../entities/ReminderTemplate';
import { ReminderTemplateGroup } from '../aggregates/ReminderTemplateGroup';
import {
  IReminderTemplateRepository,
  IReminderTemplateGroupRepository,
} from '../repositories/IReminderRepository';
import {
  ReminderTemplateEnableMode,
  ImportanceLevel,
  NotificationSettings,
  ReminderTimeConfig,
  SYSTEM_GROUP_ID,
} from '../types';

export class ReminderService {
  constructor(
    private reminderTemplateRepository: IReminderTemplateRepository,
    private reminderTemplateGroupRepository: IReminderTemplateGroupRepository,
  ) {}

  async createGroup(params: {
    name: string;
    enabled?: boolean;
    enableMode?: ReminderTemplateEnableMode;
  }): Promise<ReminderTemplateGroup> {
    // Check if group name already exists
    const existingGroup = await this.reminderTemplateGroupRepository.findByName(params.name);
    if (existingGroup) {
      throw new Error('Group name already exists');
    }

    const group = ReminderTemplateGroup.create(params);
    await this.reminderTemplateGroupRepository.save(group);
    return group;
  }

  async createReminderTemplate(params: {
    groupId: string;
    name: string;
    description?: string;
    importanceLevel: ImportanceLevel;
    notificationSettings: NotificationSettings;
    timeConfig: ReminderTimeConfig;
    enabled?: boolean;
  }): Promise<ReminderTemplate> {
    const group = await this.reminderTemplateGroupRepository.findById(params.groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    const template = new ReminderTemplate({
      groupUuid: params.groupId,
      name: params.name,
      description: params.description,
      importanceLevel: params.importanceLevel,
      selfEnabled: params.enabled ?? true,
      notificationSettings: params.notificationSettings,
      timeConfig: params.timeConfig,
    });

    await this.reminderTemplateRepository.save(template);

    // Add template to group
    group.addTemplate(template);
    await this.reminderTemplateGroupRepository.save(group);

    return template;
  }

  async enableGroup(groupId: string): Promise<void> {
    const group = await this.reminderTemplateGroupRepository.findById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    group.enable();
    await this.reminderTemplateGroupRepository.save(group);
  }

  async disableGroup(groupId: string): Promise<void> {
    const group = await this.reminderTemplateGroupRepository.findById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    group.disable();
    await this.reminderTemplateGroupRepository.save(group);
  }

  async enableTemplate(templateId: string): Promise<void> {
    const template = await this.reminderTemplateRepository.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    template.enable();
    await this.reminderTemplateRepository.save(template);
  }

  async disableTemplate(templateId: string): Promise<void> {
    const template = await this.reminderTemplateRepository.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    template.disable();
    await this.reminderTemplateRepository.save(template);
  }

  async updateTemplate(
    templateId: string,
    params: {
      name?: string;
      description?: string;
      importanceLevel?: ImportanceLevel;
      notificationSettings?: Partial<NotificationSettings>;
      timeConfig?: ReminderTimeConfig;
    },
  ): Promise<void> {
    const template = await this.reminderTemplateRepository.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    if (params.name !== undefined) {
      template.updateName(params.name);
    }
    if (params.description !== undefined) {
      template.updateDescription(params.description);
    }
    if (params.importanceLevel !== undefined) {
      template.updateImportanceLevel(params.importanceLevel);
    }
    if (params.notificationSettings !== undefined) {
      template.updateNotificationSettings(params.notificationSettings);
    }
    if (params.timeConfig !== undefined) {
      template.updateTimeConfig(params.timeConfig);
    }

    await this.reminderTemplateRepository.save(template);
  }

  async moveTemplateToGroup(templateId: string, newGroupId: string): Promise<void> {
    const template = await this.reminderTemplateRepository.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const oldGroup = await this.reminderTemplateGroupRepository.findById(template.groupUuid);
    const newGroup = await this.reminderTemplateGroupRepository.findById(newGroupId);

    if (!newGroup) {
      throw new Error('New group not found');
    }

    // Remove from old group
    if (oldGroup) {
      oldGroup.removeTemplate(templateId);
      await this.reminderTemplateGroupRepository.save(oldGroup);
    }

    // Add to new group
    newGroup.addTemplate(template);
    await this.reminderTemplateGroupRepository.save(newGroup);
    await this.reminderTemplateRepository.save(template);
  }

  async getActiveTemplates(): Promise<ReminderTemplate[]> {
    const groups = await this.reminderTemplateGroupRepository.findAll();
    const activeTemplates: ReminderTemplate[] = [];

    for (const group of groups) {
      activeTemplates.push(...group.activeTemplates);
    }

    return activeTemplates;
  }

  async getGroupTemplates(groupId: string): Promise<ReminderTemplate[]> {
    return this.reminderTemplateRepository.findByGroupId(groupId);
  }

  async deleteTemplate(templateId: string): Promise<void> {
    const template = await this.reminderTemplateRepository.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Remove from group
    const group = await this.reminderTemplateGroupRepository.findById(template.groupUuid);
    if (group) {
      group.removeTemplate(templateId);
      await this.reminderTemplateGroupRepository.save(group);
    }

    await this.reminderTemplateRepository.delete(templateId);
  }

  async deleteGroup(groupId: string): Promise<void> {
    if (groupId === SYSTEM_GROUP_ID) {
      throw new Error('Cannot delete system group');
    }

    const group = await this.reminderTemplateGroupRepository.findById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Delete all templates in the group
    const templates = await this.reminderTemplateRepository.findByGroupId(groupId);
    for (const template of templates) {
      await this.reminderTemplateRepository.delete(template.uuid);
    }

    await this.reminderTemplateGroupRepository.delete(groupId);
  }
}
