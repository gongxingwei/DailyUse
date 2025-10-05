import { TaskTemplateCore } from '@dailyuse/domain-core';
import { TaskContracts } from '@dailyuse/contracts';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';
import { TaskInstance } from '../entities/TaskInstance';

type ITaskTemplate = TaskContracts.ITaskTemplate;

/**
 * 任务模板聚合根 - 添加客户端特有功能和聚合根控制模式
 * 作为聚合根管理TaskInstance实体的生命周期
 */
export class TaskTemplate extends TaskTemplateCore {
  // 重新声明属性类型为具体的实体类型
  declare instances: TaskInstance[];

  // 变更跟踪系统
  private _changeTracker = {
    instances: {
      created: [] as TaskInstance[],
      updated: [] as { original: TaskInstance; current: TaskInstance }[],
      deleted: [] as string[], // 存储被删除的 UUID
    },
  };

  // 用于记录原始状态，在编辑模式下使用
  private _originalState: {
    instances: TaskInstance[];
  } | null = null;

  constructor(params: {
    uuid?: string;
    accountUuid: string;
    title: string;
    description?: string;
    timeConfig: ITaskTemplate['timeConfig'];
    reminderConfig: ITaskTemplate['reminderConfig'];
    properties: ITaskTemplate['properties'];
    goalLinks?: ITaskTemplate['goalLinks'];
    lifecycle?: ITaskTemplate['lifecycle'];
    stats?: ITaskTemplate['stats'];
    instances?: TaskInstance[] | any[]; // 支持实体形式或DTO形式
  }) {
    super(params);

    // 支持DTO形式和实体形式的TaskInstance数组
    // 使用instanceof判断，参考Goal模块的实现
    this.instances =
      params.instances?.map((instance) => {
        if (instance instanceof TaskInstance) {
          return instance;
        } else {
          // 不是实体则调用fromDTO方法
          return TaskInstance.fromDTO(instance);
        }
      }) || [];
  }
  // ===== 变更跟踪系统 =====

  /**
   * 开始编辑模式 - 保存当前状态作为原始状态
   */
  startEditing(): void {
    this._originalState = {
      instances: this.instances.map((instance) => instance.clone()),
    };
    this._clearChangeTracker();
  }

  /**
   * 清空变更跟踪器
   */
  private _clearChangeTracker(): void {
    this._changeTracker = {
      instances: { created: [], updated: [], deleted: [] },
    };
  }

  /**
   * 添加新的任务实例（用于变更跟踪）
   */
  addNewInstance(instance: TaskInstance): void {
    this.instances.push(instance);
    this._changeTracker.instances.created.push(instance);
  }

  /**
   * 更新任务实例（用于变更跟踪）
   */
  updateInstanceWithTracking(uuid: string, updates: Partial<any>): void {
    const instance = this.instances.find((inst) => inst.uuid === uuid);
    if (!instance) return;

    // 查找原始状态
    const original = this._originalState?.instances.find((inst) => inst.uuid === uuid);
    if (original) {
      // 检查是否已经在更新列表中
      const existingUpdate = this._changeTracker.instances.updated.find(
        (u) => u.current.uuid === uuid,
      );
      if (!existingUpdate) {
        this._changeTracker.instances.updated.push({
          original: original.clone(),
          current: instance,
        });
      }
    }

    // 应用更新
    Object.assign(instance, updates);
  }

  /**
   * 删除任务实例（用于变更跟踪）
   */
  removeInstanceWithTracking(uuid: string): void {
    const index = this.instances.findIndex((inst) => inst.uuid === uuid);
    if (index === -1) return;

    const instance = this.instances[index];
    this.instances.splice(index, 1);

    // 如果这是新创建的，从创建列表中移除
    const createdIndex = this._changeTracker.instances.created.findIndex(
      (inst) => inst.uuid === uuid,
    );
    if (createdIndex !== -1) {
      this._changeTracker.instances.created.splice(createdIndex, 1);
    } else {
      // 否则添加到删除列表
      this._changeTracker.instances.deleted.push(uuid);
    }

    // 从更新列表中移除
    const updatedIndex = this._changeTracker.instances.updated.findIndex(
      (u) => u.current.uuid === uuid,
    );
    if (updatedIndex !== -1) {
      this._changeTracker.instances.updated.splice(updatedIndex, 1);
    }
  }

  // ===== DDD聚合根控制模式 - TaskInstance管理 =====

