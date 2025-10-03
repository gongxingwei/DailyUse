import type { GoalContracts } from '@dailyuse/contracts';
import type { IGoalRepository } from '@dailyuse/domain-server';
import { GoalDir } from '@dailyuse/domain-server';

type CreateGoalDirRequest = GoalContracts.CreateGoalDirRequest;
type UpdateGoalDirRequest = GoalContracts.UpdateGoalDirRequest;
type GoalDirResponse = GoalContracts.GoalDirResponse;
type GoalDirListResponse = GoalContracts.GoalDirListResponse;

/**
 * GoalDir 领域服务
 * 纯领域逻辑，不依赖具体技术实现
 * 通过依赖注入使用 Repository 接口
 */
export class GoalDirDomainService {
  constructor(private readonly goalRepository: IGoalRepository) {}

  async createGoalDir(
    request: CreateGoalDirRequest,
    accountUuid?: string,
  ): Promise<GoalDirResponse> {
    const userAccountUuid = accountUuid || 'temp-account-uuid';

    if (!request.name?.trim()) {
      throw new Error('目录名称不能为空');
    }

    if (!request.icon?.trim()) {
      throw new Error('图标不能为空');
    }

    if (!request.color?.trim()) {
      throw new Error('颜色不能为空');
    }

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

    if (dirData.parentUuid) {
      const parentDir = await this.goalRepository.getGoalDirectoryByUuid(
        userAccountUuid,
        dirData.parentUuid,
      );
      if (!parentDir) {
        throw new Error('父目录不存在');
      }
    }

    const existingDirs = await this.goalRepository.getAllGoalDirectories(userAccountUuid, {
      parentUuid: dirData.parentUuid,
    });

    const nameExists = existingDirs.goalDirs.some((dir) => dir.toDTO().name === dirData.name);
    if (nameExists) {
      throw new Error('目录名称在当前层级下已存在');
    }

    const dirDTO: GoalContracts.GoalDirDTO = {
      ...dirData,
      uuid: '',
      lifecycle: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'active' as GoalContracts.GoalDirStatus,
      },
    };
    const dirEntity = GoalDir.fromDTO(dirDTO);
    const savedDirEntity = await this.goalRepository.saveGoalDirectory(userAccountUuid, dirEntity);
    const createdDir = savedDirEntity.toDTO();

    const response: GoalDirResponse = {
      ...createdDir,
      goalsCount: 0,
    };

    return response;
  }

  async getGoalDirs(queryParams: any, accountUuid?: string): Promise<GoalDirListResponse> {
    const userAccountUuid = accountUuid || 'temp-account-uuid';

    const params = {
      parentUuid: queryParams.parentUuid,
      limit: parseInt(queryParams.limit) || 100,
      offset: parseInt(queryParams.offset) || 0,
    };

    const result = await this.goalRepository.getAllGoalDirectories(userAccountUuid, {
      parentUuid: params.parentUuid,
    });

    const goalDirsWithCount = await Promise.all(
      result.goalDirs.map(async (dirEntity) => {
        const dirDTO = dirEntity.toDTO();
        const goals = await this.goalRepository.getGoalsByDirectoryUuid(
          userAccountUuid,
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

  async getGoalDirById(uuid: string, accountUuid?: string): Promise<GoalDirResponse | null> {
    const userAccountUuid = accountUuid || 'temp-account-uuid';

    const dirEntity = await this.goalRepository.getGoalDirectoryByUuid(userAccountUuid, uuid);
    if (!dirEntity) {
      return null;
    }

    const dir = dirEntity.toDTO();
    const goals = await this.goalRepository.getGoalsByDirectoryUuid(userAccountUuid, dir.uuid);

    return {
      ...dir,
      goalsCount: goals.length,
    };
  }

  async updateGoalDir(
    uuid: string,
    request: UpdateGoalDirRequest,
    accountUuid?: string,
  ): Promise<GoalDirResponse> {
    const userAccountUuid = accountUuid || 'temp-account-uuid';

    const existingDir = await this.goalRepository.getGoalDirectoryByUuid(userAccountUuid, uuid);
    if (!existingDir) {
      throw new Error('目录不存在');
    }

    if (request.name !== undefined && !request.name.trim()) {
      throw new Error('目录名称不能为空');
    }

    if (request.icon !== undefined && !request.icon.trim()) {
      throw new Error('图标不能为空');
    }

    if (request.color !== undefined && !request.color.trim()) {
      throw new Error('颜色不能为空');
    }

    if (request.parentUuid !== undefined && request.parentUuid) {
      const parentDir = await this.goalRepository.getGoalDirectoryByUuid(
        userAccountUuid,
        request.parentUuid,
      );
      if (!parentDir) {
        throw new Error('父目录不存在');
      }

      if (request.parentUuid === uuid) {
        throw new Error('不能将目录设置为自己的父目录');
      }
    }

    if (request.name && request.name !== existingDir.name) {
      const existingDirs = await this.goalRepository.getAllGoalDirectories(userAccountUuid, {
        parentUuid: request.parentUuid !== undefined ? request.parentUuid : existingDir.parentUuid,
      });

      const nameExists = existingDirs.goalDirs.some(
        (dir) => dir.name === request.name!.trim() && dir.uuid !== uuid,
      );
      if (nameExists) {
        throw new Error('目录名称在当前层级下已存在');
      }
    }

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

    const updatedDirEntity = GoalDir.fromDTO(updatedDirDTO);
    const savedDir = await this.goalRepository.saveGoalDirectory(userAccountUuid, updatedDirEntity);

    const goals = await this.goalRepository.getGoalsByDirectoryUuid(userAccountUuid, savedDir.uuid);

    return {
      ...savedDir.toDTO(),
      goalsCount: goals.length,
    };
  }

  async deleteGoalDir(uuid: string, accountUuid?: string): Promise<void> {
    const userAccountUuid = accountUuid || 'temp-account-uuid';

    const existingDir = await this.goalRepository.getGoalDirectoryByUuid(userAccountUuid, uuid);
    if (!existingDir) {
      throw new Error('目录不存在');
    }

    const subDirs = await this.goalRepository.getAllGoalDirectories(userAccountUuid, {
      parentUuid: uuid,
    });
    if (subDirs.goalDirs.length > 0) {
      throw new Error('无法删除目录，请先删除或移动子目录');
    }

    const goals = await this.goalRepository.getGoalsByDirectoryUuid(userAccountUuid, uuid);
    if (goals.length > 0) {
      throw new Error(`无法删除目录，还有 ${goals.length} 个目标在使用此目录`);
    }

    const deleted = await this.goalRepository.deleteGoalDirectory(userAccountUuid, uuid);
    if (!deleted) {
      throw new Error('删除目录失败');
    }
  }
}
