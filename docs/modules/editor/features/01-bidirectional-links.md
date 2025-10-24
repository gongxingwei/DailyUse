# Feature Spec: 双向链接

> **功能编号**: EDITOR-001  
> **RICE 评分**: 216 (Reach: 6, Impact: 9, Confidence: 8, Effort: 2)  
> **优先级**: P1  
> **预估时间**: 1.5-2 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 背景与痛点

现代知识管理工具（如 Roam Research, Obsidian, Logseq）的核心创新在于双向链接，但传统笔记工具存在以下问题：

- ❌ 仅支持单向链接，无法快速查看反向引用
- ❌ 链接创建繁琐，需要手动输入完整路径
- ❌ 链接断裂后难以发现和修复
- ❌ 无法可视化文档之间的关联网络
- ❌ 孤立文档（未被任何文档引用）难以发现

### 目标用户

- **主要用户**: 知识工作者、研究人员、笔记爱好者
- **次要用户**: 需要建立复杂知识网络的团队
- **典型画像**: "我想快速建立笔记之间的关联，并看到哪些笔记引用了当前笔记"

### 价值主张

**一句话价值**: 通过 `[[]]` 语法快速创建双向链接，自动维护反向引用，构建知识网络

**核心收益**:

- ✅ `[[文档名]]` 语法快速创建链接
- ✅ 自动维护反向引用（Backlinks）
- ✅ 链接自动补全和搜索
- ✅ 孤立文档检测
- ✅ 链接断裂检测与修复
- ✅ 块级引用（Block Reference）

---

## 2. 用户价值与场景

### 核心场景 1: 使用 [[]] 语法创建链接

**场景描述**:  
用户在编辑器中输入 `[[]]` 快速创建文档链接。

**用户故事**:

```gherkin
As a 知识管理者
I want 使用 [[]] 快速创建链接
So that 我不需要记住复杂的文件路径
```

**操作流程**:

1. 用户在编辑器中编写笔记："React Hooks 使用指南"
2. 输入内容：

   ```markdown
   # React Hooks 使用指南

   React Hooks 是 React 16.8 引入的新特性，参考 [[
   ```

3. 输入 `[[` 后，编辑器触发自动补全：
   ```
   ┌────────────────────────────────────┐
   │ 搜索文档或创建新链接...            │
   ├────────────────────────────────────┤
   │ 💡 建议（基于最近使用）            │
   │ 📄 React 性能优化                  │
   │ 📄 自定义 Hook 开发规范            │
   │                                    │
   │ 🔍 搜索结果                        │
   │ 📄 React 官方文档                  │
   │ 📄 React 生命周期详解              │
   │                                    │
   │ ➕ 创建新文档 "..."               │
   └────────────────────────────────────┘
   ```
4. 用户输入 "React 性能"，实时过滤：
   ```
   ┌────────────────────────────────────┐
   │ React 性能                         │
   ├────────────────────────────────────┤
   │ 📄 React 性能优化                  │
   │    路径: /知识库/前端/React        │
   │    最后修改: 2025-10-15            │
   │                                    │
   │ ➕ 创建 "React 性能" 新文档        │
   └────────────────────────────────────┘
   ```
5. 用户选择"React 性能优化"
6. 编辑器插入链接：
   ```markdown
   React Hooks 是 React 16.8 引入的新特性，参考 [[React 性能优化]]
   ```
7. 渲染后显示为可点击链接：
   ```
   React Hooks 是 React 16.8 引入的新特性，参考 React 性能优化
                                                  ^^^^^^^^^^^^^^^^
                                                  (可点击，蓝色下划线)
   ```
8. 系统自动创建双向链接记录：
   ```typescript
   {
     sourceDocUuid: 'doc-hooks-guide',
     targetDocUuid: 'doc-performance',
     linkType: 'bidirectional',
     anchorText: 'React 性能优化',
     position: { line: 3, column: 25 }
   }
   ```

**预期结果**:

- 输入 `[[` 触发自动补全
- 支持模糊搜索文档名
- 显示文档路径和最后修改时间
- 支持创建不存在的文档

---

### 核心场景 2: 查看反向引用（Backlinks）

**场景描述**:  
用户查看当前文档被哪些其他文档引用。

**用户故事**:

```gherkin
As a 知识管理者
I want 查看哪些文档引用了当前文档
So that 我可以了解知识之间的关联
```

**操作流程**:

