# TASK-SPRINT5-002: Sprint 5 单元测试补充

**Task ID**: TASK-SPRINT5-002  
**Sprint**: Sprint 6  
**Story Points**: 2 SP  
**Priority**: P1 (Should Have)  
**Owner**: Frontend Developer  
**Status**: To Do  
**Created**: 2025-10-24  
**Epic**: Sprint 5 收尾工作  
**Dependencies**: None (can proceed independently)

---

## 📋 Task Description

**As a** frontend developer  
**I want** to complete Sprint 5 deferred unit tests  
**So that** the Schedule conflict detection feature has comprehensive test coverage

---

## 🎯 Acceptance Criteria

### AC-1: Fix API Client Test Type Errors

**Given** `scheduleApiClient.spec.ts` was drafted with type errors  
**When** type errors are corrected  
**Then**  
- Import path changed from `@/infrastructure/api/client` to `@/shared/api/instances`
- Type name changed from `ScheduleClient` to `ScheduleClientDTO`
- Property `strategy` changed to `resolution` (in ResolveConflictRequestDTO)
- Property `appliedChanges` changed to `applied` (in ResolveConflictResponseDTO)
- Enum `ResolutionStrategy` is used instead of string literals
- All type errors resolved (0 errors)

**Files to Edit**:
- `apps/web/src/modules/schedule/infrastructure/api/__tests__/scheduleApiClient.spec.ts`

**Type Corrections**:
```typescript
// ❌ Before (Wrong)
import { apiClient, ScheduleClient } from '@/infrastructure/api/client';

const mockRequest: ResolveConflictRequestDTO = {
  strategy: 'reschedule',
  // ...
};

expect(response.appliedChanges).toBeDefined();

// ✅ After (Correct)
import { apiClient } from '@/shared/api/instances';
import type { ScheduleClientDTO } from '@dailyuse/contracts';

const mockRequest: ResolveConflictRequestDTO = {
  resolution: ResolutionStrategy.RESCHEDULE,
  // ...
};

expect(response.applied).toBeDefined();
```

---

### AC-2: Run and Verify API Client Tests

**Given** type errors are fixed  
**When** API Client tests are executed  
**Then**  
- Run `pnpm test scheduleApiClient.spec.ts` successfully
- All tests pass (estimated 15-20 tests)
- Test coverage includes:
  - `detectConflicts()` - POST /api/v1/schedules/detect-conflicts
  - `createSchedule()` - POST /api/v1/schedules
  - `resolveConflict()` - POST /api/v1/schedules/:id/resolve-conflict
- Mock API responses are correct
- Error handling is tested

**Expected Output**:
```
 ✓ apps/web/src/modules/schedule/infrastructure/api/__tests__/scheduleApiClient.spec.ts (20)
   ✓ scheduleApiClient (20)
     ✓ detectConflicts() (6)
       ✓ should detect conflicts successfully
       ✓ should return no conflicts when none exist
       ✓ should handle empty response
       ✓ should handle API errors
       ✓ should validate request format
       ✓ should pass correct headers
     ✓ createSchedule() (7)
       ✓ should create schedule successfully
       ✓ should validate required fields
       ✓ should handle creation errors
       ✓ should return created schedule with conflict info
       ✓ should support all optional fields
       ✓ should validate time constraints
       ✓ should pass authorization token
     ✓ resolveConflict() (7)
       ✓ should resolve conflict with reschedule strategy
       ✓ should resolve conflict with cancel strategy
       ✓ should resolve conflict with split strategy
       ✓ should validate resolution strategy enum
       ✓ should handle resolution errors
       ✓ should return resolution result
       ✓ should pass schedule ID correctly

 Test Files  1 passed (1)
      Tests  20 passed (20)
   Duration  1.23s
```

---

### AC-3: Implement useSchedule Composable Tests

**Given** `useSchedule` composable is implemented  
**When** unit tests are written  
**Then**  
- Create `apps/web/src/modules/schedule/application/composables/__tests__/useSchedule.spec.ts`
- Test core functionality (3-5 tests minimum):
  - Conflict detection state management
  - API integration (detectConflicts call)
  - Loading state tracking
  - Error handling
  - Reactive updates
- All tests pass
- Test coverage ≥ 70%

**Test Structure**:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSchedule } from '../useSchedule';
import { scheduleApiClient } from '@/modules/schedule/infrastructure/api/scheduleApiClient';

vi.mock('@/modules/schedule/infrastructure/api/scheduleApiClient');

