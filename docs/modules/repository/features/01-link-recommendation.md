# Feature Spec: 知识关联推荐

> **功能编号**: REPOSITORY-001  
> **RICE 评分**: 240 (Reach: 6, Impact: 8, Confidence: 5, Effort: 1)  
> **优先级**: P1  
> **预估时间**: 0.8-1 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 背景与痛点

知识管理的核心价值在于建立知识之间的关联，但现有知识管理工具普遍存在以下问题：

- ❌ 知识孤岛严重，相关知识无法自动关联
- ❌ 依赖手动创建链接，效率低且容易遗漏
- ❌ 无法发现隐藏的知识关联（如相似内容、相关主题）
- ❌ 知识检索困难，找不到曾经记录过的相关内容
- ❌ 缺少智能推荐，无法主动发现有价值的关联

### 目标用户

- **主要用户**: 知识工作者、研究人员、内容创作者
- **次要用户**: 需要管理大量文档和笔记的团队
- **典型画像**: "我有很多笔记，但找不到它们之间的关联，信息检索效率低"

### 价值主张

**一句话价值**: 基于内容语义分析，自动推荐相关知识，建立智能知识网络

**核心收益**:

- ✅ 基于内容语义的智能关联推荐
- ✅ 自动识别相似知识条目
- ✅ 标签/关键词自动提取和推荐
- ✅ 双向关联建议（A 关联 B，B 也关联 A）
- ✅ 知识图谱可视化

---

## 2. 用户价值与场景

### 核心场景 1: 创建知识时自动推荐相关内容

**场景描述**:  
用户创建新的知识条目时，系统自动推荐可能相关的已有知识。

**用户故事**:

```gherkin
As a 知识管理者
I want 创建新知识时获得相关内容推荐
So that 我可以快速建立关联，避免重复创建
```

**操作流程**:

1. 用户在知识仓库中创建新笔记："React Hooks 最佳实践"
2. 用户输入内容：

   ```markdown
   # React Hooks 最佳实践

   ## 1. useState 的使用

   避免在循环、条件语句中使用 Hooks...

   ## 2. useEffect 的依赖管理

   确保依赖数组完整...
   ```

3. 系统实时分析内容并推荐相关知识：

   ```
   💡 发现相关知识（3 条）
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔗 React 性能优化指南
      相似度：85%
      共同标签：React, 性能优化
      [添加关联]

   🔗 自定义 Hook 开发规范
      相似度：78%
      共同标签：React, Hooks
      [添加关联]

   🔗 前端状态管理方案对比
      相似度：62%
      共同标签：React, 状态管理
      [添加关联]

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   建议标签：#React #Hooks #最佳实践 #性能优化
   [应用全部] [忽略]
   ```

4. 用户点击"React 性能优化指南"旁的"添加关联"
5. 系统创建双向关联：
   - "React Hooks 最佳实践" → "React 性能优化指南"
   - "React 性能优化指南" → "React Hooks 最佳实践"
6. 用户点击"应用全部"标签建议
7. 系统自动为笔记添加推荐标签

**预期结果**:

- 实时内容分析和推荐
- 推荐结果按相似度排序
- 一键添加关联
- 自动标签提取

---

### 核心场景 2: 基于标签的关联推荐

**场景描述**:  
系统基于共同标签推荐相关知识。

**用户故事**:

```gherkin
As a 知识管理者
I want 基于标签快速找到相关知识
So that 我可以发现同一主题下的所有内容
```

**操作流程**:

1. 用户创建笔记"TypeScript 泛型深入理解"
2. 手动添加标签：`#TypeScript #泛型 #类型系统`
3. 系统自动推荐相关知识：

   ```
   💡 基于标签的推荐（5 条）
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📌 标签：#TypeScript（4 条相关）

   🔗 TypeScript 高级类型
      共同标签：#TypeScript #类型系统
      创建时间：2025-10-15
      [查看] [添加关联]

   🔗 TypeScript 装饰器使用
      共同标签：#TypeScript
      创建时间：2025-10-10
      [查看] [添加关联]

   📌 标签：#泛型（2 条相关）

   🔗 Java 泛型与 TypeScript 泛型对比
      共同标签：#泛型 #类型系统
      创建时间：2025-09-20
      [查看] [添加关联]

   📌 标签：#类型系统（3 条相关）

   🔗 Rust 类型系统学习笔记
      共同标签：#类型系统
      创建时间：2025-08-15
      [查看] [添加关联]

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   [批量添加关联] [查看知识图谱]
   ```

