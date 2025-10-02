import { GoalDirCore } from '@dailyuse/domain-core';
import { GoalContracts } from '@dailyuse/contracts';

// 枚举别名
const GoalSortFieldEnum = GoalContracts.GoalSortField;
const GoalDirStatusEnum = GoalContracts.GoalDirStatus;

export class GoalDir extends GoalDirCore {
  constructor(params: {
    uuid?: string;
    name: string;
    description?: string;
    icon: string;
    color: string;
    parentUuid?: string;
    sortConfig?: {
      sortKey: GoalContracts.GoalSortField;
      sortOrder: number;
    };
    status?: GoalContracts.GoalDirStatus;
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
    this._lifecycle.status = GoalDirStatusEnum.ARCHIVED;
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
    this._lifecycle.status = GoalDirStatusEnum.ACTIVE;
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

  toDTO(): GoalContracts.GoalDirDTO {
    return {
      uuid: this.uuid,
      parentUuid: this.parentUuid,

      name: this.name,
      description: this.description,
      icon: this.icon,
      color: this.color,

      sortConfig: this.sortConfig,

      lifecycle: {
        status: this.lifecycle.status,
        createdAt: this.lifecycle.createdAt.getTime(),
        updatedAt: this.lifecycle.updatedAt.getTime(),
      },
    };
  }

  static fromDTO(dto: GoalContracts.GoalDirDTO): GoalDir {
    return new GoalDir({
      uuid: dto.uuid,
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

  toClient(goalsCount: number = 0): GoalContracts.GoalDirClientDTO {
    const baseDTO = this.toDTO();

    return {
      ...baseDTO,
      goalsCount,
    };
  }
}