  /**
   * 创建并添加任务实例
   * 聚合根控制：确保任务实例属于当前模板，验证业务规则
   */
  createInstance(instanceData: {
    accountUuid: string;
    title?: string;
    scheduledDate: Date;
    timeType?: TaskContracts.TaskTimeType;
    startTime?: string;
    endTime?: string;
    estimatedDuration?: number;
    properties?: {
      importance?: ImportanceLevel;
      urgency?: UrgencyLevel;
      location?: string;
      tags?: string[];
    };
  }): string {
    // 业务规则验证
    if (this.lifecycle.status !== 'active') {
      throw new Error('只有激活的任务模板才能创建实例');
    }

    // 验证调度日期
    const now = new Date();
    if (instanceData.scheduledDate < now) {
      throw new Error('不能创建过去时间的任务实例');
    }

    // 创建任务实例实体
    const instanceUuid = this.generateUUID();
    const newInstance = new TaskInstance({
      uuid: instanceUuid,
      templateUuid: this.uuid,
      accountUuid: instanceData.accountUuid,
      title: instanceData.title || this.title,
      description: this.description,
      timeConfig: {
        timeType: instanceData.timeType || this.timeConfig.time.timeType,
        scheduledDate: instanceData.scheduledDate,
        startTime: instanceData.startTime || this.timeConfig.time.startTime,
        endTime: instanceData.endTime || this.timeConfig.time.endTime,
        estimatedDuration: instanceData.estimatedDuration,
        timezone: this.timeConfig.timezone,
      },
      reminderStatus: {
        enabled: this.reminderConfig.enabled,
        status: 'pending',
        snoozeCount: 0,
      },
      execution: {
        status: 'pending',
        progressPercentage: 0,
      },
      properties: {
        importance: instanceData.properties?.importance || this.properties.importance,
        urgency: instanceData.properties?.urgency || this.properties.urgency,
        location: instanceData.properties?.location || this.properties.location,
        tags: instanceData.properties?.tags || [...this.properties.tags],
      },
      goalLinks: this.goalLinks ? [...this.goalLinks] : undefined,
    });

    // 添加到聚合
    this.instances.push(newInstance);

    // 更新统计信息
    this.updateStats();
    this.updateVersion();

    // 发布领域事件
    this.publishDomainEvent('TaskInstanceCreated', {
      templateUuid: this.uuid,
      instanceUuid,
      instance: newInstance.toDTO(),
    });

    return instanceUuid;
  }

  /**
   * 通过聚合根完成任务实例
   * 聚合根控制：统一的完成逻辑，自动更新模板统计
   */
  completeInstance(
    instanceUuid: string,
    completionData?: {
      notes?: string;
      actualDuration?: number;
    },
  ): void {
    const instance = this.instances.find((inst) => inst.uuid === instanceUuid);
    if (!instance) {
      throw new Error(`任务实例不存在: ${instanceUuid}`);
    }

    // 通过实例的业务方法完成任务
    instance.complete();

    // 如果有额外的完成数据，手动更新
    if (completionData?.notes) {
      (instance.execution as any).notes = completionData.notes;
    }
    if (completionData?.actualDuration) {
      (instance.execution as any).actualDuration = completionData.actualDuration;
    }

    // 更新模板统计信息
    this.updateStats();
    this.updateVersion();

    // 如果关联了目标，自动更新目标进度
    if (instance.goalLinks && instance.goalLinks.length > 0) {
      this.publishDomainEvent('TaskInstanceCompletedWithGoalLink', {
        templateUuid: this.uuid,
        instanceUuid,
        goalLinks: instance.goalLinks,
        completedAt: new Date(),
      });
    }

    // 发布领域事件
    this.publishDomainEvent('TaskInstanceCompleted', {
      templateUuid: this.uuid,
      instanceUuid,
      completedAt: new Date(),
      actualDuration: instance.execution.actualDuration,
      notes: completionData?.notes,
    });
  }

  /**
   * 通过聚合根取消任务实例
   */
  cancelInstance(instanceUuid: string, reason?: string): void {
    const instance = this.instances.find((inst) => inst.uuid === instanceUuid);
    if (!instance) {
      throw new Error(`任务实例不存在: ${instanceUuid}`);
    }

    instance.cancel();

    // 如果有取消原因，手动记录
    if (reason) {
      (instance.execution as any).notes = reason;
    }

    this.updateStats();
    this.updateVersion();

    this.publishDomainEvent('TaskInstanceCancelled', {
      templateUuid: this.uuid,
      instanceUuid,
      reason,
      cancelledAt: new Date(),
    });
  }

