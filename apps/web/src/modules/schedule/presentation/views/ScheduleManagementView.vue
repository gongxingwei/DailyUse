<template>
    <v-container fluid class="schedule-management">
        <!-- 页面标题 -->
        <div class="d-flex align-center justify-space-between mb-6">
            <div>
                <v-tabs-window>
                    <!-- 集成标签页 -->
                    <v-tabs-window-item value="integration">
                        <ScheduleIntegrationPanel />
                    </v-tabs-window-item>

                    <!-- 实时通知标签页 -->
                    <v-tabs-window-item value="notifications">
                        <RealtimeNotificationPanel />
                    </v-tabs-window-item>
                </v-tabs-window>
                <h1 class="text-h4 font-weight-bold">调度管理</h1>
                <p class="text-body-1 text-medium-emphasis mt-1">管理和监控自动化任务调度</p>
            </div>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog" size="large">
                创建调度任务
            </v-btn>
        </div>

        <!-- 标签页导航 -->
        <v-card class="mb-6">
            <v-tabs v-model="activeTab" bg-color="transparent" color="primary">
                <v-tab value="overview">
                    <v-icon start>mdi-view-dashboard</v-icon>
                    概览
                </v-tab>
                <v-tab value="tasks">
                    <v-icon start>mdi-format-list-checks</v-icon>
                    任务管理
                </v-tab>
                <v-tab value="integration">
                    <v-icon start>mdi-link-variant</v-icon>
                    模块集成
                </v-tab>
                <v-tab value="notifications">
                    <v-icon start>mdi-bell</v-icon>
                    实时通知
                </v-tab>
            </v-tabs>
        </v-card>

        <!-- 标签页内容 -->
        <v-tabs-window v-model="activeTab">
            <!-- 概览标签页 -->
            <v-tabs-window-item value="overview">
                <!-- 统计卡片 -->
                <v-row class="mb-6">
                    <v-col cols="12" sm="6" md="3">
                        <v-card class="text-center pa-4">
                            <v-icon color="primary" size="40" class="mb-2">mdi-clock-outline</v-icon>
                            <div class="text-h5 font-weight-bold">{{ statistics.total }}</div>
                            <div class="text-body-2 text-medium-emphasis">总任务数</div>
                        </v-card>
                    </v-col>
                    <v-col cols="12" sm="6" md="3">
                        <v-card class="text-center pa-4">
                            <v-icon color="success" size="40" class="mb-2">mdi-play-circle</v-icon>
                            <div class="text-h5 font-weight-bold">{{ statistics.enabled }}</div>
                            <div class="text-body-2 text-medium-emphasis">启用中</div>
                        </v-card>
                    </v-col>
                    <v-col cols="12" sm="6" md="3">
                        <v-card class="text-center pa-4">
                            <v-icon color="warning" size="40" class="mb-2">mdi-pause-circle</v-icon>
                            <div class="text-h5 font-weight-bold">{{ statistics.disabled }}</div>
                            <div class="text-body-2 text-medium-emphasis">已禁用</div>
                        </v-card>
                    </v-col>
                    <v-col cols="12" sm="6" md="3">
                        <v-card class="text-center pa-4">
                            <v-icon color="info" size="40" class="mb-2">mdi-calendar-clock</v-icon>
                            <div class="text-h5 font-weight-bold">{{ statistics.upcoming }}</div>
                            <div class="text-body-2 text-medium-emphasis">即将执行</div>
                        </v-card>
                    </v-col>
                </v-row>

                <!-- 实时连接状态 -->
                <v-card class="mb-6" :color="connectionStatus.connected ? 'success' : 'error'">
                    <v-card-text class="d-flex align-center">
                        <v-icon :color="connectionStatus.connected ? 'white' : 'white'" class="mr-3">
                            {{ connectionStatus.connected ? 'mdi-wifi' : 'mdi-wifi-off' }}
                        </v-icon>
                        <div>
                            <div class="font-weight-bold">
                                {{ connectionStatus.connected ? '实时连接正常' : '实时连接中断' }}
                            </div>
                            <div class="text-body-2" style="opacity: 0.8">
                                {{ connectionStatus.connected ? '正在接收调度事件' : `重连尝试:
                                ${connectionStatus.reconnectAttempts}` }}
                            </div>
                        </div>
                        <v-spacer></v-spacer>
                        <v-btn v-if="!connectionStatus.connected" variant="outlined" color="white" @click="reconnectSSE"
                            :loading="reconnecting">
                            重新连接
                        </v-btn>
                    </v-card-text>
                </v-card>
            </v-tabs-window-item>

            <!-- 任务管理标签页 -->
            <v-tabs-window-item value="tasks">
                <!-- 过滤和搜索 -->
                <v-card class="mb-6">
                    <v-card-text>
                        <v-row>
                            <v-col cols="12" md="4">
                                <v-text-field v-model="searchQuery" label="搜索任务" prepend-inner-icon="mdi-magnify"
                                    variant="outlined" density="compact" clearable />
                            </v-col>
                            <v-col cols="12" md="3">
                                <v-select v-model="statusFilter" :items="statusOptions" label="状态筛选" variant="outlined"
                                    density="compact" clearable />
                            </v-col>
                            <v-col cols="12" md="3">
                                <v-select v-model="priorityFilter" :items="priorityOptions" label="优先级筛选"
                                    variant="outlined" density="compact" clearable />
                            </v-col>
                            <v-col cols="12" md="2">
                                <v-btn @click="refreshTasks" color="primary" variant="outlined" block
                                    :loading="loading">
                                    刷新
                                </v-btn>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>

                <!-- 任务列表 -->
                <v-card>
                    <v-card-title class="d-flex align-center">
                        <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
                        调度任务列表
                        <v-spacer></v-spacer>
                        <v-chip v-if="filteredTasks.length > 0" color="primary" variant="outlined">
                            {{ filteredTasks.length }} 个任务
                        </v-chip>
                    </v-card-title>

                    <v-divider></v-divider>

                    <v-list v-if="filteredTasks.length > 0" class="pa-0">
                        <template v-for="(task, index) in filteredTasks" :key="task.id">
                            <v-list-item class="px-4 py-3">
                                <v-list-item-title class="d-flex align-center">
                                    <v-icon :color="getTaskStatusColor(task)" class="mr-3">
                                        {{ getTaskIcon(task) }}
                                    </v-icon>
                                    <span class="font-weight-bold">{{ task.name }}</span>
                                </v-list-item-title>

                                <v-list-item-subtitle class="mt-2">
                                    <div class="text-body-2">{{ task.description || '无描述' }}</div>
                                    <div class="d-flex align-center mt-2">
                                        <v-chip size="small" :color="getTaskStatusColor(task)" variant="outlined">
                                            {{ getTaskStatusText(task) }}
                                        </v-chip>
                                        <span class="text-caption text-medium-emphasis ml-2">
                                            下次执行: {{ formatNextExecution(task.nextExecutionTime) }}
                                        </span>
                                    </div>
                                </v-list-item-subtitle>

                                <template #append>
                                    <div class="d-flex align-center">
                                        <v-btn :color="task.status === 'ACTIVE' ? 'warning' : 'success'"
                                            :icon="task.status === 'ACTIVE' ? 'mdi-pause' : 'mdi-play'" variant="text"
                                            size="small" @click="toggleTask(task)"></v-btn>
                                        <v-btn color="primary" icon="mdi-pencil" variant="text" size="small"
                                            @click="editTask(task)"></v-btn>
                                        <v-btn color="error" icon="mdi-delete" variant="text" size="small"
                                            @click="deleteTask(task)"></v-btn>
                                    </div>
                                </template>
                            </v-list-item>
                            <v-divider v-if="index < filteredTasks.length - 1"></v-divider>
                        </template>
                    </v-list>

                    <v-card-text v-else class="text-center py-8">
                        <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-calendar-clock</v-icon>
                        <div class="text-h6 text-medium-emphasis">暂无调度任务</div>
                        <div class="text-body-2 text-medium-emphasis mt-2">点击上方按钮创建您的第一个调度任务</div>
                    </v-card-text>
                </v-card>
            </v-tabs-window-item>

            <!-- 模块集成标签页 -->
            <v-tabs-window-item value="integration">
                <ScheduleIntegrationPanel />
            </v-tabs-window-item>

            <!-- 实时通知标签页 -->
            <v-tabs-window-item value="notifications">
                <RealtimeNotificationPanel />
            </v-tabs-window-item>
        </v-tabs-window>

        <!-- 任务创建/编辑对话框 -->
        <ScheduleTaskDialog v-model="dialogVisible" :task="selectedTask || {}" @saved="onTaskSaved" />

        <!-- 删除确认对话框 -->
        <v-dialog v-model="deleteDialogVisible" max-width="400">
            <v-card>
                <v-card-title>确认删除</v-card-title>
                <v-card-text>
                    您确定要删除调度任务 "{{ taskToDelete?.name }}" 吗？此操作无法撤销。
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="deleteDialogVisible = false">取消</v-btn>
                    <v-btn color="error" @click="confirmDelete" :loading="deleting">删除</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import ScheduleTaskDialog from '../components/ScheduleTaskDialog.vue'
