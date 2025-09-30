/**
 * Repository 模块 API 集成测试
 * 基于 Task 模块的成功经验，实现全面的 Repository API 测试
 */

import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import app from '../../../../app';
import { ApiTestHelpers } from '../../../../test/setup';
import { setMockData, resetMockData } from '../../../../test/mocks/prismaMock';
import type { Express } from 'express';

describe('[API集成测试] Repository 模块', () => {
  let authToken: string;
  const testAccountUuid: string = 'test-account-123';
  let repositoryId: string;

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
    repositoryId = '';
  });

  // ===== Repository CRUD API Tests =====

  describe('POST /api/v1/repositories', () => {
    it('应该成功创建仓库', async () => {
      const repositoryData = {
        name: '测试仓库',
        description: '这是一个测试仓库',
        type: 'git',
        url: 'https://github.com/test/repo.git',
        isPrivate: false,
        config: {
          branch: 'main',
          autoSync: true,
          syncInterval: 300,
        },
      };

      const response = await request(app)
        .post('/api/v1/repositories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(repositoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(repositoryData.name);
      expect(response.body.data.uuid).toBeDefined();

      // 保存ID用于后续测试
      repositoryId = response.body.data.uuid;
    });

    it('应该验证必填字段', async () => {
      const invalidData = {
        description: '缺少仓库名称',
      };

      const response = await request(app)
        .post('/api/v1/repositories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('应该验证仓库URL格式', async () => {
      const invalidData = {
        name: '测试仓库',
        type: 'git',
        url: 'invalid-url',
      };

      const response = await request(app)
        .post('/api/v1/repositories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('URL格式不正确');
    });

    it('未认证时应该返回 401', async () => {
      const repositoryData = {
        name: '测试仓库',
        type: 'git',
        url: 'https://github.com/test/repo.git',
      };

      await request(app).post('/api/v1/repositories').send(repositoryData).expect(401);
    });
  });

  describe('GET /api/v1/repositories', () => {
    beforeEach(async () => {
      // 创建测试仓库数据，使用支持的模型名称
      setMockData('account', [
        {
          uuid: testAccountUuid,
          username: 'testuser',
          email: 'test@example.com',
          accountType: 'local',
          status: 'active',
          repositories: [
            {
              uuid: 'test-repo-1',
              name: '仓库1',
              description: '第一个测试仓库',
              type: 'git',
              url: 'https://github.com/test/repo1.git',
              isPrivate: false,
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              uuid: 'test-repo-2',
              name: '仓库2',
              description: '第二个测试仓库',
              type: 'svn',
              url: 'https://svn.test.com/repo2',
              isPrivate: true,
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    });

    it('应该成功获取仓库列表', async () => {
      const response = await request(app)
        .get('/api/v1/repositories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.repositories)).toBe(true);
      expect(response.body.data.total).toBeGreaterThan(0);
    });

    it('应该支持按类型筛选', async () => {
      const response = await request(app)
        .get('/api/v1/repositories')
        .query({ type: 'git' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('应该支持按状态筛选', async () => {
      const response = await request(app)
        .get('/api/v1/repositories')
        .query({ status: 'active' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get('/api/v1/repositories').expect(401);
    });
  });

  describe('GET /api/v1/repositories/:id', () => {
    beforeEach(async () => {
      // 创建单个测试仓库
      repositoryId = 'test-repo-single';
      setMockData('account', [
        {
          uuid: testAccountUuid,
          username: 'testuser',
          email: 'test@example.com',
          accountType: 'local',
          status: 'active',
          repositories: [
            {
              uuid: repositoryId,
              name: '单个仓库测试',
              description: '单个仓库描述',
              type: 'git',
              url: 'https://github.com/test/single.git',
              isPrivate: false,
              status: 'active',
              config: {
                branch: 'main',
                autoSync: true,
                lastSync: new Date().toISOString(),
              },
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    });

    it('应该成功获取单个仓库', async () => {
      const response = await request(app)
        .get(`/api/v1/repositories/${repositoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.uuid).toBe(repositoryId);
      expect(response.body.data.name).toBe('单个仓库测试');
      expect(response.body.data.config).toBeDefined();
    });

    it('不存在的仓库应该返回 404', async () => {
      const response = await request(app)
        .get('/api/v1/repositories/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get(`/api/v1/repositories/${repositoryId}`).expect(401);
    });
  });

  describe('PUT /api/v1/repositories/:id', () => {
    beforeEach(async () => {
      // 创建待更新的测试仓库
      repositoryId = 'test-repo-update';
      setMockData('account', [
        {
          uuid: testAccountUuid,
          username: 'testuser',
          email: 'test@example.com',
          accountType: 'local',
          status: 'active',
          repositories: [
            {
              uuid: repositoryId,
              name: '待更新仓库',
              description: '待更新描述',
              type: 'git',
              url: 'https://github.com/test/update.git',
              isPrivate: false,
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    });

    it('应该成功更新仓库', async () => {
      const updateData = {
        name: '已更新仓库',
        description: '已更新描述',
        isPrivate: true,
        config: {
          branch: 'develop',
          autoSync: false,
          syncInterval: 600,
        },
      };

      const response = await request(app)
        .put(`/api/v1/repositories/${repositoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.isPrivate).toBe(updateData.isPrivate);
    });

    it('不应该允许更新敏感字段', async () => {
      const updateData = {
        uuid: 'malicious-uuid',
        accountUuid: 'other-account',
        type: 'malicious-type',
      };

      const response = await request(app)
        .put(`/api/v1/repositories/${repositoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不允许更新的字段');
    });

    it('不存在的仓库应该返回 404', async () => {
      const updateData = { name: '更新不存在的仓库' };

      const response = await request(app)
        .put('/api/v1/repositories/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      const updateData = { name: '未认证更新' };

      await request(app).put(`/api/v1/repositories/${repositoryId}`).send(updateData).expect(401);
    });
  });

  describe('DELETE /api/v1/repositories/:id', () => {
    beforeEach(async () => {
      // 创建待删除的测试仓库
      repositoryId = 'test-repo-delete';
      setMockData('account', [
        {
          uuid: testAccountUuid,
          username: 'testuser',
          email: 'test@example.com',
          accountType: 'local',
          status: 'active',
          repositories: [
            {
              uuid: repositoryId,
              name: '待删除仓库',
              description: '待删除描述',
              type: 'git',
              url: 'https://github.com/test/delete.git',
              isPrivate: false,
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    });

    it('应该成功删除仓库', async () => {
      const response = await request(app)
        .delete(`/api/v1/repositories/${repositoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('仓库删除成功');
    });

    it('应该支持强制删除', async () => {
      const response = await request(app)
        .delete(`/api/v1/repositories/${repositoryId}`)
        .query({ force: true })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('仓库强制删除成功');
    });

    it('不存在的仓库应该返回 404', async () => {
      const response = await request(app)
        .delete('/api/v1/repositories/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).delete(`/api/v1/repositories/${repositoryId}`).expect(401);
    });
  });

  // ===== Repository 操作 API Tests =====

  describe('POST /api/v1/repositories/:id/sync', () => {
    beforeEach(async () => {
      // 创建可同步的测试仓库
      repositoryId = 'test-repo-sync';
      setMockData('account', [
        {
          uuid: testAccountUuid,
          username: 'testuser',
          email: 'test@example.com',
          accountType: 'local',
          status: 'active',
          repositories: [
            {
              uuid: repositoryId,
              name: '同步测试仓库',
              description: '同步测试描述',
              type: 'git',
              url: 'https://github.com/test/sync.git',
              isPrivate: false,
              status: 'active',
              config: {
                branch: 'main',
                autoSync: true,
              },
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    });

    it('应该成功同步仓库', async () => {
      const syncData = {
        force: false,
        branch: 'main',
      };

      const response = await request(app)
        .post(`/api/v1/repositories/${repositoryId}/sync`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(syncData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.syncStatus).toBe('completed');
      expect(response.body.data.lastSync).toBeDefined();
    });

    it('应该支持强制同步', async () => {
      const syncData = {
        force: true,
      };

      const response = await request(app)
        .post(`/api/v1/repositories/${repositoryId}/sync`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(syncData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.forceSyncApplied).toBe(true);
    });

    it('不存在的仓库应该返回 404', async () => {
      const syncData = { force: false };

      const response = await request(app)
        .post('/api/v1/repositories/non-existent-id/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send(syncData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      const syncData = { force: false };

      await request(app)
        .post(`/api/v1/repositories/${repositoryId}/sync`)
        .send(syncData)
        .expect(401);
    });
  });

  describe('GET /api/v1/repositories/:id/status', () => {
    beforeEach(async () => {
      // 创建状态测试仓库
      repositoryId = 'test-repo-status';
      setMockData('account', [
        {
          uuid: testAccountUuid,
          username: 'testuser',
          email: 'test@example.com',
          accountType: 'local',
          status: 'active',
          repositories: [
            {
              uuid: repositoryId,
              name: '状态测试仓库',
              description: '状态测试描述',
              type: 'git',
              url: 'https://github.com/test/status.git',
              isPrivate: false,
              status: 'active',
              config: {
                branch: 'main',
                lastSync: new Date(Date.now() - 3600000).toISOString(), // 1小时前
                syncCount: 5,
              },
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    });

    it('应该成功获取仓库状态', async () => {
      const response = await request(app)
        .get(`/api/v1/repositories/${repositoryId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.repositoryId).toBe(repositoryId);
      expect(response.body.data.status).toBeDefined();
      expect(response.body.data.lastSync).toBeDefined();
      expect(response.body.data.syncCount).toBeDefined();
      expect(response.body.data.isConnected).toBeDefined();
    });

    it('应该包含连接状态信息', async () => {
      const response = await request(app)
        .get(`/api/v1/repositories/${repositoryId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(typeof response.body.data.isConnected).toBe('boolean');
    });

    it('不存在的仓库应该返回 404', async () => {
      const response = await request(app)
        .get('/api/v1/repositories/non-existent-id/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get(`/api/v1/repositories/${repositoryId}/status`).expect(401);
    });
  });

  describe('GET /api/v1/repositories/:id/branches', () => {
    beforeEach(async () => {
      // 创建分支测试仓库
      repositoryId = 'test-repo-branches';
      setMockData('account', [
        {
          uuid: testAccountUuid,
          username: 'testuser',
          email: 'test@example.com',
          accountType: 'local',
          status: 'active',
          repositories: [
            {
              uuid: repositoryId,
              name: '分支测试仓库',
              description: '分支测试描述',
              type: 'git',
              url: 'https://github.com/test/branches.git',
              isPrivate: false,
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    });

    it('应该成功获取仓库分支列表', async () => {
      const response = await request(app)
        .get(`/api/v1/repositories/${repositoryId}/branches`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.branches)).toBe(true);
      expect(response.body.data.currentBranch).toBeDefined();
      expect(response.body.data.defaultBranch).toBeDefined();
    });

    it('应该包含分支详细信息', async () => {
      const response = await request(app)
        .get(`/api/v1/repositories/${repositoryId}/branches`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const branches = response.body.data.branches;
      if (branches.length > 0) {
        expect(branches[0].name).toBeDefined();
        expect(branches[0].lastCommit).toBeDefined();
        expect(branches[0].isDefault).toBeDefined();
      }
    });

    it('不存在的仓库应该返回 404', async () => {
      const response = await request(app)
        .get('/api/v1/repositories/non-existent-id/branches')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get(`/api/v1/repositories/${repositoryId}/branches`).expect(401);
    });
  });

  // ===== 错误处理和性能测试 =====

  describe('错误处理', () => {
    it('应该正确处理无效的JSON格式', async () => {
      const response = await request(app)
        .post('/api/v1/repositories')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.text).toContain('Unexpected token');
    });

    it('应该正确处理网络超时', async () => {
      const repositoryData = {
        name: '超时测试仓库',
        type: 'git',
        url: 'https://timeout.example.com/repo.git',
        config: {
          timeout: 1, // 1秒超时
        },
      };

      const response = await request(app)
        .post('/api/v1/repositories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(repositoryData)
        .expect(408);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('连接超时');
    });

    it('应该正确处理无效凭据', async () => {
      const repositoryData = {
        name: '凭据测试仓库',
        type: 'git',
        url: 'https://private.example.com/repo.git',
        isPrivate: true,
        credentials: {
          username: 'invalid',
          password: 'invalid',
        },
      };

      const response = await request(app)
        .post('/api/v1/repositories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(repositoryData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('认证失败');
    });
  });

  describe('性能测试', () => {
    it('仓库列表查询应该在合理时间内完成', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/v1/repositories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // 应该在1秒内完成
    });

    it('仓库创建应该在合理时间内完成', async () => {
      const startTime = Date.now();

      const repositoryData = {
        name: '性能测试仓库',
        description: '性能测试描述',
        type: 'git',
        url: 'https://github.com/test/performance.git',
        isPrivate: false,
      };

      await request(app)
        .post('/api/v1/repositories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(repositoryData)
        .expect(201);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // 创建操作允许2秒
    });

    it('仓库同步应该在合理时间内完成', async () => {
      const startTime = Date.now();

      // 创建测试仓库
      repositoryId = 'test-repo-perf-sync';
      setMockData('account', [
        {
          uuid: testAccountUuid,
          username: 'testuser',
          email: 'test@example.com',
          accountType: 'local',
          status: 'active',
          repositories: [
            {
              uuid: repositoryId,
              name: '性能同步测试仓库',
              description: '性能同步测试',
              type: 'git',
              url: 'https://github.com/test/perf-sync.git',
              isPrivate: false,
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      await request(app)
        .post(`/api/v1/repositories/${repositoryId}/sync`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ force: false })
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(3000); // 同步操作允许3秒
    });
  });
});
