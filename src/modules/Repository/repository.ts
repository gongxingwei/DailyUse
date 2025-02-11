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
        recentRepositories: [] as string[],
    }),

    getters: {
        getRepositoryByTitle: (state) => (title: string) => {
            return state.repositories.find(repo => repo.title === title);
        }
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
            this.recentRepositories = this.recentRepositories.filter(t => t !== title);
            this.recentRepositories.unshift(title);
            this.recentRepositories = this.recentRepositories.slice(0, 5);

            const repository = this.repositories.find(repo => repo.title === title);
            if (repository) {
                repository.lastVisitTime = new Date().toISOString();
            }
        },

        getRecentRepositories() {
            return this.recentRepositories.map(title => this.repositories.find(repo => repo.title === title));
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
        }
    },

    persist: true

})