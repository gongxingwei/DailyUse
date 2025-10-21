# Sprint 5 详细执行计划

> **Sprint ID**: Sprint 5  
> **Sprint 周期**: Week 11-12 (2025-12-29 ~ 2026-01-09)  
> **Sprint 目标**: 实现日程冲突检测 + 智能提醒频率  
> **Story Points**: 33 SP  
> **Epics**: SCHEDULE-001 (18 SP) + REMINDER-001 (15 SP)  
> **状态**: Planning  
> **依赖**: 无（独立模块）

---

## 📋 Sprint 概览

### Sprint 目标 (Sprint Goal)

> **实现智能日程管理和自适应提醒系统，提升时间管理效率和用户体验。**

**核心价值**:
- ✅ 自动检测日程时间冲突（isOverlapping 算法）
- ✅ 提供智能冲突解决建议（前移/后移/缩短）
- ✅ 基于响应率自适应调整提醒频率
- ✅ 滑动窗口追踪用户行为，动态优化

### Epic 背景

**SCHEDULE-001 - 日程冲突检测**:
- **核心算法**: 时间重叠检测 `isOverlapping = (start1 < end2) && (end1 > start2)`
- **用户场景**: 添加新日程时自动检测冲突，提供解决方案

**REMINDER-001 - 智能提醒频率**:
- **核心算法**: 响应率追踪 + 自适应间隔调整
- **用户场景**: 系统根据用户响应率自动调整提醒频率

---

## 📅 每日执行计划 (Day-by-Day Plan)

### **Week 11: 日程冲突检测 (SCHEDULE-001, 18 SP)**

#### **Day 1-2 (2025-12-29 ~ 2025-12-30): 后端开发**

**目标**: 完成 Contracts + Domain + Application (8 SP)

**任务清单**:
- [ ] **Day 1 上午**: Contracts 层
  ```typescript
  export interface ScheduleConflictDTO {
    conflictId: string;
    schedule1: ScheduleServerDTO;
    schedule2: ScheduleServerDTO;
    overlapStart: number;
    overlapEnd: number;
    overlapDuration: number;  // 分钟
    suggestions: Array<{
      type: 'move_forward' | 'move_backward' | 'shorten';
      description: string;
      newStartTime?: number;
      newEndTime?: number;
    }>;
  }
  ```

- [ ] **Day 1 下午 + Day 2 上午**: Domain 层
  ```typescript
  export class Schedule extends AggregateRoot {
    constructor(
      uuid: string,
      public readonly title: string,
      public readonly startTime: number,
      public readonly endTime: number,
      public readonly duration: number  // 分钟
    ) {
      super();
      this.validate();
    }
    
    private validate(): void {
      if (this.startTime >= this.endTime) {
        throw new InvalidScheduleTimeError('开始时间必须早于结束时间');
      }
      
      const calculatedDuration = (this.endTime - this.startTime) / (60 * 1000);
      if (Math.abs(calculatedDuration - this.duration) > 1) {
        throw new DurationMismatchError('时长与时间范围不匹配');
      }
    }
    
    /**
     * 检测与另一个日程是否冲突
     */
    isOverlapping(other: Schedule): boolean {
      return (this.startTime < other.endTime) && (this.endTime > other.startTime);
    }
    
    /**
     * 计算重叠时长（分钟）
     */
    getOverlapDuration(other: Schedule): number {
      if (!this.isOverlapping(other)) return 0;
      
      const overlapStart = Math.max(this.startTime, other.startTime);
      const overlapEnd = Math.min(this.endTime, other.endTime);
      
      return (overlapEnd - overlapStart) / (60 * 1000);
    }
  }
  ```

