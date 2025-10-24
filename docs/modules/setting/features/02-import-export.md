# Feature Spec: 数据导入导出

> **功能编号**: SETTING-002  
> **RICE 评分**: 98 (Reach: 5, Impact: 5, Confidence: 7, Effort: 1.8)  
> **优先级**: P2  
> **预估时间**: 1 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 价值主张

**核心收益**:

- ✅ 数据备份和恢复
- ✅ 跨平台迁移
- ✅ 支持多种格式（JSON/CSV/Markdown）
- ✅ 选择性导出

---

## 2. 核心场景

### 场景 1: 导出数据

```
📤 导出数据
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

选择导出内容:
☑️ 目标 (23 个)
☑️ 任务 (145 个)
☑️ 日程 (89 个)
☑️ 提醒 (34 个)
☑️ 文档 (56 个)

时间范围:
⚪ 全部
🔘 最近 30 天
⚪ 最近 90 天
⚪ 自定义

导出格式:
🔘 JSON (完整数据)
⚪ CSV (适合 Excel)
⚪ Markdown (文档)

[开始导出]  [取消]
```

---

### 场景 2: 导入数据

```
📥 导入数据
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 选择文件
[选择文件...]  daily-use-backup-2025-10-21.json

2. 预览导入内容
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

检测到：
✅ 目标: 23 个
✅ 任务: 145 个
⚠️ 日程: 89 个（15 个已存在）
✅ 提醒: 34 个

3. 冲突处理
对于已存在的数据:
🔘 跳过
⚪ 覆盖
⚪ 创建副本

[开始导入]  [取消]
```

---

### 场景 3: 自动备份

```
🔄 自动备份
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

启用自动备份: ☑️

备份频率:
🔘 每天
⚪ 每周
⚪ 每月

备份时间: [02:00]

保留份数: [7] 份

备份位置:
🔘 本地存储
⚪ 云端同步（OneDrive/Dropbox）

最近备份:
• 2025-10-21 02:00  (12.3 MB)
• 2025-10-20 02:00  (11.8 MB)
• 2025-10-19 02:00  (11.5 MB)

[立即备份]  [恢复备份]
```

---

## 3. 技术要点

```typescript
// 导出服务
interface ExportService {
  async exportData(options: ExportOptions): Promise<Blob> {
    const data = {
      version: '1.0',
      exportedAt: Date.now(),
      user: currentUser.uuid,
      data: {
        goals: options.includeGoals ? await this.goalRepo.findAll() : [],
        tasks: options.includeTasks ? await this.taskRepo.findAll() : [],
        schedules: options.includeSchedules ? await this.scheduleRepo.findAll() : [],
        // ...
      }
    };

    switch (options.format) {
      case 'json':
        return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      case 'csv':
        return this.convertToCSV(data);
      case 'markdown':
        return this.convertToMarkdown(data);
    }
  }
}

// 导入服务
interface ImportService {
  async importData(file: File): Promise<ImportResult> {
    const content = await file.text();
    const data = JSON.parse(content);

    // 验证数据格式
    this.validateData(data);

    // 检测冲突
    const conflicts = await this.detectConflicts(data);

    // 导入数据
    const result = await this.importWithConflictResolution(data, conflicts);

    return result;
  }
}
```

---

## 4. MVP 范围

- ✅ JSON 导出/导入
- ✅ 选择性导出
- ✅ 冲突检测
- ✅ 手动备份

---

**文档状态**: ✅ Ready
