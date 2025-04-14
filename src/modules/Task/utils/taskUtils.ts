import { v4 as uuidv4 } from 'uuid';
import type { ITaskTemplate, ITaskInstance, RepeatPattern } from '../types/task';

/**
 * 根据任务模板生成任务实例
 * @param template 任务模板
 * @returns 生成的任务实例数组
 */
export function generateTaskInstances(template: ITaskTemplate): ITaskInstance[] {
    const instances: ITaskInstance[] = [];
    const startDate = new Date(template.startDate);
    const endDate = new Date(template.endDate);
    
    // Handle non-repeating tasks
    if (template.repeatPattern.type === 'none') {
        instances.push(createTaskInstance(template, startDate));
        return instances;
    }

    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        if (shouldCreateTaskForDate(currentDate, template.repeatPattern)) {
            instances.push(createTaskInstance(template, currentDate));
        }
        currentDate = addDays(currentDate, 1);
    }

    return instances;
}

/**
 * 检查指定日期是否应该创建任务
 */
function shouldCreateTaskForDate(date: Date, pattern: RepeatPattern): boolean {
    switch (pattern.type) {
        case 'daily':
            return true;

        case 'weekly':
            return pattern.days?.includes(date.getDay()) ?? false;

        case 'monthly':
            return pattern.days?.includes(date.getDate()) ?? false;

        default:
            return false;
    }
}

/**
 * 创建单个任务实例
 */
function createTaskInstance(template: ITaskTemplate, date: Date): ITaskInstance {
    return {
        id: uuidv4(),
        templateId: template.id,
        title: template.title,
        description: template.description,
        date: date.toISOString(),
        keyResultLinks: template.keyResultLinks ? [...template.keyResultLinks] : undefined,
        priority: template.priority,
        completed: false
    };
}

/**
 * 日期操作辅助函数
 */
function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}