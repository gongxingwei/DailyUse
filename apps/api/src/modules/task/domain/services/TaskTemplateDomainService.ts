import type { TaskContracts } from '@dailyuse/contracts';
import type { ITaskTemplateAggregateRepository } from '@dailyuse/domain-server';
import { TaskDomainException, TaskErrorCode } from '@dailyuse/domain-server';

/**
 * TaskTemplate 领域服务
 *
 * 职责：
 * - 处理 TaskTemplate 聚合根的核心业务逻辑
 * - 通过 ITaskTemplateAggregateRepository 接口操作数据（返回实体）
 * - 验证业务规则
 * - 管理模板及其子实体 TaskInstance
 *
 * 设计原则（参考 GoalDomainService）：
 * - 依赖倒置：只依赖仓储接口
 * - 单一职责：只处理 TaskTemplate 聚合根相关的领域逻辑
 * - 与技术解耦：无任何基础设施细节
 * - 仓储返回实体，服务层转换为DTO/ClientDTO
 *
 * 注意：由于 TaskTemplate 聚合根复杂性较高（包含 TaskInstance 子实体），
 * 当前保持简化实现，后续根据需要扩展
 */
export class TaskTemplateDomainService {
  constructor(private readonly templateRepository: ITaskTemplateAggregateRepository) {}

  // TODO: 实现完整的 TaskTemplate 业务逻辑
  // 包括 CRUD、状态管理、TaskInstance 子实体管理等
}
