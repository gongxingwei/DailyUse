import { Repository } from "../../domain/aggregates/repository";

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
        await window.shared.ipcRenderdr.invoke("repository:add", repository);
    }

    async updateRepository(repository: Repository): Promise<void> {
        await window.shared.ipcRenderdr.invoke("repository:update", repository);
    }

    async removeRepository(repositoryId: string): Promise<void> {
        await window.shared.ipcRenderdr.invoke("repository:remove", repositoryId);
    }

    async getRepositoryById(repositoryId: string): Promise<Repository | null> {
        return await window.shared.ipcRenderdr.invoke("repository:getById", repositoryId);
    }

    async findAllRepositories(): Promise<Repository[]> {
        const response = await window.shared.ipcRenderdr.invoke("repository:findAll");
        const repositories: Repository[] = [];
        if (response && response.length > 0) {
                for (const repo of response) {
                    repositories.push(Repository.fromDTO(repo));
                }
            }
        return repositories;
    }
}

export const repositoryIpcClient = RepositoryIpcClient.getInstance();