1. 用户打开文档"React 性能优化"
2. 编辑器右侧显示"反向引用"面板：

   ```
   📑 反向引用 (3)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📄 React Hooks 使用指南
      "...参考 [[React 性能优化]] 了解更多"
      最后修改: 2025-10-20
      [打开]

   📄 前端性能监控实践
      "...可以参考 [[React 性能优化]] 的方法"
      最后修改: 2025-10-18
      [打开]

   📄 Web 应用优化清单
      "...React 应用参见 [[React 性能优化]]"
      最后修改: 2025-10-15
      [打开]

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   💡 未链接提及 (1)
   📄 性能优化总结
      "...React 性能优化是关键..."
      (建议添加链接)
      [创建链接]
   ```

3. 用户点击"React Hooks 使用指南"的"打开"
4. 系统打开该文档，并高亮显示引用位置
5. 用户查看"未链接提及"部分
6. 点击"创建链接"
7. 系统自动将"React 性能优化"文本转换为 `[[React 性能优化]]`

**预期结果**:

- 显示所有引用当前文档的文档列表
- 显示引用上下文（周边文本）
- 支持快速跳转
- 检测未链接的提及并建议创建链接

---

### 核心场景 3: 创建不存在的文档

**场景描述**:  
用户链接到尚不存在的文档，系统自动创建占位符。

**用户故事**:

```gherkin
As a 知识管理者
I want 链接到还不存在的文档
So that 我可以先建立知识结构，再填充内容
```

**操作流程**:

1. 用户编写文档，输入：
   ```markdown
   下一步学习 [[TypeScript 泛型进阶]]
   ```
2. "TypeScript 泛型进阶"文档尚不存在
3. 编辑器渲染为特殊样式（虚线下划线 + 灰色）：
   ```
   下一步学习 TypeScript 泛型进阶
               ^^^^^^^^^^^^^^^^^^^^
               (虚线下划线，灰色)
   ```
4. 鼠标悬停显示提示：
   ```
   💡 该文档尚未创建
   [点击创建]
   ```
5. 用户点击链接
6. 系统弹出创建文档对话框：

   ```
   创建新文档
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   文档标题: TypeScript 泛型进阶

   保存位置:
   ⚪ 当前文档同级目录 (/知识库/前端)
   🔘 选择其他位置
      └─ /知识库/前端/TypeScript

   模板:
   ⚪ 空白文档
   🔘 学习笔记模板
   ⚪ 技术文档模板

   [创建]  [取消]
   ```

7. 用户选择位置和模板，点击"创建"
8. 系统创建文档并应用模板：

   ```markdown
   # TypeScript 泛型进阶

   > 创建时间: 2025-10-21
   > 引用来源: [[React Hooks 使用指南]]

   ## 概述

   ## 核心概念

   ## 示例

   ## 参考资料
   ```

9. 原文档中的链接样式更新为正常链接

**预期结果**:

- 不存在的文档显示为虚线链接
- 点击可快速创建文档
- 支持选择保存位置和模板
- 创建后自动建立双向链接

---

### 核心场景 4: 孤立文档检测

**场景描述**:  
系统检测没有任何链接关系的文档，提醒用户建立关联。

**用户故事**:

```gherkin
As a 知识管理者
I want 发现孤立的文档
So that 确保知识网络的完整性
```

**操作流程**:

1. 用户打开知识仓库首页
2. 系统显示孤立文档提醒：

   ```
   ⚠️ 孤立文档 (5)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   以下文档没有任何链接关系，可能需要整合到知识网络中

   📄 JavaScript 闭包原理
      创建: 2025-09-15
      最后修改: 2025-09-15
      [查看]  [查找相关文档]

   📄 CSS Grid 布局
      创建: 2025-08-20
      最后修改: 2025-08-22
      [查看]  [查找相关文档]

   📄 HTTP 缓存策略
      创建: 2025-07-10
      最后修改: 2025-07-10
      [查看]  [查找相关文档]

   ...

   [批量处理]  [忽略]
   ```

3. 用户点击"JavaScript 闭包原理"的"查找相关文档"
4. 系统基于内容相似度推荐：

   ```
   💡 推荐关联 (3 个)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📄 JavaScript 作用域链
      相似度: 85%
      共同关键词: JavaScript, 作用域, 变量
      [添加链接]

   📄 前端面试题集
      相似度: 72%
      共同关键词: JavaScript, 原理
      [添加链接]

   📄 函数式编程入门
      相似度: 68%
      共同关键词: 函数, 闭包
      [添加链接]
   ```

5. 用户点击"添加链接"
6. 系统打开编辑器，建议插入位置：

   ```markdown
   # JavaScript 闭包原理

   ## 概述

   闭包是 JavaScript 的重要特性...

   ## 相关主题

   - [[JavaScript 作用域链]] ← 建议添加
   - [[函数式编程入门]] ← 建议添加
   ```

