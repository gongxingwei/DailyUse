import { randomUUID } from 'crypto';
import type { GoalContracts } from '@dailyuse/contracts';
import { GoalSortField, GoalDirSystemType } from '@dailyuse/contracts';

/**
 * 用户数据初始化服务
 * 负责在用户首次登录时创建默认数据
 */
export class UserDataInitializationService {
  constructor(
    private goalRepository: any, // 这里会通过依赖注入传入
  ) {}

  /**
   * 初始化用户的所有默认数据
   */
  async initializeUserDefaultData(accountUuid: string): Promise<void> {
    await Promise.all([
      this.initializeDefaultGoalDirectories(accountUuid),
      // 未来可以添加其他初始化任务
      // this.initializeDefaultTaskTemplates(accountUuid),
      // this.initializeDefaultSettings(accountUuid),
    ]);
  }

  /**
   * 初始化默认目标文件夹
   */
  private async initializeDefaultGoalDirectories(accountUuid: string): Promise<void> {
    // 检查是否已存在默认文件夹
    const existingDefaultDir = await this.goalRepository.getGoalDirBySystemType(accountUuid, 'ALL');

    if (existingDefaultDir) {
      // 已存在，跳过初始化
      return;
    }

    // 创建默认的 "ALL" 文件夹
    const defaultGoalDir: Omit<GoalContracts.GoalDirDTO, 'uuid' | 'lifecycle'> = {
      accountUuid,
      name: '全部目标',
      description: '系统默认目录，包含所有目标',
      icon: 'mdi-folder-multiple',
      color: '#2196F3',
      parentUuid: undefined,
      sortConfig: {
        sortKey: GoalSortField.CREATED_AT,
        sortOrder: 1,
      },
      systemType: GoalDirSystemType.ALL, // 标记为系统类型
      isDefault: true,
      metadata: {
        isSystemCreated: true,
        createdBy: 'system',
        purpose: 'default_all_container',
      },
    };

    await this.goalRepository.createGoalDirectory(accountUuid, defaultGoalDir);
  }

  /**
   * 检查用户是否需要初始化
   * 通过检查是否存在默认数据来判断
   */
  async needsInitialization(accountUuid: string): Promise<boolean> {
    const defaultDir = await this.goalRepository.getGoalDirBySystemType(accountUuid, 'ALL');
    return !defaultDir;
  }
}
