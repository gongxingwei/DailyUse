import { TaskCore } from '@dailyuse/domain-core';

/**
 * 服务端任务实现 - 包含完整的业务逻辑
 * 状态管理、时间追踪、分配管理等
 */
export class Task extends TaskCore {
  // ===== 服务端专用业务方法 =====

  start(): void {
    if (this._status !== 'todo') {
      throw new Error('只有待办状态的任务可以开始');
    }

    this._status = 'in_progress';
    this.updateVersion();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'TaskStarted',
      occurredOn: new Date(),
      payload: {
        taskUuid: this.uuid,
        title: this._title,
        startedAt: this._updatedAt,
      },
    });
  }

  complete(): void {
    if (this._status === 'completed') {
      return; // 已完成，无需重复操作
    }

    if (this._status === 'cancelled') {
      throw new Error('已取消的任务不能标记为完成');
    }

    this._status = 'completed';
    this._completedAt = new Date();
    this.updateVersion();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'TaskCompleted',
      occurredOn: new Date(),
      payload: {
        taskUuid: this.uuid,
        title: this._title,
        completedAt: this._completedAt,
        duration: this.duration,
      },
    });
  }

  cancel(): void {
    if (this._status === 'completed') {
      throw new Error('已完成的任务不能取消');
    }

    if (this._status === 'cancelled') {
      return; // 已取消，无需重复操作
    }

    this._status = 'cancelled';
    this.updateVersion();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'TaskCancelled',
      occurredOn: new Date(),
      payload: {
        taskUuid: this.uuid,
        title: this._title,
        cancelledAt: this._updatedAt,
      },
    });
  }

  updateTitle(newTitle: string): void {
    this.validateTitle(newTitle);

    const oldTitle = this._title;
    this._title = newTitle.trim();
    this.updateVersion();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'TaskTitleUpdated',
      occurredOn: new Date(),
      payload: {
        taskUuid: this.uuid,
        oldTitle,
        newTitle: this._title,
      },
    });
  }

  updatePriority(newPriority: 'low' | 'medium' | 'high' | 'urgent'): void {
    this.validatePriority(newPriority);

    if (this._priority === newPriority) {
      return; // 优先级未变化
    }

    const oldPriority = this._priority;
    this._priority = newPriority;
    this.updateVersion();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'TaskPriorityUpdated',
      occurredOn: new Date(),
      payload: {
        taskUuid: this.uuid,
        oldPriority,
        newPriority: this._priority,
      },
    });
  }

  addTag(tag: string): void {
    if (!tag || tag.trim().length === 0) {
      throw new Error('标签不能为空');
    }

    const normalizedTag = tag.trim().toLowerCase();
    if (this._tags.includes(normalizedTag)) {
      return; // 标签已存在
    }

    this._tags.push(normalizedTag);
    this.updateVersion();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'TaskTagAdded',
      occurredOn: new Date(),
      payload: {
        taskUuid: this.uuid,
        tag: normalizedTag,
      },
    });
  }

  removeTag(tag: string): void {
    const normalizedTag = tag.trim().toLowerCase();
    const index = this._tags.indexOf(normalizedTag);

    if (index === -1) {
      return; // 标签不存在
    }

    this._tags.splice(index, 1);
    this.updateVersion();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'TaskTagRemoved',
      occurredOn: new Date(),
      payload: {
        taskUuid: this.uuid,
        tag: normalizedTag,
      },
    });
  }

  // ===== 服务端专用更新方法 =====

  updateDescription(newDescription?: string): void {
    this._description = newDescription?.trim() || undefined;
    this.updateVersion();
  }

  assignTo(userUuid: string): void {
    if (!userUuid || userUuid.trim().length === 0) {
      throw new Error('用户ID不能为空');
    }

    const oldAssignee = this._assignedTo;
    this._assignedTo = userUuid;
    this.updateVersion();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'TaskAssigned',
      occurredOn: new Date(),
      payload: {
        taskUuid: this.uuid,
        oldAssignee,
        newAssignee: userUuid,
      },
    });
  }

  unassign(): void {
    if (!this._assignedTo) {
      return; // 任务未分配
    }

    const oldAssignee = this._assignedTo;
    this._assignedTo = undefined;
    this.updateVersion();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'TaskUnassigned',
      occurredOn: new Date(),
      payload: {
        taskUuid: this.uuid,
        oldAssignee,
      },
    });
  }

  setDueDate(dueDate: Date): void {
    if (dueDate < new Date()) {
      throw new Error('截止日期不能是过去时间');
    }

    this._dueDate = dueDate;
    this.updateVersion();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'TaskDueDateSet',
      occurredOn: new Date(),
      payload: {
        taskUuid: this.uuid,
        dueDate,
      },
    });
  }

  removeDueDate(): void {
    if (!this._dueDate) {
      return; // 无截止日期
    }

    this._dueDate = undefined;
    this.updateVersion();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'TaskDueDateRemoved',
      occurredOn: new Date(),
      payload: {
        taskUuid: this.uuid,
      },
    });
  }

  setEstimatedHours(hours: number): void {
    this.validateHours(hours);
    this._estimatedHours = hours;
    this.updateVersion();
  }

  recordActualHours(hours: number): void {
    this.validateHours(hours);
    this._actualHours = hours;
    this.updateVersion();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'TaskTimeRecorded',
      occurredOn: new Date(),
      payload: {
        taskUuid: this.uuid,
        actualHours: hours,
        isOnTime: this.isOnTime,
      },
    });
  }

  linkToGoal(goalUuid: string): void {
    if (!goalUuid || goalUuid.trim().length === 0) {
      throw new Error('目标ID不能为空');
    }

    const oldGoal = this._goalUuid;
    this._goalUuid = goalUuid;
    this.updateVersion();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'TaskLinkedToGoal',
      occurredOn: new Date(),
      payload: {
        taskUuid: this.uuid,
        oldGoal,
        newGoal: goalUuid,
      },
    });
  }

  unlinkFromGoal(): void {
    if (!this._goalUuid) {
      return; // 任务未链接到目标
    }

    const oldGoal = this._goalUuid;
    this._goalUuid = undefined;
    this.updateVersion();

    this.addDomainEvent({
      aggregateId: this.uuid,
      eventType: 'TaskUnlinkedFromGoal',
      occurredOn: new Date(),
      payload: {
        taskUuid: this.uuid,
        oldGoal,
      },
    });
  }

  // ===== 业务规则校验 =====

  canStart(): boolean {
    return this._status === 'todo';
  }

  canComplete(): boolean {
    return this._status === 'todo' || this._status === 'in_progress';
  }

  canCancel(): boolean {
    return this._status !== 'completed' && this._status !== 'cancelled';
  }

  canEdit(): boolean {
    return this._status !== 'completed' && this._status !== 'cancelled';
  }

  // ===== 工厂方法 =====

  static create(params: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    goalUuid?: string;
    assignedTo?: string;
    dueDate?: Date;
    estimatedHours?: number;
    tags?: string[];
  }): Task {
    const task = new Task(params);

    task.addDomainEvent({
      aggregateId: task.uuid,
      eventType: 'TaskCreated',
      occurredOn: new Date(),
      payload: {
        taskUuid: task.uuid,
        title: task.title,
        priority: task.priority,
        goalUuid: task.goalUuid,
        assignedTo: task.assignedTo,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
      },
    });

    return task;
  }

  static fromPersistence(data: any): Task {
    const task = new Task({
      uuid: data.uuid,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      goalUuid: data.goalUuid,
      assignedTo: data.assignedTo,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      estimatedHours: data.estimatedHours,
      actualHours: data.actualHours,
      tags: data.tags || [],
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
    });

    // 清除领域事件
    task.clearDomainEvents();

    return task;
  }

  // ===== 持久化方法 =====

  toPersistence() {
    return {
      uuid: this.uuid,
      title: this._title,
      description: this._description,
      priority: this._priority,
      status: this._status,
      goalUuid: this._goalUuid,
      assignedTo: this._assignedTo,
      dueDate: this._dueDate?.toISOString(),
      estimatedHours: this._estimatedHours,
      actualHours: this._actualHours,
      tags: [...this._tags],
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      completedAt: this._completedAt?.toISOString(),
    };
  }

  clone(): Task {
    return Task.fromPersistence(this.toPersistence());
  }
}
