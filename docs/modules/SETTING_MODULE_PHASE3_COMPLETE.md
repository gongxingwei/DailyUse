# Setting Module Refactoring - Phase 3 Complete ✅

## Phase 3: Domain-Server 重构

**Status**: ✅ Completed  
**Duration**: ~30 minutes  
**Date**: 2024-10-06

---

## 完成内容

### 1. UserPreferences 服务端实现

创建了 `packages/domain-server/src/setting/aggregates/UserPreferences.ts` (~280 lines)

#### 核心特性
- **继承**: `extends UserPreferencesCore` (来自 @dailyuse/domain-core)
- **实现抽象方法**: toDTO(), toClientDTO(), toPersistence()
- **服务端特定逻辑**: 持久化转换、工厂方法、备份恢复

#### 实现的抽象方法

1. **toDTO(): UserPreferencesDTO**
   ```typescript
   // 转换为标准 DTO（用于 API 响应）
   // Date → ISO string
   createdAt: this._createdAt.toISOString()
   ```

2. **toClientDTO(): UserPreferencesClientDTO**
   ```typescript
   // 服务端提供基础版本，实际 UI 属性由 domain-client 计算
   languageText: this._language,  // 简化版
   themeModeIcon: '',              // 客户端填充
   ```

3. **toPersistence(): UserPreferencesPersistenceDTO**
   ```typescript
   // 转换为数据库格式
   // ISO string → Date object (for Prisma)
   createdAt: this._createdAt      // Date object
   ```

#### 工厂方法

1. **fromPersistence(data: UserPreferencesPersistenceDTO)**
   - 从数据库数据创建领域对象
   - Date → ISO string 转换
   - 类型断言 themeMode

2. **fromDTO(data: UserPreferencesDTO)**
   - 从 DTO 创建领域对象
   - 用于 API 请求处理

3. **createDefault(accountUuid, uuid?)**
   - 创建默认用户偏好
   - 默认值：
     - language: 'zh-CN'
     - timezone: 'Asia/Shanghai'
     - themeMode: 'system'
     - notificationsEnabled: true
     - defaultModule: 'goal'

4. **createDefaultBatch(accountUuids[])**
   - 批量创建默认偏好
   - 用于批量用户初始化

#### 服务端特定业务方法

1. **resetToDefaults()**
   - 重置为默认设置
   - 保留 uuid 和 accountUuid
   - 自动更新时间戳

2. **exportBackup(): Record<string, any>**
   ```typescript
   {
     version: '1.0',
     exportedAt: ISO string,
     data: UserPreferencesDTO
   }
   ```

3. **restoreFromBackup(backupData)**
   - 从备份恢复偏好设置
   - 不恢复 UUID 和账户信息
   - 使用 updatePreferences 批量更新

4. **clone(newAccountUuid)**
   - 克隆偏好设置到新账户
   - 生成新 UUID
   - 重置时间戳

5. **generateUUID()**
   - 使用 crypto.randomUUID()
   - 加密安全的 UUID 生成

---

### 2. IUserPreferencesRepository 接口

创建了 `packages/domain-server/src/setting/repositories/IUserPreferencesRepository.ts` (~90 lines)

#### 基础操作
```typescript
// 查询
findByAccountUuid(accountUuid: string): Promise<UserPreferences | null>
findByUuid(uuid: string): Promise<UserPreferences | null>
exists(accountUuid: string): Promise<boolean>

// 保存
save(preferences: UserPreferences): Promise<UserPreferences>

// 删除
deleteByAccountUuid(accountUuid: string): Promise<void>
delete(uuid: string): Promise<void>
```

#### 批量操作
```typescript
findMany(accountUuids: string[]): Promise<UserPreferences[]>
saveMany(preferencesList: UserPreferences[]): Promise<UserPreferences[]>
```

#### 分页查询
```typescript
findAll(offset: number, limit: number): Promise<UserPreferences[]>
count(): Promise<number>
```

#### 接口设计特点
- 支持按 UUID 和 accountUuid 查询（双主键模式）
- 完整的 CRUD 操作
- 批量操作支持
- 分页和统计功能

---

### 3. 目录结构

```
packages/domain-server/src/setting/
├── aggregates/
│   ├── UserPreferences.ts          # ✨ 新增 (~280 lines)
│   ├── SettingDefinition.ts        # 已存在
│   └── index.ts                    # ✨ 新增
├── repositories/
│   ├── IUserPreferencesRepository.ts  # ✨ 新增 (~90 lines)
│   └── index.ts                       # ✨ 新增
└── index.ts                        # ✅ 更新：导出 aggregates + repositories
```

