<!-- 使用临时对象 + computed 双向绑定模式的示例 -->
<template>
  <v-dialog v-model="showGoalDialog" height="550" width="800" class="goal-dialog" persistent>
    <v-card :style="{ backgroundColor: 'rgb(var(--v-theme-surface))' }" class="px-3 pb-2">
      <!-- 对话框头部 -->
      <v-card-title class="d-flex justify-space-between pa-4 flex-shrink-0">
        <v-btn variant="elevated" color="red-darken-3" @click="cancelGoalEdit">取消</v-btn>
        <span class="text-h5">{{ dialogTitle }}</span>
        <v-btn 
          color="primary" 
          @click="saveGoal" 
          :disabled="!isFormValid || loading" 
          :loading="loading"
        >
          完成
          <!-- 调试信息 -->
          <v-tooltip activator="parent" location="bottom">
            <div>
              <div>表单有效性: {{ isFormValid }}</div>
              <div>标题: {{ !!name?.trim() }}</div>
              <div>目录: {{ !!dirId?.trim() }}</div>
              <div>时间: {{ endTime > startTime }}</div>
              <div>加载中: {{ loading }}</div>
            </div>
          </v-tooltip>
        </v-btn>
      </v-card-title>

      <!-- Tabs -->
      <v-tabs v-model="activeTab" class="d-flex justify-center align-center flex-shrink-0 mb-2 pa-2"
        :style="{ backgroundColor: 'rgb(var(--v-theme-surface))' }">

        <v-tab v-for="(tab, index) in tabs" :key="index" :value="index"
          class="flex-grow-1"
          :style="activeTab === index ? { backgroundColor: 'rgba(var(--v-theme-surface-light), 0.3)' } : {}">
          <v-icon :icon="tab.icon" :color="tab.color" class="mr-2" />
          {{ tab.name }}
        </v-tab>
      </v-tabs>

      <v-card-text :style="{ backgroundColor: 'rgba(var(--v-theme-surface-light), 0.3)' }" class="pa-4 flex-grow-1">
        <v-window v-model="activeTab" class="h-100">
          <!-- 基本信息 -->
          <v-window-item :value="0">
            <v-form @submit.prevent>
              <!-- 标题和颜色 -->
              <v-row>
                <v-col cols="11">
                  <v-text-field 
                    v-model="name" 
                    :rules="nameRules" 
                    :error-messages="errors.name"
                    label="目标" 
                    placeholder="一段话来描述自己的目标" 
                    required 
                  />
                </v-col>
                <v-col cols="1">
                  <v-menu>
                    <template v-slot:activator="{ props }">
                      <v-btn v-bind="props" :style="{ backgroundColor: color }" class="color-btn mt-2" icon>
                        <v-icon color="white">mdi-palette</v-icon>
                      </v-btn>
                    </template>
                    <v-card min-width="200">
                      <v-card-text>
                        <div class="color-grid">
                          <v-btn v-for="colorOption in predefinedColors" :key="colorOption" 
                            :style="{ backgroundColor: colorOption }"
                            class="color-option" icon @click="color = colorOption" />
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-menu>
                </v-col>
              </v-row>

              <!-- 目标文件夹 -->
              <v-select 
                v-model="dirId" 
                :items="directoryOptions" 
                item-name="name" 
                item-value="value" 
                label="目标文件夹"
                :error-messages="errors.dirId"
                :disabled="directoryOptions.length === 1 && directoryOptions[0].disabled"
              >
                <template v-slot:prepend-inner>
                  <v-icon>mdi-folder</v-icon>
                </template>
                
                <!-- 空状态时的提示 -->
                <template v-if="directoryOptions.length === 1 && directoryOptions[0].disabled" v-slot:append>
                  <v-tooltip location="top">
                    <template v-slot:activator="{ props }">
                      <v-btn
                        v-bind="props"
                        icon="mdi-plus"
                        variant="text"
                        size="small"
                        color="primary"
                        @click="handleCreateFolder"
                      />
                    </template>
                    <span>创建新文件夹</span>
                  </v-tooltip>
                </template>
              </v-select>

              <!-- 描述 -->
              <v-textarea 
                v-model="description" 
                label="目标描述" 
                rows="3" 
              />

              <!-- 日期 -->
              <v-row>
                <v-col cols="6">
                  <v-text-field 
                    v-model="startTimeFormatted" 
                    label="开始时间" 
                    type="date"
                    :error-messages="errors.startTime" 
                    :rules="startTimeRules" 
                    @update:model-value="updateStartTime"
                    :min="minDate" 
                  />
                </v-col>
                <v-col cols="6">
                  <v-text-field 
                    v-model="endTimeFormatted" 
                    label="结束时间" 
                    type="date"
                    :error-messages="errors.endTime" 
                    :rules="endTimeRules" 
                    :min="startTimeFormatted"
                    @update:model-value="updateEndTime"
                  />
                </v-col>
              </v-row>

              <!-- Notes -->
              <v-textarea v-model="note" label="备注" rows="3" />
            </v-form>
          </v-window-item>

          <!-- Key Results Tab -->
          <v-window-item :value="1">
            <div class="key-results-overview">
              <v-alert v-if="errors.keyResults" type="error" variant="tonal" class="mb-4">
                {{ errors.keyResults }}
              </v-alert>
              
              <!-- 关键结果预览列表 -->
              <div v-if="keyResults.length > 0" class="mb-4">
                <h4 class="text-h6 mb-3">已添加的关键结果 ({{ keyResults.length }})</h4>
                <v-list>
                  <v-list-item
                    v-for="(kr, index) in keyResults"
                    :key="`kr-${index}`"
                    class="mb-2"
                  >
                    <template v-slot:prepend>
                      <v-icon :color="color">mdi-target</v-icon>
                    </template>
                    
                    <v-list-item-title>{{ kr.name || '未命名关键结果' }}</v-list-item-title>
                    <v-list-item-subtitle>
                      目标值: {{ kr.startValue || 0 }} → {{ kr.targetValue || 0 }}
                      <span v-if="kr.weight">(权重: {{ kr.weight }})</span>
                    </v-list-item-subtitle>
                    
                    <template v-slot:append>
                      <v-btn 
                        icon="mdi-pencil" 
                        variant="text" 
                        :color="color"
                        size="small"
                        @click="editKeyResultAtIndex(index)"
                      />
                      <v-btn 
                        icon="mdi-delete" 
                        variant="text" 
                        color="error"
                        size="small"
                        @click="removeKeyResult(index)"
                      />
                    </template>
                  </v-list-item>
                </v-list>
              </div>
              
              <!-- 空状态和添加按钮 -->
              <div v-else class="text-center py-8">
                <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-target-variant</v-icon>
                <h4 class="text-h6 text-medium-emphasis mb-2">还没有关键结果</h4>
                <p class="text-body-2 text-medium-emphasis mb-4">
                  关键结果是衡量目标达成的具体指标
                </p>
              </div>
              
              <!-- 添加关键结果按钮 -->
              <v-btn
                :color="color"
                variant="elevated"
                prepend-icon="mdi-plus"
                block
                class="add-kr-btn"
                @click="openKeyResultDialog"
              >
                {{ keyResults.length === 0 ? '添加第一个关键结果' : '添加更多关键结果' }}
              </v-btn>
              
              <!-- 提示信息 -->
              <v-alert
                type="info"
                variant="tonal"
                class="mt-4"
                density="compact"
              >
                <template v-slot:prepend>
                  <v-icon>mdi-lightbulb-outline</v-icon>
                </template>
                建议为每个目标设置 2-4 个关键结果，确保目标的可衡量性
              </v-alert>
            </div>
          </v-window-item>

          <!-- Motivation & Feasibility Tab -->
          <v-window-item :value="2">
            <div class="motivation-section">
              <v-row>
                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="h-100">
                    <v-card-title class="pb-2">
                      <v-icon color="primary" class="mr-2">mdi-lighthouse</v-icon>
                      目标动机
                    </v-card-title>
                    <v-card-text>
                      <v-textarea
                        v-model="analysis.motive"
                        placeholder="为什么要实现这个目标？它对你意味着什么？"
                        variant="outlined"
                        rows="6"
                        density="comfortable"
                        hide-details
                      />
                    </v-card-text>
                  </v-card>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="h-100">
                    <v-card-title class="pb-2">
                      <v-icon color="success" class="mr-2">mdi-lightbulb</v-icon>
                      可行性分析
                    </v-card-title>
                    <v-card-text>
                      <v-textarea
                        v-model="analysis.feasibility"
                        placeholder="分析实现这个目标的可行性、所需资源和可能的挑战"
                        variant="outlined"
                        rows="6"
                        density="comfortable"
                        hide-details
                      />
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>

      <!-- 错误提示 -->
      <v-alert
        v-if="errors.submit"
        type="error"
        class="ma-4"
      >
        {{ errors.submit }}
      </v-alert>
    </v-card>
  </v-dialog>

  <!-- 内嵌的关键结果对话框 -->
  <KeyResultDialog 
    :visible="keyResultDialogState.showDialog"
    :mode="keyResultDialogState.mode"
    :goal-uuid="keyResultDialogState.goalUuid"
    :key-result-data="keyResultDialogState.keyResultData"
    @save="handleSaveKeyResult"
    @cancel="handleCancelKeyResult"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { TimeUtils } from '@/shared/utils/myDateTimeUtils';
