<!--
  Theme Switcher Component
  @description 主题切换器组件，提供快速切换主题的UI
  @author DailyUse Team
  @date 2025-09-29
-->

<template>
    <v-menu offset-y :close-on-content-click="false">
        <template #activator="{ props }">
            <v-btn v-bind="props" :icon="currentThemeIcon" :color="currentThemeColor" variant="text"
                :loading="themeStore.loading.applying" :title="`当前主题: ${themeStore.currentTheme?.name || '未知'}`">
            </v-btn>
        </template>

        <v-card min-width="320" max-width="400" elevation="8">
            <v-card-title class="pa-4 pb-2">
                <div class="d-flex align-center">
                    <v-icon color="primary" class="mr-2">mdi-palette</v-icon>
                    <span class="font-weight-bold">主题切换</span>
                </div>
            </v-card-title>

            <!-- 错误提示 -->
            <v-alert v-if="themeStore.error" type="error" variant="tonal" density="compact" class="ma-4 mb-2" closable
                @click:close="themeStore.clearError()">
                {{ themeStore.error }}
            </v-alert>

            <!-- 预览模式提示 -->
            <v-alert v-if="themeStore.previewMode.enabled" type="info" variant="tonal" density="compact"
                class="ma-4 mb-2">
                <div class="d-flex align-center justify-space-between">
                    <span>预览模式</span>
                    <div>
                        <v-btn size="small" variant="text" color="primary" @click="applyPreviewTheme"
                            :loading="themeStore.loading.applying">
                            应用
                        </v-btn>
                        <v-btn size="small" variant="text" @click="cancelPreview">
                            取消
                        </v-btn>
                    </div>
                </div>
            </v-alert>

            <v-card-text class="pa-0">
                <!-- 内置主题 -->
                <div class="pa-4 pb-2">
                    <h3 class="text-subtitle-1 font-weight-medium mb-3 d-flex align-center">
                        <v-icon size="18" class="mr-2">mdi-star</v-icon>
                        系统主题
                    </h3>

                    <div class="theme-grid">
                        <v-card v-for="theme in themeStore.builtInThemes" :key="theme.id" class="theme-card pa-3"
                            :class="{ 'theme-active': isActiveTheme(theme.id) }" variant="outlined"
                            @click="handleThemeSelect(theme)" @mouseenter="enablePreview(theme)"
                            @mouseleave="disablePreview">
                            <div class="d-flex align-center">
                                <v-avatar size="32" :color="getThemeColorByType(theme.type)" class="mr-3">
                                    <v-icon :icon="getThemeIconByType(theme.type)" size="18" color="white" />
                                </v-avatar>

                                <div class="flex-grow-1">
                                    <div class="font-weight-medium text-body-2">
                                        {{ theme.name }}
                                    </div>
                                    <div class="text-caption text-medium-emphasis">
                                        {{ theme.description }}
                                    </div>
                                </div>

                                <v-fade-transition>
                                    <v-icon v-if="isActiveTheme(theme.id)" color="success" size="20">
                                        mdi-check-circle
                                    </v-icon>
                                </v-fade-transition>
                            </div>
                        </v-card>
                    </div>
                </div>

                <!-- 自定义主题 -->
                <div v-if="themeStore.customThemes.length > 0" class="pa-4 pt-0">
                    <v-divider class="mb-4"></v-divider>

                    <h3 class="text-subtitle-1 font-weight-medium mb-3 d-flex align-center">
                        <v-icon size="18" class="mr-2">mdi-brush</v-icon>
                        自定义主题
                    </h3>

                    <div class="theme-grid">
                        <v-card v-for="theme in themeStore.customThemes" :key="theme.id" class="theme-card pa-3"
                            :class="{ 'theme-active': isActiveTheme(theme.id) }" variant="outlined"
                            @click="handleThemeSelect(theme)" @mouseenter="enablePreview(theme)"
                            @mouseleave="disablePreview">
                            <div class="d-flex align-center">
                                <v-avatar size="32" :color="getThemeColorByType(theme.type)" class="mr-3">
                                    <v-icon :icon="getThemeIconByType(theme.type)" size="18" color="white" />
                                </v-avatar>

                                <div class="flex-grow-1">
                                    <div class="font-weight-medium text-body-2">
                                        {{ theme.name }}
                                    </div>
                                    <div class="text-caption text-medium-emphasis">
                                        {{ theme.author || '自定义' }}
                                    </div>
                                </div>

                                <div class="d-flex align-center">
                                    <v-btn v-if="!theme.isBuiltIn" icon="mdi-delete" size="x-small" variant="text"
                                        color="error" @click.stop="handleDeleteTheme(theme.id)" />

                                    <v-fade-transition>
                                        <v-icon v-if="isActiveTheme(theme.id)" color="success" size="20" class="ml-1">
                                            mdi-check-circle
                                        </v-icon>
                                    </v-fade-transition>
                                </div>
                            </div>
                        </v-card>
                    </div>
                </div>

                <!-- 快捷操作 -->
                <v-divider></v-divider>
                <div class="pa-4">
                    <div class="d-flex justify-space-between align-center">
                        <v-btn variant="text" prepend-icon="mdi-monitor" @click="switchToSystemTheme"
                            :loading="themeStore.loading.applying" size="small">
                            跟随系统
                        </v-btn>

                        <v-btn variant="text" prepend-icon="mdi-plus" @click="$emit('create-theme')" size="small">
                            创建主题
                        </v-btn>
                    </div>
                </div>
            </v-card-text>
        </v-card>
    </v-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '../themeStroe'
