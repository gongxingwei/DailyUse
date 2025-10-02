# Domain-Client Goal 模块 - 快速参考

## 📚 接口定义位置

| 接口类型 | 文件路径 | 说明 |
|---------|---------|------|
| **基础接口** | `packages/contracts/src/modules/goal/types.ts` | IGoal, IKeyResult 等基础接口 |
| **客户端接口** | `packages/contracts/src/modules/goal/types.ts` | IGoalClient, IKeyResultClient 等（包含计算属性） |
| **DTO 定义** | `packages/contracts/src/modules/goal/dtos.ts` | GoalDTO, GoalClientDTO 等 |
| **实体实现** | `packages/domain-client/src/goal/` | Goal, KeyResult 等实体类 |

---

## 🎯 计算属性速查表

### Goal 聚合根计算属性

| 属性名 | 类型 | 说明 | 示例 |
|-------|------|------|------|
| **进度相关** |
| `overallProgress` | `number` | 整体进度百分比 (0-100) | `75` |
| `weightedProgress` | `number` | 加权进度百分比 (0-100) | `80` |
| `calculatedProgress` | `number` | 计算进度百分比 (0-100) | `75` |
| `todayProgress` | `number` | 今日进度增量百分比 | `5` |
| **关键结果统计** |
| `completedKeyResults` | `number` | 已完成的关键结果数量 | `3` |
| `totalKeyResults` | `number` | 关键结果总数 | `5` |
| `keyResultCompletionRate` | `number` | 关键结果完成率 (0-100) | `60` |
| **状态分析** |
| `progressStatus` | `GoalProgressStatus` | 进度状态 | `'in-progress'` |
| `healthScore` | `number` | 健康度评分 (0-100) | `85` |
| **时间相关** |
| `daysRemaining` | `number` | 剩余天数 | `15` |
| `isOverdue` | `boolean` | 是否过期 | `false` |
| `durationDays` | `number` | 持续天数 | `30` |
| `elapsedDays` | `number` | 已进行天数 | `15` |
| `timeProgress` | `number` | 时间进度百分比 (0-100) | `50` |
| **今日进度相关** |
| `hasTodayProgress` | `boolean` | 是否有今日进展 | `true` |
| `todayProgressLevel` | `GoalTodayProgressLevel` | 今日进度等级 | `'high'` |
| `todayRecordsStats` | `object` | 今日记录统计 | 见下方 |

#### todayRecordsStats 对象结构

```typescript
{
  totalRecords: 3,              // 今日记录总数
  keyResultsWithRecords: 2,     // 有记录的关键结果数
  averageRecordValue: 2.5,      // 平均记录值
  totalRecordValue: 7.5         // 总记录值
}
```

### KeyResult 计算属性

| 属性名 | 类型 | 说明 | 示例 |
|-------|------|------|------|
| `progress` | `number` | 完成百分比 (0-100) | `75` |
| `isCompleted` | `boolean` | 是否已完成 | `false` |
| `remaining` | `number` | 剩余数量 | `25` |

### GoalReview 计算属性

| 属性名 | 类型 | 说明 | 示例 |
|-------|------|------|------|
| `overallRating` | `number` | 平均评分 (1-10) | `8` |
| `isPositiveReview` | `boolean` | 是否为正向评价 (评分 >= 7) | `true` |

---

## 💻 代码示例

### 1. 创建目标实体

```typescript
import { Goal } from '@dailyuse/domain-client/goal';
import type { GoalContracts } from '@dailyuse/contracts';

// 从 API 响应创建
const goalData: GoalContracts.GoalClientDTO = await api.getGoal(goalId);
const goal = Goal.fromClientDTO(goalData);

// 或从基础 DTO 创建
const goalDTO: GoalContracts.GoalDTO = { /* ... */ };
const goal2 = Goal.fromDTO(goalDTO);
```

### 2. 访问计算属性

