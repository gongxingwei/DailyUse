import { defineStore } from "pinia";
import { v4 as uuidv4 } from 'uuid';
import type { ITaskInstance, ITaskTemplate } from "../types/task";
import { generateTaskInstances } from '../utils/taskUtils';
import { useGoalStore } from "@/modules/Goal/stores/goalStore";
import { formatDate, formatDateTime } from "@/shared/utils/dateUtils";
// composables
import { useStoreSave } from '@/shared/composables/useStoreSave';

let autoSaveInstance: ReturnType<typeof useStoreSave> | null = null;

function getAutoSave() {
    if (!autoSaveInstance) {
      autoSaveInstance = useStoreSave({
        onSuccess: (storeName) => console.log(`✓ ${storeName} 数据保存成功`),
        onError: (storeName, error) => console.error(`✗ ${storeName} 数据保存失败:`, error),
      });
    }
    return autoSaveInstance;
  }

export const useTaskStore = defineStore('task', {
    state: () => ({
        taskInstances: [] as ITaskInstance[],
        taskTemplates: [] as ITaskTemplate[],
        tempTaskTemplate: {
            id: '',
            title: '',
            repeatPattern: {
                type: 'none',
                days: [],
                startDate: '2025-06-01',
            },
            reminderPattern: {
                isReminder: false,
                timeBefore: '15'
            },
            startTime: '08:00',
            endTime: '09:00',
            priority: 2,
            description: '',
            keyResultLinks: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        } as ITaskTemplate,
    }),

    getters: {
        // 任务模板相关
        getAllTaskTemplates(): ITaskTemplate[] {
            return this.taskTemplates;
        },

        // 任务实例相关
        // 获取所有任务实例
        getAllTaskInstances(): ITaskInstance[] {
            return this.taskInstances;
        },
        // 获取今天的任务实例
        getTodayTaskInstances(): ITaskInstance[] {
            const today = new Date().toISOString().split('T')[0]; // 获取今天的日期字符串
            return this.taskInstances.filter(task => task.date.split('T')[0] === today);
        },
        getTaskStatsForGoal: (state) => (goalId: string) => {
            const goalStore = useGoalStore();
            const goal = goalStore.getGoalById(goalId);

            if (!goal) {
                console.error('Goal not found');
                return {
                    overall: {
                        total: 0,
                        completed: 0,
                        incomplete: 0,
                        completionRate: 0,
                        missedTasks: 0
                    },
                    taskDetails: []
                };
            }

            // 获取目标相关的所有任务
            const tasks = state.taskInstances.filter(task => {
                const taskDate = new Date(task.date);
                const start = new Date(goal.startTime);
                const end = new Date(goal.endTime);
                const today = new Date();

                const isRelatedToGoal = task.keyResultLinks?.some(
                    link => link.goalId === goalId
                );

                return isRelatedToGoal &&
                    taskDate >= start &&
                    taskDate <= end &&
                    taskDate <= today; // 只统计到当前日期
            });

            // 按任务模板分组统计
            const tasksByTemplate = tasks.reduce((acc, task) => {
                const templateId = task.templateId;
                const template = state.taskTemplates.find(t => t.id === templateId);

                if (!acc[templateId]) {
                    acc[templateId] = {
                        templateId,
                        title: template?.title || '未知任务',
                        total: 0,
                        completed: 0
                    };
                }

                acc[templateId].total++;
                if (task.completed) {
                    acc[templateId].completed++;
                }

                return acc;
            }, {} as Record<string, {
                templateId: string;
                title: string;
                total: number;
                completed: number;
            }>);

            // 计算总体统计
            const overallStats = {
                total: tasks.length,
                completed: tasks.filter(t => t.completed).length,
                incomplete: tasks.filter(t => !t.completed).length,
                completionRate: tasks.length ?
                    (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0,
                missedTasks: tasks.filter(t =>
                    !t.completed && new Date(t.date) < new Date()
                ).length
            };

            return {
                overall: overallStats,
                taskDetails: Object.values(tasksByTemplate)
                    .map(stats => ({
                        ...stats,
                        completionRate: stats.total ?
                            (stats.completed / stats.total) * 100 : 0
                    }))
                    .sort((a, b) => b.total - a.total) // 按任务总数降序排序
            };
        },
        // Get task completion timeline for a goal
        getTaskCompletionTimeline: (state) =>
            (goalId: string, startDate: string, endDate: string) => {
                const timeline: Record<string, {
                    total: number;
                    completed: number;
                    date: string;
                }> = {};

                // Create date entries
                let currentDate = new Date(startDate);
                const end = new Date(endDate);

                while (currentDate <= end) {
                    const dateStr = currentDate.toISOString().split('T')[0];
                    timeline[dateStr] = {
                        total: 0,
                        completed: 0,
                        date: dateStr
                    };
                    currentDate.setDate(currentDate.getDate() + 1);
                }

                // Fill in task data
                state.taskInstances
                    .filter(task => {
                        const taskDate = new Date(task.date);
                        const start = new Date(startDate);
                        const end = new Date(endDate);
                        return task.keyResultLinks?.some(link => link.goalId === goalId) &&
                            taskDate >= start && taskDate <= end;
                    })
                    .forEach(task => {
                        const dateStr = new Date(task.date).toISOString().split('T')[0];
                        if (timeline[dateStr]) {
                            timeline[dateStr].total++;
                            if (task.completed) {
                                timeline[dateStr].completed++;
                            }
                        }
                    });

                return Object.values(timeline);
            },
        getTaskTemplateForKeyResult: (state) => (goalId: string, keyResultId: string) => {
            return state.taskTemplates.filter(template =>
                template.keyResultLinks?.some(link =>
                    link.goalId === goalId && link.keyResultId === keyResultId
                )
            );
        }
    },

    actions: {

        // 任务模板 CRUD 操作
        // 初始化任务模板
        initTempTaskTemplate(taskTempalteId: string) {
            if (taskTempalteId === 'temp') {
                this.tempTaskTemplate = {
                    id: 'temp',
                    title: '',
                    startTime: formatDateTime(new Date()),
                    // endTime: '',
                    repeatPattern: {
                        type: 'none',
                        days: [],
                        startDate: formatDate(new Date()),
                        // endDate: formatDate(new Date()),
                    },
                    reminderPattern: {
                        isReminder: false,
                        timeBefore: '5'
                    },
                    priority: 2,
                    description: '',
                    keyResultLinks: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
            } else {
                const taskTemplate = this.taskTemplates.find(t => t.id === taskTempalteId);
                if (taskTemplate) {
                    this.tempTaskTemplate = {
                        id: taskTemplate.id,
                        title: taskTemplate.title,
                        description: taskTemplate.description || '',
                        startTime: taskTemplate.startTime,
                        endTime: taskTemplate.endTime,
                        repeatPattern: {
                            type: taskTemplate.repeatPattern.type,
                            days: [...(taskTemplate.repeatPattern.days || [])],
                            startDate: taskTemplate.repeatPattern.startDate,
                            endDate: taskTemplate.repeatPattern.endDate,// 怎么没有 null 报错
                        },
                        reminderPattern: taskTemplate.reminderPattern || {
                            isReminder: false,
                            timeBefore: '15'
                        },
                        priority: taskTemplate.priority,
                        keyResultLinks: taskTemplate.keyResultLinks ?
                            taskTemplate.keyResultLinks.map(link => ({ ...link })) : [],
                        createdAt: taskTemplate.createdAt,
                        updatedAt: taskTemplate.updatedAt,
                    };
                } else {
                    console.error('Task template not found');
                }
            }

        },
        // 重置任务模板
        resetTempTaskTemplate() {
            this.tempTaskTemplate = {
                id: '',
                title: '',
                startTime: formatDateTime(new Date()),
                // endTime: formatDateTime(new Date()),
                repeatPattern: {
                    type: 'none',
                    days: [],
                    startDate: formatDate(new Date()),
                    // endDate: formatDate(new Date()),
                },
                reminderPattern: {
                    isReminder: false,
                    timeBefore: '15'
                },
                priority: 2,
                description: '',
                keyResultLinks: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
        },
        // 保存任务模板
        saveTempTaskTemplate() {
            if (this.tempTaskTemplate.id === 'temp') {
                this.tempTaskTemplate.id = uuidv4();
                this.taskTemplates.push(this.tempTaskTemplate);
                // 生成任务实例
                const instances = generateTaskInstances(this.tempTaskTemplate);
                this.taskInstances.push(...instances);
                // 如果开启了提醒，创建提醒任务
                if (this.tempTaskTemplate.reminderPattern?.isReminder) {
                    this.createTaskReminders(this.tempTaskTemplate, instances);
                }
            } else {
                const index = this.taskTemplates.findIndex(t => t.id === this.tempTaskTemplate.id);
                if (index !== -1) {
                    this.taskTemplates[index] = {
                        id: this.tempTaskTemplate.id,
                        title: this.tempTaskTemplate.title,
                        description: this.tempTaskTemplate.description || '',
                        startTime: this.tempTaskTemplate.startTime,
                        endTime: this.tempTaskTemplate.endTime,
                        repeatPattern: {
                            type: this.tempTaskTemplate.repeatPattern.type,
                            days: [...(this.tempTaskTemplate.repeatPattern.days || [])],
                            startDate: this.tempTaskTemplate.repeatPattern.startDate,
                            endDate: this.tempTaskTemplate.repeatPattern.endDate,
                        },
                        reminderPattern: this.tempTaskTemplate.reminderPattern || {
                            isReminder: false,
                            timeBefore: '15'
                        },
                        priority: this.tempTaskTemplate.priority,
                        keyResultLinks: this.tempTaskTemplate.keyResultLinks ?
                            this.tempTaskTemplate.keyResultLinks.map(link => ({
                                goalId: link.goalId,
                                keyResultId: link.keyResultId,
                                incrementValue: link.incrementValue
                            })) : [],
                        createdAt: this.tempTaskTemplate.createdAt,
                        updatedAt: new Date().toISOString(), // Update the timestamp
                    };
                    // 更新任务实例(先移除旧的，再增加新的)
                    this.taskInstances = this.taskInstances.filter(t => t.templateId !== this.tempTaskTemplate.id);
                    const instances = generateTaskInstances(this.tempTaskTemplate);
                    this.taskInstances.push(...instances);

                } else {
                    console.error('Task template not found');
                }
            }
            this.resetTempTaskTemplate();
            this.saveAllTaskData();
        },
        // 创建任务提醒
        async createTaskReminders(template: ITaskTemplate, instances: ITaskInstance[]) {
            const { scheduleService } = await import('@/shared/services/scheduleService');

            for (const instance of instances) {
                try {
                    const taskTime = new Date(instance.date);
                    if (template.startTime) {
                        const [hours, minutes] = template.startTime.split(':');
                        taskTime.setHours(parseInt(hours), parseInt(minutes));
                    }

                    // 计算提醒时间
                    const reminderTime = new Date(taskTime);
                    const minutesBefore = parseInt(template.reminderPattern?.timeBefore ?? '0');
                    reminderTime.setMinutes(reminderTime.getMinutes() - minutesBefore);

                    // 检查提醒时间是否已经过去
                    if (reminderTime <= new Date()) {
                        console.debug(`跳过过期的任务提醒: ${template.title} - ${instance.date}`);
                        continue;
                    }

                    // 创建提醒任务
                    await scheduleService.createSchedule({
                        id: `taskreminder-${instance.id}`,
                        cron: `${reminderTime.getMinutes()} ${reminderTime.getHours()} ${reminderTime.getDate()} ${reminderTime.getMonth() + 1} *`,
                        task: {
                            type: 'taskReminder',
                            payload: {
                                title: `任务提醒: ${template.title}`,
                                body: `任务 "${template.title}" 将在 ${formatDateTime(taskTime)} 开始。`,
                            }
                        }
                    });
                    
                    console.debug(`创建任务提醒: ${template.title} - ${formatDateTime(reminderTime)}`);
                } catch (error) {
                    console.error(`创建任务提醒失败 (${template.title}):`, error);
                }
            }
        },
        // 删除任务模板
        async deleteTaskTemplate(taskId: string) {
            const index = this.taskTemplates.findIndex(t => t.id === taskId);
            if (index !== -1) {
                // 获取所有相关的任务实例
                const relatedInstances = this.taskInstances.filter(t => t.templateId === taskId);

                // 取消所有相关的提醒任务
                const { scheduleService } = await import('@/shared/services/scheduleService');
                for (const instance of relatedInstances) {
                    await scheduleService.cancelSchedule(`reminder-${instance.id}`);
                }

                // 删除所有相关的任务实例
                this.taskInstances = this.taskInstances.filter(t => t.templateId !== taskId);

                // 删除任务模板
                this.taskTemplates.splice(index, 1);

                // 自动保存
                const saveResult = await this.saveAllTaskData();
                if (!saveResult.templates || !saveResult.instances) {
                    console.error('任务模板删除后保存失败');
                }

                return true;
            }
            console.error('Task template not found:', taskId);
            return false;

        },

        // 任务实例相关
        // 完成任务标记
        async completeTask(taskId: string) {
            const goalStore = useGoalStore();
            const taskIndex = this.taskInstances.findIndex(t => t.id === taskId);

            if (taskIndex !== -1) {
                const task = this.taskInstances[taskIndex];

                // Update task completion status
                this.taskInstances[taskIndex] = {
                    ...task,
                    completed: true,
                    completedAt: new Date().toISOString()
                };

                // Update linked key results if any
                if (task.keyResultLinks?.length) {
                    for (const link of task.keyResultLinks) {
                        goalStore.updateKeyResultStartValue(
                            link.goalId,
                            link.keyResultId,
                            link.incrementValue
                        );
                    }
                }
                 // 自动保存
                const saveResult = await this.saveTaskInstances();
                if (!saveResult) {
                    console.error('任务完成后保存失败');
                }
                
                return true;
            }

            console.error('Task not found:', taskId);
            return false;
        },

        // 撤销任务完成
    async undoCompleteTask(taskId: string) {
        const goalStore = useGoalStore();
        const taskIndex = this.taskInstances.findIndex(t => t.id === taskId);

        if (taskIndex !== -1) {
            const task = this.taskInstances[taskIndex];

            // 检查任务是否已完成
            if (!task.completed) {
                console.warn('Task is not completed, cannot undo:', taskId);
                return false;
            }

            // Update task completion status
            this.taskInstances[taskIndex] = {
                ...task,
                completed: false,
                completedAt: undefined // 清除完成时间
            };

            // 回退关联的关键结果值
            if (task.keyResultLinks?.length) {
                for (const link of task.keyResultLinks) {
                    // 使用负值来减去之前增加的值
                    goalStore.updateKeyResultStartValue(
                        link.goalId,
                        link.keyResultId,
                        -link.incrementValue
                    );
                }
            }

            // 自动保存
            const saveResult = await this.saveTaskInstances();
            if (!saveResult) {
                console.error('撤销任务完成后保存失败');
            }
            
            return true;
        }

        console.error('Task not found:', taskId);
        return false;
    },

         // 自动保存方法
         async saveTaskTemplates(): Promise<boolean> {
            const autoSave = getAutoSave();
            return autoSave.debounceSave('taskTemplates', this.taskTemplates);
        },

        async saveTaskInstances(): Promise<boolean> {
            const autoSave = getAutoSave();
            return autoSave.debounceSave('taskInstances', this.taskInstances);
        },

        async saveTaskTemplatesImmediately(): Promise<boolean> {
            const autoSave = getAutoSave();
            return autoSave.saveImmediately('taskTemplates', this.taskTemplates);
        },

        async saveTaskInstancesImmediately(): Promise<boolean> {
            const autoSave = getAutoSave();
            return autoSave.saveImmediately('taskInstances', this.taskInstances);
        },

        async saveAllTaskData(): Promise<{ templates: boolean; instances: boolean }> {
            const [templatesResult, instancesResult] = await Promise.all([
                this.saveTaskTemplates(),
                this.saveTaskInstances()
            ]);
            
            return {
                templates: templatesResult,
                instances: instancesResult
            };
        },

        // 检查保存状态
        isSavingTaskTemplates(): boolean {
            const autoSave = getAutoSave();
            return autoSave.isSaving('taskTemplates');
        },

        isSavingTaskInstances(): boolean {
            const autoSave = getAutoSave();
            return autoSave.isSaving('taskInstances');
        },

        isSavingAnyTaskData(): boolean {
            const autoSave = getAutoSave();
            return autoSave.isSaving();
        },

        /**
         * 重新初始化所有任务提醒
         * 用于用户数据加载完成后重新设置提醒
         */
        async initializeSchedules() {
            const { scheduleService } = await import('@/shared/services/scheduleService');
            
            console.log('开始重新初始化任务提醒...');
            
            // 1. 取消所有现有的任务提醒
            const existingTaskInstances = this.taskInstances;
            for (const instance of existingTaskInstances) {
                try {
                    await scheduleService.cancelSchedule(`taskreminder-${instance.id}`);
                } catch (error) {
                    // 忽略取消失败的错误，可能任务本来就不存在
                    console.debug(`取消任务提醒失败 (可能不存在): taskreminder-${instance.id}`);
                }
            }

            // 2. 重新创建所有需要提醒的任务
            const templatesWithReminders = this.taskTemplates.filter(
                template => template.reminderPattern?.isReminder
            );

            for (const template of templatesWithReminders) {
                const relatedInstances = this.taskInstances.filter(
                    instance => instance.templateId === template.id
                );
                
                if (relatedInstances.length > 0) {
                    await this.createTaskReminders(template, relatedInstances);
                }
            }

            console.log(`任务提醒重新初始化完成，处理了 ${templatesWithReminders.length} 个模板`);
        },

        /**
         * 设置 Store 数据（用于数据加载）
         */
        setTaskData(templates: ITaskTemplate[], instances: ITaskInstance[]) {
            this.taskTemplates = templates;
            this.taskInstances = instances;
        },
    },

    persist: true,
});