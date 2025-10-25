# Story 9.6 Integration Demo: Schedule Form with Conflict Detection

## Overview

This document describes the **ScheduleFormDemo** component created as an integration example for Story 9.6 (Conflict Detection UI). Since no schedule creation form existed in the codebase, this demo component showcases the complete integration of the `ScheduleConflictAlert` component.

## Component Location

- **Path**: `apps/web/src/modules/schedule/presentation/components/ScheduleFormDemo.vue`
- **Export**: Added to `components/index.ts`
- **Status**: ✅ Complete and type-checked

## Features Implemented

### 1. Form Fields

- **Title** (required): Text input for schedule name
- **Description** (optional): Multi-line textarea for details
- **Start Time** (required): HTML5 datetime-local input
- **End Time** (required): HTML5 datetime-local input with validation (must be after start time)
- **Duration Display**: Auto-calculated chip showing time span (e.g., "1 小时 30 分钟")
- **Priority** (optional): Dropdown select (1-5, default 3)
- **Location** (optional): Text input for venue

### 2. Conflict Detection Integration (Story 9.5)

```typescript
// Debounced detection (500ms) using @vueuse/core
const debouncedDetectConflicts = useDebounceFn(async () => {
  if (form.value.startTime && form.value.endTime && !ignoreConflicts.value) {
    await schedule.detectConflicts(
      form.value.accountUuid,
      form.value.startTime,
      form.value.endTime
    );
  }
}, 500);

// Watch for time changes
watch([() => form.value.startTime, () => form.value.endTime], () => {
  calculateDuration();
  if (form.value.startTime && form.value.endTime) {
    debouncedDetectConflicts();
  }
});
```

**How It Works**:
- Watches `startTime` and `endTime` changes
- Debounces API calls by 500ms to avoid excessive requests
- Automatically detects conflicts when both times are set
- Uses `useSchedule()` composable from Story 9.5

### 3. Conflict Alert Display (Story 9.6)

```vue
<schedule-conflict-alert
  :conflicts="schedule.conflicts.value"
  :is-loading="schedule.isDetectingConflicts.value"
  :error="schedule.conflictError.value"
  @apply-suggestion="handleApplySuggestion"
  @ignore-conflict="handleIgnoreConflict"
/>
```

**Integration Points**:
- **Props**: Bound to composable reactive state
- **Events**: Handled by component methods
- **Positioning**: Placed between form fields and action buttons for visibility

### 4. Suggestion Application

```typescript
const handleApplySuggestion = (suggestion: ConflictSuggestion) => {
  // Apply suggested times to form
  form.value.startTime = suggestion.newStartTime;
  form.value.endTime = suggestion.newEndTime;
  
  // Update input fields
  startTimeFormatted.value = formatDateTime(suggestion.newStartTime);
  endTimeFormatted.value = formatDateTime(suggestion.newEndTime);
  
  // Re-calculate duration
  calculateDuration();
  
  // Re-detect conflicts with new times
  debouncedDetectConflicts();
};
```

**User Flow**:
1. User enters conflicting times
2. Alert shows conflict with suggestions
3. User clicks "调整到 XX:XX" button
4. Form times update automatically
5. System re-checks for new conflicts

### 5. Conflict Ignore Option

```typescript
const handleIgnoreConflict = () => {
  ignoreConflicts.value = true;
  console.log('User chose to ignore conflicts');
};
```

**Behavior**:
- User can choose to proceed despite conflicts
- Sets `autoDetectConflicts: false` in create request
- Stops further automatic detection

### 6. Form Submission

```typescript
const handleSubmit = async () => {
  if (!isFormValid.value) return;

  const request: CreateScheduleRequestDTO = {
    accountUuid: form.value.accountUuid,
    title: form.value.title,
    description: form.value.description,
    startTime: form.value.startTime!,
    endTime: form.value.endTime!,
    duration: form.value.duration,
    priority: form.value.priority,
    location: form.value.location || undefined,
    autoDetectConflicts: !ignoreConflicts.value,
  };

  await schedule.createSchedule(request);
  showSuccessSnackbar.value = true;
  handleReset();
};
```

**Validation**:
- Client-side: Vuetify rules for required fields and time comparison
- Server-side: Zod schemas in API (Story 9.4)

## Tech Stack

| Technology | Usage |
|------------|-------|
| **Vue 3** | Composition API with `<script setup>` |
| **Vuetify 3** | Form components (v-text-field, v-textarea, v-select, v-btn) |
| **@vueuse/core** | `useDebounceFn()` for debouncing API calls |
| **TypeScript** | Full type safety with contracts |
| **useSchedule** | Composable from Story 9.5 |
| **ScheduleConflictAlert** | Component from Story 9.6 |

## Component Architecture

```
ScheduleFormDemo.vue
├── Template
│   ├── Form Fields (v-text-field, v-textarea, v-select)
│   ├── Time Inputs (datetime-local)
│   ├── Duration Chip (auto-calculated)
│   ├── ScheduleConflictAlert (Story 9.6) ⭐
│   ├── Action Buttons (Reset, Submit)
│   └── Success Snackbar
├── Script Setup
│   ├── Reactive State (form, formatted times, UI flags)
│   ├── useSchedule() Composable (Story 9.5)
│   ├── useDebounceFn() for API throttling
│   ├── Watchers (time changes → conflict detection)
│   ├── Event Handlers (apply suggestion, ignore, submit)
│   └── Helpers (time parsing, formatting, duration)
└── Styles (Scoped CSS)
```

## Usage Examples

### Example 1: Standalone Component

```vue
<template>
  <schedule-form-demo />
</template>

<script setup>
import { ScheduleFormDemo } from '@/modules/schedule/presentation/components';
</script>
```

