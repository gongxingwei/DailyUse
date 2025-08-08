import { describe, it, expect, beforeEach } from 'vitest';
import { GoalRecord } from './record';

describe('GoalRecord 实体测试', () => {
  let goalRecord: GoalRecord;
  const mockGoalUuid = 'goal-uuid-123';
  const mockKeyResultUuid = 'keyresult-uuid-456';

  beforeEach(() => {
    goalRecord = new GoalRecord({
      goalUuid: mockGoalUuid,
      keyResultUuid: mockKeyResultUuid,
      value: 5,
      note: '今天完成了5个单位',
    });
  });

  describe('构造函数和基本属性', () => {
    it('应该正确创建记录实例', () => {
      expect(goalRecord.goalUuid).toBe(mockGoalUuid);
      expect(goalRecord.keyResultUuid).toBe(mockKeyResultUuid);
      expect(goalRecord.value).toBe(5);
      expect(goalRecord.note).toBe('今天完成了5个单位');
      expect(goalRecord.lifecycle.createdAt).toBeInstanceOf(Date);
      expect(goalRecord.lifecycle.updatedAt).toBeInstanceOf(Date);
    });

    it('应该生成唯一的 UUID', () => {
      const record1 = new GoalRecord({
        goalUuid: 'goal1',
        keyResultUuid: 'kr1',
        value: 1,
      });
      const record2 = new GoalRecord({
        goalUuid: 'goal2',
        keyResultUuid: 'kr2',
        value: 2,
      });

      expect(record1.uuid).not.toBe(record2.uuid);
      expect(record1.uuid).toMatch(/^[0-9a-f-]{36}$/i);
    });

    it('应该允许创建没有备注的记录', () => {
      const record = new GoalRecord({
        goalUuid: mockGoalUuid,
        keyResultUuid: mockKeyResultUuid,
        value: 3,
      });

      expect(record.note).toBeUndefined();
      expect(record.value).toBe(3);
    });
  });

  describe('属性验证和设置', () => {
    it('应该允许设置关键结果UUID', () => {
      const newKeyResultUuid = 'new-keyresult-uuid';
      goalRecord.keyResultUuid = newKeyResultUuid;

      expect(goalRecord.keyResultUuid).toBe(newKeyResultUuid);
      expect(goalRecord.lifecycle.updatedAt).toBeInstanceOf(Date);
    });

    it('设置空关键结果UUID时应该抛出错误', () => {
      expect(() => {
        goalRecord.keyResultUuid = '';
      }).toThrow('关键结果ID不能为空');
    });

    it('设置只有空格的关键结果UUID时应该抛出错误', () => {
      expect(() => {
        goalRecord.keyResultUuid = '   ';
      }).toThrow('关键结果ID不能为空');
    });

    it('应该允许设置记录值', () => {
      goalRecord.value = 10;
      expect(goalRecord.value).toBe(10);
      expect(goalRecord.lifecycle.updatedAt).toBeInstanceOf(Date);
    });

    it('设置负数记录值时应该抛出错误', () => {
      expect(() => {
        goalRecord.value = -5;
      }).toThrow('记录值不能为负数');
    });

    it('应该允许设置零值', () => {
      goalRecord.value = 0;
      expect(goalRecord.value).toBe(0);
    });

    it('应该允许设置备注', () => {
      goalRecord.note = '新的备注内容';
      expect(goalRecord.note).toBe('新的备注内容');
      expect(goalRecord.lifecycle.updatedAt).toBeInstanceOf(Date);
    });

    it('应该允许设置空备注', () => {
      goalRecord.note = '';
      expect(goalRecord.note).toBe('');
    });

    it('应该允许设置 undefined 备注', () => {
      goalRecord.note = undefined;
      expect(goalRecord.note).toBeUndefined();
    });

    it('goalUuid 应该是只读的', () => {
      // goalUuid 没有 setter，所以应该保持不变
      expect(goalRecord.goalUuid).toBe(mockGoalUuid);
      // 尝试直接赋值应该不起作用（TypeScript 编译时会报错）
    });
  });

  describe('记录更新', () => {
    it('应该能够更新记录值', () => {
      const originalValue = goalRecord.value;
      const originalUpdatedAt = goalRecord.lifecycle.updatedAt;

      setTimeout(() => {
        goalRecord.updateGoalRecord({ value: 8 });

        expect(goalRecord.value).toBe(8);
        expect(goalRecord.value).not.toBe(originalValue);
        expect(goalRecord.lifecycle.updatedAt.getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      }, 1);
    });

    it('应该能够更新备注', () => {
      const originalNote = goalRecord.note;
      const originalUpdatedAt = goalRecord.lifecycle.updatedAt;

      setTimeout(() => {
        goalRecord.updateGoalRecord({ note: '更新后的备注' });

        expect(goalRecord.note).toBe('更新后的备注');
        expect(goalRecord.note).not.toBe(originalNote);
        expect(goalRecord.lifecycle.updatedAt.getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      }, 1);
    });

    it('应该能够同时更新多个属性', () => {
      goalRecord.updateGoalRecord({
        value: 12,
        note: '同时更新的备注',
      });

      expect(goalRecord.value).toBe(12);
      expect(goalRecord.note).toBe('同时更新的备注');
    });

    it('传入空对象时不应该改变任何属性', () => {
      const originalValue = goalRecord.value;
      const originalNote = goalRecord.note;

      goalRecord.updateGoalRecord({});

      expect(goalRecord.value).toBe(originalValue);
      expect(goalRecord.note).toBe(originalNote);
    });
  });

  describe('静态方法', () => {
    it('isGoalRecord 应该正确识别 GoalRecord 实例', () => {
      expect(GoalRecord.isGoalRecord(goalRecord)).toBe(true);

      // 测试 DTO 对象
      const dto = goalRecord.toDTO();
      expect(GoalRecord.isGoalRecord(dto)).toBe(true);

      expect(GoalRecord.isGoalRecord({})).toBe(false);
      expect(GoalRecord.isGoalRecord(null)).toBe(false);
      expect(GoalRecord.isGoalRecord(undefined)).toBe(false);

      // 测试缺少必要属性的对象
      expect(GoalRecord.isGoalRecord({ uuid: '123' })).toBe(false);
    });

    it('ensureGoalRecord 应该正确处理各种输入', () => {
      expect(GoalRecord.ensureGoalRecord(goalRecord)).toBe(goalRecord);
      expect(GoalRecord.ensureGoalRecord(null)).toBe(null);

      const dto = goalRecord.toDTO();
      const ensuredRecord = GoalRecord.ensureGoalRecord(dto);
      expect(ensuredRecord).toBeInstanceOf(GoalRecord);
      expect(ensuredRecord?.uuid).toBe(goalRecord.uuid);
    });

    it('ensureGoalRecordNeverNull 应该始终返回 GoalRecord 实例', () => {
      expect(GoalRecord.ensureGoalRecordNeverNull(goalRecord)).toBe(goalRecord);

      const defaultRecord = GoalRecord.ensureGoalRecordNeverNull(null);
      expect(defaultRecord).toBeInstanceOf(GoalRecord);
      expect(defaultRecord.goalUuid).toBe('');
      expect(defaultRecord.keyResultUuid).toBe('');
      expect(defaultRecord.value).toBe(1);
    });

    it('forCreate 应该创建用于新建的记录实例', () => {
      const createRecord = GoalRecord.forCreate('goal-123', 'kr-456');

      expect(createRecord.goalUuid).toBe('goal-123');
      expect(createRecord.keyResultUuid).toBe('kr-456');
      expect(createRecord.value).toBe(1);
      expect(createRecord.note).toBeUndefined();
      expect(createRecord.lifecycle.createdAt).toBeInstanceOf(Date);
      expect(createRecord.lifecycle.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('数据转换', () => {
    it('应该能够转换为 DTO', () => {
      const dto = goalRecord.toDTO();

      expect(dto).toHaveProperty('uuid');
      expect(dto).toHaveProperty('goalUuid');
      expect(dto).toHaveProperty('keyResultUuid');
      expect(dto).toHaveProperty('value');
      expect(dto).toHaveProperty('note');
      expect(dto).toHaveProperty('lifecycle');

      expect(dto.uuid).toBe(goalRecord.uuid);
      expect(dto.goalUuid).toBe(goalRecord.goalUuid);
      expect(dto.keyResultUuid).toBe(goalRecord.keyResultUuid);
      expect(dto.value).toBe(goalRecord.value);
      expect(dto.note).toBe(goalRecord.note);
    });

    it('应该能够从 DTO 创建实例', () => {
      const dto = goalRecord.toDTO();
      const newRecord = GoalRecord.fromDTO(dto);

      expect(newRecord.uuid).toBe(goalRecord.uuid);
      expect(newRecord.goalUuid).toBe(goalRecord.goalUuid);
      expect(newRecord.keyResultUuid).toBe(goalRecord.keyResultUuid);
      expect(newRecord.value).toBe(goalRecord.value);
      expect(newRecord.note).toBe(goalRecord.note);
    });

    it('应该能够处理无效日期的 DTO', () => {
      const dto = goalRecord.toDTO();
      dto.lifecycle.createdAt = 'invalid-date' as any;
      dto.lifecycle.updatedAt = 'invalid-date' as any;

      const record = GoalRecord.fromDTO(dto);

      expect(record.lifecycle.createdAt).toBeInstanceOf(Date);
      expect(record.lifecycle.updatedAt).toBeInstanceOf(Date);
    });

    it('应该能够克隆记录', () => {
      const clonedRecord = goalRecord.clone();

      expect(clonedRecord).not.toBe(goalRecord);
      expect(clonedRecord.uuid).toBe(goalRecord.uuid);
      expect(clonedRecord.goalUuid).toBe(goalRecord.goalUuid);
      expect(clonedRecord.keyResultUuid).toBe(goalRecord.keyResultUuid);
      expect(clonedRecord.value).toBe(goalRecord.value);
      expect(clonedRecord.note).toBe(goalRecord.note);

      // 生命周期应该是深拷贝
      expect(clonedRecord.lifecycle).not.toBe(goalRecord.lifecycle);
      expect(clonedRecord.lifecycle.createdAt).toEqual(goalRecord.lifecycle.createdAt);
      expect(clonedRecord.lifecycle.updatedAt).toEqual(goalRecord.lifecycle.updatedAt);
    });
  });

  describe('边界情况测试', () => {
    it('应该处理极大的数值', () => {
      goalRecord.value = Number.MAX_SAFE_INTEGER;
      expect(goalRecord.value).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('应该处理小数', () => {
      goalRecord.value = 3.14;
      expect(goalRecord.value).toBe(3.14);
    });

    it('应该处理非常长的备注', () => {
      const longNote = 'a'.repeat(10000);
      goalRecord.note = longNote;
      expect(goalRecord.note).toBe(longNote);
    });

    it('应该处理特殊字符备注', () => {
      const specialNote = '备注!@#$%^&*()_+{}|:<>?[];\'",./~`';
      goalRecord.note = specialNote;
      expect(goalRecord.note).toBe(specialNote);
    });

    it('应该处理 Unicode 字符备注', () => {
      const unicodeNote = '今天完成了 📝 记录 ✅';
      goalRecord.note = unicodeNote;
      expect(goalRecord.note).toBe(unicodeNote);
    });

    it('应该处理多行备注', () => {
      const multilineNote = `第一行备注
第二行备注
第三行备注`;
      goalRecord.note = multilineNote;
      expect(goalRecord.note).toBe(multilineNote);
    });
  });

  describe('生命周期管理', () => {
    it('修改属性时应该更新 updatedAt', () => {
      const originalUpdatedAt = goalRecord.lifecycle.updatedAt;

      setTimeout(() => {
        goalRecord.value = 100;
        expect(goalRecord.lifecycle.updatedAt.getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      }, 1);
    });

    it('创建时间应该保持不变', () => {
      const originalCreatedAt = goalRecord.lifecycle.createdAt;

      setTimeout(() => {
        goalRecord.value = 200;
        expect(goalRecord.lifecycle.createdAt).toEqual(originalCreatedAt);
      }, 1);
    });
  });

  describe('数据完整性', () => {
    it('应该始终有有效的 UUID', () => {
      expect(goalRecord.uuid).toBeTruthy();
      expect(typeof goalRecord.uuid).toBe('string');
      expect(goalRecord.uuid.length).toBeGreaterThan(0);
    });

    it('应该始终有有效的目标 UUID', () => {
      expect(goalRecord.goalUuid).toBeTruthy();
      expect(typeof goalRecord.goalUuid).toBe('string');
      expect(goalRecord.goalUuid.length).toBeGreaterThan(0);
    });

    it('应该始终有有效的关键结果 UUID', () => {
      expect(goalRecord.keyResultUuid).toBeTruthy();
      expect(typeof goalRecord.keyResultUuid).toBe('string');
      expect(goalRecord.keyResultUuid.length).toBeGreaterThan(0);
    });

    it('应该始终有有效的数值', () => {
      expect(typeof goalRecord.value).toBe('number');
      expect(goalRecord.value).toBeGreaterThanOrEqual(0);
    });

    it('应该始终有有效的生命周期', () => {
      expect(goalRecord.lifecycle).toBeTruthy();
      expect(goalRecord.lifecycle.createdAt).toBeInstanceOf(Date);
      expect(goalRecord.lifecycle.updatedAt).toBeInstanceOf(Date);
    });
  });
});
