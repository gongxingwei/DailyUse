# Goal 模块渐进式迁移指南

## 概述

本指南提供了从旧的 Goal 模块架构逐步迁移到新架构的详细步骤和实际示例。

## 迁移策略

### 阶段 1：并存期
- 保留旧的 `goalStore` 和组合函数
- 引入新的架构组件
- 新功能使用新架构
- 现有功能继续使用旧架构

### 阶段 2：测试期
- 在非关键组件中试用新架构
- 验证数据一致性
- 性能测试
- 用户体验测试

### 阶段 3：迁移期
- 逐步将组件迁移到新架构
- 保持功能对等
- 确保数据迁移完整

### 阶段 4：清理期
- 移除旧的架构代码
- 更新文档
- 性能优化

## 实际迁移示例

### 1. 组件迁移示例

#### 原有组件（使用旧架构）

```vue
<template>
  <div>
    <v-btn @click="createGoal">创建目标</v-btn>
    <v-btn @click="deleteGoal(goalId)">删除目标</v-btn>
  </div>
</template>

<script setup lang="ts">
import { useGoalManagement } from '@/modules/Goal/composables/useGoalManagement';
import { useGoalDialog } from '@/modules/Goal/composables/useGoalDialog';

// 使用旧的组合函数
const { handleDeleteGoal } = useGoalManagement();
const { startCreateGoal } = useGoalDialog();

const createGoal = () => {
  startCreateGoal();
};

const deleteGoal = async (goalId: string) => {
  await handleDeleteGoal(goalId);
};
</script>
```

#### 迁移后组件（使用新架构）

```vue
<template>
  <div>
    <v-btn @click="createGoal">创建目标</v-btn>
    <v-btn @click="deleteGoal(goalId)">删除目标</v-btn>
  </div>
</template>

<script setup lang="ts">
// 导入新的组合函数
import { useGoalManagement } from '@/modules/Goal/composables/useGoalManagement.new';
import { useGoalDialog } from '@/modules/Goal/composables/useGoalDialog.new';

// 使用新的组合函数
const { startDeleteGoal, handleDeleteGoal } = useGoalManagement();
const { startCreateGoal } = useGoalDialog();

const createGoal = () => {
  startCreateGoal();
};

const deleteGoal = async (goalId: string) => {
  startDeleteGoal(goalId);
  await handleDeleteGoal();
};
</script>
```

### 2. Store 迁移示例

#### 原有 Store 使用

```typescript
// 旧的 store 使用方式
import { useGoalStore } from '@/modules/Goal/stores/goalStore';

const goalStore = useGoalStore();

// 获取目标
const goals = goalStore.goals;

// 创建目标
await goalStore.createGoal(goalData);

// 删除目标
await goalStore.deleteGoalById(goalId);
```

#### 新 Store 使用

```typescript
// 新的 store 使用方式
import { useGoalStore } from '@/modules/Goal/presentation/stores/goalStore';
import { createGoalDomainApplicationService } from '@/modules/Goal/application/services/goalDomainApplicationService';

const goalStore = useGoalStore();
const goalService = createGoalDomainApplicationService();

// 获取目标
const goals = goalStore.goals;

// 创建目标（通过应用服务，自动同步状态）
const result = await goalService.createGoal(goalData);

// 删除目标（通过应用服务，自动同步状态）
const deleteResult = await goalService.deleteGoal(goalId);
```

### 3. 数据格式兼容性

#### 旧格式到新格式的转换

