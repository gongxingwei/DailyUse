/**
 * ReminderStatistics 聚合根实现
 * 实现 ReminderStatisticsServer 接口
 */

import { ReminderContracts } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';

type IReminderStatisticsServer = ReminderContracts.ReminderStatisticsServer;
type ReminderStatisticsServerDTO = ReminderContracts.ReminderStatisticsServerDTO;
type ReminderStatisticsClientDTO = ReminderContracts.ReminderStatisticsClientDTO;
type ReminderStatisticsPersistenceDTO = ReminderContracts.ReminderStatisticsPersistenceDTO;
type TemplateStatsInfo = ReminderContracts.TemplateStatsInfo;
type GroupStatsInfo = ReminderContracts.GroupStatsInfo;
type TriggerStatsInfo = ReminderContracts.TriggerStatsInfo;

export class ReminderStatistics extends AggregateRoot implements IReminderStatisticsServer {
  private _accountUuid: string;
  private _templateStats: TemplateStatsInfo;
  private _groupStats: GroupStatsInfo;
  private _triggerStats: TriggerStatsInfo;
  private _calculatedAt: number;

  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    templateStats: TemplateStatsInfo;
    groupStats: GroupStatsInfo;
    triggerStats: TriggerStatsInfo;
    calculatedAt: number;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._templateStats = params.templateStats;
    this._groupStats = params.groupStats;
    this._triggerStats = params.triggerStats;
    this._calculatedAt = params.calculatedAt;
  }

  public override get uuid(): string {
    return this._uuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get templateStats(): TemplateStatsInfo {
    return { ...this._templateStats };
  }
  public get groupStats(): GroupStatsInfo {
    return { ...this._groupStats };
  }
  public get triggerStats(): TriggerStatsInfo {
    return { ...this._triggerStats };
  }
  public get calculatedAt(): number {
    return this._calculatedAt;
  }

  public static create(params: { accountUuid: string }): ReminderStatistics {
    const uuid = params.accountUuid;
    const now = Date.now();
    return new ReminderStatistics({
      uuid,
      accountUuid: params.accountUuid,
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
      calculatedAt: now,
    });
  }

  public static fromServerDTO(dto: ReminderStatisticsServerDTO): ReminderStatistics {
    return new ReminderStatistics({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      templateStats: dto.templateStats,
      groupStats: dto.groupStats,
      triggerStats: dto.triggerStats,
      calculatedAt: dto.calculatedAt,
    });
  }

  public static fromPersistenceDTO(dto: ReminderStatisticsPersistenceDTO): ReminderStatistics {
    return new ReminderStatistics({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      templateStats: JSON.parse(dto.template_stats),
      groupStats: JSON.parse(dto.group_stats),
      triggerStats: JSON.parse(dto.trigger_stats),
      calculatedAt: dto.calculated_at,
    });
  }

  public async calculate(): Promise<void> {
    this._calculatedAt = Date.now();
    this.addDomainEvent({
      eventType: 'ReminderStatisticsUpdated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: { statistics: this.toServerDTO() },
    });
  }

  public async getTriggersInRange(startDate: number, endDate: number): Promise<number> {
    return 0;
  }

  public sync(data: {
    templateStats: TemplateStatsInfo;
    groupStats: GroupStatsInfo;
    triggerStats: TriggerStatsInfo;
  }): void {
    this._templateStats = data.templateStats;
    this._groupStats = data.groupStats;
    this._triggerStats = data.triggerStats;
    this._calculatedAt = Date.now();
  }

  public toServerDTO(): ReminderStatisticsServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      templateStats: this.templateStats,
      groupStats: this.groupStats,
      triggerStats: this.triggerStats,
      calculatedAt: this.calculatedAt,
    };
  }

  public toClientDTO(): ReminderStatisticsClientDTO {
    const successRate =
      this.triggerStats.totalTriggers > 0
        ? (this.triggerStats.successfulTriggers / this.triggerStats.totalTriggers) * 100
        : 0;

    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      templateStats: this.templateStats,
      groupStats: this.groupStats,
      triggerStats: this.triggerStats,
      calculatedAt: this.calculatedAt,

      // UI 扩展
      todayTriggersText: `今日 ${this.triggerStats.todayTriggers} 次`,
      weekTriggersText: `本周 ${this.triggerStats.weekTriggers} 次`,
      successRateText: `成功率 ${successRate.toFixed(1)}%`,
    };
  }

  public toPersistenceDTO(): ReminderStatisticsPersistenceDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      template_stats: JSON.stringify(this.templateStats),
      group_stats: JSON.stringify(this.groupStats),
      trigger_stats: JSON.stringify(this.triggerStats),
      calculated_at: this.calculatedAt,
    };
  }
}