import { useGoalDialog } from '../composables/useGoalDialog';
import KeyResultDialog from './KeyResultDialog.vue';
import type { IGoal } from '@common/modules/goal/types/goal';

// 定义 props
const props = defineProps<{
  visible: boolean
  mode: 'create' | 'edit'
  goalData?: IGoal | null
}>();

// 定义 emits
const emit = defineEmits<{
  save: [goalData: any]
  cancel: []
}>();

// 使用 useGoalDialog composable
const {
  // 表单数据 - 使用计算属性进行双向绑定
  name,
  description,
  color,
  dirId,
  startTime,
  endTime,
  note,
  keyResults,
  analysis,
  
  // 表单状态
  errors,
  isFormValid,
  dialogTitle,
  
  // 方法
  validateForm,
  resetForm,
  
  // 服务访问
  goalStore
} = useGoalDialog();

// 添加调试计算属性
const debugInfo = computed(() => {
  const validation = {
    name: !!name.value?.trim(),
    dirId: !!dirId.value?.trim(),
    timeValid: endTime.value > startTime.value,
    isFormValid: isFormValid.value
  };
  console.log('🔍 [GoalDialog] 表单验证状态:', validation);
  console.log('🔍 [GoalDialog] 详细数据:', {
    name: name.value,
    dirId: dirId.value,
    startTime: startTime.value,
    endTime: endTime.value
  });
  return validation;
});

