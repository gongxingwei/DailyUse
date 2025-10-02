# Node.js 后端 API 测试搭建完整指南

## 📋 搭建背景

在现代软件开发中，API 测试是确保后端服务质量的关键环节。一套完善的集成测试框架能够：

- **保障 API 质量**：验证接口的正确性和稳定性
- **提升开发效率**：快速发现和定位问题
- **支持重构**：为代码重构提供安全保障
- **文档化接口**：测试用例本身就是活文档

### 技术栈选择

- **Node.js**: 后端运行时环境
- **Express**: Web 应用框架
- **Vitest**: 现代化测试框架（比 Jest 更快）
- **Supertest**: HTTP 断言库，专为 Express 应用设计
- **TypeScript**: 类型安全保障

## 🏗️ 搭建方案

### 1. 项目结构设计

```
src/
├── test/
│   ├── setup.ts                    # 测试环境配置
│   ├── globalSetup.ts             # 全局测试设置
│   ├── API_TESTING_GUIDE.md       # 测试指南文档
│   ├── mocks/
│   │   └── prismaMock.ts          # 数据库 Mock
│   ├── templates/
│   │   └── comprehensive-api.test.template.ts  # 测试模板
│   └── integration/               # 集成测试
├── modules/
│   └── {module}/
│       └── interface/
│           └── http/
│               └── {module}.integration.test.ts
├── app.ts                         # Express 应用
└── index.ts                       # 入口文件
```

### 2. 核心配置文件

#### vitest.config.ts
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // 设置模块别名，简化导入路径
    },
  },
  test: {
    globals: true,                    // 全局 describe、it、expect
    environment: 'node',              // Node.js 环境
    setupFiles: ['./src/test/setup.ts'], // 测试设置文件
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', 'prisma/**/*'],
    coverage: {
      provider: 'v8',                // 高性能覆盖率提供者
      reporter: ['text', 'json', 'html'],
      thresholds: {                  // 覆盖率要求
        global: {
          branches: 75,
          functions: 90,
          lines: 80,
          statements: 80
        }
      }
    },
    testTimeout: 30000,              // API 测试超时设置
    pool: 'forks',                   // 进程隔离
    poolOptions: {
      forks: {
        singleFork: true             // 避免数据库冲突
      }
    }
  }
});
```

#### package.json 测试脚本
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch",
    "test:ui": "vitest --ui",
    "test:integration": "vitest run --grep integration"
  }
}
```

### 3. 测试环境配置

#### src/test/setup.ts
```typescript
import { beforeEach, afterEach, vi } from 'vitest';
import { mockPrismaClient, resetMockData } from './mocks/prismaMock.js';

// Mock 数据库
vi.mock('../config/prisma.js', () => ({
  prisma: mockPrismaClient,
  connectPrisma: vi.fn(),
  disconnectPrisma: vi.fn(),
}));

beforeEach(async () => {
  // 重置所有模拟函数
  vi.clearAllMocks();
  
  // 设置测试环境变量
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  
  // 重置 Mock 数据
  resetMockData();
  
  // 设置统一时区
  process.env.TZ = 'UTC';
  
  // 模拟时间（可选）
  vi.useFakeTimers({
    shouldAdvanceTime: true,
    toFake: ['Date'],
  });
});

afterEach(async () => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
```

### 4. 数据库 Mock 方案

