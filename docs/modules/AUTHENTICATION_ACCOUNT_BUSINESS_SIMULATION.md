# Authentication & Account 模块业务模拟文档

## 文档说明

本文档展示 **Authentication 模块**和 **Account 模块**如何通过**事件总线 (Event Bus)** 协作完成业务流程。

- **Authentication 模块**: 负责认证、授权、会话管理、凭证管理
- **Account 模块**: 负责账户信息、用户资料、偏好设置、订阅管理
- **事件总线**: 解耦两个模块，通过领域事件实现异步通信

## 架构层次

```
Frontend (Web/Desktop)
├── Components (UI 组件)
├── Composables (组合式函数)
├── Services (前端服务层)
└── API Client (HTTP 请求)
        ↓
Backend (API Server)
├── Routes (路由层)
├── Controllers (控制器)
├── Application Services (应用服务)
├── Domain Services (领域服务)
├── Domain Entities (领域实体)
├── Repositories (仓储)
├── Event Bus (事件总线) ⭐️
└── Event Handlers (事件处理器) ⭐️
```

---

## 场景 1: 用户注册 (Register)

### 业务流程概述

1. **Frontend**: 用户填写注册表单 (用户名、邮箱、密码)
2. **Account 模块**: 创建 Account 聚合根
3. **Event Bus**: 发布 `AccountCreatedEvent`
4. **Authentication 模块**: 监听事件，创建 AuthCredential
5. **Frontend**: 返回注册成功，自动登录

---

### 1.1 Frontend: Register Component

```typescript
// File: apps/web/src/modules/auth/components/RegisterForm.vue
<script setup lang="ts">
import { ref } from 'vue';
import { useAuthComposable } from '../composables/useAuth';
import { useRouter } from 'vue-router';

const authComposable = useAuthComposable();
const router = useRouter();

const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  displayName: '',
  agreeToTerms: false
});

const isSubmitting = ref(false);
const errorMessage = ref('');

async function handleRegister() {
  if (form.value.password !== form.value.confirmPassword) {
    errorMessage.value = 'Passwords do not match';
    return;
  }
  
  if (!form.value.agreeToTerms) {
    errorMessage.value = 'You must agree to the terms';
    return;
  }
  
  isSubmitting.value = true;
  errorMessage.value = '';
  
  try {
    // 调用 Composable
    const result = await authComposable.register({
      username: form.value.username,
      email: form.value.email,
      password: form.value.password,
      displayName: form.value.displayName
    });
    
    // 注册成功，自动登录
    console.log('Register successful:', result);
    
    // 跳转到 Dashboard
    router.push('/dashboard');
  } catch (error: any) {
    errorMessage.value = error.message || 'Registration failed';
  } finally {
    isSubmitting.value = false;
  }
}
</script>
```

---

### 1.2 Frontend: Auth Composable

```typescript
// File: apps/web/src/modules/auth/composables/useAuth.ts
import { ref, computed } from 'vue';
import { authService } from '../services/authService';
import { accountService } from '../services/accountService';
import type { AccountClient } from '@daily-use/contracts';
import type { AuthSessionClient } from '@daily-use/contracts';

const currentAccount = ref<AccountClient | null>(null);
const currentSession = ref<AuthSessionClient | null>(null);
const isAuthenticated = computed(() => !!currentSession.value);

export function useAuthComposable() {
  async function register(data: {
    username: string;
    email: string;
    password: string;
    displayName: string;
  }) {
    // Step 1: 调用 Account Service 创建账户
    const account = await accountService.createAccount({
      username: data.username,
      email: data.email,
      displayName: data.displayName
    });
    
    // Step 2: 调用 Auth Service 设置密码 (通过事件总线触发)
    // 后端已经通过事件处理器自动创建了 AuthCredential
    
    // Step 3: 自动登录
    const loginResult = await authService.login({
      identifier: data.email, // 使用邮箱或用户名登录
      password: data.password,
      rememberMe: true
    });
    
    // Step 4: 更新本地状态
    currentAccount.value = account;
    currentSession.value = loginResult.session;
    
    // Step 5: 存储 tokens
    localStorage.setItem('accessToken', loginResult.session.accessToken);
    if (loginResult.rememberMeToken) {
      localStorage.setItem('rememberMeToken', loginResult.rememberMeToken);
    }
    
    return {
      account,
      session: loginResult.session
    };
  }
  
  async function login(data: {
    identifier: string; // email or username
    password: string;
    rememberMe?: boolean;
  }) {
    const result = await authService.login(data);
    
    currentSession.value = result.session;
    localStorage.setItem('accessToken', result.session.accessToken);
    
    if (result.rememberMeToken) {
      localStorage.setItem('rememberMeToken', result.rememberMeToken);
    }
    
    // 获取账户信息
    currentAccount.value = await accountService.getCurrentAccount();
    
    return result;
  }
  
  async function logout() {
    await authService.logout();
    
    currentSession.value = null;
    currentAccount.value = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('rememberMeToken');
  }
  
  return {
    currentAccount,
    currentSession,
    isAuthenticated,
    register,
    login,
    logout
  };
}
```

---

### 1.3 Frontend: Account Service

```typescript
// File: apps/web/src/modules/account/services/accountService.ts
import { apiClient } from '@/shared/api/apiClient';
import type { 
  AccountClient, 
  AccountCreateRequest,
  AccountUpdateRequest 
} from '@daily-use/contracts';

export const accountService = {
  async createAccount(data: AccountCreateRequest): Promise<AccountClient> {
    const response = await apiClient.post<AccountClient>(
      '/api/accounts',
      data
    );
    return response.data;
  },
  
  async getCurrentAccount(): Promise<AccountClient> {
    const response = await apiClient.get<AccountClient>('/api/accounts/me');
    return response.data;
  },
  
  async updateAccount(
    accountUuid: string,
    data: AccountUpdateRequest
  ): Promise<AccountClient> {
    const response = await apiClient.put<AccountClient>(
      `/api/accounts/${accountUuid}`,
      data
    );
    return response.data;
  },
  
  async deleteAccount(accountUuid: string): Promise<void> {
    await apiClient.delete(`/api/accounts/${accountUuid}`);
  }
};
```

