/**
 * 表单验证工具类
 */
export class ValidationUtils {
  /**
   * 用户名验证规则
   */
  static readonly usernameRules = [
    (v: string) => !!v || "用户名不能为空",
    (v: string) => v.length >= 3 || "用户名长度不能少于3个字符",
    (v: string) => v.length <= 20 || "用户名长度不能超过20个字符",
    (v: string) => /^[a-zA-Z0-9_]+$/.test(v) || "用户名只能包含字母、数字和下划线",
  ];

  /**
   * 密码验证规则
   */
  static readonly passwordRules = [
    (v: string) => !!v || "密码不能为空",
    (v: string) => v.length >= 8 || "密码长度不能少于8个字符",
    (v: string) => v.length <= 20 || "密码长度不能超过20个字符",
    (v: string) => /[a-z]/.test(v) || "密码必须包含小写字母",
    (v: string) => /[A-Z]/.test(v) || "密码必须包含大写字母",
    (v: string) => /\d/.test(v) || "密码必须包含数字",
  ];

  /**
   * 邮箱验证规则
   */
  static readonly emailRules = [
    (v: string) => !!v || '请输入邮箱',
    (v: string) => /.+@.+\..+/.test(v) || '请输入有效的邮箱地址'
  ];

  /**
   * 验证用户名
   */
  static validateUsername(username: string): string | true {
    for (const rule of this.usernameRules) {
      const result = rule(username);
      if (result !== true) return result;
    }
    return true;
  }

  /**
   * 验证密码
   */
  static validatePassword(password: string): string | true {
    for (const rule of this.passwordRules) {
      const result = rule(password);
      if (result !== true) return result;
    }
    return true;
  }

  /**
   * 验证邮箱
   */
  static validateEmail(email: string): string | true {
    for (const rule of this.emailRules) {
      const result = rule(email);
      if (result !== true) return result;
    }
    return true;
  }

  /**
   * 批量验证
   */
  static validateForm(data: {
    username?: string;
    password?: string;
    email?: string;
  }): { [key: string]: string | true } {
    const result: { [key: string]: string | true } = {};
    
    if (data.username !== undefined) {
      result.username = this.validateUsername(data.username);
    }
    if (data.password !== undefined) {
      result.password = this.validatePassword(data.password);
    }
    if (data.email !== undefined) {
      result.email = this.validateEmail(data.email);
    }
    
    return result;
  }
}

// 保持向后兼容性
export const usernameRules = ValidationUtils.usernameRules;
export const passwordRules = ValidationUtils.passwordRules;
export const emailRules = ValidationUtils.emailRules;