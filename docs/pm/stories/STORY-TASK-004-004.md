# STORY-025: Critical Path Analysis

**Story Points**: 2 SP  
**Priority**: P1  
**Category**: Task Dependency System  
**Sprint**: Sprint 4 (Oct 24 - Nov 7, 2024)

---

## 📋 User Story

> As a project manager, I want to identify the critical path in task dependencies so that I can focus on tasks that affect the overall timeline and optimize project completion time.

## 🎯 Acceptance Criteria

### 1. Critical Path Calculation ✅
- **AC-1.1**: System calculates the longest path from start to finish
- **AC-1.2**: Identifies all tasks on the critical path (zero slack time)
- **AC-1.3**: Calculation runs in O(V + E) time complexity
- **AC-1.4**: Handles multiple independent paths correctly

### 2. Task Timing Analysis ✅
- **AC-2.1**: Calculate Earliest Start (ES) for each task
- **AC-2.2**: Calculate Latest Start (LS) for each task
- **AC-2.3**: Calculate slack/float time (LS - ES)
- **AC-2.4**: Show estimated completion date based on critical path

### 3. Visual Highlighting ✅
- **AC-3.1**: Critical path tasks highlighted in red/orange in DAG
- **AC-3.2**: Non-critical tasks shown in default color
- **AC-3.3**: Toggle critical path view on/off
- **AC-3.4**: Display slack time as task metadata

### 4. Timeline Panel ✅
- **AC-4.1**: Show project total duration
- **AC-4.2**: List all critical path tasks in sequence
- **AC-4.3**: Display each task's duration and dependencies
- **AC-4.4**: Show optimization suggestions (e.g., "Reduce Task X to speed up project")

### 5. Performance ✅
- **AC-5.1**: Calculation completes in < 100ms for 100 tasks
- **AC-5.2**: Real-time update when task duration changes
- **AC-5.3**: Efficient memory usage (no unnecessary copies)

---

## 🏗️ Technical Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌──────────────────┐      ┌───────────────────────────┐   │
│  │ TaskDAGViz       │      │ CriticalPathPanel         │   │
│  │  - Highlight CP  │      │  - Timeline Display       │   │
│  │  - Slack Display │      │  - Task List              │   │
│  └──────────────────┘      └───────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  TaskCriticalPathService                              │   │
│  │    - calculateCriticalPath()                         │   │
│  │    - topologicalSort()                               │   │
│  │    - calculateEarliestStartTimes()                   │   │
│  │    - calculateLatestStartTimes()                     │   │
│  │    - identifyCriticalTasks()                         │   │
│  │    - getOptimizationSuggestions()                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Core Algorithms

#### 1. Critical Path Method (CPM)

**Step 1: Topological Sort**
```typescript
/**
 * Perform topological sort using Kahn's algorithm
 * Time Complexity: O(V + E)
 */
function topologicalSort(
  tasks: Task[],
  dependencies: Dependency[]
): Task[] {
  // Build in-degree map
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();
  
  tasks.forEach(task => {
    inDegree.set(task.uuid, 0);
    adjList.set(task.uuid, []);
  });
  
  dependencies.forEach(dep => {
    inDegree.set(dep.successorTaskUuid, 
      (inDegree.get(dep.successorTaskUuid) || 0) + 1
    );
    adjList.get(dep.predecessorTaskUuid)!.push(dep.successorTaskUuid);
  });
  
  // Start with tasks that have no predecessors
  const queue: string[] = [];
  inDegree.forEach((degree, uuid) => {
    if (degree === 0) queue.push(uuid);
  });
  
  const sorted: Task[] = [];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(tasks.find(t => t.uuid === current)!);
    
    adjList.get(current)!.forEach(successor => {
      inDegree.set(successor, inDegree.get(successor)! - 1);
      if (inDegree.get(successor) === 0) {
        queue.push(successor);
      }
    });
  }
  
  return sorted;
}
```

