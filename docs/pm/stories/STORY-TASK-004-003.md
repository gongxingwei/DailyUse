# STORY-024: Dependency Validation & Auto-status

**Story Points**: 3 SP  
**Priority**: P1  
**Category**: Task Dependency System  
**Sprint**: Sprint 4 (Oct 24 - Nov 7, 2024)

---

## 📋 User Story

> As a user, I want the system to automatically validate and manage task dependencies so that I can ensure data integrity and automatically track task readiness based on predecessor completion.

## 🎯 Acceptance Criteria

### 1. Circular Dependency Detection ✅
- **AC-1.1**: System detects circular dependencies before creating a new dependency
- **AC-1.2**: User receives clear error message indicating the circular path (A → B → C → A)
- **AC-1.3**: Validation runs in < 100ms for graphs up to 100 tasks
- **AC-1.4**: Existing dependencies are not affected if validation fails

### 2. Dependency Validation Rules ✅
- **AC-2.1**: Cannot create dependency if it would form a cycle
- **AC-2.2**: Cannot create duplicate dependencies (same predecessor + successor + type)
- **AC-2.3**: Task cannot depend on itself
- **AC-2.4**: Dependency type must be one of: FS, SS, FF, SF
- **AC-2.5**: Lag time validation (if provided, must be valid number)

### 3. Auto-status Update ✅
- **AC-3.1**: When all predecessors complete, successor status changes from BLOCKED → READY
- **AC-3.2**: When a predecessor becomes incomplete, successors change from READY → BLOCKED
- **AC-3.3**: Status updates are transitive (cascading through dependency chain)
- **AC-3.4**: User receives notification when tasks become READY

### 4. Dependency Change Events ✅
- **AC-4.1**: System emits events when dependencies are created/deleted/updated
- **AC-4.2**: Events trigger status recalculation for affected tasks
- **AC-4.3**: Event payload includes task UUIDs and change type

### 5. UI Feedback ✅
- **AC-5.1**: Validation errors shown in real-time when creating dependencies
- **AC-5.2**: Visual indicator for blocked tasks (red badge/icon)
- **AC-5.3**: Tooltip shows which predecessors are blocking
- **AC-5.4**: Confirmation dialog before creating potentially complex dependencies

---

## 🏗️ Technical Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌──────────────────┐      ┌───────────────────────────┐   │
│  │ DependencyDialog │      │ ValidationErrorDisplay     │   │
│  │  - Create Form   │      │  - Error Messages         │   │
│  │  - Validation UI │      │  - Warning Badges         │   │
│  └──────────────────┘      └───────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  TaskDependencyValidationService                      │   │
│  │    - validateDependency()                            │   │
│  │    - detectCircularDependencies()                    │   │
│  │    - validateDependencyRules()                       │   │
│  │    - calculateAffectedTasks()                        │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  TaskAutoStatusService                                │   │
│  │    - updateTaskStatusOnDependencyChange()            │   │
│  │    - calculateTaskReadiness()                        │   │
│  │    - cascadeStatusUpdate()                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Domain Layer                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  TaskDependencyDomainService                          │   │
│  │    - Graph algorithms                                │   │
│  │    - Status calculation rules                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  TaskDependencyApiClient                              │   │
│  │    - validateDependency()                            │   │
│  │    - createDependency()                              │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  EventBus (Vue)                                       │   │
│  │    - dependency:created                              │   │
│  │    - dependency:deleted                              │   │
│  │    - task:status:changed                             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Core Algorithms

#### 1. Circular Dependency Detection (DFS-based)

```typescript
/**
 * Detect circular dependencies using Depth-First Search
 * Time Complexity: O(V + E) where V = tasks, E = dependencies
 */
function detectCircularDependencies(
  taskUuid: string,
  predecessorUuid: string,
  existingDependencies: Dependency[]
): CircularDependencyResult {
  // Build adjacency list
  const graph = buildGraph(existingDependencies);
  
  // Add proposed edge
  graph[predecessorUuid].push(taskUuid);
  
  // DFS with cycle detection
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function hasCycle(node: string, path: string[]): boolean {
    if (recursionStack.has(node)) {
      // Found cycle - extract cycle path
      const cycleStart = path.indexOf(node);
      return path.slice(cycleStart).concat(node);
    }
    
    if (visited.has(node)) return false;
    
    visited.add(node);
    recursionStack.add(node);
    path.push(node);
    
    for (const neighbor of graph[node]) {
      const cyclePath = hasCycle(neighbor, [...path]);
      if (cyclePath) return cyclePath;
    }
    
    recursionStack.delete(node);
    return false;
  }
  
  const cyclePath = hasCycle(predecessorUuid, []);
  
  return {
    hasCycle: !!cyclePath,
    cyclePath: cyclePath || [],
  };
}
```

