import type { GoalContracts } from '@dailyuse/contracts';
import type {
  IGoalDirRepository,
  IGoalAggregateRepository,
  GoalDir,
} from '@dailyuse/domain-server';

type CreateGoalDirRequest = GoalContracts.CreateGoalDirRequest;
type UpdateGoalDirRequest = GoalContracts.UpdateGoalDirRequest;
type GoalDirResponse = GoalContracts.GoalDirResponse;
type GoalDirListResponse = GoalContracts.GoalDirListResponse;

/**
 * GoalDir 领域服务
 *
 * 职责：
 * - 纯领域逻辑，不依赖具体技术实现
 * - 通过 IGoalDirRepository 接口操作数据
 * - 处理 GoalDir 聚合根的业务规则
 * - 可以安全地移动到 @dailyuse/domain-server 包
 *
 * 设计原则：
 * - 依赖倒置：依赖接口而非实现
 * - 单一职责：只处理 GoalDir 相关的领域逻辑
 * - 与技术解耦：不包含任何基础设施细节（Prisma、Express等）
 */
export class GoalDirDomainService {
  constructor(
    private readonly goalDirRepository: IGoalDirRepository,
    private readonly goalAggregateRepository: IGoalAggregateRepository,
  ) {}

  /**
   * 创建目标目录
   * 业务规则：
   * 1. 名称、图标、颜色必填
   * 2. 父目录必须存在
   * 3. 同一层级下目录名称唯一
   */
  async createGoalDir(
    request: CreateGoalDirRequest,
    accountUuid: string,
  ): Promise<GoalDirResponse> {
    // 验证必填字段
    this.validateRequiredFields(request);

    // 构建目录数据
    const dirData: Omit<GoalContracts.GoalDirDTO, 'uuid' | 'lifecycle'> = {
      name: request.name.trim(),
      description: request.description?.trim() || '',
      icon: request.icon.trim(),
      color: request.color.trim(),
      parentUuid: request.parentUuid || undefined,
      sortConfig: request.sortConfig || {
        sortKey: 'createdAt' as GoalContracts.GoalSortField,
        sortOrder: 0,
      },
    };

    // 验证父目录
    await this.validateParentDirectory(accountUuid, dirData.parentUuid);

    // 验证名称唯一性
    await this.validateUniqueNameInLevel(accountUuid, dirData.name, dirData.parentUuid);

    // 创建实体并保存
    const dirDTO: GoalContracts.GoalDirDTO = {
      ...dirData,
      uuid: '',
      lifecycle: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'active' as GoalContracts.GoalDirStatus,
      },
    };

    const dirEntity = await this.createEntityFromDTO(dirDTO);
    const savedDirEntity = await this.goalDirRepository.saveGoalDirectory(accountUuid, dirEntity);
    const createdDir = savedDirEntity.toDTO();