---

### 1.4 Frontend: Auth Service

```typescript
// File: apps/web/src/modules/auth/services/authService.ts
import { apiClient } from '@/shared/api/apiClient';
import type {
  AuthSessionClient,
  AuthCredentialClient,
  LoginRequest,
  LoginResponse
} from '@daily-use/contracts';

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/api/auth/login',
      data
    );
    return response.data;
  },
  
  async logout(): Promise<void> {
    await apiClient.post('/api/auth/logout');
  },
  
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    accessTokenExpiresAt: number;
  }> {
    const response = await apiClient.post('/api/auth/refresh', {
      refreshToken
    });
    return response.data;
  },
  
  async getCurrentSession(): Promise<AuthSessionClient> {
    const response = await apiClient.get<AuthSessionClient>(
      '/api/auth/session'
    );
    return response.data;
  },
  
  async getActiveSessions(): Promise<AuthSessionClient[]> {
    const response = await apiClient.get<AuthSessionClient[]>(
      '/api/auth/sessions'
    );
    return response.data;
  }
};
```

---

### 1.5 Backend: Account Route

```typescript
// File: apps/api/src/modules/account/routes/accountRoutes.ts
import { Router } from 'express';
import { AccountController } from '../controllers/AccountController';
import { authenticate } from '@/middleware/authenticate';

const router = Router();
const accountController = new AccountController();

// POST /api/accounts - 创建账户 (公开接口，无需认证)
router.post('/', accountController.createAccount);

// GET /api/accounts/me - 获取当前用户账户 (需要认证)
router.get('/me', authenticate, accountController.getCurrentAccount);

// PUT /api/accounts/:uuid - 更新账户
router.put('/:uuid', authenticate, accountController.updateAccount);

// DELETE /api/accounts/:uuid - 删除账户
router.delete('/:uuid', authenticate, accountController.deleteAccount);

export default router;
```

---

### 1.6 Backend: Account Controller

```typescript
// File: apps/api/src/modules/account/controllers/AccountController.ts
import { Request, Response } from 'express';
import { AccountApplicationService } from '../services/AccountApplicationService';
import type { AccountCreateRequest } from '@daily-use/contracts';

export class AccountController {
  private accountAppService: AccountApplicationService;
  
  constructor() {
    this.accountAppService = new AccountApplicationService();
  }
  
  createAccount = async (req: Request, res: Response) => {
    try {
      const data: AccountCreateRequest = req.body;
      
      // 调用 Application Service
      const account = await this.accountAppService.createAccount({
        username: data.username,
        email: data.email,
        displayName: data.displayName,
        password: data.password, // 传递密码，用于事件
        timezone: data.timezone || 'UTC',
        language: data.language || 'en'
      });
      
      // 返回 ClientDTO
      const accountClient = account.toClientDTO();
      
      res.status(201).json(accountClient);
    } catch (error: any) {
      console.error('Create account error:', error);
      
      if (error.code === 'DUPLICATE_USERNAME') {
        return res.status(409).json({
          error: 'Username already exists'
        });
      }
      
      if (error.code === 'DUPLICATE_EMAIL') {
        return res.status(409).json({
          error: 'Email already exists'
        });
      }
      
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  };
  
  getCurrentAccount = async (req: Request, res: Response) => {
    try {
      // req.user 由 authenticate 中间件注入
      const accountUuid = req.user.accountUuid;
      
      const account = await this.accountAppService.getAccountByUuid(accountUuid);
      
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
      
      res.json(account.toClientDTO());
    } catch (error) {
      console.error('Get current account error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  updateAccount = async (req: Request, res: Response) => {
    try {
      const { uuid } = req.params;
      const data = req.body;
      
      // 权限检查: 只能更新自己的账户
      if (req.user.accountUuid !== uuid) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      const account = await this.accountAppService.updateAccount(uuid, data);
      
      res.json(account.toClientDTO());
    } catch (error) {
      console.error('Update account error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  deleteAccount = async (req: Request, res: Response) => {
    try {
      const { uuid } = req.params;
      
      // 权限检查
      if (req.user.accountUuid !== uuid) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      await this.accountAppService.deleteAccount(uuid);
      
      res.status(204).send();
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
```

---

### 1.7 Backend: Account Application Service

