# 任务模板状态转换流程设计文档

## 文档信息

- **版本**: 1.0
- **创建日期**: 2025-10-18
- **架构模式**: DDD (Task 模块)
- **相关模块**: Task, Scheduler
- **业务场景**: 任务模板生命周期管理与状态转换

---

## 1. 业务概述

### 1.1 业务目标

任务模板（TaskTemplate）需要完整的生命周期管理，支持：

- **激活模板**: 从草稿状态激活，开始生成任务实例
- **暂停模板**: 临时停止生成新实例，保留现有实例
- **恢复模板**: 从暂停状态恢复，继续生成实例
- **归档模板**: 永久停止模板，完成所有实例后归档
- **删除模板**: 软删除模板，可恢复
- **恢复删除**: 从删除状态恢复到之前的状态

### 1.2 核心原则

- **状态驱动**: 模板状态决定是否生成新实例
- **实例保留**: 暂停/删除模板不影响已生成的实例
- **渐进式归档**: 归档前需完成或取消所有待办实例
- **可恢复性**: 删除操作为软删除，可随时恢复
- **权限校验**: 只有模板创建者可修改状态
- **事件通知**: 状态变更触发事件，通知 Reminder/Statistics 模块

### 1.3 状态机定义

```plaintext
          create()
          ┌────────┐
  ┌──────►│ DRAFT  │
  │       │  草稿  │
  │       └───┬────┘
  │           │ activate()
  │           ▼
  │       ┌────────┐
  │   ┌───┤ ACTIVE │────┐
  │   │   │  激活  │    │
  │   │   └───┬────┘    │
  │   │       │         │
  │   │pause()│      archive()
  │   │       ▼         │
  │   │   ┌────────┐    │
  │   └──►│ PAUSED │    │
  │resume()│  暂停  │    │
  │       └────────┘    │
  │                     │
  │                     ▼
  │                 ┌─────────┐
  │                 │ARCHIVED │
  │                 │  归档   │
  │                 └─────────┘
  │
  │         softDelete() (从任意状态)
  │       ┌─────────┐
  └───────┤ DELETED │
  restore()│  删除   │
          └─────────┘
```

### 1.4 状态转换规则

| 当前状态 | 允许的转换             | 业务规则                             |
| -------- | ---------------------- | ------------------------------------ |
| DRAFT    | activate() → ACTIVE    | 必须有有效的时间配置和标题           |
| ACTIVE   | pause() → PAUSED       | 停止生成新实例，保留现有实例         |
| ACTIVE   | archive() → ARCHIVED   | 必须先完成/取消所有待办实例          |
| ACTIVE   | softDelete() → DELETED | 软删除，记录删除前状态               |
| PAUSED   | resume() → ACTIVE      | 恢复生成实例，更新 lastGeneratedDate |
| PAUSED   | archive() → ARCHIVED   | 直接归档                             |
| PAUSED   | softDelete() → DELETED | 软删除                               |
| ARCHIVED | softDelete() → DELETED | 软删除                               |
| DELETED  | restore() → {previous} | 恢复到删除前的状态                   |

---

## 2. API 定义

### 2.1 激活模板

#### 请求

```http
PUT /api/task-templates/:templateUuid/activate
Authorization: Bearer {token}
```

#### 响应

```typescript
{
  success: true,
  data: {
    template: TaskTemplateClientDTO,
    generatedInstancesCount: number
  }
}
```

---

### 2.2 暂停模板

#### 请求

```http
PUT /api/task-templates/:templateUuid/pause
Authorization: Bearer {token}
```

#### 请求体

```typescript
{
  reason?: string  // 暂停原因（可选）
}
```

#### 响应

```typescript
{
  success: true,
  data: {
    template: TaskTemplateClientDTO,
    pausedAt: number
  }
}
```

---

### 2.3 恢复模板

#### 请求

```http
PUT /api/task-templates/:templateUuid/resume
Authorization: Bearer {token}
```

#### 响应

```typescript
{
  success: true,
  data: {
    template: TaskTemplateClientDTO,
    generatedInstancesCount: number
  }
}
```

---

### 2.4 归档模板

#### 请求

```http
PUT /api/task-templates/:templateUuid/archive
Authorization: Bearer {token}
```

#### 请求体

