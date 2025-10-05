/**
 * 领域事件基类
 * 所有领域事件都应该继承此类
 */
export abstract class DomainEvent {
  public readonly occurredOn: Date;
  public readonly eventId: string;

  constructor(
    public readonly aggregateId: string,
    public readonly eventType: string,
  ) {
    this.occurredOn = new Date();
    this.eventId = crypto.randomUUID();
  }

  /**
   * 将事件转换为原始数据
   * 用于序列化、日志记录等
   */
  abstract toPrimitives(): Record<string, any>;

  /**
   * 事件的字符串表示
   */
  toString(): string {
    return `${this.eventType}[${this.aggregateId}] at ${this.occurredOn.toISOString()}`;
  }
}