**预期结果**:

- 自动检测孤立文档
- 基于相似度推荐关联
- 支持批量处理

---

### 核心场景 5: 块级引用（Block Reference）

**场景描述**:  
用户引用文档中的特定段落或块。

**用户故事**:

```gherkin
As a 知识管理者
I want 引用文档中的特定段落
So that 精确引用而非整个文档
```

**操作流程**:

1. 用户在文档 A 中想引用文档 B 的某个段落
2. 打开文档 B，鼠标悬停在段落上：

   ```markdown
   ## useState 的使用

   useState 是最常用的 Hook，用于在函数组件中添加状态。
   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   (悬停时左侧显示 🔗 图标)
   ```

3. 点击 🔗 图标，系统生成块引用 ID：

   ```markdown
   ## useState 的使用

   useState 是最常用的 Hook，用于在函数组件中添加状态。 ^block-abc123
   ```

4. 复制块引用链接：
   ```
   [[React Hooks 使用指南#^block-abc123]]
   ```
5. 在文档 A 中粘贴：

   ```markdown
   # 我的学习笔记

   关于状态管理，参考：
   ![[React Hooks 使用指南#^block-abc123]]
   ```

6. 系统渲染为嵌入引用：
   ```
   ┌────────────────────────────────────┐
   │ 📄 引用自: React Hooks 使用指南     │
   ├────────────────────────────────────┤
   │ useState 是最常用的 Hook，用于在   │
   │ 函数组件中添加状态。               │
   └────────────────────────────────────┘
   ```
7. 如果原文档中的段落被修改：
   ```markdown
   useState 是最常用的 Hook，用于在函数组件中管理状态。 ^block-abc123
   ^^^^ (修改)
   ```
8. 引用会自动更新：
   ```
   ┌────────────────────────────────────┐
   │ 📄 引用自: React Hooks 使用指南     │
   ├────────────────────────────────────┤
   │ useState 是最常用的 Hook，用于在   │
   │ 函数组件中管理状态。               │
   │              ^^^^ (自动更新)       │
   └────────────────────────────────────┘
   ```

**预期结果**:

- 支持块级引用 ID 生成
- `![[]]` 语法嵌入引用内容
- 引用内容自动同步更新
- 显示引用来源

---

### 核心场景 6: 链接断裂检测与修复

**场景描述**:  
用户重命名或删除文档后，系统检测断裂链接并提供修复。

**用户故事**:

```gherkin
As a 知识管理者
I want 自动检测断裂的链接
So that 保持知识网络的完整性
```

**操作流程**:

1. 用户将文档"React 性能优化"重命名为"React 性能优化完整指南"
2. 系统检测到 3 个文档引用了旧名称
3. 弹出修复对话框：

   ```
   🔗 链接更新
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   检测到 3 个文档引用了 "React 性能优化"

   文档已重命名为: "React 性能优化完整指南"

   需要更新的链接:
   ☑️ React Hooks 使用指南 (1 处引用)
   ☑️ 前端性能监控实践 (1 处引用)
   ☑️ Web 应用优化清单 (1 处引用)

   [全部更新]  [手动选择]  [忽略]
   ```

4. 用户点击"全部更新"
5. 系统批量替换所有引用：

   ```markdown
   # 修改前

   参考 [[React 性能优化]]

   # 修改后

   参考 [[React 性能优化完整指南]]
   ```

6. 系统发送通知：
   ```
   ✅ 链接更新完成
   已更新 3 个文档中的 3 处引用
   ```
7. 如果用户删除文档，系统标记断裂链接：
   ```markdown
   参考 [[React 性能优化]] ⚠️ 链接断裂
   ^^^^^^^^^^^^^^^^
   (红色，删除线)
   ```
8. 悬停显示提示：
   ```
   ⚠️ 目标文档已被删除
   [撤销删除]  [查找替代文档]  [移除链接]
   ```

**预期结果**:

- 重命名时自动更新所有引用
- 删除时标记断裂链接
- 支持批量修复
- 提供撤销选项

---

## 3. 设计要点

### 涉及字段（对齐 Contracts）

#### 新增实体：DocumentLink（文档链接）

**位置**: `packages/contracts/src/modules/editor/entities/DocumentLinkServer.ts`

