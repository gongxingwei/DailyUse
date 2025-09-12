import { TaskTemplateCore } from '@dailyuse/domain-core';
import type { TaskContracts } from '@dailyuse/contracts';
import type { ITaskTemplate } from '@dailyuse/contracts';

/**
 * 任务模板客户端实现 - 添加客户端特有功能
 */
export class TaskTemplate extends TaskTemplateCore {
  constructor(params: ITaskTemplate) {
    super(params);
  }
  /**
   * 从 DTO 创建客户端任务模板实例
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
    });
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

  /**
   * 转换为 DTO
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
    };
  }

  /**
   * 克隆当前对象（深拷贝）
   * 用于表单编辑时避免直接修改原数据
   */
  clone(): TaskTemplate {
    return TaskTemplate.fromDTO(this.toDTO());
  }
}
