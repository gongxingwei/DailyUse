/**
 * Goal todayProgress 功能测试
 * 验证今日进度计算是否正常工作
 */

import { Goal } from '@dailyuse/domain-client';
import { KeyResult } from '@dailyuse/domain-client';
import { GoalRecord } from '@dailyuse/domain-client';

describe('Goal todayProgress 功能测试', () => {
  let goal: Goal;
  let keyResult1: KeyResult;
  let keyResult2: KeyResult;

  beforeEach(() => {
    // 创建测试目标
    goal = new Goal({
      name: '测试目标',
      color: '#FF5733',
      startTime: new Date(),
      endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后
      keyResults: [],
      records: [],
      reviews: [],
    });

    // 创建测试关键结果
    keyResult1 = new KeyResult({
      uuid: 'kr1',
      accountUuid: 'acc1',
      goalUuid: goal.uuid,
      name: '关键结果1',
      startValue: 0,
      targetValue: 100,
      currentValue: 20,
      unit: '个',
      weight: 60, // 60% 权重
      calculationMethod: 'sum',
    });

    keyResult2 = new KeyResult({
      uuid: 'kr2',
      accountUuid: 'acc1',
      goalUuid: goal.uuid,
      name: '关键结果2',
      startValue: 0,
      targetValue: 50,
      currentValue: 10,
      unit: '次',
      weight: 40, // 40% 权重
      calculationMethod: 'sum',
    });

    goal.keyResults = [keyResult1, keyResult2];
  });

  test('无今日记录时 todayProgress 应为 0', () => {
    expect(goal.getTodayProgress()).toBe(0);
    expect(goal.hasTodayProgress).toBe(false);
    expect(goal.todayProgressLevel).toBe('none');
    expect(goal.todayProgressText).toBe('今日无进展');
  });

  test('有今日记录时应正确计算 todayProgress', () => {
    const today = new Date();

    // 添加今日记录
    const record1 = new GoalRecord({
      uuid: 'rec1',
      accountUuid: 'acc1',
      goalUuid: goal.uuid,
      keyResultUuid: 'kr1',
      value: 10, // 对于目标值100，这是10%的进度
      createdAt: today,
    });

    const record2 = new GoalRecord({
      uuid: 'rec2',
      accountUuid: 'acc1',
      goalUuid: goal.uuid,
      keyResultUuid: 'kr2',
      value: 5, // 对于目标值50，这是10%的进度
      createdAt: today,
    });

    goal.records = [record1, record2];

    const expectedProgress = 10 * 0.6 + 10 * 0.4; // 加权平均
    expect(goal.getTodayProgress()).toBe(expectedProgress);
    expect(goal.hasTodayProgress).toBe(true);
    expect(goal.todayProgressLevel).toBe('medium');
    expect(goal.todayProgressText).toContain('+');
  });

  test('非今日记录不应影响 todayProgress', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 添加昨日记录
    const record = new GoalRecord({
      uuid: 'rec1',
      accountUuid: 'acc1',
      goalUuid: goal.uuid,
      keyResultUuid: 'kr1',
      value: 20,
      createdAt: yesterday,
    });

    goal.records = [record];

    expect(goal.getTodayProgress()).toBe(0);
    expect(goal.hasTodayProgress).toBe(false);
  });

  test('todayProgress 等级分类正确', () => {
    // 测试不同进度等级
    const testCases = [
      { progress: 0, level: 'none' },
      { progress: 3, level: 'low' },
      { progress: 10, level: 'medium' },
      { progress: 25, level: 'high' },
      { progress: 35, level: 'excellent' },
    ];

    testCases.forEach(({ progress, level }) => {
      // 模拟特定进度
      goal.getTodayProgress = jest.fn().mockReturnValue(progress);
      expect(goal.todayProgressLevel).toBe(level);
    });
  });

  test('todayProgress 颜色映射正确', () => {
    const colorMap = {
      none: '#9E9E9E',
      low: '#FF9800',
      medium: '#2196F3',
      high: '#4CAF50',
      excellent: '#8BC34A',
    };

    Object.entries(colorMap).forEach(([level, expectedColor]) => {
      goal.todayProgressLevel = level as any;
      expect(goal.todayProgressColor).toBe(expectedColor);
    });
  });

  test('todayProgress 图标映射正确', () => {
    const iconMap = {
      none: 'mdi-minus-circle-outline',
      low: 'mdi-trending-up',
      medium: 'mdi-arrow-up-circle',
      high: 'mdi-chart-line-variant',
      excellent: 'mdi-rocket-launch',
    };

    Object.entries(iconMap).forEach(([level, expectedIcon]) => {
      goal.todayProgressLevel = level as any;
      expect(goal.todayProgressIcon).toBe(expectedIcon);
    });
  });

  test('多个今日记录应正确累计', () => {
    const today = new Date();

    // 同一关键结果的多个记录
    const records = [
      new GoalRecord({
        uuid: 'rec1',
        accountUuid: 'acc1',
        goalUuid: goal.uuid,
        keyResultUuid: 'kr1',
        value: 5,
        createdAt: today,
      }),
      new GoalRecord({
        uuid: 'rec2',
        accountUuid: 'acc1',
        goalUuid: goal.uuid,
        keyResultUuid: 'kr1',
        value: 5,
        createdAt: today,
      }),
    ];

    goal.records = records;

    // 两个记录，每个5，总共10对于目标100是10%
    const expectedProgress = 10 * 0.6; // 仅kr1有记录，权重60%
    expect(goal.getTodayProgress()).toBe(expectedProgress);
  });

  test('今日记录统计功能正确', () => {
    const today = new Date();

    const records = [
      new GoalRecord({
        uuid: 'rec1',
        accountUuid: 'acc1',
        goalUuid: goal.uuid,
        keyResultUuid: 'kr1',
        value: 5,
        createdAt: today,
      }),
      new GoalRecord({
        uuid: 'rec2',
        accountUuid: 'acc1',
        goalUuid: goal.uuid,
        keyResultUuid: 'kr2',
        value: 3,
        createdAt: today,
      }),
    ];

    goal.records = records;

    const stats = goal.todayRecordsStats;
    expect(stats.totalRecords).toBe(2);
    expect(stats.keyResultsWithRecords).toBe(2);
    expect(stats.totalRecordValue).toBe(8);
    expect(stats.averageRecordValue).toBe(4);
  });
});
