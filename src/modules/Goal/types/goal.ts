/**
 * 目标基础信息
 */
export interface IGoalBasicInfo {
    /** 标题 */
    title: string;
    /** 目标颜色 */
    color: string;
    /** 所在文件夹路径（Unix 格式，如 'goals/q3/product'） */
    dirId: string;
    /** 开始时间（ISO 8601 格式字符串，如 '2024-03-15T09:00:00'） */
    startTime: string;
    /** 结束时间（需晚于开始时间） */
    endTime: string;
    /** 备忘信息 */
    note?: string;
}



/**
 * 关键结果量化指标
 */
export interface IKeyResultCreate {
    /** 目标名称（如 '用户增长'） */
    name: string;
    /** 起始值 */
    startValue: number;
    /** 目标值（需大于起始值） */
    targetValue: number;
    /** 进度计算方式 */
    calculationMethod: 'sum' | 'average' | 'max' | 'min' | 'custom';
    /** 权重（0-10) 整数 */
    weight: number;
}

export interface IKeyResult extends IKeyResultCreate {
    /** 关键结果 ID（UUID） */
    id: string;
}

/**
 * 动机与可行性分析
 */
export interface IGoalAnalysis {
    /** 动机描述 */
    motive: string;
    /** 可行性分析 */
    feasibility: string;
}

/**
 * 完整目标实体
 */
export interface IGoalCreate extends IGoalBasicInfo, IGoalAnalysis {
    /** 关键结果集 */
    keyResults: IKeyResult[];
    /** 系统元数据（扩展预留） */
    meta?: {
        /** 创建时间（自动生成） */
        createdAt: string;
        /** 最后更新时间 */
        updatedAt: string;
    };
}

export interface IGoal extends IGoalCreate {
    /** 目标 ID（UUID） */
    id: string;
}

/**
 * 目标目录
 */
export interface IGoalDir {
    id: string;
    name: string;
    icon: string;
    parentId?: number; // For nested directories (optional)
}

  