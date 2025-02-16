<template>

  <v-container>
    <div class="text-h6 font-weight-light">Recent</div>
    <v-row>
      <v-col v-for="repository in getRecentRepositories" 
             :key="repository?.title || ''" 
             cols="12" md="4">
        <RepoInfoCard 
          v-if="repository"
          :repository="repository"
        />
      </v-col>
      
      <v-col v-if="getRecentRepositories.length === 0" cols="12">
        <div class="text-center text-medium-emphasis py-4">
          <v-icon size="large" color="grey-lighten-1">mdi-folder-open</v-icon>
          <div class="text-body-2 mt-2">暂无最近访问的仓库</div>
        </div>
      </v-col>
    </v-row>
  </v-container>
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
import { useTodoStore } from '../Todo/todoStore'
import { useRepositoryStore } from '../Repository/repositoryStore'
import type { Todo } from '../Todo/todoStore'
import ToDoListCard from '../Todo/components/ToDoListCard.vue'
import ShowToDoInfo from '../Todo/components/ShowToDoInfo.vue'
import EditToDoCard from '../Todo/components/EditToDoCard.vue'
import type { Repository } from '../Repository/repositoryStore'
import RepoInfoCard from '../Repository/components/RepoInfoCard.vue'

const todoStore = useTodoStore()
const repositoryStore = useRepositoryStore()
const showInfo = ref(false)
const showEditDialog = ref(false)
const selectedTodo = ref<Todo | null>(null)

// 计算今天和明天的日期
const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)

// 获取最近的仓库
const getRecentRepositories = computed<Repository[]>(() => {
  const repositories = repositoryStore.getRecentRepositories()
  // 过滤掉 undefined 值
  console.log(repositories)
  return repositories.filter((repo): repo is Repository => repo !== undefined)
})

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

.recent-repo {
  transition: transform 0.2s;
}

.recent-repo:hover {
  transform: translateY(-2px);
}
</style>

