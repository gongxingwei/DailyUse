import { ipcMain } from "electron";
import { RepositoryApplicationService } from "../../application/services/repositoryApplicationService";
import { Repository } from "../../domain/aggregates/repository";
import { withAuth } from '@electron/modules/Authentication/application/services/authTokenService';

const service = RepositoryApplicationService.getRepositoryApplicationService();

export class RepositoryIpcHandler {
  constructor() {}

  static registerHandlers() {
    ipcMain.handle("repository:add", withAuth(async (_event, [repositoryDTO], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录', data: null };
      }
      try {
        const repository = Repository.fromDTO(repositoryDTO);
        await service.add(auth.accountUuid, repository);
        return { success: true, message: '仓库添加成功', data: repository.toDTO() };
      } catch (error: any) {
        return { success: false, message: error?.message || '仓库添加失败', data: null };
      }
    }));

    ipcMain.handle("repository:update", withAuth(async (_event, [repositoryDTO], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录', data: null };
      }
      try {
        const repository = Repository.fromDTO(repositoryDTO);
        await service.update(auth.accountUuid, repository);
        return { success: true, message: '仓库更新成功', data: repository.toDTO() };
      } catch (error: any) {
        return { success: false, message: error?.message || '仓库更新失败', data: null };
      }
    }));

    ipcMain.handle("repository:remove", withAuth(async (_event, [uuid], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录', data: null };
      }
      try {
        await service.remove(auth.accountUuid, uuid);
        return { success: true, message: '仓库删除成功', data: uuid };
      } catch (error: any) {
        return { success: false, message: error?.message || '仓库删除失败', data: null };
      }
    }));

    ipcMain.handle("repository:findById", withAuth(async (_event, [uuid], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录', data: null };
      }
      try {
        const repo = await service.findById(auth.accountUuid, uuid);
        return {
          success: !!repo,
          message: repo ? '仓库获取成功' : '未找到仓库',
          data: repo ? repo.toDTO() : null
        };
      } catch (error: any) {
        return { success: false, message: error?.message || '仓库获取失败', data: null };
      }
    }));

    ipcMain.handle("repository:findAll", withAuth(async (_event, [], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录', data: null };
      }
      try {
        const repositories = await service.findAll(auth.accountUuid);
        const repositoryDTOs = repositories.map(repo => repo.toDTO());
        console.log("【Repository 模块的状态同步】已完成:", repositoryDTOs);
        return {
          success: true,
          message: '仓库列表获取成功',
          data: repositoryDTOs
        };
      } catch (error: any) {
        return { success: false, message: error?.message || '仓库列表获取失败', data: null };
      }
    }));
  }
}