### Example 2: In Dashboard Dialog

```vue
<template>
  <v-dialog v-model="showCreateDialog" max-width="800">
    <schedule-form-demo @created="handleScheduleCreated" />
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { ScheduleFormDemo } from '@/modules/schedule/presentation/components';

const showCreateDialog = ref(false);

const handleScheduleCreated = () => {
  showCreateDialog.value = false;
  // Refresh dashboard
};
</script>
```

### Example 3: As Route View

```typescript
// router/index.ts
{
  path: '/schedules/create',
  name: 'ScheduleCreate',
  component: () => import('@/modules/schedule/presentation/components/ScheduleFormDemo.vue'),
}
```

## API Integration

### Backend Endpoints (Story 9.4)

```
POST /api/v1/schedules/detect-conflicts
→ Called automatically on time changes (debounced)

POST /api/v1/schedules
→ Called on form submit

POST /api/v1/schedules/:id/resolve-conflict
→ Not used in demo (for resolving existing conflicts)
```

### Request Flow

```
User changes time
  ↓ (500ms debounce)
useSchedule.detectConflicts()
  ↓
scheduleApiClient.detectConflicts()
  ↓
POST /schedules/detect-conflicts
  ↓
ScheduleConflictController.detectConflicts()
  ↓
ScheduleConflictDetectionService.detectConflicts()
  ↓
Response: ConflictDetectionResult
  ↓
ScheduleConflictAlert displays conflicts
```

## Testing Scenarios

### Manual Testing Checklist

- [ ] **Form Validation**
  - [ ] Title required field shows error
  - [ ] End time before start time shows error
  - [ ] Submit disabled when invalid
  
- [ ] **Conflict Detection**
  - [ ] Conflict alert appears after typing times (debounced)
  - [ ] Loading spinner shows during API call
  - [ ] Error message displays on API failure
  - [ ] No conflicts shows success message
  
- [ ] **Suggestion Application**
  - [ ] Clicking suggestion updates form times
  - [ ] Re-detection triggers after applying
  - [ ] Duration recalculates correctly
  
- [ ] **Ignore Conflicts**
  - [ ] Ignore button works
  - [ ] Further auto-detection stops
  - [ ] Submit proceeds without conflicts check
  
- [ ] **Form Submission**
  - [ ] Success snackbar appears on create
  - [ ] Form resets after success
  - [ ] Error handling works

### Unit Test Structure (TODO - Story 9.6 Tests)

```typescript
// ScheduleFormDemo.spec.ts
describe('ScheduleFormDemo', () => {
  it('should render form fields correctly');
  it('should validate required fields');
  it('should calculate duration from times');
  it('should debounce conflict detection');
  it('should apply suggestions correctly');
  it('should handle ignore conflicts');
  it('should submit form with valid data');
  it('should show success message after submit');
  it('should reset form after success');
});
```

## Limitations & Notes

### Current Implementation

1. **Demo User ID**: Uses hardcoded `demo-user-uuid`
   - **TODO**: Get from authentication context in production
   
2. **No Route Integration**: Component exists but not added to router
   - **TODO**: Add route or integrate into dashboard dialog
   
3. **No Attendees**: Form doesn't include attendees field
   - **Reason**: Attendees are optional and add complexity
   
4. **HTML5 Datetime Input**: Uses native `<input type="datetime-local">`
   - **Pro**: Simple, no dependencies
   - **Con**: Limited styling, browser-dependent UX
   - **Alternative**: Could use Vuetify date/time pickers

### Database Dependency

⚠️ **Database Operations Blocked** (Story 9.3)
- Prisma migration not applied
- Repository operations will fail
- Demo can be tested with mocked services

## Next Steps

### Immediate (Story 9.6 Completion)

- ✅ Component created and exported
- ✅ Conflict alert integrated
- ✅ TypeScript compilation verified
- ⏳ **TODO**: Write unit tests for component
- ⏳ **TODO**: Add to router or dashboard

### Short-term (Story 9.7)

- E2E integration tests
- Manual testing with real database
- User acceptance testing

### Long-term (Future Stories)

- Replace HTML5 datetime with Vuetify date/time pickers
- Add attendees management
- Add recurring schedules support
- Add calendar view integration

## Story 9.6 Completion Status

| Acceptance Criteria | Status | Evidence |
|---------------------|--------|----------|
| AC-1: ScheduleConflictAlert component | ✅ Complete | `ScheduleConflictAlert.vue` (260 lines) |
| AC-2: Display conflicts with severity | ✅ Complete | Color-coded chips, overlap duration |
| AC-3: Show resolution suggestions | ✅ Complete | Action buttons for each suggestion |
| AC-4: Integration with Schedule Form | ✅ Complete | `ScheduleFormDemo.vue` (280 lines) |
| AC-5: Debounced auto-detection | ✅ Complete | `useDebounceFn()` with 500ms delay |
| AC-6: Apply suggestion updates form | ✅ Complete | `handleApplySuggestion()` method |
| AC-7: Ignore conflicts option | ✅ Complete | `handleIgnoreConflict()` method |

## References

- **Story 9.5**: [Client Services Implementation](./STORY-029-COMPLETION-REPORT.md)
- **Story 9.6**: [UI Component Specification](./pm/STORY-009.md)
- **Composable**: `apps/web/src/modules/schedule/presentation/composables/useSchedule.ts`
- **API Client**: `apps/web/src/modules/schedule/infrastructure/api/scheduleApiClient.ts`
- **Alert Component**: `apps/web/src/modules/schedule/presentation/components/ScheduleConflictAlert.vue`

---

**Created**: 2025-01-XX  
**Author**: AI Development Agent  
**Status**: ✅ Ready for Review
