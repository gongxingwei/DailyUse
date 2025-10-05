<!--
  实时通知显示组件
  处理来自调度系统的实时通知显示和用户交互
-->
<template>
    <v-container v-if="hasActiveNotifications" class="notification-container pa-4">
        <!-- 通知头部 -->
        <div class="d-flex align-center justify-between mb-3">
            <h3 class="text-h6">
                <v-icon class="mr-2">mdi-bell</v-icon>
                实时通知
                <v-chip v-if="notifications.length > 0" size="small" class="ml-2">
                    {{ notifications.length }}
                </v-chip>
            </h3>
            <div class="d-flex align-center">
                <v-btn v-if="notifications.length > 1" variant="text" size="small" @click="markAllAsRead">
                    全部标记为已读
                </v-btn>
                <v-btn variant="text" size="small" icon="mdi-close" @click="hideAllNotifications" />
            </div>
        </div>

        <!-- 通知列表 -->
        <v-expansion-panels v-if="notifications.length > 0" class="notification-panels">
            <v-expansion-panel v-for="notification in notifications" :key="notification.id"
                :class="['notification-panel', `notification-${notification.type}`]">
                <v-expansion-panel-title>
                    <div class="d-flex align-center w-100">
                        <v-icon :color="getNotificationColor(notification.type)" class="mr-3">
                            {{ getNotificationIcon(notification.type) }}
                        </v-icon>
                        <div class="flex-grow-1">
                            <div class="text-subtitle-2">{{ notification.title }}</div>
                            <div class="text-caption text-grey">
                                {{ formatTime(notification.timestamp) }}
                            </div>
                        </div>
                        <v-chip :color="getNotificationColor(notification.type)" size="small" variant="tonal">
                            {{ getNotificationTypeText(notification.type) }}
                        </v-chip>
                    </div>
                </v-expansion-panel-title>

                <v-expansion-panel-text>
                    <div class="notification-content">
                        <!-- 通知消息 -->
                        <p class="mb-3">{{ notification.message }}</p>

                        <!-- 执行详情 -->
                        <v-card v-if="notification.executionDetails" variant="outlined" class="mb-3">
                            <v-card-text>
                                <div class="text-subtitle-2 mb-2">执行详情</div>
                                <div class="d-flex flex-wrap gap-2">
                                    <v-chip size="small" variant="outlined">
                                        任务: {{ notification.executionDetails.taskName }}
                                    </v-chip>
                                    <v-chip size="small" variant="outlined">
                                        状态: {{ notification.executionDetails.status }}
                                    </v-chip>
                                    <v-chip v-if="notification.executionDetails.duration" size="small"
                                        variant="outlined">
                                        耗时: {{ notification.executionDetails.duration }}ms
                                    </v-chip>
                                </div>
                                <div v-if="notification.executionDetails.error" class="mt-2">
                                    <div class="text-caption text-error">错误信息:</div>
                                    <code class="text-error">{{ notification.executionDetails.error }}</code>
                                </div>
                            </v-card-text>
                        </v-card>

                        <!-- 操作按钮 -->
                        <div class="d-flex flex-wrap gap-2">
                            <v-btn size="small" variant="outlined" @click="markAsRead(notification.id)">
                                标记为已读
                            </v-btn>

                            <v-btn v-if="notification.type === 'TASK_EXECUTION'" size="small" variant="outlined"
                                color="primary" @click="viewTaskDetails(notification)">
                                查看任务
                            </v-btn>

                            <v-btn v-if="notification.type === 'SCHEDULE_ERROR'" size="small" variant="outlined"
                                color="warning" @click="retryExecution(notification)">
                                重试执行
                            </v-btn>

                            <v-btn v-if="notification.type === 'REMINDER'" size="small" variant="outlined" color="info"
                                @click="snoozeReminder(notification)">
                                稍后提醒
                            </v-btn>
                        </div>
                    </div>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>

        <!-- 空状态 -->
        <v-card v-else variant="outlined" class="text-center pa-6">
            <v-icon size="64" color="grey-lighten-2">mdi-bell-off</v-icon>
            <div class="text-h6 mt-2">暂无通知</div>
            <div class="text-body-2 text-grey">系统会在这里显示实时通知</div>
        </v-card>
    </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { scheduleWebApplicationService } from '../../application/services/ScheduleWebApplicationService'
