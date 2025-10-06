import type { IGoalAggregateRepository } from '../repositories/IGoalAggregateRepository';
import type { IGoalDirRepository } from '../repositories/IGoalDirRepository';
import { GoalDir } from '../aggregates/GoalDir';
import { GoalContracts } from '@dailyuse/contracts';
import { generateUUID } from '@dailyuse/utils';

// 枚举别名
const GoalSortFieldEnum = GoalContracts.GoalSortField;
const GoalDirSystemTypeEnum = GoalContracts.GoalDirSystemType;
const GoalDirStatusEnum = GoalContracts.GoalDirStatus;

/**
 * 用户数据初始化服务
 * 负责为新用户创建默认的目标目录和其他初始数据
 *
 * NOTE: 由于 GoalDir 实体暂时不支持 systemType/isDefault 字段，
 * 此服务通过直接操作持久化层来创建系统目录
 */
export class UserDataInitializationService {
  constructor(
    private readonly goalAggregateRepository: IGoalAggregateRepository,
    private readonly goalDirRepository: IGoalDirRepository,
  ) {}

  /**
   * 初始化用户的目标模块数据
   * @param accountUuid 用户账户UUID
   */
  async initializeUserGoalData(accountUuid: string): Promise<void> {
    // 检查用户是否已有目录
    const existingDirs = await this.goalDirRepository.getAllGoalDirectories(accountUuid);

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
    const defaultDirectories: GoalContracts.GoalDirDTO[] = [
      {
        uuid: generateUUID(),
        name: '全部目标',
        description: '所有目标的默认分类',
        icon: '📋',
        color: '#3B82F6',
        parentUuid: undefined,
        sortConfig: {
          sortKey: GoalSortFieldEnum.CREATED_AT,
          sortOrder: 0,
        },
        systemType: GoalDirSystemTypeEnum.ALL,
        isDefault: true,
        metadata: {
          systemCreated: true,
          autoManaged: true,
          description: '系统自动创建的默认目录，用于显示所有目标',
        },
        lifecycle: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: GoalDirStatusEnum.ACTIVE,
        },
      },
      {
        uuid: generateUUID(),
        name: '未分类',
        description: '未指定目录的目标',
        icon: '📂',
        color: '#64748B',
        parentUuid: undefined,
        sortConfig: {
          sortKey: GoalSortFieldEnum.CREATED_AT,
          sortOrder: 1,
        },
        systemType: GoalDirSystemTypeEnum.UNCATEGORIZED,
        isDefault: false,
        metadata: {
          systemCreated: true,
          autoManaged: true,
          description: '系统自动创建的未分类目录',
        },
        lifecycle: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: GoalDirStatusEnum.ACTIVE,
        },
      },
      {
        uuid: generateUUID(),
        name: '已归档',
        description: '已完成或不再活跃的目标',
        icon: '📦',
        color: '#9CA3AF',
        parentUuid: undefined,
        sortConfig: {
          sortKey: GoalSortFieldEnum.CREATED_AT,
          sortOrder: 2,
        },
        systemType: GoalDirSystemTypeEnum.ARCHIVED,
        isDefault: false,
        metadata: {
          systemCreated: true,
          autoManaged: true,
          description: '系统自动创建的归档目录',
        },
        lifecycle: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: GoalDirStatusEnum.ACTIVE,
        },
      },
    ];

    // 创建默认目录
    for (const dirData of defaultDirectories) {
      const dirEntity = GoalDir.fromDTO(dirData);
      await this.goalDirRepository.saveGoalDirectory(accountUuid, dirEntity);
    }
  }

  /**
   * 检查并修复缺失的默认目录
   * @param accountUuid 用户账户UUID
   */
  async ensureDefaultDirectories(accountUuid: string): Promise<void> {
    const result = await this.goalDirRepository.getAllGoalDirectories(accountUuid);

    // 转换为 DTO 数组以访问 systemType
    const existingDirDTOs = result.goalDirs.map((dir) => dir.toDTO());
    const systemTypes = existingDirDTOs
      .filter((dir) => dir.systemType)
      .map((dir) => dir.systemType);

    const requiredSystemTypes: GoalContracts.GoalDirSystemType[] = [
      GoalDirSystemTypeEnum.ALL,
      GoalDirSystemTypeEnum.UNCATEGORIZED,
      GoalDirSystemTypeEnum.ARCHIVED,
    ];
    const missingSystemTypes = requiredSystemTypes.filter((type) => !systemTypes.includes(type));

    if (missingSystemTypes.length === 0) {
      return;
    }

    // 创建缺失的系统目录
    const directoriesToCreate: GoalContracts.GoalDirDTO[] = missingSystemTypes.map((systemType) => {
      const baseDir = {
        uuid: generateUUID(),
        parentUuid: undefined,
        sortConfig: {
          sortKey: GoalSortFieldEnum.CREATED_AT,
          sortOrder: 0,
        },
        lifecycle: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: GoalDirStatusEnum.ACTIVE,
        },
        metadata: {
          systemCreated: true,
          autoManaged: true,
        },
      };

      switch (systemType) {
        case GoalDirSystemTypeEnum.ALL:
          return {
            ...baseDir,
            name: '全部目标',
            description: '所有目标的默认分类',
            icon: '📋',
            color: '#3B82F6',
            systemType,
            isDefault: true,
            metadata: {
              ...baseDir.metadata,
              description: '系统自动创建的默认目录，用于显示所有目标',
            },
          };
        case GoalDirSystemTypeEnum.UNCATEGORIZED:
          return {
            ...baseDir,
            name: '未分类',
            description: '未指定目录的目标',
            icon: '📂',
            color: '#64748B',
            systemType,
            isDefault: false,
            metadata: {
              ...baseDir.metadata,
              description: '系统自动创建的未分类目录',
            },
          };
        case GoalDirSystemTypeEnum.ARCHIVED:
          return {
            ...baseDir,
            name: '已归档',
            description: '已完成或不再活跃的目标',
            icon: '📦',
            color: '#9CA3AF',
            systemType,
            isDefault: false,
            metadata: {
              ...baseDir.metadata,
              description: '系统自动创建的归档目录',
            },
          };
        default:
          throw new Error(`Unknown system type: ${systemType}`);
      }
    });

    for (const dirData of directoriesToCreate) {
      const dirEntity = GoalDir.fromDTO(dirData);
      await this.goalDirRepository.saveGoalDirectory(accountUuid, dirEntity);
    }
  }

  /**
   * 获取用户的默认目录（全部目标）
   * @param accountUuid 用户账户UUID
   * @returns 默认目录DTO，如果不存在则创建
   */
  async getDefaultDirectory(accountUuid: string): Promise<GoalContracts.GoalDirDTO> {
    const result = await this.goalDirRepository.getAllGoalDirectories(accountUuid);
    const dirDTOs = result.goalDirs.map((dir) => dir.toDTO());

    let defaultDir = dirDTOs.find((dir) => dir.systemType === 'ALL' && dir.isDefault);

    if (!defaultDir) {
      // 确保默认目录存在
      await this.ensureDefaultDirectories(accountUuid);

      // 重新获取
      const updatedResult = await this.goalDirRepository.getAllGoalDirectories(accountUuid);
      const updatedDTOs = updatedResult.goalDirs.map((dir) => dir.toDTO());

      defaultDir = updatedDTOs.find((dir) => dir.systemType === 'ALL' && dir.isDefault);

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
    const result = await this.goalDirRepository.getAllGoalDirectories(accountUuid);
    const dirDTOs = result.goalDirs.map((dir) => dir.toDTO());

    let uncategorizedDir = dirDTOs.find((dir) => dir.systemType === 'UNCATEGORIZED');

    if (!uncategorizedDir) {
      await this.ensureDefaultDirectories(accountUuid);

      const updatedResult = await this.goalDirRepository.getAllGoalDirectories(accountUuid);
      const updatedDTOs = updatedResult.goalDirs.map((dir) => dir.toDTO());

      uncategorizedDir = updatedDTOs.find((dir) => dir.systemType === 'UNCATEGORIZED');

      if (!uncategorizedDir) {
        throw new Error('Failed to create or find uncategorized directory');
      }
    }

    return uncategorizedDir;
  }
}
