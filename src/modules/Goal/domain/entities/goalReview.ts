import { Entity } from "@/shared/domain/entity";
import { TimeUtils } from "@/shared/utils/myDateTimeUtils";
import type { DateTime } from "@/shared/types/myDateTime";
import type { IGoalReview, IGoalReviewCreateDTO } from "../types/goal";

/**
 * 目标复盘领域实体
 * 负责目标复盘的业务逻辑和数据管理
 */
export class GoalReview extends Entity implements IGoalReview {
  private _goalId: string;
  private _title: string;
  private _type: IGoalReview['type'];
  private _reviewDate: DateTime;
  private _content: IGoalReview['content'];
  private _snapshot: IGoalReview['snapshot'];
  private _rating?: IGoalReview['rating'];
  private _lifecycle: IGoalReview['lifecycle'];

  constructor(
    id: string,
    goalId: string,
    title: string,
    type: IGoalReview['type'],
    reviewDate: DateTime,
    content: IGoalReview['content'],
    snapshot: IGoalReview['snapshot'],
    rating?: IGoalReview['rating']
  ) {
    super(id);
    const now = TimeUtils.now();

    this._goalId = goalId;
    this._title = title;
    this._type = type;
    this._reviewDate = reviewDate;
    this._content = content;
    this._snapshot = snapshot;
    this._rating = rating;

    this._lifecycle = {
      createdAt: now,
      updatedAt: now,
    };
  }

  // Getters
  get goalId(): string {
    return this._goalId;
  }

  get title(): string {
    return this._title;
  }

  get type(): IGoalReview['type'] {
    return this._type;
  }

  get reviewDate(): DateTime {
    return this._reviewDate;
  }

  get content(): IGoalReview['content'] {
    return this._content;
  }

  get snapshot(): IGoalReview['snapshot'] {
    return this._snapshot;
  }

  get rating(): IGoalReview['rating'] | undefined {
    return this._rating;
  }

  get lifecycle(): IGoalReview['lifecycle'] {
    return this._lifecycle;
  }

  /**
   * 更新复盘内容
   */
  updateContent(updates: {
    title?: string;
    content?: Partial<IGoalReview['content']>;
    rating?: IGoalReview['rating'];
  }): void {
    if (updates.title !== undefined) {
      if (!updates.title.trim()) {
        throw new Error("复盘标题不能为空");
      }
      this._title = updates.title;
    }

    if (updates.content) {
      this._content = {
        ...this._content,
        ...updates.content,
      };
    }

    if (updates.rating !== undefined) {
      // 验证评分范围
      const validateRating = (score: number, name: string) => {
        if (score < 1 || score > 10) {
          throw new Error(`${name}评分必须在1-10之间`);
        }
      };

      validateRating(updates.rating.progressSatisfaction, "进度满意度");
      validateRating(updates.rating.executionEfficiency, "执行效率");
      validateRating(updates.rating.goalReasonableness, "目标合理性");

      this._rating = updates.rating;
    }

    this._lifecycle.updatedAt = TimeUtils.now();
  }

  /**
   * 获取复盘的综合评分
   */
  get overallRating(): number | null {
    if (!this._rating) return null;

    return (
      this._rating.progressSatisfaction +
      this._rating.executionEfficiency +
      this._rating.goalReasonableness
    ) / 3;
  }

  /**
   * 检查是否为重要的复盘节点
   */
  get isImportantMilestone(): boolean {
    return this._type === "midterm" || this._type === "final";
  }

  /**
   * 获取复盘时的进度变化
   */
  calculateProgressChange(previousSnapshot?: IGoalReview['snapshot']): {
    progressChange: number;
    completedKeyResultsChange: number;
  } | null {
    if (!previousSnapshot) return null;

    return {
      progressChange: this._snapshot.overallProgress - previousSnapshot.overallProgress,
      completedKeyResultsChange: this._snapshot.completedKeyResults - previousSnapshot.completedKeyResults,
    };
  }

  /**
   * 验证复盘数据
   */
  static validate(data: IGoalReviewCreateDTO): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.goalId?.trim()) {
      errors.push("目标ID不能为空");
    }

    if (!data.title?.trim()) {
      errors.push("复盘标题不能为空");
    }

    if (!data.content.achievements?.trim()) {
      errors.push("成就与收获不能为空");
    }

    if (!data.content.challenges?.trim()) {
      errors.push("遇到的挑战不能为空");
    }

    if (!data.content.learnings?.trim()) {
      errors.push("学到的经验教训不能为空");
    }

    if (!data.content.nextSteps?.trim()) {
      errors.push("下一步行动计划不能为空");
    }

    // 验证评分
    if (data.rating) {
      const validateRating = (score: number, name: string) => {
        if (score < 1 || score > 10) {
          errors.push(`${name}评分必须在1-10之间`);
        }
      };

      validateRating(data.rating.progressSatisfaction, "进度满意度");
      validateRating(data.rating.executionEfficiency, "执行效率");
      validateRating(data.rating.goalReasonableness, "目标合理性");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 从数据传输对象创建复盘实例
   */
  static fromDTO(data: IGoalReview): GoalReview {
    const review = new GoalReview(
      data.id,
      data.goalId,
      data.title,
      data.type,
      data.reviewDate,
      data.content,
      data.snapshot,
      data.rating
    );

    review._lifecycle = data.lifecycle;
    return review;
  }

  /**
   * 转换为数据传输对象
   */
  toDTO(): IGoalReview {
    return {
      id: this.id,
      goalId: this._goalId,
      title: this._title,
      type: this._type,
      reviewDate: this._reviewDate,
      content: this._content,
      snapshot: this._snapshot,
      rating: this._rating,
      lifecycle: this._lifecycle,
    };
  }

  /**
   * 转换为 JSON 字符串
   */
  toJSON(): string {
    return JSON.stringify(this.toDTO());
  }

  clone(): GoalReview {
    const clone = new GoalReview(
      this.id,
      this._goalId,
      this._title,
      this._type,
      this._reviewDate,
      this._content,
      this._snapshot,
      this._rating
    );
    clone._lifecycle = { ...this._lifecycle };
    return clone;
  }
}
