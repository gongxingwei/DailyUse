/**
 * 提醒模板启用模式
 */
export type ReminderTemplateEnableMode = 'group' | 'individual';

/**
 * 提醒时间配置
 */
export interface ReminderTimeConfig {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  times: string[]; // HH:mm format
  weekdays?: number[]; // 0-6, 0=Sunday
  monthDays?: number[]; // 1-31
  customPattern?: {
    interval: number;
    unit: 'minutes' | 'hours' | 'days';
  };
}

/**
 * 提醒模板接口
 */
export interface IReminderTemplate {
  uuid: string;
  name: string;
  description?: string;
  message: string;
  enabled: boolean;
  selfEnabled: boolean;
  groupUuid?: string;
  timeConfig: ReminderTimeConfig;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: string;
  tags: string[];
  lifecycle: {
    createdAt: Date;
    updatedAt: Date;
    lastTriggered?: Date;
    triggerCount: number;
  };
  analytics: {
    totalTriggers: number;
    acknowledgedCount: number;
    dismissedCount: number;
    snoozeCount: number;
    avgResponseTime?: number;
  };
  version: number;
}

/**
 * 提醒模板分组接口
 */
export interface IReminderTemplateGroup {
  uuid: string;
  name: string;
  enabled: boolean;
  enableMode: ReminderTemplateEnableMode;
  templates: IReminderTemplate[];
  parentUuid?: string;
}

/**
 * 提醒实例接口
 */
export interface IReminderInstance {
  uuid: string;
  templateUuid: string;
  message: string;
  scheduledTime: Date;
  triggeredTime?: Date;
  acknowledgedTime?: Date;
  dismissedTime?: Date;
  snoozedUntil?: Date;
  status: 'pending' | 'triggered' | 'acknowledged' | 'dismissed' | 'snoozed' | 'expired';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  metadata: {
    category: string;
    tags: string[];
    sourceType?: 'template' | 'task' | 'goal' | 'manual';
    sourceId?: string;
  };
  snoozeHistory: Array<{
    snoozedAt: Date;
    snoozeUntil: Date;
    reason?: string;
  }>;
  version: number;
}

/**
 * 提醒调度规则
 */
export interface ReminderScheduleRule {
  templateUuid: string;
  nextTriggerTime: Date;
  recurrencePattern: ReminderTimeConfig;
  isActive: boolean;
  lastProcessed?: Date;
}

/**
 * 提醒查询参数
 */
export interface ReminderQueryParams {
  status?: string[];
  priority?: string[];
  category?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  templateUuid?: string;
  groupUuid?: string;
  limit?: number;
  offset?: number;
}

/**
 * 提醒统计信息
 */
export interface ReminderStats {
  total: number;
  pending: number;
  triggered: number;
  acknowledged: number;
  dismissed: number;
  snoozed: number;
  expired: number;
  avgResponseTime: number;
  acknowledgmentRate: number;
}