```typescript
// 进度信息
console.log('整体进度:', goal.overallProgress, '%');
console.log('加权进度:', goal.weightedProgress, '%');
console.log('今日进度:', goal.todayProgress, '%');

// 健康度
console.log('健康度评分:', goal.healthScore);
if (goal.healthScore >= 80) {
  console.log('✅ 目标健康');
} else if (goal.healthScore >= 60) {
  console.log('⚠️ 需要关注');
} else {
  console.log('❌ 需要改进');
}

// 时间信息
console.log('剩余天数:', goal.daysRemaining);
console.log('已进行天数:', goal.elapsedDays);
console.log('时间进度:', goal.timeProgress, '%');
console.log('是否过期:', goal.isOverdue ? '是' : '否');

// 关键结果统计
console.log(`关键结果完成情况: ${goal.completedKeyResults}/${goal.totalKeyResults}`);
console.log('完成率:', goal.keyResultCompletionRate, '%');

// 今日进度
if (goal.hasTodayProgress) {
  const stats = goal.todayRecordsStats;
  console.log('今日记录数:', stats.totalRecords);
  console.log('涉及的关键结果:', stats.keyResultsWithRecords);
  console.log('今日进度等级:', goal.todayProgressLevel);
}
```

### 3. 转换为 ClientDTO

```typescript
// 转换为包含所有计算属性的 ClientDTO
const clientDTO = goal.toClientDTO();

// 发送到后端或存储
await api.updateGoal(goal.uuid, clientDTO);

// 或转换为基础 DTO（不含计算属性）
const baseDTO = goal.toDTO();
```

### 4. Vue 组件中使用

```vue
<script setup lang="ts">
import { Goal } from '@dailyuse/domain-client/goal';
import { computed, ref } from 'vue';

interface Props {
  goalData: GoalContracts.GoalClientDTO;
}

const props = defineProps<Props>();
const goal = ref(Goal.fromClientDTO(props.goalData));

// 使用计算属性
const progressColor = computed(() => {
  const progress = goal.value.overallProgress;
  if (progress >= 80) return 'success';
  if (progress >= 60) return 'warning';
  if (progress >= 40) return 'info';
  return 'error';
});

const healthBadge = computed(() => {
  const score = goal.value.healthScore;
  if (score >= 80) return { text: '优秀', color: 'success' };
  if (score >= 60) return { text: '良好', color: 'warning' };
  return { text: '需要改进', color: 'error' };
});

const timeStatus = computed(() => {
  if (goal.value.isOverdue) {
    return { text: '已逾期', color: 'error' };
  }
  if (goal.value.daysRemaining <= 3) {
    return { text: '即将截止', color: 'warning' };
  }
  return { text: `还有 ${goal.value.daysRemaining} 天`, color: 'info' };
});
</script>

<template>
  <div class="goal-card">
    <h3>{{ goal.name }}</h3>
    
    <!-- 进度条 -->
    <v-progress-linear
      :model-value="goal.overallProgress"
      :color="progressColor"
      height="8"
    />
    <p>{{ goal.overallProgress }}% 完成</p>

    <!-- 健康度徽章 -->
    <v-chip :color="healthBadge.color">
      健康度: {{ goal.healthScore }} - {{ healthBadge.text }}
    </v-chip>

    <!-- 时间状态 -->
    <v-chip :color="timeStatus.color">
      {{ timeStatus.text }}
    </v-chip>

    <!-- 今日进度（如果有） -->
    <div v-if="goal.hasTodayProgress" class="today-progress">
      <v-icon>mdi-trending-up</v-icon>
      <span>今日 +{{ goal.todayProgress }}%</span>
      <v-chip size="small">
        {{ goal.todayProgressLevel }}
      </v-chip>
    </div>

    <!-- 关键结果列表 -->
    <div class="key-results">
      <h4>关键结果 ({{ goal.completedKeyResults }}/{{ goal.totalKeyResults }})</h4>
      <div v-for="kr in goal.keyResults" :key="kr.uuid" class="kr-item">
        <span>{{ kr.name }}</span>
        <v-progress-linear
          :model-value="kr.progress"
          :color="kr.isCompleted ? 'success' : 'primary'"
        />
        <span>{{ kr.progress }}%</span>
        <v-icon v-if="kr.isCompleted" color="success">
          mdi-check-circle
        </v-icon>
        <span v-else>剩余: {{ kr.remaining }} {{ kr.unit }}</span>
      </div>
    </div>
  </div>
</template>
```