- [ ] **Day 2 下午**: Application Service
  ```typescript
  export class ScheduleConflictDetectionService {
    constructor(private scheduleRepository: ScheduleRepository) {}
    
    /**
     * 检测新日程是否与现有日程冲突
     */
    async detectConflicts(
      newSchedule: Schedule,
      userId: string
    ): Promise<ScheduleConflictDTO[]> {
      const existingSchedules = await this.scheduleRepository.findByUserAndTimeRange(
        userId,
        newSchedule.startTime,
        newSchedule.endTime
      );
      
      const conflicts: ScheduleConflictDTO[] = [];
      
      for (const existing of existingSchedules) {
        if (newSchedule.isOverlapping(existing)) {
          const overlapStart = Math.max(newSchedule.startTime, existing.startTime);
          const overlapEnd = Math.min(newSchedule.endTime, existing.endTime);
          const overlapDuration = (overlapEnd - overlapStart) / (60 * 1000);
          
          conflicts.push({
            conflictId: uuidv4(),
            schedule1: this.toDTO(newSchedule),
            schedule2: this.toDTO(existing),
            overlapStart,
            overlapEnd,
            overlapDuration,
            suggestions: this.generateSuggestions(newSchedule, existing)
          });
        }
      }
      
      return conflicts;
    }
    
    /**
     * 生成冲突解决建议
     */
    private generateSuggestions(
      newSchedule: Schedule,
      existing: Schedule
    ): Array<{ type: string; description: string; newStartTime?: number; newEndTime?: number }> {
      const suggestions = [];
      
      // 建议 1: 前移新日程
      if (existing.startTime > newSchedule.startTime) {
        const moveBackTime = existing.startTime - newSchedule.duration * 60 * 1000;
        suggestions.push({
          type: 'move_forward',
          description: `将新日程前移至 ${new Date(moveBackTime).toLocaleString()}`,
          newStartTime: moveBackTime,
          newEndTime: existing.startTime
        });
      }
      
      // 建议 2: 后移新日程
      if (existing.endTime < newSchedule.endTime) {
        suggestions.push({
          type: 'move_backward',
          description: `将新日程后移至 ${new Date(existing.endTime).toLocaleString()}`,
          newStartTime: existing.endTime,
          newEndTime: existing.endTime + newSchedule.duration * 60 * 1000
        });
      }
      
      // 建议 3: 缩短新日程
      const availableDuration = (existing.startTime - newSchedule.startTime) / (60 * 1000);
      if (availableDuration > 15) {
        suggestions.push({
          type: 'shorten',
          description: `将新日程缩短至 ${availableDuration} 分钟`,
          newStartTime: newSchedule.startTime,
          newEndTime: existing.startTime
        });
      }
      
      return suggestions;
    }
  }
  ```

**交付物**: ✅ 后端冲突检测逻辑完成

---

#### **Day 3 (2026-01-01 周四): Infrastructure + API**

**目标**: 完成 Infrastructure + API (5 SP)

**任务清单**:
- [ ] **上午**: Prisma Schema
  ```prisma
  model Schedule {
    id          String   @id @default(uuid())
    uuid        String   @unique @default(uuid())
    
    userUuid    String
    title       String
    description String?
    
    startTime   BigInt
    endTime     BigInt
    duration    Int      // 分钟
    
    isAllDay    Boolean  @default(false)
    location    String?
    
    createdAt   BigInt
    updatedAt   BigInt
    
    @@index([userUuid, startTime, endTime])
    @@map("schedules")
  }
  ```

- [ ] **下午**: API Endpoints
  ```typescript
  @Controller('/api/schedules')
  export class ScheduleController {
    constructor(private conflictService: ScheduleConflictDetectionService) {}
    
    @Post('/detect-conflicts')
    @UseGuards(AuthGuard)
    async detectConflicts(
      @Body() body: { startTime: number; endTime: number; duration: number; title: string },
      @CurrentUser() user: User
    ): Promise<ScheduleConflictDTO[]> {
      const newSchedule = new Schedule(
        uuidv4(),
        body.title,
        body.startTime,
        body.endTime,
        body.duration
      );
      
      return await this.conflictService.detectConflicts(newSchedule, user.uuid);
    }
    
    @Post('/resolve-conflict')
    @UseGuards(AuthGuard)
    async resolveConflict(
      @Body() body: { conflictId: string; solution: 'move_forward' | 'move_backward' | 'shorten'; newStartTime: number; newEndTime: number }
    ): Promise<void> {
      // 应用解决方案
    }
  }
  ```

