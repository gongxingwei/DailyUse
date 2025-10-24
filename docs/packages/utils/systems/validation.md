# 校验（Validation）系统

> **位置**: `packages/utils/src/validation`  
> **适用范围**: Web、Desktop 项目（前端表单校验）  
> **依赖**: 无（框架无关）

---

## 📋 概述

DailyUse 的校验系统是一个强大的、框架无关的前端表单校验解决方案。核心校验逻辑与 UI 框架解耦，可适配 Vue、React、Angular 等主流框架。

### 核心特性

- ✅ **框架无关**: 核心逻辑与 UI 框架解耦
- ✅ **类型安全**: 完整的 TypeScript 支持
- ✅ **丰富的内置规则**: 必填、长度、格式、正则等
- ✅ **异步校验**: 支持远程验证（防抖、取消机制）
- ✅ **条件校验**: 根据其他字段动态启用
- ✅ **国际化**: 内置多语言支持
- ✅ **框架适配器**: 提供 Vue、React 适配器
- ✅ **事件系统**: 完整的校验生命周期事件

---

## 🏗️ 架构设计

### 核心组件

```
┌──────────────────────────────────────┐
│       FormValidator (核心)            │
│  - validateField()                   │
│  - validateForm()                    │
│  - 事件系统                           │
└────────────┬─────────────────────────┘
             │
      ┌──────┴──────┐
      ↓             ↓
┌──────────┐  ┌──────────┐
│ Builtin  │  │ Custom   │  校验规则
│Validators│  │Rules     │
└──────────┘  └──────────┘
      │
      ↓
┌──────────────────────────────────────┐
│      框架适配器                       │
│  - useReactFormValidation (React)    │
│  - VueAdapter (Vue)                  │
└──────────────────────────────────────┘
```

### 文件结构

```
packages/utils/src/validation/
├── form-validator.ts         # 核心校验器
├── builtin-validators.ts     # 内置校验规则
├── types.ts                  # 类型定义
├── index.ts                  # 导出入口
├── examples.ts               # 使用示例
├── adapters/
│   ├── react-adapter.ts      # React 适配器
│   └── vue-adapter.ts        # Vue 适配器
├── README.md                 # 详细文档
├── USAGE_GUIDE.md            # 使用指南
└── IMPLEMENTATION_SUMMARY.md # 实现总结
```

---

## 🚀 快速开始

### 1. 基础使用

```typescript
import { FormValidator, BuiltinValidators } from '@dailyuse/utils/validation';

// 创建表单配置
const config = {
  fields: [
    {
      name: 'email',
      rules: [
        BuiltinValidators.required('邮箱不能为空'),
        BuiltinValidators.email('请输入有效的邮箱地址'),
      ],
    },
    {
      name: 'password',
      rules: [
        BuiltinValidators.required('密码不能为空'),
        BuiltinValidators.minLength(8, '密码至少8个字符'),
      ],
    },
  ],
};

// 创建校验器
const validator = new FormValidator(config);

// 校验表单
async function validateForm(formData) {
  const result = await validator.validateForm(formData);

  if (result.valid) {
    console.log('表单校验通过');
  } else {
    console.log('校验失败:', result.errors);
  }
}
```

### 2. Vue 集成

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="email.value" @blur="email.touched = true" type="email" placeholder="邮箱" />
    <span v-if="email.error" class="error">{{ email.error }}</span>

    <input
      v-model="password.value"
      @blur="password.touched = true"
      type="password"
      placeholder="密码"
    />
    <span v-if="password.error" class="error">{{ password.error }}</span>

    <button type="submit" :disabled="!isValid">登录</button>
  </form>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { FormValidator, BuiltinValidators } from '@dailyuse/utils/validation';

const email = ref({ value: '', error: '', touched: false });
const password = ref({ value: '', error: '', touched: false });

const validator = new FormValidator({
  fields: [
    {
      name: 'email',
      rules: [
        BuiltinValidators.required('邮箱不能为空'),
        BuiltinValidators.email('邮箱格式不正确'),
      ],
    },
    {
      name: 'password',
      rules: [
        BuiltinValidators.required('密码不能为空'),
        BuiltinValidators.minLength(6, '密码至少6位'),
      ],
    },
  ],
});

const isValid = computed(() => !email.value.error && !password.value.error);

watch(
  () => email.value.value,
  async (newValue) => {
    if (email.value.touched) {
      const result = await validator.validateField('email', newValue, getFormData());
      email.value.error = result.firstError || '';
    }
  },
);