describe('useSchedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect conflicts and update state', async () => {
    // Test conflict detection flow
  });

  it('should handle API errors gracefully', async () => {
    // Test error handling
  });

  it('should track loading state during API calls', async () => {
    // Test loading state
  });

  it('should reset conflict state on new detection', async () => {
    // Test state reset
  });

  it('should be reactive to schedule changes', async () => {
    // Test reactivity
  });
});
```

---

### AC-4: Optional - Repository Integration Tests

**Given** time permits after AC-1 to AC-3  
**When** Repository tests are implemented  
**Then**  
- Create `apps/api/src/modules/schedule/infrastructure/__tests__/PrismaScheduleRepository.spec.ts`
- Use in-memory Prisma Client or test database
- Test basic CRUD operations
- Test `findConflicts()` query logic
- All tests pass

**Note**: This is optional (P2) and can be deferred to Sprint 7 if Week 1 time is tight.

---

## 📝 Task Checklist

### Phase 1: API Client Tests (Priority)

- [ ] Read existing `scheduleApiClient.spec.ts` draft
- [ ] Fix import path: `@/shared/api/instances`
- [ ] Fix type name: `ScheduleClientDTO`
- [ ] Fix property: `strategy` → `resolution`
- [ ] Fix property: `appliedChanges` → `applied`
- [ ] Add enum import: `ResolutionStrategy`
- [ ] Run `pnpm typecheck` → 0 errors
- [ ] Run `pnpm test scheduleApiClient.spec.ts` → All pass
- [ ] Review test coverage report

### Phase 2: Composable Tests (Priority)

- [ ] Create `useSchedule.spec.ts` file
- [ ] Setup mocks for `scheduleApiClient`
- [ ] Write test: conflict detection state
- [ ] Write test: API integration
- [ ] Write test: loading state
- [ ] Write test: error handling
- [ ] Write test: reactivity
- [ ] Run `pnpm test useSchedule.spec.ts` → All pass
- [ ] Verify coverage ≥ 70%

### Phase 3: Repository Tests (Optional - P2)

- [ ] Create `PrismaScheduleRepository.spec.ts` (if time allows)
- [ ] Setup test database or in-memory Prisma
- [ ] Write basic CRUD tests
- [ ] Write conflict query tests
- [ ] Run tests → All pass

### Completion

- [ ] Update Story 9.5 status to "Ready for Review"
- [ ] Add test coverage report to Story 9.5 documentation
- [ ] Commit all test files

---

## 🔧 Technical Notes

### Type Definitions Reference

**Correct Imports**:
```typescript
// API Client Instance
import { apiClient } from '@/shared/api/instances';

// DTOs from Contracts
import type {
  ScheduleClientDTO,
  DetectConflictsRequestDTO,
  DetectConflictsResponseDTO,
  CreateScheduleRequestDTO,
  CreateScheduleResponseDTO,
  ResolveConflictRequestDTO,
  ResolveConflictResponseDTO,
  ConflictDetectionResult,
  ResolutionStrategy
} from '@dailyuse/contracts';
```

**Enum Usage**:
```typescript
// ❌ Wrong (string literal)
const request = { resolution: 'reschedule' };

// ✅ Correct (enum)
const request = { resolution: ResolutionStrategy.RESCHEDULE };
```

### Test Utilities

**Vitest + Vue Test Utils**:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
```

**Mocking API Client**:
```typescript
vi.mock('@/modules/schedule/infrastructure/api/scheduleApiClient', () => ({
  scheduleApiClient: {
    detectConflicts: vi.fn(),
    createSchedule: vi.fn(),
    resolveConflict: vi.fn()
  }
}));
```

---

## ⚠️ Known Issues from Previous Attempt

From conversation history, the previous API Client test draft had these errors:

1. **Wrong Import Path**: `@/infrastructure/api/client` (doesn't exist)
2. **Wrong Type Name**: `ScheduleClient` → should be `ScheduleClientDTO`
3. **Wrong Property**: `strategy` → should be `resolution`
4. **Wrong Property**: `appliedChanges` → should be `applied`
5. **String Literals**: Used `'reschedule'` → should use `ResolutionStrategy.RESCHEDULE`

**Resolution**: Follow the type definitions in `packages/contracts/src/modules/schedule/` exactly.

---

## ⏱️ Time Estimates

| Phase | Task | Estimate |
|-------|------|----------|
| 1 | Fix API Client type errors | 20 min |
| 1 | Run and verify API Client tests | 10 min |
| 2 | Implement useSchedule tests | 2-3 hours |
| 2 | Run and verify composable tests | 15 min |
| 3 | Repository tests (optional) | 1-2 hours |
| **Total** | **4-6 hours** | **0.5-1 day** |

---

## ✅ Definition of Done

**Minimum (P1 - Must Complete)**:
- [ ] API Client tests: Type errors fixed, all tests passing
- [ ] Composable tests: 3-5 tests implemented, all passing
- [ ] Test coverage ≥ 70% for tested files
- [ ] No TypeScript errors in test files
- [ ] Story 9.5 status updated

**Stretch (P2 - If Time Permits)**:
- [ ] Repository integration tests implemented
- [ ] Test coverage ≥ 80% across all test files
- [ ] Performance tests for conflict detection

---

## 📚 Related Documents

- [Story 9.5: Client Services](./9.5.story.md)
- [Sprint 5 Index](./SPRINT-05-INDEX.md)
- [ScheduleConflictAlert.spec.ts](../../apps/web/src/modules/schedule/presentation/components/__tests__/ScheduleConflictAlert.spec.ts) (Reference - 25 tests, all passing)
- [Testing Strategy Guide](../../guides/testing-strategy.md)

---

## 🎓 Success Metrics

- **Test Pass Rate**: 100% (all tests passing)
- **Code Coverage**: ≥ 70% (P1), ≥ 80% (P2)
- **Type Errors**: 0
- **Time to Complete**: ≤ 1 day

---

**Created**: 2025-10-24  
**Estimated Time**: 4-6 hours  
**Actual Time**: TBD  
**Completion Date**: TBD  
**Priority Note**: P1 - Should complete API Client and Composable tests; Repository tests are P2 and can be deferred if needed.