```typescript
// 转换函数：旧格式 → 新格式
function convertOldGoalToNew(oldGoal: any): IGoal {
  return {
    id: oldGoal.id,
    title: oldGoal.title,
    description: oldGoal.description || '',
    color: oldGoal.color || '#FF5733',
    dirId: oldGoal.dirId || 'default',
    startTime: TimeUtils.safeToDateTime(oldGoal.startTime) || TimeUtils.now(),
    endTime: TimeUtils.safeToDateTime(oldGoal.endTime) || TimeUtils.now(),
    note: oldGoal.note || '',
    keyResults: (oldGoal.keyResults || []).map((kr: any) => ({
      id: kr.id || uuidv4(),
      name: kr.name || kr.title || '',
      startValue: kr.startValue || 0,
      targetValue: kr.targetValue || 100,
      currentValue: kr.currentValue || 0,
      calculationMethod: kr.calculationMethod || 'sum',
      weight: kr.weight || 5,
      lifecycle: {
        createdAt: TimeUtils.safeToDateTime(kr.createdAt) || TimeUtils.now(),
        updatedAt: TimeUtils.safeToDateTime(kr.updatedAt) || TimeUtils.now(),
        status: kr.status || 'active'
      }
    })),
    analysis: {
      motive: oldGoal.motive || '',
      feasibility: oldGoal.feasibility || ''
    },
    lifecycle: {
      createdAt: TimeUtils.safeToDateTime(oldGoal.createdAt) || TimeUtils.now(),
      updatedAt: TimeUtils.safeToDateTime(oldGoal.updatedAt) || TimeUtils.now(),
      status: oldGoal.status || 'active'
    },
    analytics: {
      overallProgress: oldGoal.progress || 0,
      weightedProgress: 0,
      completedKeyResults: 0,
      totalKeyResults: (oldGoal.keyResults || []).length
    },
    version: 1
  };
}

// 批量转换现有数据
async function migrateExistingData() {
  const oldGoalStore = useOldGoalStore();
  const goalService = createGoalDomainApplicationService();
  
  const oldGoals = oldGoalStore.goals;
  
  for (const oldGoal of oldGoals) {
    try {
      const newGoal = convertOldGoalToNew(oldGoal);
      await goalService.createGoal(newGoal);
      console.log(`✅ 已迁移目标: ${newGoal.title}`);
    } catch (error) {
      console.error(`❌ 迁移目标失败: ${oldGoal.title}`, error);
    }
  }
}
```

### 4. 渐进式集成策略

#### Step 1: 添加新的导入别名

```typescript
// 在现有文件中添加新的导入，使用别名避免冲突
import { useGoalStore as useOldGoalStore } from '@/modules/Goal/stores/goalStore';
import { useGoalStore as useNewGoalStore } from '@/modules/Goal/presentation/stores/goalStore';
import { createGoalDomainApplicationService } from '@/modules/Goal/application/services/goalDomainApplicationService';

// 逐步替换使用新的 API
export function useHybridGoalManagement() {
  const oldStore = useOldGoalStore();
  const newStore = useNewGoalStore();
  const goalService = createGoalDomainApplicationService();
  
  return {
    // 提供两种 API，让调用者选择
    oldAPI: {
      store: oldStore,
      createGoal: oldStore.createGoal.bind(oldStore),
      deleteGoal: oldStore.deleteGoalById.bind(oldStore)
    },
    newAPI: {
      store: newStore,
      service: goalService,
      createGoal: goalService.createGoal.bind(goalService),
      deleteGoal: goalService.deleteGoal.bind(goalService)
    }
  };
}
```

#### Step 2: 组件逐步迁移

```vue
<template>
  <div>
    <!-- 使用计算属性统一数据源 -->
    <GoalCard 
      v-for="goal in goals" 
      :key="goal.id" 
      :goal="goal" 
      @delete="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// 环境变量控制使用哪种架构
const USE_NEW_ARCHITECTURE = process.env.VUE_APP_USE_NEW_GOAL_ARCHITECTURE === 'true';

let goalManagement: any;

if (USE_NEW_ARCHITECTURE) {
  const { useGoalManagement } = await import('@/modules/Goal/composables/useGoalManagement.new');
  goalManagement = useGoalManagement();
} else {
  const { useGoalManagement } = await import('@/modules/Goal/composables/useGoalManagement');
  goalManagement = useGoalManagement();
}

// 统一的接口
const goals = computed(() => goalManagement.goalsInCurStatus);

const handleDelete = async (goalId: string) => {
  if (USE_NEW_ARCHITECTURE) {
    goalManagement.startDeleteGoal(goalId);
    await goalManagement.handleDeleteGoal();
  } else {
    await goalManagement.handleDeleteGoal(goalId);
  }
};
</script>
```