```typescript
// File: apps/api/src/modules/account/services/AccountApplicationService.ts
import { AccountEntity } from '@daily-use/domain-server';
import { AccountRepository } from '../repositories/AccountRepository';
import { EventBus } from '@/shared/eventBus/EventBus';
import { AccountCreatedEvent } from '../events/AccountCreatedEvent';

export class AccountApplicationService {
  private accountRepo: AccountRepository;
  private eventBus: EventBus;
  
  constructor() {
    this.accountRepo = new AccountRepository();
    this.eventBus = EventBus.getInstance();
  }
  
  async createAccount(data: {
    username: string;
    email: string;
    displayName: string;
    password: string; // 用于传递给事件
    timezone?: string;
    language?: string;
  }): Promise<AccountEntity> {
    // Step 1: 检查用户名是否已存在
    const existingByUsername = await this.accountRepo.findByUsername(
      data.username
    );
    if (existingByUsername) {
      throw {
        code: 'DUPLICATE_USERNAME',
        message: 'Username already exists'
      };
    }
    
    // Step 2: 检查邮箱是否已存在
    const existingByEmail = await this.accountRepo.findByEmail(data.email);
    if (existingByEmail) {
      throw {
        code: 'DUPLICATE_EMAIL',
        message: 'Email already exists'
      };
    }
    
    // Step 3: 创建 Account 实体
    const account = AccountEntity.forCreate({
      username: data.username,
      email: data.email,
      profile: {
        displayName: data.displayName,
        timezone: data.timezone || 'UTC',
        language: data.language || 'en'
      }
    });
    
    // Step 4: 保存到数据库
    await this.accountRepo.save(account);
    
    // Step 5: 发布领域事件 ⭐️
    const event = new AccountCreatedEvent({
      accountUuid: account.uuid,
      username: account.username,
      email: account.email,
      password: data.password, // 传递明文密码给 Authentication 模块
      createdAt: account.createdAt
    });
    
    await this.eventBus.publish(event);
    
    console.log('[Account] AccountCreatedEvent published:', {
      accountUuid: account.uuid,
      email: account.email
    });
    
    return account;
  }
  
  async getAccountByUuid(uuid: string): Promise<AccountEntity | null> {
    return this.accountRepo.findByUuid(uuid);
  }
  
  async updateAccount(
    uuid: string,
    data: Partial<{
      profile: Partial<AccountEntity['profile']>;
      timezone: string;
      language: string;
    }>
  ): Promise<AccountEntity> {
    const account = await this.accountRepo.findByUuid(uuid);
    if (!account) {
      throw { code: 'NOT_FOUND', message: 'Account not found' };
    }
    
    // 更新 profile
    if (data.profile) {
      account.updateProfile(data.profile);
    }
    
    await this.accountRepo.save(account);
    
    return account;
  }
  
  async deleteAccount(uuid: string): Promise<void> {
    const account = await this.accountRepo.findByUuid(uuid);
    if (!account) {
      throw { code: 'NOT_FOUND', message: 'Account not found' };
    }
    
    // 软删除
    account.softDelete();
    await this.accountRepo.save(account);
    
    // 发布账户删除事件
    const event = new AccountDeletedEvent({
      accountUuid: account.uuid,
      deletedAt: Date.now()
    });
    
    await this.eventBus.publish(event);
  }
}
```

---

### 1.8 Backend: Account Repository

```typescript
// File: apps/api/src/modules/account/repositories/AccountRepository.ts
import { AccountEntity } from '@daily-use/domain-server';
import { prisma } from '@/database/prisma';
import type { AccountPersistence } from '@daily-use/contracts';

export class AccountRepository {
  async save(account: AccountEntity): Promise<void> {
    const persistence = account.toPersistenceDTO();
    
    await prisma.account.upsert({
      where: { uuid: persistence.uuid },
      create: {
        uuid: persistence.uuid,
        username: persistence.username,
        email: persistence.email,
        email_verified: persistence.email_verified,
        phone_number: persistence.phone_number,
        phone_verified: persistence.phone_verified,
        status: persistence.status,
        profile: persistence.profile, // JSON field
        storage: persistence.storage, // JSON field
        security: persistence.security, // JSON field
        history: persistence.history, // JSON field
        stats: persistence.stats, // JSON field
        created_at: persistence.created_at,
        updated_at: persistence.updated_at,
        last_active_at: persistence.last_active_at,
        deleted_at: persistence.deleted_at
      },
      update: {
        username: persistence.username,
        email: persistence.email,
        email_verified: persistence.email_verified,
        phone_number: persistence.phone_number,
        phone_verified: persistence.phone_verified,
        status: persistence.status,
        profile: persistence.profile,
        storage: persistence.storage,
        security: persistence.security,
        history: persistence.history,
        stats: persistence.stats,
        updated_at: persistence.updated_at,
        last_active_at: persistence.last_active_at,
        deleted_at: persistence.deleted_at
      }
    });
  }
  
  async findByUuid(uuid: string): Promise<AccountEntity | null> {
    const record = await prisma.account.findUnique({
      where: { uuid }
    });
    
    if (!record) return null;
    
    return AccountEntity.fromPersistenceDTO(record as AccountPersistence);
  }
  
  async findByUsername(username: string): Promise<AccountEntity | null> {
    const record = await prisma.account.findUnique({
      where: { username }
    });
    
    if (!record) return null;
    
    return AccountEntity.fromPersistenceDTO(record as AccountPersistence);
  }
  
  async findByEmail(email: string): Promise<AccountEntity | null> {
    const record = await prisma.account.findUnique({
      where: { email }
    });
    
    if (!record) return null;
    
    return AccountEntity.fromPersistenceDTO(record as AccountPersistence);
  }
  
  async delete(uuid: string): Promise<void> {
    await prisma.account.delete({
      where: { uuid }
    });
  }
}
```

---

### 1.9 Backend: Domain Event - AccountCreatedEvent

```typescript
// File: apps/api/src/modules/account/events/AccountCreatedEvent.ts
import { DomainEvent } from '@/shared/eventBus/DomainEvent';

export interface AccountCreatedEventPayload {
  accountUuid: string;
  username: string;
  email: string;
  password: string; // 明文密码，仅在事件中传递
  createdAt: number; // epoch ms
}

export class AccountCreatedEvent extends DomainEvent<AccountCreatedEventPayload> {
  constructor(payload: AccountCreatedEventPayload) {
    super('account.created', payload);
  }
}
```

---

### 1.10 Backend: Event Bus (事件总线)