**Step 2: Forward Pass (Earliest Start Times)**
```typescript
/**
 * Calculate earliest start times for all tasks
 * ES(task) = max(ES(predecessor) + duration(predecessor))
 */
function calculateEarliestStartTimes(
  sortedTasks: Task[],
  dependencies: Dependency[]
): Map<string, number> {
  const ES = new Map<string, number>();
  
  sortedTasks.forEach(task => {
    const predecessors = dependencies.filter(
      dep => dep.successorTaskUuid === task.uuid
    );
    
    if (predecessors.length === 0) {
      ES.set(task.uuid, 0); // Start tasks
    } else {
      const maxES = Math.max(
        ...predecessors.map(dep => {
          const predTask = sortedTasks.find(
            t => t.uuid === dep.predecessorTaskUuid
          )!;
          return ES.get(predTask.uuid)! + predTask.estimatedMinutes;
        })
      );
      ES.set(task.uuid, maxES);
    }
  });
  
  return ES;
}
```

**Step 3: Backward Pass (Latest Start Times)**
```typescript
/**
 * Calculate latest start times for all tasks
 * LS(task) = min(LS(successor) - duration(task))
 */
function calculateLatestStartTimes(
  sortedTasks: Task[],
  dependencies: Dependency[],
  ES: Map<string, number>
): Map<string, number> {
  const LS = new Map<string, number>();
  
  // Project completion time (max ES + duration)
  const projectDuration = Math.max(
    ...sortedTasks.map(task => 
      ES.get(task.uuid)! + task.estimatedMinutes
    )
  );
  
  // Traverse in reverse order
  for (let i = sortedTasks.length - 1; i >= 0; i--) {
    const task = sortedTasks[i];
    
    const successors = dependencies.filter(
      dep => dep.predecessorTaskUuid === task.uuid
    );
    
    if (successors.length === 0) {
      // End tasks
      LS.set(task.uuid, projectDuration - task.estimatedMinutes);
    } else {
      const minLS = Math.min(
        ...successors.map(dep => {
          const succTask = sortedTasks.find(
            t => t.uuid === dep.successorTaskUuid
          )!;
          return LS.get(succTask.uuid)! - task.estimatedMinutes;
        })
      );
      LS.set(task.uuid, minLS);
    }
  }
  
  return LS;
}
```

**Step 4: Identify Critical Tasks**
```typescript
/**
 * Tasks with slack = 0 are on the critical path
 * Slack = LS - ES
 */
function identifyCriticalTasks(
  tasks: Task[],
  ES: Map<string, number>,
  LS: Map<string, number>
): CriticalPathResult {
  const criticalTasks: Task[] = [];
  const slack = new Map<string, number>();
  
  tasks.forEach(task => {
    const taskSlack = LS.get(task.uuid)! - ES.get(task.uuid)!;
    slack.set(task.uuid, taskSlack);
    
    if (Math.abs(taskSlack) < 0.001) { // Floating point tolerance
      criticalTasks.push(task);
    }
  });
  
  return {
    criticalTasks,
    slack,
    projectDuration: Math.max(...Array.from(LS.values())),
  };
}
```

### Data Structures

```typescript
/**
 * Task timing information
 */
interface TaskTiming {
  uuid: string;
  earliestStart: number;      // ES
  latestStart: number;        // LS
  earliestFinish: number;     // EF = ES + duration
  latestFinish: number;       // LF = LS + duration
  slack: number;              // LS - ES
  isCritical: boolean;        // slack === 0
}

/**
 * Critical path analysis result
 */
interface CriticalPathResult {
  criticalTasks: Task[];
  criticalPath: string[];     // Task UUIDs in order
  projectDuration: number;    // Total minutes
  taskTimings: Map<string, TaskTiming>;
  suggestions: OptimizationSuggestion[];
}

/**
 * Optimization suggestion
 */
interface OptimizationSuggestion {
  type: 'reduce_duration' | 'parallelize' | 'remove_dependency';
  taskUuid: string;
  impact: number;             // Minutes saved
  description: string;
}
```

---

## 📝 Implementation Tasks

### Task 1: Create Critical Path Service (4 hours)
**File**: `apps/web/src/modules/task/application/services/TaskCriticalPathService.ts`

