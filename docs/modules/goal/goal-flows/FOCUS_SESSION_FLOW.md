# 专注周期流程设计文档

## 文档信息

- **版本**: 1.0
- **创建日期**: 2025-10-18
- **架构模式**: DDD (Goal 模块)
- **相关模块**: Goal, Statistics
- **业务场景**: 管理与目标关联的专注周期（番茄钟模式）

---

## 1. 业务概述

### 1.1 业务目标

FocusSession（专注周期）允许用户在完成目标时进行时间追踪，采用番茄钟技术：

- **开始专注**: 创建并启动一个专注周期（关联目标）
- **暂停/恢复**: 支持中途暂停和恢复
- **完成专注**: 结束专注并记录实际时长
- **取消专注**: 取消未完成的专注周期
- **统计分析**: 计算总专注时长、次数、平均时长等

### 1.2 核心原则

- **时间追踪**: 精确记录开始、暂停、恢复、结束时间
- **目标关联**: 每个专注周期可关联一个目标（可选）
- **状态管理**: 严格的状态机（IN_PROGRESS → PAUSED → COMPLETED/CANCELLED）
- **统计累积**: 自动更新目标的总专注时长

### 1.3 专注周期状态机

```plaintext
        ┌────────────┐
        │   DRAFT    │ (创建但未开始)
        └─────┬──────┘
              │ start()
              ▼
        ┌────────────┐      pause()      ┌────────────┐
    ┌──▶│IN_PROGRESS ├─────────────────▶│   PAUSED   │
    │   └─────┬──────┘                   └─────┬──────┘
    │         │                                 │
    │         │ complete()          resume()    │
    │         │                                 │
    │         ▼                                 │
    │   ┌────────────┐                         │
    │   │ COMPLETED  │◀────────────────────────┘
    │   └────────────┘
    │
    └───── 任意状态 ──cancel()──▶ CANCELLED
```

---

## 2. 创建并开始专注周期

### 2.1 API

```http
POST /api/focus-sessions
```

### 2.2 请求体

```typescript
interface CreateFocusSessionRequest {
  accountUuid: string;
  goalUuid?: string | null; // 关联的目标（可选）
  durationMinutes: number; // 计划时长（分钟）
  description?: string | null; // 描述（如"完成报告"）
  startImmediately?: boolean; // 是否立即开始（默认 true）
}
```

### 2.3 响应

```typescript
interface CreateFocusSessionResponse {
  session: FocusSessionClientDTO;
  message: string;
}

interface FocusSessionClientDTO {
  uuid: string;
  accountUuid: string;
  goalUuid: string | null;
  status: FocusSessionStatus; // DRAFT | IN_PROGRESS | PAUSED | COMPLETED | CANCELLED
  durationMinutes: number; // 计划时长
  actualDurationMinutes: number; // 实际时长
  description: string | null;

  // 时间记录
  startedAt: number | null; // timestamp
  pausedAt: number | null;
  resumedAt: number | null;
  completedAt: number | null;
  cancelledAt: number | null;

  // 统计
  pauseCount: number; // 暂停次数
  pausedDurationMinutes: number; // 累计暂停时长

  createdAt: number;
  updatedAt: number;
}
```

### 2.4 领域逻辑

