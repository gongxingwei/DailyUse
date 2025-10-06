# Setting 模块重构 - 执行概要

**生成时间**: 2025-10-06  
**参考模块**: Theme 模块、Goal 模块  
**预估总工时**: 21-28 小时  

---

## 🎯 重构目标总结

### 核心目标
将 Setting 模块重构为与 Theme、Goal 模块一致的 **DDD 分层架构**：

```
Contracts (类型定义)
    ↓
Domain-Core (平台无关的核心逻辑)
    ↓
Domain-Server (服务端领域实现)  Domain-Client (客户端领域实现)
    ↓                               ↓
API (应用服务+基础设施)            Web (Store + Composables + Views)
```

### 关键改进
1. **架构统一**: 所有模块遵循相同的分层模式
2. **类型安全**: 完整的 DTO 转换链路（Persistence → Domain → Client）
3. **代码复用**: Core 层抽象被 Server 和 Client 共享
4. **职责清晰**: UserPreferences (用户偏好) vs SettingDefinition (系统设置)

---

## 📋 分阶段执行计划

### Phase 1: Contracts 层完善 ⏱️ 2-3h

**文件**: `packages/contracts/src/modules/setting/`

**任务**:
- 补充 `UserPreferencesDTO`、`UserPreferencesClientDTO`
- 补充请求/响应 DTO
- 补充领域事件定义
- 优化导出

**参考**: 
- `packages/contracts/src/modules/theme/dtos.ts`
- `packages/contracts/src/modules/goal/dtos.ts`

**产出**: 完整的类型定义，支持前后端使用

---

### Phase 2: Domain-Core 层创建 ⏱️ 3-4h

**目录**: `packages/domain-core/src/setting/` (新建)

**任务**:
创建两个抽象类：

1. **`UserPreferencesCore.ts`**
   ```typescript
   export abstract class UserPreferencesCore {
     protected _uuid: string;
     protected _accountUuid: string;
     protected _language: string;
     protected _themeMode: 'light' | 'dark' | 'system';
     // ... 核心字段
     
     // 抽象方法（Server/Client 实现）
     abstract toDTO(): UserPreferencesDTO;
     abstract toClientDTO(): UserPreferencesClientDTO;
     
     // 共享业务逻辑
     changeLanguage(language: string): void;
     switchThemeMode(mode: 'light' | 'dark' | 'system'): void;
     // ...
   }
   ```

2. **`SettingDefinitionCore.ts`**
   - 设置元数据管理
   - 验证规则抽象

**参考**: 
- `packages/domain-core/src/theme/ThemeDefinitionCore.ts`

**产出**: 平台无关的核心业务逻辑

---

### Phase 3: Domain-Server 层重构 ⏱️ 4-5h

**目录**: `packages/domain-server/src/setting/`

**任务**:

1. **重构聚合根**
   - `UserPreferences.ts` 继承自 `UserPreferencesCore`
   - `SettingDefinition.ts` 继承自 `SettingDefinitionCore`
   - 实现 `fromDTO()`、`fromPersistence()` 静态方法
   - 添加领域事件发布

2. **创建实体**
   - `SettingValue.ts` - 设置值实体

3. **创建领域服务**
   - `UserPreferencesDomainService.ts` - 用户偏好业务逻辑
   - 重构 `SettingDomainService.ts`

4. **优化仓储接口**
   - 确保接口清晰

**参考**: 
- `packages/domain-server/src/goal/aggregates/Goal.ts`
- `packages/domain-server/src/theme/aggregates/ThemeDefinition.ts`

**产出**: 完整的服务端领域实现

---

### Phase 4: Domain-Client 层创建 ⏱️ 2-3h

**目录**: `packages/domain-client/src/setting/` (新建)

**任务**:

1. **创建聚合根（客户端版本）**
   ```typescript
   // UserPreferences.ts
   export class UserPreferences extends UserPreferencesCore {
     toClientDTO(): UserPreferencesClientDTO {
       return {
         ...this.toDTO(),
         languageText: this.getLanguageText(),  // "简体中文"
         timezoneText: this.getTimezoneText(), // "GMT+8 上海"
         // ... UI 计算属性
       };
     }
     
     // UI 辅助方法
     private getLanguageText(): string { }
   }
   ```

2. **创建客户端服务**
   - `UserPreferencesClientService.ts` - HTTP 调用封装

**参考**: 
- `packages/domain-client/src/theme/aggregates/ThemeDefinition.ts`

