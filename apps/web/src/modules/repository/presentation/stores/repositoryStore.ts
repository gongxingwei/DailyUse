import { defineStore } from "pinia";

import { IRepository } from "../../domain/types";
import { Repository } from "../../domain/aggregates/repository";

export const useRepositoryStore = defineStore("Repository", {
  state: () => ({
    repositories: [] as Repository[],
  }),

  getters: {
    getRepositoryByName: (state) => (name: string) => {
      return state.repositories.find((repo) => repo.name === name);
    },
    // 获取关联指定目标的仓库
    getRelativeRepoBygoalUuid: (state) => (goalUuid: string) => {
      const repos = state.repositories.filter((repo) => {
        repo.relatedGoals?.includes(goalUuid);
      });
      if (!repos || repos.length === 0) {
        return [];
      }
      return repos;
    },
  },

  actions: {
    async addRepository(repository: Repository) {
      if (this.repositories.some((repo) => repo.name === Repository.name)) {
        throw new Error("Repository name already exists");
      }

      this.repositories.push(repository);
    },

    async removeRepository(name: string) {
      const index = this.repositories.findIndex((repo) => repo.name === name);
      if (index > -1) {
        this.repositories.splice(index, 1);
      }
      return false;
    },

    async removeRepositoryById(repositoryId: string) {
      const index = this.repositories.findIndex(
        (repo) => repo.uuid === repositoryId
      );
      if (index > -1) {
        this.repositories.splice(index, 1);
        return true;
      }
      return false;
    },

    async getRepositoryById(repositoryId: string): Promise<Repository | null> {
      const repository = this.repositories.find(
        (repo) => repo.uuid === repositoryId
      );
      if (repository) {
        return this.ensureRepositoryObject(repository);
      }
      return null;
    },

    async updateRepository(Repository: Repository): Promise<void> {
      const index = this.repositories.findIndex(
        (repo) => repo.name === Repository.name
      );
      if (index > -1) {
        this.repositories[index] = Repository;
      }
    },

    currentRepositoryPath() {
      const currentRepo = this.repositories.find(
        (Repository) =>
          Repository.name === window.location.hash.split("/").pop()
      );
      return currentRepo?.path || "";
    },
    ensureRepositoryObject(repository: IRepository): Repository {
      if (Repository.isRepository(repository)) {
        return repository;
      } else {
        return Repository.fromDTO(repository);
      }
    },
  },
});