```typescript
{
  forceArchive?: boolean  // 强制归档，取消所有待办实例（默认 false）
}
```

#### 响应

```typescript
{
  success: true,
  data: {
    template: TaskTemplateClientDTO,
    archivedAt: number,
    affectedInstancesCount: number  // 被取消的实例数量
  }
}
```

---

### 2.5 删除模板

#### 请求

```http
DELETE /api/task-templates/:templateUuid
Authorization: Bearer {token}
```

#### 请求体

```typescript
{
  deleteInstances?: boolean  // 是否同时删除所有实例（默认 false）
}
```

#### 响应

```typescript
{
  success: true,
  data: {
    template: TaskTemplateClientDTO,
    deletedAt: number,
    affectedInstancesCount: number  // 被删除的实例数量
  }
}
```

---

### 2.6 恢复删除

#### 请求

```http
POST /api/task-templates/:templateUuid/restore
Authorization: Bearer {token}
```

#### 响应

```typescript
{
  success: true,
  data: {
    template: TaskTemplateClientDTO,
    restoredToStatus: TaskTemplateStatus
  }
}
```

---

## 3. Domain 层实现

### 3.1 TaskTemplate 聚合根

```typescript
// TaskTemplate.ts
export class TaskTemplate extends AggregateRoot {
  // ... 其他属性和方法 ...

  private _status: TaskTemplateStatus;
  private _statusBeforeDelete: TaskTemplateStatus | null;
  private _lastActivatedAt: number | null;
  private _lastPausedAt: number | null;
  private _archivedAt: number | null;
  private _deletedAt: number | null;

  // 激活模板
  public activate(): void {
    // 1. 验证当前状态
    if (this._status !== TaskTemplateStatus.DRAFT && this._status !== TaskTemplateStatus.PAUSED) {
      throw new Error(`无法从状态 ${this._status} 激活模板`);
    }

    // 2. 验证必填字段
    if (!this._title || this._title.trim().length === 0) {
      throw new Error('模板标题不能为空');
    }

    if (!this._timeConfig) {
      throw new Error('必须配置时间设置');
    }

    if (this._taskType !== TaskType.ONE_TIME && !this._recurrenceRule) {
      throw new Error('循环任务必须配置重复规则');
    }

    // 3. 更新状态
    this._status = TaskTemplateStatus.ACTIVE;
    this._lastActivatedAt = Date.now();
    this._updatedAt = Date.now();

    // 4. 发布事件
    this.addDomainEvent(
      new TemplateActivatedEvent({
        templateUuid: this._uuid,
        userId: this._userId,
        taskType: this._taskType,
        recurrenceRule: this._recurrenceRule,
        activatedAt: this._lastActivatedAt,
      }),
    );
  }

  // 暂停模板
  public pause(reason?: string): void {
    // 1. 验证当前状态
    if (this._status !== TaskTemplateStatus.ACTIVE) {
      throw new Error(`无法从状态 ${this._status} 暂停模板`);
    }

    // 2. 更新状态
    this._status = TaskTemplateStatus.PAUSED;
    this._lastPausedAt = Date.now();
    this._updatedAt = Date.now();

    // 3. 发布事件
    this.addDomainEvent(
      new TemplatePausedEvent({
        templateUuid: this._uuid,
        userId: this._userId,
        reason: reason || null,
        pausedAt: this._lastPausedAt,
      }),
    );
  }

  // 恢复模板
  public resume(): void {
    // 1. 验证当前状态
    if (this._status !== TaskTemplateStatus.PAUSED) {
      throw new Error(`无法从状态 ${this._status} 恢复模板`);
    }

    // 2. 更新状态
    this._status = TaskTemplateStatus.ACTIVE;
    this._lastActivatedAt = Date.now();
    this._updatedAt = Date.now();

    // 3. 发布事件
    this.addDomainEvent(
      new TemplateResumedEvent({
        templateUuid: this._uuid,
        userId: this._userId,
        resumedAt: this._lastActivatedAt,
      }),
    );
  }

  // 归档模板
  public archive(pendingInstancesCount: number, forceArchive: boolean = false): void {
    // 1. 验证当前状态
    if (this._status !== TaskTemplateStatus.ACTIVE && this._status !== TaskTemplateStatus.PAUSED) {
      throw new Error(`无法从状态 ${this._status} 归档模板`);
    }

    // 2. 验证是否有待办实例
    if (pendingInstancesCount > 0 && !forceArchive) {
      throw new Error(
        `模板还有 ${pendingInstancesCount} 个待办实例，请先完成或取消这些实例，或使用强制归档`,
      );
    }

    // 3. 更新状态
    this._status = TaskTemplateStatus.ARCHIVED;
    this._archivedAt = Date.now();
    this._updatedAt = Date.now();

    // 4. 发布事件
    this.addDomainEvent(
      new TemplateArchivedEvent({
        templateUuid: this._uuid,
        userId: this._userId,
        archivedAt: this._archivedAt,
        forceArchived: forceArchive,
        affectedInstancesCount: forceArchive ? pendingInstancesCount : 0,
      }),
    );
  }

  // 软删除模板
  public softDelete(statusBeforeDelete?: TaskTemplateStatus): void {
    // 1. 验证当前状态
    if (this._status === TaskTemplateStatus.DELETED) {
      throw new Error('模板已被删除');
    }

    // 2. 记录删除前的状态
    this._statusBeforeDelete = statusBeforeDelete || this._status;
    this._status = TaskTemplateStatus.DELETED;
    this._deletedAt = Date.now();
    this._updatedAt = Date.now();

    // 3. 发布事件
    this.addDomainEvent(
      new TemplateDeletedEvent({
        templateUuid: this._uuid,
        userId: this._userId,
        deletedAt: this._deletedAt,
        statusBeforeDelete: this._statusBeforeDelete,
      }),
    );
  }

  // 恢复删除
  public restore(): void {
    // 1. 验证当前状态
    if (this._status !== TaskTemplateStatus.DELETED) {
      throw new Error('模板未被删除，无法恢复');
    }

    if (!this._statusBeforeDelete) {
      throw new Error('无法确定恢复后的状态');
    }

    // 2. 恢复状态
    const restoredStatus = this._statusBeforeDelete;
    this._status = restoredStatus;
    this._statusBeforeDelete = null;
    this._deletedAt = null;
    this._updatedAt = Date.now();

    // 3. 发布事件
    this.addDomainEvent(
      new TemplateRestoredEvent({
        templateUuid: this._uuid,
        userId: this._userId,
        restoredToStatus: restoredStatus,
        restoredAt: Date.now(),
      }),
    );
  }

  // 判断是否可以生成实例
  public canGenerateInstances(): boolean {
    return this._status === TaskTemplateStatus.ACTIVE;
  }

  // 判断是否可以修改
  public canEdit(): boolean {
    return this._status === TaskTemplateStatus.DRAFT || this._status === TaskTemplateStatus.PAUSED;
  }

  // Getters
  public get status(): TaskTemplateStatus {
    return this._status;
  }

  public get statusBeforeDelete(): TaskTemplateStatus | null {
    return this._statusBeforeDelete;
  }

  public get lastActivatedAt(): number | null {
    return this._lastActivatedAt;
  }

  public get lastPausedAt(): number | null {
    return this._lastPausedAt;
  }

  public get archivedAt(): number | null {
    return this._archivedAt;
  }

  public get deletedAt(): number | null {
    return this._deletedAt;
  }

  public get isDeleted(): boolean {
    return this._status === TaskTemplateStatus.DELETED;
  }

  public get isActive(): boolean {
    return this._status === TaskTemplateStatus.ACTIVE;
  }

  public get isPaused(): boolean {
    return this._status === TaskTemplateStatus.PAUSED;
  }

  public get isArchived(): boolean {
    return this._status === TaskTemplateStatus.ARCHIVED;
  }
}
```

