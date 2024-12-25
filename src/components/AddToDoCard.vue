<template>
  <v-dialog v-model="dialogVisible" max-width="500px">
    <v-card>
      <v-card-title class="text-h5">添加新任务</v-card-title>
      
      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="newTodo.title"
                label="标题"
                required
                :rules="[v => !!v || '标题不能为空']"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12">
              <v-textarea
                v-model="newTodo.content"
                label="内容"
                rows="3"
              ></v-textarea>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="newTodo.datetime"
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
import { ref, computed } from 'vue'
import { useTodoStore } from '../stores/todo'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue'])

const todoStore = useTodoStore()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const newTodo = ref({
  title: '',
  content: '',
  datetime: new Date().toISOString().slice(0, 16)
})

const closeDialog = () => {
  dialogVisible.value = false
  resetForm()
}

const saveTodo = () => {
  if (newTodo.value.title.trim()) {
    todoStore.addTodo({
      ...newTodo.value,
      completed: false
    })
    closeDialog()
  }
}

const resetForm = () => {
  newTodo.value = {
    title: '',
    content: '',
    datetime: new Date().toISOString().slice(0, 16)
  }
}
</script>