```typescript
/**
 * 文档链接
 */
export interface DocumentLinkServerDTO {
  readonly uuid: string;
  readonly sourceDocUuid: string; // 源文档 UUID
  readonly targetDocUuid: string; // 目标文档 UUID
  readonly linkType: LinkType; // 链接类型
  readonly anchorText: string; // 锚文本（显示文本）
  readonly position: LinkPosition; // 链接在源文档中的位置
  readonly blockRefId?: string; // 块引用 ID（如果是块级引用）
  readonly isBroken: boolean; // 是否断裂
  readonly createdBy: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

/**
 * 链接类型
 */
export enum LinkType {
  BIDIRECTIONAL = 'bidirectional', // 双向链接
  EMBED = 'embed', // 嵌入引用 (![[]])
  BLOCK_REF = 'block_ref', // 块引用
  EXTERNAL = 'external', // 外部链接
}

/**
 * 链接位置
 */
export interface LinkPosition {
  readonly line: number; // 行号（从 1 开始）
  readonly column: number; // 列号（从 1 开始）
  readonly length: number; // 链接长度
}
```

#### 新增实体：Backlink（反向引用）

**位置**: `packages/contracts/src/modules/editor/entities/BacklinkServer.ts`

```typescript
/**
 * 反向引用（自动计算，不存储）
 */
export interface BacklinkServerDTO {
  readonly docUuid: string; // 引用当前文档的文档 UUID
  readonly docTitle: string; // 文档标题
  readonly context: string; // 引用上下文（周边文本）
  readonly linkPosition: LinkPosition; // 链接位置
  readonly linkUuid: string; // 关联的 DocumentLink UUID
  readonly updatedAt: number; // 引用时间
}
```

#### 新增实体：BlockReference（块引用）

**位置**: `packages/contracts/src/modules/editor/entities/BlockReferenceServer.ts`

```typescript
/**
 * 块引用
 */
export interface BlockReferenceServerDTO {
  readonly uuid: string;
  readonly docUuid: string; // 文档 UUID
  readonly blockId: string; // 块 ID（如 ^block-abc123）
  readonly content: string; // 块内容
  readonly blockType: BlockType; // 块类型
  readonly position: BlockPosition; // 块位置
  readonly createdAt: number;
  readonly updatedAt: number;
}

/**
 * 块类型
 */
export enum BlockType {
  PARAGRAPH = 'paragraph', // 段落
  HEADING = 'heading', // 标题
  LIST_ITEM = 'list_item', // 列表项
  CODE_BLOCK = 'code_block', // 代码块
  QUOTE = 'quote', // 引用块
}

/**
 * 块位置
 */
export interface BlockPosition {
  readonly startLine: number;
  readonly endLine: number;
  readonly startColumn: number;
  readonly endColumn: number;
}
```

#### 更新 Document 实体

**位置**: `packages/contracts/src/modules/editor/entities/DocumentServer.ts`

```typescript
export interface DocumentServerDTO {
  // ...existing fields...

  // 链接相关
  readonly outgoingLinks?: DocumentLinkServerDTO[]; // 出链（本文档链接到其他文档）
  readonly backlinks?: BacklinkServerDTO[]; // 入链（其他文档链接到本文档）
  readonly isOrphan: boolean; // 是否孤立文档
  readonly linkCount: number; // 总链接数（出链 + 入链）
  readonly blockReferences?: BlockReferenceServerDTO[]; // 块引用
}
```

---

### 交互设计

#### 1. [[]] 语法解析

```typescript
// 正则匹配双向链接
const WIKI_LINK_REGEX = /\[\[([^\]]+)\]\]/g;

// 解析示例
const text = '参考 [[React Hooks]] 和 [[TypeScript 泛型]]';
const links = Array.from(text.matchAll(WIKI_LINK_REGEX));

// 结果
[
  { text: '[[React Hooks]]', linkText: 'React Hooks', position: 3 },
  { text: '[[TypeScript 泛型]]', linkText: 'TypeScript 泛型', position: 23 },
];
```

#### 2. 块引用语法

| 语法                 | 说明      | 示例                             |
| -------------------- | --------- | -------------------------------- |
| `^block-id`          | 定义块 ID | `段落内容 ^block-abc123`         |
| `[[doc#^block-id]]`  | 引用块    | `[[React Hooks#^block-abc123]]`  |
| `![[doc#^block-id]]` | 嵌入引用  | `![[React Hooks#^block-abc123]]` |
| `[[doc#heading]]`    | 引用标题  | `[[React Hooks#useState]]`       |

#### 3. 自动补全触发

| 触发条件     | 行为                               |
| ------------ | ---------------------------------- |
| 输入 `[[`    | 显示最近使用 + 搜索框              |
| 输入 `[[abc` | 实时过滤匹配文档                   |
| 选择文档     | 插入 `[[文档名]]`                  |
| 创建新文档   | 插入 `[[新文档名]]` 并标记为待创建 |

