import { computed } from 'vue';
import type { FormRule, PasswordStrength } from '../types';

// 表单验证规则
export function useFormRules() {
  const usernameRules: FormRule[] = [
    (v: string) => !!v || '请输入用户名',
    (v: string) => v?.length >= 3 || '用户名至少3个字符',
    (v: string) => v?.length <= 20 || '用户名不能超过20个字符',
    (v: string) =>
      /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(v) || '用户名只能包含字母、数字、下划线和中文',
  ];

  const passwordRules: FormRule[] = [
    (v: string) => !!v || '请输入密码',
    (v: string) => v?.length >= 8 || '密码至少8个字符',
    (v: string) => v?.length <= 32 || '密码不能超过32个字符',
    (v: string) => /(?=.*[a-z])/.test(v) || '密码必须包含小写字母',
    (v: string) => /(?=.*[A-Z])/.test(v) || '密码必须包含大写字母',
    (v: string) => /(?=.*\d)/.test(v) || '密码必须包含数字',
  ];

  const emailRules: FormRule[] = [
    (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || '请输入有效的邮箱地址',
  ];

  const phoneRules: FormRule[] = [
    (v: string) => !v || /^(\+86\s?)?1[3-9]\d{9}$/.test(v) || '请输入有效的手机号码',
  ];

  const requiredRule: FormRule = (v: any) => !!v || '此字段为必填项';

  return {
    usernameRules,
    passwordRules,
    emailRules,
    phoneRules,
    requiredRule,
  };
}

// 密码强度计算
export function usePasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, text: '', color: 'grey' };

  let score = 0;
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
    password.length >= 12,
  ];

  score = checks.filter(Boolean).length;

  if (score <= 2) return { score: 1, text: '弱', color: 'error' };
  if (score <= 4) return { score: 2, text: '中等', color: 'warning' };
  if (score <= 5) return { score: 3, text: '强', color: 'success' };
  return { score: 4, text: '很强', color: 'success' };
}
