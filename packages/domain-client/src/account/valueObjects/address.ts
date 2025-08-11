import { AddressCore } from '@dailyuse/domain-core';
import { type IAddressClient } from '../types';

/**
 * 客户端地址值对象 - 包含UI相关的地址操作
 */
export class Address extends AddressCore implements IAddressClient {
  constructor(params: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    isDefault?: boolean;
  }) {
    super(params);
  }

  // ===== IAddressClient 方法 =====
  formatForDisplay(): string {
    const parts = [this.street, this.city, this.state, this.postalCode, this.country].filter(
      (part) => part && part.trim(),
    );

    // 根据国家调整显示格式
    if (this.country === '中国' || this.country === 'China' || this.country === 'CN') {
      // 中国地址格式：国家 省/市 城市 街道 邮编
      return `${this.country} ${this.state} ${this.city} ${this.street} ${this.postalCode}`;
    } else {
      // 国际地址格式：街道, 城市, 州/省, 邮编, 国家
      return parts.join(', ');
    }
  }

  showOnMap(): void {
    const address = this.formatForDisplay();
    console.log(`Opening map for address: ${address}`);

    // 构建地图URL（这里使用谷歌地图作为示例）
    const encodedAddress = encodeURIComponent(address);
    const mapUrl = `https://maps.google.com/maps?q=${encodedAddress}`;

    // 在实际应用中，这里会打开地图应用或在新窗口中显示地图
    if (typeof window !== 'undefined') {
      console.log(`Would open: ${mapUrl}`);
      // window.open(mapUrl, '_blank');
    }
  }

  validateInput(): boolean {
    // 验证地址输入的完整性
    const requiredFields = [
      { field: this.street, name: '街道' },
      { field: this.city, name: '城市' },
      { field: this.state, name: '省/州' },
      { field: this.country, name: '国家' },
      { field: this.postalCode, name: '邮政编码' },
    ];

    for (const { field, name } of requiredFields) {
      if (!field || !field.trim()) {
        console.log(`地址验证失败: ${name}不能为空`);
        return false;
      }
    }

    // 验证邮政编码格式
    if (!this.validatePostalCode()) {
      console.log('地址验证失败: 邮政编码格式不正确');
      return false;
    }

    return true;
  }

  async autoComplete(input: string): Promise<string[]> {
    // 模拟地址自动补全功能
    console.log(`Auto-completing address for input: ${input}`);

    // 模拟API调用延迟
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 模拟返回建议的地址
    const suggestions = [
      `${input} 街道, ${this.city}, ${this.state}`,
      `${input} 大道, ${this.city}, ${this.state}`,
      `${input} 路, ${this.city}, ${this.state}`,
    ].filter((suggestion) => suggestion !== input);

    return suggestions.slice(0, 5); // 最多返回5个建议
  }

  isServer(): boolean {
    return false;
  }

  isClient(): boolean {
    return true;
  }

  // ===== 客户端特定的业务方法 =====
  private validatePostalCode(): boolean {
    const postalCode = this.postalCode.trim();
    const country = this.country.toLowerCase();

    // 根据国家验证邮政编码格式
    const patterns: { [key: string]: RegExp } = {
      china: /^\d{6}$/,
      中国: /^\d{6}$/,
      cn: /^\d{6}$/,
      usa: /^\d{5}(-\d{4})?$/,
      us: /^\d{5}(-\d{4})?$/,
      canada: /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/,
      ca: /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/,
      uk: /^[A-Za-z]{1,2}\d[A-Za-z\d]? ?\d[A-Za-z]{2}$/,
      japan: /^\d{3}-\d{4}$/,
      jp: /^\d{3}-\d{4}$/,
    };

    const pattern = patterns[country];
    if (pattern) {
      return pattern.test(postalCode);
    }

    // 如果没有特定模式，进行基本验证
    return postalCode.length >= 3 && postalCode.length <= 10;
  }

  getCoordinates(): Promise<{ lat: number; lng: number } | null> {
    // 模拟地理编码API调用
    return new Promise((resolve) => {
      console.log(`Getting coordinates for address: ${this.formatForDisplay()}`);

      setTimeout(() => {
        // 模拟返回坐标（这里使用随机值）
        const mockCoordinates = {
          lat: 39.9042 + (Math.random() - 0.5) * 0.1, // 北京附近
          lng: 116.4074 + (Math.random() - 0.5) * 0.1,
        };
        resolve(mockCoordinates);
      }, 500);
    });
  }

  getDistance(otherAddress: Address): Promise<number> {
    // 计算两个地址之间的距离（公里）
    return new Promise(async (resolve) => {
      try {
        const coord1 = await this.getCoordinates();
        const coord2 = await otherAddress.getCoordinates();

        if (!coord1 || !coord2) {
          resolve(-1); // 无法获取坐标
          return;
        }

        // 使用 Haversine 公式计算距离
        const R = 6371; // 地球半径（公里）
        const dLat = this.toRad(coord2.lat - coord1.lat);
        const dLng = this.toRad(coord2.lng - coord1.lng);

        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(this.toRad(coord1.lat)) *
            Math.cos(this.toRad(coord2.lat)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        resolve(Math.round(distance * 100) / 100); // 保留两位小数
      } catch (error) {
        console.error('Failed to calculate distance:', error);
        resolve(-1);
      }
    });
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  isInSameCity(otherAddress: Address): boolean {
    return (
      this.city.toLowerCase() === otherAddress.city.toLowerCase() &&
      this.state.toLowerCase() === otherAddress.state.toLowerCase() &&
      this.country.toLowerCase() === otherAddress.country.toLowerCase()
    );
  }

  getShippingZone(): string {
    // 根据地址确定配送区域
    const country = this.country.toLowerCase();

    if (country === 'china' || country === '中国' || country === 'cn') {
      // 中国境内按省份划分
      const province = this.state.toLowerCase();
      const firstTierCities = ['北京', '上海', '广东', '深圳'];
      const secondTierCities = ['江苏', '浙江', '山东', '河南', '湖北', '湖南', '四川'];

      if (firstTierCities.some((city) => province.includes(city))) {
        return 'Zone-1';
      } else if (secondTierCities.some((city) => province.includes(city))) {
        return 'Zone-2';
      } else {
        return 'Zone-3';
      }
    } else {
      return 'International';
    }
  }

  // ===== 静态工厂方法 =====
  static create(addressData: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  }): Address {
    const address = new Address({
      ...addressData,
      isDefault: false,
    });

    if (!address.validateInput()) {
      throw new Error('Invalid address data provided');
    }

    return address;
  }

  static fromString(addressString: string): Address {
    // 尝试从字符串解析地址
    // 这是一个简化的实现，实际应用中需要更复杂的解析逻辑
    const parts = addressString.split(',').map((part) => part.trim());

    if (parts.length < 4) {
      throw new Error('Address string format is invalid');
    }

    // 假设格式为：街道, 城市, 州/省, 国家 [邮编]
    const street = parts[0];
    const city = parts[1];
    const state = parts[2];
    let country = parts[3];
    let postalCode = '';

    // 检查最后一部分是否包含邮编
    const lastPart = parts[parts.length - 1];
    const postalMatch = lastPart.match(/\d{3,}/);
    if (postalMatch) {
      postalCode = postalMatch[0];
      country = lastPart.replace(postalCode, '').trim();
    }

    return new Address({
      street,
      city,
      state,
      country,
      postalCode: postalCode || '000000',
    });
  }

  static getCountryList(): Array<{ code: string; name: string; flag: string }> {
    return [
      { code: 'CN', name: '中国', flag: '🇨🇳' },
      { code: 'US', name: '美国', flag: '🇺🇸' },
      { code: 'CA', name: '加拿大', flag: '🇨🇦' },
      { code: 'UK', name: '英国', flag: '🇬🇧' },
      { code: 'JP', name: '日本', flag: '🇯🇵' },
      { code: 'KR', name: '韩国', flag: '🇰🇷' },
      { code: 'DE', name: '德国', flag: '🇩🇪' },
      { code: 'FR', name: '法国', flag: '🇫🇷' },
    ];
  }
}
