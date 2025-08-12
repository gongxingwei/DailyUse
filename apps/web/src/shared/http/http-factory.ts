import axios, { type AxiosInstance } from 'axios';
import { baseConfig, type HttpConfig } from './base-config';
import { HttpInterceptors, type InterceptorConfig } from './interceptors';

export class HttpFactory {
  private static instances = new Map<string, AxiosInstance>();

  static create(
    name: string,
    config: Partial<HttpConfig> = {},
    interceptorConfig: InterceptorConfig = {},
  ): AxiosInstance {
    // 如果已存在相同名称的实例，返回缓存的实例
    if (this.instances.has(name)) {
      return this.instances.get(name)!;
    }

    // 合并配置
    const finalConfig = this.mergeConfig(baseConfig, config);

    // 创建axios实例
    const instance = axios.create(finalConfig);

    // 设置拦截器
    new HttpInterceptors(instance, interceptorConfig);

    // 缓存实例
    this.instances.set(name, instance);

    return instance;
  }

  private static mergeConfig(base: HttpConfig, override: Partial<HttpConfig>): HttpConfig {
    return {
      ...base,
      ...override,
      headers: {
        ...base.headers,
        ...override.headers,
      },
    };
  }

  static getInstance(name: string): AxiosInstance | undefined {
    return this.instances.get(name);
  }

  static getAllInstances(): Map<string, AxiosInstance> {
    return new Map(this.instances);
  }
}
