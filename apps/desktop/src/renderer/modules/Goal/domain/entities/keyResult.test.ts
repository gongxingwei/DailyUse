import { describe, it, expect, beforeEach } from 'vitest';
import { KeyResult } from './keyResult';

describe('KeyResult 实体测试', () => {
  let keyResult: KeyResult;

  beforeEach(() => {
    keyResult = new KeyResult({
      name: '增重', // 改为增重目标，这样目标值大于起始值
      startValue: 60,
      targetValue: 70,
      currentValue: 65,
      calculationMethod: 'sum',
      weight: 5,
    });
  });

  describe('构造函数和基本属性', () => {
    it('应该正确创建关键结果实例', () => {
      expect(keyResult.name).toBe('增重');
      expect(keyResult.startValue).toBe(60);
      expect(keyResult.targetValue).toBe(70);
      expect(keyResult.currentValue).toBe(65);
      expect(keyResult.calculationMethod).toBe('sum');
      expect(keyResult.weight).toBe(5);
      expect(keyResult.lifecycle.status).toBe('active');
    });

    it('应该生成唯一的 UUID', () => {
      const kr1 = new KeyResult({
        name: '关键结果1',
        startValue: 0,
        targetValue: 10,
        currentValue: 5,
        calculationMethod: 'sum',
        weight: 1,
      });
      const kr2 = new KeyResult({
        name: '关键结果2',
        startValue: 0,
        targetValue: 10,
        currentValue: 5,
        calculationMethod: 'sum',
        weight: 1,
      });

      expect(kr1.uuid).not.toBe(kr2.uuid);
      expect(kr1.uuid).toMatch(/^[0-9a-f-]{36}$/i);
    });

    it('应该正确设置生命周期', () => {
      expect(keyResult.lifecycle.createdAt).toBeInstanceOf(Date);
      expect(keyResult.lifecycle.updatedAt).toBeInstanceOf(Date);
      expect(keyResult.lifecycle.status).toBe('active');
    });

    it('应该允许自定义生命周期', () => {
      const customDate = new Date('2024-01-01');
      const kr = new KeyResult({
        name: '自定义关键结果',
        startValue: 0,
        targetValue: 10,
        currentValue: 5,
        calculationMethod: 'sum',
        weight: 1,
        lifecycle: {
          createdAt: customDate,
          updatedAt: customDate,
          status: 'completed',
        },
      });

      expect(kr.lifecycle.createdAt).toEqual(customDate);
      expect(kr.lifecycle.updatedAt).toEqual(customDate);
      expect(kr.lifecycle.status).toBe('completed');
    });
  });

  describe('属性验证和设置', () => {
    it('应该允许设置有效的名称', () => {
      keyResult.name = '新的关键结果名称';
      expect(keyResult.name).toBe('新的关键结果名称');
      expect(keyResult.lifecycle.updatedAt).toBeInstanceOf(Date);
    });

    it('设置空名称时应该抛出错误', () => {
      expect(() => {
        keyResult.name = '';
      }).toThrow('关键结果名称不能为空');
    });

    it('设置只有空格的名称时应该抛出错误', () => {
      expect(() => {
        keyResult.name = '   ';
      }).toThrow('关键结果名称不能为空');
    });

    it('应该允许设置起始值', () => {
      keyResult.startValue = 80;
      expect(keyResult.startValue).toBe(80);
      expect(keyResult.lifecycle.updatedAt).toBeInstanceOf(Date);
    });

    it('应该允许设置目标值', () => {
      keyResult.targetValue = 75; // 大于起始值60
      expect(keyResult.targetValue).toBe(75);
      expect(keyResult.lifecycle.updatedAt).toBeInstanceOf(Date);
    });

    it('设置目标值小于等于起始值时应该抛出错误', () => {
      expect(() => {
        keyResult.targetValue = 60; // 等于起始值60
      }).toThrow('目标值必须大于起始值');

      expect(() => {
        keyResult.targetValue = 55; // 小于起始值60
      }).toThrow('目标值必须大于起始值');
    });

    it('应该允许设置当前值', () => {
      keyResult.currentValue = 62;
      expect(keyResult.currentValue).toBe(62);
      expect(keyResult.lifecycle.updatedAt).toBeInstanceOf(Date);
    });

    it('设置负数当前值时应该抛出错误', () => {
      expect(() => {
        keyResult.currentValue = -5;
      }).toThrow('当前值不能为负数');
    });

    it('应该允许设置计算方法', () => {
      keyResult.calculationMethod = 'average';
      expect(keyResult.calculationMethod).toBe('average');
      expect(keyResult.lifecycle.updatedAt).toBeInstanceOf(Date);
    });

    it('应该允许设置权重', () => {
      keyResult.weight = 8;
      expect(keyResult.weight).toBe(8);
      expect(keyResult.lifecycle.updatedAt).toBeInstanceOf(Date);
    });

    it('设置超出范围的权重时应该抛出错误', () => {
      expect(() => {
        keyResult.weight = -1;
      }).toThrow('权重必须在 0-10 之间');

      expect(() => {
        keyResult.weight = 11;
      }).toThrow('权重必须在 0-10 之间');
    });
  });

  describe('进度计算', () => {
    it('应该正确计算进度百分比', () => {
      // 起始值: 70, 目标值: 60, 当前值: 65
      // 进度: (65 - 70) / (60 - 70) = -5 / -10 = 0.5 = 50%
      expect(keyResult.progress).toBe(50);
    });

    it('当前值等于目标值时进度应该为 100%', () => {
      keyResult.currentValue = 70; // 等于目标值70
      expect(keyResult.progress).toBe(100);
    });

    it('当前值超过目标值时进度应该为 100%', () => {
      keyResult.currentValue = 75; // 超过目标值70
      expect(keyResult.progress).toBe(100);
    });

    it('当前值等于起始值时进度应该为 0%', () => {
      keyResult.currentValue = 60; // 等于起始值60
      expect(keyResult.progress).toBe(0);
    });

    it('目标值等于起始值时进度应该为 0%', () => {
      const kr = new KeyResult({
        name: '测试',
        startValue: 50,
        targetValue: 50,
        currentValue: 55,
        calculationMethod: 'sum',
        weight: 1,
      });
      expect(kr.progress).toBe(0);
    });

    it('应该正确计算加权进度', () => {
      // 进度: 50%, 权重: 5, 最大权重: 10
      // 加权进度: 50 * (5/10) = 25%
      expect(keyResult.weightedProgress).toBe(25);
    });
  });

  describe('完成状态', () => {
    it('当前值达到目标值时应该标记为已完成', () => {
      keyResult.currentValue = 70; // 达到目标值70
      expect(keyResult.isCompleted).toBe(true);
    });

    it('当前值超过目标值时应该标记为已完成', () => {
      keyResult.currentValue = 75; // 超过目标值70
      expect(keyResult.isCompleted).toBe(true);
    });

    it('当前值未达到目标值时应该标记为未完成', () => {
      keyResult.currentValue = 65; // 小于目标值70
      expect(keyResult.isCompleted).toBe(false);
    });

    it('达到目标值时状态应该自动更新为 completed', () => {
      expect(keyResult.lifecycle.status).toBe('active');
      keyResult.currentValue = 70; // 达到目标值
      expect(keyResult.lifecycle.status).toBe('completed');
    });

    it('从完成状态退回时状态应该自动更新为 active', () => {
      keyResult.currentValue = 70; // 完成
      expect(keyResult.lifecycle.status).toBe('completed');

      keyResult.currentValue = 65; // 退回
      expect(keyResult.lifecycle.status).toBe('active');
    });
  });

  describe('静态方法', () => {
    it('isKeyResult 应该正确识别 KeyResult 实例', () => {
      expect(KeyResult.isKeyResult(keyResult)).toBe(true);

      // 测试 DTO 对象
      const dto = keyResult.toDTO();
      expect(KeyResult.isKeyResult(dto)).toBe(true);

      expect(KeyResult.isKeyResult({})).toBe(false);
      expect(KeyResult.isKeyResult(null)).toBeFalsy();
      expect(KeyResult.isKeyResult(undefined)).toBeFalsy();
    });

    it('ensureKeyResult 应该正确处理各种输入', () => {
      expect(KeyResult.ensureKeyResult(keyResult)).toBe(keyResult);
      expect(KeyResult.ensureKeyResult(null)).toBe(null);

      const dto = keyResult.toDTO();
      const ensuredKr = KeyResult.ensureKeyResult(dto);
      expect(ensuredKr).toBeInstanceOf(KeyResult);
      expect(ensuredKr?.uuid).toBe(keyResult.uuid);
    });

    it('ensureKeyResultNeverNull 应该始终返回 KeyResult 实例', () => {
      expect(KeyResult.ensureKeyResultNeverNull(keyResult)).toBe(keyResult);

      const defaultKr = KeyResult.ensureKeyResultNeverNull(null);
      expect(defaultKr).toBeInstanceOf(KeyResult);
      expect(defaultKr.name).toBe('');
      expect(defaultKr.startValue).toBe(0);
      expect(defaultKr.targetValue).toBe(1);
    });

    it('forCreate 应该创建用于新建的关键结果实例', () => {
      const createKr = KeyResult.forCreate();

      expect(createKr.name).toBe('');
      expect(createKr.startValue).toBe(0);
      expect(createKr.targetValue).toBe(10);
      expect(createKr.currentValue).toBe(0);
      expect(createKr.calculationMethod).toBe('sum');
      expect(createKr.weight).toBe(4);
      expect(createKr.lifecycle.status).toBe('active');
    });
  });

  describe('数据转换', () => {
    it('应该能够转换为 DTO', () => {
      const dto = keyResult.toDTO();

      expect(dto).toHaveProperty('uuid');
      expect(dto).toHaveProperty('name');
      expect(dto).toHaveProperty('startValue');
      expect(dto).toHaveProperty('targetValue');
      expect(dto).toHaveProperty('currentValue');
      expect(dto).toHaveProperty('calculationMethod');
      expect(dto).toHaveProperty('weight');
      expect(dto).toHaveProperty('lifecycle');

      expect(dto.name).toBe(keyResult.name);
      expect(dto.uuid).toBe(keyResult.uuid);
      expect(dto.startValue).toBe(keyResult.startValue);
      expect(dto.targetValue).toBe(keyResult.targetValue);
      expect(dto.currentValue).toBe(keyResult.currentValue);
    });

    it('应该能够从 DTO 创建实例', () => {
      const dto = keyResult.toDTO();
      const newKr = KeyResult.fromDTO(dto);

      expect(newKr.uuid).toBe(keyResult.uuid);
      expect(newKr.name).toBe(keyResult.name);
      expect(newKr.startValue).toBe(keyResult.startValue);
      expect(newKr.targetValue).toBe(keyResult.targetValue);
      expect(newKr.currentValue).toBe(keyResult.currentValue);
      expect(newKr.calculationMethod).toBe(keyResult.calculationMethod);
      expect(newKr.weight).toBe(keyResult.weight);
      expect(newKr.lifecycle.status).toBe(keyResult.lifecycle.status);
    });

    it('应该能够处理无效日期的 DTO', () => {
      const dto = keyResult.toDTO();
      dto.lifecycle.createdAt = 'invalid-date' as any;
      dto.lifecycle.updatedAt = 'invalid-date' as any;

      const kr = KeyResult.fromDTO(dto);

      expect(kr.lifecycle.createdAt).toBeInstanceOf(Date);
      expect(kr.lifecycle.updatedAt).toBeInstanceOf(Date);
    });

    it('应该能够克隆关键结果', () => {
      const clonedKr = keyResult.clone();

      expect(clonedKr).not.toBe(keyResult);
      expect(clonedKr.uuid).toBe(keyResult.uuid);
      expect(clonedKr.name).toBe(keyResult.name);
      expect(clonedKr.startValue).toBe(keyResult.startValue);
      expect(clonedKr.targetValue).toBe(keyResult.targetValue);
      expect(clonedKr.currentValue).toBe(keyResult.currentValue);
    });
  });

  describe('边界情况测试', () => {
    it('应该处理极大的数值', () => {
      const kr = new KeyResult({
        name: '大数值测试',
        startValue: 0,
        targetValue: Number.MAX_SAFE_INTEGER,
        currentValue: Number.MAX_SAFE_INTEGER / 2,
        calculationMethod: 'sum',
        weight: 5,
      });

      expect(kr.progress).toBeCloseTo(50, 0);
    });

    it('应该处理小数', () => {
      const kr = new KeyResult({
        name: '小数测试',
        startValue: 0.5,
        targetValue: 1.5,
        currentValue: 1.0,
        calculationMethod: 'sum',
        weight: 5,
      });

      expect(kr.progress).toBe(50);
    });

    it('应该处理零权重', () => {
      keyResult.weight = 0;
      expect(keyResult.weight).toBe(0);
      expect(keyResult.weightedProgress).toBe(0);
    });

    it('应该处理最大权重', () => {
      keyResult.weight = 10;
      expect(keyResult.weight).toBe(10);
      expect(keyResult.weightedProgress).toBe(50); // progress * (10/10)
    });

    it('应该处理非常长的名称', () => {
      const longName = 'a'.repeat(1000);
      keyResult.name = longName;
      expect(keyResult.name).toBe(longName);
    });

    it('应该处理特殊字符', () => {
      const specialName = '关键结果!@#$%^&*()_+{}|:<>?[];\'",./~`';
      keyResult.name = specialName;
      expect(keyResult.name).toBe(specialName);
    });

    it('应该处理 Unicode 字符', () => {
      const unicodeName = '📊 数据指标 📈';
      keyResult.name = unicodeName;
      expect(keyResult.name).toBe(unicodeName);
    });
  });

  describe('计算方法测试', () => {
    it('应该支持所有计算方法', () => {
      const methods: Array<'sum' | 'average' | 'max' | 'min' | 'custom'> = [
        'sum',
        'average',
        'max',
        'min',
        'custom',
      ];

      methods.forEach((method) => {
        keyResult.calculationMethod = method;
        expect(keyResult.calculationMethod).toBe(method);
      });
    });
  });
});