import ScheduleIntegrationPanel from '../components/ScheduleIntegrationPanel.vue'
import RealtimeNotificationPanel from '../components/RealtimeNotificationPanel.vue'
import { scheduleWebApplicationService } from '../../application/services/ScheduleWebApplicationService'
import type { ScheduleTaskApi } from '@dailyuse/contracts/modules/schedule'
import { sseClient } from '@/modules/notification/infrastructure/sse/SSEClient'
import { eventBus } from '@dailyuse/utils'

// 数据状态
const activeTab = ref('overview')
const loading = ref(false)
const reconnecting = ref(false)
const deleting = ref(false)
const tasks = ref<ScheduleTaskApi[]>([])
const searchQuery = ref('')
const statusFilter = ref(null)
const priorityFilter = ref(null)

// 对话框状态
const dialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const selectedTask = ref<ScheduleTaskApi | null>(null)
const taskToDelete = ref<ScheduleTaskApi | null>(null)

// 连接状态
const connectionStatus = ref({
    connected: false,
    reconnectAttempts: 0,
})

// 选择选项
const statusOptions = [
    { title: '启用中', value: 'ACTIVE' },
    { title: '已暂停', value: 'PAUSED' },
]

const priorityOptions = [
    { title: '高优先级', value: 'HIGH' },
    { title: '中优先级', value: 'MEDIUM' },
    { title: '低优先级', value: 'LOW' },
]

