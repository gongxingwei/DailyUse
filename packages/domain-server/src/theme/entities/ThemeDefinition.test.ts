/**
 * 主题定义实体测试
 * @description 测试 ThemeDefinition 实体的业务逻辑
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeDefinition } from '../ThemeDefinition';
import { TestHelpers, TEST_CONSTANTS } from '../../test/setup';
import type { IThemeDefinition } from '@dailyuse/contracts';

describe('ThemeDefinition 实体', () => {
  let validThemeData: Omit<IThemeDefinition, 'uuid' | 'createdAt' | 'updatedAt'>;

  beforeEach(() => {
    // 设置固定的测试时间
    global.createMockDate(TEST_CONSTANTS.TEST_DATE);

    // 准备有效的主题数据
    validThemeData = {
      name: '测试主题',
      type: 'light',
      description: '用于测试的浅色主题',
      author: '测试作者',
      version: '1.0.0',
      isBuiltIn: false,
      colors: {
        primary: '#1976d2',
        secondary: '#424242',
        accent: '#82b1ff',
        error: '#ff5252',
        info: '#2196f3',
        success: '#4caf50',
        warning: '#ffc107',
        background: '#ffffff',
        surface: '#ffffff',
        onPrimary: '#ffffff',
        onSecondary: '#ffffff',
        onBackground: '#000000',
        onSurface: '#000000',
        onError: '#ffffff',
      },
      css: ':root { --primary: #1976d2; }',
    };
  });

  describe('实体创建', () => {
    it('应该成功创建有效的主题定义', () => {
      const theme = new ThemeDefinition(validThemeData);

      expect(theme.name).toBe('测试主题');
      expect(theme.type).toBe('light');
      expect(theme.isBuiltIn).toBe(false);
      expect(theme.uuid).toBeDefined();
      expect(theme.createdAt).toBeInstanceOf(Date);
    });

    it('应该自动生成唯一的 UUID', () => {
      const theme1 = new ThemeDefinition(validThemeData);
      const theme2 = new ThemeDefinition(validThemeData);

      expect(theme1.uuid).not.toBe(theme2.uuid);
      expect(theme1.uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('应该设置正确的创建时间', () => {
      const theme = new ThemeDefinition(validThemeData);
      const expectedDate = new Date(TEST_CONSTANTS.TEST_DATE);

      expect(theme.createdAt.getTime()).toBe(expectedDate.getTime());
      expect(theme.updatedAt.getTime()).toBe(expectedDate.getTime());
    });
  });

  describe('验证规则', () => {
    it('应该拒绝空的主题名称', () => {
      expect(() => {
        new ThemeDefinition({
          ...validThemeData,
          name: '',
        });
      }).toThrow('主题名称不能为空');
    });

    it('应该拒绝无效的主题类型', () => {
      expect(() => {
        new ThemeDefinition({
          ...validThemeData,
          type: 'invalid' as any,
        });
      }).toThrow('无效的主题类型');
    });

    it('应该验证必需的颜色配置', () => {
      expect(() => {
        new ThemeDefinition({
          ...validThemeData,
          colors: {
            ...validThemeData.colors,
            primary: '', // 缺少主色调
          },
        });
      }).toThrow('主色调不能为空');
    });

    it('应该验证颜色值格式', () => {
      expect(() => {
        new ThemeDefinition({
          ...validThemeData,
          colors: {
            ...validThemeData.colors,
            primary: 'invalid-color', // 无效的颜色格式
          },
        });
      }).toThrow('无效的颜色格式');
    });
  });

  describe('业务方法', () => {
    let theme: ThemeDefinition;

    beforeEach(() => {
      theme = new ThemeDefinition(validThemeData);
    });

    it('应该生成正确的 CSS 变量', () => {
      const css = theme.generateCssVariables();

      expect(css).toContain('--theme-primary: #1976d2');
      expect(css).toContain('--theme-secondary: #424242');
      expect(css).toContain('--theme-background: #ffffff');
    });

    it('应该检测颜色对比度', () => {
      const hasGoodContrast = theme.validateContrast();

      // 白色背景上的深蓝色文字应该有良好的对比度
      expect(hasGoodContrast).toBe(true);
    });

    it('应该支持主题克隆', () => {
      const clonedTheme = theme.clone('克隆的主题');

      expect(clonedTheme.name).toBe('克隆的主题');
      expect(clonedTheme.colors.primary).toBe(theme.colors.primary);
      expect(clonedTheme.uuid).not.toBe(theme.uuid);
    });

    it('应该支持主题更新', () => {
      const originalUpdatedAt = theme.updatedAt;

      // 等待一毫秒确保时间变化
      TestHelpers.wait(1).then(() => {
        theme.updateColors({
          primary: '#ff5722',
        });

        expect(theme.colors.primary).toBe('#ff5722');
        expect(theme.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      });
    });
  });

  describe('主题兼容性', () => {
    it('应该检测与深色主题的兼容性', () => {
      const darkTheme = new ThemeDefinition({
        ...validThemeData,
        type: 'dark',
        colors: {
          ...validThemeData.colors,
          background: '#121212',
          surface: '#1e1e1e',
          onBackground: '#ffffff',
          onSurface: '#ffffff',
        },
      });

      expect(darkTheme.isCompatibleWithSystemTheme('dark')).toBe(true);
      expect(darkTheme.isCompatibleWithSystemTheme('light')).toBe(false);
    });

    it('应该支持自动主题', () => {
      const autoTheme = new ThemeDefinition({
        ...validThemeData,
        type: 'auto',
      });

      expect(autoTheme.isCompatibleWithSystemTheme('light')).toBe(true);
      expect(autoTheme.isCompatibleWithSystemTheme('dark')).toBe(true);
    });
  });

  describe('序列化和反序列化', () => {
    it('应该正确序列化为 JSON', () => {
      const theme = new ThemeDefinition(validThemeData);
      const json = theme.toJSON();

      expect(json.name).toBe('测试主题');
      expect(json.uuid).toBe(theme.uuid);
      expect(typeof json.createdAt).toBe('string');
    });

    it('应该从 JSON 正确反序列化', () => {
      const theme = new ThemeDefinition(validThemeData);
      const json = theme.toJSON();
      const restored = ThemeDefinition.fromJSON(json);

      expect(restored.name).toBe(theme.name);
      expect(restored.uuid).toBe(theme.uuid);
      expect(restored.colors.primary).toBe(theme.colors.primary);
    });
  });

  describe('边界情况', () => {
    it('应该处理最小配置的主题', () => {
      const minimalTheme = new ThemeDefinition({
        name: '最小主题',
        type: 'light',
        colors: {
          primary: '#000000',
          secondary: '#ffffff',
          accent: '#cccccc',
          error: '#ff0000',
          info: '#0000ff',
          success: '#00ff00',
          warning: '#ffff00',
          background: '#ffffff',
          surface: '#ffffff',
          onPrimary: '#ffffff',
          onSecondary: '#000000',
          onBackground: '#000000',
          onSurface: '#000000',
          onError: '#ffffff',
        },
      });

      expect(minimalTheme.name).toBe('最小主题');
      expect(minimalTheme.description).toBeUndefined();
      expect(minimalTheme.author).toBeUndefined();
    });

    it('应该处理超长的主题名称', () => {
      const longName = 'A'.repeat(1000);

      expect(() => {
        new ThemeDefinition({
          ...validThemeData,
          name: longName,
        });
      }).toThrow('主题名称过长');
    });
  });
});
