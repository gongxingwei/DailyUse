import type { IGoalRepository } from '../repositories/iGoalRepository';
import { GoalDir } from '../aggregates/GoalDir';
import type { GoalContracts } from '@dailyuse/contracts';

/**
 * 用户数据初始化服务
 * 负责为新用户创建默认的目标目录和其他初始数据
 */
export class UserDataInitializationService {
  constructor(private readonly goalRepository: IGoalRepository) {}

  /**
   * 初始化用户的目标模块数据
   * @param accountUuid 用户账户UUID
   */
  async initializeUserGoalData(accountUuid: string): Promise<void> {
    // 检查用户是否已有目录
    const existingDirs = await this.goalRepository.getAllGoalDirectories(accountUuid);

    if (existingDirs.goalDirs.length > 0) {
      // 用户已有数据，不需要初始化
      return;
    }

    // 创建默认目录
    await this.createDefaultDirectories(accountUuid);
  }

  /**
   * 创建默认目录
   * @param accountUuid 用户账户UUID
   */
  private async createDefaultDirectories(accountUuid: string): Promise<void> {
    const defaultDirectories: Omit<GoalContracts.GoalDirDTO, 'uuid' | 'lifecycle'>[] = [
      {
        accountUuid,
        name: '全部目标',
        description: '所有目标的默认分类',
        icon: '📋',
        color: '#3B82F6',
        parentUuid: undefined,
        sortConfig: {
          sortKey: 'createdAt',
          sortOrder: 0,
        },
        systemType: 'ALL',
        isDefault: true,
        metadata: {
          systemCreated: true,
          autoManaged: true,
          description: '系统自动创建的默认目录，用于显示所有目标',
        },
      },
      {
        accountUuid,
        name: '未分类',
        description: '未指定目录的目标',
        icon: '📂',
        color: '#64748B',
        parentUuid: undefined,
        sortConfig: {
          sortKey: 'createdAt',
          sortOrder: 1,
        },
        systemType: 'UNCATEGORIZED',
        isDefault: false,
        metadata: {
          systemCreated: true,
          autoManaged: true,
          description: '系统自动创建的未分类目录',
        },
      },
      {
        accountUuid,
        name: '已归档',
        description: '已完成或不再活跃的目标',
        icon: '📦',
        color: '#9CA3AF',
        parentUuid: undefined,
        sortConfig: {
          sortKey: 'createdAt',
          sortOrder: 2,
        },
        systemType: 'ARCHIVED',
        isDefault: false,
        metadata: {
          systemCreated: true,
          autoManaged: true,
          description: '系统自动创建的归档目录',
        },
      },
    ];

    // 创建默认目录
    for (const dirData of defaultDirectories) {
      await this.goalRepository.createGoalDirectory(accountUuid, dirData);
    }
  }

  /**
   * 检查并修复缺失的默认目录
   * @param accountUuid 用户账户UUID
   */
  async ensureDefaultDirectories(accountUuid: string): Promise<void> {
    const existingDirs = await this.goalRepository.getAllGoalDirectories(accountUuid);
    const systemTypes = existingDirs.goalDirs
      .filter((dir: GoalContracts.GoalDirDTO) => dir.systemType)
      .map((dir: GoalContracts.GoalDirDTO) => dir.systemType);

    const requiredSystemTypes: ('ALL' | 'UNCATEGORIZED' | 'ARCHIVED')[] = [
      'ALL',
      'UNCATEGORIZED',
      'ARCHIVED',
    ];
    const missingSystemTypes = requiredSystemTypes.filter((type) => !systemTypes.includes(type));

    if (missingSystemTypes.length === 0) {
      return;
    }

    // 创建缺失的系统目录
    const directoriesToCreate = missingSystemTypes.map((systemType, index) => {
      switch (systemType) {
        case 'ALL':
          return {
            accountUuid,
            name: '全部目标',
            description: '所有目标的默认分类',
            icon: '📋',
            color: '#3B82F6',
            parentUuid: undefined,
            sortConfig: {
              sortKey: 'createdAt',
              sortOrder: 0,
            },
            systemType,
            isDefault: true,
            metadata: {
              systemCreated: true,
              autoManaged: true,
              description: '系统自动创建的默认目录，用于显示所有目标',
            },
          };
        case 'UNCATEGORIZED':
          return {
            accountUuid,
            name: '未分类',
            description: '未指定目录的目标',
            icon: '📂',
            color: '#64748B',
            parentUuid: undefined,
            sortConfig: {
              sortKey: 'createdAt',
              sortOrder: 1,
            },
            systemType,
            isDefault: false,
            metadata: {
              systemCreated: true,
              autoManaged: true,
              description: '系统自动创建的未分类目录',
            },
          };
        case 'ARCHIVED':
          return {
            accountUuid,
            name: '已归档',
            description: '已完成或不再活跃的目标',
            icon: '📦',
            color: '#9CA3AF',
            parentUuid: undefined,
            sortConfig: {
              sortKey: 'createdAt',
              sortOrder: 2,
            },
            systemType,
            isDefault: false,
            metadata: {
              systemCreated: true,
              autoManaged: true,
              description: '系统自动创建的归档目录',
            },
          };
        default:
          throw new Error(`Unknown system type: ${systemType}`);
      }
    });

    for (const dirData of directoriesToCreate) {
      await this.goalRepository.createGoalDirectory(accountUuid, dirData);
    }
  }

  /**
   * 获取用户的默认目录（全部目标）
   * @param accountUuid 用户账户UUID
   * @returns 默认目录DTO，如果不存在则创建
   */
  async getDefaultDirectory(accountUuid: string): Promise<GoalContracts.GoalDirDTO> {
    const existingDirs = await this.goalRepository.getAllGoalDirectories(accountUuid);
    let defaultDir = existingDirs.goalDirs.find(
      (dir: GoalContracts.GoalDirDTO) => dir.systemType === 'ALL' && dir.isDefault,
    );

    if (!defaultDir) {
      // 确保默认目录存在
      await this.ensureDefaultDirectories(accountUuid);

      // 重新获取
      const updatedDirs = await this.goalRepository.getAllGoalDirectories(accountUuid);
      defaultDir = updatedDirs.goalDirs.find(
        (dir: GoalContracts.GoalDirDTO) => dir.systemType === 'ALL' && dir.isDefault,
      );

      if (!defaultDir) {
        throw new Error('Failed to create or find default directory');
      }
    }

    return defaultDir;
  }

  /**
   * 获取或创建未分类目录
   * @param accountUuid 用户账户UUID
   * @returns 未分类目录DTO
   */
  async getUncategorizedDirectory(accountUuid: string): Promise<GoalContracts.GoalDirDTO> {
    const existingDirs = await this.goalRepository.getAllGoalDirectories(accountUuid);
    let uncategorizedDir = existingDirs.goalDirs.find(
      (dir: GoalContracts.GoalDirDTO) => dir.systemType === 'UNCATEGORIZED',
    );

    if (!uncategorizedDir) {
      await this.ensureDefaultDirectories(accountUuid);

      const updatedDirs = await this.goalRepository.getAllGoalDirectories(accountUuid);
      uncategorizedDir = updatedDirs.goalDirs.find(
        (dir: GoalContracts.GoalDirDTO) => dir.systemType === 'UNCATEGORIZED',
      );

      if (!uncategorizedDir) {
        throw new Error('Failed to create or find uncategorized directory');
      }
    }

    return uncategorizedDir;
  }
}
