import { defineStore } from "pinia";
import { v4 as uuidv4 } from 'uuid';
import type { ITaskInstance, ITaskTemplate } from "../types/task";
import { generateTaskInstances } from '../utils/taskUtils';
import { useGoalStore } from "./goalStore";

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
            },
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
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
                    startDate: new Date().toISOString(),
                    endDate: new Date().toISOString(),
                    repeatPattern: {
                        type: 'none',
                        days: [],
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
                        startDate: taskTemplate.startDate,
                        endDate: taskTemplate.endDate,
                        repeatPattern: {
                            type: taskTemplate.repeatPattern.type,
                            days: [...(taskTemplate.repeatPattern.days || [])],
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
                startDate: new Date().toISOString(),
                endDate: new Date().toISOString(),
                repeatPattern: {
                    type: 'none',
                    days: [],
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
            } else {
                const index = this.taskTemplates.findIndex(t => t.id === this.tempTaskTemplate.id);
                if (index !== -1) {
                    this.taskTemplates[index] = {
                        id: this.tempTaskTemplate.id,
                        title: this.tempTaskTemplate.title,
                        description: this.tempTaskTemplate.description || '',
                        startDate: this.tempTaskTemplate.startDate,
                        endDate: this.tempTaskTemplate.endDate,
                        repeatPattern: {
                            type: this.tempTaskTemplate.repeatPattern.type,
                            days: [...(this.tempTaskTemplate.repeatPattern.days || [])],
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
        },
        // 删除任务模板
        deleteTaskTemplate(taskId: string) {
            const index = this.taskTemplates.findIndex(t => t.id === taskId);
            if (index !== -1) {
                this.taskTemplates.splice(index, 1);
            }
        },

        // 任务实例相关
        // Task completion handling
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

                return true;
            }

            console.error('Task not found:', taskId);
            return false;
        }
    },

    persist: true,
});