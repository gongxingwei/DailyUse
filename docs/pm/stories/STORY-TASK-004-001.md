# STORY-022: Task Dependency Data Model & CRUD Operations

**Epic**: Task Management - Dependency System  
**Sprint**: Sprint 4  
**Story Points**: 3 SP  
**Priority**: P0 (Critical - Foundation)  
**Status**: 📋 Ready  
**Assignee**: Development Team  
**Dependencies**: None (Foundation story)

---

## 📖 User Story

**As a** user managing complex projects  
**I want** to define dependencies between tasks (e.g., "Task B cannot start until Task A is complete")  
**So that** I can ensure tasks are executed in the correct order and avoid scheduling conflicts

---

## 🎯 Acceptance Criteria

1. ✅ **Dependency Types Support**
   - [ ] Finish-to-Start (FS): Task B starts after Task A finishes (most common)
   - [ ] Start-to-Start (SS): Task B starts when Task A starts
   - [ ] Finish-to-Finish (FF): Task B finishes when Task A finishes
   - [ ] Start-to-Finish (SF): Task B finishes when Task A starts (rare)

2. ✅ **Circular Dependency Detection**
   - [ ] Detect circular dependencies before saving
   - [ ] Show clear error message with cycle path
   - [ ] Prevent circular dependency creation
   - [ ] Algorithm performance: O(V+E) for V tasks, E dependencies

3. ✅ **Dependency Status Calculation**
   - [ ] Auto-calculate if task is blocked (dependencies not met)
   - [ ] Track dependency status: NONE, WAITING, READY, BLOCKED
   - [ ] Update status when predecessor tasks change
   - [ ] Trigger notifications when task becomes unblocked

4. ✅ **CRUD Operations**
   - [ ] Create dependency between two tasks
   - [ ] Read all dependencies for a task
   - [ ] Update dependency type
   - [ ] Delete dependency
   - [ ] Batch operations support

5. ✅ **API Endpoints**
   - [ ] POST `/api/v1/tasks/:id/dependencies` - Add dependency
   - [ ] GET `/api/v1/tasks/:id/dependencies` - Get dependencies
   - [ ] DELETE `/api/v1/tasks/:id/dependencies/:depId` - Remove dependency
   - [ ] GET `/api/v1/tasks/:id/dependents` - Get dependent tasks
   - [ ] POST `/api/v1/tasks/:id/dependencies/validate` - Validate before save

---

## 🛠️ Technical Approach

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Web)                        │
├─────────────────────────────────────────────────────────────┤
│  TaskDependencyService (domain-client)                      │
│  - createDependency()                                        │
│  - validateDependency()                                      │
│  - detectCircularDependency()                                │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST
┌─────────────────────▼───────────────────────────────────────┐
│                     API Layer (apps/api)                     │
├─────────────────────────────────────────────────────────────┤
│  TaskDependencyController                                    │
│  - POST /tasks/:id/dependencies                              │
│  - GET /tasks/:id/dependencies                               │
│  - DELETE /tasks/:id/dependencies/:depId                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│            Application Services (domain-server)              │
├─────────────────────────────────────────────────────────────┤
│  TaskDependencyService                                       │
│  - createDependency()                                        │
│  - detectCircularDependencies() // Graph algorithms          │
│  - updateDependencyStatus()                                  │
│  - getDependencyChain()                                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│               Infrastructure (Prisma)                        │
├─────────────────────────────────────────────────────────────┤
│  TaskDependencyRepository                                    │
│  - Database schema                                           │
│  - Query optimization                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Implementation Tasks

### Task 1: Contracts Definition (0.5 SP)

**File**: `packages/contracts/src/modules/task/aggregates/TaskDependency.ts`

