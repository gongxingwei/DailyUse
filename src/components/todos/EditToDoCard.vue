<template>
  <v-dialog v-model="dialogVisible" max-width="500px">
    <v-card>
      <v-card-title class="text-h5">编辑任务</v-card-title>
      
      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="editedTodo.title"
                label="标题"
                required
                :rules="[v => !!v || '标题不能为空']"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12">
              <v-textarea
                v-model="editedTodo.content"
                label="内容"
                rows="3"
              ></v-textarea>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="editedTodo.datetime"
                label="日期时间"
                type="datetime-local"
                required
              ></v-text-field>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="error" variant="text" @click="closeDialog">取消</v-btn>
        <v-btn color="primary" variant="text" @click="saveTodo">保存</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTodoStore } from '../../stores/todo'
import type { Todo } from '../../stores/todo'
import type { PropType } from 'vue'

interface Props {
  modelValue: boolean
  todo: Todo | null  // 允许为 null
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  todo: null
})

const emit = defineEmits(['update:modelValue'])
const todoStore = useTodoStore()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const editedTodo = ref<Todo>({
  id: 0,
  title: '',
  content: '',
  datetime: '',
  completed: false
})

// 监听 todo 属性变化，更新编辑表单
watch(() => props.todo, (newTodo) => {
  if (newTodo) {
    editedTodo.value = { ...newTodo }
    // 格式化日期时间为 HTML datetime-local 格式
    editedTodo.value.datetime = new Date(newTodo.datetime).toISOString().slice(0, 16)
  }
}, { immediate: true })

const closeDialog = () => {
  dialogVisible.value = false
}

const saveTodo = () => {
  if (editedTodo.value.title.trim()) {
    todoStore.updateTodo(editedTodo.value)
    closeDialog()
  }
}
</script> 