import { describe, it, expect, jest, beforeEach, afterEach } from 'vitest';
import { useTask } from '../useTask';

// Mock 依赖
vi.mock('../../../application/services/TaskWebApplicationService', () => ({
  TaskWebApplicationService: vi.fn().mockImplementation(() => ({
    createTaskTemplate: vi.fn(),
    updateTaskTemplate: vi.fn(),
    deleteTaskTemplate: vi.fn(),
    getTaskTemplates: vi.fn(),
    getTaskInstances: vi.fn(),
    createTaskInstance: vi.fn(),
    updateTaskInstance: vi.fn(),
    deleteTaskInstance: vi.fn(),
  })),
}));

vi.mock('../stores/taskStore', () => ({
  useTaskStore: vi.fn(() => ({
    isLoading: false,
    error: null,
    getAllTaskTemplates: [],
    getAllTaskInstances: [],
    getInstancesByStatus: vi.fn(() => []),
    getTodayTaskInstances: [],
    getTaskTemplatesByKeyResultUuid: vi.fn(() => []),
  })),
}));

describe('useTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初始化', () => {
    it('应该正确初始化 composable', () => {
      const task = useTask();

      expect(task).toBeDefined();
      expect(task.taskTemplates).toBeDefined();
      expect(task.taskInstances).toBeDefined();
      expect(task.activeTaskTemplates).toBeDefined();
      expect(task.pausedTaskTemplates).toBeDefined();
    });

    it('应该正确初始化实例相关计算属性', () => {
      const task = useTask();

      expect(task.pendingTaskInstances).toBeDefined();
      expect(task.completedTaskInstances).toBeDefined();
      expect(task.cancelledTaskInstances).toBeDefined();
      expect(task.todayTaskInstances).toBeDefined();
    });

    it('应该正确初始化方法', () => {
      const task = useTask();

      expect(typeof task.fetchTaskTemplates).toBe('function');
      expect(typeof task.fetchTaskInstances).toBe('function');
      expect(typeof task.createTaskTemplate).toBe('function');
      expect(typeof task.updateTaskTemplate).toBe('function');
      expect(typeof task.deleteTaskTemplate).toBe('function');
    });
  });

  describe('任务模板管理', () => {
    it('应该能够创建任务模板', async () => {
      const task = useTask();
      const templateData = {
        title: 'New Task Template',
        description: 'New Description',
        timeConfig: {
          time: {
            timeType: 'specificTime' as const,
            startTime: '09:00',
          },
          date: {
            startDate: new Date(),
          },
          schedule: {
            mode: 'daily' as const,
          },
          timezone: 'UTC',
        },
        reminderConfig: {
          enabled: true,
          minutesBefore: 15,
          methods: ['notification' as const],
        },
        properties: {
          importance: 'medium' as const,
          urgency: 'medium' as const,
          tags: [],
        },
      };

      // 测试方法存在性
      expect(typeof task.createTaskTemplate).toBe('function');
    });

    it('应该能够获取任务模板', async () => {
      const task = useTask();

      // 测试方法存在性
      expect(typeof task.fetchTaskTemplates).toBe('function');
    });

    it('应该能够更新任务模板', async () => {
      const task = useTask();
      const updateData = {
        title: 'Updated Task Template',
        description: 'Updated Description',
      };

      // 测试方法存在性
      expect(typeof task.updateTaskTemplate).toBe('function');
    });

    it('应该能够删除任务模板', async () => {
      const task = useTask();

      // 测试方法存在性
      expect(typeof task.deleteTaskTemplate).toBe('function');
    });
  });

  describe('任务实例管理', () => {
    it('应该能够获取任务实例', async () => {
      const task = useTask();

      // 测试方法存在性
      expect(typeof task.fetchTaskInstances).toBe('function');
    });

    it('应该能够创建任务实例', async () => {
      const task = useTask();

      // 测试方法存在性
      expect(typeof task.createTaskInstance).toBe('function');
    });
  });

  describe('数据过滤和计算', () => {
    it('应该正确提供计算属性', () => {
      const task = useTask();

      expect(task.activeTaskTemplates.value).toBeDefined();
      expect(Array.isArray(task.activeTaskTemplates.value)).toBe(true);

      expect(task.pausedTaskTemplates.value).toBeDefined();
      expect(Array.isArray(task.pausedTaskTemplates.value)).toBe(true);
    });

    it('应该能够按关键结果获取任务模板', () => {
      const task = useTask();

      expect(typeof task.taskTemplatesByKeyResult.value).toBe('function');
    });
  });

  describe('状态管理', () => {
    it('应该正确提供今日任务实例', () => {
      const task = useTask();

      expect(task.todayTaskInstances.value).toBeDefined();
      expect(Array.isArray(task.todayTaskInstances.value)).toBe(true);
    });

    it('应该正确提供本周任务实例', () => {
      const task = useTask();

      expect(task.thisWeekTaskInstances.value).toBeDefined();
      expect(Array.isArray(task.thisWeekTaskInstances.value)).toBe(true);
    });
  });

  describe('基本功能测试', () => {
    it('应该提供任务模板相关的计算属性', () => {
      const task = useTask();

      expect(task.taskTemplates.value).toBeDefined();
      expect(task.activeTaskTemplates.value).toBeDefined();
      expect(task.pausedTaskTemplates.value).toBeDefined();
    });

    it('应该提供任务实例相关的计算属性', () => {
      const task = useTask();

      expect(task.taskInstances.value).toBeDefined();
      expect(task.pendingTaskInstances.value).toBeDefined();
      expect(task.completedTaskInstances.value).toBeDefined();
      expect(task.cancelledTaskInstances.value).toBeDefined();
    });
  });
});
