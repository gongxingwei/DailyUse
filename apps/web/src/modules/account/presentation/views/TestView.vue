<!-- filepath: d:\myPrograms\DailyUse\apps\web\src\modules\account\presentation\TestConnection.vue -->
<template>
    <div style="padding: 32px;">
        <h2>API连接测试</h2>
        <button @click="handleTest" :disabled="loading">
            {{ loading ? '测试中...' : '测试连接' }}
        </button>
        <div v-if="result" style="margin-top: 16px;">
            <div v-if="result.success" style="color: green;">
                响应成功：{{ result.message }}<br />
                用时：{{ elapsed }} ms
            </div>
            <div v-else style="color: red;">
                请求失败：{{ result.message }}<br />
                {{ timeout ? '请求超时' : '' }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ApplicationService } from '../../application/services/ApplicationService'

// 你需要根据实际情况传入 userRepository
const userRepository = {} as any
const service = new ApplicationService(userRepository)

const loading = ref(false)
const result = ref<{ success: boolean; message: string } | null>(null)
const elapsed = ref<number>(0)
const timeout = ref(false)

async function handleTest() {
    loading.value = true
    result.value = null
    elapsed.value = 0
    timeout.value = false

    const TIMEOUT_MS = 5000
    const start = performance.now()

    try {
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => {
                timeout.value = true
                reject(new Error('请求超时'))
            }, TIMEOUT_MS)
        )

        // 添加调试信息
        console.log('开始测试连接...')

        const response = await Promise.race([
            service.testConnection(),
            timeoutPromise
        ])

        console.log('连接测试响应:', response)

        elapsed.value = Math.round(performance.now() - start)
        result.value = {
            success: !!response,
            message: response || '连接成功'
        }
    } catch (err: any) {
        console.error('连接测试错误:', err)
        elapsed.value = Math.round(performance.now() - start)
        result.value = {
            success: false,
            message: err.message || '未知错误'
        }
    } finally {
        loading.value = false
    }
}
</script>