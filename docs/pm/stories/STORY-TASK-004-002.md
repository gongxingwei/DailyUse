# STORY-023: Task Dependency DAG Visualization

**Story ID**: STORY-TASK-004-002  
**Sprint**: Sprint 4  
**Story Points**: 4 SP  
**Priority**: P0  
**Status**: Not Started  
**Created**: 2024-10-23  
**Assignee**: AI Development Team

---

## 📖 User Story

**As a** user managing complex projects with task dependencies  
**I want to** visualize task dependencies as a Directed Acyclic Graph (DAG)  
**So that** I can understand task relationships and execution order at a glance

---

## 🎯 Acceptance Criteria

### 1. DAG Visualization Display ✅
- [ ] Display tasks as nodes with title, status, and metadata
- [ ] Display dependencies as directed edges between tasks
- [ ] Support multiple layout algorithms (hierarchical, force-directed)
- [ ] Show task status with color coding:
  - 🟢 Green: Completed
  - 🔵 Blue: In Progress
  - 🟡 Yellow: Ready (dependencies met)
  - 🔴 Red: Blocked (waiting for dependencies)
  - ⚪ Gray: Pending (not started)

### 2. Critical Path Highlighting ✅
- [ ] Calculate and highlight the critical path
- [ ] Show critical tasks with thicker borders
- [ ] Display total estimated duration for critical path

### 3. Interactive Features ✅
- [ ] Zoom in/out with mouse wheel or buttons
- [ ] Pan by dragging the canvas
- [ ] Click node to show task details panel
- [ ] Hover over node to show quick info tooltip
- [ ] Double-click node to navigate to task edit page

### 4. Export Functionality ✅
- [ ] Export as PNG image
- [ ] Export as SVG vector
- [ ] Export as JSON data
- [ ] Copy graph to clipboard

### 5. Performance Requirements ✅
- [ ] Render <300ms for graphs with up to 50 tasks
- [ ] Smooth animations (60 FPS) during zoom/pan
- [ ] No memory leaks during repeated renders

---

## 🏗️ Technical Design

### Architecture Overview

```
TaskDAGView.vue (Page)
├── TaskDAGVisualization.vue (Main Component)
│   ├── TaskDAGToolbar.vue (Controls)
│   ├── TaskDAGCanvas.vue (ECharts)
│   └── TaskDetailPanel.vue (Side panel)
├── TaskDependencyGraphService (Data transformation)
└── taskDependencyApiClient (API calls)
```

### Component Reuse from Goal Module

**Reuse ~60% from Goal DAG Visualization**:
- ECharts configuration patterns
- Layout algorithms (hierarchical, force-directed)
- Export functionality
- Zoom/Pan controls
- Animation patterns

**Adapt for Task-specific needs**:
- Task status colors (vs Goal status)
- Dependency types (vs Goal parent-child)
- Critical path calculation (new feature)
- Task metadata display

---

## 📋 Implementation Tasks

### Task 1: Code Analysis & Reuse Planning (0.5 SP)
**Objective**: Analyze Goal DAG code for reusable patterns

**Subtasks**:
- [ ] Read `GoalDAGVisualization.vue` and extract reusable logic
- [ ] Identify ECharts configurations to adapt
- [ ] Document differences between Goal and Task DAG requirements
- [ ] Create component structure plan

**Deliverables**:
- Component reuse mapping document
- TaskDAGVisualization component scaffold

**Estimated Time**: 2-3 hours

---

### Task 2: TaskDAGVisualization Component (1.5 SP)
**Objective**: Create the main DAG visualization component

**Subtasks**:
- [ ] Create `TaskDAGVisualization.vue` component (300-400 lines)
- [ ] Integrate ECharts with task-specific configuration
- [ ] Implement node rendering with task status colors
- [ ] Implement edge rendering for dependencies
- [ ] Add zoom and pan controls
- [ ] Implement layout algorithm selection (hierarchical/force-directed)

