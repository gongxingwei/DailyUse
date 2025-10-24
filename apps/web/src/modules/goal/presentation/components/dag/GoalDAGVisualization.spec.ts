import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { ref } from 'vue';
import GoalDAGVisualization from './GoalDAGVisualization.vue';

// Mock ECharts
jest.mock('vue-echarts', () => ({
  default: {
    name: 'VChart',
    template: '<div class="mock-chart" @click="$emit(\'click\', $attrs)"></div>',
    props: ['option', 'autoresize'],
    emits: ['click'],
  },
}));

// Mock VueUse
jest.mock('@vueuse/core', () => ({
  useResizeObserver: jest.fn(),
}));

// Mock useGoal composable
jest.mock('../../composables/useGoal', () => ({
  useGoal: jest.fn(),
}));

import { useGoal } from '../../composables/useGoal';

describe('GoalDAGVisualization', () => {
  let wrapper: VueWrapper<any>;
  let mockGoalData: any;

  beforeEach(() => {
    setActivePinia(createPinia());

    // Default mock data
    mockGoalData = {
      uuid: 'goal-1',
      title: 'Test Goal',
      keyResults: [
        { uuid: 'kr-1', title: 'KR 1', weight: 40 },
        { uuid: 'kr-2', title: 'KR 2', weight: 60 },
      ],
    };

    // Mock useGoal
    (useGoal as jest.MockedFunction<typeof useGoal>).mockReturnValue({
      currentGoal: ref(mockGoalData),
      isLoading: ref(false),
      getGoalAggregateView: jest.fn(),
    } as any);

    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    wrapper?.unmount();
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders chart when goal has keyResults', () => {
      wrapper = mount(GoalDAGVisualization, {
        props: { goalUuid: 'goal-1' },
        global: {
          stubs: {
            VChart: {
              template: '<div class="mock-chart"></div>',
            },
          },
        },
      });

      expect(wrapper.find('.mock-chart').exists()).toBe(true);
    });

    it('shows empty state when no keyResults', () => {
      (useGoal as jest.MockedFunction<typeof useGoal>).mockReturnValue({
        currentGoal: ref({
          uuid: 'goal-1',
          title: 'Empty Goal',
          keyResults: [],
        }),
        isLoading: ref(false),
        getGoalAggregateView: jest.fn(),
      } as any);

      wrapper = mount(GoalDAGVisualization, {
        props: { goalUuid: 'goal-1' },
      });

      expect(wrapper.text()).toContain('该 Goal 暂无 KeyResult');
    });

    it('shows loading state', () => {
      (useGoal as jest.MockedFunction<typeof useGoal>).mockReturnValue({
        currentGoal: ref(mockGoalData),
        isLoading: ref(true),
        getGoalAggregateView: jest.fn(),
      } as any);

      wrapper = mount(GoalDAGVisualization, {
        props: { goalUuid: 'goal-1' },
      });

      expect(wrapper.find('.v-progress-linear').exists()).toBe(true);
    });

    it('shows warning when weight sum !== 100', () => {
      jest.mocked(useGoal).mockReturnValue({
        currentGoal: ref({
          uuid: 'goal-1',
          title: 'Test Goal',
          keyResults: [
            { uuid: 'kr-1', title: 'KR 1', weight: 30 },
            { uuid: 'kr-2', title: 'KR 2', weight: 50 }, // Total: 80%
          ],
        }),
        isLoading: ref(false),
        getGoalAggregateView: jest.fn(),
      } as any);

      wrapper = mount(GoalDAGVisualization, {
        props: { goalUuid: 'goal-1' },
      });

      expect(wrapper.text()).toContain('权重总和: 80%');
      expect(wrapper.text()).toContain('权重分配异常');
    });
  });

  describe('Layout Toggle', () => {
    it('toggles between force and hierarchical layout', async () => {
      wrapper = mount(GoalDAGVisualization, {
        props: { goalUuid: 'goal-1' },
      });

      // Check initial state
      expect(wrapper.vm.layoutType).toBe('force');

      // Toggle to hierarchical
      wrapper.vm.layoutType = 'hierarchical';
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.layoutType).toBe('hierarchical');
    });

    it('saves layout type to localStorage', async () => {
      wrapper = mount(GoalDAGVisualization, {
        props: { goalUuid: 'goal-1' },
      });

      wrapper.vm.layoutType = 'hierarchical';
      await wrapper.vm.$nextTick();

      expect(localStorage.getItem('dag-layout-type')).toBe('hierarchical');
    });

    it('loads layout type from localStorage on mount', () => {
      localStorage.setItem('dag-layout-type', 'hierarchical');

      wrapper = mount(GoalDAGVisualization, {
        props: { goalUuid: 'goal-1' },
      });

      expect(wrapper.vm.layoutType).toBe('hierarchical');
    });
  });

  describe('Layout Persistence', () => {
    it('saves custom layout to localStorage', () => {
      wrapper = mount(GoalDAGVisualization, {
        props: { goalUuid: 'goal-1' },
      });

      const positions = [
        { id: 'kr-1', x: 100, y: 200 },
        { id: 'kr-2', x: 300, y: 200 },
      ];

      wrapper.vm.saveLayout('goal-1', positions);

      const saved = localStorage.getItem('dag-layout-goal-1');
      expect(saved).toBeTruthy();
      expect(JSON.parse(saved!)).toEqual(positions);
    });

    it('loads custom layout from localStorage', () => {
      const positions = [
        { id: 'kr-1', x: 100, y: 200 },
        { id: 'kr-2', x: 300, y: 200 },
      ];

      localStorage.setItem('dag-layout-goal-1', JSON.stringify(positions));

      wrapper = mount(GoalDAGVisualization, {
        props: { goalUuid: 'goal-1' },
      });

      const loaded = wrapper.vm.loadLayout('goal-1');
      expect(loaded).toEqual(positions);
    });

    it('resets custom layout', async () => {
      localStorage.setItem('dag-layout-goal-1', JSON.stringify([{ id: 'kr-1', x: 100, y: 200 }]));

      wrapper = mount(GoalDAGVisualization, {
        props: { goalUuid: 'goal-1' },
      });

      await wrapper.vm.resetLayout();

      expect(localStorage.getItem('dag-layout-goal-1')).toBeNull();
      expect(wrapper.vm.hasCustomLayout).toBe(false);
    });
  });

  describe('Node Click Events', () => {
    it('emits node-click event for KR node', async () => {
      wrapper = mount(GoalDAGVisualization, {
        props: { goalUuid: 'goal-1' },
      });

      wrapper.vm.handleNodeClick({
        dataType: 'node',
        data: { id: 'kr-1', category: 1 },
      });

      expect(wrapper.emitted('node-click')).toBeTruthy();
      expect(wrapper.emitted('node-click')![0]).toEqual([{ id: 'kr-1', type: 'kr' }]);
    });

    it('emits node-click event for Goal node', () => {
      wrapper = mount(GoalDAGVisualization, {
        props: { goalUuid: 'goal-1' },
      });

      wrapper.vm.handleNodeClick({
        dataType: 'node',
        data: { id: 'goal-1', category: 0 },
      });

      expect(wrapper.emitted('node-click')).toBeTruthy();
      expect(wrapper.emitted('node-click')![0]).toEqual([{ id: 'goal-1', type: 'goal' }]);
    });

    it('does not emit for edge clicks', () => {
      wrapper = mount(GoalDAGVisualization, {
        props: { goalUuid: 'goal-1' },
      });

      wrapper.vm.handleNodeClick({
        dataType: 'edge',
        data: { source: 'goal-1', target: 'kr-1' },
      });

      expect(wrapper.emitted('node-click')).toBeFalsy();
    });
  });

  describe('Color Mapping', () => {
    beforeEach(() => {
      wrapper = mount(GoalDAGVisualization, {
        props: { goalUuid: 'goal-1' },
      });
    });

    it('returns green for high weight (>= 70%)', () => {
      expect(wrapper.vm.getWeightColor(80)).toBe('#4CAF50');
      expect(wrapper.vm.getWeightColor(70)).toBe('#4CAF50');
      expect(wrapper.vm.getWeightColor(100)).toBe('#4CAF50');
    });

    it('returns orange for medium weight (30-70%)', () => {
      expect(wrapper.vm.getWeightColor(50)).toBe('#FF9800');
      expect(wrapper.vm.getWeightColor(30)).toBe('#FF9800');
      expect(wrapper.vm.getWeightColor(69)).toBe('#FF9800');
    });

    it('returns red for low weight (< 30%)', () => {
      expect(wrapper.vm.getWeightColor(20)).toBe('#F44336');
      expect(wrapper.vm.getWeightColor(0)).toBe('#F44336');
      expect(wrapper.vm.getWeightColor(29)).toBe('#F44336');
    });
  });

  describe('Layout Calculations', () => {
    beforeEach(() => {
      wrapper = mount(GoalDAGVisualization, {
        props: { goalUuid: 'goal-1' },
      });
    });

    it('calculates hierarchical layout correctly', () => {
      const layout = wrapper.vm.calculateHierarchicalLayout();

      expect(layout.nodes).toHaveLength(3); // 1 goal + 2 KRs
      expect(layout.nodes[0].y).toBe(100); // Goal at top
      expect(layout.nodes[1].y).toBe(300); // KR at bottom
      expect(layout.nodes[2].y).toBe(300); // KR at bottom
      expect(layout.links).toHaveLength(2); // 2 edges
    });

    it('centers goal node in hierarchical layout', () => {
      const layout = wrapper.vm.calculateHierarchicalLayout();
      const goalNode = layout.nodes[0];

      expect(goalNode.x).toBe(400); // 800 / 2
      expect(goalNode.category).toBe(0);
    });

    it('distributes KRs evenly in hierarchical layout', () => {
      jest.mocked(useGoal).mockReturnValue({
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
        getGoalAggregateView: jest.fn(),
      } as any);

      wrapper = mount(GoalDAGVisualization, {
        props: { goalUuid: 'goal-1' },
      });

      const layout = wrapper.vm.calculateHierarchicalLayout();
      const krNodes = layout.nodes.filter((n: any) => n.category === 1);

      // Check spacing is consistent
      const spacing1 = krNodes[1].x - krNodes[0].x;
      const spacing2 = krNodes[2].x - krNodes[1].x;
      expect(Math.abs(spacing1 - spacing2)).toBeLessThan(1);
    });

    it('calculates force layout correctly', () => {
      const layout = wrapper.vm.calculateForceLayout();

      expect(layout.nodes).toHaveLength(3); // 1 goal + 2 KRs
      expect(layout.links).toHaveLength(2);
      expect(layout.nodes[0].category).toBe(0); // Goal
      expect(layout.nodes[1].category).toBe(1); // KR
    });

    it('sets node sizes based on weight', () => {
      const layout = wrapper.vm.calculateForceLayout();
      const kr1 = layout.nodes.find((n: any) => n.id === 'kr-1');
      const kr2 = layout.nodes.find((n: any) => n.id === 'kr-2');

      expect(kr1.symbolSize).toBe(40 + 40 * 0.4); // 56
      expect(kr2.symbolSize).toBe(40 + 60 * 0.4); // 64
      expect(kr2.symbolSize).toBeGreaterThan(kr1.symbolSize);
    });

    it('sets edge widths based on weight', () => {
      const layout = wrapper.vm.calculateHierarchicalLayout();
      const link1 = layout.links.find((l: any) => l.target === 'kr-1');
      const link2 = layout.links.find((l: any) => l.target === 'kr-2');

      expect(link1.lineStyle.width).toBe(4); // 40 / 10
      expect(link2.lineStyle.width).toBe(6); // 60 / 10
    });
  });

  describe('Computed Properties', () => {
    it('computes hasKeyResults correctly', () => {
      wrapper = mount(GoalDAGVisualization, {
        props: { goalUuid: 'goal-1' },
      });

      expect(wrapper.vm.hasKeyResults).toBe(true);
    });

    it('computes totalWeight correctly', () => {
      wrapper = mount(GoalDAGVisualization, {
        props: { goalUuid: 'goal-1' },
      });

      expect(wrapper.vm.totalWeight).toBe(100); // 40 + 60
    });

    it('handles missing keyResults in totalWeight', () => {
      jest.mocked(useGoal).mockReturnValue({
        currentGoal: ref({ uuid: 'goal-1', title: 'Test Goal' }),
        isLoading: ref(false),
        getGoalAggregateView: jest.fn(),
      } as any);

      wrapper = mount(GoalDAGVisualization, {
        props: { goalUuid: 'goal-1' },
      });

      expect(wrapper.vm.totalWeight).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles single KeyResult', () => {
      jest.mocked(useGoal).mockReturnValue({
        currentGoal: ref({
          uuid: 'goal-1',
          title: 'Test Goal',
          keyResults: [{ uuid: 'kr-1', title: 'KR 1', weight: 100 }],
        }),
        isLoading: ref(false),
        getGoalAggregateView: jest.fn(),
      } as any);

      wrapper = mount(GoalDAGVisualization, {
        props: { goalUuid: 'goal-1' },
      });

      const layout = wrapper.vm.calculateHierarchicalLayout();
      expect(layout.nodes).toHaveLength(2);
      expect(layout.links).toHaveLength(1);
    });

    it('handles many KeyResults', () => {
      const keyResults = Array.from({ length: 10 }, (_, i) => ({
        uuid: `kr-${i}`,
        title: `KR ${i}`,
        weight: 10,
      }));

      jest.mocked(useGoal).mockReturnValue({
        currentGoal: ref({
          uuid: 'goal-1',
          title: 'Test Goal',
          keyResults,
        }),
        isLoading: ref(false),
        getGoalAggregateView: jest.fn(),
      } as any);

      wrapper = mount(GoalDAGVisualization, {
        props: { goalUuid: 'goal-1' },
      });

      const layout = wrapper.vm.calculateHierarchicalLayout();
      expect(layout.nodes).toHaveLength(11); // 1 goal + 10 KRs
      expect(layout.links).toHaveLength(10);
    });

    it('handles zero weight KeyResults', () => {
      jest.mocked(useGoal).mockReturnValue({
        currentGoal: ref({
          uuid: 'goal-1',
          title: 'Test Goal',
          keyResults: [{ uuid: 'kr-1', title: 'KR 1', weight: 0 }],
        }),
        isLoading: ref(false),
        getGoalAggregateView: jest.fn(),
      } as any);

      wrapper = mount(GoalDAGVisualization, {
        props: { goalUuid: 'goal-1' },
      });

      const layout = wrapper.vm.calculateForceLayout();
      const kr = layout.nodes.find((n: any) => n.id === 'kr-1');

      expect(kr.symbolSize).toBe(40); // Min size
      expect(kr.itemStyle.color).toBe('#F44336'); // Red
    });
  });
});
