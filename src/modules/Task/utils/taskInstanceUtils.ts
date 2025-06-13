import type { TaskTemplate, ITaskInstance } from '../types/task';
import type { DateTime } from '../types/timeStructure';
import { TimeUtils } from './timeUtils';

/**
 * 获取任务模板的状态
 * @param template 任务模板
 * @returns 'upcoming' | 'active' | 'ended' | 'expired'
 */
export const getTemplateStatus = (template: TaskTemplate): 'upcoming' | 'active' | 'ended' | 'expired' => {
    const now = TimeUtils.now();
    const { timeConfig } = template;
    const baseTime = timeConfig.baseTime.start;

    // 单次任务
    if (timeConfig.recurrence.type === 'none') {
        if (baseTime.timestamp > now.timestamp) {
            return 'upcoming';
        } else if (timeConfig.type === 'allDay') {
            // 全天任务：检查是否是今天
            const todayStart = TimeUtils.createDateTime(now.date.year, now.date.month, now.date.day);
            const todayEnd = TimeUtils.createDateTime(now.date.year, now.date.month, now.date.day + 1);
            
            if (baseTime.timestamp >= todayStart.timestamp && baseTime.timestamp < todayEnd.timestamp) {
                return 'active';
            } else {
                return 'ended';
            }
        } else {
            // 定时任务：检查是否已过期
            const endTime = timeConfig.baseTime.end || baseTime;
            return endTime.timestamp > now.timestamp ? 'active' : 'ended';
        }
    }

    // 重复任务
    const startTime = baseTime;
    
    // 检查是否还未开始
    if (startTime.timestamp > now.timestamp) {
        return 'upcoming';
    }

    // 检查是否已结束
    if (timeConfig.recurrence.endCondition.type === 'date' && timeConfig.recurrence.endCondition.endDate) {
        if (now.timestamp > timeConfig.recurrence.endCondition.endDate.timestamp) {
            return 'ended';
        }
    }

    // 检查是否有下一次执行时间
    const nextOccurrence = TimeUtils.getNextOccurrence(timeConfig, now);
    if (!nextOccurrence) {
        return 'ended';
    }

    return 'active';
};

/**
 * 获取任务模板的下一次执行时间
 * @param template 任务模板
 * @returns 下一次执行时间，如果没有则返回 null
 */
export const getNextExecutionTime = (template: TaskTemplate): DateTime | null => {
    const now = TimeUtils.now();
    return TimeUtils.getNextOccurrence(template.timeConfig, now);
};

/**
 * 检查任务实例是否已过期
 * @param instance 任务实例
 * @returns 是否已过期
 */
export const isTaskInstanceOverdue = (instance: ITaskInstance): boolean => {
    if (instance.status === 'completed' || instance.status === 'cancelled') {
        return false;
    }

    const now = TimeUtils.now();
    return instance.scheduledTime.timestamp < now.timestamp;
};

/**
 * 获取任务实例的显示时间文本
 * @param instance 任务实例
 * @param template 任务模板（可选，用于获取更多上下文）
 * @returns 时间显示文本
 */
export const getTaskDisplayTime = (instance: ITaskInstance, template?: TaskTemplate): string => {
    const scheduledTime = instance.scheduledTime;
    
    if (!template) {
        // 简单格式
        if (scheduledTime.time) {
            return `${scheduledTime.time.hour.toString().padStart(2, '0')}:${scheduledTime.time.minute.toString().padStart(2, '0')}`;
        } else {
            return '全天';
        }
    }

    const { timeConfig } = template;
    
    switch (timeConfig.type) {
        case 'allDay':
            return '全天';
            
        case 'timed':
            if (scheduledTime.time) {
                return `${scheduledTime.time.hour.toString().padStart(2, '0')}:${scheduledTime.time.minute.toString().padStart(2, '0')}`;
            }
            return '时间待定';
            
        case 'timeRange':
            if (scheduledTime.time && timeConfig.baseTime.end?.time) {
                const startTime = `${scheduledTime.time.hour.toString().padStart(2, '0')}:${scheduledTime.time.minute.toString().padStart(2, '0')}`;
                const endTime = `${timeConfig.baseTime.end.time.hour.toString().padStart(2, '0')}:${timeConfig.baseTime.end.time.minute.toString().padStart(2, '0')}`;
                return `${startTime} - ${endTime}`;
            }
            return '时间范围待定';
            
        default:
            return '时间待定';
    }
};

/**
 * 获取任务实例的显示日期文本
 * @param instance 任务实例
 * @returns 日期显示文本
 */
export const getTaskDisplayDate = (instance: ITaskInstance): string => {
    const date = instance.scheduledTime.date;
    return `${date.year}-${date.month.toString().padStart(2, '0')}-${date.day.toString().padStart(2, '0')}`;
};

/**
 * 检查两个任务实例是否在同一天
 * @param instance1 任务实例1
 * @param instance2 任务实例2
 * @returns 是否在同一天
 */
export const isTasksSameDay = (instance1: ITaskInstance, instance2: ITaskInstance): boolean => {
    const date1 = instance1.scheduledTime.date;
    const date2 = instance2.scheduledTime.date;
    
    return date1.year === date2.year && 
           date1.month === date2.month && 
           date1.day === date2.day;
};

/**
 * 按日期分组任务实例
 * @param instances 任务实例数组
 * @returns 按日期分组的任务实例
 */
export const groupTasksByDate = (instances: ITaskInstance[]): Record<string, ITaskInstance[]> => {
    return instances.reduce((groups, instance) => {
        const dateKey = getTaskDisplayDate(instance);
        
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        
        groups[dateKey].push(instance);
        return groups;
    }, {} as Record<string, ITaskInstance[]>);
};

/**
 * 按优先级排序任务实例
 * @param instances 任务实例数组
 * @returns 排序后的任务实例数组
 */
export const sortTasksByPriority = (instances: ITaskInstance[]): ITaskInstance[] => {
    return [...instances].sort((a, b) => {
        // 优先级：1 > 2 > 3 > 4 (数字越小优先级越高)
        if (a.priority !== b.priority) {
            return a.priority - b.priority;
        }
        
        // 优先级相同时按时间排序
        return a.scheduledTime.timestamp - b.scheduledTime.timestamp;
    });
};

/**
 * 按时间排序任务实例
 * @param instances 任务实例数组
 * @returns 排序后的任务实例数组
 */
export const sortTasksByTime = (instances: ITaskInstance[]): ITaskInstance[] => {
    return [...instances].sort((a, b) => a.scheduledTime.timestamp - b.scheduledTime.timestamp);
};

/**
 * 获取任务的完成率统计
 * @param instances 任务实例数组
 * @returns 完成率统计
 */
export const getTaskCompletionStats = (instances: ITaskInstance[]) => {
    const total = instances.length;
    const completed = instances.filter(t => t.status === 'completed').length;
    const pending = instances.filter(t => t.status === 'pending').length;
    const inProgress = instances.filter(t => t.status === 'inProgress').length;
    const overdue = instances.filter(t => isTaskInstanceOverdue(t)).length;
    
    return {
        total,
        completed,
        pending,
        inProgress,
        overdue,
        completionRate: total > 0 ? (completed / total) * 100 : 0
    };
};