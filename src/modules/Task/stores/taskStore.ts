// src/modules/Task/stores/taskStore.ts
import { defineStore } from 'pinia';
import type { TaskTemplate, ITaskInstance } from '../types/task';
import { TaskReminderService } from '../services/taskReminderService';
import { TimeUtils } from '../utils/timeUtils';
import { useStoreSave } from '@/shared/composables/useStoreSave';
import { useGoalStore } from '@/modules/Goal/stores/goalStore';

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
    taskTemplates: [] as TaskTemplate[],
    
  }),

  getters: {
    getAllTaskTemplates(): TaskTemplate[] {
      return this.taskTemplates;
    },

    getAllTaskInstances(): ITaskInstance[] {
      return this.taskInstances;
    },

    // 获取今天的任务实例
    getTodayTaskInstances(): ITaskInstance[] {
      const today = TimeUtils.now();
      const todayStart = TimeUtils.createDateTime(
        today.date.year,
        today.date.month,
        today.date.day
      );
      const todayEnd = TimeUtils.createDateTime(
        today.date.year,
        today.date.month,
        today.date.day + 1
      );

      
      return this.taskInstances.filter(task => {
        if (!task.scheduledTime || typeof task.scheduledTime.timestamp !== 'number') {
          console.warn('任务实例缺少有效的调度时间:', task);
          return false;
        }

        return task.scheduledTime.timestamp >= todayStart.timestamp &&
               task.scheduledTime.timestamp < todayEnd.timestamp;
      });
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

      // 使用新的时间结构进行过滤
      const startTime = TimeUtils.fromISOString(goal.startTime);
      const endTime = TimeUtils.fromISOString(goal.endTime);
      const now = TimeUtils.now();

      const tasks = state.taskInstances.filter(task => {
        const isRelatedToGoal = task.keyResultLinks?.some(
          link => link.goalId === goalId
        );

        return isRelatedToGoal &&
          task.scheduledTime.timestamp >= startTime.timestamp &&
          task.scheduledTime.timestamp <= endTime.timestamp &&
          task.scheduledTime.timestamp <= now.timestamp;
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
        if (task.status === 'completed') {
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
        completed: tasks.filter(t => t.status === 'completed').length,
        incomplete: tasks.filter(t => t.status !== 'completed').length,
        completionRate: tasks.length ?
          (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0,
        missedTasks: tasks.filter(t =>
          t.status !== 'completed' && t.scheduledTime.timestamp < now.timestamp
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
          .sort((a, b) => b.total - a.total)
      };
    },

    getTaskCompletionTimeline: (state) => (goalId: string, startDate: string, endDate: string) => {
      const timeline: Record<string, {
        total: number;
        completed: number;
        date: string;
      }> = {};

      const start = TimeUtils.fromISOString(new Date(startDate).toISOString());
      const end = TimeUtils.fromISOString(new Date(endDate).toISOString());

      // 创建日期条目
      let currentDate = start;
      while (currentDate.timestamp <= end.timestamp) {
        const dateStr = `${currentDate.date.year}-${currentDate.date.month.toString().padStart(2, '0')}-${currentDate.date.day.toString().padStart(2, '0')}`;
        timeline[dateStr] = {
          total: 0,
          completed: 0,
          date: dateStr
        };
        
        // 移动到下一天
        const nextDay = new Date(currentDate.timestamp);
        nextDay.setDate(nextDay.getDate() + 1);
        currentDate = TimeUtils.fromTimestamp(nextDay.getTime());
      }

      // 填充任务数据
      state.taskInstances
        .filter(task => {
          const isRelatedToGoal = task.keyResultLinks?.some(link => link.goalId === goalId);
          return isRelatedToGoal &&
            task.scheduledTime.timestamp >= start.timestamp &&
            task.scheduledTime.timestamp <= end.timestamp;
        })
        .forEach(task => {
          const dateStr = `${task.scheduledTime.date.year}-${task.scheduledTime.date.month.toString().padStart(2, '0')}-${task.scheduledTime.date.day.toString().padStart(2, '0')}`;
          if (timeline[dateStr]) {
            timeline[dateStr].total++;
            if (task.status === 'completed') {
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
    addTaskTemplate(template: TaskTemplate) {
      this.taskTemplates.push(template);
      this.saveTaskTemplates();
    },

    // 删除任务模板
    deleteTaskTemplateById(templateId: string): boolean {
      const index = this.taskTemplates.findIndex(t => t.id === templateId);
      if (index !== -1) {
        this.taskTemplates.splice(index, 1);
        this.saveTaskTemplates();
        return true;
      }
      console.error('Task template not found:', templateId);
      return false;
    },

    getTaskTemplateById(templateId: string): TaskTemplate | undefined {
      return this.taskTemplates.find(t => t.id === templateId);
    },

    updateTaskTemplate(template: TaskTemplate) {
      const index = this.taskTemplates.findIndex(t => t.id === template.id);
      if (index !== -1) {
        this.taskTemplates[index] = template;
        this.saveTaskTemplates();
      } else {
        console.error('Task template not found:', template.id);
      }
    },
    


    // 完成任务
    async completeTask(taskId: string) {
      const goalStore = useGoalStore();
      const taskIndex = this.taskInstances.findIndex(t => t.id === taskId);

      if (taskIndex !== -1) {
        const task = this.taskInstances[taskIndex];
        const now = TimeUtils.now();

        this.taskInstances[taskIndex] = {
          ...task,
          status: 'completed',
          completedAt: now,
          actualEndTime: now
        };

        // 更新关联的关键结果
        if (task.keyResultLinks?.length) {
          for (const link of task.keyResultLinks) {
            // await goalStore.updateKeyResultProgress(
            //   link.goalId,
            //   link.keyResultId,
            //   link.incrementValue
            // );
            console.log(`Updating key result ${link.keyResultId} for goal ${link.goalId} with increment ${link.incrementValue}`);
          }
        }

        const saveResult = await this.saveTaskInstances();
        if (!saveResult) {
          console.error('保存任务实例失败');
        }

        return true;
      }

      console.error('Task not found:', taskId);
      return false;
    },

    // 撤销完成任务
    async undoCompleteTask(taskId: string) {
      const goalStore = useGoalStore();
      const taskIndex = this.taskInstances.findIndex(t => t.id === taskId);

      if (taskIndex !== -1) {
        const task = this.taskInstances[taskIndex];

        if (task.status !== 'completed') {
          console.warn('任务未完成，无法撤销');
          return false;
        }

        this.taskInstances[taskIndex] = {
          ...task,
          status: 'pending',
          completedAt: undefined,
          actualEndTime: undefined
        };

        // 回退关键结果
        if (task.keyResultLinks?.length) {
          for (const link of task.keyResultLinks) {
            // await goalStore.updateKeyResultProgress(
            //   link.goalId,
            //   link.keyResultId,
            //   -link.incrementValue
            // );
            console.log(`Reverting key result ${link.keyResultId} for goal ${link.goalId} with decrement ${link.incrementValue}`);
          }
        }

        const saveResult = await this.saveTaskInstances();
        if (!saveResult) {
          console.error('保存任务实例失败');
        }

        return true;
      }

      console.error('Task not found:', taskId);
      return false;
    },

    // 重新初始化所有提醒
    async initializeSchedules() {
      const reminderService = TaskReminderService.getInstance();
      await reminderService.reinitializeAllReminders(this.taskTemplates, this.taskInstances);
    },

    // 设置任务数据
    setTaskData(templates: TaskTemplate[], instances: ITaskInstance[]) {
      this.taskTemplates = templates;
      this.taskInstances = instances;
    },

    // 保存方法（保持不变）
    async saveTaskTemplates(): Promise<boolean> {
      const autoSave = getAutoSave();
      return autoSave.debounceSave('taskTemplates', this.taskTemplates);
    },

    async saveTaskInstances(): Promise<boolean> {
      const autoSave = getAutoSave();
      return autoSave.debounceSave('taskInstances', this.taskInstances);
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

    async saveTaskTemplatesImmediately(): Promise<boolean> {
      const autoSave = getAutoSave();
      return autoSave.saveImmediately('taskTemplates', this.taskTemplates);
    },

    async saveTaskInstancesImmediately(): Promise<boolean> {
      const autoSave = getAutoSave();
      return autoSave.saveImmediately('taskInstances', this.taskInstances);
    },

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
  },

  persist: true,
});