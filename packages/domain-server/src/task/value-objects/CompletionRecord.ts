/**
 * CompletionRecord 值对象 (Server)
 * 完成记录 - 不可变值对象
 */

import type { TaskContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type ICompletionRecord = TaskContracts.CompletionRecordServerDTO;

/**
 * CompletionRecord 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class CompletionRecord extends ValueObject implements ICompletionRecord {
  public readonly completedAt: number;
  public readonly note: string | null;
  public readonly rating: number | null;
  public readonly actualDuration: number | null;

  constructor(params: {
    completedAt: number;
    note?: string | null;
    rating?: number | null;
    actualDuration?: number | null;
  }) {
    super();

    // 验证
    if (params.rating !== undefined && params.rating !== null) {
      if (params.rating < 1 || params.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }
    }

    if (
      params.actualDuration !== undefined &&
      params.actualDuration !== null &&
      params.actualDuration < 0
    ) {
      throw new Error('Actual duration must be non-negative');
    }

    this.completedAt = params.completedAt;
    this.note = params.note ?? null;
    this.rating = params.rating ?? null;
    this.actualDuration = params.actualDuration ?? null;

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 创建修改后的新实例（值对象不可变，修改时创建新实例）
   */
  public with(
    changes: Partial<{
      completedAt: number;
      note: string | null;
      rating: number | null;
      actualDuration: number | null;
    }>,
  ): CompletionRecord {
    return new CompletionRecord({
      completedAt: changes.completedAt ?? this.completedAt,
      note: changes.note ?? this.note,
      rating: changes.rating ?? this.rating,
      actualDuration: changes.actualDuration ?? this.actualDuration,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: CompletionRecord): boolean {
    if (!(other instanceof CompletionRecord)) {
      return false;
    }

    return (
      this.completedAt === other.completedAt &&
      this.note === other.note &&
      this.rating === other.rating &&
      this.actualDuration === other.actualDuration
    );
  }

  /**
   * DTO 转换
   */
  public toServerDTO(): TaskContracts.CompletionRecordServerDTO {
    return {
      completedAt: this.completedAt,
      note: this.note,
      rating: this.rating,
      actualDuration: this.actualDuration,
    };
  }

  public toClientDTO(): TaskContracts.CompletionRecordClientDTO {
    return {
      completedAt: this.completedAt,
      note: this.note,
      rating: this.rating,
      actualDuration: this.actualDuration,
      formattedCompletedAt: this.getFormattedCompletedAt(),
      durationText: this.getFormattedDuration(),
      hasNote: this.note !== null,
      hasRating: this.rating !== null,
      ratingStars: this.getRatingStars(),
    };
  }

  public toPersistenceDTO(): TaskContracts.CompletionRecordPersistenceDTO {
    return {
      completed_at: this.completedAt,
      note: this.note,
      rating: this.rating,
      actual_duration: this.actualDuration,
    };
  }

  /**
   * 静态工厂方法
   */
  public static fromServerDTO(dto: TaskContracts.CompletionRecordServerDTO): CompletionRecord {
    return new CompletionRecord({
      completedAt: dto.completedAt,
      note: dto.note,
      rating: dto.rating,
      actualDuration: dto.actualDuration,
    });
  }

  public static fromPersistenceDTO(
    dto: TaskContracts.CompletionRecordPersistenceDTO,
  ): CompletionRecord {
    return new CompletionRecord({
      completedAt: dto.completed_at,
      note: dto.note,
      rating: dto.rating,
      actualDuration: dto.actual_duration,
    });
  }

  /**
   * 辅助方法（用于 ClientDTO）
   */
  private getFormattedCompletedAt(): string {
    return new Date(this.completedAt).toLocaleString('zh-CN');
  }

  private getRatingStars(): string {
    if (this.rating === null) return '';
    return '⭐'.repeat(this.rating);
  }

  private getFormattedDuration(): string {
    if (this.actualDuration === null) return '未记录';

    const hours = Math.floor(this.actualDuration / 3600000);
    const minutes = Math.floor((this.actualDuration % 3600000) / 60000);

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  }
}