// 触发调试信息更新
watch([name, dirId, startTime, endTime], () => {
  debugInfo.value; // 触发计算属性执行
}, { immediate: true });

// 内部对话框显示状态
const showGoalDialog = computed({
  get: () => props.visible,
  set: (value: boolean) => {
    if (!value) {
      emit('cancel');
    }
  }
});

// 关键结果对话框状态管理
const keyResultDialogState = ref({
  showDialog: false,
  mode: 'create' as 'create' | 'edit',
  goalUuid: '',
  keyResultData: null as any
});

// 表单状态
const loading = ref(false);

// 监听props变化，更新表单数据
watch(() => props.visible, (newVal) => {
  if (newVal) {
    resetForm();
    if (props.mode === 'edit' && props.goalData) {
      loadGoalData(props.goalData);
    }
  }
}, { immediate: true });

watch(() => props.goalData, (newGoalData) => {
  if (props.visible && props.mode === 'edit' && newGoalData) {
    loadGoalData(newGoalData);
  }
});

// 加载目标数据到表单
const loadGoalData = (goal: IGoal) => {
  name.value = goal.name;
  description.value = goal.description || '';
  color.value = goal.color;
  dirId.value = goal.dirId;
  startTime.value = goal.startTime;
  endTime.value = goal.endTime;
  note.value = goal.note || '';
  keyResults.value = goal.keyResults || [];
  analysis.value = {
    motive: goal.analysis?.motive || '',
    feasibility: goal.analysis?.feasibility || ''
  };
};