#### 4. 链接渲染样式

| 状态       | 样式              | 说明           |
| ---------- | ----------------- | -------------- |
| 正常链接   | 蓝色 + 下划线     | 目标文档存在   |
| 待创建链接 | 灰色 + 虚线下划线 | 目标文档不存在 |
| 断裂链接   | 红色 + 删除线     | 目标文档已删除 |
| 块引用     | 蓝色 + 📎 图标    | 引用特定块     |

---

## 4. MVP/MMP/Full 路径

### MVP: 基础双向链接（1-1.5 周）

**范围**:

- ✅ `[[]]` 语法解析和渲染
- ✅ 链接自动补全（基于文档名搜索）
- ✅ 创建链接到已存在文档
- ✅ 反向引用面板（显示 Backlinks）
- ✅ 链接点击跳转

**技术要点**:

- Contracts: 定义 `DocumentLinkServerDTO`, `BacklinkServerDTO`
- Domain: Document 聚合根添加 `addLink()` 方法
- Editor: 基于 CodeMirror/Monaco 的链接扩展
- API: `GET /api/v1/documents/:uuid/backlinks`
- UI: 自动补全组件 + 反向引用面板

**验收标准**:

```gherkin
Given 用户输入 [[React
When 系统检索到文档 "React Hooks 使用指南"
Then 应显示在自动补全列表中
And 用户选择后插入 [[React Hooks 使用指南]]
And 目标文档的反向引用应显示此链接
```

---

### MMP: 链接管理增强（+1 周）

**在 MVP 基础上新增**:

- ✅ 创建不存在的文档（待创建链接）
- ✅ 孤立文档检测
- ✅ 链接断裂检测与修复
- ✅ 未链接提及检测（Unlinked Mentions）
- ✅ 批量链接更新（重命名文档时）

**技术要点**:

- 定时任务检测孤立文档
- 文档重命名事件监听 + 链接更新
- NLP 检测未链接的文档名提及

**验收标准**:

```gherkin
Given 用户重命名文档 "A" 为 "B"
When 系统检测到 5 个文档引用了 "A"
Then 应提示用户批量更新
And 用户确认后更新所有 [[A]] 为 [[B]]
```

---

### Full Release: 块引用与高级功能（+1.5 周）

**在 MMP 基础上新增**:

- ✅ 块级引用（Block Reference）
- ✅ 嵌入引用 `![[]]`
- ✅ 标题引用 `[[doc#heading]]`
- ✅ 块引用内容自动同步
- ✅ 链接图谱可视化
- ✅ 链接导出（Markdown、图谱）

**技术要点**:

- Markdown AST 解析（块级定位）
- 实时同步引用内容
- 图谱可视化（D3.js/Cytoscape.js）

**验收标准**:

```gherkin
Given 文档 A 嵌入引用文档 B 的某个段落
When 文档 B 的段落内容被修改
Then 文档 A 中的嵌入内容应自动更新
```

---

## 5. 验收标准（Gherkin）

### Feature: 双向链接

#### Scenario 1: 创建双向链接

```gherkin
Feature: 双向链接
  作为知识管理者，我希望快速创建文档之间的链接

  Background:
    Given 用户"郑十"已登录
    And 知识仓库中有文档：
      | uuid  | title              | path          |
      | doc-1 | React Hooks 指南   | /前端/React   |
      | doc-2 | React 性能优化     | /前端/React   |

  Scenario: 使用 [[]] 创建链接
    When 用户在 doc-1 中输入 "参考 [["
    Then 应显示自动补全列表
    And 列表应包含 doc-2

    When 用户输入 "React 性能"
    Then 列表应过滤为仅显示 doc-2

    When 用户选择 doc-2
    Then 应插入 "[[React 性能优化]]"
    And 应创建 DocumentLink 记录：
      | 字段            | 值                  |
      | sourceDocUuid   | doc-1               |
      | targetDocUuid   | doc-2               |
      | linkType        | bidirectional       |
      | anchorText      | React 性能优化      |
```

---

#### Scenario 2: 查看反向引用

```gherkin
  Background:
    Given doc-2 被以下文档引用：
      | sourceDoc | context                           |
      | doc-1     | 参考 [[React 性能优化]] 了解更多  |
      | doc-3     | 另见 [[React 性能优化]]           |

  Scenario: 显示 Backlinks
    When 用户打开 doc-2
    Then 反向引用面板应显示 2 个引用
    And 应包含 doc-1 和 doc-3
    And 每个引用应显示上下文

    When 用户点击 doc-1 的"打开"
    Then 应跳转到 doc-1
    And 高亮显示链接位置
```

