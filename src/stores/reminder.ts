import { defineStore } from 'pinia'

export interface ReminderPlan {
  id: number
  title: string
  message: string
  interval: number  // 间隔时间（分钟）
  enabled: boolean
  lastTriggerTime?: string
}

export interface ReminderMessage {
  id: number
  title: string
  message: string
  timestamp: string
  read: boolean
}

export const useReminderStore = defineStore('reminder', {
  state: () => ({
    plans: [] as ReminderPlan[],
    messageQueue: [] as ReminderMessage[],
    popupCreated: false
  }),

  actions: {
    addPlan(plan: Omit<ReminderPlan, 'id'>) {
      const newPlan = {
        id: Date.now(),
        ...plan
      }
      this.plans.push(newPlan)
    },

    updatePlan(plan: ReminderPlan) {
      const index = this.plans.findIndex(p => p.id === plan.id)
      if (index !== -1) {
        this.plans[index] = plan
      }
    },

    deletePlan(id: number) {
      this.plans = this.plans.filter(p => p.id !== id)
    },

    updateLastTriggerTime(id: number) {
      const plan = this.plans.find(p => p.id === id)
      if (plan) {
        plan.lastTriggerTime = new Date().toISOString()
      }
    },

    // 添加新提醒消息到队列
    addMessage(title: string, message: string) {
      const newMessage: ReminderMessage = {
        id: Date.now(),
        title,
        message,
        timestamp: new Date().toISOString(),
        read: false
      }
      this.messageQueue.push(newMessage)
      console.log('添加消息成功，消息ID:', newMessage.id)
      
      // 如果弹窗还没创建，先创建弹窗
      if (!this.popupCreated) {
        window.electron.ipcRenderer.send('newPopup');
        this.popupCreated = true;
      }
      
      return newMessage.id
    },

    // 获取最新的未读消息
    getLatestUnreadMessage(): ReminderMessage | null {
      const unreadMessage = this.messageQueue.find(msg => !msg.read)
      console.log('未读消息:', unreadMessage)
      return unreadMessage || null
    },

    // 标记消息为已读
    markMessageAsRead(id: number) {
      const message = this.messageQueue.find(msg => msg.id === id)
      if (message) {
        message.read = true
      }
    },

    // 清理已读消息（可选）
    clearReadMessages() {
      this.messageQueue = this.messageQueue.filter(msg => !msg.read)
    },

    // 设置弹窗状态
    setPopupCreated(created: boolean) {
      this.popupCreated = created;
    }
  },

  persist: true
})