**Methods**:
```typescript
export class TaskCriticalPathService {
  calculateCriticalPath(
    tasks: TaskForDAG[],
    dependencies: TaskDependencyClientDTO[]
  ): CriticalPathResult;
  
  topologicalSort(
    tasks: TaskForDAG[],
    dependencies: TaskDependencyClientDTO[]
  ): TaskForDAG[];
  
  calculateTaskTimings(
    tasks: TaskForDAG[],
    dependencies: TaskDependencyClientDTO[]
  ): Map<string, TaskTiming>;
  
  getOptimizationSuggestions(
    result: CriticalPathResult
  ): OptimizationSuggestion[];
  
  formatProjectTimeline(
    result: CriticalPathResult
  ): ProjectTimeline;
}
```

### Task 2: Add UI Highlighting (2 hours)
**File**: `apps/web/src/modules/task/presentation/components/dag/TaskDAGVisualization.vue`

**Changes**:
- Add `showCriticalPath` prop
- Modify node styling logic to highlight critical tasks
- Add slack time display in node tooltip
- Add toggle button for critical path view

```typescript
// Node styling logic
const getNodeStyle = (task: TaskForDAG) => {
  if (showCriticalPath && criticalPathService.isCritical(task.uuid)) {
    return {
      itemStyle: {
        color: '#FF4D4F',        // Red for critical
        borderColor: '#CF1322',
        borderWidth: 3,
      },
      label: {
        fontWeight: 'bold',
      },
    };
  }
  
  // Default styling
  return { /* normal style */ };
};
```

### Task 3: Create Critical Path Panel (3 hours)
**File**: `apps/web/src/modules/task/presentation/components/critical-path/CriticalPathPanel.vue`

**Features**:
- Project duration display
- Critical task list with timeline
- Slack time visualization
- Optimization suggestions

```vue
<template>
  <v-card class="critical-path-panel">
    <v-card-title>
      <v-icon class="mr-2">mdi-timeline</v-icon>
      关键路径分析
    </v-card-title>
    
    <v-card-text>
      <!-- Project Stats -->
      <v-row>
        <v-col cols="6">
          <v-sheet class="pa-3 text-center">
            <div class="text-h4">{{ formatDuration(projectDuration) }}</div>
            <div class="text-caption">预计总工期</div>
          </v-sheet>
        </v-col>
        <v-col cols="6">
          <v-sheet class="pa-3 text-center">
            <div class="text-h4">{{ criticalTasks.length }}</div>
            <div class="text-caption">关键任务数</div>
          </v-sheet>
        </v-col>
      </v-row>
      
      <!-- Critical Task List -->
      <v-list density="compact" class="mt-4">
        <v-list-subheader>关键路径任务</v-list-subheader>
        <v-list-item
          v-for="task in criticalTasks"
          :key="task.uuid"
        >
          <template #prepend>
            <v-icon color="error">mdi-alert-circle</v-icon>
          </template>
          
          <v-list-item-title>{{ task.title }}</v-list-item-title>
          <v-list-item-subtitle>
            工期: {{ formatDuration(task.estimatedMinutes) }}
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
      
      <!-- Optimization Suggestions -->
      <v-expansion-panels class="mt-4">
        <v-expansion-panel title="优化建议">
          <v-expansion-panel-text>
            <v-list>
              <v-list-item
                v-for="(suggestion, index) in suggestions"
                :key="index"
              >
                <v-list-item-title>
                  {{ suggestion.description }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  可节省: {{ formatDuration(suggestion.impact) }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>
```

### Task 4: Integration (1 hour)
- Add critical path toggle to TaskListView
- Integrate CriticalPathPanel into demo page
- Add keyboard shortcut (Cmd+P for path analysis)

---

## 🎨 UI/UX Specifications

### Critical Path Highlighting

```
┌─────────────────────────────────────────────────┐
│  Task DAG with Critical Path                   │
├─────────────────────────────────────────────────┤
│                                                 │
│      ┌─────┐                                    │
│      │ A   │  Normal Task (Blue)                │
│      └──┬──┘                                    │
│         │                                       │
│      ┌──▼──┐                                    │
│      │ B   │  Critical Task (Red + Bold)        │
│      └──┬──┘  Slack: 0 min                      │
│         │                                       │
│      ┌──▼──┐                                    │
│      │ C   │  Critical Task (Red + Bold)        │
│      └──┬──┘  Slack: 0 min                      │
│         │                                       │
│      ┌──▼──┐                                    │
│      │ D   │  Normal Task (Blue)                │
│      └─────┘  Slack: 120 min                    │
│                                                 │
│  [✓ Show Critical Path]  [Export Timeline]     │
└─────────────────────────────────────────────────┘
```

