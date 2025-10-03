/**
 * Goal 模块 API 集成测试 - 适配新 DTO 架构
 *
 * 测试要点：
 * 1. 前端 UUID 生成
 * 2. RESTful 路由设计（通过聚合根访问子实体）
 * 3. 使用新的 ClientDTO 类型
 * 4. 扁平化的 UpdateGoalRequest
 */

import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import {
  GoalContracts,
  ImportanceLevel,
  UrgencyLevel,
  GoalStatus,
  KeyResultStatus,
  KeyResultCalculationMethod,
} from '@dailyuse/contracts';
import app from '../../../../app';
import { ApiTestHelpers } from '../../../../test/setup';
import { setMockData, resetMockData } from '../../../../test/mocks/prismaMock';

// 类型别名，方便使用
type GoalPersistenceDTO = GoalContracts.GoalPersistenceDTO;
type KeyResultPersistenceDTO = GoalContracts.KeyResultPersistenceDTO;
type GoalRecordPersistenceDTO = GoalContracts.GoalRecordPersistenceDTO;
type CreateGoalRequest = GoalContracts.CreateGoalRequest;
type UpdateGoalRequest = GoalContracts.UpdateGoalRequest;
type CreateKeyResultRequest = GoalContracts.CreateKeyResultRequest;
type UpdateKeyResultRequest = GoalContracts.UpdateKeyResultRequest;
type CreateGoalRecordRequest = GoalContracts.CreateGoalRecordRequest;

