# STORY-027: Drag & Drop Task Management - Progress Report

**Story Points**: 2 SP  
**Status**: 🔄 50% Complete (In Progress)  
**Started**: 2024-10-23  
**Estimated Time**: 4-6 hours  
**Actual Time So Far**: ~2 hours

---

## 📊 Summary

正在实现拖放任务管理功能，提供直观的任务重排序和依赖关系创建。已完成核心架构和服务层，剩余 UI 集成和视觉反馈。

**Current Status**:
- ✅ 规划文档（STORY-UX-004-002.md）
- ✅ 依赖安装（vue-draggable-plus, @vueuse/core）
- ✅ useDragAndDrop composable
- ✅ TaskDependencyDragDropService
- ⏳ TaskCard UI 集成
- ⏳ 视觉反馈和动画
- ⏳ DAG 可视化集成
- ⏳ 单元/集成测试

---

## ✅ Completed Work (50%)

### 1. Planning Document (STORY-UX-004-002.md) ✅

**File**: `docs/pm/stories/STORY-UX-004-002.md` (1600+ lines)

**Sections**:
- User Story & Business Value
- 6 Acceptance Criteria (AC-1 to AC-6)
- UI/UX Design with 5 drag states
- Technical Architecture
- Component Structure
- Data Flow Diagrams
- Testing Strategy
- Performance Targets
- Integration Points
- Rollout Plan

**Key Insights**:
- **AC-1**: Task card reordering with persistence
- **AC-2**: Dependency creation via drop with validation
- **AC-3**: Visual feedback (ghost, highlights, cursors)
- **AC-4**: DAG and critical path integration
- **AC-5**: Performance targets (< 50ms drag start, 60 FPS)
- **AC-6**: Accessibility (keyboard, screen reader)

### 2. Dependencies Installation ✅

```bash
pnpm add vue-draggable-plus @vueuse/core
```

**Packages**:
- `vue-draggable-plus@0.6.0`: Drag-and-drop library for Vue 3
- `@vueuse/core@14.0.0`: Vue composable utilities

### 3. useDragAndDrop Composable ✅

**File**: `apps/web/src/shared/composables/useDragAndDrop.ts` (220 lines)

**API**:
```typescript
interface UseDragAndDropReturn {
  // State
  isDragging: Ref<boolean>;
  draggedTask: Ref<TaskTemplateClientDTO | null>;
  dropTarget: Ref<TaskTemplateClientDTO | null>;
  dragOperation: Ref<DragOperation>;
  isValidDrop: Ref<boolean>;
  
  // Methods
  handleDragStart: (task: TaskTemplateClientDTO) => void;
  handleDragOver: (target: TaskTemplateClientDTO | null) => void;
  handleDrop: (target: TaskTemplateClientDTO | null, newIndex?: number) => Promise<void>;
  handleDragEnd: () => void;
}
```

**Features**:
- **Drag Modes**: `'reorder'`, `'dependency'`, or `'both'`
- **State Management**: Tracks drag state, dragged task, drop target
- **Operation Detection**: Automatically determines reorder vs dependency
- **Validation**: Custom `validateDrop` function support
- **Callbacks**: `onDragStart`, `onDragEnd`, `onReorder`, `onDependencyCreate`

**Example Usage**:
```typescript
const { isDragging, handleDragStart, handleDrop } = useDragAndDrop({
  mode: 'both',
  onDependencyCreate: async (source, target) => {
    await dragDropService.createDependencyFromDrop(source, target);
  },
  onReorder: async (task, newIndex) => {
    await taskService.updateTaskOrder(task.uuid, newIndex);
  }
});
```

### 4. TaskDependencyDragDropService ✅

**File**: `apps/web/src/modules/task/application/services/TaskDependencyDragDropService.ts` (190 lines)

**Core Methods**:
```typescript
class TaskDependencyDragDropService {
  // Main method for dependency creation
  async createDependencyFromDrop(
    sourceTask: TaskTemplateClientDTO,
    targetTask: TaskTemplateClientDTO,
    dependencyType: DependencyType = 'FINISH_TO_START'
  ): Promise<DependencyCreationResult>
  
  // Quick client-side validation
  canDropOn(source: TaskTemplateClientDTO, target: TaskTemplateClientDTO): boolean
}
```

