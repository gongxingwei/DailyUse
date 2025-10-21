# Feature Spec: 任务依赖关系

> **功能编号**: TASK-006  
> **RICE 评分**: 171.5 (Reach: 7, Impact: 7, Confidence: 7, Effort: 2)  
> **优先级**: P1  
> **预估时间**: 1.5-2 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 背景与痛点

复杂项目中，任务之间存在依赖关系，但现有工具普遍存在问题：
- ❌ 无法明确表达任务间的前后依赖
- ❌ 依赖任务未完成时，后续任务无法被阻止
- ❌ 缺少依赖链路可视化
- ❌ 无法自动调整依赖任务的截止日期
- ❌ 循环依赖无法检测

### 目标用户

- **主要用户**: 管理复杂项目的项目经理和团队
- **次要用户**: 需要任务协调的个人用户
- **典型画像**: "我的任务 B 依赖任务 A，但系统不知道，导致我经常提前开始 B 而 A 还没完成"

### 价值主张

**一句话价值**: 建立任务依赖关系，自动阻塞和提醒，确保任务按正确顺序执行

**核心收益**:
- ✅ 定义任务依赖关系（A→B）
- ✅ 自动检测循环依赖
- ✅ 依赖任务未完成时阻塞后续任务
- ✅ 依赖链路可视化（甘特图）
- ✅ 自动调整截止日期建议

---

## 2. 用户价值与场景

### 核心场景 1: 创建任务依赖

**场景描述**:  
用户为任务 B 设置依赖任务 A（B depends on A）。

**用户故事**:
```gherkin
As a 项目管理者
I want 设置任务依赖关系
So that 明确任务的执行顺序
```

**操作流程**:
1. 用户打开任务 B "前端开发"详情页
2. 点击"添加依赖"：
   ```
   任务详情: 前端开发
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   状态: TODO
   优先级: HIGH
   截止日期: 2025-11-01
   
   📌 依赖关系
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   此任务依赖以下任务完成：
   (暂无)
   
   [+ 添加依赖任务]
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   以下任务依赖此任务：
   (暂无)
   ```

3. 点击"添加依赖任务"，弹出选择器：
   ```
   添加依赖任务
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   搜索任务...
   
   推荐任务（同项目）：
   ☐ API 接口开发 (IN_PROGRESS)
      截止: 2025-10-28
      
   ☐ 数据库设计 (COMPLETED)
      完成于: 2025-10-15
      
   ☐ UI 设计评审 (TODO)
      截止: 2025-10-25
   
   依赖类型：
   🔘 必须完成（阻塞型）
      前置任务未完成时，此任务无法开始
   ⚪ 建议完成（提醒型）
      前置任务未完成时，仅提醒但不阻止
   
   [确认]  [取消]
   ```

4. 用户选择"API 接口开发"和"UI 设计评审"
5. 选择"必须完成（阻塞型）"
6. 点击"确认"
7. 系统创建依赖关系：
   ```typescript
   [
     {
       uuid: 'dep-1',
       dependentTaskUuid: 'task-frontend',      // 前端开发
       dependencyTaskUuid: 'task-api',          // API 接口开发
       dependencyType: 'blocking',
       status: 'active'
     },
     {
       uuid: 'dep-2',
       dependentTaskUuid: 'task-frontend',
       dependencyTaskUuid: 'task-ui-design',    // UI 设计评审
       dependencyType: 'blocking',
       status: 'active'
     }
   ]
   ```

8. 任务详情更新显示：
   ```
   📌 依赖关系
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   此任务依赖以下任务完成：
   
   🔴 API 接口开发 (IN_PROGRESS)
      截止: 2025-10-28
      进度: 60%
      ⚠️ 未完成，此任务被阻塞
      [查看任务]
   
   🟡 UI 设计评审 (TODO)
      截止: 2025-10-25
      ⚠️ 未完成，此任务被阻塞
      [查看任务]
   
   💡 建议调整截止日期至 2025-10-29
      (API 接口开发预计 10-28 完成)
   [应用建议]
   ```

**预期结果**:
- 成功创建依赖关系
- 显示依赖任务状态
- 提供截止日期调整建议

---

### 核环场景 2: 依赖阻塞检测

**场景描述**:  
用户尝试开始被依赖阻塞的任务，系统提示无法执行。

