# Electron DDD 架构统一迁移计划

## 迁移目标

将当前的双重领域模型（主进程 + 渲染进程）统一为单一领域模型（仅主进程），渲染进程通过 IPC 和 DTO 通信。

## 当前状况分析

### 存在的重复定义

1. **AggregateRoot 基类**：
   - `electron/shared/domain/aggregateRoot.ts` (主进程版本)
   - `src/shared/domain/aggregateRoot.ts` (渲染进程版本)

2. **Account 聚合根**：
   - `electron/modules/Account/domain/aggregates/account.ts`
   - `src/modules/Account/domain/aggregates/account.ts`

3. **其他可能的重复**：需要全面审查所有模块

## 迁移步骤

### 第一阶段：创建 DTO 层 📋

#### 1.1 创建共享的 DTO 类型定义

```typescript
// electron/shared/types/dtos.ts
export interface AccountDTO {
  uuid: string;
  username: string;
  email?: string;
  phone?: string;
  accountType: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  lastLoginAt?: number;
}

export interface SessionLogDTO {
  uuid: string;
  accountUuid: string;
  sessionId: string;
  operationType: string;
  ipLocation: IPLocationDTO;
  userAgent?: string;
  riskLevel: string;
  isAnomalous: boolean;
  loginTime?: number;
  logoutTime?: number;
  timestamp: number;
}

export interface IPLocationDTO {
  ipAddress: string;
  country: string;
  region: string;
  city: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  locationDescription: string;
  fullDescription: string;
  isSuspicious: boolean;
}

export interface AuthCredentialDTO {
  uuid: string;
  accountUuid: string;
  algorithm: string;
  createdAt: number;
  lastAuthAt?: number;
}

export interface SessionDTO {
  uuid: string;
  accountUuid: string;
  token: string;
  isActive: boolean;
  expiresAt: number;
  createdAt: number;
  lastActiveAt: number;
  ipAddress: string;
  userAgent?: string;
}
```

#### 1.2 为现有实体添加 toDTO 方法

已完成：
- ✅ IPLocation.toDTO() - 已存在

待完成：
- [ ] Account.toDTO()
- [ ] SessionLog.toDTO()
- [ ] AuthCredential.toDTO()
- [ ] Session.toDTO()
- [ ] AuditTrail.toDTO()

### 第二阶段：更新主进程服务 🔧

#### 2.1 更新应用服务返回 DTO

```typescript
// electron/modules/Account/application/services/mainAccountApplicationService.ts
export class MainAccountApplicationService {
  async getAllUsers(): Promise<TResponse<AccountDTO[]>> {
    try {
      const accounts = await this.accountRepository.findAll();
      const accountDTOs = accounts.map(account => account.toDTO());
      
      return {
        success: true,
        message: '获取成功',
        data: accountDTOs
      };
    } catch (error) {
      return {
        success: false,
        message: '获取失败',
        data: undefined
      };
    }
  }
}
```

#### 2.2 更新 IPC 处理器

```typescript
// electron/modules/Account/ipcs/newAccountIpcHandler.ts
ipcMain.handle('account:get-all-users', async (): Promise<TResponse<AccountDTO[]>> => {
  return await accountService.getAllUsers();
});
```

### 第三阶段：重构渲染进程 🎨

#### 3.1 创建 API 客户端

```typescript
// src/shared/apis/accountApi.ts
export class AccountApi {
  static async getAllUsers(): Promise<AccountDTO[]> {
    const response = await window.electronAPI.invoke('account:get-all-users');
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message);
  }

  static async updateAccount(uuid: string, data: any): Promise<AccountDTO> {
    const response = await window.electronAPI.invoke('account:update', { uuid, data });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message);
  }
}
```

#### 3.2 删除渲染进程的领域模型

移除以下目录：
- `src/shared/domain/`
- `src/modules/*/domain/`

#### 3.3 更新 Vue 组件和 Stores

```typescript
// src/modules/Account/stores/accountStore.ts
import { defineStore } from 'pinia';
import { AccountApi } from '@/shared/apis/accountApi';
import type { AccountDTO } from '@/shared/types/dtos';

export const useAccountStore = defineStore('account', {
  state: () => ({
    accounts: [] as AccountDTO[],
    loading: false
  }),

  actions: {
    async fetchAllUsers() {
      this.loading = true;
      try {
        this.accounts = await AccountApi.getAllUsers();
      } catch (error) {
        console.error('获取用户失败:', error);
      } finally {
        this.loading = false;
      }
    }
  }
});
```

### 第四阶段：清理和优化 🧹

#### 4.1 删除重复代码

- [ ] 删除 `src/shared/domain/` 目录
- [ ] 删除 `src/modules/*/domain/` 目录
- [ ] 更新所有导入路径

#### 4.2 类型检查和测试

- [ ] 运行 TypeScript 编译检查
- [ ] 测试所有 IPC 通信
- [ ] 测试所有页面功能

#### 4.3 性能优化

- [ ] 优化 DTO 序列化/反序列化
- [ ] 减少不必要的数据传输
- [ ] 实现客户端缓存策略

## 实施优先级

### 高优先级 🔴
1. **Account 模块**：已经重构，需要添加 DTO 层
2. **Authentication 模块**：新架构，需要同步 DTO 设计
3. **SessionLogging 模块**：审计功能，需要确保数据完整性

### 中优先级 🟡
1. **Goal 模块**：业务功能，可以逐步迁移
2. **Task 模块**：业务功能，可以逐步迁移

### 低优先级 🟢
1. **其他工具模块**：功能相对独立

## 迁移检查清单

### 每个模块完成标准
- [ ] 主进程实体添加 `toDTO()` 方法
- [ ] 应用服务返回 DTO 类型
- [ ] IPC 处理器使用 DTO 通信
- [ ] 渲染进程 API 客户端完成
- [ ] 删除渲染进程领域模型
- [ ] 更新所有导入路径
- [ ] 测试功能正常

### 全局完成标准
- [ ] 所有模块迁移完成
- [ ] TypeScript 编译无错误
- [ ] 所有功能测试通过
- [ ] 性能测试通过
- [ ] 文档更新完成

## 注意事项

1. **向后兼容**：迁移过程中保持功能可用
2. **逐步迁移**：一次迁移一个模块，避免大规模破坏
3. **测试优先**：每个步骤都要有充分的测试
4. **性能监控**：注意 IPC 通信的性能影响

## 预期收益

1. **代码质量**：消除重复，提高可维护性
2. **类型安全**：避免主进程/渲染进程类型冲突
3. **架构清晰**：职责分离，符合 Electron 最佳实践
4. **开发效率**：修改同步，减少维护成本
5. **系统稳定性**：业务逻辑集中，减少 bug 风险