4. 用户点击"批量添加关联"
5. 系统为所有推荐项创建关联

**预期结果**:

- 基于共同标签聚合推荐
- 显示标签重合度
- 支持批量操作

---

### 核心场景 3: 内容语义相似度推荐

**场景描述**:  
系统使用 NLP 算法分析内容语义，推荐相似知识。

**用户故事**:

```gherkin
As a 知识管理者
I want 发现内容语义相似的知识
So that 即使标签不同，也能找到相关内容
```

**操作流程**:

1. 用户查看笔记"如何提升团队效能"
2. 点击"查找相关内容"
3. 系统使用 TF-IDF/词向量算法分析内容：

   ```typescript
   // 提取关键词
   keywords: ['团队', '效能', '协作', '敏捷', '工具']

   // 计算语义向量
   semanticVector: [0.82, 0.65, 0.43, ...]

   // 与所有知识计算相似度
   similarities: [
     { resourceUuid: 'res-1', similarity: 0.85 },
     { resourceUuid: 'res-2', similarity: 0.78 },
     ...
   ]
   ```

4. 系统展示推荐结果：

   ```
   💡 语义相似内容（4 条）
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔗 敏捷开发实践总结
      相似度：85%
      关键词匹配：团队、协作、敏捷
      内容摘要：介绍了 Scrum 框架下的团队协作...
      [查看] [添加关联]

   🔗 项目管理工具对比
      相似度：78%
      关键词匹配：团队、工具
      内容摘要：对比了 Jira、Trello、Notion...
      [查看] [添加关联]

   🔗 远程团队协作指南
      相似度：72%
      关键词匹配：团队、协作、效能
      内容摘要：分享了远程团队的协作经验...
      [查看] [添加关联]

   🔗 OKR 目标管理方法
      相似度：68%
      关键词匹配：团队、效能
      内容摘要：如何使用 OKR 提升团队目标达成...
      [查看] [添加关联]

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   💡 推荐理由：这些内容都涉及团队管理和效能提升
   [全部添加] [精选添加]
   ```

5. 用户选择前两条，点击"精选添加"
6. 系统创建关联

**预期结果**:

- 基于内容语义而非仅标签
- 显示相似度百分比
- 提供推荐理由
- 关键词高亮匹配

---

### 核心场景 4: 双向关联建议

**场景描述**:  
创建 A → B 关联时，系统建议同时创建 B → A 反向关联。

**用户故事**:

```gherkin
As a 知识管理者
I want 自动创建双向关联
So that 知识网络更完整，便于双向导航
```

**操作流程**:

1. 用户在笔记 A "Vue 3 组合式 API" 中手动添加关联到笔记 B "React Hooks"
2. 系统提示：

   ```
   🔗 双向关联建议
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   您已添加关联：
   📄 Vue 3 组合式 API → 📄 React Hooks

   建议同时创建反向关联：
   📄 React Hooks → 📄 Vue 3 组合式 API

   关联类型：
   🔘 相似概念（推荐）
   ⚪ 参考引用
   ⚪ 对比分析
   ⚪ 自定义

   [创建双向关联]  [仅单向关联]
   ```

3. 用户点击"创建双向关联"
4. 系统创建两条关联记录：

   ```typescript
   // 关联 1
   {
     sourceUuid: 'vue-3-api',
     targetUuid: 'react-hooks',
     relationType: 'similar_concept',
     direction: 'forward'
   }

   // 关联 2
   {
     sourceUuid: 'react-hooks',
     targetUuid: 'vue-3-api',
     relationType: 'similar_concept',
     direction: 'backward'
   }
   ```

**预期结果**:

- 自动建议双向关联
- 支持关联类型选择
- 保持语义一致性

---

### 核心场景 5: 查看知识图谱

**场景描述**:  
用户以图谱形式可视化知识关联网络。

**用户故事**:

```gherkin
As a 知识管理者
I want 可视化查看知识关联网络
So that 我可以直观了解知识结构
```

**操作流程**:

