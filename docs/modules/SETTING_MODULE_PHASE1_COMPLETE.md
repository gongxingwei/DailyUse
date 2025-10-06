# Setting Module Refactoring - Phase 1 Complete ✅

## Phase 1: Contracts Layer Enhancement

**Status**: ✅ Completed  
**Duration**: ~30 minutes  
**Date**: 2024

---

## 完成内容

### 1. UserPreferences DTOs (dtos.ts)

添加了完整的 UserPreferences 类型定义系统：

#### 基础接口
- **`IUserPreferences`**: 用户偏好基础接口
  - 账户信息 (uuid, accountUuid)
  - 基础偏好 (language, timezone, locale)
  - 主题偏好 (themeMode)
  - 通知偏好 (notificationsEnabled, emailNotifications, pushNotifications)
  - 应用偏好 (autoLaunch, defaultModule)
  - 隐私偏好 (analyticsEnabled, crashReportsEnabled)
  - 时间戳 (createdAt, updatedAt)

- **`IUserPreferencesClient`**: 客户端扩展接口 (extends IUserPreferences)
  - UI 计算属性:
    - `languageText`: 语言显示文本 ('简体中文', 'English')
    - `timezoneText`: 时区显示文本 ('GMT+8 上海')
    - `themeModeIcon`: 主题图标 ('mdi-white-balance-sunny')
    - `themeModeText`: 主题显示文本 ('浅色', '深色', '跟随系统')
  - 状态属性:
    - `canChangeTheme`: 是否可更改主题
    - `hasEmailEnabled`: 是否已启用邮件
    - `hasPushEnabled`: 是否已启用推送
  - 格式化时间:
    - `formattedCreatedAt`: 格式化创建时间
    - `formattedUpdatedAt`: 格式化更新时间

#### 核心 DTOs
- **`UserPreferencesDTO`**: 标准 DTO (type alias of IUserPreferences)
- **`UserPreferencesClientDTO`**: 客户端 DTO (type alias of IUserPreferencesClient)
- **`UserPreferencesPersistenceDTO`**: 持久化 DTO (数据库格式，Date 类型)

#### 请求 DTOs
- **`UpdateUserPreferencesRequestDTO`**: 更新用户偏好 (所有字段可选)
- **`SwitchThemeModeRequestDTO`**: 切换主题模式
- **`ChangeLanguageRequestDTO`**: 更改语言
- **`ChangeTimezoneRequestDTO`**: 更改时区
- **`SetNotificationsRequestDTO`**: 设置通知 (支持子选项批量设置)

#### 响应 DTOs
- **`UserPreferencesResponseDTO`**: 单个用户偏好响应
- **`UserPreferencesClientResponseDTO`**: 客户端响应 (含 UI 属性)
- **`UserPreferencesListResponseDTO`**: 用户偏好列表响应 (含分页)

### 2. UserPreferences Events (events.ts)

添加了完整的 UserPreferences 领域事件系统：

#### 事件载荷接口
1. **`UserPreferencesCreatedEventPayload`**: 用户偏好创建
2. **`UserPreferencesUpdatedEventPayload`**: 用户偏好更新 (含变更字段追踪)
3. **`ThemeModeChangedEventPayload`**: 主题模式切换
   - 包含 `effectiveTheme` (system 模式解析后的实际主题)
   - 包含 `reason` (user/system/schedule)
4. **`LanguageChangedEventPayload`**: 语言更改
5. **`TimezoneChangedEventPayload`**: 时区更改
6. **`NotificationSettingsChangedEventPayload`**: 通知设置更改
7. **`AppPreferencesChangedEventPayload`**: 应用偏好更改
8. **`PrivacySettingsChangedEventPayload`**: 隐私设置更改

#### 领域事件类型
- **`UserPreferencesDomainEvent`**: Union type of all UserPreferences events
- 更新了 **`SettingDomainEvent`** 以包含 `UserPreferencesDomainEvent`

### 3. 类型导出

所有新增类型已通过 `packages/contracts/src/modules/setting/index.ts` 自动导出。

---

## 技术决策

### 1. DTO vs Interface 分离