---

#### Scenario 3: 创建不存在的文档

```gherkin
  Scenario: 链接到待创建文档
    When 用户在 doc-1 中输入 "[[TypeScript 高级类型]]"
    And "TypeScript 高级类型" 文档不存在
    Then 链接应渲染为虚线样式
    And 鼠标悬停应提示 "该文档尚未创建"

    When 用户点击该链接
    Then 应弹出创建文档对话框
    And 默认标题为 "TypeScript 高级类型"

    When 用户确认创建
    Then 应创建新文档
    And 链接样式应更新为正常
    And 新文档应包含反向引用到 doc-1
```

---

#### Scenario 4: 孤立文档检测

```gherkin
  Background:
    Given 知识仓库有 10 个文档
    And 其中 3 个文档没有任何链接

  Scenario: 检测并提示孤立文档
    When 用户打开知识仓库首页
    Then 应显示孤立文档提醒
    And 提醒应包含 3 个孤立文档

    When 用户点击某个孤立文档的"查找相关文档"
    Then 应推荐相似文档
    And 推荐基于标签和内容相似度

    When 用户点击"添加链接"
    Then 应在孤立文档中插入推荐文档的链接
```

---

#### Scenario 5: 块级引用

```gherkin
  Background:
    Given doc-2 包含段落：
      """
      useState 是最常用的 Hook。
      """

  Scenario: 创建块引用
    When 用户在 doc-2 中为该段落添加块 ID "^hook-useState"
    Then 段落应更新为：
      """
      useState 是最常用的 Hook。 ^hook-useState
      """

    When 用户在 doc-1 中输入 "![[React 性能优化#^hook-useState]]"
    Then 应嵌入显示该段落内容
    And 显示引用来源 "引用自: React 性能优化"

    When doc-2 中的段落被修改为 "useState 是最基础的 Hook。"
    Then doc-1 中的嵌入内容应自动更新
```

---

#### Scenario 6: 链接断裂修复

```gherkin
  Background:
    Given doc-1 引用了 doc-2：
      """
      参考 [[React 性能优化]]
      """

  Scenario: 重命名文档后更新链接
    When 用户将 doc-2 重命名为 "React 性能优化完整指南"
    Then 应提示："检测到 1 个文档引用了旧名称"
    And 提供选项："全部更新" 或 "忽略"

    When 用户选择"全部更新"
    Then doc-1 中的链接应更新为 "[[React 性能优化完整指南]]"
    And 应发送通知："已更新 1 处引用"

  Scenario: 删除文档后标记断裂链接
    When 用户删除 doc-2
    Then doc-1 中的链接应标记为断裂
    And 样式应为红色删除线
    And 悬停应提示："目标文档已删除"
    And 提供选项："撤销删除" 或 "移除链接"
```

---

## 6. 指标与追踪

### 事件埋点

```typescript
// 创建链接
{
  event: 'document_link_created',
  properties: {
    sourceDocUuid: string,
    targetDocUuid: string,
    linkType: LinkType,
    createdMethod: 'autocomplete' | 'manual' | 'paste'
  }
}

// 查看反向引用
{
  event: 'backlinks_viewed',
  properties: {
    docUuid: string,
    backlinkCount: number
  }
}

// 创建不存在的文档
{
  event: 'placeholder_doc_created',
  properties: {
    docUuid: string,
    triggeredByLink: boolean
  }
}

// 修复断裂链接
{
  event: 'broken_links_fixed',
  properties: {
    brokenLinkCount: number,
    fixMethod: 'auto_update' | 'manual_replace' | 'remove'
  }
}

// 块引用创建
{
  event: 'block_reference_created',
  properties: {
    docUuid: string,
    blockId: string,
    blockType: BlockType
  }
}
```

---

### 成功指标

**定量指标**:
| 指标 | 目标值 | 测量方式 |
|------|-------|---------|
| 文档链接率 | >80% | 有链接的文档数 / 总文档数 |
| 平均链接数/文档 | >5 | 总链接数 / 文档数 |
| 孤立文档率 | <10% | 孤立文档数 / 总文档数 |
| 断裂链接修复率 | >90% | 修复链接数 / 断裂链接数 |

**定性指标**:

- 用户反馈"创建链接更方便"
- 知识网络密度增加
- 文档检索效率提升

---

## 7. 技术实现要点

### Prisma Schema