**用户故事**:
```gherkin
As a 用户
I want 被依赖阻塞时无法开始任务
So that 确保按正确顺序执行
```

**操作流程**:
1. 用户尝试将"前端开发"状态改为"IN_PROGRESS"
2. 系统检测到依赖未满足：
   ```typescript
   function canStartTask(task: Task): { allowed: boolean; reason?: string } {
     const dependencies = task.dependencies.filter(d => d.dependencyType === 'blocking');
     
     const unfinished = dependencies.filter(
       d => d.dependencyTask.status !== TaskStatus.COMPLETED
     );
     
     if (unfinished.length > 0) {
       return {
         allowed: false,
         reason: `以下 ${unfinished.length} 个依赖任务尚未完成`
       };
     }
     
     return { allowed: true };
   }
   ```

3. 弹出阻塞提示：
   ```
   ⚠️ 无法开始任务
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   "前端开发" 被以下任务阻塞：
   
   🔴 API 接口开发 (IN_PROGRESS)
      负责人: 张三
      预计完成: 2025-10-28
      当前进度: 60%
      [提醒负责人]
   
   🔴 UI 设计评审 (TODO)
      负责人: 李四
      预计完成: 2025-10-25
      ⚠️ 尚未开始
      [提醒负责人]
   
   你可以：
   [查看依赖任务]  [移除依赖关系]  [仍然开始（不推荐）]
   ```

4. 用户选择查看"API 接口开发"
5. 跳转到依赖任务详情页
6. 如果用户是依赖任务的负责人，显示提示：
   ```
   💡 任务优先级提醒
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   "前端开发" 正在等待您完成 "API 接口开发"
   
   建议优先处理此任务
   
   [开始任务]  [稍后处理]
   ```

**预期结果**:
- 阻止未满足依赖的任务开始
- 清晰提示阻塞原因
- 提供查看和提醒选项

---

### 核心场景 3: 循环依赖检测

**场景描述**:  
用户尝试创建循环依赖（A→B→C→A），系统检测并阻止。

**用户故事**:
```gherkin
As a 用户
I want 系统阻止循环依赖
So that 避免逻辑错误
```

**操作流程**:
1. 当前依赖关系：
   ```
   任务 A "需求分析" → 任务 B "设计方案"
   任务 B "设计方案" → 任务 C "原型制作"
   ```

2. 用户尝试为任务 A 添加依赖任务 C：
   ```
   任务 C "原型制作" → 任务 A "需求分析"
   ```

3. 系统执行循环检测：
   ```typescript
   function detectCycle(
     newDependency: { dependent: string; dependency: string }
   ): { hasCycle: boolean; path?: string[] } {
     // 构建依赖图
     const graph = buildDependencyGraph();
     
     // 添加新边
     graph.addEdge(newDependency.dependency, newDependency.dependent);
     
     // DFS 检测环
     const visited = new Set();
     const recStack = new Set();
     
     function dfs(node: string, path: string[]): boolean {
       visited.add(node);
       recStack.add(node);
       path.push(node);
       
       for (const neighbor of graph.getNeighbors(node)) {
         if (!visited.has(neighbor)) {
           if (dfs(neighbor, path)) return true;
         } else if (recStack.has(neighbor)) {
           // 发现环
           path.push(neighbor);
           return true;
         }
       }
       
       recStack.delete(node);
       path.pop();
       return false;
     }
     
     const path: string[] = [];
     if (dfs(newDependency.dependency, path)) {
       return { hasCycle: true, path };
     }
     
     return { hasCycle: false };
   }
   ```

4. 检测到循环，弹出警告：
   ```
   ⚠️ 检测到循环依赖
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   无法添加此依赖关系，将导致循环依赖：
   
   需求分析 → 设计方案 → 原型制作 → 需求分析
      ↑                              ↓
      └──────────────────────────────┘
   
   循环依赖会导致任务无法正常执行。
   
   建议：
   • 重新评估任务之间的关系
   • 将 "原型制作" 的输出作为 "需求分析" 的输入（而非依赖）
   
   [取消添加]  [查看依赖图]
   ```

5. 用户点击"查看依赖图"
6. 显示可视化依赖关系图，高亮循环路径

**预期结果**:
- 自动检测循环依赖
- 阻止循环依赖创建
- 可视化循环路径
- 提供解决建议

