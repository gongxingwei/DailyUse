# MCP 快速开始指南

## 🚀 5分钟设置 MCP

### 1. 安装 MCP 包
```powershell
.\scripts\install-mcp.ps1
```

### 2. 配置 Brave Search API（可选）
1. 访问：https://api.search.brave.com/app/keys
2. 获取免费 API Key
3. 在 `.vscode/settings.json` 中替换 `YOUR_BRAVE_API_KEY_HERE`

### 3. 重启 VS Code

### 4. 测试 MCP 功能
在 Copilot Chat 中试试这些命令：

```
"分析当前项目的架构"
"为 Vue 应用创建一个新组件"
"优化 Electron 应用的性能"
```

## ✅ 验证安装

如果看到 AI 能够：
- 理解您的项目结构
- 基于实际代码提供建议
- 分析 Git 历史
- 理解数据库结构

说明 MCP 配置成功！

## 🆘 遇到问题？

查看完整文档：`docs/MCP-Configuration-Guide.md`

常见问题：
- **MCP 不工作**：检查包是否全局安装
- **路径错误**：确认 `.vscode/settings.json` 中的路径正确
- **性能问题**：添加文件过滤规则

---
💡 **提示**：MCP 会让您的 AI 编程助手更智能！
