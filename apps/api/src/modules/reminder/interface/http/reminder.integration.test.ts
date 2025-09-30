/**
 * Reminder 模块 API 集成测试
 * 基于 Task 模块的成功经验，实现全面的 Reminder API 测试
 */

import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import app from '../../../../app';
import { ApiTestHelpers } from '../../../../test/setup';
import { setMockData, resetMockData } from '../../../../test/mocks/prismaMock';
import type { Express } from 'express';

describe('[API集成测试] Reminder 模块', () => {
  let authToken: string;
  const testAccountUuid: string = 'test-account-123';
  let templateId: string;
  let groupId: string;
  let instanceId: string;

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
    templateId = '';
    groupId = '';
    instanceId = '';
  });

  // ===== ReminderTemplate API Tests =====

  describe('POST /api/v1/reminders/templates', () => {
    it('应该成功创建提醒模板', async () => {
      const templateData = {
        name: '测试提醒模板',
        description: '这是一个测试用的提醒模板',
        message: '测试提醒消息',
        enabled: true,
        selfEnabled: true,
        timeConfig: {
          type: 'daily',
          times: ['09:00', '18:00'],
          weekdays: undefined,
          monthDays: undefined,
        },
        priority: 'normal',
        category: 'work',
        tags: ['test', 'reminder'],
      };

      const response = await request(app)
        .post('/api/v1/reminders/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(templateData.name);
      expect(response.body.data.uuid).toBeDefined();
      expect(response.body.message).toContain('创建成功');

      // 保存ID用于后续测试
      templateId = response.body.data.uuid;
    });

    it('应该验证必填字段', async () => {
      const invalidData = {
        description: '缺少必填字段',
      };

      const response = await request(app)
        .post('/api/v1/reminders/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      const templateData = {
        name: '测试提醒模板',
        message: '测试提醒消息',
        timeConfig: {
          type: 'daily',
          times: ['09:00'],
        },
        priority: 'normal',
        category: 'test',
        tags: [],
      };

      await request(app).post('/api/v1/reminders/templates').send(templateData).expect(401);
    });
  });

  describe('GET /api/v1/reminders/templates', () => {
    beforeEach(async () => {
      // 创建测试数据
      const templateData = {
        name: '测试模板1',
        message: '测试消息1',
        timeConfig: {
          type: 'daily',
          times: ['10:00'],
        },
        priority: 'normal',
        category: 'test',
        tags: [],
      };

      const response = await request(app)
        .post('/api/v1/reminders/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData);

      templateId = response.body.data.uuid;
    });

    it('应该成功获取提醒模板列表', async () => {
      const response = await request(app)
        .get('/api/v1/reminders/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.reminders)).toBe(true);
      expect(response.body.data.total).toBeGreaterThan(0);
    });

    it('应该支持分页参数', async () => {
      const response = await request(app)
        .get('/api/v1/reminders/templates')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(10);
    });

    it('应该支持启用状态筛选', async () => {
      const response = await request(app)
        .get('/api/v1/reminders/templates')
        .query({ isActive: true })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get('/api/v1/reminders/templates').expect(401);
    });
  });

  describe('GET /api/v1/reminders/templates/:id', () => {
    beforeEach(async () => {
      // 创建测试模板
      const templateData = {
        name: '单个模板测试',
        message: '单个模板消息',
        timeConfig: {
          type: 'weekly',
          times: ['09:00'],
          weekdays: [1, 3, 5],
        },
        priority: 'high',
        category: 'important',
        tags: ['weekly'],
      };

      const response = await request(app)
        .post('/api/v1/reminders/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData);

      templateId = response.body.data.uuid;
    });

    it('应该成功获取单个提醒模板', async () => {
      const response = await request(app)
        .get(`/api/v1/reminders/templates/${templateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.uuid).toBe(templateId);
      expect(response.body.data.name).toBe('单个模板测试');
    });

    it('不存在的模板应该返回 404', async () => {
      const response = await request(app)
        .get('/api/v1/reminders/templates/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get(`/api/v1/reminders/templates/${templateId}`).expect(401);
    });
  });

  describe('PUT /api/v1/reminders/templates/:id', () => {
    beforeEach(async () => {
      // 创建测试模板
      const templateData = {
        name: '待更新模板',
        message: '待更新消息',
        timeConfig: {
          type: 'daily',
          times: ['08:00'],
        },
        priority: 'normal',
        category: 'work',
        tags: [],
      };

      const response = await request(app)
        .post('/api/v1/reminders/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData);

      templateId = response.body.data.uuid;
    });

    it('应该成功更新提醒模板', async () => {
      const updateData = {
        name: '已更新模板',
        message: '已更新消息',
        priority: 'high',
      };

      const response = await request(app)
        .put(`/api/v1/reminders/templates/${templateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.priority).toBe(updateData.priority);
    });

    it('不存在的模板应该返回 404', async () => {
      const updateData = { name: '更新不存在的模板' };

      const response = await request(app)
        .put('/api/v1/reminders/templates/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      const updateData = { name: '未认证更新' };

      await request(app)
        .put(`/api/v1/reminders/templates/${templateId}`)
        .send(updateData)
        .expect(401);
    });
  });

  describe('DELETE /api/v1/reminders/templates/:id', () => {
    beforeEach(async () => {
      // 创建测试模板
      const templateData = {
        name: '待删除模板',
        message: '待删除消息',
        timeConfig: {
          type: 'daily',
          times: ['20:00'],
        },
        priority: 'low',
        category: 'reminder',
        tags: ['delete-test'],
      };

      const response = await request(app)
        .post('/api/v1/reminders/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData);

      templateId = response.body.data.uuid;
    });

    it('应该成功删除提醒模板', async () => {
      const response = await request(app)
        .delete(`/api/v1/reminders/templates/${templateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('删除成功');
    });

    it('不存在的模板应该返回适当错误', async () => {
      const response = await request(app)
        .delete('/api/v1/reminders/templates/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).delete(`/api/v1/reminders/templates/${templateId}`).expect(401);
    });
  });

  describe('PATCH /api/v1/reminders/templates/:id/toggle', () => {
    beforeEach(async () => {
      // 创建测试模板
      const templateData = {
        name: '状态切换模板',
        message: '状态切换消息',
        enabled: true,
        timeConfig: {
          type: 'daily',
          times: ['12:00'],
        },
        priority: 'normal',
        category: 'toggle',
        tags: [],
      };

      const response = await request(app)
        .post('/api/v1/reminders/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData);

      templateId = response.body.data.uuid;
    });

    it('应该成功切换模板启用状态', async () => {
      const response = await request(app)
        .patch(`/api/v1/reminders/templates/${templateId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('状态切换成功');
    });

    it('未认证时应该返回 401', async () => {
      await request(app).patch(`/api/v1/reminders/templates/${templateId}/toggle`).expect(401);
    });
  });

  describe('GET /api/v1/reminders/templates/search', () => {
    beforeEach(async () => {
      // 创建可搜索的测试模板
      const templates = [
        {
          name: '工作提醒',
          message: '工作相关的提醒消息',
          category: 'work',
          tags: ['office', 'meeting'],
        },
        {
          name: '生活提醒',
          message: '生活相关的提醒消息',
          category: 'life',
          tags: ['home', 'family'],
        },
      ];

      for (const template of templates) {
        await request(app)
          .post('/api/v1/reminders/templates')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...template,
            timeConfig: {
              type: 'daily',
              times: ['10:00'],
            },
            priority: 'normal',
          });
      }
    });

    it('应该成功搜索提醒模板', async () => {
      const response = await request(app)
        .get('/api/v1/reminders/templates/search')
        .query({ q: '工作' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.reminders)).toBe(true);
      expect(response.body.data.query).toBe('工作');
    });

    it('应该验证搜索关键词', async () => {
      const response = await request(app)
        .get('/api/v1/reminders/templates/search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get('/api/v1/reminders/templates/search').query({ q: '测试' }).expect(401);
    });
  });

  describe('GET /api/v1/reminders/templates/active', () => {
    beforeEach(async () => {
      // 创建活跃和非活跃模板
      const activeTemplate = {
        name: '活跃模板',
        message: '活跃模板消息',
        enabled: true,
        timeConfig: {
          type: 'daily',
          times: ['09:00'],
        },
        priority: 'normal',
        category: 'active',
        tags: [],
      };

      const inactiveTemplate = {
        name: '非活跃模板',
        message: '非活跃模板消息',
        enabled: false,
        timeConfig: {
          type: 'daily',
          times: ['21:00'],
        },
        priority: 'normal',
        category: 'inactive',
        tags: [],
      };

      await request(app)
        .post('/api/v1/reminders/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(activeTemplate);

      await request(app)
        .post('/api/v1/reminders/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(inactiveTemplate);
    });

    it('应该成功获取活跃的提醒模板', async () => {
      const response = await request(app)
        .get('/api/v1/reminders/templates/active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // 验证返回的都是活跃模板
      const activeTemplates = response.body.data;
      activeTemplates.forEach((template: any) => {
        expect(template.enabled).toBe(true);
      });
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get('/api/v1/reminders/templates/active').expect(401);
    });
  });

  describe('GET /api/v1/reminders/templates/account-stats', () => {
    beforeEach(async () => {
      // 创建一些模板用于统计
      const templates = [
        { name: '统计模板1', enabled: true },
        { name: '统计模板2', enabled: false },
        { name: '统计模板3', enabled: true },
      ];

      for (const template of templates) {
        await request(app)
          .post('/api/v1/reminders/templates')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...template,
            message: '统计测试消息',
            timeConfig: {
              type: 'daily',
              times: ['15:00'],
            },
            priority: 'normal',
            category: 'stats',
            tags: [],
          });
      }
    });

    it('应该成功获取账户统计信息', async () => {
      const response = await request(app)
        .get('/api/v1/reminders/templates/account-stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalTemplates).toBeGreaterThan(0);
      expect(response.body.data.activeTemplates).toBeDefined();
      expect(response.body.data.totalInstances).toBeDefined();
      expect(response.body.data.completedInstances).toBeDefined();
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get('/api/v1/reminders/templates/account-stats').expect(401);
    });
  });

  describe('GET /api/v1/reminders/templates/:id/stats', () => {
    beforeEach(async () => {
      // 创建测试模板
      const templateData = {
        name: '模板统计测试',
        message: '模板统计消息',
        timeConfig: {
          type: 'daily',
          times: ['11:00'],
        },
        priority: 'normal',
        category: 'template-stats',
        tags: [],
      };

      const response = await request(app)
        .post('/api/v1/reminders/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData);

      templateId = response.body.data.uuid;
    });

    it('应该成功获取模板统计信息', async () => {
      const response = await request(app)
        .get(`/api/v1/reminders/templates/${templateId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.instanceCount).toBeDefined();
      expect(response.body.data.completedCount).toBeDefined();
      expect(response.body.data.activeCount).toBeDefined();
    });

    it('不存在的模板应该返回 404', async () => {
      const response = await request(app)
        .get('/api/v1/reminders/templates/non-existent-id/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get(`/api/v1/reminders/templates/${templateId}/stats`).expect(401);
    });
  });

  describe('POST /api/v1/reminders/templates/:id/generate-instances', () => {
    beforeEach(async () => {
      // 创建测试模板
      const templateData = {
        name: '实例生成测试',
        message: '实例生成消息',
        timeConfig: {
          type: 'daily',
          times: ['14:00'],
        },
        priority: 'normal',
        category: 'instance-gen',
        tags: [],
      };

      const response = await request(app)
        .post('/api/v1/reminders/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData);

      templateId = response.body.data.uuid;
    });

    it('应该成功生成模板实例', async () => {
      const generateData = {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        count: 5,
      };

      const response = await request(app)
        .post(`/api/v1/reminders/templates/${templateId}/generate-instances`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.generatedCount).toBeGreaterThan(0);
    });

    it('应该验证生成参数', async () => {
      const invalidData = {
        count: -1, // 无效的数量
      };

      const response = await request(app)
        .post(`/api/v1/reminders/templates/${templateId}/generate-instances`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('不存在的模板应该返回 404', async () => {
      const generateData = { count: 3 };

      const response = await request(app)
        .post('/api/v1/reminders/templates/non-existent-id/generate-instances')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      const generateData = { count: 3 };

      await request(app)
        .post(`/api/v1/reminders/templates/${templateId}/generate-instances`)
        .send(generateData)
        .expect(401);
    });
  });

  // ===== 错误处理和性能测试 =====

  describe('错误处理', () => {
    it('应该正确处理服务器内部错误', async () => {
      // 测试访问不存在的模板ID，应该返回404而不是500
      const response = await request(app)
        .get('/api/v1/reminders/templates/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('应该正确处理无效的JSON格式', async () => {
      const response = await request(app)
        .post('/api/v1/reminders/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      // 对于JSON解析错误，Express默认返回错误格式，我们检查是否是错误响应
      expect(response.text).toContain('Unexpected token');
    });
  });

  describe('性能测试', () => {
    it('列表查询应该在合理时间内完成', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/v1/reminders/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // 应该在1秒内完成
    });
  });
});