1. 用户打开某个知识条目详情页
2. 点击"知识图谱"标签
3. 系统展示关联网络图：

   ```
   知识图谱
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

           ┌──────────────┐
           │  TypeScript  │
           │  高级类型    │
           └──────┬───────┘
                  │
        ┌─────────┴─────────┐
        │                   │
   ┌────▼────┐        ┌────▼────┐
   │TypeScript│        │TypeScript│
   │  泛型    │◄──────►│  装饰器  │
   └────┬────┘        └─────────┘
        │
   ┌────▼────┐
   │  Java   │
   │  泛型   │
   └─────────┘

   图例：
   ● 当前节点
   ○ 一级关联（3个）
   ◌ 二级关联（1个）

   筛选：
   ☑️ 显示一级关联
   ☑️ 显示二级关联
   ☐ 显示三级关联

   [展开全部]  [收起]  [导出图片]
   ```

4. 用户点击"TypeScript 装饰器"节点
5. 系统跳转到该知识详情页
6. 用户点击"导出图片"
7. 系统生成 SVG/PNG 图片供下载

**预期结果**:

- 可视化图谱展示
- 支持节点点击跳转
- 可配置显示层级
- 导出图片

---

### 核心场景 6: 智能标签推荐

**场景描述**:  
系统基于内容自动提取和推荐标签。

**用户故事**:

```gherkin
As a 知识管理者
I want 自动获得标签推荐
So that 我不需要手动思考如何打标签
```

**操作流程**:

1. 用户创建新笔记："Kubernetes 生产环境部署实践"
2. 输入内容后，系统自动分析
3. 提取关键词并推荐标签：

   ```
   🏷️ 智能标签推荐
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   基于内容分析推荐（6 个）：

   高相关度（3个）：
   ☑️ #Kubernetes
   ☑️ #容器化
   ☑️ #DevOps

   中相关度（3个）：
   ☐ #部署
   ☐ #生产环境
   ☐ #云原生

   已有类似标签：
   💡 #k8s（使用 2 次） - 是否替换为 #Kubernetes？
      [统一使用 Kubernetes]  [保留 k8s]

   热门标签（基于社区）：
   #Docker #云计算 #微服务

   [应用选中标签]  [全部应用]  [自定义]
   ```

4. 用户勾选需要的标签
5. 点击"应用选中标签"
6. 系统添加标签到知识条目

**预期结果**:

- 基于 NLP 的关键词提取
- 标签规范化建议（如 k8s → Kubernetes）
- 按相关度分级推荐
- 社区热门标签参考

---

## 3. 设计要点

### 涉及字段（对齐 Contracts）

#### 新增实体：ResourceLink（知识关联）

**位置**: `packages/contracts/src/modules/repository/entities/ResourceLinkServer.ts`

```typescript
/**
 * 知识关联
 */
export interface ResourceLinkServerDTO {
  readonly uuid: string;
  readonly repositoryUuid: string;
  readonly sourceResourceUuid: string; // 源知识 UUID
  readonly targetResourceUuid: string; // 目标知识 UUID
  readonly linkType: LinkType; // 关联类型
  readonly similarity?: number; // 相似度（0-1）
  readonly bidirectional: boolean; // 是否双向关联
  readonly autoCreated: boolean; // 是否自动创建
  readonly metadata?: LinkMetadata; // 扩展元数据
  readonly createdBy: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

/**
 * 关联类型
 */
export enum LinkType {
  SIMILAR_CONCEPT = 'similar_concept', // 相似概念
  REFERENCE = 'reference', // 参考引用
  COMPARISON = 'comparison', // 对比分析
  PREREQUISITE = 'prerequisite', // 前置知识
  FOLLOW_UP = 'follow_up', // 延伸阅读
  RELATED_TOPIC = 'related_topic', // 相关主题
  CUSTOM = 'custom', // 自定义
}

/**
 * 关联元数据
 */
export interface LinkMetadata {
  readonly reason?: string; // 推荐理由
  readonly keywords?: string[]; // 共同关键词
  readonly tags?: string[]; // 共同标签
  readonly createdMethod?: 'manual' | 'auto_tag' | 'auto_semantic'; // 创建方式
}
```

#### 新增实体：LinkRecommendation（关联推荐）

**位置**: `packages/contracts/src/modules/repository/entities/LinkRecommendationServer.ts`

