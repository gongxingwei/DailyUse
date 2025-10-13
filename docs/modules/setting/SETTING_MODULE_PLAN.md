# Setting 模块 - 核心架构规划

> **版本**: v1.1 (简化版)  
> **日期**: 2025-01-13  
> **架构参考**: Goal 模块（`docs/modules/goal/GOAL_MODULE_PLAN.md`）

---

## 🎯 核心要点

Setting 模块管理用户的各种设置和偏好。

### 主要聚合根
1. **UserPreference** - 用户偏好设置
2. **ThemeSetting** - 主题设置

### 主要实体
1. **AppConfig** - 应用配置

---

## 📋 DTO 命名规范

```typescript
// Server DTO
UserPreferenceServerDTO
ThemeSettingServerDTO

// Client DTO（注意 Client 后缀）
UserPreferenceClientDTO
ThemeSettingClientDTO

// Persistence DTO
UserPreferencePersistenceDTO
ThemeSettingPersistenceDTO
```

---

## 🔄 DTO 转换方法

与 Goal 模块完全一致。

---

## 🗂️ 核心设置类型

```typescript
export interface UserPreference {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  weekStartDay: number;
  theme: 'light' | 'dark' | 'auto';
  // ... 其他偏好
}
```

---

## 🔑 核心业务方法

```typescript
export class UserPreference extends AggregateRoot {
  // 更新设置
  public updateLanguage(language: string): void;
  public updateTimezone(timezone: string): void;
  public updateTheme(theme: ThemeSetting): void;
  
  // 重置
  public resetToDefault(): void;
  
  // 验证
  public validate(): boolean;
}
```

---

## 📦 仓储接口

```typescript
export interface IUserPreferenceRepository {
  save(preference: UserPreference): Promise<void>;
  findByAccountUuid(accountUuid: string): Promise<UserPreference | null>;
  
  // 默认设置
  getDefaultPreferences(): UserPreference;
}
```

---

## 💡 重构建议

1. **基于 Goal 模块架构**
2. **实现设置同步机制**
3. **支持多端设置**

---

参考：`docs/modules/goal/GOAL_MODULE_PLAN.md`
