import { MainGoalApplicationService } from '../mainGoalApplicationService';
import type { IGoalCreateDTO, IGoalDir } from '@/modules/Goal/domain/types/goal';
import type { DateTime } from '@/shared/types/myDateTime';

// Helper function to create DateTime objects for testing
const createDateTime = (isoString: string): DateTime => {
  const date = new Date(isoString);
  return {
    date: {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    },
    time: {
      hour: date.getHours(),
      minute: date.getMinutes()
    },
    timestamp: date.getTime(),
    isoString: date.toISOString()
  };
};

/**
 * 主进程目标应用服务测试
 */
describe('MainGoalApplicationService', () => {
  let mainGoalService: MainGoalApplicationService;

  beforeEach(() => {
    mainGoalService = new MainGoalApplicationService();
  });

  describe('目标管理', () => {
    it('应能创建目标', async () => {
      // Arrange
      const goalData: IGoalCreateDTO = {
        title: '测试目标',
        description: '目标描述',
        color: '#FF6B6B',
        dirId: 'dir-1',
        startTime: createDateTime('2024-01-01T00:00:00.000Z'),
        endTime: createDateTime('2024-12-31T23:59:59.999Z'),
        note: '测试备注',
        keyResults: [],
        analysis: {
          motive: '测试动机',
          feasibility: '可行性分析'
        }
      };

      // Act
      const result = await mainGoalService.createGoal(goalData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.title).toBe(goalData.title);
    });

    it('应能获取所有目标', async () => {
      // Act
      const result = await mainGoalService.getAllGoals();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('应能删除目标', async () => {
      // Arrange - 先创建一个目标
      const goalCreateData: IGoalCreateDTO = {
        title: '待删除目标',
        description: '描述',
        color: '#FF6B6B',
        dirId: 'dir-1',
        startTime: createDateTime('2024-01-01T00:00:00.000Z'),
        endTime: createDateTime('2024-12-31T23:59:59.999Z'),
        note: '测试备注',
        keyResults: [],
        analysis: {
          motive: '测试动机',
          feasibility: '可行性分析'
        }
      };

      const createResult = await mainGoalService.createGoal(goalCreateData);
      expect(createResult.success).toBe(true);
      
      if (!createResult.data) {
        throw new Error('创建目标失败');
      }

      // Act
      const result = await mainGoalService.deleteGoal(createResult.data.uuid);

      // Assert
      expect(result.success).toBe(true);

      // 验证目标已被删除
      const getResult = await mainGoalService.getGoalById(createResult.data.uuid);
      expect(getResult.success).toBe(false);
    });
  });

  describe('目录管理', () => {
    it('应能创建目录', async () => {
      // Arrange
      const dirData: IGoalDir = {
        uuid: 'dir-test',
        name: '测试目录',
        icon: '📁',
        parentId: undefined,
        lifecycle: {
          createdAt: createDateTime('2024-01-01T00:00:00.000Z'),
          updatedAt: createDateTime('2024-01-01T00:00:00.000Z'),
          status: 'active'
        }
      };

      // Act
      const result = await mainGoalService.createGoalDir(dirData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('测试目录');
    });

    it('应能获取所有目录', async () => {
      // Act
      const result = await mainGoalService.getAllGoalDirs();

      // Assert
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('应能删除目录', async () => {
      // Arrange - 先创建一个目录
      const dirData: IGoalDir = {
        uuid: 'dir-delete-test',
        name: '待删除目录',
        icon: '📁',
        parentId: undefined,
        lifecycle: {
          createdAt: createDateTime('2024-01-01T00:00:00.000Z'),
          updatedAt: createDateTime('2024-01-01T00:00:00.000Z'),
          status: 'active'
        }
      };

      const createResult = await mainGoalService.createGoalDir(dirData);
      expect(createResult.success).toBe(true);

      // Act
      const result = await mainGoalService.deleteGoalDir(dirData.uuid);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('错误处理', () => {
    it('应正确处理不存在的ID', async () => {
      // Act
      const result = await mainGoalService.getGoalById('non-existent-id');

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });
  });
});
