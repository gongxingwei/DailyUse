/**
 * RepositoryConfigClient 值对象
 * 仓库配置 - 客户端值对象
 * 实现 IRepositoryConfigClient 接口
 */

import type { RepositoryContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type IRepositoryConfigClient = RepositoryContracts.IRepositoryConfigClient;
type RepositoryConfigServerDTO = RepositoryContracts.RepositoryConfigServerDTO;
type RepositoryConfigClientDTO = RepositoryContracts.RepositoryConfigClientDTO;
type ResourceType = RepositoryContracts.ResourceType;

/**
 * RepositoryConfigClient 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class RepositoryConfig extends ValueObject implements IRepositoryConfigClient {
  public readonly enableGit: boolean;
  public readonly autoSync: boolean;
  public readonly supportedFileTypes: ResourceType[];

  // UI 辅助属性（从 Server DTO 计算而来）
  private _syncInterval?: number | null;
  private _maxFileSize: number;

  constructor(params: {
    enableGit: boolean;
    autoSync: boolean;
    supportedFileTypes: ResourceType[];
    syncInterval?: number | null;
    maxFileSize: number;
  }) {
    super();

    this.enableGit = params.enableGit;
    this.autoSync = params.autoSync;
    this.supportedFileTypes = [...params.supportedFileTypes];
    this._syncInterval = params.syncInterval ?? null;
    this._maxFileSize = params.maxFileSize;

    // 确保不可变
    Object.freeze(this);
    Object.freeze(this.supportedFileTypes);
  }

  // UI 辅助属性
  public get syncIntervalFormatted(): string | null {
    if (!this._syncInterval) return null;
    const minutes = Math.floor(this._syncInterval / 60000);
    if (minutes < 60) return `每 ${minutes} 分钟`;
    const hours = Math.floor(minutes / 60);
    return `每 ${hours} 小时`;
  }

  public get maxFileSizeFormatted(): string {
    return this.formatBytes(this._maxFileSize);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof RepositoryConfig)) {
      return false;
    }

    return (
      this.enableGit === other.enableGit &&
      this.autoSync === other.autoSync &&
      this._syncInterval === other._syncInterval &&
      this._maxFileSize === other._maxFileSize &&
      this.supportedFileTypes.length === other.supportedFileTypes.length &&
      this.supportedFileTypes.every((type, index) => type === other.supportedFileTypes[index])
    );
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): RepositoryConfigServerDTO {
    return {
      enableGit: this.enableGit,
      autoSync: this.autoSync,
      syncInterval: this._syncInterval,
      defaultLinkedDocName: 'index.md', // 客户端不需要这个字段，使用默认值
      supportedFileTypes: [...this.supportedFileTypes],
      maxFileSize: this._maxFileSize,
      enableVersionControl: true, // 客户端不需要这个字段，使用默认值
    };
  }

  /**
   * 从 Server DTO 创建值对象
   */
  public static fromServerDTO(dto: RepositoryConfigServerDTO): RepositoryConfig {
    return new RepositoryConfig({
      enableGit: dto.enableGit,
      autoSync: dto.autoSync,
      supportedFileTypes: dto.supportedFileTypes,
      syncInterval: dto.syncInterval,
      maxFileSize: dto.maxFileSize,
    });
  }

  /**
   * 从 Client DTO 创建值对象
   */
  public static fromClientDTO(dto: RepositoryConfigClientDTO): RepositoryConfig {
    // 需要从格式化字符串反推原始值（这是简化实现）
    return new RepositoryConfig({
      enableGit: dto.enableGit,
      autoSync: dto.autoSync,
      supportedFileTypes: dto.supportedFileTypes,
      syncInterval: null, // 无法从格式化字符串精确反推
      maxFileSize: 100 * 1024 * 1024, // 使用默认值
    });
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): RepositoryConfigClientDTO {
    return {
      enableGit: this.enableGit,
      autoSync: this.autoSync,
      supportedFileTypes: [...this.supportedFileTypes],
      syncIntervalFormatted: this.syncIntervalFormatted,
      maxFileSizeFormatted: this.maxFileSizeFormatted,
    };
  }

  /**
   * 创建默认配置
   */
  public static createDefault(): RepositoryConfig {
    return new RepositoryConfig({
      enableGit: false,
      autoSync: false,
      supportedFileTypes: [],
      syncInterval: null,
      maxFileSize: 100 * 1024 * 1024, // 100MB
    });
  }
}
