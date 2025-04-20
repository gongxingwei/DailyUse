import { defineStore } from "pinia";
import { useUserStore } from "@/modules/Account/composables/useUserStore";

export interface Repository {
    title: string;
    path: string;
    description?: string;
    createTime: string;
    updateTime: string;
    lastVisitTime?: string;
}

interface RepositoryState {
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
            if (repository) {
                repository.lastVisitTime = new Date().toISOString();
            }
            this.saveState();
        }
    },
})