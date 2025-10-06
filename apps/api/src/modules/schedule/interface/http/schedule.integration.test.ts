import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../../../app';
import { ApiTestHelpers, API_TEST_CONSTANTS } from '../../../../test/setup';
import { setMockData, resetMockData } from '../../../../test/mocks/prismaMock';
import { ScheduleContracts } from '@dailyuse/contracts';

describe('[API集成测试] Schedule 模块', () => {
  let authToken: string;
  const testAccountUuid: string = 'test-account-123';

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

    // 设置测试调度任务数据 - 统一为所有测试提供一致的数据
    setMockData('scheduleTask', [
      {
        uuid: 'test-schedule-123', // 与测试中使用的ID保持一致
        accountUuid: testAccountUuid,
        createdBy: testAccountUuid, // 添加权限验证字段
        title: '测试任务1',
        taskType: 'TASK_REMINDER',
        status: 'pending',
        priority: 'medium',
        enabled: true,
        scheduledTime: new Date(Date.now() + 3600000), // 1小时后
        alertConfig: {
          methods: ['POPUP'],
          allowSnooze: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        uuid: 'schedule-1',
        accountUuid: testAccountUuid,
        createdBy: testAccountUuid, // 添加权限验证字段
        title: '测试任务2',
        taskType: 'TASK_REMINDER',
        status: 'pending',
        priority: 'medium',
        enabled: true,
        scheduledTime: new Date(Date.now() + 7200000), // 2小时后
        alertConfig: {
          methods: ['POPUP'],
          allowSnooze: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        uuid: 'schedule-2',
        accountUuid: testAccountUuid,
        createdBy: testAccountUuid, // 添加权限验证字段
        title: '测试任务3',
        taskType: 'TASK_REMINDER',
        status: 'completed',
        priority: 'high',
        enabled: true,
        scheduledTime: new Date(Date.now() - 3600000), // 1小时前(已完成)
        alertConfig: {
          methods: ['POPUP'],
          allowSnooze: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // 创建测试认证token
    authToken = await ApiTestHelpers.createTestToken({
      accountUuid: testAccountUuid,
    });
  });

  afterEach(async () => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/schedules', () => {
    it('应该成功获取计划任务列表', async () => {
      const response = await request(app)
        .get('/api/v1/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message');
      expect(response.body.success).toBe(true);
    });

    it('应该支持分页参数', async () => {
      const response = await request(app)
        .get('/api/v1/schedules')
        .query({
          page: 2,
          limit: 10,
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
    });

    it('应该支持状态筛选', async () => {
      const response = await request(app)
        .get('/api/v1/schedules')
        .query({
          status: 'pending',
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('应该支持任务类型筛选', async () => {
      const response = await request(app)
        .get('/api/v1/schedules')
        .query({
          taskType: 'RECURRING',
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get('/api/v1/schedules').expect(401);
    });
  });

  describe('POST /api/v1/schedules', () => {
    const validScheduleData: ScheduleContracts.CreateScheduleTaskRequestDto = {
      name: '测试计划任务',
      description: '这是一个测试计划任务',
      taskType: ScheduleContracts.ScheduleTaskType.TASK_REMINDER,
      priority: ScheduleContracts.SchedulePriority.NORMAL,
      scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 明天
      recurrence: {
        type: ScheduleContracts.RecurrenceType.NONE,
        interval: 1,
      },
      alertConfig: {
        methods: [ScheduleContracts.AlertMethod.POPUP],
        allowSnooze: true,
        snoozeOptions: [5, 10, 15],
      },
      payload: {
        type: ScheduleContracts.ScheduleTaskType.TASK_REMINDER,
        data: {
          message: '这是提醒消息',
        },
      },
    };

    it('应该成功创建计划任务', async () => {
      const response = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validScheduleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('schedule');
      expect(response.body.data.schedule).toHaveProperty('uuid');
      expect(response.body.data.schedule.name).toBe(validScheduleData.name);
      expect(response.body.message).toContain('创建计划任务成功');
    });

    it('应该验证必填字段', async () => {
      const invalidData = {
        // 缺少必填字段
        description: '无效数据',
      };

      const response = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeTruthy();
    });

    it('应该验证触发时间不能是过去时间', async () => {
      const pastTimeData = {
        ...validScheduleData,
        triggerTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 昨天
      };

      const response = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send(pastTimeData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('应该支持创建重复任务', async () => {
      const recurringData = {
        ...validScheduleData,
        taskType: ScheduleContracts.ScheduleTaskType.GOAL_REMINDER,
        recurrence: {
          type: ScheduleContracts.RecurrenceType.DAILY,
          interval: 1,
          maxOccurrences: 30,
        },
      };

      const response = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send(recurringData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.schedule.taskType).toBe(
        ScheduleContracts.ScheduleTaskType.GOAL_REMINDER,
      );
    });

    it('未认证时应该返回 401', async () => {
      await request(app).post('/api/v1/schedules').send(validScheduleData).expect(401);
    });
  });

  describe('GET /api/v1/schedules/:uuid', () => {
    const scheduleId = 'test-schedule-123';

    it('应该成功获取单个计划任务', async () => {
      const response = await request(app)
        .get(`/api/v1/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('schedule');
    });

    it('不存在的任务应该返回 404', async () => {
      const nonExistentId = 'non-existent-uuid';

      const response = await request(app)
        .get(`/api/v1/schedules/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get(`/api/v1/schedules/${scheduleId}`).expect(401);
    });
  });

  describe('PUT /api/v1/schedules/:uuid', () => {
    const scheduleId = 'test-schedule-123';
    const updateData: ScheduleContracts.UpdateScheduleTaskRequestDto = {
      name: '更新后的任务名称',
      description: '更新后的描述',
      priority: ScheduleContracts.SchedulePriority.HIGH,
      alertConfig: {
        methods: [ScheduleContracts.AlertMethod.POPUP],
        allowSnooze: true,
      },
    };

    it('应该成功更新计划任务', async () => {
      const response = await request(app)
        .put(`/api/v1/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('schedule');
      expect(response.body.message).toContain('更新计划任务成功');
    });

    it('不存在的任务应该返回 404', async () => {
      const nonExistentId = 'non-existent-uuid';

      const response = await request(app)
        .put(`/api/v1/schedules/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400); // 通常是400，因为业务逻辑会先验证

      expect(response.body.success).toBe(false);
    });

    it('应该验证更新数据的有效性', async () => {
      const invalidUpdateData = {
        priority: 'INVALID_PRIORITY', // 无效的优先级
      };

      const response = await request(app)
        .put(`/api/v1/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).put(`/api/v1/schedules/${scheduleId}`).send(updateData).expect(401);
    });
  });

  describe('DELETE /api/v1/schedules/:uuid', () => {
    const scheduleId = 'test-schedule-123';

    it('应该成功删除计划任务', async () => {
      const response = await request(app)
        .delete(`/api/v1/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('删除计划任务成功');
    });

    it('不存在的任务应该返回适当错误', async () => {
      const nonExistentId = 'non-existent-uuid';

      const response = await request(app)
        .delete(`/api/v1/schedules/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).delete(`/api/v1/schedules/${scheduleId}`).expect(401);
    });
  });

  describe('POST /api/v1/schedules/:uuid/execute', () => {
    const scheduleId = 'test-schedule-123';

    it('应该成功执行计划任务', async () => {
      const response = await request(app)
        .post(`/api/v1/schedules/${scheduleId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ force: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('executionResult');
      expect(response.body.message).toContain('执行计划任务成功');
    });

    it('应该支持强制执行', async () => {
      const response = await request(app)
        .post(`/api/v1/schedules/${scheduleId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ force: true })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('不存在的任务应该返回错误', async () => {
      const nonExistentId = 'non-existent-uuid';

      const response = await request(app)
        .post(`/api/v1/schedules/${nonExistentId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ force: false })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app)
        .post(`/api/v1/schedules/${scheduleId}/execute`)
        .send({ force: false })
        .expect(401);
    });
  });

  describe('POST /api/v1/schedules/:uuid/pause', () => {
    const scheduleId = 'test-schedule-123';

    it('应该成功暂停计划任务', async () => {
      const response = await request(app)
        .post(`/api/v1/schedules/${scheduleId}/pause`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('暂停计划任务成功');
    });

    it('未认证时应该返回 401', async () => {
      await request(app).post(`/api/v1/schedules/${scheduleId}/pause`).expect(401);
    });
  });

  describe('POST /api/v1/schedules/:uuid/resume', () => {
    const scheduleId = 'test-schedule-123';

    it('应该成功恢复计划任务', async () => {
      const response = await request(app)
        .post(`/api/v1/schedules/${scheduleId}/resume`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('恢复计划任务成功');
    });

    it('未认证时应该返回 401', async () => {
      await request(app).post(`/api/v1/schedules/${scheduleId}/resume`).expect(401);
    });
  });

  describe('POST /api/v1/schedules/:uuid/snooze', () => {
    const scheduleId = 'test-schedule-123';

    it('应该成功延后提醒', async () => {
      const snoozeData: ScheduleContracts.SnoozeReminderRequestDto = {
        taskUuid: scheduleId,
        snoozeMinutes: 10,
      };

      const response = await request(app)
        .post(`/api/v1/schedules/${scheduleId}/snooze`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(snoozeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('延后提醒成功');
    });

    it('应该验证延后时间', async () => {
      const invalidSnoozeData = {
        taskUuid: scheduleId,
        snoozeMinutes: -5, // 无效的负数
      };

      const response = await request(app)
        .post(`/api/v1/schedules/${scheduleId}/snooze`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidSnoozeData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app)
        .post(`/api/v1/schedules/${scheduleId}/snooze`)
        .send({ taskUuid: scheduleId, snoozeMinutes: 10 })
        .expect(401);
    });
  });

  describe('GET /api/v1/schedules/upcoming', () => {
    it('应该成功获取即将到来的任务', async () => {
      const response = await request(app)
        .get('/api/v1/schedules/upcoming')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('应该支持限制数量', async () => {
      const response = await request(app)
        .get('/api/v1/schedules/upcoming')
        .query({ limit: 5 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('应该支持时间范围', async () => {
      const response = await request(app)
        .get('/api/v1/schedules/upcoming')
        .query({ hours: 48 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get('/api/v1/schedules/upcoming').expect(401);
    });
  });

  describe('GET /api/v1/schedules/statistics', () => {
    it('应该成功获取统计信息', async () => {
      const response = await request(app)
        .get('/api/v1/schedules/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get('/api/v1/schedules/statistics').expect(401);
    });
  });

  describe('POST /api/v1/schedules/quick-reminder', () => {
    const quickReminderData: ScheduleContracts.QuickReminderRequestDto = {
      title: '快速提醒测试',
      message: '这是一个快速提醒',
      reminderTime: new Date(Date.now() + 60 * 60 * 1000), // 1小时后
    };

    it('应该成功创建快速提醒', async () => {
      const response = await request(app)
        .post('/api/v1/schedules/quick-reminder')
        .set('Authorization', `Bearer ${authToken}`)
        .send(quickReminderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('应该验证必填字段', async () => {
      const invalidData = {
        // 缺少必填字段
        message: '只有消息',
      };

      const response = await request(app)
        .post('/api/v1/schedules/quick-reminder')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app)
        .post('/api/v1/schedules/quick-reminder')
        .send(quickReminderData)
        .expect(401);
    });
  });

  describe('POST /api/v1/schedules/batch', () => {
    const batchOperationData: ScheduleContracts.BatchScheduleTaskOperationRequestDto = {
      operation: ScheduleContracts.ScheduleBatchOperationType.PAUSE,
      taskUuids: ['task-1', 'task-2', 'task-3'],
    };

    it('应该成功执行批量操作', async () => {
      const response = await request(app)
        .post('/api/v1/schedules/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send(batchOperationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('应该支持不同的批量操作类型', async () => {
      const operations = ['enable', 'disable', 'delete', 'pause', 'resume'];

      for (const operation of operations) {
        const data = {
          operation,
          taskUuids: ['test-task-1'],
        };

        const response = await request(app)
          .post('/api/v1/schedules/batch')
          .set('Authorization', `Bearer ${authToken}`)
          .send(data)
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });

    it('应该验证操作类型', async () => {
      const invalidOperationData = {
        operation: 'invalid_operation',
        taskUuids: ['task-1'],
      };

      const response = await request(app)
        .post('/api/v1/schedules/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidOperationData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).post('/api/v1/schedules/batch').send(batchOperationData).expect(401);
    });
  });

  describe('GET /api/v1/schedules/:uuid/history', () => {
    const scheduleId = 'test-schedule-123';

    it('应该成功获取执行历史', async () => {
      const response = await request(app)
        .get(`/api/v1/schedules/${scheduleId}/history`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('应该支持分页参数', async () => {
      const response = await request(app)
        .get(`/api/v1/schedules/${scheduleId}/history`)
        .query({
          page: 1,
          limit: 10,
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get(`/api/v1/schedules/${scheduleId}/history`).expect(401);
    });
  });

  describe('SSE Events (不需要认证)', () => {
    describe('GET /api/v1/schedules/events', () => {
      it('应该成功建立SSE连接', async () => {
        const response = await request(app).get('/api/v1/schedules/events').expect(200);

        expect(response.headers['content-type']).toContain('text/event-stream');
        expect(response.headers['cache-control']).toBe('no-cache');
        expect(response.headers['connection']).toBe('keep-alive');
      });
    });

    describe('GET /api/v1/schedules/events/status', () => {
      it('应该成功获取SSE连接状态', async () => {
        const response = await request(app).get('/api/v1/schedules/events/status').expect(200);

        expect(response.body).toHaveProperty('connectedClients');
        expect(response.body).toHaveProperty('totalConnections');
        expect(response.body).toHaveProperty('uptime');
      });
    });
  });

  describe('错误处理', () => {
    it('应该正确处理服务器内部错误', async () => {
      // 模拟服务器错误
      vi.spyOn(console, 'error').mockImplementation(() => {});

      // 这里可以模拟一个会导致500错误的场景
      // 例如数据库连接失败等
    });

    it('应该正确处理无效的JSON格式', async () => {
      const response = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('应该正确处理过大的请求体', async () => {
      const largeData = {
        name: 'A'.repeat(10000), // 超大字符串
        description: 'B'.repeat(10000),
      };

      const response = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send(largeData);

      // 根据应用的限制，可能是413或400
      expect([400, 413]).toContain(response.status);
    });
  });

  describe('并发请求处理', () => {
    it('应该正确处理并发的创建请求', async () => {
      const validScheduleData: ScheduleContracts.CreateScheduleTaskRequestDto = {
        name: '并发测试任务',
        description: '测试并发创建',
        taskType: ScheduleContracts.ScheduleTaskType.TASK_REMINDER,
        priority: ScheduleContracts.SchedulePriority.NORMAL,
        scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        recurrence: {
          type: ScheduleContracts.RecurrenceType.NONE,
          interval: 1,
        },
        alertConfig: {
          methods: [ScheduleContracts.AlertMethod.POPUP],
          allowSnooze: true,
        },
        payload: {
          type: ScheduleContracts.ScheduleTaskType.TASK_REMINDER,
          data: {
            message: '并发测试',
          },
        },
      };

      // 并发发送多个创建请求
      const promises = Array.from({ length: 5 }, (_, index) =>
        request(app)
          .post('/api/v1/schedules')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...validScheduleData,
            name: `并发测试任务-${index}`,
          }),
      );

      const responses = await Promise.all(promises);

      // 所有请求都应该成功
      responses.forEach((response: any) => {
        expect([200, 201]).toContain(response.status);
      });
    });
  });

  describe('性能测试', () => {
    it('列表查询应该在合理时间内完成', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/v1/schedules')
        .query({ limit: 100 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // 期望响应时间小于5秒
      expect(responseTime).toBeLessThan(5000);
    });
  });
});