**产出**: 客户端可复用的领域逻辑

---

### Phase 5: API 层重构 ⏱️ 3-4h

**目录**: `apps/api/src/modules/setting/`

**任务**:

1. **Application Service**
   - 重构 `UserPreferencesApplicationService.ts`
   - 使用 domain-server 的聚合根
   - 使用 DomainService
   - 发布领域事件

2. **Infrastructure**
   - 重构 `PrismaUserPreferencesRepository.ts`
   - 使用 `fromPersistence()` 和 `toPersistence()`
   - 重构 `EventPublisher.ts`

3. **Interface (HTTP)**
   - 重构 `UserPreferencesController.ts`
   - 返回 ClientDTO

**参考**: 
- `apps/api/src/modules/goal/application/services/GoalApplicationService.ts`

**产出**: 完整的 API 层

---

### Phase 6: Web 层重构 ⏱️ 3-4h

**目录**: `apps/web/src/modules/setting/`

**任务**:

1. **API Client**
   - 重构 `userPreferencesApi.ts`
   - 使用 ClientDTO

2. **Store**
   - 重构 `userPreferencesStore.ts`
   - 使用 domain-client 的 UserPreferences
   - 调用实体方法

3. **Composables**
   - 创建 `useUserPreferences.ts`
   ```typescript
   export function useUserPreferences() {
     const store = useUserPreferencesStore();
     
     const changeLanguage = async (lang: string) => {
       await store.updatePreferences({ language: lang });
     };
     
     return {
       preferences: computed(() => store.preferences),
       changeLanguage,
       switchThemeMode,
       // ...
     };
   }
   ```

4. **Views**
   - 重构 `Settings.vue`

**参考**: 
- `apps/web/src/modules/theme/useThemeInit.ts`

**产出**: 使用 domain-client 的前端实现

---

### Phase 7: 文档和测试 ⏱️ 4-5h

**任务**:

1. **文档**
   - `SETTING_MODULE_ARCHITECTURE.md` - 架构说明
   - `SETTING_MODULE_QUICK_REFERENCE.md` - 快速参考
   - `SETTING_MODULE_REFACTORING_SUMMARY.md` - 重构总结

2. **测试**
   - Domain-Core 单元测试
   - Domain-Server 单元测试
   - API 集成测试
   - Web E2E 测试

**产出**: 完整的文档和测试覆盖

---

## 🔄 执行方式建议

### 方式 1: 一次性完整重构 (推荐给AI执行)
- 按 Phase 1-7 顺序执行
- 每个 Phase 完成后验证编译
- 最后整体测试

### 方式 2: 渐进式重构 (推荐给团队协作)
- 每个 Phase 独立完成并提交
- 保持系统可运行状态
- 逐步迁移

### 方式 3: 最小可行重构 (MVP)
- 只执行 Phase 1-3, 5-6
- 跳过 Domain-Client 层（暂时）
- 快速见效

---

## ⚠️ 风险和注意事项

### 编译风险
- 移动文件会导致导入路径改变
- 需要更新所有引用

### 功能风险
- UserPreferences 是核心功能，影响登录和主题
- 需要充分测试

### 时间风险
- 预估 21-28 小时
- 可能遇到意外问题

---

## ✅ 验证标准

### 编译层面
- [ ] 0 TypeScript 错误
- [ ] 0 ESLint 警告
- [ ] 所有导入路径正确

### 功能层面
- [ ] 用户偏好读取正常
- [ ] 用户偏好更新正常
- [ ] 主题模式切换正常
- [ ] 语言切换正常
- [ ] 通知设置正常

### 架构层面
- [ ] Contracts 完整定义
- [ ] Core 层抽象清晰
- [ ] Server/Client 继承正确
- [ ] 依赖方向正确（Core ← Server/Client）

---

## 🚀 开始执行

**确认后，AI 将按以下顺序执行**:

1. ✅ Phase 1: 完善 Contracts 层
2. ✅ Phase 2: 创建 Domain-Core 层
3. ✅ Phase 3: 重构 Domain-Server 层
4. ✅ Phase 4: 创建 Domain-Client 层
5. ✅ Phase 5: 重构 API 层
6. ✅ Phase 6: 重构 Web 层
7. ✅ Phase 7: 编写文档和测试

**每个 Phase 完成后会生成进度报告**

---

**是否开始执行完整重构？** (请用户确认)

如果确认，AI 将立即开始 Phase 1...