watch(
  () => password.value.value,
  async (newValue) => {
    if (password.value.touched) {
      const result = await validator.validateField('password', newValue, getFormData());
      password.value.error = result.firstError || '';
    }
  },
);

function getFormData() {
  return {
    email: email.value.value,
    password: password.value.value,
  };
}

async function handleSubmit() {
  const result = await validator.validateForm(getFormData());

  if (result.valid) {
    console.log('提交数据:', getFormData());
  }
}
</script>
```

### 3. React 集成

```typescript
import { useReactFormValidation, BuiltinValidators } from '@dailyuse/utils/validation';

function LoginForm() {
  const { state, methods } = useReactFormValidation({
    config: {
      fields: [
        {
          name: 'email',
          rules: [
            BuiltinValidators.required('邮箱不能为空'),
            BuiltinValidators.email('邮箱格式不正确'),
          ],
        },
        {
          name: 'password',
          rules: [
            BuiltinValidators.required('密码不能为空'),
            BuiltinValidators.minLength(6, '密码至少6位'),
          ],
        },
      ],
    },
    initialValues: { email: '', password: '' },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await methods.validateForm('submit');

    if (result.valid) {
      console.log('提交数据:', state.values);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={state.fields.email?.value || ''}
        onChange={methods.handleFieldChange('email')}
        onBlur={methods.handleFieldBlur('email')}
      />
      {state.fields.email?.error && (
        <span className="error">{state.fields.email.error}</span>
      )}

      <input
        type="password"
        value={state.fields.password?.value || ''}
        onChange={methods.handleFieldChange('password')}
        onBlur={methods.handleFieldBlur('password')}
      />
      {state.fields.password?.error && (
        <span className="error">{state.fields.password.error}</span>
      )}

      <button type="submit" disabled={!state.valid}>
        登录
      </button>
    </form>
  );
}
```

---

## 📐 校验规则

### 基础规则

```typescript
// 必填
BuiltinValidators.required(message?)

// 字符串长度
BuiltinValidators.minLength(min, message?)
BuiltinValidators.maxLength(max, message?)

// 数值范围
BuiltinValidators.min(min, message?)
BuiltinValidators.max(max, message?)
BuiltinValidators.range(min, max, message?)

// 正则表达式
BuiltinValidators.pattern(regex, message?)

// 数字类型
BuiltinValidators.number()
```

### 格式校验

```typescript
// 邮箱
BuiltinValidators.email(message?)

// 手机号（中国大陆）
BuiltinValidators.phone(message?)

// URL
BuiltinValidators.url(message?)

// 日期
BuiltinValidators.date(message?)

// JSON 格式
BuiltinValidators.json(message?)
```

### 自定义规则

```typescript
// 同步自定义规则
{
  type: 'custom',
  message: '密码必须包含数字',
  validator: (value: string) => /\d/.test(value),
}

// 异步规则（如检查用户名是否存在）
{
  type: 'async',
  message: '用户名已存在',
  validator: async (value: string) => {
    const response = await checkUsername(value);
    return response.available;
  },
  debounce: 500,  // 防抖 500ms
}

// 条件校验（根据其他字段）
{
  type: 'custom',
  message: '选择"其他"时此字段必填',
  condition: (value: any, formData: any) => {
    return formData.category === 'other';
  },
  validator: (value: any) => value != null && value !== '',
}
```

---

## ⚙️ 校验触发器

### 触发时机

```typescript
type ValidationTrigger = 'change' | 'blur' | 'submit' | 'mount';
```

| 触发器   | 说明       | 使用场景           |
| -------- | ---------- | ------------------ |
| `change` | 值改变时   | 实时校验           |
| `blur`   | 失去焦点时 | 用户完成输入后校验 |
| `submit` | 表单提交时 | 最终校验           |
| `mount`  | 组件挂载时 | 初始化校验         |

### 配置示例

```typescript
const config = {
  fields: [
    {
      name: 'email',
      trigger: ['blur', 'submit'], // 失焦和提交时校验
      rules: [
        BuiltinValidators.required('邮箱不能为空'),
        BuiltinValidators.email('邮箱格式不正确'),
      ],
    },
    {
      name: 'password',
      trigger: ['change'], // 实时校验
      rules: [BuiltinValidators.minLength(8, '密码至少8个字符')],
    },
  ],
};
```

---

## 🎯 高级功能

### 1. 事件系统

```typescript
const validator = new FormValidator(config);

// 监听校验事件
validator.addEventListener('beforeValidate', (event) => {
  console.log('开始校验表单:', event.formData);
});

validator.addEventListener('afterValidate', (event) => {
  console.log('校验完成:', event.result);
});

validator.addEventListener('fieldChange', (event) => {
  console.log('字段变化:', event.fieldName, event.value);
});

validator.addEventListener('fieldError', (event) => {
  console.log('字段错误:', event.fieldName, event.errors);
});
```

### 2. 动态规则管理

```typescript
const validator = new FormValidator(config);

// 动态添加规则
validator.addRule('email', {
  type: 'async',
  message: '邮箱已被注册',
  validator: async (value) => {
    const exists = await checkEmailExists(value);
    return !exists;
  },
});

// 移除规则
validator.removeRule('email', 'async');

// 清空所有规则
validator.clearRules();

// 清空特定字段规则
validator.clearRules('email');
```

### 3. 全局规则

```typescript
const config = {
  fields: [
    // 字段配置...
  ],
  globalRules: [
    {
      type: 'custom',
      message: '至少填写邮箱或手机号',
      validator: (value: any, formData: any) => {
        return !!(formData.email || formData.phone);
      },
      trigger: ['submit'],
    },
  ],
};
```

### 4. 国际化

```typescript
// 使用中文
const zhValidators = new BuiltinValidators('zh-CN');
const rules = [zhValidators.required('此字段不能为空'), zhValidators.email('请输入有效的邮箱地址')];

// 使用英文
const enValidators = new BuiltinValidators('en');
const rules = [
  enValidators.required('This field is required'),
  enValidators.email('Please enter a valid email address'),
];
```

---

## 💡 最佳实践

### 1. 合理使用触发器

```typescript
// ✅ 推荐：失焦时校验，避免过度干扰
{
  name: 'email',
  trigger: ['blur', 'submit'],
  rules: [BuiltinValidators.email()],
}

// ⚠️ 谨慎：实时校验可能干扰用户输入
{
  name: 'password',
  trigger: ['change'],  // 用户每输入一个字符都校验
  rules: [BuiltinValidators.minLength(8)],
}
```

### 2. 提供清晰的错误消息

```typescript
// ❌ 不推荐
BuiltinValidators.required();

// ✅ 推荐
BuiltinValidators.required('邮箱不能为空');
BuiltinValidators.email('请输入有效的邮箱地址，例如: user@example.com');
```

### 3. 异步校验使用防抖

```typescript
// ✅ 避免频繁请求服务器
{
  type: 'async',
  message: '用户名已存在',
  validator: async (value) => {
    const exists = await checkUsername(value);
    return !exists;
  },
  debounce: 500,  // 500ms 防抖
}
```

### 4. 组合多个校验规则

```typescript
{
  name: 'password',
  rules: [
    BuiltinValidators.required('密码不能为空'),
    BuiltinValidators.minLength(8, '密码至少8个字符'),
    {
      type: 'custom',
      message: '密码必须包含数字和字母',
      validator: (value: string) => {
        return /\d/.test(value) && /[a-zA-Z]/.test(value);
      },
    },
  ],
}
```

### 5. 使用条件校验

```typescript
{
  name: 'otherReason',
  rules: [
    {
      type: 'custom',
      message: '选择"其他"时请填写原因',
      condition: (value, formData) => {
        // 仅当 reason 字段为 'other' 时才校验
        return formData.reason === 'other';
      },
      validator: (value) => value != null && value !== '',
    },
  ],
}
```

---

## 🔍 实战案例

### 用户注册表单

```typescript
import { FormValidator, BuiltinValidators } from '@dailyuse/utils/validation';

const registrationValidator = new FormValidator({
  fields: [
    {
      name: 'username',
      trigger: ['blur', 'submit'],
      rules: [
        BuiltinValidators.required('用户名不能为空'),
        BuiltinValidators.minLength(3, '用户名至少3个字符'),
        BuiltinValidators.maxLength(20, '用户名最多20个字符'),
        {
          type: 'async',
          message: '用户名已存在',
          validator: async (value: string) => {
            const response = await checkUsernameAvailability(value);
            return response.available;
          },
          debounce: 500,
        },
      ],
    },
    {
      name: 'email',
      trigger: ['blur', 'submit'],
      rules: [
        BuiltinValidators.required('邮箱不能为空'),
        BuiltinValidators.email('邮箱格式不正确'),
        {
          type: 'async',
          message: '邮箱已被注册',
          validator: async (value: string) => {
            const response = await checkEmailAvailability(value);
            return response.available;
          },
          debounce: 500,
        },
      ],
    },
    {
      name: 'password',
      trigger: ['blur', 'submit'],
      rules: [
        BuiltinValidators.required('密码不能为空'),
        BuiltinValidators.minLength(8, '密码至少8个字符'),
        {
          type: 'custom',
          message: '密码必须包含数字和字母',
          validator: (value: string) => {
            return /\d/.test(value) && /[a-zA-Z]/.test(value);
          },
        },
      ],
    },
    {
      name: 'confirmPassword',
      trigger: ['blur', 'submit'],
      rules: [
        BuiltinValidators.required('请确认密码'),
        {
          type: 'custom',
          message: '两次密码输入不一致',
          validator: (value: string, formData: any) => {
            return value === formData.password;
          },
        },
      ],
    },
    {
      name: 'phone',
      trigger: ['blur', 'submit'],
      rules: [
        BuiltinValidators.required('手机号不能为空'),
        BuiltinValidators.phone('手机号格式不正确'),
      ],
    },
    {
      name: 'agreeToTerms',
      trigger: ['submit'],
      rules: [
        {
          type: 'custom',
          message: '请同意服务条款',
          validator: (value: boolean) => value === true,
        },
      ],
    },
  ],
});
```

---

## 📚 API 参考

### FormValidator

#### 构造函数

```typescript
constructor(config: FormConfig)
```

#### 方法

| 方法                    | 签名                                                                                                                       | 说明         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------ |
| `validateField()`       | `validateField(fieldName: string, value: any, formData: any, trigger?: ValidationTrigger): Promise<FieldValidationResult>` | 校验单个字段 |
| `validateFields()`      | `validateFields(fieldNames: string[], formData: any, trigger?: ValidationTrigger): Promise<FormValidationResult>`          | 校验多个字段 |
| `validateForm()`        | `validateForm(formData: any, trigger?: ValidationTrigger): Promise<FormValidationResult>`                                  | 校验整个表单 |
| `addRule()`             | `addRule(fieldName: string, rule: ValidationRule): void`                                                                   | 添加规则     |
| `removeRule()`          | `removeRule(fieldName: string, ruleType: string): void`                                                                    | 移除规则     |
| `clearRules()`          | `clearRules(fieldName?: string): void`                                                                                     | 清空规则     |
| `addEventListener()`    | `addEventListener(type: ValidationEventType, listener: ValidationEventListener): void`                                     | 添加事件监听 |
| `removeEventListener()` | `removeEventListener(type: ValidationEventType, listener: ValidationEventListener): void`                                  | 移除事件监听 |
| `getConfig()`           | `getConfig(): FormConfig`                                                                                                  | 获取配置     |
| `updateConfig()`        | `updateConfig(config: Partial<FormConfig>): void`                                                                          | 更新配置     |
| `destroy()`             | `destroy(): void`                                                                                                          | 销毁实例     |

### BuiltinValidators

#### 静态方法

| 方法          | 签名                                                           | 说明     |
| ------------- | -------------------------------------------------------------- | -------- |
| `required()`  | `required(message?: string): RequiredRule`                     | 必填     |
| `minLength()` | `minLength(min: number, message?: string): LengthRule`         | 最小长度 |
| `maxLength()` | `maxLength(max: number, message?: string): LengthRule`         | 最大长度 |
| `min()`       | `min(min: number, message?: string): RangeRule`                | 最小值   |
| `max()`       | `max(max: number, message?: string): RangeRule`                | 最大值   |
| `range()`     | `range(min: number, max: number, message?: string): RangeRule` | 范围     |
| `pattern()`   | `pattern(regex: RegExp, message?: string): PatternRule`        | 正则     |
| `number()`    | `number(): NumberRule`                                         | 数字     |
| `email()`     | `email(message?: string): PatternRule`                         | 邮箱     |
| `phone()`     | `phone(message?: string): PatternRule`                         | 手机号   |
| `url()`       | `url(message?: string): PatternRule`                           | URL      |
| `date()`      | `date(message?: string): PatternRule`                          | 日期     |
| `json()`      | `json(message?: string): ValidationRule`                       | JSON     |

---

## 🔗 相关文档

- `packages/utils/src/validation/README.md` - 详细文档
- `packages/utils/src/validation/USAGE_GUIDE.md` - 使用指南
- `packages/utils/src/validation/examples.ts` - 完整示例

---

## 📝 变更历史

| 版本  | 日期       | 变更     |
| ----- | ---------- | -------- |
| 1.0.0 | 2025-01-01 | 初始版本 |

---

**维护者**: DailyUse Team  
**最后更新**: 2025-10-03