---

## 架构设计

### 1. DTO 转换链

```
┌─────────────────┐
│   Persistence   │  ← Database (Prisma)
│      DTO        │
└────────┬────────┘
         │ fromPersistence()
         ↓
┌─────────────────┐
│     Domain      │  ← Core Business Logic
│     Object      │
│ (UserPreferences)│
└────────┬────────┘
         │ toDTO()
         ↓
┌─────────────────┐
│   Standard      │  ← API Response
│      DTO        │
└─────────────────┘
         │ (在 domain-client)
         ↓
┌─────────────────┐
│    Client       │  ← UI with computed properties
│      DTO        │
└─────────────────┘
```

### 2. 时间类型转换策略

| 层级 | 类型 | 说明 |
|------|------|------|
| Database | `Date` | Prisma 原生 Date 对象 |
| Domain (Core) | `Date` (protected) | 内部使用 Date 对象 |
| Domain (Core getters) | `string` | ISO string 格式 |
| Persistence DTO | `Date` | 匹配数据库格式 |
| Standard DTO | `string` | ISO string (序列化友好) |
| Client DTO | `string` | ISO string + formatted versions |

**优势**:
- Prisma 自动处理 Date ↔ Database 转换
- DTO 使用 string 便于 JSON 序列化
- Core 内部用 Date 便于计算

### 3. 工厂模式

```typescript
// 从数据库创建
const preferences = UserPreferences.fromPersistence(dbData);

// 从 API 请求创建
const preferences = UserPreferences.fromDTO(requestData);

// 创建默认值
const preferences = UserPreferences.createDefault(accountUuid);

// 批量创建
const preferencesList = UserPreferences.createDefaultBatch(accountUuids);
```

**优势**:
- 统一创建逻辑
- 类型安全
- 数据验证集中化

---

## 与 apps/api 旧实现对比

| 特性 | 旧实现 (apps/api) | 新实现 (domain-server) |
|------|------------------|----------------------|
| 继承关系 | 无继承 | extends UserPreferencesCore |
| 时间戳类型 | `number` (timestamp) | `Date` (ISO string) |
| 业务方法 | 直接修改 + 手动更新时间戳 | 继承 Core 的验证逻辑 |
| DTO 转换 | toObject() | toDTO/toClientDTO/toPersistence |
| 工厂方法 | createDefault() | fromPersistence/fromDTO/createDefault |
| 服务端特定 | 无 | resetToDefaults/exportBackup/clone |
| 代码行数 | ~220 行 | Core 490 行 + Server 280 行 |

### 迁移改进

1. **类型安全增强**
   - 旧: `createdAt: number` → 新: `createdAt: Date` (内部) + `string` (DTO)
   - 旧: themeMode 无类型断言 → 新: `as 'light' | 'dark' | 'system'`

2. **业务逻辑复用**
   - 旧: 每个方法都 `this.updatedAt = Date.now()`
   - 新: 继承 Core 的 `touch()` 方法

3. **验证逻辑提升**
   - 旧: 简单的 `isValidLanguage` 检查
   - 新: Core 层完整的验证方法 (validateLanguage/validateThemeMode/validateTimezone)

4. **DTO 转换标准化**
   - 旧: `toObject()` 返回 `IUserPreferences`
   - 新: 三种 DTO (Standard/Client/Persistence)

---

## 代码质量

### 统计数据
- **UserPreferences.ts**: ~280 行
  - 抽象方法实现: 3 个
  - 工厂方法: 4 个
  - 服务端业务方法: 5 个
- **IUserPreferencesRepository.ts**: ~90 行
  - 接口方法: 11 个

### JSDoc 覆盖
- ✅ 类级别文档
- ✅ 所有公共方法文档
- ✅ 参数和返回值说明
- ✅ Repository 接口完整注释

### 类型安全
- ✅ 完整的 TypeScript 类型
- ✅ 类型断言 (`as` 用于 themeMode)
- ✅ Promise 返回类型明确
- ✅ 零编译错误

---

## 构建验证

### Domain-Server Package
```bash
pnpm --filter @dailyuse/domain-server build
# ✅ Success: 94ms
# ✅ DTS: 195.94 KB
```

