import { Goal } from '../aggregates/Goal';
import { KeyResult } from '../entities/KeyResult';
import { GoalRecord } from '../entities/GoalRecord';
import { sharedContracts } from '@dailyuse/contracts';

const ImportanceLevel = sharedContracts.ImportanceLevel;
const UrgencyLevel = sharedContracts.UrgencyLevel;

describe('Goal todayProgress 计算', () => {
  let goal: Goal;
  let keyResult1: KeyResult;
  let keyResult2: KeyResult;

  beforeEach(() => {
    // 创建测试目标
    goal = new Goal({
      accountUuid: 'test-account-123',
      name: '测试目标',
      description: '用于测试今日进度计算的目标',
      color: '#FF5733',
      startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天前开始
      endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后结束
      importanceLevel: ImportanceLevel.Moderate,
      urgencyLevel: UrgencyLevel.Medium,
    });

    // 创建测试关键结果
    keyResult1 = new KeyResult({
      accountUuid: 'test-account-123',
      goalUuid: goal.uuid,
      name: '关键结果1',
      description: '测试关键结果1',
      startValue: 0,
      targetValue: 100,
      currentValue: 50, // 当前进度50%
      unit: '个',
      weight: 60, // 权重60%
    });

    keyResult2 = new KeyResult({
      accountUuid: 'test-account-123',
      goalUuid: goal.uuid,
      name: '关键结果2',
      description: '测试关键结果2',
      startValue: 0,
      targetValue: 200,
      currentValue: 80, // 当前进度40%
      unit: '次',
      weight: 40, // 权重40%
    });

    // 将关键结果添加到目标
    goal.keyResults = [keyResult1, keyResult2];
  });

  describe('无记录情况', () => {
    test('应该返回0当没有任何记录时', () => {
      expect(goal.todayProgress).toBe(0);
    });

    test('应该返回0当没有今日记录时', () => {
      // 添加昨天的记录
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const oldRecord = new GoalRecord({
        accountUuid: 'test-account-123',
        goalUuid: goal.uuid,
        keyResultUuid: keyResult1.uuid,
        value: 10,
        createdAt: yesterday,
      });

      goal.records = [oldRecord];
      expect(goal.todayProgress).toBe(0);
    });
  });

  describe('有今日记录情况', () => {
    test('应该正确计算单个关键结果的今日进度', () => {
      // 今天为关键结果1添加了10个单位的进度
      const todayRecord = new GoalRecord({
        accountUuid: 'test-account-123',
        goalUuid: goal.uuid,
        keyResultUuid: keyResult1.uuid,
        value: 10, // 相对于目标100，增加了10%的进度
        createdAt: new Date(), // 今天
      });

      goal.records = [todayRecord];

      // 关键结果1权重60%，进度增长10%，所以目标总进度增长 = 10% * 60% = 6%
      expect(goal.todayProgress).toBeCloseTo(6, 1);
    });

    test('应该正确计算多个关键结果的加权今日进度', () => {
      const now = new Date();

      // 关键结果1今天增加10个单位 (10%)
      const record1 = new GoalRecord({
        accountUuid: 'test-account-123',
        goalUuid: goal.uuid,
        keyResultUuid: keyResult1.uuid,
        value: 10,
        createdAt: now,
      });

      // 关键结果2今天增加20个单位 (10%)
      const record2 = new GoalRecord({
        accountUuid: 'test-account-123',
        goalUuid: goal.uuid,
        keyResultUuid: keyResult2.uuid,
        value: 20,
        createdAt: now,
      });

      goal.records = [record1, record2];

      // 加权计算: (10% * 60% + 10% * 40%) = 6% + 4% = 10%
      expect(goal.todayProgress).toBeCloseTo(10, 1);
    });

    test('应该正确计算同一关键结果的多次记录', () => {
      const now = new Date();

      // 关键结果1今天有两次记录
      const record1 = new GoalRecord({
        accountUuid: 'test-account-123',
        goalUuid: goal.uuid,
        keyResultUuid: keyResult1.uuid,
        value: 5, // 5%
        createdAt: now,
      });

      const record2 = new GoalRecord({
        accountUuid: 'test-account-123',
        goalUuid: goal.uuid,
        keyResultUuid: keyResult1.uuid,
        value: 10, // 10%
        createdAt: now,
      });

      goal.records = [record1, record2];

      // 关键结果1总进度增长15%，权重60%，所以目标进度 = 15% * 60% = 9%
      expect(goal.todayProgress).toBeCloseTo(9, 1);
    });

    test('应该正确处理时间边界', () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // 今天开始时的记录
      const startRecord = new GoalRecord({
        accountUuid: 'test-account-123',
        goalUuid: goal.uuid,
        keyResultUuid: keyResult1.uuid,
        value: 5,
        createdAt: todayStart,
      });

      // 今天结束时的记录
      const endRecord = new GoalRecord({
        accountUuid: 'test-account-123',
        goalUuid: goal.uuid,
        keyResultUuid: keyResult1.uuid,
        value: 5,
        createdAt: todayEnd,
      });

      goal.records = [startRecord, endRecord];

      // 两个记录都应该被计算在内
      expect(goal.todayProgress).toBeCloseTo(6, 1); // (5% + 5%) * 60% = 6%
    });
  });

  describe('todayRecordsStats 统计', () => {
    test('应该正确统计今日记录信息', () => {
      const now = new Date();

      const record1 = new GoalRecord({
        accountUuid: 'test-account-123',
        goalUuid: goal.uuid,
        keyResultUuid: keyResult1.uuid,
        value: 10,
        createdAt: now,
      });

      const record2 = new GoalRecord({
        accountUuid: 'test-account-123',
        goalUuid: goal.uuid,
        keyResultUuid: keyResult2.uuid,
        value: 20,
        createdAt: now,
      });

      goal.records = [record1, record2];

      const stats = goal.todayRecordsStats;

      expect(stats.totalRecords).toBe(2);
      expect(stats.keyResultsWithRecords).toBe(2);
      expect(stats.totalRecordValue).toBe(30);
      expect(stats.averageRecordValue).toBe(15);
    });

    test('应该返回空统计当没有今日记录时', () => {
      const stats = goal.todayRecordsStats;

      expect(stats.totalRecords).toBe(0);
      expect(stats.keyResultsWithRecords).toBe(0);
      expect(stats.totalRecordValue).toBe(0);
      expect(stats.averageRecordValue).toBe(0);
    });
  });

  describe('边界情况处理', () => {
    test('应该处理目标值为0的关键结果', () => {
      const invalidKeyResult = new KeyResult({
        accountUuid: 'test-account-123',
        goalUuid: goal.uuid,
        name: '无效关键结果',
        startValue: 0,
        targetValue: 0, // 目标值为0
        currentValue: 0,
        unit: '个',
        weight: 50,
      });

      goal.keyResults = [invalidKeyResult];

      const record = new GoalRecord({
        accountUuid: 'test-account-123',
        goalUuid: goal.uuid,
        keyResultUuid: invalidKeyResult.uuid,
        value: 10,
        createdAt: new Date(),
      });

      goal.records = [record];

      // 目标值为0时应该返回0进度
      expect(goal.todayProgress).toBe(0);
    });

    test('应该处理没有关键结果的目标', () => {
      goal.keyResults = [];

      const record = new GoalRecord({
        accountUuid: 'test-account-123',
        goalUuid: goal.uuid,
        keyResultUuid: 'non-existent-kr',
        value: 10,
        createdAt: new Date(),
      });

      goal.records = [record];

      expect(goal.todayProgress).toBe(0);
    });

    test('应该限制进度变化在合理范围内', () => {
      const record = new GoalRecord({
        accountUuid: 'test-account-123',
        goalUuid: goal.uuid,
        keyResultUuid: keyResult1.uuid,
        value: 1000, // 远超目标值的记录
        createdAt: new Date(),
      });

      goal.records = [record];

      // 进度变化应该被限制在100%以内
      const maxExpectedProgress = (100 * keyResult1.weight) / 100; // 60%
      expect(goal.todayProgress).toBeLessThanOrEqual(maxExpectedProgress);
    });
  });
});
