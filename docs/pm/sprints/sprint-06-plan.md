# Sprint 6 详细执行计划

> **Sprint ID**: Sprint 6  
> **Sprint 周期**: Week 13-14 (2026-01-12 ~ 2026-01-23)  
> **Sprint 目标**: 实现多渠道通知聚合 + 系统集成收尾  
> **Story Points**: 15 SP  
> **Epic**: NOTIFICATION-001 (15 SP)  
> **状态**: Planning  
> **依赖**: Sprint 2b (Node-Cron 已实现), ADR-003 (BullMQ + Redis 技术决策)

---

## 📋 Sprint 概览

### Sprint 目标 (Sprint Goal)

> **实现基于 BullMQ 的多渠道通知聚合系统，完成核心功能闭环。**

**核心价值**:
- ✅ 多渠道通知聚合（应用内 + 桌面推送 + 邮件）
- ✅ BullMQ + Redis 消息队列（可靠性、重试、优先级）
- ✅ Bull Board 可视化监控面板
- ✅ 系统集成测试 + 部署准备

### Epic 背景

**NOTIFICATION-001 - 多渠道通知聚合**:
- **核心架构**: BullMQ 消息队列 + Worker 异步处理
- **技术决策**: 基于 Sprint 2b Spike 结果，采用 BullMQ (ADR-003)
- **用户场景**: 任务提醒、目标提醒、日程提醒自动分发到多个渠道

---

## 📅 每日执行计划 (Day-by-Day Plan)

### **Week 13: BullMQ 核心系统搭建**

#### **Day 1 (2026-01-12 周一): Redis + BullMQ 基础设施**

**目标**: 完成 BullMQ + Redis 环境搭建 (3 SP)

**任务清单**:
- [ ] **上午**: Redis 配置
  ```yaml
  # docker-compose.yml
  services:
    redis:
      image: redis:7-alpine
      ports:
        - "6379:6379"
      volumes:
        - ./data/redis:/data
      command: redis-server --appendonly yes --appendfsync everysec
  ```

- [ ] **下午**: BullMQ Queue 初始化
  ```typescript
  // packages/domain-server/src/infrastructure/queue/notification-queue.ts
  import { Queue, Worker, QueueEvents } from 'bullmq';
  import IORedis from 'ioredis';
  
  const connection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null
  });
  
  export const notificationQueue = new Queue('notifications', { connection });
  
  export interface NotificationJobData {
    targetUuid: string;
    targetType: 'task' | 'goal' | 'schedule';
    channels: ('in_app' | 'desktop' | 'email')[];
    title: string;
    content: string;
    priority: number;  // 1-5
    scheduledAt?: number;  // 定时发送
  }
  ```

**交付物**: ✅ Redis + BullMQ 环境就绪

---

#### **Day 2-3 (2026-01-13 ~ 2026-01-14): Contracts + Domain + Application**

**目标**: 完成通知领域模型 + Application Service (5 SP)

**任务清单**:
- [ ] **Day 2**: Contracts + Domain
  ```typescript
  // packages/contracts/src/notification/notification.dto.ts
  export interface NotificationDTO {
    uuid: string;
    userUuid: string;
    targetUuid: string;
    targetType: 'task' | 'goal' | 'schedule';
    
    channel: 'in_app' | 'desktop' | 'email';
    title: string;
    content: string;
    
    status: 'pending' | 'sent' | 'failed';
    priority: number;
    
    sentAt?: number;
    failureReason?: string;
    
    createdAt: number;
  }
  
  // packages/domain-server/src/domain/notification/notification.entity.ts
  export class Notification extends AggregateRoot {
    constructor(
      uuid: string,
      public readonly userUuid: string,
      public readonly targetUuid: string,
      public readonly targetType: string,
      public readonly channel: string,
      public readonly title: string,
      public readonly content: string,
      public readonly priority: number,
      private _status: 'pending' | 'sent' | 'failed' = 'pending',
      private _sentAt?: number,
      private _failureReason?: string
    ) {
      super();
      this.validate();
    }
    
    private validate(): void {
      if (this.priority < 1 || this.priority > 5) {
        throw new InvalidPriorityError('优先级必须在 1-5 之间');
      }
    }
    
    markAsSent(): void {
      this._status = 'sent';
      this._sentAt = Date.now();
      this.addDomainEvent(new NotificationSentEvent(this.uuid, this.channel));
    }
    
    markAsFailed(reason: string): void {
      this._status = 'failed';
      this._failureReason = reason;
      this.addDomainEvent(new NotificationFailedEvent(this.uuid, reason));
    }
  }
  ```

