/**
 * SyncStatus 值对象测试
 */

import { describe, it, expect } from 'vitest';
import { SyncStatus } from './SyncStatus';

describe('SyncStatus Value Object', () => {
  describe('工厂方法', () => {
    it('应该创建初始状态', () => {
      const status = SyncStatus.createInitial();

      expect(status.isSyncing).toBe(false);
      expect(status.lastSyncAt).toBeNull();
      expect(status.syncError).toBeNull();
      expect(status.pendingSyncCount).toBe(0);
      expect(status.conflictCount).toBe(0);
    });

    it('应该创建同步中状态', () => {
      const status = SyncStatus.createSyncing();

      expect(status.isSyncing).toBe(true);
      expect(status.lastSyncAt).toBeNull();
      expect(status.syncError).toBeNull();
      expect(status.pendingSyncCount).toBe(0);
      expect(status.conflictCount).toBe(0);
    });

    it('应该创建同步成功状态', () => {
      const beforeSync = Date.now();
      const status = SyncStatus.createSynced();
      const afterSync = Date.now();

      expect(status.isSyncing).toBe(false);
      expect(status.lastSyncAt).toBeGreaterThanOrEqual(beforeSync);
      expect(status.lastSyncAt).toBeLessThanOrEqual(afterSync);
      expect(status.syncError).toBeNull();
      expect(status.pendingSyncCount).toBe(0);
      expect(status.conflictCount).toBe(0);
    });

    it('应该创建同步失败状态', () => {
      const errorMessage = 'Network connection failed';
      const status = SyncStatus.createSyncFailed(errorMessage);

      expect(status.isSyncing).toBe(false);
      expect(status.lastSyncAt).not.toBeNull();
      expect(status.syncError).toBe(errorMessage);
      expect(status.pendingSyncCount).toBe(0);
      expect(status.conflictCount).toBe(0);
    });
  });

  describe('不可变性', () => {
    it('应该是冻结的（不可变）', () => {
      const status = SyncStatus.createInitial();

      expect(Object.isFrozen(status)).toBe(true);
    });

    it('不应该允许修改属性', () => {
      const status = SyncStatus.createInitial();

      expect(() => {
        (status as any).isSyncing = true;
      }).toThrow();
    });
  });

  describe('with() 方法 - 创建修改后的副本', () => {
    it('应该创建新实例而不修改原实例', () => {
      const original = SyncStatus.createInitial();
      const modified = original.with({ pendingSyncCount: 5 });

      expect(original.pendingSyncCount).toBe(0);
      expect(modified.pendingSyncCount).toBe(5);
      expect(original).not.toBe(modified);
    });

    it('应该只修改指定的字段', () => {
      const original = SyncStatus.createSynced();
      const modified = original.with({
        pendingSyncCount: 3,
        conflictCount: 2,
      });

      expect(modified.pendingSyncCount).toBe(3);
      expect(modified.conflictCount).toBe(2);
      expect(modified.isSyncing).toBe(original.isSyncing);
      expect(modified.lastSyncAt).toBe(original.lastSyncAt);
      expect(modified.syncError).toBe(original.syncError);
    });

    it('应该支持链式修改', () => {
      const status = SyncStatus.createInitial()
        .with({ isSyncing: true })
        .with({ pendingSyncCount: 5 })
        .with({ conflictCount: 1 });

      expect(status.isSyncing).toBe(true);
      expect(status.pendingSyncCount).toBe(5);
      expect(status.conflictCount).toBe(1);
    });
  });

  describe('equals() 方法', () => {
    it('相同内容的状态应该相等', () => {
      const status1 = new SyncStatus({
        isSyncing: true,
        lastSyncAt: 1234567890,
        syncError: null,
        pendingSyncCount: 5,
        conflictCount: 2,
      });

      const status2 = new SyncStatus({
        isSyncing: true,
        lastSyncAt: 1234567890,
        syncError: null,
        pendingSyncCount: 5,
        conflictCount: 2,
      });

      expect(status1.equals(status2)).toBe(true);
      expect(status2.equals(status1)).toBe(true);
    });

    it('不同内容的状态应该不相等', () => {
      const status1 = SyncStatus.createInitial();
      const status2 = status1.with({ isSyncing: true });

      expect(status1.equals(status2)).toBe(false);
      expect(status2.equals(status1)).toBe(false);
    });

    it('与非 SyncStatus 对象比较应该返回 false', () => {
      const status = SyncStatus.createInitial();
      const other = { isSyncing: false } as any;

      expect(status.equals(other)).toBe(false);
    });
  });

  describe('业务查询方法', () => {
    describe('hasPendingItems()', () => {
      it('当有待同步项时应该返回 true', () => {
        const status = SyncStatus.createInitial().with({ pendingSyncCount: 5 });
        expect(status.hasPendingItems()).toBe(true);
      });

      it('当有冲突项时应该返回 true', () => {
        const status = SyncStatus.createInitial().with({ conflictCount: 2 });
        expect(status.hasPendingItems()).toBe(true);
      });

      it('当没有待处理项时应该返回 false', () => {
        const status = SyncStatus.createInitial();
        expect(status.hasPendingItems()).toBe(false);
      });
    });

    describe('hasSyncError()', () => {
      it('当有同步错误时应该返回 true', () => {
        const status = SyncStatus.createSyncFailed('Error');
        expect(status.hasSyncError()).toBe(true);
      });

      it('当没有同步错误时应该返回 false', () => {
        const status = SyncStatus.createSynced();
        expect(status.hasSyncError()).toBe(false);
      });
    });

    describe('needsSync()', () => {
      it('当有待同步项且未在同步中时应该返回 true', () => {
        const status = SyncStatus.createInitial().with({ pendingSyncCount: 3 });
        expect(status.needsSync()).toBe(true);
      });

      it('当正在同步时应该返回 false', () => {
        const status = SyncStatus.createSyncing().with({ pendingSyncCount: 3 });
        expect(status.needsSync()).toBe(false);
      });

      it('当没有待同步项时应该返回 false', () => {
        const status = SyncStatus.createInitial();
        expect(status.needsSync()).toBe(false);
      });
    });

    describe('hasConflicts()', () => {
      it('当有冲突时应该返回 true', () => {
        const status = SyncStatus.createInitial().with({ conflictCount: 1 });
        expect(status.hasConflicts()).toBe(true);
      });

      it('当没有冲突时应该返回 false', () => {
        const status = SyncStatus.createInitial();
        expect(status.hasConflicts()).toBe(false);
      });
    });
  });

  describe('toContract() 和 fromContract()', () => {
    it('应该正确转换为 DTO', () => {
      const status = new SyncStatus({
        isSyncing: true,
        lastSyncAt: 1234567890,
        syncError: 'Network error',
        pendingSyncCount: 5,
        conflictCount: 2,
      });

      const dto = status.toContract();

      expect(dto.isSyncing).toBe(true);
      expect(dto.lastSyncAt).toBe(1234567890);
      expect(dto.syncError).toBe('Network error');
      expect(dto.pendingSyncCount).toBe(5);
      expect(dto.conflictCount).toBe(2);
    });

    it('应该从 DTO 正确创建对象', () => {
      const dto = {
        isSyncing: false,
        lastSyncAt: 9876543210,
        syncError: null,
        pendingSyncCount: 0,
        conflictCount: 0,
      };

      const status = SyncStatus.fromContract(dto);

      expect(status.isSyncing).toBe(false);
      expect(status.lastSyncAt).toBe(9876543210);
      expect(status.syncError).toBeNull();
      expect(status.pendingSyncCount).toBe(0);
      expect(status.conflictCount).toBe(0);
    });

    it('应该支持往返转换（roundtrip）', () => {
      const original = new SyncStatus({
        isSyncing: true,
        lastSyncAt: 1234567890,
        syncError: 'Test error',
        pendingSyncCount: 3,
        conflictCount: 1,
      });

      const dto = original.toContract();
      const restored = SyncStatus.fromContract(dto);

      expect(original.equals(restored)).toBe(true);
    });
  });

  describe('状态转换场景', () => {
    it('应该正确模拟完整的同步流程', () => {
      // 1. 初始状态
      let status = SyncStatus.createInitial();
      expect(status.isSyncing).toBe(false);
      expect(status.needsSync()).toBe(false);

      // 2. 有待同步的变更
      status = status.with({ pendingSyncCount: 5 });
      expect(status.needsSync()).toBe(true);

      // 3. 开始同步
      status = status.with({ isSyncing: true });
      expect(status.isSyncing).toBe(true);
      expect(status.needsSync()).toBe(false); // 正在同步，不需要再次同步

      // 4. 同步完成
      status = status.with({
        isSyncing: false,
        lastSyncAt: Date.now(),
        pendingSyncCount: 0,
      });
      expect(status.isSyncing).toBe(false);
      expect(status.needsSync()).toBe(false);
      expect(status.lastSyncAt).not.toBeNull();
    });

    it('应该正确处理同步失败场景', () => {
      // 1. 开始同步
      let status = SyncStatus.createSyncing();
      expect(status.isSyncing).toBe(true);

      // 2. 同步失败
      status = SyncStatus.createSyncFailed('Connection timeout');
      expect(status.isSyncing).toBe(false);
      expect(status.hasSyncError()).toBe(true);
      expect(status.syncError).toBe('Connection timeout');
    });
  });
});
