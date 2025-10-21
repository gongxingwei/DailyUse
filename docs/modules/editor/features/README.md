# Editor 模块功能文档# Editor 模块功能构思



本目录收录 Editor 模块的所有 Feature Spec 文档。本文件汇总 Editor 模块所有“超越 CRUD”的功能点，分阶段（MVP/MMP/未来）列出，并链接详细文档。



## 📋 功能列表## MVP



| 编号 | 功能名称 | 优先级 | 文档 |1. 富文本协作编辑（[01-collaborative-richtext.md](./01-collaborative-richtext.md)）

|------|---------|--------|------|2. 版本快照与回滚（[02-version-snapshot.md](./02-version-snapshot.md)）

| EDITOR-001 | 双向链接 | P1 | [01-bidirectional-links.md](./01-bidirectional-links.md) |3. Markdown/代码块智能高亮（[03-markdown-code-highlight.md](./03-markdown-code-highlight.md)）

| EDITOR-002 | Markdown 编辑器 | P2 | [02-markdown-editor.md](./02-markdown-editor.md) |4. 编辑历史与变更对比（[04-edit-history-diff.md](./04-edit-history-diff.md)）

| EDITOR-003 | 协同编辑 | P3 | [03-collaborative-editing.md](./03-collaborative-editing.md) |

## MMP

## 📊 统计信息

5. 评论与批注（[05-inline-comment.md](./05-inline-comment.md)）

- **总功能数**: 36. 智能格式/排版建议（[06-format-suggestion.md](./06-format-suggestion.md)）

- **P1 功能**: 1 个7. 多端同步与离线编辑（[07-offline-sync.md](./07-offline-sync.md)）

- **P2 功能**: 1 个8. 编辑器插件生态（[08-plugin-ecosystem.md](./08-plugin-ecosystem.md)）

- **P3 功能**: 1 个

## Future

## 🔍 功能说明

- AI 辅助写作

### 双向链接 (P1)- 结构化内容提取

类 Notion/Obsidian 的双向链接系统，支持 `[[文档名]]` 语法

### Markdown 编辑器 (P2)
基于 TipTap/Milkdown 的所见即所得 Markdown 编辑器

### 协同编辑 (P3)
基于 Yjs CRDT 的实时多人协同编辑

---

*最后更新: 2025-10-21*
