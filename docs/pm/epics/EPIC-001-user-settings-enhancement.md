# EPIC-001: User Settings Enhancement (用户设置功能增强)

**Epic Owner**: PO 🎯  
**Created**: 2025-10-22  
**Status**: 🔄 Planning  
**Sprint**: Sprint 1 (Week 1-2)

---

## 📋 Epic 概述

### 业务目标
增强现有的 `UserSetting` 聚合根功能，提供完整的用户个性化设置管理，包括：
- 外观主题设置（深色/浅色/自动）
- 语言和区域设置
- 通知偏好设置
- 快捷键自定义
- 隐私设置
- 工作流偏好

### 技术背景

**现有架构**：
- ✅ `UserSettingServer` 聚合根已存在（`domain-server/src/setting/aggregates/`）
- ✅ Contracts 已定义完整接口（`contracts/src/modules/setting/`）
- ✅ Prisma Schema 中已有 `UserSetting` model
- ❌ 缺少 Application Service Layer
- ❌ 缺少 Infrastructure Repository 实现
- ❌ 缺少 API Endpoints
- ❌ 缺少客户端集成

**关键决策**：
- 不创建新的独立模块
- 基于现有 `Setting` 模块扩展
- `UserSetting` 是聚合根，不是实体

---

## 🎯 业务价值

### 用户故事
> **As a** 用户  
> **I want to** 自定义我的应用设置  
> **So that** 我可以获得个性化的使用体验

### 验收标准
- [ ] 用户可以设置主题（light/dark/auto）
- [ ] 用户可以选择语言（zh-CN/en-US/ja-JP）
- [ ] 用户可以配置通知偏好
- [ ] 用户可以自定义快捷键
- [ ] 用户可以管理隐私设置
- [ ] 设置可以跨设备同步（可选）
- [ ] 所有设置变更实时生效

---

## 📐 架构设计

### DDD 层级结构

```
packages/
├── contracts/                    ← ✅ 已完成
│   └── src/modules/setting/
│       ├── aggregates/UserSettingServer.ts
│       ├── aggregates/UserSettingClient.ts
│       ├── enums.ts
│       └── api-requests.ts
│
├── domain-server/
│   └── src/setting/
│       ├── aggregates/
│       │   └── UserSettingServer.ts  ← ✅ 已完成
│       │
│       ├── application/              ← 🔨 需要实现
│       │   ├── services/
│       │   │   └── UserSettingService.ts
│       │   ├── dtos/
│       │   │   ├── CreateUserSettingDTO.ts
│       │   │   ├── UpdateUserSettingDTO.ts
│       │   │   └── UpdateAppearanceDTO.ts
│       │   └── errors/
│       │       └── UserSettingNotFoundError.ts
│       │
│       ├── infrastructure/           ← 🔨 需要实现
│       │   ├── repositories/
│       │   │   └── PrismaUserSettingRepository.ts
│       │   └── mappers/
│       │       └── UserSettingMapper.ts
│       │
│       └── repositories/             ← ✅ 接口已存在
│           └── IUserSettingRepository.ts
│
└── apps/
    ├── api/                          ← 🔨 需要实现
    │   └── src/modules/setting/
    │       ├── controllers/
    │       │   └── user-setting.controller.ts
    │       ├── dtos/
    │       └── guards/
    │
    └── web/                          ← 🔨 需要实现
        └── src/modules/setting/
            ├── services/
            ├── stores/
            └── views/
```

---

## 📦 技术范围

### Backend (domain-server)
1. **Application Layer**
   - UserSettingService: 业务逻辑协调
   - Application DTOs: 输入验证
   - Application Errors: 错误处理

2. **Infrastructure Layer**
   - PrismaUserSettingRepository: 持久化实现
   - UserSettingMapper: Entity ↔ Prisma 映射

### API (apps/api)
3. **Controllers & Endpoints**
   - GET /api/settings/user/:accountUuid
   - POST /api/settings/user
   - PATCH /api/settings/user/:uuid
   - DELETE /api/settings/user/:uuid

### Frontend (apps/web)
4. **Client Integration**
   - UserSettingService (client)
   - Pinia Store: userSettingStore
   - Settings UI Components

---

## 📊 Story 分解

### Week 1: Backend Foundation

#### STORY-001: Application Service Layer (3 SP)
**Tasks**:
- [ ] Create UserSettingService
- [ ] Create Application DTOs (Create, Update, UpdateAppearance, etc.)
- [ ] Create Application Errors
- [ ] Write Unit Tests (80%+ coverage)

**Acceptance Criteria**:
- Service implements all CRUD operations
- DTOs validate input correctly
- All tests passing
- Coverage ≥ 80%

---

