# Sprint 2b STORY-011: Enhanced DAG Features & Testing

## Story Overview

**Story Points**: 2 SP  
**Duration**: 1 Day  
**Status**: In Progress  
**Dependencies**: STORY-010 Complete ✅

## Objectives

1. Responsive layout adaptation
2. Unit test coverage (≥ 80%)
3. E2E test coverage (Happy Path)
4. Component documentation

## Tasks Breakdown

### Task 1: Responsive Layout Adaptation (2h)

**Goal**: Chart adapts to window resize while maintaining node relationships

**Implementation**:

```typescript
// GoalDAGVisualization.vue

import { useResizeObserver } from '@vueuse/core';

const containerRef = ref<HTMLElement>();
const containerSize = ref({ width: 800, height: 600 });

// Watch container size changes
useResizeObserver(containerRef, (entries) => {
  const entry = entries[0];
  const { width, height } = entry.contentRect;

  containerSize.value = { width, height };

  // Recalculate hierarchical layout positions
  if (layoutType.value === 'hierarchical') {
    recalculateHierarchicalPositions(width, height);
  }
});

// Recalculate positions maintaining relative ratios
const recalculateHierarchicalPositions = (newWidth: number, newHeight: number) => {
  const savedLayout = loadLayout(props.goalUuid);
  if (!savedLayout) return;

  // Get original container size
  const originalWidth = 800;
  const originalHeight = 600;

  // Scale factors
  const scaleX = newWidth / originalWidth;
  const scaleY = newHeight / originalHeight;

  // Update node positions
  savedLayout.forEach((node: any) => {
    node.x = node.x * scaleX;
    node.y = node.y * scaleY;
  });

  saveLayout(props.goalUuid, savedLayout);
};
```

**Acceptance Criteria**:

- [ ] Window resize triggers layout recalculation
- [ ] Node relative positions maintained
- [ ] Chart fills container width
- [ ] Minimum size: 600x400px
- [ ] Maximum size: unbounded (responsive)

---

### Task 2: Unit Tests (4h)

**Framework**: Vitest + Vue Test Utils

