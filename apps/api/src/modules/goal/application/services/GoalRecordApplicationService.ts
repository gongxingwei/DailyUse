import type { GoalContracts } from '@dailyuse/contracts';
import { GoalRecord, type IGoalRepository } from '@dailyuse/domain-server';

export class GoalRecordApplicationService {
  constructor(private goalRepository: IGoalRepository) {}

  // ===== GoalRecord 管理 =====

  async createGoalRecord(
    accountUuid: string,
    request: GoalContracts.CreateGoalRecordRequest,
  ): Promise<GoalContracts.GoalRecordResponse> {
    // 首先获取关键结果信息来确定目标UUID
    const keyResult = await this.goalRepository.getKeyResultByUuid(
      accountUuid,
      request.keyResultUuid,
    );
    if (!keyResult) {
      throw new Error('Key result not found');
    }

    // 构建目标记录数据
    const goalRecordData: Omit<GoalContracts.GoalRecordDTO, 'uuid' | 'createdAt'> = {
      accountUuid,
      goalUuid: keyResult.goalUuid,
      keyResultUuid: request.keyResultUuid,
      value: request.value,
      note: request.note,
    };

    // 创建目标记录
    const created = await this.goalRepository.createGoalRecord(accountUuid, goalRecordData);

    // 转换为领域实体以获取响应格式
    const goalRecord = GoalRecord.fromDTO(created);
    return goalRecord.toResponse();
  }

  async getGoalRecordsByGoal(
    accountUuid: string,
    goalUuid: string,
  ): Promise<GoalContracts.GoalRecordListResponse> {
    const result = await this.goalRepository.getGoalRecordsByGoalUuid(accountUuid, goalUuid);

    const goalRecords = result.records.map((dto: GoalContracts.GoalRecordDTO) => {
      const goalRecord = GoalRecord.fromDTO(dto);
      return goalRecord.toResponse();
    });

    return {
      data: goalRecords,
      total: result.total,
    };
  }

  async getGoalRecordById(
    accountUuid: string,
    uuid: string,
  ): Promise<GoalContracts.GoalRecordResponse | null> {
    const goalRecordDTO = await this.goalRepository.getGoalRecordByUuid(accountUuid, uuid);

    if (!goalRecordDTO) {
      return null;
    }

    const goalRecord = GoalRecord.fromDTO(goalRecordDTO);
    return goalRecord.toResponse();
  }

  async getGoalRecordsByKeyResult(
    accountUuid: string,
    keyResultUuid: string,
  ): Promise<GoalContracts.GoalRecordListResponse> {
    const goalRecordDTOs = await this.goalRepository.getGoalRecordsByKeyResultUuid(
      accountUuid,
      keyResultUuid,
    );

    const goalRecords = goalRecordDTOs.map((dto: GoalContracts.GoalRecordDTO) => {
      const goalRecord = GoalRecord.fromDTO(dto);
      return goalRecord.toResponse();
    });

    return {
      data: goalRecords,
      total: goalRecords.length,
    };
  }

  async deleteGoalRecord(accountUuid: string, uuid: string): Promise<void> {
    await this.goalRepository.deleteGoalRecord(accountUuid, uuid);
  }
}
