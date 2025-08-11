import { Entity } from "@dailyuse/utils";
import { type PermissionDTO } from "../types";
export class PermissionCore extends Entity {
  private _code: string; // 权限代码，如 'user:read', 'task:create'
  private _name: string;
  private _description: string;
  private _module: string; // 所属模块

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
  }) {
    super(params.uuid || Entity.generateUUID());
    this._code = params.code;
    this._name = params.name;
    this._description = params.description ?? "";
    this._module = params.module;
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

  // ======================== 辅助方法 ========================

  /**
   * 转为接口数据（DTO）
   */
  toDTO(): PermissionDTO {
    return {
      uuid: this._uuid,
      code: this._code,
      name: this._name,
      description: this._description,
      module: this._module,
    };
  }

  /**
   * 从接口数据创建实例
   */
  static fromDTO(dto: PermissionDTO): PermissionCore {
    return new PermissionCore({
      uuid: dto.uuid,
      code: dto.code,
      name: dto.name,
      description: dto.description,
      module: dto.module,
    });
  }

  /**
   * 克隆当前对象
   */
  clone(): PermissionCore {
    return PermissionCore.fromDTO(this.toDTO());
  }

  /**
   * 创建一个初始化对象（用于新建表单）
   */
  static forCreate(): PermissionCore {
    return new PermissionCore({
      uuid: "",
      code: "",
      name: "",
      description: "",
      module: "",
    });
  }

  /**
   * 判断对象是否为 Permission 实例
   */
  static isPermission(obj: any): obj is PermissionCore {
    return (
      obj instanceof PermissionCore ||
      (obj &&
        typeof obj === "object" &&
        "uuid" in obj &&
        "code" in obj &&
        "name" in obj &&
        "module" in obj)
    );
  }
}