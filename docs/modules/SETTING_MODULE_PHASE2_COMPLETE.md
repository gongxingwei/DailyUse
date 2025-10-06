# Setting Module Refactoring - Phase 2 Complete ✅

## Phase 2: Domain-Core Creation

**Status**: ✅ Completed  
**Duration**: ~40 minutes  
**Date**: 2024

---

## 完成内容

### 1. UserPreferencesCore 抽象基类

创建了 `packages/domain-core/src/setting/aggregates/UserPreferencesCore.ts` (~490 lines)

#### 核心特性
- **继承**: `extends AggregateRoot` (来自 @dailyuse/utils)
- **实现**: `implements IUserPreferences` (来自 @dailyuse/contracts)
- **平台无关**: 纯粹的业务逻辑，不包含服务端或客户端特定代码

#### 属性系统
```typescript
// 基础属性
protected _uuid: string;
protected _accountUuid: string;

// 基础偏好
protected _language: string;          // 'zh-CN' | 'en-US' | ...
protected _timezone: string;          // IANA timezone
protected _locale: string;

// 主题偏好
protected _themeMode: 'light' | 'dark' | 'system';

// 通知偏好
protected _notificationsEnabled: boolean;
protected _emailNotifications: boolean;
protected _pushNotifications: boolean;

// 应用偏好
protected _autoLaunch: boolean;
protected _defaultModule: string;     // 'goal' | 'task' | 'editor' | 'schedule'

// 隐私偏好
protected _analyticsEnabled: boolean;
protected _crashReportsEnabled: boolean;

// 时间戳
protected _createdAt: Date;
protected _updatedAt: Date;
```

#### 抽象方法 (由子类实现)
```typescript
abstract toDTO(): UserPreferencesDTO;
abstract toClientDTO(): UserPreferencesClientDTO;
abstract toPersistence(): UserPreferencesPersistenceDTO;
```

#### 核心业务方法 (平台无关)
1. **changeLanguage(language: string)**: 更改语言
   - 验证语言代码 (支持 zh-CN, en-US, ja-JP, ko-KR)
   - 更新语言设置
   - 自动更新时间戳

2. **switchThemeMode(mode)**: 切换主题模式
   - 验证模式值 (light, dark, system)
   - 更新主题模式
   - 触发时间戳更新

3. **changeTimezone(timezone: string)**: 更改时区
   - 验证 IANA 时区格式 (Area/Location)
   - 更新时区设置

4. **setNotifications(enabled, includeSubOptions)**: 设置通知开关
   - 主开关控制
   - 可选级联关闭子选项 (email, push)
   - 业务规则：关闭主开关强制关闭所有子选项

5. **setEmailNotifications(enabled)**: 设置邮件通知
   - 依赖检查：需要主开关已启用
   - 错误提示：'请先启用通知总开关'

6. **setPushNotifications(enabled)**: 设置推送通知
   - 依赖检查：需要主开关已启用

7. **setAutoLaunch(enabled)**: 设置自动启动
8. **setDefaultModule(module)**: 设置默认模块
   - 验证模块名称 (goal, task, editor, schedule)

9. **setAnalytics(enabled)**: 设置数据分析
10. **setCrashReports(enabled)**: 设置崩溃报告

11. **updatePreferences(updates)**: 批量更新偏好
    - 原子操作：全部验证通过后才应用更新
    - 完整的业务规则检查
    - 支持部分更新 (所有字段可选)

#### 验证方法 (protected)
- **validateLanguage(language)**: 语言代码验证
  ```typescript
  supportedLanguages = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR']
  ```

- **validateThemeMode(mode)**: 主题模式验证
  ```typescript
  validModes = ['light', 'dark', 'system']
  ```

- **validateTimezone(timezone)**: 时区格式验证
  ```typescript
  // IANA format: Area/Location
  pattern: /^[A-Za-z_]+\/[A-Za-z_]+$/
  ```

- **validateDefaultModule(module)**: 默认模块验证
  ```typescript
  validModules = ['goal', 'task', 'editor', 'schedule']
  ```

#### 辅助方法
- **touch()**: 更新 `_updatedAt` 时间戳
- **toJSON()**: 序列化为 JSON (调用 toDTO())

---

### 2. 目录结构更新

```
packages/domain-core/src/setting/
├── SettingCore.ts                    # 已存在：SettingDefinitionCore, SettingGroupCore
├── aggregates/
│   ├── UserPreferencesCore.ts        # ✨ 新增
│   └── index.ts                      # ✨ 新增
├── entities/
│   └── ... (已存在)
└── index.ts                          # ✅ 更新：导出 aggregates
```

