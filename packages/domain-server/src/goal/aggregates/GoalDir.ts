import { GoalDirCore } from '@dailyuse/domain-core';
import { GoalContracts } from '@dailyuse/contracts';

export class GoalDir extends GoalDirCore {
  constructor(params: {
    uuid?: string;
    accountUuid: string;
    name: string;
    description?: string;
    icon: string;
    color: string;
    parentUuid?: string;
    sortConfig?: {
      sortKey: string;
      sortOrder: number;
    };
    status?: 'active' | 'archived';
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(params);
  }

  // ===== 服务端特有方法 =====

  /**
   * 归档目录
   */
  archive(): void {
    this._lifecycle.status = 'archived';
    this._lifecycle.updatedAt = new Date();

    // 触发领域事件
    this.addDomainEvent({
      eventType: 'GoalDirUpdated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        accountUuid: '', // 需要从上下文获取
        goalDirId: this.uuid,
        changes: {
          // status: 'archived' // 如果需要的话
        },
      },
    });
  }

  /**
   * 激活目录
   */
  activate(): void {
    this._lifecycle.status = 'active';
    this._lifecycle.updatedAt = new Date();

    // 触发领域事件
    this.addDomainEvent({
      eventType: 'GoalDirUpdated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        accountUuid: '', // 需要从上下文获取
        goalDirId: this.uuid,
        changes: {
          // status: 'active' // 如果需要的话
        },
      },
    });
  }

  /**
   * 检查是否可以删除
   */
  canDelete(): boolean {
    // 系统目录不能删除
    if (this.uuid.startsWith('system_')) {
      return false;
    }

    return this._lifecycle.status === 'archived';
  }

  /**
   * 删除目录
   */
  delete(): void {
    if (!this.canDelete()) {
      throw new Error('只有已归档的非系统目录可以删除');
    }

    // 触发领域事件
    this.addDomainEvent({
      eventType: 'GoalDirDeleted',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        accountUuid: '', // 需要从上下文获取
        goalDirId: this.uuid,
        name: this._name,
      },
    });
  }

  // ===== 序列化方法 =====

  static fromDTO(dto: GoalContracts.GoalDirDTO): GoalDir {
    return new GoalDir({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      description: dto.description,
      icon: dto.icon,
      color: dto.color,
      parentUuid: dto.parentUuid,
      sortConfig: dto.sortConfig,
      status: dto.lifecycle.status,
      createdAt: new Date(dto.lifecycle.createdAt),
      updatedAt: new Date(dto.lifecycle.updatedAt),
    });
  }

  toResponse(goalsCount: number = 0): GoalContracts.GoalDirResponse {
    const baseDTO = this.toDTO();

    return {
      ...baseDTO,
      goalsCount,
    };
  }
}
