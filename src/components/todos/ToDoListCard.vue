<!-- src/components/ToDoListCard.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import ShowToDoInfo from './ShowToDoInfo.vue'
import type { Todo } from '../../stores/todo'

const props = defineProps<{
  todoDate: number
  todos: Todo[]
  showFullDate: boolean
}>()

const today = new Date()

const toDoDateLabel = computed(() => {
  switch(props.todoDate) {
    case -1: return '已过期'
    case 0: return '今天'
    case 1: return '明天'
    case 2: return '后天'
    case 3: return '大后天'
    case 4: return '4 天后'
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

const todosTime = (datetime: string) => {
  const date = new Date(datetime);
  return props.showFullDate ? date.toLocaleDateString('zh-CN') : date.toDateString();
};

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
      <v-card-text>
        <template v-if="todos.length > 0">
          <v-list>
            <v-list-item
              v-for="todo in todos"
              :key="todo.id"
              :class="{ 'text-decoration-line-through': todo.completed }"
            >
              <template v-slot:prepend>
                <v-checkbox
                  :model-value="todo.completed"
                  @change="$emit('complete', todo)"
                  hide-details
                ></v-checkbox>
              </template>

              <v-list-item-title>{{ todo.title }}</v-list-item-title>

              <template v-slot:append>
                <v-btn
                  icon="mdi-information"
                  variant="text"
                  size="small"
                  @click="$emit('show-info', todo)"
                ></v-btn>
                <v-btn
                  icon="mdi-pencil"
                  variant="text"
                  size="small"
                  @click="$emit('edit', todo)"
                ></v-btn>
              </template>
            </v-list-item>
          </v-list>
        </template>
        <template v-else>
          <div class="text-center text-medium-emphasis py-4">
            <v-icon size="large" color="grey-lighten-1">mdi-check-circle</v-icon>
            <div class="text-body-2 mt-2">暂无待办事项</div>
          </div>
        </template>
      </v-card-text>
    </v-container>

    <!-- 添加详情对话框 -->
    <ShowToDoInfo 
      v-model="showInfo"
      :todo="selectedTodo"
    />
  </v-card>
</template>