**Test File**: `GoalDAGVisualization.spec.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import GoalDAGVisualization from './GoalDAGVisualization.vue';
import { useGoal } from '../../composables/useGoal';

// Mock ECharts
vi.mock('vue-echarts', () => ({
  default: {
    name: 'VChart',
    template: '<div class="mock-chart"></div>',
  },
}));

// Mock composable
vi.mock('../../composables/useGoal');

describe('GoalDAGVisualization', () => {
  beforeEach(() => {
    setActivePinia(createPinia());

    // Mock useGoal return value
    vi.mocked(useGoal).mockReturnValue({
      currentGoal: ref({
        uuid: 'goal-1',
        title: 'Test Goal',
        keyResults: [
          { uuid: 'kr-1', title: 'KR 1', weight: 40 },
          { uuid: 'kr-2', title: 'KR 2', weight: 60 },
        ],
      }),
      isLoading: ref(false),
      fetchGoal: vi.fn(),
    });
  });

  it('renders chart when goal has keyResults', () => {
    const wrapper = mount(GoalDAGVisualization, {
      props: { goalUuid: 'goal-1' },
    });

    expect(wrapper.find('.mock-chart').exists()).toBe(true);
  });

  it('shows empty state when no keyResults', () => {
    vi.mocked(useGoal).mockReturnValue({
      currentGoal: ref({
        uuid: 'goal-1',
        title: 'Empty Goal',
        keyResults: [],
      }),
      isLoading: ref(false),
      fetchGoal: vi.fn(),
    });

    const wrapper = mount(GoalDAGVisualization, {
      props: { goalUuid: 'goal-1' },
    });

    expect(wrapper.text()).toContain('该 Goal 暂无 KeyResult');
  });

  it('shows warning when weight sum !== 100', () => {
    vi.mocked(useGoal).mockReturnValue({
      currentGoal: ref({
        uuid: 'goal-1',
        title: 'Test Goal',
        keyResults: [
          { uuid: 'kr-1', title: 'KR 1', weight: 30 },
          { uuid: 'kr-2', title: 'KR 2', weight: 50 }, // Total: 80%
        ],
      }),
      isLoading: ref(false),
      fetchGoal: vi.fn(),
    });

    const wrapper = mount(GoalDAGVisualization, {
      props: { goalUuid: 'goal-1' },
    });

    expect(wrapper.text()).toContain('权重总和: 80%');
    expect(wrapper.text()).toContain('权重分配异常');
  });

  it('toggles layout type', async () => {
    const wrapper = mount(GoalDAGVisualization, {
      props: { goalUuid: 'goal-1' },
    });

    // Find layout toggle buttons
    const buttons = wrapper.findAll('[value="hierarchical"]');
    await buttons[0].trigger('click');

    // Check localStorage was updated
    expect(localStorage.getItem('dag-layout-type')).toBe('hierarchical');
  });

  it('saves layout to localStorage on reset', async () => {
    const wrapper = mount(GoalDAGVisualization, {
      props: { goalUuid: 'goal-1' },
    });

    // Simulate custom layout
    localStorage.setItem('dag-layout-goal-1', JSON.stringify([{ id: 'kr-1', x: 100, y: 200 }]));

    // Click reset button
    const resetBtn = wrapper.find('[icon="mdi-refresh"]');
    await resetBtn.trigger('click');

    expect(localStorage.getItem('dag-layout-goal-1')).toBeNull();
  });

  it('emits node-click event', async () => {
    const wrapper = mount(GoalDAGVisualization, {
      props: { goalUuid: 'goal-1' },
    });

    // Simulate chart click
    wrapper.vm.handleNodeClick({
      dataType: 'node',
      data: { id: 'kr-1', category: 1 },
    });

    expect(wrapper.emitted('node-click')).toBeTruthy();
    expect(wrapper.emitted('node-click')[0]).toEqual([{ id: 'kr-1', type: 'kr' }]);
  });

  describe('Color Mapping', () => {
    it('returns green for high weight (>= 70%)', () => {
      const wrapper = mount(GoalDAGVisualization, {
        props: { goalUuid: 'goal-1' },
      });

      expect(wrapper.vm.getWeightColor(80)).toBe('#4CAF50');
    });

    it('returns orange for medium weight (30-70%)', () => {
      const wrapper = mount(GoalDAGVisualization, {
        props: { goalUuid: 'goal-1' },
      });

      expect(wrapper.vm.getWeightColor(50)).toBe('#FF9800');
    });

    it('returns red for low weight (< 30%)', () => {
      const wrapper = mount(GoalDAGVisualization, {
        props: { goalUuid: 'goal-1' },
      });

      expect(wrapper.vm.getWeightColor(20)).toBe('#F44336');
    });
  });

  describe('Layout Calculations', () => {
    it('calculates hierarchical layout correctly', () => {
      const wrapper = mount(GoalDAGVisualization, {
        props: { goalUuid: 'goal-1' },
      });

      const layout = wrapper.vm.calculateHierarchicalLayout();

      expect(layout.nodes).toHaveLength(3); // 1 goal + 2 KRs
      expect(layout.nodes[0].y).toBe(100); // Goal at top
      expect(layout.nodes[1].y).toBe(300); // KR at bottom
      expect(layout.links).toHaveLength(2); // 2 edges
    });

    it('distributes KRs evenly in hierarchical layout', () => {
      vi.mocked(useGoal).mockReturnValue({
        currentGoal: ref({
          uuid: 'goal-1',
          title: 'Test Goal',
          keyResults: [
            { uuid: 'kr-1', title: 'KR 1', weight: 33 },
            { uuid: 'kr-2', title: 'KR 2', weight: 33 },
            { uuid: 'kr-3', title: 'KR 3', weight: 34 },
          ],
        }),
        isLoading: ref(false),
        fetchGoal: vi.fn(),
      });

      const wrapper = mount(GoalDAGVisualization, {
        props: { goalUuid: 'goal-1' },
      });

      const layout = wrapper.vm.calculateHierarchicalLayout();

      // Check X positions are evenly spaced
      const krNodes = layout.nodes.filter((n) => n.category === 1);
      const spacing = krNodes[1].x - krNodes[0].x;
      expect(krNodes[2].x - krNodes[1].x).toBeCloseTo(spacing, 1);
    });
  });
});
```

**Coverage Target**: ≥ 80%

---

### Task 3: E2E Tests (2h)

**Framework**: Playwright

