/**
 * 任务重复模式
 */
export type RepeatPattern = {
    /** 重复类型 */
    type: 'none' | 'daily' | 'weekly' | 'monthly';
    /** 重复日期（周重复时为 0-6，月重复时为 1-31） */
    days?: number[];
    /** 结束日期（可选） */
    endDate?: string;
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
export interface ITaskTemplate {
    /** 任务模板ID */
    id: string;
    /** 任务标题 */
    title: string;
    /** 任务描述 */
    description?: string;
    /** 开始时间 */
    startDate: string;
    /** 结束时间 */
    endDate: string;
    /** 重复模式 */
    repeatPattern: RepeatPattern;
    /** 关联的关键结果 */
    keyResultLinks?: KeyResultLink[];
    /** 任务优先级 (1-4: 低、中、高、紧急) */
    priority: 1 | 2 | 3 | 4;
    createdAt: string;
    updatedAt: string;
}
/**
 * 任务实例接口（用于显示）
 */
export interface ITaskInstance {
    /** 任务实例ID */
    id: string;
    /** 该实例的模板ID */
    templateId: string;
    /** 任务实例标题 */
    title: string;
    /** 任务实例描述 */
    description?: string;
    /** 任务实例日期 */
    date: string; 
    /** 关联的关键结果 */
    keyResultLinks?: KeyResultLink[];
    /** 任务优先级 (1-4: 低、中、高、紧急) */
    priority: 1 | 2 | 3 | 4;
    /** 是否完成 */
    completed: boolean;
    /** 完成时间 */
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