// 临时类型定义
interface IDocumentMetadata {
  tags: string[];
  category: string;
  wordCount: number;
  characterCount: number;
  readingTime: number;
  lastSavedAt?: number;
  isReadOnly: boolean;
  encoding: string;
  language: string;
}

/**
 * 文档元数据值对象
 */
export class DocumentMetadata implements IDocumentMetadata {
  constructor(
    public readonly tags: string[],
    public readonly category: string,
    public readonly wordCount: number,
    public readonly characterCount: number,
    public readonly readingTime: number,
    public readonly lastSavedAt: number | undefined,
    public readonly isReadOnly: boolean,
    public readonly encoding: string,
    public readonly language: string,
  ) {
    if (wordCount < 0 || characterCount < 0 || readingTime < 0) {
      throw new Error('Counts and reading time must be non-negative');
    }

    if (wordCount > characterCount) {
      throw new Error('Word count cannot exceed character count');
    }

    if (!encoding.trim()) {
      throw new Error('Encoding cannot be empty');
    }

    if (!language.trim()) {
      throw new Error('Language cannot be empty');
    }
  }

  /**
   * 添加标签
   */
  addTag(tag: string): DocumentMetadata {
    if (!tag.trim()) {
      throw new Error('Tag cannot be empty');
    }

    if (this.tags.includes(tag)) {
      return this; // Tag already exists
    }

    return new DocumentMetadata(
      [...this.tags, tag],
      this.category,
      this.wordCount,
      this.characterCount,
      this.readingTime,
      this.lastSavedAt,
      this.isReadOnly,
      this.encoding,
      this.language,
    );
  }

  /**
   * 移除标签
   */
  removeTag(tag: string): DocumentMetadata {
    const newTags = this.tags.filter((t) => t !== tag);

    if (newTags.length === this.tags.length) {
      return this; // Tag not found
    }

    return new DocumentMetadata(
      newTags,
      this.category,
      this.wordCount,
      this.characterCount,
      this.readingTime,
      this.lastSavedAt,
      this.isReadOnly,
      this.encoding,
      this.language,
    );
  }

  /**
   * 更新统计信息
   */
  updateStats(wordCount: number, characterCount: number): DocumentMetadata {
    if (wordCount < 0 || characterCount < 0) {
      throw new Error('Counts must be non-negative');
    }

    if (wordCount > characterCount) {
      throw new Error('Word count cannot exceed character count');
    }

    // 估算阅读时间 (平均每分钟200字)
    const estimatedReadingTime = Math.ceil(wordCount / 200);

    return new DocumentMetadata(
      this.tags,
      this.category,
      wordCount,
      characterCount,
      estimatedReadingTime,
      Date.now(), // Update last saved time
      this.isReadOnly,
      this.encoding,
      this.language,
    );
  }

  /**
   * 设置类别
   */
  setCategory(category: string): DocumentMetadata {
    if (!category.trim()) {
      throw new Error('Category cannot be empty');
    }

    return new DocumentMetadata(
      this.tags,
      category,
      this.wordCount,
      this.characterCount,
      this.readingTime,
      this.lastSavedAt,
      this.isReadOnly,
      this.encoding,
      this.language,
    );
  }

  /**
   * 设置只读状态
   */
  setReadOnly(isReadOnly: boolean): DocumentMetadata {
    return new DocumentMetadata(
      this.tags,
      this.category,
      this.wordCount,
      this.characterCount,
      this.readingTime,
      this.lastSavedAt,
      isReadOnly,
      this.encoding,
      this.language,
    );
  }

  /**
   * 检查是否包含标签
   */
  hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }

  /**
   * 检查是否包含任一标签
   */
  hasAnyTag(tags: string[]): boolean {
    return tags.some((tag) => this.hasTag(tag));
  }

  /**
   * 检查是否包含所有标签
   */
  hasAllTags(tags: string[]): boolean {
    return tags.every((tag) => this.hasTag(tag));
  }

  /**
   * 获取估算的阅读时间字符串
   */
  getReadingTimeString(): string {
    if (this.readingTime === 0) {
      return 'Less than 1 minute';
    } else if (this.readingTime === 1) {
      return '1 minute';
    } else {
      return `${this.readingTime} minutes`;
    }
  }

  equals(other: DocumentMetadata): boolean {
    return (
      JSON.stringify(this.tags.sort()) === JSON.stringify(other.tags.sort()) &&
      this.category === other.category &&
      this.wordCount === other.wordCount &&
      this.characterCount === other.characterCount &&
      this.readingTime === other.readingTime &&
      this.lastSavedAt === other.lastSavedAt &&
      this.isReadOnly === other.isReadOnly &&
      this.encoding === other.encoding &&
      this.language === other.language
    );
  }

  /**
   * 创建默认元数据
   */
  static createDefault(): DocumentMetadata {
    return new DocumentMetadata(
      [], // no tags
      'general', // default category
      0, // no words
      0, // no characters
      0, // no reading time
      undefined, // never saved
      false, // not read-only
      'UTF-8', // default encoding
      'en', // default language
    );
  }

  /**
   * 从接口创建
   */
  static from(metadata: IDocumentMetadata): DocumentMetadata {
    return new DocumentMetadata(
      [...metadata.tags],
      metadata.category,
      metadata.wordCount,
      metadata.characterCount,
      metadata.readingTime,
      metadata.lastSavedAt,
      metadata.isReadOnly,
      metadata.encoding,
      metadata.language,
    );
  }
}
