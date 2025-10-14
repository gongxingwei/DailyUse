/**
 * AccountHistory Entity - Client Implementation
 * 账户历史实体 - 客户端实现
 */

import { Entity } from '@dailyuse/utils';
import { AccountContracts as AC } from '@dailyuse/contracts';

/**
 * 账户历史实体客户端实现
 */
export class AccountHistoryClient extends Entity implements AC.AccountHistoryClient {
  constructor(
    uuid: string,
    public readonly accountUuid: string,
    public readonly action: string,
    public readonly details: any | null | undefined,
    public readonly ipAddress: string | null | undefined,
    public readonly userAgent: string | null | undefined,
    public readonly createdAt: number,
  ) {
    super(uuid);
  }

  // ========== UI 计算属性 ==========

  /**
   * 获取操作显示文本
   */
  get actionText(): string {
    const actionMap: Record<string, string> = {
      'account.created': '创建账户',
      'account.updated': '更新账户',
      'account.deleted': '删除账户',
      'profile.updated': '更新个人资料',
      'password.changed': '修改密码',
      'email.changed': '修改邮箱',
      'phone.changed': '修改手机号',
      'subscription.upgraded': '升级订阅',
      'subscription.downgraded': '降级订阅',
      'subscription.cancelled': '取消订阅',
      'twoFactor.enabled': '启用两步验证',
      'twoFactor.disabled': '禁用两步验证',
      'login.success': '登录成功',
      'login.failed': '登录失败',
      logout: '退出登录',
    };
    return actionMap[this.action] || this.action;
  }

  /**
   * 获取时间显示文本
   */
  get createdAtText(): string {
    const date = new Date(this.createdAt);
    const now = Date.now();
    const diff = now - this.createdAt;

    // 少于1分钟
    if (diff < 60 * 1000) {
      return '刚刚';
    }
    // 少于1小时
    if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))} 分钟前`;
    }
    // 少于1天
    if (diff < 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 60 * 1000))} 小时前`;
    }
    // 少于7天
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (24 * 60 * 60 * 1000))} 天前`;
    }
    // 显示具体日期
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * 获取IP地址显示文本
   */
  get ipAddressText(): string {
    return this.ipAddress || '-';
  }

  /**
   * 是否有详细信息
   */
  get hasDetails(): boolean {
    return this.details !== null && this.details !== undefined;
  }

  // ========== UI 方法 ==========

  /**
   * 获取操作类型图标
   */
  getActionIcon(): string {
    if (this.action.startsWith('login')) {
      return 'log-in';
    }
    if (this.action.startsWith('logout')) {
      return 'log-out';
    }
    if (this.action.includes('password')) {
      return 'key';
    }
    if (this.action.includes('subscription')) {
      return 'credit-card';
    }
    if (this.action.includes('twoFactor')) {
      return 'shield';
    }
    if (this.action.includes('profile')) {
      return 'user';
    }
    if (this.action.includes('email') || this.action.includes('phone')) {
      return 'mail';
    }
    return 'activity';
  }

  /**
   * 获取操作类型颜色
   */
  getActionColor(): string {
    if (this.action.endsWith('.success') || this.action.endsWith('.enabled')) {
      return 'green';
    }
    if (
      this.action.endsWith('.failed') ||
      this.action.endsWith('.deleted') ||
      this.action.endsWith('.disabled')
    ) {
      return 'red';
    }
    if (this.action.endsWith('.cancelled') || this.action.endsWith('.downgraded')) {
      return 'orange';
    }
    return 'blue';
  }

  // ========== DTO 转换 ==========

  toClientDTO(): AC.AccountHistoryClientDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      action: this.action,
      details: this.details ?? null,
      ipAddress: this.ipAddress ?? null,
      userAgent: this.userAgent ?? null,
      createdAt: this.createdAt,
    };
  }

  static fromClientDTO(dto: AC.AccountHistoryClientDTO): AccountHistoryClient {
    return new AccountHistoryClient(
      dto.uuid,
      dto.accountUuid,
      dto.action,
      dto.details,
      dto.ipAddress,
      dto.userAgent,
      dto.createdAt,
    );
  }
}