---

## 4. Application Service 实现

### 4.1 TaskTemplateStatusService

```typescript
// TaskTemplateStatusService.ts
export class TaskTemplateStatusService {
  constructor(
    private taskTemplateRepository: ITaskTemplateRepository,
    private taskInstanceRepository: ITaskInstanceRepository,
    private reminderService: IReminderService,
    private eventBus: IEventBus,
  ) {}

  // 激活模板
  async activate(
    templateUuid: string,
    userId: string,
  ): Promise<{
    template: TaskTemplate;
    generatedInstancesCount: number;
  }> {
    // 1. 加载模板
    const template = await this.taskTemplateRepository.findByUuid(templateUuid);
    if (!template) {
      throw new Error('模板不存在');
    }

    // 2. 权限校验
    if (template.userId !== userId) {
      throw new Error('无权限操作此模板');
    }

    // 3. 执行激活
    template.activate();

    // 4. 生成初始实例（如果是循环任务）
    let generatedCount = 0;
    if (template.taskType !== TaskType.ONE_TIME) {
      const now = Date.now();
      const endDate = now + template.generateAheadDays * 24 * 60 * 60 * 1000;

      const occurrences = template.recurrenceRule!.getOccurrencesUntil(now, endDate);

      const instances = occurrences.map((date) => TaskInstance.createFromTemplate(template, date));

      await this.taskInstanceRepository.saveAll(instances);
      generatedCount = instances.length;

      // 创建提醒
      for (const instance of instances) {
        if (template.reminderConfig) {
          await this.reminderService.createTaskReminders(instance, template.reminderConfig);
        }
      }

      // 更新最后生成日期
      template.updateLastGeneratedDate(now);
    }

    // 5. 保存模板
    await this.taskTemplateRepository.save(template);

    // 6. 发布领域事件
    await this.eventBus.publishAll(template.domainEvents);
    template.clearDomainEvents();

    return {
      template,
      generatedInstancesCount: generatedCount,
    };
  }

  // 暂停模板
  async pause(templateUuid: string, userId: string, reason?: string): Promise<TaskTemplate> {
    // 1. 加载模板
    const template = await this.taskTemplateRepository.findByUuid(templateUuid);
    if (!template) {
      throw new Error('模板不存在');
    }

    // 2. 权限校验
    if (template.userId !== userId) {
      throw new Error('无权限操作此模板');
    }

    // 3. 执行暂停
    template.pause(reason);

    // 4. 取消未来的提醒
    await this.reminderService.cancelFutureRemindersForTemplate(templateUuid);

    // 5. 保存模板
    await this.taskTemplateRepository.save(template);

    // 6. 发布领域事件
    await this.eventBus.publishAll(template.domainEvents);
    template.clearDomainEvents();

    return template;
  }

  // 恢复模板
  async resume(
    templateUuid: string,
    userId: string,
  ): Promise<{
    template: TaskTemplate;
    generatedInstancesCount: number;
  }> {
    // 1. 加载模板
    const template = await this.taskTemplateRepository.findByUuid(templateUuid);
    if (!template) {
      throw new Error('模板不存在');
    }

    // 2. 权限校验
    if (template.userId !== userId) {
      throw new Error('无权限操作此模板');
    }

    // 3. 执行恢复
    template.resume();

    // 4. 重新生成实例（从最后生成日期开始）
    let generatedCount = 0;
    if (template.taskType !== TaskType.ONE_TIME) {
      const now = Date.now();
      const startDate = template.lastGeneratedDate || now;
      const endDate = now + template.generateAheadDays * 24 * 60 * 60 * 1000;

      const occurrences = template.recurrenceRule!.getOccurrencesUntil(startDate, endDate);

      // 过滤已存在的实例
      const existingInstances = await this.taskInstanceRepository.findByTemplateAndDateRange(
        templateUuid,
        startDate,
        endDate,
      );
      const existingDates = new Set(existingInstances.map((i) => i.instanceDate));
      const newDates = occurrences.filter((date) => !existingDates.has(date));

      const instances = newDates.map((date) => TaskInstance.createFromTemplate(template, date));

      if (instances.length > 0) {
        await this.taskInstanceRepository.saveAll(instances);
        generatedCount = instances.length;

        // 创建提醒
        for (const instance of instances) {
          if (template.reminderConfig) {
            await this.reminderService.createTaskReminders(instance, template.reminderConfig);
          }
        }

        // 更新最后生成日期
        template.updateLastGeneratedDate(now);
      }
    }

    // 5. 保存模板
    await this.taskTemplateRepository.save(template);

    // 6. 发布领域事件
    await this.eventBus.publishAll(template.domainEvents);
    template.clearDomainEvents();

    return {
      template,
      generatedInstancesCount: generatedCount,
    };
  }

  // 归档模板
  async archive(
    templateUuid: string,
    userId: string,
    forceArchive: boolean = false,
  ): Promise<{
    template: TaskTemplate;
    affectedInstancesCount: number;
  }> {
    // 1. 加载模板
    const template = await this.taskTemplateRepository.findByUuid(templateUuid);
    if (!template) {
      throw new Error('模板不存在');
    }

    // 2. 权限校验
    if (template.userId !== userId) {
      throw new Error('无权限操作此模板');
    }

    // 3. 统计待办实例
    const pendingInstances = await this.taskInstanceRepository.findPendingByTemplate(templateUuid);

    // 4. 如果强制归档，取消所有待办实例
    let affectedCount = 0;
    if (forceArchive && pendingInstances.length > 0) {
      for (const instance of pendingInstances) {
        instance.cancel('模板已归档', userId);
      }
      await this.taskInstanceRepository.saveAll(pendingInstances);
      affectedCount = pendingInstances.length;
    }

    // 5. 执行归档
    template.archive(pendingInstances.length, forceArchive);

    // 6. 取消所有未来的提醒
    await this.reminderService.cancelFutureRemindersForTemplate(templateUuid);

    // 7. 保存模板
    await this.taskTemplateRepository.save(template);

    // 8. 发布领域事件
    await this.eventBus.publishAll(template.domainEvents);
    template.clearDomainEvents();

    return {
      template,
      affectedInstancesCount: affectedCount,
    };
  }

  // 软删除模板
  async softDelete(
    templateUuid: string,
    userId: string,
    deleteInstances: boolean = false,
  ): Promise<{
    template: TaskTemplate;
    affectedInstancesCount: number;
  }> {
    // 1. 加载模板
    const template = await this.taskTemplateRepository.findByUuid(templateUuid);
    if (!template) {
      throw new Error('模板不存在');
    }

    // 2. 权限校验
    if (template.userId !== userId) {
      throw new Error('无权限操作此模板');
    }

    // 3. 如果需要删除实例
    let affectedCount = 0;
    if (deleteInstances) {
      const instances = await this.taskInstanceRepository.findByTemplate(templateUuid);
      for (const instance of instances) {
        instance.softDelete();
      }
      await this.taskInstanceRepository.saveAll(instances);
      affectedCount = instances.length;
    }

    // 4. 执行软删除
    template.softDelete();

    // 5. 取消所有提醒
    await this.reminderService.cancelAllRemindersForTemplate(templateUuid);

    // 6. 保存模板
    await this.taskTemplateRepository.save(template);

    // 7. 发布领域事件
    await this.eventBus.publishAll(template.domainEvents);
    template.clearDomainEvents();

    return {
      template,
      affectedInstancesCount: affectedCount,
    };
  }

  // 恢复删除
  async restore(templateUuid: string, userId: string): Promise<TaskTemplate> {
    // 1. 加载模板
    const template = await this.taskTemplateRepository.findByUuid(templateUuid);
    if (!template) {
      throw new Error('模板不存在');
    }

    // 2. 权限校验
    if (template.userId !== userId) {
      throw new Error('无权限操作此模板');
    }

    // 3. 执行恢复
    template.restore();

    // 4. 如果恢复到 ACTIVE 状态，重新创建提醒
    if (template.isActive && template.reminderConfig) {
      const futureInstances = await this.taskInstanceRepository.findFutureByTemplate(templateUuid);
      for (const instance of futureInstances) {
        await this.reminderService.createTaskReminders(instance, template.reminderConfig);
      }
    }

    // 5. 保存模板
    await this.taskTemplateRepository.save(template);

    // 6. 发布领域事件
    await this.eventBus.publishAll(template.domainEvents);
    template.clearDomainEvents();

    return template;
  }
}
```

