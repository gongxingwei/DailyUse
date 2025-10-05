<template>
    <v-container>
        <v-card class="mb-6">
            <v-card-title>
                <v-icon start>mdi-link-variant</v-icon>
                模块集成
            </v-card-title>
            <v-card-text>
                <v-row>
                    <v-col cols="12" md="4">
                        <v-card variant="outlined" color="primary">
                            <v-card-title class="text-center">
                                <v-icon start>mdi-format-list-checks</v-icon>
                                任务模块
                            </v-card-title>
                            <v-card-text>
                                <v-list density="compact">
                                    <v-list-item v-for="task in scheduledTasks" :key="task.uuid" :title="task.name"
                                        :subtitle="`类型: ${task.taskType}`">
                                        <template #append>
                                            <v-chip :color="task.status === 'PENDING' ? 'warning' : task.status === 'COMPLETED' ? 'success' : 'error'"
                                                size="small">
                                                {{ task.enabled ? '启用' : '禁用' }}
                                            </v-chip>
                                        </template>
                                    </v-list-item>
                                </v-list>
                                <v-btn color="primary" variant="outlined" block class="mt-3"
                                    @click="showTaskIntegrationDialog = true">
                                    <v-icon start>mdi-plus</v-icon>
                                    创建任务调度
                                </v-btn>
                            </v-card-text>
                        </v-card>
                    </v-col>

                    <v-col cols="12" md="4">
                        <v-card variant="outlined" color="info">
                            <v-card-title class="text-center">
                                <v-icon start>mdi-bell</v-icon>
                                提醒模块
                            </v-card-title>
                            <v-card-text>
                                <v-list density="compact">
                                    <v-list-item v-for="reminder in scheduledReminders" :key="reminder.uuid"
                                        :title="reminder.name" :subtitle="`类型: ${reminder.taskType}`">
                                        <template #append>
                                            <v-chip :color="reminder.status === 'PENDING' ? 'warning' : reminder.status === 'COMPLETED' ? 'success' : 'error'"
                                                size="small">
                                                {{ reminder.enabled ? '启用' : '禁用' }}
                                            </v-chip>
                                        </template>
                                    </v-list-item>
                                </v-list>
                                <v-btn color="info" variant="outlined" block class="mt-3"
                                    @click="showReminderIntegrationDialog = true">
                                    <v-icon start>mdi-plus</v-icon>
                                    创建提醒调度
                                </v-btn>
                            </v-card-text>
                        </v-card>
                    </v-col>

                    <v-col cols="12" md="4">
                        <v-card variant="outlined" color="success">
                            <v-card-title class="text-center">
                                <v-icon start>mdi-chart-timeline-variant</v-icon>
                                执行统计
                            </v-card-title>
                            <v-card-text>
                                <v-row>
                                    <v-col cols="6">
                                        <div class="text-center">
                                            <div class="text-h4 text-success">{{ totalExecutions }}</div>
                                            <div class="text-caption">总执行次数</div>
                                        </div>
                                    </v-col>
                                    <v-col cols="6">
                                        <div class="text-center">
                                            <div class="text-h4 text-primary">{{ todayExecutions }}</div>
                                            <div class="text-caption">今日执行</div>
                                        </div>
                                    </v-col>
                                </v-row>
                                <v-divider class="my-3" />
                                <div class="text-center">
                                    <v-chip color="success" size="small" class="mx-1">
                                        成功: {{ successExecutions }}
                                    </v-chip>
                                    <v-chip color="error" size="small" class="mx-1">
                                        失败: {{ failedExecutions }}
                                    </v-chip>
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- 最近执行记录 - 暂时禁用，等待后端 API 实现 -->
        <!--
        <v-card>
            <v-card-title>
                <v-icon start>mdi-history</v-icon>
                最近执行记录
            </v-card-title>
            <v-card-text>
                <v-alert type="info" text="执行记录功能开发中，敬请期待" />
            </v-card-text>
        </v-card>
        -->

        <!-- 任务集成对话框 -->
        <v-dialog v-model="showTaskIntegrationDialog" max-width="600">
            <v-card>
                <v-card-title>创建任务调度</v-card-title>
                <v-card-text>
                    <v-form ref="taskForm" v-model="taskFormValid">
                        <v-text-field v-model="taskIntegrationForm.name" label="调度名称" :rules="[rules.required]" />
                        <v-textarea v-model="taskIntegrationForm.description" label="描述" rows="2" />
                        <v-select v-model="taskIntegrationForm.taskType" :items="taskTypes" item-title="label"
                            item-value="value" label="任务类型" :rules="[rules.required]" />
                        <v-text-field v-model="taskIntegrationForm.cronExpression" label="Cron 表达式"
                            :rules="[rules.required]" hint="例如: 0 9 * * * (每天9点)" />
                    </v-form>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="showTaskIntegrationDialog = false">取消</v-btn>
                    <v-btn color="primary" :disabled="!taskFormValid" @click="createTaskSchedule">
                        创建
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- 提醒集成对话框 -->
        <v-dialog v-model="showReminderIntegrationDialog" max-width="600">
            <v-card>
                <v-card-title>创建提醒调度</v-card-title>
                <v-card-text>
                    <v-form ref="reminderForm" v-model="reminderFormValid">
                        <v-text-field v-model="reminderIntegrationForm.name" label="调度名称" :rules="[rules.required]" />
                        <v-textarea v-model="reminderIntegrationForm.description" label="描述" rows="2" />
                        <v-select v-model="reminderIntegrationForm.reminderType" :items="reminderTypes"
                            item-title="label" item-value="value" label="提醒类型" :rules="[rules.required]" />
                        <v-text-field v-model="reminderIntegrationForm.cronExpression" label="Cron 表达式"
                            :rules="[rules.required]" hint="例如: 0 */30 * * * (每30分钟)" />
                    </v-form>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="showReminderIntegrationDialog = false">取消</v-btn>
                    <v-btn color="primary" :disabled="!reminderFormValid" @click="createReminderSchedule">
                        创建
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { scheduleWebApplicationService } from '../../application/services/ScheduleWebApplicationService'
import type { ScheduleTaskResponseDto, ScheduleExecutionResultResponseDto } from '@dailyuse/contracts/modules/schedule'
import { taskScheduleIntegrationService, type TaskInfo, type TaskScheduleConfig } from '@/modules/task/services/taskScheduleIntegrationService'
import { reminderScheduleIntegrationService, type ReminderInfo } from '@/modules/reminder/services/reminderScheduleIntegrationService'

