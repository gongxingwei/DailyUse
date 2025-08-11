<template>
    <v-app>
        <v-main>
            <div class="page">
                <h1>DailyUse Web</h1>
                <p>Welcome. This is the minimal web skeleton.</p>
                <p>
                    <RouterLink to="/about">About</RouterLink>
                    <v-btn class="ml-2" color="primary" @click="ping">Ping API</v-btn>
                    <span class="ml-2">{{ health }}</span>
                </p>
            </div>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import { ref, getCurrentInstance } from 'vue'

const health = ref('')
const { proxy } = getCurrentInstance() as any

async function ping() {
  try {
    const res = await proxy.$api.get('/health')
    health.value = JSON.stringify(res.data)
  } catch (e: any) {
    health.value = e?.message || 'error'
  }
}
</script>

<style scoped>
.page {
    padding: 24px;
}
</style>