import { eventBus } from '@dailyuse/utils'

// 通知类型接口
interface NotificationData {
    id: string
    type: 'TASK_EXECUTION' | 'SCHEDULE_ERROR' | 'REMINDER' | 'SYSTEM'
    title: string
    message: string
    timestamp: string
    read: boolean
    executionDetails?: {
        taskId?: string
        taskName?: string
        status?: string
        duration?: number
        error?: string
    }
    actionData?: any
}

// 响应式数据
const notifications = ref<NotificationData[]>([])
const sseConnection = ref<EventSource | null>(null)
const connectionStatus = ref<'connecting' | 'connected' | 'disconnected'>('disconnected')

// 计算属性
const hasActiveNotifications = computed(() => notifications.value.length > 0)

// SSE 连接管理
const connectSSE = async () => {
    try {
        connectionStatus.value = 'connecting'

        // 使用 notification 模块的 SSE 客户端
        // SSE 连接由 NotificationInitializationManager 管理
        // 这里只需要监听事件即可
        console.log('SSE 连接由 Notification 模块管理')
        connectionStatus.value = 'connected'
        
        // 不需要创建新的 EventSource，使用现有的 eventBus
        // 监听 Schedule 模块的事件
        eventBus.on('schedule:task-executed', (data: any) => {
            handleSSEMessage(data)
        })
        
        eventBus.on('reminder-triggered', (data: any) => {
            handleSSEMessage(data)
        })
    } catch (error) {
        console.error('建立 SSE 连接失败:', error)
        connectionStatus.value = 'disconnected'
    }
}

// 处理 SSE 消息
const handleSSEMessage = (data: any) => {
    const notification: NotificationData = {
        id: `notif-${Date.now()}-${Math.random()}`,
        type: mapEventTypeToNotificationType(data.type || data.eventType),
        title: data.title || getDefaultTitle(data.type),
        message: data.message || data.data?.message || '收到新的调度事件',
        timestamp: new Date().toISOString(),
        read: false,
        executionDetails: data.executionDetails || data.data,
        actionData: data
    }

    // 添加到通知列表
    notifications.value.unshift(notification)

    // 限制通知数量
    if (notifications.value.length > 50) {
        notifications.value = notifications.value.slice(0, 50)
    }

    // 显示桌面通知（如果支持）
    showDesktopNotification(notification)
}

// 映射事件类型到通知类型
const mapEventTypeToNotificationType = (eventType: string): NotificationData['type'] => {
    const typeMap: Record<string, NotificationData['type']> = {
        'task-executed': 'TASK_EXECUTION',
        'task-failed': 'SCHEDULE_ERROR',
        'schedule-error': 'SCHEDULE_ERROR',
        'reminder-triggered': 'REMINDER',
        'system-event': 'SYSTEM'
    }
    return typeMap[eventType] || 'SYSTEM'
}

// 获取默认标题
const getDefaultTitle = (eventType: string): string => {
    const titleMap: Record<string, string> = {
        'task-executed': '任务执行完成',
        'task-failed': '任务执行失败',
        'schedule-error': '调度错误',
        'reminder-triggered': '提醒通知',
        'system-event': '系统通知'
    }
    return titleMap[eventType] || '新通知'
}

// 获取通知图标
const getNotificationIcon = (type: NotificationData['type']): string => {
    const iconMap: Record<NotificationData['type'], string> = {
        'TASK_EXECUTION': 'mdi-check-circle',
        'SCHEDULE_ERROR': 'mdi-alert-circle',
        'REMINDER': 'mdi-bell-ring',
        'SYSTEM': 'mdi-information'
    }
    return iconMap[type]
}

