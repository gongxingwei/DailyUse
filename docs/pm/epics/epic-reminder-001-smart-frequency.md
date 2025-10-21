# EPIC-REMINDER-001: 智能提醒频率

> **Epic ID**: EPIC-REMINDER-001  
> **功能编号**: REMINDER-001  
> **RICE 评分**: 392 (Reach: 7, Impact: 7, Confidence: 8, Effort: 1)  
> **优先级**: P0  
> **预估工期**: 1-1.5 周 (15 SP)  
> **Sprint**: Sprint 5-6  
> **状态**: Draft  
> **创建日期**: 2025-10-21

---

## 1. Epic 概述

### 业务价值

根据用户响应行为自适应调整提醒频率，避免过度打扰，提升提醒有效性。

**核心问题**:
- ❌ 提醒频率固定，不考虑用户行为
- ❌ 重复提醒过多导致用户疲劳
- ❌ 重要提醒被忽略

**解决方案**:
- ✅ 基于用户响应率自动调整频率
- ✅ 提醒渠道智能选择（推送/邮件/应用内）
- ✅ 免打扰时段自动延后
- ✅ 提醒效果统计分析

---

## 2. User Stories (精简版)

### Story 001: Contracts & Domain - 智能频率模型 (3 SP)

```typescript
export interface ReminderServerDTO {
  // ...existing fields...
  readonly frequency: ReminderFrequency;
  readonly adaptiveConfig?: AdaptiveConfig;
  readonly effectivenessScore: number;  // 0-100
}

export interface AdaptiveConfig {
  readonly isEnabled: boolean;
  readonly minInterval: number;          // 最小间隔（ms）
  readonly maxInterval: number;          // 最大间隔（ms）
  readonly responseRate: number;         // 响应率 0-1
  readonly adjustmentFactor: number;     // 调整系数
}
```

**Domain 逻辑**:
```typescript
export class Reminder {
  calculateNextTriggerTime(): number {
    if (!this.adaptiveConfig?.isEnabled) {
      return this.baseInterval;
    }
    
    // 响应率越低，间隔越长
    const adjustedInterval = this.baseInterval * 
      (1 + (1 - this.adaptiveConfig.responseRate));
    
    return Math.min(
      Math.max(adjustedInterval, this.adaptiveConfig.minInterval),
      this.adaptiveConfig.maxInterval
    );
  }
}
```

---

### Story 002: Application Service - 频率调整服务 (3 SP)

```typescript
export class ReminderAdaptiveService {
  async recordResponse(reminderId: string, responded: boolean): Promise<void> {
    const reminder = await this.repo.findByUuid(reminderId);
    
    // 更新响应率（滑动窗口）
    const recentResponses = await this.getRecentResponses(reminderId, 10);
    const responseRate = recentResponses.filter(r => r).length / recentResponses.length;
    
    reminder.updateAdaptiveConfig({ responseRate });
    
    // 调整下次触发时间
    const nextTime = reminder.calculateNextTriggerTime();
    reminder.scheduleNext(nextTime);
    
    await this.repo.save(reminder);
  }
}
```

---

### Story 003: Infrastructure - 响应记录表 (2 SP)

```prisma
model ReminderResponse {
  uuid          String   @id @default(uuid())
  reminderId    String   @map("reminder_id")
  userId        String   @map("user_id")
  responded     Boolean  // 是否响应
  respondedAt   BigInt?  @map("responded_at")
  triggeredAt   BigInt   @map("triggered_at")
  
  reminder      Reminder @relation(fields: [reminderId], references: [uuid])
  
  @@index([reminderId, triggeredAt])
  @@map("reminder_responses")
}
```

---

### Story 004: API Endpoints (2 SP)

```typescript
// 启用自适应频率
PATCH /api/v1/reminders/:id/adaptive
Body: { enabled: boolean, minInterval: number, maxInterval: number }

// 记录响应
POST /api/v1/reminders/:id/respond
Body: { responded: boolean }

// 获取效果统计
GET /api/v1/reminders/:id/effectiveness
Response: { responseRate: number, avgInterval: number, trend: 'increasing' | 'decreasing' }
```

---

### Story 005: Client Services (2 SP)

```typescript
export function useAdaptiveReminder() {
  return useMutation({
    mutationFn: (params: { reminderId: string; enabled: boolean }) =>
      service.updateAdaptive(params),
  });
}
```

---

### Story 006: UI Component - 频率配置面板 (2 SP)

```vue
<template>
  <el-card title="智能频率调整">
    <el-switch v-model="adaptive.enabled" />
    
    <div v-if="adaptive.enabled">
      <el-slider
        v-model="adaptive.minInterval"
        :min="300000"
        :max="86400000"
        :format-tooltip="formatInterval"
      />
      
      <div class="stats">
        <span>当前响应率: {{ stats.responseRate }}%</span>
        <span>平均间隔: {{ stats.avgInterval }}</span>
      </div>
    </div>
  </el-card>
</template>
```

---

### Story 007: E2E Tests (1 SP)

```typescript
test('自适应频率调整', async ({ page }) => {
  await page.goto('/reminders/reminder-uuid');
  await page.click('[data-testid="enable-adaptive"]');
  
  // 验证频率调整
  await page.click('[data-testid="mark-responded"]');
  await expect(page.locator('[data-testid="response-rate"]')).toContainText('100%');
});
```

---

## 3. Definition of Done

- [ ] 所有 7 个 Stories 完成
- [ ] Unit Tests 覆盖率 ≥ 80%
- [ ] 频率调整算法测试通过
- [ ] E2E Tests 通过

---

## 4. Release Plan

**Sprint 5-6 (Week 9-12)**:
- Week 1: Stories 001-003
- Week 2: Stories 004-007

---

## 5. 验收标准

```gherkin
Feature: 智能提醒频率

  Scenario: 自适应调整
    Given 提醒启用自适应频率
    And 最近 10 次响应率为 30%
    When 系统计算下次触发时间
    Then 间隔应增加（因为响应率低）
    And 间隔应在 minInterval 和 maxInterval 之间
```

---

*文档创建: 2025-10-21 | Epic Owner: PM Agent*
