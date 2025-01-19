import { defineStore } from 'pinia'

export interface Repo {
  title: string        // 仓库名称
  path: string         // 仓库路径
  createTime: string   // 创建时间
  updateTime: string   // 更新时间
  description?: string // 仓库描述
  lastVisitTime?: string
}

export const useRepoStore = defineStore('repo', {
  state: () => ({
    repos: [] as Repo[],
    recentRepos: [] as string[]  // 存储最近访问的仓库标题
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
    },

    addToRecent(title: string) {
      // 移除已存在的记录（如果有）
      this.recentRepos = this.recentRepos.filter(t => t !== title)
      // 添加到开头
      this.recentRepos.unshift(title)
      // 只保留最近的5个
      this.recentRepos = this.recentRepos.slice(0, 5)
      
      // 更新仓库的访问时间
      const repo = this.repos.find(r => r.title === title)
      if (repo) {
        repo.lastVisitTime = new Date().toISOString()
      }
    },
    
    getRecentRepos() {
      return this.recentRepos
        .map(title => this.repos.find(r => r.title === title))
        .filter(Boolean) as Repo[]
    }
  },

  getters: {
    getRepoByTitle: (state) => (title: string) => {
      return state.repos.find(repo => repo.title === title)
    }
  },

  persist: true
})