```typescript
/**
 * Dependency Type Enum
 */
export enum DependencyType {
  FINISH_TO_START = 'finish_to_start', // FS: B starts after A finishes
  START_TO_START = 'start_to_start', // SS: B starts when A starts
  FINISH_TO_FINISH = 'finish_to_finish', // FF: B finishes when A finishes
  START_TO_FINISH = 'start_to_finish', // SF: B finishes when A starts
}

/**
 * Dependency Status Enum
 */
export enum DependencyStatus {
  NONE = 'none', // No dependencies
  WAITING = 'waiting', // Waiting for predecessors
  READY = 'ready', // All dependencies met
  BLOCKED = 'blocked', // Cannot proceed due to dependencies
}

/**
 * Task Dependency Entity
 */
export interface TaskDependencyServerDTO {
  readonly uuid: string;
  readonly predecessorTaskUuid: string; // The task that must be done first
  readonly successorTaskUuid: string; // The task that depends on predecessor
  readonly dependencyType: DependencyType;
  readonly lagDays?: number; // Optional delay (e.g., +2 days after predecessor)
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Task with Dependencies Info
 */
export interface TaskWithDependenciesServerDTO extends TaskServerDTO {
  readonly dependencies: TaskDependencyServerDTO[]; // Tasks this task depends on
  readonly dependents: TaskDependencyServerDTO[]; // Tasks that depend on this task
  readonly dependencyStatus: DependencyStatus;
  readonly isBlocked: boolean;
  readonly blockingReason?: string;
}

/**
 * Circular Dependency Validation Result
 */
export interface CircularDependencyValidationResult {
  readonly isValid: boolean;
  readonly cycle?: string[]; // Array of task UUIDs forming the cycle
  readonly message?: string;
}
```

**File**: `packages/contracts/src/modules/task/requests/CreateTaskDependency.ts`

```typescript
export interface CreateTaskDependencyRequest {
  readonly predecessorTaskUuid: string;
  readonly successorTaskUuid: string;
  readonly dependencyType: DependencyType;
  readonly lagDays?: number;
}

export interface ValidateDependencyRequest {
  readonly predecessorTaskUuid: string;
  readonly successorTaskUuid: string;
}

export interface ValidateDependencyResponse {
  readonly isValid: boolean;
  readonly errors?: string[];
  readonly wouldCreateCycle?: boolean;
  readonly cyclePath?: string[];
}
```

---

### Task 2: Prisma Schema Update (0.5 SP)

**File**: `apps/api/prisma/schema.prisma`

```prisma
model TaskDependency {
  uuid                String   @id @default(uuid())
  predecessorTaskUuid String
  successorTaskUuid   String
  dependencyType      String   @default("finish_to_start")
  lagDays             Int?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  predecessor Task @relation("TaskPredecessors", fields: [predecessorTaskUuid], references: [uuid], onDelete: Cascade)
  successor   Task @relation("TaskSuccessors", fields: [successorTaskUuid], references: [uuid], onDelete: Cascade)

  @@unique([predecessorTaskUuid, successorTaskUuid])
  @@index([predecessorTaskUuid])
  @@index([successorTaskUuid])
  @@map("task_dependencies")
}

model Task {
  // ... existing fields ...

  // Dependency relations
  predecessors TaskDependency[] @relation("TaskSuccessors")
  successors   TaskDependency[] @relation("TaskPredecessors")

  // Computed fields
  isBlocked         Boolean @default(false)
  dependencyStatus  String  @default("none")
  blockingReason    String?
}
```

**Migration Command**:

```bash
cd apps/api
pnpm prisma migrate dev --name add_task_dependencies
pnpm prisma generate
```

---

### Task 3: Domain Service - Circular Dependency Detection (0.8 SP)

