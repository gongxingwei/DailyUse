# Validation 系统使用指南 - 正确架构

本项目包含两套**严格分层**的验证系统，各自有明确的职责和使用场景。

## 🎯 核心设计原则

### **严格分离关注点**
```
┌─────────────────┐    ┌─────────────────┐
│   前端UI验证     │    │   后端业务验证   │
│  composables/   │    │   services/     │
│   用户体验      │    │   数据完整性     │
│   实时反馈      │    │   业务规则      │
└─────────────────┘    └─────────────────┘
      ↓ 仅UI层           ↓ 仅service层
  用户输入时调用        数据保存时调用
```

## 1. composables/useXXXValidation.ts - 前端UI验证

### 🎯 **职责边界**
- ✅ **只负责**: UI层的用户体验和实时反馈
- ✅ **调用时机**: 用户输入、表单交互时
- ❌ **绝不调用**: 后端validation services
- ❌ **不负责**: 业务逻辑验证或数据完整性检查

### 特点
- **快速响应**: 毫秒级验证，不阻塞UI
- **用户友好**: 提供清晰的错误提示和警告
- **Vue响应式**: 与Vue组件完美集成
- **轻量级**: 只做必要的基础检查

### 使用场景
```vue
<template>
  <v-text-field 
    v-model="reminder.minutesBefore"
    :error-messages="reminderValidation.errors"
    @input="validateUI"
  />
</template>

<script setup>
import { useReminderValidation } from '../composables/useReminderValidation';

const reminderValidation = useReminderValidation();

// 仅UI验证 - 实时反馈
const validateUI = () => {
  reminderValidation.validateReminders(localData.value.reminder);
};
</script>
```

## 2. services/validation/ - 后端业务验证

### 🎯 **职责边界**
- ✅ **只负责**: 业务逻辑和数据完整性验证
- ✅ **调用时机**: 数据保存前的最后一道防线
- ✅ **使用场景**: taskTemplateService、API接口、数据迁移
- ❌ **不用于**: UI实时反馈或用户体验

### 特点
- **完整性检查**: 深度验证所有业务规则
- **类型安全**: 完整的TypeScript支持
- **详细报告**: 包含错误、警告、统计信息
- **多种模式**: create/update/strict/quick

### 使用场景
```typescript
// 仅在service层使用
export class TaskTemplateService {
  async addTaskTemplate(template: TaskTemplate): Promise<TResponse<void>> {
    // 后端业务验证 - 数据保存前
    const validation = TaskTemplateValidator.validateForCreate(template);
    
    if (!validation.isValid) {
      return {
        success: false,
        message: `验证失败: ${validation.errors.join(", ")}`,
      };
    }
    
    // 保存数据...
  }
}
```

## 3. 正确的验证流程

### ✅ **正确模式**
```
用户输入 → 前端UI验证 → 实时UI反馈
         ↓
      表单提交 → 前端UI最终检查 → 后端业务验证 → 数据保存
```

### ❌ **错误模式**
```
❌ 前端composables调用后端services (混淆职责)
❌ 后端services处理UI反馈 (职责错位)
❌ 在实时验证中调用完整业务验证 (性能问题)
```

## 4. 完整实现示例

### 前端组件正确用法
```vue
<template>
  <v-form @submit="handleSubmit">
    <!-- 前端验证错误显示 -->
    <v-alert v-if="uiValidation.errors.length > 0" type="error">
      <li v-for="error in uiValidation.errors">{{ error }}</li>
    </v-alert>
    
    <!-- 后端验证错误显示 (仅提交时) -->
    <v-alert v-if="backendErrors.length > 0" type="error">
      <div>数据验证失败：</div>
      <li v-for="error in backendErrors">{{ error }}</li>
    </v-alert>
    
    <v-text-field 
      v-model="form.title"
      @input="validateUIRealtime"
    />
    
    <v-btn 
      :disabled="!uiValidation.isValid" 
      @click="handleSubmit"
    >
      提交
    </v-btn>
  </v-form>
</template>

<script setup>
import { useReminderValidation } from '../composables/useReminderValidation';
import { TaskTemplateValidator } from '../services/validation'; // 仅提交时使用

const uiValidation = useReminderValidation();
const backendErrors = ref<string[]>([]);

// 前端UI实时验证
const validateUIRealtime = () => {
  uiValidation.validateReminders(form.value.reminder);
};

// 提交时的完整验证流程
const handleSubmit = async () => {
  try {
    // 1. 前端UI最终检查
    if (!uiValidation.isValid.value) {
      throw new Error('前端验证失败');
    }
    
    // 2. 后端业务验证 (仅在这里调用)
    const backendValidation = TaskTemplateValidator.validateForCreate(form.value);
    if (!backendValidation.isValid) {
      backendErrors.value = backendValidation.errors || [];
      return; // 不继续提交
    }
    
    // 3. 提交数据
    await submitData();
    
  } catch (error) {
    console.error('提交失败:', error);
  }
};
</script>
```

## 5. 架构优势

### ✅ **性能优化**
- 前端验证: 毫秒级响应，不影响用户体验
- 后端验证: 只在必要时调用，避免过度验证

### ✅ **职责清晰**
- 前端: 专注用户体验和基础校验
- 后端: 专注业务逻辑和数据完整性

### ✅ **可维护性**
- 各层独立演进，不相互耦合
- 易于测试和调试

### ✅ **可扩展性**
- 可以独立扩展UI验证或业务验证
- 支持不同的验证策略

## 6. 文件组织

```
src/modules/Task/
├── composables/                    # 前端UI验证
│   ├── useReminderValidation.ts    # ✅ 仅UI验证
│   ├── useTimeConfigValidation.ts  # ✅ 仅UI验证
│   └── useRecurrenceValidation.ts  # ✅ 仅UI验证
│
├── services/validation/            # 后端业务验证
│   ├── TaskTemplateValidator.ts    # ✅ 仅业务验证
│   ├── validators/                 # ✅ 专门业务验证器
│   └── ...
│
├── services/                       # 业务服务层
│   └── taskTemplateService.ts      # ✅ 使用后端验证
│
└── components/                     # UI组件
    └── TaskTemplateForm.vue        # ✅ 使用前端验证
```

## 7. 关键要点

1. **🚫 绝对禁止**: composables中调用services/validation
2. **✅ 明确职责**: 前端管UI，后端管数据
3. **⚡ 性能优先**: 实时验证要快速，完整验证在必要时
4. **🎯 用户体验**: 前端验证提供即时反馈
5. **🔒 数据安全**: 后端验证确保数据完整性

这种架构确保了清晰的职责分离，良好的性能表现，以及优秀的用户体验。
