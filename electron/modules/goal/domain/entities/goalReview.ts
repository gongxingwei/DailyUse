import { Entity } from "@/shared/domain/entity";
import type { IGoalReview } from "@common/modules/goal";
import { isValid } from "date-fns";

/**
 * 目标复盘领域实体
 * 负责目标复盘的业务逻辑和数据管理
 */
export class GoalReview extends Entity implements IGoalReview {
  private _goalUuid: string;
  private _title: string;
  private _type: IGoalReview['type'];
  private _reviewDate: Date;
  private _content: IGoalReview['content'];
  private _snapshot: IGoalReview['snapshot'];
  private _rating: IGoalReview['rating'];
  private _lifecycle: IGoalReview['lifecycle'];

  constructor(params: {
    uuid?: string;
    goalUuid: string;
    title: string;
    type: IGoalReview['type'];
    reviewDate: Date;
    content: IGoalReview['content'];
    snapshot: IGoalReview['snapshot'];
    rating: IGoalReview['rating'];
  }) {
    super(params.uuid || GoalReview.generateId());
    const now = new Date();

    this._goalUuid = params.goalUuid;
    this._title = params.title;
    this._type = params.type;
    this._reviewDate = isValid(params.reviewDate) ? params.reviewDate : now;
    this._content = params.content;
    this._snapshot = params.snapshot;
    this._rating = params.rating;

    this._lifecycle = {
      createdAt: now,
      updatedAt: now,
    };
  }

  // Getters & Setters
  get goalUuid(): string {
    return this._goalUuid;
  }
  set goalUuid(value: string) {
    if (!value.trim()) throw new Error("目标ID不能为空");
    this._goalUuid = value;
    this._lifecycle.updatedAt = new Date();
  }

  get title(): string {
    return this._title;
  }
  set title(value: string) {
    if (!value.trim()) throw new Error("复盘标题不能为空");
    this._title = value;
    this._lifecycle.updatedAt = new Date();
  }

  get type(): IGoalReview['type'] {
    return this._type;
  }
  set type(value: IGoalReview['type']) {
    this._type = value;
    this._lifecycle.updatedAt = new Date();
  }

  get reviewDate(): Date {
    return this._reviewDate;
  }
  set reviewDate(value: Date) {
    if (!isValid(value)) throw new Error("复盘日期无效");
    this._reviewDate = value;
    this._lifecycle.updatedAt = new Date();
  }

  get content(): IGoalReview['content'] {
    return this._content;
  }
  set content(value: IGoalReview['content']) {
    this._content = value;
    this._lifecycle.updatedAt = new Date();
  }

  get snapshot(): IGoalReview['snapshot'] {
    return this._snapshot;
  }
  set snapshot(value: IGoalReview['snapshot']) {
    this._snapshot = value;
    this._lifecycle.updatedAt = new Date();
  }

  get rating(): IGoalReview['rating'] {
    return this._rating;
  }
  set rating(value: IGoalReview['rating']) {
    if (value) {
      const validateRating = (score: number, name: string) => {
        if (score < 1 || score > 10) {
          throw new Error(`${name}评分必须在1-10之间`);
        }
      };
      validateRating(value.progressSatisfaction, "进度满意度");
      validateRating(value.executionEfficiency, "执行效率");
      validateRating(value.goalReasonableness, "目标合理性");
    }
    this._rating = value;
    this._lifecycle.updatedAt = new Date();
  }

  get lifecycle(): IGoalReview['lifecycle'] {
    return this._lifecycle;
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
   * 判断对象是否为 GoalReview 或 IGoalReview
   */
  static isGoalReview(obj: any): obj is GoalReview | IGoalReview {
    return obj instanceof GoalReview || (obj && typeof obj === 'object' && 'uuid' in obj && 'goalUuid' in obj && 'title' in obj && 'type' in obj);
  }

  /**
   * 保证返回 GoalReview 实例或 null
   * @param review 可能为 DTO、实体或 null
   */
  static ensureGoalReview(review: IGoalReview | GoalReview | null): GoalReview | null {
    if (GoalReview.isGoalReview(review)) {
      return review instanceof GoalReview ? review : GoalReview.fromDTO(review);
    } else {
      return null;
    }
  }

  // /**
  //  * 保证返回 GoalReview 实例，永不为 null
  //  * @param review 可能为 DTO、实体或 null
  //  */
  // static ensureGoalReviewNeverNull(review: IGoalReview | GoalReview | null): GoalReview {
  //   if (GoalReview.isGoalReview(review)) {
  //     return review instanceof GoalReview ? review : GoalReview.fromDTO(review);
  //   } else {
  //     // 这里需要传入必要参数，建议调用 forCreate 并传入默认值
  //     return GoalReview.forCreate('', 'final', { overallProgress: 0, completedKeyResults: 0 });
  //   }
  // }

  /**
   * 从数据传输对象创建复盘实例
   */
  static fromDTO(data: IGoalReview): GoalReview {
  const goalReview = new GoalReview({
    uuid: data.uuid,
    goalUuid: data.goalUuid,
    title: data.title,
    type: data.type,
    reviewDate: new Date(data.reviewDate),
    content: data.content,
    snapshot: {
      ...data.snapshot,
      snapshotDate: new Date(data.snapshot.snapshotDate),
    },
    rating: data.rating,
  });
  goalReview._lifecycle = {
    createdAt: new Date(data.lifecycle.createdAt),
    updatedAt: new Date(data.lifecycle.updatedAt),
  };
  return goalReview;
}
  static forCreate(goalUuid: string, type: GoalReview['type'], snapshot: IGoalReview['snapshot']): GoalReview {
    const goalReview = new GoalReview({
      goalUuid: goalUuid,
      title: '',
      type: type,
      reviewDate: new Date(),
      snapshot: snapshot,
      content: {
        achievements: '',
        challenges: '',
        learnings: '',
        nextSteps: '',
      },
      rating: { progressSatisfaction: 0, executionEfficiency: 0, goalReasonableness: 0 },
    });
    return goalReview;
  }

  /**
   * 转换为数据传输对象
   */
  toDTO(): IGoalReview {
    return {
      uuid: this.uuid,
      goalUuid: this._goalUuid,
      title: this._title,
      type: this._type,
      reviewDate: this._reviewDate,
      content: this._content,
      snapshot: this._snapshot,
      rating: this._rating,
      lifecycle: this._lifecycle,
    };
  }

  clone(): GoalReview {
    const goalReview = new GoalReview({
      uuid: this.uuid,
      goalUuid: this._goalUuid,
      title: this._title,
      type: this._type,
      reviewDate: this._reviewDate,
      content: this._content,
      snapshot: this._snapshot,
      rating: this._rating,
    });
    goalReview._lifecycle = { ...this._lifecycle };
    return goalReview;
  }
}