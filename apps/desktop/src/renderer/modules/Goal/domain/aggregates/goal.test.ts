import { describe, it, expect, beforeEach } from 'vitest';
import { addDays } from 'date-fns';
import { Goal } from './goal';
import { KeyResult } from '../entities/keyResult';
import { GoalRecord } from '../entities/record';
import { GoalReview } from '../entities/goalReview';

describe('Goal 聚合根测试', () => {
  let goal: Goal;
  let keyResult: KeyResult;

  beforeEach(() => {
    goal = new Goal({
      name: '减肥目标',
      color: '#FF5733',
      analysis: {
        motive: '健康',
        feasibility: '高',
      },
      startTime: new Date('2024-01-01'),
      endTime: new Date('2024-12-31'),
    });

    keyResult = new KeyResult({
      name: '减重',
      startValue: 70,
      targetValue: 60,
      currentValue: 70,
      calculationMethod: 'sum',
      weight: 5,
    });
  });

  describe('构造函数和基本属性', () => {
    it('应该正确创建目标实例', () => {
      expect(goal.name).toBe('减肥目标');
      expect(goal.color).toBe('#FF5733');
      expect(goal.analysis.motive).toBe('健康');
      expect(goal.analysis.feasibility).toBe('高');
      expect(goal.lifecycle.status).toBe('active');
      expect(goal.keyResults).toHaveLength(0);
      expect(goal.records).toHaveLength(0);
      expect(goal.reviews).toHaveLength(0);
    });

    it('应该生成唯一的 UUID', () => {
      const goal1 = new Goal({
        name: '目标1',
        color: '#FF5733',
        analysis: {},
      });
      const goal2 = new Goal({
        name: '目标2',
        color: '#FF5733',
        analysis: {},
      });

      expect(goal1.uuid).not.toBe(goal2.uuid);
      expect(goal1.uuid).toMatch(/^[0-9a-f-]{36}$/i);
    });

    it('应该正确设置默认值', () => {
      const goalWithDefaults = new Goal({
        name: '测试目标',
        color: '#FF5733',
        analysis: {},
      });

      expect(goalWithDefaults.startTime).toBeInstanceOf(Date);
      expect(goalWithDefaults.endTime).toBeInstanceOf(Date);
      expect(goalWithDefaults.endTime.getTime()).toBeGreaterThan(
        goalWithDefaults.startTime.getTime(),
      );
      expect(goalWithDefaults.version).toBe(1);
    });
  });

  describe('属性验证和设置', () => {
    it('应该允许设置有效的目标名称', () => {
      goal.name = '新的目标名称';
      expect(goal.name).toBe('新的目标名称');
      expect(goal.version).toBe(2); // 版本应该递增
    });

    it('设置空名称时应该抛出错误', () => {
      expect(() => {
        goal.name = '';
      }).toThrow('目标标题不能为空');
    });

    it('应该允许设置开始时间和结束时间', () => {
      const newStartTime = new Date('2024-06-01');
      const newEndTime = new Date('2024-12-01');

      goal.startTime = newStartTime;
      goal.endTime = newEndTime;

      expect(goal.startTime).toEqual(newStartTime);
      expect(goal.endTime).toEqual(newEndTime);
    });

    it('设置开始时间晚于结束时间时应该抛出错误', () => {
      expect(() => {
        goal.startTime = new Date('2024-12-31');
      }).toThrow('开始时间必须早于结束时间');
    });

    it('设置结束时间早于开始时间时应该抛出错误', () => {
      expect(() => {
        goal.endTime = new Date('2023-01-01');
      }).toThrow('结束时间必须晚于开始时间');
    });
  });

  describe('关键结果管理', () => {
    it('应该能够添加关键结果', () => {
      goal.addKeyResult(keyResult);

      expect(goal.keyResults).toHaveLength(1);
      expect(goal.keyResults[0]).toBe(keyResult);
      expect(goal.version).toBe(2);
    });

    it('添加重复UUID的关键结果时应该抛出错误', () => {
      goal.addKeyResult(keyResult);

      expect(() => {
        goal.addKeyResult(keyResult);
      }).toThrow('Key result already exists');
    });

    it('应该能够移除关键结果', () => {
      goal.addKeyResult(keyResult);
      goal.removeKeyResult(keyResult.uuid);

      expect(goal.keyResults).toHaveLength(0);
      expect(goal.version).toBe(3);
    });

    it('移除不存在的关键结果时应该抛出错误', () => {
      expect(() => {
        goal.removeKeyResult('non-existent-uuid');
      }).toThrow('Key result not found');
    });

    it('应该能够更新关键结果', () => {
      goal.addKeyResult(keyResult);

      const updatedKeyResult = keyResult.clone();
      updatedKeyResult.name = '更新的关键结果';

      goal.updateKeyResult(updatedKeyResult);

      expect(goal.keyResults[0].name).toBe('更新的关键结果');
      expect(goal.version).toBe(3);
    });
  });

  describe('进度计算', () => {
    it('没有关键结果时进度应该为 0', () => {
      expect(goal.progress).toBe(0);
    });

    it('应该正确计算加权进度', () => {
      // 添加两个关键结果
      const kr1 = new KeyResult({
        name: '关键结果1',
        startValue: 0,
        targetValue: 100,
        currentValue: 50, // 50% 完成
        calculationMethod: 'sum',
        weight: 3,
      });

      const kr2 = new KeyResult({
        name: '关键结果2',
        startValue: 0,
        targetValue: 200,
        currentValue: 100, // 50% 完成
        calculationMethod: 'sum',
        weight: 7,
      });

      goal.addKeyResult(kr1);
      goal.addKeyResult(kr2);

      // 总权重：3 + 7 = 10
      // 加权进度：(50 * 3 + 50 * 7) / 10 = 500 / 10 = 50
      expect(goal.progress).toBe(50);
    });

    it('应该正确计算总权重', () => {
      const kr1 = new KeyResult({
        name: '关键结果1',
        startValue: 0,
        targetValue: 100,
        currentValue: 0,
        calculationMethod: 'sum',
        weight: 3,
      });

      const kr2 = new KeyResult({
        name: '关键结果2',
        startValue: 0,
        targetValue: 200,
        currentValue: 0,
        calculationMethod: 'sum',
        weight: 7,
      });

      goal.addKeyResult(kr1);
      goal.addKeyResult(kr2);

      expect(goal.totalWeight).toBe(10);
    });
  });

  describe('记录管理', () => {
    beforeEach(() => {
      goal.addKeyResult(keyResult);
    });

    it('应该能够添加记录并更新关键结果进度', () => {
      const record = new GoalRecord({
        goalUuid: goal.uuid,
        keyResultUuid: keyResult.uuid,
        value: 5,
        note: '今天减了5斤',
      });

      const initialCurrentValue = keyResult.currentValue;
      goal.addGoalRecord(record);

      expect(goal.records).toHaveLength(1);
      expect(goal.records[0]).toBe(record);
      expect(keyResult.currentValue).toBe(initialCurrentValue + 5);
      expect(goal.version).toBe(3);
    });

    it('添加不存在关键结果的记录时应该抛出错误', () => {
      const record = new GoalRecord({
        goalUuid: goal.uuid,
        keyResultUuid: 'non-existent-uuid',
        value: 5,
        note: '测试记录',
      });

      expect(() => {
        goal.addGoalRecord(record);
      }).toThrow('关键结果不存在，无法添加记录');
    });

    it('应该能够移除记录', () => {
      const record = new GoalRecord({
        goalUuid: goal.uuid,
        keyResultUuid: keyResult.uuid,
        value: 5,
        note: '测试记录',
      });

      goal.addGoalRecord(record);
      goal.removeGoalRecord(record.uuid);

      expect(goal.records).toHaveLength(0);
      expect(goal.version).toBe(4);
    });

    it('应该能够根据关键结果UUID获取记录', () => {
      const record = new GoalRecord({
        goalUuid: goal.uuid,
        keyResultUuid: keyResult.uuid,
        value: 5,
      });

      goal.addGoalRecord(record);
      const records = goal.getGoalRecordsByKeyResultUuid(keyResult.uuid);

      expect(records).toHaveLength(1);
      expect(records[0]).toBe(record);
    });
  });

  describe('复盘管理', () => {
    it('应该能够添加复盘', () => {
      const review = new GoalReview({
        goalUuid: goal.uuid,
        title: '月度复盘',
        type: 'monthly',
        reviewDate: new Date(),
        content: {
          achievements: '完成了部分目标',
          challenges: '时间管理有待改进',
          learnings: '需要更好的计划',
          nextSteps: '调整计划和执行',
        },
        snapshot: goal.createSnapShot(),
        rating: {
          progressSatisfaction: 7,
          executionEfficiency: 6,
          goalReasonableness: 8,
        },
      });

      goal.addReview(review);

      expect(goal.reviews).toHaveLength(1);
      expect(goal.reviews[0]).toBe(review);
      expect(goal.version).toBe(2);
    });

    it('应该能够移除复盘', () => {
      const review = new GoalReview({
        goalUuid: goal.uuid,
        title: '月度复盘',
        type: 'monthly',
        reviewDate: new Date(),
        content: {
          achievements: '完成了部分目标',
          challenges: '时间管理有待改进',
          learnings: '需要更好的计划',
          nextSteps: '调整计划和执行',
        },
        snapshot: goal.createSnapShot(),
        rating: {
          progressSatisfaction: 7,
          executionEfficiency: 6,
          goalReasonableness: 8,
        },
      });

      goal.addReview(review);
      goal.removeReview(review.uuid);

      expect(goal.reviews).toHaveLength(0);
      expect(goal.version).toBe(3);
    });
  });

  describe('目标状态管理', () => {
    it('应该能够归档目标', () => {
      goal.archive();

      expect(goal.lifecycle.status).toBe('archived');
      expect(goal.version).toBe(2);
    });

    it('应该能够完成目标', () => {
      goal.complete();

      expect(goal.lifecycle.status).toBe('completed');
      expect(goal.version).toBe(2);
    });

    it('应该能够暂停目标', () => {
      goal.pause();

      expect(goal.lifecycle.status).toBe('paused');
      expect(goal.version).toBe(2);
    });

    it('应该能够激活目标', () => {
      goal.pause();
      goal.activate();

      expect(goal.lifecycle.status).toBe('active');
      expect(goal.version).toBe(3);
    });
  });

  describe('快照创建', () => {
    beforeEach(() => {
      const kr1 = new KeyResult({
        name: '关键结果1',
        startValue: 0,
        targetValue: 100,
        currentValue: 50,
        calculationMethod: 'sum',
        weight: 5,
      });
      goal.addKeyResult(kr1);
    });

    it('应该能够创建目标快照', () => {
      const snapshot = goal.createSnapShot();

      expect(snapshot).toHaveProperty('snapshotDate');
      expect(snapshot).toHaveProperty('overallProgress');
      expect(snapshot).toHaveProperty('weightedProgress');
      expect(snapshot).toHaveProperty('completedKeyResults');
      expect(snapshot).toHaveProperty('totalKeyResults');
      expect(snapshot).toHaveProperty('keyResultsSnapshot');

      expect(snapshot.snapshotDate).toBeInstanceOf(Date);
      expect(snapshot.totalKeyResults).toBe(1);
      expect(snapshot.keyResultsSnapshot).toHaveLength(1);
      expect(snapshot.keyResultsSnapshot[0]).toHaveProperty('uuid');
      expect(snapshot.keyResultsSnapshot[0]).toHaveProperty('name');
      expect(snapshot.keyResultsSnapshot[0]).toHaveProperty('progress');
    });
  });

  describe('时间相关计算', () => {
    it('应该正确计算时间进度', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const goal = new Goal({
        name: '测试目标',
        color: '#FF5733',
        analysis: {},
        startTime: startDate,
        endTime: endDate,
      });

      expect(goal.TimeProgress).toBeGreaterThanOrEqual(0);
      expect(goal.TimeProgress).toBeLessThanOrEqual(1);
    });

    it('应该正确计算剩余天数', () => {
      const today = new Date();
      const futureDate = addDays(today, 30);
      const goal = new Goal({
        name: '测试目标',
        color: '#FF5733',
        analysis: {},
        startTime: today,
        endTime: futureDate,
      });

      expect(goal.remainingDays).toBeCloseTo(30, 0);
    });
  });

  describe('数据转换', () => {
    it('应该能够转换为 DTO', () => {
      const dto = goal.toDTO();

      expect(dto).toHaveProperty('uuid');
      expect(dto).toHaveProperty('name');
      expect(dto).toHaveProperty('color');
      expect(dto).toHaveProperty('keyResults');
      expect(dto).toHaveProperty('records');
      expect(dto).toHaveProperty('reviews');
      expect(dto).toHaveProperty('analysis');
      expect(dto).toHaveProperty('lifecycle');
      expect(dto).toHaveProperty('version');

      expect(dto.name).toBe(goal.name);
      expect(dto.uuid).toBe(goal.uuid);
    });

    it('应该能够从 DTO 创建实例', () => {
      const dto = goal.toDTO();
      const newGoal = Goal.fromDTO(dto);

      expect(newGoal.uuid).toBe(goal.uuid);
      expect(newGoal.name).toBe(goal.name);
      expect(newGoal.color).toBe(goal.color);
      expect(newGoal.lifecycle.status).toBe(goal.lifecycle.status);
    });

    it('应该能够克隆目标', () => {
      const clonedGoal = goal.clone();

      expect(clonedGoal).not.toBe(goal);
      expect(clonedGoal.uuid).toBe(goal.uuid);
      expect(clonedGoal.name).toBe(goal.name);
      expect(clonedGoal.color).toBe(goal.color);
    });

    it('应该能够创建用于新建的目标实例', () => {
      const createGoal = Goal.forCreate();

      expect(createGoal.name).toBe('');
      expect(createGoal.color).toBe('#FF5733');
      expect(createGoal.lifecycle.status).toBe('active');
    });
  });

  describe('静态方法', () => {
    it('isGoal 应该正确识别 Goal 实例', () => {
      expect(Goal.isGoal(goal)).toBe(true);
      expect(Goal.isGoal({})).toBe(false);
      expect(Goal.isGoal(null)).toBeFalsy();
      expect(Goal.isGoal(undefined)).toBeFalsy();
    });

    it('ensureGoal 应该正确处理各种输入', () => {
      expect(Goal.ensureGoal(goal)).toBe(goal);
      expect(Goal.ensureGoal(null)).toBe(null);

      const dto = goal.toDTO();
      const ensuredGoal = Goal.ensureGoal(dto);
      expect(ensuredGoal).toBeInstanceOf(Goal);
      expect(ensuredGoal?.uuid).toBe(goal.uuid);
    });

    it('ensureGoalNeverNull 应该始终返回 Goal 实例', () => {
      expect(Goal.ensureGoalNeverNull(goal)).toBe(goal);

      const defaultGoal = Goal.ensureGoalNeverNull(null);
      expect(defaultGoal).toBeInstanceOf(Goal);
      expect(defaultGoal.name).toBe('');
    });
  });

  describe('analytics 属性', () => {
    beforeEach(() => {
      const kr1 = new KeyResult({
        name: '完成的关键结果',
        startValue: 0,
        targetValue: 100,
        currentValue: 100, // 100% 完成
        calculationMethod: 'sum',
        weight: 5,
      });

      const kr2 = new KeyResult({
        name: '未完成的关键结果',
        startValue: 0,
        targetValue: 100,
        currentValue: 50, // 50% 完成
        calculationMethod: 'sum',
        weight: 5,
      });

      goal.addKeyResult(kr1);
      goal.addKeyResult(kr2);
    });

    it('应该正确计算 completedKeyResults', () => {
      expect(goal.completedKeyResults).toBe(1);
    });

    it('应该正确计算 totalKeyResults', () => {
      expect(goal.totalKeyResults).toBe(2);
    });

    it('应该正确计算 overallProgress', () => {
      expect(goal.overallProgress).toBe(75); // (100 + 50) / 2 = 75
    });

    it('应该正确计算 weightedProgress', () => {
      expect(goal.weightedProgress).toBe(75); // 与 progress 相同
    });
  });
});
