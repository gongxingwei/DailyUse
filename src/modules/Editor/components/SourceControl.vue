<template>
    <div class="source-control">
        <!-- Header -->
        <div class="source-control-header">
            <div class="header-title">
                <span>SOURCE CONTROL</span>
                <span class="branch-name" v-if="store.isGitRepo">
                    <v-icon size="small">mdi-source-branch</v-icon>
                    {{ store.currentBranch }}
                </span>
            </div>
            <div class="header-actions">
                <v-icon class="action-icon" title="Refresh" @click="store.refreshStatus">mdi-refresh</v-icon>
            </div>
        </div>

        <div v-if="store.isGitRepo" class="changes-container">
            <!-- Commit Section -->
            <div v-if="store.isGitRepo" class="commit-section">
                <textarea v-model="commitMessage" class="commit-input"
                    placeholder="Message (Press Ctrl+Enter to commit)" @keydown.ctrl.enter="handleCommit"></textarea>
                <v-btn block :disabled="!canCommit" @click="handleCommit">
                    Commit
                </v-btn>
            </div>
            <!-- Staged Changes -->
            <div class="changes-group">
                <div class="section-header" @click="toggleStaged">
                    <div class="section-header-left">
                        <v-icon size="small">{{ isStagedExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
                        <span>Staged Changes</span>
                    </div>
                    <div class="section-header-right">
                        <div class="section-header-actions">
                            <button class="action-button" title="Unstage All Changes" @click="store.unstageAllChanges">
                                <v-icon size="small">mdi-minus</v-icon>
                            </button>
                        </div>
                        <span class="section-header-count">{{ store.changes.staged.length }}</span>
                    </div>
                </div>
                <div v-show="isStagedExpanded" class="section-content">
                    <div v-for="file in store.changes.staged" :key="file" class="change-item"
                        >
                        <v-icon size="small" color="green">mdi-plus</v-icon>
                        <span class="file-name">{{ getFileName(file) }}</span>
                        <v-icon class="action-button" size="small" @click.stop="store.unstageFile(file)">
                            mdi-minus
                        </v-icon>
                    </div>
                </div>
            </div>

            <!-- Changes -->
            <div class="changes-group">
                <div class="section-header" @click="toggleChanges">
                    <div class="section-header-left">
                        <v-icon size="small">{{ isChangesExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
                        <span>Changes</span>
                    </div>
                    <div class="section-header-right">
                        <div class="section-header-actions">
                            <button class="action-button" title="Discard All Changes" @click.stop="showConfirm = true">
                                <v-icon size="small">mdi-delete</v-icon>
                            </button>
                            <button class="action-button" title="Stage All Changes" @click.stop="store.stageAllChanges">
                                <v-icon size="small">mdi-plus</v-icon>
                            </button>
                        </div>
                        <span class="section-header-count">
                            {{ store.changes.modified.length + store.changes.deleted.length +
                                store.changes.not_added.length }}
                        </span>
                    </div>
                </div>
                <div v-show="isChangesExpanded" class="section-content">
                    <template
                        v-for="file in [...store.changes.modified, ...store.changes.deleted, ...store.changes.not_added]"
                        :key="file">
                        <div class="change-item">
                            <span class="file-name">
                                <v-icon size="small" :color="getFileIcon(file).color">
                                    {{ getFileIcon(file).icon }}
                                </v-icon>
                                {{ getFileName(file) }}
                            </span>
                            <span class="file-status">{{ getFileStatus(file) }}</span>
                            <v-icon class="action-button" size="small" @click.stop="store.stageFile(file)">
                                mdi-plus
                            </v-icon>
                        </div>
                    </template>
                </div>
            </div>
            <!-- Untracked Changes -->
            <!-- <div class="changes-group">
                <div class="section-header">
                    <div class="section-header-left">
                        <span>Untracked</span>
                    </div>
                    <div class="section-header-right">
                        <div class="section-header-actions">
                            <button class="action-button" title="Stage All Untracked Changes" @click="store.addAllUntracked">
                                <v-icon size="small">mdi-plus</v-icon>
                            </button>
                        </div>
                        <span class="section-header-count">{{ store.changes.not_added.length }}</span>
                    </div>
                </div>
                <div v-for="file in store.changes.not_added" :key="file" class="change-item">
                    <span class="file-name">
                        <v-icon size="small" color="grey">mdi-file</v-icon>
                        {{ getFileName(file) }}
                    </span>
                    <v-icon class="action-button" size="small" title="add" @click.stop="store.addFile(file)">mdi-plus</v-icon>
                </div>
            </div> -->
        </div>

        <!-- Not a Git Repo Message -->
        <div v-else class="no-repo">
            <span>This workspace is not a git repository</span>
            <button class="initialize-button" @click="initRepo">Init Repository</button>
        </div>
        <div class="graph-header" @click="toggleGraph">
            <div class="section-header">
                <div class="section-header-left">
                    <v-icon size="small">{{ isGraphExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
                    <span>Timeline</span>
                </div>
            </div>
        </div>
        <div v-if="store.isGitRepo" class="git-graph-container" :class="{ 'git-graph-collapsed': !isGraphExpanded }">
            <GitGraph />
        </div>
    </div>
    <confirm v-model="showConfirm" title="Discard All Changes"
        message="Are you sure you want to discard all changes? This cannot be undone." cancelText="Cancel"
        confirmText="Discard" @confirm="store.discardAllChanges" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSourceControlStore } from '../stores/sourceControlStore'
import Confirm from '@/shared/components/Confirm.vue';
import GitGraph from './GitGraph.vue'

const props = defineProps<{
    rootPath: string
}>()

const store = useSourceControlStore()
const commitMessage = ref('')
const showConfirm = ref(false)
const canCommit = computed(() => {
    return commitMessage.value.trim().length > 0 &&
        (store.changes.staged.length > 0 || store.changes.unstaged.length > 0)
})

const isStagedExpanded = ref(true)
const isChangesExpanded = ref(true)
const isGraphExpanded = ref(true)

function toggleStaged() {
    isStagedExpanded.value = !isStagedExpanded.value
}
function toggleChanges() {
    isChangesExpanded.value = !isChangesExpanded.value
}
function toggleGraph() {
    isGraphExpanded.value = !isGraphExpanded.value
}
function getFileName(path: string): string {
    return path.split('/').pop() || path
}

async function handleCommit() {
    if (!canCommit.value) return
    await store.commit(commitMessage.value)
    commitMessage.value = ''
}

function getFileIcon(file: string) {
    if (store.changes.modified.includes(file)) {
        return { icon: 'mdi-pencil', color: 'yellow' }
    }
    if (store.changes.deleted.includes(file)) {
        return { icon: 'mdi-delete', color: 'red' }
    }
    return { icon: 'mdi-file', color: 'grey' }
}

function getFileStatus(file: string) {
    if (store.changes.modified.includes(file)) return 'M'
    if (store.changes.deleted.includes(file)) return 'D'
    return 'U'
}

async function initRepo() {
    if (!props.rootPath) return
    const success = await store.initRepo(props.rootPath)
    if (success) {
        await store.refreshStatus()
    }
}

onMounted(async () => {
    const isRepo = await store.checkIsRepo(props.rootPath)
    store.setIsRepo(isRepo)
    if (isRepo) {
        await store.initializeGit(props.rootPath)
    }
})

</script>

<style scoped>
.source-control {
    height: 100%;
    display: flex;
    flex-direction: column;
    color: rgb(var(--v-theme-font));
}

.source-control-header {
    padding: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
}

.header-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.branch-name {
    display: flex;
    align-items: center;
    gap: 4px;
    opacity: 0.8;
}

.changes-container {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
}

.changes-group {
    margin-bottom: 16px;
}

.group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px;
    font-size: 11px;
    text-transform: uppercase;
}

.change-item {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    cursor: pointer;
    gap: 8px;
}

.change-item:hover {
    background-color: var(--vscode-list-hoverBackground);
}

.file-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* .action-button {
    opacity: 0;
} */

.change-item:hover .action-button {
    opacity: 1;
}

.commit-section {
    padding: 8px;
    border-top: 1px solid var(--vscode-panel-border);
}

.commit-input {
    width: 100%;
    min-height: 60px;
    margin-bottom: 8px;
    padding: 8px;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border);
    border-radius: 2px;
    resize: vertical;
}

.commit-input:focus {
    outline: 1px solid var(--vscode-focusBorder);
}

.no-repo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 16px;
}

.initialize-button {
    width: 100%;
    background-color: rgb(var(--v-theme-primary));
    color: rgb(var(--v-theme-on-surface));
    border: 1px solid var(--vscode-button-border);
    border-radius: 2px;
    cursor: pointer;
}

.title-function-left {
    font-size: small;
}

.count {
    font-size: 11px;
    opacity: 0.8;
    display: flex;
    align-items: center;
    padding: 0% 0% 0% 0%;
    margin: 0;
}

.git-graph-container {
    margin-top: 16px;
    border-top: 1px solid var(--vscode-panel-border);
}

.graph-header {
    cursor: pointer;
    user-select: none;
    padding: 4px 8px;
    border-top: 1px solid var(--vscode-panel-border);
}

.graph-header:hover {
    background-color: var(--vscode-list-hoverBackground);
}

.git-graph-container {
    transition: height 0.2s ease;
    height: 300px;
    /* 或其他合适的高度 */
    overflow: hidden;
}

.git-graph-collapsed {
    height: 0;
}

/* 确保 section-header-left 样式正确 */
.section-header-left {
    display: flex;
    align-items: center;
    gap: 4px;
}
</style>