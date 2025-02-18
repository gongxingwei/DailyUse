<template>
  <div class="page-container">
    <div class="page-header">
      <h2>提醒事项</h2>
      <v-spacer></v-spacer>
      <AddReminder />
    </div>

    <!-- Reminders List -->
    <div class="reminders-list">
      <ReminderCard
        v-for="reminder in reminders"
        :key="reminder.id"
        :reminder="reminder"
      />
      
      <div v-if="!reminders.length" class="text-center py-8 text-medium-emphasis">
        <v-icon size="40">mdi-bell-off-outline</v-icon>
        <div class="mt-2">暂无提醒事项</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useReminderStore } from './reminderStore';
import ReminderCard from './components/ReminderCard.vue';
import AddReminder from './components/AddReminder.vue';

const reminderStore = useReminderStore();
const reminders = computed(() => reminderStore.getReminders);

</script>

<style scoped>
.reminders-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>