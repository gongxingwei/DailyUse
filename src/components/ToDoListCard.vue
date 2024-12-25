<!-- src/components/ToDoListCard.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

interface Todo {
  id: number
  title: string
  content: string
  datetime: string
  completed: boolean
}

const props = defineProps<{
  todoDate: number
  todos: Todo[]
}>()

const today = new Date()

const toDoDateLabel = computed(() => {
  switch(props.todoDate) {
    case 0: return '今天'
    case 1: return '明天'
    case 2: return '后天'
    case 3: return '大后天'
    default: return ''
  }
})

const toDoDate = computed(() => {
  const date = new Date(today)
  date.setDate(today.getDate() + props.todoDate)
  
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
})

const formatTime = (datetime: string) => {
  return new Date(datetime).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const showInfo = ref(false)
const selectedTodo = ref<Todo | null>(null)

// const showTodoInfo = (todo: Todo) => {
//   selectedTodo.value = todo
//   showInfo.value = true
// }

defineEmits(['show-info', 'edit', 'complete'])
</script>

<template>
  <v-card>
    <v-container>
      <v-row>
        <v-col>{{ toDoDateLabel }}</v-col>
        <v-col class="text-right">{{ toDoDate }}</v-col>
      </v-row>
      <v-list>
        <v-list-item 
          v-for="todo in todos" 
          :key="todo.id"
          @click="$emit('show-info', todo)"
        >
          <v-row align="center" justify="space-between">
            <v-col cols="8">
              <v-list-item-title 
                :class="{ 'text-decoration-line-through': todo.completed, 'text-grey': todo.completed }"
              >
                {{ todo.title }}
              </v-list-item-title>
              <v-list-item-subtitle>{{ formatTime(todo.datetime) }}</v-list-item-subtitle>
            </v-col>
            <v-col cols="4" class="d-flex justify-end">
              <v-btn icon="mdi-pencil" @click.stop="$emit('edit', todo)"></v-btn>
              <v-btn 
                :icon="todo.completed ? 'mdi-check-circle' : 'mdi-check'" 
                :color="todo.completed ? 'success' : 'default'"
                @click.stop="$emit('complete', todo.id)"
              ></v-btn>
            </v-col>
          </v-row>
        </v-list-item>
      </v-list>
    </v-container>

    <!-- 添加详情对话框 -->
    <ShowToDoInfo 
      v-model="showInfo"
      :todo="selectedTodo"
    />
  </v-card>
</template>