// 关键结果相关方法
const openKeyResultDialog = () => {
  keyResultDialogState.value = {
    showDialog: true,
    mode: 'create',
    goalUuid: props.goalData?.uuid || '', // 传递当前目标的ID
    keyResultData: null
  };
};

const editKeyResultAtIndex = (index: number) => {
  const keyResult = keyResults.value[index];
  if (keyResult) {
    keyResultDialogState.value = {
      showDialog: true,
      mode: 'edit',
      goalUuid: props.goalData?.uuid || '', // 传递当前目标的ID
      keyResultData: { ...keyResult, index } // 添加索引以便后续更新
    };
  }
};

const removeKeyResult = (index: number) => {
  keyResults.value.splice(index, 1);
};

// 关键结果对话框事件处理
const handleSaveKeyResult = (keyResultData: any) => {
  if (keyResultDialogState.value.mode === 'edit' && keyResultDialogState.value.keyResultData?.index !== undefined) {
    // 编辑模式：更新现有关键结果
    const index = keyResultDialogState.value.keyResultData.index;
    keyResults.value[index] = { ...keyResultData };
  } else {
    // 创建模式：添加新关键结果
    keyResults.value.push({ ...keyResultData });
  }
  
  // 关闭对话框
  keyResultDialogState.value.showDialog = false;
  console.log('✅ 关键结果已保存到目标表单');
};

const handleCancelKeyResult = () => {
  keyResultDialogState.value.showDialog = false;
  console.log('🚫 取消关键结果编辑');
};

// 保存和取消方法
const saveGoal = () => {
  if (!validateForm()) return;
  
  // 构建目标数据，直接使用 composable 中的计算属性值
  const goalData = {
    name: name.value,
    description: description.value,
    color: color.value,
    dirId: dirId.value,
    startTime: startTime.value,
    endTime: endTime.value,
    note: note.value,
    keyResults: keyResults.value,
    analysis: analysis.value
  };
  
  emit('save', goalData);
};

const cancelGoalEdit = () => {
  emit('cancel');
};

// 处理创建文件夹
const handleCreateFolder = () => {
  // TODO: 打开文件夹创建对话框或导航到文件夹管理页面
  console.log('📁 用户请求创建新文件夹');
  // 这里可以emit一个事件让父组件处理，或者使用路由导航
  // emit('createFolder');
};

// 标签页状态
const activeTab = ref(0);

// 标签页配置
const tabs = [
  { name: '基本信息', icon: 'mdi-information', color: 'primary' },
  { name: '关键结果', icon: 'mdi-target', color: 'success' },
  { name: '动机分析', icon: 'mdi-lightbulb', color: 'warning' }
];

// 预定义颜色
const predefinedColors = [
  '#FF5733', '#33FF57', '#3357FF', '#FF33F1', '#F1FF33',
  '#33FFF1', '#F133FF', '#FF3333', '#33FF33', '#3333FF',
  '#FFAA33', '#AA33FF', '#33AAFF', '#FF33AA', '#AAFF33'
];

// 验证规则
const nameRules = [
  (value: string) => !!value || '目标标题不能为空'
];