### 5. React 组件中使用

```typescript
import { Goal } from '@dailyuse/domain-client/goal';
import { useMemo } from 'react';

interface GoalCardProps {
  goalData: GoalContracts.GoalClientDTO;
}

export function GoalCard({ goalData }: GoalCardProps) {
  const goal = useMemo(() => Goal.fromClientDTO(goalData), [goalData]);

  const progressColor = useMemo(() => {
    const progress = goal.overallProgress;
    if (progress >= 80) return 'success';
    if (progress >= 60) return 'warning';
    if (progress >= 40) return 'info';
    return 'error';
  }, [goal.overallProgress]);

  const healthBadge = useMemo(() => {
    const score = goal.healthScore;
    if (score >= 80) return { text: '优秀', color: 'green' };
    if (score >= 60) return { text: '良好', color: 'yellow' };
    return { text: '需要改进', color: 'red' };
  }, [goal.healthScore]);

  return (
    <div className="goal-card">
      <h3>{goal.name}</h3>
      
      {/* 进度 */}
      <div className="progress">
        <div className={`progress-bar ${progressColor}`} 
             style={{ width: `${goal.overallProgress}%` }} />
        <span>{goal.overallProgress}% 完成</span>
      </div>

      {/* 健康度 */}
      <span className={`badge ${healthBadge.color}`}>
        健康度: {goal.healthScore} - {healthBadge.text}
      </span>

      {/* 时间信息 */}
      <div className="time-info">
        {goal.isOverdue ? (
          <span className="overdue">已逾期</span>
        ) : (
          <span>剩余 {goal.daysRemaining} 天</span>
        )}
      </div>

      {/* 今日进度 */}
      {goal.hasTodayProgress && (
        <div className="today-progress">
          <span>今日 +{goal.todayProgress}%</span>
          <span className="level">{goal.todayProgressLevel}</span>
        </div>
      )}

      {/* 关键结果 */}
      <div className="key-results">
        <h4>关键结果 ({goal.completedKeyResults}/{goal.totalKeyResults})</h4>
        {goal.keyResults.map(kr => (
          <div key={kr.uuid} className="kr-item">
            <span>{kr.name}</span>
            <div className="kr-progress">
              <div className="bar" style={{ width: `${kr.progress}%` }} />
            </div>
            <span>{kr.progress}%</span>
            {kr.isCompleted && <span>✅</span>}
            {!kr.isCompleted && <span>剩余: {kr.remaining} {kr.unit}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🔍 常见模式

### 1. 筛选目标

```typescript
// 筛选进行中的目标
const activeGoals = goals.filter(g => g.lifecycle.status === 'active');

// 筛选过期的目标
const overdueGoals = goals.filter(g => g.isOverdue);

// 筛选健康度低的目标
const unhealthyGoals = goals.filter(g => g.healthScore < 60);

// 筛选今日有进展的目标
const todayActiveGoals = goals.filter(g => g.hasTodayProgress);

// 筛选即将截止的目标
const urgentGoals = goals.filter(g => 
  !g.isOverdue && g.daysRemaining <= 3
);
```

### 2. 排序目标

```typescript
// 按进度排序（降序）
goals.sort((a, b) => b.overallProgress - a.overallProgress);

// 按健康度排序（升序，优先关注不健康的）
goals.sort((a, b) => a.healthScore - b.healthScore);

// 按截止日期排序（升序）
goals.sort((a, b) => a.daysRemaining - b.daysRemaining);

// 按今日进度排序（降序）
goals.sort((a, b) => b.todayProgress - a.todayProgress);