#### src/test/mocks/prismaMock.ts
```typescript
import { vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';

// Mock 数据存储
const mockDataStore = {
  user: new Map(),
  post: new Map(),
  comment: new Map(),
  // 添加你的模型...
};

// 创建 Mock 模型操作
function createMockModel(tableName: keyof typeof mockDataStore) {
  const store = mockDataStore[tableName];
  
  return {
    findMany: vi.fn(async (args?: any) => {
      const allRecords = Array.from(store.values());
      
      // 处理 where 条件
      if (args?.where) {
        return allRecords.filter(record => {
          return Object.entries(args.where).every(([key, value]) => {
            return record[key] === value;
          });
        });
      }
      
      return allRecords;
    }),
    
    findUnique: vi.fn(async (args: any) => {
      const { where } = args;
      const allRecords = Array.from(store.values());
      
      return allRecords.find(record => {
        return Object.entries(where).every(([key, value]) => {
          return record[key] === value;
        });
      }) || null;
    }),
    
    create: vi.fn(async (args: any) => {
      const { data } = args;
      const uuid = data.uuid || generateTestUuid();
      const record = { ...data, uuid, createdAt: new Date(), updatedAt: new Date() };
      store.set(uuid, record);
      return record;
    }),
    
    update: vi.fn(async (args: any) => {
      const { where, data } = args;
      const record = await mockModel.findUnique({ where });
      if (!record) throw new Error('Record not found');
      
      const updated = { ...record, ...data, updatedAt: new Date() };
      store.set(record.uuid, updated);
      return updated;
    }),
    
    delete: vi.fn(async (args: any) => {
      const { where } = args;
      const record = await mockModel.findUnique({ where });
      if (!record) throw new Error('Record not found');
      
      store.delete(record.uuid);
      return record;
    })
  };
}

// Mock Prisma 客户端
export const mockPrismaClient = {
  user: createMockModel('user'),
  post: createMockModel('post'),
  comment: createMockModel('comment'),
  
  // 事务支持
  $transaction: vi.fn(async (operations: any[]) => {
    const results = [];
    for (const operation of operations) {
      results.push(await operation);
    }
    return results;
  }),
  
  $connect: vi.fn(),
  $disconnect: vi.fn(),
} as unknown as PrismaClient;

// 工具函数
export function resetMockData() {
  Object.values(mockDataStore).forEach(store => store.clear());
}

export function setMockData<T>(tableName: keyof typeof mockDataStore, data: T[]) {
  const store = mockDataStore[tableName];
  store.clear();
  
  data.forEach((item: any) => {
    const uuid = item.uuid || generateTestUuid();
    store.set(uuid, { ...item, uuid });
  });
}

function generateTestUuid(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

### 5. 测试助手工具库

#### ApiTestHelpers 核心功能
```typescript
export const ApiTestHelpers = {
  // JWT Token 生成
  createTestToken: async (payload = { userId: 'test-user-123' }) => {
    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'test-secret';
    return jwt.default.sign(payload, secret, { expiresIn: '1h' });
  },
  
  // CRUD 测试助手
  crud: {
    testCreate: async (request, endpoint, authToken, data, expectedStatus = 201) => {
      const response = await request
        .post(endpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .send(data)
        .expect(expectedStatus);
      return response.body;
    },
    
    testRead: async (request, endpoint, authToken, expectedStatus = 200) => {
      const response = await request
        .get(endpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(expectedStatus);
      return response.body;
    },
    
    testUpdate: async (request, endpoint, authToken, data, expectedStatus = 200) => {
      const response = await request
        .put(endpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .send(data)
        .expect(expectedStatus);
      return response.body;
    },
    
    testDelete: async (request, endpoint, authToken, expectedStatus = 200) => {
      const response = await request
        .delete(endpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(expectedStatus);
      return response.body;
    }
  },
  
  // 业务逻辑测试助手
  business: {
    testValidation: async (request, endpoint, authToken, invalidData) => {
      const response = await request
        .post(endpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
      return response.body;
    },
    
    testUnauthorized: async (request, endpoint, method = 'get') => {
      const response = await request[method](endpoint).expect(401);
      return response.body;
    },
    
    testNotFound: async (request, endpoint, authToken, method = 'get') => {
      const response = await request[method](endpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
      return response.body;
    }
  },
  
  // 性能测试助手
  performance: {
    testResponseTime: async (request, endpoint, authToken, maxTime = 1000) => {
      const start = Date.now();
      await request
        .get(endpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(maxTime);
      return duration;
    },
    
    testConcurrency: async (request, endpoint, authToken, concurrency = 10) => {
      const promises = Array(concurrency).fill(null).map(() =>
        request
          .get(endpoint)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
      );
      
      const results = await Promise.all(promises);
      return results;
    }
  }
};
```

## 🎯 实战经验

### 1. 完整测试示例

#### 用户模块集成测试
```typescript
import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import app from '../../../app';
import { ApiTestHelpers } from '../../setup';
import { setMockData, resetMockData } from '../../mocks/prismaMock';

describe('[API集成测试] 用户模块', () => {
  let authToken: string;
  const testUserId = 'test-user-123';

  beforeEach(async () => {
    resetMockData();
    
    // 设置测试用户数据
    setMockData('user', [
      {
        id: testUserId,
        email: 'test@example.com',
        name: '测试用户',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);
    
    authToken = await ApiTestHelpers.createTestToken({ userId: testUserId });
  });

  describe('POST /api/v1/users - 创建用户', () => {
    it('应该成功创建有效用户', async () => {
      const userData = {
        email: 'newuser@example.com',
        name: '新用户',
        password: 'password123'
      };

      const result = await ApiTestHelpers.crud.testCreate(
        request(app),
        '/api/v1/users',
        authToken,
        userData
      );

      expect(result.success).toBe(true);
      expect(result.data.email).toBe(userData.email);
      expect(result.data.password).toBeUndefined(); // 密码不应该返回
    });

    it('应该拒绝无效邮箱格式', async () => {
      const invalidData = {
        email: 'invalid-email',
        name: '测试用户',
        password: 'password123'
      };

      const result = await ApiTestHelpers.business.testValidation(
        request(app),
        '/api/v1/users',
        authToken,
        invalidData
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('应该拒绝重复邮箱', async () => {
      const duplicateData = {
        email: 'test@example.com', // 已存在的邮箱
        name: '重复用户',
        password: 'password123'
      };

      const result = await ApiTestHelpers.business.testBusinessRule(
        request(app),
        '/api/v1/users',
        authToken,
        duplicateData
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Email already exists');
    });
  });

  describe('GET /api/v1/users - 查询用户', () => {
    beforeEach(() => {
      // 准备多个测试用户
      setMockData('user', [
        { id: 'user-1', email: 'user1@test.com', name: '用户1', status: 'active' },
        { id: 'user-2', email: 'user2@test.com', name: '用户2', status: 'active' },
        { id: 'user-3', email: 'user3@test.com', name: '用户3', status: 'inactive' }
      ]);
    });

    it('应该返回用户列表', async () => {
      const result = await ApiTestHelpers.crud.testRead(
        request(app),
        '/api/v1/users',
        authToken
      );

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('应该支持分页查询', async () => {
      const result = await ApiTestHelpers.crud.testRead(
        request(app),
        '/api/v1/users?page=1&limit=2',
        authToken
      );

      expect(result.success).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(2);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
    });

    it('应该支持状态筛选', async () => {
      const result = await ApiTestHelpers.crud.testRead(
        request(app),
        '/api/v1/users?status=active',
        authToken
      );

      expect(result.success).toBe(true);
      result.data.forEach(user => {
        expect(user.status).toBe('active');
      });
    });
  });

  describe('PUT /api/v1/users/:id - 更新用户', () => {
    it('应该成功更新用户信息', async () => {
      const updateData = {
        name: '更新后的名称',
        email: 'updated@example.com'
      };

      const result = await ApiTestHelpers.crud.testUpdate(
        request(app),
        `/api/v1/users/${testUserId}`,
        authToken,
        updateData
      );

      expect(result.success).toBe(true);
      expect(result.data.name).toBe(updateData.name);
      expect(result.data.email).toBe(updateData.email);
    });

    it('应该拒绝更新不存在的用户', async () => {
      const result = await ApiTestHelpers.business.testNotFound(
        request(app),
        '/api/v1/users/non-existent-id',
        authToken,
        'put'
      );

      expect(result.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('DELETE /api/v1/users/:id - 删除用户', () => {
    it('应该成功删除用户', async () => {
      const result = await ApiTestHelpers.crud.testDelete(
        request(app),
        `/api/v1/users/${testUserId}`,
        authToken
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('删除成功');
    });
  });

  describe('权限验证', () => {
    it('未认证请求应该返回 401', async () => {
      const result = await ApiTestHelpers.business.testUnauthorized(
        request(app),
        '/api/v1/users'
      );

      expect(result.code).toBe('UNAUTHORIZED');
    });

    it('无效 token 应该返回 401', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.code).toBe('INVALID_TOKEN');
    });
  });

  describe('性能测试', () => {
    it('用户列表查询应该在 1 秒内完成', async () => {
      const duration = await ApiTestHelpers.performance.testResponseTime(
        request(app),
        '/api/v1/users',
        authToken,
        1000
      );

      console.log(`查询耗时: ${duration}ms`);
    });

    it('应该能处理并发请求', async () => {
      const results = await ApiTestHelpers.performance.testConcurrency(
        request(app),
        '/api/v1/users',
        authToken,
        5
      );

      results.forEach(result => {
        expect(result.body.success).toBe(true);
      });
    });
  });
});
```

### 2. 高级测试模式

#### 测试数据工厂
```typescript
export class TestDataFactory {
  static createUser(overrides: Partial<User> = {}): User {
    return {
      id: generateId(),
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  static createPost(userId: string, overrides: Partial<Post> = {}): Post {
    return {
      id: generateId(),
      title: 'Test Post',
      content: 'Test content',
      userId,
      status: 'published',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }
}

// 使用示例
describe('文章管理', () => {
  it('应该创建文章', async () => {
    const user = TestDataFactory.createUser();
    const post = TestDataFactory.createPost(user.id);
    
    setMockData('user', [user]);
    
    const result = await ApiTestHelpers.crud.testCreate(
      request(app),
      '/api/v1/posts',
      authToken,
      post
    );
    
    expect(result.success).toBe(true);
  });
});
```

#### 测试场景组合
```typescript
describe('复杂业务场景测试', () => {
  it('用户完整生命周期', async () => {
    // 1. 创建用户
    const userData = TestDataFactory.createUser();
    const createResult = await ApiTestHelpers.crud.testCreate(
      request(app),
      '/api/v1/users',
      authToken,
      userData
    );
    
    const userId = createResult.data.id;
    
    // 2. 查询用户
    const readResult = await ApiTestHelpers.crud.testRead(
      request(app),
      `/api/v1/users/${userId}`,
      authToken
    );
    
    expect(readResult.data.email).toBe(userData.email);
    
    // 3. 更新用户
    const updateData = { name: '更新后的名称' };
    const updateResult = await ApiTestHelpers.crud.testUpdate(
      request(app),
      `/api/v1/users/${userId}`,
      authToken,
      updateData
    );
    
    expect(updateResult.data.name).toBe(updateData.name);
    
    // 4. 删除用户
    await ApiTestHelpers.crud.testDelete(
      request(app),
      `/api/v1/users/${userId}`,
      authToken
    );
    
    // 5. 验证删除
    await ApiTestHelpers.business.testNotFound(
      request(app),
      `/api/v1/users/${userId}`,
      authToken
    );
  });
});
```

## 💡 经验总结

### 1. 最佳实践

#### ✅ 推荐做法
- **独立性**: 每个测试用例应该独立，不依赖其他测试
- **清理**: 在 `beforeEach` 和 `afterEach` 中进行数据清理
- **命名**: 使用描述性的测试名称，说明测试的业务场景
- **分层**: 按照功能模块和测试类型组织测试文件
- **覆盖**: 确保核心业务逻辑有足够的测试覆盖率

#### ❌ 避免的坑

- **数据污染**: 测试之间共享数据导致的不稳定
- **过度 Mock**: Mock 过多导致测试脱离实际
- **测试耦合**: 一个测试失败导致多个测试失败
- **硬编码**: 在测试中使用硬编码的时间和 ID
- **忽略异步**: 未正确处理异步操作导致测试不稳定

### 2. 测试分层策略

```
🔺 测试金字塔
┌─────────────────────────────────────┐
│        E2E 测试 (少量)                │  ← 端到端测试
├─────────────────────────────────────┤
│      API 集成测试 (适量)              │  ← 本文重点
├─────────────────────────────────────┤
│      单元测试 (大量)                  │  ← 函数/类测试
└─────────────────────────────────────┘
```

#### 集成测试范围
- **接口层**: 验证 HTTP 请求和响应
- **业务层**: 验证业务逻辑的正确性
- **权限层**: 验证认证和授权机制
- **数据层**: 验证数据的完整性和一致性

### 3. 性能优化技巧

#### 测试执行优化
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    // 并行执行测试
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1
      }
    },
    
    // 测试文件匹配优化
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: [
      'node_modules',
      'dist',
      '**/*.d.ts',
      'src/test/setup.ts'
    ],
    
    // 覆盖率优化
    coverage: {
      exclude: [
        'src/test/**',
        'src/**/*.d.ts',
        'src/**/*.config.*'
      ]
    }
  }
});
```

#### Mock 性能优化
```typescript
// 使用内存存储而非文件系统
const mockDataStore = new Map();

// 批量数据操作
export function setMockDataBatch(operations: Array<{
  table: string;
  action: 'create' | 'update' | 'delete';
  data: any;
}>) {
  operations.forEach(({ table, action, data }) => {
    const store = mockDataStore.get(table) || new Map();
    
    switch (action) {
      case 'create':
        store.set(data.id, data);
        break;
      case 'update':
        const existing = store.get(data.id);
        store.set(data.id, { ...existing, ...data });
        break;
      case 'delete':
        store.delete(data.id);
        break;
    }
    
    mockDataStore.set(table, store);
  });
}
```

### 4. 常见问题解决

#### 问题 1: 测试间数据污染
```typescript
// ❌ 错误做法
describe('用户测试', () => {
  const user = { id: '123', name: 'test' };
  
  it('创建用户', () => {
    // 修改了全局变量
    user.name = '修改后的名称';
  });
  
  it('查询用户', () => {
    // 这里的 user.name 已经被修改了
    expect(user.name).toBe('test'); // ❌ 会失败
  });
});

// ✅ 正确做法
describe('用户测试', () => {
  let user: User;
  
  beforeEach(() => {
    user = TestDataFactory.createUser();
  });
  
  it('创建用户', () => {
    const modifiedUser = { ...user, name: '修改后的名称' };
    // 处理 modifiedUser...
  });
  
  it('查询用户', () => {
    expect(user.name).toBe('Test User'); // ✅ 通过
  });
});
```

#### 问题 2: 异步操作处理
```typescript
// ❌ 错误做法
it('应该创建用户', () => {
  request(app)
    .post('/api/users')
    .send(userData)
    .expect(201); // ❌ 没有等待异步操作
});

// ✅ 正确做法
it('应该创建用户', async () => {
  const response = await request(app)
    .post('/api/users')
    .send(userData)
    .expect(201);
    
  expect(response.body.success).toBe(true);
});
```

#### 问题 3: Mock 数据不一致
```typescript
// ❌ 错误做法
setMockData('user', [
  { id: '123', tags: 'tag1,tag2' } // ❌ 字符串格式
]);

// ✅ 正确做法
setMockData('user', [
  { 
    id: '123', 
    tags: JSON.stringify(['tag1', 'tag2']) // ✅ JSON 格式
  }
]);
```

## 📚 信息参考

### 官方文档
- [Vitest 官方文档](https://vitest.dev/)
- [Supertest GitHub](https://github.com/visionmedia/supertest)
- [Express.js 官方文档](https://expressjs.com/)

### 推荐资源
- [测试金字塔理论](https://martinfowler.com/articles/practical-test-pyramid.html)
- [API 测试最佳实践](https://github.com/microsoft/api-guidelines)
- [Node.js 测试最佳实践](https://github.com/goldbergyoni/nodebestpractices#-6-testing-and-overall-quality-practices)

### 相关工具
- **MSW**: Mock Service Worker，用于 Mock HTTP 请求
- **Testcontainers**: 集成测试中使用真实数据库
- **Artillery**: API 负载测试工具
- **Postman/Newman**: API 测试和文档工具

### 扩展阅读
- 《有效的单元测试》- Roy Osherove
- 《Google 软件测试之道》- James Whittaker
- 《微服务设计》- Sam Newman (测试策略章节)

---

通过这套完整的测试框架，你可以构建一个高质量、可维护的 API 测试体系，确保你的 Node.js 后端服务的稳定性和可靠性。记住，好的测试不仅仅是验证功能，更是你重构和优化代码的安全网。