**File**: `packages/domain-server/src/modules/task/services/TaskDependencyService.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { TaskDependencyRepository } from '../infrastructure/TaskDependencyRepository';

@Injectable()
export class TaskDependencyService {
  constructor(private readonly dependencyRepo: TaskDependencyRepository) {}

  /**
   * Detect if adding a dependency would create a cycle
   * Uses Depth-First Search (DFS) algorithm
   * Time Complexity: O(V + E) where V = tasks, E = dependencies
   */
  async detectCircularDependency(
    predecessorUuid: string,
    successorUuid: string,
  ): Promise<CircularDependencyValidationResult> {
    // If adding this dependency, check if there's a path from successor back to predecessor
    const visited = new Set<string>();
    const path: string[] = [];

    const hasCycle = await this.dfs(successorUuid, predecessorUuid, visited, path);

    if (hasCycle) {
      return {
        isValid: false,
        cycle: [...path, predecessorUuid],
        message: `Creating this dependency would create a circular dependency: ${path.join(' → ')}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Depth-First Search to detect cycles
   */
  private async dfs(
    current: string,
    target: string,
    visited: Set<string>,
    path: string[],
  ): Promise<boolean> {
    if (current === target) {
      return true; // Found cycle
    }

    if (visited.has(current)) {
      return false; // Already visited, no cycle here
    }

    visited.add(current);
    path.push(current);

    // Get all tasks that depend on current task
    const dependencies = await this.dependencyRepo.findByPredecessor(current);

    for (const dep of dependencies) {
      if (await this.dfs(dep.successorTaskUuid, target, visited, path)) {
        return true;
      }
    }

    path.pop();
    return false;
  }

  /**
   * Calculate dependency status for a task
   */
  async calculateDependencyStatus(taskUuid: string): Promise<DependencyStatus> {
    const dependencies = await this.dependencyRepo.findBySuccessor(taskUuid);

    if (dependencies.length === 0) {
      return DependencyStatus.NONE;
    }

    // Check if all predecessors are completed
    const tasks = await Promise.all(
      dependencies.map((dep) => this.taskRepo.findByUuid(dep.predecessorTaskUuid)),
    );

    const allCompleted = tasks.every((task) => task.status === TaskStatus.COMPLETED);
    const anyBlocked = tasks.some((task) => task.isBlocked);

    if (anyBlocked) {
      return DependencyStatus.BLOCKED;
    }

    if (allCompleted) {
      return DependencyStatus.READY;
    }

    return DependencyStatus.WAITING;
  }

  /**
   * Create a new dependency with validation
   */
  async createDependency(request: CreateTaskDependencyRequest): Promise<TaskDependencyServerDTO> {
    // 1. Validate tasks exist
    const [predecessor, successor] = await Promise.all([
      this.taskRepo.findByUuid(request.predecessorTaskUuid),
      this.taskRepo.findByUuid(request.successorTaskUuid),
    ]);

    if (!predecessor || !successor) {
      throw new Error('One or both tasks not found');
    }

    // 2. Check for circular dependency
    const validation = await this.detectCircularDependency(
      request.predecessorTaskUuid,
      request.successorTaskUuid,
    );

    if (!validation.isValid) {
      throw new Error(validation.message);
    }

    // 3. Check for duplicate
    const existing = await this.dependencyRepo.findByPredecessorAndSuccessor(
      request.predecessorTaskUuid,
      request.successorTaskUuid,
    );

    if (existing) {
      throw new Error('Dependency already exists');
    }

    // 4. Create dependency
    const dependency = await this.dependencyRepo.create(request);

    // 5. Update successor task status
    const newStatus = await this.calculateDependencyStatus(request.successorTaskUuid);
    await this.taskRepo.update(request.successorTaskUuid, {
      dependencyStatus: newStatus,
      isBlocked: newStatus === DependencyStatus.BLOCKED || newStatus === DependencyStatus.WAITING,
    });

    return dependency;
  }
}
```

---

### Task 4: Infrastructure Layer (0.4 SP)

**File**: `packages/domain-server/src/modules/task/infrastructure/TaskDependencyRepository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { TaskDependencyServerDTO } from '@dailyuse/contracts';

