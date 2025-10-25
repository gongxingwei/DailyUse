# BMAD Persistent Mode - 持久化角色激活指南

> **更新日期**: 2025-10-24  
> **BMAD 版本**: Core v1.1 (Enhanced)  
> **改进**: 添加持久化角色状态支持

---

## 🎯 问题背景

### 原始设计（单次激活）

**旧行为**:
```
用户: 切换到 sm
AI: [激活 Bob (Scrum Master)] 👋 你好！我是...
AI: [自动运行 *help]
用户: *draft
AI: [执行 create-next-story.md 任务]
AI: [任务完成后，角色状态丢失]
用户: *draft  ❌ 失效！需要重新激活
```

**痛点**:
- 每次执行命令后需要重新激活角色
- 上下文丢失，工作流中断
- 多个连续任务时效率低下

---

## ✅ 新设计（持久化模式）

### 改进后的行为

**新行为**:
```
用户: 切换到 sm
AI: [激活 Bob (Scrum Master)] 👋 你好！我是...
AI: [自动运行 *help]
用户: *draft
AI: [执行 create-next-story.md 任务]
AI: [任务完成，保持 Scrum Master 角色状态]
用户: *draft  ✅ 仍然有效！无需重新激活
用户: *story-checklist  ✅ 继续使用其他命令
用户: *exit
AI: [退出角色，返回通用 AI 助手]
```

**优势**:
- ✅ 一次激活，持续使用
- ✅ 保持角色上下文
- ✅ 支持连续工作流
- ✅ 显式退出机制（`*exit`）

---

## 📋 使用指南

### 1. 激活角色（一次性）

```bash
# 激活 Scrum Master (Bob)
用户: 切换到 sm

# 激活 Developer (James)
用户: 切换到 dev

# 或者使用英文
用户: switch to sm
用户: activate developer
```

**激活后自动行为**:
1. ✅ 加载 `.bmad-core/core-config.yaml`
2. ✅ 显示角色欢迎信息
3. ✅ 自动执行 `*help` 显示可用命令
4. ✅ 等待用户输入命令

---

### 2. 持续使用命令（无需重新激活）

**Scrum Master (Bob) 命令**:
```bash
*help              # 显示所有可用命令
*draft             # 创建下一个 Story
*story-checklist   # 验证 Story 完整性
*correct-course    # 修正项目方向
*exit              # 退出 Scrum Master 角色
```

**Developer (James) 命令**:
```bash
*help              # 显示所有可用命令
*develop-story     # 实现当前 Story
*explain           # 详细解释刚才的操作
*review-qa         # 应用 QA 修复
*run-tests         # 执行 lint 和测试
*exit              # 退出 Developer 角色
```

---

### 3. 退出角色

```bash
用户: *exit

AI (Bob): 👋 再见！我已完成 Scrum Master 职责。
          Story 9.1 已就绪，Story 9.2 待创建。
          [返回通用 AI 助手模式]
```

**退出后**:
- ❌ `*` 命令将失效
- ✅ 可以重新激活其他角色
- ✅ 可以进行通用对话

---

## 🔄 角色切换工作流

### 典型 Sprint 工作流

```bash
# Phase 1: Story 创建 (Scrum Master)
用户: 切换到 sm
Bob: [激活] 👋 我是 Bob，Scrum Master...
用户: *draft
Bob: [创建 Story 9.1] ✅ 完成
用户: *draft
Bob: [创建 Story 9.2] ✅ 完成
用户: *story-checklist
Bob: [验证 Story 9.2] ✅ 完成
用户: *exit
Bob: 👋 再见！

# Phase 2: Story 实现 (Developer)
用户: 切换到 dev
James: [激活] 👋 我是 James，Full Stack Developer...
用户: *develop-story docs/pm/stories/9.1.story.md
James: [实现 Story 9.1]
  - Task 1: ✅ 创建 Contracts
  - Task 2: ✅ 实现 Domain Logic
  - Task 3: ✅ 编写单元测试
James: ✅ Story 9.1 完成！Ready for Review
用户: *run-tests
James: [执行测试] ✅ All tests pass
用户: *exit
James: 👋 完成开发任务！

# Phase 3: 代码审查 (通用对话)
用户: 帮我审查 Story 9.1 的代码
AI: [通用助手模式] 当然！让我查看...
```

---

## 🛠️ 技术实现