describe('[集成测试] Goal 模块 - 新 DTO 架构', () => {
  let authToken: string;
  const testAccountUuid: string = 'test-account-123';

  beforeEach(async () => {
    resetMockData();

    // Mock Account 数据
    setMockData('account', [
      {
        uuid: testAccountUuid,
        username: 'testuser',
        email: 'test@example.com',
        accountType: 'local',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    authToken = await ApiTestHelpers.createTestToken({ accountUuid: testAccountUuid });
  });

  // ===== 1. Goal CRUD 测试 =====

  describe('POST /api/v1/goals - 创建目标（前端 UUID）', () => {
    it('应该成功创建目标，使用前端生成的 UUID', async () => {
      const goalUuid = uuidv4(); // ✅ 前端生成 UUID

      // ✅ 使用 CreateGoalRequest 类型
      const createRequest: CreateGoalRequest = {
        uuid: goalUuid,
        name: '学习 TypeScript 高级特性',
        description: '深入学习泛型、类型体操等高级主题',
        color: '#3B82F6',
        startTime: Date.now(),
        endTime: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90天后
        analysis: {
          motive: '提升技术能力',
          feasibility: '每天学习2小时',
          importanceLevel: ImportanceLevel.Important,
          urgencyLevel: UrgencyLevel.Medium,
        },
        metadata: {
          tags: ['学习', '前端'],
          category: '技术',
        },
      };

      // Mock 持久化 DTO 数据
      const mockGoalDTO: Partial<GoalPersistenceDTO> = {
        uuid: goalUuid,
        accountUuid: testAccountUuid,
        name: createRequest.name,
        description: createRequest.description,
        color: createRequest.color,
        startTime: new Date(createRequest.startTime),
        endTime: new Date(createRequest.endTime),
        note: undefined,
        dirUuid: undefined,
        motive: createRequest.analysis.motive,
        feasibility: createRequest.analysis.feasibility,
        importanceLevel: createRequest.analysis.importanceLevel,
        urgencyLevel: createRequest.analysis.urgencyLevel,
        tags: JSON.stringify(createRequest.metadata.tags),
        category: createRequest.metadata.category,
        status: GoalStatus.ACTIVE,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setMockData('goal', [mockGoalDTO]);

      const response = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createRequest)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.uuid).toBe(goalUuid); // ✅ 验证使用了前端的 UUID
      expect(response.body.data.name).toBe(createRequest.name);
    });

    it('应该支持创建时同时添加关键结果', async () => {
      const goalUuid = uuidv4();
      const kr1Uuid = uuidv4();
      const kr2Uuid = uuidv4();

      // ✅ 使用 CreateGoalRequest 类型，包含 CreateKeyResultRequest[]
      const createRequest: CreateGoalRequest = {
        uuid: goalUuid,
        name: '完成项目重构',
        color: '#10B981',
        startTime: Date.now(),
        endTime: Date.now() + 60 * 24 * 60 * 60 * 1000,
        analysis: {
          motive: '提升代码质量',
          feasibility: '分阶段进行',
          importanceLevel: ImportanceLevel.Vital,
          urgencyLevel: UrgencyLevel.High,
        },
        metadata: {
          tags: ['工作'],
          category: '项目',
        },
        keyResults: [
          {
            uuid: kr1Uuid,
            name: '重构用户模块',
            startValue: 0,
            targetValue: 100,
            unit: '%',
            weight: 50,
          },
          {
            uuid: kr2Uuid,
            name: '编写单元测试',
            startValue: 0,
            targetValue: 50,
            unit: '个',
            weight: 50,
          },
        ],
      };

      // Mock Goal 数据
      const mockGoalDTO: Partial<GoalPersistenceDTO> = {
        uuid: goalUuid,
        accountUuid: testAccountUuid,
        name: createRequest.name,
        color: createRequest.color,
        startTime: new Date(createRequest.startTime),
        endTime: new Date(createRequest.endTime),
        motive: createRequest.analysis.motive,
        feasibility: createRequest.analysis.feasibility,
        importanceLevel: ImportanceLevel.Vital,
        urgencyLevel: UrgencyLevel.High,
        tags: JSON.stringify(createRequest.metadata.tags),
        category: createRequest.metadata.category,
        status: GoalStatus.ACTIVE,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock KeyResults 数据
      const mockKeyResults: Partial<KeyResultPersistenceDTO>[] = [
        {
          uuid: kr1Uuid,
          goalUuid: goalUuid,
          name: '重构用户模块',
          startValue: 0,
          targetValue: 100,
          currentValue: 0,
          unit: '%',
          weight: 50,
          calculationMethod: KeyResultCalculationMethod.SUM,
          status: KeyResultStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          uuid: kr2Uuid,
          goalUuid: goalUuid,
          name: '编写单元测试',
          startValue: 0,
          targetValue: 50,
          currentValue: 0,
          unit: '个',
          weight: 50,
          calculationMethod: KeyResultCalculationMethod.SUM,
          status: KeyResultStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      setMockData('goal', [mockGoalDTO]);
      setMockData('keyResult', mockKeyResults);

      const response = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createRequest)
        .expect(201);

      expect(response.body.data.keyResults).toHaveLength(2);
      expect(response.body.data.keyResults[0].uuid).toBe(kr1Uuid);
      expect(response.body.data.keyResults[1].uuid).toBe(kr2Uuid);
    });

    it('应该拒绝无效的 UUID 格式', async () => {
      const createRequest = {
        uuid: 'invalid-uuid-format', // ❌ 无效 UUID
        name: '测试目标',
        color: '#000000',
        startTime: Date.now(),
        endTime: Date.now() + 30 * 24 * 60 * 60 * 1000,
        analysis: {
          motive: '测试',
          feasibility: '测试',
          importanceLevel: 'moderate' as const,
          urgencyLevel: 'medium' as const,
        },
        metadata: {
          tags: [],
          category: '测试',
        },
      };

      const response = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('UUID');
    });
  });

  describe('PUT /api/v1/goals/:id - 更新目标（扁平化结构）', () => {
    let goalUuid: string;

    beforeEach(() => {
      goalUuid = uuidv4();

      // Mock Goal 数据 - 使用扁平化结构
      const mockGoalDTO: Partial<GoalPersistenceDTO> = {
        uuid: goalUuid,
        accountUuid: testAccountUuid,
        name: '原始目标名称',
        description: '原始描述',
        color: '#000000',
        startTime: new Date(),
        endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        motive: '原始动机',
        feasibility: '原始可行性',
        importanceLevel: ImportanceLevel.Moderate,
        urgencyLevel: UrgencyLevel.Medium,
        tags: JSON.stringify(['旧标签']),
        category: '旧分类',
        status: GoalStatus.ACTIVE,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setMockData('goal', [mockGoalDTO]);
    });

    it('应该支持扁平化的部分更新', async () => {
      const updateRequest = {
        name: '更新后的目标名称', // ✅ 扁平化，直接传字段
        color: '#EF4444',
        description: '更新后的描述',
      };

      const response = await request(app)
        .put(`/api/v1/goals/${goalUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateRequest)
        .expect(200);

      expect(response.body.data.name).toBe(updateRequest.name);
      expect(response.body.data.color).toBe(updateRequest.color);
    });

    it('应该支持更新分析信息', async () => {
      const updateRequest = {
        analysis: {
          motive: '新的动机',
          feasibility: '新的可行性分析',
          importanceLevel: 'vital' as const,
          urgencyLevel: 'critical' as const,
        },
      };

      const response = await request(app)
        .put(`/api/v1/goals/${goalUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateRequest)
        .expect(200);

      expect(response.body.data.analysis.motive).toBe(updateRequest.analysis.motive);
      expect(response.body.data.analysis.importanceLevel).toBe('vital');
    });

    it('应该支持更新元数据', async () => {
      const updateRequest = {
        metadata: {
          tags: ['新标签1', '新标签2'],
          category: '新分类',
        },
      };

      const response = await request(app)
        .put(`/api/v1/goals/${goalUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateRequest)
        .expect(200);

      expect(response.body.data.metadata.tags).toEqual(updateRequest.metadata.tags);
    });

    it('不应该允许在更新请求中包含子实体操作', async () => {
      const updateRequest = {
        name: '目标名称',
        keyResults: [
          // ❌ 新架构中不支持
          { action: 'create', data: { name: 'KR1' } },
        ],
      };

      // 这个请求应该被忽略或报错（取决于实现）
      const response = await request(app)
        .put(`/api/v1/goals/${goalUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateRequest)
        .expect(200);

      // keyResults 字段应该被忽略，返回空数组（因为mock数据中没有keyResults）
      expect(response.body.data.keyResults).toEqual([]);
    });
  });

  // ===== 2. 通过聚合根管理关键结果 =====

  describe('POST /api/v1/goals/:goalId/key-results - 添加关键结果', () => {
    let goalUuid: string;

    beforeEach(() => {
      goalUuid = uuidv4();

      const mockGoalDTO: Partial<GoalPersistenceDTO> = {
        uuid: goalUuid,
        accountUuid: testAccountUuid,
        name: '测试目标',
        color: '#000000',
        startTime: new Date(),
        endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        motive: '测试动机',
        feasibility: '测试可行性',
        importanceLevel: ImportanceLevel.Moderate,
        urgencyLevel: UrgencyLevel.Medium,
        tags: JSON.stringify([]),
        category: '测试',
        status: GoalStatus.ACTIVE,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setMockData('goal', [mockGoalDTO]);
    });

    it('应该成功为目标添加关键结果', async () => {
      const krUuid = uuidv4();

      const createRequest = {
        uuid: krUuid,
        name: '完成需求分析',
        description: '详细的需求文档',
        startValue: 0,
        targetValue: 100,
        unit: '%',
        weight: 40,
        calculationMethod: 'sum' as const,
      };

      // Mock KeyResult 数据
      const mockKrDTO: Partial<KeyResultPersistenceDTO> = {
        uuid: krUuid,
        goalUuid: goalUuid,
        name: createRequest.name,
        description: createRequest.description,
        startValue: createRequest.startValue,
        targetValue: createRequest.targetValue,
        currentValue: 0,
        unit: createRequest.unit,
        weight: createRequest.weight,
        calculationMethod: KeyResultCalculationMethod.SUM,
        status: KeyResultStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setMockData('keyResult', [mockKrDTO]);

      const response = await request(app)
        .post(`/api/v1/goals/${goalUuid}/key-results`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(createRequest)
        .expect(201);

      expect(response.body.data.uuid).toBe(krUuid);
      expect(response.body.data.goalUuid).toBe(goalUuid); // ✅ 验证关联关系
      expect(response.body.data.name).toBe(createRequest.name);
    });

    it('应该验证目标是否存在', async () => {
      const nonExistentGoalUuid = uuidv4();
      const krUuid = uuidv4();

      const createRequest = {
        uuid: krUuid,
        name: '关键结果',
        startValue: 0,
        targetValue: 100,
        unit: '%',
        weight: 50,
      };

      const response = await request(app)
        .post(`/api/v1/goals/${nonExistentGoalUuid}/key-results`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(createRequest)
        .expect(404);

      expect(response.body.message).toContain('Goal not found');
    });
  });

  describe('PUT /api/v1/goals/:goalId/key-results/:krId - 更新关键结果', () => {
    let goalUuid: string;
    let krUuid: string;

    beforeEach(() => {
      goalUuid = uuidv4();
      krUuid = uuidv4();

      const mockGoalDTO: Partial<GoalPersistenceDTO> = {
        uuid: goalUuid,
        accountUuid: testAccountUuid,
        name: '测试目标',
        color: '#000000',
        startTime: new Date(),
        endTime: new Date(),
        motive: '测试',
        feasibility: '测试',
        importanceLevel: ImportanceLevel.Moderate,
        urgencyLevel: UrgencyLevel.Medium,
        tags: '[]',
        category: '测试',
        status: GoalStatus.ACTIVE,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockKrDTO: Partial<KeyResultPersistenceDTO> = {
        uuid: krUuid,
        goalUuid: goalUuid,
        name: '原始名称',
        startValue: 0,
        targetValue: 100,
        currentValue: 50,
        unit: '%',
        weight: 50,
        calculationMethod: KeyResultCalculationMethod.SUM,
        status: KeyResultStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setMockData('goal', [mockGoalDTO]);
      setMockData('keyResult', [mockKrDTO]);
    });

    it('应该成功更新关键结果', async () => {
      const updateRequest = {
        name: '更新后的名称',
        currentValue: 75,
      };

      const response = await request(app)
        .put(`/api/v1/goals/${goalUuid}/key-results/${krUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateRequest)
        .expect(200);

      expect(response.body.data.name).toBe(updateRequest.name);
      expect(response.body.data.currentValue).toBe(75);
      expect(response.body.data.progress).toBe(75); // ✅ ClientDTO 包含计算属性
    });
  });

  describe('DELETE /api/v1/goals/:goalId/key-results/:krId - 删除关键结果', () => {
    let goalUuid: string;
    let krUuid: string;

    beforeEach(() => {
      goalUuid = uuidv4();
      krUuid = uuidv4();

      const mockGoalDTO: Partial<GoalPersistenceDTO> = {
        uuid: goalUuid,
        accountUuid: testAccountUuid,
        name: '测试目标',
        color: '#000000',
        startTime: new Date(),
        endTime: new Date(),
        motive: '测试',
        feasibility: '测试',
        importanceLevel: ImportanceLevel.Moderate,
        urgencyLevel: UrgencyLevel.Medium,
        tags: '[]',
        category: '测试',
        status: GoalStatus.ACTIVE,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockKrDTO: Partial<KeyResultPersistenceDTO> = {
        uuid: krUuid,
        goalUuid: goalUuid,
        name: '测试KR',
        startValue: 0,
        targetValue: 100,
        currentValue: 0,
        unit: '%',
        weight: 100,
        calculationMethod: KeyResultCalculationMethod.SUM,
        status: KeyResultStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setMockData('goal', [mockGoalDTO]);
      setMockData('keyResult', [mockKrDTO]);
    });

    it('应该成功删除关键结果', async () => {
      const response = await request(app)
        .delete(`/api/v1/goals/${goalUuid}/key-results/${krUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });
  });

  // ===== 3. 通过聚合根管理目标记录 =====

  describe('POST /api/v1/goals/:goalId/records - 添加进度记录', () => {
    let goalUuid: string;
    let krUuid: string;

    beforeEach(() => {
      goalUuid = uuidv4();
      krUuid = uuidv4();

      const mockGoalDTO: Partial<GoalPersistenceDTO> = {
        uuid: goalUuid,
        accountUuid: testAccountUuid,
        name: '测试目标',
        color: '#000000',
        startTime: new Date(),
        endTime: new Date(),
        motive: '测试',
        feasibility: '测试',
        importanceLevel: ImportanceLevel.Moderate,
        urgencyLevel: UrgencyLevel.Medium,
        tags: '[]',
        category: '测试',
        status: GoalStatus.ACTIVE,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockKrDTO: Partial<KeyResultPersistenceDTO> = {
        uuid: krUuid,
        goalUuid: goalUuid,
        name: '测试KR',
        startValue: 0,
        targetValue: 100,
        currentValue: 50,
        unit: '%',
        weight: 100,
        calculationMethod: KeyResultCalculationMethod.SUM,
        status: KeyResultStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setMockData('goal', [mockGoalDTO]);
      setMockData('keyResult', [mockKrDTO]);
    });

    it('应该成功添加进度记录', async () => {
      const recordUuid = uuidv4();

      const createRequest = {
        uuid: recordUuid,
        keyResultUuid: krUuid, // ✅ 使用 UUID 而不是 index
        value: 10,
        note: '今天完成了10%',
      };

      // Mock Record 数据
      const mockRecordDTO: Partial<GoalRecordPersistenceDTO> = {
        uuid: recordUuid,
        keyResultUuid: krUuid,
        value: 10,
        note: '今天完成了10%',
        createdAt: new Date(),
      };

      setMockData('progressRecord', [mockRecordDTO]);

      const response = await request(app)
        .post(`/api/v1/goals/${goalUuid}/records`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(createRequest)
        .expect(201);

      expect(response.body.data.uuid).toBe(recordUuid);
      expect(response.body.data.keyResultUuid).toBe(krUuid);
      expect(response.body.data.value).toBe(10);
    });

    it('应该拒绝不存在的 keyResultUuid', async () => {
      const recordUuid = uuidv4();
      const invalidKrUuid = uuidv4();

      const createRequest = {
        uuid: recordUuid,
        keyResultUuid: invalidKrUuid,
        value: 10,
      };

      const response = await request(app)
        .post(`/api/v1/goals/${goalUuid}/records`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(createRequest)
        .expect(404);

      expect(response.body.message).toContain('KEY_RESULT_NOT_FOUND');
    });
  });

  // ===== 4. ClientDTO 响应格式测试 =====

  describe('GET /api/v1/goals/:id - 获取目标详情（ClientDTO）', () => {
    let goalUuid: string;
    let krUuid: string;

    beforeEach(() => {
      goalUuid = uuidv4();
      krUuid = uuidv4();

      const mockGoalDTO: Partial<GoalPersistenceDTO> = {
        uuid: goalUuid,
        accountUuid: testAccountUuid,
        name: '测试目标',
        color: '#000000',
        startTime: new Date(),
        endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        motive: '测试动机',
        feasibility: '测试可行性',
        importanceLevel: ImportanceLevel.Important,
        urgencyLevel: UrgencyLevel.High,
        tags: JSON.stringify(['测试']),
        category: '测试',
        status: GoalStatus.ACTIVE,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockKrDTO: Partial<KeyResultPersistenceDTO> = {
        uuid: krUuid,
        goalUuid: goalUuid,
        name: '关键结果1',
        startValue: 0,
        targetValue: 100,
        currentValue: 60,
        unit: '%',
        weight: 100,
        calculationMethod: KeyResultCalculationMethod.SUM,
        status: KeyResultStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setMockData('goal', [mockGoalDTO]);
      setMockData('keyResult', [mockKrDTO]);
    });

    it('应该返回包含计算属性的 ClientDTO', async () => {
      const response = await request(app)
        .get(`/api/v1/goals/${goalUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const goal = response.body.data;

      // ✅ 验证 GoalClientDTO 的计算属性
      expect(goal.overallProgress).toBeDefined();
      expect(goal.weightedProgress).toBeDefined();
      expect(goal.completedKeyResults).toBeDefined();
      expect(goal.totalKeyResults).toBeDefined();
      expect(goal.healthScore).toBeDefined();
      expect(goal.daysRemaining).toBeDefined();
      expect(goal.isOverdue).toBeDefined();
      expect(goal.hasTodayProgress).toBeDefined();

      // ✅ 验证 KeyResultClientDTO 的计算属性
      expect(goal.keyResults[0].progress).toBeDefined();
      expect(goal.keyResults[0].isCompleted).toBeDefined();
      expect(goal.keyResults[0].remaining).toBeDefined();
    });
  });

  // ===== 5. 列表查询测试 =====

  describe('GET /api/v1/goals - 获取目标列表', () => {
    it('应该返回使用 data 字段的列表响应', async () => {
      const response = await request(app)
        .get('/api/v1/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      // ✅ 验证响应格式符合 GoalListResponse
      // axios 拦截器会返回 response.data，所以 total/page/limit/hasMore 应该在 data 字段中
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.data).toBeInstanceOf(Array); // 目标数组
      expect(response.body.data.total).toBeDefined(); // 总数
      expect(response.body.data.page).toBe(1); // 当前页
      expect(response.body.data.limit).toBe(10); // 每页数量
      expect(response.body.data.hasMore).toBeDefined(); // 是否有更多
    });
  });
});