```typescript
/**
 * 关联推荐
 */
export interface LinkRecommendationServerDTO {
  readonly uuid: string;
  readonly resourceUuid: string; // 当前知识 UUID
  readonly recommendedResourceUuid: string; // 推荐知识 UUID
  readonly similarity: number; // 相似度（0-1）
  readonly recommendationType: RecommendationType;
  readonly reason: string; // 推荐理由
  readonly commonTags: string[]; // 共同标签
  readonly commonKeywords: string[]; // 共同关键词
  readonly status: 'pending' | 'accepted' | 'rejected';
  readonly createdAt: number;
}

/**
 * 推荐类型
 */
export enum RecommendationType {
  TAG_BASED = 'tag_based', // 基于标签
  SEMANTIC = 'semantic', // 基于语义
  KEYWORD = 'keyword', // 基于关键词
  MANUAL_PATTERN = 'manual_pattern', // 基于用户历史模式
}
```

#### 新增实体：TagRecommendation（标签推荐）

**位置**: `packages/contracts/src/modules/repository/entities/TagRecommendationServer.ts`

```typescript
/**
 * 标签推荐
 */
export interface TagRecommendationServerDTO {
  readonly uuid: string;
  readonly resourceUuid: string;
  readonly tag: string;
  readonly confidence: number; // 置信度（0-1）
  readonly source: TagSource;
  readonly status: 'pending' | 'applied' | 'rejected';
  readonly createdAt: number;
}

/**
 * 标签来源
 */
export enum TagSource {
  CONTENT_ANALYSIS = 'content_analysis', // 内容分析
  EXISTING_TAGS = 'existing_tags', // 已有标签（相似资源）
  USER_HISTORY = 'user_history', // 用户历史
  COMMUNITY = 'community', // 社区热门
}
```

#### 更新 Resource 实体

**位置**: `packages/contracts/src/modules/repository/entities/ResourceServer.ts`

```typescript
export interface ResourceServerDTO {
  // ...existing fields...

  // 关联推荐相关
  readonly links?: ResourceLinkServerDTO[];
  readonly linkRecommendations?: LinkRecommendationServerDTO[];
  readonly tagRecommendations?: TagRecommendationServerDTO[];
  readonly keywords?: string[]; // 提取的关键词
  readonly semanticVector?: number[]; // 语义向量（用于相似度计算）
}
```

---

### 交互设计

#### 1. 推荐时机

| 场景         | 推荐时机       | 推荐类型            |
| ------------ | -------------- | ------------------- |
| 创建新知识   | 输入内容后实时 | 关联推荐 + 标签推荐 |
| 添加标签     | 标签输入时     | 标签推荐            |
| 手动创建关联 | 选择目标后     | 双向关联建议        |
| 查看知识详情 | 打开详情页     | 相关知识推荐        |

#### 2. 相似度计算

```typescript
// 基于标签的相似度
function calculateTagSimilarity(resource1: Resource, resource2: Resource): number {
  const tags1 = new Set(resource1.tags);
  const tags2 = new Set(resource2.tags);
  const intersection = new Set([...tags1].filter((x) => tags2.has(x)));
  const union = new Set([...tags1, ...tags2]);
  return intersection.size / union.size; // Jaccard 相似度
}

// 基于语义向量的相似度（余弦相似度）
function calculateSemanticSimilarity(vector1: number[], vector2: number[]): number {
  const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitude1 * magnitude2);
}

// 综合相似度
function calculateOverallSimilarity(resource1: Resource, resource2: Resource): number {
  const tagSimilarity = calculateTagSimilarity(resource1, resource2);
  const semanticSimilarity = calculateSemanticSimilarity(
    resource1.semanticVector,
    resource2.semanticVector,
  );
  return 0.4 * tagSimilarity + 0.6 * semanticSimilarity; // 加权平均
}
```

#### 3. 推荐阈值

| 推荐类型   | 最低相似度 | 推荐数量   |
| ---------- | ---------- | ---------- |
| 高相关推荐 | ≥ 0.7      | 3-5 条     |
| 中相关推荐 | 0.5-0.7    | 5-10 条    |
| 低相关推荐 | 0.3-0.5    | 不主动推荐 |

---

## 4. MVP/MMP/Full 路径