### 导出验证
```typescript
// packages/domain-server/dist/index.d.ts 包含:
export class UserPreferences extends UserPreferencesCore { }
export interface IUserPreferencesRepository { }
```

---

## 遗留任务

### 需要迁移的文件（Phase 5）

1. **apps/api/src/modules/setting/domain/aggregates/UserPreferences.ts**
   - ❌ 将被删除（已迁移到 domain-server）

2. **apps/api/src/modules/setting/domain/repositories/IUserPreferencesRepository.ts**
   - ❌ 将被删除（已迁移到 domain-server）

3. **apps/api/src/modules/setting/infrastructure/persistence/UserPreferencesRepositoryPrisma.ts**
   - ⚠️ 需要更新：使用新的 domain-server 包
   - 更新导入: `from '@dailyuse/domain-server'`
   - 更新方法: 使用 fromPersistence/toPersistence

4. **apps/api/src/modules/setting/application/UserPreferencesService.ts**
   - ⚠️ 需要更新：使用新的 domain-server 包
   - 更新导入和方法调用

5. **apps/api/src/modules/setting/interface/UserPreferencesController.ts**
   - ⚠️ 需要更新：使用新的 domain-server 包

---

## 后续阶段预览

### Phase 4: Domain-Client 创建（下一步）

任务概览：
1. **创建 UserPreferences 客户端实现**
   ```typescript
   // packages/domain-client/src/setting/aggregates/UserPreferences.ts
   export class UserPreferences extends UserPreferencesCore {
     toClientDTO(): UserPreferencesClientDTO {
       return {
         ...this.toDTO(),
         languageText: this.getLanguageText(),
         themeModeIcon: this.getThemeModeIcon(),
         themeModeText: this.getThemeModeText(),
         canChangeTheme: true,
         hasEmailEnabled: this._emailNotifications,
         hasPushEnabled: this._pushNotifications,
         formattedCreatedAt: this.formatDateTime(this._createdAt),
         formattedUpdatedAt: this.formatDateTime(this._updatedAt),
       };
     }
     
     private getLanguageText(): string {
       const languageMap = {
         'zh-CN': '简体中文',
         'en-US': 'English',
         'ja-JP': '日本語',
         'ko-KR': '한국어',
       };
       return languageMap[this._language] || this._language;
     }
     
     private getThemeModeIcon(): string {
       const iconMap = {
         light: 'mdi-white-balance-sunny',
         dark: 'mdi-weather-night',
         system: 'mdi-theme-light-dark',
       };
       return iconMap[this._themeMode];
     }
   }
   ```

2. **UI 计算属性实现**
   - languageText: 语言显示名称
   - themeModeIcon: Material Design Icons
   - themeModeText: 主题模式显示文本
   - timezoneText: 时区友好显示
   - 格式化时间: 本地化日期时间

3. **客户端特定方法**
   - 预览主题效果
   - 检查浏览器支持
   - 本地化工具方法

### Phase 5: API 层重构
更新 ApplicationService, Repository, Controller 使用新包

### Phase 6: Web 层重构
更新 Store, Composables, Views 使用 domain-client

### Phase 7: 文档与测试
完善文档和测试覆盖

---

## 总结

**Phase 3** 成功将 UserPreferences 迁移到 domain-server 包，实现了服务端特定逻辑。

**关键成果**:
1. ✅ 完整的 UserPreferences 服务端实现 (~280 行)
2. ✅ 完整的 IUserPreferencesRepository 接口 (11 方法)
3. ✅ 三种 DTO 转换方法 (Standard/Client/Persistence)
4. ✅ 五种工厂方法 (fromPersistence/fromDTO/createDefault/createDefaultBatch)
5. ✅ 服务端特定业务方法 (reset/backup/restore/clone)
6. ✅ 构建验证通过 (零编译错误)

**架构价值**:
- 清晰的 DTO 转换链 (Database ↔ Domain ↔ API ↔ UI)
- 统一的工厂模式 (类型安全 + 验证集中化)
- 时间类型优化 (Date 内部 + string DTO)
- 服务端特定功能 (备份恢复、批量操作)

**代码改进**:
- 从 220 行 → 770 行 (Core 490 + Server 280)
- 从简单验证 → 完整验证体系
- 从单一 DTO → 三层 DTO 系统
- 从手动时间戳 → 自动时间戳管理

**下一步**: Phase 4 - 创建 Domain-Client 层，实现 UI 计算属性