**Key Code**:
```vue
<template>
  <div class="task-dag-container">
    <TaskDAGToolbar 
      @layout-change="handleLayoutChange"
      @export="handleExport"
    />
    <div ref="chartRef" class="dag-canvas" />
    <TaskDetailPanel 
      v-if="selectedTask"
      :task="selectedTask"
      @close="selectedTask = null"
    />
  </div>
</template>

<script setup lang="ts">
// ECharts graph visualization
const chartOption = computed(() => ({
  series: [{
    type: 'graph',
    layout: layoutMode.value,
    data: taskNodes.value,
    links: dependencyEdges.value,
    // ... other configs
  }]
}));
</script>
```

**Deliverables**:
- TaskDAGVisualization.vue component
- Task status color scheme
- Basic zoom/pan functionality

**Estimated Time**: 6-8 hours

---

### Task 3: Data Transformation Service (0.8 SP)
**Objective**: Transform task dependency data for ECharts

**Subtasks**:
- [ ] Create `TaskDependencyGraphService.ts` (200 lines)
- [ ] Implement `transformToGraphData()` method
- [ ] Calculate node positions for hierarchical layout
- [ ] Assign colors based on task status
- [ ] Handle edge routing and styling

**Key Methods**:
```typescript
class TaskDependencyGraphService {
  transformToGraphData(tasks, dependencies) {
    return {
      nodes: tasks.map(task => ({
        id: task.uuid,
        name: task.title,
        value: task.status,
        itemStyle: {
          color: this.getStatusColor(task.status)
        }
      })),
      edges: dependencies.map(dep => ({
        source: dep.predecessorTaskUuid,
        target: dep.successorTaskUuid
      }))
    };
  }
  
  calculateCriticalPath(tasks, dependencies) {
    // Topological sort + longest path algorithm
  }
}
```

**Deliverables**:
- TaskDependencyGraphService.ts
- Unit tests for data transformation
- Critical path calculation algorithm

**Estimated Time**: 4-5 hours

---

### Task 4: Critical Path Implementation (0.6 SP)
**Objective**: Implement critical path calculation and highlighting

**Subtasks**:
- [ ] Implement topological sort algorithm
- [ ] Calculate longest path (critical path)
- [ ] Highlight critical tasks with thicker borders
- [ ] Display critical path duration
- [ ] Add legend for critical path indicator

**Algorithm**:
```typescript
// Longest path in DAG = Critical Path
function calculateCriticalPath(tasks, dependencies) {
  const sorted = topologicalSort(tasks, dependencies);
  const longestPath = new Map();
  
  for (const task of sorted) {
    const predecessors = getPredecessors(task);
    const maxPredecessorPath = Math.max(
      ...predecessors.map(p => longestPath.get(p) + p.duration)
    );
    longestPath.set(task, maxPredecessorPath);
  }
  
  return extractPath(longestPath);
}
```

**Deliverables**:
- Critical path calculation service
- Visual highlighting of critical tasks
- Duration display

**Estimated Time**: 3-4 hours

---

### Task 5: Export Functionality (0.3 SP)
**Objective**: Implement export to PNG/SVG/JSON

**Subtasks**:
- [ ] Reuse export utilities from Goal module
- [ ] Implement PNG export (canvas.toDataURL)
- [ ] Implement SVG export (ECharts built-in)
- [ ] Implement JSON export (raw data)
- [ ] Add "Copy to Clipboard" functionality

**Deliverables**:
- Export toolbar buttons
- Export functionality for 3 formats
- Clipboard integration

**Estimated Time**: 2 hours

---

### Task 6: Integration & Testing (0.3 SP)
**Objective**: Integrate into task management page

**Subtasks**:
- [ ] Add DAG view toggle to task list page
- [ ] Implement view state persistence (localStorage)
- [ ] Add loading states and error handling
- [ ] Test with various graph sizes (5, 20, 50 tasks)
- [ ] Performance testing and optimization

**Deliverables**:
- Integrated task DAG view
- Performance benchmarks
- User acceptance testing scenarios

