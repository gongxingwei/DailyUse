# 任务模板验证系统

这是一个完整的任务模板验证系统，提供了灵活、可扩展的验证功能。

## 🚀 快速开始

### 基础用法

```typescript
import { validateTaskTemplate } from './validation';

const template: TaskTemplate = {
  // ... 你的任务模板数据
};

const result = validateTaskTemplate(template);
if (result.isValid) {
  console.log('✅ 验证通过');
} else {
  console.log('❌ 验证失败:', result.errors);
}
```

### 生成验证报告

```typescript
import { validateAndReport } from './validation';

const { result, report } = validateAndReport(template);
console.log(report); // 详细的文本报告
```

## 📋 验证器组件

### 内置验证器

1. **BasicInfoValidator** - 验证基础信息
   - 标题（必填，1-100字符）
   - 描述（可选，最多1000字符）
   - 优先级（1-4）
   - 版本号（必须大于0）

2. **TimeConfigValidator** - 验证时间配置
   - 时间类型（allDay/timed/timeRange）
   - 基础时间信息
   - 时区信息
   - 时间逻辑一致性

3. **RecurrenceValidator** - 验证重复规则
   - 重复类型（none/daily/weekly/monthly/yearly）
   - 重复间隔
   - 结束条件
   - 重复配置

4. **ReminderValidator** - 验证提醒配置
   - 提醒启用状态
   - 提醒列表
   - 稍后提醒设置
   - 提醒时间合理性

5. **SchedulingPolicyValidator** - 验证调度策略
   - 重新调度设置
   - 最大延迟天数
   - 时间限制规则

6. **MetadataValidator** - 验证元数据
   - 分类（必填）
   - 标签（数组，最多20个）
   - 预估时长
   - 难度等级（1-5）
   - 地点信息

## 🎯 验证模式

### 创建模式

```typescript
import { TaskTemplateValidator } from './validation';

const result = TaskTemplateValidator.validateForCreate(template);
```

### 更新模式

```typescript
const result = TaskTemplateValidator.validateForUpdate(template);
```

### 快速验证（跳过非关键验证器）

```typescript
const result = TaskTemplateValidator.quickValidate(template);
```

### 严格验证（遇到错误立即停止）

```typescript
const result = TaskTemplateValidator.strictValidate(template);
```

## 🔧 高级功能

### 使用预定义规则集

```typescript
import { validateWithRuleSet } from './validation';

// 基础验证（只验证必要字段）
const basicResult = validateWithRuleSet(template, 'basic');

// 完整验证
const completeResult = validateWithRuleSet(template, 'complete');

// 严格验证
const strictResult = validateWithRuleSet(template, 'strict');
```

### 自定义验证器

```typescript
import { ValidationRuleBuilder, ValidatorFactory } from './validation';

// 创建自定义验证器
const customValidator = new ValidationRuleBuilder()
  .field(
    (template) => template.title,
    (title) =>
      title.includes('重要')
        ? { isValid: true, errors: [] }
        : { isValid: false, errors: ['重要任务必须包含"重要"关键词'] },
    '标题关键词',
  )
  .when(
    (template) => template.priority === 4,
    (template) =>
      template.timeConfig.reminder?.enabled
        ? { isValid: true, errors: [] }
        : { isValid: false, errors: ['高优先级任务必须启用提醒'] },
  )
  .build();

// 注册自定义验证器
ValidatorFactory.registerValidator('CustomValidator', customValidator);
```

### 自定义规则集

```typescript
ValidatorFactory.registerRuleSet({
  name: 'habit-validation',
  description: '习惯养成任务专用验证',
  validators: ['BasicInfoValidator', 'TimeConfigValidator', 'RecurrenceValidator'],
  config: {
    mode: 'create',
    skipValidators: ['SchedulingPolicyValidator'],
  },
});
```

## 📊 验证报告

### 生成详细报告

```typescript
import { ValidationReportGenerator } from './validation';

const result = TaskTemplateValidator.validateWithContext(template);

// 文本报告
const textReport = ValidationReportGenerator.generateReport(template, result);

// JSON报告
const jsonReport = ValidationReportGenerator.generateJSONReport(template, result);
```

### 报告内容

- 验证状态
- 错误信息列表
- 警告信息列表
- 验证统计（执行时间、通过/失败验证器数量）
- 优化建议

## 🛠 ValidationUtils工具类

提供常用的验证方法：

```typescript
import { ValidationUtils } from './validation';

// 字符串长度验证
ValidationUtils.validateStringLength(value, '字段名', { min: 1, max: 100 });

// 数值范围验证
ValidationUtils.validateNumberRange(value, '字段名', { min: 1, max: 10 });

// 枚举验证
ValidationUtils.validateEnum(value, '字段名', ['option1', 'option2']);

// 数组验证
ValidationUtils.validateArray(value, '字段名', { minLength: 1, maxLength: 10 });

// 日期验证
ValidationUtils.validateDate(value, '字段名', { futureOnly: true });

// 邮箱验证
ValidationUtils.validateEmail(email);

// URL验证
ValidationUtils.validateUrl(url);
```

## 🔍 常用常量

```typescript
import { VALIDATION_CONSTANTS } from './validation';

console.log(VALIDATION_CONSTANTS.MAX_TITLE_LENGTH); // 100
console.log(VALIDATION_CONSTANTS.RECOMMENDED_CATEGORIES); // ['work', 'personal', ...]
```

## 🧪 测试

运行验证系统测试：

```typescript
import { runAllTests } from './validation/tests';

runAllTests(); // 在控制台输出测试结果
```

## 📝 最佳实践

### 1. 选择合适的验证模式

- **创建新模板**：使用 `validateForCreate`
- **更新现有模板**：使用 `validateForUpdate`
- **快速检查**：使用 `quickValidate`
- **严格验证**：使用 `strictValidate`

### 2. 处理验证结果

```typescript
const result = validateTaskTemplate(template);

if (!result.isValid) {
  // 显示错误信息给用户
  console.error('验证失败:', result.errors);
  return;
}

if (result.warnings && result.warnings.length > 0) {
  // 显示警告信息
  console.warn('注意:', result.warnings);
}

// 继续处理有效的模板
```

### 3. 自定义验证器设计原则

- 单一职责：每个验证器只负责特定的验证逻辑
- 可组合：可以与其他验证器组合使用
- 清晰的错误信息：提供具体、可操作的错误提示
- 性能考虑：避免重复验证和复杂计算

### 4. 错误信息指导原则

- 具体明确：准确描述问题所在
- 可操作：告诉用户如何修复问题
- 用户友好：使用易懂的语言
- 国际化：支持多语言错误信息

## 🚨 注意事项

1. **性能**：大批量验证时考虑使用 `quickValidate`
2. **内存**：避免在验证器中保存大量状态
3. **异步操作**：当前验证器都是同步的，如需异步验证请扩展接口
4. **错误处理**：验证器内部异常会被捕获并转换为验证错误

## 🔄 扩展指南

### 添加新的验证器

1. 实现 `ITemplateValidator` 接口
2. 继承或使用 `ValidationUtils` 的方法
3. 在 `TaskTemplateValidator` 中注册
4. 添加相应的测试

### 修改现有验证器

1. 保持向后兼容性
2. 更新相关测试
3. 更新文档

### 添加新的验证规则

使用 `ValidationRuleBuilder` 可以快速添加验证规则，无需创建完整的验证器类。

---

这个验证系统提供了完整的任务模板验证功能，具有良好的可扩展性和易用性。通过合理使用各种验证模式和工具，可以确保任务模板数据的质量和一致性。
