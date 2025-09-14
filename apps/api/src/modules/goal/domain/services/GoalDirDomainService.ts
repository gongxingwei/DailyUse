import type { GoalContracts } from '@dailyuse/contracts';
import { PrismaClient } from '@prisma/client';
import type { IGoalRepository } from '@dailyuse/domain-server';
import { PrismaGoalRepository } from '../../infrastructure/repositories/prismaGoalRepository.js';

type CreateGoalDirRequest = GoalContracts.CreateGoalDirRequest;
type UpdateGoalDirRequest = GoalContracts.UpdateGoalDirRequest;
type GoalDirResponse = GoalContracts.GoalDirResponse;
type GoalDirListResponse = GoalContracts.GoalDirListResponse;

export class GoalDirDomainService {
  private goalRepository: IGoalRepository;

  constructor() {
    const prisma = new PrismaClient();
    this.goalRepository = new PrismaGoalRepository(prisma);
  }

  /**
   * 创建目标目录
   */
  async createGoalDir(
    request: CreateGoalDirRequest,
    accountUuid?: string,
  ): Promise<GoalDirResponse> {
    // 获取用户UUID（从请求上下文或参数）
    const userAccountUuid = accountUuid || 'temp-account-uuid'; // 待实现认证中间件后从 req.user 获取

    // 验证请求数据
    if (!request.name?.trim()) {
      throw new Error('目录名称不能为空');
    }

    if (!request.icon?.trim()) {
      throw new Error('图标不能为空');
    }

    if (!request.color?.trim()) {
      throw new Error('颜色不能为空');
    }

    // 设置默认值
    const dirData: Omit<GoalContracts.GoalDirDTO, 'uuid' | 'lifecycle'> = {
      accountUuid: userAccountUuid,
      name: request.name.trim(),
      description: request.description?.trim() || '',
      icon: request.icon.trim(),
      color: request.color.trim(),
      parentUuid: request.parentUuid || undefined,
      sortConfig: request.sortConfig || {
        sortKey: 'createdAt',
        sortOrder: 0,
      },
    };

    // 验证父目录是否存在
    if (dirData.parentUuid) {
      const parentDir = await this.goalRepository.getGoalDirectoryByUuid(
        userAccountUuid,
        dirData.parentUuid,
      );
      if (!parentDir) {
        throw new Error('父目录不存在');
      }
    }

    // 验证目录名称唯一性（在同一层级下）
    const existingDirs = await this.goalRepository.getAllGoalDirectories(userAccountUuid, {
      parentUuid: dirData.parentUuid,
    });

    const nameExists = existingDirs.goalDirs.some((dir) => dir.name === dirData.name);
    if (nameExists) {
      throw new Error('目录名称在当前层级下已存在');
    }

    // 创建目录
    const createdDir = await this.goalRepository.createGoalDirectory(userAccountUuid, dirData);

    // 构造响应对象
    const response: GoalDirResponse = {
      ...createdDir,
      goalsCount: 0, // 新创建的目录没有目标
    };

    return response;
  }

  /**
   * 获取目标目录列表
   */
  async getGoalDirs(queryParams: any, accountUuid?: string): Promise<GoalDirListResponse> {
    // 获取用户UUID
    const userAccountUuid = accountUuid || 'temp-account-uuid';

    // 处理查询参数
    const params = {
      parentUuid: queryParams.parentUuid,
      limit: parseInt(queryParams.limit) || 100,
      offset: parseInt(queryParams.offset) || 0,
    };

    // 获取目录列表
    const result = await this.goalRepository.getAllGoalDirectories(userAccountUuid, {
      parentUuid: params.parentUuid,
    });

    // 为每个目录计算目标数量
    const goalDirsWithCount = await Promise.all(
      result.goalDirs.map(async (dir) => {
        const goals = await this.goalRepository.getGoalsByDirectoryUuid(userAccountUuid, dir.uuid);
        return {
          ...dir,
          goalsCount: goals.length,
        } as GoalDirResponse;
      }),
    );

    return {
      goalDirs: goalDirsWithCount,
      total: result.total,
    };
  }