// 数据状态
const loading = ref(false)
const scheduledTasks = ref<ScheduleTaskResponseDto[]>([])
const scheduledReminders = ref<ScheduleTaskResponseDto[]>([])
const recentExecutions = ref<ScheduleExecutionResultResponseDto[]>([])
const totalExecutions = ref(0)
const todayExecutions = ref(0)
const successExecutions = ref(0)
const failedExecutions = ref(0)

// 对话框状态
const showTaskIntegrationDialog = ref(false)
const showReminderIntegrationDialog = ref(false)

// 表单状态
const taskFormValid = ref(false)
const reminderFormValid = ref(false)

// 表单数据
const taskIntegrationForm = ref({
    name: '',
    description: '',
    taskType: 'DAILY_TASK_GENERATION',
    cronExpression: '0 0 * * *'
})

const reminderIntegrationForm = ref({
    name: '',
    description: '',
    reminderType: 'SCHEDULED_NOTIFICATION',
    cronExpression: '0 */30 * * *'
})

// 验证规则
const rules = {
    required: (v: any) => !!v || '此字段为必填项'
}

// 任务类型选项
const taskTypes = [
    { label: '每日任务生成', value: 'DAILY_TASK_GENERATION' },
    { label: '任务状态检查', value: 'TASK_STATUS_CHECK' },
    { label: '任务完成提醒', value: 'TASK_COMPLETION_REMINDER' },
    { label: '任务数据清理', value: 'TASK_DATA_CLEANUP' }
]

// 提醒类型选项
const reminderTypes = [
    { label: '定时通知', value: 'SCHEDULED_NOTIFICATION' },
    { label: '休息提醒', value: 'BREAK_REMINDER' },
    { label: '健康提醒', value: 'HEALTH_REMINDER' },
    { label: '会议提醒', value: 'MEETING_REMINDER' }
]

// 执行记录表格头
const executionHeaders = [
    { title: '任务名称', key: 'taskName', align: 'start' as const },
    { title: '类型', key: 'taskType', align: 'center' as const },
    { title: '状态', key: 'status', align: 'center' as const },
    { title: '执行时间', key: 'executedAt', align: 'center' as const },
    { title: '操作', key: 'actions', align: 'center' as const, sortable: false }
]

// 辅助函数
const getTaskTypeColor = (type: string) => {
    const colors: Record<string, string> = {
        DAILY_TASK_GENERATION: 'primary',
        TASK_STATUS_CHECK: 'info',
        TASK_COMPLETION_REMINDER: 'warning',
        TASK_DATA_CLEANUP: 'secondary',
        SCHEDULED_NOTIFICATION: 'success',
        BREAK_REMINDER: 'orange',
        HEALTH_REMINDER: 'green',
        MEETING_REMINDER: 'purple'
    }
    return colors[type] || 'grey'
}

const getTaskTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
        DAILY_TASK_GENERATION: 'mdi-format-list-checks',
        TASK_STATUS_CHECK: 'mdi-clipboard-check',
        TASK_COMPLETION_REMINDER: 'mdi-bell-alert',
        TASK_DATA_CLEANUP: 'mdi-broom',
        SCHEDULED_NOTIFICATION: 'mdi-bell',
        BREAK_REMINDER: 'mdi-coffee',
        HEALTH_REMINDER: 'mdi-heart',
        MEETING_REMINDER: 'mdi-calendar-account'
    }
    return icons[type] || 'mdi-cog'
}

const getTaskTypeName = (type: string) => {
    const names: Record<string, string> = {
        DAILY_TASK_GENERATION: '每日任务生成',
        TASK_STATUS_CHECK: '任务状态检查',
        TASK_COMPLETION_REMINDER: '任务完成提醒',
        TASK_DATA_CLEANUP: '任务数据清理',
        SCHEDULED_NOTIFICATION: '定时通知',
        BREAK_REMINDER: '休息提醒',
        HEALTH_REMINDER: '健康提醒',
        MEETING_REMINDER: '会议提醒'
    }
    return names[type] || type
}

const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
}

// 业务方法
const loadIntegrationData = async () => {
    loading.value = true
    try {
        // 加载调度任务
        const result = await scheduleWebApplicationService.getScheduleTasks()
        const tasks = result.tasks || []
        scheduledTasks.value = tasks.filter((task: ScheduleTaskResponseDto) =>
            task.taskType.includes('TASK') || task.taskType.includes('DAILY')
        )
        scheduledReminders.value = tasks.filter((task: ScheduleTaskResponseDto) =>
            task.taskType.includes('REMINDER') || task.taskType.includes('NOTIFICATION')
        )

        // TODO: 后端实现 getScheduleExecutions API 后再加载执行统计
        // 目前使用任务数据作为替代
        recentExecutions.value = []
        totalExecutions.value = tasks.reduce((sum, task) => sum + (task.executionCount || 0), 0)
        todayExecutions.value = 0
        successExecutions.value = tasks.filter(task => task.status === 'COMPLETED').length
        failedExecutions.value = tasks.filter(task => task.status === 'FAILED').length

        // 检查任务调度集成状态
        console.log('任务调度集成服务状态:', {
            hasService: !!taskScheduleIntegrationService,
            scheduledTasksCount: scheduledTasks.value.length,
            scheduledRemindersCount: scheduledReminders.value.length
        })
    } catch (error) {
        console.error('加载集成数据失败:', error)
    } finally {
        loading.value = false
    }
}

const createTaskSchedule = async () => {
    try {
        // 创建示例任务信息
        const sampleTask: TaskInfo = {
            id: `task-${Date.now()}`,
            name: taskIntegrationForm.value.name,
            description: taskIntegrationForm.value.description,
            scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明天这个时间
            scheduleConfig: taskScheduleIntegrationService.createDefaultScheduleConfig()
        }

        // 使用任务调度集成服务创建调度
        const result = await taskScheduleIntegrationService.createTaskSchedule(sampleTask)

        if (result.success) {
            console.log('任务调度创建成功:', result)
            showTaskIntegrationDialog.value = false
            // 重置表单
            taskIntegrationForm.value = {
                name: '',
                description: '',
                taskType: 'DAILY_TASK_GENERATION',
                cronExpression: '0 0 * * *'
            }
            // 重新加载数据
            await loadIntegrationData()
        } else {
            console.error('任务调度创建失败:', result.message)
        }
    } catch (error) {
        console.error('创建任务调度失败:', error)
    }
}

const createReminderSchedule = async () => {
    try {
        // 创建示例提醒信息
        const sampleReminder: ReminderInfo = {
            id: `reminder-${Date.now()}`,
            title: reminderIntegrationForm.value.name,
            content: reminderIntegrationForm.value.description,
            scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明天这个时间
            reminderType: 'DAILY',
            priority: 'MEDIUM'
        }

        // 使用提醒调度集成服务创建调度
        const result = await reminderScheduleIntegrationService.createReminderSchedule(sampleReminder)

        if (result.success) {
            console.log('提醒调度创建成功:', result)
            showReminderIntegrationDialog.value = false
            // 重置表单
            reminderIntegrationForm.value = {
                name: '',
                description: '',
                reminderType: 'DAILY_REMINDER',
                cronExpression: '0 9 * * *'
            }
            // 重新加载数据
            await loadIntegrationData()
        } else {
            console.error('提醒调度创建失败:', result.message)
        }
    } catch (error) {
        console.error('创建提醒调度失败:', error)
    }
}

const viewExecutionDetails = (execution: ScheduleExecutionResultResponseDto) => {
    console.log('查看执行详情:', execution)
    // TODO: 实现执行详情查看
}

// 生命周期
onMounted(async () => {
    await loadIntegrationData()
})
</script>

<style scoped>
.v-card-title {
    background-color: rgba(var(--v-theme-surface-variant), 0.3);
}
</style>