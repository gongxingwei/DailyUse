import { SettingContracts } from "@dailyuse/contracts";

/**
 * Setting 模块 - 核心业务逻辑
 *
 * 定义设置相关的核心聚合根和实体的抽象基类
 *
 * TODO: 修复与 @dailyuse/contracts 的导入问题后，恢复完整的类型定义
 */

// 暂时使用本地类型定义，等解决导入问题后恢复从 contracts 导入
export type SettingType = SettingContracts.SettingType;
export type SettingScope = SettingContracts.SettingScope;
export type SettingCategory = SettingContracts.SettingCategory;
export type SettingOption = SettingContracts.SettingOption;
export type SettingValidationRule = SettingContracts.SettingValidationRule;
export type ISettingDefinition = SettingContracts.ISettingDefinition;
export type ISettingGroup = SettingContracts.ISettingGroup;


// ========== 核心聚合根抽象基类 ==========

/**
 * 设置定义核心类
 */
export abstract class SettingDefinitionCore implements ISettingDefinition {
  constructor(
    public key: string,
    public title: string,
    public type: SettingType,
    public scope: SettingScope,
    public category: SettingCategory,
    public defaultValue: any,
    public description?: string,
    public value?: any,
    public options?: SettingOption[],
    public validationRules?: SettingValidationRule[],
    public readonly: boolean = false,
    public hidden: boolean = false,
    public requiresRestart: boolean = false,
    public order: number = 0,
    public dependsOn?: string[],
    public tags?: string[],
  ) {}

  // ========== 核心业务方法 ==========

  /**
   * 验证设置值
   */
  validateValue(value: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 基础类型验证
    if (!this.validateType(value)) {
      errors.push(`值类型不正确，期望 ${this.type} 类型`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 验证值类型
   */
  private validateType(value: any): boolean {
    switch (this.type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      case 'enum':
        return this.options?.some((option) => option.value === value) ?? false;
      default:
        return false;
    }
  }

  /**
   * 转换为 DTO
   */
  toDTO(): any {
    return {
      key: this.key,
      title: this.title,
      type: this.type,
      scope: this.scope,
      category: this.category,
      defaultValue: this.defaultValue,
      description: this.description,
      value: this.value,
      options: this.options,
      validationRules: this.validationRules,
      readonly: this.readonly,
      hidden: this.hidden,
      requiresRestart: this.requiresRestart,
      order: this.order,
      dependsOn: this.dependsOn,
      tags: this.tags,
    };
  }

  /**
   * 创建变更记录
   */
  abstract createChangeRecord(
    oldValue: any,
    newValue: any,
    scope: SettingScope,
    changedBy: string,
    reason?: string,
  ): any;
}

/**
 * 设置组核心类
 */
export abstract class SettingGroupCore implements ISettingGroup {
    id: string;
    settings: ISettingDefinition[];
    collapsible: boolean;
    defaultExpanded: boolean;

  constructor(
    id: string,
    settings: ISettingDefinition[],
    collapsible: boolean,
    defaultExpanded: boolean,
    public key: string,
    public title: string,
    public category: SettingCategory,
    public description?: string,
    public order: number = 0,
    public collapsed: boolean = false,
    public readonly: boolean = false,
    public hidden: boolean = false,
    public dependsOn?: string[],
    public tags?: string[],
  ) {
    this.id = id;
    this.settings = settings;
    this.collapsible = collapsible;
    this.defaultExpanded = defaultExpanded;
  }

  /**
   * 转换为 DTO
   */
  toDTO(): any {
    return {
      key: this.key,
      title: this.title,
      description: this.description,
      category: this.category,
      order: this.order,
      collapsed: this.collapsed,
      readonly: this.readonly,
      hidden: this.hidden,
      dependsOn: this.dependsOn,
      tags: this.tags,
    };
  }
}
