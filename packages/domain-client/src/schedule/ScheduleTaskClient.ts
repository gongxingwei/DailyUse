/**
 * ScheduleTask Client Domain Model
 * 调度任务客户端领域模型
 *
 * 封装 ScheduleTask 的客户端逻辑:
 * - UI 状态计算
 * - 客户端友好的 API
 * - 与 domain-server 的 DTO 转换
 *
 * @domain-client/schedule
 */

import { ScheduleContracts } from '@dailyuse/contracts';

type ScheduleTaskClientDTO = ScheduleContracts.ScheduleTaskClientDTO;
type ScheduleTaskStatus = ScheduleContracts.ScheduleTaskStatus;
type SourceModule = ScheduleContracts.SourceModule;
type ExecutionStatus = ScheduleContracts.ExecutionStatus;

/**
 * ScheduleTask 客户端领域模型
 */
export class ScheduleTaskClient {
  // ============ 私有字段 ============
  private _data: ScheduleTaskClientDTO;

  // ============ 构造函数 ============
  private constructor(data: ScheduleTaskClientDTO) {
    this._data = data;
  }

  // ============ 基础属性 Getters ============

  get uuid(): string {
    return this._data.uuid;
  }

  get accountUuid(): string {
    return this._data.accountUuid;
  }

  get name(): string {
    return this._data.name;
  }

  get description(): string | undefined {
    return this._data.description;
  }

  get sourceModule(): SourceModule {
    return this._data.sourceModule;
  }

  get sourceEntityId(): string {
    return this._data.sourceEntityId;
  }

  get status(): ScheduleTaskStatus {
    return this._data.status;
  }

  get enabled(): boolean {
    return this._data.enabled;
  }

  get schedule(): ScheduleTaskClientDTO['schedule'] {
    return this._data.schedule;
  }

  get retryPolicy(): ScheduleTaskClientDTO['retryPolicy'] {
    return this._data.retryPolicy;
  }

  get metadata(): ScheduleTaskClientDTO['metadata'] {
    return this._data.metadata;
  }

  get executionInfo(): ScheduleTaskClientDTO['executionInfo'] {
    return this._data.executionInfo;
  }

  get recentExecutions(): ScheduleTaskClientDTO['recentExecutions'] {
    return this._data.recentExecutions;
  }

  get nextRunAt(): number | null {
    return this._data.nextRunAt;
  }

  get lastRunAt(): number | null {
    return this._data.lastRunAt;
  }

  get createdAt(): number {
    return this._data.createdAt;
  }

  get updatedAt(): number {
    return this._data.updatedAt;
  }

  // ============ UI 辅助属性 ============

  /**
   * 是否为活跃任务
   */
  get isActive(): boolean {
    return this.status === 'active' && this.enabled;
  }

  /**
   * 是否已暂停
   */
  get isPaused(): boolean {
    return this.status === 'paused' || !this.enabled;
  }

  /**
   * 是否已完成
   */
  get isCompleted(): boolean {
    return this.status === 'completed';
  }

  /**
   * 是否已失败
   */
  get isFailed(): boolean {
    return this.status === 'failed';
  }

  /**
   * 是否已取消
   */
  get isCancelled(): boolean {
    return this.status === 'cancelled';
  }

  /**
   * 是否可以执行
   */
  get canExecute(): boolean {
    return this.isActive && this.nextRunAt !== null && this.nextRunAt <= Date.now();
  }

  /**
   * 是否需要重试
   */
  get needsRetry(): boolean {
    if (!this.executionInfo) return false;
    const { consecutiveFailures } = this.executionInfo;
    const { maxRetries } = this.retryPolicy;
    return consecutiveFailures > 0 && consecutiveFailures < maxRetries;
  }

  /**
   * 状态显示文本 (中文)
   */
  get statusText(): string {
    const statusMap: Record<ScheduleTaskStatus, string> = {
      active: '活跃',
      paused: '已暂停',
      completed: '已完成',
      failed: '失败',
      cancelled: '已取消',
    };
    return statusMap[this.status] || '未知';
  }

