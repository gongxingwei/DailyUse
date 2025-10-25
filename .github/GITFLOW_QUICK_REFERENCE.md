# Git Flow 快速参考

## 📋 分支命名规范

| 分支类型 | 命名格式 | 示例 | 基于 | 合并到 |
|---------|---------|------|------|--------|
| 主分支 | `main` | `main` | - | - |
| 开发分支 | `dev` | `dev` | - | - |
| 功能分支 | `feature/<描述>` | `feature/add-goal-folder` | `dev` | `dev` |
| Bug修复 | `bugfix/<描述>` | `bugfix/fix-login-error` | `dev` | `dev` |
| 热修复 | `hotfix/<描述>` | `hotfix/critical-fix` | `main` | `main` + `dev` |
| 发布分支 | `release/<版本>` | `release/v1.2.0` | `dev` | `main` + `dev` |

## 🚀 常用工作流

### 开发新功能

```bash
# 1️⃣ 创建功能分支
git checkout dev
git pull origin dev
git checkout -b feature/my-feature

# 2️⃣ 开发并提交
git add .
git commit -m "feat: add my feature"

# 3️⃣ 推送并创建 PR
git push origin feature/my-feature
# 在 GitHub 创建 PR: feature/my-feature -> dev

# 4️⃣ 合并后清理
git checkout dev
git pull origin dev
git branch -d feature/my-feature
git push origin --delete feature/my-feature
```

### 修复 Bug

```bash
# 从 dev 创建
git checkout dev
git pull origin dev
git checkout -b bugfix/fix-issue

# 修复、提交、推送
git add .
git commit -m "fix: resolve issue"
git push origin bugfix/fix-issue
# PR: bugfix/fix-issue -> dev
```

### 紧急热修复

```bash
# 从 main 创建
git checkout main
git pull origin main
git checkout -b hotfix/urgent-fix

# 修复、提交、推送
git add .
git commit -m "fix: urgent issue"
git push origin hotfix/urgent-fix

# 创建两个 PR:
# - hotfix/urgent-fix -> main
# - hotfix/urgent-fix -> dev

# 在 main 打 tag
git checkout main
git pull origin main
git tag -a v1.2.1 -m "Hotfix v1.2.1"
git push origin v1.2.1
```

### 发布新版本

```bash
# 1️⃣ 创建 release 分支
git checkout dev
git pull origin dev
git checkout -b release/v1.3.0

# 2️⃣ 更新版本号和文档
# 编辑 package.json, CHANGELOG.md 等
git commit -am "chore: bump version to 1.3.0"
git push origin release/v1.3.0

# 3️⃣ 创建 PR 到 main 和 dev
# PR1: release/v1.3.0 -> main
# PR2: release/v1.3.0 -> dev

# 4️⃣ 合并后打 tag
git checkout main
git pull origin main
git tag -a v1.3.0 -m "Release v1.3.0"
git push origin v1.3.0
```

## 💬 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 提交类型

| 类型 | 描述 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: add user authentication` |
| `fix` | Bug修复 | `fix: resolve login timeout` |
| `docs` | 文档 | `docs: update API documentation` |
| `style` | 格式 | `style: format code with prettier` |
| `refactor` | 重构 | `refactor: simplify auth logic` |
| `perf` | 性能 | `perf: optimize database queries` |
| `test` | 测试 | `test: add unit tests for auth` |
| `chore` | 构建 | `chore: update dependencies` |
| `ci` | CI/CD | `ci: add GitHub Actions workflow` |

### 示例

```bash
# 简单提交
git commit -m "feat: add goal folder support"

# 带作用域
git commit -m "fix(auth): resolve token expiration issue"

# 多行提交
git commit -m "feat(goal): add goal folder support

- Added database table
- Implemented API endpoints
- Created UI components

Closes #123"

# Breaking change
git commit -m "feat(api)!: change response format

BREAKING CHANGE: Response now uses 'data' wrapper"
```

## 🔧 常用命令

### 分支操作

```bash
# 查看所有分支
git branch -a

# 创建并切换
git checkout -b feature/new-feature

# 切换分支
git checkout dev

# 删除本地分支
git branch -d feature/old-feature

# 删除远程分支
git push origin --delete feature/old-feature

# 更新远程分支列表
git fetch --prune
```

### 同步操作

```bash
# 拉取最新代码
git pull origin dev

# 从上游同步
git fetch origin
git rebase origin/dev

# 推送代码
git push origin feature/my-feature

# 强制推送（rebase后）
git push -f origin feature/my-feature
```

### 暂存操作

```bash
# 暂存当前更改
git stash

# 查看暂存列表
git stash list

# 恢复最新暂存
git stash pop

# 恢复指定暂存
git stash apply stash@{0}

# 删除暂存
git stash drop stash@{0}

# 清空所有暂存
git stash clear
```

### 撤销操作

```bash
# 撤销工作区修改
git checkout -- <file>

# 撤销暂存区
git reset HEAD <file>

# 撤销最后一次提交（保留更改）
git reset --soft HEAD~1

# 撤销最后一次提交（丢弃更改）
git reset --hard HEAD~1

# 撤销已推送的提交
git revert <commit-hash>
git push origin <branch>
```

### 查看操作

```bash
# 查看状态
git status

# 查看提交历史
git log --oneline --graph --all

# 查看差异
git diff
git diff --staged
git diff <branch1>..<branch2>

# 查看远程仓库
git remote -v
git remote show origin
```

## ⚠️ 注意事项

### ❌ 禁止操作

- ❌ 直接在 `main` 或 `dev` 上开发
- ❌ 强制推送到 `main` 或 `dev`
- ❌ 合并未经审查的代码
- ❌ 提交大文件或敏感信息
- ❌ 修改已推送的提交历史（除非在 feature 分支）

### ✅ 推荐做法

- ✅ 功能完成前频繁提交
- ✅ 推送前先拉取最新代码
- ✅ PR 前自己先检查一遍
- ✅ 及时删除已合并的分支
- ✅ 遇到冲突及时解决
- ✅ 重要改动写清楚提交信息

## 🆘 常见问题

### 分支落后了怎么办？

```bash
git checkout feature/my-feature
git fetch origin
git rebase origin/dev
# 如有冲突，解决后：
git add .
git rebase --continue
git push -f origin feature/my-feature
```

### 提交到错误分支了？

```bash
# 1. 在正确的分支上 cherry-pick
git checkout correct-branch
git cherry-pick <commit-hash>

# 2. 在错误的分支上撤销
git checkout wrong-branch
git reset --hard HEAD~1
git push -f origin wrong-branch
```

### PR 有冲突怎么办？

```bash
# 1. 在本地分支上更新
git checkout feature/my-feature
git fetch origin
git rebase origin/dev

# 2. 解决冲突
# 编辑冲突文件
git add <resolved-files>
git rebase --continue

# 3. 强制推送
git push -f origin feature/my-feature
```

### 想要撤销 PR 怎么办？

```bash
# 如果 PR 已合并到 dev
git checkout dev
git pull origin dev
git revert <merge-commit-hash>
git push origin dev

# 如果 PR 未合并
# 直接在 GitHub 上关闭 PR
```

## 📚 相关文档

- [完整 Git Flow 文档](./GITFLOW.md)
- [提交信息规范](https://www.conventionalcommits.org/zh-hans/)
- [项目开发规范](../docs/BMAD_DEVELOPMENT_WORKFLOW.md)

---

**记住**: 
- 🔄 从 `dev` 创建 feature 分支
- ✅ 通过 PR 合并
- 🧹 合并后删除分支
- 📝 写清楚提交信息
