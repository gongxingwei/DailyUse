<!-- 组件测试页面 -->
<template>
  <v-container fluid class="pa-6">
    <!-- 页面标题 -->
    <div class="d-flex align-center mb-6">
      <v-avatar size="48" color="primary" variant="tonal" class="mr-4">
        <v-icon size="24">mdi-test-tube</v-icon>
      </v-avatar>
      <div>
        <h1 class="text-h4 font-weight-bold text-primary mb-1">组件测试</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-0">测试迁移的组件功能</p>
      </div>
    </div>

    <!-- 测试区域 -->
    <v-row>
      <!-- Profile Avatar 测试 -->
      <v-col cols="12" md="6">
        <v-card class="pa-4">
          <v-card-title>
            <v-icon class="mr-2">mdi-account-circle</v-icon>
            Profile Avatar 组件
          </v-card-title>
          <v-card-text>
            <div class="d-flex justify-center">
              <ProfileAvatar size="64" />
            </div>
            <p class="text-center mt-4 text-body-2">
              点击头像查看用户信息弹窗
            </p>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Task Management 测试 -->
      <v-col cols="12" md="6">
        <v-card class="pa-4">
          <v-card-title>
            <v-icon class="mr-2">mdi-format-list-checks</v-icon>
            任务管理组件
          </v-card-title>
          <v-card-text>
            <v-btn color="primary" variant="outlined" @click="$router.push('/tasks')" block>
              进入任务管理
            </v-btn>
            <p class="text-center mt-4 text-body-2">
              包含任务模板和任务实例管理
            </p>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Editor 测试 -->
      <v-col cols="12" md="6">
        <v-card class="pa-4">
          <v-card-title>
            <v-icon class="mr-2">mdi-file-edit</v-icon>
            编辑器组件
          </v-card-title>
          <v-card-text>
            <v-btn color="primary" variant="outlined" @click="$router.push('/editor')" block>
              打开编辑器
            </v-btn>
            <p class="text-center mt-4 text-body-2">
              Markdown编辑器，支持预览
            </p>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Settings 测试 -->
      <v-col cols="12" md="6">
        <v-card class="pa-4">
          <v-card-title>
            <v-icon class="mr-2">mdi-cog</v-icon>
            设置组件
          </v-card-title>
          <v-card-text>
            <v-btn color="primary" variant="outlined" @click="$router.push('/settings')" block>
              进入设置
            </v-btn>
            <p class="text-center mt-4 text-body-2">
              应用设置，包含主题、编辑器配置等
            </p>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Repository 测试 -->
      <v-col cols="12" md="6">
        <v-card class="pa-4">
          <v-card-title>
            <v-icon class="mr-2">mdi-source-repository</v-icon>
            仓储管理组件
          </v-card-title>
          <v-card-text>
            <v-btn color="primary" variant="outlined" @click="$router.push('/repositories')" block>
              进入仓储管理
            </v-btn>
            <p class="text-center mt-4 text-body-2">
              Git仓储管理界面
            </p>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Goal 测试 -->
      <v-col cols="12" md="6">
        <v-card class="pa-4">
          <v-card-title>
            <v-icon class="mr-2">mdi-target</v-icon>
            目标管理组件
          </v-card-title>
          <v-card-text>
            <v-btn color="primary" variant="outlined" @click="$router.push('/goals')" block>
              进入目标管理
            </v-btn>
            <p class="text-center mt-4 text-body-2">
              目标和关键结果管理
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 功能测试区域 -->
    <v-divider class="my-8"></v-divider>

    <h2 class="text-h5 font-weight-bold mb-4">功能测试</h2>

    <v-row>
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <v-card-title>
            <v-icon class="mr-2">mdi-message</v-icon>
            通知测试
          </v-card-title>
          <v-card-text>
            <v-btn-group variant="outlined" divided class="mb-2">
              <v-btn @click="showSuccess('成功通知')" color="success" size="small">
                成功
              </v-btn>
              <v-btn @click="showError('错误通知')" color="error" size="small">
                错误
              </v-btn>
              <v-btn @click="showWarning('警告通知')" color="warning" size="small">
                警告
              </v-btn>
              <v-btn @click="showInfo('信息通知')" color="info" size="small">
                信息
              </v-btn>
            </v-btn-group>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <v-card-title>
            <v-icon class="mr-2">mdi-palette</v-icon>
            主题切换测试
          </v-card-title>
          <v-card-text>
            <v-btn-toggle v-model="selectedTheme" @update:model-value="switchTheme" variant="outlined" divided
              mandatory>
              <v-btn value="light" size="small">
                <v-icon>mdi-weather-sunny</v-icon>
              </v-btn>
              <v-btn value="dark" size="small">
                <v-icon>mdi-weather-night</v-icon>
              </v-btn>
              <v-btn value="system" size="small">
                <v-icon>mdi-monitor</v-icon>
              </v-btn>
            </v-btn-toggle>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <v-card-title>
            <v-icon class="mr-2">mdi-information</v-icon>
            迁移状态
          </v-card-title>
          <v-card-text>
            <div class="text-body-2">
              <div class="d-flex align-center mb-1">
                <v-icon size="16" color="success" class="mr-2">mdi-check</v-icon>
                <span>任务管理模块</span>
              </div>
              <div class="d-flex align-center mb-1">
                <v-icon size="16" color="success" class="mr-2">mdi-check</v-icon>
                <span>账户管理模块</span>
              </div>
              <div class="d-flex align-center mb-1">
                <v-icon size="16" color="success" class="mr-2">mdi-check</v-icon>
                <span>设置模块</span>
              </div>
              <div class="d-flex align-center mb-1">
                <v-icon size="16" color="success" class="mr-2">mdi-check</v-icon>
                <span>编辑器模块</span>
              </div>
              <div class="d-flex align-center mb-1">
                <v-icon size="16" color="success" class="mr-2">mdi-check</v-icon>
                <span>仓储模块</span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- API 连接测试 -->
    <v-divider class="my-8"></v-divider>

    <h2 class="text-h5 font-weight-bold mb-4">API 连接测试</h2>

    <v-card class="pa-4">
      <v-card-title>
        <v-icon class="mr-2">mdi-api</v-icon>
        连接测试
      </v-card-title>
      <v-card-text>
        <v-btn @click="handleTest" :loading="loading" :disabled="loading" color="primary" variant="outlined">
          {{ loading ? '测试中...' : '测试连接' }}
        </v-btn>

        <div v-if="result" class="mt-4">
          <v-alert :type="result.success ? 'success' : 'error'" :title="result.success ? '连接成功' : '连接失败'"
            :text="result.message">
            <div v-if="result.success">
              <strong>响应时间:</strong> {{ elapsed }} ms
            </div>
            <div v-else>
              <strong>错误详情:</strong> {{ result.message }}
              <div v-if="timeout">
                <strong>超时:</strong> 请求超时（超过5秒）
              </div>
            </div>
          </v-alert>
        </div>
      </v-card-text>
    </v-card>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout" location="top right">
      {{ snackbar.message }}
      <template #actions>
        <v-btn color="white" variant="text" @click="closeSnackbar">
          关闭
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useSnackbar } from '@/shared/composables/useSnackbar';
import { useSettingStore } from '@/modules/setting/presentation/stores/settingStore';
import ProfileAvatar from '@/modules/account/presentation/components/ProfileAvatar.vue';