**Workflow**:
1. **Validate**: Call `taskDependencyApiClient.validateDependency()`
   - Checks for circular dependencies
   - Checks for duplicate dependencies
   - Validates task status (cannot depend on archived tasks)
2. **Create**: Call `taskDependencyApiClient.createDependency()`
   - Uses correct predecessor/successor UUIDs
   - Sets dependency type and lag days
3. **Notify**: Show success/error snackbar
   - Success: `"✓ 依赖关系已创建\n'Task A' 现在依赖于 'Task B'"`
   - Error: `"无法创建依赖: <reason>"`

**Integration**:
- Uses `TaskDependencyValidationService` for validation
- Uses `taskDependencyApiClient` for API calls
- Uses `useSnackbar()` for notifications

---

## ⏳ Remaining Work (50%)

### 5. TaskCard UI Integration (⏳ Not Started)

**File**: `apps/web/src/modules/task/presentation/components/TaskCard.vue`

**Changes Needed**:
```vue
<template>
  <v-card
    :class="{
      'task-card--dragging': isDragging,
      'task-card--valid-target': isValidDropTarget,
      'task-card--invalid-target': isInvalidDropTarget,
    }"
    draggable="true"
    @dragstart="onDragStart"
    @dragover.prevent="onDragOver"
    @drop.prevent="onDrop"
    @dragend="onDragEnd"
  >
    <div class="drag-handle">
      <v-icon>mdi-drag-vertical</v-icon>
    </div>
    <!-- Card content -->
  </v-card>
</template>

<script setup>
import { useDragAndDrop } from '@/shared/composables/useDragAndDrop';
import { TaskDependencyDragDropService } from '@/modules/task/application/services/TaskDependencyDragDropService';

const dragDropService = new TaskDependencyDragDropService();

const { isDragging, handleDragStart, handleDrop } = useDragAndDrop({
  mode: 'both',
  onDependencyCreate: async (source, target) => {
    await dragDropService.createDependencyFromDrop(source, target);
    // Refresh DAG
  }
});
</script>
```

**Estimated Time**: 1 hour

### 6. Visual Feedback & Animations (⏳ Not Started)

**CSS Classes Needed**:
```css
.task-card {
  transition: all 0.2s ease;
  cursor: grab;
}

.task-card:active {
  cursor: grabbing;
}

.task-card--dragging {
  opacity: 0.4;
  transform: scale(1.05);
}

.task-card--valid-target {
  border: 2px solid var(--v-success-base);
  background-color: rgba(76, 175, 80, 0.1);
}

.task-card--invalid-target {
  border: 2px solid var(--v-error-base);
  background-color: rgba(244, 67, 54, 0.1);
  cursor: not-allowed;
}

.drag-handle {
  opacity: 0.3;
  transition: opacity 0.2s;
}

.task-card:hover .drag-handle {
  opacity: 1;
}
```

**Estimated Time**: 1 hour

### 7. DAG Visualization Integration (⏳ Not Started)

**Changes Needed**:
- After `createDependencyFromDrop()` succeeds, refresh DAG
- Call `dagService.refresh()` or emit event
- Update critical path analysis

**File**: `apps/web/src/modules/task/presentation/components/DependencyDAGVisualization.vue`

**Integration**:
```typescript
// In TaskCard after dependency creation
await dragDropService.createDependencyFromDrop(source, target);
// Emit event or call refresh
emit('dependency-created');
// Or
dagStore.refreshGraph();
```

**Estimated Time**: 30 minutes

### 8. Unit Tests (⏳ Not Started)

**File**: `apps/web/src/shared/composables/__tests__/useDragAndDrop.spec.ts`

**Test Cases**:
- ✅ Should set isDragging=true on handleDragStart
- ✅ Should clear state on handleDragEnd
- ✅ Should mark drop as invalid when dropping on self
- ✅ Should use custom validateDrop function
- ✅ Should call onDependencyCreate when dropping on task
- ✅ Should call onReorder when dropping in empty space
- ✅ Should determine operation type based on drop target

