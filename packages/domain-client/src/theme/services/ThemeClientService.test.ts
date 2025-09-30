/**
 * 主题客户端服务测试
 * @description 测试 ThemeClientService 的 HTTP 客户端功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeClientService } from '../services/ThemeClientService';
import { ClientTestHelpers, CLIENT_TEST_CONSTANTS } from '../../test/setup';

// 模拟 HTTP 客户端
const mockHttpClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

describe('ThemeClientService', () => {
  let themeService: ThemeClientService;

  beforeEach(() => {
    // 创建服务实例
    themeService = new ThemeClientService(mockHttpClient as any);
  });

  describe('获取主题列表', () => {
    it('应该成功获取主题列表', async () => {
      const mockThemes = [
        {
          uuid: 'theme-1',
          name: '浅色主题',
          type: 'light',
          isBuiltIn: true,
        },
        {
          uuid: 'theme-2',
          name: '深色主题',
          type: 'dark',
          isBuiltIn: true,
        },
      ];

      mockHttpClient.get.mockResolvedValue(ClientTestHelpers.createMockResponse(mockThemes));

      const result = await themeService.getThemes();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/themes');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('浅色主题');
    });

    it('应该处理网络错误', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('网络错误'));

      const result = await themeService.getThemes();

      expect(result.success).toBe(false);
      expect(result.message).toContain('网络错误');
    });
  });

  describe('获取单个主题', () => {
    it('应该成功获取指定主题', async () => {
      const mockTheme = {
        uuid: 'theme-1',
        name: '测试主题',
        type: 'light',
        colors: {
          primary: ['#1976d2'],
          secondary: ['#424242'],
        },
      };

      mockHttpClient.get.mockResolvedValue(ClientTestHelpers.createMockResponse(mockTheme));

      const result = await themeService.getTheme('theme-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/themes/theme-1');
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('测试主题');
    });

    it('应该处理主题不存在的情况', async () => {
      mockHttpClient.get.mockResolvedValue(ClientTestHelpers.createMockResponse(null, false));

      const result = await themeService.getTheme('non-existent');

      expect(result.success).toBe(false);
    });
  });

  describe('创建主题', () => {
    it('应该成功创建新主题', async () => {
      const themeData = {
        name: '新主题',
        type: 'light' as const,
        colors: {
          primary: ['#1976d2'],
          secondary: ['#424242'],
        },
      };

      const mockCreatedTheme = {
        uuid: 'new-theme-uuid',
        ...themeData,
        createdAt: new Date().toISOString(),
      };

      mockHttpClient.post.mockResolvedValue(ClientTestHelpers.createMockResponse(mockCreatedTheme));

      const result = await themeService.createTheme(themeData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/api/themes', themeData);
      expect(result.success).toBe(true);
      expect(result.data?.uuid).toBe('new-theme-uuid');
    });

    it('应该处理创建失败的情况', async () => {
      mockHttpClient.post.mockResolvedValue(ClientTestHelpers.createMockResponse(null, false));

      const result = await themeService.createTheme({
        name: '无效主题',
        type: 'light',
        colors: {},
      } as any);

      expect(result.success).toBe(false);
    });
  });

  describe('更新主题', () => {
    it('应该成功更新主题', async () => {
      const updates = { name: '更新后的主题名' };
      const mockUpdatedTheme = {
        uuid: 'theme-1',
        name: '更新后的主题名',
        type: 'light',
      };

      mockHttpClient.put.mockResolvedValue(ClientTestHelpers.createMockResponse(mockUpdatedTheme));

      const result = await themeService.updateTheme('theme-1', updates);

      expect(mockHttpClient.put).toHaveBeenCalledWith('/api/themes/theme-1', updates);
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('更新后的主题名');
    });
  });

  describe('删除主题', () => {
    it('应该成功删除主题', async () => {
      mockHttpClient.delete.mockResolvedValue(
        ClientTestHelpers.createMockResponse({ success: true }),
      );

      const result = await themeService.deleteTheme('theme-1');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/api/themes/theme-1');
      expect(result.success).toBe(true);
    });

    it('应该防止删除内置主题', async () => {
      mockHttpClient.delete.mockResolvedValue(ClientTestHelpers.createMockResponse(null, false));

      const result = await themeService.deleteTheme('built-in-theme');

      expect(result.success).toBe(false);
    });
  });

  describe('获取主题配置', () => {
    it('应该成功获取主题配置', async () => {
      const mockConfig = {
        uuid: 'config-1',
        followSystemTheme: true,
        enableTransitions: true,
        autoSwitchTheme: false,
      };

      mockHttpClient.get.mockResolvedValue(ClientTestHelpers.createMockResponse(mockConfig));

      const result = await themeService.getConfig();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/api/theme-config');
      expect(result.success).toBe(true);
      expect(result.data?.followSystemTheme).toBe(true);
    });
  });

  describe('更新主题配置', () => {
    it('应该成功更新主题配置', async () => {
      const configUpdates = {
        followSystemTheme: false,
        enableTransitions: true,
      };

      mockHttpClient.put.mockResolvedValue(ClientTestHelpers.createMockResponse(configUpdates));

      const result = await themeService.updateConfig(configUpdates);

      expect(mockHttpClient.put).toHaveBeenCalledWith('/api/theme-config', configUpdates);
      expect(result.success).toBe(true);
    });
  });

  describe('错误处理', () => {
    it('应该处理网络超时', async () => {
      mockHttpClient.get.mockImplementation(async () => {
        await ClientTestHelpers.mockNetworkDelay(5000); // 模拟超时
        throw new Error('请求超时');
      });

      const result = await themeService.getThemes();

      expect(result.success).toBe(false);
      expect(result.message).toContain('超时');
    });

    it('应该处理服务器错误', async () => {
      mockHttpClient.get.mockResolvedValue({
        success: false,
        code: CLIENT_TEST_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: '服务器内部错误',
      });

      const result = await themeService.getThemes();

      expect(result.success).toBe(false);
      expect(result.message).toContain('服务器内部错误');
    });
  });

  describe('缓存机制', () => {
    it('应该缓存主题列表', async () => {
      const mockThemes = [{ uuid: 'theme-1', name: '测试主题' }];

      mockHttpClient.get.mockResolvedValue(ClientTestHelpers.createMockResponse(mockThemes));

      // 第一次调用
      await themeService.getThemes();
      // 第二次调用应该使用缓存
      await themeService.getThemes();

      // HTTP 客户端应该只被调用一次
      expect(mockHttpClient.get).toHaveBeenCalledTimes(1);
    });

    it('应该在创建主题后清除缓存', async () => {
      // 首先获取主题列表（建立缓存）
      mockHttpClient.get.mockResolvedValue(ClientTestHelpers.createMockResponse([]));
      await themeService.getThemes();

      // 创建新主题
      mockHttpClient.post.mockResolvedValue(
        ClientTestHelpers.createMockResponse({ uuid: 'new-theme' }),
      );
      await themeService.createTheme({} as any);

      // 再次获取主题列表应该重新请求
      await themeService.getThemes();

      expect(mockHttpClient.get).toHaveBeenCalledTimes(2);
    });
  });
});
