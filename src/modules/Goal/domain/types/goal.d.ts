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
 * 目标目录创建数据传输对象
 */
export interface IGoalDirCreateDTO {
  name: string;
  icon: string;
  parentId?: string;
}
