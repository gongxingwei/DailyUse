/**
 * Authentication 模块 API 集成测试
 * 基于 Task 模块的成功经验，实现全面的 Authentication API 测试
 */

import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import app from '../../../../app';
import { ApiTestHelpers } from '../../../../test/setup';
import { setMockData, resetMockData } from '../../../../test/mocks/prismaMock';
import type { Express } from 'express';

describe('[API集成测试] Authentication 模块', () => {
  const testAccountUuid: string = 'test-account-123';
  const testEmail: string = 'test@example.com';
  const testPassword: string = 'testPassword123';
  const testUsername: string = 'testuser';

  beforeEach(async () => {
    // 重置Mock数据
    resetMockData();

    // 设置测试Account数据
    setMockData('account', [
      {
        uuid: testAccountUuid,
        username: testUsername,
        email: testEmail,
        password: '$2b$10$hashedPasswordExample', // 模拟加密后的密码
        accountType: 'local',
        status: 'active',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  });

  // ===== Authentication API Tests =====

  describe('POST /api/auth/login', () => {
    it('应该成功登录', async () => {
      const loginData = {
        username: testUsername,
        password: testPassword,
      };

      // Mock 登录响应数据
      const mockToken = 'mock-jwt-token-123';
      const mockRefreshToken = 'mock-refresh-token-123';

      const response = await request(app).post('/api/auth/login').send(loginData).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.account).toBeDefined();
      expect(response.body.data.account.uuid).toBe(testAccountUuid);
      expect(response.body.data.account.username).toBe(testUsername);
      expect(response.body.data.account.email).toBe(testEmail);
    });

    it('应该支持邮箱登录', async () => {
      const loginData = {
        email: testEmail,
        password: testPassword,
      };

      const response = await request(app).post('/api/auth/login').send(loginData).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.account.email).toBe(testEmail);
    });

    it('应该验证必填字段', async () => {
      const invalidData = {
        username: testUsername,
        // 缺少密码
      };

      const response = await request(app).post('/api/auth/login').send(invalidData).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('密码不能为空');
    });

    it('用户名不存在时应该返回 401', async () => {
      const loginData = {
        username: 'nonexistentuser',
        password: testPassword,
      };

      const response = await request(app).post('/api/auth/login').send(loginData).expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('用户名或密码错误');
    });

    it('密码错误时应该返回 401', async () => {
      const loginData = {
        username: testUsername,
        password: 'wrongpassword',
      };

      const response = await request(app).post('/api/auth/login').send(loginData).expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('用户名或密码错误');
    });

    it('账户被禁用时应该返回 403', async () => {
      // 设置被禁用的账户
      setMockData('account', [
        {
          uuid: testAccountUuid,
          username: testUsername,
          email: testEmail,
          password: '$2b$10$hashedPasswordExample',
          accountType: 'local',
          status: 'disabled', // 被禁用状态
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const loginData = {
        username: testUsername,
        password: testPassword,
      };

      const response = await request(app).post('/api/auth/login').send(loginData).expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('账户已被禁用');
    });

    it('邮箱未验证时应该返回 403', async () => {
      // 设置邮箱未验证的账户
      setMockData('account', [
        {
          uuid: testAccountUuid,
          username: testUsername,
          email: testEmail,
          password: '$2b$10$hashedPasswordExample',
          accountType: 'local',
          status: 'active',
          emailVerified: false, // 邮箱未验证
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const loginData = {
        username: testUsername,
        password: testPassword,
      };

      const response = await request(app).post('/api/auth/login').send(loginData).expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱未验证');
    });
  });

  describe('POST /api/auth/register', () => {
    it('应该成功注册新用户', async () => {
      const registerData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'newPassword123',
        confirmPassword: 'newPassword123',
      };

      // Mock 新用户数据
      setMockData('account', []);

      const response = await request(app).post('/api/auth/register').send(registerData).expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.account).toBeDefined();
      expect(response.body.data.account.username).toBe(registerData.username);
      expect(response.body.data.account.email).toBe(registerData.email);
      expect(response.body.message).toContain('注册成功');
    });

    it('应该验证必填字段', async () => {
      const invalidData = {
        username: 'newuser',
        email: 'newuser@example.com',
        // 缺少密码
      };

      const response = await request(app).post('/api/auth/register').send(invalidData).expect(400);

      expect(response.body.success).toBe(false);
    });

    it('应该验证邮箱格式', async () => {
      const invalidData = {
        username: 'newuser',
        email: 'invalid-email',
        password: 'newPassword123',
        confirmPassword: 'newPassword123',
      };

      const response = await request(app).post('/api/auth/register').send(invalidData).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱格式不正确');
    });

    it('应该验证密码确认', async () => {
      const invalidData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'newPassword123',
        confirmPassword: 'differentPassword',
      };

      const response = await request(app).post('/api/auth/register').send(invalidData).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('密码确认不匹配');
    });

    it('用户名已存在时应该返回 409', async () => {
      const registerData = {
        username: testUsername, // 使用已存在的用户名
        email: 'different@example.com',
        password: 'newPassword123',
        confirmPassword: 'newPassword123',
      };

      const response = await request(app).post('/api/auth/register').send(registerData).expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('用户名已存在');
    });

    it('邮箱已存在时应该返回 409', async () => {
      const registerData = {
        username: 'differentuser',
        email: testEmail, // 使用已存在的邮箱
        password: 'newPassword123',
        confirmPassword: 'newPassword123',
      };

      const response = await request(app).post('/api/auth/register').send(registerData).expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱已存在');
    });

    it('应该验证密码强度', async () => {
      const weakPasswordData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: '123', // 弱密码
        confirmPassword: '123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('密码强度不足');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // 先登录获取refresh token
      const loginData = {
        username: testUsername,
        password: testPassword,
      };

      const loginResponse = await request(app).post('/api/auth/login').send(loginData);

      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('应该成功刷新Token', async () => {
      const refreshData = {
        refreshToken: refreshToken,
      };

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send(refreshData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.token).not.toBe(refreshToken); // 新token应该不同
    });

    it('应该验证refresh token', async () => {
      const invalidData = {
        refreshToken: 'invalid-refresh-token',
      };

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send(invalidData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的刷新令牌');
    });

    it('应该验证必填字段', async () => {
      const response = await request(app).post('/api/auth/refresh-token').send({}).expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    let authToken: string;

    beforeEach(async () => {
      // 先登录获取auth token
      authToken = await ApiTestHelpers.createTestToken({ accountUuid: testAccountUuid });
    });

    it('应该成功退出登录', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('退出成功');
    });

    it('未认证时应该返回 401', async () => {
      const response = await request(app).post('/api/auth/logout').expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('应该成功发送重置密码邮件', async () => {
      const forgotData = {
        email: testEmail,
      };

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(forgotData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('重置密码邮件已发送');
    });

    it('应该验证邮箱格式', async () => {
      const invalidData = {
        email: 'invalid-email',
      };

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱格式不正确');
    });

    it('邮箱不存在时应该返回 404', async () => {
      const forgotData = {
        email: 'nonexistent@example.com',
      };

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(forgotData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱不存在');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let resetToken: string;

    beforeEach(async () => {
      // Mock 重置令牌
      resetToken = 'mock-reset-token-123';

      // 设置带有重置令牌的账户数据
      setMockData('account', [
        {
          uuid: testAccountUuid,
          username: testUsername,
          email: testEmail,
          password: '$2b$10$hashedPasswordExample',
          accountType: 'local',
          status: 'active',
          emailVerified: true,
          resetPasswordToken: resetToken,
          resetPasswordExpires: new Date(Date.now() + 3600000), // 1小时后过期
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    });

    it('应该成功重置密码', async () => {
      const resetData = {
        token: resetToken,
        password: 'newPassword456',
        confirmPassword: 'newPassword456',
      };

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('密码重置成功');
    });

    it('应该验证重置令牌', async () => {
      const invalidData = {
        token: 'invalid-reset-token',
        password: 'newPassword456',
        confirmPassword: 'newPassword456',
      };

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(invalidData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的重置令牌');
    });

    it('应该验证密码确认', async () => {
      const invalidData = {
        token: resetToken,
        password: 'newPassword456',
        confirmPassword: 'differentPassword',
      };

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('密码确认不匹配');
    });

    it('令牌过期时应该返回 401', async () => {
      // 设置过期的重置令牌
      setMockData('account', [
        {
          uuid: testAccountUuid,
          username: testUsername,
          email: testEmail,
          password: '$2b$10$hashedPasswordExample',
          accountType: 'local',
          status: 'active',
          emailVerified: true,
          resetPasswordToken: resetToken,
          resetPasswordExpires: new Date(Date.now() - 3600000), // 1小时前过期
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const resetData = {
        token: resetToken,
        password: 'newPassword456',
        confirmPassword: 'newPassword456',
      };

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('重置令牌已过期');
    });
  });

  describe('POST /api/auth/verify-email', () => {
    let verificationToken: string;

    beforeEach(async () => {
      // Mock 验证令牌
      verificationToken = 'mock-verification-token-123';

      // 设置带有验证令牌的账户数据
      setMockData('account', [
        {
          uuid: testAccountUuid,
          username: testUsername,
          email: testEmail,
          password: '$2b$10$hashedPasswordExample',
          accountType: 'local',
          status: 'active',
          emailVerified: false, // 邮箱未验证
          emailVerificationToken: verificationToken,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    });

    it('应该成功验证邮箱', async () => {
      const verifyData = {
        token: verificationToken,
      };

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send(verifyData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('邮箱验证成功');
    });

    it('应该验证验证令牌', async () => {
      const invalidData = {
        token: 'invalid-verification-token',
      };

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send(invalidData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的验证令牌');
    });

    it('已验证的邮箱不应该重复验证', async () => {
      // 设置已验证的账户
      setMockData('account', [
        {
          uuid: testAccountUuid,
          username: testUsername,
          email: testEmail,
          password: '$2b$10$hashedPasswordExample',
          accountType: 'local',
          status: 'active',
          emailVerified: true, // 邮箱已验证
          emailVerificationToken: verificationToken,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const verifyData = {
        token: verificationToken,
      };

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send(verifyData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱已验证');
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken: string;

    beforeEach(async () => {
      // 生成认证令牌
      authToken = await ApiTestHelpers.createTestToken({ accountUuid: testAccountUuid });
    });

    it('应该成功获取用户资料', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.account).toBeDefined();
      expect(response.body.data.account.uuid).toBe(testAccountUuid);
      expect(response.body.data.account.username).toBe(testUsername);
      expect(response.body.data.account.email).toBe(testEmail);
      // 密码不应该在响应中
      expect(response.body.data.account.password).toBeUndefined();
    });

    it('未认证时应该返回 401', async () => {
      const response = await request(app).get('/api/auth/profile').expect(401);

      expect(response.body.success).toBe(false);
    });

    it('无效令牌时应该返回 401', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ===== 错误处理和安全测试 =====

  describe('安全测试', () => {
    it('应该防止SQL注入攻击', async () => {
      const maliciousData = {
        username: "admin'; DROP TABLE accounts; --",
        password: 'anypassword',
      };

      const response = await request(app).post('/api/auth/login').send(maliciousData).expect(401);

      // 应该正常处理而不是出现服务器错误
      expect(response.body.success).toBe(false);
    });

    it('应该防止XSS攻击', async () => {
      const maliciousData = {
        username: '<script>alert("xss")</script>',
        email: 'xss@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const response = await request(app).post('/api/auth/register').send(maliciousData);

      // 检查响应中是否包含原始脚本（应该被转义）
      if (response.body.success) {
        expect(response.body.data.account.username).not.toContain('<script>');
      }
    });

    it('应该限制登录尝试次数', async () => {
      const loginData = {
        username: testUsername,
        password: 'wrongpassword',
      };

      // 连续多次错误登录
      for (let i = 0; i < 5; i++) {
        await request(app).post('/api/auth/login').send(loginData).expect(401);
      }

      // 第6次应该被限制
      const response = await request(app).post('/api/auth/login').send(loginData).expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('登录尝试次数过多');
    });
  });

  describe('错误处理', () => {
    it('应该正确处理无效的JSON格式', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      // 对于JSON解析错误，Express默认返回错误格式
      expect(response.text).toContain('Unexpected token');
    });

    it('应该正确处理缺少Content-Type的请求', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send('username=test&password=test')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('性能测试', () => {
    it('登录应该在合理时间内完成', async () => {
      const startTime = Date.now();

      const loginData = {
        username: testUsername,
        password: testPassword,
      };

      await request(app).post('/api/auth/login').send(loginData).expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // 应该在1秒内完成
    });

    it('注册应该在合理时间内完成', async () => {
      const startTime = Date.now();

      const registerData = {
        username: 'performanceUser',
        email: 'performance@example.com',
        password: 'performancePassword123',
        confirmPassword: 'performancePassword123',
      };

      // 清空已存在的账户数据
      setMockData('account', []);

      await request(app).post('/api/auth/register').send(registerData).expect(201);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // 注册可能需要加密，允许2秒
    });
  });
});