### MVP: 基础关联推荐（0.8-1 周）

**范围**:

- ✅ 基于标签的关联推荐
- ✅ 手动创建关联
- ✅ 双向关联建议
- ✅ 基础标签推荐（基于关键词提取）
- ✅ 关联列表查看
- ✅ 简单的知识图谱（一级关联）

**技术要点**:

- Contracts: 定义 `ResourceLinkServerDTO`, `LinkRecommendationServerDTO`
- Domain: Repository 聚合根添加 `recommendLinks()` 方法
- Application: `LinkRecommendationService` 应用服务
- Infrastructure: 关键词提取（基于 TF-IDF）
- API: `GET /api/v1/resources/:uuid/recommendations`
- UI: 推荐面板 + 图谱可视化（D3.js）

**验收标准**:

```gherkin
Given 用户创建新知识并添加标签 #React
When 仓库中已有 3 个带 #React 标签的知识
Then 系统应推荐这 3 个知识
And 显示共同标签
And 用户可一键添加关联
```

---

### MMP: 语义分析增强（+1-1.5 周）

**在 MVP 基础上新增**:

- ✅ 基于内容语义的推荐（NLP 分析）
- ✅ 语义向量计算与存储
- ✅ 综合相似度算法（标签 + 语义）
- ✅ 智能标签推荐（多来源）
- ✅ 标签规范化建议
- ✅ 多级知识图谱（二级、三级关联）

**技术要点**:

- NLP 库集成（如 natural.js, compromise）
- 词向量模型（Word2Vec 或预训练模型）
- 相似度计算优化（缓存）

**验收标准**:

```gherkin
Given 两个知识内容语义相似但标签不同
When 系统执行语义分析
Then 应计算出高相似度（>0.7）
And 推荐创建关联
And 提供推荐理由
```

---

### Full Release: 智能图谱与深度学习（+2-3 周）

**在 MMP 基础上新增**:

- ✅ 基于用户行为的推荐（协同过滤）
- ✅ 知识图谱导航（路径查找）
- ✅ 社区热门标签推荐
- ✅ 自动分类（知识聚类）
- ✅ 图谱导出（Markdown、JSON）
- ✅ AI 推荐理由生成

**技术要点**:

- 协同过滤算法
- 图算法（最短路径、社区发现）
- LLM 集成（推荐理由生成）

**验收标准**:

```gherkin
Given 用户经常关联 A→B、B→C 类型的知识
When 用户创建新知识 A'
Then 系统应推荐类似 B 类型的知识
And 基于用户历史模式
```

---

## 5. 验收标准（Gherkin）

### Feature: 知识关联推荐

#### Scenario 1: 基于标签推荐关联

```gherkin
Feature: 知识关联推荐
  作为知识管理者，我希望获得智能关联推荐

  Background:
    Given 用户"郑十"已登录
    And 知识仓库中有以下知识：
      | uuid  | title              | tags                  |
      | res-1 | React Hooks 入门   | React, Hooks          |
      | res-2 | React 性能优化     | React, 性能优化       |
      | res-3 | Vue 3 组合式 API   | Vue, 组合式API        |

  Scenario: 创建新知识时获得推荐
    When 用户创建新知识"React Hooks 最佳实践"
    And 添加标签：React, Hooks, 最佳实践
    Then 系统应推荐 res-1（标签匹配度 100%）
    And 系统应推荐 res-2（标签匹配度 50%）
    And 不应推荐 res-3（标签无匹配）
    And 推荐结果应按相似度排序

    When 用户点击 res-1 的"添加关联"
    Then 应创建关联记录：
      | 字段               | 值                      |
      | sourceResourceUuid | 新知识 UUID             |
      | targetResourceUuid | res-1                   |
      | linkType           | similar_concept         |
      | autoCreated        | false                   |
    And metadata.tags 应包含：['React', 'Hooks']
```

---

#### Scenario 2: 双向关联建议

```gherkin
  Scenario: 手动创建关联时建议双向
    When 用户在 res-1 中手动添加关联到 res-2
    Then 系统应提示："建议同时创建反向关联"
    And 提供关联类型选择：相似概念、参考引用、对比分析

    When 用户选择"相似概念"并确认
    Then 应创建两条关联：
      | source | target | direction |
      | res-1  | res-2  | forward   |
      | res-2  | res-1  | backward  |
    And 两条关联的 linkType 应相同
    And bidirectional 应为 true
```

