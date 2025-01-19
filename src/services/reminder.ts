import { useReminderStore } from '../stores/reminder'

class ReminderService {
  private timers: Map<number, ReturnType<typeof setInterval>> = new Map()
  private store: ReturnType<typeof useReminderStore> | null = null

  startAll() {
    this.store = useReminderStore()
    if (!this.store) return

    this.store.plans.forEach(plan => {
      if (plan.enabled) {
        this.startTimer(plan.id)
      }
    })
  }

  startTimer(planId: number) {
    if (!this.store) return
    const plan = this.store.plans.find(p => p.id === planId)
    if (!plan || !plan.enabled) return

    // 清除已存在的定时器
    this.stopTimer(planId)

    const timer = setInterval(() => {
      this.showNotification(plan.title, plan.message)
      this.store?.updateLastTriggerTime(planId)
    }, plan.interval * 60 * 1000)

    this.timers.set(planId, timer)
  }

  stopTimer(planId: number) {
    const timer = this.timers.get(planId)
    if (timer) {
      clearInterval(timer)
      this.timers.delete(planId)
    }
  }

  private showNotification(title: string, message: string) {
    // 不再使用 IPC 通信，而是将消息添加到队列
    this.store?.addMessage(title, message)
    console.log("添加提醒消息到队列:", { title, message });
  }
}

export const reminderService = new ReminderService()