// 计算属性
const statistics = computed(() => ({
    total: tasks.value.length,
    enabled: tasks.value.filter(t => t.status === 'ACTIVE').length,
    disabled: tasks.value.filter(t => t.status === 'PAUSED').length,
    upcoming: tasks.value.filter(t => t.status === 'ACTIVE' && t.nextExecutionTime && new Date(t.nextExecutionTime) > new Date()).length,
}))

const filteredTasks = computed(() => {
    let filtered = [...tasks.value]

    // 搜索过滤
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(task =>
            task.name.toLowerCase().includes(query) ||
            (task.description && task.description.toLowerCase().includes(query))
        )
    }

    // 状态过滤
    if (statusFilter.value) {
        filtered = filtered.filter(task => task.status === statusFilter.value)
    }

    // 优先级过滤
    if (priorityFilter.value) {
        filtered = filtered.filter(task => task.priority === priorityFilter.value)
    }

    return filtered
})

// 业务方法
const loadTasks = async () => {
    loading.value = true
    try {
        const response = await scheduleWebApplicationService.getScheduleTasks()
        tasks.value = response.tasks || []
    } catch (error) {
        console.error('加载任务失败:', error)
        tasks.value = [] // 确保出错时也有默认值
    } finally {
        loading.value = false
    }
}

