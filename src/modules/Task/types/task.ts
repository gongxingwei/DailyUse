/**
 * 任务重复模式
 */
export type RepeatPattern = {
    /** 重复类型 */
    type: 'none' | 'daily' | 'weekly' | 'monthly';
    /** 重复日期（周重复时为 0-6，月重复时为 1-31） */
    days?: number[];
    /** 开始日期 YYYY-MM-DD */
    startDate: string;
    /** 结束日期 YYYY-MM-DD（可选），如果为不重复类型，则只有开始日期，没有结束日期 */
    endDate?: string;
};

/**
 * 任务提醒模式
 */
export type ReminderPattern = {
    /** 是否提醒 */
    isReminder: boolean;
    /** 提前多久提醒 min */
    timeBefore?: '5' | '10' | '15' | '30' | '60';
};
/**
 * 关键结果关联
 */
export type KeyResultLink = {
    /** 目标ID */
    goalId: string;
    /** 关键结果ID */
    keyResultId: string;
    /** 完成任务时增加的值 */
    incrementValue: number;
};
/**
 * 任务模板接口
 */
export type ITaskTemplate = {
    /** 任务模板ID */
    id: string;
    /** 任务标题 */
    title: string;
    /** 任务描述 */
    description?: string;
    /** 开始时间（一天中 HH:mm） */
    startTime?: string;
    /** 结束时间（一天中 HH:mm） */
    endTime?: string;
    /** 重复模式 */
    repeatPattern: RepeatPattern;
    /** 提醒模式 */
    reminderPattern: ReminderPattern;
    /** 关联的关键结果 */
    keyResultLinks?: KeyResultLink[];
    /** 任务优先级 (1-4: 低、中、高、紧急) */
    priority: 1 | 2 | 3 | 4;
    createdAt: string;
    updatedAt: string;
}
/**
 * 任务实例接口（用于显示）
 * @interface ITaskInstance
 */
export type ITaskInstance = {
    /** 任务实例的唯一标识符 */
    id: string;

    /** 关联的任务模板ID */
    templateId: string;

    /** 任务的标题 */
    title: string;

    /** 任务的详细描述 */
    description?: string;

    /** 任务的执行日期 (YYYY-MM-DD格式) */
    date: string;

    /** 任务的开始时间 (HH:mm格式) */
    startTime?: string;
    /** 任务的结束时间 (HH:mm格式) */
    endTime?: string;

    /** 任务关联的关键结果列表 */
    keyResultLinks?: KeyResultLink[];

    /** 
     * 任务优先级
     * - 1: 低优先级
     * - 2: 中优先级
     * - 3: 高优先级
     * - 4: 紧急
     */
    priority: 1 | 2 | 3 | 4;

    /** 任务是否已完成 */
    completed: boolean;

    /** 任务完成的时间 (ISO格式的日期字符串) */
    completedAt?: string;
}
/**
 * 任务统计
 */
export interface ITaskStats {
    /** 总任务数 */
    total: number;
    /** 已完成数 */
    completed: number;
    /** 今日完成数 */
    todayCompleted: number;
    /** 逾期数 */
    overdue: number;
}