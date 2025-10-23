# STORY-026: Global Search & Command Palette

**Story Points**: 3 SP  
**Priority**: P0  
**Sprint**: Sprint 4 (2024-10-24 ~ 2024-11-07)  
**Category**: User Experience Enhancement  
**Status**: In Progress

---

## 📋 User Story

> **As a** user  
> **I want** a quick command palette to search and navigate anywhere in the app  
> **So that** I can improve my workflow efficiency and find items faster

---

## 🎯 Acceptance Criteria

### AC-1: Keyboard Shortcut
- ✅ AC-1.1: Global keyboard shortcut (Cmd+K on Mac, Ctrl+K on Windows/Linux) opens command palette
- ✅ AC-1.2: ESC key closes command palette
- ✅ AC-1.3: Shortcut works from any page in the application
- ✅ AC-1.4: No conflict with existing browser/app shortcuts

### AC-2: Search Functionality
- ✅ AC-2.1: Search across Goals, Tasks, and Reminders
- ✅ AC-2.2: Fuzzy matching algorithm (supports typos, partial matches)
- ✅ AC-2.3: Real-time search results as user types
- ✅ AC-2.4: Search by title, description, tags, status
- ✅ AC-2.5: Debounced search (300ms) to prevent excessive queries

### AC-3: Search Results Display
- ✅ AC-3.1: Show item type icon (Goal/Task/Reminder)
- ✅ AC-3.2: Highlight matching text
- ✅ AC-3.3: Display item status and metadata
- ✅ AC-3.4: Show result count and search time
- ✅ AC-3.5: Group results by type (Goals, Tasks, Reminders)

### AC-4: Navigation
- ✅ AC-4.1: Click result navigates to detail page
- ✅ AC-4.2: Arrow keys navigate through results
- ✅ AC-4.3: Enter key opens selected result
- ✅ AC-4.4: Close palette after navigation

### AC-5: Recent Items
- ✅ AC-5.1: Show recently accessed items when search is empty
- ✅ AC-5.2: Store last 10 accessed items per type
- ✅ AC-5.3: Persist to LocalStorage
- ✅ AC-5.4: Clear history button

### AC-6: Quick Actions
- ✅ AC-6.1: Create new Goal/Task/Reminder from palette
- ✅ AC-6.2: Type-ahead commands (e.g., ">create task")
- ✅ AC-6.3: Delete item from search results (with confirmation)
- ✅ AC-6.4: Mark task as complete from palette

### AC-7: Performance
- ✅ AC-7.1: Search completes in < 100ms for 1000 items
- ✅ AC-7.2: Palette opens in < 50ms
- ✅ AC-7.3: Smooth animations (60 FPS)
- ✅ AC-7.4: No memory leaks on repeated open/close

---

## 🎨 UI/UX Design

### Visual Design

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  🔍  Search or type a command...                      │
│                                                        │
├────────────────────────────────────────────────────────┤
│  📊 Goals (3)                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 🎯 Complete Project X            [Active] 80%   │ │
│  │    Due in 5 days · 12 tasks                      │ │
│  ├──────────────────────────────────────────────────┤ │
│  │ 🎯 Learn TypeScript              [Active] 40%   │ │
│  │    No deadline · 8 tasks                         │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ✅ Tasks (5)                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ ☑️ Review PR #123                 [Todo]         │ │
│  │    Project X · Due today                         │ │
│  ├──────────────────────────────────────────────────┤ │
│  │ ☑️ Write documentation            [In Progress]  │ │
│  │    Project X · Due tomorrow                      │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  🔔 Reminders (2)                                     │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 🔔 Team meeting                   [Scheduled]    │ │
│  │    Today at 3:00 PM                              │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
├────────────────────────────────────────────────────────┤
│  ↑↓ Navigate  ⏎ Open  ESC Close  ⌘K Dismiss         │
└────────────────────────────────────────────────────────┘
```

### Command Syntax

**Search Mode** (default):
- Type query: `typescript` → Search all items containing "typescript"
- Filter by type: `#goal typescript` → Search only goals
- Filter by status: `@active` → Show only active items

**Command Mode** (prefix with `>`):
- `>create goal` → Open create goal dialog
- `>create task` → Open create task dialog
- `>create reminder` → Open create reminder dialog
- `>settings` → Navigate to settings page
- `>help` → Show help dialog

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `ESC` | Close palette |
| `↑` / `↓` | Navigate results |
| `Enter` | Open selected result |
| `Cmd/Ctrl + Enter` | Open in new window (desktop) |
| `Cmd/Ctrl + Backspace` | Delete selected item |
| `Cmd/Ctrl + D` | Mark task complete |