```typescript
// File: apps/api/src/shared/eventBus/EventBus.ts
import { DomainEvent } from './DomainEvent';
import { EventHandler } from './EventHandler';

export class EventBus {
  private static instance: EventBus;
  private handlers: Map<string, EventHandler<any>[]> = new Map();
  
  private constructor() {}
  
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }
  
  /**
   * 订阅事件
   */
  subscribe<T>(eventName: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventName) || [];
    handlers.push(handler);
    this.handlers.set(eventName, handlers);
    
    console.log(`[EventBus] Handler subscribed to event: ${eventName}`);
  }
  
  /**
   * 发布事件 (异步执行所有处理器)
   */
  async publish<T>(event: DomainEvent<T>): Promise<void> {
    const handlers = this.handlers.get(event.eventName) || [];
    
    console.log(`[EventBus] Publishing event: ${event.eventName}`, {
      eventId: event.eventId,
      handlerCount: handlers.length
    });
    
    // 并发执行所有处理器
    const promises = handlers.map(handler => 
      handler.handle(event).catch(error => {
        console.error(
          `[EventBus] Handler failed for event ${event.eventName}:`,
          error
        );
        // 不阻塞其他处理器
      })
    );
    
    await Promise.all(promises);
  }
  
  /**
   * 取消订阅
   */
  unsubscribe<T>(eventName: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventName) || [];
    const index = handlers.indexOf(handler);
    
    if (index > -1) {
      handlers.splice(index, 1);
      this.handlers.set(eventName, handlers);
    }
  }
}
```

```typescript
// File: apps/api/src/shared/eventBus/DomainEvent.ts
import { v4 as uuidv4 } from 'uuid';

export abstract class DomainEvent<T> {
  readonly eventId: string;
  readonly eventName: string;
  readonly payload: T;
  readonly occurredAt: number; // epoch ms
  
  constructor(eventName: string, payload: T) {
    this.eventId = uuidv4();
    this.eventName = eventName;
    this.payload = payload;
    this.occurredAt = Date.now();
  }
}
```

```typescript
// File: apps/api/src/shared/eventBus/EventHandler.ts
import { DomainEvent } from './DomainEvent';

export interface EventHandler<T> {
  handle(event: DomainEvent<T>): Promise<void>;
}
```

---

### 1.11 Backend: Authentication Event Handler

```typescript
// File: apps/api/src/modules/authentication/eventHandlers/AccountCreatedEventHandler.ts
import { EventHandler } from '@/shared/eventBus/EventHandler';
import { AccountCreatedEvent } from '@/modules/account/events/AccountCreatedEvent';
import { AuthCredentialApplicationService } from '../services/AuthCredentialApplicationService';

export class AccountCreatedEventHandler 
  implements EventHandler<AccountCreatedEvent['payload']> {
  
  private authCredentialService: AuthCredentialApplicationService;
  
  constructor() {
    this.authCredentialService = new AuthCredentialApplicationService();
  }
  
  async handle(event: AccountCreatedEvent): Promise<void> {
    console.log('[Authentication] Handling AccountCreatedEvent:', {
      accountUuid: event.payload.accountUuid,
      email: event.payload.email
    });
    
    try {
      // 为新账户创建认证凭证
      await this.authCredentialService.createCredentialForAccount({
        accountUuid: event.payload.accountUuid,
        password: event.payload.password
      });
      
      console.log('[Authentication] AuthCredential created successfully');
    } catch (error) {
      console.error('[Authentication] Failed to create AuthCredential:', error);
      throw error;
    }
  }
}
```

---

### 1.12 Backend: Auth Credential Application Service

```typescript
// File: apps/api/src/modules/authentication/services/AuthCredentialApplicationService.ts
import { AuthCredentialEntity } from '@daily-use/domain-server';
import { AuthCredentialRepository } from '../repositories/AuthCredentialRepository';
import { AuthCredentialDomainService } from '../domain/AuthCredentialDomainService';

export class AuthCredentialApplicationService {
  private credentialRepo: AuthCredentialRepository;
  private credentialDomainService: AuthCredentialDomainService;
  
  constructor() {
    this.credentialRepo = new AuthCredentialRepository();
    this.credentialDomainService = new AuthCredentialDomainService();
  }
  
  /**
   * 为新账户创建认证凭证 (由事件处理器调用)
   */
  async createCredentialForAccount(data: {
    accountUuid: string;
    password: string;
  }): Promise<AuthCredentialEntity> {
    // Step 1: Hash 密码
    const hashedPassword = await this.credentialDomainService.hashPassword(
      data.password
    );
    
    // Step 2: 创建 AuthCredential 实体
    const credential = AuthCredentialEntity.forCreate({
      accountUuid: data.accountUuid,
      type: 'PASSWORD',
      hashedPassword
    });
    
    // Step 3: 保存到数据库
    await this.credentialRepo.save(credential);
    
    console.log('[AuthCredential] Credential created:', {
      uuid: credential.uuid,
      accountUuid: credential.accountUuid
    });
    
    return credential;
  }
  
  async setPassword(accountUuid: string, plainPassword: string): Promise<void> {
    const credential = await this.credentialRepo.findByAccountUuid(accountUuid);
    if (!credential) {
      throw { code: 'NOT_FOUND', message: 'Credential not found' };
    }
    
    const hashedPassword = await this.credentialDomainService.hashPassword(
      plainPassword
    );
    
    credential.setPassword(hashedPassword);
    await this.credentialRepo.save(credential);
  }
}
```

---

### 1.13 Backend: Event Registration

```typescript
// File: apps/api/src/shared/eventBus/registerEventHandlers.ts
import { EventBus } from './EventBus';
import { AccountCreatedEventHandler } from '@/modules/authentication/eventHandlers/AccountCreatedEventHandler';

/**
 * 注册所有事件处理器
 */
export function registerEventHandlers(): void {
  const eventBus = EventBus.getInstance();
  
  // Account 模块事件
  eventBus.subscribe(
    'account.created',
    new AccountCreatedEventHandler()
  );
  
  // 可以添加更多事件处理器
  // eventBus.subscribe('account.updated', new AccountUpdatedEventHandler());
  // eventBus.subscribe('account.deleted', new AccountDeletedEventHandler());
  
  console.log('[EventBus] All event handlers registered');
}
```

