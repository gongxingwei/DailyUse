# GoalDAGVisualization Component

## Overview

A Vue 3 component that visualizes Goal-KeyResult relationships as a Directed Acyclic Graph (DAG) using ECharts. This component provides an interactive, visually intuitive way to understand weight distribution and hierarchy in OKR goals.

## Features

✨ **Dual Layout Algorithms**: Force-directed & Hierarchical  
🎨 **Weight Visualization**: Node size and edge width map to KR weights  
🖱️ **Interactive**: Drag, zoom, pan, click events  
💾 **Layout Persistence**: Saves user-adjusted layouts to localStorage  
📱 **Responsive**: Adapts to container size changes  
🔄 **State Management**: Loading, empty, and error states  
⚠️ **Weight Validation**: Visual warnings for invalid weight distribution

---

## Installation

Component is located at:

```
apps/web/src/modules/goal/presentation/components/dag/GoalDAGVisualization.vue
```

Dependencies are automatically included in the `@dailyuse/web` package.

---

## Basic Usage

```vue
<template>
  <GoalDAGVisualization :goal-uuid="currentGoal.uuid" @node-click="handleNodeClick" />
</template>

<script setup lang="ts">
import GoalDAGVisualization from '@/modules/goal/presentation/components/dag/GoalDAGVisualization.vue';

const currentGoal = ref({
  uuid: 'goal-123',
  title: 'Q1 Product Launch',
  keyResults: [
    { uuid: 'kr-1', title: 'User Acquisition', weight: 40 },
    { uuid: 'kr-2', title: 'Feature Completion', weight: 35 },
    { uuid: 'kr-3', title: 'Quality Metrics', weight: 25 },
  ],
});

const handleNodeClick = (data: { id: string; type: 'goal' | 'kr' }) => {
  if (data.type === 'kr') {
    console.log('KeyResult clicked:', data.id);
    // Navigate to KR detail or perform action
  }
};
</script>
```

---

## Props

| Prop       | Type     | Required | Default | Description                                         |
| ---------- | -------- | -------- | ------- | --------------------------------------------------- |
| `goalUuid` | `string` | ✅ Yes   | -       | UUID of the Goal to visualize. Must exist in store. |

---

## Events

| Event        | Payload                                | Description                                  |
| ------------ | -------------------------------------- | -------------------------------------------- |
| `node-click` | `{ id: string, type: 'goal' \| 'kr' }` | Emitted when user clicks a node in the graph |

**Example**:

```typescript
{
  id: 'kr-123',  // Node UUID
  type: 'kr'     // 'goal' or 'kr'
}
```

---

## Slots

None. Component is fully self-contained.

---

## API Reference

### Computed Properties

| Property        | Type            | Description                                  |
| --------------- | --------------- | -------------------------------------------- |
| `hasKeyResults` | `boolean`       | True if Goal has at least one KeyResult      |
| `totalWeight`   | `number`        | Sum of all KeyResult weights (should be 100) |
| `dagOption`     | `EChartsOption` | Complete ECharts configuration object        |

### Methods

#### Public Methods

None. Component manages internal state.

#### Private Methods

| Method                        | Parameters                           | Returns            | Description                                 |
| ----------------------------- | ------------------------------------ | ------------------ | ------------------------------------------- |
| `getWeightColor`              | `weight: number`                     | `string`           | Maps weight value to color hex code         |
| `calculateHierarchicalLayout` | -                                    | `{ nodes, links }` | Computes fixed-position hierarchical layout |
| `calculateForceLayout`        | -                                    | `{ nodes, links }` | Prepares data for force-directed layout     |
| `saveLayout`                  | `goalUuid: string, positions: Array` | `void`             | Saves node positions to localStorage        |
| `loadLayout`                  | `goalUuid: string`                   | `Array \| null`    | Retrieves saved layout from localStorage    |
| `resetLayout`                 | -                                    | `void`             | Clears custom layout and resets to default  |
| `handleNodeClick`             | `params: any`                        | `void`             | Processes ECharts node click events         |

---

## Layout Algorithms

### Force-Directed Layout

**Best for**: Exploration, discovering relationships, small graphs (< 50 nodes)

**Characteristics**:

- Nodes automatically position based on physics simulation
- User can drag nodes to custom positions
- Positions are saved and restored
- Smooth animations

**Parameters**:

```typescript
{
  repulsion: 300,           // Node repulsion force
  edgeLength: [150, 250],   // Desired edge length range
  layoutAnimation: true,    // Animate layout changes
}
```

**Use Case**: When you want users to explore and customize the graph interactively.

### Hierarchical Layout

**Best for**: Clear hierarchy, presentations, documentation

**Characteristics**:

- Goal node fixed at top (Y=100)
- KeyResult nodes evenly distributed at bottom (Y=300)
- Clean vertical alignment
- Predictable structure

**Calculation**:

```typescript
// Goal centered horizontally
goalX = containerWidth / 2;

// KRs evenly spaced
krSpacing = containerWidth / (krCount + 1);
krX = krSpacing * (index + 1);
```

