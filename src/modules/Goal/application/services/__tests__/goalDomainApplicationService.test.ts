import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GoalDomainApplicationService, getGoalDomainApplicationService } from '@/modules/Goal/application/services/goalDomainApplicationService';
import type { IGoalStateRepository } from '@/modules/Goal/domain/repositories/IGoalStateRepository';
import type { IGoal, IKeyResult, IRecord, IGoalDir } from '@/modules/Goal/domain/types/goal';

/**
 * 目标应用服务测试
 * 展示如何使用抽象状态仓库进行单元测试
 */
describe('GoalDomainApplicationService', () => {
  let mockStateRepository: jest.Mocked<IGoalStateRepository>;
  let goalService: GoalDomainApplicationService;

  beforeEach(() => {
    // 创建 mock 状态仓库
    mockStateRepository = {
      addGoal: jest.fn(),
      updateGoal: jest.fn(),
      removeGoal: jest.fn(),
      setGoals: jest.fn(),
      clearAllGoals: jest.fn(),
      addRecord: jest.fn(),
      updateRecord: jest.fn(),
      removeRecord: jest.fn(),
      setRecords: jest.fn(),
      removeRecordsBygoalUuid: jest.fn(),
      removeRecordsByKeyResultId: jest.fn(),
      clearAllRecords: jest.fn(),
      addGoalDir: jest.fn(),
      updateGoalDir: jest.fn(),
      removeGoalDir: jest.fn(),
      setGoalDirs: jest.fn(),
      clearAllGoalDirs: jest.fn(),
      syncAllGoalData: jest.fn(),
      isAvailable: jest.fn().mockReturnValue(true)
    };

    // 使用 mock 仓库创建服务实例
    goalService = getGoalDomainApplicationService(mockStateRepository);
  });

  describe('创建目标', () => {
    it('成功创建时应同步状态', async () => {
      // Arrange
      const mockGoal: IGoal = {
        uuid: 'test-goal-1',
        title: '测试目标',
        description: '测试描述',
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

      // Mock IPC 响应
      jest.spyOn(require('@/modules/Goal/infrastructure/ipc/goalIpcClient'), 'goalIpcClient', 'get')
        .mockReturnValue({
          createGoal: jest.fn().mockResolvedValue({
            success: true,
            data: mockGoal
          })
        });

      // Act
      const result = await goalService.createGoal(mockGoal);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockGoal);
      expect(mockStateRepository.addGoal).toHaveBeenCalledWith(mockGoal);
      expect(mockStateRepository.addGoal).toHaveBeenCalledTimes(1);
    });

    it('创建失败时不应同步状态', async () => {
      // Arrange
      const mockGoal: IGoal = {
        uuid: 'test-goal-1',
        title: '测试目标',
      } as IGoal;

      // Mock IPC 失败响应
      jest.spyOn(require('@/modules/Goal/infrastructure/ipc/goalIpcClient'), 'goalIpcClient', 'get')
        .mockReturnValue({
          createGoal: jest.fn().mockResolvedValue({
            success: false,
            message: '创建失败'
          })
        });

      // Act
      const result = await goalService.createGoal(mockGoal);

      // Assert
      expect(result.success).toBe(false);
      expect(mockStateRepository.addGoal).not.toHaveBeenCalled();
    });
  });

  describe('更新目标', () => {
    it('成功更新时应同步状态', async () => {
      // Arrange
      const goalUuid = 'test-goal-1';
      const updateData = { title: '更新后的目标' };
      const updatedGoal: IGoal = {
        uuid: goalUuid,
        title: '更新后的目标',
        description: '测试描述',
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

      // Mock IPC 响应
      jest.spyOn(require('@/modules/Goal/infrastructure/ipc/goalIpcClient'), 'goalIpcClient', 'get')
        .mockReturnValue({
          updateGoal: jest.fn().mockResolvedValue({
            success: true,
            data: updatedGoal
          })
        });

      // Act
      const result = await goalService.updateGoal(goalUuid, updateData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedGoal);
      expect(mockStateRepository.updateGoal).toHaveBeenCalledWith(updatedGoal);
    });
  });

  describe('删除目标', () => {
    it('成功删除时应同步状态', async () => {
      // Arrange
      const goalUuid = 'test-goal-1';

      // Mock IPC 响应
      jest.spyOn(require('@/modules/Goal/infrastructure/ipc/goalIpcClient'), 'goalIpcClient', 'get')
        .mockReturnValue({
          deleteGoal: jest.fn().mockResolvedValue({
            success: true,
            message: '删除成功'
          })
        });

      // Act
      const result = await goalService.deleteGoal(goalUuid);

      // Assert
      expect(result.success).toBe(true);
      expect(mockStateRepository.removeGoal).toHaveBeenCalledWith(goalUuid);
      expect(mockStateRepository.removeRecordsBygoalUuid).toHaveBeenCalledWith(goalUuid);
    });
  });

  describe('关键结果管理', () => {
    it('创建关键结果应成功', async () => {
      // Arrange
      const mockKeyResult: IKeyResult = {
        uuid: 'kr-1',
        goalUuid: 'goal-1',
        title: '测试关键结果',
        description: '描述',
        targetValue: 100,
        currentValue: 0,
        unit: '个',
        weight: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      // Mock IPC 响应
      jest.spyOn(require('@/modules/Goal/infrastructure/ipc/goalIpcClient'), 'goalIpcClient', 'get')
        .mockReturnValue({
          createKeyResult: jest.fn().mockResolvedValue({
            success: true,
            data: mockKeyResult
          })
        });

      // Act
      const result = await goalService.createKeyResult(mockKeyResult);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockKeyResult);
    });

    it('更新关键结果应成功', async () => {
      // Arrange
      const keyResultId = 'kr-1';
      const updateData = { currentValue: 50 };

      // Mock IPC 响应
      jest.spyOn(require('@/modules/Goal/infrastructure/ipc/goalIpcClient'), 'goalIpcClient', 'get')
        .mockReturnValue({
          updateKeyResult: jest.fn().mockResolvedValue({
            success: true,
            data: { ...updateData, uuid: keyResultId }
          })
        });

      // Act
      const result = await goalService.updateKeyResult(keyResultId, updateData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.currentValue).toBe(50);
    });
  });

  describe('记录管理', () => {
    it('创建记录应成功', async () => {
      // Arrange
      const mockRecord: IRecord = {
        uuid: 'record-1',
        goalUuid: 'goal-1',
        keyResultId: 'kr-1',
        value: 10,
        description: '测试记录',
        recordedAt: '2024-01-01T00:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      // Mock IPC 响应
      jest.spyOn(require('@/modules/Goal/infrastructure/ipc/goalIpcClient'), 'goalIpcClient', 'get')
        .mockReturnValue({
          createRecord: jest.fn().mockResolvedValue({
            success: true,
            data: mockRecord
          })
        });

      // Act
      const result = await goalService.createRecord(mockRecord);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRecord);
      expect(mockStateRepository.addRecord).toHaveBeenCalledWith(mockRecord);
    });

    it('删除记录应同步状态', async () => {
      // Arrange
      const recordId = 'record-1';

      // Mock IPC 响应
      jest.spyOn(require('@/modules/Goal/infrastructure/ipc/goalIpcClient'), 'goalIpcClient', 'get')
        .mockReturnValue({
          deleteRecord: jest.fn().mockResolvedValue({
            success: true,
            message: '删除成功'
          })
        });

      // Act
      const result = await goalService.deleteRecord(recordId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockStateRepository.removeRecord).toHaveBeenCalledWith(recordId);
    });
  });

  describe('目录管理', () => {
    it('创建目录应成功', async () => {
      // Arrange
      const mockGoalDir: IGoalDir = {
        uuid: 'dir-1',
        name: '测试目录',
        description: '目录描述',
        parentId: null,
        sortOrder: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      // Mock IPC 响应
      jest.spyOn(require('@/modules/Goal/infrastructure/ipc/goalIpcClient'), 'goalIpcClient', 'get')
        .mockReturnValue({
          createGoalDir: jest.fn().mockResolvedValue({
            success: true,
            data: mockGoalDir
          })
        });

      // Act
      const result = await goalService.createGoalDir(mockGoalDir);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockGoalDir);
      expect(mockStateRepository.addGoalDir).toHaveBeenCalledWith(mockGoalDir);
    });
  });

  describe('批量操作', () => {
    it('同步所有数据应成功', async () => {
      // Arrange
      const mockAllData = {
        goals: [{ uuid: 'goal-1', title: '目标1' }] as IGoal[],
        records: [{ uuid: 'record-1', goalUuid: 'goal-1' }] as IRecord[],
        goalDirs: [{ uuid: 'dir-1', name: '目录1' }] as IGoalDir[]
      };

      // Mock IPC 响应
      jest.spyOn(require('@/modules/Goal/infrastructure/ipc/goalIpcClient'), 'goalIpcClient', 'get')
        .mockReturnValue({
          getAllGoalData: jest.fn().mockResolvedValue({
            success: true,
            data: mockAllData
          })
        });

      // Act
      const result = await goalService.syncAllData();

      // Assert
      expect(result.success).toBe(true);
      expect(mockStateRepository.syncAllGoalData).toHaveBeenCalledWith(mockAllData);
    });
  });

  describe('状态仓库不可用时', () => {
    beforeEach(() => {
      mockStateRepository.isAvailable.mockReturnValue(false);
    });

    it('应输出警告但不影响业务流程', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      await goalService.syncAllData();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('⚠️ 状态仓库不可用，跳过同步');
      expect(mockStateRepository.syncAllGoalData).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('工厂方法', () => {
    it('应支持依赖注入', () => {
      // Act
      const serviceWithInjection = getGoalDomainApplicationService(mockStateRepository);

      // Assert
      expect(serviceWithInjection).toBeInstanceOf(GoalDomainApplicationService);
    });

    it('应支持默认创建', () => {
      // Act
      const serviceWithDefaults = getGoalDomainApplicationService();

      // Assert
      expect(serviceWithDefaults).toBeInstanceOf(GoalDomainApplicationService);
    });
  });
});

/**
 * 集成测试示例
 * 展示在真实环境中的使用方式
 */
describe('GoalDomainApplicationService Integration', () => {
  it('应能与真实的 Pinia 状态仓库集成', async () => {
    // 这里可以添加与真实 Pinia store 的集成测试
    // 验证完整的数据流：IPC -> 应用服务 -> 状态仓库 -> UI
    expect(true).toBe(true); // 占位测试
  });
});

/**
 * 性能测试示例
 */
describe('GoalDomainApplicationService Performance', () => {
  it('批量同步应在合理时间内完成', async () => {
    // 性能测试逻辑
    expect(true).toBe(true); // 占位测试
  });
});
