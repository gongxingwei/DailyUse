import { defineStore } from "pinia";
import { useUserStore } from "@/modules/Account/composables/useUserStore";

export type Repository = {
    title: string;
    path: string;
    description?: string;
    createTime: string;
    updateTime: string;
    lastVisitTime?: string;
    relativeGoalId?: string;
}

type RepositoryState = {
    repositories: Repository[];
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
        async initialize() {
            const { loadUserData } = useUserStore<RepositoryState>('repository');
            const data = await loadUserData();
            if (data) {
                this.$patch(data);
            }
        },
        async saveState() {
            const { saveUserData } = useUserStore<RepositoryState>('repository');
            await saveUserData(this.$state);
        },
        // 添加仓库
        addRepository(repository: Omit<Repository, "createTime" | "updateTime">) {
            const newRepository: Repository = {
                ...repository,
                createTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            };
            if (this.repositories.some(repo => repo.title === repository.title)) {
                throw new Error("Repository title already exists");
            }
            this.repositories.push(newRepository);
            this.saveState();
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

        removeRepository(title: string) {
            const index = this.repositories.findIndex(repo => repo.title === title);
            if (index > -1) {
                this.repositories.splice(index, 1);
            }
            this.saveState();
        },

        updateRepository(repository: Repository) {
            const index = this.repositories.findIndex(repo => repo.title === repository.title);
            if (index > -1) {
                this.repositories[index] = repository;
            }
            this.saveState();
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
            if (!repository) {// 防止问题：刷新可能会导致仓库数据还没加载就调用了这个方法，导致数据清空
                // throw new Error("Repository not found");
                return
            }
            if (repository) {
                repository.lastVisitTime = new Date().toISOString();
            }
            this.saveState();
        }
    },
})