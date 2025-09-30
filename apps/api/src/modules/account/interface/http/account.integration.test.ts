/**
 * Account 模块 API 集成测试
 * 基于 Task 模块的成功经验，实现全面的 Account API 测试
 */

import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import app from '../../../../app';
import { ApiTestHelpers } from '../../../../test/setup';
import { setMockData, resetMockData } from '../../../../test/mocks/prismaMock';
import type { Express } from 'express';

describe('[API集成测试] Account 模块', () => {
  let authToken: string;
  const testAccountUuid: string = 'test-account-123';
  const testEmail: string = 'test@example.com';
  const testUsername: string = 'testuser';
  let accountId: string;

  beforeEach(async () => {
    // 重置Mock数据
    resetMockData();

    // 设置测试Account数据
    setMockData('account', [
      {
        uuid: testAccountUuid,
        username: testUsername,
        email: testEmail,
        accountType: 'local',
        status: 'active',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // 生成测试认证令牌
    authToken = await ApiTestHelpers.createTestToken({ accountUuid: testAccountUuid });

    // 重置ID
    accountId = '';
  });

  // ===== Account 基础 CRUD API Tests =====

  describe('POST /api/v1/accounts', () => {
    it('应该成功创建账户', async () => {
      const accountData = {
        username: 'newuser',
        email: 'newuser@example.com',
        accountType: 'GUEST',
      };

      // Mock 新账户数据
      setMockData('account', []);

      const response = await request(app).post('/api/v1/accounts').send(accountData).expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe(accountData.username);
      expect(response.body.data.email).toBe(accountData.email);
      expect(response.body.data.uuid).toBeDefined();

      // 保存ID用于后续测试
      accountId = response.body.data.uuid;
    });

    it('应该验证必填字段', async () => {
      const invalidData = {
        username: 'newuser',
        // 缺少邮箱
      };

      const response = await request(app).post('/api/v1/accounts').send(invalidData).expect(400);

      expect(response.body.success).toBe(false);
    });

    it('应该验证邮箱格式', async () => {
      const invalidData = {
        username: 'newuser',
        email: 'invalid-email',
        accountType: 'GUEST',
      };

      const response = await request(app).post('/api/v1/accounts').send(invalidData).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱格式不正确');
    });

    it('用户名已存在时应该返回 409', async () => {
      const accountData = {
        username: testUsername, // 使用已存在的用户名
        email: 'different@example.com',
        accountType: 'GUEST',
      };

      const response = await request(app).post('/api/v1/accounts').send(accountData).expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('用户名已存在');
    });

    it('邮箱已存在时应该返回 409', async () => {
      const accountData = {
        username: 'differentuser',
        email: testEmail, // 使用已存在的邮箱
        accountType: 'GUEST',
      };

      const response = await request(app).post('/api/v1/accounts').send(accountData).expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱已存在');
    });
  });

  describe('GET /api/v1/accounts', () => {
    beforeEach(async () => {
      // 创建测试账户数据
      setMockData('account', [
        {
          uuid: 'test-account-1',
          username: 'testuser1',
          email: 'test1@example.com',
          accountType: 'local',
          status: 'active',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          uuid: 'test-account-2',
          username: 'testuser2',
          email: 'test2@example.com',
          accountType: 'local',
          status: 'active',
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    });

    it('应该成功获取账户列表', async () => {
      const response = await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.accounts)).toBe(true);
      expect(response.body.data.total).toBeGreaterThan(0);
    });

    it('应该支持分页参数', async () => {
      const response = await request(app)
        .get('/api/v1/accounts')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(10);
    });

    it('应该支持状态筛选', async () => {
      const response = await request(app)
        .get('/api/v1/accounts')
        .query({ status: 'active' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('应该支持账户类型筛选', async () => {
      const response = await request(app)
        .get('/api/v1/accounts')
        .query({ accountType: 'local' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get('/api/v1/accounts').expect(401);
    });
  });

  describe('GET /api/v1/accounts/:id', () => {
    beforeEach(async () => {
      // 创建单个测试账户
      const testAccount = {
        uuid: 'test-account-single',
        username: 'singleuser',
        email: 'single@example.com',
        accountType: 'local',
        status: 'active',
        emailVerified: true,
        profile: {
          displayName: '单个用户',
          avatar: 'avatar.jpg',
          bio: '这是一个测试用户',
        },
        preferences: {
          language: 'zh-CN',
          timezone: 'Asia/Shanghai',
          theme: 'light',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setMockData('account', [testAccount]);
      accountId = testAccount.uuid;
    });

    it('应该成功获取单个账户', async () => {
      const response = await request(app)
        .get(`/api/v1/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.uuid).toBe(accountId);
      expect(response.body.data.username).toBe('singleuser');
      expect(response.body.data.profile).toBeDefined();
      expect(response.body.data.preferences).toBeDefined();
    });

    it('不存在的账户应该返回 404', async () => {
      const response = await request(app)
        .get('/api/v1/accounts/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get(`/api/v1/accounts/${accountId}`).expect(401);
    });
  });

  describe('PUT /api/v1/accounts/:id', () => {
    beforeEach(async () => {
      // 创建待更新的测试账户
      const testAccount = {
        uuid: 'test-account-update',
        username: 'updateuser',
        email: 'update@example.com',
        accountType: 'local',
        status: 'active',
        emailVerified: true,
        profile: {
          displayName: '待更新用户',
          avatar: 'old-avatar.jpg',
          bio: '待更新的介绍',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setMockData('account', [testAccount]);
      accountId = testAccount.uuid;
    });

    it('应该成功更新账户信息', async () => {
      const updateData = {
        profile: {
          displayName: '已更新用户',
          avatar: 'new-avatar.jpg',
          bio: '已更新的介绍',
        },
        preferences: {
          language: 'en-US',
          timezone: 'America/New_York',
          theme: 'dark',
        },
      };

      const response = await request(app)
        .put(`/api/v1/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profile.displayName).toBe(updateData.profile.displayName);
      expect(response.body.data.preferences.theme).toBe(updateData.preferences.theme);
    });

    it('不应该允许更新敏感字段', async () => {
      const updateData = {
        uuid: 'malicious-uuid',
        accountType: 'admin',
        status: 'disabled',
      };

      const response = await request(app)
        .put(`/api/v1/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不允许更新敏感字段');
    });

    it('不存在的账户应该返回 404', async () => {
      const updateData = { profile: { displayName: '更新不存在的账户' } };

      const response = await request(app)
        .put('/api/v1/accounts/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      const updateData = { profile: { displayName: '未认证更新' } };

      await request(app).put(`/api/v1/accounts/${accountId}`).send(updateData).expect(401);
    });

    it('只能更新自己的账户', async () => {
      // 创建另一个用户的令牌
      const otherUserToken = await ApiTestHelpers.createTestToken({
        accountUuid: 'other-user-123',
      });

      const updateData = { profile: { displayName: '尝试更新别人的账户' } };

      const response = await request(app)
        .put(`/api/v1/accounts/${accountId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('权限不足');
    });
  });

  describe('DELETE /api/v1/accounts/:id', () => {
    beforeEach(async () => {
      // 创建待删除的测试账户
      const testAccount = {
        uuid: 'test-account-delete',
        username: 'deleteuser',
        email: 'delete@example.com',
        accountType: 'local',
        status: 'active',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setMockData('account', [testAccount]);
      accountId = testAccount.uuid;
    });

    it('应该成功删除账户（软删除）', async () => {
      const response = await request(app)
        .delete(`/api/v1/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('账户删除成功');
    });

    it('不存在的账户应该返回 404', async () => {
      const response = await request(app)
        .delete('/api/v1/accounts/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).delete(`/api/v1/accounts/${accountId}`).expect(401);
    });

    it('只能删除自己的账户', async () => {
      // 创建另一个用户的令牌
      const otherUserToken = await ApiTestHelpers.createTestToken({
        accountUuid: 'other-user-123',
      });

      const response = await request(app)
        .delete(`/api/v1/accounts/${accountId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('权限不足');
    });
  });

  // ===== Account 专门功能 API Tests =====

  describe('PATCH /api/v1/accounts/:id/status', () => {
    beforeEach(async () => {
      // 创建测试账户
      const testAccount = {
        uuid: 'test-account-status',
        username: 'statususer',
        email: 'status@example.com',
        accountType: 'local',
        status: 'active',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setMockData('account', [testAccount]);
      accountId = testAccount.uuid;
    });

    it('管理员应该能够更改账户状态', async () => {
      // 创建管理员令牌
      const adminToken = await ApiTestHelpers.createTestToken({ accountUuid: 'admin-123' });

      const statusData = {
        status: 'disabled',
        reason: '违反服务条款',
      };

      const response = await request(app)
        .patch(`/api/v1/accounts/${accountId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(statusData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('disabled');
    });

    it('普通用户不能更改账户状态', async () => {
      const statusData = {
        status: 'disabled',
      };

      const response = await request(app)
        .patch(`/api/v1/accounts/${accountId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(statusData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('权限不足');
    });

    it('应该验证状态值', async () => {
      const adminToken = await ApiTestHelpers.createTestToken({ accountUuid: 'admin-123' });

      const invalidData = {
        status: 'invalid-status',
      };

      const response = await request(app)
        .patch(`/api/v1/accounts/${accountId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      const statusData = {
        status: 'disabled',
      };

      await request(app).patch(`/api/v1/accounts/${accountId}/status`).send(statusData).expect(401);
    });
  });

  describe('POST /api/v1/accounts/:id/verify-email', () => {
    beforeEach(async () => {
      // 创建邮箱未验证的测试账户
      const testAccount = {
        uuid: 'test-account-verify',
        username: 'verifyuser',
        email: 'verify@example.com',
        accountType: 'local',
        status: 'active',
        emailVerified: false, // 邮箱未验证
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setMockData('account', [testAccount]);
      accountId = testAccount.uuid;
    });

    it('应该成功发送验证邮件', async () => {
      const response = await request(app)
        .post(`/api/v1/accounts/${accountId}/verify-email`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('验证邮件已发送');
    });

    it('已验证的邮箱不应该重复发送', async () => {
      // 设置已验证的账户
      setMockData('account', [
        {
          uuid: accountId,
          username: 'verifyuser',
          email: 'verify@example.com',
          accountType: 'local',
          status: 'active',
          emailVerified: true, // 已验证
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const response = await request(app)
        .post(`/api/v1/accounts/${accountId}/verify-email`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱已验证');
    });

    it('未认证时应该返回 401', async () => {
      await request(app).post(`/api/v1/accounts/${accountId}/verify-email`).expect(401);
    });
  });

  describe('GET /api/v1/accounts/search', () => {
    beforeEach(async () => {
      // 创建可搜索的测试账户
      const accounts = [
        {
          uuid: 'test-account-search-1',
          username: 'johnsmith',
          email: 'john@example.com',
          accountType: 'local',
          status: 'active',
          profile: {
            displayName: 'John Smith',
            bio: '软件工程师',
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          uuid: 'test-account-search-2',
          username: 'janesmith',
          email: 'jane@example.com',
          accountType: 'local',
          status: 'active',
          profile: {
            displayName: 'Jane Smith',
            bio: '产品经理',
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      setMockData('account', accounts);
    });

    it('应该成功搜索账户', async () => {
      const response = await request(app)
        .get('/api/v1/accounts/search')
        .query({ q: 'smith' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.accounts)).toBe(true);
      expect(response.body.data.query).toBe('smith');
    });

    it('应该支持按用户名搜索', async () => {
      const response = await request(app)
        .get('/api/v1/accounts/search')
        .query({ q: 'john', field: 'username' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('应该支持按邮箱搜索', async () => {
      const response = await request(app)
        .get('/api/v1/accounts/search')
        .query({ q: 'john@example.com', field: 'email' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('应该验证搜索关键词', async () => {
      const response = await request(app)
        .get('/api/v1/accounts/search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get('/api/v1/accounts/search').query({ q: 'smith' }).expect(401);
    });
  });

  describe('GET /api/v1/accounts/stats', () => {
    beforeEach(async () => {
      // 创建统计测试数据
      const accounts = [
        {
          uuid: 'test-account-stats-1',
          username: 'statsuser1',
          email: 'stats1@example.com',
          accountType: 'local',
          status: 'active',
          emailVerified: true,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天前
          updatedAt: new Date(),
        },
        {
          uuid: 'test-account-stats-2',
          username: 'statsuser2',
          email: 'stats2@example.com',
          accountType: 'local',
          status: 'active',
          emailVerified: false,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7天前
          updatedAt: new Date(),
        },
        {
          uuid: 'test-account-stats-3',
          username: 'statsuser3',
          email: 'stats3@example.com',
          accountType: 'local',
          status: 'disabled',
          emailVerified: true,
          createdAt: new Date(), // 今天
          updatedAt: new Date(),
        },
      ];

      setMockData('account', accounts);
    });

    it('应该成功获取账户统计信息', async () => {
      // 创建管理员令牌
      const adminToken = await ApiTestHelpers.createTestToken({ accountUuid: 'admin-123' });

      const response = await request(app)
        .get('/api/v1/accounts/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalAccounts).toBeDefined();
      expect(response.body.data.activeAccounts).toBeDefined();
      expect(response.body.data.verifiedAccounts).toBeDefined();
      expect(response.body.data.newAccountsToday).toBeDefined();
      expect(response.body.data.newAccountsThisWeek).toBeDefined();
      expect(response.body.data.newAccountsThisMonth).toBeDefined();
    });

    it('普通用户不能访问统计信息', async () => {
      const response = await request(app)
        .get('/api/v1/accounts/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('权限不足');
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get('/api/v1/accounts/stats').expect(401);
    });
  });

  // ===== 错误处理和安全测试 =====

  describe('安全测试', () => {
    it('应该防止SQL注入攻击', async () => {
      const maliciousData = {
        username: "admin'; DROP TABLE accounts; --",
        email: 'malicious@example.com',
        accountType: 'GUEST',
      };

      const response = await request(app).post('/api/v1/accounts').send(maliciousData);

      // 应该正常处理而不是出现服务器错误
      expect([400, 409]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('应该防止XSS攻击', async () => {
      const maliciousData = {
        username: 'normaluser',
        email: 'normal@example.com',
        accountType: 'GUEST',
        profile: {
          displayName: '<script>alert("xss")</script>',
          bio: '<img src="x" onerror="alert(1)">',
        },
      };

      // 清空已存在的账户数据
      setMockData('account', []);

      const response = await request(app).post('/api/v1/accounts').send(maliciousData);

      // 检查响应中是否包含原始脚本（应该被转义）
      if (response.body.success) {
        expect(response.body.data.profile.displayName).not.toContain('<script>');
        expect(response.body.data.profile.bio).not.toContain('<img');
      }
    });

    it('应该限制敏感信息暴露', async () => {
      const response = await request(app)
        .get(`/api/v1/accounts/${testAccountUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // 密码等敏感信息不应该在响应中
      expect(response.body.data.password).toBeUndefined();
      expect(response.body.data.resetPasswordToken).toBeUndefined();
      expect(response.body.data.emailVerificationToken).toBeUndefined();
    });
  });

  describe('错误处理', () => {
    it('应该正确处理无效的JSON格式', async () => {
      const response = await request(app)
        .post('/api/v1/accounts')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      // 对于JSON解析错误，Express默认返回错误格式
      expect(response.text).toContain('Unexpected token');
    });

    it('应该正确处理过长的字段', async () => {
      const longString = 'a'.repeat(1000);
      const accountData = {
        username: longString,
        email: 'test@example.com',
        accountType: 'GUEST',
      };

      const response = await request(app).post('/api/v1/accounts').send(accountData).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('字段长度超出限制');
    });
  });

  describe('性能测试', () => {
    it('列表查询应该在合理时间内完成', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // 应该在1秒内完成
    });

    it('搜索查询应该在合理时间内完成', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/v1/accounts/search')
        .query({ q: 'test' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1500); // 搜索允许稍长时间
    });

    it('账户创建应该在合理时间内完成', async () => {
      const startTime = Date.now();

      // 清空已存在的账户数据
      setMockData('account', []);

      const accountData = {
        username: 'performanceuser',
        email: 'performance@example.com',
        accountType: 'GUEST',
      };

      await request(app).post('/api/v1/accounts').send(accountData).expect(201);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // 创建可能需要验证，允许2秒
    });
  });
});
