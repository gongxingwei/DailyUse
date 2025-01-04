<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTodoStore } from '../stores/todo'
import ToDoListCard from '../components/todos/ToDoListCard.vue'
import AddToDoCard from '../components/todos/AddToDoCard.vue'
import ShowToDoInfo from '../components/todos/ShowToDoInfo.vue'
import EditToDoCard from '../components/todos/EditToDoCard.vue'
import type { Todo } from '../stores/todo'  // 从 store 中导入 Todo 类型

const todoStore = useTodoStore()
const showAddDialog = ref(false)
const showInfo = ref(false)
const selectedTodo = ref<Todo | null>(null)
const showEditDialog = ref(false)

// 在组件挂载时加载数据
onMounted(() => {
  console.log('Store中的数据:', todoStore.todos)

  console.log('生成的日期数组:', dateList);
})

// 生成未来几天的日期数组
const dateList = Array.from({ length: 4 }).map((_, index) => {
  const date = new Date()
  date.setDate(date.getDate() + index)
  return date
})

const showTodoInfo = (todo: Todo) => {
  selectedTodo.value = todo
  showInfo.value = true
}

const editTodo = (todo: Todo) => {
  selectedTodo.value = todo
  showEditDialog.value = true
}

const toggleComplete = (todoId: number) => {
  todoStore.toggleComplete(todoId)
}
</script>

<template>
  <v-container>
    <v-row justify="center" class="mb-4">
      <v-btn
        color="primary"
        @click="showAddDialog = true"
      >
        <v-icon left>mdi-plus</v-icon>
        添加任务
      </v-btn>
    </v-row>
    <v-row>
      <v-col v-for="(date, index) in dateList" :key="index" cols="12" md="6">
        <ToDoListCard 
          :todo-date="index"
          :todos="todoStore.getTodosByDate(date)"
          @show-info="showTodoInfo"
          @edit="editTodo"
          @complete="toggleComplete"
          :showFullDate="false"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="6">
        <ToDoListCard 
          :todo-date=-1
          :todos="todoStore.getTodosBeforeToday"
          @show-info="showTodoInfo"
          @edit="editTodo"
          @complete="toggleComplete"
          :showFullDate="true"
        />
      </v-col>
      <v-col cols="6">
        <ToDoListCard 
          :todo-date=4
          :todos="todoStore.getTodosAfter4Days"
          @show-info="showTodoInfo"
          @edit="editTodo"
          @complete="toggleComplete"
          :showFullDate="true"
        />
      </v-col>
    </v-row>
    <AddToDoCard v-model="showAddDialog" />
    <ShowToDoInfo v-model="showInfo" :todo="selectedTodo" />
    <EditToDoCard v-model="showEditDialog" :todo="selectedTodo" />
  </v-container>
</template>

