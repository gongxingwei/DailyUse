# 所有模块错误修复计划

## 📊 当前状态

- **API 项目**: 148 个错误
- **Web 项目**: 179 个错误  
- **总计**: ~327 个错误（从 680 降至 327，减少了 52%）

---

## 🎯 主要错误分类

### 1. 测试文件重复内容 ✅ 已修复
- `UpcomingReminderCalculator.test.ts` - Git 恢复

### 2. Account 模块类型错误 (~30 个)
**问题**: 使用了不存在的类型
- `AccountDTO` → `Account`
- `UserDTO` → 不存在
- `FrontendAccountInfo` → 不存在
- `RegistrationByUsernameAndPasswordRequestDTO` → 不存在
- `RegistrationResponseDTO` → 不存在

**文件**:
- `apps/api/src/tempTypes.ts`
- `apps/web/src/modules/account/**/*.ts`

**策略**: 
1. 检查 `@dailyuse/contracts` 中实际存在的类型
2. 更新或移除这些旧的引用

### 3. Goal 模块响应类型 (~10 个)
**问题**: 尝试访问 `['data']` 属性（和 Reminder 同样的问题）
- `GoalClientDTO[]` 不应该有 `.data` 属性
- 响应已经是数组，不再包装

**文件**:
- `apps/web/src/modules/goal/application/services/GoalWebApplicationService.ts`

**修复**: 移除 `['data']` 访问

### 4. Editor 模块响应类型 (~5 个)  
**问题**: 返回类型不匹配
- 返回 `EditorSessionDTO[]` 但期望 `EditorSessionListResponse`

**文件**:
- `apps/web/src/modules/editor/application/services/EditorWebApplicationService.ts`

**修复**: 包装为正确的响应格式或修改返回类型

### 5. 其他零散错误 (~280 个)
需要逐个分析

---

## 🚀 执行顺序

### Phase 1: 快速修复（预计 -50 错误）
1. ✅ 修复测试文件重复
2. 修复 Goal 模块 ['data'] 访问
3. 修复 Editor 模块响应类型

### Phase 2: Account 模块重构（预计 -30 错误）
1. 检查 contracts 中可用的类型
2. 更新或移除不存在的类型引用
3. 可能需要注释未实现的功能

### Phase 3: 剩余错误系统清理（预计 -247 错误）
1. 按模块分组
2. 识别通用模式
3. 批量修复

---

## 📝 下一步

立即开始 Phase 1 的快速修复。