```typescript
// File: apps/api/src/main.ts
import express from 'express';
import { registerEventHandlers } from './shared/eventBus/registerEventHandlers';
import accountRoutes from './modules/account/routes/accountRoutes';
import authRoutes from './modules/authentication/routes/authRoutes';

const app = express();

// 注册事件处理器 ⭐️
registerEventHandlers();

// 注册路由
app.use('/api/accounts', accountRoutes);
app.use('/api/auth', authRoutes);

app.listen(3000, () => {
  console.log('API Server running on port 3000');
});
```

---

### 1.14 完整流程图

```
┌─────────────────────────────────────────────────────────────────┐
│ Frontend: User fills registration form                          │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ POST /api/accounts                                              │
│ { username, email, password, displayName }                      │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ AccountController.createAccount()                               │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ AccountApplicationService.createAccount()                       │
│  1. Check username/email uniqueness                             │
│  2. Create AccountEntity                                        │
│  3. Save to database (AccountRepository)                        │
│  4. Publish AccountCreatedEvent ⭐️                              │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ EventBus.publish('account.created')                             │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│ AccountCreatedEventHandler.handle()  (Authentication Module)    │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ AuthCredentialApplicationService.createCredentialForAccount()   │
│  1. Hash password                                               │
│  2. Create AuthCredentialEntity                                 │
│  3. Save to database (AuthCredentialRepository)                 │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ Return Account (ClientDTO) to frontend                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 场景 2: 用户登录 (Login)

### 业务流程概述

1. **Frontend**: 用户输入邮箱/用户名和密码
2. **Authentication 模块**: 验证凭证
3. **Authentication 模块**: 创建 Session + RememberMeToken (可选)
4. **Account 模块**: 更新登录统计
5. **Frontend**: 存储 tokens，跳转到 Dashboard

---

### 2.1 Backend: Auth Route

```typescript
// File: apps/api/src/modules/authentication/routes/authRoutes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '@/middleware/authenticate';

const router = Router();
const authController = new AuthController();

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/logout
router.post('/logout', authenticate, authController.logout);

// POST /api/auth/refresh
router.post('/refresh', authController.refreshToken);

// GET /api/auth/session
router.get('/session', authenticate, authController.getCurrentSession);

// GET /api/auth/sessions
router.get('/sessions', authenticate, authController.getActiveSessions);

export default router;
```

---

### 2.2 Backend: Auth Controller

```typescript
// File: apps/api/src/modules/authentication/controllers/AuthController.ts
import { Request, Response } from 'express';
import { AuthSessionApplicationService } from '../services/AuthSessionApplicationService';
import { DeviceFingerprintService } from '../domain/DeviceFingerprintService';
import type { LoginRequest } from '@daily-use/contracts';

export class AuthController {
  private authSessionService: AuthSessionApplicationService;
  private deviceFingerprintService: DeviceFingerprintService;
  
  constructor() {
    this.authSessionService = new AuthSessionApplicationService();
    this.deviceFingerprintService = new DeviceFingerprintService();
  }
  
