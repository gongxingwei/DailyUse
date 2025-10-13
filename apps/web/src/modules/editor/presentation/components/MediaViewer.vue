<!--
  MediaViewer.vue
  媒体文件查看器组件
  
  支持：图片、视频、音频
-->
<template>
    <div class="media-viewer">
        <div class="viewer-container">
            <!-- 图片查看器 -->
            <div v-if="fileType === 'image'" class="image-viewer">
                <img :src="filePath" :alt="fileName" @load="handleImageLoad" @error="handleImageError" />

                <!-- 图片信息 -->
                <div v-if="imageInfo" class="image-info">
                    <v-chip size="small" class="mr-2">
                        {{ imageInfo.width }} × {{ imageInfo.height }}
                    </v-chip>
                    <v-chip size="small">
                        {{ imageInfo.size }}
                    </v-chip>
                </div>
            </div>

            <!-- 视频播放器 -->
            <div v-else-if="fileType === 'video'" class="video-viewer">
                <video :src="filePath" controls @loadedmetadata="handleVideoLoad">
                    您的浏览器不支持视频播放
                </video>
            </div>

            <!-- 音频播放器 -->
            <div v-else-if="fileType === 'audio'" class="audio-viewer">
                <div class="audio-container">
                    <v-icon icon="mdi-music" size="64" class="audio-icon mb-4" />
                    <div class="audio-title mb-4">{{ fileName }}</div>
                    <audio :src="filePath" controls class="audio-player">
                        您的浏览器不支持音频播放
                    </audio>
                </div>
            </div>

            <!-- 不支持的类型 -->
            <div v-else class="unsupported-viewer">
                <v-icon icon="mdi-file-question" size="64" class="mb-4" />
                <div class="text-h6">不支持的文件类型</div>
                <div class="text-caption mt-2">{{ fileName }}</div>
            </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-overlay">
            <v-progress-circular indeterminate color="primary" />
        </div>

        <!-- 错误提示 -->
        <v-alert v-if="error" type="error" class="error-alert">
            {{ error }}
        </v-alert>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

/**
 * Props
 */
interface Props {
    filePath: string;
    fileType: 'image' | 'video' | 'audio';
    fileName?: string;
}

const props = withDefaults(defineProps<Props>(), {
    fileName: '未命名文件',
});

/**
 * 状态
 */
const loading = ref(false);
const error = ref<string | null>(null);
const imageInfo = ref<{
    width: number;
    height: number;
    size: string;
} | null>(null);

/**
 * 处理图片加载
 */
function handleImageLoad(event: Event) {
    loading.value = false;
    const img = event.target as HTMLImageElement;

    imageInfo.value = {
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: formatFileSize(0), // 实际应该从文件获取
    };
}

/**
 * 处理图片加载错误
 */
function handleImageError() {
    loading.value = false;
    error.value = '图片加载失败';
}

/**
 * 处理视频加载
 */
function handleVideoLoad(event: Event) {
    loading.value = false;
    const video = event.target as HTMLVideoElement;
    console.log('Video loaded:', video.duration);
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '未知大小';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 初始化
 */
onMounted(() => {
    loading.value = true;
});
</script>

<style scoped lang="scss">
.media-viewer {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: rgb(var(--v-theme-surface));
}

.viewer-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: auto;
    padding: 24px;
}

// 图片查看器
.image-viewer {
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 100%;

    img {
        max-width: 100%;
        max-height: calc(100vh - 200px);
        object-fit: contain;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .image-info {
        margin-top: 16px;
        display: flex;
        gap: 8px;
    }
}

// 视频查看器
.video-viewer {
    width: 100%;
    max-width: 1200px;

    video {
        width: 100%;
        max-height: calc(100vh - 200px);
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
}

// 音频查看器
.audio-viewer {
    width: 100%;
    max-width: 600px;

    .audio-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 48px;
        background-color: rgba(var(--v-theme-on-surface), 0.02);
        border-radius: 16px;
    }

    .audio-icon {
        color: rgb(var(--v-theme-primary));
    }

    .audio-title {
        font-size: 18px;
        font-weight: 500;
        text-align: center;
    }

    .audio-player {
        width: 100%;
        max-width: 400px;
    }
}

// 不支持的类型
.unsupported-viewer {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: rgba(var(--v-theme-on-surface), 0.6);
}

// 加载状态
.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(var(--v-theme-surface), 0.8);
    backdrop-filter: blur(4px);
}

// 错误提示
.error-alert {
    position: absolute;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    max-width: 90%;
}
</style>