---

## 5. 前端实现

### 5.1 模板状态操作组件

```vue
<!-- TaskTemplateStatusActions.vue -->
<template>
  <div class="template-status-actions">
    <!-- 状态徽章 -->
    <el-tag :type="statusTagType" size="large">
      {{ statusLabel }}
    </el-tag>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <!-- 激活 -->
      <el-button
        v-if="template.status === 'DRAFT'"
        type="primary"
        :loading="loading"
        @click="handleActivate"
      >
        <el-icon><VideoPlay /></el-icon>
        激活模板
      </el-button>

      <!-- 暂停 -->
      <el-button
        v-if="template.status === 'ACTIVE'"
        type="warning"
        :loading="loading"
        @click="handlePause"
      >
        <el-icon><VideoPause /></el-icon>
        暂停模板
      </el-button>

      <!-- 恢复 -->
      <el-button
        v-if="template.status === 'PAUSED'"
        type="success"
        :loading="loading"
        @click="handleResume"
      >
        <el-icon><VideoPlay /></el-icon>
        恢复模板
      </el-button>

      <!-- 归档 -->
      <el-button
        v-if="template.status === 'ACTIVE' || template.status === 'PAUSED'"
        type="info"
        :loading="loading"
        @click="handleArchive"
      >
        <el-icon><FolderOpened /></el-icon>
        归档模板
      </el-button>

      <!-- 删除 -->
      <el-button
        v-if="template.status !== 'DELETED'"
        type="danger"
        :loading="loading"
        @click="handleDelete"
      >
        <el-icon><Delete /></el-icon>
        删除模板
      </el-button>

      <!-- 恢复删除 -->
      <el-button
        v-if="template.status === 'DELETED'"
        type="primary"
        :loading="loading"
        @click="handleRestore"
      >
        <el-icon><RefreshLeft /></el-icon>
        恢复模板
      </el-button>
    </div>

    <!-- 暂停对话框 -->
    <el-dialog v-model="pauseDialogVisible" title="暂停模板" width="500px">
      <el-form :model="pauseForm" label-width="80px">
        <el-form-item label="暂停原因">
          <el-input
            v-model="pauseForm.reason"
            type="textarea"
            :rows="3"
            placeholder="选填：说明暂停原因"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="pauseDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="confirmPause"> 确认暂停 </el-button>
      </template>
    </el-dialog>

    <!-- 归档对话框 -->
    <el-dialog v-model="archiveDialogVisible" title="归档模板" width="500px">
      <el-alert v-if="pendingInstancesCount > 0" type="warning" :closable="false" show-icon>
        <template #title> 此模板还有 {{ pendingInstancesCount }} 个待办实例 </template>
        <p>建议先完成或取消这些实例，或选择强制归档（将自动取消所有待办实例）。</p>
      </el-alert>

      <el-form :model="archiveForm" label-width="100px" style="margin-top: 20px;">
        <el-form-item label="强制归档">
          <el-switch v-model="archiveForm.forceArchive" :disabled="pendingInstancesCount === 0" />
          <el-text type="info" size="small" style="margin-left: 8px;">
            自动取消所有待办实例
          </el-text>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="archiveDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="loading"
          :disabled="pendingInstancesCount > 0 && !archiveForm.forceArchive"
          @click="confirmArchive"
        >
          确认归档
        </el-button>
      </template>
    </el-dialog>

    <!-- 删除对话框 -->
    <el-dialog v-model="deleteDialogVisible" title="删除模板" width="500px">
      <el-alert type="error" :closable="false" show-icon>
        <template #title> 确认删除模板？ </template>
        <p>删除后可以在回收站中恢复，但如果选择同时删除实例，所有任务实例也将被删除。</p>
      </el-alert>

      <el-form :model="deleteForm" label-width="120px" style="margin-top: 20px;">
        <el-form-item label="同时删除实例">
          <el-switch v-model="deleteForm.deleteInstances" />
          <el-text type="info" size="small" style="margin-left: 8px;">
            删除所有相关的任务实例
          </el-text>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="loading" @click="confirmDelete"> 确认删除 </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { VideoPlay, VideoPause, FolderOpened, Delete, RefreshLeft } from '@element-plus/icons-vue';
import { taskTemplateApi } from '@/api/task-template';
import type { TaskTemplateClientDTO } from '@packages/contracts';

const props = defineProps<{
  template: TaskTemplateClientDTO;
  pendingInstancesCount: number;
}>();

const emit = defineEmits<{
  'status-changed': [template: TaskTemplateClientDTO];
}>();

const loading = ref(false);
const pauseDialogVisible = ref(false);
const archiveDialogVisible = ref(false);
const deleteDialogVisible = ref(false);

const pauseForm = ref({
  reason: '',
});

const archiveForm = ref({
  forceArchive: false,
});

const deleteForm = ref({
  deleteInstances: false,
});

// 状态标签类型
const statusTagType = computed(() => {
  const map = {
    DRAFT: 'info',
    ACTIVE: 'success',
    PAUSED: 'warning',
    ARCHIVED: '',
    DELETED: 'danger',
  };
  return map[props.template.status] || '';
});

// 状态标签文本
const statusLabel = computed(() => {
  const map = {
    DRAFT: '草稿',
    ACTIVE: '激活中',
    PAUSED: '已暂停',
    ARCHIVED: '已归档',
    DELETED: '已删除',
  };
  return map[props.template.status] || '未知';
});

// 激活模板
async function handleActivate() {
  try {
    loading.value = true;
    const { data } = await taskTemplateApi.activate(props.template.uuid);
    ElMessage.success(`模板已激活，生成了 ${data.generatedInstancesCount} 个任务实例`);
    emit('status-changed', data.template);
  } catch (error: any) {
    ElMessage.error(error.message || '激活失败');
  } finally {
    loading.value = false;
  }
}

// 暂停模板
function handlePause() {
  pauseForm.value.reason = '';
  pauseDialogVisible.value = true;
}

async function confirmPause() {
  try {
    loading.value = true;
    const { data } = await taskTemplateApi.pause(
      props.template.uuid,
      pauseForm.value.reason || undefined,
    );
    ElMessage.success('模板已暂停');
    pauseDialogVisible.value = false;
    emit('status-changed', data.template);
  } catch (error: any) {
    ElMessage.error(error.message || '暂停失败');
  } finally {
    loading.value = false;
  }
}

// 恢复模板
async function handleResume() {
  try {
    loading.value = true;
    const { data } = await taskTemplateApi.resume(props.template.uuid);
    ElMessage.success(`模板已恢复，生成了 ${data.generatedInstancesCount} 个任务实例`);
    emit('status-changed', data.template);
  } catch (error: any) {
    ElMessage.error(error.message || '恢复失败');
  } finally {
    loading.value = false;
  }
}

// 归档模板
function handleArchive() {
  archiveForm.value.forceArchive = false;
  archiveDialogVisible.value = true;
}

async function confirmArchive() {
  try {
    loading.value = true;
    const { data } = await taskTemplateApi.archive(
      props.template.uuid,
      archiveForm.value.forceArchive,
    );

    const message = archiveForm.value.forceArchive
      ? `模板已归档，取消了 ${data.affectedInstancesCount} 个待办实例`
      : '模板已归档';

    ElMessage.success(message);
    archiveDialogVisible.value = false;
    emit('status-changed', data.template);
  } catch (error: any) {
    ElMessage.error(error.message || '归档失败');
  } finally {
    loading.value = false;
  }
}

// 删除模板
function handleDelete() {
  deleteForm.value.deleteInstances = false;
  deleteDialogVisible.value = true;
}

async function confirmDelete() {
  try {
    loading.value = true;
    const { data } = await taskTemplateApi.softDelete(
      props.template.uuid,
      deleteForm.value.deleteInstances,
    );

    const message = deleteForm.value.deleteInstances
      ? `模板已删除，同时删除了 ${data.affectedInstancesCount} 个任务实例`
      : '模板已删除';

    ElMessage.success(message);
    deleteDialogVisible.value = false;
    emit('status-changed', data.template);
  } catch (error: any) {
    ElMessage.error(error.message || '删除失败');
  } finally {
    loading.value = false;
  }
}

// 恢复删除
async function handleRestore() {
  try {
    await ElMessageBox.confirm('确认恢复此模板吗？', '恢复模板', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info',
    });

    loading.value = true;
    const { data } = await taskTemplateApi.restore(props.template.uuid);
    ElMessage.success('模板已恢复');
    emit('status-changed', data.template);
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '恢复失败');
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.template-status-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}
</style>
```

---

## 6. 参考文档

- [创建任务模板流程](./CREATE_TASK_TEMPLATE_FLOW.md)
- [生成任务实例流程](./GENERATE_TASK_INSTANCE_FLOW.md)
- [任务实例生命周期流程](./TASK_INSTANCE_LIFECYCLE_FLOW.md)
- [目标状态转换流程](../../goal/goal-flows/GOAL_STATUS_TRANSITION_FLOW.md)
- [Task 模块设计规划](../TASK_MODULE_PLAN.md)
