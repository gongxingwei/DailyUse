<template>
    <div class="search">
        <div class="search-header">
            <span class="search-title">Search</span>
            <div class="search-header-actions">
                <button class="search-header-action">
                    <v-icon>mdi-dots-horizontal</v-icon>
                </button>
            </div>
        </div>
        <div class="search-body">
            <div class="search-function-area">
                <button class="search-toggle" @click="isReplaceInputExpanded = !isReplaceInputExpanded">
                <v-icon>{{ isReplaceInputExpanded ? "mdi-chevron-down" : "mdi-chevron-right"}}</v-icon>
                </button>
            <input type="text" class="search-input" placeholder="Search for a file or folder" />
            </div>
            
            <div class="search-result-area">
                
            </div>
        </div>
        
    </div>
</template>

<script setup lang="ts">

import { ref } from 'vue'
const isReplaceInputExpanded = ref(false)
</script>

<style scoped>
.search {
    display: flex;
    flex-direction: column;
    gap: 16px;
    color: rgb(var(--v-theme-font))
}

.search-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.search-title {
    font-size: 16px;
    font-weight: 500;
}

.search-header-actions {
    display: flex;
    gap: 8px;
}

.search-header-action {
    background: transparent;
    border: none;
    cursor: pointer;
    color: rgb(var(--v-theme-font));
}

.search-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.search-function-area {
    display: flex;
    align-items: center;
    gap: 8px;
}

.search-toggle {
    background: transparent;
    border: none;
    cursor: pointer;
    color: rgb(var(--v-theme-font));
}

.search-input {
    width: 100%;
    padding: 8px;
    border: 1px solid rgb(var(--v-theme-border));
    border-radius: 4px;
    background: rgb(var(--v-theme-surface));
    color: rgb(var(--v-theme-font));
}

.search-result-area {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.search-result {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-radius: 4px;
    background: rgb(var(--v-theme-surface));
    color: rgb(var(--v-theme-font));
    cursor: pointer;
}

.search-result:hover {
    background: rgb(var(--v-theme-surface-hover));
}
</style>
