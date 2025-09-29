<!--
  Theme Demo View
  @description 主题系统演示页面
  @author DailyUse Team
  @date 2025-09-29
-->

<template>
    <v-container fluid class="pa-6">
        <!-- 页面头部 -->
        <div class="page-header mb-8">
            <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                    <v-avatar size="48" color="primary" variant="tonal" class="mr-4">
                        <v-icon size="24">mdi-palette</v-icon>
                    </v-avatar>
                    <div>
                        <h1 class="text-h4 font-weight-bold text-primary mb-1">主题系统演示</h1>
                        <p class="text-subtitle-1 text-medium-emphasis mb-0">体验全新的主题切换功能</p>
                    </div>
                </div>

                <!-- 主题切换器 -->
                <ThemeSwitcher @create-theme="showCreateDialog = true" />
            </div>
        </div>

        <!-- 当前主题信息 -->
        <v-card class="mb-6" elevation="2">
            <v-card-title class="d-flex align-center">
                <v-icon color="primary" class="mr-3">mdi-information</v-icon>
                当前主题信息
            </v-card-title>

            <v-card-text>
                <v-row v-if="themeStore.currentTheme">
                    <v-col cols="12" md="6">
                        <v-list density="compact">
                            <v-list-item>
                                <template #prepend>
                                    <v-icon>mdi-tag</v-icon>
                                </template>
                                <v-list-item-title>名称</v-list-item-title>
                                <v-list-item-subtitle>{{ themeStore.currentTheme.name }}</v-list-item-subtitle>
                            </v-list-item>

                            <v-list-item>
                                <template #prepend>
                                    <v-icon>mdi-palette</v-icon>
                                </template>
                                <v-list-item-title>类型</v-list-item-title>
                                <v-list-item-subtitle>{{ themeStore.currentTheme.type }}</v-list-item-subtitle>
                            </v-list-item>

                            <v-list-item>
                                <template #prepend>
                                    <v-icon>mdi-account</v-icon>
                                </template>
                                <v-list-item-title>作者</v-list-item-title>
                                <v-list-item-subtitle>{{ themeStore.currentTheme.author || '未知'
                                    }}</v-list-item-subtitle>
                            </v-list-item>
                        </v-list>
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-list density="compact">
                            <v-list-item>
                                <template #prepend>
                                    <v-icon>mdi-tag-outline</v-icon>
                                </template>
                                <v-list-item-title>版本</v-list-item-title>
                                <v-list-item-subtitle>{{ themeStore.currentTheme.version }}</v-list-item-subtitle>
                            </v-list-item>

                            <v-list-item>
                                <template #prepend>
                                    <v-icon>mdi-star</v-icon>
                                </template>
                                <v-list-item-title>内置主题</v-list-item-title>
                                <v-list-item-subtitle>{{ themeStore.currentTheme.isBuiltIn ? '是' : '否'
                                    }}</v-list-item-subtitle>
                            </v-list-item>

                            <v-list-item>
                                <template #prepend>
                                    <v-icon>mdi-calendar</v-icon>
                                </template>
                                <v-list-item-title>创建时间</v-list-item-title>
                                <v-list-item-subtitle>{{ formatDate(themeStore.currentTheme.createdAt)
                                    }}</v-list-item-subtitle>
                            </v-list-item>
                        </v-list>
                    </v-col>
                </v-row>

                <v-alert v-else type="warning" variant="tonal">
                    未检测到当前主题
                </v-alert>
            </v-card-text>
        </v-card>

        <!-- 主题配置状态 -->
        <v-card class="mb-6" elevation="2">
            <v-card-title class="d-flex align-center">
                <v-icon color="primary" class="mr-3">mdi-cog</v-icon>
                主题配置
            </v-card-title>

            <v-card-text>
                <v-row v-if="themeStore.config">
                    <v-col cols="12" md="4">
                        <v-card variant="outlined" class="pa-4 text-center">
                            <v-icon size="32" :color="themeStore.config.followSystemTheme ? 'success' : 'grey'"
                                class="mb-2">
                                mdi-monitor
                            </v-icon>
                            <div class="font-weight-medium">跟随系统</div>
                            <div class="text-caption">
                                {{ themeStore.config.followSystemTheme ? '已启用' : '已禁用' }}
                            </div>
                        </v-card>
                    </v-col>

                    <v-col cols="12" md="4">
                        <v-card variant="outlined" class="pa-4 text-center">
                            <v-icon size="32" :color="themeStore.config.enableTransitions ? 'success' : 'grey'"
                                class="mb-2">
                                mdi-transition
                            </v-icon>
                            <div class="font-weight-medium">动画过渡</div>
                            <div class="text-caption">
                                {{ themeStore.config.enableTransitions ? '已启用' : '已禁用' }}
                            </div>
                        </v-card>
                    </v-col>

                    <v-col cols="12" md="4">
                        <v-card variant="outlined" class="pa-4 text-center">
                            <v-icon size="32" :color="themeStore.config.autoSwitchTheme ? 'success' : 'grey'"
                                class="mb-2">
                                mdi-clock-outline
                            </v-icon>
                            <div class="font-weight-medium">定时切换</div>
                            <div class="text-caption">
                                {{ themeStore.config.autoSwitchTheme ? '已启用' : '已禁用' }}
                            </div>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- 主题列表 -->
        <v-card elevation="2">
            <v-card-title class="d-flex align-center">
                <v-icon color="primary" class="mr-3">mdi-view-grid</v-icon>
                所有主题
                <v-spacer></v-spacer>
                <v-chip :color="themeStore.loading.themes ? 'warning' : 'success'" size="small"
                    :loading="themeStore.loading.themes">
                    {{ themeStore.themes.length }} 个主题
                </v-chip>
            </v-card-title>

            <v-card-text>
                <v-row>
                    <v-col v-for="theme in themeStore.themes" :key="theme.id" cols="12" md="6" lg="4">
                        <v-card variant="outlined" :class="{ 'theme-active': theme.id === themeStore.activeTheme?.id }"
                            class="theme-preview-card pa-4" @click="handleThemeApply(theme.id)">
                            <div class="d-flex align-center mb-3">
                                <v-avatar size="40" :color="getThemeColorByType(theme.type)" class="mr-3">
                                    <v-icon :icon="getThemeIconByType(theme.type)" color="white" />
                                </v-avatar>

                                <div class="flex-grow-1">
                                    <div class="font-weight-medium">{{ theme.name }}</div>
                                    <div class="text-caption text-medium-emphasis">{{ theme.type }}</div>
                                </div>

                                <v-chip v-if="theme.isBuiltIn" size="x-small" color="primary" variant="outlined">
                                    内置
                                </v-chip>
                                <v-icon v-else-if="theme.id === themeStore.activeTheme?.id" color="success" size="20">
                                    mdi-check-circle
                                </v-icon>
                            </div>

                            <div class="text-body-2 mb-2">
                                {{ theme.description || '暂无描述' }}
                            </div>

                            <div class="d-flex justify-space-between align-center text-caption text-medium-emphasis">
                                <span>{{ theme.author || '未知作者' }}</span>
                                <span>v{{ theme.version }}</span>
                            </div>
                        </v-card>
                    </v-col>
                </v-row>

                <v-alert v-if="themeStore.themes.length === 0 && !themeStore.loading.themes" type="info"
                    variant="tonal">
                    暂无可用主题
                </v-alert>
            </v-card-text>
        </v-card>

        <!-- 创建主题对话框（简化版） -->
        <v-dialog v-model="showCreateDialog" max-width="500">
            <v-card>
                <v-card-title>创建自定义主题</v-card-title>

                <v-card-text>
                    <v-alert type="info" variant="tonal" class="mb-4">
                        自定义主题创建功能正在开发中，敬请期待！
                    </v-alert>

                    <p>您可以通过设置页面配置现有主题的各种选项。</p>
                </v-card-text>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="showCreateDialog = false">关闭</v-btn>
                    <v-btn color="primary" @click="$router.push('/settings')">前往设置</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useThemeStore } from '../modules/theme'