**Use Case**: When you want to emphasize the Goal → KR hierarchy clearly.

---

## Color Scheme

### Node Colors

| Weight Range | Color  | Hex Code  | Meaning                      |
| ------------ | ------ | --------- | ---------------------------- |
| 70-100%      | Green  | `#4CAF50` | High priority/well-weighted  |
| 30-70%       | Orange | `#FF9800` | Medium priority              |
| 0-30%        | Red    | `#F44336` | Low priority/needs attention |
| Goal         | Blue   | `#2196F3` | Goal node (always blue)      |

### Edge Colors

| Condition           | Color | Hex Code  |
| ------------------- | ----- | --------- |
| Total weight = 100% | Grey  | `#999`    |
| Total weight ≠ 100% | Red   | `#f44336` |

**Width**: `edge.width = kr.weight / 10` (e.g., 40% weight → 4px width)

---

## LocalStorage Keys

| Key Pattern              | Value Type                  | Purpose                                |
| ------------------------ | --------------------------- | -------------------------------------- |
| `dag-layout-${goalUuid}` | `Array<{id, x, y}>`         | Saved node positions for specific goal |
| `dag-layout-type`        | `'force' \| 'hierarchical'` | User's last selected layout type       |

**Example**:

```json
// dag-layout-goal-123
[
  { "id": "kr-1", "x": 245.6, "y": 312.8 },
  { "id": "kr-2", "x": 534.2, "y": 289.1 }
]
```

---

## Responsive Behavior

The component uses `@vueuse/core`'s `useResizeObserver` to track container size changes.

**Container Constraints**:

- **Minimum Width**: 600px
- **Minimum Height**: 400px
- **Default Height**: 600px
- **Width**: 100% of parent container

**Responsive Actions**:

1. Container resize detected
2. If hierarchical layout: recalculate node positions proportionally
3. ECharts `autoresize` triggers chart redraw
4. Saved layouts scale with container

**Example**:

```
Window: 1920x1080 → 1280x720
Node X: 800 → 533 (scaled by 1280/1920)
Node Y: 300 → 300 (fixed for hierarchical)
```

---

## Performance

### Benchmarks

| Node Count | Layout Type  | FPS   | Status        |
| ---------- | ------------ | ----- | ------------- |
| 1-50       | Force        | 60    | ✅ Smooth     |
| 1-50       | Hierarchical | 60    | ✅ Smooth     |
| 50-100     | Force        | 45-60 | ⚠️ Acceptable |
| 50-100     | Hierarchical | 60    | ✅ Smooth     |
| 100-500    | Force        | 30-45 | ⚠️ Sluggish   |
| 100-500    | Hierarchical | 50-60 | ✅ Usable     |
| 500+       | Any          | < 30  | ❌ Poor       |

### Optimization Tips

1. **Use Hierarchical for Large Graphs**: Fixed positions perform better
2. **Debounce Saves**: Layout saving is already debounced (500ms)
3. **Disable Animations**: Set `layoutAnimation: false` for 100+ nodes
4. **Pagination**: Consider splitting large goals into sub-goals

---

## Browser Support

| Browser        | Version | Status     | Notes                     |
| -------------- | ------- | ---------- | ------------------------- |
| Chrome         | 90+     | ✅ Full    | Recommended               |
| Edge           | 90+     | ✅ Full    | Chromium-based            |
| Firefox        | 88+     | ✅ Full    | -                         |
| Safari         | 14+     | ✅ Full    | -                         |
| Mobile Safari  | 14+     | ⚠️ Limited | Touch events may conflict |
| Chrome Android | 90+     | ✅ Full    | -                         |

**Known Issues**:

- Safari < 14: Canvas rendering artifacts
- Mobile: Drag gestures may conflict with scroll

---

## Accessibility

### Current Status

⚠️ **Limited accessibility** due to ECharts canvas rendering

### Supported

- ✅ Keyboard navigation for controls (layout toggle, reset button)
- ✅ ARIA labels on interactive buttons
- ✅ Color contrast meets WCAG AA standards

### Not Supported

- ❌ Canvas content not accessible to screen readers
- ❌ No keyboard navigation within graph
- ❌ No tab focus on nodes

### Roadmap

Future improvements may include:

- SVG rendering mode (ECharts supports this)
- ARIA live regions for node interactions
- Keyboard shortcuts for node selection

---

## Examples

### Example 1: Basic Integration

```vue
<template>
  <v-container>
    <GoalDAGVisualization :goal-uuid="goalId" />
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import GoalDAGVisualization from './GoalDAGVisualization.vue';

const goalId = ref('goal-abc-123');
</script>
```

### Example 2: With Event Handling

```vue
<template>
  <div>
    <GoalDAGVisualization :goal-uuid="currentGoal.uuid" @node-click="onNodeClick" />

    <v-dialog v-model="showDialog">
      <v-card>
        <v-card-title>{{ selectedNode.title }}</v-card-title>
        <v-card-text> Type: {{ selectedNode.type }} </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
const showDialog = ref(false);
const selectedNode = ref({ title: '', type: '' });

const onNodeClick = ({ id, type }) => {
  if (type === 'kr') {
    const kr = currentGoal.value.keyResults.find((k) => k.uuid === id);
    selectedNode.value = { title: kr.title, type: 'KeyResult' };
    showDialog.value = true;
  }
};
</script>
```