import type { IThemeDefinition } from '@dailyuse/contracts'

// Props & Emits
defineEmits<{
    'create-theme': []
}>()

// Store
const themeStore = useThemeStore()

// 计算属性
const currentThemeIcon = computed(() => {
    if (!themeStore.currentTheme) return 'mdi-help-circle'
    return getThemeIconByType(themeStore.currentTheme.type)
})

const currentThemeColor = computed(() => {
    if (!themeStore.currentTheme) return 'grey'
    return getThemeColorByType(themeStore.currentTheme.type)
})

// 方法
function getThemeIconByType(type: string): string {
    switch (type) {
        case 'light':
            return 'mdi-weather-sunny'
        case 'dark':
            return 'mdi-weather-night'
        case 'auto':
            return 'mdi-monitor'
        case 'custom':
            return 'mdi-palette'
        default:
            return 'mdi-help-circle'
    }
}

function getThemeColorByType(type: string): string {
    switch (type) {
        case 'light':
            return 'orange'
        case 'dark':
            return 'blue-grey'
        case 'auto':
            return 'primary'
        case 'custom':
            return 'purple'
        default:
            return 'grey'
    }
}

function isActiveTheme(themeId: string): boolean {
    return themeStore.activeTheme?.id === themeId
}

function handleThemeSelect(theme: IThemeDefinition): void {
    if (!themeStore.previewMode.enabled) {
        applyTheme(theme.id)
    }
}

async function applyTheme(themeId: string): Promise<void> {
    try {
        await themeStore.applyTheme(themeId)
    } catch (error) {
        console.error('应用主题失败:', error)
    }
}

function enablePreview(theme: IThemeDefinition): void {
    if (!isActiveTheme(theme.id)) {
        themeStore.enablePreview(theme)
    }
}

function disablePreview(): void {
    setTimeout(() => {
        if (themeStore.previewMode.enabled) {
            themeStore.disablePreview()
        }
    }, 100) // 小延迟避免快速移动时闪烁
}

async function applyPreviewTheme(): Promise<void> {
    try {
        await themeStore.applyPreviewTheme()
    } catch (error) {
        console.error('应用预览主题失败:', error)
    }
}

function cancelPreview(): void {
    themeStore.disablePreview()
}

async function switchToSystemTheme(): Promise<void> {
    try {
        await themeStore.switchToSystemTheme()
    } catch (error) {
        console.error('切换到系统主题失败:', error)
    }
}

async function handleDeleteTheme(themeId: string): Promise<void> {
    if (confirm('确定要删除这个主题吗？')) {
        try {
            await themeStore.deleteTheme(themeId)
        } catch (error) {
            console.error('删除主题失败:', error)
        }
    }
}
</script>

<style scoped>
.theme-grid {
    display: grid;
    gap: 12px;
}

.theme-card {
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 12px;
}

.theme-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.theme-active {
    border-color: rgb(var(--v-theme-primary)) !important;
    background-color: rgba(var(--v-theme-primary), 0.04);
}

.v-theme--dark .theme-card:hover {
    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1) !important;
}

.v-theme--dark .theme-active {
    background-color: rgba(var(--v-theme-primary), 0.08);
}
</style>