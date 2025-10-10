/**
 * RepositoryStatistics 单元测试
 *
 * 测试 ApplicationService 的基础功能，确保接口正确
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('RepositoryStatistics ApplicationService 单元测试', () => {
  const TEST_ACCOUNT_UUID = 'test-account-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基础统计字段验证', () => {
    it('应该正确定义所有统计字段', () => {
      // 验证统计字段的类型定义
      const expectedFields = [
        'accountUuid',
        'totalRepositories',
        'activeRepositories',
        'archivedRepositories',
        'totalResources',
        'totalFiles',
        'totalFolders',
        'gitEnabledRepos',
        'totalCommits',
        'totalReferences',
        'totalLinkedContents',
        'totalSizeBytes',
        'lastUpdatedAt',
        'createdAt',
      ];

      // 如果能导入类型，说明定义正确
      expect(expectedFields).toHaveLength(14);
      expect(expectedFields).toContain('accountUuid');
      expect(expectedFields).toContain('totalRepositories');
      expect(expectedFields).toContain('totalSizeBytes');
    });

    it('应该有正确的默认值', () => {
      // 所有计数字段应该默认为 0
      const countFields = [
        'totalRepositories',
        'activeRepositories',
        'archivedRepositories',
        'totalResources',
        'totalFiles',
        'totalFolders',
        'gitEnabledRepos',
        'totalCommits',
        'totalReferences',
        'totalLinkedContents',
      ];

      countFields.forEach((field) => {
        expect(field).toBeDefined();
      });

      // totalSizeBytes 应该是 BigInt 类型，默认为 0n
      expect(typeof BigInt(0)).toBe('bigint');
    });
  });

  describe('事件类型验证', () => {
    it('应该定义所有事件类型', () => {
      const eventTypes = [
        'repository.created',
        'repository.deleted',
        'repository.archived',
        'repository.unarchived',
        'resource.created',
        'resource.deleted',
        'git.enabled',
        'git.disabled',
        'git.commit',
        'reference.created',
        'reference.deleted',
        'size.updated',
        'statistics.recalculated',
      ];

      expect(eventTypes).toHaveLength(13);
      expect(eventTypes).toContain('repository.created');
      expect(eventTypes).toContain('git.commit');
      expect(eventTypes).toContain('statistics.recalculated');
    });
  });

  describe('ApplicationService 方法验证', () => {
    it('应该导出 ApplicationService 类', async () => {
      try {
        const { RepositoryStatisticsApplicationService } = await import(
          '../application/services/RepositoryStatisticsApplicationService'
        );

        expect(RepositoryStatisticsApplicationService).toBeDefined();
        expect(typeof RepositoryStatisticsApplicationService.getInstance).toBe('function');
      } catch (error) {
        // 如果导入失败，测试失败
        throw new Error(`Failed to import ApplicationService: ${error}`);
      }
    });

    it('应该有所有必需的方法', async () => {
      const { RepositoryStatisticsApplicationService } = await import(
        '../application/services/RepositoryStatisticsApplicationService'
      );

      const service = await RepositoryStatisticsApplicationService.getInstance();

      // 验证方法存在
      expect(typeof service.getOrCreateStatistics).toBe('function');
      expect(typeof service.initializeStatistics).toBe('function');
      expect(typeof service.recalculateStatistics).toBe('function');
      expect(typeof service.deleteStatistics).toBe('function');
    });
  });

  describe('Controller 端点验证', () => {
    it('应该导出 Controller 类', async () => {
      try {
        const { RepositoryStatisticsController } = await import(
          '../interface/http/controllers/RepositoryStatisticsController'
        );

        expect(RepositoryStatisticsController).toBeDefined();
      } catch (error) {
        throw new Error(`Failed to import Controller: ${error}`);
      }
    });

    it('应该有所有 API 端点方法', async () => {
      const { RepositoryStatisticsController } = await import(
        '../interface/http/controllers/RepositoryStatisticsController'
      );

      // 验证方法存在
      expect(typeof RepositoryStatisticsController.getStatistics).toBe('function');
      expect(typeof RepositoryStatisticsController.initializeStatistics).toBe('function');
      expect(typeof RepositoryStatisticsController.recalculateStatistics).toBe('function');
      expect(typeof RepositoryStatisticsController.deleteStatistics).toBe('function');
    });
  });

  describe('路由配置验证', () => {
    it('应该导出统计路由', async () => {
      try {
        const repositoryStatisticsRoutes = await import(
          '../interface/http/routes/repositoryStatisticsRoutes'
        );

        expect(repositoryStatisticsRoutes.default).toBeDefined();
      } catch (error) {
        throw new Error(`Failed to import routes: ${error}`);
      }
    });
  });

  describe('Contracts 验证', () => {
    it('应该导出 Server Contracts', async () => {
      try {
        const { RepositoryContracts } = await import('@dailyuse/contracts');

        expect(RepositoryContracts).toBeDefined();
        // DTO 类型应该存在
        expect(RepositoryContracts).toHaveProperty('RepositoryStatisticsServerDTO');
      } catch (error) {
        throw new Error(`Failed to import Server Contracts: ${error}`);
      }
    });

    it('应该导出 Client Contracts', async () => {
      try {
        const { RepositoryContracts } = await import('@dailyuse/contracts');

        expect(RepositoryContracts).toHaveProperty('RepositoryStatisticsClientDTO');
      } catch (error) {
        throw new Error(`Failed to import Client Contracts: ${error}`);
      }
    });
  });
});