---

## 🏗️ Technical Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    App.vue (Root)                       │
│  ┌────────────────────────────────────────────────┐    │
│  │        GlobalKeyboardListener                   │    │
│  │  - Listen for Cmd/Ctrl+K                       │    │
│  │  - Emit 'open-command-palette' event           │    │
│  └────────────────────────────────────────────────┘    │
│                         ↓                               │
│  ┌────────────────────────────────────────────────┐    │
│  │        CommandPalette.vue (Modal)               │    │
│  │  ┌──────────────────────────────────────────┐  │    │
│  │  │  SearchInput (v-text-field)              │  │    │
│  │  └──────────────────────────────────────────┘  │    │
│  │  ┌──────────────────────────────────────────┐  │    │
│  │  │  SearchResults (v-list)                  │  │    │
│  │  │  - GoalSearchResult                      │  │    │
│  │  │  - TaskSearchResult                      │  │    │
│  │  │  - ReminderSearchResult                  │  │    │
│  │  └──────────────────────────────────────────┘  │    │
│  │  ┌──────────────────────────────────────────┐  │    │
│  │  │  RecentItems (when search empty)         │  │    │
│  │  └──────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│           GlobalSearchService (Singleton)               │
│  ┌────────────────────────────────────────────────┐    │
│  │  search(query: string): Promise<SearchResult[]>│    │
│  │  - Query goalService.getAll()                  │    │
│  │  - Query taskService.getAll()                  │    │
│  │  - Query reminderService.getAll()              │    │
│  │  - Apply fuzzy matching                        │    │
│  │  - Sort by relevance                           │    │
│  └────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────┐    │
│  │  getRecentItems(): RecentItem[]                │    │
│  │  addRecentItem(item): void                     │    │
│  │  clearRecentItems(): void                      │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│              FuzzySearchEngine                          │
│  - Levenshtein distance algorithm                       │
│  - Token-based matching                                 │
│  - Score normalization (0-100)                          │
│  - Configurable threshold (default: 60)                 │
└─────────────────────────────────────────────────────────┘
```

### Data Structures

#### SearchResult Interface
```typescript
export interface SearchResult {
  id: string;
  type: 'goal' | 'task' | 'reminder';
  title: string;
  description?: string;
  status: string;
  metadata: SearchResultMetadata;
  score: number; // Relevance score (0-100)
  matches: TextMatch[]; // Highlighted segments
}

export interface SearchResultMetadata {
  // Goal metadata
  progress?: number;
  dueDate?: string;
  taskCount?: number;
  
  // Task metadata
  goalTitle?: string;
  estimatedMinutes?: number;
  
  // Reminder metadata
  scheduledTime?: string;
  recurrence?: string;
}

export interface TextMatch {
  start: number;
  end: number;
  field: 'title' | 'description' | 'tags';
}
```

#### RecentItem Interface
```typescript
export interface RecentItem {
  id: string;
  type: 'goal' | 'task' | 'reminder';
  title: string;
  accessedAt: number; // Timestamp
  url: string; // Navigation path
}

