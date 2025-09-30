/**
 * 主题 API 集成测试
 * @description 使用 Supertest 测试主题相关的 API 端点
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { ApiTestHelpers, API_TEST_CONSTANTS, mockPrisma } from '../../test/setup';

describe('主题 API 集成测试', () => {
  let app: Express;
  let authToken: string;

  beforeEach(async () => {
    // 创建测试应用
    app = await ApiTestHelpers.createTestApp();

    // 创建测试用的认证 token
    authToken = await ApiTestHelpers.createTestToken({
      accountUuid: API_TEST_CONSTANTS.TEST_ACCOUNT.uuid,
    });
  });

  describe('GET /api/themes', () => {
    it('应该返回主题列表', async () => {
      // 模拟数据库返回数据
      const mockThemes = [
        ApiTestHelpers.createTestData.theme({
          name: '浅色主题',
          type: 'light',
          isBuiltIn: true,
        }),
        ApiTestHelpers.createTestData.theme({
          name: '深色主题',
          type: 'dark',
          isBuiltIn: true,
        }),
      ];

      mockPrisma.themeDefinition.findMany.mockResolvedValue(mockThemes);

      const response = await request(app)
        .get(API_TEST_CONSTANTS.API_PATHS.THEMES)
        .set(ApiTestHelpers.createAuthHeaders(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].name).toBe('浅色主题');

      // 验证数据库调用
      expect(mockPrisma.themeDefinition.findMany).toHaveBeenCalledWith({
        orderBy: [{ isBuiltIn: 'desc' }, { name: 'asc' }],
      });
    });

    it('应该处理未授权的请求', async () => {
      await request(app).get(API_TEST_CONSTANTS.API_PATHS.THEMES).expect(401);
    });

    it('应该处理数据库错误', async () => {
      mockPrisma.themeDefinition.findMany.mockRejectedValue(new Error('数据库连接失败'));

      const response = await request(app)
        .get(API_TEST_CONSTANTS.API_PATHS.THEMES)
        .set(ApiTestHelpers.createAuthHeaders(authToken))
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('内部服务器错误');
    });
  });

  describe('GET /api/themes/:id', () => {
    it('应该返回指定主题的详细信息', async () => {
      const mockTheme = ApiTestHelpers.createTestData.theme({
        uuid: 'theme-123',
        name: '测试主题',
      });

      mockPrisma.themeDefinition.findUnique.mockResolvedValue(mockTheme);

      const response = await request(app)
        .get(`${API_TEST_CONSTANTS.API_PATHS.THEMES}/theme-123`)
        .set(ApiTestHelpers.createAuthHeaders(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.uuid).toBe('theme-123');
      expect(response.body.data.name).toBe('测试主题');

      expect(mockPrisma.themeDefinition.findUnique).toHaveBeenCalledWith({
        where: { uuid: 'theme-123' },
      });
    });

    it('应该返回 404 当主题不存在时', async () => {
      mockPrisma.themeDefinition.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get(`${API_TEST_CONSTANTS.API_PATHS.THEMES}/non-existent`)
        .set(ApiTestHelpers.createAuthHeaders(authToken))
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('主题不存在');
    });
  });

  describe('POST /api/themes', () => {
    it('应该成功创建新主题', async () => {
      const themeData = {
        name: '新主题',
        type: 'custom',
        description: '用户自定义主题',
        colors: {
          primary: ['#1976d2'],
          secondary: ['#424242'],
          background: ['#ffffff'],
          surface: ['#ffffff'],
        },
      };

      const mockCreatedTheme = {
        ...ApiTestHelpers.createTestData.theme(themeData),
        uuid: 'new-theme-uuid',
      };

      mockPrisma.themeDefinition.create.mockResolvedValue(mockCreatedTheme);

      const response = await request(app)
        .post(API_TEST_CONSTANTS.API_PATHS.THEMES)
        .set(ApiTestHelpers.createAuthHeaders(authToken))
        .send(themeData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.uuid).toBe('new-theme-uuid');
      expect(response.body.data.name).toBe('新主题');

      expect(mockPrisma.themeDefinition.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: '新主题',
          type: 'custom',
          accountUuid: API_TEST_CONSTANTS.TEST_ACCOUNT.uuid,
        }),
      });
    });

    it('应该验证必需的字段', async () => {
      const invalidData = {
        // 缺少 name 字段
        type: 'custom',
        colors: {},
      };

      const response = await request(app)
        .post(API_TEST_CONSTANTS.API_PATHS.THEMES)
        .set(ApiTestHelpers.createAuthHeaders(authToken))
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证失败');
    });

    it('应该防止创建重名主题', async () => {
      mockPrisma.themeDefinition.findFirst.mockResolvedValue(
        ApiTestHelpers.createTestData.theme({ name: '已存在的主题' }),
      );

      const response = await request(app)
        .post(API_TEST_CONSTANTS.API_PATHS.THEMES)
        .set(ApiTestHelpers.createAuthHeaders(authToken))
        .send({
          name: '已存在的主题',
          type: 'custom',
          colors: {},
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('主题名称已存在');
    });
  });

  describe('PUT /api/themes/:id', () => {
    it('应该成功更新主题', async () => {
      const existingTheme = ApiTestHelpers.createTestData.theme({
        uuid: 'theme-123',
        name: '原始主题',
        accountUuid: API_TEST_CONSTANTS.TEST_ACCOUNT.uuid,
      });

      const updateData = {
        name: '更新后的主题',
        description: '新的描述',
      };

      mockPrisma.themeDefinition.findUnique.mockResolvedValue(existingTheme);
      mockPrisma.themeDefinition.update.mockResolvedValue({
        ...existingTheme,
        ...updateData,
        updatedAt: new Date(),
      });

      const response = await request(app)
        .put(`${API_TEST_CONSTANTS.API_PATHS.THEMES}/theme-123`)
        .set(ApiTestHelpers.createAuthHeaders(authToken))
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('更新后的主题');

      expect(mockPrisma.themeDefinition.update).toHaveBeenCalledWith({
        where: { uuid: 'theme-123' },
        data: expect.objectContaining(updateData),
      });
    });

    it('应该防止更新内置主题', async () => {
      const builtInTheme = ApiTestHelpers.createTestData.theme({
        uuid: 'builtin-theme',
        isBuiltIn: true,
      });

      mockPrisma.themeDefinition.findUnique.mockResolvedValue(builtInTheme);

      const response = await request(app)
        .put(`${API_TEST_CONSTANTS.API_PATHS.THEMES}/builtin-theme`)
        .set(ApiTestHelpers.createAuthHeaders(authToken))
        .send({ name: '新名称' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不能修改内置主题');
    });

    it('应该验证权限', async () => {
      const otherUserTheme = ApiTestHelpers.createTestData.theme({
        uuid: 'theme-123',
        accountUuid: 'other-user-uuid',
      });

      mockPrisma.themeDefinition.findUnique.mockResolvedValue(otherUserTheme);

      const response = await request(app)
        .put(`${API_TEST_CONSTANTS.API_PATHS.THEMES}/theme-123`)
        .set(ApiTestHelpers.createAuthHeaders(authToken))
        .send({ name: '新名称' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无权限');
    });
  });

  describe('DELETE /api/themes/:id', () => {
    it('应该成功删除主题', async () => {
      const userTheme = ApiTestHelpers.createTestData.theme({
        uuid: 'theme-123',
        accountUuid: API_TEST_CONSTANTS.TEST_ACCOUNT.uuid,
        isBuiltIn: false,
      });

      mockPrisma.themeDefinition.findUnique.mockResolvedValue(userTheme);
      mockPrisma.themeDefinition.delete.mockResolvedValue(userTheme);

      const response = await request(app)
        .delete(`${API_TEST_CONSTANTS.API_PATHS.THEMES}/theme-123`)
        .set(ApiTestHelpers.createAuthHeaders(authToken))
        .expect(200);

      expect(response.body.success).toBe(true);

      expect(mockPrisma.themeDefinition.delete).toHaveBeenCalledWith({
        where: { uuid: 'theme-123' },
      });
    });

    it('应该防止删除内置主题', async () => {
      const builtInTheme = ApiTestHelpers.createTestData.theme({
        uuid: 'builtin-theme',
        isBuiltIn: true,
      });

      mockPrisma.themeDefinition.findUnique.mockResolvedValue(builtInTheme);

      const response = await request(app)
        .delete(`${API_TEST_CONSTANTS.API_PATHS.THEMES}/builtin-theme`)
        .set(ApiTestHelpers.createAuthHeaders(authToken))
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不能删除内置主题');
    });
  });

  describe('主题配置 API', () => {
    describe('GET /api/theme-config', () => {
      it('应该返回用户的主题配置', async () => {
        const mockConfig = {
          uuid: 'config-123',
          accountUuid: API_TEST_CONSTANTS.TEST_ACCOUNT.uuid,
          followSystemTheme: true,
          enableTransitions: true,
          autoSwitchTheme: false,
        };

        mockPrisma.themeConfig.findUnique.mockResolvedValue(mockConfig);

        const response = await request(app)
          .get('/api/theme-config')
          .set(ApiTestHelpers.createAuthHeaders(authToken))
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.followSystemTheme).toBe(true);
      });

      it('应该为新用户创建默认配置', async () => {
        mockPrisma.themeConfig.findUnique.mockResolvedValue(null);

        const defaultConfig = {
          uuid: 'new-config-uuid',
          accountUuid: API_TEST_CONSTANTS.TEST_ACCOUNT.uuid,
          followSystemTheme: false,
          enableTransitions: true,
          autoSwitchTheme: false,
        };

        mockPrisma.themeConfig.create.mockResolvedValue(defaultConfig);

        const response = await request(app)
          .get('/api/theme-config')
          .set(ApiTestHelpers.createAuthHeaders(authToken))
          .expect(200);

        expect(mockPrisma.themeConfig.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            accountUuid: API_TEST_CONSTANTS.TEST_ACCOUNT.uuid,
            followSystemTheme: false,
            enableTransitions: true,
          }),
        });
      });
    });

    describe('PUT /api/theme-config', () => {
      it('应该成功更新主题配置', async () => {
        const existingConfig = {
          uuid: 'config-123',
          accountUuid: API_TEST_CONSTANTS.TEST_ACCOUNT.uuid,
          followSystemTheme: false,
        };

        const updateData = {
          followSystemTheme: true,
          enableTransitions: false,
        };

        mockPrisma.themeConfig.findUnique.mockResolvedValue(existingConfig);
        mockPrisma.themeConfig.update.mockResolvedValue({
          ...existingConfig,
          ...updateData,
          updatedAt: new Date(),
        });

        const response = await request(app)
          .put('/api/theme-config')
          .set(ApiTestHelpers.createAuthHeaders(authToken))
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.followSystemTheme).toBe(true);
      });
    });
  });
});