---

### 核心场景 4: 依赖链路可视化（甘特图）

**场景描述**:  
用户查看项目中所有任务的依赖关系和时间线。

**用户故事**:
```gherkin
As a 项目管理者
I want 查看任务依赖的甘特图
So that 了解项目整体进度和关键路径
```

**操作流程**:
1. 用户打开项目详情页
2. 点击"依赖视图"标签
3. 系统渲染甘特图：
   ```
   项目: Q4 产品开发
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   任务                    10-15  10-20  10-25  10-30  11-05
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   需求分析 ✓              ████
                            ↓
   设计方案 🔄                   █████
                                  ↓
   UI 设计评审 ⏳                      ███
                                        ↓
   API 接口开发 🔄                 ████████
                                        ↓
   前端开发 ⏳                              ███████
                                                  ↓
   测试 ⏳                                            ████
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   图例：
   ✓ 已完成  🔄 进行中  ⏳ 未开始  → 依赖关系
   
   关键路径（最长路径）：
   需求分析 → 设计方案 → API 开发 → 前端开发 → 测试
   预计完成日期: 2025-11-05
   
   ⚠️ 风险提示：
   "API 接口开发" 进度延迟 2 天，可能影响整体交付
   
   [调整计划]  [导出甘特图]  [切换到网络图]
   ```

4. 用户点击"切换到网络图"
5. 显示任务依赖网络图：
   ```
          ┌─────────────┐
          │  需求分析   │
          └──────┬──────┘
                 ↓
          ┌──────────────┐
          │   设计方案   │
          └───┬──────┬───┘
              ↓      ↓
     ┌─────────┐  ┌──────────────┐
     │UI设计评审│  │ API 接口开发 │
     └────┬────┘  └──────┬───────┘
          │              │
          └──────┬───────┘
                 ↓
          ┌──────────────┐
          │   前端开发   │
          └──────┬───────┘
                 ↓
          ┌──────────────┐
          │     测试     │
          └──────────────┘
   ```

**预期结果**:
- 甘特图显示时间线
- 网络图显示依赖拓扑
- 高亮关键路径
- 风险提示

---

### 核心场景 5: 自动截止日期调整建议

**场景描述**:  
依赖任务完成时间变更，系统建议调整后续任务截止日期。

**用户故事**:
```gherkin
As a 项目管理者
I want 自动获得截止日期调整建议
So that 保持计划合理性
```

**操作流程**:
1. 当前状态：
   ```
   任务 A "API 开发" (依赖任务)
   - 原截止日期: 2025-10-28
   - 当前进度: 40%
   - 预计延期至: 2025-10-30
   
   任务 B "前端开发" (依赖 A)
   - 截止日期: 2025-11-01
   - 预留缓冲: 2 天
   ```

2. 用户将任务 A 截止日期延期到 10-30
3. 系统检测到下游任务受影响：
   ```typescript
   function analyzeImpact(changedTask: Task): ImpactAnalysis {
     const downstream = findDownstreamTasks(changedTask);
     const impacted: Task[] = [];
     
     for (const task of downstream) {
       const earliestStart = calculateEarliestStart(task);
       const buffer = task.dueTime - earliestStart - task.estimatedDuration;
       
       if (buffer < MIN_BUFFER) {
         impacted.push(task);
       }
     }
     
     return {
       impactedTasks: impacted,
       suggestions: generateSuggestions(impacted, changedTask)
     };
   }
   ```

4. 系统弹出调整建议：
   ```
   📅 截止日期影响分析
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   "API 开发" 的截止日期变更将影响以下任务：
   
   🔴 前端开发 (HIGH)
      当前截止: 2025-11-01
      原缓冲时间: 2 天
      剩余缓冲: 0 天 ⚠️ 不足
      
      建议调整至: 2025-11-03 (+2 天)
      理由：保留 2 天缓冲时间
      
   🟡 测试 (MEDIUM)
      当前截止: 2025-11-05
      原缓冲时间: 3 天
      剩余缓冲: 1 天 ⚠️ 偏紧
      
      建议调整至: 2025-11-07 (+2 天)
      理由：保持原有缓冲时间
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   整体影响：
   项目交付日期将从 11-05 延期至 11-07
   
   [应用全部建议]  [逐个调整]  [忽略]
   ```

