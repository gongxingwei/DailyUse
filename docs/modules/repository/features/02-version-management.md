# Feature Spec: 文档版本管理

> **功能编号**: REPOSITORY-002  
> **RICE 评分**: 126 (Reach: 6, Impact: 6, Confidence: 7, Effort: 2)  
> **优先级**: P2  
> **预估时间**: 1-1.5 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 背景与痛点

文档编辑过程中缺少版本管理：
- ❌ 误删重要内容无法恢复
- ❌ 无法查看历史版本
- ❌ 不知道谁改了什么
- ❌ 协作时版本混乱

### 价值主张

**一句话价值**: Git-style 版本管理，保护文档历史并支持版本对比和回滚

**核心收益**:
- ✅ 自动保存版本快照
- ✅ 版本历史查看
- ✅ 版本对比（Diff）
- ✅ 一键回滚
- ✅ 协作者追踪

---

## 2. 用户价值与场景

### 核心场景 1: 自动版本保存

**场景描述**:  
用户编辑文档时，系统自动创建版本快照。

**用户故事**:
```gherkin
As a 用户
I want 文档自动保存版本
So that 随时可以恢复历史内容
```

**操作流程**:
1. 用户打开文档"产品需求文档"
2. 编辑并保存，系统自动创建版本：
   ```typescript
   async function createVersion(document: Document): Promise<Version> {
     const version = {
       uuid: generateUUID(),
       documentUuid: document.uuid,
       content: document.content,
       title: document.title,
       versionNumber: document.currentVersion + 1,
       changeType: detectChangeType(document),
       changedBy: currentUser.uuid,
       changeDescription: generateAutoDescription(document),
       createdAt: Date.now()
     };
     
     return this.versionRepository.save(version);
   }
   
   function detectChangeType(doc: Document): ChangeType {
     const oldContent = doc.previousContent;
     const newContent = doc.content;
     
     const lengthDiff = newContent.length - oldContent.length;
     
     if (lengthDiff > 100) return 'major';      // 主要修改
     if (lengthDiff > 20) return 'minor';       // 次要修改
     return 'patch';                            // 修正
   }
   ```

3. 文档详情显示版本信息：
   ```
   📄 产品需求文档
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   当前版本: v12  (2025-10-21 14:30)
   最后编辑: 张三
   
   [查看历史版本]  [版本对比]
   ```

**预期结果**:
- 自动版本快照
- 无需手动操作
- 完整历史保留

---

### 核心场景 2: 查看版本历史

**场景描述**:  
用户查看文档的所有历史版本。

**用户故事**:
```gherkin
As a 用户
I want 查看文档历史版本
So that 了解文档演变过程
```

**操作流程**:
1. 用户点击"查看历史版本"
2. 显示版本时间线：
   ```
   📜 版本历史 - 产品需求文档
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   🔵 v12  2025-10-21 14:30  当前版本
   by 张三
   • 添加用户故事 3 个
   • 修改需求优先级
   [查看] [对比]
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   ⚪ v11  2025-10-21 10:15  (4 小时前)
   by 李四
   • 补充技术方案
   • 修正错别字 2 处
   [查看] [对比] [恢复此版本]
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   ⚪ v10  2025-10-20 16:45  (1 天前)
   by 张三
   • 重大修改：重构需求结构
   • 删除过时需求 2 个
   [查看] [对比] [恢复此版本]
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   ⚪ v9   2025-10-19 14:20  (2 天前)
   by 王五
   • 添加 API 接口说明
   [查看] [对比] [恢复此版本]
   
   [显示更多...]  [筛选版本]
   ```

3. 用户点击"查看" v10
4. 显示该版本内容快照：
   ```
   📄 版本 v10 快照
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   时间: 2025-10-20 16:45
   作者: 张三
   变更: 重大修改（+285 字符）
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   [文档内容快照显示...]
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   [恢复此版本]  [与当前版本对比]  [关闭]
   ```

**预期结果**:
- 完整版本历史
- 清晰的变更描述
- 快速查看和对比

---

### 核心场景 3: 版本对比（Diff）

**场景描述**:  
用户对比两个版本的差异。

**用户故事**:
```gherkin
As a 用户
I want 对比两个版本
So that 了解具体修改内容
```

**操作流程**:
1. 用户选择对比 v12 和 v10
2. 显示 Diff 视图：
   ```
   📊 版本对比: v10 → v12
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   左侧: v10 (2025-10-20 16:45) by 张三
   右侧: v12 (2025-10-21 14:30) by 张三 (当前版本)
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   v10                              v12
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   # 产品需求文档                   # 产品需求文档
   
   ## 1. 需求概述                   ## 1. 需求概述
   
   本期目标：实现用户管理功能       本期目标：实现用户管理功能
   
                                    ## 2. 用户故事（新增）
                                    
                                    US-001: 作为管理员...
                                    US-002: 作为普通用户...
   
   ## 2. 技术方案                   ## 3. 技术方案
   
   - 使用 JWT 认证                  - 使用 JWT 认证
   - 数据库：PostgreSQL             - 数据库：PostgreSQL
   - 缓存：Redis ⚠️已删除           
   
   优先级：P1                       优先级：P0 ⚠️已修改
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   统计：
   • 新增: 3 段落（绿色）
   • 删除: 1 段落（红色）
   • 修改: 1 处（黄色）
   
   [导出 Diff]  [恢复到 v10]  [关闭]
   ```