### 修改的文件

1. **`.bmad-core/agents/sm.md`**
   - 添加 `PERSISTENT MODE` 激活指令
   - 角色状态在任务完成后保持

2. **`.bmad-core/agents/dev.md`**
   - 添加 `PERSISTENT MODE` 激活指令
   - 开发过程中保持角色上下文

### 核心改进

**新增激活指令**:
```yaml
activation-instructions:
  # ...existing instructions...
  - PERSISTENT MODE: Once activated, REMAIN in this persona until user 
    explicitly uses `*exit` command. Continue responding to `*` commands 
    without requiring re-activation. Maintain full persona context across 
    multiple commands in the same conversation.
```

**关键特性**:
- ✅ 显式退出机制（`*exit`）
- ✅ 命令上下文保持
- ✅ 角色状态持久化
- ✅ 支持多任务连续执行

---

## 📊 对比表

| 特性 | 旧设计（单次激活） | 新设计（持久化） |
|------|-------------------|-----------------|
| **激活次数** | 每次命令都需要 | 一次激活，持续使用 |
| **角色状态** | 任务后丢失 | 显式退出前保持 |
| **命令支持** | 单次命令 | 连续多个命令 |
| **上下文保持** | ❌ 否 | ✅ 是 |
| **退出方式** | 自动 | 显式 `*exit` |
| **工作流支持** | 低效 | 高效 |
| **学习曲线** | 简单 | 简单（显式退出） |

---

## 🎓 最佳实践

### ✅ 推荐做法

1. **明确激活**
   ```bash
   用户: 切换到 sm  # 清晰的角色激活
   ```

2. **持续使用命令**
   ```bash
   用户: *draft
   用户: *story-checklist
   用户: *draft
   ```

3. **显式退出**
   ```bash
   用户: *exit  # 完成工作后退出
   ```

4. **角色专注**
   - Scrum Master: 专注于 Story 创建、验证
   - Developer: 专注于实现、测试
   - 不要在一个角色中混合职责

### ❌ 避免做法

1. **忘记退出**
   ```bash
   用户: 切换到 sm
   用户: *draft
   用户: 帮我写代码  # ❌ Bob 不能写代码！应先 *exit
   ```

2. **角色混淆**
   ```bash
   用户: 切换到 dev
   用户: *develop-story 9.1.story.md
   用户: *draft  # ❌ James 不能创建 Story！应先 *exit
   ```

3. **嵌套激活**
   ```bash
   用户: 切换到 sm
   用户: 切换到 dev  # ❌ 应先 *exit 再切换
   ```

---

## 🔍 故障排查

### 问题 1: 命令无效

**症状**:
```bash
用户: *draft
AI: 我不理解 "*draft" 命令
```

**原因**: 角色未激活或已退出

**解决**:
```bash
用户: 切换到 sm  # 重新激活
```

---

### 问题 2: 角色行为异常

**症状**:
```bash
用户: *draft
Bob: [开始写代码]  # ❌ Bob 不应该写代码！
```

**原因**: 角色状态混乱

**解决**:
```bash
用户: *exit
用户: 切换到 sm  # 重新激活
```

---

### 问题 3: 无法退出角色

**症状**:
```bash
用户: *exit
AI: [仍然是 Bob 的回复]
```

**解决**:
```bash
用户: *exit  # 再次尝试
用户: 退出当前角色
用户: 返回通用助手模式
```

---

## 📚 相关文档

- **Agent 定义**: `.bmad-core/agents/sm.md`, `.bmad-core/agents/dev.md`
- **核心配置**: `.bmad-core/core-config.yaml`
- **任务工作流**: `.bmad-core/tasks/create-next-story.md`
- **验证清单**: `.bmad-core/checklists/story-draft-checklist.md`

---

## 🚀 未来改进

### 计划中的增强

1. **角色状态指示器**
   - 每次回复显示当前角色
   - 示例: `[Bob - Scrum Master] 👋 ...`

2. **角色切换提示**
   - 检测角色冲突命令
   - 自动提示切换角色

3. **任务链支持**
   - 支持连续任务自动执行
   - 示例: `*draft → *story-checklist → *draft`

4. **会话恢复**
   - 跨会话保持角色状态
   - 重新打开 VS Code 后恢复

---

**文档创建**: 2025-10-24  
**维护者**: BMAD Core Team  
**版本**: 1.0