    return {
      ...createdDir,
      goalsCount: 0,
    };
  }

  /**
   * 获取目标目录列表
   */
  async getGoalDirs(
    queryParams: { parentUuid?: string; limit?: number; offset?: number },
    accountUuid: string,
  ): Promise<GoalDirListResponse> {
    const params = {
      parentUuid: queryParams.parentUuid,
      limit: queryParams.limit || 100,
      offset: queryParams.offset || 0,
    };

    const result = await this.goalDirRepository.getAllGoalDirectories(accountUuid, {
      parentUuid: params.parentUuid,
    });

    const goalDirsWithCount = await Promise.all(
      result.goalDirs.map(async (dirEntity) => {
        const dirDTO = dirEntity.toDTO();
        const goals = await this.goalAggregateRepository.getGoalsByDirectoryUuid(
          accountUuid,
          dirDTO.uuid,
        );
        return {
          ...dirDTO,
          goalsCount: goals.length,
        } as GoalDirResponse;
      }),
    );

    return {
      data: goalDirsWithCount,
      total: result.total,
    };
  }

  /**
   * 根据ID获取目标目录
   */
  async getGoalDirById(uuid: string, accountUuid: string): Promise<GoalDirResponse | null> {
    const dirEntity = await this.goalDirRepository.getGoalDirectoryByUuid(accountUuid, uuid);
    if (!dirEntity) {
      return null;
    }

    const dir = dirEntity.toDTO();
    const goals = await this.goalAggregateRepository.getGoalsByDirectoryUuid(accountUuid, dir.uuid);

    return {
      ...dir,
      goalsCount: goals.length,
    };
  }

  /**
   * 更新目标目录
   * 业务规则：
   * 1. 目录必须存在
   * 2. 更新后的名称在同层级唯一
   * 3. 不能设置自己为父目录（防止循环引用）
   */
  async updateGoalDir(
    uuid: string,
    request: UpdateGoalDirRequest,
    accountUuid: string,
  ): Promise<GoalDirResponse> {
    // 验证目录存在
    const existingDir = await this.goalDirRepository.getGoalDirectoryByUuid(accountUuid, uuid);
    if (!existingDir) {
      throw new Error('目录不存在');
    }

    // 验证更新字段
    this.validateUpdateFields(request);

    // 验证父目录（如果更新）
    if (request.parentUuid !== undefined && request.parentUuid) {
      await this.validateParentDirectory(accountUuid, request.parentUuid);

      if (request.parentUuid === uuid) {
        throw new Error('不能将目录设置为自己的父目录');
      }
    }

    // 验证名称唯一性（如果更新了名称）
    if (request.name && request.name !== existingDir.name) {
      const targetParentUuid =
        request.parentUuid !== undefined ? request.parentUuid : existingDir.parentUuid;

      await this.validateUniqueNameInLevel(
        accountUuid,
        request.name.trim(),
        targetParentUuid,
        uuid,
      );
    }

    // 构建更新后的 DTO
    const dirDTO = existingDir.toDTO();
    const updatedDirDTO: GoalContracts.GoalDirDTO = {
      ...dirDTO,
      ...(request.name !== undefined && { name: request.name.trim() }),
      ...(request.description !== undefined && { description: request.description.trim() }),
      ...(request.icon !== undefined && { icon: request.icon.trim() }),
      ...(request.color !== undefined && { color: request.color.trim() }),
      ...(request.parentUuid !== undefined && { parentUuid: request.parentUuid }),
      ...(request.sortConfig !== undefined && { sortConfig: request.sortConfig }),
      lifecycle: {
        ...dirDTO.lifecycle,
        updatedAt: Date.now(),
      },
    };

    // 保存更新
    const updatedDirEntity = await this.createEntityFromDTO(updatedDirDTO);
    const savedDir = await this.goalDirRepository.saveGoalDirectory(accountUuid, updatedDirEntity);

    // 计算目标数量
    const goals = await this.goalAggregateRepository.getGoalsByDirectoryUuid(
      accountUuid,
      savedDir.uuid,
    );

    return {
      ...savedDir.toDTO(),
      goalsCount: goals.length,
    };
  }

  /**
   * 删除目标目录
   * 业务规则：
   * 1. 目录必须存在
   * 2. 不能有子目录
   * 3. 不能有关联的目标
   */
  async deleteGoalDir(uuid: string, accountUuid: string): Promise<void> {
    // 验证目录存在
    const existingDir = await this.goalDirRepository.getGoalDirectoryByUuid(accountUuid, uuid);
    if (!existingDir) {
      throw new Error('目录不存在');
    }

    // 检查子目录
    const subDirs = await this.goalDirRepository.getAllGoalDirectories(accountUuid, {
      parentUuid: uuid,
    });
    if (subDirs.goalDirs.length > 0) {
      throw new Error('无法删除目录，请先删除或移动子目录');
    }

    // 检查关联目标
    const goals = await this.goalAggregateRepository.getGoalsByDirectoryUuid(accountUuid, uuid);
    if (goals.length > 0) {
      throw new Error(`无法删除目录，还有 ${goals.length} 个目标在使用此目录`);
    }

    // 执行删除
    const deleted = await this.goalDirRepository.deleteGoalDirectory(accountUuid, uuid);
    if (!deleted) {
      throw new Error('删除目录失败');
    }
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 验证必填字段
   */
  private validateRequiredFields(request: CreateGoalDirRequest): void {
    if (!request.name?.trim()) {
      throw new Error('目录名称不能为空');
    }
    if (!request.icon?.trim()) {
      throw new Error('图标不能为空');
    }
    if (!request.color?.trim()) {
      throw new Error('颜色不能为空');
    }
  }

  /**
   * 验证更新字段
   */
  private validateUpdateFields(request: UpdateGoalDirRequest): void {
    if (request.name !== undefined && !request.name.trim()) {
      throw new Error('目录名称不能为空');
    }
    if (request.icon !== undefined && !request.icon.trim()) {
      throw new Error('图标不能为空');
    }
    if (request.color !== undefined && !request.color.trim()) {
      throw new Error('颜色不能为空');
    }
  }

  /**
   * 验证父目录存在
   */
  private async validateParentDirectory(accountUuid: string, parentUuid?: string): Promise<void> {
    if (parentUuid) {
      const parentDir = await this.goalDirRepository.getGoalDirectoryByUuid(
        accountUuid,
        parentUuid,
      );
      if (!parentDir) {
        throw new Error('父目录不存在');
      }
    }
  }

  /**
   * 验证目录名称在同层级唯一
   */
  private async validateUniqueNameInLevel(
    accountUuid: string,
    name: string,
    parentUuid?: string,
    excludeUuid?: string,
  ): Promise<void> {
    const existingDirs = await this.goalDirRepository.getAllGoalDirectories(accountUuid, {
      parentUuid,
    });

    const nameExists = existingDirs.goalDirs.some((dir) => {
      const isSameName = dir.toDTO().name === name;
      const isDifferentDir = excludeUuid ? dir.uuid !== excludeUuid : true;
      return isSameName && isDifferentDir;
    });

    if (nameExists) {
      throw new Error('目录名称在当前层级下已存在');
    }
  }

  /**
   * 从 DTO 创建实体
   * 注意：这里需要动态导入以避免循环依赖
   */
  private async createEntityFromDTO(dto: GoalContracts.GoalDirDTO): Promise<GoalDir> {
    const { GoalDir } = await import('@dailyuse/domain-server');
    return GoalDir.fromDTO(dto);
  }
}
