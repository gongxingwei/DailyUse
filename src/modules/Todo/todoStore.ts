import { defineStore } from 'pinia'
import { scheduleService } from '@/shared/utils/schedule/main';
import type { TimeConfig, UrgencyLevel, AdvanceTime } from '@/shared/types/time';

export interface Todo {
  id: number
  title: string
  description: string
  timeConfig: TimeConfig
  completed: boolean
  urgency: UrgencyLevel
  needReminder: boolean
  advanceTime?: AdvanceTime
}

export interface TodoReminder {
  id: string
  title: string
  body: string
  timeConfig: TimeConfig
  urgency: UrgencyLevel
}

export const useTodoStore = defineStore('todo', {
  state: () => ({
    todos: [
      {
        id: 2,
        title: '团队会议',
        description: '讨论下周工作计划',
        completed: false,
        timeConfig: {
          mode: 'daily',
          dailyTime: '14:30'
        },
        urgency: 'critical',
        needReminder: true,
        advanceTime: {
          minutes: 15
        }
      }
    ] as Todo[],
    todoReminders: [] as TodoReminder[]
  }),
  persist: true,

  getters: {
    // 按日期分组获取任务
    getTodosByDate: (state) => (targetDate: Date) => {
      if (!state.todos) return [];
      const start = new Date(targetDate)
      start.setHours(0, 0, 0, 0)
      
      const end = new Date(targetDate)
      end.setHours(23, 59, 59, 999)

      return state.todos.filter(todo => {
        if (!todo.timeConfig) return false;
        if (todo.timeConfig.mode === 'once') {
          const todoDate = new Date(todo.timeConfig.timestamp!)
          return todoDate >= start && todoDate <= end
        }
        // 对于每日任务，检查时间是否在当天
        if (todo.timeConfig.mode === 'daily') {
          return true // 每日任务都显示
        }
        // 对于间隔任务，检查是否在当天时间范围内
        if (todo.timeConfig.mode === 'interval') {
          // 这里可以根据需求添加间隔任务的显示逻辑
          return true
        }
        return false
      })
    },

    getTodosBeforeToday: (state) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      return state.todos.filter(todo => {
        if (todo.timeConfig.mode === 'once') {
          const todoDate = new Date(todo.timeConfig.timestamp!)
          return todoDate < today
        }
        return false // 每日和间隔任务不计入过期任务
      })
    },

    getTodosAfter4Days: (state) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const fourDaysLater = new Date(today)
      fourDaysLater.setDate(today.getDate() + 4)

      return state.todos.filter(todo => {
        if (todo.timeConfig.mode === 'once') {
          const todoDate = new Date(todo.timeConfig.timestamp!)
          return todoDate > fourDaysLater
        }
        return false // 每日和间隔任务不计入未来任务
      })
    },

    getTodoById: (state) => (id: number) => {
      return state.todos.find(todo => todo.id === id)
    }
  },

  actions: {
    addTodo(todo: Omit<Todo, 'id'>) {
      const newTodo: Todo = {
        id: Date.now(),
        ...todo,
        needReminder: todo.needReminder ?? false
      }
      this.todos.push(newTodo)
      this.saveTodos()

      if (newTodo.needReminder) {
        beReminder(newTodo)
        this.addTodoReminder(formatTodoReminder(newTodo))
      }
    },
    
    saveTodos() {
      localStorage.setItem('todos', JSON.stringify(this.todos))
    },

    removeTodoById(id: number) {
      const index = this.todos.findIndex(todo => todo.id === id)
      if (index !== -1) {
        const todo = this.todos[index]
        this.todos.splice(index, 1)
        this.saveTodos()
        if (todo.needReminder) {
          cancelReminder(todo)
          this.removeTodoReminder(todo.id.toString())
        }
      }
    },

    updateTodo(todo: Todo) {
      const index = this.todos.findIndex(t => t.id === todo.id)
      if (index !== -1) {
        this.todos[index] = todo
        this.saveTodos()
      }
      if (todo.needReminder) {
        beReminder(todo)
      }
      else {
        cancelReminder(todo)
        this.removeTodoReminder(todo.id.toString())
      }
    },

    toggleComplete(todo: Todo) {
      if (todo) {
        todo.completed = !todo.completed
        this.saveTodos()
        if (todo.needReminder && todo.completed) {
          cancelReminder(todo)
          this.removeTodoReminder(todo.id.toString())
        } else if (todo.needReminder && !todo.completed) {
          beReminder(todo)
        }
      }
    },

    calculateAdvanceTime(todo: Todo): Date | null {
      if (!todo.needReminder || !todo.advanceTime) {
        return null;
      }

      let targetTime: Date;
      
      switch (todo.timeConfig.mode) {
        case 'once':
          targetTime = new Date(todo.timeConfig.timestamp!);
          break;
        case 'daily':
          targetTime = new Date();
          const [hours, minutes] = todo.timeConfig.dailyTime!.split(':');
          targetTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          break;
        case 'interval':
          // Handle interval case if needed
          return null;
        default:
          return null;
      }

      // Calculate milliseconds for advance time
      const advanceMs = (todo.advanceTime.hours || 0) * 3600000 +
                       (todo.advanceTime.minutes || 0) * 60000 +
                       (todo.advanceTime.seconds || 0) * 1000;

      return new Date(targetTime.getTime() - advanceMs);
    },
  
    addTodoReminder(todoReminder: TodoReminder) {
      this.todoReminders.push(todoReminder)
    },
    removeTodoReminder(id: string) {
      this.todoReminders = this.todoReminders.filter(reminder => reminder.id !== id)
    },

    async initializeTodoSchedules() {
      for (const todoReminder of this.todoReminders) {
        const cron = generateCronExpression(todoReminder.timeConfig);
        await scheduleTodoReminder(todoReminder, cron);
      }
    }
  }
})