```typescript
// FocusSession.ts
export class FocusSession extends AggregateRoot {
  private _accountUuid: string;
  private _goalUuid: string | null;
  private _status: FocusSessionStatus;
  private _durationMinutes: number;
  private _actualDurationMinutes: number;
  private _description: string | null;

  private _startedAt: Date | null;
  private _pausedAt: Date | null;
  private _resumedAt: Date | null;
  private _completedAt: Date | null;
  private _cancelledAt: Date | null;

  private _pauseCount: number;
  private _pausedDurationMinutes: number;

  private _createdAt: Date;
  private _updatedAt: Date;

  public static create(params: {
    accountUuid: string;
    goalUuid?: string | null;
    durationMinutes: number;
    description?: string | null;
  }): FocusSession {
    // 验证
    if (params.durationMinutes <= 0) {
      throw new Error('专注时长必须大于 0');
    }
    if (params.durationMinutes > 240) {
      throw new Error('专注时长不能超过 4 小时');
    }

    const session = new FocusSession();
    session._uuid = session.generateUUID();
    session._accountUuid = params.accountUuid;
    session._goalUuid = params.goalUuid || null;
    session._status = FocusSessionStatus.DRAFT;
    session._durationMinutes = params.durationMinutes;
    session._actualDurationMinutes = 0;
    session._description = params.description || null;

    session._startedAt = null;
    session._pausedAt = null;
    session._resumedAt = null;
    session._completedAt = null;
    session._cancelledAt = null;

    session._pauseCount = 0;
    session._pausedDurationMinutes = 0;

    session._createdAt = new Date();
    session._updatedAt = new Date();

    return session;
  }

  public start(): void {
    if (this._status !== FocusSessionStatus.DRAFT) {
      throw new Error('只能启动草稿状态的专注周期');
    }

    this._status = FocusSessionStatus.IN_PROGRESS;
    this._startedAt = new Date();
    this._updatedAt = new Date();

    this.addDomainEvent({
      eventType: 'FocusSessionStartedEvent',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        sessionUuid: this._uuid,
        accountUuid: this._accountUuid,
        goalUuid: this._goalUuid,
        startedAt: this._startedAt,
        durationMinutes: this._durationMinutes,
      },
    });
  }

  public pause(): void {
    if (this._status !== FocusSessionStatus.IN_PROGRESS) {
      throw new Error('只能暂停进行中的专注周期');
    }

    this._status = FocusSessionStatus.PAUSED;
    this._pausedAt = new Date();
    this._pauseCount += 1;
    this._updatedAt = new Date();

    this.addDomainEvent({
      eventType: 'FocusSessionPausedEvent',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        sessionUuid: this._uuid,
        pausedAt: this._pausedAt,
        pauseCount: this._pauseCount,
      },
    });
  }

  public resume(): void {
    if (this._status !== FocusSessionStatus.PAUSED) {
      throw new Error('只能恢复已暂停的专注周期');
    }

    // 计算暂停时长
    const pauseDuration = Date.now() - this._pausedAt!.getTime();
    this._pausedDurationMinutes += Math.round(pauseDuration / 60000);

    this._status = FocusSessionStatus.IN_PROGRESS;
    this._resumedAt = new Date();
    this._updatedAt = new Date();

    this.addDomainEvent({
      eventType: 'FocusSessionResumedEvent',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        sessionUuid: this._uuid,
        resumedAt: this._resumedAt,
        totalPausedMinutes: this._pausedDurationMinutes,
      },
    });
  }

  public complete(): void {
    if (this._status !== FocusSessionStatus.IN_PROGRESS) {
      throw new Error('只能完成进行中的专注周期');
    }

    this._status = FocusSessionStatus.COMPLETED;
    this._completedAt = new Date();

    // 计算实际时长（排除暂停时间）
    const totalDuration = this._completedAt.getTime() - this._startedAt!.getTime();
    this._actualDurationMinutes = Math.round(totalDuration / 60000) - this._pausedDurationMinutes;

    this._updatedAt = new Date();

    this.addDomainEvent({
      eventType: 'FocusSessionCompletedEvent',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        sessionUuid: this._uuid,
        accountUuid: this._accountUuid,
        goalUuid: this._goalUuid,
        completedAt: this._completedAt,
        actualDurationMinutes: this._actualDurationMinutes,
        plannedDurationMinutes: this._durationMinutes,
      },
    });
  }

  public cancel(): void {
    if (
      this._status === FocusSessionStatus.COMPLETED ||
      this._status === FocusSessionStatus.CANCELLED
    ) {
      throw new Error('不能取消已完成或已取消的专注周期');
    }

    this._status = FocusSessionStatus.CANCELLED;
    this._cancelledAt = new Date();
    this._updatedAt = new Date();

    this.addDomainEvent({
      eventType: 'FocusSessionCancelledEvent',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        sessionUuid: this._uuid,
        cancelledAt: this._cancelledAt,
      },
    });
  }

  // Getter 方法
  public get status(): FocusSessionStatus {
    return this._status;
  }

  public get isActive(): boolean {
    return (
      this._status === FocusSessionStatus.IN_PROGRESS || this._status === FocusSessionStatus.PAUSED
    );
  }

  public getRemainingMinutes(): number {
    if (!this._startedAt || this._status !== FocusSessionStatus.IN_PROGRESS) {
      return this._durationMinutes;
    }

    const elapsed = Math.round((Date.now() - this._startedAt.getTime()) / 60000);
    const remaining = this._durationMinutes - elapsed + this._pausedDurationMinutes;
    return Math.max(0, remaining);
  }
}
```

