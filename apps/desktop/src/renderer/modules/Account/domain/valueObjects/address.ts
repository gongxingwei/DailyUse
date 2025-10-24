/**
 * Address 值对象
 * 不可变，修改时需要整体替换
 */
export class Address {
  private readonly _province: string;
  private readonly _city: string;
  private readonly _district: string;
  private readonly _street: string;
  private readonly _postalCode?: string;

  constructor(
    province: string,
    city: string,
    district: string,
    street: string,
    postalCode?: string,
  ) {
    if (!province || !city || !district || !street) {
      throw new Error('Address components cannot be empty');
    }

    this._province = province.trim();
    this._city = city.trim();
    this._district = district.trim();
    this._street = street.trim();
    this._postalCode = postalCode?.trim();
  }

  get province(): string {
    return this._province;
  }

  get city(): string {
    return this._city;
  }

  get district(): string {
    return this._district;
  }

  get street(): string {
    return this._street;
  }

  get postalCode(): string | undefined {
    return this._postalCode;
  }

  /**
   * 获取完整地址字符串
   */
  get fullAddress(): string {
    const parts = [this._province, this._city, this._district, this._street];
    return parts.join('');
  }

  /**
   * 值对象相等性比较
   */
  equals(other: Address): boolean {
    return (
      this._province === other._province &&
      this._city === other._city &&
      this._district === other._district &&
      this._street === other._street &&
      this._postalCode === other._postalCode
    );
  }

  toString(): string {
    return this.fullAddress;
  }
}