export interface RecentItemsStorage {
  goals: RecentItem[];
  tasks: RecentItem[];
  reminders: RecentItem[];
}
```

#### Command Interface
```typescript
export interface Command {
  id: string;
  label: string;
  description: string;
  icon: string;
  handler: () => void | Promise<void>;
  keywords: string[]; // For fuzzy matching
  category: 'create' | 'navigate' | 'action';
}
```

### Fuzzy Search Algorithm

**Algorithm**: Levenshtein Distance + Token Matching

**Pseudocode**:
```typescript
function fuzzyMatch(query: string, target: string): number {
  // Step 1: Normalize strings
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  
  // Step 2: Exact match (100 score)
  if (t.includes(q)) {
    return 100;
  }
  
  // Step 3: Token-based matching
  const queryTokens = q.split(/\s+/);
  const targetTokens = t.split(/\s+/);
  
  let tokenScore = 0;
  for (const qToken of queryTokens) {
    for (const tToken of targetTokens) {
      // Levenshtein distance
      const distance = levenshtein(qToken, tToken);
      const maxLen = Math.max(qToken.length, tToken.length);
      const similarity = (maxLen - distance) / maxLen;
      tokenScore = Math.max(tokenScore, similarity * 100);
    }
  }
  
  // Step 4: Acronym matching (e.g., "cpt" matches "Create Project Task")
  const acronym = targetTokens.map(t => t[0]).join('');
  if (acronym === q) {
    return 90;
  }
  
  return tokenScore;
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}
```

### Search Optimization

**Indexing Strategy**:
1. **Build Search Index** on app initialization
   - Extract searchable fields (title, description, tags)
   - Store in Map for O(1) lookup
2. **Incremental Updates** on item changes
   - Add to index on create
   - Update index on edit
   - Remove from index on delete
3. **Cached Results** with TTL (Time To Live)
   - Cache last 10 queries for 5 minutes
   - Invalidate on data changes

**Performance Targets**:
- Index build: < 50ms for 1000 items
- Search: < 100ms for any query
- Memory: < 5MB for index

---

## 🛠️ Implementation Tasks

### Task 1: GlobalSearchService (2 hours)

**File**: `apps/web/src/shared/services/GlobalSearchService.ts`

**Implementation**:
```typescript
import { goalService } from '@/modules/goal/application/services/goalService';
import { taskService } from '@/modules/task/application/services/taskService';
import { reminderService } from '@/modules/reminder/application/services/reminderService';

export class GlobalSearchService {
  private searchIndex: Map<string, SearchResult> = new Map();
  private recentItems: RecentItemsStorage = {
    goals: [],
    tasks: [],
    reminders: [],
  };

  constructor() {
    this.loadRecentItems();
  }

  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    // Search Goals
    const goals = await goalService.getAll();
    results.push(...this.searchInGoals(goals, query));
    
    // Search Tasks
    const tasks = await taskService.getAll();
    results.push(...this.searchInTasks(tasks, query));
    
    // Search Reminders
    const reminders = await reminderService.getAll();
    results.push(...this.searchInReminders(reminders, query));
    
    // Filter by type if specified
    if (options?.type) {
      return results.filter(r => r.type === options.type);
    }
    
    // Sort by relevance score
    return results
      .filter(r => r.score >= (options?.threshold || 60))
      .sort((a, b) => b.score - a.score);
  }

  addRecentItem(item: RecentItem): void {
    const list = this.recentItems[`${item.type}s` as keyof RecentItemsStorage];
    
    // Remove if already exists
    const index = list.findIndex(i => i.id === item.id);
    if (index >= 0) {
      list.splice(index, 1);
    }
    
    // Add to beginning
    list.unshift(item);
    
    // Keep only last 10
    if (list.length > 10) {
      list.pop();
    }
    
    this.saveRecentItems();
  }

  getRecentItems(): RecentItem[] {
    return [
      ...this.recentItems.goals,
      ...this.recentItems.tasks,
      ...this.recentItems.reminders,
    ].sort((a, b) => b.accessedAt - a.accessedAt);
  }

  private searchInGoals(goals: GoalClientDTO[], query: string): SearchResult[] {
    return goals.map(goal => ({
      id: goal.uuid,
      type: 'goal' as const,
      title: goal.title,
      description: goal.description,
      status: goal.status,
      metadata: {
        progress: goal.completionPercentage,
        dueDate: goal.targetDate,
        taskCount: goal.taskCount,
      },
      score: this.calculateScore(query, goal.title, goal.description, goal.tags),
      matches: this.findMatches(query, goal.title, goal.description),
    })).filter(r => r.score > 0);
  }

  private calculateScore(
    query: string,
    title: string,
    description?: string,
    tags?: string[]
  ): number {
    const titleScore = fuzzyMatch(query, title) * 1.0;
    const descScore = description ? fuzzyMatch(query, description) * 0.5 : 0;
    const tagsScore = tags?.some(t => fuzzyMatch(query, t) > 80) ? 20 : 0;
    
    return Math.min(100, titleScore + descScore + tagsScore);
  }

  private loadRecentItems(): void {
    const stored = localStorage.getItem('command-palette-recent-items');
    if (stored) {
      this.recentItems = JSON.parse(stored);
    }
  }

  private saveRecentItems(): void {
    localStorage.setItem(
      'command-palette-recent-items',
      JSON.stringify(this.recentItems)
    );
  }
}

