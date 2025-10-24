# Universal Form Validation System

一个强大的、框架无关的前端表单校验解决方案，支持 Vue.js、React、Angular 等主流前端框架。

## 特性

- 🚀 **框架无关**: 核心校验逻辑与UI框架解耦，可适配任何前端框架
- ⚡ **高性能**: 支持同步/异步校验、防抖、取消机制
- 🎯 **类型安全**: 完全使用 TypeScript 编写，提供完整的类型定义
- 🌍 **国际化**: 内置多语言支持
- 📋 **丰富的内置规则**: 提供常用的校验规则，如必填、长度、格式等
- 🔧 **高度可定制**: 支持自定义校验规则、条件校验、全局规则
- 📊 **事件系统**: 完整的校验生命周期事件
- 🎨 **框架适配器**: 提供 React、Vue 等框架的适配器

## 快速开始

### 安装

```bash
npm install @dailyuse/utils
```

### 基础用法

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

## 核心概念

### 校验规则 (ValidationRule)

校验规则是校验系统的基础单位，支持多种类型：

```typescript
// 必填规则
const requiredRule = BuiltinValidators.required('此字段不能为空');

// 长度规则
const lengthRule = BuiltinValidators.minLength(3, '至少3个字符');

// 正则表达式规则
const patternRule = BuiltinValidators.pattern(/^[a-zA-Z]+$/, '只能包含字母');

// 自定义同步规则
const customRule = {
  type: 'custom',
  message: '密码必须包含数字',
  validator: (value: string) => /\d/.test(value),
};

// 异步规则
const asyncRule = {
  type: 'async',
  message: '用户名已存在',
  validator: async (value: string) => {
    const response = await checkUsername(value);
    return response.available;
  },
  debounce: 500, // 防抖500ms
};
```

### 校验触发器 (ValidationTrigger)

控制校验何时触发：

- `change`: 值改变时触发
- `blur`: 失去焦点时触发
- `submit`: 表单提交时触发
- `mount`: 组件挂载时触发

### 条件校验

根据其他字段的值决定是否执行校验：

```typescript
{
  type: 'custom',
  message: '选择"其他"时此字段必填',
  condition: (value: any, formData: any) => {
    return formData.category === 'other';
  },
  validator: (value: any) => value != null && value !== ''
}
```

## 内置校验规则

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

// 手机号（支持中国大陆）
BuiltinValidators.phone(message?)

// URL
BuiltinValidators.url(message?)

// 日期
BuiltinValidators.date(message?)

// JSON格式
BuiltinValidators.json(message?)
```

## 框架集成

### React 集成

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
            BuiltinValidators.email('邮箱格式不正确')
          ]
        },
        {
          name: 'password',
          rules: [
            BuiltinValidators.required('密码不能为空'),
            BuiltinValidators.minLength(6, '密码至少6位')
          ]
        }
      ]
    },
    initialValues: { email: '', password: '' }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await methods.validateForm('submit');

    if (result.valid) {
      // 提交表单
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

### Vue 集成 (示例)

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

// 表单字段
const email = ref({ value: '', error: '', touched: false });
const password = ref({ value: '', error: '', touched: false });

// 创建校验器
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

// 校验状态
const isValid = computed(() => !email.value.error && !password.value.error);

// 监听字段变化并校验
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
  } else {
    // 显示错误
    Object.keys(result.fields).forEach((fieldName) => {
      const fieldResult = result.fields[fieldName];
      if (fieldName === 'email') {
        email.value.error = fieldResult.firstError || '';
      } else if (fieldName === 'password') {
        password.value.error = fieldResult.firstError || '';
      }
    });
  }
}
</script>
```

## 高级功能

### 事件系统

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
```

### 动态规则管理

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
```

### 全局校验规则

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

### 国际化支持

```typescript
// 创建多语言校验器
const enValidators = new BuiltinValidators('en');
const zhValidators = new BuiltinValidators('zh-CN');

// 使用指定语言的规则
const rules = [
  enValidators.required('This field is required'),
  enValidators.email('Please enter a valid email address'),
];
```

## API 参考

### FormValidator

#### 构造函数

```typescript
constructor(config: FormConfig)
```

#### 方法

```typescript
// 校验单个字段
validateField(fieldName: string, value: any, formData: any, trigger?: ValidationTrigger): Promise<FieldValidationResult>

// 校验多个字段
validateFields(fieldNames: string[], formData: any, trigger?: ValidationTrigger): Promise<FormValidationResult>

// 校验整个表单
validateForm(formData: any, trigger?: ValidationTrigger): Promise<FormValidationResult>

// 动态管理规则
addRule(fieldName: string, rule: ValidationRule): void
removeRule(fieldName: string, ruleType: string): void
clearRules(fieldName?: string): void

// 事件管理
addEventListener(type: ValidationEventType, listener: ValidationEventListener): void
removeEventListener(type: ValidationEventType, listener: ValidationEventListener): void

// 配置管理
getConfig(): FormConfig
updateConfig(config: Partial<FormConfig>): void

// 清理资源
destroy(): void
```

### BuiltinValidators

#### 静态方法

```typescript
// 基础校验
static required(message?: string): RequiredRule
static minLength(min: number, message?: string): LengthRule
static maxLength(max: number, message?: string): LengthRule
static min(min: number, message?: string): RangeRule
static max(max: number, message?: string): RangeRule
static range(min: number, max: number, message?: string): RangeRule
static pattern(regex: RegExp, message?: string): PatternRule
static number(): NumberRule

// 格式校验
static email(message?: string): PatternRule
static phone(message?: string): PatternRule
static url(message?: string): PatternRule
static date(message?: string): PatternRule
static json(message?: string): ValidationRule
```

## 完整示例

查看 [examples.ts](./examples.ts) 文件获取更多完整的使用示例，包括：

- 用户注册表单
- 产品信息表单
- 自定义校验规则
- 动态规则管理
- 复杂的条件校验

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