**Test File**: `dag-visualization.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('DAG Visualization', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to goal detail page
    await page.goto('/goals/test-goal-1');

    // Click "权重关系图" tab
    await page.click('text=权重关系图');
    await page.waitForSelector('.goal-dag-visualization', { timeout: 5000 });
  });

  test('should display DAG visualization', async ({ page }) => {
    // Check chart exists
    const chart = page.locator('.chart');
    await expect(chart).toBeVisible();

    // Check goal node
    await expect(page.locator('text=Test Goal')).toBeVisible();

    // Check KR nodes
    await expect(page.locator('text=KR 1')).toBeVisible();
    await expect(page.locator('text=KR 2')).toBeVisible();
  });

  test('should toggle between layouts', async ({ page }) => {
    // Initial state: force layout
    await expect(page.locator('[value="force"][aria-pressed="true"]')).toBeVisible();

    // Switch to hierarchical
    await page.click('text=分层');
    await page.waitForTimeout(1100); // Wait for animation

    // Check state changed
    await expect(page.locator('[value="hierarchical"][aria-pressed="true"]')).toBeVisible();

    // Check localStorage
    const layoutType = await page.evaluate(() => localStorage.getItem('dag-layout-type'));
    expect(layoutType).toBe('hierarchical');
  });

  test('should show weight warning for invalid total', async ({ page }) => {
    // Assuming test data has invalid weights
    const warning = page.locator('text=权重分配异常');
    await expect(warning).toBeVisible();

    // Check weight chip shows non-100%
    const weightChip = page.locator('.v-chip:has-text("权重总和")');
    await expect(weightChip).toContainText('%');
    await expect(weightChip).not.toContainText('100%');
  });

  test('should reset layout', async ({ page }) => {
    // Save custom layout first
    await page.evaluate(() => {
      localStorage.setItem(
        'dag-layout-test-goal-1',
        JSON.stringify([{ id: 'kr-1', x: 100, y: 200 }]),
      );
    });

    // Reload page
    await page.reload();
    await page.click('text=权重关系图');

    // Click reset button
    await page.click('[aria-label="重置布局"]');

    // Check localStorage cleared
    const layout = await page.evaluate(() => localStorage.getItem('dag-layout-test-goal-1'));
    expect(layout).toBeNull();
  });

  test('should click node and switch tabs', async ({ page }) => {
    // Click a KR node (requires chart interaction API)
    // This is complex with ECharts - may need to simulate event
    await page.evaluate(() => {
      const event = new CustomEvent('node-click', {
        detail: { id: 'kr-1', type: 'kr' },
      });
      document.querySelector('.goal-dag-visualization')?.dispatchEvent(event);
    });

    // Check active tab changed
    await expect(page.locator('[value="keyResults"][aria-selected="true"]')).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Get initial size
    const initialWidth = await page.locator('.chart').evaluate((el) => el.clientWidth);

    // Resize viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);

    // Check chart resized
    const newWidth = await page.locator('.chart').evaluate((el) => el.clientWidth);
    expect(newWidth).toBeGreaterThan(initialWidth);
  });

  test('should save layout preference', async ({ page }) => {
    // Switch to hierarchical
    await page.click('text=分层');

    // Reload page
    await page.reload();
    await page.click('text=权重关系图');

    // Check preference restored
    await expect(page.locator('[value="hierarchical"][aria-pressed="true"]')).toBeVisible();
  });
});
```

---

### Task 4: Component Documentation (1h)

**File**: `GoalDAGVisualization.md`

````markdown
# GoalDAGVisualization Component

## Overview

A Vue 3 component that visualizes Goal-KeyResult relationships as a Directed Acyclic Graph (DAG) using ECharts.

## Features

- **Dual Layout Algorithms**: Force-directed & Hierarchical
- **Weight Visualization**: Node size and edge width map to KR weights
- **Interactive**: Drag, zoom, pan, click events
- **Layout Persistence**: Saves user-adjusted layouts to localStorage
- **Responsive**: Adapts to container size changes
- **State Management**: Loading, empty, and error states

## Usage

```vue
<template>
  <GoalDAGVisualization :goal-uuid="currentGoal.uuid" @node-click="handleNodeClick" />
</template>

<script setup>
import GoalDAGVisualization from '@/modules/goal/presentation/components/dag/GoalDAGVisualization.vue';

const handleNodeClick = (data) => {
  console.log('Clicked:', data.type, data.id);
};
</script>
```
````

## Props

