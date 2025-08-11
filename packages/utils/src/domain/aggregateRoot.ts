import { Entity } from './entity';

export interface DomainEvent {
  aggregateId: string;
  eventType: string;
  occurredOn: Date;
  payload: any;
}

export abstract class AggregateRoot extends Entity {
  private _domainEvents: DomainEvent[] = [];

  protected constructor(uuid: string) {
    super(uuid);
  }

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return [...this._domainEvents];
  }

  getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  getUncommittedDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this.clearDomainEvents();
    return events;
  }
}
