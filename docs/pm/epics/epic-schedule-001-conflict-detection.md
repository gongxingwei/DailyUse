# EPIC-SCHEDULE-001: 日程冲突检测

> **Epic ID**: EPIC-SCHEDULE-001  
> **功能编号**: SCHEDULE-001  
> **RICE 评分**: 288 (Reach: 6, Impact: 8, Confidence: 6, Effort: 1)  
> **优先级**: P0  
> **预估工期**: 1.5-2 周 (18 SP)  
> **Sprint**: Sprint 5  
> **状态**: Draft  
> **创建日期**: 2025-10-21

---

## 1. Epic 概述

### 业务价值

自动检测日程时间重叠冲突，提供解决建议，避免日程安排错误。

**核心问题**:
- ❌ 无法检测时间段重叠
- ❌ 同一时间安排多个日程导致冲突
- ❌ 缺少冲突提醒和解决方案

**解决方案**:
- ✅ 实时检测时间段重叠
- ✅ 创建日程时显示冲突警告
- ✅ 提供自动调整建议
- ✅ 日历视图高亮冲突

---

## 2. User Stories (精简版)

### Story 001: Contracts & Domain - 冲突检测模型 (3 SP)

```typescript
export interface ScheduleServerDTO {
  // ...existing fields...
  readonly startTime: number;
  readonly endTime: number;
  readonly hasConflict: boolean;
  readonly conflictingSchedules?: string[];  // 冲突日程UUID
}

export interface ConflictDetectionResult {
  readonly hasConflict: boolean;
  readonly conflicts: Array<{
    scheduleUuid: string;
    scheduleTitle: string;
    overlapStart: number;
    overlapEnd: number;
    overlapDuration: number;
  }>;
  readonly suggestions: Array<{
    type: 'move_earlier' | 'move_later' | 'shorten';
    newStartTime: number;
    newEndTime: number;
  }>;
}
```

**Domain 逻辑**:
```typescript
export class Schedule {
  detectConflicts(otherSchedules: Schedule[]): ConflictDetectionResult {
    const conflicts = otherSchedules.filter(other => 
      this.isOverlapping(other)
    );
    
    const suggestions = this.generateSuggestions(conflicts);
    
    return {
      hasConflict: conflicts.length > 0,
      conflicts: conflicts.map(c => ({
        scheduleUuid: c.uuid,
        scheduleTitle: c.title,
        overlapStart: Math.max(this.startTime, c.startTime),
        overlapEnd: Math.min(this.endTime, c.endTime),
        overlapDuration: this.calculateOverlap(c)
      })),
      suggestions
    };
  }
  
  private isOverlapping(other: Schedule): boolean {
    return (
      (this.startTime < other.endTime && this.endTime > other.startTime) ||
      (other.startTime < this.endTime && other.endTime > this.startTime)
    );
  }
}
```

---

### Story 002: Application Service - 冲突检测服务 (4 SP)

```typescript
export class ScheduleConflictService {
  async detectConflicts(
    userId: string,
    startTime: number,
    endTime: number,
    excludeUuid?: string
  ): Promise<ConflictDetectionResult> {
    // 查询时间范围内的所有日程
    const schedules = await this.repo.findByTimeRange(
      userId,
      startTime,
      endTime
    );
    
    // 排除当前日程（编辑时）
    const others = schedules.filter(s => s.uuid !== excludeUuid);
    
    // 检测冲突
    const testSchedule = new Schedule({ startTime, endTime });
    return testSchedule.detectConflicts(others);
  }
  
  async resolveConflict(
    scheduleUuid: string,
    resolution: 'move_earlier' | 'move_later' | 'shorten',
    targetTime: { start: number; end: number }
  ): Promise<void> {
    const schedule = await this.repo.findByUuid(scheduleUuid);
    schedule.updateTime(targetTime.start, targetTime.end);
    await this.repo.save(schedule);
  }
}
```

---

### Story 003: Infrastructure - 时间索引优化 (2 SP)

```prisma
model Schedule {
  // ...existing fields...
  
  startTime         BigInt   @map("start_time")
  endTime           BigInt   @map("end_time")
  hasConflict       Boolean  @default(false) @map("has_conflict")
  conflictingIds    Json?    @map("conflicting_ids")
  
  @@index([userId, startTime, endTime])
  @@index([startTime, endTime])
}
```