5. 用户点击"应用全部建议"
6. 系统批量更新截止日期并通知相关人员：
   ```
   ✅ 截止日期已调整
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   已更新 2 个任务的截止日期：
   • 前端开发: 11-01 → 11-03
   • 测试: 11-05 → 11-07
   
   已通知相关负责人：
   • 张三 (前端开发)
   • 李四 (测试)
   
   [查看更新后的甘特图]
   ```

**预期结果**:
- 自动检测下游影响
- 计算合理的调整建议
- 支持批量应用
- 通知相关人员

---

### 核心场景 6: 依赖完成自动通知

**场景描述**:  
依赖任务完成时，自动通知等待的任务负责人。

**用户故事**:
```gherkin
As a 任务负责人
I want 依赖任务完成时收到通知
So that 我可以及时开始我的任务
```

**操作流程**:
1. 用户（张三）将任务 A "API 开发"标记为完成
2. 系统检测到下游任务：
   ```typescript
   async function handleTaskCompleted(taskUuid: string): Promise<void> {
     const task = await this.taskRepository.findByUuid(taskUuid);
     
     // 查找所有依赖此任务的任务
     const dependentTasks = await this.taskRepository.findDependentTasks(taskUuid);
     
     for (const dependentTask of dependentTasks) {
       // 检查所有依赖是否已完成
       const allDependenciesMet = dependentTask.dependencies.every(
         d => d.dependencyTask.status === TaskStatus.COMPLETED
       );
       
       if (allDependenciesMet) {
         // 发送通知
         await this.notificationService.create({
           userId: dependentTask.assigneeId,
           type: 'task_dependencies_met',
           title: '任务可以开始了',
           content: `"${dependentTask.title}" 的所有依赖任务已完成`,
           priority: 'MEDIUM',
           actionUrl: `/tasks/${dependentTask.uuid}`
         });
         
         // 更新任务状态
         dependentTask.unblock();
         await this.taskRepository.save(dependentTask);
       }
     }
   }
   ```

3. 负责人（李四）收到通知：
   ```
   📬 新通知
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🎉 任务可以开始了
   
   "前端开发" 的所有依赖任务已完成：
   ✓ API 接口开发 (刚刚完成)
   ✓ UI 设计评审 (2天前完成)
   
   您现在可以开始这个任务了！
   
   [开始任务]  [稍后处理]
   ```

4. 用户点击"开始任务"
5. 任务状态自动更新为 IN_PROGRESS
6. 任务详情页显示：
   ```
   任务详情: 前端开发
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   状态: IN_PROGRESS  (刚刚更新)
   
   📌 依赖关系
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   此任务依赖以下任务完成：
   
   ✅ API 接口开发 (COMPLETED)
      完成于: 2025-10-30
   
   ✅ UI 设计评审 (COMPLETED)
      完成于: 2025-10-28
   
   ✅ 所有依赖已满足，可以开始工作
   ```

**预期结果**:
- 自动检测依赖完成
- 发送通知给等待人员
- 更新任务阻塞状态
- 提供快速开始选项

---

## 3. 设计要点

### 涉及字段（对齐 Contracts）

#### 新增实体：TaskDependency（任务依赖）

**位置**: `packages/contracts/src/modules/task/entities/TaskDependencyServer.ts`

```typescript
/**
 * 任务依赖
 */
export interface TaskDependencyServerDTO {
  readonly uuid: string;
  readonly dependentTaskUuid: string;      // 依赖方任务（被阻塞的任务）
  readonly dependencyTaskUuid: string;     // 被依赖任务（需要先完成的任务）
  readonly dependencyType: DependencyType;
  readonly status: DependencyStatus;
  readonly metadata?: DependencyMetadata;
  readonly createdBy: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

/**
 * 依赖类型
 */
export enum DependencyType {
  BLOCKING = 'blocking',                   // 阻塞型（必须完成）
  SUGGESTED = 'suggested'                  // 建议型（仅提醒）
}

/**
 * 依赖状态
 */
export enum DependencyStatus {
  ACTIVE = 'active',                       // 激活（依赖任务未完成）
  SATISFIED = 'satisfied',                 // 已满足（依赖任务已完成）
  REMOVED = 'removed'                      // 已移除
}

/**
 * 依赖元数据
 */
export interface DependencyMetadata {
  readonly reason?: string;                // 依赖原因
  readonly estimatedLag?: number;          // 预估间隔时间（毫秒）
  readonly actualLag?: number;             // 实际间隔时间
}
```