@Injectable()
export class TaskDependencyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTaskDependencyRequest): Promise<TaskDependencyServerDTO> {
    return this.prisma.taskDependency.create({
      data: {
        predecessorTaskUuid: data.predecessorTaskUuid,
        successorTaskUuid: data.successorTaskUuid,
        dependencyType: data.dependencyType,
        lagDays: data.lagDays,
      },
    });
  }

  async findByPredecessor(taskUuid: string): Promise<TaskDependencyServerDTO[]> {
    return this.prisma.taskDependency.findMany({
      where: { predecessorTaskUuid: taskUuid },
      include: {
        successor: true,
      },
    });
  }

  async findBySuccessor(taskUuid: string): Promise<TaskDependencyServerDTO[]> {
    return this.prisma.taskDependency.findMany({
      where: { successorTaskUuid: taskUuid },
      include: {
        predecessor: true,
      },
    });
  }

  async findByPredecessorAndSuccessor(
    predecessorUuid: string,
    successorUuid: string,
  ): Promise<TaskDependencyServerDTO | null> {
    return this.prisma.taskDependency.findUnique({
      where: {
        predecessorTaskUuid_successorTaskUuid: {
          predecessorTaskUuid: predecessorUuid,
          successorTaskUuid: successorUuid,
        },
      },
    });
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.taskDependency.delete({
      where: { uuid },
    });
  }
}
```

---

### Task 5: API Controller (0.4 SP)

**File**: `apps/api/src/modules/task/controllers/TaskDependencyController.ts`

```typescript
import { Controller, Post, Get, Delete, Body, Param, HttpCode } from '@nestjs/common';
import { TaskDependencyService } from '@dailyuse/domain-server';

@Controller('api/v1/tasks')
export class TaskDependencyController {
  constructor(private readonly dependencyService: TaskDependencyService) {}

  @Post(':id/dependencies')
  async createDependency(
    @Param('id') taskUuid: string,
    @Body() request: CreateTaskDependencyRequest,
  ) {
    return this.dependencyService.createDependency({
      ...request,
      successorTaskUuid: taskUuid,
    });
  }

  @Get(':id/dependencies')
  async getDependencies(@Param('id') taskUuid: string) {
    return this.dependencyService.getDependencies(taskUuid);
  }

  @Get(':id/dependents')
  async getDependents(@Param('id') taskUuid: string) {
    return this.dependencyService.getDependents(taskUuid);
  }

  @Delete(':id/dependencies/:depId')
  @HttpCode(204)
  async deleteDependency(@Param('id') taskUuid: string, @Param('depId') dependencyUuid: string) {
    await this.dependencyService.deleteDependency(dependencyUuid);
  }

  @Post(':id/dependencies/validate')
  async validateDependency(
    @Param('id') taskUuid: string,
    @Body() request: ValidateDependencyRequest,
  ) {
    return this.dependencyService.validateDependency({
      ...request,
      successorTaskUuid: taskUuid,
    });
  }
}
```

---

### Task 6: Client Service (domain-client) (0.4 SP)

**File**: `packages/domain-client/src/modules/task/services/TaskDependencyClientService.ts`

```typescript
import { HttpClient } from '@/shared/api/core/client';
import type {
  TaskDependencyServerDTO,
  CreateTaskDependencyRequest,
  ValidateDependencyResponse,
} from '@dailyuse/contracts';

export class TaskDependencyClientService {
  constructor(private readonly http: HttpClient) {}

  async createDependency(
    taskUuid: string,
    request: Omit<CreateTaskDependencyRequest, 'successorTaskUuid'>,
  ): Promise<TaskDependencyServerDTO> {
    const response = await this.http.post(`/tasks/${taskUuid}/dependencies`, request);
    return response.data;
  }

  async getDependencies(taskUuid: string): Promise<TaskDependencyServerDTO[]> {
    const response = await this.http.get(`/tasks/${taskUuid}/dependencies`);
    return response.data;
  }

  async getDependents(taskUuid: string): Promise<TaskDependencyServerDTO[]> {
    const response = await this.http.get(`/tasks/${taskUuid}/dependents`);
    return response.data;
  }

  async deleteDependency(taskUuid: string, dependencyUuid: string): Promise<void> {
    await this.http.delete(`/tasks/${taskUuid}/dependencies/${dependencyUuid}`);
  }