遵循 Theme 模块模式：
- `IUserPreferences`: 核心业务接口
- `IUserPreferencesClient`: 客户端扩展接口
- DTOs 使用 type alias 避免空接口 lint 错误

### 2. ClientDTO 设计

参考 Goal 和 Theme 模块的 ClientDTO 模式：
- 包含 UI 计算属性 (languageText, themeModeIcon)
- 包含状态判断属性 (canChangeTheme, hasEmailEnabled)
- 包含格式化显示 (formattedCreatedAt, formattedUpdatedAt)

### 3. 事件粒度

细化事件类型以支持：
- 跨模块通知 (ThemeModeChanged → Theme 模块)
- 精确变更追踪 (LanguageChanged → i18n 更新)
- 业务逻辑触发 (NotificationSettingsChanged → 推送服务)

### 4. PersistenceDTO 独立

- 使用 `Date` 类型而非 `string` (匹配 Prisma 映射)
- 扁平化结构便于数据库存储
- 与 ClientDTO 分离避免混淆

---

## 与其他模块的对比

| 特性 | Theme Module | Goal Module | Setting Module (UserPreferences) |
|------|-------------|-------------|----------------------------------|
| Core 抽象 | ✅ ThemeDefinitionCore | ✅ GoalCore | ⏳ Phase 2 待实现 |
| Server/Client 分离 | ✅ 完整分离 | ✅ 完整分离 | ⏳ Phase 3/4 待实现 |
| ClientDTO UI 属性 | ✅ typeText, colors | ✅ statusText, progressText | ✅ languageText, themeModeIcon |
| PersistenceDTO | ✅ 独立定义 | ✅ 独立定义 | ✅ 独立定义 |
| 细粒度事件 | ✅ 主题切换事件 | ✅ 状态变更事件 | ✅ 8 种细分事件 |
| Request DTOs | ✅ 完整定义 | ✅ 完整定义 | ✅ 完整定义 |

---

## 代码统计

- **新增 DTO 接口**: 12 个
- **新增事件载荷**: 8 个
- **新增领域事件类型**: 1 个
- **总新增代码行数**: ~200 行
- **文件修改**: 2 个 (dtos.ts, events.ts)
- **编译错误**: 0 个 ✅

---

## 验证清单

- [x] 所有 DTO 接口定义完整
- [x] ClientDTO 包含 UI 计算属性
- [x] PersistenceDTO 匹配数据库结构
- [x] Request/Response DTOs 覆盖所有用例
- [x] 领域事件支持跨模块通信
- [x] 类型自动导出 (index.ts)
- [x] 无 TypeScript 编译错误
- [x] 遵循 Theme/Goal 模块模式

---

## 后续阶段预览

### Phase 2: Domain-Core (下一步)
创建 `packages/domain-core/src/setting/`:
- `UserPreferencesCore.ts`: 抽象基类
- `SettingDefinitionCore.ts`: 系统设置抽象基类

核心方法：
```typescript
abstract class UserPreferencesCore {
  abstract toDTO(): UserPreferencesDTO;
  abstract toClientDTO(): UserPreferencesClientDTO;
  abstract toPersistence(): UserPreferencesPersistenceDTO;
  
  changeLanguage(language: string): void;
  switchThemeMode(mode): void;
  setNotifications(enabled: boolean): void;
}
```

### Phase 3: Domain-Server
迁移 `apps/api/src/modules/setting/domain/aggregates/UserPreferences.ts`:
- 移动到 `packages/domain-server/src/setting/aggregates/`
- 继承 `UserPreferencesCore`
- 实现服务端特定逻辑

### Phase 4-7
API/Web 层重构和文档完善

---

## 总结

**Phase 1** 成功完成了 Contracts 层的完整定义，为后续的 Core、Server、Client 层实现奠定了坚实的类型基础。

**关键成果**:
1. ✅ 统一的类型系统 (DTO chain: Persistence → Domain → Client)
2. ✅ 完整的事件体系 (8 种细分事件)
3. ✅ 遵循最佳实践 (参考 Theme/Goal 模块)
4. ✅ 零编译错误

**下一步**: Phase 2 - 创建 Domain-Core 抽象层
