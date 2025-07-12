/**
 * 领域事件接口
 */
export interface DomainEvent<T = any> {
  aggregateId: string;
  eventType: string;
  occurredOn: Date;
  payload: T;
}

/**
 * 基础领域事件抽象类
 */
export abstract class BaseDomainEvent<T = any> implements DomainEvent<T> {
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly eventType: string,
    public readonly payload: T
  ) {
    this.occurredOn = new Date();
  }
}
