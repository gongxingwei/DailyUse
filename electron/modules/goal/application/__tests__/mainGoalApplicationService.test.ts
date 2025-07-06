import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { MainGoalApplicationService } from '@/electron/modules/goal/application/mainGoalApplicationService';
import type { IGoal, IKeyResult, IRecord, IGoalDir } from '@/modules/Goal/domain/types/goal';

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
      const goalData: IGoal = {
        id: 'goal-1',
        title: '测试目标',
        description: '目标描述',
        startTime: '2024-01-01',
        endTime: '2024-12-31',
        status: 'active',
        progress: 0,
        dirId: 'dir-1',
        priority: 1,
        tags: ['test'],
        keyResults: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      // Act
      const result = await mainGoalService.createGoal(goalData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe(goalData.id);
      expect(result.data?.title).toBe(goalData.title);
    });

    it('应能获取所有目标', async () => {
      // Arrange - 先创建一些目标
      const goal1: IGoal = {
        id: 'goal-1',
        title: '目标1',
        description: '描述1',
        startTime: '2024-01-01',
        endTime: '2024-12-31',
        status: 'active',
        progress: 0,
        dirId: 'dir-1',
        priority: 1,
        tags: [],
        keyResults: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      const goal2: IGoal = {
        id: 'goal-2',
        title: '目标2',
        description: '描述2',
        startTime: '2024-01-01',
        endTime: '2024-12-31',
        status: 'active',
        progress: 0,
        dirId: 'dir-1',
        priority: 2,
        tags: [],
        keyResults: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      await mainGoalService.createGoal(goal1);
      await mainGoalService.createGoal(goal2);

      // Act
      const result = await mainGoalService.getAllGoals();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBeGreaterThanOrEqual(2);
    });

    it('应能更新目标', async () => {
      // Arrange
      const goalData: IGoal = {
        id: 'goal-1',
        title: '原标题',
        description: '原描述',
        startTime: '2024-01-01',
        endTime: '2024-12-31',
        status: 'active',
        progress: 0,
        dirId: 'dir-1',
        priority: 1,
        tags: [],
        keyResults: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      await mainGoalService.createGoal(goalData);

      const updateData = {
        title: '新标题',
        description: '新描述',
        progress: 50
      };

      // Act
      const result = await mainGoalService.updateGoal('goal-1', updateData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('新标题');
      expect(result.data?.description).toBe('新描述');
      expect(result.data?.progress).toBe(50);
    });

    it('应能删除目标', async () => {
      // Arrange
      const goalData: IGoal = {
        id: 'goal-to-delete',
        title: '待删除目标',
        description: '描述',
        startTime: '2024-01-01',
        endTime: '2024-12-31',
        status: 'active',
        progress: 0,
        dirId: 'dir-1',
        priority: 1,
        tags: [],
        keyResults: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      await mainGoalService.createGoal(goalData);

      // Act
      const result = await mainGoalService.deleteGoal('goal-to-delete');

      // Assert
      expect(result.success).toBe(true);

      // 验证目标已被删除
      const getResult = await mainGoalService.getGoalById('goal-to-delete');
      expect(getResult.success).toBe(false);
    });
  });

  describe('关键结果管理', () => {
    it('应能创建关键结果', async () => {
      // Arrange
      const keyResultData: IKeyResult = {
        id: 'kr-1',
        goalId: 'goal-1',
        title: '关键结果1',
        description: 'KR描述',
        targetValue: 100,
        currentValue: 0,
        unit: '个',
        weight: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      // Act
      const result = await mainGoalService.createKeyResult(keyResultData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('kr-1');
      expect(result.data?.title).toBe('关键结果1');
    });

    it('应能更新关键结果', async () => {
      // Arrange
      const keyResultData: IKeyResult = {
        id: 'kr-update',
        goalId: 'goal-1',
        title: '原标题',
        description: '原描述',
        targetValue: 100,
        currentValue: 0,
        unit: '个',
        weight: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      await mainGoalService.createKeyResult(keyResultData);

      const updateData = {
        title: '新标题',
        currentValue: 50
      };

      // Act
      const result = await mainGoalService.updateKeyResult('kr-update', updateData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('新标题');
      expect(result.data?.currentValue).toBe(50);
    });

    it('应能删除关键结果', async () => {
      // Arrange
      const keyResultData: IKeyResult = {
        id: 'kr-delete',
        goalId: 'goal-1',
        title: '待删除KR',
        description: '描述',
        targetValue: 100,
        currentValue: 0,
        unit: '个',
        weight: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      await mainGoalService.createKeyResult(keyResultData);

      // Act
      const result = await mainGoalService.deleteKeyResult('kr-delete');

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('记录管理', () => {
    it('应能创建记录', async () => {
      // Arrange
      const recordData: IRecord = {
        id: 'record-1',
        goalId: 'goal-1',
        keyResultId: 'kr-1',
        value: 10,
        description: '测试记录',
        recordedAt: '2024-01-01T10:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      // Act
      const result = await mainGoalService.createRecord(recordData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('record-1');
      expect(result.data?.value).toBe(10);
    });

    it('应能获取目标的记录', async () => {
      // Arrange
      const record1: IRecord = {
        id: 'record-1',
        goalId: 'goal-test',
        keyResultId: 'kr-1',
        value: 10,
        description: '记录1',
        recordedAt: '2024-01-01T10:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      const record2: IRecord = {
        id: 'record-2',
        goalId: 'goal-test',
        keyResultId: 'kr-1',
        value: 20,
        description: '记录2',
        recordedAt: '2024-01-02T10:00:00.000Z',
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z'
      };

      await mainGoalService.createRecord(record1);
      await mainGoalService.createRecord(record2);

      // Act
      const result = await mainGoalService.getRecordsByGoalId('goal-test');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.length).toBeGreaterThanOrEqual(2);
    });

    it('应能删除记录', async () => {
      // Arrange
      const recordData: IRecord = {
        id: 'record-delete',
        goalId: 'goal-1',
        keyResultId: 'kr-1',
        value: 10,
        description: '待删除记录',
        recordedAt: '2024-01-01T10:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      await mainGoalService.createRecord(recordData);

      // Act
      const result = await mainGoalService.deleteRecord('record-delete');

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('目录管理', () => {
    it('应能创建目录', async () => {
      // Arrange
      const dirData: IGoalDir = {
        id: 'dir-1',
        name: '测试目录',
        description: '目录描述',
        parentId: null,
        sortOrder: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      // Act
      const result = await mainGoalService.createGoalDir(dirData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('dir-1');
      expect(result.data?.name).toBe('测试目录');
    });

    it('应能获取所有目录', async () => {
      // Arrange
      const dir1: IGoalDir = {
        id: 'dir-1',
        name: '目录1',
        description: '描述1',
        parentId: null,
        sortOrder: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      const dir2: IGoalDir = {
        id: 'dir-2',
        name: '目录2',
        description: '描述2',
        parentId: null,
        sortOrder: 2,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      await mainGoalService.createGoalDir(dir1);
      await mainGoalService.createGoalDir(dir2);

      // Act
      const result = await mainGoalService.getAllGoalDirs();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.length).toBeGreaterThanOrEqual(2);
    });

    it('应能删除目录', async () => {
      // Arrange
      const dirData: IGoalDir = {
        id: 'dir-delete',
        name: '待删除目录',
        description: '描述',
        parentId: null,
        sortOrder: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      await mainGoalService.createGoalDir(dirData);

      // Act
      const result = await mainGoalService.deleteGoalDir('dir-delete');

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('批量操作', () => {
    it('应能同步所有数据', async () => {
      // Arrange - 创建一些数据
      const goalData: IGoal = {
        id: 'sync-goal',
        title: '同步目标',
        description: '描述',
        startTime: '2024-01-01',
        endTime: '2024-12-31',
        status: 'active',
        progress: 0,
        dirId: 'sync-dir',
        priority: 1,
        tags: [],
        keyResults: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      const dirData: IGoalDir = {
        id: 'sync-dir',
        name: '同步目录',
        description: '描述',
        parentId: null,
        sortOrder: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      await mainGoalService.createGoalDir(dirData);
      await mainGoalService.createGoal(goalData);

      // Act
      const result = await mainGoalService.getAllGoalData();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.goals).toBeDefined();
      expect(result.data?.records).toBeDefined();
      expect(result.data?.goalDirs).toBeDefined();
      expect(result.data?.goals.length).toBeGreaterThanOrEqual(1);
      expect(result.data?.goalDirs.length).toBeGreaterThanOrEqual(1);
    });

    it('应能批量创建目标', async () => {
      // Arrange
      const goals: IGoal[] = [
        {
          id: 'batch-goal-1',
          title: '批量目标1',
          description: '描述1',
          startTime: '2024-01-01',
          endTime: '2024-12-31',
          status: 'active',
          progress: 0,
          dirId: 'dir-1',
          priority: 1,
          tags: [],
          keyResults: [],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'batch-goal-2',
          title: '批量目标2',
          description: '描述2',
          startTime: '2024-01-01',
          endTime: '2024-12-31',
          status: 'active',
          progress: 0,
          dirId: 'dir-1',
          priority: 2,
          tags: [],
          keyResults: [],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      // Act
      const result = await mainGoalService.batchCreateGoals(goals);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(2);
    });
  });

  describe('错误处理', () => {
    it('应正确处理无效数据', async () => {
      // Arrange
      const invalidGoal = {} as IGoal;

      // Act
      const result = await mainGoalService.createGoal(invalidGoal);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('应正确处理不存在的ID', async () => {
      // Act
      const result = await mainGoalService.getGoalById('non-existent-id');

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('目标不存在');
    });
  });
});
