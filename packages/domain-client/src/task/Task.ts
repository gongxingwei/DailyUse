import { TaskCore } from '@dailyuse/domain-core';

/**
 * 客户端任务实现 - 专注于UI展示和客户端计算
 * 状态显示、格式化、进度计算等UI专用方法
 */
export class Task extends TaskCore {
  // ===== 客户端实现（简单版本）=====

  start(): void {
    console.log('Task started on client side');
  }

  complete(): void {
    console.log('Task completed on client side');
  }

  cancel(): void {
    console.log('Task cancelled on client side');
  }

  updateTitle(newTitle: string): void {
    console.log(`Task title updated to: ${newTitle}`);
  }

  updatePriority(newPriority: 'low' | 'medium' | 'high' | 'urgent'): void {
    console.log(`Task priority updated to: ${newPriority}`);
  }

  addTag(tag: string): void {
    console.log(`Tag added: ${tag}`);
  }

  removeTag(tag: string): void {
    console.log(`Tag removed: ${tag}`);
  }

  // ===== 客户端专用UI方法 =====

  /**
   * 获取状态显示文本
   */
  getStatusText(): string {
    const statusMap = {
      todo: '待办',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消',
    };
    return statusMap[this.status] || '未知状态';
  }

  /**
   * 获取状态对应的颜色
   */
  getStatusColor(): 'default' | 'processing' | 'success' | 'error' {
    const colorMap = {
      todo: 'default' as const,
      in_progress: 'processing' as const,
      completed: 'success' as const,
      cancelled: 'error' as const,
    };
    return colorMap[this.status] || 'default';
  }

  /**
   * 获取优先级显示文本
   */
  getPriorityText(): string {
    const priorityMap = {
      low: '低',
      medium: '中',
      high: '高',
      urgent: '紧急',
    };
    return priorityMap[this.priority] || '未知';
  }

  /**
   * 获取优先级对应的颜色
   */
  getPriorityColor(): 'green' | 'blue' | 'orange' | 'red' {
    const colorMap = {
      low: 'green' as const,
      medium: 'blue' as const,
      high: 'orange' as const,
      urgent: 'red' as const,
    };
    return colorMap[this.priority] || 'blue';
  }

  /**
   * 格式化截止时间显示
   */
  getDueDateText(): string {
    if (!this.dueDate) {
      return '无截止时间';
    }

    const formatter = new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    return formatter.format(this.dueDate);
  }

