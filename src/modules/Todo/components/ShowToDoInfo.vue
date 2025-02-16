<template>
  <v-dialog v-model="dialogVisible" max-width="500px">
    <v-card>
      <v-card-title class="text-h5">{{ todo?.title }}</v-card-title>
      
      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
              <div class="text-subtitle-1">内容：</div>
              <div class="text-body-1">{{ todo?.description }}</div>
            </v-col>
            
            <v-col cols="12">
              <div class="text-subtitle-1">时间：</div>
              <div class="text-body-1">{{ formatDateTime(todo?.datetime) }}</div>
            </v-col>

            <v-col cols="12">
              <div class="text-subtitle-1">状态：</div>
              <div class="text-body-1">{{ todo?.completed ? '已完成' : '未完成' }}</div>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="text" @click="dialogVisible = false">关闭</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Todo } from '@/modules/Todo/todoStore'

interface Props {
  modelValue: boolean
  todo: Todo | null  // 允许为 null
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  todo: null
})

const emit = defineEmits(['update:modelValue'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formatDateTime = (datetime: string | undefined) => {
  if (!datetime) return ''
  return new Date(datetime).toLocaleString('zh-CN')
}
</script>
