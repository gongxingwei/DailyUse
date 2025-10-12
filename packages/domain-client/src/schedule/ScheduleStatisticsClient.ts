/**
 * ScheduleStatistics Client Domain Model
 * 调度统计客户端领域模型
 *
 * 封装 ScheduleStatistics 的客户端逻辑:
 * - UI 状态计算
 * - 图表数据转换
 * - 客户端友好的 API
 *
 * @domain-client/schedule
 */

import { ScheduleContracts } from '@dailyuse/contracts';

type ScheduleStatisticsClientDTO = ScheduleContracts.ScheduleStatisticsClientDTO;

/**
 * ScheduleStatistics 客户端领域模型
 */
export class ScheduleStatisticsClient {
  // ============ 私有字段 ============
  private _data: ScheduleStatisticsClientDTO;

  // ============ 构造函数 ============
  private constructor(data: ScheduleStatisticsClientDTO) {
    this._data = data;
  }

  // ============ 基础属性 Getters ============

  get uuid(): string {
    return this._data.uuid;
  }

  get accountUuid(): string {
    return this._data.accountUuid;
  }

  get totalTasks(): number {
    return this._data.totalTasks;
  }

  get activeTasks(): number {
    return this._data.activeTasks;
  }

  get pausedTasks(): number {
    return this._data.pausedTasks;
  }

  get completedTasks(): number {
    return this._data.completedTasks;
  }

  get cancelledTasks(): number {
    return this._data.cancelledTasks;
  }

  get failedTasks(): number {
    return this._data.failedTasks;
  }

  get totalExecutions(): number {
    return this._data.totalExecutions;
  }

  get successfulExecutions(): number {
    return this._data.successfulExecutions;
  }

  get failedExecutions(): number {
    return this._data.failedExecutions;
  }

  get skippedExecutions(): number {
    return this._data.skippedExecutions;
  }

  get timeoutExecutions(): number {
    return this._data.timeoutExecutions;
  }

  get avgExecutionDuration(): number {
    return this._data.avgExecutionDuration;
  }

  get minExecutionDuration(): number {
    return this._data.minExecutionDuration;
  }

  get maxExecutionDuration(): number {
    return this._data.maxExecutionDuration;
  }

  get moduleStatistics(): ScheduleStatisticsClientDTO['moduleStatistics'] {
    return this._data.moduleStatistics;
  }

  get createdAt(): number {
    return this._data.createdAt;
  }

  get lastUpdatedAt(): number {
    return this._data.lastUpdatedAt;
  }

  // UI 辅助属性
  get totalTasksDisplay(): string {
    return this._data.totalTasksDisplay;
  }

  get activeTasksDisplay(): string {
    return this._data.activeTasksDisplay;
  }

  get successRateDisplay(): string {
    return this._data.successRateDisplay;
  }

  get avgDurationDisplay(): string {
    return this._data.avgDurationDisplay;
  }

  get healthStatus(): string {
    return this._data.healthStatus;
  }

  // ============ 计算属性 ============

  /**
   * 成功率
   */
  get successRate(): number {
    if (this.totalExecutions === 0) return 0;
    return (this.successfulExecutions / this.totalExecutions) * 100;
  }

  /**
   * 失败率
   */
  get failureRate(): number {
    if (this.totalExecutions === 0) return 0;
    return (this.failedExecutions / this.totalExecutions) * 100;
  }

  /**
   * 健康分数 (0-100)
   */
  get healthScore(): number {
    if (this.totalExecutions === 0) return 100;

    const successWeight = 0.6;
    const failureWeight = 0.3;
    const timeoutWeight = 0.1;

    const successScore = this.successRate * successWeight;
    const failureScore = (100 - this.failureRate) * failureWeight;
    const timeoutRate = (this.timeoutExecutions / this.totalExecutions) * 100;
    const timeoutScore = (100 - timeoutRate) * timeoutWeight;

    return Math.round(successScore + failureScore + timeoutScore);
  }

  /**
   * 健康状态颜色
   */
  get healthStatusColor(): 'success' | 'warning' | 'error' {
    const score = this.healthScore;
    if (score >= 80) return 'success';
    if (score >= 50) return 'warning';
    return 'error';
  }

  // ============ 图表数据 ============

  /**
   * 任务状态饼图数据
   */
  getTaskStatusChartData(): Array<{ name: string; value: number; color: string }> {
    return [
      { name: '活跃', value: this.activeTasks, color: '#52c41a' },
      { name: '暂停', value: this.pausedTasks, color: '#faad14' },
      { name: '完成', value: this.completedTasks, color: '#1890ff' },
      { name: '取消', value: this.cancelledTasks, color: '#d9d9d9' },
      { name: '失败', value: this.failedTasks, color: '#f5222d' },
    ].filter((item) => item.value > 0);
  }

  /**
   * 执行状态饼图数据
   */
  getExecutionStatusChartData(): Array<{ name: string; value: number; color: string }> {
    return [
      { name: '成功', value: this.successfulExecutions, color: '#52c41a' },
      { name: '失败', value: this.failedExecutions, color: '#f5222d' },
      { name: '超时', value: this.timeoutExecutions, color: '#faad14' },
      { name: '跳过', value: this.skippedExecutions, color: '#d9d9d9' },
    ].filter((item) => item.value > 0);
  }

  /**
   * 模块分布柱状图数据
   */
  getModuleDistributionChartData(): Array<{ name: string; tasks: number; executions: number }> {
    const modules = Object.entries(this.moduleStatistics);
    return modules.map(([moduleName, stats]) => ({
      name: this._getModuleDisplayName(moduleName),
      tasks: stats.totalTasks,
      executions: stats.totalExecutions,
    }));
  }

  /**
   * 执行时长范围数据
   */
  getExecutionDurationStats(): {
    min: string;
    avg: string;
    max: string;
  } {
    return {
      min: this._formatDuration(this.minExecutionDuration),
      avg: this._formatDuration(this.avgExecutionDuration),
      max: this._formatDuration(this.maxExecutionDuration),
    };
  }

  // ============ 私有辅助方法 ============

  private _getModuleDisplayName(moduleName: string): string {
    const moduleMap: Record<string, string> = {
      reminder: '提醒',
      task: '任务',
      goal: '目标',
      notification: '通知',
    };
    return moduleMap[moduleName] || moduleName;
  }

  private _formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}min`;
    return `${(ms / 3600000).toFixed(1)}h`;
  }

  // ============ DTO 转换 ============

  /**
   * 转换为 DTO
   */
  toDTO(): ScheduleStatisticsClientDTO {
    return { ...this._data };
  }

  // ============ 静态工厂方法 ============

  /**
   * 从 DTO 创建
   */
  static fromDTO(dto: ScheduleStatisticsClientDTO): ScheduleStatisticsClient {
    return new ScheduleStatisticsClient(dto);
  }
}