---

#### Scenario 3: 语义相似度推荐

```gherkin
  Background:
    Given 知识仓库中有两个知识：
      | uuid  | title          | content                       |
      | res-4 | 团队协作工具   | 介绍 Jira、Trello、Notion... |
      | res-5 | 敏捷开发实践   | Scrum 框架、站会、迭代...     |
    And 两者标签不同但内容语义相关

  Scenario: 基于语义推荐
    When 用户查看 res-4 详情页
    And 点击"查找相关内容"
    Then 系统应分析内容语义
    And 计算与 res-5 的相似度
    And 如果相似度 > 0.6，应推荐 res-5
    And 显示推荐理由："都涉及团队管理和敏捷方法"
    And 高亮共同关键词："团队、协作、敏捷"
```

---

#### Scenario 4: 智能标签推荐

```gherkin
  Scenario: 内容分析推荐标签
    When 用户创建新知识"Kubernetes 部署实践"
    And 输入内容包含关键词：Pod, Deployment, Service, Ingress
    Then 系统应提取关键词
    And 推荐标签：
      | tag        | confidence | source           |
      | Kubernetes | 0.95       | content_analysis |
      | 容器化     | 0.82       | content_analysis |
      | DevOps     | 0.75       | content_analysis |
    And 标签应按 confidence 排序

    When 用户应用推荐标签
    Then 知识的 tags 应包含推荐的标签
```

---

#### Scenario 5: 标签规范化建议

```gherkin
  Background:
    Given 仓库中已有标签：
      | tag        | 使用次数 |
      | Kubernetes | 10       |
      | k8s        | 3        |

  Scenario: 建议统一标签
    When 用户创建新知识并手动添加标签 "k8s"
    Then 系统应提示："已有相似标签 #Kubernetes（使用 10 次）"
    And 建议："是否统一使用 #Kubernetes？"
    And 提供选项：
      | 选项                    | 行为                        |
      | 统一使用 Kubernetes     | 将 k8s 替换为 Kubernetes    |
      | 保留 k8s                | 保持原标签                  |
      | 同时添加两个标签        | 添加 k8s 和 Kubernetes      |
```

---

#### Scenario 6: 知识图谱查看

```gherkin
  Background:
    Given 知识之间有以下关联：
      | source | target | linkType        |
      | res-1  | res-2  | similar_concept |
      | res-2  | res-4  | reference       |
      | res-1  | res-5  | related_topic   |

  Scenario: 查看一级关联图谱
    When 用户打开 res-1 详情页
    And 点击"知识图谱"
    Then 应显示图谱：
      | 节点      | 层级 | 关联类型        |
      | res-1     | 0    | 当前节点        |
      | res-2     | 1    | similar_concept |
      | res-5     | 1    | related_topic   |
    And 节点应可点击跳转

    When 用户勾选"显示二级关联"
    Then 应额外显示：
      | 节点 | 层级 | 关联类型  |
      | res-4| 2    | reference |
```

---

## 6. 指标与追踪

### 事件埋点

```typescript
// 推荐生成
{
  event: 'link_recommendation_generated',
  properties: {
    resourceUuid: string,
    recommendationType: RecommendationType,
    recommendationCount: number,
    avgSimilarity: number
  }
}

// 推荐接受
{
  event: 'link_recommendation_accepted',
  properties: {
    recommendationUuid: string,
    similarity: number,
    recommendationType: RecommendationType
  }
}

// 标签推荐应用
{
  event: 'tag_recommendation_applied',
  properties: {
    resourceUuid: string,
    tagCount: number,
    source: TagSource,
    avgConfidence: number
  }
}

// 图谱查看
{
  event: 'knowledge_graph_viewed',
  properties: {
    resourceUuid: string,
    nodeCount: number,
    maxDepth: number
  }
}
```

---

### 成功指标

**定量指标**:
| 指标 | 目标值 | 测量方式 |
|------|-------|---------|
| 推荐接受率 | >40% | 接受推荐数 / 推荐总数 |
| 标签推荐采纳率 | >60% | 采纳标签数 / 推荐标签数 |
| 平均关联数 | >3/知识 | 总关联数 / 知识总数 |
| 图谱使用率 | >25% | 查看图谱的用户数 / 活跃用户数 |