**Estimated Time**: 2-3 hours

---

## 🎨 UI/UX Design

### Layout Modes

1. **Hierarchical Layout** (Default)
   - Top-down arrangement
   - Root tasks at top, dependent tasks below
   - Clear visual hierarchy

2. **Force-Directed Layout**
   - Physics-based auto-arrangement
   - Minimizes edge crossings
   - Good for complex dependencies

### Color Scheme

| Status | Color | Description |
|--------|-------|-------------|
| COMPLETED | #52C41A (Green) | Task finished |
| IN_PROGRESS | #1890FF (Blue) | Currently working |
| READY | #FAAD14 (Yellow) | Dependencies met |
| BLOCKED | #F5222D (Red) | Waiting for dependencies |
| PENDING | #D9D9D9 (Gray) | Not started |

### Node Design

```
┌─────────────────────┐
│  📋 Task Title      │
│  ⏱️ 2h | 🏷️ P0      │
│  ━━━━━━━━━━━━━━━━━  │ ← Progress bar
└─────────────────────┘
```

### Edge Styling

- **Normal dependency**: Solid line, 2px, gray
- **Critical path**: Solid line, 4px, red
- **Finish-to-Start**: →
- **Start-to-Start**: ⇉
- **Finish-to-Finish**: ⇄
- **Start-to-Finish**: ⇄ (reversed)

---

## 📊 Success Metrics

### Technical Metrics
- DAG rendering time: <300ms for 50 tasks ✅
- Zoom/Pan FPS: ≥60 FPS ✅
- Memory usage: <50MB for 100 tasks ✅
- Export success rate: 100% ✅

### Functional Metrics
- Critical path accuracy: 100% ✅
- Layout algorithm correctness: No edge crossings in simple graphs ✅
- Color coding accuracy: 100% status mapping ✅

### User Metrics
- DAG view adoption: ≥40% of users with dependencies
- Export usage: ≥20% of DAG viewers
- User satisfaction: ≥8/10 for visualization clarity

---

## 🔗 Dependencies

### Prerequisite
- ✅ STORY-022 (Task Dependency Data Model) must be complete

### External Dependencies
- ECharts v5.x (already in project)
- Goal DAG components (Sprint 3)
- Task API endpoints (STORY-022)

---

## 🧪 Testing Strategy

### Unit Tests
- [ ] TaskDependencyGraphService.transformToGraphData()
- [ ] Critical path calculation algorithm
- [ ] Status color mapping
- [ ] Edge routing logic

### Component Tests
- [ ] TaskDAGVisualization renders correctly
- [ ] Zoom/Pan interactions work
- [ ] Export functionality works
- [ ] Node click opens detail panel

### E2E Tests
- [ ] User can view task DAG
- [ ] User can zoom and pan
- [ ] User can export graph
- [ ] Critical path is highlighted

---

## 🚀 Definition of Done

- [ ] All acceptance criteria met
- [ ] Code reviewed and approved
- [ ] Unit tests passing (≥85% coverage)
- [ ] Component tests passing
- [ ] E2E test scenarios complete
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Integrated into task management page
- [ ] Deployed to staging environment
- [ ] User acceptance testing passed

---

## 📝 Notes

### Code Reuse Opportunities
- Reuse ~60% from `GoalDAGVisualization.vue`
- Adapt layout algorithms (already implemented)
- Reuse export utilities (PNG/SVG/JSON)
- Reuse zoom/pan controls

### Challenges
- **Circular dependency prevention**: Rely on STORY-022's validation
- **Performance with large graphs**: Test with 100+ tasks, optimize if needed
- **Layout algorithm selection**: Provide both hierarchical and force-directed

### Future Enhancements (Out of Scope)
- Gantt chart view integration
- Real-time collaboration (multi-user editing)
- AI-suggested task ordering
- Swimlane grouping by assignee

---

**Estimated Total Time**: 19-25 hours (4 SP ≈ 20 hours average)

**Created By**: AI Development Team  
**Last Updated**: 2024-10-23
