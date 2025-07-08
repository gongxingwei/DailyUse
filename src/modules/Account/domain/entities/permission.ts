/**
 * Permission 实体
 * 权限实体
 */
export class Permission {
  private _id: string;
  private _code: string; // 权限代码，如 'user:read', 'task:create'
  private _name: string;
  private _description: string;
  private _module: string; // 所属模块

  constructor(
    id: string,
    code: string,
    name: string,
    description: string,
    module: string
  ) {
    this._id = id;
    this._code = code;
    this._name = name;
    this._description = description;
    this._module = module;
  }

  get id(): string {
    return this._id;
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
}
