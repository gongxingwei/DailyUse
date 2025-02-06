<template>
  <div class="goal-container">
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
  </div>
</template>

<script setup lang="ts">
import FileExplorer from './components/FileExplorer.vue'
import RepoSettings from './components/RepoSettings.vue'
import MarkdownEditor from './components/MarkdownEditor.vue'
import { useRoute, useRouter } from 'vue-router'
import { useRepoStore } from './repo'
import { ref, computed, onMounted } from 'vue'

const route = useRoute()
const router = useRouter()
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

onMounted(async () => {
  if (route.params.title) {
    repoStore.addToRecent(route.params.title as string)
    if (!repoStore.getRepoByTitle(route.params.title as string)) {
      router.push('/')
    }
  }
})
</script>

<style scoped>
.goal-container {
  height: 100vh;
  display: flex;
}

:deep(.v-main) {
  flex: 1;
  height: 100%;
  padding: 0 !important;
  padding-top: 48px;
}
</style>