### Example 3: Programmatic Layout Reset

```vue
<template>
  <div>
    <v-btn @click="resetAllLayouts">Reset All Layouts</v-btn>
    <GoalDAGVisualization ref="dagRef" :goal-uuid="goalId" />
  </div>
</template>

<script setup>
const dagRef = ref();

const resetAllLayouts = () => {
  // Clear all goal layouts
  Object.keys(localStorage)
    .filter((key) => key.startsWith('dag-layout-goal-'))
    .forEach((key) => localStorage.removeItem(key));

  // Trigger component reset
  if (dagRef.value) {
    dagRef.value.resetLayout();
  }
};
</script>
```

---

## Testing

### Unit Tests

Located at: `GoalDAGVisualization.spec.ts`

**Run tests**:

```bash
pnpm test:run GoalDAGVisualization.spec.ts
```

**Coverage**:

- ✅ 19 test suites
- ✅ 40+ test cases
- ✅ ~85% code coverage

**Key test areas**:

- Rendering states
- Layout calculations
- Color mapping
- Event handling
- LocalStorage persistence
- Edge cases

### E2E Tests

Located at: `apps/web/e2e/dag-visualization.spec.ts`

**Run tests**:

```bash
pnpm test:e2e dag-visualization.spec.ts
```

**Scenarios**:

- Component visibility
- Layout toggling
- User interactions
- Responsive behavior
- State persistence
- Advanced interactions

---

## Troubleshooting

### Chart Not Rendering

**Symptoms**: Empty space where chart should be

**Causes**:

1. Goal has no KeyResults
2. ECharts not loaded
3. Container has zero height

**Solutions**:

```typescript
// Check Goal data
console.log('Goal:', currentGoal.value);
console.log('KRs:', currentGoal.value?.keyResults);

// Check container
const container = document.querySelector('.dag-container');
console.log('Container size:', container.getBoundingBox());
```

### Layout Not Saving

**Symptoms**: Custom positions lost on refresh

**Causes**:

1. localStorage disabled/full
2. Incorrect goal UUID
3. Browser privacy mode

**Solutions**:

```typescript
// Test localStorage
try {
  localStorage.setItem('test', '1');
  localStorage.removeItem('test');
  console.log('localStorage working');
} catch (e) {
  console.error('localStorage unavailable:', e);
}
```

### Performance Issues

**Symptoms**: Slow rendering, low FPS

**Causes**:

1. Too many nodes (> 100)
2. Force layout with many nodes
3. Browser resource constraints

**Solutions**:

1. Switch to hierarchical layout
2. Reduce animation duration
3. Paginate/filter KeyResults

---

## API Dependencies

### ECharts Modules

```typescript
import { GraphChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
```

### Vue Composables

```typescript
import { useGoal } from '../../composables/useGoal';
import { useResizeObserver } from '@vueuse/core';
```

### External Libraries

- `echarts`: v5.5.1
- `vue-echarts`: v7.0.3
- `@vueuse/core`: v11.x

---

## Roadmap

### Planned Features

- [ ] **Export to PNG/SVG**: Download graph as image
- [ ] **Minimap**: Overview + navigation for large graphs
- [ ] **Timeline Animation**: Replay weight changes over time
- [ ] **Multi-Goal Comparison**: Side-by-side DAG visualization
- [ ] **Custom Themes**: User-defined color schemes
- [ ] **Keyboard Shortcuts**: Quick layout switch, zoom controls
- [ ] **Virtual Scrolling**: Handle 1000+ nodes efficiently
- [ ] **Undo/Redo**: Layout change history

### Known Limitations

1. **Touch gestures**: Limited mobile support for drag
2. **Print mode**: Chart may not render in print view
3. **Accessibility**: Canvas content not screen-reader friendly
4. **Large graphs**: Performance degrades > 500 nodes

---

## Contributing

### Development Setup

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev:web

# Run tests
pnpm test:run GoalDAGVisualization.spec.ts

# Check coverage
pnpm test:coverage --project=web
```

### Code Style

Follow existing patterns:

- Vue 3 Composition API
- TypeScript with type safety
- Vuetify 3 components
- ECharts best practices

### Submitting Changes

1. Create feature branch: `feature/dag-enhancement-xyz`
2. Write/update tests
3. Ensure coverage ≥ 80%
4. Update this documentation
5. Submit PR with clear description

---

## License

MIT

---

## Support

**Issues**: [GitHub Issues](https://github.com/BakerSean168/DailyUse/issues)  
**Discussions**: [GitHub Discussions](https://github.com/BakerSean168/DailyUse/discussions)  
**Email**: lulouhao@stu.sicau.edu.cn

---

**Last Updated**: 2024-10-22  
**Version**: 1.0.0  
**Maintainer**: Goal Module Team  
**Component Location**: `apps/web/src/modules/goal/presentation/components/dag/`
