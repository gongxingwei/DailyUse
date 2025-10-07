/**
 * NotificationContent 值对象
 *
 * 封装通知的内容信息（标题、正文、图标、图片）
 * 不可变，通过值判断相等性
 */
export class NotificationContent {
  private constructor(
    public readonly title: string,
    public readonly content: string,
    public readonly icon?: string,
    public readonly image?: string,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Notification title cannot be empty');
    }

    if (!this.content || this.content.trim().length === 0) {
      throw new Error('Notification content cannot be empty');
    }

    if (this.title.length > 200) {
      throw new Error('Notification title cannot exceed 200 characters');
    }

    if (this.content.length > 2000) {
      throw new Error('Notification content cannot exceed 2000 characters');
    }
  }

  static create(params: {
    title: string;
    content: string;
    icon?: string;
    image?: string;
  }): NotificationContent {
    return new NotificationContent(
      params.title.trim(),
      params.content.trim(),
      params.icon,
      params.image,
    );
  }

  /**
   * 检查是否包含模板变量（用于验证模板渲染是否完整）
   */
  hasTemplateVariables(): boolean {
    const templateVarPattern = /\{\{.*?\}\}/;
    return templateVarPattern.test(this.title) || templateVarPattern.test(this.content);
  }

  /**
   * 值对象相等性比较
   */
  equals(other: NotificationContent): boolean {
    return (
      this.title === other.title &&
      this.content === other.content &&
      this.icon === other.icon &&
      this.image === other.image
    );
  }

  /**
   * 转换为普通对象
   */
  toPlainObject() {
    return {
      title: this.title,
      content: this.content,
      icon: this.icon,
      image: this.image,
    };
  }
}