  /**
   * 根据ID获取目标目录
   */
  async getGoalDirById(uuid: string, accountUuid?: string): Promise<GoalDirResponse | null> {
    // 获取用户UUID
    const userAccountUuid = accountUuid || 'temp-account-uuid';

    const dir = await this.goalRepository.getGoalDirectoryByUuid(userAccountUuid, uuid);
    if (!dir) {
      return null;
    }

    // 计算目标数量
    const goals = await this.goalRepository.getGoalsByDirectoryUuid(userAccountUuid, dir.uuid);

    return {
      ...dir,
      goalsCount: goals.length,
    };
  }

  /**
   * 更新目标目录
   */
  async updateGoalDir(
    uuid: string,
    request: UpdateGoalDirRequest,
    accountUuid?: string,
  ): Promise<GoalDirResponse> {
    // 获取用户UUID
    const userAccountUuid = accountUuid || 'temp-account-uuid';

    // 验证目录是否存在
    const existingDir = await this.goalRepository.getGoalDirectoryByUuid(userAccountUuid, uuid);
    if (!existingDir) {
      throw new Error('目录不存在');
    }

    // 验证请求数据
    if (request.name !== undefined && !request.name.trim()) {
      throw new Error('目录名称不能为空');
    }

    if (request.icon !== undefined && !request.icon.trim()) {
      throw new Error('图标不能为空');
    }

    if (request.color !== undefined && !request.color.trim()) {
      throw new Error('颜色不能为空');
    }

    // 验证父目录是否存在（如果要更新父目录）
    if (request.parentUuid !== undefined && request.parentUuid) {
      const parentDir = await this.goalRepository.getGoalDirectoryByUuid(
        userAccountUuid,
        request.parentUuid,
      );
      if (!parentDir) {
        throw new Error('父目录不存在');
      }

      // 防止循环引用
      if (request.parentUuid === uuid) {
        throw new Error('不能将目录设置为自己的父目录');
      }
    }

    // 验证名称唯一性（如果更新了名称）
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

    // 构造更新数据
    const updateData: Partial<GoalContracts.GoalDirDTO> = {};
    if (request.name !== undefined) updateData.name = request.name.trim();
    if (request.description !== undefined) updateData.description = request.description.trim();
    if (request.icon !== undefined) updateData.icon = request.icon.trim();
    if (request.color !== undefined) updateData.color = request.color.trim();
    if (request.parentUuid !== undefined) updateData.parentUuid = request.parentUuid;
    if (request.sortConfig !== undefined) updateData.sortConfig = request.sortConfig;

    // 更新目录
    const updatedDir = await this.goalRepository.updateGoalDirectory(
      userAccountUuid,
      uuid,
      updateData,
    );

    // 计算目标数量
    const goals = await this.goalRepository.getGoalsByDirectoryUuid(
      userAccountUuid,
      updatedDir.uuid,
    );

    return {
      ...updatedDir,
      goalsCount: goals.length,
    };
  }

  /**
   * 删除目标目录
   */
  async deleteGoalDir(uuid: string, accountUuid?: string): Promise<void> {
    // 获取用户UUID
    const userAccountUuid = accountUuid || 'temp-account-uuid';

    // 验证目录是否存在
    const existingDir = await this.goalRepository.getGoalDirectoryByUuid(userAccountUuid, uuid);
    if (!existingDir) {
      throw new Error('目录不存在');
    }

    // 检查是否有子目录
    const subDirs = await this.goalRepository.getAllGoalDirectories(userAccountUuid, {
      parentUuid: uuid,
    });
    if (subDirs.goalDirs.length > 0) {
      throw new Error('无法删除目录，请先删除或移动子目录');
    }

    // 检查是否有目标在使用此目录
    const goals = await this.goalRepository.getGoalsByDirectoryUuid(userAccountUuid, uuid);
    if (goals.length > 0) {
      throw new Error(`无法删除目录，还有 ${goals.length} 个目标在使用此目录`);
    }

    // 删除目录
    const deleted = await this.goalRepository.deleteGoalDirectory(userAccountUuid, uuid);
    if (!deleted) {
      throw new Error('删除目录失败');
    }
  }
}
