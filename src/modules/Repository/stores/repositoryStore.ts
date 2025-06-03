import { defineStore } from "pinia";
import { useStoreSave } from "@/shared/composables/useStoreSave";

let autoSaveInstance: ReturnType<typeof useStoreSave> | null = null;

function getAutoSave() {
  if (!autoSaveInstance) {
    autoSaveInstance = useStoreSave({
      onSuccess: (storeName) => console.log(`✓ ${storeName} 数据保存成功`),
      onError: (storeName, error) => console.error(`✗ ${storeName} 数据保存失败:`, error),
    });
  }
  return autoSaveInstance;
}

export type Repository = {
    title: string;
    path: string;
    description?: string;
    createTime: string;
    updateTime: string;
    lastVisitTime?: string;
    relativeGoalId?: string;
}

export const useRepositoryStore = defineStore("repository", {
    state: () => ({
        repositories: [] as Repository[],
    }),

    getters: {
        getRepositoryByTitle: (state) => (title: string) => {
            return state.repositories.find(repo => repo.title === title);
        },
        // 获取关联指定目标的仓库
        getRelativeRepoByGoalId: (state) => (goalId: string) => {
            let repos = state.repositories.filter(repo => repo.relativeGoalId === goalId);
            if (!repos || repos.length === 0) {
                return [];
            }
            return repos;
        },

    },

    actions: {

        async addRepository(repository: Omit<Repository, "createTime" | "updateTime">) {
            const newRepository: Repository = {
                ...repository,
                createTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            };
            
            if (this.repositories.some(repo => repo.title === repository.title)) {
                throw new Error("Repository title already exists");
            }
            
            this.repositories.push(newRepository);
            
            // 自动保存
            const saveSuccess = await this.saveRepositories();
            if (!saveSuccess) {
                console.error('仓库添加后保存失败');
            }
        },

        // 获取最近访问的仓库（最多5个）
        getRecentRepositories() {
            const repositories = this.repositories;
            if (!repositories || repositories.length === 0) {
                return [];
            }
            const recentRepo = repositories
                .filter((repo: Repository) => repo.lastVisitTime)
                .sort((a: Repository, b: Repository) => {
                    const timeA: string = a.lastVisitTime || '';
                    const timeB: string = b.lastVisitTime || '';
                    return timeB.localeCompare(timeA);
                })
                .slice(0, 5);
            return recentRepo;
        },

        async removeRepository(title: string) {
            const index = this.repositories.findIndex(repo => repo.title === title);
            if (index > -1) {
                this.repositories.splice(index, 1);
                
                // 自动保存
                const saveSuccess = await this.saveRepositories();
                if (!saveSuccess) {
                    console.error('仓库删除后保存失败');
                }
                return true;
            }
            return false;
        },

        async updateRepository(repository: Repository) {
            const index = this.repositories.findIndex(repo => repo.title === repository.title);
            if (index > -1) {
                this.repositories[index] = repository;
                
                // 自动保存
                const saveSuccess = await this.saveRepositories();
                if (!saveSuccess) {
                    console.error('仓库更新后保存失败');
                }
                return true;
            }
            return false;
        },

        currentRepositoryPath() {
            const currentRepo = this.repositories.find(
                repository => repository.title === window.location.hash.split('/').pop()
            );
            return currentRepo?.path || '';
        },
        // 更新仓库访问时间
        async updateRepoLastVisitTime(title: string) {
            const repository = this.repositories.find(repo => repo.title === title);
            if (!repository) {
                // 防止问题：刷新可能会导致仓库数据还没加载就调用了这个方法，导致数据清空
                return;
            }
            
            repository.lastVisitTime = new Date().toISOString();
            
            // 自动保存
            const saveSuccess = await this.saveRepositories();
            if (!saveSuccess) {
                console.error('仓库访问时间更新后保存失败');
            }
        },

        async saveRepositories(): Promise<boolean> {
            const autoSave = getAutoSave();
            return autoSave.debounceSave('repositories', this.repositories);
        },

        async saveRepositoriesImmediately(): Promise<boolean> {
            const autoSave = getAutoSave();
            return autoSave.saveImmediately('repositories', this.repositories);
        },

        // 检查保存状态
        isSavingRepositories(): boolean {
            const autoSave = getAutoSave();
            return autoSave.isSaving('repositories');
        },
    },
})