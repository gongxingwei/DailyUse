/**
 * DTO 类型定义优化 - 前后对比示例
 * 
 * 展示优化前后的类型定义差异
 */

// ============================================
// 优化前（❌ 冗余、维护成本高）
// ============================================

// --- KeyResult 示例 ---

export interface KeyResultDTO_OLD {
  uuid: string;
  goalUuid: string;
  name: string;
  description?: string;
  startValue: number;
  targetValue: number;
  currentValue: number;
  unit: string;
  weight: number;
  calculationMethod: KeyResultCalculationMethod;
  lifecycle: {
    createdAt: number;
    updatedAt: number;
    status: KeyResultStatus;
  };
}

// ❌ 问题1：重复定义所有字段
export interface CreateKeyResultRequest_OLD {
  name: string; // 重复
  description?: string; // 重复
  startValue: number; // 重复
  targetValue: number; // 重复
  currentValue?: number; // 重复
  unit: string; // 重复
  weight: number; // 重复
  calculationMethod?: KeyResultCalculationMethod; // 重复
  // ❌ 缺少 uuid（后端生成，前端无法乐观更新）
}

// ❌ 问题2：再次重复所有字段
export interface UpdateKeyResultRequest_OLD {
  name?: string; // 重复
  description?: string; // 重复
  startValue?: number; // 重复
  targetValue?: number; // 重复
  currentValue?: number; // 重复
  unit?: string; // 重复
  weight?: number; // 重复
  calculationMethod?: KeyResultCalculationMethod; // 重复
  status?: KeyResultStatus; // 重复
}

// ❌ 维护问题示例：
// 如果需要给 KeyResultDTO 添加一个新字段 'priority'：
// 1. 修改 KeyResultDTO ✏️
// 2. 修改 CreateKeyResultRequest ✏️
// 3. 修改 UpdateKeyResultRequest ✏️
// 4. 容易遗漏某个类型
// 5. 容易出现类型不一致

// --- Goal 示例 ---

export interface CreateGoalRequest_OLD {
  // ❌ 缺少 uuid
  name: string;
  description?: string;
  color: string;
  dirUuid?: string;
  startTime: number;
  endTime: number;
  note?: string;
  analysis: {
    motive: string;
    feasibility: string;
    importanceLevel: ImportanceLevel;
    urgencyLevel: UrgencyLevel;
  };
  metadata: {
    tags: string[];
    category: string;
  };
  keyResults?: CreateKeyResultRequest_OLD[];
}

// ❌ 前端使用问题：
async function createGoal_OLD(data: Omit<CreateGoalRequest_OLD, 'uuid'>) {
  // ❌ 无法立即获得 uuid
  const response = await api.createGoal(data);
  
  // ❌ 需要等待后端返回才能使用 uuid
  const goalUuid = response.uuid;
  
  // ❌ 乐观更新困难：需要临时 ID 管理
  const tempId = `temp-${Date.now()}`;
  store.addGoal({ ...data, uuid: tempId });
  
  // ❌ 收到响应后需要替换临时 ID
  store.updateGoalUuid(tempId, response.uuid);
}

// ============================================
// 优化后（✅ DRY、类型安全、易维护）
// ============================================

// --- KeyResult 示例 ---

export interface KeyResultDTO {
  uuid: string;
  goalUuid: string;
  name: string;
  description?: string;
  startValue: number;
  targetValue: number;
  currentValue: number;
  unit: string;
  weight: number;
  calculationMethod: KeyResultCalculationMethod;
  lifecycle: {
    createdAt: number;
    updatedAt: number;
    status: KeyResultStatus;
  };
}

// ✅ 优点1：类型复用，单一数据源
export type CreateKeyResultRequest = Pick<
  KeyResultDTO,
  'uuid' | 'name' | 'startValue' | 'targetValue' | 'unit' | 'weight'
> & {
  description?: string;
  currentValue?: number;
  calculationMethod?: KeyResultCalculationMethod;
};

// ✅ 优点2：自动同步，修改 DTO 自动影响此类型
export type UpdateKeyResultRequest = Partial<
  Omit<KeyResultDTO, 'uuid' | 'goalUuid' | 'lifecycle'>
