<template>
  <v-card variant="outlined" class="mb-4">
    <v-card-title class="d-flex align-center">
      <v-icon class="me-2">mdi-target</v-icon>
      关键结果链接
      <v-spacer />
      <v-btn
        variant="text"
        size="small"
        @click="addKeyResultLink"
        :disabled="!availableKeyResults.length"
      >
        <v-icon>mdi-plus</v-icon>
        添加链接
      </v-btn>
    </v-card-title>

    <v-card-text>
      <div v-if="!keyResultLinks.length" class="text-center py-8">
        <v-icon size="48" color="grey-lighten-1" class="mb-2">
          mdi-target-variant
        </v-icon>
        <div class="text-body-2 text-grey">
          暂无关键结果链接
        </div>
        <div class="text-caption text-grey mt-1">
          链接到目标的关键结果，完成任务时将自动增加进度
        </div>
      </div>

      <div v-else>
        <v-row v-for="(link, index) in keyResultLinks" :key="`${link.goalUuid}-${link.keyResultId}`" class="mb-3">
          <v-col cols="12">
            <v-card variant="tonal" class="pa-3">
              <div class="d-flex align-center">
                <div class="flex-grow-1">
                  <v-row>
                    <!-- 目标选择 -->
                    <v-col cols="12" md="4">
                      <v-select
                        :model-value="link.goalUuid"
                        @update:model-value="(value) => updategoalUuid(index, value)"
                        :items="goalOptions"
                        item-title="title"
                        item-value="id"
                        label="选择目标"
                        variant="outlined"
                        density="compact"
                        :rules="[rules.required]"
                      >
                        <!-- <template #item="{ props, item }">
                          <v-list-item v-bind="props">
                            <template #prepend>
                              <v-icon>
                                mdi-flag
                              </v-icon>
                            </template>
                            <v-list-item-title>{{ item.raw.title }}</v-list-item-title>
                          </v-list-item>
                        </template> -->
                      </v-select>
                    </v-col>

                    <!-- 关键结果选择 -->
                    <v-col cols="12" md="4">
                      <v-select
                        :model-value="link.keyResultId"
                        @update:model-value="(value) => updateKeyResultId(index, value)"
                        :items="getKeyResultOptions(link.goalUuid)"
                        item-title="name"
                        item-value="id"
                        label="选择关键结果"
                        variant="outlined"
                        density="compact"
                        :disabled="!link.goalUuid"
                        :rules="[rules.required]"
                      >
                        <!-- <template #item="{ props, item }">
                          <v-list-item v-bind="props">
                            <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                            <v-list-item-subtitle>
                              {{ item.raw.currentValue }} / {{ item.raw.targetValue }} {{ 1 }}
                            </v-list-item-subtitle>
                          </v-list-item>
                        </template> -->
                      </v-select>
                    </v-col>

                  </v-row>

                  <!-- 链接信息显示 -->
                  <div v-if="link.goalUuid && link.keyResultId" class="mt-2">
                    <v-chip
                      size="small"
                      variant="tonal"
                      color="primary"
                      class="me-2"
                    >
                      <v-icon start>mdi-flag</v-icon>
                      {{ getGoalTitle(link.goalUuid) }}
                    </v-chip>
                    <v-chip
                      size="small"
                      variant="tonal"
                      color="secondary"
                    >
                      <v-icon start>mdi-target</v-icon>
                      {{ getKeyResultTitle(link.goalUuid, link.keyResultId) }}
                    </v-chip>
                  </div>
                </div>

                <!-- 删除按钮 -->
                <div class="ms-3">
                  <v-btn
                    variant="text"
                    size="small"
                    color="error"
                    @click="removeKeyResultLink(index)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- 可用关键结果提示 -->
      <v-alert
        v-if="!availableKeyResults.length"
        type="info"
        variant="tonal"
        class="mt-4"
      >
        <v-alert-title>无可用关键结果</v-alert-title>
        <div>
          当前没有可链接的关键结果。请先创建目标和关键结果，或检查现有目标是否处于活跃状态。
        </div>
        <template #append>
          <v-btn variant="text" @click="navigateToGoals">
            管理目标
          </v-btn>
        </template>
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useGoalStore } from '@/modules/Goal/presentation/stores/goalStore';
import { useRouter } from 'vue-router';
import type { TaskTemplate } from '@/modules/Task/domain/aggregates/taskTemplate';
import type { KeyResultLink } from '@common/modules/task/types/task';

