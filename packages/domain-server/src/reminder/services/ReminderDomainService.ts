import type {
  IReminderGroupRepository,
  IReminderStatisticsRepository,
  IReminderTemplateRepository,
} from '../repositories';

/**
 * Reminder Domain Service
 *
 * 核心职责：
 * - 编排和协调 Reminder 模块内的多个聚合根和实体。
 * - 处理跨聚合的复杂业务规则和不变量。
 * - 封装核心业务流程，供 Application Service 调用。
 *
 * 关键原则：
 * - 无状态：领域服务自身不持有状态，所有状态通过仓储加载和持久化。
 * - 依赖于抽象：依赖于仓储接口（IRepository），而不是具体实现。
 * - 业务逻辑的内聚中心：将分散在应用服务中的业务逻辑下沉到此。
 */
export class ReminderDomainService {
  constructor(
    private reminderTemplateRepository: IReminderTemplateRepository,
    private reminderGroupRepository: IReminderGroupRepository,
    private reminderStatisticsRepository: IReminderStatisticsRepository,
  ) {}

  // 在这里添加处理提醒相关业务逻辑的方法
  // 例如:
  // public async createComplexReminder(...) { ... }
  // public async processReminderTrigger(...) { ... }
}
