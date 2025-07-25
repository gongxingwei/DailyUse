import { Repository } from "../../domain/aggregates/repository";
import { ipcInvokeWithAuth } from "@/shared/utils/ipcInvokeWithAuth";

export class RepositoryIpcClient {
    private static instance: RepositoryIpcClient;

    private constructor() {}

    static getInstance(): RepositoryIpcClient {
        if (!RepositoryIpcClient.instance) {
            RepositoryIpcClient.instance = new RepositoryIpcClient();
        }
        return RepositoryIpcClient.instance;
    }

    async addRepository(repository: Repository): Promise<void> {
        const repositoryDTO = repository.toDTO();
        if (!repositoryDTO) {
            throw new Error("Invalid repository data");
        }
        const data = JSON.parse(JSON.stringify(repositoryDTO));
        await ipcInvokeWithAuth("repository:add", data);
    }

    async updateRepository(repository: Repository): Promise<void> {
        const repositoryDTO = repository.toDTO();
        if (!repositoryDTO) {
            throw new Error("Invalid repository data");
        }
        const data = JSON.parse(JSON.stringify(repositoryDTO));
        await ipcInvokeWithAuth("repository:update", data);
    }

    async removeRepository(repositoryId: string): Promise<void> {
        await ipcInvokeWithAuth("repository:remove", repositoryId);
    }

    async getRepositoryById(repositoryId: string): Promise<Repository | null> {
        const response = await ipcInvokeWithAuth("repository:getById", repositoryId);
        if (response && response.success && response.data) {
            return Repository.fromDTO(response.data);
        }
        return null;
    }

    async findAllRepositories(): Promise<Repository[]> {
        const response = await ipcInvokeWithAuth("repository:findAll");
        console.log("【Repository 模块的状态同步】开始", response);
        const repositories: Repository[] = [];
        if (response && response.success && Array.isArray(response.data)) {
            for (const repo of response.data) {
                repositories.push(Repository.fromDTO(repo));
            }
        }
        return repositories;
    }
}

export const repositoryIpcClient = RepositoryIpcClient.getInstance();