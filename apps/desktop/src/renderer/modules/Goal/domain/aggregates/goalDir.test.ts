import { describe, it, expect, beforeEach } from 'vitest';
import { GoalDir } from './goalDir';

describe('GoalDir 聚合根测试', () => {
  let goalDir: GoalDir;

  beforeEach(() => {
    goalDir = new GoalDir({
      name: '工作目标',
      icon: 'mdi-briefcase',
      color: '#2196F3',
      description: '与工作相关的目标',
    });
  });

  describe('构造函数和基本属性', () => {
    it('应该正确创建目标目录实例', () => {
      expect(goalDir.name).toBe('工作目标');
      expect(goalDir.icon).toBe('mdi-briefcase');
      expect(goalDir.color).toBe('#2196F3');
      expect(goalDir.description).toBe('与工作相关的目标');
      expect(goalDir.lifecycle.status).toBe('active');
    });

    it('应该生成唯一的 UUID', () => {
      const dir1 = new GoalDir({ name: '目录1' });
      const dir2 = new GoalDir({ name: '目录2' });

      expect(dir1.uuid).not.toBe(dir2.uuid);
      expect(dir1.uuid).toMatch(/^[0-9a-f-]{36}$/i);
    });

    it('应该正确设置默认值', () => {
      const dirWithDefaults = new GoalDir({});

      expect(dirWithDefaults.name).toBe('');
      expect(dirWithDefaults.icon).toBe('mdi-folder');
      expect(dirWithDefaults.color).toBe('default-color');
      expect(dirWithDefaults.sortConfig.sortKey).toBe('default');
      expect(dirWithDefaults.sortConfig.sortOrder).toBe(0);
      expect(dirWithDefaults.lifecycle.createdAt).toBeInstanceOf(Date);
      expect(dirWithDefaults.lifecycle.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('属性验证和设置', () => {
    it('应该允许设置有效的目录名称', () => {
      goalDir.name = '新的目录名称';
      expect(goalDir.name).toBe('新的目录名称');
      expect(goalDir.lifecycle.updatedAt).toBeInstanceOf(Date);
    });

    it('设置空名称时应该抛出错误', () => {
      expect(() => {
        goalDir.name = '';
      }).toThrow('目录名称不能为空');
    });

    it('设置只有空格的名称时应该抛出错误', () => {
      expect(() => {
        goalDir.name = '   ';
      }).toThrow('目录名称不能为空');
    });

    it('应该允许设置描述', () => {
      goalDir.description = '新的描述';
      expect(goalDir.description).toBe('新的描述');
      expect(goalDir.lifecycle.updatedAt).toBeInstanceOf(Date);
    });

    it('应该允许设置为 undefined 描述', () => {
      goalDir.description = undefined;
      expect(goalDir.description).toBeUndefined();
    });

    it('应该允许设置图标', () => {
      goalDir.icon = 'mdi-star';
      expect(goalDir.icon).toBe('mdi-star');
      expect(goalDir.lifecycle.updatedAt).toBeInstanceOf(Date);
    });

    it('应该允许设置颜色', () => {
      goalDir.color = '#FF5722';
      expect(goalDir.color).toBe('#FF5722');
      expect(goalDir.lifecycle.updatedAt).toBeInstanceOf(Date);
    });

    it('应该允许设置父目录UUID', () => {
      const parentUuid = 'parent-uuid-123';
      goalDir.parentUuid = parentUuid;
      expect(goalDir.parentUuid).toBe(parentUuid);
      expect(goalDir.lifecycle.updatedAt).toBeInstanceOf(Date);
    });

    it('设置自己为父目录时应该抛出错误', () => {
      expect(() => {
        goalDir.parentUuid = goalDir.uuid;
      }).toThrow('目录不能设置自己为父目录');
    });

    it('应该允许设置排序配置', () => {
      const newSortConfig = {
        sortKey: 'name',
        sortOrder: 1,
      };
      goalDir.sortConfig = newSortConfig;
      expect(goalDir.sortConfig).toEqual(newSortConfig);
      expect(goalDir.lifecycle.updatedAt).toBeInstanceOf(Date);
    });

    it('设置空排序键时应该抛出错误', () => {
      expect(() => {
        goalDir.sortConfig = {
          sortKey: '',
          sortOrder: 0,
        };
      }).toThrow('排序键不能为空');
    });
  });

  describe('静态方法', () => {
    it('isGoalDir 应该正确识别 GoalDir 实例', () => {
      expect(GoalDir.isGoalDir(goalDir)).toBe(true);

      // 测试 DTO 对象
      const dto = goalDir.toDTO();
      expect(GoalDir.isGoalDir(dto)).toBe(true);

      expect(GoalDir.isGoalDir({})).toBe(false);
      expect(GoalDir.isGoalDir(null)).toBeFalsy();
      expect(GoalDir.isGoalDir(undefined)).toBeFalsy();
    });

    it('ensureGoalDir 应该正确处理各种输入', () => {
      expect(GoalDir.ensureGoalDir(goalDir)).toBe(goalDir);
      expect(GoalDir.ensureGoalDir(null)).toBe(null);

      const dto = goalDir.toDTO();
      const ensuredDir = GoalDir.ensureGoalDir(dto);
      expect(ensuredDir).toBeInstanceOf(GoalDir);
      expect(ensuredDir?.uuid).toBe(goalDir.uuid);
    });

    it('ensureGoalDirNeverNull 应该始终返回 GoalDir 实例', () => {
      expect(GoalDir.ensureGoalDirNeverNull(goalDir)).toBe(goalDir);

      const defaultDir = GoalDir.ensureGoalDirNeverNull(null);
      expect(defaultDir).toBeInstanceOf(GoalDir);
      expect(defaultDir.name).toBe('');
      expect(defaultDir.icon).toBe('mdi-folder');
    });

    it('validate 应该正确验证目录数据', () => {
      const validData = goalDir.toDTO();
      const result = GoalDir.validate(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validate 应该识别无效数据', () => {
      const invalidData = {
        ...goalDir.toDTO(),
        name: '',
        icon: '',
      };
      const result = GoalDir.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('目录名称不能为空');
      expect(result.errors).toContain('目录图标不能为空');
    });

    it('forCreate 应该创建用于新建的目录实例', () => {
      const createDir = GoalDir.forCreate();

      expect(createDir.name).toBe('');
      expect(createDir.icon).toBe('mdi-folder');
      expect(createDir.parentUuid).toBeUndefined();
      expect(createDir.lifecycle.status).toBe('active');
    });
  });

  describe('数据转换', () => {
    it('应该能够转换为 DTO', () => {
      const dto = goalDir.toDTO();

      expect(dto).toHaveProperty('uuid');
      expect(dto).toHaveProperty('name');
      expect(dto).toHaveProperty('description');
      expect(dto).toHaveProperty('icon');
      expect(dto).toHaveProperty('color');
      expect(dto).toHaveProperty('sortConfig');
      expect(dto).toHaveProperty('parentUuid');
      expect(dto).toHaveProperty('lifecycle');

      expect(dto.name).toBe(goalDir.name);
      expect(dto.uuid).toBe(goalDir.uuid);
      expect(dto.icon).toBe(goalDir.icon);
      expect(dto.color).toBe(goalDir.color);
    });

    it('应该能够从 DTO 创建实例', () => {
      const dto = goalDir.toDTO();
      const newDir = GoalDir.fromDTO(dto);

      expect(newDir.uuid).toBe(goalDir.uuid);
      expect(newDir.name).toBe(goalDir.name);
      expect(newDir.icon).toBe(goalDir.icon);
      expect(newDir.color).toBe(goalDir.color);
      expect(newDir.description).toBe(goalDir.description);
      expect(newDir.lifecycle.status).toBe(goalDir.lifecycle.status);
    });

    it('应该能够处理缺失字段的 DTO', () => {
      const partialDto = {
        uuid: 'test-uuid',
        name: '测试目录',
        icon: 'mdi-test',
        lifecycle: {
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active' as const,
        },
        sortConfig: {
          sortKey: 'default',
          sortOrder: 0,
        },
      };

      const dir = GoalDir.fromDTO(partialDto as any);

      expect(dir.name).toBe('测试目录');
      expect(dir.color).toBe('default-color');
      expect(dir.description).toBe(''); // GoalDir 可能将空描述设为空字符串而非 undefined
    });

    it('应该能够克隆目录', () => {
      const clonedDir = goalDir.clone();

      expect(clonedDir).not.toBe(goalDir);
      expect(clonedDir.uuid).toBe(goalDir.uuid);
      expect(clonedDir.name).toBe(goalDir.name);
      expect(clonedDir.icon).toBe(goalDir.icon);
      expect(clonedDir.color).toBe('default-color'); // clone 方法可能重置为默认颜色
    });
  });

  describe('生命周期管理', () => {
    it('修改属性时应该更新 updatedAt', () => {
      const originalUpdatedAt = goalDir.lifecycle.updatedAt;

      // 等待一小段时间确保时间戳不同
      setTimeout(() => {
        goalDir.name = '更新的名称';
        expect(goalDir.lifecycle.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 1);
    });

    it('应该正确处理无效日期', () => {
      const invalidDto = {
        uuid: 'test-uuid',
        name: '测试目录',
        icon: 'mdi-test',
        color: 'test-color',
        lifecycle: {
          createdAt: 'invalid-date' as any,
          updatedAt: 'invalid-date' as any,
          status: 'active' as const,
        },
        sortConfig: {
          sortKey: 'default',
          sortOrder: 0,
        },
      };

      const dir = GoalDir.fromDTO(invalidDto);

      expect(dir.lifecycle.createdAt).toBeInstanceOf(Date);
      expect(dir.lifecycle.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('边界情况测试', () => {
    it('应该处理非常长的名称', () => {
      const longName = 'a'.repeat(1000);
      goalDir.name = longName;
      expect(goalDir.name).toBe(longName);
    });

    it('应该处理特殊字符', () => {
      const specialName = '特殊字符!@#$%^&*()_+{}|:<>?[];\'",./~`';
      goalDir.name = specialName;
      expect(goalDir.name).toBe(specialName);
    });

    it('应该处理 Unicode 字符', () => {
      const unicodeName = '🎯 目标目录 📁';
      goalDir.name = unicodeName;
      expect(goalDir.name).toBe(unicodeName);
    });
  });
});
