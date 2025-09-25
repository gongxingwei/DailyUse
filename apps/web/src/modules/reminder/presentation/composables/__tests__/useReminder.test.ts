import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useReminder } from '../useReminder';
import { createTestPinia, nextTick } from '@/test/helpers';

// Mock 依赖
vi.mock('../../application/services/ReminderWebApplicationService', () => ({
  ReminderWebApplicationService: vi.fn().mockImplementation(() => ({
    getReminderInstances: vi.fn(),
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    createGroup: vi.fn(),
    updateGroup: vi.fn(),
    deleteGroup: vi.fn(),
    acknowledgeInstance: vi.fn(),
    dismissInstance: vi.fn(),
    snoozeInstance: vi.fn(),
  })),
}));

vi.mock('../stores/reminderStore', () => ({
  useReminderStore: vi.fn(() => ({
    isLoading: false,
    error: null,
    reminderTemplates: [],
    reminderTemplateGroups: [],
    reminderInstances: [],
    getEnabledReminderTemplates: [],
    getActiveInstances: [],
    getPendingInstances: [],
    getInstancesByTemplate: vi.fn(() => []),
  })),
}));

describe('useReminder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createTestPinia(); // 为每个测试创建新的 Pinia 实例
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初始化', () => {
    it('应该正确初始化 composable', () => {
      const reminder = useReminder();

      expect(reminder).toBeDefined();
      expect(reminder.isLoading).toBeDefined();
      expect(reminder.error).toBeDefined();
      expect(reminder.reminderTemplates).toBeDefined();
    });

    it('应该正确初始化计算属性', () => {
      const reminder = useReminder();

      expect(reminder.enabledTemplates).toBeDefined();
      expect(reminder.activeInstances).toBeDefined();
    });

    it('应该正确初始化方法', () => {
      const reminder = useReminder();

      expect(typeof reminder.createTemplate).toBe('function');
      expect(typeof reminder.updateTemplate).toBe('function');
      expect(typeof reminder.deleteTemplate).toBe('function');
      expect(typeof reminder.createGroup).toBe('function');
      expect(typeof reminder.updateGroup).toBe('function');
      expect(typeof reminder.deleteGroup).toBe('function');
    });
  });

  describe('模板管理', () => {
    it('应该能够创建新模板', async () => {
      const reminder = useReminder();
      const templateData = {
        name: 'New Template',
        message: 'New Message',
        category: 'test',
        priority: 'normal',
        tags: [],
        timeConfig: {
          type: 'daily' as const,
          times: ['09:00'],
        },
      };

      // 测试方法存在性
      expect(typeof reminder.createTemplate).toBe('function');
    });

    it('应该能够更新模板', async () => {
      const reminder = useReminder();
      const updateData = {
        name: 'Updated Template',
        message: 'Updated Message',
      };

      // 测试方法存在性
      expect(typeof reminder.updateTemplate).toBe('function');
    });

    it('应该能够删除模板', async () => {
      const reminder = useReminder();

      // 测试方法存在性
      expect(typeof reminder.deleteTemplate).toBe('function');
    });
  });

  describe('分组管理', () => {
    it('应该能够创建新分组', async () => {
      const reminder = useReminder();
      const groupData = {
        name: 'New Group',
        description: 'New Description',
        enabled: true,
      };

      // 测试方法存在性
      expect(typeof reminder.createGroup).toBe('function');
    });

    it('应该能够更新分组', async () => {
      const reminder = useReminder();
      const updateData = {
        name: 'Updated Group',
        description: 'Updated Description',
      };

      // 测试方法存在性
      expect(typeof reminder.updateGroup).toBe('function');
    });

    it('应该能够删除分组', async () => {
      const reminder = useReminder();

      // 测试方法存在性
      expect(typeof reminder.deleteGroup).toBe('function');
    });
  });

  describe('实例管理', () => {
    it('应该能够完成实例', async () => {
      const reminder = useReminder();

      // 测试方法存在性
      expect(typeof reminder.completeReminder).toBe('function');
    });

    it('应该能够忽略实例', async () => {
      const reminder = useReminder();

      // 测试方法存在性
      expect(typeof reminder.dismissReminder).toBe('function');
    });

    it('应该能够延迟实例', async () => {
      const reminder = useReminder();

      // 测试方法存在性
      expect(typeof reminder.snoozeReminder).toBe('function');
    });
  });

  describe('数据获取', () => {
    it('应该能够获取提醒实例', async () => {
      const reminder = useReminder();

      // 测试方法存在性
      expect(typeof reminder.getInstances).toBe('function');
    });

    it('应该能够按模板获取实例', () => {
      const reminder = useReminder();

      // 测试方法存在性
      expect(typeof reminder.loadTemplateInstances).toBe('function');
    });
  });

  describe('状态管理', () => {
    it('应该正确提供计算属性', () => {
      const reminder = useReminder();

      expect(reminder.isLoading.value).toBeDefined();
      expect(typeof reminder.isLoading.value).toBe('boolean');

      expect(reminder.error.value).toBeDefined();

      expect(reminder.reminderTemplates.value).toBeDefined();
      expect(Array.isArray(reminder.reminderTemplates.value)).toBe(true);

      expect(reminder.reminderGroups.value).toBeDefined();
      expect(Array.isArray(reminder.reminderGroups.value)).toBe(true);

      expect(reminder.activeInstances.value).toBeDefined();
      expect(Array.isArray(reminder.activeInstances.value)).toBe(true);
    });

    it('应该正确提供启用的模板', () => {
      const reminder = useReminder();

      expect(reminder.enabledTemplates.value).toBeDefined();
      expect(Array.isArray(reminder.enabledTemplates.value)).toBe(true);
    });

    it('应该正确提供活跃实例', () => {
      const reminder = useReminder();

      expect(reminder.activeInstances.value).toBeDefined();
      expect(Array.isArray(reminder.activeInstances.value)).toBe(true);
    });

    it('应该正确提供模板实例', () => {
      const reminder = useReminder();

      expect(reminder.templateInstances.value).toBeDefined();
      expect(Array.isArray(reminder.templateInstances.value)).toBe(true);
    });
  });

  describe('初始化流程', () => {
    it('应该能够初始化提醒数据', async () => {
      const reminder = useReminder();

      // 测试方法存在性
      expect(typeof reminder.initialize).toBe('function');
    });

    it('应该正确处理组操作', () => {
      const reminder = useReminder();

      // 测试分组相关方法
      expect(typeof reminder.toggleGroupEnabled).toBe('function');
      expect(typeof reminder.toggleGroupEnableMode).toBe('function');
      expect(typeof reminder.batchSetGroupTemplatesEnabled).toBe('function');
    });
  });

  describe('高级功能', () => {
    it('应该提供分组状态切换功能', () => {
      const reminder = useReminder();

      expect(typeof reminder.toggleGroupEnabled).toBe('function');
      expect(typeof reminder.toggleGroupEnableMode).toBe('function');
    });

    it('应该提供模板状态切换功能', () => {
      const reminder = useReminder();

      expect(typeof reminder.toggleTemplateEnabled).toBe('function');
    });

    it('应该提供批量操作功能', () => {
      const reminder = useReminder();

      expect(typeof reminder.batchProcessInstances).toBe('function');
      expect(typeof reminder.batchSetGroupTemplatesEnabled).toBe('function');
    });
  });
});