### 2.5 应用服务

```typescript
// FocusSessionApplicationService.ts
export class FocusSessionApplicationService {
  async createAndStartSession(
    request: CreateFocusSessionRequest,
  ): Promise<CreateFocusSessionResponse> {
    // 1. 验证目标存在（如果指定）
    if (request.goalUuid) {
      const goal = await this.goalRepository.findByUuid(request.goalUuid);
      if (!goal) {
        throw new Error('目标不存在');
      }
      if (goal.accountUuid !== request.accountUuid) {
        throw new Error('无权访问此目标');
      }
    }

    // 2. 检查是否有进行中的会话
    const activeSession = await this.sessionRepository.findActiveSession(request.accountUuid);
    if (activeSession) {
      throw new Error('您有正在进行的专注周期，请先完成或取消');
    }

    // 3. 创建专注周期
    const session = FocusSession.create({
      accountUuid: request.accountUuid,
      goalUuid: request.goalUuid,
      durationMinutes: request.durationMinutes,
      description: request.description,
    });

    // 4. 立即开始（如果指定）
    if (request.startImmediately !== false) {
      session.start();
    }

    // 5. 持久化
    await this.sessionRepository.save(session);

    // 6. 发布事件
    this.publishDomainEvents(session);

    // 7. 返回响应
    return {
      session: session.toClientDTO(),
      message: '专注周期已启动',
    };
  }

  async pauseSession(sessionUuid: string, accountUuid: string): Promise<FocusSessionClientDTO> {
    return this.executeSessionAction(sessionUuid, accountUuid, (session) => {
      session.pause();
    });
  }

  async resumeSession(sessionUuid: string, accountUuid: string): Promise<FocusSessionClientDTO> {
    return this.executeSessionAction(sessionUuid, accountUuid, (session) => {
      session.resume();
    });
  }

  async completeSession(sessionUuid: string, accountUuid: string): Promise<FocusSessionClientDTO> {
    return this.executeSessionAction(sessionUuid, accountUuid, (session) => {
      session.complete();
    });
  }

  async cancelSession(sessionUuid: string, accountUuid: string): Promise<void> {
    await this.executeSessionAction(sessionUuid, accountUuid, (session) => {
      session.cancel();
    });
  }

  private async executeSessionAction(
    sessionUuid: string,
    accountUuid: string,
    action: (session: FocusSession) => void,
  ): Promise<FocusSessionClientDTO | void> {
    // 1. 加载会话
    const session = await this.sessionRepository.findByUuid(sessionUuid);
    if (!session) {
      throw new Error('专注周期不存在');
    }

    // 2. 权限检查
    if (session.accountUuid !== accountUuid) {
      throw new Error('无权操作此专注周期');
    }

    // 3. 执行操作
    action(session);

    // 4. 持久化
    await this.sessionRepository.save(session);

    // 5. 发布事件
    this.publishDomainEvents(session);

    // 6. 返回 DTO
    if (session.status !== FocusSessionStatus.CANCELLED) {
      return session.toClientDTO();
    }
  }
}
```

---

## 3. 前端实现

### 3.1 专注计时器组件

