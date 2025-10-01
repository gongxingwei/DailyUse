import { ValueObject } from '@dailyuse/utils';
import { type AccountContracts } from "@dailyuse/contracts";

type IAddressCore = AccountContracts.IAddressCore;

/**
 * 地址值对象核心类
 */
export class AddressCore extends ValueObject implements IAddressCore {
  private readonly _value: string; // 核心值：完整地址字符串
  private readonly _street: string;
  private readonly _city: string;
  private readonly _state: string;
  private readonly _country: string;
  private readonly _postalCode: string;

  constructor(params: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  }) {
    super();
    this.validate(params);
    this._street = params.street.trim();
    this._city = params.city.trim();
    this._state = params.state.trim();
    this._country = params.country.trim();
    this._postalCode = params.postalCode.trim();
    // 构建核心值
    this._value = `${this._street}, ${this._city}, ${this._state}, ${this._country} ${this._postalCode}`;
  }

  protected validate(params: any): void {
    const required = ['street', 'city', 'state', 'country', 'postalCode'];
    for (const field of required) {
      if (!params[field] || params[field].trim().length === 0) {
        throw new Error(`地址的${field}字段不能为空`);
      }
    }
  }

  // ===== 核心值属性 =====
  get value(): string {
    return this._value;
  }

  // ===== 共享只读属性 =====
  get street(): string {
    return this._street;
  }
  get city(): string {
    return this._city;
  }
  get state(): string {
    return this._state;
  }
  get country(): string {
    return this._country;
  }
  get postalCode(): string {
    return this._postalCode;
  }

  // ===== 共享计算属性 =====
  get fullAddress(): string {
    return `${this._street}, ${this._city}, ${this._state} ${this._postalCode}, ${this._country}`;
  }

  get shortAddress(): string {
    return `${this._city}, ${this._state}`;
  }

  // ===== 值对象相等性比较 =====
  equals(other: ValueObject): boolean {
    if (!(other instanceof AddressCore)) {
      return false;
    }
    return this._value === other._value;
  }

  // ===== 便利方法（保留向后兼容性） =====
  equalsAddress(other: AddressCore): boolean {
    return this.equals(other);
  }

  toString(): string {
    return this.fullAddress;
  }
}
