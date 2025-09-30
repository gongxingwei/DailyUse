/**
 * Goal 模块 API 集成测试
 * 基于 Task 模块的成功经验，实现全面的 Goal API 测试
 */

import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import app from '../../../../app';
import { ApiTestHelpers } from '../../../../test/setup';
import { setMockData, resetMockData } from '../../../../test/mocks/prismaMock';
import type { Express } from 'express';

describe('[API集成测试] Goal 模块', () => {
  let authToken: string;
  const testAccountUuid: string = 'test-account-123';
  let goalId: string;
  let keyResultId: string;
  let goalDirId: string;

  beforeEach(async () => {
    // 重置Mock数据
    resetMockData();

    // 设置测试Account数据
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

    // 生成测试认证令牌
    authToken = await ApiTestHelpers.createTestToken({ accountUuid: testAccountUuid });

    // 重置ID
    goalId = '';
    keyResultId = '';
    goalDirId = '';
  });

  // ===== Goal 基础 CRUD API Tests =====

  describe('POST /api/v1/goals', () => {
    it('应该成功创建目标', async () => {
      const goalData = {
        name: '测试目标',
        description: '这是一个测试用的目标',
        color: '#FF5733',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        goalType: 'PROCESS',
        category: 'work',
        tags: ['test', 'goal'],
        priority: 'high',
      };

      // Mock Prisma 响应
      setMockData('goal', [
        {
          uuid: 'test-goal-123',
          accountUuid: testAccountUuid,
          ...goalData,
          startTime: new Date(goalData.startTime),
          endTime: new Date(goalData.endTime),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const response = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(goalData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(goalData.name);
      expect(response.body.data.uuid).toBeDefined();

      // 保存ID用于后续测试
      goalId = response.body.data.uuid;
    });

    it('应该验证必填字段', async () => {
      const invalidData = {
        description: '缺少必填字段',
      };

      const response = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      const goalData = {
        name: '测试目标',
        color: '#FF5733',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await request(app).post('/api/v1/goals').send(goalData).expect(401);
    });
  });

  describe('GET /api/v1/goals', () => {
    beforeEach(async () => {
      // 创建测试目标数据
      setMockData('goal', [
        {
          uuid: 'test-goal-1',
          accountUuid: testAccountUuid,
          name: '测试目标1',
          description: '测试目标描述1',
          color: '#FF5733',
          goalType: 'PROCESS',
          status: 'active',
          startTime: new Date(),
          endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          uuid: 'test-goal-2',
          accountUuid: testAccountUuid,
          name: '测试目标2',
          description: '测试目标描述2',
          color: '#33FF57',
          goalType: 'OUTCOME',
          status: 'active',
          startTime: new Date(),
          endTime: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    });

    it('应该成功获取目标列表', async () => {
      const response = await request(app)
        .get('/api/v1/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.goals)).toBe(true);
      expect(response.body.data.total).toBeGreaterThan(0);
    });

    it('应该支持分页参数', async () => {
      const response = await request(app)
        .get('/api/v1/goals')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(10);
    });

    it('应该支持状态筛选', async () => {
      const response = await request(app)
        .get('/api/v1/goals')
        .query({ status: 'active' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get('/api/v1/goals').expect(401);
    });
  });

  describe('GET /api/v1/goals/:id', () => {
    beforeEach(async () => {
      // 创建测试目标
      const testGoal = {
        uuid: 'test-goal-single',
        accountUuid: testAccountUuid,
        name: '单个目标测试',
        description: '单个目标描述',
        color: '#5733FF',
        goalType: 'PROCESS',
        status: 'active',
        startTime: new Date(),
        endTime: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setMockData('goal', [testGoal]);
      goalId = testGoal.uuid;
    });

    it('应该成功获取单个目标', async () => {
      const response = await request(app)
        .get(`/api/v1/goals/${goalId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.uuid).toBe(goalId);
      expect(response.body.data.name).toBe('单个目标测试');
    });

    it('不存在的目标应该返回 404', async () => {
      const response = await request(app)
        .get('/api/v1/goals/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get(`/api/v1/goals/${goalId}`).expect(401);
    });
  });

  describe('PUT /api/v1/goals/:id', () => {
    beforeEach(async () => {
      // 创建待更新的测试目标
      const testGoal = {
        uuid: 'test-goal-update',
        accountUuid: testAccountUuid,
        name: '待更新目标',
        description: '待更新描述',
        color: '#FF3357',
        goalType: 'PROCESS',
        status: 'active',
        startTime: new Date(),
        endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setMockData('goal', [testGoal]);
      goalId = testGoal.uuid;
    });

    it('应该成功更新目标', async () => {
      const updateData = {
        name: '已更新目标',
        description: '已更新描述',
        color: '#57FF33',
      };

      const response = await request(app)
        .put(`/api/v1/goals/${goalId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.color).toBe(updateData.color);
    });

    it('不存在的目标应该返回 404', async () => {
      const updateData = { name: '更新不存在的目标' };

      const response = await request(app)
        .put('/api/v1/goals/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      const updateData = { name: '未认证更新' };

      await request(app).put(`/api/v1/goals/${goalId}`).send(updateData).expect(401);
    });
  });

  describe('DELETE /api/v1/goals/:id', () => {
    beforeEach(async () => {
      // 创建待删除的测试目标
      const testGoal = {
        uuid: 'test-goal-delete',
        accountUuid: testAccountUuid,
        name: '待删除目标',
        description: '待删除描述',
        color: '#3357FF',
        goalType: 'OUTCOME',
        status: 'active',
        startTime: new Date(),
        endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setMockData('goal', [testGoal]);
      goalId = testGoal.uuid;
    });

    it('应该成功删除目标', async () => {
      const response = await request(app)
        .delete(`/api/v1/goals/${goalId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('删除成功');
    });

    it('不存在的目标应该返回适当错误', async () => {
      const response = await request(app)
        .delete('/api/v1/goals/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).delete(`/api/v1/goals/${goalId}`).expect(401);
    });
  });

  // ===== Goal 聚合根 API Tests（Key Results） =====

  describe('POST /api/v1/goals/:id/key-results', () => {
    beforeEach(async () => {
      // 创建父目标
      const testGoal = {
        uuid: 'test-goal-kr-parent',
        accountUuid: testAccountUuid,
        name: '关键结果父目标',
        description: '关键结果父目标描述',
        color: '#FF5733',
        goalType: 'PROCESS',
        status: 'active',
        startTime: new Date(),
        endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setMockData('goal', [testGoal]);
      goalId = testGoal.uuid;
    });

    it('应该成功创建关键结果', async () => {
      const keyResultData = {
        name: '测试关键结果',
        description: '测试关键结果描述',
        startValue: 0,
        targetValue: 100,
        unit: '个',
        weight: 30,
      };

      // Mock 关键结果数据
      setMockData('keyResult', [
        {
          uuid: 'test-kr-123',
          goalUuid: goalId,
          ...keyResultData,
          currentValue: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const response = await request(app)
        .post(`/api/v1/goals/${goalId}/key-results`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(keyResultData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(keyResultData.name);
      expect(response.body.data.uuid).toBeDefined();

      keyResultId = response.body.data.uuid;
    });

    it('应该验证必填字段', async () => {
      const invalidData = {
        description: '缺少必填字段',
      };

      const response = await request(app)
        .post(`/api/v1/goals/${goalId}/key-results`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      const keyResultData = {
        name: '测试关键结果',
        startValue: 0,
        targetValue: 100,
        unit: '个',
        weight: 30,
      };

      await request(app)
        .post(`/api/v1/goals/${goalId}/key-results`)
        .send(keyResultData)
        .expect(401);
    });
  });

  describe('GET /api/v1/goals/:id/key-results', () => {
    beforeEach(async () => {
      // 创建父目标和关键结果
      const testGoal = {
        uuid: 'test-goal-kr-list',
        accountUuid: testAccountUuid,
        name: '关键结果列表父目标',
        description: '关键结果列表父目标描述',
        color: '#33FF57',
        goalType: 'OUTCOME',
        status: 'active',
        startTime: new Date(),
        endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setMockData('goal', [testGoal]);
      goalId = testGoal.uuid;

      // 创建关键结果数据
      setMockData('keyResult', [
        {
          uuid: 'test-kr-1',
          goalUuid: goalId,
          name: '关键结果1',
          description: '关键结果1描述',
          startValue: 0,
          targetValue: 50,
          currentValue: 25,
          unit: '件',
          weight: 40,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          uuid: 'test-kr-2',
          goalUuid: goalId,
          name: '关键结果2',
          description: '关键结果2描述',
          startValue: 0,
          targetValue: 100,
          currentValue: 30,
          unit: '%',
          weight: 60,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    });

    it('应该成功获取目标的关键结果列表', async () => {
      const response = await request(app)
        .get(`/api/v1/goals/${goalId}/key-results`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('不存在的目标应该返回 404', async () => {
      const response = await request(app)
        .get('/api/v1/goals/non-existent-id/key-results')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get(`/api/v1/goals/${goalId}/key-results`).expect(401);
    });
  });

  // ===== Goal 统计和搜索 API Tests =====

  describe('GET /api/v1/goals/search', () => {
    beforeEach(async () => {
      // 创建可搜索的测试目标
      const goals = [
        {
          uuid: 'test-goal-work',
          accountUuid: testAccountUuid,
          name: '工作目标',
          description: '工作相关的目标',
          color: '#FF5733',
          goalType: 'PROCESS',
          category: 'work',
          tags: ['office', 'project'],
          status: 'active',
          startTime: new Date(),
          endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          uuid: 'test-goal-personal',
          accountUuid: testAccountUuid,
          name: '个人目标',
          description: '个人发展相关的目标',
          color: '#33FF57',
          goalType: 'OUTCOME',
          category: 'personal',
          tags: ['growth', 'learning'],
          status: 'active',
          startTime: new Date(),
          endTime: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      setMockData('goal', goals);
    });

    it('应该成功搜索目标', async () => {
      const response = await request(app)
        .get('/api/v1/goals/search')
        .query({ q: '工作' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.goals)).toBe(true);
      expect(response.body.data.query).toBe('工作');
    });

    it('应该支持分类筛选', async () => {
      const response = await request(app)
        .get('/api/v1/goals/search')
        .query({ q: '目标', category: 'work' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('应该验证搜索关键词', async () => {
      const response = await request(app)
        .get('/api/v1/goals/search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get('/api/v1/goals/search').query({ q: '测试' }).expect(401);
    });
  });

  describe('GET /api/v1/goals/stats', () => {
    beforeEach(async () => {
      // 创建统计测试数据
      const goals = [
        {
          uuid: 'test-goal-stats-1',
          accountUuid: testAccountUuid,
          name: '统计目标1',
          description: '统计目标1描述',
          color: '#FF5733',
          goalType: 'PROCESS',
          status: 'active',
          startTime: new Date(),
          endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          uuid: 'test-goal-stats-2',
          accountUuid: testAccountUuid,
          name: '统计目标2',
          description: '统计目标2描述',
          color: '#33FF57',
          goalType: 'OUTCOME',
          status: 'completed',
          startTime: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          endTime: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      setMockData('goal', goals);
    });

    it('应该成功获取目标统计信息', async () => {
      const response = await request(app)
        .get('/api/v1/goals/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalGoals).toBeDefined();
      expect(response.body.data.activeGoals).toBeDefined();
      expect(response.body.data.completedGoals).toBeDefined();
      expect(response.body.data.averageProgress).toBeDefined();
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get('/api/v1/goals/stats').expect(401);
    });
  });

  // ===== Goal 目录管理 API Tests =====

  describe('POST /api/v1/goal-dirs', () => {
    it('应该成功创建目标目录', async () => {
      const dirData = {
        name: '测试目标目录',
        description: '测试目标目录描述',
        color: '#5733FF',
        parentUuid: null,
      };

      // Mock 目录数据
      setMockData('goalDir', [
        {
          uuid: 'test-dir-123',
          accountUuid: testAccountUuid,
          ...dirData,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const response = await request(app)
        .post('/api/v1/goal-dirs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dirData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(dirData.name);
      expect(response.body.data.uuid).toBeDefined();

      goalDirId = response.body.data.uuid;
    });

    it('应该验证必填字段', async () => {
      const invalidData = {
        description: '缺少必填字段',
      };

      const response = await request(app)
        .post('/api/v1/goal-dirs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      const dirData = {
        name: '测试目标目录',
        color: '#5733FF',
      };

      await request(app).post('/api/v1/goal-dirs').send(dirData).expect(401);
    });
  });

  describe('GET /api/v1/goal-dirs', () => {
    beforeEach(async () => {
      // 创建测试目录数据
      setMockData('goalDir', [
        {
          uuid: 'test-dir-1',
          accountUuid: testAccountUuid,
          name: '工作目录',
          description: '工作相关目标目录',
          color: '#FF5733',
          parentUuid: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          uuid: 'test-dir-2',
          accountUuid: testAccountUuid,
          name: '个人目录',
          description: '个人相关目标目录',
          color: '#33FF57',
          parentUuid: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    });

    it('应该成功获取目标目录列表', async () => {
      const response = await request(app)
        .get('/api/v1/goal-dirs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get('/api/v1/goal-dirs').expect(401);
    });
  });

  // ===== 错误处理和性能测试 =====

  describe('错误处理', () => {
    it('应该正确处理服务器内部错误', async () => {
      // 测试访问不存在的目标ID，应该返回404而不是500
      const response = await request(app)
        .get('/api/v1/goals/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('应该正确处理无效的JSON格式', async () => {
      const response = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      // 对于JSON解析错误，Express默认返回错误格式，我们检查是否是错误响应
      expect(response.text).toContain('Unexpected token');
    });

    it('应该正确处理日期格式错误', async () => {
      const goalData = {
        name: '测试目标',
        color: '#FF5733',
        startTime: 'invalid-date',
        endTime: 'invalid-date',
      };

      const response = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(goalData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('性能测试', () => {
    it('列表查询应该在合理时间内完成', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/v1/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // 应该在1秒内完成
    });

    it('搜索查询应该在合理时间内完成', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/v1/goals/search')
        .query({ q: '测试' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1500); // 搜索允许稍长时间
    });
  });
});
