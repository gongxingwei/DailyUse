import { ValueObject } from "@common/shared/domain/valueObject";
import { IIPLocation } from "@common/modules/sessionLog/types/sessionLog";

/**
 * IP地理位置值对象
 * 解析IP所属地理信息，不可变
 */
export class IPLocation extends ValueObject<any> implements IIPLocation {
  private readonly _ipAddress: string;
  private readonly _country: string;
  private readonly _region: string;
  private readonly _city: string;
  private readonly _latitude?: number;
  private readonly _longitude?: number;
  private readonly _timezone?: string;
  private readonly _isp?: string;

  constructor(params: {
    ipAddress: string;
    country: string;
    region: string;
    city: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    isp?: string;
  }) {
    super(params);
    this._ipAddress = params.ipAddress;
    this._country = params.country;
    this._region = params.region;
    this._city = params.city;
    this._latitude = params.latitude;
    this._longitude = params.longitude;
    this._timezone = params.timezone;
    this._isp = params.isp;
  }

  /**
   * 从IP地址解析地理位置（简化实现）
   */
  static async fromIPAddress(ipAddress: string): Promise<IPLocation> {
    if (IPLocation.isLocalIP(ipAddress)) {
      return new IPLocation({
        ipAddress,
        country: 'Local',
        region: 'Local',
        city: 'Local',
        isp: 'Local Network'
      });
    }
    return new IPLocation({
      ipAddress,
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
      isp: 'Unknown ISP'
    });
  }

  /**
   * 检查是否为本地IP地址
   */
  static isLocalIP(ipAddress: string): boolean {
    const localPatterns = [
      /^127\./,
      /^192\.168\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^::1$/,
      /^fe80:/,
      /^fc00:/,
      /^fd00:/
    ];
    return localPatterns.some(pattern => pattern.test(ipAddress));
  }

  /**
   * 检查是否与另一个位置在同一地区
   */
  isSameRegion(other: IPLocation): boolean {
    return this._country === other._country &&
           this._region === other._region;
  }

  /**
   * 检查是否与另一个位置在同一城市
   */
  isSameCity(other: IPLocation): boolean {
    return this.isSameRegion(other) && this._city === other._city;
  }

  /**
   * 计算与另一个位置的距离（如果有经纬度信息）
   */
  distanceTo(other: IPLocation): number | null {
    if (!this._latitude || !this._longitude ||
        !other._latitude || !other._longitude) {
      return null;
    }
    const R = 6371;
    const dLat = this.toRadians(other._latitude - this._latitude);
    const dLon = this.toRadians(other._longitude - this._longitude);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(this._latitude)) *
              Math.cos(this.toRadians(other._latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * 检查是否为可疑地理位置
   */
  isSuspiciousLocation(): boolean {
    const suspiciousCountries = ['Unknown'];
    const suspiciousISPs = ['Tor', 'VPN', 'Proxy'];
    return suspiciousCountries.includes(this._country) ||
      (!!this._isp && suspiciousISPs.some(isp =>
        this._isp!.toLowerCase().includes(isp.toLowerCase())));
  }

  /**
   * 获取位置描述
   */
  getLocationDescription(): string {
    const parts = [this._city, this._region, this._country]
      .filter(part => part && part !== 'Unknown')
      .filter((value, index, self) => self.indexOf(value) === index);
    return parts.length > 0 ? parts.join(', ') : 'Unknown Location';
  }

  /**
   * 获取完整的位置信息
   */
  getFullDescription(): string {
    let description = this.getLocationDescription();
    if (this._isp && this._isp !== 'Unknown ISP') {
      description += ` (${this._isp})`;
    }
    return description;
  }

  /**
   * 序列化为数据库格式
   */
  toDatabaseFormat(): string {
    return JSON.stringify({
      ipAddress: this._ipAddress,
      country: this._country,
      region: this._region,
      city: this._city,
      latitude: this._latitude,
      longitude: this._longitude,
      timezone: this._timezone,
      isp: this._isp
    });
  }

  /**
   * 从数据库格式反序列化
   */
  static fromDatabaseFormat(data: string): IPLocation {
    const parsed = JSON.parse(data);
    return new IPLocation({
      ipAddress: parsed.ipAddress,
      country: parsed.country,
      region: parsed.region,
      city: parsed.city,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      timezone: parsed.timezone,
      isp: parsed.isp
    });
  }

  // Getters
  get ipAddress(): string {
    return this._ipAddress;
  }

  get country(): string {
    return this._country;
  }

  get region(): string {
    return this._region;
  }

  get city(): string {
    return this._city;
  }

  get latitude(): number | undefined {
    return this._latitude;
  }

  get longitude(): number | undefined {
    return this._longitude;
  }

  get timezone(): string | undefined {
    return this._timezone;
  }

  get isp(): string | undefined {
    return this._isp;
  }

  /**
   * 转换为度
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * 转换为DTO对象
   */
  toDTO(): {
    ipAddress: string;
    country: string;
    region: string;
    city: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    isp?: string;
    locationDescription: string;
    fullDescription: string;
    isSuspicious: boolean;
  } {
    return {
      ipAddress: this._ipAddress,
      country: this._country,
      region: this._region,
      city: this._city,
      latitude: this._latitude,
      longitude: this._longitude,
      timezone: this._timezone,
      isp: this._isp,
      locationDescription: this.getLocationDescription(),
      fullDescription: this.getFullDescription(),
      isSuspicious: this.isSuspiciousLocation()
    };
  }

  static fromDTO(dto: {
    ipAddress: string;
    country: string;
    region: string;
    city: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    isp?: string;
  }): IPLocation {
    return new IPLocation({
      ipAddress: dto.ipAddress,
      country: dto.country,
      region: dto.region,
      city: dto.city,
      latitude: dto.latitude,
      longitude: dto.longitude,
      timezone: dto.timezone,
      isp: dto.isp
    });
  }

  /**
   * 字符串表示
   */
  toString(): string {
    return this.getFullDescription();
  }
}