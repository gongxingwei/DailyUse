# 如何使用通用校验系统定义用户名和密码规则

## 概述

我们已经为DailyUse项目创建了一个强大的通用表单校验系统。以下是如何定义和使用 `usernameRules` 和 `passwordRules` 的详细说明。

## 快速开始

### 1. 基础规则定义

在 `apps/web/src/shared/utils/validations/accountFormRules.ts` 中，我们定义了以下规则：

```typescript
import { BuiltinValidators, type ValidationRule } from '@dailyuse/utils/validation';

// 用户名校验规则
export const usernameValidationRules: ValidationRule[] = [
  BuiltinValidators.required('用户名不能为空'),
  BuiltinValidators.minLength(3, '用户名长度不能少于3个字符'),
  BuiltinValidators.maxLength(20, '用户名长度不能超过20个字符'),
  BuiltinValidators.pattern(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
];

// 密码校验规则
export const passwordValidationRules: ValidationRule[] = [
  BuiltinValidators.required('密码不能为空'),
  BuiltinValidators.minLength(8, '密码长度不能少于8个字符'),
  BuiltinValidators.maxLength(20, '密码长度不能超过20个字符'),
  BuiltinValidators.pattern(/[a-z]/, '密码必须包含小写字母'),
  BuiltinValidators.pattern(/[A-Z]/, '密码必须包含大写字母'),
  BuiltinValidators.pattern(/\d/, '密码必须包含数字'),
];
```

### 2. 兼容性支持

为了保持与现有Vuetify代码的兼容性，我们同时提供了传统格式的规则：

```typescript
// 传统Vuetify格式（保持原有接口不变）
export const usernameRules = [
  (v: string) => !!v || "用户名不能为空",
  (v: string) => v.length >= 3 || "用户名长度不能少于3个字符",
  (v: string) => v.length <= 20 || "用户名长度不能超过20个字符",
  (v: string) => /^[a-zA-Z0-9_]+$/.test(v) || "用户名只能包含字母、数字和下划线",
];

export const passwordRules = [
  (v: string) => !!v || "密码不能为空",
  (v: string) => v.length >= 8 || "密码长度不能少于8个字符",
  (v: string) => v.length <= 20 || "密码长度不能超过20个字符",
  (v: string) => /[a-z]/.test(v) || "密码必须包含小写字母",
  (v: string) => /[A-Z]/.test(v) || "密码必须包含大写字母",
  (v: string) => /\d/.test(v) || "密码必须包含数字",
];
```

## 使用方式

### 方式1: 继续使用传统规则（最简单）

如果你想保持现有代码不变，只需要更新导入路径：

```vue
<script setup lang="ts">
// 原来的导入
// import { usernameRules, passwordRules } from '../../validations/accountFormRules';

// 新的导入路径
import { usernameRules, passwordRules } from '../../../../shared/utils/validations/accountFormRules';

// 其他代码保持不变
</script>

<template>
  <v-text-field 
    v-model="username"
    :rules="usernameRules"
    label="用户名"
  />
  <v-text-field 
    v-model="password"
    :rules="passwordRules"
    label="密码"
  />
</template>
```

### 方式2: 使用通用校验系统（推荐）

使用我们的Vue组合函数获得更强大的功能：

