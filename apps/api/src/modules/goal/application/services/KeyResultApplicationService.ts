import type { GoalContracts } from '@dailyuse/contracts';
import { KeyResult, type IGoalRepository } from '@dailyuse/domain-server';

export class KeyResultApplicationService {
  constructor(private goalRepository: IGoalRepository) {}

  // ===== KeyResult 管理 =====

  async createKeyResult(
    accountUuid: string,
    request: GoalContracts.CreateKeyResultRequest,
  ): Promise<GoalContracts.KeyResultResponse> {
    // 构建关键结果数据
    const keyResultData: Omit<GoalContracts.KeyResultDTO, 'uuid' | 'lifecycle'> = {
      accountUuid,
      goalUuid: request.goalUuid,
      name: request.name,
      description: request.description,
      startValue: request.startValue || 0,
      targetValue: request.targetValue,
      currentValue: request.currentValue || request.startValue || 0,
      unit: request.unit || '',
      weight: request.weight || 1,
      calculationMethod: request.calculationMethod || 'sum',
    };

    // 创建关键结果
    const created = await this.goalRepository.createKeyResult(accountUuid, keyResultData);

    // 转换为领域实体以获取响应格式
    const keyResult = KeyResult.fromDTO(created);
    return keyResult.toResponse();
  }

  async getKeyResultsByGoalUuid(
    accountUuid: string,
    goalUuid: string,
  ): Promise<GoalContracts.KeyResultResponse[]> {
    const keyResultDTOs = await this.goalRepository.getKeyResultsByGoalUuid(accountUuid, goalUuid);

    const keyResults = keyResultDTOs.map((dto) => {
      const keyResult = KeyResult.fromDTO(dto);
      return keyResult.toResponse();
    });

    return keyResults;
  }

  async getKeyResultById(
    accountUuid: string,
    uuid: string,
  ): Promise<GoalContracts.KeyResultResponse | null> {
    const keyResultDTO = await this.goalRepository.getKeyResultByUuid(accountUuid, uuid);
    if (!keyResultDTO) return null;

    const keyResult = KeyResult.fromDTO(keyResultDTO);
    return keyResult.toResponse();
  }

  async updateKeyResult(
    accountUuid: string,
    uuid: string,
    request: GoalContracts.UpdateKeyResultRequest,
  ): Promise<GoalContracts.KeyResultResponse> {
    // 构建更新数据
    const updateData: Partial<GoalContracts.KeyResultDTO> = {};

    if (request.name !== undefined) updateData.name = request.name;
    if (request.description !== undefined) updateData.description = request.description;
    if (request.startValue !== undefined) updateData.startValue = request.startValue;
    if (request.targetValue !== undefined) updateData.targetValue = request.targetValue;
    if (request.currentValue !== undefined) updateData.currentValue = request.currentValue;
    if (request.unit !== undefined) updateData.unit = request.unit;
    if (request.weight !== undefined) updateData.weight = request.weight;
    if (request.calculationMethod !== undefined)
      updateData.calculationMethod = request.calculationMethod;

    const updated = await this.goalRepository.updateKeyResult(accountUuid, uuid, updateData);
    const keyResult = KeyResult.fromDTO(updated);
    return keyResult.toResponse();
  }

  async updateKeyResultProgress(
    accountUuid: string,
    uuid: string,
    value: number,
  ): Promise<GoalContracts.KeyResultResponse> {
    const updated = await this.goalRepository.updateKeyResultProgress(accountUuid, uuid, value);
    const keyResult = KeyResult.fromDTO(updated);
    return keyResult.toResponse();
  }

  async deleteKeyResult(accountUuid: string, uuid: string): Promise<void> {
    await this.goalRepository.deleteKeyResult(accountUuid, uuid);
  }
}