interface Props {
  modelValue: TaskTemplate;
}

interface Emits {
  (e: 'update:modelValue', value: TaskTemplate): void;
  (e: 'update:validation', isValid: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const goalStore = useGoalStore();
const router = useRouter();

// 计算属性
const keyResultLinks = computed(() => props.modelValue.keyResultLinks || []);

const goalOptions = computed(() => {
  return goalStore.getInProgressGoals.filter(goal => 
    goal.keyResults && 
    goal.keyResults.length > 0
  );
});

const availableKeyResults = computed(() => {
  const results: Array<{ goalUuid: string; keyResultId: string; title: string; }> = [];
  goalOptions.value.forEach(goal => {
    goal.keyResults?.forEach(kr => {
      results.push({
        goalUuid: goal.uuid,
        keyResultId: kr.uuid,
        title: `${goal.name} - ${kr.name}`
      });
    });
  });
  return results;
});

// 验证规则
const rules = {
  required: (value: any) => !!value || '此字段为必填项',
  positiveNumber: (value: any) => {
    const num = Number(value);
    return (num > 0) || '增量值必须大于0';
  }
};

// 辅助方法
const getGoalTitle = (goalUuid: string) => {
  const goal = goalStore.getGoalByUuid(goalUuid);
  return goal?.name || '未知目标';
};

const getKeyResultTitle = (goalUuid: string, keyResultId: string) => {
  const goal = goalStore.getGoalByUuid(goalUuid);
  const keyResult = goal?.keyResults?.find(kr => kr.uuid === keyResultId);
  return keyResult?.name || '未知关键结果';
};

// const getKeyResultUnit = (goalUuid: string, keyResultId: string) => {
//   const goal = goalStore.getGoalById(goalUuid);
//   const keyResult = goal?.keyResults?.find(kr => kr.uuid === keyResultId);
//   return keyResult?.unit || '';
// };

const getKeyResultOptions = (goalUuid: string) => {
  const goal = goalStore.getGoalByUuid(goalUuid);
  return goal?.keyResults || [];
};

// const getGoalStatusColor = (status: string) => {
//   switch (status) {
//     case 'active': return 'success';
//     case 'completed': return 'primary';
//     case 'paused': return 'warning';
//     case 'cancelled': return 'error';
//     default: return 'grey';
//   }
// };


const navigateToGoals = () => {
  router.push('/goals');
};

// 方法
const addKeyResultLink = () => {
  const newLink: KeyResultLink = {
    goalUuid: '',
    keyResultId: '',
    incrementValue: 1
  };
  
  const updatedTemplate = props.modelValue.clone();
  updatedTemplate.addKeyResultLink(newLink);
  emit('update:modelValue', updatedTemplate);
};

const removeKeyResultLink = (index: number) => {
  const link = keyResultLinks.value[index];
  if (link) {
    const updatedTemplate = props.modelValue.clone();
    updatedTemplate.removeKeyResultLink(link.goalUuid, link.keyResultId);
    emit('update:modelValue', updatedTemplate);
  }
};

const updategoalUuid = (index: number, goalUuid: string) => {
  const updatedTemplate = props.modelValue.clone();
  const links = updatedTemplate.keyResultLinks || [];
  if (links[index]) {
    // 更新目标ID时，重置关键结果ID
    links[index] = {
      ...links[index],
      goalUuid,
      keyResultId: ''
    };
    emit('update:modelValue', updatedTemplate);
  }
};

const updateKeyResultId = (index: number, keyResultId: string) => {
  const updatedTemplate = props.modelValue.clone();
  const links = updatedTemplate.keyResultLinks || [];
  if (links[index]) {
    links[index] = {
      ...links[index],
      keyResultId
    };
    emit('update:modelValue', updatedTemplate);
  }
};

// 验证逻辑
const validateKeyResultLinks = () => {
  if (!keyResultLinks.value.length) {
    return true; // 关键结果链接是可选的
  }
  
  return keyResultLinks.value.every(link => {
    return link.goalUuid && 
           link.keyResultId && 
           link.incrementValue > 0;
  });
};

// 监听变化并触发验证
watch(
  () => keyResultLinks.value,
  () => {
    const isValid = validateKeyResultLinks();
    emit('update:validation', isValid);
  },
  { deep: true, immediate: true }
);
</script>

<style scoped>
.task-template-form-container {
  max-width: 100%;
}

.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.v-chip {
  margin: 2px;
}
</style>