import { defineStore } from 'pinia'

export interface Goal {
  id: number
  title: string
  mainDocPath: string    // 主文档路径
  notePath: string       // 次要文档路径
  mainDocContent: string // 主文档内容
  noteContent: string    // 次要文档内容
  createTime: string
  updateTime: string
}

export const useGoalStore = defineStore('goal', {
  state: () => ({
    goals: [
      {
        id: 1,
        title: '学习Vue3',
        mainDocPath: 'vue3.md',
        notePath: 'vue3-note.md',
        createTime: '2024-01-20T08:00:00.000Z',
        updateTime: '2024-01-20T08:00:00.000Z'
      },
      {
        id: 2,
        title: 'TypeScript 进阶',
        mainDocPath: 'typescript.md',
        notePath: 'typescript-note.md',
        createTime: '2024-01-20T09:00:00.000Z',
        updateTime: '2024-01-20T09:00:00.000Z'
      }
    ] as Goal[],
    currentGoal: null as Goal | null
  }),

  actions: {
    async loadGoal(id: number) {
      const goal = this.goals.find(g => g.id === id)
      if (goal) {
        this.currentGoal = { ...goal }
        // 继续加载文档内容
      }
    },

    async updateMainDoc(content: string) {
      if (this.currentGoal) {
        try {
          await window.electron.writeFile(this.currentGoal.mainDocPath, content)
          this.currentGoal.mainDocContent = content
          this.currentGoal.updateTime = new Date().toISOString()
        } catch (error) {
          console.error('Failed to save main document:', error)
        }
      }
    },

    async updateGoalSettings(goal: Goal) {
      const index = this.goals.findIndex(g => g.id === goal.id)
      if (index !== -1) {
        this.goals[index] = goal
        // 保存到本地存储
        localStorage.setItem('goals', JSON.stringify(this.goals))
        console.log('Goal updated:', goal)
      }
    },

    async deleteGoal(id: number) {
      this.goals = this.goals.filter(g => g.id !== id)
      this.currentGoal = null
      localStorage.setItem('goals', JSON.stringify(this.goals))
    },

    async updateNote(content: string) {
      if (this.currentGoal) {
        await window.electron.writeFile(this.currentGoal.notePath, content)
        this.currentGoal.noteContent = content
        this.currentGoal.updateTime = new Date().toISOString()
      }
    }
  }
})
