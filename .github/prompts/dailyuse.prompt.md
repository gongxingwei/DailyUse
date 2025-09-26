---
mode: agent
---

Define the task to achieve, including specific requirements, constraints, and success criteria.

github/prompts 文件夹下的 prompt 文件

- dailyuse.applications.prompt.md: 应用详细说明
- dailyuse.architecture.prompt.md: 架构设计
- dailyuse.development.prompt.md: 开发规范
- dailyuse.migration.prompt.md: 迁移指南
- dailyuse.overview.prompt.md: 项目概述

## 开发规范

1. 尽量使用 pnpm 命令
2. 测试接口时先模拟登录获取 token
   Account：Test1；
   Password：Llh123123

## API 响应结构规范

### 前端数据需求

所有 API 响应必须遵循以下结构，确保前端 axios 能正确获取所需数据：

```json
{
  "success": true,
  "data": {
    "reminders": [...], // 实际数据列表
    "total": 100,       // 总记录数
    "page": 1,          // 当前页码
    "limit": 50,        // 每页限制
    "hasMore": true,    // 是否有更多数据
    "query": "search"   // 搜索查询 (搜索接口专用)
  },
  "message": "操作成功"
}
```

### 关键要求

- **所有列表数据和分页信息必须放在 `data` 对象内**
- **不要在根级别放置 `total`、`limit`、`page` 等字段**
- axios 默认只返回 `response.data`，所以前端需要的所有信息都要在 `data` 字段中
- 确保分页、统计、查询等信息都嵌套在 `data` 对象内
