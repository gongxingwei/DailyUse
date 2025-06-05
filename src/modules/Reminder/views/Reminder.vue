<template>
  <v-container fluid class="pa-6" id="reminder-view">
    <!-- 页面头部 -->
    <v-row class="mb-6">
      <v-col>
        <div class="d-flex align-center justify-space-between">
          <div class="page-title-section">
            <h1 class="text-h4 font-weight-bold text-primary mb-2">
              <v-icon size="32" class="mr-3">mdi-bell-ring</v-icon>
              提醒事项
            </h1>
            <p class="text-subtitle-1 text-medium-emphasis">
              管理您的日常提醒和重要事项
            </p>
          </div>
          <AddReminder />
        </div>
      </v-col>
    </v-row>

    <!-- 提醒列表 -->
    <v-row>
      <v-col cols="12">
        <v-fade-transition group>
          <div v-for="reminder in reminders" :key="reminder.id" class="mb-4">
            <ReminderCard :reminder="reminder" />
          </div>
        </v-fade-transition>
        
        <!-- 空状态 -->
        <v-card 
          v-if="!reminders.length" 
          class="text-center py-16" 
          variant="outlined"
          color="surface"
        >
          <v-card-text>
            <v-avatar size="80" color="grey-lighten-4" class="mb-4">
              <v-icon size="40" color="grey-lighten-1">mdi-bell-off-outline</v-icon>
            </v-avatar>
            <h3 class="text-h6 text-medium-emphasis mb-2">暂无提醒事项</h3>
            <p class="text-body-2 text-disabled">
              点击上方"添加提醒"按钮创建您的第一个提醒
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useReminderStore } from '../stores/reminderStore';
import ReminderCard from '../components/ReminderCard.vue';
import AddReminder from '../components/AddReminder.vue';

const reminderStore = useReminderStore();
const reminders = computed(() => reminderStore.getReminders);
</script>

<style scoped>
#reminder-view {
  min-height: 100%;
  background: linear-gradient(135deg,
      rgba(var(--v-theme-primary), 0.02) 0%,
      rgba(var(--v-theme-surface), 0.91) 100%);
}
.page-title-section {
  max-width: 70%;
}

@media (max-width: 768px) {
  .page-title-section {
    max-width: 100%;
    margin-bottom: 1rem;
  }
}
</style>