  login = async (req: Request, res: Response) => {
    try {
      const data: LoginRequest = req.body;
      const userAgent = req.headers['user-agent'] || '';
      const ipAddress = req.ip || req.connection.remoteAddress || '';
      
      // 生成设备信息
      const deviceInfo = this.deviceFingerprintService.extractDeviceInfo(
        userAgent
      );
      const location = await this.deviceFingerprintService.lookupLocation(
        ipAddress
      );
      
      // 调用 Application Service
      const result = await this.authSessionService.login({
        identifier: data.identifier, // email or username
        password: data.password,
        rememberMe: data.rememberMe || false,
        rememberMeDays: data.rememberMeDays || 30,
        deviceInfo: {
          ...deviceInfo,
          ipAddress,
          userAgent,
          location
        }
      });
      
      // 返回 session + rememberMeToken (可选)
      res.json({
        session: result.session.toClientDTO(),
        rememberMeToken: result.rememberMeToken
      });
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.code === 'INVALID_CREDENTIALS') {
        return res.status(401).json({
          error: 'Invalid email/username or password'
        });
      }
      
      if (error.code === 'ACCOUNT_LOCKED') {
        return res.status(423).json({
          error: 'Account is locked',
          lockedUntil: error.lockedUntil
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  logout = async (req: Request, res: Response) => {
    try {
      const sessionUuid = req.user.sessionUuid;
      
      await this.authSessionService.logout(sessionUuid);
      
      res.status(204).send();
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  refreshToken = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      
      const result = await this.authSessionService.refreshAccessToken(
        refreshToken
      );
      
      res.json(result);
    } catch (error: any) {
      if (error.code === 'INVALID_TOKEN') {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  getCurrentSession = async (req: Request, res: Response) => {
    try {
      const session = await this.authSessionService.getSessionById(
        req.user.sessionUuid
      );
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      res.json(session.toClientDTO());
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  getActiveSessions = async (req: Request, res: Response) => {
    try {
      const sessions = await this.authSessionService.getActiveSessions(
        req.user.accountUuid
      );
      
      res.json(sessions.map(s => s.toClientDTO()));
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
```

---

### 2.3 Backend: Auth Session Application Service

```typescript
// File: apps/api/src/modules/authentication/services/AuthSessionApplicationService.ts
import { AuthSessionEntity, DeviceInfoValue } from '@daily-use/domain-server';
import { AuthSessionRepository } from '../repositories/AuthSessionRepository';
import { AuthCredentialRepository } from '../repositories/AuthCredentialRepository';
import { AccountRepository } from '@/modules/account/repositories/AccountRepository';
import { AuthSessionDomainService } from '../domain/AuthSessionDomainService';
import { AuthCredentialDomainService } from '../domain/AuthCredentialDomainService';
import { EventBus } from '@/shared/eventBus/EventBus';
import { UserLoggedInEvent } from '../events/UserLoggedInEvent';

export class AuthSessionApplicationService {
  private sessionRepo: AuthSessionRepository;
  private credentialRepo: AuthCredentialRepository;
  private accountRepo: AccountRepository;
  private sessionDomainService: AuthSessionDomainService;
  private credentialDomainService: AuthCredentialDomainService;
  private eventBus: EventBus;
  
  constructor() {
    this.sessionRepo = new AuthSessionRepository();
    this.credentialRepo = new AuthCredentialRepository();
    this.accountRepo = new AccountRepository();
    this.sessionDomainService = new AuthSessionDomainService();
    this.credentialDomainService = new AuthCredentialDomainService();
    this.eventBus = EventBus.getInstance();
  }
  
  async login(data: {
    identifier: string; // email or username
    password: string;
    rememberMe: boolean;
    rememberMeDays?: number;
    deviceInfo: {
      deviceType: 'BROWSER' | 'DESKTOP' | 'MOBILE' | 'TABLET' | 'API';
      os?: string;
      browser?: string;
      ipAddress: string;
      userAgent: string;
      location?: {
        country?: string;
        region?: string;
        city?: string;
        timezone?: string;
      };
    };
  }): Promise<{
    session: AuthSessionEntity;
    rememberMeToken?: string;
  }> {
    // Step 1: 查找账户 (通过邮箱或用户名)
    let account = await this.accountRepo.findByEmail(data.identifier);
    if (!account) {
      account = await this.accountRepo.findByUsername(data.identifier);
    }
    
    if (!account) {
      throw { code: 'INVALID_CREDENTIALS' };
    }
    
    // Step 2: 查找认证凭证
    const credential = await this.credentialRepo.findByAccountUuid(
      account.uuid
    );
    if (!credential) {
      throw { code: 'INVALID_CREDENTIALS' };
    }
    
    // Step 3: 检查账户是否锁定
    if (credential.isLocked()) {
      throw {
        code: 'ACCOUNT_LOCKED',
        lockedUntil: credential.security.lockedUntil
      };
    }
    
    // Step 4: 验证密码
    const passwordValid = await this.credentialDomainService.verifyPassword(
      data.password,
      credential.passwordCredential!.hashedPassword
    );
    
    if (!passwordValid) {
      // 记录失败尝试
      credential.recordFailedLogin();
      await this.credentialRepo.save(credential);
      
      throw { code: 'INVALID_CREDENTIALS' };
    }
    
    // Step 5: 重置失败尝试
    credential.resetFailedAttempts();
    await this.credentialRepo.save(credential);
    
    // Step 6: 创建设备信息值对象
    const device = DeviceInfoValue.create(data.deviceInfo);
    
    // Step 7: 创建 Session
    const session = await this.sessionDomainService.createSession(
      account.uuid,
      device,
      data.deviceInfo.ipAddress,
      data.deviceInfo.location
    );
    
    await this.sessionRepo.save(session);
    
    // Step 8: 创建 RememberMeToken (可选)
    let rememberMeToken: string | undefined;
    if (data.rememberMe) {
      const result = await this.credentialDomainService.generateRememberMeToken(
        credential,
        device,
        data.rememberMeDays || 30
      );
      
      rememberMeToken = result.plainToken;
      
      // 保存 credential (包含新的 rememberMeToken)
      await this.credentialRepo.save(credential);
    }
    
    // Step 9: 发布登录事件 ⭐️
    const event = new UserLoggedInEvent({
      accountUuid: account.uuid,
      sessionUuid: session.uuid,
      deviceType: device.deviceType,
      ipAddress: data.deviceInfo.ipAddress,
      loggedInAt: Date.now()
    });
    
    await this.eventBus.publish(event);
    
    return {
      session,
      rememberMeToken
    };
  }
  
  async logout(sessionUuid: string): Promise<void> {
    const session = await this.sessionRepo.findByUuid(sessionUuid);
    if (!session) return;
    
    session.revoke();
    await this.sessionRepo.save(session);
  }
  
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    accessTokenExpiresAt: number;
  }> {
    const session = await this.sessionRepo.findByRefreshToken(refreshToken);
    if (!session) {
      throw { code: 'INVALID_TOKEN' };
    }
    
    if (!session.isValid() || session.isRefreshTokenExpired()) {
      throw { code: 'INVALID_TOKEN' };
    }
    
    // 生成新的 access token
    const newAccessToken = await this.sessionDomainService.generateAccessToken(
      session.accountUuid,
      15 // 15 minutes
    );
    
    session.refreshAccessToken(newAccessToken, 15);
    await this.sessionRepo.save(session);
    
    return {
      accessToken: newAccessToken,
      accessTokenExpiresAt: session.accessTokenExpiresAt
    };
  }
  
  async getSessionById(uuid: string): Promise<AuthSessionEntity | null> {
    return this.sessionRepo.findByUuid(uuid);
  }
  
  async getActiveSessions(accountUuid: string): Promise<AuthSessionEntity[]> {
    return this.sessionRepo.findActiveSessionsByAccount(accountUuid);
  }
}
```

---

### 2.4 Backend: User Logged In Event

```typescript
// File: apps/api/src/modules/authentication/events/UserLoggedInEvent.ts
import { DomainEvent } from '@/shared/eventBus/DomainEvent';

export interface UserLoggedInEventPayload {
  accountUuid: string;
  sessionUuid: string;
  deviceType: 'BROWSER' | 'DESKTOP' | 'MOBILE' | 'TABLET' | 'API';
  ipAddress: string;
  loggedInAt: number; // epoch ms
}

export class UserLoggedInEvent extends DomainEvent<UserLoggedInEventPayload> {
  constructor(payload: UserLoggedInEventPayload) {
    super('user.loggedIn', payload);
  }
}
```

---

### 2.5 Backend: Account Event Handler for Login

```typescript
// File: apps/api/src/modules/account/eventHandlers/UserLoggedInEventHandler.ts
import { EventHandler } from '@/shared/eventBus/EventHandler';
import { UserLoggedInEvent } from '@/modules/authentication/events/UserLoggedInEvent';
import { AccountApplicationService } from '../services/AccountApplicationService';

export class UserLoggedInEventHandler 
  implements EventHandler<UserLoggedInEvent['payload']> {
  
  private accountService: AccountApplicationService;
  
  constructor() {
    this.accountService = new AccountApplicationService();
  }
  
  async handle(event: UserLoggedInEvent): Promise<void> {
    console.log('[Account] Handling UserLoggedInEvent:', {
      accountUuid: event.payload.accountUuid
    });
    
    try {
      // 更新账户的登录统计
      await this.accountService.recordLogin(event.payload.accountUuid);
      
      console.log('[Account] Login stats updated successfully');
    } catch (error) {
      console.error('[Account] Failed to update login stats:', error);
      // 不抛出错误，避免影响登录流程
    }
  }
}
```

```typescript
// File: apps/api/src/modules/account/services/AccountApplicationService.ts (新增方法)
export class AccountApplicationService {
  // ... 前面的代码 ...
  
  async recordLogin(accountUuid: string): Promise<void> {
    const account = await this.accountRepo.findByUuid(accountUuid);
    if (!account) return;
    
    // 调用 Account 实体的 recordLogin 方法
    account.recordLogin();
    
    await this.accountRepo.save(account);
  }
}
```

---

### 2.6 完整登录流程图

```
┌─────────────────────────────────────────────────────────────────┐
│ Frontend: User enters email/username and password              │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ POST /api/auth/login                                            │
│ { identifier, password, rememberMe }                            │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ AuthController.login()                                          │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ AuthSessionApplicationService.login()                           │
│  1. Find Account by email/username                              │
│  2. Find AuthCredential                                         │
│  3. Check if account is locked                                  │
│  4. Verify password                                             │
│  5. Reset failed attempts                                       │
│  6. Create DeviceInfo                                           │
│  7. Create AuthSession                                          │
│  8. Create RememberMeToken (if rememberMe=true)                 │
│  9. Publish UserLoggedInEvent ⭐️                                │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ EventBus.publish('user.loggedIn')                               │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│ UserLoggedInEventHandler.handle()  (Account Module)             │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ AccountApplicationService.recordLogin()                         │
│  1. Load Account entity                                         │
│  2. Call account.recordLogin()                                  │
│     - Increment loginCount                                      │
│     - Update lastLoginAt                                        │
│  3. Save Account                                                │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ Return { session, rememberMeToken } to frontend                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 场景 3: 修改密码 (Change Password)

### 业务流程概述

1. **Frontend**: 用户输入旧密码和新密码
2. **Authentication 模块**: 验证旧密码并更新
3. **Event Bus**: 发布 `PasswordChangedEvent`
4. **Account 模块**: 更新安全信息
5. **Authentication 模块**: 吊销所有 RememberMeToken
6. **Frontend**: 提示密码修改成功

---

### 3.1 Backend: Password Changed Event

```typescript
// File: apps/api/src/modules/authentication/events/PasswordChangedEvent.ts
import { DomainEvent } from '@/shared/eventBus/DomainEvent';

export interface PasswordChangedEventPayload {
  accountUuid: string;
  credentialUuid: string;
  changedAt: number; // epoch ms
  revokeAllSessions: boolean; // 是否吊销所有会话
}

export class PasswordChangedEvent extends DomainEvent<PasswordChangedEventPayload> {
  constructor(payload: PasswordChangedEventPayload) {
    super('password.changed', payload);
  }
}
```

---

### 3.2 Backend: Auth Credential Application Service (修改密码)

```typescript
// File: apps/api/src/modules/authentication/services/AuthCredentialApplicationService.ts (新增方法)
export class AuthCredentialApplicationService {
  // ... 前面的代码 ...
  
  async changePassword(data: {
    accountUuid: string;
    oldPassword: string;
    newPassword: string;
  }): Promise<void> {
    // Step 1: 查找凭证
    const credential = await this.credentialRepo.findByAccountUuid(
      data.accountUuid
    );
    if (!credential) {
      throw { code: 'NOT_FOUND' };
    }
    
    // Step 2: 验证旧密码
    const oldPasswordValid = await this.credentialDomainService.verifyPassword(
      data.oldPassword,
      credential.passwordCredential!.hashedPassword
    );
    
    if (!oldPasswordValid) {
      throw { code: 'INVALID_OLD_PASSWORD' };
    }
    
    // Step 3: Hash 新密码
    const newHashedPassword = await this.credentialDomainService.hashPassword(
      data.newPassword
    );
    
    // Step 4: 更新密码
    credential.setPassword(newHashedPassword);
    
    // Step 5: 吊销所有 Remember-Me Tokens
    credential.revokeAllRememberMeTokens();
    
    // Step 6: 保存
    await this.credentialRepo.save(credential);
    
    // Step 7: 发布密码修改事件 ⭐️
    const event = new PasswordChangedEvent({
      accountUuid: data.accountUuid,
      credentialUuid: credential.uuid,
      changedAt: Date.now(),
      revokeAllSessions: false // 不吊销当前会话，只吊销其他会话
    });
    
    await this.eventBus.publish(event);
  }
}
```

---

### 3.3 Backend: Account Event Handler for Password Change

```typescript
// File: apps/api/src/modules/account/eventHandlers/PasswordChangedEventHandler.ts
import { EventHandler } from '@/shared/eventBus/EventHandler';
import { PasswordChangedEvent } from '@/modules/authentication/events/PasswordChangedEvent';
import { AccountRepository } from '../repositories/AccountRepository';

export class PasswordChangedEventHandler 
  implements EventHandler<PasswordChangedEvent['payload']> {
  
  private accountRepo: AccountRepository;
  
  constructor() {
    this.accountRepo = new AccountRepository();
  }
  
  async handle(event: PasswordChangedEvent): Promise<void> {
    console.log('[Account] Handling PasswordChangedEvent:', {
      accountUuid: event.payload.accountUuid
    });
    
    try {
      const account = await this.accountRepo.findByUuid(
        event.payload.accountUuid
      );
      if (!account) return;
      
      // 更新安全信息中的 lastPasswordChange
      account.changePassword(); // 调用 Account 实体方法
      
      await this.accountRepo.save(account);
      
      console.log('[Account] Password change timestamp updated');
    } catch (error) {
      console.error('[Account] Failed to update password change:', error);
    }
  }
}
```

---

## 场景 4: 删除账户 (Delete Account)

### 业务流程概述

1. **Frontend**: 用户点击删除账户
2. **Account 模块**: 软删除账户
3. **Event Bus**: 发布 `AccountDeletedEvent`
4. **Authentication 模块**: 吊销所有凭证和会话
5. **其他模块**: 清理用户数据 (Task, Reminder, Goal, etc.)

---

### 4.1 Backend: Account Deleted Event

```typescript
// File: apps/api/src/modules/account/events/AccountDeletedEvent.ts
import { DomainEvent } from '@/shared/eventBus/DomainEvent';

export interface AccountDeletedEventPayload {
  accountUuid: string;
  deletedAt: number; // epoch ms
}

export class AccountDeletedEvent extends DomainEvent<AccountDeletedEventPayload> {
  constructor(payload: AccountDeletedEventPayload) {
    super('account.deleted', payload);
  }
}
```

---

### 4.2 Backend: Authentication Event Handler for Account Deletion

```typescript
// File: apps/api/src/modules/authentication/eventHandlers/AccountDeletedEventHandler.ts
import { EventHandler } from '@/shared/eventBus/EventHandler';
import { AccountDeletedEvent } from '@/modules/account/events/AccountDeletedEvent';
import { AuthCredentialRepository } from '../repositories/AuthCredentialRepository';
import { AuthSessionRepository } from '../repositories/AuthSessionRepository';

export class AccountDeletedEventHandler 
  implements EventHandler<AccountDeletedEvent['payload']> {
  
  private credentialRepo: AuthCredentialRepository;
  private sessionRepo: AuthSessionRepository;
  
  constructor() {
    this.credentialRepo = new AuthCredentialRepository();
    this.sessionRepo = new AuthSessionRepository();
  }
  
  async handle(event: AccountDeletedEvent): Promise<void> {
    console.log('[Authentication] Handling AccountDeletedEvent:', {
      accountUuid: event.payload.accountUuid
    });
    
    try {
      // Step 1: 吊销所有凭证
      const credential = await this.credentialRepo.findByAccountUuid(
        event.payload.accountUuid
      );
      
      if (credential) {
        credential.revoke();
        await this.credentialRepo.save(credential);
      }
      
      // Step 2: 吊销所有会话
      await this.sessionRepo.revokeAllSessions(event.payload.accountUuid);
      
      console.log('[Authentication] All credentials and sessions revoked');
    } catch (error) {
      console.error('[Authentication] Failed to revoke credentials:', error);
    }
  }
}
```

---

## 事件总线完整注册

```typescript
// File: apps/api/src/shared/eventBus/registerEventHandlers.ts
import { EventBus } from './EventBus';

// Account 事件处理器
import { AccountCreatedEventHandler } from '@/modules/authentication/eventHandlers/AccountCreatedEventHandler';
import { UserLoggedInEventHandler } from '@/modules/account/eventHandlers/UserLoggedInEventHandler';
import { PasswordChangedEventHandler } from '@/modules/account/eventHandlers/PasswordChangedEventHandler';
import { AccountDeletedEventHandler } from '@/modules/authentication/eventHandlers/AccountDeletedEventHandler';

export function registerEventHandlers(): void {
  const eventBus = EventBus.getInstance();
  
  // Account 创建 -> 创建认证凭证
  eventBus.subscribe(
    'account.created',
    new AccountCreatedEventHandler()
  );
  
  // 用户登录 -> 更新登录统计
  eventBus.subscribe(
    'user.loggedIn',
    new UserLoggedInEventHandler()
  );
  
  // 密码修改 -> 更新安全信息
  eventBus.subscribe(
    'password.changed',
    new PasswordChangedEventHandler()
  );
  
  // 账户删除 -> 吊销凭证和会话
  eventBus.subscribe(
    'account.deleted',
    new AccountDeletedEventHandler()
  );
  
  console.log('[EventBus] All event handlers registered');
}
```

---

## 总结

### 事件驱动架构优势

1. **解耦**: Account 和 Authentication 模块通过事件通信，互不依赖
2. **异步**: 事件处理异步执行，不阻塞主流程
3. **扩展性**: 新增模块只需订阅事件，无需修改现有代码
4. **可靠性**: 事件处理失败不影响主流程

### 核心事件流

| 事件 | 发布者 | 订阅者 | 作用 |
|------|--------|--------|------|
| `account.created` | Account | Authentication | 创建认证凭证 |
| `user.loggedIn` | Authentication | Account | 更新登录统计 |
| `password.changed` | Authentication | Account | 更新安全信息 |
| `account.deleted` | Account | Authentication | 吊销凭证和会话 |

### 技术栈

- **Frontend**: Vue 3 + Composables + TypeScript
- **Backend**: Express + DDD + Event Bus
- **Database**: Prisma + PostgreSQL
- **Authentication**: JWT + Remember-Me Token

---

**文档完成** ✅