  /**
   * 通过聚合根重新调度任务实例
   */
  rescheduleInstance(
    instanceUuid: string,
    newDate: Date,
    options?: {
      newStartTime?: string;
      newEndTime?: string;
      reason?: string;
    },
  ): void {
    const instance = this.instances.find((inst) => inst.uuid === instanceUuid);
    if (!instance) {
      throw new Error(`任务实例不存在: ${instanceUuid}`);
    }

    const now = new Date();
    if (newDate < now) {
      throw new Error('不能重新调度到过去的时间');
    }

    instance.reschedule(newDate, options?.newStartTime, options?.newEndTime);

    // 如果有重新调度原因，手动记录
    if (options?.reason) {
      // 记录到事件历史中
      if (!instance.lifecycle.events) {
        (instance.lifecycle as any).events = [];
      }
      instance.lifecycle.events.push({
        type: 'rescheduled',
        timestamp: new Date(),
        note: options.reason,
      });
    }

    this.updateVersion();

    this.publishDomainEvent('TaskInstanceRescheduled', {
      templateUuid: this.uuid,
      instanceUuid,
      newScheduledDate: newDate,
      reason: options?.reason,
      rescheduledAt: new Date(),
    });
  }

  /**
   * 删除任务实例
   * 聚合根控制：级联删除相关数据，维护数据一致性
   */
  removeInstance(instanceUuid: string): void {
    const instanceIndex = this.instances.findIndex((inst) => inst.uuid === instanceUuid);
    if (instanceIndex === -1) {
      throw new Error(`任务实例不存在: ${instanceUuid}`);
    }

    const instance = this.instances[instanceIndex];

    // 只允许删除未开始或已取消的任务
    if (instance.execution.status === 'inProgress' || instance.execution.status === 'completed') {
      throw new Error('不能删除正在进行或已完成的任务实例');
    }

    // 从聚合中移除
    this.instances.splice(instanceIndex, 1);

    // 更新统计信息
    this.updateStats();
    this.updateVersion();

    // 发布领域事件
    this.publishDomainEvent('TaskInstanceRemoved', {
      templateUuid: this.uuid,
      instanceUuid,
      removedInstance: instance.toDTO(),
    });
  }

  /**
   * 更新统计信息（重写父类方法以实现自定义逻辑）
   */
  protected updateStats(): void {
    const totalInstances = this.instances.length;
    const completedInstances = this.instances.filter(
      (inst) => inst.execution.status === 'completed',
    ).length;

    // 调用父类方法更新基础统计
    super.updateStats(totalInstances, completedInstances);
  }

  // ===== 查询方法（聚合根提供的查询接口）=====

  /**
   * 获取指定任务实例
   */
  getInstance(instanceUuid: string): TaskInstance | undefined {
    return this.instances.find((inst) => inst.uuid === instanceUuid);
  }

  /**
   * 获取指定任务实例的克隆版本（用于表单编辑）
   */
  getInstanceForEdit(instanceUuid: string): TaskInstance | undefined {
    const instance = this.getInstance(instanceUuid);
    return instance?.clone();
  }

  /**
   * 获取待执行的任务实例
   */
  getPendingInstances(): TaskInstance[] {
    return this.instances.filter((inst) => inst.execution.status === 'pending');
  }

  /**
   * 获取正在进行的任务实例
   */
  getInProgressInstances(): TaskInstance[] {
    return this.instances.filter((inst) => inst.execution.status === 'inProgress');
  }

  /**
   * 获取已完成的任务实例
   */
  getCompletedInstances(): TaskInstance[] {
    return this.instances.filter((inst) => inst.execution.status === 'completed');
  }

  /**
   * 获取已取消的任务实例
   */
  getCancelledInstances(): TaskInstance[] {
    return this.instances.filter((inst) => inst.execution.status === 'cancelled');
  }

  /**
   * 获取今日的任务实例
   */
  getTodayInstances(): TaskInstance[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.instances.filter((inst) => {
      const scheduledDate = inst.timeConfig.scheduledDate;
      return scheduledDate >= today && scheduledDate < tomorrow;
    });
  }

