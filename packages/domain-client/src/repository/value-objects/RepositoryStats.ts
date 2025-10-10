/**
 * RepositoryStatsClient 值对象
 * 仓库统计信息 - 客户端值对象
 * 实现 IRepositoryStatsClient 接口
 */

import type { RepositoryContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type IRepositoryStatsClient = RepositoryContracts.IRepositoryStatsClient;
type RepositoryStatsServerDTO = RepositoryContracts.RepositoryStatsServerDTO;
type RepositoryStatsClientDTO = RepositoryContracts.RepositoryStatsClientDTO;
type ResourceType = RepositoryContracts.ResourceType;

/**
 * RepositoryStatsClient 值对象
 */
export class RepositoryStats extends ValueObject implements IRepositoryStatsClient {
  public readonly totalResources: number;
  public readonly totalSize: number;
  public readonly favoriteCount: number;
  public readonly recentCount: number;
  public readonly resourcesByType: Record<ResourceType, number>;

  constructor(params: {
    totalResources: number;
    totalSize: number;
    favoriteCount: number;
    recentCount: number;
    resourcesByType: Record<ResourceType, number>;
  }) {
    super();
    this.totalResources = params.totalResources;
    this.totalSize = params.totalSize;
    this.favoriteCount = params.favoriteCount;
    this.recentCount = params.recentCount;
    this.resourcesByType = { ...params.resourcesByType };
    Object.freeze(this);
    Object.freeze(this.resourcesByType);
  }

  // UI 辅助属性
  public get totalSizeFormatted(): string {
    return this.formatBytes(this.totalSize);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * UI 辅助方法：获取某个类型的资源百分比
   */
  public getTypePercentage(type: ResourceType): number {
    if (this.totalResources === 0) return 0;
    const count = this.resourcesByType[type] || 0;
    return Math.round((count / this.totalResources) * 100);
  }

  /**
   * UI 辅助方法：获取数量最多的资源类型
   */
  public getMostUsedType(): ResourceType | null {
    const entries = Object.entries(this.resourcesByType) as [ResourceType, number][];
    if (entries.length === 0) return null;

    const [mostUsedType] = entries.reduce((max, current) => (current[1] > max[1] ? current : max));
    return mostUsedType;
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof RepositoryStats)) {
      return false;
    }

    const thisTypes = Object.keys(this.resourcesByType).sort();
    const otherTypes = Object.keys(other.resourcesByType).sort();

    return (
      this.totalResources === other.totalResources &&
      this.totalSize === other.totalSize &&
      this.favoriteCount === other.favoriteCount &&
      this.recentCount === other.recentCount &&
      thisTypes.length === otherTypes.length &&
      thisTypes.every(
        (type, index) =>
          type === otherTypes[index] &&
          this.resourcesByType[type as ResourceType] ===
            other.resourcesByType[type as ResourceType],
      )
    );
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): RepositoryStatsServerDTO {
    return {
      totalResources: this.totalResources,
      resourcesByType: { ...this.resourcesByType },
      resourcesByStatus: {} as any, // 客户端不需要这个字段
      totalSize: this.totalSize,
      recentActiveResources: this.recentCount,
      favoriteResources: this.favoriteCount,
      lastUpdated: Date.now(),
    };
  }

  /**
   * 从 Server DTO 创建值对象
   */
  public static fromServerDTO(dto: RepositoryStatsServerDTO): RepositoryStats {
    return new RepositoryStats({
      totalResources: dto.totalResources,
      totalSize: dto.totalSize,
      favoriteCount: dto.favoriteResources,
      recentCount: dto.recentActiveResources,
      resourcesByType: { ...dto.resourcesByType },
    });
  }

  /**
   * 从 Client DTO 创建值对象
   */
  public static fromClientDTO(dto: RepositoryStatsClientDTO): RepositoryStats {
    return new RepositoryStats({
      totalResources: dto.totalResources,
      totalSize: dto.totalSize,
      favoriteCount: dto.favoriteCount,
      recentCount: dto.recentCount,
      resourcesByType: { ...dto.resourcesByType },
    });
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): RepositoryStatsClientDTO {
    return {
      totalResources: this.totalResources,
      totalSize: this.totalSize,
      totalSizeFormatted: this.totalSizeFormatted,
      favoriteCount: this.favoriteCount,
      recentCount: this.recentCount,
      resourcesByType: { ...this.resourcesByType },
    };
  }

  /**
   * 创建默认统计信息
   */
  public static createDefault(): RepositoryStats {
    return new RepositoryStats({
      totalResources: 0,
      totalSize: 0,
      favoriteCount: 0,
      recentCount: 0,
      resourcesByType: {} as Record<ResourceType, number>,
    });
  }
}
