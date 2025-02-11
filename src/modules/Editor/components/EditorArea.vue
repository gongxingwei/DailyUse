<template>
    <MarkdownEditor :filePath="fileStore.currentFilePath"/>
</template>

<script setup lang="ts">
import MarkdownEditor from './MarkdownEditor.vue'
import { useFileStore } from '../stores/fileStore'

const fileStore = useFileStore()
</script>