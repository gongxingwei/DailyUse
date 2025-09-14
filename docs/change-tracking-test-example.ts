// 变更跟踪系统测试示例
// 这个文件展示了如何使用新的变更跟踪系统

import { Goal, KeyResult } from '@dailyuse/domain-client';

// 模拟测试
function testChangeTracking() {
  // 1. 创建一个目标实例（模拟从服务器获取的数据）
  const goal = new Goal({
    name: '测试目标',
    color: '#FF5733',
    keyResults: [
      {
        uuid: 'existing-kr-1',
        name: '现有关键结果1',
        startValue: 0,
        targetValue: 100,
        currentValue: 30,
        weight: 50,
      },
      {
        uuid: 'existing-kr-2',
        name: '现有关键结果2',
        startValue: 0,
        targetValue: 50,
        currentValue: 10,
        weight: 30,
      },
    ],
  });

  // 2. 开始编辑模式（重要！）
  goal.startEditing();

  // 3. 执行各种操作

  // 添加新的关键结果
  const newKeyResult = new KeyResult({
    name: '新的关键结果',
    startValue: 0,
    targetValue: 200,
    currentValue: 0,
    unit: '个',
    weight: 20,
    calculationMethod: 'sum',
  });
  goal.addNewKeyResult(newKeyResult);

  // 更新现有关键结果
  goal.updateKeyResultWithTracking('existing-kr-1', {
    name: '更新后的关键结果名称',
    currentValue: 45,
  });

  // 删除一个关键结果
  goal.removeKeyResultWithTracking('existing-kr-2');

  // 4. 生成更新请求
  const updateRequest = goal.toUpdateRequest();

  console.log('生成的更新请求：', JSON.stringify(updateRequest, null, 2));

  // 预期的结果结构：
  // {
  //   "name": "测试目标",
  //   "color": "#FF5733",
  //   "keyResults": [
  //     {
  //       "action": "create",
  //       "data": {
  //         "name": "新的关键结果",
  //         "startValue": 0,
  //         "targetValue": 200,
  //         ...
  //       }
  //     },
  //     {
  //       "action": "update",
  //       "uuid": "existing-kr-1",
  //       "data": {
  //         "name": "更新后的关键结果名称",
  //         "currentValue": 45
  //       }
  //     },
  //     {
  //       "action": "delete",
  //       "uuid": "existing-kr-2"
  //     }
  //   ]
  // }

  return updateRequest;
}

// 在前端组件中的实际使用示例
export function useGoalEditing() {
  // 在 Vue 组件中这样使用：

  const goalModel = ref<Goal>(Goal.forCreate());
  const isEditing = ref(false);

  // 开始编辑现有目标
  function startEditingGoal(existingGoal: Goal) {
    goalModel.value = existingGoal.clone();
    goalModel.value.startEditing(); // 启用变更跟踪
    isEditing.value = true;
  }

  // 添加关键结果
  function addKeyResult(keyResultData: any) {
    const newKR = new KeyResult(keyResultData);
    if (isEditing.value) {
      goalModel.value.addNewKeyResult(newKR);
    } else {
      goalModel.value.addKeyResult(newKR); // 使用普通方法
    }
  }

  // 删除关键结果
  function removeKeyResult(uuid: string) {
    if (isEditing.value) {
      goalModel.value.removeKeyResultWithTracking(uuid);
    } else {
      goalModel.value.removeKeyResult(uuid); // 使用普通方法
    }
  }

  // 保存目标
  async function saveGoal() {
    if (isEditing.value) {
      // 编辑模式：生成包含变更操作的请求
      const updateRequest = goalModel.value.toUpdateRequest();
      await updateGoal(goalModel.value.uuid, updateRequest);
    } else {
      // 创建模式：使用DTO
      const createRequest = goalModel.value.toDTO();
      await createGoal(createRequest);
    }
  }

  return {
    goalModel,
    isEditing,
    startEditingGoal,
    addKeyResult,
    removeKeyResult,
    saveGoal,
  };
}
