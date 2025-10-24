# STORY-031: Code Quality & Refactoring

**Epic**: TECH-004 (Technical Debt & Quality)  
**Story Points**: 1.5 SP  
**Priority**: P2  
**Status**: Approved  
**Created**: 2024-10-24  
**Approved**: 2024-10-24  
**Sprint**: Sprint 4

---

## 📋 Story

**As a** developer,  
**I want** improved code quality and reduced technical debt,  
**so that** the codebase is maintainable, consistent, and easier to work with for future development.

---

## ✅ Acceptance Criteria

### AC-1: Code Duplication Eliminated
**Given** duplicate code exists in the codebase  
**When** reviewing code for duplication  
**Then**
- Duplicate utility functions should be extracted to shared packages
- Duplicate business logic should be centralized
- Code duplication percentage should be < 3%
- DRY (Don't Repeat Yourself) principle should be followed

### AC-2: Type Safety Improved
**Given** TypeScript is used throughout the project  
**When** checking type coverage  
**Then**
- No `any` types should exist in business logic (exceptions allowed for third-party libs)
- All function parameters should have explicit types
- All return types should be explicitly defined
- Type coverage should be > 95%
- No `@ts-ignore` comments without justification

### AC-3: Code Documentation Added
**Given** complex functions and modules exist  
**When** reviewing code documentation  
**Then**
- All public functions should have JSDoc comments
- All modules should have README.md files
- Complex algorithms should have inline comments explaining logic
- API endpoints should have OpenAPI/Swagger documentation
- Architecture decisions should be documented in ADRs

### AC-4: Dependency Management Improved
**Given** project dependencies exist  
**When** reviewing dependency health  
**Then**
- No critical security vulnerabilities should exist
- Outdated dependencies should be updated (within major version)
- Unused dependencies should be removed
- Dependency versions should be explicit (no `^` or `~` for critical packages)
- `pnpm audit` should report 0 high/critical issues

### AC-5: Code Style Consistency Enforced
**Given** multiple developers work on the codebase  
**When** checking code style  
**Then**
- ESLint should pass with 0 errors
- Prettier should format all code consistently
- No console.log statements in production code (use logger)
- Import order should be consistent (external → internal → relative)
- File naming conventions should be consistent

---

## 📝 Tasks / Subtasks

- [ ] **Task 1: Identify and Extract Duplicate Code** (AC: 1)
  - [ ] Run code duplication analysis
    - [ ] Use `jscpd` tool: `npx jscpd --min-lines 10 --min-tokens 50 ./apps ./packages`
    - [ ] Review report for duplicate blocks
    - [ ] Document top 10 duplication hotspots
  - [ ] Extract duplicate utility functions
    - [ ] Create `packages/utils/src/` for shared utilities
    - [ ] Move duplicate string/array/object utilities
    - [ ] Move duplicate date/time utilities
    - [ ] Update imports across codebase
  - [ ] Centralize duplicate business logic
    - [ ] Identify duplicate validation logic
    - [ ] Create shared validation functions in `packages/domain-server/src/validators/`
    - [ ] Identify duplicate data transformation logic
    - [ ] Create shared mapper functions
  - [ ] Verify duplication reduced to < 3%

- [ ] **Task 2: Improve Type Safety** (AC: 2)
  - [ ] Find and fix `any` types
    - [ ] Run: `grep -r ":\s*any" apps/ packages/ --include="*.ts" --exclude-dir=node_modules`
    - [ ] Replace with proper types
    - [ ] Use generic types where appropriate
  - [ ] Add explicit return types
    - [ ] Enable `noImplicitReturns` in tsconfig.json
    - [ ] Add return types to all functions
    - [ ] Use `void` for functions with no return
  - [ ] Improve error handling types
    - [ ] Create custom error classes extending Error
    - [ ] Type all error responses
    - [ ] Use discriminated unions for Result types
  - [ ] Remove or justify `@ts-ignore`
    - [ ] Search: `grep -r "@ts-ignore" apps/ packages/`
    - [ ] Fix underlying type issues
    - [ ] Add comments for unavoidable cases
  - [ ] Run type coverage check
    - [ ] Install: `pnpm add -D type-coverage -w`
    - [ ] Run: `npx type-coverage --detail`
    - [ ] Verify > 95% coverage

- [ ] **Task 3: Add Code Documentation** (AC: 3)
  - [ ] Add JSDoc to public functions
    - [ ] Document all exported functions
    - [ ] Include `@param`, `@returns`, `@throws` tags
    - [ ] Example:
      ```typescript
      /**
       * Creates a new goal with validation
       * @param data - Goal creation data
       * @param accountUuid - Account UUID
       * @returns Created goal object
       * @throws {ValidationError} If data is invalid
       */
      export async function createGoal(data: CreateGoalDto, accountUuid: string): Promise<Goal>
      ```
  - [ ] Create module README files
    - [ ] `packages/domain-server/README.md`
    - [ ] `packages/domain-client/README.md`
    - [ ] `packages/utils/README.md`
    - [ ] `packages/ui/README.md`
    - [ ] Include: Purpose, Usage, API reference
  - [ ] Document complex algorithms
    - [ ] Critical path calculation in task dependencies
    - [ ] Weight snapshot calculation logic
    - [ ] Add inline comments explaining business rules
  - [ ] Create API documentation
    - [ ] Add Swagger/OpenAPI annotations to controllers
    - [ ] Generate API docs: `pnpm nx run api:generate-api-docs`
    - [ ] Include request/response examples
  - [ ] Document architecture decisions
    - [ ] Create `docs/architecture/adr/` directory
    - [ ] Write ADR-001: Clean Architecture Pattern
    - [ ] Write ADR-002: Monorepo with Nx
    - [ ] Write ADR-003: Task Dependency Graph Design

- [ ] **Task 4: Improve Dependency Management** (AC: 4)
  - [ ] Audit dependencies for vulnerabilities
    - [ ] Run: `pnpm audit`
    - [ ] Review critical/high vulnerabilities
    - [ ] Update vulnerable packages
    - [ ] Document any exceptions (with mitigation)
  - [ ] Update outdated dependencies
    - [ ] Run: `pnpm outdated`
    - [ ] Update patch versions: `pnpm update --latest`
    - [ ] Test after each major/minor update
    - [ ] Update one category at a time (build tools → frameworks → libraries)
  - [ ] Remove unused dependencies
    - [ ] Use `depcheck`: `npx depcheck --ignores="@nx/*,@nrwl/*"`
    - [ ] Review report for unused packages
    - [ ] Remove from package.json
    - [ ] Verify build still works
  - [ ] Pin critical dependency versions
    - [ ] Identify critical packages (Prisma, Express, Vue)
    - [ ] Remove `^` and `~` for these packages
    - [ ] Add comment explaining why pinned
  - [ ] Verify audit clean
    - [ ] Run: `pnpm audit --audit-level=high`
    - [ ] Should report 0 high/critical issues

- [ ] **Task 5: Enforce Code Style Consistency** (AC: 5)
  - [ ] Fix all ESLint errors
    - [ ] Run: `pnpm nx run-many --target=lint --all`
    - [ ] Fix errors one project at a time
    - [ ] Enable stricter rules:
      ```json
      {
        "no-console": "error",  // Use logger instead
        "no-debugger": "error",
        "@typescript-eslint/explicit-function-return-type": "warn"
      }
      ```
  - [ ] Format all code with Prettier
    - [ ] Run: `pnpm prettier --write "**/*.{ts,tsx,js,jsx,json,md}"`
    - [ ] Verify git diff shows only formatting changes
    - [ ] Commit: "chore: format code with Prettier"
  - [ ] Replace console.log with logger
    - [ ] Search: `grep -r "console\." apps/api/src --include="*.ts"`
    - [ ] Replace with proper logger (winston/pino)
    - [ ] Create `packages/utils/src/logger.ts`
    - [ ] Use log levels: debug, info, warn, error
  - [ ] Standardize import order
    - [ ] Use ESLint plugin: `eslint-plugin-import`
    - [ ] Configure:
      ```json
      {
        "import/order": ["error", {
          "groups": [
            "builtin",   // Node.js built-ins
            "external",  // npm packages
            "internal",  // @/* imports
            "parent",    // ../
            "sibling",   // ./
            "index"      // ./index
          ],
          "newlines-between": "always",
          "alphabetize": { "order": "asc" }
        }]
      }
      ```
  - [ ] Enforce file naming conventions
    - [ ] Components: PascalCase (e.g., TaskCard.vue)
    - [ ] Utilities: camelCase (e.g., dateUtils.ts)
    - [ ] Constants: UPPER_SNAKE_CASE (e.g., API_ROUTES.ts)
    - [ ] Document in `.github/CONTRIBUTING.md`

- [ ] **Task 6: Continuous Quality Enforcement** (AC: 1-5)
  - [ ] Add pre-commit hooks
    - [ ] Install Husky: `pnpm add -D husky -w`
    - [ ] Setup: `pnpm husky install`
    - [ ] Add pre-commit hook:
      ```bash
      #!/bin/sh
      pnpm lint-staged
      ```
  - [ ] Configure lint-staged
    - [ ] Add to package.json:
      ```json
      {
        "lint-staged": {
          "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
          "*.{json,md}": ["prettier --write"]
        }
      }
      ```
  - [ ] Add quality gates to CI
    - [ ] Type check: `pnpm nx run-many --target=typecheck --all`
    - [ ] Lint check: `pnpm nx run-many --target=lint --all`
    - [ ] Duplication check: `npx jscpd --threshold 3`
  - [ ] Create quality dashboard
    - [ ] Track metrics over time (duplication %, type coverage, dependency health)
    - [ ] Add badges to README.md

---

## 👨‍💻 Dev Notes

### Previous Story Insights
- STORY-029: E2E tests revealed some code duplication in test setup
- STORY-022-027: Task dependency system has complex logic that needs documentation
- General: Rapid feature development has accumulated some technical debt

### Technical Context

#### 🏗️ Codebase Structure
[Source: Project structure + Clean Architecture]

**Project Type**: Nx monorepo with multiple apps and packages

**Key Directories**:
```
apps/
  api/          - Express backend (needs most refactoring)
  web/          - Vue frontend
  desktop/      - Electron app
packages/
  domain-server/    - Server-side domain logic
  domain-client/    - Client-side domain logic
  contracts/        - Shared DTOs/interfaces
  utils/            - Shared utilities (needs expansion)
  ui/               - Shared UI components
```

**Current Quality Issues** (Common in rapid development):
- Utility functions duplicated across apps
- Some `any` types in complex domain logic
- Sparse documentation for business rules
- Dependencies not recently audited
- Console.log statements in production code

#### 📦 File Locations for New Code

**Extracted Utilities**:
```
packages/utils/src/
├── string-utils.ts      (new)
├── array-utils.ts       (new)
├── date-utils.ts        (new)
├── validation-utils.ts  (new)
└── logger.ts            (new)
```

**Documentation**:
```
docs/architecture/adr/
├── ADR-001-clean-architecture.md  (new)
├── ADR-002-monorepo.md            (new)
└── ADR-003-task-dependencies.md   (new)

packages/*/README.md  (new - one per package)
```

**Configuration**:
```
.husky/
└── pre-commit           (new)

lint-staged.config.js    (new)
```

#### 🔧 Code Duplication Tools
[Source: Industry standard tools]

**jscpd** (Copy/Paste Detector):
```bash
# Install
npx jscpd --version

# Run analysis
npx jscpd --min-lines 10 --min-tokens 50 --threshold 3 ./apps ./packages

# Output formats
npx jscpd --format html --output ./reports/duplication
```

**Configuration** (`.jscpd.json`):
```json
{
  "threshold": 3,
  "reporters": ["html", "console"],
  "ignore": [
    "**/node_modules/**",
    "**/dist/**",
    "**/*.spec.ts",
    "**/*.test.ts"
  ],
  "format": ["typescript", "javascript"],
  "minLines": 10,
  "minTokens": 50
}
```

#### 🎯 Type Coverage Tool
[Source: type-coverage npm package]

**Installation & Usage**:
```bash
pnpm add -D type-coverage

# Check coverage
npx type-coverage --detail

# Output
type-coverage: 87.24% (1234/1414)
apps/api/src/modules/goals/services/GoalService.ts:45:12: error Parameter 'data' implicitly has an 'any' type
```

**Target**: > 95% type coverage

#### 📝 JSDoc Standards
[Source: TypeScript + JSDoc best practices]

**Template**:
```typescript
/**
 * Brief description of what the function does
 * 
 * More detailed explanation if needed.
 * Can span multiple lines.
 * 
 * @param paramName - Description of parameter
 * @param options - Optional parameter description
 * @param options.field1 - Nested option
 * @returns Description of return value
 * @throws {ErrorType} Description of when error is thrown
 * @example
 * ```typescript
 * const result = myFunction('value', { field1: true });
 * ```
 */
export async function myFunction(
  paramName: string,
  options?: { field1?: boolean }
): Promise<Result> {
  // Implementation
}
```

**Priority Targets**:
- All exported functions in `packages/domain-server/src/`
- All exported functions in `packages/domain-client/src/`
- All API controllers and services
- All complex business logic

#### 🔒 Dependency Audit Process
[Source: npm/pnpm security best practices]

**Audit Commands**:
```bash
# Check for vulnerabilities
pnpm audit

# Fix automatically (where possible)
pnpm audit --fix

# Check only high/critical
pnpm audit --audit-level=high

# Check for outdated packages
pnpm outdated

# Update all patch versions
pnpm update

# Update specific package
pnpm update package-name --latest
```

**Update Strategy**:
1. **Patch updates** (1.2.3 → 1.2.4): Apply immediately
2. **Minor updates** (1.2.3 → 1.3.0): Test thoroughly
3. **Major updates** (1.2.3 → 2.0.0): Review breaking changes, update carefully

**Priority Order**:
1. Critical security vulnerabilities
2. High security vulnerabilities
3. Outdated build tools (Nx, Vite, TypeScript)
4. Outdated frameworks (Vue, Express)
5. Outdated libraries

#### 🎨 ESLint Configuration Enhancement
[Source: Project eslint.config.ts]

**Recommended Rules to Add**:
```typescript
// eslint.config.ts
export default [
  {
    rules: {
      // Code Quality
      'no-console': 'error',
      'no-debugger': 'error',
      'no-alert': 'error',
      
      // TypeScript
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_' 
      }],
      
      // Import Order
      'import/order': ['error', {
        'groups': [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'always',
        'alphabetize': { 'order': 'asc' }
      }],
      
      // Code Style
      'max-len': ['warn', { code: 100, ignoreComments: true }],
      'complexity': ['warn', 10],
      'max-depth': ['warn', 3],
    }
  }
];
```

#### 🪝 Git Hooks with Husky
[Source: Husky + lint-staged best practices]

**Setup Process**:
```bash
# Install
pnpm add -D husky lint-staged

# Initialize
pnpm husky install

# Create pre-commit hook
echo "#!/bin/sh
. \"\$(dirname \"\$0\")/_/husky.sh\"

pnpm lint-staged" > .husky/pre-commit

chmod +x .husky/pre-commit
```

**lint-staged Configuration** (`package.json`):
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

#### 📚 Architecture Decision Records (ADR)
[Source: ADR best practices]

**Template** (`docs/architecture/adr/ADR-XXX-title.md`):
```markdown
# ADR-XXX: Title

**Date**: 2024-10-24  
**Status**: Accepted  
**Deciders**: Team  

## Context
What is the issue we're seeing that motivates this decision?

## Decision
What is the change we're making?

## Consequences
What becomes easier or harder because of this change?

### Positive
- Benefit 1
- Benefit 2

### Negative
- Trade-off 1
- Trade-off 2

## Alternatives Considered
- Option A: Why not chosen
- Option B: Why not chosen
```

**Required ADRs for this story**:
1. **ADR-001**: Clean Architecture Pattern
2. **ADR-002**: Nx Monorepo Structure
3. **ADR-003**: Task Dependency Graph Implementation

#### 🧪 Testing Strategy
[Source: Project testing patterns]

**Quality Enforcement Tests**:
- Type coverage check in CI
- Duplication threshold check in CI
- Dependency audit in CI
- ESLint in CI (already exists)

**Refactoring Tests**:
- Run all existing tests after each refactoring
- Verify no functionality broken
- Add tests for newly extracted utilities

#### ⚠️ Technical Constraints
- Refactoring must not break existing functionality
- Must maintain backward compatibility for shared packages
- Type improvements should not require extensive rewrites
- Documentation should be concise yet comprehensive

#### 🎯 Success Metrics
**Quantitative**:
- Code duplication: < 3%
- Type coverage: > 95%
- ESLint errors: 0
- pnpm audit high/critical: 0
- JSDoc coverage: > 80% of public functions

**Qualitative**:
- Easier onboarding for new developers
- Faster code reviews (clearer code)
- Fewer bugs from type errors
- Better IDE autocomplete experience

#### 📚 Implementation Order Priority
1. **Code Style** (Task 5) - Quick wins, foundation for other tasks
2. **Type Safety** (Task 2) - Prevent future issues
3. **Duplication** (Task 1) - Requires refactoring knowledge
4. **Documentation** (Task 3) - Preserve refactoring knowledge
5. **Dependencies** (Task 4) - Can run in parallel
6. **Continuous Enforcement** (Task 6) - Prevent regression

---

## 📊 Testing

### Unit Tests
- ✅ Extracted utility functions have tests
- ✅ All refactored code maintains existing test coverage

### Integration Tests
- ✅ Verify no functionality broken after refactoring
- ✅ All existing E2E tests still pass

### Quality Gates
- ✅ Type coverage > 95%
- ✅ Code duplication < 3%
- ✅ ESLint passes with 0 errors
- ✅ pnpm audit reports 0 high/critical vulnerabilities

---

## 🔄 Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2024-10-24 | 1.0 | Initial story creation | Bob (Scrum Master) |

---

## 👨‍💻 Dev Agent Record

### Agent Model Used
_To be filled by Dev Agent_

### Debug Log References
_To be filled by Dev Agent_

### Completion Notes List
_To be filled by Dev Agent_

### File List
_To be filled by Dev Agent_

---

## 🧪 QA Results
_To be filled by QA Agent_

---

**Story Status**: Draft  
**Ready for**: Dev Agent review and approval to proceed to implementation