  /**
   * 状态颜色 (UI 用)
   */
  get statusColor(): 'success' | 'warning' | 'error' | 'default' | 'processing' | 'info' {
    const colorMap: Record<
      ScheduleTaskStatus,
      'success' | 'warning' | 'error' | 'default' | 'processing' | 'info'
    > = {
      active: 'processing',
      paused: 'warning',
      completed: 'success',
      failed: 'error',
      cancelled: 'default',
    };
    return colorMap[this.status] || 'default';
  }

  /**
   * 来源模块显示文本 (中文)
   */
  get sourceModuleText(): string {
    const moduleMap: Record<SourceModule, string> = {
      reminder: '提醒',
      task: '任务',
      goal: '目标',
      notification: '通知',
    };
    return moduleMap[this.sourceModule] || '未知';
  }

  /**
   * Cron 表达式的人类可读描述
   */
  get scheduleDescription(): string {
    // 简单实现，实际可以用 cronstrue 库
    return `每 ${this.schedule.cronExpression}`;
  }

  /**
   * 下次运行时间的格式化文本
   */
  get nextRunAtText(): string {
    if (!this.nextRunAt) return '未安排';
    const date = new Date(this.nextRunAt);
    return date.toLocaleString('zh-CN');
  }

  /**
   * 上次运行时间的格式化文本
   */
  get lastRunAtText(): string {
    if (!this.lastRunAt) return '从未运行';
    const date = new Date(this.lastRunAt);
    return date.toLocaleString('zh-CN');
  }

  /**
   * 成功率 (百分比)
   */
  get successRate(): number {
    if (!this.executionInfo || this.executionInfo.totalExecutions === 0) {
      return 0;
    }
    return (this.executionInfo.successfulExecutions / this.executionInfo.totalExecutions) * 100;
  }

  /**
   * 失败率 (百分比)
   */
  get failureRate(): number {
    if (!this.executionInfo || this.executionInfo.totalExecutions === 0) {
      return 0;
    }
    return (this.executionInfo.failedExecutions / this.executionInfo.totalExecutions) * 100;
  }

  /**
   * 最近的执行状态
   */
  get latestExecutionStatus(): ExecutionStatus | null {
    if (!this.recentExecutions || this.recentExecutions.length === 0) {
      return null;
    }
    return this.recentExecutions[0].status;
  }

  /**
   * 最近执行的状态文本
   */
  get latestExecutionStatusText(): string {
    const status = this.latestExecutionStatus;
    if (!status) return '暂无执行记录';

    const statusMap: Record<ExecutionStatus, string> = {
      success: '成功',
      failed: '失败',
      timeout: '超时',
      skipped: '已跳过',
    };
    return statusMap[status] || '未知';
  }

  // ============ 业务方法 ============

  /**
   * 检查是否有标签
   */
  hasTag(tag: string): boolean {
    return this.metadata.tags.includes(tag);
  }

  /**
   * 检查是否包含任意一个标签
   */
  hasAnyTag(tags: string[]): boolean {
    return tags.some((tag) => this.hasTag(tag));
  }

  /**
   * 检查是否包含所有标签
   */
  hasAllTags(tags: string[]): boolean {
    return tags.every((tag) => this.hasTag(tag));
  }

  /**
   * 获取 payload 中的值
   */
  getPayloadValue<T = unknown>(key: string): T | undefined {
    return this.metadata.payload[key] as T | undefined;
  }

  /**
   * 检查 payload 中是否有某个 key
   */
  hasPayloadKey(key: string): boolean {
    return key in this.metadata.payload;
  }

  // ============ DTO 转换 ============

  /**
   * 转换为 DTO
   */
  toDTO(): ScheduleTaskClientDTO {
    return { ...this._data };
  }

  // ============ 静态工厂方法 ============

  /**
   * 从 DTO 创建
   */
  static fromDTO(dto: ScheduleTaskClientDTO): ScheduleTaskClient {
    return new ScheduleTaskClient(dto);
  }

  /**
   * 批量从 DTO 创建
   */
  static fromDTOs(dtos: ScheduleTaskClientDTO[]): ScheduleTaskClient[] {
    return dtos.map((dto) => ScheduleTaskClient.fromDTO(dto));
  }
}