export const globalSearchService = new GlobalSearchService();
```

### Task 2: FuzzySearchEngine (1.5 hours)

**File**: `apps/web/src/shared/utils/fuzzySearch.ts`

**Implementation**:
- Levenshtein distance algorithm
- Token-based matching
- Acronym detection
- Score normalization

### Task 3: CommandPalette.vue (3 hours)

**File**: `apps/web/src/shared/components/command-palette/CommandPalette.vue`

**Features**:
- v-dialog with overlay
- v-text-field for search input
- v-list for results
- Keyboard navigation
- Result grouping by type
- Recent items display
- Loading state

### Task 4: Keyboard Shortcut System (1 hour)

**File**: `apps/web/src/shared/composables/useKeyboardShortcuts.ts`

**Implementation**:
```typescript
export function useKeyboardShortcuts() {
  const registerShortcut = (
    key: string,
    modifiers: { ctrl?: boolean; meta?: boolean; shift?: boolean },
    handler: () => void
  ) => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMatch =
        event.key.toLowerCase() === key.toLowerCase() &&
        event.ctrlKey === !!modifiers.ctrl &&
        event.metaKey === !!modifiers.meta &&
        event.shiftKey === !!modifiers.shift;

      if (isMatch) {
        event.preventDefault();
        handler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Return cleanup function
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  };

  return { registerShortcut };
}
```

### Task 5: Integration (1 hour)

**File**: `apps/web/src/App.vue`

**Changes**:
- Import CommandPalette component
- Add to template
- Register global keyboard shortcut
- Handle open/close events

---

## 📊 Testing Strategy

### Unit Tests

**GlobalSearchService.spec.ts**:
- ✅ Test search across all types
- ✅ Test fuzzy matching accuracy
- ✅ Test score calculation
- ✅ Test result sorting
- ✅ Test recent items management
- ✅ Test LocalStorage persistence

**fuzzySearch.spec.ts**:
- ✅ Test exact match (score = 100)
- ✅ Test partial match
- ✅ Test typo tolerance (1-2 char difference)
- ✅ Test acronym matching
- ✅ Test Levenshtein distance calculation

**CommandPalette.spec.ts**:
- ✅ Test keyboard shortcut trigger
- ✅ Test search input debounce
- ✅ Test keyboard navigation (up/down/enter)
- ✅ Test result rendering
- ✅ Test recent items display

### Integration Tests

**E2E Scenarios**:
1. Open palette with Cmd+K
2. Type search query
3. Navigate results with arrow keys
4. Press Enter to open item
5. Verify navigation to detail page

### Performance Tests

**Benchmark**:
```typescript
describe('Performance', () => {
  it('should complete search in < 100ms for 1000 items', async () => {
    const start = performance.now();
    await globalSearchService.search('test');
    const end = performance.now();
    expect(end - start).toBeLessThan(100);
  });
});
```

---

## 🚀 Success Metrics

### User Engagement
- **Goal**: 80% of users use command palette at least once per session
- **Metric**: Track palette open count

### Performance
- **Goal**: < 100ms search time for 1000 items
- **Metric**: Performance timing API

### Usability
- **Goal**: 90% of searches return relevant results
- **Metric**: Click-through rate on search results

---

## 📦 Dependencies

### Required Stories
- None (standalone feature)

### Technical Dependencies
- Vue 3 Composition API
- Vue Router (for navigation)
- Vuetify 3 (v-dialog, v-text-field, v-list)
- LocalStorage API

---

## 🔗 Related Stories

- STORY-027: Drag & Drop (can trigger from command palette)
- STORY-028: Dark Mode (palette respects theme)
- Future: AI-powered search suggestions

---

## 📚 References

### Similar Implementations
- VS Code Command Palette
- Slack Quick Switcher
- Notion Quick Find
- Linear Command Palette

### Libraries
- [Fuse.js](https://fusejs.io/) - Fuzzy search library (optional, can implement custom)
- [Mousetrap](https://craig.is/killing/mice) - Keyboard shortcuts (optional)

### Algorithms
- [Levenshtein Distance](https://en.wikipedia.org/wiki/Levenshtein_distance)
- [Damerau-Levenshtein Distance](https://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance)
- [TF-IDF](https://en.wikipedia.org/wiki/Tf%E2%80%93idf) for relevance scoring

---

**Planning Completed**: 2024-10-23  
**Estimated Implementation Time**: 8-10 hours