**Estimated Time**: 1 hour

### 9. Integration Tests (⏳ Not Started)

**File**: `apps/web/src/modules/task/presentation/__tests__/TaskDragAndDrop.integration.spec.ts`

**Test Cases**:
- ✅ Should create dependency when dropping task A on task B
- ✅ Should reject circular dependency
- ✅ Should reject duplicate dependency
- ✅ Should show success notification
- ✅ Should show error notification on failure

**Estimated Time**: 30 minutes

---

## 📈 Progress Metrics

### Completion by Feature
- Planning & Documentation: 100% ✅
- Core Services (composable + service): 100% ✅
- UI Integration: 0% ⏳
- Visual Feedback: 0% ⏳
- DAG Integration: 0% ⏳
- Testing: 0% ⏳

**Overall**: 50% Complete

### Code Stats
- **Written**: ~410 lines (composable + service)
- **Remaining**: ~500 lines (UI + tests + CSS)
- **Total Estimated**: ~910 lines

### Time Spent
- Planning: 30 min
- Dependencies: 5 min
- useDragAndDrop: 45 min
- DragDropService: 45 min
- **Total**: ~2 hours

### Time Remaining
- UI Integration: 1 hour
- Visual Feedback: 1 hour
- DAG Integration: 30 min
- Testing: 1.5 hours
- **Total**: ~4 hours

---

## 🎯 Next Steps

### Immediate (Next 1 hour)
1. ✅ Update TaskCard.vue with drag-drop handlers
2. ✅ Add CSS classes for visual feedback
3. ✅ Test basic drag-drop functionality

### Short-term (Next 2 hours)
4. ✅ Integrate DAG visualization refresh
5. ✅ Write unit tests for useDragAndDrop
6. ✅ Write integration tests for dependency creation

### Final (Last 1 hour)
7. ✅ Manual testing with real tasks
8. ✅ Performance testing (60 FPS check)
9. ✅ Update completion report to 100%
10. ✅ Commit and close story

---

## 🐛 Known Issues

None yet (services not integrated into UI)

---

## 📝 Technical Notes

### Predecessor vs Successor Terminology
- **Predecessor**: Task that must finish first (dependency target)
- **Successor**: Task that depends on predecessor (dragged task)
- **Example**: Drag "Code Review" onto "Write Code"
  - Predecessor: "Write Code" (must finish first)
  - Successor: "Code Review" (depends on "Write Code")

### API Structure
```typescript
CreateTaskDependencyRequest {
  predecessorTaskUuid: string;  // Task B (drop target)
  successorTaskUuid: string;    // Task A (dragged task)
  dependencyType: DependencyType;
  lagDays?: number;
}
```

### Validation Response
```typescript
ValidateDependencyResponse {
  isValid: boolean;
  errors?: string[];
  wouldCreateCycle?: boolean;
  cyclePath?: string[];
  message?: string;
}
```

---

## 🔗 Related Stories

- ✅ STORY-022: Task Dependency Data Model (prerequisite)
- ✅ STORY-023: DAG Visualization (integration point)
- ✅ STORY-024: Dependency Validation (used by service)
- ✅ STORY-025: Critical Path Analysis (updated after drag-drop)

---

**Report Created**: 2024-10-23  
**Last Updated**: 2024-10-23  
**Status**: In Progress (50%)  
**Next Update**: After UI integration

---

## 🚀 Commit Summary

```
feat(web): init STORY-027 drag-drop foundation (50% complete)

📋 Planning & Architecture:
- Created STORY-UX-004-002.md (comprehensive planning document)

📦 Dependencies:
- Installed vue-draggable-plus for drag-drop functionality
- Installed @vueuse/core for composable utilities

🏗️ Core Services Implemented:
1. useDragAndDrop Composable (220 lines)
2. TaskDependencyDragDropService (190 lines)

📊 Progress:
- STORY-027: 0% → 50% (2 SP)

Related: STORY-027, Epic UX-004
```
