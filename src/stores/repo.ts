import { defineStore } from 'pinia'

export interface Repo {
  title: string        // 仓库名称
  path: string         // 仓库路径
  createTime: string   // 创建时间
  updateTime: string   // 更新时间
  description?: string // 仓库描述
}

export const useRepoStore = defineStore('repo', {
  state: () => ({
    repos: [] as Repo[]
  }),

  actions: {
    addRepo(repo: Omit<Repo, 'createTime' | 'updateTime'>) {
      const newRepo: Repo = {
        ...repo,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString()
      }
      if (this.repos.some(r => r.title === repo.title)) {
        throw new Error('仓库名已存在')
      }
      this.repos.push(newRepo)
    }
  },

  getters: {
    getRepoByTitle: (state) => (title: string) => {
      return state.repos.find(repo => repo.title === title)
    }
  },

  persist: true
})