#### STORY-002: Infrastructure & Repository (2 SP)
**Tasks**:
- [ ] Implement PrismaUserSettingRepository
- [ ] Create UserSettingMapper (Entity ↔ Prisma)
- [ ] Write Integration Tests
- [ ] Test with real database

**Acceptance Criteria**:
- Repository implements IUserSettingRepository
- Mapper correctly handles JSON serialization
- Integration tests passing
- Database operations verified

---

#### STORY-003: API Endpoints (3 SP)
**Tasks**:
- [ ] Create UserSettingController
- [ ] Implement CRUD endpoints
- [ ] Add authentication guards
- [ ] Add validation pipes
- [ ] Generate OpenAPI documentation

**Acceptance Criteria**:
- All endpoints working
- Auth guards applied
- Input validation working
- Swagger docs generated
- API tests passing

---

### Week 2: Frontend & Integration

#### STORY-004: Client Service Layer (2 SP)
**Tasks**:
- [ ] Create UserSettingService (client)
- [ ] Implement API client methods
- [ ] Add error handling
- [ ] Write unit tests

**Acceptance Criteria**:
- Service integrates with API
- Error handling robust
- Type-safe operations
- Tests passing

---

#### STORY-005: State Management (2 SP)
**Tasks**:
- [ ] Create userSettingStore (Pinia)
- [ ] Implement state management
- [ ] Add computed properties
- [ ] Add persistence (localStorage)

**Acceptance Criteria**:
- Store manages state correctly
- Reactive updates working
- LocalStorage sync working
- Tests passing

---

#### STORY-006: Settings UI Components (5 SP)
**Tasks**:
- [ ] Create SettingsLayout
- [ ] Create AppearanceSettings
- [ ] Create LocaleSettings
- [ ] Create ShortcutSettings
- [ ] Create PrivacySettings
- [ ] Add form validation
- [ ] Add loading states

**Acceptance Criteria**:
- All settings pages working
- Forms validate correctly
- Changes save successfully
- UI responsive and accessible

---

#### STORY-007: Integration Testing (2 SP)
**Tasks**:
- [ ] Write integration tests
- [ ] Test full user flows
- [ ] Test error scenarios
- [ ] Test edge cases

**Acceptance Criteria**:
- Integration tests passing
- All user flows tested
- Error scenarios covered
- Edge cases handled

---

#### STORY-008: E2E Testing (2 SP)
**Tasks**:
- [ ] Write Playwright E2E tests
- [ ] Test settings CRUD
- [ ] Test cross-page persistence
- [ ] Test theme switching

**Acceptance Criteria**:
- E2E tests passing
- All critical flows tested
- Theme switching verified
- Settings persist correctly

---

#### STORY-009: Documentation & Deployment (1 SP)
**Tasks**:
- [ ] Update API documentation
- [ ] Update user guide
- [ ] Create demo video
- [ ] Deploy to staging

**Acceptance Criteria**:
- Documentation complete
- User guide updated
- Demo video created
- Staging deployment successful

---

## 📈 估算

| Story | Story Points | Time Estimate |
|-------|-------------|---------------|
| STORY-001: Application Service | 3 SP | ~9h |
| STORY-002: Infrastructure | 2 SP | ~6h |
| STORY-003: API Endpoints | 3 SP | ~9h |
| STORY-004: Client Service | 2 SP | ~6h |
| STORY-005: State Management | 2 SP | ~6h |
| STORY-006: Settings UI | 5 SP | ~15h |
| STORY-007: Integration Tests | 2 SP | ~6h |
| STORY-008: E2E Tests | 2 SP | ~6h |
| STORY-009: Documentation | 1 SP | ~3h |
| **Total** | **22 SP** | **~66h** |

**Sprint Duration**: 2 weeks (10 working days)  
**Team Velocity**: ~11 SP/week  
**Expected Completion**: End of Week 2

---

## ✅ Definition of Done

- [ ] All code reviewed and merged
- [ ] All tests passing (Unit + Integration + E2E)
- [ ] Test coverage ≥ 80%
- [ ] API documentation updated
- [ ] User documentation updated
- [ ] No critical bugs
- [ ] Performance benchmarks met
- [ ] Deployed to staging
- [ ] PO acceptance obtained

---

## 🔗 相关链接

- **Contracts**: `packages/contracts/src/modules/setting/`
- **Domain**: `packages/domain-server/src/setting/`
- **Prisma Schema**: `apps/api/prisma/schema.prisma` (UserSetting model)
- **API**: `apps/api/src/modules/setting/`
- **Frontend**: `apps/web/src/modules/setting/`

---

## 📝 Notes

- 基于现有 `UserSettingServer` 聚合根，不创建新实体
- 复用 Setting 模块的架构和模式
- 遵循 DDD 8-layer architecture
- 保持类型安全（TypeScript strict mode）
- 保持测试覆盖率 ≥ 80%
