import { ipcMain } from "electron";
import { getRepositoryApplicationService } from "../../application/services/repositoryApplicationService";
import { Repository } from "../../domain/aggregates/repository";

const service = getRepositoryApplicationService();

export class RepositoryIpcHandler {
  constructor() {}

  static registerHandlers() {
    ipcMain.handle("repository:add", async (_event, repositoryDTO) => {
      const repository = Repository.fromDTO(repositoryDTO);
      await service.add(repository);
      return { success: true };
    });

    ipcMain.handle("repository:update", async (_event, repositoryDTO) => {
      const repository = Repository.fromDTO(repositoryDTO);
      await service.update(repository);
      return { success: true };
    });

    ipcMain.handle("repository:remove", async (_event, id) => {
      await service.remove(id);
      return { success: true };
    });

    ipcMain.handle("repository:findById", async (_event, id) => {
      const repo = await service.findById(id);
      return repo ? repo.toDTO() : null;
    });

    ipcMain.handle("repository:findAll", async () => {
      const repositories = await service.findAll();
      return repositories.map(repo => repo.toDTO());
    });
  }
}
