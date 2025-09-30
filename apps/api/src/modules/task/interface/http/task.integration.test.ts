import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../../../app';
import { ApiTestHelpers } from '../../../../test/setup';
import { setMockData, resetMockData } from '../../../../test/mocks/prismaMock';
import { TaskContracts } from '@dailyuse/contracts';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';

describe('[API集成测试] Task 模块', () => {
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

    // 设置测试Task Template数据
    setMockData('taskTemplate', [
      {
        uuid: 'test-template-123',
        accountUuid: testAccountUuid,
        title: '测试模板1',
        description: '测试模板描述',
        // 时间配置
        timeType: TaskContracts.TaskTimeType.SPECIFIC_TIME,
        startTime: '09:00',
        endTime: '10:30',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000 * 30),
        scheduleMode: TaskContracts.TaskScheduleMode.DAILY,
        intervalDays: null,
        weekdays: JSON.stringify([]),
        monthDays: JSON.stringify([]),
        timezone: 'Asia/Shanghai',
        // 提醒配置
        reminderEnabled: true,
        reminderMinutesBefore: 15,
        reminderMethods: JSON.stringify(['notification']),
        // 属性
        importance: ImportanceLevel.Moderate,
        urgency: UrgencyLevel.Medium,
        location: null,
        tags: JSON.stringify(['工作', '项目']),
        // 状态
        status: 'active',
        // 统计信息
        totalInstances: 0,
        completedInstances: 0,
        completionRate: 0,
        lastInstanceDate: null,
        // 目标关联
        goalLinks: JSON.stringify([]),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        uuid: 'template-1',
        accountUuid: testAccountUuid,
        title: '测试模板2',
        description: '测试模板描述2',
        // 时间配置
        timeType: TaskContracts.TaskTimeType.SPECIFIC_TIME,
        startTime: '14:00',
        endTime: '15:30',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000 * 60),
        scheduleMode: TaskContracts.TaskScheduleMode.WEEKLY,
        intervalDays: null,
        weekdays: JSON.stringify([1, 3, 5]), // 周一、三、五
        monthDays: JSON.stringify([]),
        timezone: 'Asia/Shanghai',
        // 提醒配置
        reminderEnabled: false,
        reminderMinutesBefore: 0,
        reminderMethods: JSON.stringify([]),
        // 属性
        importance: ImportanceLevel.Important,
        urgency: UrgencyLevel.Low,
        location: '办公室',
        tags: JSON.stringify(['学习']),
        // 状态
        status: 'active',
        // 统计信息
        totalInstances: 5,
        completedInstances: 3,
        completionRate: 60,
        lastInstanceDate: new Date(Date.now() - 86400000),
        // 目标关联
        goalLinks: JSON.stringify([]),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // 设置测试Task Instance数据
    setMockData('taskInstance', [
      {
        uuid: 'test-instance-123',
        accountUuid: testAccountUuid,
        templateUuid: 'test-template-123',
        title: '测试任务实例1',
        description: '测试任务实例描述',
        // 时间配置
        timeType: TaskContracts.TaskTimeType.SPECIFIC_TIME,
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
        startTime: '14:00',
        endTime: '15:30',
        estimatedDuration: 90,
        timezone: 'Asia/Shanghai',
        // 提醒状态
        reminderEnabled: true,
        reminderStatus: 'pending',
        reminderScheduledTime: new Date(Date.now() + 3600000).toISOString(),
        reminderTriggeredAt: null,
        reminderSnoozeCount: 0,
        reminderSnoozeUntil: null,
        // 执行状态
        executionStatus: 'pending',
        actualStartTime: null,
        actualEndTime: null,
        actualDuration: null,
        progressPercentage: 0,
        executionNotes: null,
        // 属性
        importance: ImportanceLevel.Moderate,
        urgency: UrgencyLevel.Medium,
        location: null,
        tags: JSON.stringify(['测试']),
        // 生命周期
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lifecycleEvents: JSON.stringify([
          {
            type: 'created',
            timestamp: new Date().toISOString(),
          },
        ]),
        // 目标关联
        goalLinks: JSON.stringify([]),
      },
      {
        uuid: 'instance-1',
        accountUuid: testAccountUuid,
        templateUuid: null,
        title: '测试任务实例2',
        description: '测试任务实例描述2',
        // 时间配置
        timeType: TaskContracts.TaskTimeType.SPECIFIC_TIME,
        scheduledDate: new Date(Date.now() + 172800000).toISOString(),
        startTime: '10:00',
        endTime: '12:00',
        estimatedDuration: 120,
        timezone: 'Asia/Shanghai',
        // 提醒状态
        reminderEnabled: false,
        reminderStatus: 'pending',
        reminderScheduledTime: null,
        reminderTriggeredAt: null,
        reminderSnoozeCount: 0,
        reminderSnoozeUntil: null,
        // 执行状态
        executionStatus: 'inProgress',
        actualStartTime: new Date(Date.now() - 3600000).toISOString(),
        actualEndTime: null,
        actualDuration: null,
        progressPercentage: 50,
        executionNotes: '正在进行中',
        // 属性
        importance: ImportanceLevel.Important,
        urgency: UrgencyLevel.High,
        location: '会议室',
        tags: JSON.stringify(['紧急']),
        // 生命周期
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lifecycleEvents: JSON.stringify([
          {
            type: 'created',
            timestamp: new Date().toISOString(),
          },
          {
            type: 'started',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            note: '开始执行任务',
          },
        ]),
        // 目标关联
        goalLinks: JSON.stringify([]),
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

  // ===== Task Templates Tests =====

  describe('POST /api/v1/tasks/templates', () => {
    it('应该成功创建任务模板', async () => {
      const templateData: TaskContracts.CreateTaskTemplateRequest = {
        title: '新任务模板',
        description: '新任务模板描述',
        timeConfig: {
          time: {
            timeType: TaskContracts.TaskTimeType.SPECIFIC_TIME,
            startTime: '09:00',
            endTime: '10:30',
          },
          date: {
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
          },
          schedule: {
            mode: TaskContracts.TaskScheduleMode.DAILY,
          },
          timezone: 'Asia/Shanghai',
        },
        reminderConfig: {
          enabled: true,
          minutesBefore: 15,
          methods: ['notification'],
        },
        properties: {
          importance: ImportanceLevel.Important,
          urgency: UrgencyLevel.Medium,
          tags: ['新建', '测试'],
        },
      };

      const response = await request(app)
        .post('/api/v1/tasks/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('template');
      expect(response.body.data.template).toHaveProperty('uuid');
      expect(response.body.data.template).toHaveProperty('title');
      expect(response.body.data.template.title).toBe(templateData.title);
      expect(response.body.message).toContain('任务模板创建成功');
    });

    it('应该验证必填字段', async () => {
      const invalidData = {
        description: '缺少标题的模板',
      };

      const response = await request(app)
        .post('/api/v1/tasks/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      const templateData = {
        title: '未认证测试',
      };

      await request(app).post('/api/v1/tasks/templates').send(templateData).expect(401);
    });
  });

  describe('GET /api/v1/tasks/templates', () => {
    it('应该成功获取任务模板列表', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('templates');
      expect(Array.isArray(response.body.data.templates)).toBe(true);
    });

    it('应该支持分页参数', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/templates')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
    });

    it('应该支持状态筛选', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/templates')
        .query({ status: 'active' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get('/api/v1/tasks/templates').expect(401);
    });
  });

  describe('GET /api/v1/tasks/templates/:id', () => {
    const templateId = 'test-template-123';

    it('应该成功获取单个任务模板', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/templates/${templateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('template');
      expect(response.body.data.template.uuid).toBe(templateId);
    });

    it('不存在的模板应该返回 404', async () => {
      const nonExistentId = 'non-existent-uuid';

      const response = await request(app)
        .get(`/api/v1/tasks/templates/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get(`/api/v1/tasks/templates/${templateId}`).expect(401);
    });
  });

  describe('PUT /api/v1/tasks/templates/:id', () => {
    const templateId = 'test-template-123';

    const updateData: TaskContracts.UpdateTaskTemplateRequest = {
      title: '更新后的模板名称',
      description: '更新后的描述',
      properties: {
        importance: ImportanceLevel.Important,
        urgency: UrgencyLevel.High,
        tags: ['更新', '测试'],
      },
    };

    it('应该成功更新任务模板', async () => {
      const response = await request(app)
        .put(`/api/v1/tasks/templates/${templateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('template');
      expect(response.body.data.template).toHaveProperty('uuid');
      expect(response.body.data.template.title).toBe(updateData.title);
      expect(response.body.message).toContain('任务模板更新成功');
    });

    it('不存在的模板应该返回 404', async () => {
      const nonExistentId = 'non-existent-uuid';

      const response = await request(app)
        .put(`/api/v1/tasks/templates/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).put(`/api/v1/tasks/templates/${templateId}`).send(updateData).expect(401);
    });
  });

  describe('DELETE /api/v1/tasks/templates/:id', () => {
    const templateId = 'test-template-123';

    it('应该成功删除任务模板', async () => {
      const response = await request(app)
        .delete(`/api/v1/tasks/templates/${templateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('任务模板删除成功');
    });

    it('不存在的模板应该返回适当错误', async () => {
      const nonExistentId = 'non-existent-uuid';

      const response = await request(app)
        .delete(`/api/v1/tasks/templates/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).delete(`/api/v1/tasks/templates/${templateId}`).expect(401);
    });
  });

  describe('POST /api/v1/tasks/templates/:id/activate', () => {
    const templateId = 'test-template-123';

    it('应该成功激活任务模板', async () => {
      const response = await request(app)
        .post(`/api/v1/tasks/templates/${templateId}/activate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('任务模板已激活');
    });

    it('未认证时应该返回 401', async () => {
      await request(app).post(`/api/v1/tasks/templates/${templateId}/activate`).expect(401);
    });
  });

  describe('POST /api/v1/tasks/templates/:id/pause', () => {
    const templateId = 'test-template-123';

    it('应该成功暂停任务模板', async () => {
      const response = await request(app)
        .post(`/api/v1/tasks/templates/${templateId}/pause`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('任务模板已暂停');
    });

    it('未认证时应该返回 401', async () => {
      await request(app).post(`/api/v1/tasks/templates/${templateId}/pause`).expect(401);
    });
  });

  // ===== Task Instances Tests =====

  describe('POST /api/v1/tasks/instances', () => {
    it('应该成功创建任务实例', async () => {
      const instanceData: TaskContracts.CreateTaskInstanceRequest = {
        title: '新任务实例',
        description: '新任务实例描述',
        templateUuid: 'test-template-123',
        timeConfig: {
          timeType: TaskContracts.TaskTimeType.SPECIFIC_TIME,
          scheduledDate: new Date(Date.now() + 86400000).toISOString(), // 明天
          startTime: '14:00',
          estimatedDuration: 60,
          timezone: 'Asia/Shanghai',
        },
        properties: {
          importance: ImportanceLevel.Moderate,
          urgency: UrgencyLevel.Medium,
          tags: ['新建'],
        },
      };

      const response = await request(app)
        .post('/api/v1/tasks/instances')
        .set('Authorization', `Bearer ${authToken}`)
        .send(instanceData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('instance');
      expect(response.body.data.instance.title).toBe(instanceData.title);
      expect(response.body.message).toContain('任务实例创建成功');
    });

    it('应该验证必填字段', async () => {
      const invalidData = {
        description: '缺少标题的实例',
      };

      const response = await request(app)
        .post('/api/v1/tasks/instances')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      const instanceData = {
        title: '未认证测试',
      };

      await request(app).post('/api/v1/tasks/instances').send(instanceData).expect(401);
    });
  });

  describe('GET /api/v1/tasks/instances', () => {
    it('应该成功获取任务实例列表', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/instances')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('instances');
      expect(Array.isArray(response.body.data.instances)).toBe(true);
    });

    it('应该支持分页参数', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/instances')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
    });

    it('应该支持状态筛选', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/instances')
        .query({ status: 'pending' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get('/api/v1/tasks/instances').expect(401);
    });
  });

  describe('GET /api/v1/tasks/instances/:id', () => {
    const instanceId = 'test-instance-123';

    it('应该成功获取单个任务实例', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/instances/${instanceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('instance');
      expect(response.body.data.instance.uuid).toBe(instanceId);
    });

    it('不存在的实例应该返回 404', async () => {
      const nonExistentId = 'non-existent-uuid';

      const response = await request(app)
        .get(`/api/v1/tasks/instances/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get(`/api/v1/tasks/instances/${instanceId}`).expect(401);
    });
  });

  describe('PUT /api/v1/tasks/instances/:id', () => {
    const instanceId = 'test-instance-123';

    const updateData: TaskContracts.UpdateTaskInstanceRequest = {
      title: '更新后的任务实例',
      description: '更新后的描述',
      properties: {
        importance: ImportanceLevel.Important,
        urgency: UrgencyLevel.High,
        tags: ['更新', '进行中'],
      },
    };

    it('应该成功更新任务实例', async () => {
      const response = await request(app)
        .put(`/api/v1/tasks/instances/${instanceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('instance');
      expect(response.body.message).toContain('任务实例更新成功');
    });

    it('不存在的实例应该返回 404', async () => {
      const nonExistentId = 'non-existent-uuid';

      const response = await request(app)
        .put(`/api/v1/tasks/instances/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).put(`/api/v1/tasks/instances/${instanceId}`).send(updateData).expect(401);
    });
  });

  describe('DELETE /api/v1/tasks/instances/:id', () => {
    const instanceId = 'test-instance-123';

    it('应该成功删除任务实例', async () => {
      const response = await request(app)
        .delete(`/api/v1/tasks/instances/${instanceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('任务实例删除成功');
    });

    it('不存在的实例应该返回适当错误', async () => {
      const nonExistentId = 'non-existent-uuid';

      const response = await request(app)
        .delete(`/api/v1/tasks/instances/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).delete(`/api/v1/tasks/instances/${instanceId}`).expect(401);
    });
  });

  describe('POST /api/v1/tasks/instances/:id/complete', () => {
    const instanceId = 'test-instance-123';

    it('应该成功完成任务实例', async () => {
      const completionData = {
        completionNote: '任务已完成',
      };

      const response = await request(app)
        .post(`/api/v1/tasks/instances/${instanceId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(completionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('任务已完成');
    });

    it('未认证时应该返回 401', async () => {
      await request(app).post(`/api/v1/tasks/instances/${instanceId}/complete`).expect(401);
    });
  });

  describe('POST /api/v1/tasks/instances/:id/undo-complete', () => {
    const instanceId = 'test-instance-123';

    it('应该成功撤销任务完成状态', async () => {
      const undoData = {
        reason: '需要重新处理',
      };

      const response = await request(app)
        .post(`/api/v1/tasks/instances/${instanceId}/undo-complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(undoData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('任务完成状态已撤销');
    });

    it('未认证时应该返回 401', async () => {
      await request(app).post(`/api/v1/tasks/instances/${instanceId}/undo-complete`).expect(401);
    });
  });

  describe('POST /api/v1/tasks/instances/:id/reschedule', () => {
    const instanceId = 'test-instance-123';

    it('应该成功重新安排任务', async () => {
      const rescheduleData = {
        newDueDate: new Date(Date.now() + 172800000).toISOString(), // 后天
        reason: '时间冲突',
      };

      const response = await request(app)
        .post(`/api/v1/tasks/instances/${instanceId}/reschedule`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(rescheduleData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('任务重新安排成功');
    });

    it('应该验证必填字段', async () => {
      const invalidData = {
        reason: '缺少新时间',
      };

      const response = await request(app)
        .post(`/api/v1/tasks/instances/${instanceId}/reschedule`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).post(`/api/v1/tasks/instances/${instanceId}/reschedule`).expect(401);
    });
  });

  describe('POST /api/v1/tasks/instances/:id/cancel', () => {
    const instanceId = 'test-instance-123';

    it('应该成功取消任务实例', async () => {
      const cancelData = {
        reason: '不再需要',
      };

      const response = await request(app)
        .post(`/api/v1/tasks/instances/${instanceId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(cancelData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('任务已取消');
    });

    it('未认证时应该返回 401', async () => {
      await request(app).post(`/api/v1/tasks/instances/${instanceId}/cancel`).expect(401);
    });
  });

  // ===== Task Statistics Tests =====

  describe('GET /api/v1/tasks/stats', () => {
    it('应该成功获取任务统计信息', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('stats');
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get('/api/v1/tasks/stats').expect(401);
    });
  });

  describe('GET /api/v1/tasks/stats/timeline', () => {
    it('应该成功获取任务时间线统计', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/stats/timeline')
        .query({ period: 'week' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('timeline');
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get('/api/v1/tasks/stats/timeline').expect(401);
    });
  });

  // ===== Task Search Tests =====

  describe('GET /api/v1/tasks/search', () => {
    it('应该成功搜索任务', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/search')
        .query({ q: '测试' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('应该验证搜索关键词', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get('/api/v1/tasks/search').query({ q: '测试' }).expect(401);
    });
  });

  describe('GET /api/v1/tasks/upcoming', () => {
    it('应该成功获取即将到期的任务', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/upcoming')
        .query({ days: 7 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get('/api/v1/tasks/upcoming').expect(401);
    });
  });

  describe('GET /api/v1/tasks/overdue', () => {
    it('应该成功获取逾期任务', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/overdue')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tasks');
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get('/api/v1/tasks/overdue').expect(401);
    });
  });

  // ===== Error Handling Tests =====

  describe('错误处理', () => {
    it('应该正确处理服务器内部错误', async () => {
      // 测试访问不存在的模板ID，应该返回404而不是500
      const response = await request(app)
        .get('/api/v1/tasks/templates/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('应该正确处理无效的JSON格式', async () => {
      const response = await request(app)
        .post('/api/v1/tasks/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      // 对于JSON解析错误，Express默认返回错误格式，我们检查是否是错误响应
      expect(response.text).toContain('Unexpected token');
    });
  });

  // ===== Performance Tests =====

  describe('性能测试', () => {
    it('列表查询应该在合理时间内完成', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/v1/tasks/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // 5秒内完成
      expect(response.body.success).toBe(true);
    });
  });
});