  async validateDependency(
    taskUuid: string,
    predecessorUuid: string,
  ): Promise<ValidateDependencyResponse> {
    const response = await this.http.post(`/tasks/${taskUuid}/dependencies/validate`, {
      predecessorTaskUuid: predecessorUuid,
    });
    return response.data;
  }
}
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
describe('TaskDependencyService', () => {
  describe('detectCircularDependency', () => {
    it('should detect direct cycle (A → B → A)', async () => {
      // Given: A depends on B
      await service.createDependency({ predecessorTaskUuid: 'B', successorTaskUuid: 'A' });

      // When: Try to create B depends on A
      const result = await service.detectCircularDependency('A', 'B');

      // Then
      expect(result.isValid).toBe(false);
      expect(result.cycle).toEqual(['B', 'A', 'B']);
    });

    it('should detect indirect cycle (A → B → C → A)', async () => {
      // Given: Chain A → B → C
      await service.createDependency({ predecessorTaskUuid: 'B', successorTaskUuid: 'A' });
      await service.createDependency({ predecessorTaskUuid: 'C', successorTaskUuid: 'B' });

      // When: Try to create C → A
      const result = await service.detectCircularDependency('A', 'C');

      // Then
      expect(result.isValid).toBe(false);
      expect(result.cycle).toContain('A');
      expect(result.cycle).toContain('B');
      expect(result.cycle).toContain('C');
    });

    it('should allow valid dependency', async () => {
      // When: Create A → B
      const result = await service.detectCircularDependency('A', 'B');

      // Then
      expect(result.isValid).toBe(true);
      expect(result.cycle).toBeUndefined();
    });
  });

  describe('calculateDependencyStatus', () => {
    it('should return NONE when task has no dependencies', async () => {
      const status = await service.calculateDependencyStatus('task-1');
      expect(status).toBe(DependencyStatus.NONE);
    });

    it('should return WAITING when predecessors are not completed', async () => {
      // Given: Task B depends on Task A (status: IN_PROGRESS)
      const status = await service.calculateDependencyStatus('task-b');
      expect(status).toBe(DependencyStatus.WAITING);
    });

    it('should return READY when all predecessors are completed', async () => {
      // Given: Task B depends on Task A (status: COMPLETED)
      const status = await service.calculateDependencyStatus('task-b');
      expect(status).toBe(DependencyStatus.READY);
    });

    it('should return BLOCKED when any predecessor is blocked', async () => {
      // Given: Task C depends on Task B (blocked)
      const status = await service.calculateDependencyStatus('task-c');
      expect(status).toBe(DependencyStatus.BLOCKED);
    });
  });
});
```

### Integration Tests

```bash
# Test API endpoints
pnpm test:e2e task-dependency
```

---

## 📊 Performance Requirements

- Circular dependency detection: < 100ms for 1000 tasks, 5000 dependencies
- Dependency status calculation: < 50ms per task
- Batch dependency creation: < 500ms for 50 dependencies
- Database queries optimized with indexes

---

## 🔗 Dependencies

**Blocks**:

- STORY-023: Task DAG Visualization (needs data model)
- STORY-024: Dependency Validation (needs circular detection)
- STORY-025: Critical Path Analysis (needs dependency graph)

**Requires**:

- None (foundation story)

---

## 📝 Definition of Done

- [ ] All acceptance criteria met
- [ ] Contracts defined and exported
- [ ] Prisma schema updated and migrated
- [ ] Repository layer implemented with tests
- [ ] Domain service with circular dependency detection
- [ ] API endpoints implemented and documented
- [ ] Client service implemented
- [ ] Unit tests: ≥85% coverage
- [ ] Integration tests pass
- [ ] API documentation updated (Swagger)
- [ ] Code reviewed and approved
- [ ] No TypeScript errors
- [ ] Performance benchmarks pass

---

**Story Points Breakdown**:

- Contracts: 0.5 SP
- Prisma Schema: 0.5 SP
- Domain Service: 0.8 SP
- Infrastructure: 0.4 SP
- API Controller: 0.4 SP
- Client Service: 0.4 SP

**Total**: 3 SP

---

**Created**: 2024-10-23  
**Updated**: 2024-10-23  
**Estimated Completion**: Day 1-2 of Sprint 4