const refreshTasks = async () => {
    await loadTasks()
}

const updateConnectionStatus = () => {
    const status = sseClient.getStatus()
    connectionStatus.value.connected = status.connected
    connectionStatus.value.reconnectAttempts = status.reconnectAttempts
}

const reconnectSSE = async () => {
    reconnecting.value = true
    try {
        await sseClient.connect()
        updateConnectionStatus()
    } catch (error) {
        console.error('重连失败:', error)
    } finally {
        reconnecting.value = false
    }
}

const openCreateDialog = () => {
    selectedTask.value = null
    dialogVisible.value = true
}

const editTask = (task: ScheduleTaskApi) => {
    selectedTask.value = task
    dialogVisible.value = true
}

const toggleTask = async (task: ScheduleTaskApi) => {
    try {
        if (task.status === 'ACTIVE') {
            await scheduleWebApplicationService.pauseScheduleTask(task.id)
        } else {
            await scheduleWebApplicationService.enableScheduleTask(task.id)
        }
        await loadTasks()
    } catch (error) {
        console.error('切换任务状态失败:', error)
    }
}

const deleteTask = (task: ScheduleTaskApi) => {
    taskToDelete.value = task
    deleteDialogVisible.value = true
}

const confirmDelete = async () => {
    if (!taskToDelete.value) return

    deleting.value = true
    try {
        await scheduleWebApplicationService.deleteScheduleTask(taskToDelete.value.id)
        await loadTasks()
        deleteDialogVisible.value = false
        taskToDelete.value = null
    } catch (error) {
        console.error('删除任务失败:', error)
    } finally {
        deleting.value = false
    }
}

const onTaskSaved = async () => {
    await loadTasks()
    dialogVisible.value = false
    selectedTask.value = null
}

// 工具函数
const getTaskStatusColor = (task: ScheduleTaskApi) => {
    switch (task.status) {
        case 'ACTIVE': return 'success'
        case 'PAUSED': return 'warning'
        default: return 'grey'
    }
}

const getTaskStatusText = (task: ScheduleTaskApi) => {
    switch (task.status) {
        case 'ACTIVE': return '运行中'
        case 'PAUSED': return '已暂停'
        default: return '未知'
    }
}

const getTaskIcon = (task: ScheduleTaskApi) => {
    switch (task.taskType) {
        case 'GENERAL_REMINDER': return 'mdi-bell'
        case 'DAILY_TASK_GENERATION': return 'mdi-format-list-checks'
        case 'TASK_STATUS_CHECK': return 'mdi-clipboard-check'
        default: return 'mdi-cog'
    }
}

const formatNextExecution = (nextTime: string | undefined) => {
    if (!nextTime) return '未设置'
    const date = new Date(nextTime)
    const now = new Date()
    const diff = date.getTime() - now.getTime()

    if (diff < 0) return '已过期'
    if (diff < 60000) return '即将执行'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟后`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时后`

    return date.toLocaleString()
}

// 生命周期
onMounted(async () => {
    await loadTasks()
    updateConnectionStatus()

    // 定时更新连接状态
    const statusInterval = setInterval(updateConnectionStatus, 5000)

    // 监听 SSE 事件
    eventBus.on('sse:connected', () => {
        updateConnectionStatus()
    })

    eventBus.on('schedule:task-executed', (data) => {
        console.log('任务执行事件:', data)
        loadTasks() // 重新加载任务状态
    })

    // 清理函数
    onUnmounted(() => {
        clearInterval(statusInterval)
        eventBus.off('sse:connected')
        eventBus.off('schedule:task-executed')
    })
})
</script>

<style scoped>
.schedule-management {
    max-width: 1200px;
    margin: 0 auto;
}

.v-card {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.v-chip {
    font-weight: 500;
}
</style>