> & {
  status?: KeyResultStatus;
};

// ✅ 维护优势示例：
// 如果需要给 KeyResultDTO 添加一个新字段 'priority'：
// 1. 只需修改 KeyResultDTO ✏️
// 2. CreateKeyResultRequest 自动更新（如果需要在创建时指定，添加到 Pick 中）
// 3. UpdateKeyResultRequest 自动包含 'priority?'（通过 Partial）
// 4. TypeScript 保证类型一致性

// --- Goal 示例 ---

export type CreateGoalRequest = Pick<
  GoalDTO,
  'uuid' | 'name' | 'color' | 'startTime' | 'endTime' | 'analysis' | 'metadata'
> & {
  description?: string;
  dirUuid?: string;
  note?: string;
  keyResults?: CreateKeyResultRequest[];
};

// ✅ 前端使用优势：
import { v4 as uuidv4 } from 'uuid';

async function createGoal(data: Omit<CreateGoalRequest, 'uuid'>) {
  // ✅ 立即生成 uuid
  const goalUuid = uuidv4();
  
  const request: CreateGoalRequest = {
    ...data,
    uuid: goalUuid, // 包含 uuid
  };
  
  // ✅ 立即进行乐观更新（无需等待后端响应）
  store.addGoal({
    ...request,
    lifecycle: { status: 'active', createdAt: Date.now(), updatedAt: Date.now() },
    version: 0,
  });
  
  // ✅ 发送请求（后端直接使用前端的 uuid）
  const response = await api.createGoal(request);
  
  // ✅ 收到响应后只需更新服务端数据（无需替换 ID）
  store.updateGoal(goalUuid, response);
}

// ============================================
// 类型安全对比
// ============================================

// ❌ 旧方案：容易出现类型不一致
interface CreateRequest_OLD {
  name: string;
  age: number;
}

interface UpdateRequest_OLD {
  name?: string;
  age?: number;
  // ❌ 手动添加新字段时容易遗漏
}

interface DTO_OLD {
  uuid: string;
  name: string;
  age: number;
  // ✏️ 新增字段
  email: string;
  // ❌ 如果忘记更新 CreateRequest_OLD 和 UpdateRequest_OLD
  // TypeScript 不会报错，但运行时会出问题
}

// ✅ 新方案：自动同步，类型安全
interface DTO {
  uuid: string;
  name: string;
  age: number;
  email: string; // ✏️ 新增字段
}

type CreateRequest = Pick<DTO, 'uuid' | 'name' | 'age' | 'email'>;
// ✅ 自动包含 'email'

type UpdateRequest = Partial<Omit<DTO, 'uuid'>>;
// ✅ 自动包含 'email?'

// ============================================
// 实际使用对比
// ============================================

// --- 场景1：创建目标 ---

// ❌ 旧方案
async function createGoalOld() {
  const tempId = `temp-${Date.now()}`;
  const data = {
    name: '学习 TypeScript',
    color: '#FF5733',
    startTime: Date.now(),
    endTime: Date.now() + 30 * 24 * 60 * 60 * 1000,
    analysis: { ... },
    metadata: { ... },
  };
  
  // 乐观更新（使用临时 ID）
  store.addGoal({ ...data, uuid: tempId });
  
  try {
    const response = await api.createGoal(data);
    // 替换临时 ID
    store.replaceGoalId(tempId, response.uuid);
  } catch (error) {
    // 回滚
    store.removeGoal(tempId);
  }
}

// ✅ 新方案
async function createGoalNew() {
  const goalUuid = uuidv4(); // 前端生成真实 uuid
  const data: CreateGoalRequest = {
    uuid: goalUuid, // ✅ 真实 uuid
    name: '学习 TypeScript',
    color: '#FF5733',
    startTime: Date.now(),
    endTime: Date.now() + 30 * 24 * 60 * 60 * 1000,
    analysis: { ... },
    metadata: { ... },
  };
  
  // 乐观更新（使用真实 uuid）
  store.addGoal({
    ...data,
    lifecycle: { status: 'active', createdAt: Date.now(), updatedAt: Date.now() },
    version: 0,
  });
  
  try {
    const response = await api.createGoal(data);
    // ✅ 只需更新服务端数据（uuid 不变）
    store.updateGoal(goalUuid, response);
  } catch (error) {
    // 回滚
    store.removeGoal(goalUuid);
  }
}

