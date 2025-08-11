import { Account } from '@dailyuse/domain-server';

export class EmailService {
  constructor() {
    // 可以在这里初始化邮件服务配置，如 nodemailer 等
  }

  /**
   * 发送欢迎邮件
   */
  async sendWelcomeEmail(account: Account): Promise<void> {
    if (!account.email) {
      return;
    }

    try {
      // 这里实现发送欢迎邮件的逻辑
      // 例如使用 nodemailer 或其他邮件服务
      console.log(`Sending welcome email to: ${account.email.value}`);
      console.log(`Account holder: ${account.user.displayName}`);

      // 实际的邮件发送逻辑
      // await this.sendEmail({
      //   to: account.email.value,
      //   subject: 'Welcome to DailyUse!',
      //   template: 'welcome',
      //   data: {
      //     username: account.username,
      //     displayName: account.user.displayName
      //   }
      // });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // 根据业务需求决定是否抛出异常
      // throw new Error('Failed to send welcome email');
    }
  }

  /**
   * 发送邮箱验证邮件
   */
  async sendVerificationEmail(account: Account): Promise<void> {
    if (!account.email || !account.emailVerificationToken) {
      return;
    }

    try {
      console.log(`Sending verification email to: ${account.email.value}`);
      console.log(`Verification token: ${account.emailVerificationToken}`);

      // 实际的邮件发送逻辑
      // const verificationUrl = `${process.env.APP_URL}/verify-email?token=${account.emailVerificationToken}`;
      // await this.sendEmail({
      //   to: account.email.value,
      //   subject: 'Verify your email address',
      //   template: 'email-verification',
      //   data: {
      //     username: account.username,
      //     verificationUrl
      //   }
      // });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // throw new Error('Failed to send verification email');
    }
  }

  /**
   * 发送密码重置邮件
   */
  async sendPasswordResetEmail(account: Account, resetToken: string): Promise<void> {
    if (!account.email) {
      return;
    }

    try {
      console.log(`Sending password reset email to: ${account.email.value}`);

      // 实际的邮件发送逻辑
      // const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
      // await this.sendEmail({
      //   to: account.email.value,
      //   subject: 'Reset your password',
      //   template: 'password-reset',
      //   data: {
      //     username: account.username,
      //     resetUrl
      //   }
      // });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // throw new Error('Failed to send password reset email');
    }
  }

  /**
   * 发送账户状态变更通知邮件
   */
  async sendAccountStatusChangeEmail(
    account: Account,
    oldStatus: string,
    newStatus: string,
  ): Promise<void> {
    if (!account.email) {
      return;
    }

    try {
      console.log(`Sending account status change email to: ${account.email.value}`);
      console.log(`Status changed from ${oldStatus} to ${newStatus}`);

      // 实际的邮件发送逻辑
      // await this.sendEmail({
      //   to: account.email.value,
      //   subject: 'Your account status has been updated',
      //   template: 'account-status-change',
      //   data: {
      //     username: account.username,
      //     oldStatus,
      //     newStatus
      //   }
      // });
    } catch (error) {
      console.error('Failed to send account status change email:', error);
    }
  }

  /**
   * 通用邮件发送方法（私有方法）
   * 在实际实现中，这里会使用真实的邮件服务
   */
  private async sendEmail(options: {
    to: string;
    subject: string;
    template: string;
    data: any;
  }): Promise<void> {
    // 实现真实的邮件发送逻辑
    // 例如使用 nodemailer, SendGrid, AWS SES 等
    console.log('Email would be sent with options:', options);
  }
}
