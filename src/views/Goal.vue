<template>
  <v-navigation-drawer permanent>
    <FileExplorer :root-path="currentRepo?.path" @settings="showSettings = true" @select-file="handleFileSelect" />
  </v-navigation-drawer>
  <v-main>
    <MarkdownEditor :file-path="selectedFile" />
  </v-main>
  <RepoSettings 
    v-model="showSettings"
    :repo="currentRepo"
  />
</template>

<script setup lang="ts">
import FileExplorer from '../components/goals/FileExplorer.vue'
import RepoSettings from '../components/goals/RepoSettings.vue'
import MarkdownEditor from '../components/goals/MarkdownEditor.vue'
import { useRoute } from 'vue-router'
import { useRepoStore } from '../stores/repo'
import { ref, computed } from 'vue'

const route = useRoute()
const repoStore = useRepoStore()
const showSettings = ref(false)
const selectedFile = ref<string>()

const handleFileSelect = (filePath: string) => {
  selectedFile.value = filePath
}

const currentRepo = computed(() => {
  const title = decodeURIComponent(route.params.title as string)
  return repoStore.getRepoByTitle(title) || null
})
</script>