/**
 * Task 统计仓储接口（读模型聚合根）
 */
import type { TaskContracts } from '@dailyuse/contracts';

export interface ITaskStatsAggregateRepository {
  getAccountStats(accountUuid: string): Promise<TaskContracts.TaskStatsDTO>;
  getTemplateStats(templateUuid: string): Promise<TaskContracts.TaskStatsDTO['byTemplate'][0]>;
  getDateRangeStats(
    accountUuid: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TaskContracts.TaskStatsDTO['byTimePeriod']>;
}