**预期结果**:
- 清晰的差异标识
- 支持多种 Diff 视图（并排/统一）
- 高亮新增、删除、修改

---

### 核心场景 4: 版本回滚

**场景描述**:  
用户恢复到某个历史版本。

**用户故事**:
```gherkin
As a 用户
I want 恢复到历史版本
So that 撤销错误修改
```

**操作流程**:
1. 用户在版本历史中点击 v10 的"恢复此版本"
2. 弹出确认对话框：
   ```
   ⚠️ 恢复版本确认
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   你确定要恢复到 v10 吗？
   
   版本信息：
   • 时间: 2025-10-20 16:45
   • 作者: 张三
   • 描述: 重构需求结构
   
   ⚠️ 注意：
   • 当前版本 v12 的内容将被覆盖
   • 但 v12 会保留在历史中，可再次恢复
   • 恢复后会创建新版本 v13
   
   恢复原因（可选）:
   [文本框...]
   
   [确认恢复]  [取消]
   ```

3. 用户确认，系统执行回滚：
   ```typescript
   async function restoreVersion(
     documentUuid: string,
     targetVersionUuid: string,
     reason?: string
   ): Promise<Document> {
     const document = await this.documentRepository.findByUuid(documentUuid);
     const targetVersion = await this.versionRepository.findByUuid(targetVersionUuid);
     
     // 1. 保存当前版本（防止误操作）
     await this.createVersion(document);
     
     // 2. 恢复内容
     document.content = targetVersion.content;
     document.title = targetVersion.title;
     document.currentVersion += 1;
     
     // 3. 创建新版本记录
     await this.createVersion(document, {
       changeType: 'restore',
       changeDescription: `恢复到版本 ${targetVersion.versionNumber}${reason ? ': ' + reason : ''}`,
       restoredFrom: targetVersionUuid
     });
     
     return document;
   }
   ```

4. 显示成功提示：
   ```
   ✅ 版本恢复成功
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   已从 v10 恢复，创建新版本 v13
   
   [查看文档]  [查看版本历史]
   ```

**预期结果**:
- 安全的回滚机制
- 保留完整历史
- 支持再次恢复

---

## 3. 设计要点

### Contracts

#### 新增实体：DocumentVersion

```typescript
export interface DocumentVersionServerDTO {
  readonly uuid: string;
  readonly documentUuid: string;
  readonly versionNumber: number;
  readonly content: string;
  readonly title: string;
  readonly changeType: 'major' | 'minor' | 'patch' | 'restore';
  readonly changeDescription?: string;
  readonly changedBy: string;
  readonly restoredFrom?: string;        // 如果是恢复操作，记录源版本
  readonly metadata?: {
    readonly addedChars: number;
    readonly deletedChars: number;
    readonly modifiedSections: number;
  };
  readonly createdAt: number;
}
```

#### 更新 Document 实体

```typescript
export interface DocumentServerDTO {
  // ...existing fields...
  readonly currentVersion: number;
  readonly lastVersionedAt?: number;
}
```

---

### 版本策略

| 触发条件 | 版本类型 | 描述 |
|---------|---------|------|
| 手动保存 | auto | 每次保存自动创建 |
| 大幅修改 (>100 字符) | major | 主要版本 |
| 中等修改 (20-100 字符) | minor | 次要版本 |
| 小修改 (<20 字符) | patch | 修正版本 |
| 恢复操作 | restore | 版本回滚 |

---

### Diff 算法

```typescript
import { diffChars, diffWords, diffLines } from 'diff';

function generateDiff(
  oldContent: string,
  newContent: string,
  granularity: 'char' | 'word' | 'line' = 'line'
): DiffResult[] {
  let diff;
  
  switch (granularity) {
    case 'char':
      diff = diffChars(oldContent, newContent);
      break;
    case 'word':
      diff = diffWords(oldContent, newContent);
      break;
    case 'line':
      diff = diffLines(oldContent, newContent);
      break;
  }
  
  return diff.map(part => ({
    type: part.added ? 'added' : part.removed ? 'removed' : 'unchanged',
    value: part.value,
    count: part.count
  }));
}
```

---

## 4. MVP 范围

### MVP（1 周）

- ✅ 自动版本保存
- ✅ 版本历史列表
- ✅ 查看历史快照
- ✅ 简单 Diff（行级）
- ✅ 版本回滚

### Full（+0.5 周）

- ✅ 高级 Diff（字符级、词级）
- ✅ 版本标签（重要里程碑）
- ✅ 版本分支（实验性修改）
- ✅ 版本压缩（合并小修改）

---

## 5. 验收标准（Gherkin）

```gherkin
Feature: 文档版本管理

  Scenario: 自动保存版本
    Given 用户编辑文档
    When 保存文档
    Then 应自动创建新版本
    And 版本号递增
    
  Scenario: 版本回滚
    Given 文档当前版本 v12
    When 用户恢复到 v10
    Then 应创建新版本 v13
    And 内容与 v10 相同
    And v12 保留在历史中
```

---

## 6. 成功指标

| 指标 | 目标值 |
|------|-------|
| 版本保存率 | 100% 保存操作创建版本 |
| 版本恢复使用 | >5% 用户使用过回滚 |
| Diff 查看率 | >20% 用户查看版本对比 |

---

**文档状态**: ✅ Ready for Review

