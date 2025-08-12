import type { AuthSession, AuthCredentials, VerificationCode } from '../models/Auth';

/**
 * 认证领域服务
 * 封装复杂的认证相关业务逻辑
 */
export class AuthDomainService {
  /**
   * 验证登录凭据强度
   */
  validateCredentialsSecurity(credentials: AuthCredentials): {
    isSecure: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // 密码强度检查
    const password = credentials.password;

    if (password.length < 8) {
      issues.push('密码长度不足8位');
      recommendations.push('使用至少8位字符的密码');
    }

    if (!/[A-Z]/.test(password)) {
      issues.push('缺少大写字母');
      recommendations.push('添加大写字母提高安全性');
    }

    if (!/[a-z]/.test(password)) {
      issues.push('缺少小写字母');
      recommendations.push('添加小写字母提高安全性');
    }

    if (!/\d/.test(password)) {
      issues.push('缺少数字');
      recommendations.push('添加数字提高安全性');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      recommendations.push('建议添加特殊符号');
    }

    // 检查常见弱密码
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      new RegExp(credentials.username, 'i'),
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        issues.push('密码包含常见模式，不够安全');
        recommendations.push('避免使用常见密码模式');
        break;
      }
    }

    return {
      isSecure: issues.length === 0,
      issues,
      recommendations,
    };
  }

  /**
   * 计算会话安全等级
   */
  calculateSessionSecurityLevel(session: AuthSession): {
    level: 'low' | 'medium' | 'high';
    score: number;
    factors: string[];
  } {
    let score = 0;
    const factors: string[] = [];

    // Token有效期检查
    const remainingHours = session.getRemainingTime() / 3600;
    if (remainingHours > 24) {
      score += 1;
      factors.push('长期有效令牌');
    } else if (remainingHours > 1) {
      score += 2;
      factors.push('中期有效令牌');
    } else {
      score += 3;
      factors.push('短期有效令牌');
    }

    // 设备信息检查
    if (session.deviceInfo) {
      score += 1;
      factors.push('包含设备信息');
    }

    // IP地址检查
    if (session.ipAddress) {
      score += 1;
      factors.push('包含IP信息');
    }

    // 刷新令牌存在性
    if (session.refreshToken && session.refreshToken.length > 0) {
      score += 1;
      factors.push('支持令牌刷新');
    }

    let level: 'low' | 'medium' | 'high';
    if (score >= 5) {
      level = 'high';
    } else if (score >= 3) {
      level = 'medium';
    } else {
      level = 'low';
    }

    return { level, score, factors };
  }

  /**
   * 验证密码重置的安全性
   */
  validatePasswordResetSecurity(
    newPassword: string,
    oldPasswordHash?: string,
  ): {
    isValid: boolean;
    issues: string[];
    strength: 'weak' | 'medium' | 'strong';
  } {
    const issues: string[] = [];
    let strengthScore = 0;

    // 基本长度检查
    if (newPassword.length < 8) {
      issues.push('密码长度不足8位');
    } else {
      strengthScore += 1;
    }

    // 字符复杂度检查
    if (/[A-Z]/.test(newPassword)) strengthScore += 1;
    if (/[a-z]/.test(newPassword)) strengthScore += 1;
    if (/\d/.test(newPassword)) strengthScore += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) strengthScore += 1;

    // 长度加分
    if (newPassword.length >= 12) strengthScore += 1;

    // 重复字符检查
    if (/(.)\1{3,}/.test(newPassword)) {
      issues.push('包含过多重复字符');
      strengthScore -= 1;
    }

    // 与旧密码相似度检查 (如果提供了旧密码)
    if (oldPasswordHash && this.isSimilarToOldPassword(newPassword, oldPasswordHash)) {
      issues.push('新密码与旧密码过于相似');
    }

    let strength: 'weak' | 'medium' | 'strong';
    if (strengthScore >= 5) {
      strength = 'strong';
    } else if (strengthScore >= 3) {
      strength = 'medium';
    } else {
      strength = 'weak';
    }

    return {
      isValid: issues.length === 0 && strengthScore >= 3,
      issues,
      strength,
    };
  }

  /**
   * 生成安全的验证码
   */
  generateSecureVerificationCode(length: number = 6): string {
    // 避免容易混淆的字符
    const chars = '0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }

  /**
   * 计算验证码安全性
   */
  calculateVerificationCodeSecurity(code: VerificationCode): {
    securityLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
    recommendations: string[];
  } {
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    // 剩余有效时间检查
    const remainingMinutes = (code.expiresAt.getTime() - Date.now()) / (1000 * 60);
    if (remainingMinutes > 30) {
      riskFactors.push('验证码有效期过长');
      recommendations.push('缩短验证码有效期');
    }

    // 尝试次数检查
    if (code.maxAttempts > 5) {
      riskFactors.push('允许尝试次数过多');
      recommendations.push('限制尝试次数');
    }

    // 代码强度检查
    if (code.code.length < 6) {
      riskFactors.push('验证码长度不足');
      recommendations.push('使用至少6位验证码');
    }

    // 检查是否为纯数字
    if (!/^\d+$/.test(code.code)) {
      recommendations.push('使用纯数字验证码更易输入');
    }

    let securityLevel: 'low' | 'medium' | 'high';
    if (riskFactors.length === 0) {
      securityLevel = 'high';
    } else if (riskFactors.length <= 2) {
      securityLevel = 'medium';
    } else {
      securityLevel = 'low';
    }

    return {
      securityLevel,
      riskFactors,
      recommendations,
    };
  }

  /**
   * 验证登录频率是否异常
   */
  validateLoginFrequency(
    loginAttempts: Array<{ timestamp: Date; success: boolean; ip?: string }>,
  ): {
    isNormal: boolean;
    suspiciousActivity: string[];
    shouldBlock: boolean;
  } {
    const suspiciousActivity: string[] = [];
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneMinute = 60 * 1000;

    // 检查过去一小时的尝试次数
    const recentAttempts = loginAttempts.filter(
      (attempt) => now - attempt.timestamp.getTime() < oneHour,
    );

    if (recentAttempts.length > 20) {
      suspiciousActivity.push('一小时内尝试次数过多');
    }

    // 检查失败尝试
    const recentFailures = recentAttempts.filter((attempt) => !attempt.success);
    if (recentFailures.length > 5) {
      suspiciousActivity.push('失败尝试次数过多');
    }

    // 检查短时间内的高频尝试
    const recentMinuteAttempts = loginAttempts.filter(
      (attempt) => now - attempt.timestamp.getTime() < oneMinute,
    );

    if (recentMinuteAttempts.length > 5) {
      suspiciousActivity.push('短时间内高频尝试');
    }

    // 检查不同IP的尝试
    const uniqueIPs = new Set(recentAttempts.map((a) => a.ip).filter(Boolean));
    if (uniqueIPs.size > 3) {
      suspiciousActivity.push('多个IP地址尝试');
    }

    return {
      isNormal: suspiciousActivity.length === 0,
      suspiciousActivity,
      shouldBlock: suspiciousActivity.length >= 3 || recentFailures.length >= 10,
    };
  }

  /**
   * 生成会话过期提醒时间点
   */
  calculateExpirationWarnings(session: AuthSession): Array<{
    warningTime: Date;
    message: string;
    action: 'refresh' | 'logout' | 'notify';
  }> {
    const warnings: Array<{
      warningTime: Date;
      message: string;
      action: 'refresh' | 'logout' | 'notify';
    }> = [];

    const expiresAt = session.expiresAt.getTime();
    const now = Date.now();

    // 提前30分钟提醒
    const thirtyMinutesBefore = new Date(expiresAt - 30 * 60 * 1000);
    if (thirtyMinutesBefore.getTime() > now) {
      warnings.push({
        warningTime: thirtyMinutesBefore,
        message: '会话将在30分钟后过期',
        action: 'notify',
      });
    }

    // 提前5分钟自动刷新
    const fiveMinutesBefore = new Date(expiresAt - 5 * 60 * 1000);
    if (fiveMinutesBefore.getTime() > now) {
      warnings.push({
        warningTime: fiveMinutesBefore,
        message: '自动刷新会话',
        action: 'refresh',
      });
    }

    // 过期时自动登出
    warnings.push({
      warningTime: session.expiresAt,
      message: '会话已过期，请重新登录',
      action: 'logout',
    });

    return warnings;
  }

  private isSimilarToOldPassword(newPassword: string, oldPasswordHash: string): boolean {
    // 这里应该实现密码相似度检查逻辑
    // 简化实现：检查长度差异和字符相似度
    return false; // 临时实现
  }
}
