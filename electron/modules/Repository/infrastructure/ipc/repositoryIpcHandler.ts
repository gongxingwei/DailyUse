import { ipcMain } from "electron";
import { getRepositoryApplicationService } from "../../application/services/repositoryApplicationService";
import { Repository } from "../../domain/aggregates/repository";
import { withAuth } from '@electron/modules/Authentication/application/services/authTokenService';

const service = getRepositoryApplicationService();

export class RepositoryIpcHandler {
  constructor() {}

  static registerHandlers() {
    ipcMain.handle("repository:add", withAuth(async (_event, [repositoryDTO], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      const repository = Repository.fromDTO(repositoryDTO);
      await service.add(auth.accountUuid, repository);
      return { success: true };
    }));

    ipcMain.handle("repository:update", withAuth(async (_event, [repositoryDTO], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      const repository = Repository.fromDTO(repositoryDTO);
      await service.update(auth.accountUuid, repository);
      return { success: true };
    }));

    ipcMain.handle("repository:remove", withAuth(async (_event, [uuid], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      await service.remove(auth.accountUuid, uuid);
      return { success: true };
    }));

    ipcMain.handle("repository:findById", withAuth(async (_event, [uuid], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      const repo = await service.findById(auth.accountUuid, uuid);
      return repo ? repo.toDTO() : null;
    }));

    ipcMain.handle("repository:findAll", withAuth(async (_event, [], auth) => {
      if (!auth.accountUuid) {
        return { success: false, message: '未登录或登录已过期，请重新登录' };
      }
      const repositories = await service.findAll(auth.accountUuid);
      return repositories.map(repo => repo.toDTO());
    }));
  }
}