```prisma
model DocumentLink {
  uuid          String   @id @default(uuid())
  sourceDocUuid String   @map("source_doc_uuid")
  targetDocUuid String   @map("target_doc_uuid")
  linkType      String   @map("link_type")
  anchorText    String   @map("anchor_text")
  position      Json     @map("position")  // LinkPosition
  blockRefId    String?  @map("block_ref_id")
  isBroken      Boolean  @default(false) @map("is_broken")
  createdBy     String   @map("created_by")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  sourceDoc     Document @relation("OutgoingLinks", fields: [sourceDocUuid], references: [uuid])
  targetDoc     Document @relation("IncomingLinks", fields: [targetDocUuid], references: [uuid])

  @@index([sourceDocUuid])
  @@index([targetDocUuid])
  @@index([isBroken])
  @@map("document_links")
}

model BlockReference {
  uuid      String   @id @default(uuid())
  docUuid   String   @map("doc_uuid")
  blockId   String   @map("block_id")
  content   String   @db.Text @map("content")
  blockType String   @map("block_type")
  position  Json     @map("position")  // BlockPosition
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  document  Document @relation(fields: [docUuid], references: [uuid])

  @@unique([docUuid, blockId])
  @@index([docUuid])
  @@map("block_references")
}

// 更新 Document 模型
model Document {
  // ...existing fields...

  outgoingLinks   DocumentLink[] @relation("OutgoingLinks")
  incomingLinks   DocumentLink[] @relation("IncomingLinks")
  blockReferences BlockReference[]
  isOrphan        Boolean        @default(false) @map("is_orphan")
  linkCount       Int            @default(0) @map("link_count")

  @@map("documents")
}
```

### Editor Extension

```typescript
// packages/domain-client/src/modules/editor/extensions/WikiLinkExtension.ts

import { Extension } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';

// Wiki Link 装饰器
function wikiLinkDecorator(view: EditorView): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  const text = view.state.doc.toString();
  const regex = /\[\[([^\]]+)\]\]/g;

  let match;
  while ((match = regex.exec(text)) !== null) {
    const linkText = match[1];
    const from = match.index;
    const to = from + match[0].length;

    // 检查目标文档是否存在
    const exists = await checkDocumentExists(linkText);

    const decoration = Decoration.mark({
      class: exists ? 'wiki-link' : 'wiki-link-broken',
      attributes: { 'data-link': linkText },
    });

    decorations.push(decoration.range(from, to));
  }

  return Decoration.set(decorations);
}

// 自动补全
function wikiLinkCompletion(context: CompletionContext) {
  const before = context.matchBefore(/\[\[([^\]]*)$/);
  if (!before) return null;

  const query = before.text.slice(2); // 移除 [[

  return {
    from: before.from,
    options: await searchDocuments(query),
    validFor: /^[\w\s-]*$/,
  };
}

export const wikiLinkExtension = Extension.create([
  ViewPlugin.fromClass(/* decorator */),
  autocompletion({ override: [wikiLinkCompletion] }),
]);
```

### Application Service

