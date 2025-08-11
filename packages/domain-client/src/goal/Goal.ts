import { GoalCore } from '@dailyuse/domain-core';

/**
 * 客户端目标实现 - 专注于UI展示和客户端计算
 * 不包含复杂的业务逻辑，主要用于数据展示和UI交互
 */
export class Goal extends GoalCore {
  // ===== 客户端实现（简单的状态更新，不涉及复杂业务逻辑）=====

  pause(): void {
    // 客户端版本只做简单的状态更新，具体业务逻辑由API处理
    console.log('Goal paused on client side');
  }

  activate(): void {
    console.log('Goal activated on client side');
  }

  complete(): void {
    console.log('Goal completed on client side');
  }

  archive(): void {
    console.log('Goal archived on client side');
  }

  // ===== 客户端专用UI辅助方法 =====

  /**
   * 获取状态显示文本
   */
  getStatusText(): string {
    const statusMap = {
      active: '进行中',
      completed: '已完成',
      paused: '已暂停',
      archived: '已归档',
    };
    return statusMap[this._status] || '未知状态';
  }

  /**
   * 获取状态对应的颜色
   */
  getStatusColor(): 'success' | 'warning' | 'info' | 'default' {
    const colorMap = {
      active: 'info' as const,
      completed: 'success' as const,
      paused: 'warning' as const,
      archived: 'default' as const,
    };
    return colorMap[this._status] || 'default';
  }

  /**
   * 获取进度百分比（简化版，客户端通常从API获取）
   */
  getProgressPercentage(): number {
    if (this._status === 'completed') return 100;
    if (this._status === 'archived') return 0;

    // 简单的时间进度计算
    const now = new Date();
    const total = this._endTime.getTime() - this._startTime.getTime();
    const elapsed = now.getTime() - this._startTime.getTime();

    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }

  /**
   * 格式化时间显示
   */
  getFormattedTimeRange(): string {
    const formatter = new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    return `${formatter.format(this._startTime)} - ${formatter.format(this._endTime)}`;
  }

  /**
   * 获取剩余时间的友好显示
   */
  getTimeRemainingText(): string {
    if (this.isOverdue) {
      return '已逾期';
    }

    if (this.isCompleted) {
      return '已完成';
    }

    const days = this.daysRemaining;
    if (days === 0) {
      return '今天截止';
    } else if (days === 1) {
      return '明天截止';
    } else if (days < 7) {
      return `${days}天后截止`;
    } else if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `${weeks}周后截止`;
    } else {
      const months = Math.floor(days / 30);
      return `${months}个月后截止`;
    }
  }

  /**
   * 获取目标卡片显示信息
   */
  getCardInfo(): {
    name: string;
    description?: string;
    color: string;
    status: string;
    statusColor: 'success' | 'warning' | 'info' | 'default';
    timeRange: string;
    timeRemaining: string;
    progress: number;
    isOverdue: boolean;
    canEdit: boolean;
  } {
    return {
      name: this._name,
      description: this._description,
      color: this._color,
      status: this.getStatusText(),
      statusColor: this.getStatusColor(),
      timeRange: this.getFormattedTimeRange(),
      timeRemaining: this.getTimeRemainingText(),
      progress: this.getProgressPercentage(),
      isOverdue: this.isOverdue,
      canEdit: this.isActive || this.isPaused,
    };
  }

  /**
   * 获取目标统计信息（用于仪表盘展示）
   */
  getStatistics(): {
    totalDays: number;
    remainingDays: number;
    elapsedDays: number;
    progressPercentage: number;
    status: string;
  } {
    const now = new Date();
    const totalDays = this.durationInDays;
    const elapsedTime = now.getTime() - this._startTime.getTime();
    const elapsedDays = Math.max(0, Math.floor(elapsedTime / (1000 * 60 * 60 * 24)));

    return {
      totalDays,
      remainingDays: this.daysRemaining,
      elapsedDays,
      progressPercentage: this.getProgressPercentage(),
      status: this.getStatusText(),
    };
  }

  /**
   * 检查是否可以执行某个操作（UI权限控制）
   */
  canPerformAction(action: 'edit' | 'pause' | 'resume' | 'complete' | 'archive'): boolean {
    switch (action) {
      case 'edit':
        return this.isActive || this.isPaused;
      case 'pause':
        return this.isActive;
      case 'resume':
        return this.isPaused;
      case 'complete':
        return this.isActive || this.isPaused;
      case 'archive':
        return true; // 任何状态都可以归档
      default:
        return false;
    }
  }

  /**
   * 获取可用的操作列表（用于上下文菜单）
   */
  getAvailableActions(): Array<{
    key: string;
    label: string;
    icon?: string;
    disabled?: boolean;
  }> {
    const actions = [
      {
        key: 'edit',
        label: '编辑',
        icon: 'edit',
        disabled: !this.canPerformAction('edit'),
      },
      {
        key: 'pause',
        label: '暂停',
        icon: 'pause',
        disabled: !this.canPerformAction('pause'),
      },
      {
        key: 'resume',
        label: '恢复',
        icon: 'play',
        disabled: !this.canPerformAction('resume'),
      },
      {
        key: 'complete',
        label: '完成',
        icon: 'check',
        disabled: !this.canPerformAction('complete'),
      },
      {
        key: 'archive',
        label: '归档',
        icon: 'archive',
        disabled: !this.canPerformAction('archive'),
      },
    ];

    return actions.filter((action) => !action.disabled);
  }

  // ===== 客户端数据转换方法 =====

  /**
   * 转换为表单数据（用于编辑表单）
   */
  toFormData(): {
    name: string;
    description: string;
    color: string;
    dirUuid: string;
    startTime: string;
    endTime: string;
    note: string;
  } {
    return {
      name: this._name,
      description: this._description || '',
      color: this._color,
      dirUuid: this._dirUuid || '',
      startTime: this._startTime.toISOString().split('T')[0], // YYYY-MM-DD格式
      endTime: this._endTime.toISOString().split('T')[0],
      note: this._note || '',
    };
  }

  /**
   * 从DTO创建客户端实例
   */
  static fromDTO(dto: any): Goal {
    return new Goal({
      uuid: dto.uuid,
      name: dto.name,
      description: dto.description,
      color: dto.color,
      dirUuid: dto.dirUuid,
      startTime: dto.startTime ? new Date(dto.startTime) : undefined,
      endTime: dto.endTime ? new Date(dto.endTime) : undefined,
      note: dto.note,
      status: dto.status,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined,
      version: dto.version,
    });
  }

  /**
   * 创建一个空的目标实例（用于新建表单）
   */
  static forCreate(): Goal {
    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30天后

    return new Goal({
      name: '',
      color: '#FF5733',
      startTime: now,
      endTime: endDate,
    });
  }

  /**
   * 客户端缓存键
   */
  getCacheKey(): string {
    return `goal_${this.uuid}`;
  }

  /**
   * 检查是否需要刷新（基于更新时间）
   */
  shouldRefresh(): boolean {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this._updatedAt < fiveMinutesAgo;
  }
}