// 获取通知颜色
const getNotificationColor = (type: NotificationData['type']): string => {
    const colorMap: Record<NotificationData['type'], string> = {
        'TASK_EXECUTION': 'success',
        'SCHEDULE_ERROR': 'error',
        'REMINDER': 'info',
        'SYSTEM': 'primary'
    }
    return colorMap[type]
}

// 获取通知类型文本
const getNotificationTypeText = (type: NotificationData['type']): string => {
    const textMap: Record<NotificationData['type'], string> = {
        'TASK_EXECUTION': '任务执行',
        'SCHEDULE_ERROR': '调度错误',
        'REMINDER': '提醒',
        'SYSTEM': '系统'
    }
    return textMap[type]
}

// 格式化时间
const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) { // 小于1分钟
        return '刚刚'
    } else if (diff < 3600000) { // 小于1小时
        return `${Math.floor(diff / 60000)} 分钟前`
    } else if (diff < 86400000) { // 小于1天
        return `${Math.floor(diff / 3600000)} 小时前`
    } else {
        return date.toLocaleString('zh-CN')
    }
}

// 显示桌面通知
const showDesktopNotification = (notification: NotificationData) => {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id
        })
    }
}

// 请求通知权限
const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission()
    }
}

// 操作方法
const markAsRead = (notificationId: string) => {
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
        notification.read = true
    }
}

const markAllAsRead = () => {
    notifications.value.forEach(n => n.read = true)
}

const hideAllNotifications = () => {
    notifications.value = []
}

const viewTaskDetails = (notification: NotificationData) => {
    // 跳转到任务详情页面或打开任务详情对话框
    const taskId = notification.executionDetails?.taskId
    if (taskId) {
        console.log('查看任务详情:', taskId)
        // 这里可以实现具体的跳转逻辑
    }
}

const retryExecution = async (notification: NotificationData) => {
    try {
        const taskId = notification.executionDetails?.taskId
        if (taskId) {
            await scheduleWebApplicationService.executeScheduleTask(taskId)
            console.log('重试执行成功')
        }
    } catch (error) {
        console.error('重试执行失败:', error)
    }
}

const snoozeReminder = (notification: NotificationData) => {
    // 实现稍后提醒功能
    setTimeout(() => {
        // 重新添加提醒
        const snoozeNotification: NotificationData = {
            ...notification,
            id: `snooze-${Date.now()}`,
            timestamp: new Date().toISOString(),
            title: `[延期提醒] ${notification.title}`,
            read: false
        }
        notifications.value.unshift(snoozeNotification)
    }, 5 * 60 * 1000) // 5分钟后重新提醒

    // 标记当前提醒为已读
    markAsRead(notification.id)
}

// 生命周期
onMounted(async () => {
    await requestNotificationPermission()
    await connectSSE()
})

onUnmounted(() => {
    if (sseConnection.value) {
        sseConnection.value.close()
        sseConnection.value = null
    }
})
</script>

<style scoped>
.notification-container {
    max-width: 600px;
    margin: 0 auto;
}

.notification-panels {
    max-height: 70vh;
    overflow-y: auto;
}

.notification-panel {
    margin-bottom: 8px;
}

.notification-panel.notification-TASK_EXECUTION {
    border-left: 4px solid var(--v-success-base);
}

.notification-panel.notification-SCHEDULE_ERROR {
    border-left: 4px solid var(--v-error-base);
}

.notification-panel.notification-REMINDER {
    border-left: 4px solid var(--v-info-base);
}

.notification-panel.notification-SYSTEM {
    border-left: 4px solid var(--v-primary-base);
}

.notification-content {
    padding: 16px 0;
}

code {
    background-color: #f5f5f5;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.875rem;
}
</style>