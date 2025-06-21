export interface DomainEvent {
  aggregateId: string;
  eventType: string;
  occurredOn: Date;
  payload: any;
}

export abstract class BaseDomainEvent implements DomainEvent {
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly eventType: string,
    public readonly payload: any = {}
  ) {
    this.occurredOn = new Date();
  }
}