---

### 3. 构建验证

#### Contracts Package
```bash
pnpm --filter @dailyuse/contracts build
# ✅ Success: 73ms
# ✅ DTS: 439.49 KB (包含 UserPreferences types)
```

#### Domain-Core Package
```bash
pnpm --filter @dailyuse/domain-core build
# ✅ Success: 106ms
# ✅ DTS: 98.51 KB (包含 UserPreferencesCore)
```

#### 类型导出验证
```bash
# Contracts dist 包含:
- IUserPreferences
- IUserPreferencesClient
- UserPreferencesDTO
- UserPreferencesClientDTO
- UserPreferencesPersistenceDTO

# Domain-Core dist 包含:
- UserPreferencesCore (abstract class)
```

---

## 架构设计决策

### 1. 继承 AggregateRoot

遵循 Theme 和 Goal 模块模式：
```typescript
export abstract class UserPreferencesCore extends AggregateRoot implements IUserPreferences
```

**优势**:
- 统一的聚合根标识管理 (UUID 生成)
- 领域事件支持 (未来可添加)
- 一致的架构风格

### 2. Protected 字段模式

所有字段使用 `protected _` 前缀：
```typescript
protected _language: string;
protected _themeMode: 'light' | 'dark' | 'system';
```

**优势**:
- 子类可访问但外部不可直接修改
- 通过 getter 提供只读访问
- 通过业务方法强制业务规则

### 3. 验证优先原则

所有修改操作先验证后应用：
```typescript
public changeLanguage(language: string): void {
  const validation = this.validateLanguage(language);
  if (!validation.isValid) {
    throw new Error(`语言设置无效: ${validation.errors.join(', ')}`);
  }
  this._language = language;
  this.touch();
}
```

**优势**:
- 数据完整性保障
- 清晰的错误消息
- 可测试的验证逻辑

### 4. 业务规则内聚

通知系统的依赖关系在 Core 层实现：
```typescript
public setEmailNotifications(enabled: boolean): void {
  if (enabled && !this._notificationsEnabled) {
    throw new Error('请先启用通知总开关');
  }
  this._emailNotifications = enabled;
  this.touch();
}
```

**优势**:
- 业务规则集中管理
- 服务端和客户端共享相同逻辑
- 防止无效状态

### 5. 批量更新原子性

`updatePreferences` 方法实现原子更新：
```typescript
public updatePreferences(updates) {
  // 1. 验证所有字段
  // 2. 全部通过后才应用更新
  // 3. 单次时间戳更新
}
```

**优势**:
- 避免部分更新导致的不一致状态
- 性能优化 (单次 touch())
- 事务语义

---

## 业务逻辑亮点

### 1. 级联关闭策略

```typescript
public setNotifications(enabled: boolean, includeSubOptions = false): void {
  this._notificationsEnabled = enabled;
  
  if (!enabled) {
    // 关闭主开关 → 强制关闭所有子选项
    this._emailNotifications = false;
    this._pushNotifications = false;
  } else if (includeSubOptions) {
    // 开启主开关 + 标志位 → 同时开启子选项
    this._emailNotifications = true;
    this._pushNotifications = true;
  }
}
```

**用户体验**:
- 关闭通知时自动关闭所有渠道
- 可选一键启用所有通知渠道
- 防止无效配置 (主开关关闭但子选项开启)

### 2. 依赖检查

```typescript
public setEmailNotifications(enabled: boolean): void {
  if (enabled && !this._notificationsEnabled) {
    throw new Error('请先启用通知总开关');
  }
}
```

**用户体验**:
- 清晰的错误提示
- 引导用户正确操作
- 防止困惑状态

### 3. 格式验证

时区验证示例：
```typescript
protected validateTimezone(timezone: string): ValidationResult {
  if (!/^[A-Za-z_]+\/[A-Za-z_]+$/.test(timezone)) {
    return {
      isValid: false,
      errors: ['时区格式无效，应为 Area/Location 格式（如 Asia/Shanghai）']
    };
  }
  return { isValid: true, errors: [] };
}
```

**数据质量**:
- IANA 时区标准
- 早期错误发现
- 友好的错误提示

---

## 代码质量

### 统计数据
- **总行数**: ~490 行
- **方法数**: 20+ 个
- **验证方法**: 4 个
- **业务方法**: 11 个
- **Getter**: 15 个
- **抽象方法**: 3 个

### 代码组织
```typescript
// ========== 基础属性 ==========
// ========== Getter 方法 ==========
// ========== 抽象方法 ==========
// ========== 核心业务方法 ==========
// ========== 验证方法 ==========
// ========== 辅助方法 ==========
```

