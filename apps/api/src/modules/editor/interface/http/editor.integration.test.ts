/**
 * Editor 模块 API 集成测试
 * 基于 Task 模块的成功经验，实现全面的 Editor API 测试
 */

import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import app from '../../../../app';
import { ApiTestHelpers } from '../../../../test/setup';
import { setMockData, resetMockData } from '../../../../test/mocks/prismaMock';
import type { Express } from 'express';

describe('[API集成测试] Editor 模块', () => {
  let authToken: string;
  const testAccountUuid: string = 'test-account-123';
  let documentId: string;
  let workspaceId: string;
  let versionId: string;

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
    documentId = '';
    workspaceId = '';
    versionId = '';
  });

  // ===== Document 聚合根 API Tests =====

  describe('POST /api/v1/documents', () => {
    it('应该成功创建文档', async () => {
      const documentData = {
        title: '测试文档',
        content: '这是一个测试文档的内容',
        contentType: 'markdown',
        tags: ['test', 'document'],
        metadata: {
          description: '测试文档描述',
          author: 'testuser',
          category: 'test',
        },
      };

      // Mock 文档数据
      setMockData('document', [
        {
          uuid: 'test-document-123',
          accountUuid: testAccountUuid,
          ...documentData,
          content: JSON.stringify({ type: 'doc', content: documentData.content }),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const response = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(documentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(documentData.title);
      expect(response.body.data.uuid).toBeDefined();

      // 保存ID用于后续测试
      documentId = response.body.data.uuid;
    });

    it('应该验证必填字段', async () => {
      const invalidData = {
        content: '缺少标题的文档',
      };

      const response = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('应该验证内容类型', async () => {
      const invalidData = {
        title: '测试文档',
        content: '测试内容',
        contentType: 'invalid-type',
      };

      const response = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不支持的内容类型');
    });

    it('未认证时应该返回 401', async () => {
      const documentData = {
        title: '测试文档',
        content: '测试内容',
        contentType: 'markdown',
      };

      await request(app).post('/api/v1/documents').send(documentData).expect(401);
    });
  });

  describe('GET /api/v1/documents/:id', () => {
    beforeEach(async () => {
      // 创建测试文档
      const testDocument = {
        uuid: 'test-document-single',
        accountUuid: testAccountUuid,
        title: '单个文档测试',
        content: JSON.stringify({
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '这是测试文档内容' }],
            },
          ],
        }),
        contentType: 'prosemirror',
        tags: ['single', 'test'],
        metadata: {
          description: '单个文档描述',
          wordCount: 8,
          lastModified: new Date().toISOString(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setMockData('document', [testDocument]);
      documentId = testDocument.uuid;
    });

    it('应该成功获取单个文档', async () => {
      const response = await request(app)
        .get(`/api/v1/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.uuid).toBe(documentId);
      expect(response.body.data.title).toBe('单个文档测试');
      expect(response.body.data.content).toBeDefined();
      expect(response.body.data.metadata).toBeDefined();
    });

    it('不存在的文档应该返回 404', async () => {
      const response = await request(app)
        .get('/api/v1/documents/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get(`/api/v1/documents/${documentId}`).expect(401);
    });
  });

  describe('PUT /api/v1/documents/:id', () => {
    beforeEach(async () => {
      // 创建待更新的测试文档
      const testDocument = {
        uuid: 'test-document-update',
        accountUuid: testAccountUuid,
        title: '待更新文档',
        content: JSON.stringify({ type: 'doc', content: '原始内容' }),
        contentType: 'markdown',
        tags: ['update', 'test'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setMockData('document', [testDocument]);
      documentId = testDocument.uuid;
    });

    it('应该成功更新文档', async () => {
      const updateData = {
        title: '已更新文档',
        content: '已更新的文档内容',
        tags: ['updated', 'test', 'new'],
      };

      const response = await request(app)
        .put(`/api/v1/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.tags).toEqual(updateData.tags);
    });

    it('应该自动创建版本历史', async () => {
      const updateData = {
        title: '版本测试文档',
        content: '新版本内容',
        createVersion: true,
      };

      const response = await request(app)
        .put(`/api/v1/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.versionCreated).toBe(true);
    });

    it('不存在的文档应该返回 404', async () => {
      const updateData = { title: '更新不存在的文档' };

      const response = await request(app)
        .put('/api/v1/documents/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      const updateData = { title: '未认证更新' };

      await request(app).put(`/api/v1/documents/${documentId}`).send(updateData).expect(401);
    });
  });

  describe('DELETE /api/v1/documents/:id', () => {
    beforeEach(async () => {
      // 创建待删除的测试文档
      const testDocument = {
        uuid: 'test-document-delete',
        accountUuid: testAccountUuid,
        title: '待删除文档',
        content: JSON.stringify({ type: 'doc', content: '待删除内容' }),
        contentType: 'markdown',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setMockData('document', [testDocument]);
      documentId = testDocument.uuid;
    });

    it('应该成功删除文档（软删除）', async () => {
      const response = await request(app)
        .delete(`/api/v1/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('文档删除成功');
    });

    it('应该支持永久删除', async () => {
      const response = await request(app)
        .delete(`/api/v1/documents/${documentId}`)
        .query({ permanent: true })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('文档永久删除成功');
    });

    it('不存在的文档应该返回 404', async () => {
      const response = await request(app)
        .delete('/api/v1/documents/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).delete(`/api/v1/documents/${documentId}`).expect(401);
    });
  });

  // ===== Document 版本管理 API Tests =====

  describe('GET /api/v1/documents/:id/versions', () => {
    beforeEach(async () => {
      // 创建带版本历史的测试文档
      const testDocument = {
        uuid: 'test-document-versions',
        accountUuid: testAccountUuid,
        title: '版本管理文档',
        content: JSON.stringify({ type: 'doc', content: '当前版本内容' }),
        contentType: 'markdown',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setMockData('document', [testDocument]);
      documentId = testDocument.uuid;

      // 创建版本历史数据
      setMockData('documentVersion', [
        {
          uuid: 'test-version-1',
          documentUuid: documentId,
          title: '版本管理文档 v1',
          content: JSON.stringify({ type: 'doc', content: '第一版内容' }),
          versionNumber: 1,
          changeDescription: '初始版本',
          createdAt: new Date(Date.now() - 86400000), // 1天前
        },
        {
          uuid: 'test-version-2',
          documentUuid: documentId,
          title: '版本管理文档 v2',
          content: JSON.stringify({ type: 'doc', content: '第二版内容' }),
          versionNumber: 2,
          changeDescription: '添加了新段落',
          createdAt: new Date(Date.now() - 43200000), // 12小时前
        },
      ]);
    });

    it('应该成功获取文档版本历史', async () => {
      const response = await request(app)
        .get(`/api/v1/documents/${documentId}/versions`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.versions)).toBe(true);
      expect(response.body.data.versions.length).toBeGreaterThan(0);
      expect(response.body.data.total).toBeGreaterThan(0);
    });

    it('应该支持分页参数', async () => {
      const response = await request(app)
        .get(`/api/v1/documents/${documentId}/versions`)
        .query({ page: 1, limit: 5 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(5);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get(`/api/v1/documents/${documentId}/versions`).expect(401);
    });
  });

  describe('GET /api/v1/documents/:id/versions/:versionId', () => {
    beforeEach(async () => {
      // 创建特定版本的测试数据
      const testDocument = {
        uuid: 'test-document-version-single',
        accountUuid: testAccountUuid,
        title: '单版本测试文档',
        content: JSON.stringify({ type: 'doc', content: '当前内容' }),
        contentType: 'markdown',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const testVersion = {
        uuid: 'test-version-single',
        documentUuid: testDocument.uuid,
        title: '单版本测试文档 v1',
        content: JSON.stringify({ type: 'doc', content: '历史版本内容' }),
        versionNumber: 1,
        changeDescription: '历史版本',
        createdAt: new Date(Date.now() - 86400000),
      };

      setMockData('document', [testDocument]);
      setMockData('documentVersion', [testVersion]);
      documentId = testDocument.uuid;
      versionId = testVersion.uuid;
    });

    it('应该成功获取特定版本', async () => {
      const response = await request(app)
        .get(`/api/v1/documents/${documentId}/versions/${versionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.uuid).toBe(versionId);
      expect(response.body.data.versionNumber).toBe(1);
      expect(response.body.data.content).toBeDefined();
    });

    it('不存在的版本应该返回 404', async () => {
      const response = await request(app)
        .get(`/api/v1/documents/${documentId}/versions/non-existent-version`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get(`/api/v1/documents/${documentId}/versions/${versionId}`).expect(401);
    });
  });

  describe('POST /api/v1/documents/:id/versions/:versionId/restore', () => {
    beforeEach(async () => {
      // 创建恢复测试数据
      const testDocument = {
        uuid: 'test-document-restore',
        accountUuid: testAccountUuid,
        title: '恢复测试文档',
        content: JSON.stringify({ type: 'doc', content: '当前内容' }),
        contentType: 'markdown',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const testVersion = {
        uuid: 'test-version-restore',
        documentUuid: testDocument.uuid,
        title: '恢复测试文档 v1',
        content: JSON.stringify({ type: 'doc', content: '要恢复的内容' }),
        versionNumber: 1,
        changeDescription: '要恢复的版本',
        createdAt: new Date(Date.now() - 86400000),
      };

      setMockData('document', [testDocument]);
      setMockData('documentVersion', [testVersion]);
      documentId = testDocument.uuid;
      versionId = testVersion.uuid;
    });

    it('应该成功恢复到指定版本', async () => {
      const response = await request(app)
        .post(`/api/v1/documents/${documentId}/versions/${versionId}/restore`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('版本恢复成功');
      expect(response.body.data.restoredVersion).toBe(1);
    });

    it('应该创建恢复前的备份版本', async () => {
      const response = await request(app)
        .post(`/api/v1/documents/${documentId}/versions/${versionId}/restore`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.backupVersionCreated).toBe(true);
    });

    it('不存在的版本应该返回 404', async () => {
      const response = await request(app)
        .post(`/api/v1/documents/${documentId}/versions/non-existent/restore`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app)
        .post(`/api/v1/documents/${documentId}/versions/${versionId}/restore`)
        .expect(401);
    });
  });

  // ===== Editor Workspace API Tests =====

  describe('POST /api/v1/editor/workspaces', () => {
    it('应该成功创建编辑器工作区', async () => {
      const workspaceData = {
        name: '测试工作区',
        description: '这是一个测试工作区',
        layout: {
          type: 'split',
          direction: 'horizontal',
          panels: [
            { type: 'editor', documentId: null },
            { type: 'preview', documentId: null },
          ],
        },
      };

      // Mock 工作区数据
      setMockData('editorWorkspace', [
        {
          uuid: 'test-workspace-123',
          accountUuid: testAccountUuid,
          ...workspaceData,
          layout: JSON.stringify(workspaceData.layout),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const response = await request(app)
        .post('/api/v1/editor/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workspaceData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(workspaceData.name);
      expect(response.body.data.uuid).toBeDefined();

      workspaceId = response.body.data.uuid;
    });

    it('应该验证必填字段', async () => {
      const invalidData = {
        description: '缺少名称的工作区',
      };

      const response = await request(app)
        .post('/api/v1/editor/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      const workspaceData = {
        name: '测试工作区',
        layout: { type: 'simple' },
      };

      await request(app).post('/api/v1/editor/workspaces').send(workspaceData).expect(401);
    });
  });

  describe('GET /api/v1/editor/workspaces', () => {
    beforeEach(async () => {
      // 创建测试工作区数据
      setMockData('editorWorkspace', [
        {
          uuid: 'test-workspace-1',
          accountUuid: testAccountUuid,
          name: '工作区1',
          description: '第一个工作区',
          layout: JSON.stringify({ type: 'single' }),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          uuid: 'test-workspace-2',
          accountUuid: testAccountUuid,
          name: '工作区2',
          description: '第二个工作区',
          layout: JSON.stringify({ type: 'split' }),
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    });

    it('应该成功获取工作区列表', async () => {
      const response = await request(app)
        .get('/api/v1/editor/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.workspaces)).toBe(true);
      expect(response.body.data.total).toBeGreaterThan(0);
    });

    it('应该支持活跃状态筛选', async () => {
      const response = await request(app)
        .get('/api/v1/editor/workspaces')
        .query({ isActive: true })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const activeWorkspaces = response.body.data.workspaces;
      activeWorkspaces.forEach((workspace: any) => {
        expect(workspace.isActive).toBe(true);
      });
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get('/api/v1/editor/workspaces').expect(401);
    });
  });

  // ===== 错误处理和性能测试 =====

  describe('错误处理', () => {
    it('应该正确处理无效的JSON格式', async () => {
      const response = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.text).toContain('Unexpected token');
    });

    it('应该正确处理超大文档内容', async () => {
      const largeContent = 'x'.repeat(10 * 1024 * 1024); // 10MB
      const documentData = {
        title: '超大文档',
        content: largeContent,
        contentType: 'text',
      };

      const response = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(documentData)
        .expect(413);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('文档内容过大');
    });

    it('应该正确处理并发编辑冲突', async () => {
      // 创建测试文档
      const testDocument = {
        uuid: 'test-document-conflict',
        accountUuid: testAccountUuid,
        title: '并发测试文档',
        content: JSON.stringify({ type: 'doc', content: '原始内容' }),
        contentType: 'markdown',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setMockData('document', [testDocument]);

      const updateData1 = {
        title: '更新1',
        content: '用户1的更新',
        version: 1, // 基于版本1
      };

      const updateData2 = {
        title: '更新2',
        content: '用户2的更新',
        version: 1, // 也基于版本1，将产生冲突
      };

      // 第一个更新应该成功
      await request(app)
        .put(`/api/v1/documents/${testDocument.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData1)
        .expect(200);

      // 第二个更新应该检测到冲突
      const response = await request(app)
        .put(`/api/v1/documents/${testDocument.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData2)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('编辑冲突');
    });
  });

  describe('性能测试', () => {
    it('文档创建应该在合理时间内完成', async () => {
      const startTime = Date.now();

      const documentData = {
        title: '性能测试文档',
        content: '性能测试内容',
        contentType: 'markdown',
      };

      setMockData('document', []);

      await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(documentData)
        .expect(201);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // 应该在1秒内完成
    });

    it('文档列表查询应该在合理时间内完成', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/v1/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500); // 列表查询应该更快
    });

    it('版本历史查询应该在合理时间内完成', async () => {
      const startTime = Date.now();

      // 创建测试文档
      const testDocument = {
        uuid: 'test-document-perf',
        accountUuid: testAccountUuid,
        title: '性能测试文档',
        content: JSON.stringify({ type: 'doc', content: '内容' }),
        contentType: 'markdown',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setMockData('document', [testDocument]);
      setMockData('documentVersion', []);

      await request(app)
        .get(`/api/v1/documents/${testDocument.uuid}/versions`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(800); // 版本查询允许稍长时间
    });
  });
});