#### 更新 Task 实体

**位置**: `packages/contracts/src/modules/task/entities/TaskServer.ts`

```typescript
export interface TaskServerDTO {
  // ...existing fields...
  
  // 依赖关系相关
  readonly dependencies?: TaskDependencyServerDTO[];      // 此任务依赖的任务
  readonly dependents?: TaskDependencyServerDTO[];        // 依赖此任务的任务
  readonly isBlocked: boolean;                            // 是否被依赖阻塞
  readonly blockingTasks?: string[];                      // 阻塞此任务的任务 UUID
  readonly dependencyChainDepth?: number;                 // 依赖链深度
}
```

---

### 交互设计

#### 1. 依赖关系类型

| 依赖类型 | 行为 | 使用场景 |
|---------|------|---------|
| BLOCKING | 阻止开始，必须等待 | 技术依赖（API 完成才能开发前端） |
| SUGGESTED | 仅提醒，不阻止 | 流程建议（最好先评审再开发） |

#### 2. 循环检测算法

```typescript
// DFS 检测环
function detectCycle(graph: DependencyGraph): { hasCycle: boolean; path?: string[] } {
  const visited = new Set<string>();
  const recStack = new Set<string>();
  
  function dfs(node: string, path: string[]): boolean {
    visited.add(node);
    recStack.add(node);
    path.push(node);
    
    for (const neighbor of graph.getNeighbors(node)) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor, path)) return true;
      } else if (recStack.has(neighbor)) {
        path.push(neighbor);
        return true;
      }
    }
    
    recStack.delete(node);
    path.pop();
    return false;
  }
  
  for (const node of graph.getAllNodes()) {
    if (!visited.has(node)) {
      const path: string[] = [];
      if (dfs(node, path)) {
        return { hasCycle: true, path };
      }
    }
  }
  
  return { hasCycle: false };
}
```

#### 3. 关键路径计算

```typescript
// 计算关键路径（最长路径）
function findCriticalPath(tasks: Task[]): {
  path: string[];
  duration: number;
} {
  // 1. 拓扑排序
  const sorted = topologicalSort(tasks);
  
  // 2. 计算最早开始时间
  const earliestStart = new Map<string, number>();
  for (const task of sorted) {
    let maxPredecessorEnd = 0;
    for (const dep of task.dependencies) {
      const depEnd = earliestStart.get(dep.dependencyTaskUuid)! + dep.dependencyTask.estimatedDuration;
      maxPredecessorEnd = Math.max(maxPredecessorEnd, depEnd);
    }
    earliestStart.set(task.uuid, maxPredecessorEnd);
  }
  
  // 3. 找到最长路径
  let maxEnd = 0;
  let endTask: Task | null = null;
  for (const task of tasks) {
    const end = earliestStart.get(task.uuid)! + task.estimatedDuration;
    if (end > maxEnd) {
      maxEnd = end;
      endTask = task;
    }
  }
  
  // 4. 回溯路径
  const path: string[] = [];
  let current = endTask;
  while (current) {
    path.unshift(current.uuid);
    current = findCriticalPredecessor(current, earliestStart);
  }
  
  return { path, duration: maxEnd };
}
```

---

## 4. MVP/MMP/Full 路径

### MVP: 基础依赖管理（1.5-2 周）

**范围**:
- ✅ 创建/删除任务依赖
- ✅ 阻塞型依赖检测
- ✅ 循环依赖检测
- ✅ 简单依赖列表显示
- ✅ 依赖完成通知

**技术要点**:
- Contracts: 定义 `TaskDependencyServerDTO`
- Domain: Task 聚合根添加依赖管理方法
- 循环检测算法（DFS）

**验收标准**:
```gherkin
Given 任务 B 依赖任务 A（阻塞型）
When 任务 A 状态为 IN_PROGRESS
And 用户尝试开始任务 B
Then 应阻止并提示依赖未满足
```

---

### MMP: 可视化与智能调整（+1 周）