const startTimeRules = [
  (value: string) => !!value || '开始时间不能为空'
];

const endTimeRules = [
  (value: string) => !!value || '结束时间不能为空',
  (value: string) => {
    if (!value || !startTimeFormatted.value) return true;
    return new Date(value) >= new Date(startTimeFormatted.value) || '结束时间不能早于开始时间';
  }
];

// 最小日期（今天）
const minDate = computed(() => {
  const today = new Date();
  return today.toISOString().split('T')[0];
});

// 目录选项 - 从store中读取用户自定义目录
const directoryOptions = computed(() => {
  const userDirs = goalStore.getUserGoalDirs;
  
  // 将用户自定义目录转换为选项格式
  const userOptions = userDirs.map((dir: any) => ({
    name: dir.name,
    value: dir.uuid,
    prepend: dir.icon || 'mdi-folder',
    disabled: false
  }));
  
  // 如果没有用户目录，提供提示信息
  if (userOptions.length === 0) {
    return [
      { 
        name: '暂无可用文件夹', 
        subtitle: '请先在目录管理中创建文件夹',
        value: '', 
        disabled: true,
        prepend: 'mdi-folder-plus'
      }
    ];
  }
  
  // 按名称排序
  return userOptions.sort((a, b) => a.name.localeCompare(b.name));
});

// 时间格式化处理
const startTimeFormatted = computed({
  get: () => {
    if (!startTime.value) return '';
    return TimeUtils.formatDateToInput(startTime.value);
  },
  set: () => {
    // 由 updateStartTime 方法处理
  }
});

const endTimeFormatted = computed({
  get: () => {
    if (!endTime.value) return '';
    return TimeUtils.formatDateToInput(endTime.value);
  },
  set: () => {
    // 由 updateEndTime 方法处理
  }
});

// 更新时间的方法
const updateStartTime = (value: string) => {
  if (value) {
    startTime.value = TimeUtils.fromISOString(value + 'T00:00:00.000Z');
  }
};

const updateEndTime = (value: string) => {
  if (value) {
    endTime.value = TimeUtils.fromISOString(value + 'T23:59:59.999Z');
  }
};

// 移除原有的defineExpose，因为现在不需要暴露方法给父组件
// 父组件通过props控制对话框的显示和数据传递
</script>

<style scoped>
/* 自定义样式 */
.goal-dialog {
  overflow-y: auto;
}

.v-card {
  overflow-y: auto;
  max-height: 90vh;
}

.color-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.color-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  padding: 8px;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
  min-width: 32px;
}

.color-option:hover {
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.motivation-section {
  height: 100%;
}

.v-window {
  height: 100%;
}

.v-window-item {
  height: 100%;
  overflow-y: auto;
}

/* Tab 样式优化 */
.v-tab {
  text-transform: none;
  font-weight: 500;
  border-radius: 12px;
  margin: 0 4px;
  transition: all 0.3s ease;
}

.v-tab:hover {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

/* 表单样式优化 */
.v-text-field, .v-textarea, .v-select {
  margin-bottom: 8px;
}

/* 关键结果卡片样式 */
.v-card[variant="outlined"] {
  border-radius: 12px;
  transition: all 0.2s ease;
}

.v-card[variant="outlined"]:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* 列表项样式 */
.v-list-item {
  border-radius: 8px;
  margin: 4px 0;
  transition: all 0.2s ease;
}

.v-list-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

/* 关键结果概览样式 */
.key-results-overview {
  padding: 16px 0;
}

.add-kr-btn {
  border-radius: 12px;
  text-transform: none;
  font-weight: 500;
}

.add-kr-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .color-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .v-dialog {
    width: 95vw !important;
    height: 90vh !important;
    max-width: none !important;
  }
  
  .motivation-section .v-row {
    flex-direction: column;
  }
  
  .motivation-section .v-col {
    max-width: 100%;
  }
}
</style>
