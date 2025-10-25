# Git Flow 工作流规范

## 分支结构

### 主要分支

#### 1. `main` - 主分支（生产环境）
- **用途**: 生产环境代码，始终保持稳定可发布状态
- **保护**: 禁止直接推送，只能通过 PR 合并
- **来源**: 从 `dev` 分支合并（发布时）
- **命名规则**: 固定为 `main`
- **标签**: 每次发布打 tag (如 v1.0.0, v1.1.0)

#### 2. `dev` - 开发主分支
- **用途**: 开发环境代码，集成所有已完成的功能
- **保护**: 禁止直接推送，只能通过 PR 合并
- **来源**: 从 `feature/*` 分支合并
- **命名规则**: 固定为 `dev`
- **状态**: 应该始终可运行，但可能包含未完全测试的功能

### 辅助分支

#### 3. `feature/*` - 功能开发分支
- **用途**: 开发新功能或改进
- **基于**: 从 `dev` 分支创建
- **合并到**: `dev` 分支
- **命名规则**: `feature/<描述性名称>` 或 `feature/<story-id>`
  - 示例: `feature/add-goal-folder`
  - 示例: `feature/STORY-032-conflict-detection`
- **生命周期**: 功能开发完成并合并后删除
- **提交要求**: 功能完成、测试通过、代码审查通过

#### 4. `bugfix/*` - Bug 修复分支
- **用途**: 修复 `dev` 分支中的 bug
- **基于**: 从 `dev` 分支创建
- **合并到**: `dev` 分支
- **命名规则**: `bugfix/<描述性名称>`
  - 示例: `bugfix/fix-goal-delete-error`
- **生命周期**: Bug 修复完成并合并后删除

#### 5. `hotfix/*` - 紧急修复分支
- **用途**: 修复 `main` 分支中的紧急 bug
- **基于**: 从 `main` 分支创建
- **合并到**: 同时合并到 `main` 和 `dev`
- **命名规则**: `hotfix/<描述性名称>`
  - 示例: `hotfix/critical-auth-bug`
- **生命周期**: 修复完成并合并后删除
- **发布**: 合并后打 patch 版本 tag

#### 6. `release/*` - 发布分支
- **用途**: 准备发布到生产环境
- **基于**: 从 `dev` 分支创建
- **合并到**: `main` 和 `dev`
- **命名规则**: `release/<版本号>`
  - 示例: `release/v1.2.0`
- **生命周期**: 发布完成后删除
- **允许操作**: 只能修复小 bug、调整版本号、更新文档

## 工作流程

### 1. 日常功能开发

```bash
# 1. 确保 dev 是最新的
git checkout dev
git pull origin dev

# 2. 创建功能分支
git checkout -b feature/my-awesome-feature

# 3. 开发功能（多次提交）
git add .
git commit -m "feat: add awesome feature"

# 4. 推送到远程
git push origin feature/my-awesome-feature

# 5. 在 GitHub 上创建 PR: feature/my-awesome-feature -> dev

# 6. 代码审查通过后，合并 PR

# 7. 删除本地和远程分支
git branch -d feature/my-awesome-feature
git push origin --delete feature/my-awesome-feature
```

### 2. Bug 修复流程

```bash
# 1. 从 dev 创建 bugfix 分支
git checkout dev
git pull origin dev
git checkout -b bugfix/fix-user-login

# 2. 修复 bug 并提交
git add .
git commit -m "fix: resolve user login issue"

# 3. 推送并创建 PR
git push origin bugfix/fix-user-login
# PR: bugfix/fix-user-login -> dev
```

### 3. 紧急热修复流程

```bash
# 1. 从 main 创建 hotfix 分支
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-fix

# 2. 修复并提交
git add .
git commit -m "fix: critical security vulnerability"

# 3. 推送并创建 PR
git push origin hotfix/critical-security-fix

# 4. 创建两个 PR:
#    - hotfix/critical-security-fix -> main (优先)
#    - hotfix/critical-security-fix -> dev

# 5. 合并到 main 后打 tag
git checkout main
git tag -a v1.2.1 -m "Hotfix: critical security fix"
git push origin v1.2.1
```

### 4. 发布流程

```bash
# 1. 从 dev 创建 release 分支
git checkout dev
git pull origin dev
git checkout -b release/v1.3.0

# 2. 更新版本号（package.json 等）
# 修复发现的小问题
git commit -am "chore: bump version to 1.3.0"

# 3. 推送并创建 PR
git push origin release/v1.3.0

# 4. 创建两个 PR:
#    - release/v1.3.0 -> main
#    - release/v1.3.0 -> dev

# 5. 合并后在 main 上打 tag
git checkout main
git tag -a v1.3.0 -m "Release version 1.3.0"
git push origin v1.3.0
```

## 提交信息规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 规范：

### 提交类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行的变动）
- `refactor`: 重构（既不是新功能也不是修复 bug）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动
- `ci`: CI/CD 配置文件和脚本的变动

### 提交格式

```
<类型>(<作用域>): <简短描述>

[可选的详细描述]

[可选的 footer]
```

### 示例

```bash
# 简单提交
git commit -m "feat: add user authentication"

# 带作用域的提交
git commit -m "feat(auth): add JWT token validation"

# 带详细描述的提交
git commit -m "feat(goal): add goal folder support

- Added GoalFolder database table
- Implemented CRUD API endpoints
- Created Web UI components

Closes #123"

# Breaking change
git commit -m "feat(api)!: change user API response format

BREAKING CHANGE: User API now returns data in a nested structure"
```

