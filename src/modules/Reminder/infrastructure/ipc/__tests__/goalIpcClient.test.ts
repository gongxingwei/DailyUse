import { describe, it, expect, jest, beforeEach } from 'vitest';
import { goalIpcClient } from '@/modules/Goal/infrastructure/ipc/goalIpcClient';
import type { 
  IGoal, 
  IGoalCreateDTO, 
  IRecord, 
  IRecordCreateDTO, 
  IGoalDir, 
  IGoalDir 
} from '@/modules/Goal/domain/types/goal';
import type { DateTime } from "@/shared/types/myDateTime";

// Mock electron's ipcRenderer
const mockIpcRenderer = {
  invoke: jest.fn()
};

// Mock electron module
jest.mock('electron', () => ({
  ipcRenderer: mockIpcRenderer
}));

describe('Goal IPC Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('目标操作', () => {
    it('应能通过IPC创建目标', async () => {
      // Arrange
      const goalData: IGoal = {
        uuid: 'goal-1',
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

      const expectedResponse = {
        success: true,
        data: goalData
      };

      mockIpcRenderer.invoke.mockResolvedValue(expectedResponse);

      // Act
      const result = await goalIpcClient.createGoal(goalData);

      // Assert
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('goal:create', goalData);
      expect(result).toEqual(expectedResponse);
    });

    it('应能通过IPC获取所有目标', async () => {
      // Arrange
      const goals: IGoal[] = [
        {
          uuid: 'goal-1',
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
        }
      ];

      const expectedResponse = {
        success: true,
        data: goals
      };

      mockIpcRenderer.invoke.mockResolvedValue(expectedResponse);

      // Act
      const result = await goalIpcClient.getAllGoals();

      // Assert
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('goal:getAll');
      expect(result).toEqual(expectedResponse);
    });

    it('应能通过IPC更新目标', async () => {
      // Arrange
      const goalUuid = 'goal-1';
      const updateData = { title: '新标题', progress: 50 };
      const updatedGoal: IGoal = {
        uuid: goalUuid,
        title: '新标题',
        description: '描述',
        startTime: '2024-01-01',
        endTime: '2024-12-31',
        status: 'active',
        progress: 50,
        dirId: 'dir-1',
        priority: 1,
        tags: [],
        keyResults: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      const expectedResponse = {
        success: true,
        data: updatedGoal
      };

      mockIpcRenderer.invoke.mockResolvedValue(expectedResponse);

      // Act
      const result = await goalIpcClient.updateGoal(goalUuid, updateData);

      // Assert
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('goal:update', goalUuid, updateData);
      expect(result).toEqual(expectedResponse);
    });

    it('应能通过IPC删除目标', async () => {
      // Arrange
      const goalUuid = 'goal-1';
      const expectedResponse = {
        success: true,
        message: '目标删除成功'
      };

      mockIpcRenderer.invoke.mockResolvedValue(expectedResponse);

      // Act
      const result = await goalIpcClient.deleteGoal(goalUuid);

      // Assert
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('goal:delete', goalUuid);
      expect(result).toEqual(expectedResponse);
    });

    it('应能通过IPC根据ID获取目标', async () => {
      // Arrange
      const goalUuid = 'goal-1';
      const goal: IGoal = {
        uuid: goalUuid,
        title: '测试目标',
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

      const expectedResponse = {
        success: true,
        data: goal
      };

      mockIpcRenderer.invoke.mockResolvedValue(expectedResponse);

      // Act
      const result = await goalIpcClient.getGoalById(goalUuid);

      // Assert
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('goal:getById', goalUuid);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('关键结果操作', () => {
    it('应能通过IPC创建关键结果', async () => {
      // Arrange
      const keyResultData: IKeyResult = {
        uuid: 'kr-1',
        goalUuid: 'goal-1',
        title: '关键结果1',
        description: 'KR描述',
        targetValue: 100,
        currentValue: 0,
        unit: '个',
        weight: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      const expectedResponse = {
        success: true,
        data: keyResultData
      };

      mockIpcRenderer.invoke.mockResolvedValue(expectedResponse);

      // Act
      const result = await goalIpcClient.createKeyResult(keyResultData);

      // Assert
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('keyResult:create', keyResultData);
      expect(result).toEqual(expectedResponse);
    });

    it('应能通过IPC更新关键结果', async () => {
      // Arrange
      const keyResultId = 'kr-1';
      const updateData = { currentValue: 50 };

      const expectedResponse = {
        success: true,
        data: { ...updateData, uuid: keyResultId }
      };

      mockIpcRenderer.invoke.mockResolvedValue(expectedResponse);

      // Act
      const result = await goalIpcClient.updateKeyResult(keyResultId, updateData);

      // Assert
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('keyResult:update', keyResultId, updateData);
      expect(result).toEqual(expectedResponse);
    });

    it('应能通过IPC删除关键结果', async () => {
      // Arrange
      const keyResultId = 'kr-1';
      const expectedResponse = {
        success: true,
        message: '关键结果删除成功'
      };

      mockIpcRenderer.invoke.mockResolvedValue(expectedResponse);

      // Act
      const result = await goalIpcClient.deleteKeyResult(keyResultId);

      // Assert
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('keyResult:delete', keyResultId);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('记录操作', () => {
    it('应能通过IPC创建记录', async () => {
      // Arrange
      const recordData: IRecord = {
        uuid: 'record-1',
        goalUuid: 'goal-1',
        keyResultId: 'kr-1',
        value: 10,
        description: '测试记录',
        recordedAt: '2024-01-01T10:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      const expectedResponse = {
        success: true,
        data: recordData
      };

      mockIpcRenderer.invoke.mockResolvedValue(expectedResponse);

      // Act
      const result = await goalIpcClient.createRecord(recordData);

      // Assert
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('record:create', recordData);
      expect(result).toEqual(expectedResponse);
    });

    it('应能通过IPC获取目标的记录', async () => {
      // Arrange
      const goalUuid = 'goal-1';
      const records: IRecord[] = [
        {
          uuid: 'record-1',
          goalUuid: goalUuid,
          keyResultId: 'kr-1',
          value: 10,
          description: '记录1',
          recordedAt: '2024-01-01T10:00:00.000Z',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      const expectedResponse = {
        success: true,
        data: records
      };

      mockIpcRenderer.invoke.mockResolvedValue(expectedResponse);

      // Act
      const result = await goalIpcClient.getRecordsBygoalUuid(goalUuid);

      // Assert
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('record:getBygoalUuid', goalUuid);
      expect(result).toEqual(expectedResponse);
    });

    it('应能通过IPC删除记录', async () => {
      // Arrange
      const recordId = 'record-1';
      const expectedResponse = {
        success: true,
        message: '记录删除成功'
      };

      mockIpcRenderer.invoke.mockResolvedValue(expectedResponse);

      // Act
      const result = await goalIpcClient.deleteRecord(recordId);

      // Assert
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('record:delete', recordId);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('目录操作', () => {
    it('应能通过IPC创建目录', async () => {
      // Arrange
      const dirData: IGoalDir = {
        uuid: 'dir-1',
        name: '测试目录',
        description: '目录描述',
        parentId: null,
        sortOrder: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      const expectedResponse = {
        success: true,
        data: dirData
      };

      mockIpcRenderer.invoke.mockResolvedValue(expectedResponse);

      // Act
      const result = await goalIpcClient.createGoalDir(dirData);

      // Assert
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('goalDir:create', dirData);
      expect(result).toEqual(expectedResponse);
    });

    it('应能通过IPC获取所有目录', async () => {
      // Arrange
      const dirs: IGoalDir[] = [
        {
          uuid: 'dir-1',
          name: '目录1',
          description: '描述1',
          parentId: null,
          sortOrder: 1,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      const expectedResponse = {
        success: true,
        data: dirs
      };

      mockIpcRenderer.invoke.mockResolvedValue(expectedResponse);

      // Act
      const result = await goalIpcClient.getAllGoalDirs();

      // Assert
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('goalDir:getAll');
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('批量操作', () => {
    it('应能通过IPC获取所有目标数据', async () => {
      // Arrange
      const allData = {
        goals: [{ uuid: 'goal-1', title: '目标1' }] as IGoal[],
        records: [{ uuid: 'record-1', goalUuid: 'goal-1' }] as IRecord[],
        goalDirs: [{ uuid: 'dir-1', name: '目录1' }] as IGoalDir[]
      };

      const expectedResponse = {
        success: true,
        data: allData
      };

      mockIpcRenderer.invoke.mockResolvedValue(expectedResponse);

      // Act
      const result = await goalIpcClient.getAllGoalData();

      // Assert
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('goal:getAllData');
      expect(result).toEqual(expectedResponse);
    });

    it('应能通过IPC批量创建目标', async () => {
      // Arrange
      const goals: IGoal[] = [
        {
          uuid: 'goal-1',
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
        }
      ];

      const expectedResponse = {
        success: true,
        data: goals
      };

      mockIpcRenderer.invoke.mockResolvedValue(expectedResponse);

      // Act
      const result = await goalIpcClient.batchCreateGoals(goals);

      // Assert
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('goal:batchCreate', goals);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('错误处理', () => {
    it('应正确处理IPC错误', async () => {
      // Arrange
      const error = new Error('IPC通信失败');
      mockIpcRenderer.invoke.mockRejectedValue(error);

      // Act & Assert
      await expect(goalIpcClient.getAllGoals()).rejects.toThrow('IPC通信失败');
    });

    it('应正确处理空响应', async () => {
      // Arrange
      mockIpcRenderer.invoke.mockResolvedValue(null);

      // Act
      const result = await goalIpcClient.getAllGoals();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('数据序列化', () => {
    it('应正确序列化复杂对象', async () => {
      // Arrange
      const complexGoal: IGoal = {
        uuid: 'complex-goal',
        title: '复杂目标',
        description: '包含关键结果的目标',
        startTime: '2024-01-01',
        endTime: '2024-12-31',
        status: 'active',
        progress: 0,
        dirId: 'dir-1',
        priority: 1,
        tags: ['tag1', 'tag2'],
        keyResults: [
          {
            uuid: 'kr-1',
            goalUuid: 'complex-goal',
            title: '关键结果1',
            description: '描述',
            targetValue: 100,
            currentValue: 30,
            unit: '个',
            weight: 1,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          }
        ],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      const expectedResponse = {
        success: true,
        data: complexGoal
      };

      mockIpcRenderer.invoke.mockResolvedValue(expectedResponse);

      // Act
      const result = await goalIpcClient.createGoal(complexGoal);

      // Assert
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('goal:create', complexGoal);
      expect(result).toEqual(expectedResponse);
      
      // 验证传递的数据是纯对象，没有代理或函数
      const calledArgs = mockIpcRenderer.invoke.mock.calls[0][1];
      expect(typeof calledArgs).toBe('object');
      expect(Array.isArray(calledArgs.keyResults)).toBe(true);
      expect(Array.isArray(calledArgs.tags)).toBe(true);
    });
  });
});
