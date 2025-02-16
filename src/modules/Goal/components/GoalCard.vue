<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex justify-space-between align-center">
      <span>{{ goal.name }}</span>
      <div>
        <v-btn icon size="small" color="#1E88E5" variant="tonal" @click="handleEdit">
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn icon size="small" color="#D32F2F" variant="tonal" @click="handleDelete">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
        <v-btn icon size="small" color="#388E3C" variant="tonal" @click="handleRelativeRepo">
          <v-icon>mdi-fencing</v-icon>
        </v-btn>
        <v-btn icon size="small" color="#388E3C" variant="tonal" @click="handleRelativeTodo">
          <v-icon>mdi-list-box</v-icon>
        </v-btn>
      </div>
    </v-card-title>

    <v-card-text>
      <!-- 关联的 Todos -->
      <div v-if="goal.relativeTodos?.length" class="mb-4">
        <div class="text-subtitle-1 mb-2">{{ t('goal.relatedTodos') }}</div>
        <TodoCard :todos="goal.relativeTodos" />
      </div>

      <!-- 关联的 Repositories -->
      <div v-if="goal.relativeRepositories?.length">
        <div class="text-subtitle-1 mb-2">{{ t('goal.relatedRepos') }}</div>
        <div class="d-flex flex-wrap gap-3">
          <RepoInfoCard v-for="repo in goal.relativeRepositories" :key="repo.title" :repository="repo" />
        </div>
      </div>

      <div class="text-caption text-grey mt-2">
        {{ t('goal.lastUpdated') }}: {{ formattedDate }}
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Goal } from '../goalStore'
import RepoInfoCard from '@/modules/Repository/components/RepoInfoCard.vue'
import TodoCard from '@/modules/Todo/components/TodoCard.vue'

const { t } = useI18n()

const props = defineProps<{
  goal: Goal
}>()

const emit = defineEmits<{
  (e: 'delete'): void
  (e: 'edit'): void
  (e: 'relative-repo'): void
  (e: 'relative-todo'): void
}>()

const handleEdit = () => {
  emit('edit')
}

const handleDelete = () => {
  emit('delete')
}

const handleRelativeRepo = () => {
  emit('relative-repo')
}

const handleRelativeTodo = () => {
  emit('relative-todo')
}

const formattedDate = computed(() => {
  return new Date(props.goal.updateTime).toLocaleString()
})

</script>