---

### Story 004: API Endpoints (3 SP)

```typescript
// 检测冲突
POST /api/v1/schedules/detect-conflicts
Body: { userId: string, startTime: number, endTime: number }
Response: ConflictDetectionResult

// 创建日程（带冲突检查）
POST /api/v1/schedules
Body: { ...scheduleData }
Response: { schedule: ScheduleClientDTO, conflicts?: ConflictDetectionResult }

// 解决冲突
POST /api/v1/schedules/:id/resolve-conflict
Body: { resolution: string, newStartTime: number, newEndTime: number }
```

---

### Story 005: Client Services (2 SP)

```typescript
export function useConflictDetection() {
  return useMutation({
    mutationFn: (params: { startTime: number; endTime: number }) =>
      service.detectConflicts(params),
  });
}
```

---

### Story 006: UI Component - 冲突警告面板 (3 SP)

```vue
<template>
  <div class="schedule-form">
    <el-form :model="form">
      <el-form-item label="开始时间">
        <el-date-picker v-model="form.startTime" @change="checkConflicts" />
      </el-form-item>
      
      <el-form-item label="结束时间">
        <el-date-picker v-model="form.endTime" @change="checkConflicts" />
      </el-form-item>
    </el-form>

    <!-- 冲突警告 -->
    <el-alert
      v-if="conflicts?.hasConflict"
      type="error"
      title="检测到时间冲突"
      :closable="false"
    >
      <div v-for="conflict in conflicts.conflicts" :key="conflict.scheduleUuid">
        与"{{ conflict.scheduleTitle }}"冲突
        <span class="overlap-time">
          重叠 {{ formatDuration(conflict.overlapDuration) }}
        </span>
      </div>

      <div class="suggestions">
        <h4>建议调整：</h4>
        <el-button
          v-for="(suggestion, index) in conflicts.suggestions"
          :key="index"
          size="small"
          @click="applySuggestion(suggestion)"
        >
          {{ getSuggestionLabel(suggestion) }}
        </el-button>
      </div>
    </el-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useConflictDetection } from '@domain-client/schedule';

const form = ref({ startTime: null, endTime: null });
const detectConflicts = useConflictDetection();

const conflicts = ref(null);

async function checkConflicts() {
  if (form.value.startTime && form.value.endTime) {
    conflicts.value = await detectConflicts.mutateAsync({
      startTime: form.value.startTime.getTime(),
      endTime: form.value.endTime.getTime()
    });
  }
}

function applySuggestion(suggestion: any) {
  form.value.startTime = new Date(suggestion.newStartTime);
  form.value.endTime = new Date(suggestion.newEndTime);
  checkConflicts();
}
</script>
```

---

### Story 007: E2E Tests (1 SP)

```typescript
test('检测并解决日程冲突', async ({ page }) => {
  await page.goto('/schedule/create');
  
  // 设置时间（与已有日程冲突）
  await page.fill('[data-testid="start-time"]', '2025-10-21 14:00');
  await page.fill('[data-testid="end-time"]', '2025-10-21 15:00');
  
  // 验证冲突警告
  await expect(page.locator('[data-testid="conflict-alert"]')).toBeVisible();
  await expect(page.locator('[data-testid="conflict-count"]')).toContainText('1');
  
  // 应用建议
  await page.click('[data-testid="suggestion-move-later"]');
  
  // 验证冲突解除
  await expect(page.locator('[data-testid="conflict-alert"]')).not.toBeVisible();
});
```

---

## 3. Definition of Done

- [ ] 所有 7 个 Stories 完成
- [ ] 冲突检测准确率 100%
- [ ] 检测响应时间 < 100ms
- [ ] E2E Tests 通过

---

## 4. Release Plan

**Sprint 5 (Week 9-10)**:
- Week 1: Stories 001-004
- Week 2: Stories 005-007

---

## 5. 验收标准

```gherkin
Feature: 日程冲突检测

  Scenario: 检测时间冲突
    Given 已有日程"会议 A" 时间为 14:00-15:00
    When 用户创建日程"会议 B" 时间为 14:30-15:30
    Then 应检测到冲突
    And 显示重叠时长 30 分钟
    And 提供调整建议
```

---

*文档创建: 2025-10-21 | Epic Owner: PM Agent*
