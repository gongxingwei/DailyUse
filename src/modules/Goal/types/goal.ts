/**
 * 目标基础信息
 */
export type IGoalBasicInfo = {
    /** 标题 */
    title: string;
    /** 目标颜色 */
    color: string;
    /** 所在文件夹路径（Unix 格式，如 'goals/q3/product'） */
    dirId: string;
    /** 开始时间（如 '2024-03-15'） */
    startTime: string;
    /** 结束时间（需晚于开始时间） */
    endTime: string;
    /** 备忘信息 */
    note?: string;
};

/**
 * 关键结果量化指标
 */
export type IKeyResultCreate = {
    /** 目标名称（如 '用户增长'） */
    name: string;
    /** 起始值 */
    startValue: number;
    /** 目标值（需大于起始值） */
    targetValue: number;
    /** 当前值 */
    currentValue: number;
    /** 进度计算方式 */
    calculationMethod: 'sum' | 'average' | 'max' | 'min' | 'custom';
    /** 权重（0-10) 整数 */
    weight: number;
};

export type IKeyResult = IKeyResultCreate & {
    /** 关键结果 ID（UUID） */
    id: string;
};

/**
 * 动机与可行性分析
 */
export type IGoalAnalysis = {
    /** 动机描述 */
    motive: string;
    /** 可行性分析 */
    feasibility: string;
};

/**
 * 完整目标实体
 */
export type IGoalCreate = IGoalBasicInfo & IGoalAnalysis & {
    /** 关键结果集 */
    keyResults: IKeyResult[];
    /** 系统元数据（扩展预留） */
    meta?: {
        /** 创建时间（自动生成） */
        createdAt: string;
        /** 最后更新时间 */
        updatedAt: string;
    };
};

export type IGoal = IGoalCreate & {
    /** 目标 ID（UUID） */
    id: string;
};

/**
 * 目标目录
 */
export type IGoalDir = {
    id: string;
    name: string;
    icon: string;
    parentId?: number; // For nested directories (optional)
};

export type IRecordCreate = {
    /** 记录值 */
    value: number;
    /** 记录时间（如 '2024-03-15'） */
    date: string;
    /** 备注信息 */
    note?: string;
};
/**
 * 关键结果下的记录
 */
export type IRecord = {
    id: string;
    goalId: string;
    keyResultId: string;
    value: number;
    date: string;
    note?: string;
}