import { v4 as uuidv4 } from 'uuid';
import type { ITaskTemplate, ITaskInstance, RepeatPattern } from '../types/task';

/**
 * 根据任务模板生成任务实例
 * @param template 任务模板
 * @returns 生成的任务实例数组
 */
export function generateTaskInstances(template: ITaskTemplate): ITaskInstance[] {
    const instances: ITaskInstance[] = [];
    const startDate = new Date(template.repeatPattern.startDate);
    
    // 如果是不重复的任务
    if (template.repeatPattern.type === 'none') {
        instances.push(createTaskInstance(template, startDate));
        return instances;
    }

    // 确保有结束日期，如果没有则使用开始日期
    const endDate = template.repeatPattern.endDate 
        ? new Date(template.repeatPattern.endDate)
        : startDate;

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

        case 'none':
            return true;

        default:
            return false;
    }
}

/**
 * 创建单个任务实例
 */
function createTaskInstance(template: ITaskTemplate, date: Date): ITaskInstance {
    // 复制日期对象以避免修改原始日期
    const taskDate = new Date(date);
    
    // 如果有具体时间，则设置时间部分
    if (template.startTime) {
        const [hours, minutes] = template.startTime.split(':');
        taskDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    }

    return {
        id: uuidv4(),
        templateId: template.id,
        title: template.title,
        description: template.description,
        date: taskDate.toISOString(),
        startTime: template.startTime,
        endTime: template.endTime,
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

/**
 * 获取任务模板的状态
 * @param template 任务模板
 * @returns 'upcoming' | 'active' | 'ended'
 */
export const getTemplateStatus = (template: ITaskTemplate): 'upcoming' | 'active' | 'ended' => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const startDate = new Date(template.repeatPattern.startDate);
    startDate.setHours(0, 0, 0, 0);

    if (template.repeatPattern.type === 'none' || !template.repeatPattern.endDate) {
        let nextDate = new Date(startDate);
        nextDate.setDate(nextDate.getDate() + 1);
        if (now > nextDate) return 'ended';
        return now < startDate ? 'upcoming' : 'active';
    }


    const endDate = new Date(template.repeatPattern.endDate);
    endDate.setHours(23, 59, 59, 999); 

    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'ended';
    return 'active';
};