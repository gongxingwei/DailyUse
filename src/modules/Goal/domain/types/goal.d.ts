import type { DateTime } from "@/shared/types/myDateTime";

/**
 * 关键结果关联（用于任务关联）
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
 * 关键结果量化指标
 */
export interface IKeyResult {
  /** 关键结果 ID（UUID） */
  id: string;
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
  /** 生命周期 */
  lifecycle: {
    createdAt: DateTime;
    updatedAt: DateTime;
    status: "active" | "completed" | "archived";
  };
}

/**
 * 目标基础信息
 */
export interface IGoal {
  /** 目标 ID（UUID） */
  id: string;
  /** 标题 */
  title: string;
  /** 目标描述 */
  description?: string;
  /** 目标颜色 */
  color: string;
  /** 所在文件夹路径（Unix 格式，如 'goals/q3/product'） */
  dirId: string;
  /** 开始时间 */
  startTime: DateTime;
  /** 结束时间（需晚于开始时间） */
  endTime: DateTime;
  /** 备忘信息 */
  note?: string;
  /** 关键结果集 */
  keyResults: IKeyResult[];
  /** 记录集 */
  records: IRecord[];
  /** 复盘集 */
  reviews: IGoalReview[];
  /** 动机与可行性分析 */
  analysis: {
    /** 动机描述 */
    motive: string;
    /** 可行性分析 */
    feasibility: string;
  };
  /** 生命周期 */
  lifecycle: {
    createdAt: DateTime;
    updatedAt: DateTime;
    status: "active" | "completed" | "paused" | "archived";
  };
  /** 分析数据 */
  analytics: {
    /** 总体进度百分比 */
    overallProgress: number;
    /** 加权进度百分比 */
    weightedProgress: number;
    /** 完成的关键结果数量 */
    completedKeyResults: number;
    /** 总关键结果数量 */
    totalKeyResults: number;
  };
  /** 版本号 */
  version: number;
}

/**
 * 目标目录
 */
export interface IGoalDir {
  /** 目录 ID */
  id: string;
  /** 目录名称 */
  name: string;
  /** 目录图标 */
  icon: string;
  /** 父目录ID（可选，用于嵌套目录） */
  parentId?: string;
  /** 生命周期 */
  lifecycle: {
    createdAt: DateTime;
    updatedAt: DateTime;
    status: "active" | "archived";
  };
}

/**
 * 关键结果记录
 */
export interface IRecord {
  /** 记录 ID */
  id: string;
  /** 目标 ID */
  goalId: string;
  /** 关键结果 ID */
  keyResultId: string;
  /** 记录值 */
  value: number;
  /** 记录时间 */
  date: DateTime;
  /** 备注信息 */
  note?: string;
  /** 生命周期 */
  lifecycle: {
    createdAt: DateTime;
    updatedAt: DateTime;
  };
}

/**
 * 目标创建数据传输对象
 */
export interface IGoalCreateDTO {
  title: string;
  description?: string;
  color: string;
  dirId: string;
  startTime: DateTime;
  endTime: DateTime;
  note?: string;
  keyResults: Array<{
    name: string;
    startValue: number;
    targetValue: number;
    currentValue: number;
    calculationMethod: 'sum' | 'average' | 'max' | 'min' | 'custom';
    weight: number;
  }>;
  analysis: {
    motive: string;
    feasibility: string;
  };
}

/**
 * 关键结果创建数据传输对象
 */
export interface IKeyResultCreateDTO {
  name: string;
  startValue: number;
  targetValue: number;
  currentValue: number;
  calculationMethod: 'sum' | 'average' | 'max' | 'min' | 'custom';
  weight: number;
}

/**
 * 记录创建数据传输对象
 */
export interface IRecordCreateDTO {
  goalId: string;
  keyResultId: string;
  value: number;
  date: DateTime;
  note?: string;
}

/**
 * 目标复盘
 */
export interface IGoalReview {
  /** 复盘 ID */
  id: string;
  /** 目标 ID */
  goalId: string;
  /** 复盘标题 */
  title: string;
  /** 复盘类型 */
  type: "weekly" | "monthly" | "midterm" | "final" | "custom";
  /** 复盘时间 */
  reviewDate: DateTime;
  /** 复盘内容 */
  content: {
    /** 成就与收获 */
    achievements: string;
    /** 遇到的挑战 */
    challenges: string;
    /** 学到的经验教训 */
    learnings: string;
    /** 下一步行动计划 */
    nextSteps: string;
    /** 目标调整建议 */
    adjustments?: string;
  };
  /** 复盘时的目标状态快照 */
  snapshot: {
    /** 快照时间 */
    snapshotDate: DateTime;
    /** 总体进度 */
    overallProgress: number;
    /** 加权进度 */
    weightedProgress: number;
    /** 完成的关键结果数量 */
    completedKeyResults: number;
    /** 总关键结果数量 */
    totalKeyResults: number;
    /** 关键结果详情 */
    keyResultsSnapshot: Array<{
      id: string;
      name: string;
      progress: number;
      currentValue: number;
      targetValue: number;
    }>;
  };
  /** 评分（1-10分） */
  rating?: {
    /** 进度满意度 */
    progressSatisfaction: number;
    /** 执行效率 */
    executionEfficiency: number;
    /** 目标合理性 */
    goalReasonableness: number;
  };
  /** 生命周期 */
  lifecycle: {
    createdAt: DateTime;
    updatedAt: DateTime;
  };
}

/**
 * 目标复盘创建数据传输对象
 */
export interface IGoalReviewCreateDTO {
  goalId: string;
  title: string;
  type: "weekly" | "monthly" | "midterm" | "final" | "custom";
  reviewDate: DateTime;
  content: {
    achievements: string;
    challenges: string;
    learnings: string;
    nextSteps: string;
    adjustments?: string;
  };
  rating?: {
    progressSatisfaction: number;
    executionEfficiency: number;
    goalReasonableness: number;
  };
}
