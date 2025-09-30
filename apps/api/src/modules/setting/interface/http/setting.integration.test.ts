/**
 * Setting 模块 API 集成测试
 * 基于 Task 模块的成功经验，实现全面的 Setting API 测试
 */

import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import app from '../../../../app';
import { ApiTestHelpers } from '../../../../test/setup';
import { setMockData, resetMockData } from '../../../../test/mocks/prismaMock';
import type { Express } from 'express';

describe('[API集成测试] Setting 模块', () => {
  let authToken: string;
  const testAccountUuid: string = 'test-account-123';
  let settingId: string;

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
    settingId = '';
  });

  // ===== Setting CRUD API Tests =====

  describe('GET /api/v1/settings', () => {
    beforeEach(async () => {
      // 创建测试设置数据
      setMockData('setting', [
        {
          uuid: 'test-setting-1',
          accountUuid: testAccountUuid,
          category: 'appearance',
          key: 'theme',
          value: JSON.stringify({ mode: 'dark', primaryColor: '#007acc' }),
          description: '界面主题设置',
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          uuid: 'test-setting-2',
          accountUuid: testAccountUuid,
          category: 'behavior',
          key: 'autoSave',
          value: JSON.stringify({ enabled: true, interval: 30 }),
          description: '自动保存设置',
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    });

    it('应该成功获取用户设置列表', async () => {
      const response = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.settings)).toBe(true);
      expect(response.body.data.total).toBeGreaterThan(0);
    });

    it('应该支持分类筛选', async () => {
      const response = await request(app)
        .get('/api/v1/settings')
        .query({ category: 'appearance' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const settings = response.body.data.settings;
      settings.forEach((setting: any) => {
        expect(setting.category).toBe('appearance');
      });
    });

    it('应该支持按键名筛选', async () => {
      const response = await request(app)
        .get('/api/v1/settings')
        .query({ key: 'theme' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const settings = response.body.data.settings;
      expect(settings.length).toBeGreaterThan(0);
      expect(settings[0].key).toBe('theme');
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get('/api/v1/settings').expect(401);
    });
  });

  describe('GET /api/v1/settings/:category/:key', () => {
    beforeEach(async () => {
      // 创建特定的设置项
      setMockData('setting', [
        {
          uuid: 'test-setting-specific',
          accountUuid: testAccountUuid,
          category: 'notification',
          key: 'emailAlerts',
          value: JSON.stringify({
            enabled: true,
            frequency: 'daily',
            types: ['reminder', 'task', 'goal'],
          }),
          description: '邮件提醒设置',
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    });

    it('应该成功获取特定设置项', async () => {
      const response = await request(app)
        .get('/api/v1/settings/notification/emailAlerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe('notification');
      expect(response.body.data.key).toBe('emailAlerts');
      expect(response.body.data.value).toBeDefined();
    });

    it('不存在的设置项应该返回 404', async () => {
      const response = await request(app)
        .get('/api/v1/settings/nonexistent/setting')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get('/api/v1/settings/notification/emailAlerts').expect(401);
    });
  });

  describe('PUT /api/v1/settings/:category/:key', () => {
    beforeEach(async () => {
      // 创建待更新的设置项
      setMockData('setting', [
        {
          uuid: 'test-setting-update',
          accountUuid: testAccountUuid,
          category: 'editor',
          key: 'preferences',
          value: JSON.stringify({
            fontSize: 14,
            fontFamily: 'Monaco',
            lineHeight: 1.5,
            showLineNumbers: true,
          }),
          description: '编辑器偏好设置',
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    });

    it('应该成功更新设置项', async () => {
      const updateData = {
        value: {
          fontSize: 16,
          fontFamily: 'Consolas',
          lineHeight: 1.6,
          showLineNumbers: true,
          wordWrap: true,
        },
        description: '更新的编辑器偏好设置',
      };

      const response = await request(app)
        .put('/api/v1/settings/editor/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.value.fontSize).toBe(16);
      expect(response.body.data.value.fontFamily).toBe('Consolas');
      expect(response.body.data.description).toBe(updateData.description);
    });

    it('应该验证设置值格式', async () => {
      const invalidData = {
        value: 'invalid-json-structure',
      };

      const response = await request(app)
        .put('/api/v1/settings/editor/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('设置值格式不正确');
    });

    it('不存在的设置项应该创建新设置', async () => {
      const newSettingData = {
        value: {
          newFeature: true,
          options: ['option1', 'option2'],
        },
        description: '新创建的设置项',
      };

      const response = await request(app)
        .put('/api/v1/settings/newcategory/newsetting')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newSettingData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe('newcategory');
      expect(response.body.data.key).toBe('newsetting');
      expect(response.body.message).toContain('设置创建成功');
    });

    it('未认证时应该返回 401', async () => {
      const updateData = { value: { test: true } };

      await request(app).put('/api/v1/settings/editor/preferences').send(updateData).expect(401);
    });
  });

  describe('DELETE /api/v1/settings/:category/:key', () => {
    beforeEach(async () => {
      // 创建待删除的设置项
      setMockData('setting', [
        {
          uuid: 'test-setting-delete',
          accountUuid: testAccountUuid,
          category: 'temporary',
          key: 'testSetting',
          value: JSON.stringify({ temp: true }),
          description: '临时测试设置',
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    });

    it('应该成功删除设置项', async () => {
      const response = await request(app)
        .delete('/api/v1/settings/temporary/testSetting')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('设置删除成功');
    });

    it('不存在的设置项应该返回 404', async () => {
      const response = await request(app)
        .delete('/api/v1/settings/nonexistent/setting')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('不应该删除系统保护的设置', async () => {
      // 设置系统保护的设置项
      setMockData('setting', [
        {
          uuid: 'test-setting-protected',
          accountUuid: testAccountUuid,
          category: 'system',
          key: 'coreConfig',
          value: JSON.stringify({ protected: true }),
          description: '系统核心配置',
          isPublic: false,
          isProtected: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const response = await request(app)
        .delete('/api/v1/settings/system/coreConfig')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('受保护的设置不能删除');
    });

    it('未认证时应该返回 401', async () => {
      await request(app).delete('/api/v1/settings/temporary/testSetting').expect(401);
    });
  });

  // ===== Setting 批量操作 API Tests =====

  describe('POST /api/v1/settings/batch', () => {
    it('应该成功批量更新设置', async () => {
      const batchData = {
        settings: [
          {
            category: 'appearance',
            key: 'theme',
            value: { mode: 'light', primaryColor: '#0066cc' },
            description: '浅色主题',
          },
          {
            category: 'behavior',
            key: 'shortcuts',
            value: {
              save: 'Ctrl+S',
              copy: 'Ctrl+C',
              paste: 'Ctrl+V',
            },
            description: '快捷键设置',
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/settings/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send(batchData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updatedCount).toBe(2);
      expect(Array.isArray(response.body.data.settings)).toBe(true);
    });

    it('应该验证批量数据格式', async () => {
      const invalidData = {
        settings: [
          {
            // 缺少必填字段
            value: { test: true },
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/settings/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('应该限制批量操作数量', async () => {
      const tooManySettings = {
        settings: Array(101)
          .fill(0)
          .map((_, index) => ({
            category: 'test',
            key: `setting${index}`,
            value: { index },
            description: `测试设置${index}`,
          })),
      };

      const response = await request(app)
        .post('/api/v1/settings/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tooManySettings)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('批量操作数量超出限制');
    });

    it('未认证时应该返回 401', async () => {
      const batchData = {
        settings: [
          {
            category: 'test',
            key: 'test',
            value: { test: true },
          },
        ],
      };

      await request(app).post('/api/v1/settings/batch').send(batchData).expect(401);
    });
  });

  describe('POST /api/v1/settings/reset', () => {
    beforeEach(async () => {
      // 创建一些用户设置
      setMockData('setting', [
        {
          uuid: 'test-setting-reset-1',
          accountUuid: testAccountUuid,
          category: 'appearance',
          key: 'theme',
          value: JSON.stringify({ mode: 'dark' }),
          description: '用户主题设置',
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          uuid: 'test-setting-reset-2',
          accountUuid: testAccountUuid,
          category: 'behavior',
          key: 'autoSave',
          value: JSON.stringify({ enabled: false }),
          description: '用户自动保存设置',
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    });

    it('应该成功重置指定分类的设置', async () => {
      const resetData = {
        category: 'appearance',
      };

      const response = await request(app)
        .post('/api/v1/settings/reset')
        .set('Authorization', `Bearer ${authToken}`)
        .send(resetData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.resetCount).toBeGreaterThan(0);
      expect(response.body.message).toContain('设置重置成功');
    });

    it('应该支持重置所有设置', async () => {
      const resetData = {
        resetAll: true,
      };

      const response = await request(app)
        .post('/api/v1/settings/reset')
        .set('Authorization', `Bearer ${authToken}`)
        .send(resetData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.resetCount).toBeGreaterThan(0);
      expect(response.body.message).toContain('所有设置重置成功');
    });

    it('应该验证重置参数', async () => {
      const invalidData = {
        // 既没有category也没有resetAll
      };

      const response = await request(app)
        .post('/api/v1/settings/reset')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('未认证时应该返回 401', async () => {
      const resetData = { category: 'appearance' };

      await request(app).post('/api/v1/settings/reset').send(resetData).expect(401);
    });
  });

  // ===== Setting 导入导出 API Tests =====

  describe('GET /api/v1/settings/export', () => {
    beforeEach(async () => {
      // 创建导出测试数据
      setMockData('setting', [
        {
          uuid: 'test-setting-export-1',
          accountUuid: testAccountUuid,
          category: 'appearance',
          key: 'theme',
          value: JSON.stringify({ mode: 'dark', primaryColor: '#007acc' }),
          description: '主题设置',
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          uuid: 'test-setting-export-2',
          accountUuid: testAccountUuid,
          category: 'behavior',
          key: 'autoSave',
          value: JSON.stringify({ enabled: true, interval: 30 }),
          description: '自动保存设置',
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    });

    it('应该成功导出用户设置', async () => {
      const response = await request(app)
        .get('/api/v1/settings/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.settings).toBeDefined();
      expect(response.body.data.exportTime).toBeDefined();
      expect(response.body.data.version).toBeDefined();
    });

    it('应该支持按分类导出', async () => {
      const response = await request(app)
        .get('/api/v1/settings/export')
        .query({ category: 'appearance' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const settings = response.body.data.settings;
      settings.forEach((setting: any) => {
        expect(setting.category).toBe('appearance');
      });
    });

    it('未认证时应该返回 401', async () => {
      await request(app).get('/api/v1/settings/export').expect(401);
    });
  });

  describe('POST /api/v1/settings/import', () => {
    it('应该成功导入设置', async () => {
      const importData = {
        settings: [
          {
            category: 'imported',
            key: 'feature1',
            value: { enabled: true },
            description: '导入的功能1设置',
          },
          {
            category: 'imported',
            key: 'feature2',
            value: { config: 'value' },
            description: '导入的功能2设置',
          },
        ],
        overwrite: true,
      };

      const response = await request(app)
        .post('/api/v1/settings/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send(importData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.importedCount).toBe(2);
      expect(response.body.message).toContain('设置导入成功');
    });

    it('应该验证导入数据格式', async () => {
      const invalidData = {
        settings: [
          {
            // 缺少必填字段
            value: { test: true },
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/settings/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('应该支持冲突处理策略', async () => {
      // 先创建现有设置
      setMockData('setting', [
        {
          uuid: 'test-setting-conflict',
          accountUuid: testAccountUuid,
          category: 'conflict',
          key: 'testKey',
          value: JSON.stringify({ original: true }),
          description: '原始设置',
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const importData = {
        settings: [
          {
            category: 'conflict',
            key: 'testKey',
            value: { imported: true },
            description: '导入的设置',
          },
        ],
        overwrite: false, // 不覆盖现有设置
      };

      const response = await request(app)
        .post('/api/v1/settings/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send(importData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.skippedCount).toBeGreaterThan(0);
    });

    it('未认证时应该返回 401', async () => {
      const importData = {
        settings: [
          {
            category: 'test',
            key: 'test',
            value: { test: true },
          },
        ],
      };

      await request(app).post('/api/v1/settings/import').send(importData).expect(401);
    });
  });

  // ===== 错误处理和性能测试 =====

  describe('错误处理', () => {
    it('应该正确处理无效的JSON格式', async () => {
      const response = await request(app)
        .put('/api/v1/settings/test/setting')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.text).toContain('Unexpected token');
    });

    it('应该正确处理超大设置值', async () => {
      const largeValue = 'x'.repeat(1024 * 1024); // 1MB
      const settingData = {
        value: { largeData: largeValue },
        description: '超大设置值',
      };

      const response = await request(app)
        .put('/api/v1/settings/test/largesetting')
        .set('Authorization', `Bearer ${authToken}`)
        .send(settingData)
        .expect(413);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('设置值过大');
    });
  });

  describe('性能测试', () => {
    it('设置查询应该在合理时间内完成', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500); // 应该在0.5秒内完成
    });

    it('批量设置更新应该在合理时间内完成', async () => {
      const startTime = Date.now();

      const batchData = {
        settings: Array(10)
          .fill(0)
          .map((_, index) => ({
            category: 'performance',
            key: `setting${index}`,
            value: { index, test: true },
            description: `性能测试设置${index}`,
          })),
      };

      await request(app)
        .post('/api/v1/settings/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send(batchData)
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // 批量操作允许2秒
    });
  });
});