**定性指标**:

- 用户反馈"更容易发现相关知识"
- 知识检索效率提升
- 知识网络密度增加

---

## 7. 技术实现要点

### Prisma Schema

```prisma
model ResourceLink {
  uuid                String   @id @default(uuid())
  repositoryUuid      String   @map("repository_uuid")
  sourceResourceUuid  String   @map("source_resource_uuid")
  targetResourceUuid  String   @map("target_resource_uuid")
  linkType            String   @map("link_type")
  similarity          Float?   @map("similarity")
  bidirectional       Boolean  @default(false) @map("bidirectional")
  autoCreated         Boolean  @default(false) @map("auto_created")
  metadata            Json?    @map("metadata")
  createdBy           String   @map("created_by")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  repository          Repository @relation(fields: [repositoryUuid], references: [uuid])
  sourceResource      Resource   @relation("SourceLinks", fields: [sourceResourceUuid], references: [uuid])
  targetResource      Resource   @relation("TargetLinks", fields: [targetResourceUuid], references: [uuid])

  @@index([sourceResourceUuid])
  @@index([targetResourceUuid])
  @@index([repositoryUuid])
  @@map("resource_links")
}

model LinkRecommendation {
  uuid                    String   @id @default(uuid())
  resourceUuid            String   @map("resource_uuid")
  recommendedResourceUuid String   @map("recommended_resource_uuid")
  similarity              Float    @map("similarity")
  recommendationType      String   @map("recommendation_type")
  reason                  String   @map("reason") @db.Text
  commonTags              Json     @map("common_tags")
  commonKeywords          Json     @map("common_keywords")
  status                  String   @default("pending") @map("status")
  createdAt               DateTime @default(now()) @map("created_at")

  resource                Resource @relation("Recommendations", fields: [resourceUuid], references: [uuid])
  recommendedResource     Resource @relation("RecommendedBy", fields: [recommendedResourceUuid], references: [uuid])

  @@index([resourceUuid, status])
  @@map("link_recommendations")
}

model TagRecommendation {
  uuid         String   @id @default(uuid())
  resourceUuid String   @map("resource_uuid")
  tag          String   @map("tag")
  confidence   Float    @map("confidence")
  source       String   @map("source")
  status       String   @default("pending") @map("status")
  createdAt    DateTime @default(now()) @map("created_at")

  resource     Resource @relation(fields: [resourceUuid], references: [uuid])

  @@index([resourceUuid, status])
  @@map("tag_recommendations")
}

// 更新 Resource 模型
model Resource {
  // ...existing fields...

  keywords         Json?      @map("keywords")  // string[]
  semanticVector   Json?      @map("semantic_vector")  // number[]

  sourceLinks      ResourceLink[] @relation("SourceLinks")
  targetLinks      ResourceLink[] @relation("TargetLinks")
  recommendations  LinkRecommendation[] @relation("Recommendations")
  recommendedBy    LinkRecommendation[] @relation("RecommendedBy")
  tagRecommendations TagRecommendation[]
}
```

### Application Service