**交付物**: ✅ Infrastructure + API 完成

---

#### **Day 4-5 (2026-01-02 ~ 2026-01-03): 前端开发**

**目标**: 完成 Client + UI (5 SP)

**任务清单**:
- [ ] **Day 4**: Client Service + React Query Hooks
- [ ] **Day 5**: 冲突可视化 UI
  ```vue
  <template>
    <el-dialog v-model="visible" title="检测到日程冲突">
      <div class="conflicts">
        <div v-for="conflict in conflicts" :key="conflict.conflictId" class="conflict-item">
          <el-alert type="warning" :closable="false">
            <template #title>
              <span>{{ conflict.schedule1.title }}</span>
              <el-icon><Warning /></el-icon>
              <span>{{ conflict.schedule2.title }}</span>
            </template>
          </el-alert>
          
          <div class="overlap-info">
            重叠时长: {{ conflict.overlapDuration }} 分钟
          </div>
          
          <div class="suggestions">
            <h4>解决建议:</h4>
            <el-radio-group v-model="selectedSolution[conflict.conflictId]">
              <el-radio
                v-for="suggestion in conflict.suggestions"
                :key="suggestion.type"
                :label="suggestion.type"
              >
                {{ suggestion.description }}
              </el-radio>
            </el-radio-group>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="applySolutions">应用解决方案</el-button>
      </template>
    </el-dialog>
  </template>
  ```

**交付物**: ✅ 冲突检测 UI 完成

---

### **Week 12: 智能提醒频率 (REMINDER-001, 15 SP)**

#### **Day 6-7 (2026-01-05 ~ 2026-01-06): 后端开发**

**目标**: 完成 Contracts + Domain + Application (8 SP)

**任务清单**:
- [ ] **Day 6**: Contracts + Domain
  ```typescript
  export interface ReminderFrequencyDTO {
    uuid: string;
    targetUuid: string;         // 提醒对象（任务/目标/日程）
    targetType: string;
    currentInterval: number;    // 当前间隔（分钟）
    responseRate: number;       // 响应率 (0-1)
    totalSent: number;          // 已发送次数
    totalResponded: number;     // 已响应次数
    recentResponses: boolean[]; // 最近 10 次响应记录
  }
  
  export class ReminderFrequency extends Entity {
    constructor(
      uuid: string,
      public readonly targetUuid: string,
      public readonly targetType: string,
      private _currentInterval: number,  // 分钟
      private _responseRate: number,     // 0-1
      private _totalSent: number,
      private _totalResponded: number,
      private _recentResponses: boolean[]
    ) {
      super();
    }
    
    /**
     * 记录用户响应
     */
    recordResponse(responded: boolean): void {
      this._totalSent++;
      if (responded) this._totalResponded++;
      
      // 滑动窗口：保留最近 10 次
      this._recentResponses.push(responded);
      if (this._recentResponses.length > 10) {
        this._recentResponses.shift();
      }
      
      // 重新计算响应率
      this._responseRate = this._totalResponded / this._totalSent;
      
      // 自适应调整间隔
      this.adjustInterval();
    }
    
    /**
     * 自适应调整提醒间隔
     */
    private adjustInterval(): void {
      const recentRate = this._recentResponses.filter(r => r).length / this._recentResponses.length;
      
      if (recentRate >= 0.8) {
        // 高响应率：保持或轻微增加间隔
        this._currentInterval = Math.min(this._currentInterval * 1.1, 1440); // 最多 24 小时
      } else if (recentRate >= 0.5) {
        // 中等响应率：保持间隔
        // 不调整
      } else if (recentRate >= 0.3) {
        // 低响应率：减少间隔
        this._currentInterval = Math.max(this._currentInterval * 0.9, 5); // 最少 5 分钟
      } else {
        // 极低响应率：大幅减少间隔
        this._currentInterval = Math.max(this._currentInterval * 0.7, 5);
      }
      
      this._currentInterval = Math.round(this._currentInterval);
    }
    
    /**
     * 获取下次提醒时间
     */
    getNextReminderTime(): number {
      return Date.now() + this._currentInterval * 60 * 1000;
    }
  }
  ```

