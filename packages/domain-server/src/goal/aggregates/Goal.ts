import { GoalCore } from '@dailyuse/domain-core';

/**
 * 服务端目标聚合根 - 包含完整的业务逻辑
 * 包括关键结果管理、记录管理、复盘管理等
 */
export class Goal extends GoalCore {
  private _keyResults: any[] = [];
  private _records: any[] = [];
  private _reviews: any[] = [];

  // ===== 服务端专用业务方法 =====

  pause(): void {
    if (this._status === 'completed' || this._status === 'archived') {
      throw new Error('已完成或已归档的目标不能暂停');
    }

    this._status = 'paused';
    this.updateVersion();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'GoalPaused',
      occurredOn: new Date(),
      payload: { goalUuid: this.uuid, timestamp: this._updatedAt },
    });
  }

  activate(): void {
    if (this._status === 'completed' || this._status === 'archived') {
      throw new Error('已完成或已归档的目标不能激活');
    }

    this._status = 'active';
    this.updateVersion();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'GoalActivated',
      occurredOn: new Date(),
      payload: { goalUuid: this.uuid, timestamp: this._updatedAt },
    });
  }

  complete(): void {
    if (this._status === 'archived') {
      throw new Error('已归档的目标不能标记为完成');
    }

    this._status = 'completed';
    this.updateVersion();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'GoalCompleted',
      occurredOn: new Date(),
      payload: { goalUuid: this.uuid, completedAt: this._updatedAt },
    });
  }

  archive(): void {
    this._status = 'archived';
    this.updateVersion();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'GoalArchived',
      occurredOn: new Date(),
      payload: { goalUuid: this.uuid, timestamp: this._updatedAt },
    });
  }

  // ===== 服务端专用更新方法 =====

  updateName(newName: string): void {
    this.validateName(newName);
    this._name = newName;
    this.updateVersion();
  }

  updateDescription(newDescription?: string): void {
    this._description = newDescription;
    this.updateVersion();
  }

  updateColor(newColor: string): void {
    this.validateColor(newColor);
    this._color = newColor;
    this.updateVersion();
  }

  updateTimeRange(startTime: Date, endTime: Date): void {
    this.validateTimeRange(startTime, endTime);
    this._startTime = startTime;
    this._endTime = endTime;
    this.updateVersion();
  }

  updateNote(newNote?: string): void {
    this._note = newNote;
    this.updateVersion();
  }

  // ===== 关键结果管理 =====

  addKeyResult(keyResult: any): void {
    this._keyResults.push(keyResult);
    this.updateVersion();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'KeyResultAdded',
      occurredOn: new Date(),
      payload: { goalUuid: this.uuid, keyResultUuid: keyResult.uuid },
    });
  }

  removeKeyResult(keyResultUuid: string): void {
    const index = this._keyResults.findIndex((kr) => kr.uuid === keyResultUuid);
    if (index === -1) {
      throw new Error('关键结果不存在');
    }

    this._keyResults.splice(index, 1);
    this.updateVersion();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'KeyResultRemoved',
      occurredOn: new Date(),
      payload: { goalUuid: this.uuid, keyResultUuid },
    });
  }

  // ===== 记录管理 =====

  addRecord(record: any): void {
    this._records.push(record);
    this.updateVersion();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'GoalRecordAdded',
      occurredOn: new Date(),
      payload: { goalUuid: this.uuid, recordUuid: record.uuid },
    });
  }

  removeRecord(recordUuid: string): void {
    const index = this._records.findIndex((r) => r.uuid === recordUuid);
    if (index === -1) {
      throw new Error('记录不存在');
    }

    this._records.splice(index, 1);
    this.updateVersion();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'GoalRecordRemoved',
      occurredOn: new Date(),
      payload: { goalUuid: this.uuid, recordUuid },
    });
  }

  // ===== 复盘管理 =====

  addReview(review: any): void {
    this._reviews.push(review);
    this.updateVersion();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'GoalReviewAdded',
      occurredOn: new Date(),
      payload: { goalUuid: this.uuid, reviewUuid: review.uuid },
    });
  }

  removeReview(reviewUuid: string): void {
    const index = this._reviews.findIndex((r) => r.uuid === reviewUuid);
    if (index === -1) {
      throw new Error('复盘不存在');
    }

    this._reviews.splice(index, 1);
    this.updateVersion();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'GoalReviewRemoved',
      occurredOn: new Date(),
      payload: { goalUuid: this.uuid, reviewUuid },
    });
  }

  // ===== 服务端专用查询方法 =====

  getKeyResults(): any[] {
    return [...this._keyResults]; // 返回副本
  }

  getRecords(): any[] {
    return [...this._records];
  }

  getReviews(): any[] {
    return [...this._reviews];
  }

  getActiveKeyResults(): any[] {
    return this._keyResults.filter((kr) => kr.status === 'active');
  }

  getCompletedKeyResults(): any[] {
    return this._keyResults.filter((kr) => kr.status === 'completed');
  }

  // ===== 业务规则校验 =====

  canBeCompleted(): boolean {
    return this._status === 'active' || this._status === 'paused';
  }

  canBeArchived(): boolean {
    return true; // 任何状态的目标都可以归档
  }

  canAddKeyResult(): boolean {
    return this._status === 'active' || this._status === 'paused';
  }

  // ===== 工厂方法 =====

  static create(params: {
    name: string;
    description?: string;
    color: string;
    dirUuid?: string;
    startTime?: Date;
    endTime?: Date;
    note?: string;
  }): Goal {
    const goal = new Goal(params);

    goal.addDomainEvent({
      aggregateId: goal.uuid,
      eventType: 'GoalCreated',
      occurredOn: new Date(),
      payload: {
        goalUuid: goal.uuid,
        name: goal.name,
        color: goal.color,
        startTime: goal.startTime,
        endTime: goal.endTime,
        createdAt: goal.createdAt,
      },
    });

    return goal;
  }

  static fromPersistence(data: any): Goal {
    const goal = new Goal({
      uuid: data.uuid,
      name: data.name,
      description: data.description,
      color: data.color,
      dirUuid: data.dirUuid,
      startTime: data.startTime ? new Date(data.startTime) : undefined,
      endTime: data.endTime ? new Date(data.endTime) : undefined,
      note: data.note,
      status: data.status,
      createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
      version: data.version,
    });

    // 恢复关联数据
    goal._keyResults = data.keyResults || [];
    goal._records = data.records || [];
    goal._reviews = data.reviews || [];

    // 清除领域事件
    goal.clearDomainEvents();

    return goal;
  }

  // ===== 持久化方法 =====

  toPersistence() {
    return {
      ...this.toDTO(),
      keyResults: this._keyResults,
      records: this._records,
      reviews: this._reviews,
    };
  }

  clone(): Goal {
    return Goal.fromPersistence(this.toPersistence());
  }
}