**在 MVP 基础上新增**:
- ✅ 甘特图可视化
- ✅ 依赖网络图
- ✅ 关键路径高亮
- ✅ 自动截止日期调整建议
- ✅ 批量依赖操作

**技术要点**:
- 甘特图组件（D3.js/vis.js）
- 拓扑排序
- 关键路径算法

**验收标准**:
```gherkin
Given 项目有 10 个相互依赖的任务
When 用户查看甘特图
Then 应显示时间线和依赖箭头
And 高亮关键路径
```

---

### Full Release: 高级分析与优化（+1 周）

**在 MMP 基础上新增**:
- ✅ 依赖健康度分析
- ✅ 瓶颈任务识别
- ✅ 资源冲突检测
- ✅ What-if 分析（模拟延期影响）
- ✅ 依赖模板

**技术要点**:
- 模拟算法
- 依赖模式识别
- 模板系统

**验收标准**:
```gherkin
Given 关键路径上某任务延期 2 天
When 执行 What-if 分析
Then 应显示对整体交付日期的影响
```

---

## 5. 验收标准（Gherkin）

### Feature: 任务依赖关系

#### Scenario 1: 创建任务依赖

```gherkin
Feature: 任务依赖关系
  作为项目管理者，我希望建立任务依赖关系

  Background:
    Given 用户"郑十"已登录
    And 存在任务：
      | uuid    | title      | status      |
      | task-a  | API 开发   | IN_PROGRESS |
      | task-b  | 前端开发   | TODO        |

  Scenario: 创建阻塞型依赖
    When 用户为 task-b 添加依赖 task-a
    And 选择依赖类型为 "blocking"
    Then 应创建 TaskDependency 记录：
      | 字段                | 值       |
      | dependentTaskUuid   | task-b   |
      | dependencyTaskUuid  | task-a   |
      | dependencyType      | blocking |
      | status              | active   |
    And task-b.isBlocked 应为 true
    And task-b.blockingTasks 应包含 task-a
```

---

#### Scenario 2: 阻塞检测

```gherkin
  Background:
    Given task-b 依赖 task-a（阻塞型）
    And task-a 状态为 IN_PROGRESS

  Scenario: 尝试开始被阻塞的任务
    When 用户尝试将 task-b 状态改为 IN_PROGRESS
    Then 应阻止状态变更
    And 提示："任务被依赖阻塞"
    And 显示阻塞任务列表：["API 开发"]
    And 提供"查看依赖任务"选项
```

---

#### Scenario 3: 循环依赖检测

```gherkin
  Background:
    Given 已存在依赖关系：
      | dependent | dependency |
      | task-a    | task-b     |
      | task-b    | task-c     |

  Scenario: 检测循环依赖
    When 用户尝试为 task-c 添加依赖 task-a
    Then 应执行循环检测
    And 检测到循环路径：["task-a", "task-b", "task-c", "task-a"]
    And 阻止依赖创建
    And 提示："检测到循环依赖"
    And 显示循环路径可视化
```

---

#### Scenario 4: 依赖完成通知

```gherkin
  Background:
    Given task-b 依赖 task-a
    And task-b 负责人为"李四"

  Scenario: 依赖任务完成
    When 用户将 task-a 标记为 COMPLETED
    Then 应发送通知给"李四"：
      | 字段    | 值                      |
      | type    | task_dependencies_met   |
      | title   | 任务可以开始了          |
      | priority| MEDIUM                  |
    And dependency.status 应更新为 'satisfied'
    And task-b.isBlocked 应更新为 false
```

---

#### Scenario 5: 截止日期影响分析

```gherkin
  Background:
    Given task-b 依赖 task-a
    And task-a 截止日期为 2025-10-28
    And task-b 截止日期为 2025-11-01
    And task-b 预留缓冲 2 天

  Scenario: 依赖任务延期
    When 用户将 task-a 截止日期改为 2025-10-30
    Then 应分析下游影响
    And 计算 task-b 剩余缓冲为 0 天
    And 提示："缓冲时间不足"
    And 建议调整 task-b 截止日期至 2025-11-03
    And 提供"应用建议"选项
```

---

#### Scenario 6: 甘特图显示

