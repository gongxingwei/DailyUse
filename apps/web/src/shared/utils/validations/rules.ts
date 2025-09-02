export const usernameRules = [
  (v: string) => !!v || "用户名不能为空",
  (v: string) => v.length >= 3 || "用户名长度不能少于3个字符",
  (v: string) => v.length <= 20 || "用户名长度不能超过20个字符",
  (v: string) =>
    /^[a-zA-Z0-9_]+$/.test(v) || "用户名只能包含字母、数字和下划线",
];

/**
 * 密码验证规则
 */
export const passwordRules = [
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
export const emailRules = [
  (v: string) => !!v || "请输入邮箱",
  (v: string) => /.+@.+\..+/.test(v) || "请输入有效的邮箱地址",
];