- [ ] **Day 7**: Application Service
  ```typescript
  export class SmartReminderService {
    constructor(
      private reminderRepository: ReminderFrequencyRepository,
      private notificationService: NotificationService
    ) {}
    
    /**
     * 发送提醒并记录
     */
    async sendReminder(targetUuid: string, targetType: string): Promise<void> {
      const frequency = await this.reminderRepository.findByTarget(targetUuid, targetType);
      
      // 发送提醒
      await this.notificationService.send({
        targetUuid,
        targetType,
        message: '提醒内容'
      });
      
      // 记录发送（响应由用户行为触发）
      // 这里只记录发送，不调整间隔
    }
    
    /**
     * 记录用户响应
     */
    async recordUserResponse(
      targetUuid: string,
      targetType: string,
      responded: boolean
    ): Promise<void> {
      let frequency = await this.reminderRepository.findByTarget(targetUuid, targetType);
      
      if (!frequency) {
        frequency = new ReminderFrequency(
          uuidv4(),
          targetUuid,
          targetType,
          60,  // 默认 60 分钟
          0,
          0,
          0,
          []
        );
      }
      
      frequency.recordResponse(responded);
      
      await this.reminderRepository.save(frequency);
    }
  }
  ```

**交付物**: ✅ 智能提醒后端逻辑完成

---

#### **Day 8 (2026-01-07 周三): Infrastructure + API**

**目标**: 完成 Infrastructure + API (4 SP)

**任务清单**:
- [ ] Prisma Schema + API Endpoints
- [ ] 测试自适应逻辑

**交付物**: ✅ Infrastructure + API 完成

---

#### **Day 9 (2026-01-08 周四): 前端开发**

**目标**: 完成 Client + UI (3 SP)

**任务清单**:
- [ ] Client Service
- [ ] 提醒频率设置 UI
- [ ] 响应率统计图表

**交付物**: ✅ 前端完成

---

#### **Day 10 (2026-01-09 周五): E2E Tests + Sprint Review**

**目标**: E2E 测试 + Sprint Review

---

## 📊 Sprint 统计

- **SCHEDULE-001**: 18 SP (7 Stories)
- **REMINDER-001**: 15 SP (7 Stories)
- **总计**: 33 SP, 预估 10 工作日

---

## ✅ Definition of Done

同 Sprint 3，详见 [sprint-03-plan.md](./sprint-03-plan.md)

---

## 🚨 风险管理

| 风险 | 概率 | 影响 | 缓解策略 |
|------|------|------|---------|
| 冲突检测算法漏洞 | 中 | 高 | 充分的边界测试（跨天、跨月等）|
| 提醒频率调整不合理 | 中 | 中 | A/B 测试，收集用户反馈 |
| 滑动窗口数据不足 | 低 | 低 | 设置最小样本量阈值 |

---

## 📚 参考文档

- [Epic: SCHEDULE-001](../epics/epic-schedule-001-conflict-detection.md)
- [Epic: REMINDER-001](../epics/epic-reminder-001-smart-frequency.md)
- [PM 阶段总结](../PM_PHASE_SUMMARY.md)

---

**Sprint 计划创建于**: 2025-10-21  
**前置条件**: Sprint 4 完成  
**下一步**: Sprint 6 (多渠道通知聚合 + 系统收尾)

---

*祝 Sprint 5 顺利！🚀*
