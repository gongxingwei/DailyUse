# 技术决策记录 (ADR)

> **文档类型**: Architecture Decision Record  
> **创建日期**: 2025-10-21  
> **状态**: 已批准  
> **决策者**: Tech Lead + PM

---

## 目录

1. [ADR-001: Sprint 2 容量拆分](#adr-001-sprint-2-容量拆分)
2. [ADR-002: DAG 可视化技术选型](#adr-002-dag-可视化技术选型)
3. [ADR-003: 消息队列技术选型](#adr-003-消息队列技术选型)

---

## ADR-001: Sprint 2 容量拆分

### 状态

✅ **已批准** (2025-10-21)

### 背景

根据 PM_PHASE_SUMMARY.md 的风险评估，Sprint 2 原计划包含两个 Epic：

- **GOAL-002**: KR 权重快照 (25 SP)
- **GOAL-003**: 专注周期聚焦模式 (23 SP)
- **总计**: 48 SP

**问题**:

- 标准 Sprint 容量为 **25-35 SP** (2-3 人团队，2 周)
- 48 SP 超出标准容量 **37%-92%**
- 高风险导致 Sprint 失败或质量下降

### 决策

**拆分 Sprint 2 为两个独立 Sprint**:

#### Sprint 2a (Week 3-4)

- **Epic**: GOAL-002 - KR 权重快照
- **Story Points**: 25 SP
- **Sprint 目标**: 实现 KR 权重变更的完整快照和时间旅行功能
- **依赖**: Sprint 1 (SETTING-001) 完成

#### Sprint 2b (Week 5-6)

- **Epic**: GOAL-003 - 专注周期聚焦模式
- **Story Points**: 23 SP
- **Sprint 目标**: 实现临时聚焦模式，屏蔽非核心目标
- **依赖**: Sprint 2a 完成 (需要 Goal 基础架构)

### 理由

**容量管理**:

- Sprint 2a: 25 SP → 符合 2 人团队标准容量
- Sprint 2b: 23 SP → 符合 2 人团队标准容量
- 风险降低: 从 **高风险 (P0)** 降至 **中低风险 (P1)**

**技术依赖**:

- GOAL-003 需要 Goal 实体和 Repository 层
- GOAL-002 提供了完整的 Goal 模块基础架构
- 顺序执行可减少并行开发冲突

**团队效率**:

- 避免上下文切换
- 每个 Sprint 聚焦单一 Epic，提升质量
- 更清晰的验收标准

**备选方案（已拒绝）**:

| 方案                    | 优点               | 缺点                            | 决策        |
| ----------------------- | ------------------ | ------------------------------- | ----------- |
| 压缩 GOAL-003 到 MVP    | 可保持合并 Sprint  | 功能不完整，技术债务高          | ❌ 拒绝     |
| 增加团队成员            | 提升容量           | 招聘/培训成本高，沟通复杂度增加 | ❌ 拒绝     |
| 延长 Sprint 周期到 3 周 | 容量增加           | 违反 Scrum 标准，反馈周期过长   | ❌ 拒绝     |
| **拆分为两个 Sprint**   | 容量合理，风险可控 | Sprint 数量增加 1 个            | ✅ **采纳** |

### 影响

**Sprint 时间线调整**:

```
原计划:
Sprint 1 (Week 1-2): SETTING-001
Sprint 2 (Week 3-4): GOAL-002 + GOAL-003  ← 48 SP 超载
Sprint 3 (Week 5-6): GOAL-004 + TASK-002

调整后:
Sprint 1  (Week 1-2):  SETTING-001            (23 SP)
Sprint 2a (Week 3-4):  GOAL-002               (25 SP) ✅
Sprint 2b (Week 5-6):  GOAL-003               (23 SP) ✅
Sprint 3  (Week 7-8):  GOAL-004 + TASK-002    (30 SP)
Sprint 4  (Week 9-10): TASK-001 + TASK-006    (33 SP)
Sprint 5  (Week 11-12):SCHEDULE-001 + REMINDER-001 (33 SP)
Sprint 6  (Week 13-14):NOTIFICATION-001       (15 SP)
```

**总工期**: 从 12 周延长到 **14 周** (+2 周)

**正面影响**:

- ✅ 降低 Sprint 失败风险
- ✅ 提升代码质量
- ✅ 减少团队压力
- ✅ 更清晰的里程碑

**负面影响**:

- ❌ 项目工期延长 2 周
- ❌ Sprint 数量从 6 个增加到 7 个

### 验证

**成功标准**:

- Sprint 2a 完成率 ≥ 90%
- Sprint 2b 完成率 ≥ 90%
- 无 P0/P1 Bug 遗留
- 团队反馈积极

---

## ADR-002: DAG 可视化技术选型

### 状态

✅ **已批准** (2025-10-21)

### 背景

**Epic**: TASK-001 - 任务依赖图 (18 SP, Sprint 4)

**需求**:

- 可视化任务依赖关系 (有向无环图 DAG)
- 支持 1000+ 节点的大规模图形
- 自动检测循环依赖
- 计算关键路径
- 支持拖拽和交互式编辑
- Vue 3 技术栈兼容

### 决策

**采用 graphlib + React Flow (Vue 适配) 技术栈**:

#### 核心库

1. **graphlib** (图算法库)
   - 用途: 拓扑排序、循环检测、最长路径算法
   - 版本: ^2.1.8
   - 许可证: MIT

2. **@vue-flow/core** (Vue 3 流程图组件)
   - 用途: 节点渲染、边连接、拖拽交互
   - 版本: ^1.26.0
   - 许可证: MIT

3. **dagre** (布局算法)
   - 用途: 自动计算节点位置 (层次化布局)
   - 版本: ^0.8.5
   - 许可证: MIT

### 技术栈对比

| 库                      | 优点                                            | 缺点                                 | 评分       |
| ----------------------- | ----------------------------------------------- | ------------------------------------ | ---------- |
| **graphlib**            | ✅ 成熟稳定<br>✅ 算法完整<br>✅ 轻量 (20KB)    | ⚠️ 无 UI 层                          | ⭐⭐⭐⭐⭐ |
| **@vue-flow/core**      | ✅ Vue 3 原生支持<br>✅ 易用性高<br>✅ 社区活跃 | ⚠️ 性能待验证                        | ⭐⭐⭐⭐⭐ |
| **dagre**               | ✅ 布局算法优秀<br>✅ 与 graphlib 配合          | ⚠️ 不支持增量布局                    | ⭐⭐⭐⭐   |
| **Cytoscape.js** (备选) | ✅ 功能强大<br>✅ 布局算法丰富                  | ❌ 学习曲线陡峭<br>❌ 体积大 (500KB) | ⭐⭐⭐⭐   |
| **D3.js** (备选)        | ✅ 灵活性极高<br>✅ 生态丰富                    | ❌ 需要大量定制<br>❌ 开发成本高     | ⭐⭐⭐     |

### 架构设计

```typescript
// Backend: 图算法服务 (使用 graphlib)
import { Graph, alg } from 'graphlib';

export class DependencyGraphService {
  /**
   * 检测循环依赖 (DFS)
   */
  detectCircularDependency(
    taskUuid: string,
    newDependencyUuid: string,
    allDependencies: TaskDependency[],
  ): string[] | null {
    const graph = new Graph();

    // 构建图
    allDependencies.forEach((dep) => {
      graph.setEdge(dep.taskUuid, dep.dependsOnTaskUuid);
    });
    graph.setEdge(taskUuid, newDependencyUuid);

    // 检测循环
    const cycles = alg.findCycles(graph);
    return cycles.length > 0 ? cycles[0] : null;
  }

  /**
   * 拓扑排序
   */
  topologicalSort(tasks: Task[], dependencies: TaskDependency[]): string[] {
    const graph = new Graph();

    tasks.forEach((task) => graph.setNode(task.uuid));
    dependencies.forEach((dep) => {
      graph.setEdge(dep.dependsOnTaskUuid, dep.taskUuid);
    });

    return alg.topsort(graph);
  }

  /**
   * 计算关键路径 (最长路径)
   */
  findCriticalPath(tasks: Task[], dependencies: TaskDependency[]): string[] {
    // 使用 Bellman-Ford 算法变体
    // 详见 EPIC-TASK-001 文档
  }
}

// Frontend: Vue Flow 可视化 (使用 @vue-flow/core)
import { VueFlow } from '@vue-flow/core';
import dagre from 'dagre';

export function useDependencyGraphLayout(graphData: DependencyGraph) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setGraph({ rankdir: 'TB', ranksep: 100, nodesep: 80 });
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // 添加节点
  graphData.nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 200, height: 80 });
  });

  // 添加边
  graphData.edges.forEach((edge) => {
    dagreGraph.setEdge(edge.from, edge.to);
  });

  // 计算布局
  dagre.layout(dagreGraph);

  // 返回 Vue Flow 格式
  return {
    nodes: graphData.nodes.map((node) => ({
      id: node.id,
      type: 'task',
      position: dagreGraph.node(node.id),
      data: node,
    })),
    edges: graphData.edges.map((edge) => ({
      id: `${edge.from}-${edge.to}`,
      source: edge.from,
      target: edge.to,
      type: 'smoothstep',
    })),
  };
}
```

### 性能基准

**目标**:

- 100 节点: 渲染 < 200ms
- 500 节点: 渲染 < 500ms
- 1000 节点: 渲染 < 1s

**优化策略**:

1. 虚拟滚动 (大规模图形)
2. 增量渲染 (仅渲染可见区域)
3. Web Worker (布局计算后台执行)
4. Canvas 渲染 (1000+ 节点时降级)

### 技术 Spike 计划

**Sprint 2a-2b 期间执行**:

**Week 1 (Sprint 2a)**:

- [ ] 安装依赖: `pnpm add graphlib @vue-flow/core dagre`
- [ ] 创建 Proof of Concept (100 节点 DAG)
- [ ] 测试循环检测算法准确性
- [ ] 测试关键路径算法正确性

**Week 2 (Sprint 2b)**:

- [ ] 性能基准测试 (100/500/1000 节点)
- [ ] 评估 Vue Flow vs Cytoscape.js
- [ ] 原型集成到 Task 模块
- [ ] 决策最终方案 (Go/No-Go)

**成功标准**:

- ✅ 循环检测 100% 准确
- ✅ 100 节点渲染 < 200ms
- ✅ Vue 3 集成无兼容性问题
- ✅ 团队反馈积极

### 备选方案 (Fallback)

如果 React Flow (Vue 适配) 性能不达标:

- **Plan B**: 使用 Cytoscape.js (性能更强，但学习成本高)
- **Plan C**: 使用 D3.js 完全自定义 (灵活性最高，但开发成本最高)

---

## ADR-003: 消息队列技术选型

### 状态

✅ **已批准** (2025-10-21)

### 背景

**Epic**: NOTIFICATION-001 - 多渠道通知聚合 (15 SP, Sprint 6)

**需求**:

- 支持多渠道推送 (应用内 + 桌面 + 邮件)
- 保证消息可靠性 (99.9% 送达率)
- 支持重试机制 (失败自动重试)
- 支持延迟发送 (定时任务)
- 支持优先级队列
- 支持消息持久化 (防止丢失)

**问题**:

- 直接 HTTP 推送不可靠 (网络故障、服务重启)
- 邮件发送耗时长 (阻塞主流程)
- 无法处理高并发通知 (1000+ 通知/分钟)

### 决策

**采用 BullMQ + Redis 技术栈**:

#### 核心库

1. **BullMQ** (消息队列)
   - 用途: 任务队列、延迟任务、重试机制
   - 版本: ^5.0.0
   - 许可证: MIT
   - 理由: Bull 的升级版，TypeScript 原生支持

2. **Redis** (消息存储)
   - 用途: 队列存储、消息持久化
   - 版本: ^7.0
   - 许可证: BSD
   - 理由: 高性能，已在技术栈中

3. **ioredis** (Redis 客户端)
   - 用途: Node.js Redis 客户端
   - 版本: ^5.3.0
   - 许可证: MIT

### 技术栈对比

| 库                  | 优点                                             | 缺点                                     | 评分       |
| ------------------- | ------------------------------------------------ | ---------------------------------------- | ---------- |
| **BullMQ**          | ✅ TypeScript 原生<br>✅ 功能完整<br>✅ 社区活跃 | ⚠️ 需要 Redis                            | ⭐⭐⭐⭐⭐ |
| **Bull**            | ✅ 成熟稳定<br>✅ 文档丰富                       | ❌ JavaScript 为主<br>⚠️ BullMQ 是继任者 | ⭐⭐⭐⭐   |
| **Bee-Queue**       | ✅ 简单易用<br>✅ 性能高                         | ❌ 功能有限<br>❌ 不支持延迟任务         | ⭐⭐⭐     |
| **RabbitMQ** (备选) | ✅ 功能强大<br>✅ 企业级                         | ❌ 部署复杂<br>❌ 资源占用高             | ⭐⭐⭐⭐   |
| **AWS SQS** (备选)  | ✅ 云原生<br>✅ 零运维                           | ❌ 厂商锁定<br>❌ 成本高                 | ⭐⭐⭐     |

### 架构设计

```typescript
// Backend: 通知队列服务 (使用 BullMQ)
import { Queue, Worker, QueueScheduler } from 'bullmq';
import { Redis } from 'ioredis';

// 创建 Redis 连接
const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  maxRetriesPerRequest: null,
});

// 创建通知队列
export const notificationQueue = new Queue('notifications', {
  connection,
  defaultJobOptions: {
    attempts: 3, // 最多重试 3 次
    backoff: {
      type: 'exponential', // 指数退避
      delay: 5000, // 初始延迟 5 秒
    },
    removeOnComplete: {
      age: 7 * 24 * 3600, // 保留 7 天
      count: 1000, // 最多 1000 条
    },
    removeOnFail: {
      age: 30 * 24 * 3600, // 失败记录保留 30 天
    },
  },
});

// 创建 Worker (消费队列)
export const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    const { userId, type, title, content, channels, priority } = job.data;

    // 多渠道推送
    const results = await Promise.allSettled([
      channels.includes('in_app') ? sendInAppNotification(userId, { title, content }) : null,
      channels.includes('desktop_push') ? sendDesktopPush(userId, { title, content }) : null,
      channels.includes('email') ? sendEmail(userId, { title, content }) : null,
    ]);

    // 记录结果
    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      throw new Error(`${failures.length} 个渠道推送失败`);
    }

    return { success: true, channels: results.length };
  },
  {
    connection,
    concurrency: 10, // 并发 10 个任务
    limiter: {
      max: 100, // 每 10 秒最多 100 个任务
      duration: 10000,
    },
  },
);

// Application Service 使用队列
export class NotificationService {
  async create(params: CreateNotificationParams): Promise<void> {
    // 保存到数据库
    const notification = await this.repo.save(params);

    // 添加到队列 (异步处理)
    await notificationQueue.add(
      'send-notification',
      {
        notificationId: notification.uuid,
        userId: params.userId,
        type: params.type,
        title: params.title,
        content: params.content,
        channels: params.channels,
        priority: params.priority,
      },
      {
        priority: this.getPriorityLevel(params.priority), // 高优先级任务优先处理
        delay: params.sendAt ? params.sendAt - Date.now() : 0, // 定时发送
      },
    );
  }

  private getPriorityLevel(priority: NotificationPriority): number {
    return {
      urgent: 1,
      high: 2,
      medium: 3,
      low: 4,
    }[priority];
  }
}
```

### 功能特性

**核心功能**:

1. ✅ **消息持久化**: Redis AOF + RDB
2. ✅ **重试机制**: 指数退避，最多 3 次
3. ✅ **延迟发送**: 支持定时任务 (sendAt 参数)
4. ✅ **优先级队列**: 紧急通知优先处理
5. ✅ **并发控制**: 限流 (100 任务/10 秒)
6. ✅ **死信队列**: 失败任务自动移至 DLQ
7. ✅ **监控仪表板**: Bull Board UI

**高级功能** (后续扩展):

- 消息去重 (基于 hash)
- 消费者组 (多实例部署)
- 速率限制 (防止用户疲劳)
- Metrics 集成 (Prometheus)

### 部署架构

```
┌─────────────────────────────────────────┐
│  Application Server (Express)           │
│  ┌─────────────────────────────────┐   │
│  │ NotificationService             │   │
│  │  └─> notificationQueue.add()    │   │
│  └─────────────────────────────────┘   │
└──────────────┬──────────────────────────┘
               │ (Push Job)
               ↓
┌─────────────────────────────────────────┐
│  Redis (Message Broker)                 │
│  ┌─────────────────────────────────┐   │
│  │ Queue: notifications             │   │
│  │  - Job 1 (priority: urgent)      │   │
│  │  - Job 2 (priority: high)        │   │
│  │  - Job 3 (delayed: 1h)           │   │
│  └─────────────────────────────────┘   │
└──────────────┬──────────────────────────┘
               │ (Consume Job)
               ↓
┌─────────────────────────────────────────┐
│  Worker Process (BullMQ Worker)         │
│  ┌─────────────────────────────────┐   │
│  │ notificationWorker.process()     │   │
│  │  ├─> sendInAppNotification()     │   │
│  │  ├─> sendDesktopPush()           │   │
│  │  └─> sendEmail()                 │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### 技术 Spike 计划

**Sprint 4-5 期间执行**:

**Week 1 (Sprint 4)**:

- [ ] 安装依赖: `pnpm add bullmq ioredis`
- [ ] 配置 Redis (本地 + Staging)
- [ ] 创建 Proof of Concept (基础队列)
- [ ] 测试重试机制 (模拟失败)
- [ ] 测试延迟任务

**Week 2 (Sprint 5 前)**:

- [ ] 性能基准测试 (1000+ 通知/分钟)
- [ ] 部署 Bull Board (监控 UI)
- [ ] 集成 Prometheus Metrics
- [ ] 决策 Bull vs BullMQ (最终确认)

**成功标准**:

- ✅ 消息送达率 ≥ 99.9%
- ✅ 重试机制 100% 可靠
- ✅ 延迟任务精度 ±5 秒
- ✅ 性能满足 1000+ 通知/分钟

### Redis 配置

**本地开发**:

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
```

**生产环境**:

- 使用 Redis Sentinel (高可用)
- 启用 AOF 持久化
- 配置内存淘汰策略 (allkeys-lru)
- 监控 Redis 性能 (内存使用、连接数)

### 备选方案 (Fallback)

如果 BullMQ 性能或可靠性不达标:

- **Plan B**: 使用 RabbitMQ (更强大，但部署复杂)
- **Plan C**: 使用 AWS SQS (云原生，但厂商锁定)
- **Plan D**: 使用 Kafka (大数据场景，但过度设计)

---

## 技术决策总结表

| 决策          | 技术选型                          | 状态      | Spike 时间   | 使用 Sprint  |
| ------------- | --------------------------------- | --------- | ------------ | ------------ |
| Sprint 2 拆分 | Sprint 2a + 2b                    | ✅ 已批准 | -            | Sprint 2a-2b |
| DAG 可视化    | graphlib + @vue-flow/core + dagre | ✅ 已批准 | Sprint 2a-2b | Sprint 4     |
| 消息队列      | BullMQ + Redis                    | ✅ 已批准 | Sprint 4-5   | Sprint 6     |

---

## 下一步行动

### 立即行动 (本周)

1. ✅ 更新 Sprint 时间线 (PM_PHASE_SUMMARY.md)
2. ✅ 创建 Sprint 2a 和 Sprint 2b 计划文档
3. [ ] 与团队同步技术决策
4. [ ] 更新 package.json 依赖清单

### Sprint 1 期间

- [ ] 准备 Sprint 2a Backlog
- [ ] 准备技术 Spike 环境 (Redis Docker)

### Sprint 2a-2b 期间

- [ ] 执行 DAG 可视化技术 Spike
- [ ] 评估性能并确认最终方案

### Sprint 4-5 期间

- [ ] 执行消息队列技术 Spike
- [ ] 部署 Bull Board 监控面板

---

_文档创建: 2025-10-21_  
_决策者: Tech Lead + PM_  
_下次审查: Sprint 2 Retrospective_
