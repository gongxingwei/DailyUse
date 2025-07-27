import { describe, it, expect } from '@jest/globals';
import { Goal } from '@/modules/Goal/domain/aggregates/goal';
import { KeyResult } from '@/modules/Goal/domain/entities/keyResult';
import { Record } from '@/modules/Goal/domain/entities/record';
import { GoalDir } from '@/modules/Goal/domain/aggregates/goalDir';
import type { IGoal, IKeyResult, IRecord, IGoalDir } from '@/modules/Goal/domain/types/goal';

describe('Goal Domain Entities', () => {
  describe('Goal Entity', () => {
    const mockGoalData: IGoal = {
      uuid: 'goal-1',
      title: '测试目标',
      description: '目标描述',
      startTime: '2024-01-01',
      endTime: '2024-12-31',
      status: 'active',
      progress: 0,
      dirId: 'dir-1',
      priority: 1,
      tags: ['test', 'sample'],
      keyResults: [
        {
          uuid: 'kr-1',
          goalUuid: 'goal-1',
          title: 'KR1',
          description: 'KR描述',
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

    it('应正确创建目标实体', () => {
      const goal = new Goal(mockGoalData);
      
      expect(goal.getId()).toBe('goal-1');
      expect(goal.getTitle()).toBe('测试目标');
      expect(goal.getDescription()).toBe('目标描述');
      expect(goal.getStatus()).toBe('active');
      expect(goal.getProgress()).toBe(0);
      expect(goal.getPriority()).toBe(1);
      expect(goal.getTags()).toEqual(['test', 'sample']);
      expect(goal.getKeyResults()).toHaveLength(1);
    });

    it('应正确转换为DTO', () => {
      const goal = new Goal(mockGoalData);
      const dto = goal.toDTO();
      
      expect(dto).toEqual(mockGoalData);
      expect(dto.keyResults).toHaveLength(1);
      expect(dto.keyResults[0].id).toBe('kr-1');
    });

    it('应正确从DTO创建实体', () => {
      const goal = Goal.fromDTO(mockGoalData);
      
      expect(goal.getId()).toBe('goal-1');
      expect(goal.getTitle()).toBe('测试目标');
      expect(goal.getKeyResults()).toHaveLength(1);
    });

    it('应正确更新目标信息', () => {
      const goal = new Goal(mockGoalData);
      
      goal.updateTitle('新标题');
      goal.updateDescription('新描述');
      goal.updateStatus('completed');
      goal.updateProgress(100);
      goal.updatePriority(2);
      
      expect(goal.getTitle()).toBe('新标题');
      expect(goal.getDescription()).toBe('新描述');
      expect(goal.getStatus()).toBe('completed');
      expect(goal.getProgress()).toBe(100);
      expect(goal.getPriority()).toBe(2);
    });

    it('应正确管理标签', () => {
      const goal = new Goal(mockGoalData);
      
      goal.addTag('新标签');
      expect(goal.getTags()).toContain('新标签');
      expect(goal.getTags()).toHaveLength(3);
      
      goal.removeTag('test');
      expect(goal.getTags()).not.toContain('test');
      expect(goal.getTags()).toHaveLength(2);
      
      goal.setTags(['标签1', '标签2']);
      expect(goal.getTags()).toEqual(['标签1', '标签2']);
    });

    it('应正确管理关键结果', () => {
      const goal = new Goal(mockGoalData);
      const newKR: IKeyResult = {
        uuid: 'kr-2',
        goalUuid: 'goal-1',
        title: 'KR2',
        description: 'KR2描述',
        targetValue: 50,
        currentValue: 0,
        unit: '次',
        weight: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };
      
      goal.addKeyResult(newKR);
      expect(goal.getKeyResults()).toHaveLength(2);
      expect(goal.getKeyResults()[1].id).toBe('kr-2');
      
      goal.removeKeyResult('kr-1');
      expect(goal.getKeyResults()).toHaveLength(1);
      expect(goal.getKeyResults()[0].id).toBe('kr-2');
    });

    it('应正确计算目标进度', () => {
      const goal = new Goal(mockGoalData);
      
      // 假设基于关键结果计算进度
      const calculatedProgress = goal.calculateProgress();
      expect(calculatedProgress).toBeGreaterThanOrEqual(0);
      expect(calculatedProgress).toBeLessThanOrEqual(100);
    });

    it('应正确判断目标是否过期', () => {
      const expiredGoalData = { ...mockGoalData, endTime: '2023-12-31' };
      const expiredGoal = new Goal(expiredGoalData);
      
      expect(expiredGoal.isExpired()).toBe(true);
      
      const activeGoal = new Goal(mockGoalData);
      expect(activeGoal.isExpired()).toBe(false);
    });

    it('应正确进行深度序列化', () => {
      const goal = new Goal(mockGoalData);
      const serialized = goal.deepSerialize();
      
      expect(serialized).toEqual(mockGoalData);
      expect(typeof serialized).toBe('object');
      expect(Array.isArray(serialized.keyResults)).toBe(true);
    });
  });

  describe('KeyResult Entity', () => {
    const mockKeyResultData: IKeyResult = {
      uuid: 'kr-1',
      goalUuid: 'goal-1',
      title: '关键结果1',
      description: 'KR描述',
      targetValue: 100,
      currentValue: 30,
      unit: '个',
      weight: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    };

    it('应正确创建关键结果实体', () => {
      const kr = new KeyResult(mockKeyResultData);
      
      expect(kr.getId()).toBe('kr-1');
      expect(kr.getgoalUuid()).toBe('goal-1');
      expect(kr.getTitle()).toBe('关键结果1');
      expect(kr.getTargetValue()).toBe(100);
      expect(kr.getCurrentValue()).toBe(30);
      expect(kr.getUnit()).toBe('个');
      expect(kr.getWeight()).toBe(1);
    });

    it('应正确计算完成百分比', () => {
      const kr = new KeyResult(mockKeyResultData);
      
      expect(kr.getCompletionPercentage()).toBe(30);
      
      kr.updateCurrentValue(50);
      expect(kr.getCompletionPercentage()).toBe(50);
      
      kr.updateCurrentValue(120); // 超过目标值
      expect(kr.getCompletionPercentage()).toBe(100);
    });

    it('应正确判断是否已完成', () => {
      const kr = new KeyResult(mockKeyResultData);
      
      expect(kr.isCompleted()).toBe(false);
      
      kr.updateCurrentValue(100);
      expect(kr.isCompleted()).toBe(true);
    });

    it('应正确更新当前值', () => {
      const kr = new KeyResult(mockKeyResultData);
      
      kr.updateCurrentValue(60);
      expect(kr.getCurrentValue()).toBe(60);
      
      kr.incrementCurrentValue(10);
      expect(kr.getCurrentValue()).toBe(70);
    });
  });

  describe('Record Entity', () => {
    const mockRecordData: IRecord = {
      uuid: 'record-1',
      goalUuid: 'goal-1',
      keyResultId: 'kr-1',
      value: 10,
      description: '测试记录',
      recordedAt: '2024-01-01T10:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    };

    it('应正确创建记录实体', () => {
      const record = new Record(mockRecordData);
      
      expect(record.getId()).toBe('record-1');
      expect(record.getgoalUuid()).toBe('goal-1');
      expect(record.getKeyResultId()).toBe('kr-1');
      expect(record.getValue()).toBe(10);
      expect(record.getDescription()).toBe('测试记录');
    });

    it('应正确更新记录值', () => {
      const record = new Record(mockRecordData);
      
      record.updateValue(20);
      expect(record.getValue()).toBe(20);
      
      record.updateDescription('更新后的描述');
      expect(record.getDescription()).toBe('更新后的描述');
    });

    it('应正确获取记录时间', () => {
      const record = new Record(mockRecordData);
      
      expect(record.getRecordedAt()).toBe('2024-01-01T10:00:00.000Z');
    });
  });

  describe('GoalDir Entity', () => {
    const mockGoalDirData: IGoalDir = {
      uuid: 'dir-1',
      name: '测试目录',
      description: '目录描述',
      parentId: null,
      sortOrder: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    };

    it('应正确创建目录实体', () => {
      const dir = new GoalDir(mockGoalDirData);
      
      expect(dir.getId()).toBe('dir-1');
      expect(dir.getName()).toBe('测试目录');
      expect(dir.getDescription()).toBe('目录描述');
      expect(dir.getParentId()).toBeNull();
      expect(dir.getSortOrder()).toBe(1);
    });

    it('应正确更新目录信息', () => {
      const dir = new GoalDir(mockGoalDirData);
      
      dir.updateName('新目录名');
      dir.updateDescription('新描述');
      dir.updateSortOrder(2);
      
      expect(dir.getName()).toBe('新目录名');
      expect(dir.getDescription()).toBe('新描述');
      expect(dir.getSortOrder()).toBe(2);
    });

    it('应正确判断是否为根目录', () => {
      const rootDir = new GoalDir(mockGoalDirData);
      expect(rootDir.isRoot()).toBe(true);
      
      const childDirData = { ...mockGoalDirData, parentId: 'parent-dir' };
      const childDir = new GoalDir(childDirData);
      expect(childDir.isRoot()).toBe(false);
    });
  });

  describe('Entity Serialization', () => {
    it('所有实体应支持JSON序列化', () => {
      const goalData: IGoal = {
        uuid: 'goal-1',
        title: '测试',
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
      
      const goal = new Goal(goalData);
      const serialized = JSON.stringify(goal.toDTO());
      const parsed = JSON.parse(serialized);
      
      expect(parsed.uuid).toBe('goal-1');
      expect(parsed.title).toBe('测试');
    });
  });
});
