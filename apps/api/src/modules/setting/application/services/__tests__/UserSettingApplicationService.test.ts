/**
 * UserSettingApplicationService Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserSettingApplicationService } from '../UserSettingApplicationService';
import type { IUserSettingRepository } from '@dailyuse/domain-server';
import { UserSettingServer } from '@dailyuse/domain-server';
import type { SettingContracts } from '@dailyuse/contracts';

describe('UserSettingApplicationService', () => {
  let service: UserSettingApplicationService;
  let mockRepository: IUserSettingRepository;

  beforeEach(() => {
    // Create mock repository
    mockRepository = {
      findById: vi.fn(),
      findByAccountUuid: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
      existsByAccountUuid: vi.fn(),
      saveMany: vi.fn(),
    };

    // Create service with mock repository
    service = new (UserSettingApplicationService as any)(mockRepository);
  });

  describe('createUserSetting', () => {
    it('should create user setting with defaults', async () => {
      const request: SettingContracts.CreateUserSettingRequest = {
        accountUuid: 'account-123',
      };

      vi.mocked(mockRepository.existsByAccountUuid).mockResolvedValue(false);
      vi.mocked(mockRepository.save).mockResolvedValue(undefined);

      const result = await service.createUserSetting(request);

      expect(result.accountUuid).toBe('account-123');
      expect(result.appearance.theme).toBe('AUTO');
      expect(result.locale.language).toBe('zh-CN');
      expect(mockRepository.save).toHaveBeenCalledOnce();
    });

    it('should create user setting with custom values', async () => {
      const request: SettingContracts.CreateUserSettingRequest = {
        accountUuid: 'account-123',
        appearance: {
          theme: 'DARK' as any,
          fontSize: 'LARGE' as any,
        },
        locale: {
          language: 'en-US',
        },
      };

      vi.mocked(mockRepository.existsByAccountUuid).mockResolvedValue(false);
      vi.mocked(mockRepository.save).mockResolvedValue(undefined);

      const result = await service.createUserSetting(request);

      expect(result.appearance.theme).toBe('DARK');
      expect(result.appearance.fontSize).toBe('LARGE');
      expect(result.locale.language).toBe('en-US');
    });

    it('should throw error if user setting already exists', async () => {
      const request: SettingContracts.CreateUserSettingRequest = {
        accountUuid: 'account-123',
      };

      vi.mocked(mockRepository.existsByAccountUuid).mockResolvedValue(true);

      await expect(service.createUserSetting(request)).rejects.toThrow(
        'User setting already exists',
      );
    });
  });

  describe('getUserSettingByUuid', () => {
    it('should return user setting when found', async () => {
      const entity = UserSettingServer.create({ accountUuid: 'account-123' });
      vi.mocked(mockRepository.findById).mockResolvedValue(entity);

      const result = await service.getUserSettingByUuid('uuid-123');

      expect(result.accountUuid).toBe('account-123');
      expect(mockRepository.findById).toHaveBeenCalledWith('uuid-123');
    });

    it('should throw error when not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(service.getUserSettingByUuid('uuid-123')).rejects.toThrow(
        'User setting not found',
      );
    });
  });

  describe('getUserSettingByAccountUuid', () => {
    it('should return user setting when found', async () => {
      const entity = UserSettingServer.create({ accountUuid: 'account-123' });
      vi.mocked(mockRepository.findByAccountUuid).mockResolvedValue(entity);

      const result = await service.getUserSettingByAccountUuid('account-123');

      expect(result.accountUuid).toBe('account-123');
    });

    it('should throw error when not found', async () => {
      vi.mocked(mockRepository.findByAccountUuid).mockResolvedValue(null);

      await expect(service.getUserSettingByAccountUuid('account-123')).rejects.toThrow(
        'User setting not found',
      );
    });
  });

  describe('updateUserSetting', () => {
    it('should update user setting', async () => {
      const entity = UserSettingServer.create({ accountUuid: 'account-123' });
      vi.mocked(mockRepository.findById).mockResolvedValue(entity);
      vi.mocked(mockRepository.save).mockResolvedValue(undefined);

      const request: SettingContracts.UpdateUserSettingRequest = {
        uuid: 'uuid-123',
        appearance: {
          theme: 'DARK' as any,
        },
      };

      const result = await service.updateUserSetting('uuid-123', request);

      expect(result.appearance.theme).toBe('DARK');
      expect(mockRepository.save).toHaveBeenCalledOnce();
    });
  });

  describe('updateTheme', () => {
    it('should update theme', async () => {
      const entity = UserSettingServer.create({ accountUuid: 'account-123' });
      vi.mocked(mockRepository.findById).mockResolvedValue(entity);
      vi.mocked(mockRepository.save).mockResolvedValue(undefined);

      const result = await service.updateTheme('uuid-123', 'DARK' as any);

      expect(result.appearance.theme).toBe('DARK');
    });
  });

  describe('updateLanguage', () => {
    it('should update language', async () => {
      const entity = UserSettingServer.create({ accountUuid: 'account-123' });
      vi.mocked(mockRepository.findById).mockResolvedValue(entity);
      vi.mocked(mockRepository.save).mockResolvedValue(undefined);

      const result = await service.updateLanguage('uuid-123', 'en-US');

      expect(result.locale.language).toBe('en-US');
    });
  });

  describe('updateShortcut', () => {
    it('should update shortcut', async () => {
      const entity = UserSettingServer.create({ accountUuid: 'account-123' });
      vi.mocked(mockRepository.findById).mockResolvedValue(entity);
      vi.mocked(mockRepository.save).mockResolvedValue(undefined);

      const request: SettingContracts.UpdateShortcutRequest = {
        action: 'save',
        shortcut: 'Ctrl+S',
      };

      const result = await service.updateShortcut('uuid-123', request);

      expect(result.shortcuts.custom['save']).toBe('Ctrl+S');
    });
  });

  describe('removeShortcut', () => {
    it('should remove shortcut', async () => {
      const entity = UserSettingServer.create({
        accountUuid: 'account-123',
        shortcuts: {
          custom: { save: 'Ctrl+S' },
        },
      });
      vi.mocked(mockRepository.findById).mockResolvedValue(entity);
      vi.mocked(mockRepository.save).mockResolvedValue(undefined);

      const result = await service.removeShortcut('uuid-123', 'save');

      expect(result.shortcuts.custom['save']).toBeUndefined();
    });
  });

  describe('deleteUserSetting', () => {
    it('should delete user setting', async () => {
      vi.mocked(mockRepository.exists).mockResolvedValue(true);
      vi.mocked(mockRepository.delete).mockResolvedValue(undefined);

      await service.deleteUserSetting('uuid-123');

      expect(mockRepository.delete).toHaveBeenCalledWith('uuid-123');
    });

    it('should throw error if user setting does not exist', async () => {
      vi.mocked(mockRepository.exists).mockResolvedValue(false);

      await expect(service.deleteUserSetting('uuid-123')).rejects.toThrow('User setting not found');
    });
  });

  describe('getOrCreate', () => {
    it('should return existing user setting', async () => {
      const entity = UserSettingServer.create({ accountUuid: 'account-123' });
      vi.mocked(mockRepository.findByAccountUuid).mockResolvedValue(entity);

      const result = await service.getOrCreate('account-123');

      expect(result.accountUuid).toBe('account-123');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should create user setting if not exists', async () => {
      vi.mocked(mockRepository.findByAccountUuid).mockResolvedValue(null);
      vi.mocked(mockRepository.existsByAccountUuid).mockResolvedValue(false);
      vi.mocked(mockRepository.save).mockResolvedValue(undefined);

      const result = await service.getOrCreate('account-123');

      expect(result.accountUuid).toBe('account-123');
      expect(mockRepository.save).toHaveBeenCalledOnce();
    });
  });
});
