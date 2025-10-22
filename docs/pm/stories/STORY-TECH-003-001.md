# STORY-012: Fix Test Environment Configuration

**Epic**: Technical Debt  
**Sprint**: Sprint 3  
**Story Points**: 3 SP  
**Priority**: P0 (Critical)  
**Status**: 🔄 In Progress  
**Assignee**: Development Team  
**Dependencies**: None

---

## 📖 User Story

**As a** developer  
**I want** all tests to run successfully in the CI/CD pipeline  
**So that** we can ensure code quality and catch regressions early

---

## 🎯 Acceptance Criteria

1. ✅ **Vitest Configuration**
   - [ ] All 29 GoalDAGVisualization unit tests pass
   - [ ] Test suite runs without "No test suite found" errors
   - [ ] Test execution time < 30s for all web tests

2. ✅ **Playwright Configuration**
   - [ ] E2E tests can run from root directory
   - [ ] All 16 E2E scenarios execute successfully
   - [ ] Proper error reporting and screenshots on failure

3. ✅ **Test Coverage**
   - [ ] Overall test coverage ≥85%
   - [ ] Critical paths covered: Goal CRUD, DAG rendering, Weight calculations
   - [ ] HTML coverage report generated

4. ✅ **CI/CD Integration**
   - [ ] Tests run automatically on PR
   - [ ] Test failures block merge
   - [ ] Coverage report uploaded to PR comments

5. ✅ **Documentation**
   - [ ] Testing guide updated with new setup
   - [ ] Common issues and solutions documented
   - [ ] Example test files provided

---

## 🔍 Problem Analysis

### Current Issues

#### Issue 1: Vitest + PNPM Workspace Incompatibility
**Error**: `Error: No test suite found in file`

**Root Cause**:
- Vitest 3.2.4 has compatibility issues with PNPM monorepo structure
- Test collection completes but test suite recognition fails
- Related to module resolution in workspaces

**Impact**: 29 unit tests cannot execute

#### Issue 2: CSS Module Loading
**Error**: `Unknown file extension ".css"`

**Status**: ✅ Partially fixed (added CSS config, but test suite issue blocks testing)

#### Issue 3: Playwright Path Resolution
**Error**: `Cannot find module '@playwright/test/cli.js'`

**Root Cause**: PNPM hoists dependencies to root, breaking relative paths

---

## 🛠️ Technical Approach

### Option A: Migrate to Jest (Recommended) ⭐

**Rationale**: Jest has better PNPM monorepo support and is Vue.js official recommendation

**Implementation Steps**:

1. Install Jest dependencies:
```bash
pnpm add -D jest @vue/test-utils @vue/vue3-jest ts-jest jest-environment-jsdom
```

2. Create `jest.config.js`:
```javascript
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'ts', 'json', 'vue'],
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/jest.setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{js,ts,vue}',
    '!src/**/*.spec.ts',
    '!src/test/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
};
```

3. Update test files:
```typescript
// Minimal changes needed - mostly compatible
import { describe, it, expect } from '@jest/globals';
import { mount } from '@vue/test-utils';
// ... rest remains the same
```

**Pros**:
- ✅ Mature and stable
- ✅ Excellent PNPM support
- ✅ Large ecosystem
- ✅ Vue official recommendation

**Cons**:
- ⚠️ Slower than Vitest
- ⚠️ 1 day migration time

**Estimated Time**: 1 day

---

### Option B: Downgrade Test Stack

Downgrade to known-stable versions:
- Vitest 1.x
- Vite 5.x
- @vitejs/plugin-vue 4.x

**Pros**:
- ✅ Quick to test (0.25 day)
- ✅ Minimal code changes

**Cons**:
- ❌ Lose new features
- ❌ May not solve PNPM issue

**Estimated Time**: 0.25 day

---

### Option C: Use Nx Built-in Test Runner

Leverage Nx's testing infrastructure

**Pros**:
- ✅ Better Nx integration

**Cons**:
- ❌ Learning curve
- ❌ Less community support

**Estimated Time**: 0.5 day

---

## 📝 Subtasks

### Phase 1: Decision & Setup (0.5 SP)
- [x] Research and document all three options
- [ ] **DECISION NEEDED**: Choose migration strategy
- [ ] Install dependencies
- [ ] Create initial configuration

### Phase 2: Configuration (1 SP)
- [ ] Configure test framework
- [ ] Setup coverage reporting
- [ ] Configure CI/CD integration
- [ ] Update package.json scripts

### Phase 3: Migration & Testing (1 SP)
- [ ] Migrate existing tests
- [ ] Fix GoalDAGVisualization tests
- [ ] Verify all 425 tests pass
- [ ] Achieve ≥85% coverage

### Phase 4: Playwright Setup (0.5 SP)
- [ ] Create root playwright.config.ts
- [ ] Add E2E scripts to package.json
- [ ] Verify 16 E2E scenarios
- [ ] Document E2E testing workflow

---

## 🚀 Testing Plan

### Unit Tests
```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific project
pnpm test:web

# Watch mode
pnpm test:watch
```

### E2E Tests
```bash
# Run all E2E tests
pnpm test:e2e

# Run DAG visualization tests
pnpm test:e2e:dag

# Debug mode
pnpm test:e2e:debug
```

---

## 📊 Success Metrics

- [ ] Test pass rate: 100% (425/425)
- [ ] Test coverage: ≥85%
- [ ] Test execution time: <30s for unit tests
- [ ] E2E execution time: <2min
- [ ] CI/CD pipeline green
- [ ] Zero "WARN" or "ERROR" logs during test runs

---

## 🔗 Related Documents

- [SPRINT-3-PLAN.md](../sprint-plans/SPRINT-3-PLAN.md)
- [E2E_TESTING_GUIDE.md](../../../apps/web/E2E_TESTING_GUIDE.md)
- [Current completion report](../../../STORY-011-COMPLETION-REPORT.md)

---

## 📅 Timeline

- **Start Date**: 2024-10-22
- **Target Completion**: 2024-10-24 (2 days)
- **Current Status**: 🔄 Blocked - Awaiting decision on migration strategy

---

## 💬 Discussion Notes

### 2024-10-22: Initial Investigation
- Discovered Vitest 3.2.4 is latest stable (no 4.x yet)
- Fixed CSS loading issue
- Fixed setup.ts beforeEach bug
- **Core issue**: "No test suite found" error persists even with simplest tests
- **Conclusion**: Vitest + PNPM workspace incompatibility confirmed

### Next Steps
- **Awaiting user decision** on migration strategy
- Recommend Option A (Jest) for stability and long-term maintainability
