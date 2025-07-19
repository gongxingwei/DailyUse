<template>
  <div class="grid-template-item" :class="{ disabled: !item.enabled }" @click="handleClick">
    <div class="template-icon">
      <v-icon size="32" :color="item.enabled ? 'primary' : 'grey'">
        {{ 'mdi-bell' }}
      </v-icon>
    </div>
    <div class="template-name">
      {{ item.name }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { ReminderTemplate } from '../../../domain/aggregates/reminderTemplate';

const props = defineProps<{
  item: ReminderTemplate;
}>();

const onClickTemplate = inject<(item: ReminderTemplate) => void>('onClickTemplate');


const handleClick = () => {
  onClickTemplate?.(props.item);
};


</script>

<style scoped>
.grid-template-item {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  padding: 8px;
}

.grid-template-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.grid-template-item.disabled {
  opacity: 0.5;
  background: rgba(128, 128, 128, 0.2);
}

.template-icon {
  margin-bottom: 4px;
}

.template-name {
  font-size: 10px;
  text-align: center;
  line-height: 1.2;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.disabled .template-name {
  color: #999;
}
</style>