// 综合排序：优先级 = 健康度 * 进度 * 紧迫性
goals.sort((a, b) => {
  const priorityA = a.healthScore * a.overallProgress * (100 - a.daysRemaining);
  const priorityB = b.healthScore * b.overallProgress * (100 - b.daysRemaining);
  return priorityB - priorityA;
});
```

### 3. 统计分析

```typescript
// 总体统计
const stats = {
  total: goals.length,
  active: goals.filter(g => g.lifecycle.status === 'active').length,
  completed: goals.filter(g => g.overallProgress >= 100).length,
  overdue: goals.filter(g => g.isOverdue).length,
  avgProgress: goals.reduce((sum, g) => sum + g.overallProgress, 0) / goals.length,
  avgHealthScore: goals.reduce((sum, g) => sum + g.healthScore, 0) / goals.length,
};

// 今日活跃度
const todayStats = {
  activeGoals: goals.filter(g => g.hasTodayProgress).length,
  totalRecords: goals.reduce((sum, g) => sum + g.todayRecordsStats.totalRecords, 0),
  avgTodayProgress: goals
    .filter(g => g.hasTodayProgress)
    .reduce((sum, g) => sum + g.todayProgress, 0) / 
    goals.filter(g => g.hasTodayProgress).length,
};

// 关键结果完成情况
const krStats = {
  total: goals.reduce((sum, g) => sum + g.totalKeyResults, 0),
  completed: goals.reduce((sum, g) => sum + g.completedKeyResults, 0),
  completionRate: (
    goals.reduce((sum, g) => sum + g.completedKeyResults, 0) /
    goals.reduce((sum, g) => sum + g.totalKeyResults, 0)
  ) * 100,
};
```

---

## ⚡ 性能提示

### 1. 避免频繁转换

```typescript
// ❌ 不好：每次渲染都转换
function render() {
  const clientDTO = goal.toClientDTO();
  return <GoalCard data={clientDTO} />;
}

// ✅ 好：只在需要时转换
const clientDTO = useMemo(() => goal.toClientDTO(), [goal]);
return <GoalCard data={clientDTO} />;
```

### 2. 批量处理

```typescript
// ❌ 不好：逐个转换
const clientDTOs = goals.map(g => Goal.fromClientDTO(g.toClientDTO()));

// ✅ 好：保持实体形式，只在需要时转换
const goalEntities = goals.map(g => Goal.fromClientDTO(g));
// 使用实体进行业务逻辑处理
// ...
// 最后才转换为 DTO
const finalDTOs = goalEntities.map(g => g.toClientDTO());
```

### 3. 条件计算

```typescript
// 只在需要时计算昂贵的属性
if (showHealthScore) {
  const healthScore = goal.healthScore; // 才会触发计算
  console.log('健康度:', healthScore);
}
```

---

## 🐛 调试技巧

```typescript
// 查看目标完整状态
console.log('目标详情:', {
  name: goal.name,
  uuid: goal.uuid,
  progress: goal.overallProgress,
  weighted: goal.weightedProgress,
  calculated: goal.calculatedProgress,
  health: goal.healthScore,
  status: goal.lifecycle.status,
  progressStatus: goal.progressStatus,
  timeProgress: goal.timeProgress,
  daysRemaining: goal.daysRemaining,
  isOverdue: goal.isOverdue,
  today: {
    hasProgress: goal.hasTodayProgress,
    progress: goal.todayProgress,
    level: goal.todayProgressLevel,
    stats: goal.todayRecordsStats,
  },
  keyResults: {
    total: goal.totalKeyResults,
    completed: goal.completedKeyResults,
    rate: goal.keyResultCompletionRate,
  },
});

// 验证计算属性
console.assert(
  goal.keyResultCompletionRate === 
  Math.round((goal.completedKeyResults / goal.totalKeyResults) * 100),
  '关键结果完成率计算错误'
);

console.assert(
  goal.calculatedProgress === goal.overallProgress,
  '计算进度不一致'
);
```

---

**最后更新**: 2024-01-XX  
**版本**: v2.0.0