```vue
<script setup lang="ts">
import { useFormValidation } from '../../../../shared/utils/validations/useFormValidation';
import { registrationFormConfig } from '../../../../shared/utils/validations/accountFormRules';
import { computed } from 'vue';

// 创建表单校验
const { state: formState, methods: formMethods, handleFieldFocus, handleFieldBlur } = useFormValidation({
  config: registrationFormConfig,
  initialValues: {
    username: '',
    password: '',
    email: '',
    confirmPassword: ''
  },
  validateOnChange: true,
  validateOnBlur: true
});

// 创建计算属性处理v-model
const usernameValue = computed({
  get: () => formState.fields.username?.value.value || '',
  set: (val) => formMethods.setFieldValue('username', val)
});

const passwordValue = computed({
  get: () => formState.fields.password?.value.value || '',
  set: (val) => formMethods.setFieldValue('password', val)
});

// 表单提交
const handleSubmit = async () => {
  const isValid = await formMethods.validateForm('submit');
  if (isValid) {
    // 提交表单数据
    console.log('表单数据:', {
      username: usernameValue.value,
      password: passwordValue.value
    });
  }
};
</script>

<template>
  <v-form @submit.prevent="handleSubmit">
    <v-text-field 
      v-model="usernameValue"
      :error-messages="formState.fields.username?.error.value ? [formState.fields.username.error.value] : []"
      :loading="formState.fields.username?.validating.value"
      label="用户名"
      @blur="handleFieldBlur('username')"
      @focus="handleFieldFocus('username')"
    />
    
    <v-text-field 
      v-model="passwordValue"
      :error-messages="formState.fields.password?.error.value ? [formState.fields.password.error.value] : []"
      :loading="formState.fields.password?.validating.value"
      label="密码"
      type="password"
      @blur="handleFieldBlur('password')"
      @focus="handleFieldFocus('password')"
    />
    
    <v-btn 
      type="submit" 
      :disabled="!formState.valid.value"
      :loading="formState.validating.value"
    >
      提交
    </v-btn>
  </v-form>
</template>
```

## 高级用法

### 1. 异步校验

可以添加异步校验规则，比如检查用户名是否已存在：

```typescript
export const advancedUsernameRules: ValidationRule[] = [
  ...usernameValidationRules,
  {
    type: 'async',
    message: '用户名已存在',
    validator: async (value: string) => {
      // 调用API检查用户名
      const response = await fetch(`/api/check-username?username=${value}`);
      const result = await response.json();
      return result.available;
    },
    debounce: 500, // 防抖500ms
  },
];
```

### 2. 条件校验

可以根据其他字段的值来决定是否执行某个校验：

```typescript
export const conditionalPasswordRules: ValidationRule[] = [
  ...passwordValidationRules,
  {
    type: 'custom',
    message: '密码不能包含用户名',
    validator: (value: string, formData: any) => {
      const username = formData.username || '';
      if (!username || !value) return true;
      return !value.toLowerCase().includes(username.toLowerCase());
    },
    trigger: ['change', 'blur'],
  },
];
```

### 3. 警告级别校验

可以设置警告级别的校验，不阻止表单提交但给出提示：

```typescript
{
  type: 'custom',
  message: '密码强度不足（建议包含特殊字符）',
  severity: 'warning', // 警告级别
  validator: (value: string) => {
    return /[!@#$%^&*(),.?":{}|<>]/.test(value);
  },
}
```

## 内置校验规则

我们的校验系统提供了丰富的内置规则：

```typescript
// 基础规则
BuiltinValidators.required(message?)
BuiltinValidators.minLength(min, message?)
BuiltinValidators.maxLength(max, message?)
BuiltinValidators.min(min, message?)
BuiltinValidators.max(max, message?)
BuiltinValidators.range(min, max, message?)
BuiltinValidators.pattern(regex, message?)
BuiltinValidators.number()

// 格式校验
BuiltinValidators.email(message?)
BuiltinValidators.phone(message?)
BuiltinValidators.url(message?)
BuiltinValidators.date(message?)
BuiltinValidators.json(message?)
```

## 完整示例

查看 `apps/web/src/modules/account/presentation/components/EnhancedRegisterForm.vue` 文件，可以看到一个完整的对比示例，展示了传统校验和通用校验系统的并行使用。

## 优势对比

### 传统Vuetify校验
- ✅ 简单易用
- ✅ 与现有代码兼容
- ❌ 功能有限
- ❌ 难以复用
- ❌ 缺乏异步校验支持

### 通用校验系统
- ✅ 功能强大（异步校验、防抖、事件系统）
- ✅ 类型安全
- ✅ 跨框架复用
- ✅ 更好的开发体验
- ✅ 更丰富的校验规则
- ❌ 学习成本略高

## 建议

1. **现有项目**: 可以继续使用传统规则，只需更新导入路径
2. **新功能**: 推荐使用通用校验系统
3. **复杂表单**: 强烈推荐使用通用校验系统，特别是需要异步校验的场景

这样你就可以根据项目需求选择合适的校验方式了！