- [ ] **Day 3**: Application Service - NotificationDispatcherService
  ```typescript
  // packages/domain-server/src/application/notification/notification-dispatcher.service.ts
  import { notificationQueue } from '../../infrastructure/queue/notification-queue';
  
  export class NotificationDispatcherService {
    constructor(
      private notificationRepository: NotificationRepository,
      private taskRepository: TaskRepository
    ) {}
    
    /**
     * 分发通知到多个渠道
     */
    async dispatch(params: {
      targetUuid: string;
      targetType: string;
      channels: string[];
      title: string;
      content: string;
      priority: number;
      scheduledAt?: number;
    }): Promise<void> {
      // 为每个渠道创建通知实体
      const notifications = params.channels.map(channel => 
        new Notification(
          uuidv4(),
          'user-uuid',  // 从上下文获取
          params.targetUuid,
          params.targetType,
          channel,
          params.title,
          params.content,
          params.priority
        )
      );
      
      // 保存到数据库
      await this.notificationRepository.saveBatch(notifications);
      
      // 添加到 BullMQ 队列
      for (const notification of notifications) {
        await notificationQueue.add(
          'send-notification',
          {
            notificationUuid: notification.uuid,
            channel: notification.channel,
            title: notification.title,
            content: notification.content
          },
          {
            priority: 6 - params.priority,  // BullMQ: 数字越小优先级越高
            delay: params.scheduledAt ? params.scheduledAt - Date.now() : 0,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000
            }
          }
        );
      }
    }
    
    /**
     * 任务提醒（从 Sprint 2b Node-Cron 迁移）
     */
    async sendTaskReminder(taskUuid: string): Promise<void> {
      const task = await this.taskRepository.findByUuid(taskUuid);
      if (!task) return;
      
      await this.dispatch({
        targetUuid: taskUuid,
        targetType: 'task',
        channels: ['in_app', 'desktop'],
        title: '任务提醒',
        content: `任务 "${task.title}" 即将到期`,
        priority: task.importance  // 复用任务优先级
      });
    }
  }
  ```

**交付物**: ✅ 通知分发逻辑完成

---

#### **Day 4 (2026-01-15 周四): BullMQ Worker 实现**

**目标**: 完成多渠道 Worker (3 SP)

**任务清单**:
- [ ] **全天**: Worker 实现
  ```typescript
  // apps/api/src/workers/notification-worker.ts
  import { Worker, Job } from 'bullmq';
  import { notificationQueue } from '@dailyuse/domain-server';
  
  const worker = new Worker(
    'notifications',
    async (job: Job) => {
      const { notificationUuid, channel, title, content } = job.data;
      
      try {
        switch (channel) {
          case 'in_app':
            await sendInAppNotification(notificationUuid, title, content);
            break;
          case 'desktop':
            await sendDesktopNotification(notificationUuid, title, content);
            break;
          case 'email':
            await sendEmailNotification(notificationUuid, title, content);
            break;
        }
        
        // 标记为已发送
        const notification = await notificationRepository.findByUuid(notificationUuid);
        notification.markAsSent();
        await notificationRepository.save(notification);
        
      } catch (error) {
        // 标记为失败
        const notification = await notificationRepository.findByUuid(notificationUuid);
        notification.markAsFailed(error.message);
        await notificationRepository.save(notification);
        
        throw error;  // BullMQ 会自动重试
      }
    },
    {
      connection,
      concurrency: 5,  // 并发处理 5 个任务
      limiter: {
        max: 100,      // 每 10 秒最多 100 个
        duration: 10000
      }
    }
  );
  
  /**
   * 应用内通知（SSE）
   */
  async function sendInAppNotification(uuid: string, title: string, content: string): Promise<void> {
    // 通过 SSE 推送（从 Sprint 2b 复用）
    sseManager.broadcast('user-uuid', {
      type: 'notification',
      uuid,
      title,
      content
    });
  }
  
  /**
   * 桌面推送（Electron）
   */
  async function sendDesktopNotification(uuid: string, title: string, content: string): Promise<void> {
    // 调用 Desktop 应用的 IPC
    // 由 apps/desktop 处理
  }
  
  /**
   * 邮件通知（Nodemailer）
   */
  async function sendEmailNotification(uuid: string, title: string, content: string): Promise<void> {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'user-email',  // 从用户配置获取
      subject: title,
      text: content
    });
  }
  
  worker.on('completed', job => {
    console.log(`✅ Job ${job.id} completed`);
  });
  
  worker.on('failed', (job, error) => {
    console.error(`❌ Job ${job?.id} failed:`, error);
  });
  
  export default worker;
  ```