const { snackbar, closeSnackbar, showSuccess, showError, showWarning, showInfo } = useSnackbar();
const settingStore = useSettingStore();

const selectedTheme = ref('system');

// API测试相关
const loading = ref(false);
const result = ref<{ success: boolean; message: string } | null>(null);
const elapsed = ref<number>(0);
const timeout = ref(false);

const switchTheme = (theme: string) => {
  settingStore.setTheme(theme);
  showInfo(`已切换到${theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '系统'}主题`);
};

async function handleTest() {
  loading.value = true;
  result.value = null;
  elapsed.value = 0;
  timeout.value = false;

  const TIMEOUT_MS = 5000;
  const start = performance.now();

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => {
        timeout.value = true;
        reject(new Error('请求超时'));
      }, TIMEOUT_MS)
    );

    console.log('开始测试连接...');

    // 模拟API调用
    const testConnection = new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve('API连接正常');
      }, Math.random() * 2000 + 500); // 随机延迟500-2500ms
    });

    const response = await Promise.race([
      testConnection,
      timeoutPromise
    ]);

    console.log('连接测试响应:', response);

    elapsed.value = Math.round(performance.now() - start);
    result.value = {
      success: !!response,
      message: response || '连接成功'
    };
  } catch (err: any) {
    console.error('连接测试错误:', err);
    elapsed.value = Math.round(performance.now() - start);
    result.value = {
      success: false,
      message: err.message || '未知错误'
    };
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.v-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
}
</style>