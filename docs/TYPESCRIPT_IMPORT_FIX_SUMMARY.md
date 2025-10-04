# TypeScript 导入错误修复总结

**日期**: 2025-01-04  
**修复范围**: API 项目和 Contracts 包

---

## 修复的问题

### 1. ❌ Theme 模块导入错误

**问题**: 
- `UserThemePreference.ts` 直接从 `@dailyuse/contracts` 导入 `IUserThemePreference` 和 `ThemeMode`
- 不符合项目的导入规范（参考 Goal 模块）

**修复**:
```typescript
// 修复前 ❌
import type { IUserThemePreference } from '@dailyuse/contracts';
import { ThemeMode } from '@dailyuse/contracts';

// 修复后 ✅
import type { ThemeContracts } from '@dailyuse/contracts';

type IUserThemePreference = ThemeContracts.IUserThemePreference;
type ThemeMode = ThemeContracts.ThemeMode;
```

**文件**: `apps/api/src/modules/theme/domain/entities/UserThemePreference.ts`

---

### 2. ❌ Prisma Repository 类型转换错误

**问题**: 
- `scheduleStart` 和 `scheduleEnd` 在实体中是 `number?` 类型
- 在 Prisma schema 中是 `String?` 类型
- Repository 未进行类型转换

**修复**:
```typescript
// PrismaUserThemePreferenceRepository.ts

// 保存时：number -> string
create: {
  scheduleStart: preference.scheduleStart?.toString(),
  scheduleEnd: preference.scheduleEnd?.toString(),
}

// 读取时：string -> number
private toDomain(data: any): UserThemePreference {
  return new UserThemePreference({
    scheduleStart: data.scheduleStart ? parseInt(data.scheduleStart, 10) : undefined,
    scheduleEnd: data.scheduleEnd ? parseInt(data.scheduleEnd, 10) : undefined,
    // ...
  });
}
```

**文件**: `apps/api/src/modules/theme/infrastructure/repositories/PrismaUserThemePreferenceRepository.ts`

---

### 3. ❌ Account 模块响应类型错误

**问题**: 
- `AccountListResponse` 的 `total` 属性在嵌套的 `data` 对象中
- 代码直接访问 `result.total` 而不是 `result.data.total`

**修复**:
```typescript
// 修复前 ❌
logger.info('Account list retrieved', { page, limit, total: result.total });

// 修复后 ✅
logger.info('Account list retrieved', { page, limit, total: result.data.total });
```

**文件**: `apps/api/src/modules/account/interface/http/controllers/AccountController.ts`

---

### 4. ❌ Account 模块导入规范错误

**问题**: 
- `accountHandlers.ts` 和 `EventRequester.ts` 直接导入类型
- 不符合项目导入规范

**修复**:
```typescript
// 修复前 ❌
import type { AccountDTO, IAccountCore, AccountStatus } from '@dailyuse/contracts';

// 修复后 ✅
import type { AccountContracts } from '@dailyuse/contracts';

type AccountDTO = AccountContracts.AccountDTO;
type IAccountCore = AccountContracts.IAccountCore;
type AccountStatus = AccountContracts.AccountStatus;
```

**文件**: 
- `apps/api/src/modules/account/application/events/accountHandlers.ts`
- `apps/api/src/modules/authentication/application/events/EventRequester.ts`

---

### 5. ❌ IAccountCore 接口使用错误

**问题**: 
- `convertAccountToCore` 方法返回的对象包含了不属于 `IAccountCore` 的字段
- `IAccountCore` 只包含核心字段，不包含 `email`、`user`、`roleIds` 等

**修复**:
```typescript
// 修复前 ❌
private convertAccountToCore(account: Account): IAccountCore {
  return {
    uuid: account.uuid,
    username: account.username,
    email: account.email,  // ❌ 不属于 IAccountCore
    user: { ... },         // ❌ 不属于 IAccountCore
    roleIds: new Set(...), // ❌ 不属于 IAccountCore
    // ...
  };
}

// 修复后 ✅
private convertAccountToCore(account: Account): IAccountCore {
  return {
    uuid: account.uuid,
    username: account.username,
    accountType: account.accountType,
    status: account.status,
    createdAt: new Date(account.createdAt),
    updatedAt: new Date(account.updatedAt),
    lastLoginAt: account.lastLoginAt ? new Date(account.lastLoginAt) : undefined,
  };
}
```

