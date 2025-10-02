/**
 * 完整的 API 测试模板示例
 * @description 展示如何使用 ApiTestHelpers 进行全面的接口测试
 * 包括 CRUD 操作、业务逻辑验证、错误处理、性能测试等
 * 以 TaskTemplate 为例展示完整的测试覆盖
 */

import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import app from '../../app';
import { ApiTestHelpers } from '../setup';
import { setMockData, resetMockData } from '../mocks/prismaMock';

describe('[API模板] 完整的接口测试示例 - TaskTemplate', () => {
  let authToken: string;
  const testAccountUuid = 'test-account-123';
  let testTaskTemplateId: string;

  beforeEach(async () => {
    // 重置 Mock 数据
    resetMockData();

    // 设置测试用户数据
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

    // 生成认证令牌
    authToken = await ApiTestHelpers.createTestToken({ accountUuid: testAccountUuid });
  });

  // ===== 1. CRUD 操作测试 =====
  describe('CRUD 操作测试', () => {
    describe('POST /api/v1/tasks/templates - 创建任务模板', () => {
      it('应该成功创建有效任务模板', async () => {
        const taskTemplateData = {
          title: '测试任务模板',
          description: '测试描述',
          priority: 'high',
          category: 'work',
          tags: ['测试', '工作'],
          timeConfig: {
            timeType: 'SCHEDULED',
            startTime: '09:00',
            endTime: '10:00',
          },
        };

        // 模拟数据库响应
        const mockResponse = {
          uuid: 'test-task-template-123',
          accountUuid: testAccountUuid,
          ...taskTemplateData,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setMockData('taskTemplate', [mockResponse]);

        // 使用测试助手
        const result = await ApiTestHelpers.crud.testCreate(
          request(app),
          '/api/v1/tasks/templates',
          authToken,
          taskTemplateData,
        );

        expect(result.success).toBe(true);
        expect(result.data.title).toBe(taskTemplateData.title);
        testTaskTemplateId = result.data.uuid;
      });

      it('应该拒绝无效数据', async () => {
        const invalidData = {
          title: '', // 空标题
          priority: 'invalid_priority', // 无效优先级
        };

        const result = await ApiTestHelpers.business.testValidation(
          request(app),
          '/api/v1/tasks/templates',
          authToken,
          invalidData,
        );

        expect(result.success).toBe(false);
        expect(result.message || result.errors).toContain('title');
      });
    });

    describe('GET /api/v1/tasks/templates - 查询任务模板', () => {
      beforeEach(() => {
        // 准备查询数据
        setMockData('taskTemplate', [
          {
            uuid: 'task-template-1',
            accountUuid: testAccountUuid,
            title: '任务模板1',
            priority: 'high',
            category: 'work',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            uuid: 'task-template-2',
            accountUuid: testAccountUuid,
            title: '任务模板2',
            priority: 'medium',
            category: 'personal',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
      });

      it('应该返回用户的所有任务模板', async () => {
        const result = await ApiTestHelpers.crud.testRead(
          request(app),
          '/api/v1/tasks/templates',
          authToken,
        );

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(2);
        expect(result.data[0].accountUuid).toBe(testAccountUuid);
      });

      it('应该支持分页查询', async () => {
        const result = await ApiTestHelpers.crud.testRead(
          request(app),
          '/api/v1/tasks/templates?page=1&limit=1',
          authToken,
        );

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(1);
        expect(result.pagination).toBeDefined();
      });

      it('应该支持按优先级筛选', async () => {
        const result = await ApiTestHelpers.crud.testRead(
          request(app),
          '/api/v1/tasks/templates?priority=high',
          authToken,
        );

        expect(result.success).toBe(true);
        expect(result.data.every((item: any) => item.priority === 'high')).toBe(true);
      });
    });

    describe('PUT /api/v1/tasks/templates/:id - 更新任务模板', () => {
      beforeEach(() => {
        testTaskTemplateId = 'test-task-template-123';
        setMockData('taskTemplate', [
          {
            uuid: testTaskTemplateId,
            accountUuid: testAccountUuid,
            title: '原始标题',
            description: '原始描述',
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
      });

      it('应该成功更新任务模板', async () => {
        const updateData = {
          title: '更新后的标题',
          description: '更新后的描述',
          priority: 'high',
        };

        const result = await ApiTestHelpers.crud.testUpdate(
          request(app),
          `/api/v1/tasks/templates/${testTaskTemplateId}`,
          authToken,
          updateData,
        );

        expect(result.success).toBe(true);
        expect(result.data.title).toBe(updateData.title);
      });

      it('应该拒绝更新不存在的任务模板', async () => {
        const result = await ApiTestHelpers.business.testNotFound(
          request(app),
          '/api/v1/tasks/templates/non-existent-id',
          authToken,
          'put',
        );

        expect(result.code).toBe('NOT_FOUND');
      });
    });

    describe('DELETE /api/v1/tasks/templates/:id - 删除任务模板', () => {
      beforeEach(() => {
        testTaskTemplateId = 'test-task-template-123';
        setMockData('taskTemplate', [
          {
            uuid: testTaskTemplateId,
            accountUuid: testAccountUuid,
            title: '待删除任务模板',
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
      });

      it('应该成功删除任务模板', async () => {
        const result = await ApiTestHelpers.crud.testDelete(
          request(app),
          `/api/v1/tasks/templates/${testTaskTemplateId}`,
          authToken,
        );

        expect(result.success).toBe(true);
      });
    });
  });

  // ===== 2. 业务逻辑测试 =====
  describe('业务逻辑测试', () => {
    describe('任务模板权限验证', () => {
      it('应该拒绝访问其他用户的任务模板', async () => {
        // 设置属于其他用户的任务模板
        const otherUserTemplate = 'other-user-template';
        setMockData('taskTemplate', [
          {
            uuid: otherUserTemplate,
            accountUuid: 'other-user-123', // 不同的用户
            title: '其他用户任务模板',
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);

        const result = await ApiTestHelpers.business.testNotFound(
          request(app),
          `/api/v1/tasks/templates/${otherUserTemplate}`,
          authToken,
        );

        expect(result.code).toBe('NOT_FOUND');
      });
    });

    describe('业务规则验证', () => {
      it('应该验证任务模板标题唯一性', async () => {
        // 设置已存在的任务模板
        setMockData('taskTemplate', [
          {
            uuid: 'existing-template',
            accountUuid: testAccountUuid,
            title: '已存在的任务模板',
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);

        const duplicateData = {
          title: '已存在的任务模板', // 重复标题
          priority: 'high',
        };

        const result = await ApiTestHelpers.business.testBusinessRule(
          request(app),
          '/api/v1/tasks/templates',
          authToken,
          duplicateData,
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('already exists');
      });

      it('应该验证时间配置的合理性', async () => {
        const invalidTimeData = {
          title: '时间配置测试',
          timeConfig: {
            timeType: 'SCHEDULED',
            startTime: '10:00',
            endTime: '09:00', // 结束时间早于开始时间
          },
        };

        const result = await ApiTestHelpers.business.testBusinessRule(
          request(app),
          '/api/v1/tasks/templates',
          authToken,
          invalidTimeData,
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('invalid time range');
      });

      it('应该验证任务模板数量限制', async () => {
        // 模拟用户已达到任务模板数量上限
        const existingTemplates = Array.from({ length: 50 }, (_, i) => ({
          uuid: `template-${i}`,
          accountUuid: testAccountUuid,
          title: `任务模板 ${i}`,
          priority: 'medium',
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        setMockData('taskTemplate', existingTemplates);

        const newTemplateData = {
          title: '超出限制的模板',
          priority: 'high',
        };

        const result = await ApiTestHelpers.business.testBusinessRule(
          request(app),
          '/api/v1/tasks/templates',
          authToken,
          newTemplateData,
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('limit exceeded');
      });
    });
  });

  // ===== 3. 错误处理测试 =====
  describe('错误处理测试', () => {
    it('应该返回401错误当没有认证时', async () => {
      const result = await ApiTestHelpers.business.testUnauthorized(
        request(app),
        '/api/v1/tasks/templates',
      );

      expect(result.code).toBe('UNAUTHORIZED');
    });

    it('应该返回401错误当token无效时', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/templates')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('应该处理数据库连接错误', async () => {
      // 这里可以模拟数据库连接失败的情况
      // 具体实现取决于你的错误处理机制
      const response = await request(app)
        .get('/api/v1/tasks/templates')
        .set('Authorization', `Bearer ${authToken}`);

      // 验证即使在异常情况下也能返回合适的错误信息
      if (response.status === 500) {
        expect(response.body.code).toBe('INTERNAL_ERROR');
      }
    });
  });

  // ===== 4. 性能测试 =====
  describe('性能测试', () => {
    beforeEach(() => {
      // 准备大量测试数据
      const testData = Array.from({ length: 20 }, (_, i) => ({
        uuid: `template-${i}`,
        accountUuid: testAccountUuid,
        title: `任务模板 ${i}`,
        priority: 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      setMockData('taskTemplate', testData);
    });

    it('应该在合理时间内响应查询请求', async () => {
      const duration = await ApiTestHelpers.performance.testResponseTime(
        request(app),
        '/api/v1/tasks/templates',
        authToken,
      );

      expect(duration).toBeLessThan(1000); // 应该在1秒内响应
    });

    it('应该能处理并发请求', async () => {
      const results = await ApiTestHelpers.performance.testConcurrency(
        request(app),
        '/api/v1/tasks/templates',
        authToken,
        5, // 5个并发请求
      );

      results.forEach((result) => {
        expect(result.body.success).toBe(true);
      });
    });
  });

  // ===== 5. 数据一致性测试 =====
  describe('数据一致性测试', () => {
    it('创建任务模板后应该能立即查询到', async () => {
      const templateData = {
        title: '一致性测试模板',
        priority: 'high',
        category: 'work',
      };

      // 创建任务模板
      const createResult = await ApiTestHelpers.crud.testCreate(
        request(app),
        '/api/v1/tasks/templates',
        authToken,
        templateData,
      );

      expect(createResult.success).toBe(true);
      const templateId = createResult.data.uuid;

      // 立即查询
      const readResult = await ApiTestHelpers.crud.testRead(
        request(app),
        `/api/v1/tasks/templates/${templateId}`,
        authToken,
      );

      expect(readResult.success).toBe(true);
      expect(readResult.data.title).toBe(templateData.title);
    });

    it('更新任务模板后应该反映最新状态', async () => {
      const templateId = 'test-template-123';
      setMockData('taskTemplate', [
        {
          uuid: templateId,
          accountUuid: testAccountUuid,
          title: '原始标题',
          priority: 'medium',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const updateData = { title: '更新后标题', priority: 'high' };

      // 更新任务模板
      await ApiTestHelpers.crud.testUpdate(
        request(app),
        `/api/v1/tasks/templates/${templateId}`,
        authToken,
        updateData,
      );

      // 查询验证
      const readResult = await ApiTestHelpers.crud.testRead(
        request(app),
        `/api/v1/tasks/templates/${templateId}`,
        authToken,
      );

      expect(readResult.data.title).toBe(updateData.title);
      expect(readResult.data.priority).toBe(updateData.priority);
    });

    it('删除任务模板后应该无法查询到', async () => {
      const templateId = 'test-template-123';
      setMockData('taskTemplate', [
        {
          uuid: templateId,
          accountUuid: testAccountUuid,
          title: '待删除模板',
          priority: 'medium',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // 删除任务模板
      await ApiTestHelpers.crud.testDelete(
        request(app),
        `/api/v1/tasks/templates/${templateId}`,
        authToken,
      );

      // 查询应该返回404
      const result = await ApiTestHelpers.business.testNotFound(
        request(app),
        `/api/v1/tasks/templates/${templateId}`,
        authToken,
      );

      expect(result.code).toBe('NOT_FOUND');
    });
  });

  // ===== 6. 集成测试 =====
  describe('集成测试', () => {
    it('应该正确处理完整的任务模板生命周期', async () => {
      // 1. 创建任务模板
      const templateData = {
        title: '集成测试模板',
        description: '用于集成测试的模板',
        priority: 'high',
        category: 'work',
        timeConfig: {
          timeType: 'SCHEDULED',
          startTime: '09:00',
          endTime: '10:00',
        },
      };

      const createResult = await ApiTestHelpers.crud.testCreate(
        request(app),
        '/api/v1/tasks/templates',
        authToken,
        templateData,
      );

      expect(createResult.success).toBe(true);
      const templateId = createResult.data.uuid;

      // 2. 查询验证
      const readResult = await ApiTestHelpers.crud.testRead(
        request(app),
        `/api/v1/tasks/templates/${templateId}`,
        authToken,
      );

      expect(readResult.data.title).toBe(templateData.title);

      // 3. 更新模板
      const updateData = {
        title: '更新后的集成测试模板',
        priority: 'urgent',
      };

      const updateResult = await ApiTestHelpers.crud.testUpdate(
        request(app),
        `/api/v1/tasks/templates/${templateId}`,
        authToken,
        updateData,
      );

      expect(updateResult.data.title).toBe(updateData.title);

      // 4. 删除模板
      await ApiTestHelpers.crud.testDelete(
        request(app),
        `/api/v1/tasks/templates/${templateId}`,
        authToken,
      );

      // 5. 验证删除
      const deleteResult = await ApiTestHelpers.business.testNotFound(
        request(app),
        `/api/v1/tasks/templates/${templateId}`,
        authToken,
      );

      expect(deleteResult.code).toBe('NOT_FOUND');
    });
  });
});
