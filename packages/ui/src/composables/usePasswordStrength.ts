import { computed, type Ref } from 'vue';
import type { PasswordStrength } from '../types';

/**
 * 密码强度检测组合式函数
 */
export function usePasswordStrength(password: Ref<string>) {
  // 计算密码强度
  const strength = computed<PasswordStrength>(() => {
    const pwd = password.value;

    if (!pwd) {
      return { score: 0, text: '', color: 'grey' };
    }

    let score = 0;
    const checks = {
      length: pwd.length >= 8,
      lowercase: /[a-z]/.test(pwd),
      uppercase: /[A-Z]/.test(pwd),
      numbers: /\d/.test(pwd),
      symbols: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
      longEnough: pwd.length >= 12,
    };

    // 长度检查
    if (checks.length) score += 2;
    if (checks.longEnough) score += 1;

    // 字符类型检查
    if (checks.lowercase) score += 1;
    if (checks.uppercase) score += 1;
    if (checks.numbers) score += 1;
    if (checks.symbols) score += 2;

    // 复杂度检查
    const uniqueChars = new Set(pwd).size;
    if (uniqueChars >= pwd.length * 0.7) score += 1;

    // 常见模式检查（降分）
    const commonPatterns = [
      /123456|654321/,
      /qwerty|asdfgh/,
      /password|admin/i,
      /(.)\1{3,}/, // 连续相同字符
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(pwd)) {
        score = Math.max(0, score - 2);
      }
    }

    // 根据分数返回强度信息
    if (score <= 2) {
      return { score, text: '弱', color: 'error' };
    } else if (score <= 4) {
      return { score, text: '中等', color: 'warning' };
    } else if (score <= 6) {
      return { score, text: '强', color: 'success' };
    } else {
      return { score, text: '很强', color: 'success' };
    }
  });

  // 获取强度百分比
  const strengthPercentage = computed(() => {
    return Math.min((strength.value.score / 8) * 100, 100);
  });

  // 密码强度建议
  const suggestions = computed(() => {
    const pwd = password.value;
    const tips: string[] = [];

    if (!pwd) return tips;

    if (pwd.length < 8) {
      tips.push('至少需要8个字符');
    }

    if (!/[a-z]/.test(pwd)) {
      tips.push('包含小写字母');
    }

    if (!/[A-Z]/.test(pwd)) {
      tips.push('包含大写字母');
    }

    if (!/\d/.test(pwd)) {
      tips.push('包含数字');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      tips.push('包含特殊符号');
    }

    if (pwd.length < 12) {
      tips.push('建议12个字符以上');
    }

    // 检查常见弱密码模式
    if (/(.)\1{3,}/.test(pwd)) {
      tips.push('避免连续相同字符');
    }

    if (/123456|654321/.test(pwd)) {
      tips.push('避免连续数字序列');
    }

    if (/qwerty|asdfgh/i.test(pwd)) {
      tips.push('避免键盘序列');
    }

    if (/password|admin|user/i.test(pwd)) {
      tips.push('避免常见单词');
    }

    return tips;
  });

  // 是否为强密码
  const isStrong = computed(() => {
    return strength.value.score >= 5;
  });

  // 是否为有效密码（最低要求）
  const isValid = computed(() => {
    return strength.value.score >= 3;
  });

  return {
    strength,
    strengthPercentage,
    suggestions,
    isStrong,
    isValid,
  };
}

/**
 * 生成随机强密码
 */
export function generateStrongPassword(length = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = lowercase + uppercase + numbers + symbols;

  let password = '';

  // 确保至少包含每种类型的字符
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // 填充剩余长度
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // 打乱字符顺序
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}