## 分支保护规则

### main 分支
- ✅ 要求 PR 才能合并
- ✅ 要求至少 1 个审查批准
- ✅ 要求通过 CI 检查
- ✅ 要求分支是最新的
- ✅ 禁止强制推送
- ✅ 禁止删除分支

### dev 分支
- ✅ 要求 PR 才能合并
- ✅ 要求通过 CI 检查
- ✅ 要求分支是最新的
- ✅ 禁止强制推送
- ⚠️ 可以删除分支（但不推荐）

## 常用命令速查

```bash
# 查看所有分支
git branch -a

# 查看当前状态
git status

# 查看提交历史
git log --oneline --graph --all

# 更新本地分支列表
git fetch --prune

# 清理已合并的分支
git branch --merged | grep -v "\*\|main\|dev" | xargs -n 1 git branch -d

# 查看远程分支
git remote show origin

# 切换分支
git checkout <branch-name>

# 创建并切换到新分支
git checkout -b <new-branch-name>

# 合并分支（在目标分支上执行）
git merge <source-branch>

# 变基（rebase）
git rebase <base-branch>

# 暂存更改
git stash
git stash pop
git stash list
```

## 最佳实践

### 1. 分支命名
- 使用小写字母和连字符
- 使用描述性名称
- 包含 Story ID（如果有）
- 避免使用特殊字符

### 2. 提交频率
- 小步快跑，频繁提交
- 每个提交应该是一个逻辑单元
- 提交前确保代码可以运行
- 推送前本地测试通过

### 3. PR 最佳实践
- PR 标题应该清晰描述改动
- 添加详细的描述和截图（如果适用）
- 关联相关的 Issue 或 Story
- 代码审查前自己先检查一遍
- 及时回应审查意见
- PR 应该尽量小，便于审查

### 4. 代码审查
- 审查代码逻辑和设计
- 检查代码风格和规范
- 验证测试覆盖率
- 确认文档是否更新
- 提供建设性反馈

### 5. 冲突处理
- 及时从上游分支同步
- 优先解决冲突
- 冲突解决后重新测试
- 必要时寻求帮助

### 6. 分支清理
- 功能开发完成后及时删除分支
- 定期清理已合并的分支
- 保持分支列表简洁

## 版本管理

### 语义化版本 (Semantic Versioning)

格式: `MAJOR.MINOR.PATCH` (如 v1.2.3)

- **MAJOR**: 不兼容的 API 修改
- **MINOR**: 向后兼容的功能新增
- **PATCH**: 向后兼容的问题修复

### 预发布版本
- `v1.2.0-alpha.1`: Alpha 测试版
- `v1.2.0-beta.1`: Beta 测试版
- `v1.2.0-rc.1`: Release Candidate

### Tag 管理

```bash
# 创建标签
git tag -a v1.0.0 -m "Release version 1.0.0"

# 推送标签
git push origin v1.0.0

# 推送所有标签
git push origin --tags

# 查看标签
git tag -l

# 删除本地标签
git tag -d v1.0.0

# 删除远程标签
git push origin :refs/tags/v1.0.0
```

## CI/CD 集成

### 触发条件

- **main 分支**: 
  - 推送时: 运行完整测试 + 构建 + 部署到生产环境
  
- **dev 分支**: 
  - 推送时: 运行完整测试 + 构建 + 部署到测试环境
  
- **feature/* 分支**: 
  - PR 时: 运行测试 + 代码检查
  
- **hotfix/* 分支**: 
  - PR 时: 运行完整测试 + 构建

### 自动化检查

- ✅ TypeScript 类型检查
- ✅ ESLint 代码检查
- ✅ Prettier 格式检查
- ✅ 单元测试
- ✅ 集成测试
- ✅ E2E 测试
- ✅ 构建验证

## 问题排查

### 常见问题

1. **分支落后太多**
   ```bash
   git checkout feature/my-feature
   git fetch origin
   git rebase origin/dev
   # 解决冲突后
   git rebase --continue
   git push -f origin feature/my-feature
   ```

2. **误提交到错误分支**
   ```bash
   # 方法1: cherry-pick
   git checkout correct-branch
   git cherry-pick <commit-hash>
   
   # 方法2: reset
   git checkout wrong-branch
   git reset --hard HEAD~1
   git checkout correct-branch
   git cherry-pick <commit-hash>
   ```

3. **需要撤销提交**
   ```bash
   # 撤销最后一次提交（保留更改）
   git reset --soft HEAD~1
   
   # 撤销最后一次提交（丢弃更改）
   git reset --hard HEAD~1
   
   # 撤销远程提交
   git revert <commit-hash>
   git push origin <branch-name>
   ```

## 团队协作

### 沟通规范

- 重大功能开发前先讨论设计
- PR 中详细说明改动原因
- 及时回应代码审查意见
- 遇到问题及时寻求帮助

### 代码所有权

- 功能模块有明确的负责人
- 跨模块改动需要通知相关人员
- 重大重构需要团队讨论

### 知识共享

- 重要功能完成后更新文档
- 定期进行代码分享会
- 记录重要决策和原因

## 相关资源

- [Git Flow 原文](https://nvie.com/posts/a-successful-git-branching-model/)
- [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)
- [Semantic Versioning](https://semver.org/lang/zh-CN/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

---

**记住**: Git Flow 是一套规范，不是教条。根据团队实际情况灵活调整！