```gherkin
  Background:
    Given 项目有 5 个任务，存在依赖关系
    And 关键路径为：[task-a, task-b, task-e]

  Scenario: 查看甘特图
    When 用户打开项目依赖视图
    Then 应显示甘特图
    And 每个任务应显示为时间条
    And 依赖关系应显示为箭头
    And 关键路径任务应高亮显示
    And 显示项目预计完成日期
```

---

## 6. 指标与追踪

### 事件埋点

```typescript
// 创建依赖
{
  event: 'task_dependency_created',
  properties: {
    dependentTaskUuid: string,
    dependencyTaskUuid: string,
    dependencyType: DependencyType
  }
}

// 依赖阻塞
{
  event: 'task_blocked_by_dependency',
  properties: {
    taskUuid: string,
    blockingTaskCount: number
  }
}

// 循环依赖检测
{
  event: 'circular_dependency_detected',
  properties: {
    cycleLength: number,
    prevented: boolean
  }
}

// 依赖满足
{
  event: 'task_dependencies_satisfied',
  properties: {
    taskUuid: string,
    dependencyCount: number
  }
}
```

---

### 成功指标

**定量指标**:
| 指标 | 目标值 | 测量方式 |
|------|-------|---------|
| 依赖使用率 | >30% | 有依赖的任务数 / 总任务数 |
| 循环依赖阻止率 | 100% | 阻止的循环依赖数 / 尝试次数 |
| 依赖通知响应率 | >70% | 依赖满足后 24h 内开始的任务比例 |
| 依赖链准确率 | >90% | 未手动移除的依赖比例 |

**定性指标**:
- 用户反馈"项目管理更有条理"
- 任务执行顺序错误减少
- 项目交付可预测性提升

---

## 7. 技术实现要点

### Prisma Schema

```prisma
model TaskDependency {
  uuid                String   @id @default(uuid())
  dependentTaskUuid   String   @map("dependent_task_uuid")
  dependencyTaskUuid  String   @map("dependency_task_uuid")
  dependencyType      String   @map("dependency_type")
  status              String   @map("status")
  metadata            Json?    @map("metadata")
  createdBy           String   @map("created_by")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")
  
  dependentTask       Task     @relation("DependentTask", fields: [dependentTaskUuid], references: [uuid])
  dependencyTask      Task     @relation("DependencyTask", fields: [dependencyTaskUuid], references: [uuid])
  
  @@unique([dependentTaskUuid, dependencyTaskUuid])
  @@index([dependentTaskUuid])
  @@index([dependencyTaskUuid])
  @@index([status])
  @@map("task_dependencies")
}

// 更新 Task 模型
model Task {
  // ...existing fields...
  
  dependencies        TaskDependency[] @relation("DependentTask")
  dependents          TaskDependency[] @relation("DependencyTask")
  isBlocked           Boolean          @default(false) @map("is_blocked")
  blockingTasks       Json?            @map("blocking_tasks")  // string[]
  
  @@map("tasks")
}
```

### Application Service（见完整版文档）

---

## 8. 风险与缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|-------|------|---------|
| 复杂依赖性能问题 | 中 | 中 | 缓存依赖图 + 增量计算 |
| 过度依赖导致僵化 | 中 | 中 | 提供建议型依赖 + 教育用户 |
| 循环检测误报 | 低 | 高 | 充分测试 + 可视化验证 |
| 大型项目甘特图渲染慢 | 中 | 中 | 虚拟滚动 + 分层渲染 |

---

## 9. 后续增强方向

### Phase 2 功能
- 🔄 资源依赖（人员、设备）
- 📊 Monte Carlo 模拟
- 🤖 AI 推荐依赖关系
- 📱 移动端甘特图

### Phase 3 功能
- 🔗 跨项目依赖
- 👥 团队依赖协调
- 🎯 自动优化依赖链
- 📈 依赖健康度评分

---

## 10. 参考资料

- [Task Contracts](../../../../packages/contracts/src/modules/task/)
- [Project Management Body of Knowledge (PMBOK)](https://www.pmi.org/pmbok-guide-standards)
- [Critical Path Method (CPM)](https://en.wikipedia.org/wiki/Critical_path_method)

---

**文档状态**: ✅ Ready for PM Review  
**下一步**: PM 生成 Project Flow

---

**文档维护**:
- 创建: 2025-10-21
- 创建者: PO Agent  
- 版本: 1.0
- 下次更新: Sprint Planning 前
