/**
 * RepositoryDomainService 测试
 *
 * 测试领域服务的协调逻辑
 *
 * 注意：这是示例测试，展示如何测试领域服务
 * 实际使用时需要配置正确的 mock 框架
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RepositoryDomainService } from './RepositoryDomainService';
import { Repository } from '../aggregates/Repository';
import type { IRepositoryRepository } from '../repositories/IRepositoryRepository';
import type { RepositoryContracts } from '@dailyuse/contracts';

const RepositoryType = {
  LOCAL: 'local' as RepositoryContracts.RepositoryType,
  REMOTE: 'remote' as RepositoryContracts.RepositoryType,
  SYNCHRONIZED: 'synchronized' as RepositoryContracts.RepositoryType,
};

describe('RepositoryDomainService', () => {
  let service: RepositoryDomainService;
  let mockRepo: {
    save: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findByAccountUuid: ReturnType<typeof vi.fn>;
    findByPath: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    exists: ReturnType<typeof vi.fn>;
    isPathUsed: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // 创建 mock 仓储
    mockRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findByAccountUuid: vi.fn(),
      findByPath: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
      isPathUsed: vi.fn(),
    };

    service = new RepositoryDomainService(mockRepo as unknown as IRepositoryRepository);
  });

  describe('createRepository', () => {
    it('应该成功创建新仓库', async () => {
      mockRepo.isPathUsed.mockResolvedValue(false);
      mockRepo.save.mockResolvedValue(undefined);

      const result = await service.createRepository({
        accountUuid: 'account-123',
        name: 'Test Repo',
        type: RepositoryType.LOCAL,
        path: '/test/path',
        description: 'Test description',
      });

      expect(result).toBeInstanceOf(Repository);
      expect(result.name).toBe('Test Repo');
      expect(result.path).toBe('/test/path');

      expect(mockRepo.isPathUsed).toHaveBeenCalledWith('/test/path');
      expect(mockRepo.save).toHaveBeenCalledWith(result);
    });

    it('当路径已被使用时应该抛出错误', async () => {
      mockRepo.isPathUsed.mockResolvedValue(true);

      await expect(
        service.createRepository({
          accountUuid: 'account-123',
          name: 'Test Repo',
          type: RepositoryType.LOCAL,
          path: '/test/path',
        }),
      ).rejects.toThrow('Repository path is already in use: /test/path');

      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('应该支持初始化 Git', async () => {
      mockRepo.isPathUsed.mockResolvedValue(false);
      mockRepo.save.mockResolvedValue(undefined);

      const result = await service.createRepository({
        accountUuid: 'account-123',
        name: 'Test Repo',
        type: RepositoryType.LOCAL,
        path: '/test/path',
        initializeGit: true,
      });

      expect(result.git).not.toBeNull();
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  describe('getRepository', () => {
    it('应该获取仓库并更新访问时间', async () => {
      const mockRepository = Repository.create({
        accountUuid: 'account-123',
        name: 'Test Repo',
        type: RepositoryType.LOCAL,
        path: '/test/path',
      });

      mockRepo.findById.mockResolvedValue(mockRepository);
      mockRepo.save.mockResolvedValue(undefined);

      const result = await service.getRepository(mockRepository.uuid);

      expect(result).toBe(mockRepository);
      expect(mockRepo.findById).toHaveBeenCalledWith(mockRepository.uuid, undefined);
      // 访问时间应该被更新
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('当仓库不存在时应该返回 null', async () => {
      mockRepo.findById.mockResolvedValue(null);

      const result = await service.getRepository('non-existent-uuid');

      expect(result).toBeNull();
      expect(mockRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('updateRepositoryConfig', () => {
    it('应该更新仓库配置', async () => {
      const mockRepository = Repository.create({
        accountUuid: 'account-123',
        name: 'Test Repo',
        type: RepositoryType.LOCAL,
        path: '/test/path',
      });

      mockRepo.findById.mockResolvedValue(mockRepository);
      mockRepo.save.mockResolvedValue(undefined);

      const newConfig = {
        enableGit: true,
        autoSync: true,
      };

      const result = await service.updateRepositoryConfig(mockRepository.uuid, newConfig);

      expect(result).toBe(mockRepository);
      expect(mockRepo.save).toHaveBeenCalledWith(mockRepository);
    });

    it('当仓库不存在时应该抛出错误', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateRepositoryConfig('non-existent-uuid', { enableGit: true }),
      ).rejects.toThrow('Repository not found: non-existent-uuid');

      expect(mockRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('archiveRepository', () => {
    it('应该归档仓库', async () => {
      const mockRepository = Repository.create({
        accountUuid: 'account-123',
        name: 'Test Repo',
        type: RepositoryType.LOCAL,
        path: '/test/path',
      });

      mockRepo.findById.mockResolvedValue(mockRepository);
      mockRepo.save.mockResolvedValue(undefined);

      await service.archiveRepository(mockRepository.uuid);

      expect(mockRepo.save).toHaveBeenCalledWith(mockRepository);
      // 验证状态已更改为 ARCHIVED
      const savedRepo = mockRepo.save.mock.calls[0][0];
      expect(savedRepo.status).toBe('archived');
    });
  });

  describe('activateRepository', () => {
    it('应该激活仓库', async () => {
      const mockRepository = Repository.create({
        accountUuid: 'account-123',
        name: 'Test Repo',
        type: RepositoryType.LOCAL,
        path: '/test/path',
      });

      // 先归档
      mockRepository.archive();

      mockRepo.findById.mockResolvedValue(mockRepository);
      mockRepo.save.mockResolvedValue(undefined);

      await service.activateRepository(mockRepository.uuid);

      expect(mockRepo.save).toHaveBeenCalledWith(mockRepository);
      // 验证状态已更改为 ACTIVE
      const savedRepo = mockRepo.save.mock.calls[0][0];
      expect(savedRepo.status).toBe('active');
    });
  });

  describe('deleteRepository', () => {
    it('应该删除仓库', async () => {
      const mockRepository = Repository.create({
        accountUuid: 'account-123',
        name: 'Test Repo',
        type: RepositoryType.LOCAL,
        path: '/test/path',
      });

      mockRepo.findById.mockResolvedValue(mockRepository);
      mockRepo.delete.mockResolvedValue(undefined);

      await service.deleteRepository(mockRepository.uuid);

      expect(mockRepo.findById).toHaveBeenCalledWith(mockRepository.uuid, {
        includeChildren: true,
      });
      expect(mockRepo.delete).toHaveBeenCalledWith(mockRepository.uuid);
    });

    it('当仓库不存在时应该抛出错误', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.deleteRepository('non-existent-uuid')).rejects.toThrow(
        'Repository not found: non-existent-uuid',
      );

      expect(mockRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('enableGit', () => {
    it('应该启用 Git', async () => {
      const mockRepository = Repository.create({
        accountUuid: 'account-123',
        name: 'Test Repo',
        type: RepositoryType.LOCAL,
        path: '/test/path',
      });

      mockRepo.findById.mockResolvedValue(mockRepository);
      mockRepo.save.mockResolvedValue(undefined);

      await service.enableGit(mockRepository.uuid, 'https://github.com/user/repo.git');

      expect(mockRepo.save).toHaveBeenCalledWith(mockRepository);
      expect(mockRepository.git).not.toBeNull();
    });
  });

  describe('disableGit', () => {
    it('应该禁用 Git', async () => {
      const mockRepository = Repository.create({
        accountUuid: 'account-123',
        name: 'Test Repo',
        type: RepositoryType.LOCAL,
        path: '/test/path',
        initializeGit: true,
      });

      mockRepo.findById.mockResolvedValue(mockRepository);
      mockRepo.save.mockResolvedValue(undefined);

      await service.disableGit(mockRepository.uuid);

      expect(mockRepo.save).toHaveBeenCalledWith(mockRepository);
      expect(mockRepository.git).toBeNull();
    });
  });

  describe('addRelatedGoal', () => {
    it('应该添加关联目标', async () => {
      const mockRepository = Repository.create({
        accountUuid: 'account-123',
        name: 'Test Repo',
        type: RepositoryType.LOCAL,
        path: '/test/path',
      });

      mockRepo.findById.mockResolvedValue(mockRepository);
      mockRepo.save.mockResolvedValue(undefined);

      await service.addRelatedGoal(mockRepository.uuid, 'goal-123');

      expect(mockRepo.save).toHaveBeenCalledWith(mockRepository);
    });
  });

  describe('getRepositoriesByAccount', () => {
    it('应该获取账户的所有仓库', async () => {
      const mockRepositories = [
        Repository.create({
          accountUuid: 'account-123',
          name: 'Repo 1',
          type: RepositoryType.LOCAL,
          path: '/path/1',
        }),
        Repository.create({
          accountUuid: 'account-123',
          name: 'Repo 2',
          type: RepositoryType.LOCAL,
          path: '/path/2',
        }),
      ];

      mockRepo.findByAccountUuid.mockResolvedValue(mockRepositories);

      const result = await service.getRepositoriesByAccount('account-123');

      expect(result).toEqual(mockRepositories);
      expect(mockRepo.findByAccountUuid).toHaveBeenCalledWith('account-123', undefined);
    });
  });

  describe('getRepositoryByPath', () => {
    it('应该通过路径获取仓库', async () => {
      const mockRepository = Repository.create({
        accountUuid: 'account-123',
        name: 'Test Repo',
        type: RepositoryType.LOCAL,
        path: '/test/path',
      });

      mockRepo.findByPath.mockResolvedValue(mockRepository);

      const result = await service.getRepositoryByPath('/test/path');

      expect(result).toBe(mockRepository);
      expect(mockRepo.findByPath).toHaveBeenCalledWith('/test/path');
    });
  });
});
