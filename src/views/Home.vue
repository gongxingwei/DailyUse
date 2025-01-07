<template>
  <v-container>
    <div class="text-h6 font-weight-light">Todo</div>
    <v-row>
      <!-- 今天的任务 -->
      <v-col cols="12" md="6">
        <v-card>
            <ToDoListCard 
              :todo-date="0"
              :todos="todoStore.getTodosByDate(today)"
              @show-info="showTodoInfo"
              @edit="editTodo"
              @complete="toggleComplete"
              :showFullDate="false"
            />
        </v-card>
      </v-col>

      <!-- 明天的任务 -->
      <v-col cols="12" md="6">
        <v-card>
            <ToDoListCard 
              :todo-date="1"
              :todos="todoStore.getTodosByDate(tomorrow)"
              @show-info="showTodoInfo"
              @edit="editTodo"
              @complete="toggleComplete"
              :showFullDate="false"
            />
        </v-card>
      </v-col>
    </v-row>

    <!-- 弹窗组件 -->
    <ShowToDoInfo v-model="showInfo" :todo="selectedTodo" />
    <EditToDoCard v-model="showEditDialog" :todo="selectedTodo" />
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTodoStore } from '../stores/todo'
import type { Todo } from '../stores/todo'
import ToDoListCard from '../components/todos/ToDoListCard.vue'
import ShowToDoInfo from '../components/todos/ShowToDoInfo.vue'
import EditToDoCard from '../components/todos/EditToDoCard.vue'

const todoStore = useTodoStore()
const showInfo = ref(false)
const showEditDialog = ref(false)
const selectedTodo = ref<Todo | null>(null)

// 计算今天和明天的日期
const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)

// 事件处理函数
const showTodoInfo = (todo: Todo) => {
  selectedTodo.value = todo
  showInfo.value = true
}

const editTodo = (todo: Todo) => {
  selectedTodo.value = todo
  showEditDialog.value = true
}

const toggleComplete = (todo: Todo) => {
  todoStore.toggleComplete(todo)
}
</script>

<style scoped>
.v-card {
  height: 100%;
}

.v-card-title {
  border-bottom: 1px solid rgba(128, 128, 128, 0.1);
}
</style>