// --- 场景2：添加关键结果 ---

// ❌ 旧方案
async function addKeyResultOld(goalUuid: string) {
  const tempId = `temp-kr-${Date.now()}`;
  const data = {
    name: '完成基础教程',
    startValue: 0,
    targetValue: 10,
    unit: '章',
    weight: 50,
  };
  
  // 乐观更新（使用临时 ID）
  store.addKeyResult(goalUuid, { ...data, uuid: tempId });
  
  try {
    const response = await api.addKeyResult(goalUuid, data);
    // 替换临时 ID
    store.replaceKeyResultId(goalUuid, tempId, response.uuid);
  } catch (error) {
    store.removeKeyResult(goalUuid, tempId);
  }
}

// ✅ 新方案
async function addKeyResultNew(goalUuid: string) {
  const keyResultUuid = uuidv4(); // 前端生成真实 uuid
  const data: CreateKeyResultRequest = {
    uuid: keyResultUuid, // ✅ 真实 uuid
    name: '完成基础教程',
    startValue: 0,
    targetValue: 10,
    unit: '章',
    weight: 50,
  };
  
  // 乐观更新（使用真实 uuid）
  store.addKeyResult(goalUuid, {
    ...data,
    goalUuid,
    currentValue: 0,
    calculationMethod: 'INCREMENTAL',
    lifecycle: { status: 'active', createdAt: Date.now(), updatedAt: Date.now() },
  });
  
  try {
    const response = await api.addKeyResult(goalUuid, data);
    // ✅ 只需更新服务端数据（uuid 不变）
    store.updateKeyResult(goalUuid, keyResultUuid, response);
  } catch (error) {
    store.removeKeyResult(goalUuid, keyResultUuid);
  }
}

// ============================================
// 性能对比
// ============================================

// ❌ 旧方案：前端需要维护临时 ID → 真实 ID 的映射
const tempIdMap = new Map<string, string>();

function addTempGoal(tempId: string, data: any) {
  store.addGoal({ ...data, uuid: tempId });
}

function replaceTempId(tempId: string, realId: string) {
  tempIdMap.set(tempId, realId);
  const goal = store.getGoal(tempId);
  store.removeGoal(tempId);
  store.addGoal({ ...goal, uuid: realId });
  
  // ❌ 还需要更新所有引用此 ID 的地方
  // 例如：关键结果的 goalUuid
  const keyResults = store.getKeyResultsByGoalId(tempId);
  keyResults.forEach(kr => {
    store.updateKeyResult(kr.uuid, { goalUuid: realId });
  });
}

// ✅ 新方案：无需映射，直接使用真实 uuid
function addGoal(uuid: string, data: any) {
  store.addGoal({ ...data, uuid });
  // ✅ 所有引用都使用真实 uuid，无需后续更新
}

// ============================================
// 总结
// ============================================

/**
 * 优化前的问题：
 * 1. ❌ 类型定义冗余（重复定义字段）
 * 2. ❌ 维护成本高（修改 DTO 需要同步修改多个类型）
 * 3. ❌ 容易出现类型不一致
 * 4. ❌ 后端生成 uuid（前端无法乐观更新）
 * 5. ❌ 前端需要临时 ID 管理
 * 6. ❌ 需要处理 ID 替换逻辑
 * 
 * 优化后的优势：
 * 1. ✅ 类型复用（基于 DTO 派生）
 * 2. ✅ 单一数据源（DTO 是唯一的字段定义）
 * 3. ✅ 自动同步（修改 DTO 自动影响其他类型）
 * 4. ✅ 类型安全（TypeScript 保证一致性）
 * 5. ✅ 前端生成 uuid（立即可用）
 * 6. ✅ 乐观更新简单（无需临时 ID）
 * 7. ✅ 代码量减少（减少 75% 的类型定义代码）
 * 8. ✅ 更好的开发体验（IDE 自动补全更准确）
 */