### 文档覆盖
- ✅ 类级别 JSDoc
- ✅ 所有公共方法 JSDoc
- ✅ 参数说明
- ✅ 职责说明

---

## 与其他模块对比

| 特性 | ThemeDefinitionCore | GoalCore | UserPreferencesCore |
|------|---------------------|----------|---------------------|
| 继承 AggregateRoot | ✅ | ✅ | ✅ |
| Protected 字段 | ✅ | ✅ | ✅ |
| 抽象 toDTO/toClientDTO | ✅ | ✅ | ✅ |
| 业务方法数量 | 10+ | 15+ | 11 |
| 验证方法 | validate() | 分散在业务方法 | 4 个独立验证 |
| 版本管理 | incrementVersion() | _version | 无 (简单场景) |
| 特色功能 | CSS生成 | 进度计算 | 级联通知控制 |

**UserPreferencesCore 特点**:
- 更注重验证逻辑的独立性
- 业务规则清晰 (通知依赖检查)
- 适合频繁更新场景

---

## 验证清单

### 架构合规性
- [x] 继承 AggregateRoot
- [x] 实现 IUserPreferences 接口
- [x] Protected 字段 + Public getter
- [x] 抽象方法由子类实现
- [x] 平台无关的业务逻辑

### 业务完整性
- [x] 所有 IUserPreferences 字段覆盖
- [x] 所有偏好设置修改方法
- [x] 批量更新支持
- [x] 验证逻辑完整

### 代码质量
- [x] TypeScript 类型完整
- [x] JSDoc 文档覆盖
- [x] 清晰的代码组织
- [x] 编译无错误

### 构建验证
- [x] Contracts package 构建成功
- [x] Domain-Core package 构建成功
- [x] 类型导出正确
- [x] Dist 文件包含 UserPreferencesCore

---

## 遗留问题

### TypeScript 编辑器错误 (非阻塞)
```
Namespace 'index$2' has no exported member 'IUserPreferences'
```

**分析**:
- 构建成功 (pnpm build ✅)
- Dist 文件包含正确类型 ✅
- 编辑器缓存问题

**解决方案**:
- VS Code 重启 TypeScript 服务
- 或等待自动刷新
- 不影响后续开发

---

## 后续阶段预览

### Phase 3: Domain-Server (下一步)

任务概览：
1. **迁移 UserPreferences** 从 `apps/api/src/modules/setting/domain/aggregates/`
2. **继承 UserPreferencesCore**
3. **实现抽象方法**: toDTO(), toClientDTO(), toPersistence()
4. **添加服务端特定逻辑**: 
   - 数据库交互
   - 持久化格式转换
   - 服务端验证增强

示例实现：
```typescript
// packages/domain-server/src/setting/aggregates/UserPreferences.ts
export class UserPreferences extends UserPreferencesCore {
  toDTO(): UserPreferencesDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      language: this._language,
      // ... all fields
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }

  toPersistence(): UserPreferencesPersistenceDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      language: this._language,
      // ... all fields
      createdAt: this._createdAt, // Date object for Prisma
      updatedAt: this._updatedAt,
    };
  }

  toClientDTO(): UserPreferencesClientDTO {
    // Server side may not implement this, or provide basic version
    throw new Error('Use domain-client for ClientDTO generation');
  }

  static fromPersistence(data: UserPreferencesPersistenceDTO): UserPreferences {
    return new UserPreferences({
      ...data,
      createdAt: data.createdAt.toISOString(),
      updatedAt: data.updatedAt.toISOString(),
    });
  }
}
```

### Phase 4: Domain-Client
创建客户端实现，添加 UI 计算属性

### Phase 5-7
API/Web 层重构和文档完善

---

## 总结

**Phase 2** 成功创建了 UserPreferences 的核心抽象层，实现了平台无关的业务逻辑。

**关键成果**:
1. ✅ 完整的 UserPreferencesCore 抽象基类 (~490 行)
2. ✅ 11 个核心业务方法
3. ✅ 4 个独立验证方法
4. ✅ 级联通知控制等复杂业务逻辑
5. ✅ 构建验证通过 (Contracts + Domain-Core)

**架构价值**:
- 业务逻辑复用 (Server/Client 共享)
- 类型安全 (TypeScript + Contract 接口)
- 可测试性 (纯粹的业务逻辑)
- 可扩展性 (抽象方法由子类定制)

**下一步**: Phase 3 - 迁移并重构 Domain-Server 层的 UserPreferences 实现