  /**
   * 获取本周的任务实例
   */
  getThisWeekInstances(): TaskInstance[] {
    const now = new Date();
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(now.getDate() - daysToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return this.instances.filter((inst) => {
      const scheduledDate = inst.timeConfig.scheduledDate;
      return scheduledDate >= startOfWeek && scheduledDate < endOfWeek;
    });
  }

  /**
   * 获取逾期的任务实例
   */
  getOverdueInstances(): TaskInstance[] {
    return this.instances.filter((inst) => inst.isOverdue);
  }

  // ===== 辅助方法 =====

  /**
   * 生成UUID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * 发布领域事件
   */
  private publishDomainEvent(eventType: string, eventData: any): void {
    // 这里可以集成事件发布机制
    console.log(`[Domain Event] ${eventType}:`, eventData);
  }

  // ===== 重写父类方法，添加聚合根数据 =====

  /**
   * 从 DTO 创建客户端任务模板实例（重写以支持聚合根数据）
   */
  static fromDTO(dto: TaskContracts.TaskTemplateDTO): TaskTemplate {
    return new TaskTemplate({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      title: dto.title,
      description: dto.description,
      timeConfig: {
        time: dto.timeConfig.time,
        date: {
          startDate: new Date(dto.timeConfig.date.startDate),
          endDate: dto.timeConfig.date.endDate ? new Date(dto.timeConfig.date.endDate) : undefined,
        },
        schedule: dto.timeConfig.schedule,
        timezone: dto.timeConfig.timezone,
      },
      reminderConfig: dto.reminderConfig,
      properties: dto.properties,
      goalLinks: dto.goalLinks,
      lifecycle: {
        status: dto.lifecycle.status,
        createdAt: new Date(dto.lifecycle.createdAt),
        updatedAt: new Date(dto.lifecycle.updatedAt),
      },
      stats: {
        ...dto.stats,
        lastInstanceDate: dto.stats.lastInstanceDate
          ? new Date(dto.stats.lastInstanceDate)
          : undefined,
      },
      instances: dto.instances ? dto.instances.map((inst) => TaskInstance.fromDTO(inst)) : [],
    });
  }

  /**
   * 从聚合根响应创建完整的TaskTemplate（包含实例数据）
   */
  static fromAggregateResponse(response: {
    template: TaskContracts.TaskTemplateDTO;
    instances: TaskContracts.TaskInstanceDTO[];
  }): TaskTemplate {
    const template = TaskTemplate.fromDTO(response.template);

    // 添加实例数据
    template.instances = response.instances.map((instanceDTO) => TaskInstance.fromDTO(instanceDTO));

    return template;
  }

  /**
   * 重写 toDTO 方法，包含子实体数据
   */
  toDTO(): TaskContracts.TaskTemplateDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      title: this.title,
      description: this.description,
      timeConfig: {
        time: {
          timeType: this.timeConfig.time.timeType,
          startTime: this.timeConfig.time.startTime,
          endTime: this.timeConfig.time.endTime,
        },
        date: {
          startDate: this.timeConfig.date.startDate.toISOString(),
          endDate: this.timeConfig.date.endDate?.toISOString(),
        },
        schedule: {
          mode: this.timeConfig.schedule.mode,
          intervalDays: this.timeConfig.schedule.intervalDays,
          weekdays: this.timeConfig.schedule.weekdays
            ? [...this.timeConfig.schedule.weekdays]
            : undefined,
          monthDays: this.timeConfig.schedule.monthDays
            ? [...this.timeConfig.schedule.monthDays]
            : undefined,
        },
        timezone: this.timeConfig.timezone,
      },
      reminderConfig: {
        enabled: this.reminderConfig.enabled,
        minutesBefore: this.reminderConfig.minutesBefore,
        methods: [...this.reminderConfig.methods],
      },
      properties: {
        importance: this.properties.importance,
        urgency: this.properties.urgency,
        location: this.properties.location,
        tags: [...this.properties.tags],
      },
      lifecycle: {
        status: this.lifecycle.status,
        createdAt: this.lifecycle.createdAt.toISOString(),
        updatedAt: this.lifecycle.updatedAt.toISOString(),
      },
      stats: {
        totalInstances: this.stats.totalInstances,
        completedInstances: this.stats.completedInstances,
        completionRate: this.stats.completionRate,
        lastInstanceDate: this.stats.lastInstanceDate?.toISOString(),
      },
      goalLinks: this.goalLinks ? [...this.goalLinks] : undefined,
      // 转换子实体为 DTO
      instances: this.instances.map((instance) => instance.toDTO()),
    };
  }

  /**
   * 转换为聚合根更新请求格式
   * 使用变更跟踪系统生成具体的创建、更新、删除操作
   */
  toUpdateRequest(): TaskContracts.UpdateTaskTemplateRequest & {
    instances?: Array<{
      action: 'create' | 'update' | 'delete';
      data?: any;
      uuid?: string;
    }>;
  } {
    const request: any = {
      // 基本字段
      title: this.title,
      description: this.description,
      timeConfig: this.timeConfig,
      reminderConfig: this.reminderConfig,
      properties: this.properties,
      goalLinks: this.goalLinks,
    };

    // 构建实例操作数组
    const instanceOperations: any[] = [];

    // 1. 创建操作
    for (const instance of this._changeTracker.instances.created) {
      instanceOperations.push({
        action: 'create',
        data: {
          title: instance.title,
          description: instance.description,
          timeConfig: instance.timeConfig,
          properties: instance.properties,
          goalLinks: instance.goalLinks,
        },
      });
    }

    // 2. 更新操作
    for (const update of this._changeTracker.instances.updated) {
      instanceOperations.push({
        action: 'update',
        uuid: update.current.uuid,
        data: {
          title: update.current.title,
          description: update.current.description,
          timeConfig: update.current.timeConfig,
          properties: update.current.properties,
        },
      });
    }

    // 3. 删除操作
    for (const uuid of this._changeTracker.instances.deleted) {
      instanceOperations.push({
        action: 'delete',
        uuid: uuid,
      });
    }

    if (instanceOperations.length > 0) {
      request.instances = instanceOperations;
    }

    return request;
  }

  /**
   * 克隆当前对象（深拷贝）
   * 用于表单编辑时避免直接修改原数据
   */
  clone(): TaskTemplate {
    const cloned = TaskTemplate.fromDTO(this.toDTO());
    cloned.instances = this.instances.map((inst) => inst.clone());
    return cloned;
  }

  // ===== 客户端特有的计算属性 =====

  /**
   * 获取显示标题（限制长度）
   */
  get displayTitle(): string {
    return this.title.length > 50 ? `${this.title.substring(0, 47)}...` : this.title;
  }

  /**
   * 获取状态显示文本
   */
  get statusText(): string {
    const statusMap = {
      draft: '草稿',
      active: '激活',
      paused: '暂停',
      completed: '完成',
      archived: '归档',
    };
    return statusMap[this.lifecycle.status] || this.lifecycle.status;
  }

  /**
   * 获取状态颜色
   */
  get statusColor(): string {
    const colorMap = {
      draft: '#9E9E9E',
      active: '#4CAF50',
      paused: '#FF9800',
      completed: '#2196F3',
      archived: '#607D8B',
    };
    return colorMap[this.lifecycle.status] || '#9E9E9E';
  }

  /**
   * 获取调度模式显示文本
   */
  get scheduleText(): string {
    const modeMap = {
      once: '单次',
      daily: '每日',
      weekly: '每周',
      monthly: '每月',
      intervalDays: `间隔${this.timeConfig.schedule.intervalDays || 0}天`,
    };
    return modeMap[this.timeConfig.schedule.mode] || this.timeConfig.schedule.mode;
  }

  /**
   * 获取时间类型显示文本
   */
  get timeTypeText(): string {
    const typeMap = {
      allDay: '全天',
      specificTime: '指定时间',
      timeRange: '时间范围',
    };
    return typeMap[this.timeConfig.time.timeType] || this.timeConfig.time.timeType;
  }

  /**
   * 获取标签显示文本
   */
  get tagsText(): string {
    return this.properties.tags.join(', ');
  }

  /**
   * 获取完成率文本
   */
  get completionRateText(): string {
    return `${this.stats.completionRate.toFixed(1)}%`;
  }

  /**
   * 是否可以激活
   */
  get canActivate(): boolean {
    return this.lifecycle.status === 'draft' || this.lifecycle.status === 'paused';
  }

  /**
   * 是否可以暂停
   */
  get canPause(): boolean {
    return this.lifecycle.status === 'active';
  }

  /**
   * 是否可以完成
   */
  get canComplete(): boolean {
    return this.lifecycle.status !== 'completed' && this.lifecycle.status !== 'archived';
  }

  /**
   * 是否可以归档
   */
  get canArchive(): boolean {
    return this.lifecycle.status !== 'archived';
  }

  /**
   * 是否可以编辑
   */
  get canEdit(): boolean {
    return this.lifecycle.status !== 'archived';
  }

  // ===== 客户端辅助方法 =====

  /**
   * 获取下次执行时间
   */
  getNextScheduledTime(): Date | null {
    if (this.lifecycle.status !== 'active') {
      return null;
    }

    const now = new Date();
    const startDate = this.timeConfig.date.startDate;

    if (this.timeConfig.date.endDate && now > this.timeConfig.date.endDate) {
      return null; // 已过期
    }

    switch (this.timeConfig.schedule.mode) {
      case 'once':
        return startDate > now ? startDate : null;

      case 'daily':
        const nextDaily = new Date(now);
        nextDaily.setDate(nextDaily.getDate() + 1);
        return nextDaily;

      case 'weekly':
        const nextWeekly = new Date(now);
        nextWeekly.setDate(nextWeekly.getDate() + 7);
        return nextWeekly;

      case 'monthly':
        const nextMonthly = new Date(now);
        nextMonthly.setMonth(nextMonthly.getMonth() + 1);
        return nextMonthly;

      case 'intervalDays':
        if (this.timeConfig.schedule.intervalDays) {
          const nextInterval = new Date(now);
          nextInterval.setDate(nextInterval.getDate() + this.timeConfig.schedule.intervalDays);
          return nextInterval;
        }
        return null;

      default:
        return null;
    }
  }

  /**
   * 格式化时间显示
   */
  formatTimeDisplay(): string {
    const { time } = this.timeConfig;

    switch (time.timeType) {
      case 'allDay':
        return '全天';
      case 'specificTime':
        return time.startTime || '未指定时间';
      case 'timeRange':
        return `${time.startTime || '00:00'} - ${time.endTime || '23:59'}`;
      default:
        return '未指定';
    }
  }

  /**
   * 获取推荐的提醒时间
   */
  getRecommendedReminderTimes(): string[] {
    const { time } = this.timeConfig;

    if (time.timeType === 'allDay') {
      return ['09:00', '12:00', '18:00'];
    }

    if (time.startTime) {
      const [hours, minutes] = time.startTime.split(':').map(Number);
      const reminderTime = new Date();
      reminderTime.setHours(hours, minutes - this.reminderConfig.minutesBefore);

      return [reminderTime.toTimeString().substring(0, 5), time.startTime];
    }

    return ['09:00', '12:00', '18:00'];
  }

  // ===== 实现抽象方法 =====
  activate(): void {
    if (!this.canActivate) {
      throw new Error('当前状态不能激活');
    }
    this._lifecycle.status = 'active';
    this.updateVersion();
  }

  pause(): void {
    if (!this.canPause) {
      throw new Error('当前状态不能暂停');
    }
    this._lifecycle.status = 'paused';
    this.updateVersion();
  }

  complete(): void {
    if (!this.canComplete) {
      throw new Error('当前状态不能完成');
    }
    this._lifecycle.status = 'completed';
    this.updateVersion();
  }

  archive(): void {
    if (!this.canArchive) {
      throw new Error('当前状态不能归档');
    }
    this._lifecycle.status = 'archived';
    this.updateVersion();
  }

  updateTitle(newTitle: string): void {
    this.validateTitle(newTitle);
    this._title = newTitle;
    this.updateVersion();
  }

  updateTimeConfig(newTimeConfig: any): void {
    this.validateTimeConfig(newTimeConfig);
    this._timeConfig = { ...this._timeConfig, ...newTimeConfig };
    this.updateVersion();
  }

  updateReminderConfig(newReminderConfig: any): void {
    this.validateReminderConfig(newReminderConfig);
    this._reminderConfig = { ...this._reminderConfig, ...newReminderConfig };
    this.updateVersion();
  }

  addTag(tag: string): void {
    if (!tag || tag.trim().length === 0) {
      throw new Error('标签不能为空');
    }
    if (!this.properties.tags.includes(tag)) {
      this._properties.tags.push(tag);
      this.updateVersion();
    }
  }

  removeTag(tag: string): void {
    const index = this.properties.tags.indexOf(tag);
    if (index !== -1) {
      this._properties.tags.splice(index, 1);
      this.updateVersion();
    }
  }
}
