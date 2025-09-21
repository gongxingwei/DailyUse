import { Position } from '../value-objects/Position';

// 临时类型定义
export enum ChangeType {
  INSERT = 'insert',
  DELETE = 'delete',
  REPLACE = 'replace',
}

interface IContentChange {
  uuid: string;
  type: ChangeType;
  position: Position;
  length: number;
  oldText: string;
  newText: string;
  timestamp: number;
}

/**
 * 内容变更实体
 */
export class ContentChange implements IContentChange {
  constructor(
    public readonly uuid: string,
    public readonly type: ChangeType,
    public readonly position: Position,
    public readonly length: number,
    public readonly oldText: string,
    public readonly newText: string,
    public readonly timestamp: number,
  ) {
    if (!uuid.trim()) {
      throw new Error('UUID cannot be empty');
    }

    if (length < 0) {
      throw new Error('Length must be non-negative');
    }

    if (timestamp <= 0) {
      throw new Error('Timestamp must be positive');
    }

    this.validateChangeType();
  }

  private validateChangeType(): void {
    switch (this.type) {
      case ChangeType.INSERT:
        if (this.oldText.length > 0 || this.newText.length === 0) {
          throw new Error('Insert operation must have empty old text and non-empty new text');
        }
        break;
      case ChangeType.DELETE:
        if (this.oldText.length === 0 || this.newText.length > 0) {
          throw new Error('Delete operation must have non-empty old text and empty new text');
        }
        break;
      case ChangeType.REPLACE:
        if (this.oldText.length === 0 && this.newText.length === 0) {
          throw new Error('Replace operation must have either old text or new text');
        }
        break;
      default:
        throw new Error(`Unknown change type: ${this.type}`);
    }
  }

  /**
   * 获取变更的总字符数差异
   */
  getCharacterDelta(): number {
    return this.newText.length - this.oldText.length;
  }

  /**
   * 检查是否是插入操作
   */
  isInsert(): boolean {
    return this.type === ChangeType.INSERT;
  }

  /**
   * 检查是否是删除操作
   */
  isDelete(): boolean {
    return this.type === ChangeType.DELETE;
  }

  /**
   * 检查是否是替换操作
   */
  isReplace(): boolean {
    return this.type === ChangeType.REPLACE;
  }

  /**
   * 获取变更的结束位置
   */
  getEndPosition(): Position {
    if (this.isDelete()) {
      return new Position(
        this.position.line,
        this.position.column + this.oldText.length,
        this.position.offset + this.oldText.length,
      );
    } else {
      return new Position(
        this.position.line,
        this.position.column + this.newText.length,
        this.position.offset + this.newText.length,
      );
    }
  }

  /**
   * 检查两个变更是否重叠
   */
  overlapsWith(other: ContentChange): boolean {
    const thisEnd = this.getEndPosition();
    const otherEnd = other.getEndPosition();

    return !(thisEnd.isBefore(other.position) || otherEnd.isBefore(this.position));
  }

  /**
   * 检查是否可以与另一个变更合并
   */
  canMergeWith(other: ContentChange): boolean {
    // 只有相同类型的连续变更才能合并
    if (this.type !== other.type) {
      return false;
    }

    // 检查时间间隔是否在合理范围内（1秒内）
    const timeDiff = Math.abs(this.timestamp - other.timestamp);
    if (timeDiff > 1000) {
      return false;
    }

    // 检查位置是否连续
    if (this.type === ChangeType.INSERT) {
      const thisEnd = this.getEndPosition();
      return thisEnd.equals(other.position) || other.getEndPosition().equals(this.position);
    }

    return false;
  }

  /**
   * 与另一个变更合并
   */
  mergeWith(other: ContentChange): ContentChange {
    if (!this.canMergeWith(other)) {
      throw new Error('Cannot merge incompatible changes');
    }

    // 确定合并顺序
    const isThisFirst = this.timestamp <= other.timestamp;
    const first = isThisFirst ? this : other;
    const second = isThisFirst ? other : this;

    if (this.type === ChangeType.INSERT) {
      return new ContentChange(
        first.uuid, // Keep the first UUID
        ChangeType.INSERT,
        first.position,
        first.length + second.length,
        '', // Combined old text (empty for inserts)
        first.newText + second.newText,
        first.timestamp,
      );
    }

    // For other types, we don't support merging yet
    throw new Error(`Merging not supported for change type: ${this.type}`);
  }

  equals(other: ContentChange): boolean {
    return this.uuid === other.uuid;
  }

  toString(): string {
    return `ContentChange(${this.type}, ${this.position.toString()}, "${this.oldText}" -> "${this.newText}")`;
  }

  /**
   * 创建插入变更
   */
  static createInsert(
    uuid: string,
    position: Position,
    text: string,
    timestamp?: number,
  ): ContentChange {
    return new ContentChange(
      uuid,
      ChangeType.INSERT,
      position,
      text.length,
      '',
      text,
      timestamp || Date.now(),
    );
  }

  /**
   * 创建删除变更
   */
  static createDelete(
    uuid: string,
    position: Position,
    text: string,
    timestamp?: number,
  ): ContentChange {
    return new ContentChange(
      uuid,
      ChangeType.DELETE,
      position,
      text.length,
      text,
      '',
      timestamp || Date.now(),
    );
  }

  /**
   * 创建替换变更
   */
  static createReplace(
    uuid: string,
    position: Position,
    oldText: string,
    newText: string,
    timestamp?: number,
  ): ContentChange {
    return new ContentChange(
      uuid,
      ChangeType.REPLACE,
      position,
      Math.max(oldText.length, newText.length),
      oldText,
      newText,
      timestamp || Date.now(),
    );
  }

  /**
   * 从接口创建
   */
  static from(change: IContentChange): ContentChange {
    return new ContentChange(
      change.uuid,
      change.type,
      Position.from(change.position),
      change.length,
      change.oldText,
      change.newText,
      change.timestamp,
    );
  }
}