#### 2. Auto-status Calculation

```typescript
/**
 * Calculate task status based on dependency state
 */
function calculateTaskStatus(
  task: Task,
  predecessors: Task[]
): TaskStatus {
  // No dependencies -> READY
  if (predecessors.length === 0) {
    return task.status === 'PENDING' ? 'READY' : task.status;
  }
  
  // Check if all predecessors are completed
  const allPredecessorsCompleted = predecessors.every(
    pred => pred.status === 'COMPLETED'
  );
  
  if (allPredecessorsCompleted) {
    return task.status === 'BLOCKED' ? 'READY' : task.status;
  }
  
  // Has incomplete predecessors -> BLOCKED
  return 'BLOCKED';
}
```

---

## 📝 Implementation Tasks

### Task 1: Create Validation Service (3 hours)
**File**: `apps/web/src/modules/task/application/services/TaskDependencyValidationService.ts`

**Responsibilities**:
- Circular dependency detection (DFS algorithm)
- Dependency rule validation
- Duplicate detection
- Self-dependency check

**Methods**:
```typescript
class TaskDependencyValidationService {
  validateDependency(request: CreateDependencyRequest): ValidationResult;
  detectCircularDependency(taskUuid, predecessorUuid): CircularResult;
  validateDependencyRules(request): RuleValidationResult;
  checkDuplicateDependency(request): boolean;
}
```

### Task 2: Create Auto-status Service (3 hours)
**File**: `apps/web/src/modules/task/application/services/TaskAutoStatusService.ts`

**Responsibilities**:
- Status calculation based on dependencies
- Cascading status updates
- Event emission
- Notification trigger

**Methods**:
```typescript
class TaskAutoStatusService {
  updateTaskStatusOnDependencyChange(taskUuid: string): Promise<void>;
  calculateTaskReadiness(task: Task): TaskStatus;
  cascadeStatusUpdate(startingTaskUuid: string): Promise<UpdatedTask[]>;
  notifyTaskReady(taskUuid: string): void;
}
```

### Task 3: Add Event System Integration (2 hours)
**File**: `apps/web/src/shared/events/taskDependencyEvents.ts`

**Events**:
```typescript
// Event definitions
type DependencyCreatedEvent = {
  type: 'dependency:created';
  payload: {
    dependency: TaskDependency;
    predecessorUuid: string;
    successorUuid: string;
  };
};

type TaskStatusChangedEvent = {
  type: 'task:status:changed';
  payload: {
    taskUuid: string;
    oldStatus: string;
    newStatus: string;
    reason: 'dependency' | 'manual' | 'auto';
  };
};
```

### Task 4: Create Validation UI Components (3 hours)
**Files**:
- `apps/web/src/modules/task/presentation/components/dependency/DependencyValidationDialog.vue`
- `apps/web/src/modules/task/presentation/components/dependency/CircularDependencyWarning.vue`

**Features**:
- Real-time validation feedback
- Error message display
- Circular path visualization
- Confirmation dialogs

### Task 5: Integrate into Task Edit Form (2 hours)
**File**: `apps/web/src/modules/task/presentation/views/TaskEditView.vue`

**Integration**:
- Add validation before dependency creation
- Show validation errors
- Disable submit if validation fails
- Display blocked status badge

### Task 6: Add Backend Validation Endpoint (2 hours)
**Note**: Backend implementation (already exists in STORY-022)
- Use existing `/tasks/dependencies/validate` endpoint
- Enhance with additional rules if needed

---

## 🎨 UI/UX Specifications

### Validation Error Display