import { ThemeSwitcher } from '../modules/theme'

// 响应式数据
const showCreateDialog = ref(false)
const themeStore = useThemeStore()

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

function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

async function handleThemeApply(themeId: string) {
    try {
        await themeStore.applyTheme(themeId)
    } catch (error) {
        console.error('应用主题失败:', error)
    }
}

// 初始化
onMounted(async () => {
    // 如果主题系统未初始化，尝试初始化
    if (themeStore.themes.length === 0 && !themeStore.loading.themes) {
        try {
            await themeStore.initialize()
        } catch (error) {
            console.error('主题系统初始化失败:', error)
        }
    }
})
</script>

<style scoped>
.page-header {
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05) 0%, rgba(var(--v-theme-secondary), 0.05) 100%);
    padding: 2rem;
}

.theme-preview-card {
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 12px;
}

.theme-preview-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.theme-active {
    border-color: rgb(var(--v-theme-primary)) !important;
    background-color: rgba(var(--v-theme-primary), 0.04);
}

/* 深色主题适配 */
.v-theme--dark .page-header {
    background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.1) 0%, rgba(var(--v-theme-secondary), 0.1) 100%);
}

.v-theme--dark .theme-preview-card:hover {
    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1) !important;
}

.v-theme--dark .theme-active {
    background-color: rgba(var(--v-theme-primary), 0.08);
}
</style>