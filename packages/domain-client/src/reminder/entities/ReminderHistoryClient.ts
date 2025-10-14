/**
 * ReminderHistory 实体实现 (Client)
 */

import type { ReminderContracts } from '@dailyuse/contracts';
import { ReminderContracts as RC } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';

type IReminderHistoryClient = ReminderContracts.ReminderHistoryClient;
type ReminderHistoryClientDTO = ReminderContracts.ReminderHistoryClientDTO;
type ReminderHistoryServerDTO = ReminderContracts.ReminderHistoryServerDTO;
type TriggerResult = ReminderContracts.TriggerResult;
type NotificationChannel = ReminderContracts.NotificationChannel;

const TriggerResult = RC.TriggerResult;

/**
 * ReminderHistory 实体 (Client)
 */
export class ReminderHistoryClient extends Entity implements IReminderHistoryClient {
  private _templateUuid: string;
  private _triggeredAt: number;
  private _result: TriggerResult;
  private _error?: string | null;
  private _notificationSent: boolean;
  private _notificationChannels?: NotificationChannel[] | null;
  private _createdAt: number;

  private constructor(params: {
    uuid: string;
    templateUuid: string;
    triggeredAt: number;
    result: TriggerResult;
    error?: string | null;
    notificationSent: boolean;
    notificationChannels?: NotificationChannel[] | null;
    createdAt: number;
  }) {
    super(params.uuid);
    this._templateUuid = params.templateUuid;
    this._triggeredAt = params.triggeredAt;
    this._result = params.result;
    this._error = params.error;
    this._notificationSent = params.notificationSent;
    this._notificationChannels = params.notificationChannels;
    this._createdAt = params.createdAt;
  }

  // ========== Getters ==========

  get templateUuid(): string {
    return this._templateUuid;
  }

  get triggeredAt(): number {
    return this._triggeredAt;
  }

  get result(): TriggerResult {
    return this._result;
  }

  get error(): string | null | undefined {
    return this._error;
  }

  get notificationSent(): boolean {
    return this._notificationSent;
  }

  get notificationChannels(): NotificationChannel[] | null | undefined {
    return this._notificationChannels
      ? [...this._notificationChannels]
      : this._notificationChannels;
  }

  get createdAt(): number {
    return this._createdAt;
  }

  // ========== UI 计算属性 ==========

  get resultText(): string {
    const resultTexts: Record<TriggerResult, string> = {
      [TriggerResult.SUCCESS]: '成功',
      [TriggerResult.FAILED]: '失败',
      [TriggerResult.SKIPPED]: '跳过',
    };
    return resultTexts[this._result];
  }

  get timeAgo(): string {
    return this.formatTimeAgo(this._triggeredAt);
  }

  get channelsText(): string | null {
    if (!this._notificationChannels || this._notificationChannels.length === 0) {
      return null;
    }

    const channelNames: Record<NotificationChannel, string> = {
      IN_APP: '应用内',
      PUSH: '推送',
      EMAIL: '邮件',
      SMS: '短信',
    };

    return this._notificationChannels.map((ch) => channelNames[ch] || ch).join(' + ');
  }

  // ========== UI 业务方法 ==========

  /**
   * 获取结果徽章
   */
  getResultBadge(): { text: string; color: string; icon: string } {
    const badges: Record<TriggerResult, { text: string; color: string; icon: string }> = {
      [TriggerResult.SUCCESS]: { text: '成功', color: '#10B981', icon: '✅' },
      [TriggerResult.FAILED]: { text: '失败', color: '#EF4444', icon: '❌' },
      [TriggerResult.SKIPPED]: { text: '跳过', color: '#F59E0B', icon: '⏭️' },
    };
    return badges[this._result];
  }

  /**
   * 获取显示文本
   */
  getDisplayText(): string {
    const parts: string[] = [this.resultText, this.timeAgo];
    if (this._notificationSent && this.channelsText) {
      parts.push(`通过 ${this.channelsText}`);
    }
    if (this._error) {
      parts.push(`错误: ${this._error}`);
    }
    return parts.join(' · ');
  }

  /**
   * 是否成功
   */
  isSuccess(): boolean {
    return this._result === TriggerResult.SUCCESS;
  }

  /**
   * 是否失败
   */
  isFailed(): boolean {
    return this._result === TriggerResult.FAILED;
  }

  /**
   * 是否跳过
   */
  isSkipped(): boolean {
    return this._result === TriggerResult.SKIPPED;
  }

  // ========== DTO 转换 ==========

  toServerDTO(): ReminderHistoryServerDTO {
    return {
      uuid: this.uuid,
      templateUuid: this._templateUuid,
      triggeredAt: this._triggeredAt,
      result: this._result,
      error: this._error,
      notificationSent: this._notificationSent,
      notificationChannels: this._notificationChannels,
      createdAt: this._createdAt,
    };
  }

  toClientDTO(): ReminderHistoryClientDTO {
    return {
      uuid: this.uuid,
      templateUuid: this._templateUuid,
      triggeredAt: this._triggeredAt,
      result: this._result,
      error: this._error,
      notificationSent: this._notificationSent,
      notificationChannels: this._notificationChannels,
      createdAt: this._createdAt,
      resultText: this.resultText,
      timeAgo: this.timeAgo,
      channelsText: this.channelsText,
    };
  }

  // ========== 静态工厂方法 ==========

  /**
   * 从 Server DTO 创建客户端实体
   */
  static fromServerDTO(dto: ReminderHistoryServerDTO): ReminderHistoryClient {
    return new ReminderHistoryClient({
      uuid: dto.uuid,
      templateUuid: dto.templateUuid,
      triggeredAt: dto.triggeredAt,
      result: dto.result as TriggerResult,
      error: dto.error,
      notificationSent: dto.notificationSent,
      notificationChannels: dto.notificationChannels as NotificationChannel[] | null | undefined,
      createdAt: dto.createdAt,
    });
  }

  /**
   * 从 Client DTO 创建客户端实体
   */
  static fromClientDTO(dto: ReminderHistoryClientDTO): ReminderHistoryClient {
    return new ReminderHistoryClient({
      uuid: dto.uuid,
      templateUuid: dto.templateUuid,
      triggeredAt: dto.triggeredAt,
      result: dto.result as TriggerResult,
      error: dto.error,
      notificationSent: dto.notificationSent,
      notificationChannels: dto.notificationChannels as NotificationChannel[] | null | undefined,
      createdAt: dto.createdAt,
    });
  }

  // ========== 辅助方法 ==========

  /**
   * 格式化时间为相对时间
   */
  private formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} 天前`;
    } else if (hours > 0) {
      return `${hours} 小时前`;
    } else if (minutes > 0) {
      return `${minutes} 分钟前`;
    } else {
      return '刚刚';
    }
  }
}
