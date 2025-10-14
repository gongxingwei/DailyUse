/**
 * ReminderStatistics 聚合根实现 (Client)
 */

import type { ReminderContracts } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';

type IReminderStatisticsClient = ReminderContracts.ReminderStatisticsClient;
type ReminderStatisticsClientDTO = ReminderContracts.ReminderStatisticsClientDTO;
type ReminderStatisticsServerDTO = ReminderContracts.ReminderStatisticsServerDTO;
type TemplateStatsInfo = ReminderContracts.TemplateStatsInfo;
type GroupStatsInfo = ReminderContracts.GroupStatsInfo;
type TriggerStatsInfo = ReminderContracts.TriggerStatsInfo;

/**
 * ReminderStatistics 聚合根 (Client)
 */
export class ReminderStatisticsClient extends AggregateRoot implements IReminderStatisticsClient {
  private _accountUuid: string;
  private _templateStats: TemplateStatsInfo;
  private _groupStats: GroupStatsInfo;
  private _triggerStats: TriggerStatsInfo;
  private _calculatedAt: number;

  private constructor(params: {
    uuid: string;
    accountUuid: string;
    templateStats: TemplateStatsInfo;
    groupStats: GroupStatsInfo;
    triggerStats: TriggerStatsInfo;
    calculatedAt: number;
  }) {
    super(params.uuid);
    this._accountUuid = params.accountUuid;
    this._templateStats = params.templateStats;
    this._groupStats = params.groupStats;
    this._triggerStats = params.triggerStats;
    this._calculatedAt = params.calculatedAt;
  }

  // ========== Getters ==========

  get accountUuid(): string {
    return this._accountUuid;
  }

  get templateStats(): TemplateStatsInfo {
    return { ...this._templateStats };
  }

  get groupStats(): GroupStatsInfo {
    return { ...this._groupStats };
  }

  get triggerStats(): TriggerStatsInfo {
    return { ...this._triggerStats };
  }

  get calculatedAt(): number {
    return this._calculatedAt;
  }

  // ========== UI 计算属性 ==========

  get todayTriggersText(): string {
    return `今日 ${this._triggerStats.todayTriggers} 次`;
  }

  get weekTriggersText(): string {
    return `本周 ${this._triggerStats.weekTriggers} 次`;
  }

  get successRateText(): string {
    const rate = this.getSuccessRate();
    return `成功率 ${rate.toFixed(1)}%`;
  }

  // ========== UI 业务方法 ==========

  /**
   * 获取成功率 (0-100)
   */
  getSuccessRate(): number {
    if (this._triggerStats.totalTriggers === 0) {
      return 100;
    }
    return (this._triggerStats.successfulTriggers / this._triggerStats.totalTriggers) * 100;
  }

  /**
   * 获取触发趋势
   */
  getTriggerTrend(): 'UP' | 'DOWN' | 'STABLE' {
    const { todayTriggers, weekTriggers } = this._triggerStats;
    const avgPerDay = weekTriggers / 7;

    if (todayTriggers > avgPerDay * 1.2) {
      return 'UP';
    } else if (todayTriggers < avgPerDay * 0.8) {
      return 'DOWN';
    }
    return 'STABLE';
  }

  // ========== DTO 转换 ==========

  toServerDTO(): ReminderStatisticsServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      templateStats: this._templateStats,
      groupStats: this._groupStats,
      triggerStats: this._triggerStats,
      calculatedAt: this._calculatedAt,
    };
  }

  toClientDTO(): ReminderStatisticsClientDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      templateStats: this._templateStats,
      groupStats: this._groupStats,
      triggerStats: this._triggerStats,
      calculatedAt: this._calculatedAt,
      todayTriggersText: this.todayTriggersText,
      weekTriggersText: this.weekTriggersText,
      successRateText: this.successRateText,
    };
  }

  // ========== 静态工厂方法 ==========

  /**
   * 从 Server DTO 创建客户端实体
   */
  static fromServerDTO(dto: ReminderStatisticsServerDTO): ReminderStatisticsClient {
    return new ReminderStatisticsClient({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      templateStats: dto.templateStats,
      groupStats: dto.groupStats,
      triggerStats: dto.triggerStats,
      calculatedAt: dto.calculatedAt,
    });
  }

  /**
   * 从 Client DTO 创建客户端实体
   */
  static fromClientDTO(dto: ReminderStatisticsClientDTO): ReminderStatisticsClient {
    return new ReminderStatisticsClient({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      templateStats: dto.templateStats,
      groupStats: dto.groupStats,
      triggerStats: dto.triggerStats,
      calculatedAt: dto.calculatedAt,
    });
  }

  /**
   * 创建默认统计实例
   */
  static createDefault(accountUuid: string): ReminderStatisticsClient {
    return new ReminderStatisticsClient({
      uuid: AggregateRoot.generateUUID(),
      accountUuid,
      templateStats: {
        totalTemplates: 0,
        activeTemplates: 0,
        pausedTemplates: 0,
        oneTimeTemplates: 0,
        recurringTemplates: 0,
      },
      groupStats: {
        totalGroups: 0,
        activeGroups: 0,
        pausedGroups: 0,
        groupControlledGroups: 0,
        individualControlledGroups: 0,
      },
      triggerStats: {
        todayTriggers: 0,
        weekTriggers: 0,
        monthTriggers: 0,
        totalTriggers: 0,
        successfulTriggers: 0,
        failedTriggers: 0,
      },
      calculatedAt: Date.now(),
    });
  }
}