### Timeline Panel

```
┌──────────────────────────────────────────────────┐
│  📊 Critical Path Analysis                      │
├──────────────────────────────────────────────────┤
│                                                  │
│  Project Duration          Critical Tasks       │
│  ┌────────────┐          ┌────────────┐        │
│  │  16 hours  │          │     8      │        │
│  └────────────┘          └────────────┘        │
│                                                  │
│  ━━━ Critical Path Tasks ━━━                    │
│  🔴 Task A - Design (4h)                        │
│      → 0 min slack                              │
│  🔴 Task B - Implement (8h)                     │
│      → 0 min slack                              │
│  🔴 Task C - Test (4h)                          │
│      → 0 min slack                              │
│                                                  │
│  ━━━ Optimization Suggestions ━━━               │
│  💡 Parallelize Task B with Task D              │
│     Save: 2 hours                               │
│  💡 Reduce Task B duration by 20%               │
│     Save: 1.6 hours                             │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 🧪 Testing Strategy

### Unit Tests

**TaskCriticalPathService**:
```typescript
describe('TaskCriticalPathService', () => {
  describe('topologicalSort', () => {
    it('should sort tasks with linear dependencies', () => {});
    it('should handle diamond dependencies', () => {});
    it('should handle multiple start nodes', () => {});
  });
  
  describe('calculateCriticalPath', () => {
    it('should identify single critical path', () => {});
    it('should handle multiple critical paths', () => {});
    it('should calculate correct slack times', () => {});
    it('should handle tasks with zero duration', () => {});
  });
  
  describe('getOptimizationSuggestions', () => {
    it('should suggest parallelization opportunities', () => {});
    it('should suggest duration reduction for critical tasks', () => {});
    it('should prioritize high-impact suggestions', () => {});
  });
});
```

### Integration Tests
- Calculate critical path → Verify highlighting in DAG
- Update task duration → Recalculate critical path
- Toggle critical path view → UI updates correctly

### Performance Tests
- 50 tasks: < 50ms
- 100 tasks: < 100ms
- 200 tasks: < 300ms

---

## 📊 Success Metrics

### Technical Metrics
- Critical path calculation: O(V + E) verified
- UI rendering: < 16ms (60 FPS)
- Memory usage: < 5MB for 100 tasks

### Functional Metrics
- Critical path accuracy: 100% (verified against manual calculation)
- Slack time precision: ±1 minute
- Suggestion relevance: ≥80% user acceptance

### User Metrics
- Feature adoption: ≥30% of users with dependencies
- Average time savings: ≥15% on project planning
- User satisfaction: ≥8/10

---

## 🔗 Dependencies

### Requires (Must be complete first)
- ✅ STORY-022: Task Dependency Data Model
- ✅ STORY-023: Task DAG Visualization

### Enables (Can start after this)
- STORY-026: Command Palette (can trigger critical path analysis)
- STORY-027: Drag & Drop (can update critical path on changes)

---

## 📚 References

- [Critical Path Method (Wikipedia)](https://en.wikipedia.org/wiki/Critical_path_method)
- [Topological Sort Algorithm](https://en.wikipedia.org/wiki/Topological_sorting)
- [Project Management - CPM](https://www.pmi.org/learning/library/critical-path-method-schedule-analysis-6683)

---

## 💡 Innovation Points

### 1. Real-time Recalculation
- Automatic critical path update on any task change
- No manual refresh needed

### 2. Intelligent Suggestions
- ML-based (future) suggestions based on historical data
- Consider resource availability and team capacity

### 3. Interactive Visualization
- Click critical task to see optimization options
- Drag to simulate duration changes and see impact

---

**Created**: 2024-10-23  
**Status**: 📝 Planning  
**Assignee**: AI Dev Team  
**Estimated Hours**: 10 hours (2 SP)
