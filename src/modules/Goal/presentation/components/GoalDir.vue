<template>
    <v-card class="goal-dir h-100 d-flex flex-column" elevation="0" variant="flat">
      <!-- 头部 -->
      <v-card-title class="goal-dir-header d-flex align-center justify-space-between pa-4">
        <div class="d-flex align-center">
          <v-icon color="primary" class="mr-2">mdi-folder-multiple</v-icon>
          <span class="text-h6 font-weight-medium">目标节点</span>
        </div>
        
        <!-- 添加按钮 -->
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-plus"
              size="small"
              variant="text"
              color="primary"
              class="add-btn"
            >
              <v-icon>mdi-plus</v-icon>
              <!-- <v-tooltip activator="parent" location="bottom" text="123" content-class="custom-tooltip-class text-center px-2">
                <span class="text-caption">添加目标节点</span>
                添加目标节点
              </v-tooltip> -->
            </v-btn>
          </template>
          
          <v-list class="py-2" min-width="180">
            <v-list-item @click="goalDirDialog.startCreateGoalDir" class="px-4">
              <template v-slot:prepend>
                <v-icon color="primary">mdi-folder-plus</v-icon>
              </template>
              <v-list-item-title>创建目标节点</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-card-title>
  
      <v-divider></v-divider>
  
      <!-- 目标节点列表 -->
      <v-card-text class="goal-dir-list pa-0 flex-grow-1 overflow-y-auto">
        <v-list class="py-0" density="compact">
          <v-list-item
            v-for="item in goalDirs"
            :key="item.uuid"
            :class="{ 'goal-dir-item--active': selectedDirId === item.uuid }"
            class="goal-dir-item mx-2 my-1"
            @click="selectDir(item.uuid)"
            rounded="lg"
          >
            <template v-slot:prepend>
              <v-icon :color="selectedDirId === item.uuid ? 'primary' : 'medium-emphasis'">
                {{ item.icon }}
              </v-icon>
            </template>
            
            <v-list-item-title class="font-weight-medium">
              {{ item.name }}
            </v-list-item-title>
            
            <template v-slot:append>
              <v-chip
                :color="selectedDirId === item.uuid ? 'primary' : 'surface-bright'"
                :text-color="selectedDirId === item.uuid ? 'on-primary' : 'on-surface-variant'"
                size="small"
                variant="flat"
                class="font-weight-bold"
              >
                {{ getGoalsCountByDirId(item.uuid) }}
              </v-chip>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
  
      <!-- 对话框 -->
      <GoalDirDialog 
        v-model="goalDirDialog.showGoalDirDialog.value"
        :goal-dir-data="goalDirDialog.goalDirData.value"
        :goal-dir-dialog-mode="goalDirDialog.goalDirDialogMode.value"
        @save="goalDirDialog.handleSaveGoalDir" 
        @cancel="goalDirDialog.closeGoalDirDialog" 
      />
    </v-card>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue';
  import { useGoalStore } from '../stores/goalStore';
  import GoalDirDialog from './GoalDirDialog.vue';
  import { useGoalManagement } from '../composables/useGoalManagement';
  import { useGoalDirDialog } from '../composables/useGoalDirDialog';

  const goalDirDialog = useGoalDirDialog();
  const { selectedDirId, getGoalsCountByDirId } = useGoalManagement();
  
  const emit = defineEmits<{
    (e: 'selected-goal-dir-id', selectedDirId: string): void
    (e: 'add-goal-dir'): void
  }>();
  
  const goalStore = useGoalStore();
  const goalDirs = computed(() => {
    const allGoalDirs = goalStore.getAllGoalDirs;
    console.log("🔍 [目标目录组件] 获取所有目标目录:", JSON.stringify(allGoalDirs, null, 2));
    return allGoalDirs;
  });

  const selectDir = (dirId: string) => {
    selectedDirId.value = dirId;
    emit('selected-goal-dir-id', dirId);
  };
  </script>
  
  <style scoped>
  .goal-dir {
    border: 1px solid rgba(var(--v-theme-outline), 0.12);
    border-radius: 16px;
    background-color: rgb(var(--v-theme-surface));
  }
  
  .goal-dir-header {
    background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05) 0%, rgba(var(--v-theme-primary), 0.02) 100%);
    border-radius: 16px 16px 0 0;
  }
  
  .add-btn {
    transition: all 0.2s ease;
  }
  
  .add-btn:hover {
    background-color: rgba(var(--v-theme-primary), 0.08);
    transform: scale(1.05);
  }
  
  .goal-dir-item {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    margin: 4px 8px;
  }
  
  .goal-dir-item:hover {
    background-color: rgba(var(--v-theme-primary), 0.08);
    transform: translateX(4px);
  }
  
  .goal-dir-item--active {
    background-color: rgba(var(--v-theme-primary), 0.12);
    border: 1px solid rgba(var(--v-theme-primary), 0.3);
  }
  
  .goal-dir-item--active:hover {
    background-color: rgba(var(--v-theme-primary), 0.16);
  }
  
  /* 滚动条美化 */
  .goal-dir-list::-webkit-scrollbar {
    width: 4px;
  }
  
  .goal-dir-list::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .goal-dir-list::-webkit-scrollbar-thumb {
    background: rgba(var(--v-theme-primary), 0.3);
    border-radius: 2px;
  }
  
  .goal-dir-list::-webkit-scrollbar-thumb:hover {
    background: rgba(var(--v-theme-primary), 0.5);
  }

  .custom-tooltip-class {
    background-color: rgba(var(--v-theme-background), 0.9);
    color: var(--v-theme-on-surface);
    border-radius: 4px;
    padding: 8px;
    font-size: 14px;
  }
  </style>