```
┌──────────────────────────────────────────────────────────┐
│  ⚠️  Cannot Create Dependency                             │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Creating this dependency would form a circular loop:    │
│                                                           │
│  📋 Task A (Design UI)                                   │
│       ↓                                                   │
│  📋 Task B (Implement Backend)                           │
│       ↓                                                   │
│  📋 Task C (Write Tests)                                 │
│       ↓                                                   │
│  📋 Task A (Design UI)  ← Creates cycle!                │
│                                                           │
│  [Cancel]  [View Dependency Graph]                       │
└──────────────────────────────────────────────────────────┘
```

### Blocked Task Badge

```
┌──────────────────────────────────────────────────────────┐
│  Task: Implement Feature X                               │
│  Status: 🔴 BLOCKED                                       │
│                                                           │
│  Waiting for:                                            │
│    ✓ Task A: Complete API (✅ COMPLETED)                │
│    ⏳ Task B: Write Documentation (🟡 IN_PROGRESS)      │
│    ⏸️  Task C: Review Code (⚪ PENDING)                 │
│                                                           │
│  2 of 3 dependencies completed                           │
└──────────────────────────────────────────────────────────┘
```

### Ready Notification

```
┌──────────────────────────────────────────────────────────┐
│  ✅ Task Ready to Start!                                 │
├──────────────────────────────────────────────────────────┤
│  Task "Implement Feature X" is now ready to start.      │
│  All prerequisite tasks have been completed.             │
│                                                           │
│  [View Task]  [Start Now]  [Dismiss]                     │
└──────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Strategy

### Unit Tests

**TaskDependencyValidationService**:
```typescript
describe('TaskDependencyValidationService', () => {
  it('should detect simple circular dependency (A → B → A)', () => {});
  it('should detect complex circular dependency (A → B → C → A)', () => {});
  it('should allow valid dependencies', () => {});
  it('should reject self-dependencies', () => {});
  it('should reject duplicate dependencies', () => {});
  it('should validate dependency types', () => {});
});
```

**TaskAutoStatusService**:
```typescript
describe('TaskAutoStatusService', () => {
  it('should mark task as READY when all predecessors complete', () => {});
  it('should mark task as BLOCKED when predecessor incomplete', () => {});
  it('should cascade status updates through chain', () => {});
  it('should not change status of COMPLETED tasks', () => {});
});
```

### Integration Tests

- Create dependency → Validate → Check status update
- Complete task → Verify successors updated
- Delete dependency → Recalculate status

### E2E Tests

- User creates circular dependency → Error shown
- User completes prerequisite → Successor becomes READY
- User views blocked task → Shows waiting tasks

---

## 📊 Success Metrics

### Performance Metrics
- Validation time: < 100ms for 100 tasks
- Status update time: < 200ms for 50 affected tasks
- Event propagation latency: < 50ms

### Quality Metrics
- Zero false positives in cycle detection
- 100% coverage of validation rules
- < 1% error rate in status calculation

### User Metrics
- Reduce manual status tracking by 80%
- Decrease invalid dependency attempts by 90%
- User satisfaction score > 4.5/5

---

## 🔗 Dependencies

### Requires (Must be complete first)
- ✅ STORY-022: Task Dependency Data Model (complete)
- ✅ STORY-023: Task DAG Visualization (for testing)

### Enables (Can start after this)
- STORY-025: Critical Path Analysis (uses validation)
- STORY-027: Dependency Templates (needs validation rules)

---

## 🚀 Implementation Plan

### Day 1 (4 hours)
- ✅ Create planning document
- ⏳ Implement TaskDependencyValidationService
- ⏳ Write unit tests for circular detection

### Day 2 (4 hours)
- ⏳ Implement TaskAutoStatusService
- ⏳ Add event system integration
- ⏳ Write unit tests for auto-status

### Day 3 (3 hours)
- ⏳ Create validation UI components
- ⏳ Integrate into task edit form
- ⏳ E2E testing

**Total Estimated Time**: 11-13 hours (3 SP)

---

## 📚 References

- [STORY-022 Completion Report](../../STORY-022-COMPLETION-REPORT.md)
- [Task Dependency API Spec](../../../packages/contracts/src/modules/task/aggregates/TaskDependencyClient.ts)
- [Graph Algorithms - Cycle Detection](https://en.wikipedia.org/wiki/Cycle_detection#Depth-first_search)

---

**Created**: 2024-10-23  
**Status**: 🔄 In Progress  
**Assignee**: AI Dev Team