```typescript
// packages/domain-server/src/modules/editor/application/DocumentLinkService.ts

export class DocumentLinkService {
  // 解析文档中的所有链接
  async parseLinks(docUuid: string, content: string): Promise<DocumentLink[]> {
    const regex = /\[\[([^\]]+)\]\]/g;
    const links: DocumentLink[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      const linkText = match[1];
      const position = this.calculatePosition(content, match.index);

      // 查找目标文档
      const targetDoc = await this.documentRepository.findByTitle(linkText);

      const link = new DocumentLink({
        sourceDocUuid: docUuid,
        targetDocUuid: targetDoc?.uuid || null,
        linkType: LinkType.BIDIRECTIONAL,
        anchorText: linkText,
        position,
        isBroken: !targetDoc,
      });

      links.push(link);
    }

    return links;
  }

  // 计算反向引用
  async calculateBacklinks(docUuid: string): Promise<Backlink[]> {
    const incomingLinks = await this.linkRepository.findByTarget(docUuid);

    const backlinks: Backlink[] = [];

    for (const link of incomingLinks) {
      const sourceDoc = await this.documentRepository.findByUuid(link.sourceDocUuid);
      const context = this.extractContext(sourceDoc.content, link.position);

      backlinks.push({
        docUuid: sourceDoc.uuid,
        docTitle: sourceDoc.title,
        context,
        linkPosition: link.position,
        linkUuid: link.uuid,
        updatedAt: link.updatedAt,
      });
    }

    return backlinks;
  }

  // 提取链接上下文
  private extractContext(content: string, position: LinkPosition, radius: number = 50): string {
    const start = Math.max(0, position.column - radius);
    const end = Math.min(content.length, position.column + position.length + radius);

    return content.slice(start, end);
  }

  // 处理文档重命名
  async handleDocumentRenamed(
    docUuid: string,
    oldTitle: string,
    newTitle: string,
  ): Promise<{ updated: number; affected: string[] }> {
    const incomingLinks = await this.linkRepository.findByTarget(docUuid);

    const affectedDocs = new Set<string>();
    let updatedCount = 0;

    for (const link of incomingLinks) {
      const sourceDoc = await this.documentRepository.findByUuid(link.sourceDocUuid);

      // 替换链接文本
      const newContent = sourceDoc.content.replace(`[[${oldTitle}]]`, `[[${newTitle}]]`);

      sourceDoc.updateContent(newContent);
      await this.documentRepository.save(sourceDoc);

      affectedDocs.add(sourceDoc.uuid);
      updatedCount++;
    }

    return {
      updated: updatedCount,
      affected: Array.from(affectedDocs),
    };
  }

  // 检测孤立文档
  async detectOrphanDocuments(): Promise<Document[]> {
    const allDocs = await this.documentRepository.findAll();
    const orphans: Document[] = [];

    for (const doc of allDocs) {
      const outgoingLinks = await this.linkRepository.findBySource(doc.uuid);
      const incomingLinks = await this.linkRepository.findByTarget(doc.uuid);

      if (outgoingLinks.length === 0 && incomingLinks.length === 0) {
        doc.markAsOrphan();
        orphans.push(doc);
      }
    }

    return orphans;
  }
}
```

### API 端点

```typescript
// 解析文档链接
POST /api/v1/documents/:uuid/parse-links
Response: {
  links: DocumentLinkClientDTO[],
  brokenLinks: DocumentLinkClientDTO[]
}

// 获取反向引用
GET /api/v1/documents/:uuid/backlinks
Response: {
  backlinks: BacklinkClientDTO[],
  count: number
}

// 创建链接
POST /api/v1/documents/:uuid/links
Body: {
  targetDocUuid: string,
  anchorText: string,
  position: LinkPosition,
  linkType?: LinkType
}
Response: DocumentLinkClientDTO

// 批量更新链接（重命名时）
POST /api/v1/documents/:uuid/update-links
Body: {
  oldTitle: string,
  newTitle: string
}
Response: {
  updated: number,
  affectedDocs: string[]
}

// 获取孤立文档
GET /api/v1/documents/orphans
Response: {
  orphans: DocumentClientDTO[],
  count: number
}

// 创建块引用
POST /api/v1/documents/:uuid/block-references
Body: {
  blockId: string,
  content: string,
  blockType: BlockType,
  position: BlockPosition
}
Response: BlockReferenceClientDTO

// 获取文档的块引用
GET /api/v1/documents/:uuid/block-references
Response: {
  blocks: BlockReferenceClientDTO[]
}
```

---

## 8. 风险与缓解

| 风险               | 可能性 | 影响 | 缓解措施              |
| ------------------ | ------ | ---- | --------------------- |
| 大文档解析性能问题 | 中     | 中   | 增量解析 + Web Worker |
| 链接更新一致性     | 高     | 高   | 事务保证 + 乐观锁     |
| 块引用内容不同步   | 中     | 中   | WebSocket 实时推送    |
| 编辑器扩展兼容性   | 中     | 中   | 充分测试 + 降级方案   |

---

## 9. 后续增强方向

### Phase 2 功能

- 🔄 链接图谱可视化（力导向图）
- 📊 链接强度分析（引用频率）
- 🤖 AI 推荐链接
- 📱 移动端链接支持

### Phase 3 功能

- 🔗 跨仓库链接
- 👥 团队协作链接（实时同步）
- 🎯 链接版本历史
- 📈 知识图谱导出（Neo4j）

---

## 10. 参考资料

- [Editor Contracts](../../../../packages/contracts/src/modules/editor/)
- [Obsidian 双向链接文档](https://help.obsidian.md/Linking+notes+and+files/Internal+links)
- [Roam Research 块引用](https://roamresearch.com/#/app/help/page/dZ72V0Ig6)
- [CodeMirror 6 文档](https://codemirror.net/docs/)

---

**文档状态**: ✅ Ready for PM Review  
**下一步**: PM 生成 Project Flow

---

**文档维护**:

- 创建: 2025-10-21
- 创建者: PO Agent
- 版本: 1.0
- 下次更新: Sprint Planning 前
