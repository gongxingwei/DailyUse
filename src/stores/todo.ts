import { defineStore } from 'pinia'

// src/stores/todo.ts
export interface Todo {
  id: number
  title: string
  content: string
  datetime: string
  completed: boolean
}

export const useTodoStore = defineStore('todo', {
  state: () => ({
    todos: [
      {
        id: 1,
        title: '完成项目文档',
        content: '编写项目技术文档和使用说明',
        completed: false,
        datetime: '2024-12-16T10:00:00.000Z'
      },
      {
        id: 2,
        title: '团队会议',
        content: '讨论下周工作计划',
        completed: false,
        datetime: '2024-12-17T14:30:00.000Z'
      }
    ] as Todo[]
  }),
  persist: true,

  getters: {
    // 按日期分组获取任务
    getTodosByDate: (state) => (targetDate: Date) => {
      const start = new Date(targetDate)
      start.setHours(0, 0, 0, 0)
      
      const end = new Date(targetDate)
      end.setHours(23, 59, 59, 999)

      return state.todos.filter(todo => {
        const todoDate = new Date(todo.datetime)
        return todoDate >= start && todoDate <= end
      })
    }
  },

  actions: {
    addTodo(todo: Omit<Todo, 'id'>) {
      const newTodo: Todo = {
        id: Date.now(),
        ...todo
      }
      this.todos.push(newTodo)
      this.saveTodos()
    },
    
    saveTodos() {
      localStorage.setItem('todos', JSON.stringify(this.todos))
    },

    updateTodo(todo: Todo) {
      const index = this.todos.findIndex(t => t.id === todo.id)
      if (index !== -1) {
        this.todos[index] = todo
        this.saveTodos()
      }
    },

    toggleComplete(todoId: number) {
      const todo = this.todos.find(t => t.id === todoId)
      if (todo) {
        todo.completed = !todo.completed
        this.saveTodos()
      }
    }
  }
})