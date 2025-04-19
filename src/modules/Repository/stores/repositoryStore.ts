import { defineStore } from "pinia";

export interface Repository {
    title: string;
    path: string;
    description?: string;
    createTime: string;
    updateTime: string;
    lastVisitTime?: string;
}



export const useRepositoryStore = defineStore("repository", {
    state: () => ({
        repositories: [] as Repository[],
        recentRepositories: [] as Repository[],
    }),

    getters: {
        getRepositoryByTitle: (state) => (title: string) => {
            return state.repositories.find(repo => repo.title === title);
        },

    },

    actions: {
        addRepository(repository: Omit<Repository, "createTime" | "updateTime">) {
            const newRepository: Repository = {
                ...repository,
                createTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            };
            if (this.repositories.some(repo => repo.title === repository.title)) {
                throw new Error("Repository already exists");
            }
            this.repositories.push(newRepository);
        },

        addToRecent(title: string) {
            const repository = this.repositories.find(repo => repo.title === title)
            if (!repository) return
            // 更新访问时间
            repository.lastVisitTime = new Date().toISOString()
            // 从最近列表中移除该仓库（如果存在）
            const index = this.recentRepositories.findIndex(repo => repo.title === title)
            if (index !== -1) {
                this.recentRepositories.splice(index, 1)
            }
            // 添加到最近列表开头
            this.recentRepositories.unshift(repository)
            // 保持最近列表不超过 5 个
            if (this.recentRepositories.length > 5) {
                this.recentRepositories.pop()
            }
        },

        getRecentRepositories() {
            return this.recentRepositories;
        },

        removeRepository(title: string) {
            const index = this.repositories.findIndex(repo => repo.title === title);
            if (index > -1) {
                this.repositories.splice(index, 1);
            }
        },

        updateRepository(repository: Repository) {
            const index = this.repositories.findIndex(repo => repo.title === repository.title);
            if (index > -1) {
                this.repositories[index] = repository;
            }
        },

        currentRepositoryPath() {
            const currentRepo = this.repositories.find(
                repository => repository.title === window.location.hash.split('/').pop()
            );
            return currentRepo?.path || '';
        },
        // 更新仓库访问时间
        updateRepoLastVisitTime(title: string) {
            const repository = this.repositories.find(repo => repo.title === title);
            if (repository) {
                repository.lastVisitTime = new Date().toISOString();
            }
        }
    },

    persist: true

})