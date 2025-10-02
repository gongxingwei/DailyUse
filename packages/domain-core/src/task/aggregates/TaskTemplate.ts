import { AggregateRoot } from '@dailyuse/utils';
import { TaskContracts, sharedContracts } from '@dailyuse/contracts';

type ITaskTemplate = TaskContracts.ITaskTemplate;
type ImportanceLevel = sharedContracts.ImportanceLevel;
type UrgencyLevel = sharedContracts.UrgencyLevel;
const ImportanceLevelEnum = sharedContracts.ImportanceLevel;
const UrgencyLevelEnum = sharedContracts.UrgencyLevel;

/**
 * 任务模板核心基类 - 包含共享属性和基础计算
 */
export abstract class TaskTemplateCore extends AggregateRoot implements ITaskTemplate {
  protected _accountUuid: string;
  protected _title: string;
  protected _description?: string;
  protected _timeConfig: {
    time: {
      timeType: TaskContracts.TaskTimeType;
      startTime?: string;
      endTime?: string;
    };
    date: {
      startDate: Date;
      endDate?: Date;
    };
    schedule: {
      mode: TaskContracts.TaskScheduleMode;
      intervalDays?: number;
      weekdays?: number[];
      monthDays?: number[];
    };
    timezone: string;
  };
  protected _reminderConfig: {
    enabled: boolean;
    minutesBefore: number;
    methods: ('notification' | 'sound')[];
  };
  protected _properties: {
    importance: ImportanceLevel;
    urgency: UrgencyLevel;
    location?: string;
    tags: string[];
  };
  protected _lifecycle: {
    status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
    createdAt: Date;
    updatedAt: Date;
  };
  protected _stats: {
    totalInstances: number;
    completedInstances: number;
    completionRate: number;
    lastInstanceDate?: Date;
  };
  protected _goalLinks?: TaskContracts.KeyResultLink[];

  constructor(params: {
    uuid?: string;
    accountUuid: string;
    title: string;
    description?: string;
    timeConfig: {
      time: {
        timeType: TaskContracts.TaskTimeType;
        startTime?: string;
        endTime?: string;
      };
      date: {
        startDate: Date;
        endDate?: Date;
      };
      schedule: {
        mode: TaskContracts.TaskScheduleMode;
        intervalDays?: number;
        weekdays?: number[];
        monthDays?: number[];
      };
      timezone: string;
    };
    reminderConfig?: {
      enabled: boolean;
      minutesBefore: number;
      methods: ('notification' | 'sound')[];
    };
    properties?: {
      importance: ImportanceLevel;
      urgency: UrgencyLevel;
      location?: string;
      tags: string[];
    };
    goalLinks?: TaskContracts.KeyResultLink[];
    lifecycle?: {
      status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
      createdAt: Date;
      updatedAt: Date;
    };
    stats?: {
      totalInstances: number;
      completedInstances: number;
      completionRate: number;
      lastInstanceDate?: Date;
    };
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());

    this._accountUuid = params.accountUuid;
    this._title = params.title;
    this._description = params.description;
    this._timeConfig = params.timeConfig;
    this._reminderConfig = params.reminderConfig || {
      enabled: false,
      minutesBefore: 15,
      methods: ['notification'],
    };
    this._properties = params.properties || {
      importance: ImportanceLevelEnum.Moderate,
      urgency: UrgencyLevelEnum.Medium,
      tags: [],
    };
    this._lifecycle = params.lifecycle || {
      status: 'draft',
      createdAt: params.createdAt || new Date(),
      updatedAt: params.updatedAt || new Date(),
    };
    this._stats = params.stats || {
      totalInstances: 0,
      completedInstances: 0,
      completionRate: 0,
    };
    this._goalLinks = params.goalLinks;
  }

  // ===== 共享只读属性 =====
  get accountUuid(): string {
    return this._accountUuid;
  }
  get title(): string {
    return this._title;
  }
  get description(): string | undefined {
    return this._description;
  }
  get timeConfig() {
    return { ...this._timeConfig };
  }
  get reminderConfig() {
    return { ...this._reminderConfig };
  }
  get properties() {
    return { ...this._properties };
  }
  get lifecycle() {
    return { ...this._lifecycle };
  }
  get stats() {
    return { ...this._stats };
  }
  get goalLinks(): TaskContracts.KeyResultLink[] | undefined {
    return this._goalLinks ? [...this._goalLinks] : undefined;
  }

  // ===== 共享计算属性 =====
  get isDraft(): boolean {
    return this._lifecycle.status === 'draft';
  }

  get isActive(): boolean {
    return this._lifecycle.status === 'active';
  }

