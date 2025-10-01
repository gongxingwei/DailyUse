import { Entity } from "@dailyuse/utils";
import { type AccountContracts } from "@dailyuse/contracts";
export abstract class PermissionCore extends Entity implements AccountContracts.IPermissionCore {
  private _code: string; // 权限代码，如 'user:read', 'task:create'
  private _name: string;
  private _description: string;
  private _module: string; // 所属模块
  private _resource: string; // 资源列表
  private _action: string; // 可执行的操作列表

  /**
   * 构造函数
   * @param params - 权限初始化参数
   * @example
   * new Permission({ uuid: "xxx", code: "user:read", name: "用户查看", description: "查看用户信息", module: "user" })
   */
  constructor(params: {
    uuid?: string;
    code: string;
    name: string;
    description?: string;
    module: string;
    resource?: string[];
    action?: string[];
  }) {
    super(params.uuid || Entity.generateUUID());
    this._code = params.code;
    this._name = params.name;
    this._description = params.description ?? "";
    this._module = params.module;
    this._resource = JSON.stringify(params.resource) || '[]';
    this._action = JSON.stringify(params.action) || '[]';
  }

  get code(): string {
    return this._code;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get module(): string {
    return this._module;
  }

  get resource(): string {
    return this._resource;
  }

  get action(): string {
    return this._action;
  }

  /**
   * 更新权限信息
   */
  updateInfo(name?: string, description?: string): void {
    if (name) this._name = name;
    if (description) this._description = description;
  }

  /**
   * 检查权限代码格式是否正确
   */
  static isValidCode(code: string): boolean {
    // 权限代码格式：module:action
    const codeRegex = /^[a-z]+:[a-z]+$/;
    return codeRegex.test(code);
  }

  abstract toDTO(): AccountContracts.PermissionDTO
}