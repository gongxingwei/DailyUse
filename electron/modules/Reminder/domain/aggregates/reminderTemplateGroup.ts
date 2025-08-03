import { ReminderTemplate } from "../entities/reminderTemplate";
import { AggregateRoot } from "@common/shared/domain/aggregateRoot";
import type {
  IReminderTemplateGroup,
  ReminderTemplateEnableMode,
} from "@common/modules/reminder";
export const SYSTEM_GROUP_ID = "system-root";

export function createSystemGroup(): ReminderTemplateGroup {
  return new ReminderTemplateGroup(
    "系统分组",
    true,
    [],
    "group",
    SYSTEM_GROUP_ID, // 使用系统分组ID
    undefined // 没有 parent
  );
}

export class ReminderTemplateGroup
  extends AggregateRoot
  implements IReminderTemplateGroup
{
  private _name: string;
  private _enabled: boolean;
  private _templates: ReminderTemplate[] = [];
  private _enableMode: ReminderTemplateEnableMode = "group"; // 新增属性
  private _parentUuid?: string; // 父分组ID，可选

  constructor(
    name: string,
    enabled = true,
    templates: ReminderTemplate[] = [],
    enableMode: ReminderTemplateEnableMode = "group",
    uuid?: string,
    parentUuid?: string // 父分组ID
  ) {
    super(uuid || ReminderTemplateGroup.generateId());
    this._name = name;
    this._enabled = enabled;
    this._templates = templates;
    this._enableMode = enableMode;
    this._parentUuid = parentUuid;
  }

  get uuid() {
    return this._uuid;
  }
  get name() {
    return this._name;
  }
  set name(val: string) {
    this._name = val;
  }
  get enabled() {
    return this._enabled;
  }
  set enabled(val: boolean) {
    this._enabled = val;
  }
  get enableMode() {
    return this._enableMode;
  }
  set enableMode(val: ReminderTemplateEnableMode) {
    this._enableMode = val;
  }
  get templates() {
    return this._templates;
  }
  get parentUuid() {
    return this._parentUuid;
  }
  set parentUuid(val: string | undefined) {
    this._parentUuid = val;
  }

  get allEnabledReminderTemplates(): ReminderTemplate[] {
    const enabledTemplates = this._templates.filter((t) => this.isTemplateEnabled(t.uuid));
    return enabledTemplates;
  }

  isTemplateEnabled(templateUuid: string): boolean {
    if (this._enableMode === "group") return this._enabled;
    const template = this._templates.find((t) => t.uuid === templateUuid);
    return template ? template.selfEnabled : false;
  }

  switchEnableModeToGroup() {
    if (this._enableMode === 'group') return;
    this._enableMode = 'group';
    this._enabled = this._templates.every((t) => t.selfEnabled);
  }

  switchEnableModeToIndividual() {
    if (this._enableMode === 'individual') return;
    this._enableMode = 'individual';
    this._enabled = this._templates.some((t) => t.selfEnabled);
  }

  /**
   * 添加存在的模板到分组
   */
  addTemplate(template: ReminderTemplate) {
    // 确保模板不重复添加
    if (!this._templates.find((t) => t.uuid === template.uuid)) {
      this._templates.push(template);
      template.groupUuid = this._uuid; // 保证 groupUuid 一致
    }
  }

  /**
   * 从分组移除模板
   */
  removeTemplate(templateId: string) {
    this._templates = this._templates.filter((t) => t.uuid !== templateId);
  }

  /**
   * 判断对象是否为 ReminderTemplateGroup 实例或符合其结构
   * @param obj 对象
   * @returns
   */
  static isReminderTemplateGroup(obj: any): obj is ReminderTemplateGroup {
    return (
      obj instanceof ReminderTemplateGroup ||
      (obj && obj.uuid && obj.name && Array.isArray(obj.templates))
    );
  }

  /**
   * 分组DTO导出
   */
  toDTO() {
    return {
      name: this._name,
      enabled: this._enabled,
      templates: this._templates.map((t) => t.toDTO()),
      enableMode: this._enableMode, // 确保包含此字段
      uuid: this._uuid,
    };
  }

  /**
   * 分组DTO导入
   */
  static fromDTO(dto: any) {
    return new ReminderTemplateGroup(
      
      dto.name,
      dto.enabled,
      (dto.templates || []).map((t: any) => ReminderTemplate.fromDTO(t)),
      dto.enableMode || "group", // 确保enableMode有默认值
      dto.uuid,
    );
  }

  /**
   * 从DTO对象创建ReminderTemplateGroup实例
   * @param dto DTO对象，仓储的的 templates 会直接提供已经转换好的 ReminderTemplate 实例
   * @description 用于仓储层，直接使用原始数据而不是实体方法
   * @returns 
   */
  static fromDTOForRepository(dto: any) {
    return new ReminderTemplateGroup(
      dto.name,
      dto.enabled,
      dto.templates,
      dto.enableMode || "group", // 确保enableMode有默认值
      dto.uuid,
    );
  }

  static ensureReminderTemplateGroup(obj: any): ReminderTemplateGroup {
    if (ReminderTemplateGroup.isReminderTemplateGroup(obj)) {
      return obj;
    } else {
      return ReminderTemplateGroup.fromDTO(obj);
    }
  }
}