  /**
   * 获取截止时间的相对显示
   */
  getDueTimeText(): string {
    if (!this.dueDate) {
      return '';
    }

    if (this.isOverdue) {
      return '已逾期';
    }

    const hours = this.hoursUntilDue;

    if (hours < 1) {
      return '即将到期';
    } else if (hours < 24) {
      return `${hours}小时后到期`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days}天后到期`;
    }
  }

  /**
   * 获取工作时间显示
   */
  getTimeText(): string {
    const parts: string[] = [];

    if (this.hasEstimate) {
      parts.push(`预计${this.estimatedHours}小时`);
    }

    if (this.hasActualTime) {
      parts.push(`实际${this.actualHours}小时`);
    }

    if (parts.length === 0) {
      return '未设置时间';
    }

    return parts.join(' / ');
  }

  /**
   * 获取任务卡片显示信息
   */
  getCardInfo(): {
    title: string;
    description?: string;
    status: string;
    statusColor: 'default' | 'processing' | 'success' | 'error';
    priority: string;
    priorityColor: 'green' | 'blue' | 'orange' | 'red';
    dueDate?: string;
    dueTimeText: string;
    timeText: string;
    tags: string[];
    isOverdue: boolean;
    canEdit: boolean;
    assignedTo?: string;
  } {
    return {
      title: this.title,
      description: this.description,
      status: this.getStatusText(),
      statusColor: this.getStatusColor(),
      priority: this.getPriorityText(),
      priorityColor: this.getPriorityColor(),
      dueDate: this.dueDate ? this.getDueDateText() : undefined,
      dueTimeText: this.getDueTimeText(),
      timeText: this.getTimeText(),
      tags: this.tags,
      isOverdue: this.isOverdue,
      canEdit: !this.isCompleted && !this.isCancelled,
      assignedTo: this.assignedTo,
    };
  }

  /**
   * 获取任务列表项信息
   */
  getListItemInfo(): {
    title: string;
    status: string;
    priority: string;
    dueTimeText: string;
    isOverdue: boolean;
    tagCount: number;
    hasAssignee: boolean;
  } {
    return {
      title: this.title,
      status: this.getStatusText(),
      priority: this.getPriorityText(),
      dueTimeText: this.getDueTimeText(),
      isOverdue: this.isOverdue,
      tagCount: this.tags.length,
      hasAssignee: this.isAssigned,
    };
  }

  /**
   * 获取可用操作列表
   */
  getAvailableActions(): Array<{
    key: string;
    label: string;
    icon?: string;
    disabled?: boolean;
  }> {
    const actions = [];

    if (this.isTodo) {
      actions.push({
        key: 'start',
        label: '开始',
        icon: 'play-circle',
        disabled: false,
      });
    }

    if (this.isInProgress || this.isTodo) {
      actions.push({
        key: 'complete',
        label: '完成',
        icon: 'check-circle',
        disabled: false,
      });
    }

    if (!this.isCompleted && !this.isCancelled) {
      actions.push(
        {
          key: 'edit',
          label: '编辑',
          icon: 'edit',
          disabled: false,
        },
        {
          key: 'cancel',
          label: '取消',
          icon: 'stop',
          disabled: false,
        },
      );
    }

    return actions;
  }

  /**
   * 检查是否可以执行某个操作
   */
  canPerformAction(action: 'start' | 'complete' | 'cancel' | 'edit'): boolean {
    switch (action) {
      case 'start':
        return this.isTodo;
      case 'complete':
        return this.isTodo || this.isInProgress;
      case 'cancel':
        return !this.isCompleted && !this.isCancelled;
      case 'edit':
        return !this.isCompleted && !this.isCancelled;
      default:
        return false;
    }
  }

  /**
   * 转换为表单数据
   */
  toFormData(): {
    title: string;
    description: string;
    priority: string;
    goalUuid: string;
    assignedTo: string;
    dueDate: string;
    estimatedHours: string;
    tags: string;
  } {
    return {
      title: this.title,
      description: this.description || '',
      priority: this.priority,
      goalUuid: this.goalUuid || '',
      assignedTo: this.assignedTo || '',
      dueDate: this.dueDate ? this.dueDate.toISOString().split('T')[0] : '',
      estimatedHours: this.estimatedHours?.toString() || '',
      tags: this.tags.join(', '),
    };
  }

  /**
   * 获取进度信息（用于看板视图）
   */
  getProgressInfo(): {
    stage: 'todo' | 'doing' | 'done';
    canMoveNext: boolean;
    canMovePrev: boolean;
  } {
    let stage: 'todo' | 'doing' | 'done';
    let canMoveNext: boolean;
    let canMovePrev: boolean;

    switch (this.status) {
      case 'todo':
        stage = 'todo';
        canMoveNext = true;
        canMovePrev = false;
        break;
      case 'in_progress':
        stage = 'doing';
        canMoveNext = true;
        canMovePrev = true;
        break;
      case 'completed':
      case 'cancelled':
        stage = 'done';
        canMoveNext = false;
        canMovePrev = false;
        break;
      default:
        stage = 'todo';
        canMoveNext = false;
        canMovePrev = false;
    }

    return { stage, canMoveNext, canMovePrev };
  }

  // ===== 客户端数据方法 =====

  /**
   * 从DTO创建客户端实例
   */
  static fromDTO(dto: any): Task {
    return new Task({
      uuid: dto.uuid,
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      status: dto.status,
      goalUuid: dto.goalUuid,
      assignedTo: dto.assignedTo,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      estimatedHours: dto.estimatedHours,
      actualHours: dto.actualHours,
      tags: dto.tags || [],
      createdAt: dto.createdAt ? new Date(dto.createdAt) : new Date(),
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : new Date(),
      completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
    });
  }

  /**
   * 创建空任务实例（用于新建表单）
   */
  static forCreate(): Task {
    return new Task({
      title: '',
      priority: 'medium',
    });
  }

  /**
   * 客户端缓存键
   */
  getCacheKey(): string {
    return `task_${this.uuid}`;
  }

  /**
   * 检查是否需要刷新
   */
  shouldRefresh(): boolean {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.updatedAt < fiveMinutesAgo;
  }
}
