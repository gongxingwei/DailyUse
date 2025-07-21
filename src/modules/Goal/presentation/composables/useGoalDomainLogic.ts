import { computed } from 'vue';
import { useGoalStore } from '../stores/goalStore';

/**
 * 使用领域对象的 Goal 业务逻辑 Composable
 * 
 * 这个 composable 展示了如何使用领域对象进行业务操作：
 * 1. 获取领域对象进行业务计算
 * 2. 使用领域对象的业务方法
 * 3. 将修改后的领域对象保存回 store
 */
export function useGoalDomainLogic() {
  const goalStore = useGoalStore();

  // 获取所有目标的领域对象
  const goalEntities = computed(() => goalStore.getAllGoalEntities);

  // 获取所有目录的领域对象
  const goalDirEntities = computed(() => goalStore.getAllGoalDirEntities);

  // 获取过期的目标（使用领域对象的业务方法）
  const expiredGoals = computed(() => {
    return goalEntities.value.filter(goal => goal.isExpired);
  });

  // 获取已完成的目标
  const completedGoals = computed(() => {
    return goalEntities.value.filter(goal => goal.isCompleted);
  });

  // 获取活跃目标的剩余天数统计
  const remainingDaysStats = computed(() => {
    const activeGoals = goalEntities.value.filter(goal => 
      goal.lifecycle.status === 'active' && !goal.isExpired
    );
    
    return activeGoals.map(goal => ({
      uuid: goal.uuid,
      title: goal.title,
      remainingDays: goal.remainingDays,
      isUrgent: goal.remainingDays <= 7 && goal.remainingDays > 0
    }));
  });

  /**
   * 更新目标基本信息（使用领域对象）
   */
  const updateGoalBasicInfo = async (
    goalUuid: string, 
    updates: {
      title?: string;
      description?: string;
      color?: string;
      note?: string;
    }
  ) => {
    const goalEntity = goalStore.getGoalEntityById(goalUuid);
    if (!goalEntity) {
      throw new Error(`目标 ${goalUuid} 不存在`);
    }

    // 使用领域对象的业务方法
    goalEntity.updateBasicInfo(updates);

    // 保存更新后的领域对象
    await goalStore.updateGoalWithEntity(goalEntity);
  };

  /**
   * 更新目录信息（使用领域对象）
   */
  const updateGoalDirInfo = async (
    dirId: string,
    updates: {
      name?: string;
      icon?: string;
      parentId?: string;
    }
  ) => {
    const dirEntity = goalStore.getGoalDirEntityById(dirId);
    if (!dirEntity) {
      throw new Error(`目录 ${dirId} 不存在`);
    }

    // 使用领域对象的业务方法
    dirEntity.updateInfo(updates);

    // 保存更新后的领域对象
    await goalStore.updateGoalDirWithEntity(dirEntity);
  };

  /**
   * 归档目录（使用领域对象）
   */
  const archiveGoalDir = async (dirId: string) => {
    const dirEntity = goalStore.getGoalDirEntityById(dirId);
    if (!dirEntity) {
      throw new Error(`目录 ${dirId} 不存在`);
    }

    // 使用领域对象的业务方法
    dirEntity.archive();

    // 保存更新后的领域对象
    await goalStore.updateGoalDirWithEntity(dirEntity);
  };

  return {
    // 计算属性
    goalEntities,
    goalDirEntities,
    expiredGoals,
    completedGoals,
    remainingDaysStats,
    
    // 业务方法
    updateGoalBasicInfo,
    updateGoalDirInfo,
    archiveGoalDir,
  };
}