export function formatAdvanceTime(advanceTime?: AdvanceTime): string {
  if (!advanceTime) return '无提前通知';
  
  const parts: string[] = [];
  if (advanceTime.hours) {
    parts.push(`${advanceTime.hours}小时`);
  }
  if (advanceTime.minutes) {
    parts.push(`${advanceTime.minutes}分钟`);
  }
  if (advanceTime.seconds) {
    parts.push(`${advanceTime.seconds}秒`);
  }
  
  return parts.length > 0 ? parts.join('') : '无提前通知';
}

// 将 todo 转化为 reminder 并调用 scheduleService 创建定时任务
function beReminder(todo: Todo) {
  const newTodoReminder = formatTodoReminder(todo);
  const newCronExpression = generateCronExpression(newTodoReminder.timeConfig);
  scheduleTodoReminder(newTodoReminder, newCronExpression);
}

async function cancelReminder(todo: Todo) {
  await scheduleService.cancelSchedule(todo.id.toString());
}

function formatTodoReminder(todo: Todo): TodoReminder {
  const todoReminder = {
    id: todo.id.toString(),
    title: todo.title, 
    body: todo.description,
    timeConfig: todo.timeConfig,
    urgency: todo.urgency
  }
  return todoReminder
}

function generateCronExpression(timeConfig: TimeConfig): string {
  switch (timeConfig.mode) {
    case 'once': {
      if (!timeConfig.timestamp) {
        throw new Error('Timestamp required for once mode');
      }
      const date = new Date(timeConfig.timestamp);
      return `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;
    }

    case 'daily': {
      if (!timeConfig.dailyTime) {
        throw new Error('Daily time required for daily mode');
      }
      const [hours, minutes] = timeConfig.dailyTime.split(':');
      return `${minutes} ${hours} * * *`;
    }

    case 'interval': {
      if (!timeConfig.interval) {
        throw new Error('Interval config required for interval mode');
      }
      const { value, unit } = timeConfig.interval;
      return unit === 'minutes' ? `*/${value} * * * *` : `0 */${value} * * *`;
    }

    default:
      throw new Error(`Invalid time mode: ${timeConfig.mode}`);
  }
}

async function scheduleTodoReminder(todoReminder: TodoReminder, cron: string) {
  try {;
    await scheduleService.createSchedule({
      id: todoReminder.id,
      cron,
      task: {
        type: 'REMINDER',
        payload: {
          title: todoReminder.title,
          body: todoReminder.body,
          urgency: todoReminder.urgency
        }
      }
    });
  } catch (error) {
    console.error('Failed to schedule reminder:', error);
    throw error;
  }
}