```typescript
// packages/domain-server/src/modules/repository/application/LinkRecommendationService.ts

export class LinkRecommendationService {
  // 生成关联推荐
  async generateRecommendations(resource: Resource): Promise<LinkRecommendation[]> {
    const allResources = await this.resourceRepository.findByRepository(resource.repositoryUuid);
    const recommendations: LinkRecommendation[] = [];

    for (const otherResource of allResources) {
      if (otherResource.uuid === resource.uuid) continue;

      // 计算相似度
      const similarity = this.calculateSimilarity(resource, otherResource);

      if (similarity >= 0.3) {
        // 阈值
        const recommendation = new LinkRecommendation({
          resourceUuid: resource.uuid,
          recommendedResourceUuid: otherResource.uuid,
          similarity,
          recommendationType: this.determineType(resource, otherResource),
          reason: this.generateReason(resource, otherResource, similarity),
          commonTags: this.findCommonTags(resource, otherResource),
          commonKeywords: this.findCommonKeywords(resource, otherResource),
        });

        recommendations.push(recommendation);
      }
    }

    // 按相似度排序
    recommendations.sort((a, b) => b.similarity - a.similarity);

    // 保存推荐
    await this.recommendationRepository.saveAll(recommendations);

    return recommendations.slice(0, 10); // 返回 Top 10
  }

  // 计算综合相似度
  private calculateSimilarity(res1: Resource, res2: Resource): number {
    const tagSim = this.calculateTagSimilarity(res1.tags, res2.tags);
    const semanticSim = this.calculateSemanticSimilarity(res1.semanticVector, res2.semanticVector);

    return 0.4 * tagSim + 0.6 * semanticSim;
  }

  // 提取关键词
  async extractKeywords(content: string): Promise<string[]> {
    // 使用 TF-IDF 算法
    const words = this.tokenize(content);
    const tfidf = this.calculateTFIDF(words);
    const keywords = Object.entries(tfidf)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);

    return keywords;
  }

  // 生成推荐理由
  private generateReason(res1: Resource, res2: Resource, similarity: number): string {
    const commonTags = this.findCommonTags(res1, res2);

    if (similarity > 0.8) {
      return `内容高度相似，共同标签：${commonTags.join(', ')}`;
    } else if (similarity > 0.6) {
      return `内容相关，涉及相似主题：${commonTags.join(', ')}`;
    } else {
      return `可能相关，共同关键词较多`;
    }
  }
}
```

### API 端点

```typescript
// 获取关联推荐
GET /api/v1/resources/:uuid/link-recommendations?type=all&limit=10
Response: {
  recommendations: LinkRecommendationClientDTO[],
  total: number
}

// 接受推荐并创建关联
POST /api/v1/link-recommendations/:uuid/accept
Body: {
  linkType?: LinkType,
  bidirectional?: boolean
}
Response: ResourceLinkClientDTO

// 拒绝推荐
POST /api/v1/link-recommendations/:uuid/reject
Response: { success: boolean }

// 获取标签推荐
GET /api/v1/resources/:uuid/tag-recommendations
Response: {
  recommendations: TagRecommendationClientDTO[]
}

// 应用标签推荐
POST /api/v1/resources/:uuid/apply-tags
Body: {
  tags: string[]
}
Response: ResourceClientDTO

// 获取知识图谱
GET /api/v1/resources/:uuid/graph?depth=2
Response: {
  nodes: GraphNode[],
  edges: GraphEdge[]
}

// 手动创建关联
POST /api/v1/resources/:sourceUuid/links
Body: {
  targetUuid: string,
  linkType: LinkType,
  bidirectional?: boolean
}
Response: ResourceLinkClientDTO
```

---

## 8. 风险与缓解

| 风险                     | 可能性 | 影响 | 缓解措施                    |
| ------------------------ | ------ | ---- | --------------------------- |
| 推荐准确率低             | 中     | 高   | 持续优化算法 + 用户反馈学习 |
| 语义分析性能问题         | 中     | 中   | 异步计算 + 缓存向量         |
| 图谱渲染性能（节点过多） | 中     | 中   | 限制显示层级 + 懒加载       |
| 标签泛滥                 | 高     | 中   | 标签规范化 + 合并建议       |

---

## 9. 后续增强方向

### Phase 2 功能

- 🔄 基于用户行为的协同过滤推荐
- 📊 知识聚类（自动分类）
- 🤖 LLM 生成推荐理由
- 📱 图谱交互增强（拖拽、缩放）

### Phase 3 功能

- 🔗 跨仓库关联推荐
- 👥 团队知识图谱
- 🎯 知识路径推荐（从 A 到 C 需要先学 B）
- 📈 知识影响力分析（PageRank）

---

## 10. 参考资料

- [Repository Contracts](../../../../packages/contracts/src/modules/repository/)
- [TF-IDF 算法](https://en.wikipedia.org/wiki/Tf%E2%80%93idf)
- [余弦相似度](https://en.wikipedia.org/wiki/Cosine_similarity)
- [知识图谱技术](https://en.wikipedia.org/wiki/Knowledge_graph)

---

**文档状态**: ✅ Ready for PM Review  
**下一步**: PM 生成 Project Flow

---

**文档维护**:

- 创建: 2025-10-21
- 创建者: PO Agent
- 版本: 1.0
- 下次更新: Sprint Planning 前
