import { AggregateRoot } from '@dailyuse/utils';
import { ReminderTemplate } from '../entities/ReminderTemplate';
import { IReminderTemplateGroup, ReminderTemplateEnableMode } from '../types';

/**
 * ReminderTemplateGroup 聚合根
 * 管理提醒模板组的生命周期和业务规则
 */
export class ReminderTemplateGroup extends AggregateRoot implements IReminderTemplateGroup {
  private _name: string;
  private _enabled: boolean;
  private _enableMode: ReminderTemplateEnableMode;
  private _templates: ReminderTemplate[];

  constructor(params: {
    uuid?: string;
    name: string;
    enabled?: boolean;
    enableMode?: ReminderTemplateEnableMode;
    templates?: ReminderTemplate[];
  }) {
    super(params.uuid);
    this._name = params.name;
    this._enabled = params.enabled ?? true;
    this._enableMode = params.enableMode ?? ReminderTemplateEnableMode.GROUP;
    this._templates = params.templates || [];
  }

  get name(): string {
    return this._name;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get enableMode(): ReminderTemplateEnableMode {
    return this._enableMode;
  }

  get templates(): ReminderTemplate[] {
    return [...this._templates];
  }

  get activeTemplates(): ReminderTemplate[] {
    if (this._enableMode === ReminderTemplateEnableMode.GROUP) {
      return this._enabled ? this._templates : [];
    } else {
      return this._templates.filter((template) => template.selfEnabled);
    }
  }

  get templateCount(): number {
    return this._templates.length;
  }

  get activeTemplateCount(): number {
    return this.activeTemplates.length;
  }

  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Group name cannot be empty');
    }
    this._name = name.trim();
  }

  enable(): void {
    this._enabled = true;
  }

  disable(): void {
    this._enabled = false;
  }

  setEnableMode(mode: ReminderTemplateEnableMode): void {
    this._enableMode = mode;
  }

  addTemplate(template: ReminderTemplate): void {
    if (this._templates.some((t) => t.uuid === template.uuid)) {
      throw new Error('Template already exists in this group');
    }

    // Move template to this group
    template.moveToGroup(this.uuid);
    this._templates.push(template);
  }

  removeTemplate(templateId: string): void {
    const index = this._templates.findIndex((t) => t.uuid === templateId);
    if (index === -1) {
      throw new Error('Template not found in this group');
    }

    this._templates.splice(index, 1);
  }

  getTemplate(templateId: string): ReminderTemplate | undefined {
    return this._templates.find((t) => t.uuid === templateId);
  }

  enableTemplate(templateId: string): void {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found in this group');
    }

    template.enable();
  }

  disableTemplate(templateId: string): void {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found in this group');
    }

    template.disable();
  }

  enableAllTemplates(): void {
    this._templates.forEach((template) => template.enable());
  }

  disableAllTemplates(): void {
    this._templates.forEach((template) => template.disable());
  }

  static create(params: {
    name: string;
    enabled?: boolean;
    enableMode?: ReminderTemplateEnableMode;
  }): ReminderTemplateGroup {
    return new ReminderTemplateGroup(params);
  }
}