```vue
<!-- FocusTimer.vue -->
<template>
  <div class="focus-timer" :class="{ 'is-active': session?.isActive }">
    <div v-if="!session" class="start-panel">
      <h3>开始专注</h3>

      <el-form :model="form" label-width="100px">
        <el-form-item label="关联目标">
          <el-select v-model="form.goalUuid" placeholder="选择目标（可选）" clearable>
            <el-option
              v-for="goal in activeGoals"
              :key="goal.uuid"
              :label="goal.title"
              :value="goal.uuid"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="专注时长">
          <el-radio-group v-model="form.durationMinutes">
            <el-radio :label="25">25 分钟（标准）</el-radio>
            <el-radio :label="50">50 分钟（长周期）</el-radio>
            <el-radio :label="15">15 分钟（短周期）</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="描述">
          <el-input v-model="form.description" placeholder="本次专注要完成什么？" />
        </el-form-item>
      </el-form>

      <el-button type="primary" size="large" @click="handleStart" :loading="isStarting">
        开始专注
      </el-button>
    </div>

    <div v-else class="timer-panel">
      <h3>{{ goalTitle || '专注中' }}</h3>

      <div class="timer-display">
        <span class="time">{{ formattedTime }}</span>
        <el-progress
          type="circle"
          :percentage="progressPercent"
          :width="200"
          :stroke-width="12"
          :color="progressColor"
        >
          <span class="time-text">{{ formattedTime }}</span>
        </el-progress>
      </div>

      <div class="timer-info">
        <span>计划: {{ session.durationMinutes }} 分钟</span>
        <span v-if="session.pauseCount > 0"> 暂停次数: {{ session.pauseCount }} </span>
      </div>

      <div class="timer-actions">
        <el-button
          v-if="session.status === 'IN_PROGRESS'"
          @click="handlePause"
          :loading="isOperating"
        >
          暂停
        </el-button>

        <el-button
          v-if="session.status === 'PAUSED'"
          type="primary"
          @click="handleResume"
          :loading="isOperating"
        >
          继续
        </el-button>

        <el-button type="success" @click="handleComplete" :loading="isOperating"> 完成 </el-button>

        <el-button type="danger" @click="handleCancel" :loading="isOperating"> 取消 </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElNotification } from 'element-plus';
import { useFocusSessionStore } from '../stores/focusSessionStore';
import { useGoalStore } from '../stores/goalStore';

const sessionStore = useFocusSessionStore();
const goalStore = useGoalStore();

const form = ref({
  goalUuid: null as string | null,
  durationMinutes: 25,
  description: '',
});

const isStarting = ref(false);
const isOperating = ref(false);
const currentTime = ref(Date.now());
let timer: number | null = null;

const session = computed(() => sessionStore.activeSession);

const activeGoals = computed(() => {
  return goalStore.goals.filter((g) => g.status === 'ACTIVE');
});

const goalTitle = computed(() => {
  if (!session.value?.goalUuid) return null;
  const goal = goalStore.goals.find((g) => g.uuid === session.value.goalUuid);
  return goal?.title;
});

const remainingMinutes = computed(() => {
  if (!session.value) return 0;

  if (session.value.status === 'PAUSED') {
    return session.value.durationMinutes - session.value.actualDurationMinutes;
  }

  const elapsed = Math.floor((currentTime.value - session.value.startedAt) / 60000);
  const remaining = session.value.durationMinutes - elapsed + session.value.pausedDurationMinutes;
  return Math.max(0, remaining);
});

const formattedTime = computed(() => {
  const minutes = Math.floor(remainingMinutes.value);
  const seconds = Math.floor((remainingMinutes.value % 1) * 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

const progressPercent = computed(() => {
  if (!session.value) return 0;
  return Math.round((1 - remainingMinutes.value / session.value.durationMinutes) * 100);
});

const progressColor = computed(() => {
  if (remainingMinutes.value === 0) return '#67c23a';
  if (remainingMinutes.value <= 5) return '#f56c6c';
  return '#409eff';
});

onMounted(async () => {
  // 加载活跃会话
  await sessionStore.loadActiveSession();

  // 启动计时器
  timer = window.setInterval(() => {
    currentTime.value = Date.now();

    // 检查是否到时间
    if (session.value && remainingMinutes.value <= 0) {
      handleTimeUp();
    }
  }, 1000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});

async function handleStart() {
  isStarting.value = true;
  try {
    await sessionStore.startSession(form.value);
    ElMessage.success('专注周期已启动');
  } catch (error: any) {
    ElMessage.error(error.message || '启动失败');
  } finally {
    isStarting.value = false;
  }
}

async function handlePause() {
  isOperating.value = true;
  try {
    await sessionStore.pauseSession();
    ElMessage.info('已暂停');
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败');
  } finally {
    isOperating.value = false;
  }
}

async function handleResume() {
  isOperating.value = true;
  try {
    await sessionStore.resumeSession();
    ElMessage.success('继续专注');
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败');
  } finally {
    isOperating.value = false;
  }
}

async function handleComplete() {
  isOperating.value = true;
  try {
    await sessionStore.completeSession();

    ElNotification.success({
      title: '专注完成！',
      message: `本次专注 ${session.value?.actualDurationMinutes} 分钟`,
      duration: 5000,
    });
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败');
  } finally {
    isOperating.value = false;
  }
}

async function handleCancel() {
  isOperating.value = true;
  try {
    await sessionStore.cancelSession();
    ElMessage.info('已取消');
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败');
  } finally {
    isOperating.value = false;
  }
}

function handleTimeUp() {
  // 播放提示音
  playNotificationSound();

  // 显示通知
  ElNotification.success({
    title: '专注时间到！',
    message: '恭喜完成本次专注',
    duration: 0, // 不自动关闭
  });

  // 自动完成
  handleComplete();
}

function playNotificationSound() {
  const audio = new Audio('/sounds/focus-complete.mp3');
  audio.play().catch((err) => console.error('Failed to play sound:', err));
}
</script>

<style scoped>
.focus-timer {
  padding: 24px;
  border-radius: 8px;
  background: #f5f7fa;
}

.timer-display {
  display: flex;
  justify-content: center;
  margin: 32px 0;
}

.time-text {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
}

.timer-info {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 24px;
  color: #606266;
}

.timer-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>
```