| Prop       | Type     | Required | Description                   |
| ---------- | -------- | -------- | ----------------------------- |
| `goalUuid` | `string` | ✅       | UUID of the Goal to visualize |

## Events

| Event        | Payload                                | Description                   |
| ------------ | -------------------------------------- | ----------------------------- |
| `node-click` | `{ id: string, type: 'goal' \| 'kr' }` | Fired when user clicks a node |

## Slots

None

## Dependencies

- `echarts/core` (v5.5.1)
- `vue-echarts` (v7.0.3)
- `@vueuse/core` (optional, for responsive)

## ECharts Modules

```typescript
import { GraphChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
```

## Color Scheme

| Weight Range | Color  | Hex     |
| ------------ | ------ | ------- |
| 70-100%      | Green  | #4CAF50 |
| 30-70%       | Orange | #FF9800 |
| 0-30%        | Red    | #F44336 |
| Goal         | Blue   | #2196F3 |

## Layout Algorithms

### Force-Directed Layout

- **Best for**: Exploration, small graphs (< 50 nodes)
- **Parameters**:
  - `repulsion`: 300
  - `edgeLength`: [150, 250]
  - `layoutAnimation`: true
- **User Control**: Drag nodes, positions saved

### Hierarchical Layout

- **Best for**: Clear hierarchy, presentations
- **Levels**:
  - **Level 0** (Y=100): Goal node
  - **Level 1** (Y=300): KeyResult nodes
- **Spacing**: Evenly distributed on X-axis

## LocalStorage Keys

| Key                      | Value                       | Purpose                   |
| ------------------------ | --------------------------- | ------------------------- |
| `dag-layout-${goalUuid}` | `{ id, x, y }[]`            | Saved node positions      |
| `dag-layout-type`        | `'force' \| 'hierarchical'` | Last selected layout type |

## Computed Properties

- `hasKeyResults`: Boolean, true if Goal has KRs
- `totalWeight`: Number, sum of all KR weights
- `dagOption`: ECharts option object

## Methods

### Public

None (component is self-contained)

### Private

- `getWeightColor(weight: number): string` - Maps weight to color
- `calculateHierarchicalLayout()` - Computes hierarchical positions
- `calculateForceLayout()` - Prepares force layout data
- `saveLayout(goalUuid, positions)` - Persists layout
- `loadLayout(goalUuid)` - Retrieves saved layout
- `resetLayout()` - Clears custom layout
- `handleNodeClick(params)` - Processes node clicks

## Styling

```css
.dag-container {
  min-height: 600px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: rgba(0, 0, 0, 0.02);
}

.chart {
  height: 600px;
}
```

## Performance

- **Recommended**: < 100 nodes (smooth 60fps)
- **Acceptable**: 100-500 nodes (30-60fps)
- **Heavy**: > 500 nodes (requires optimization)

## Browser Support

| Browser | Version | Status  |
| ------- | ------- | ------- |
| Chrome  | 90+     | ✅ Full |
| Edge    | 90+     | ✅ Full |
| Firefox | 88+     | ✅ Full |
| Safari  | 14+     | ✅ Full |

## Accessibility

- Keyboard navigation: Limited (ECharts constraint)
- Screen readers: Chart content not accessible
- ARIA labels: Added to controls

## Known Issues

1. **ECharts touch events**: May conflict with mobile gestures
2. **Large graphs**: Performance degrades > 500 nodes
3. **Print mode**: Chart may not render correctly

## Roadmap

- [ ] Virtual scrolling for large graphs
- [ ] Export to PNG/SVG
- [ ] Minimap for navigation
- [ ] Timeline animation for weight changes
- [ ] Multi-goal comparison view

## Examples

See `apps/web/src/modules/goal/presentation/views/GoalDetailView.vue` for integration example.

## Testing

```bash
# Unit tests
pnpm test:run GoalDAGVisualization.spec.ts

# E2E tests
pnpm test:e2e dag-visualization.spec.ts
```

## License

MIT

---

**Last Updated**: 2024-10-22  
**Maintainer**: Goal Module Team

```

---

## Definition of Done

- [x] Responsive layout implementation
- [x] Unit tests ≥ 80% coverage
- [x] E2E Happy Path test
- [x] Component documentation
- [ ] Code review approved
- [ ] Tests passing in CI
- [ ] Documentation reviewed

---

**Created**: 2024-10-22
**Status**: Implementation Phase
**Assignee**: Dev Team
```
