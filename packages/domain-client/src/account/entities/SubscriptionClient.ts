/**
 * Subscription Entity - Client Implementation
 * 订阅实体 - 客户端实现
 */

import { Entity } from '@dailyuse/utils';
import { AccountContracts as AC } from '@dailyuse/contracts';

type SubscriptionPlan = AC.SubscriptionPlan;
type SubscriptionStatus = AC.SubscriptionStatus;
type BillingCycle = AC.BillingCycle;

const SubscriptionPlan = AC.SubscriptionPlan;
const SubscriptionStatus = AC.SubscriptionStatus;
const BillingCycle = AC.BillingCycle;

/**
 * 订阅实体客户端实现
 */
export class SubscriptionClient extends Entity implements AC.SubscriptionClient {
  constructor(
    uuid: string,
    public readonly accountUuid: string,
    public readonly plan: SubscriptionPlan,
    public readonly status: SubscriptionStatus,
    public readonly startDate: number,
    public readonly endDate: number | null | undefined,
    public readonly renewalDate: number | null | undefined,
    public readonly autoRenew: boolean,
    public readonly paymentMethod: string | null | undefined,
    public readonly billingCycle: BillingCycle,
    public readonly amount: number | null | undefined,
    public readonly currency: string | null | undefined,
    public readonly createdAt: number,
    public readonly updatedAt: number,
  ) {
    super(uuid);
  }

  // ========== UI 计算属性 ==========

  /**
   * 获取订阅计划显示文本
   */
  get planText(): string {
    const planMap = {
      [SubscriptionPlan.FREE]: '免费版',
      [SubscriptionPlan.BASIC]: '基础版',
      [SubscriptionPlan.PRO]: '专业版',
      [SubscriptionPlan.ENTERPRISE]: '企业版',
    };
    return planMap[this.plan];
  }

  /**
   * 获取订阅状态显示文本
   */
  get statusText(): string {
    const statusMap = {
      [SubscriptionStatus.ACTIVE]: '活跃',
      [SubscriptionStatus.CANCELLED]: '已取消',
      [SubscriptionStatus.EXPIRED]: '已过期',
      [SubscriptionStatus.SUSPENDED]: '已暂停',
    };
    return statusMap[this.status];
  }

  /**
   * 获取计费周期显示文本
   */
  get billingCycleText(): string {
    const cycleMap = {
      [BillingCycle.MONTHLY]: '按月',
      [BillingCycle.YEARLY]: '按年',
      [BillingCycle.LIFETIME]: '终身',
    };
    return cycleMap[this.billingCycle];
  }

  /**
   * 是否为活跃订阅
   */
  get isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE;
  }

  /**
   * 是否已过期
   */
  get isExpired(): boolean {
    return this.status === SubscriptionStatus.EXPIRED;
  }

  /**
   * 是否已取消
   */
  get isCancelled(): boolean {
    return this.status === SubscriptionStatus.CANCELLED;
  }

  /**
   * 是否为免费计划
   */
  get isFree(): boolean {
    return this.plan === SubscriptionPlan.FREE;
  }

  /**
   * 是否为付费计划
   */
  get isPaid(): boolean {
    return !this.isFree;
  }

  /**
   * 获取价格显示文本
   */
  get priceText(): string {
    if (this.isFree) {
      return '免费';
    }
    if (!this.amount || !this.currency) {
      return '-';
    }
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }

  /**
   * 获取续费日期显示文本
   */
  get renewalDateText(): string {
    if (!this.renewalDate) {
      return '-';
    }
    const date = new Date(this.renewalDate);
    return date.toLocaleDateString('zh-CN');
  }

  /**
   * 获取结束日期显示文本
   */
  get endDateText(): string {
    if (!this.endDate) {
      return '-';
    }
    const date = new Date(this.endDate);
    return date.toLocaleDateString('zh-CN');
  }

  /**
   * 剩余天数
   */
  get daysRemaining(): number | null {
    if (!this.endDate) {
      return null;
    }
    const now = Date.now();
    const diff = this.endDate - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * 剩余天数显示文本
   */
  get daysRemainingText(): string {
    const days = this.daysRemaining;
    if (days === null) {
      return '-';
    }
    if (days <= 0) {
      return '已过期';
    }
    return `剩余 ${days} 天`;
  }

  // ========== UI 方法 ==========

  /**
   * 获取状态徽章配置
   */
  getStatusBadge(): { text: string; variant: string; icon: string } {
    if (this.isActive) {
      return { text: '活跃', variant: 'success', icon: 'check-circle' };
    }
    if (this.isExpired) {
      return { text: '已过期', variant: 'danger', icon: 'x-circle' };
    }
    if (this.isCancelled) {
      return { text: '已取消', variant: 'warning', icon: 'slash' };
    }
    return { text: '已暂停', variant: 'secondary', icon: 'pause-circle' };
  }

  /**
   * 获取计划徽章配置
   */
  getPlanBadge(): { text: string; variant: string; icon: string } {
    const badgeMap = {
      [SubscriptionPlan.FREE]: {
        text: '免费版',
        variant: 'secondary',
        icon: 'gift',
      },
      [SubscriptionPlan.BASIC]: {
        text: '基础版',
        variant: 'primary',
        icon: 'box',
      },
      [SubscriptionPlan.PRO]: {
        text: '专业版',
        variant: 'success',
        icon: 'star',
      },
      [SubscriptionPlan.ENTERPRISE]: {
        text: '企业版',
        variant: 'warning',
        icon: 'briefcase',
      },
    };
    return badgeMap[this.plan];
  }

  // ========== 权限检查 ==========

  /**
   * 是否可以续费
   */
  canRenew(): boolean {
    return this.isActive && this.autoRenew;
  }

  /**
   * 是否可以取消
   */
  canCancel(): boolean {
    return this.isActive && this.isPaid;
  }

  /**
   * 是否可以升级
   */
  canUpgrade(): boolean {
    return this.isActive && this.plan !== SubscriptionPlan.ENTERPRISE;
  }

  /**
   * 是否可以降级
   */
  canDowngrade(): boolean {
    return this.isActive && this.plan !== SubscriptionPlan.FREE;
  }

  // ========== DTO 转换 ==========

  toClientDTO(): AC.SubscriptionClientDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      plan: this.plan,
      status: this.status,
      startDate: this.startDate,
      endDate: this.endDate ?? null,
      renewalDate: this.renewalDate ?? null,
      autoRenew: this.autoRenew,
      paymentMethod: this.paymentMethod ?? null,
      billingCycle: this.billingCycle,
      amount: this.amount ?? null,
      currency: this.currency ?? null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromClientDTO(dto: AC.SubscriptionClientDTO): SubscriptionClient {
    return new SubscriptionClient(
      dto.uuid,
      dto.accountUuid,
      dto.plan as SubscriptionPlan,
      dto.status as SubscriptionStatus,
      dto.startDate,
      dto.endDate,
      dto.renewalDate,
      dto.autoRenew,
      dto.paymentMethod,
      dto.billingCycle as BillingCycle,
      dto.amount,
      dto.currency,
      dto.createdAt,
      dto.updatedAt,
    );
  }
}