### 5. 数据同步策略

#### 双向同步（过渡期）

```typescript
// 创建数据同步服务，确保新旧架构数据一致
export class GoalDataSyncService {
  private oldStore = useOldGoalStore();
  private newStore = useNewGoalStore();
  private goalService = createGoalDomainApplicationService();
  
  async syncOldToNew() {
    // 将旧数据同步到新架构
    const oldGoals = this.oldStore.goals;
    for (const oldGoal of oldGoals) {
      const newGoal = convertOldGoalToNew(oldGoal);
      this.newStore.addGoal(newGoal);
    }
  }
  
  async syncNewToOld() {
    // 将新数据同步到旧架构（如果需要向后兼容）
    const newGoals = this.newStore.goals;
    for (const newGoal of newGoals) {
      const oldGoal = convertNewGoalToOld(newGoal);
      this.oldStore.addGoal(oldGoal);
    }
  }
  
  startPeriodicSync() {
    // 定期同步（在完全迁移前使用）
    setInterval(() => {
      this.syncOldToNew();
    }, 30000); // 每30秒同步一次
  }
}
```

### 6. 测试策略

#### 并行测试

```typescript
describe('Goal Module Migration', () => {
  it('新旧架构功能对等性测试', async () => {
    const oldGoalManagement = useOldGoalManagement();
    const newGoalManagement = useNewGoalManagement();
    
    const testGoalData = createTestGoalData();
    
    // 使用旧架构创建目标
    const oldResult = await oldGoalManagement.createGoal(testGoalData);
    
    // 使用新架构创建目标
    const newResult = await newGoalManagement.goalService.createGoal(testGoalData);
    
    // 验证结果一致性
    expect(normalizeGoalData(oldResult)).toEqual(normalizeGoalData(newResult.data.goal));
  });
  
  it('数据格式兼容性测试', () => {
    const oldGoal = createOldFormatGoal();
    const convertedGoal = convertOldGoalToNew(oldGoal);
    const backConvertedGoal = convertNewGoalToOld(convertedGoal);
    
    // 验证关键字段保持一致
    expect(backConvertedGoal.title).toBe(oldGoal.title);
    expect(backConvertedGoal.id).toBe(oldGoal.id);
  });
});
```

## 迁移检查清单

### 准备阶段
- [ ] 备份现有数据
- [ ] 设置功能标志（feature flags）
- [ ] 准备回滚方案
- [ ] 编写数据转换函数

### 开发阶段
- [ ] 实现新架构组件
- [ ] 创建兼容性适配器
- [ ] 编写迁移脚本
- [ ] 添加双向同步机制

### 测试阶段
- [ ] 单元测试覆盖
- [ ] 集成测试验证
- [ ] 性能对比测试
- [ ] 用户体验测试

### 部署阶段
- [ ] 金丝雀发布
- [ ] 监控数据一致性
- [ ] 收集用户反馈
- [ ] 逐步扩大范围

### 清理阶段
- [ ] 移除旧代码
- [ ] 更新文档
- [ ] 清理临时文件
- [ ] 性能优化

## 风险管控

### 数据安全
- 在迁移前完整备份所有目标数据
- 实施增量备份策略
- 验证数据完整性

### 功能连续性
- 使用功能标志控制新旧切换
- 保持向后兼容性
- 准备快速回滚机制

### 用户体验
- 保持界面一致性
- 确保操作流程不变
- 提供平滑的过渡体验

这个渐进式迁移策略确保了从旧架构到新架构的平滑过渡，最大程度降低了风险，同时为用户提供了连续的服务体验。