---

## 4. 统计分析

### 4.1 目标维度统计

```typescript
// GoalStatistics.ts
export interface GoalFocusStatistics {
  goalUuid: string;
  totalSessions: number; // 总专注次数
  completedSessions: number; // 完成的次数
  totalFocusMinutes: number; // 总专注时长（分钟）
  averageFocusMinutes: number; // 平均时长
  longestFocusMinutes: number; // 最长单次时长
  lastFocusedAt: Date | null; // 最后专注时间
}
```

### 4.2 统计事件处理

```typescript
// apps/api/src/modules/statistics/initialization/eventHandlers.ts

eventBus.on('FocusSessionCompletedEvent', async (event) => {
  const { goalUuid, actualDurationMinutes } = event.payload;

  if (goalUuid) {
    await statisticsService.updateGoalFocusStatistics(goalUuid, {
      incrementSessions: 1,
      incrementCompletedSessions: 1,
      addFocusMinutes: actualDurationMinutes,
    });
  }

  // 更新用户总统计
  await statisticsService.incrementTotalFocusMinutes(
    event.payload.accountUuid,
    actualDurationMinutes,
  );
});
```

---

## 5. 数据库模型

```prisma
model FocusSession {
  uuid                    String    @id @default(uuid())
  accountUuid             String
  goalUuid                String?
  status                  String    @default("DRAFT")
  durationMinutes         Int
  actualDurationMinutes   Int       @default(0)
  description             String?   @db.Text

  startedAt               DateTime?
  pausedAt                DateTime?
  resumedAt               DateTime?
  completedAt             DateTime?
  cancelledAt             DateTime?

  pauseCount              Int       @default(0)
  pausedDurationMinutes   Int       @default(0)

  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt

  // 关系
  account                 Account   @relation(fields: [accountUuid], references: [uuid])
  goal                    Goal?     @relation(fields: [goalUuid], references: [uuid])

  @@index([accountUuid])
  @@index([goalUuid])
  @@index([status])
  @@map("focus_sessions")
}
```

---

## 6. 参考文档

- [创建目标流程](./CREATE_GOAL_FLOW.md)
- [Goal 模块设计规划](../GOAL_MODULE_PLAN.md)
- [番茄工作法](https://zh.wikipedia.org/wiki/%E7%95%AA%E8%8C%84%E5%B7%A5%E4%BD%9C%E6%B3%95)