  get isPaused(): boolean {
    return this._lifecycle.status === 'paused';
  }

  get isCompleted(): boolean {
    return this._lifecycle.status === 'completed';
  }

  get isArchived(): boolean {
    return this._lifecycle.status === 'archived';
  }

  get hasReminder(): boolean {
    return this._reminderConfig.enabled;
  }

  get isRecurring(): boolean {
    return this._timeConfig.schedule.mode !== 'once';
  }

  get hasEndDate(): boolean {
    return Boolean(this._timeConfig.date.endDate);
  }

  get hasTags(): boolean {
    return this._properties.tags.length > 0;
  }

  get isLinkedToGoal(): boolean {
    return Boolean(this._goalLinks && this._goalLinks.length > 0);
  }

  get hasInstances(): boolean {
    return this._stats.totalInstances > 0;
  }

  get completionRate(): number {
    return this._stats.completionRate;
  }

  // ===== 共享验证方法 =====
  protected validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('任务标题不能为空');
    }
    if (title.length > 200) {
      throw new Error('任务标题不能超过200个字符');
    }
    if (title.length < 1) {
      throw new Error('任务标题长度必须大于0');
    }
    if (title.trim() !== title) {
      throw new Error('任务标题不能以空格开头或结尾');
    }
  }

  /**
   * 验证任务描述的业务规则
   */
  protected validateDescription(description?: string): void {
    if (description && description.length > 500) {
      throw new Error('任务描述不能超过500个字符');
    }
  }

  protected validateTimeConfig(timeConfig: any): void {
    if (!timeConfig.time?.timeType && !timeConfig.type) {
      throw new Error('必须指定时间类型');
    }
    if (!timeConfig.schedule?.mode && !timeConfig.recurrence) {
      throw new Error('必须指定调度模式');
    }
    if (!timeConfig.timezone) {
      throw new Error('必须指定时区');
    }

    // 验证新的TaskTimeConfig结构中的schedule
    if (timeConfig.schedule) {
      this.validateScheduleConfig(timeConfig.schedule);
    }

    // 如果是timeRange类型，验证时间关系
    if (timeConfig.time?.timeType === 'timeRange' || timeConfig.type === 'timeRange') {
      this.validateTimeRangeConfig(timeConfig);
    }

    // 验证日期配置
    if (timeConfig.date) {
      this.validateDateConfig(timeConfig.date);
    }
  }

  /**
   * 验证调度配置的业务规则
   */
  private validateScheduleConfig(schedule: any): void {
    if (!schedule.mode) {
      throw new Error('必须指定调度模式');
    }

    const validModes = ['once', 'daily', 'weekly', 'monthly', 'intervalDays'];
    if (!validModes.includes(schedule.mode)) {
      throw new Error('无效的调度模式');
    }

    switch (schedule.mode) {
      case 'intervalDays':
        this.validateIntervalDaysConfig(schedule);
        break;
      case 'weekly':
        this.validateWeeklyScheduleConfig(schedule);
        break;
      case 'monthly':
        this.validateMonthlyScheduleConfig(schedule);
        break;
    }
  }

  /**
   * 验证间隔天数配置的业务规则
   */
  private validateIntervalDaysConfig(schedule: any): void {
    if (!schedule.intervalDays || schedule.intervalDays < 1) {
      throw new Error('间隔天数必须大于0');
    }

    if (schedule.intervalDays > 365) {
      throw new Error('间隔天数不能超过365天');
    }
  }

  /**
   * 验证每周调度配置的业务规则
   */
  private validateWeeklyScheduleConfig(schedule: any): void {
    if (!schedule.weekdays || schedule.weekdays.length === 0) {
      throw new Error('周重复必须选择至少一个星期');
    }

    // 验证星期数值的有效性
    const invalidWeekdays = schedule.weekdays.filter((day: number) => day < 0 || day > 6);
    if (invalidWeekdays.length > 0) {
      throw new Error('无效的星期设置：星期必须在0-6之间');
    }
  }

  /**
   * 验证每月调度配置的业务规则
   */
  private validateMonthlyScheduleConfig(schedule: any): void {
    if (!schedule.monthDays || schedule.monthDays.length === 0) {
      throw new Error('月重复必须选择至少一天');
    }

    // 验证月份中的天数有效性
    const invalidDays = schedule.monthDays.filter((day: number) => day < 1 || day > 31);
    if (invalidDays.length > 0) {
      throw new Error('每月日期必须在1-31之间');
    }
  }

  /**
   * 验证日期配置的业务规则
   */
  private validateDateConfig(date: any): void {
    if (!date.startDate) {
      throw new Error('必须设置开始日期');
    }

    if (date.endDate) {
      const startTime = new Date(date.startDate).getTime();
      const endTime = new Date(date.endDate).getTime();

      if (endTime <= startTime) {
        throw new Error('结束日期必须晚于开始日期');
      }
    }
  }

  /**
   * 验证时间段配置的业务规则
   */
  private validateTimeRangeConfig(timeConfig: any): void {
    const timeSettings = timeConfig.time || timeConfig.baseTime;
    if (!timeSettings) {
      throw new Error('时间段任务必须设置时间配置');
    }

    if (!timeSettings.startTime && !timeSettings.start) {
      throw new Error('时间段任务必须设置开始时间');
    }

    if (!timeSettings.endTime && !timeSettings.end) {
      throw new Error('时间段任务必须设置结束时间');
    }

    // 验证时间格式和逻辑关系（如果是字符串格式 HH:mm）
    if (timeSettings.startTime && timeSettings.endTime) {
      this.validateTimeStringRange(timeSettings.startTime, timeSettings.endTime);
    }
  }

  /**
   * 验证时间字符串范围的业务规则
   */
  private validateTimeStringRange(startTime: string, endTime: string): void {
    // 验证时间格式 HH:mm
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime)) {
      throw new Error('开始时间格式无效，应为 HH:mm 格式');
    }
    if (!timeRegex.test(endTime)) {
      throw new Error('结束时间格式无效，应为 HH:mm 格式');
    }

    // 转换为分钟数比较
    const startMinutes = this.timeStringToMinutes(startTime);
    const endMinutes = this.timeStringToMinutes(endTime);

    if (endMinutes <= startMinutes) {
      throw new Error('结束时间必须晚于开始时间');
    }

    // 验证持续时间的合理性（业务规则）
    const durationMinutes = endMinutes - startMinutes;

    if (durationMinutes > 1440) {
      // 24小时
      throw new Error('单个任务持续时间不能超过24小时');
    }

    if (durationMinutes < 1) {
      throw new Error('任务持续时间至少需要1分钟');
    }
  }

  /**
   * 将时间字符串转换为分钟数
   */
  private timeStringToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  protected validateReminderConfig(reminderConfig: any): void {
    if (!reminderConfig.enabled) {
      return; // 如果没有启用提醒，无需验证
    }

    // 验证基础的提醒时间
    if (reminderConfig.minutesBefore !== undefined) {
      if (reminderConfig.minutesBefore < 0) {
        throw new Error('提醒时间不能为负数');
      }

      // 业务约束：最大提醒时间
      if (reminderConfig.minutesBefore > 43200) {
        // 30天
        throw new Error('提前提醒时间不能超过30天');
      }
    }

    // 验证提醒方式
    if (reminderConfig.methods && Array.isArray(reminderConfig.methods)) {
      this.validateReminderMethods(reminderConfig.methods);
    }
  }

  /**
   * 验证提醒方式的业务规则
   */
  private validateReminderMethods(methods: string[]): void {
    if (methods.length === 0) {
      throw new Error('启用提醒时必须选择至少一种提醒方式');
    }

    const validMethods = ['notification', 'sound', 'email'];
    const invalidMethods = methods.filter((method) => !validMethods.includes(method));
    if (invalidMethods.length > 0) {
      throw new Error(`无效的提醒方式: ${invalidMethods.join(', ')}`);
    }
  }

  // ===== 共享辅助方法 =====
  hasTag(tag: string): boolean {
    return this._properties.tags.includes(tag);
  }

  hasAnyTag(tags: string[]): boolean {
    return tags.some((tag) => this._properties.tags.includes(tag));
  }

  hasAllTags(tags: string[]): boolean {
    return tags.every((tag) => this._properties.tags.includes(tag));
  }

  // ===== 共享更新方法 =====
  protected updateVersion(): void {
    this._lifecycle.updatedAt = new Date();
  }

  protected updateStats(totalInstances: number, completedInstances: number): void {
    this._stats.totalInstances = totalInstances;
    this._stats.completedInstances = completedInstances;
    this._stats.completionRate =
      totalInstances > 0 ? (completedInstances / totalInstances) * 100 : 0;
    this._stats.lastInstanceDate = new Date();
  }

  // ===== 抽象方法（由子类实现）=====
  abstract activate(): void;
  abstract pause(): void;
  abstract complete(): void;
  abstract archive(): void;
  abstract updateTitle(newTitle: string): void;
  abstract updateTimeConfig(newTimeConfig: any): void;
  abstract updateReminderConfig(newReminderConfig: any): void;
  abstract addTag(tag: string): void;
  abstract removeTag(tag: string): void;
}
