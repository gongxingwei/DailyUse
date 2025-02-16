<template>
  <v-container class="goal-container pa-0">
    <!-- Header -->
    <div class="goal-header px-6 py-4">
      <div class="d-flex align-center justify-space-between">
        <h1 class="text-h5 font-weight-medium">{{ t('goal.title') }}</h1>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="showCreateDialog = true">
          {{ t('goal.create') }}
        </v-btn>
      </div>
    </div>

    <!-- Content -->
    <div class="goal-content px-6">
      <div v-if="goalStore.goals.length">
        <GoalCard v-for="goal in goalStore.goals" :key="goal.id" :goal="goal"
          @relative-todo="showRelativeTodoCard(goal.id)"
          @relative-repo="showRelativeRepoCard(goal.id)" @edit="startEditGoal(goal.id)" @delete="deleteGoal(goal.id)" />
      </div>
      <div class="empty-state" v-else>
        <v-icon size="64" color="grey-lighten-1">mdi-folder-multiple</v-icon>
        <div class="text-h6 mt-4">{{ t('goal.empty') }}</div>
        <div class="text-body-2 text-medium-emphasis mt-1">{{ t('goal.emptyTip') }}</div>
      </div>
    </div>

    <!-- 创建目标对话框 -->
    <v-dialog v-model="showCreateDialog" max-width="500px">
      <v-card>
        <v-card-title>{{ t('goal.createTitle') }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="newGoalName" :label="t('goal.nameLabel')" hide-details class="mb-4"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="error" @click="showCreateDialog = false">{{ t('common.2') }}</v-btn>
          <v-btn color="primary" @click="createGoal">{{ t('common.1') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 编辑目标对话框 -->
    <v-dialog v-model="showEditDialog" max-width="500px">
      <v-card>
        <v-card-title>{{ t('goal.editTitle') }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="newGoalName" :label="t('goal.nameLabel')" hide-details class="mb-4"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="error" @click="closeEditDialog">{{ t('common.2') }}</v-btn>
          <v-btn color="primary" @click="saveEditGoal">{{ t('common.1') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <RelativeRepo v-model="showRelativeRepo" :goalId="editingGoalId || 0" />
    <RelativeTodo v-model="showRelativeTodo" :goalId="editingGoalId || 0" />
    <Confirm v-model:model-value="showConfirmDialog" :title="t('goal.deleteTitle')"
      :message="t('goal.deleteConfirm')" :confirm-text="t('common.1')" :cancel-text="t('common.2')"
      @confirm="handleConfirm" @cancel="handleCancel" />
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGoalStore } from './goalStore'
import GoalCard from './components/GoalCard.vue'
import RelativeRepo from './components/RelativeRepo.vue'
import RelativeTodo from './components/RelativeTodo.vue'
import Confirm from '@/shared/components/Confirm.vue'

const { t } = useI18n()
const goalStore = useGoalStore()

const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showRelativeRepo = ref(false)
const showRelativeTodo = ref(false)
const editingGoalId = ref<number | null>(null)
const editingGoal = computed(() => editingGoalId.value ? goalStore.getGoalById(editingGoalId.value) : null)


const newGoalName = ref('')

const createGoal = () => {
  if (newGoalName.value.trim()) {
    goalStore.addGoal(newGoalName.value.trim())
    newGoalName.value = ''
    showCreateDialog.value = false
  }
}

const startEditGoal = (goalId: number) => {
  editingGoalId.value = goalId
  newGoalName.value = editingGoal.value?.name || ''
  showEditDialog.value = true
}

const saveEditGoal = () => {
  if (editingGoal.value && newGoalName.value.trim()) {
    goalStore.updateGoalName(editingGoal.value.name, newGoalName.value.trim())
    closeEditDialog()
  }
}

const showRelativeTodoCard = (goalId: number) => {
  showRelativeTodo.value = true
  editingGoalId.value = goalId
}

const showRelativeRepoCard = (goalId: number) => {
  showRelativeRepo.value = true
  editingGoalId.value = goalId
}

const closeEditDialog = () => {
  showEditDialog.value = false
  editingGoalId.value = null
  newGoalName.value = ''
}


// delete goal + Confirm dialog
const pendingDeleteId = ref<number | null>(null)

const deleteGoal = (goalId: number) => {
  pendingDeleteId.value = goalId
  showConfirmDialog.value = true;
}

const showConfirmDialog = ref(false);
const handleConfirm = () => {
  if (pendingDeleteId.value) {
    goalStore.removeGoal(pendingDeleteId.value)
    pendingDeleteId.value = null
  }
  showConfirmDialog.value = false
}

const handleCancel = () => {
  pendingDeleteId.value = null
  showConfirmDialog.value = false
}

</script>

<style scoped>
.goal-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.goal-header {
  flex-shrink: 0;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.goal-content {
  flex: 1;
  overflow-y: auto;
  padding-top: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
}
</style>