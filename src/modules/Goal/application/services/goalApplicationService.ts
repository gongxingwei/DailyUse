import { useGoalStore } from "../../stores/goalStore";
import type {
  IRecordCreate,
} from "@/modules/Goal/types/goal";
export class GoalApplicationService {
    private readonly goalRepository: ReturnType<typeof useGoalStore>;
    constructor() {
        // 初始化GoalStore
        this.goalRepository = useGoalStore();
    }

    async addRecordAboutTaskInstanceComplete(
        goalId: string,
        keyResultId: string,
        contributionDelta: number = 1
    ): Promise<void> {
        try {
            let record: IRecordCreate = {
                value: contributionDelta,
                date: new Date().toISOString().split('T')[0], // 获取当前日期
                note: "任务实例完成记录",
            };

            // 调用GoalStore的更新方法
            await this.goalRepository.addRecord(
                record,
                goalId,
                keyResultId,
            );
        } catch (error) {
            console.error("更新目标进度失败:", error);
            throw new Error("Failed to update key result progress");
        }

    }
}