**文件**: `apps/api/src/modules/account/application/events/accountHandlers.ts`

---

### 6. ❌ TypeScript 配置问题

**问题**: 
- `tsconfig.json` 中包含 `vitest/globals` 类型定义
- 但项目中没有安装相应的类型包

**修复**:
```json
// 修复前 ❌
"types": ["node", "vitest/globals"]

// 修复后 ✅
"types": ["node"]
```

**说明**: Vitest 类型应该在测试文件中单独导入，不需要全局声明

**文件**: `apps/api/tsconfig.json`

---

## 导入规范 (参考 Goal 模块)

### ✅ 正确的导入方式

```typescript
// 1. 导入命名空间
import type { GoalContracts } from '@dailyuse/contracts';
import type { TaskContracts } from '@dailyuse/contracts';
import type { ThemeContracts } from '@dailyuse/contracts';

// 2. 使用 type 别名
type CreateGoalRequest = GoalContracts.CreateGoalRequest;
type UpdateGoalRequest = GoalContracts.UpdateGoalRequest;
type GoalResponse = GoalContracts.GoalResponse;

// 3. 在代码中使用别名
async function createGoal(request: CreateGoalRequest): Promise<GoalResponse> {
  // ...
}
```

### ❌ 错误的导入方式

```typescript
// ❌ 直接导入单个类型
import { CreateGoalRequest, GoalResponse } from '@dailyuse/contracts';

// ❌ 解构导入
import { GoalContracts } from '@dailyuse/contracts';
const { CreateGoalRequest } = GoalContracts;
```

---

## 验证结果

### TypeScript 编译检查

```bash
cd apps/api
pnpm exec tsc --noEmit
```

**结果**: ✅ 无错误

### 修复的文件列表

1. ✅ `apps/api/src/modules/theme/domain/entities/UserThemePreference.ts` - 导入规范
2. ✅ `apps/api/src/modules/theme/infrastructure/repositories/PrismaUserThemePreferenceRepository.ts` - 类型转换
3. ✅ `apps/api/src/modules/account/interface/http/controllers/AccountController.ts` - 响应类型
4. ✅ `apps/api/src/modules/account/application/events/accountHandlers.ts` - 导入规范 + IAccountCore 接口
5. ✅ `apps/api/src/modules/authentication/application/events/EventRequester.ts` - 导入规范
6. ✅ `apps/api/tsconfig.json` - TypeScript 配置

---

## Contracts 包导出规范

### 当前导出结构

```typescript
// packages/contracts/src/index.ts

// ✅ 命名空间导出 (推荐)
export * as TaskContracts from './modules/task';
export * as GoalContracts from './modules/goal';
export * as ThemeContracts from './modules/theme';
export * as SettingContracts from './modules/setting';
export * as AccountContracts from './modules/account';
// ...

// ✅ 直接导出枚举 (方便使用)
export { ImportanceLevel } from './shared/importance';
export { UrgencyLevel } from './shared/urgency';
```

### 使用示例

```typescript
// 导入命名空间
import type { ThemeContracts } from '@dailyuse/contracts';

// 导入枚举
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';

// 使用类型
type ThemeMode = ThemeContracts.ThemeMode;
type IUserThemePreference = ThemeContracts.IUserThemePreference;

// 使用枚举
const importance = ImportanceLevel.HIGH;
```

---

## 注意事项

### 1. 类型转换

当 Prisma schema 和实体类型不匹配时，必须在 Repository 层进行转换：

- **保存时**: 实体类型 → Prisma 类型
- **读取时**: Prisma 类型 → 实体类型

### 2. 响应结构

注意区分：
- **直接响应**: `{ data: T }`
- **列表响应**: `{ data: { items: T[], total: number, ... } }`

### 3. 导入规范

始终使用命名空间导入 + type 别名的方式，保持代码一致性和可维护性。

---

## 下一步

- [x] 修复所有 TypeScript 编译错误
- [x] 统一导入规范
- [ ] 更新其他模块的导入方式（如需要）
- [ ] 添加 ESLint 规则强制导入规范
- [ ] 更新开发文档

---

**修复完成**: ✅ 所有错误已修复，TypeScript 编译通过