**交付物**: ✅ BullMQ Worker 完成

---

#### **Day 5 (2026-01-16 周五): Bull Board 监控面板**

**目标**: 集成 Bull Board UI (2 SP)

**任务清单**:
- [ ] **上午**: Bull Board 配置
  ```typescript
  // apps/api/src/server.ts
  import { createBullBoard } from '@bull-board/api';
  import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
  import { ExpressAdapter } from '@bull-board/express';
  
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');
  
  createBullBoard({
    queues: [new BullMQAdapter(notificationQueue)],
    serverAdapter
  });
  
  app.use('/admin/queues', serverAdapter.getRouter());
  ```

- [ ] **下午**: 测试监控面板
  - 访问 `http://localhost:3000/admin/queues`
  - 查看队列状态、作业列表、重试记录

**交付物**: ✅ Bull Board 可视化面板就绪

---

### **Week 14: 系统集成 + 部署准备**

#### **Day 6-7 (2026-01-19 ~ 2026-01-20): 系统集成**

**目标**: 集成通知系统到现有模块 (2 SP)

**任务清单**:
- [ ] **Day 6**: 迁移 Sprint 2b Node-Cron 到 BullMQ
  - 任务提醒 → NotificationDispatcherService
  - 目标提醒 → NotificationDispatcherService
  
- [ ] **Day 7**: 集成到 Sprint 5 智能提醒
  - `SmartReminderService.sendReminder()` 调用 `NotificationDispatcherService`

**交付物**: ✅ 通知系统与所有模块集成完成

---

#### **Day 8 (2026-01-21 周三): E2E 测试**

**目标**: 全链路测试

**任务清单**:
- [ ] 创建任务 → 设置提醒 → 触发提醒 → 多渠道分发
- [ ] 测试 BullMQ 重试机制
- [ ] 测试 Bull Board 监控

**交付物**: ✅ E2E 测试通过

---

#### **Day 9 (2026-01-22 周四): 部署准备**

**目标**: 生产环境配置

**任务清单**:
- [ ] Redis 持久化配置（AOF + RDB）
- [ ] BullMQ Worker 部署策略（PM2）
- [ ] 环境变量文档
- [ ] 部署脚本

**交付物**: ✅ 部署文档完成

---

#### **Day 10 (2026-01-23 周五): Sprint Review + Retrospective**

**目标**: Sprint 6 回顾 + 整体复盘

---

## 📊 Sprint 统计

- **NOTIFICATION-001**: 15 SP (7 Stories)
- **系统集成**: 包含在各 Story 中

---

## ✅ Definition of Done

同 Sprint 3，详见 [sprint-03-plan.md](./sprint-03-plan.md)

**额外要求**:
- ✅ Bull Board 监控面板可访问
- ✅ BullMQ Worker 稳定运行
- ✅ Redis 持久化配置验证

---

## 🚨 风险管理

| 风险 | 概率 | 影响 | 缓解策略 |
|------|------|------|---------|
| BullMQ 学习曲线 | 低 | 中 | Sprint 2b Spike 已验证 |
| Redis 单点故障 | 中 | 高 | Redis Sentinel / Cluster（后续）|
| 邮件发送限流 | 低 | 低 | 速率限制 + 队列缓冲 |

---

## 🎯 Sprint 6 里程碑意义

**✅ 第一阶段开发完成**:
- Sprint 1-6 共 182 SP
- 10 个核心 Epic 全部实现
- DDD 8 层架构完整落地

**🚀 下一阶段预告**:
- 性能优化
- 安全加固
- 可观测性提升

---

## 📚 参考文档

- [Epic: NOTIFICATION-001](../epics/epic-notification-001-multi-channel-aggregation.md)
- [ADR-003: BullMQ 技术决策](../../architecture/adr/ADR-003-bullmq-selection.md)
- [Sprint 2b: Node-Cron 实现](./sprint-02b-plan.md)
- [PM 阶段总结](../PM_PHASE_SUMMARY.md)

---

**Sprint 计划创建于**: 2025-10-21  
**前置条件**: Sprint 5 完成  
**下一步**: Production Deployment

---

*祝 Sprint 6 圆满成功！🎉*
