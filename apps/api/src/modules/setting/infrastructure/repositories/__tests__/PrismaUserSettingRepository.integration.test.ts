/**
 * PrismaUserSettingRepository Integration Tests
 * 用户设置仓储集成测试
 *
 * 测试场景：
 * 1. CRUD 基本操作（创建、读取、更新、删除）
 * 2. JSON 字段序列化/反序列化（appearance, locale, workflow, shortcuts, privacy, experimental）
 * 3. 查询操作（根据 UUID、accountUuid 查找）
 * 4. 唯一性约束（accountUuid unique）
 * 5. 批量保存操作
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaUserSettingRepository } from '../PrismaUserSettingRepository';
import { UserSettingServer } from '@dailyuse/domain-server';
import { mockPrismaClient, resetMockData } from '../../../../../test/mocks/prismaMock';
import { SettingContracts } from '@dailyuse/contracts';

describe('PrismaUserSettingRepository Integration Tests', () => {
  let repository: PrismaUserSettingRepository;

  beforeEach(() => {
    // Reset mock data before each test
    resetMockData();

    // Create repository instance with mock Prisma client
    repository = new PrismaUserSettingRepository(mockPrismaClient as any);
  });

  describe('创建和保存操作', () => {
    it('应该成功创建用户设置（使用默认值）', async () => {
      const accountUuid = 'test-account-save-1';

      // Create entity with defaults
      const entity = UserSettingServer.create({
        accountUuid,
      });

      // Save to database
      await repository.save(entity);

      // Verify save was called
      const savedData = await repository.findByAccountUuid(accountUuid);
      expect(savedData).toBeDefined();
      expect(savedData!.accountUuid).toBe(accountUuid);

      // Verify default values
      expect(savedData!.appearance.theme).toBe(SettingContracts.ThemeMode.AUTO);
      expect(savedData!.locale.language).toBe('zh-CN');
      expect(savedData!.locale.timezone).toBe('Asia/Shanghai');
      expect(savedData!.workflow.autoSave).toBe(true);
      expect(savedData!.shortcuts.enabled).toBe(true);
      expect(savedData!.privacy.profileVisibility).toBe(
        SettingContracts.ProfileVisibility.PRIVATE, // 默认值是 PRIVATE
      );
      expect(savedData!.experimental.enabled).toBe(false);
    });

    it('应该成功创建用户设置（自定义值）', async () => {
      const accountUuid = 'test-account-save-2';

      // Create entity with custom values
      const entity = UserSettingServer.create({
        accountUuid,
        appearance: {
          theme: SettingContracts.ThemeMode.DARK,
          accentColor: '#FF5733',
          fontSize: SettingContracts.FontSize.LARGE,
          fontFamily: 'Roboto',
          compactMode: true,
        },
        locale: {
          language: 'en-US',
          timezone: 'America/New_York',
          dateFormat: SettingContracts.DateFormat.MM_DD_YYYY,
          timeFormat: SettingContracts.TimeFormat.H12,
          weekStartsOn: 0, // Sunday
          currency: 'USD',
        },
        workflow: {
          defaultTaskView: SettingContracts.TaskViewType.KANBAN,
          defaultGoalView: SettingContracts.GoalViewType.TREE,
          defaultScheduleView: SettingContracts.ScheduleViewType.MONTH,
          autoSave: false,
          autoSaveInterval: 60000,
          confirmBeforeDelete: true,
        },
      });

      // Save
      await repository.save(entity);

      // Retrieve and verify
      const savedData = await repository.findByAccountUuid(accountUuid);
      expect(savedData).toBeDefined();
      expect(savedData!.appearance.theme).toBe(SettingContracts.ThemeMode.DARK);
      expect(savedData!.appearance.accentColor).toBe('#FF5733');
      expect(savedData!.appearance.fontSize).toBe(SettingContracts.FontSize.LARGE);
      expect(savedData!.appearance.fontFamily).toBe('Roboto');
      expect(savedData!.appearance.compactMode).toBe(true);
      expect(savedData!.locale.language).toBe('en-US');
      expect(savedData!.locale.timezone).toBe('America/New_York');
      expect(savedData!.workflow.defaultTaskView).toBe(SettingContracts.TaskViewType.KANBAN);
    });

    it('应该支持更新操作（upsert）', async () => {
      const accountUuid = 'test-account-update-1';

      // 1. Create initial entity
      const entity1 = UserSettingServer.create({
        accountUuid,
        appearance: {
          theme: SettingContracts.ThemeMode.LIGHT,
          accentColor: '#1976d2',
          fontSize: SettingContracts.FontSize.MEDIUM,
          fontFamily: null,
          compactMode: false,
        },
      });
      await repository.save(entity1);

      // 2. Retrieve and modify
      const retrieved = await repository.findByAccountUuid(accountUuid);
      expect(retrieved).toBeDefined();

      retrieved!.updateTheme(SettingContracts.ThemeMode.DARK);

      // 3. Save again (should update)
      await repository.save(retrieved!);

      // 4. Verify update
      const updated = await repository.findByAccountUuid(accountUuid);
      expect(updated!.appearance.theme).toBe(SettingContracts.ThemeMode.DARK);
      expect(updated!.uuid).toBe(entity1.uuid); // UUID should remain the same
    });
  });

  describe('查询操作', () => {
    it('应该根据 UUID 查找用户设置', async () => {
      const accountUuid = 'test-account-findbyid-1';
      const entity = UserSettingServer.create({ accountUuid });
      await repository.save(entity);

      const found = await repository.findById(entity.uuid);

      expect(found).toBeDefined();
      expect(found!.uuid).toBe(entity.uuid);
      expect(found!.accountUuid).toBe(accountUuid);
    });

    it('应该根据 accountUuid 查找用户设置', async () => {
      const accountUuid = 'test-account-findbyaccount-1';
      const entity = UserSettingServer.create({ accountUuid });
      await repository.save(entity);

      const found = await repository.findByAccountUuid(accountUuid);

      expect(found).toBeDefined();
      expect(found!.accountUuid).toBe(accountUuid);
    });

    it('应该在未找到时返回 null', async () => {
      const notFound1 = await repository.findById('non-existent-uuid');
      const notFound2 = await repository.findByAccountUuid('non-existent-account');

      expect(notFound1).toBeNull();
      expect(notFound2).toBeNull();
    });

    it('应该查找所有用户设置', async () => {
      // Create multiple entities
      const entity1 = UserSettingServer.create({ accountUuid: 'account-findall-1' });
      const entity2 = UserSettingServer.create({ accountUuid: 'account-findall-2' });
      const entity3 = UserSettingServer.create({ accountUuid: 'account-findall-3' });

      await repository.save(entity1);
      await repository.save(entity2);
      await repository.save(entity3);

      const all = await repository.findAll();

      expect(all.length).toBeGreaterThanOrEqual(3);
      const accountUuids = all.map((item) => item.accountUuid);
      expect(accountUuids).toContain('account-findall-1');
      expect(accountUuids).toContain('account-findall-2');
      expect(accountUuids).toContain('account-findall-3');
    });

    it('应该检查用户设置是否存在（根据 UUID）', async () => {
      const entity = UserSettingServer.create({ accountUuid: 'account-exists-1' });
      await repository.save(entity);

      const exists = await repository.exists(entity.uuid);
      const notExists = await repository.exists('non-existent-uuid');

      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });

    it('应该检查用户设置是否存在（根据 accountUuid）', async () => {
      const accountUuid = 'account-exists-by-account-1';
      const entity = UserSettingServer.create({ accountUuid });
      await repository.save(entity);

      const exists = await repository.existsByAccountUuid(accountUuid);
      const notExists = await repository.existsByAccountUuid('non-existent-account');

      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });
  });

  describe('删除操作', () => {
    it('应该成功删除用户设置', async () => {
      const accountUuid = 'test-account-delete-1';
      const entity = UserSettingServer.create({ accountUuid });
      await repository.save(entity);

      // Verify exists
      const existsBefore = await repository.exists(entity.uuid);
      expect(existsBefore).toBe(true);

      // Delete
      await repository.delete(entity.uuid);

      // Verify deleted
      const existsAfter = await repository.exists(entity.uuid);
      expect(existsAfter).toBe(false);

      const notFound = await repository.findById(entity.uuid);
      expect(notFound).toBeNull();
    });
  });

  describe('JSON 字段序列化测试', () => {
    it('应该正确序列化和反序列化 shortcuts', async () => {
      const accountUuid = 'test-account-shortcuts-1';
      const entity = UserSettingServer.create({
        accountUuid,
        shortcuts: {
          enabled: true,
          custom: {
            newTask: 'Ctrl+N',
            search: 'Ctrl+K',
            settings: 'Ctrl+,',
          },
        },
      });

      await repository.save(entity);

      const retrieved = await repository.findByAccountUuid(accountUuid);
      expect(retrieved!.shortcuts.enabled).toBe(true);
      expect(retrieved!.shortcuts.custom).toEqual({
        newTask: 'Ctrl+N',
        search: 'Ctrl+K',
        settings: 'Ctrl+,',
      });
    });

    it('应该正确序列化和反序列化 privacy', async () => {
      const accountUuid = 'test-account-privacy-1';
      const entity = UserSettingServer.create({
        accountUuid,
        privacy: {
          profileVisibility: SettingContracts.ProfileVisibility.FRIENDS_ONLY,
          showOnlineStatus: false,
          allowSearchByEmail: false,
          allowSearchByPhone: true,
          shareUsageData: false,
        },
      });

      await repository.save(entity);

      const retrieved = await repository.findByAccountUuid(accountUuid);
      expect(retrieved!.privacy.profileVisibility).toBe(
        SettingContracts.ProfileVisibility.FRIENDS_ONLY,
      );
      expect(retrieved!.privacy.showOnlineStatus).toBe(false);
      expect(retrieved!.privacy.allowSearchByEmail).toBe(false);
      expect(retrieved!.privacy.allowSearchByPhone).toBe(true);
      expect(retrieved!.privacy.shareUsageData).toBe(false);
    });

    it('应该正确序列化和反序列化 experimental', async () => {
      const accountUuid = 'test-account-experimental-1';
      const entity = UserSettingServer.create({
        accountUuid,
        experimental: {
          enabled: true,
          features: ['ai-assistant', 'advanced-analytics', 'beta-ui'],
        },
      });

      await repository.save(entity);

      const retrieved = await repository.findByAccountUuid(accountUuid);
      expect(retrieved!.experimental.enabled).toBe(true);
      expect(retrieved!.experimental.features).toEqual([
        'ai-assistant',
        'advanced-analytics',
        'beta-ui',
      ]);
    });
  });

  describe('批量操作', () => {
    it('应该支持批量保存（saveMany）', async () => {
      const entities = [
        UserSettingServer.create({ accountUuid: 'batch-account-1' }),
        UserSettingServer.create({ accountUuid: 'batch-account-2' }),
        UserSettingServer.create({ accountUuid: 'batch-account-3' }),
      ];

      await repository.saveMany(entities);

      // Verify all were saved
      const found1 = await repository.findByAccountUuid('batch-account-1');
      const found2 = await repository.findByAccountUuid('batch-account-2');
      const found3 = await repository.findByAccountUuid('batch-account-3');

      expect(found1).toBeDefined();
      expect(found2).toBeDefined();
      expect(found3).toBeDefined();
    });
  });

  describe('边界情况', () => {
    it('应该正确处理空的 custom shortcuts', async () => {
      const accountUuid = 'test-account-empty-shortcuts';
      const entity = UserSettingServer.create({
        accountUuid,
        shortcuts: {
          enabled: true,
          custom: {}, // Empty object
        },
      });

      await repository.save(entity);

      const retrieved = await repository.findByAccountUuid(accountUuid);
      expect(retrieved!.shortcuts.custom).toEqual({});
    });

    it('应该正确处理空的 experimental features', async () => {
      const accountUuid = 'test-account-empty-features';
      const entity = UserSettingServer.create({
        accountUuid,
        experimental: {
          enabled: false,
          features: [], // Empty array
        },
      });

      await repository.save(entity);

      const retrieved = await repository.findByAccountUuid(accountUuid);
      expect(retrieved!.experimental.features).toEqual([]);
    });

    it('应该正确处理 null fontFamily', async () => {
      const accountUuid = 'test-account-null-font';
      const entity = UserSettingServer.create({
        accountUuid,
        appearance: {
          theme: SettingContracts.ThemeMode.LIGHT,
          accentColor: '#1976d2',
          fontSize: SettingContracts.FontSize.MEDIUM,
          fontFamily: null, // Null value
          compactMode: false,
        },
      });

      await repository.save(entity);

      const retrieved = await repository.findByAccountUuid(accountUuid);
      expect(retrieved!.appearance.fontFamily).toBeNull();
    });
  });
});
