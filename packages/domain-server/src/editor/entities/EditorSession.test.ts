/**
 * EditorSession 实体测试
 * 测试 EditorSession 的业务逻辑和行为
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EditorSession } from './EditorSession';
import { EditorGroup } from './EditorGroup';

describe('EditorSession 实体', () => {
  let session: EditorSession;
  const workspaceUuid = 'test-workspace-uuid';
  const accountUuid = 'test-account-uuid';

  beforeEach(() => {
    session = EditorSession.create({
      workspaceUuid,
      accountUuid,
      name: 'Test Session',
      description: 'A test session',
    });
  });

  describe('工厂方法', () => {
    it('应该通过 create 方法创建新会话', () => {
      expect(session).toBeDefined();
      expect(session.uuid).toBeDefined();
      expect(session.name).toBe('Test Session');
      expect(session.description).toBe('A test session');
      expect(session.workspaceUuid).toBe(workspaceUuid);
      expect(session.accountUuid).toBe(accountUuid);
      expect(session.isActive).toBe(false);
      expect(session.groups).toHaveLength(0);
    });

    it('应该使用默认布局', () => {
      const layout = session.layout;
      expect(layout).toBeDefined();
    });

    it('应该创建时间戳', () => {
      expect(session.createdAt).toBeGreaterThan(0);
      expect(session.updatedAt).toBeGreaterThan(0);
      expect(session.createdAt).toBe(session.updatedAt);
    });
  });

  describe('激活和停用', () => {
    it('应该能够激活会话', () => {
      const beforeUpdated = session.updatedAt;
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      session.activate();

      expect(session.isActive).toBe(true);
      expect(session.lastAccessedAt).toBeGreaterThan(0);
      expect(session.updatedAt).toBeGreaterThan(beforeUpdated);

      vi.useRealTimers();
    });

    it('应该能够停用会话', () => {
      session.activate();
      expect(session.isActive).toBe(true);

      const beforeUpdated = session.updatedAt;
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      session.deactivate();

      expect(session.isActive).toBe(false);
      expect(session.updatedAt).toBeGreaterThan(beforeUpdated);

      vi.useRealTimers();
    });
  });

  describe('更新会话', () => {
    it('应该能够更新名称', () => {
      const beforeUpdated = session.updatedAt;
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      session.update({ name: 'Updated Session' });

      expect(session.name).toBe('Updated Session');
      expect(session.updatedAt).toBeGreaterThan(beforeUpdated);

      vi.useRealTimers();
    });

    it('应该能够更新描述', () => {
      session.update({ description: 'Updated description' });

      expect(session.description).toBe('Updated description');
    });

    it('应该能够清空描述', () => {
      session.update({ description: null });

      expect(session.description).toBeNull();
    });
  });

  describe('布局管理', () => {
    it('应该能够更新布局', () => {
      const beforeUpdated = session.updatedAt;
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      session.updateLayout({
        splitType: 'horizontal',
      });

      expect(session.layout.splitType).toBe('horizontal');
      expect(session.updatedAt).toBeGreaterThan(beforeUpdated);

      vi.useRealTimers();
    });
  });

  describe('分组管理', () => {
    it('应该能够添加分组', () => {
      const group = session.addGroup({
        groupIndex: 0,
        name: 'Group 1',
      });

      expect(group).toBeDefined();
      expect(group.name).toBe('Group 1');
      expect(group.groupIndex).toBe(0);
      expect(group.sessionUuid).toBe(session.uuid);
      expect(session.groups).toHaveLength(1);
    });

    it('应该能够添加多个分组', () => {
      session.addGroup({ groupIndex: 0, name: 'Group 1' });
      session.addGroup({ groupIndex: 1, name: 'Group 2' });
      session.addGroup({ groupIndex: 2, name: 'Group 3' });

      expect(session.groups).toHaveLength(3);
    });

    it('应该能够获取指定分组', () => {
      const group = session.addGroup({ groupIndex: 0, name: 'Test Group' });
      const retrieved = session.getGroup(group.uuid);

      expect(retrieved).toBeDefined();
      expect(retrieved?.uuid).toBe(group.uuid);
    });

    it('获取不存在的分组应返回 undefined', () => {
      const retrieved = session.getGroup('non-existent-uuid');

      expect(retrieved).toBeUndefined();
    });

    it('应该能够移除分组', () => {
      const group = session.addGroup({ groupIndex: 0, name: 'Group to Remove' });
      expect(session.groups).toHaveLength(1);

      session.removeGroup(group.uuid);

      expect(session.groups).toHaveLength(0);
    });

    it('应该能够设置活动分组', () => {
      session.addGroup({ groupIndex: 0 });
      session.addGroup({ groupIndex: 1 });
      session.addGroup({ groupIndex: 2 });

      session.setActiveGroup(1);

      expect(session.activeGroupIndex).toBe(1);
    });

    it('设置无效的活动分组索引应被忽略', () => {
      session.addGroup({ groupIndex: 0 });
      const beforeIndex = session.activeGroupIndex;

      session.setActiveGroup(10); // 超出范围

      expect(session.activeGroupIndex).toBe(beforeIndex);
    });

    it('移除分组后应调整活动分组索引', () => {
      const group1 = session.addGroup({ groupIndex: 0 });
      session.addGroup({ groupIndex: 1 });
      session.addGroup({ groupIndex: 2 });

      session.setActiveGroup(2); // 设置为最后一个
      expect(session.activeGroupIndex).toBe(2);

      session.removeGroup(group1.uuid);

      // 活动索引应该调整
      expect(session.activeGroupIndex).toBe(1); // 因为移除了第一个，现在只有2个分组
    });
  });

  describe('访问时间记录', () => {
    it('应该能够更新最后访问时间', () => {
      const beforeAccess = session.lastAccessedAt;
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      session.updateLastAccessedAt();

      expect(session.lastAccessedAt).toBeGreaterThan(beforeAccess ?? 0);

      vi.useRealTimers();
    });
  });

  describe('DTO 转换', () => {
    it('应该能够转换为 Server DTO', () => {
      const group = session.addGroup({ groupIndex: 0, name: 'Test Group' });

      const dto = session.toServerDTO();

      expect(dto.uuid).toBe(session.uuid);
      expect(dto.name).toBe(session.name);
      expect(dto.workspaceUuid).toBe(workspaceUuid);
      expect(dto.groups).toHaveLength(1);
      expect(dto.groups[0].name).toBe('Test Group');
    });

    it('应该能够转换为 Client DTO', () => {
      const dto = session.toClientDTO();

      expect(dto.uuid).toBe(session.uuid);
      expect(dto.name).toBe(session.name);
      expect(dto.groupCount).toBe(0);
    });

    it('应该能够转换为 Persistence DTO', () => {
      const dto = session.toPersistenceDTO();

      expect(dto.uuid).toBe(session.uuid);
      expect(dto.workspace_uuid).toBe(workspaceUuid);
      expect(dto.account_uuid).toBe(accountUuid);
      expect(dto.name).toBe(session.name);
    });

    it('应该能够从 Server DTO 重建（递归重建子实体）', () => {
      session.addGroup({ groupIndex: 0, name: 'Group 1' });
      session.addGroup({ groupIndex: 1, name: 'Group 2' });

      const dto = session.toServerDTO();
      const rebuilt = EditorSession.fromServerDTO(dto);

      expect(rebuilt.uuid).toBe(session.uuid);
      expect(rebuilt.name).toBe(session.name);
      expect(rebuilt.groups).toHaveLength(2);
      expect(rebuilt.groups[0].name).toBe('Group 1');
      expect(rebuilt.groups[1].name).toBe('Group 2');
    });

    it('应该能够从 Persistence DTO 重建', () => {
      const persistenceDto = session.toPersistenceDTO();
      const rebuilt = EditorSession.fromPersistenceDTO(persistenceDto);

      expect(rebuilt.uuid).toBe(session.uuid);
      expect(rebuilt.name).toBe(session.name);
      expect(rebuilt.workspaceUuid).toBe(workspaceUuid);
    });
  });

  describe('业务规则验证', () => {
    it('groups 属性应返回副本以防止外部修改', () => {
      session.addGroup({ groupIndex: 0 });
      const groups = session.groups;

      groups.push(null as any); // 尝试修改副本

      // 原始 groups 不应被修改
      expect(session.groups).toHaveLength(1);
    });

    it('getAllGroups 应返回所有分组', () => {
      session.addGroup({ groupIndex: 0 });
      session.addGroup({ groupIndex: 1 });

      const allGroups = session.getAllGroups();

      expect(allGroups).toHaveLength(2);
    });
  });
});
