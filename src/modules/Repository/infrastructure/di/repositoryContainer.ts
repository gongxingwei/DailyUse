
import { RepositoryStoreRepository } from "../repositories/repositoryStoreRepository";

export class RepositoryContainer {
    private static instance: RepositoryContainer;
    private repositoryStoreRepository = new RepositoryStoreRepository();

    private constructor() {}

    static getInstance(): RepositoryContainer {
        if (!RepositoryContainer.instance) {
            RepositoryContainer.instance = new RepositoryContainer();
        }
        return RepositoryContainer.instance;
    }

    /**
     * 获取 Repository Store 实例
     * Store 仅用于状态管理，不处理持久化
     */
    getRepositoryStore() {
        return this.repositoryStoreRepository;
    }

    /**
     * 重置容器（主要用于测试）
     */
    static reset(): void {
        RepositoryContainer.instance = undefined as any;
    }
}