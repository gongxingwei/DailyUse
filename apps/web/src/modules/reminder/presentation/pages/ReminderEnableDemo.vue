<template>
  <div class="reminder-enable-demo">
    <div class="demo-header">
      <h2>提醒模块启用状态控制演示</h2>
      <p>这里演示了提醒模块的启用状态控制功能</p>
    </div>

    <div class="demo-sections">
      <!-- 分组启用状态控制 -->
      <section class="demo-section">
        <h3>分组启用状态控制</h3>
        <div class="control-grid">
          <div class="control-item">
            <label>分组UUID:</label>
            <input v-model="groupUuid" placeholder="输入分组UUID" />
          </div>
          <div class="control-item">
            <label>启用模式:</label>
            <select v-model="enableMode">
              <option value="GROUP">按组控制</option>
              <option value="INDIVIDUAL">单独控制</option>
            </select>
          </div>
          <div class="control-item">
            <label>启用状态:</label>
            <select v-model="enabled">
              <option :value="true">启用</option>
              <option :value="false">禁用</option>
            </select>
          </div>
          <div class="control-actions">
            <button @click="toggleGroupEnableMode" :disabled="!groupUuid">切换启用模式</button>
            <button @click="toggleGroupEnabled" :disabled="!groupUuid">切换启用状态</button>
          </div>
        </div>
      </section>

      <!-- 模板自我启用状态控制 -->
      <section class="demo-section">
        <h3>模板自我启用状态控制</h3>
        <div class="control-grid">
          <div class="control-item">
            <label>模板UUID:</label>
            <input v-model="templateUuid" placeholder="输入模板UUID" />
          </div>
          <div class="control-item">
            <label>自我启用:</label>
            <select v-model="selfEnabled">
              <option :value="true">启用</option>
              <option :value="false">禁用</option>
            </select>
          </div>
          <div class="control-actions">
            <button @click="toggleTemplateSelfEnabled" :disabled="!templateUuid">
              切换模板自我启用状态
            </button>
          </div>
        </div>
      </section>

      <!-- 批量更新 -->
      <section class="demo-section">
        <h3>批量更新模板启用状态</h3>
        <div class="control-grid">
          <div class="control-item">
            <label>模板UUIDs (逗号分隔):</label>
            <textarea
              v-model="batchTemplateUuids"
              placeholder="uuid1,uuid2,uuid3"
              rows="3"
            ></textarea>
          </div>
          <div class="control-actions">
            <button @click="batchUpdateEnabled" :disabled="!templateUuidsList.length">
              批量启用
            </button>
            <button @click="batchUpdateDisabled" :disabled="!templateUuidsList.length">
              批量禁用
            </button>
          </div>
        </div>
      </section>

      <!-- 即将到来的提醒 -->
      <section class="demo-section">
        <h3>即将到来的提醒</h3>
        <div class="control-grid">
          <div class="control-item">
            <label>天数范围:</label>
            <select v-model="upcomingDays">
              <option :value="1">1天</option>
              <option :value="3">3天</option>
              <option :value="7">7天</option>
              <option :value="30">30天</option>
            </select>
          </div>
          <div class="control-item">
            <label>最大数量:</label>
            <input type="number" v-model.number="upcomingLimit" min="1" max="100" />
          </div>
          <div class="control-actions">
            <button @click="getUpcomingReminders">获取即将到来的提醒</button>
          </div>
        </div>

        <div v-if="upcomingData" class="upcoming-results">
          <h4>结果 (总数: {{ upcomingData.total }})</h4>
          <div v-if="upcomingData.reminders?.length" class="instances-list">
            <div
              v-for="reminder in upcomingData.reminders.slice(0, 5)"
              :key="reminder.uuid"
              class="instance-card"
            >
              <div class="instance-header">
                <span class="instance-title">{{ reminder.title }}</span>
                <span class="instance-time">{{ formatDate(reminder.scheduledTime) }}</span>
              </div>
              <p class="instance-description">{{ reminder.message }}</p>
            </div>
            <p v-if="upcomingData.reminders.length > 5" class="more-instances">
              ...还有{{ upcomingData.reminders.length - 5 }}个实例
            </p>
          </div>
          <p v-else class="no-instances">暂无即将到来的提醒</p>
        </div>
      </section>

      <!-- 操作结果 -->
      <section class="demo-section" v-if="lastResult">
        <h3>最后操作结果</h3>
        <div class="result-card">
          <pre>{{ JSON.stringify(lastResult, null, 2) }}</pre>
        </div>
      </section>

      <!-- 错误信息 -->
      <section class="demo-section" v-if="error">
        <h3>错误信息</h3>
        <div class="error-card">
          <p>{{ error }}</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ReminderContracts } from '@dailyuse/contracts';
import { ReminderWebApplicationService } from '../../application/services/ReminderWebApplicationService';

// 创建应用服务实例
const reminderWebApplicationService = new ReminderWebApplicationService();

// ===== 响应式状态 =====
const groupUuid = ref('');
const templateUuid = ref('');
const enableMode = ref<ReminderContracts.ReminderTemplateEnableMode>(
  ReminderContracts.ReminderTemplateEnableMode.GROUP,
);
const enabled = ref(true);
const selfEnabled = ref(true);
const batchTemplateUuids = ref('');
const upcomingDays = ref(7);
const upcomingLimit = ref(20);

const lastResult = ref<any>(null);
const error = ref<string | null>(null);
const upcomingData = ref<ReminderContracts.UpcomingRemindersResponse | null>(null);

// ===== 计算属性 =====
const templateUuidsList = computed(() => {
  return batchTemplateUuids.value
    .split(',')
    .map((uuid) => uuid.trim())
    .filter((uuid) => uuid.length > 0);
});

// ===== 方法 =====

/**
 * 切换分组启用模式
 */
async function toggleGroupEnableMode(): Promise<void> {
  try {
    error.value = null;
    const result = await reminderWebApplicationService.toggleGroupEnableMode(
      groupUuid.value,
      enableMode.value,
      enabled.value,
    );
    lastResult.value = result;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '操作失败';
  }
}

/**
 * 切换分组启用状态
 */
async function toggleGroupEnabled(): Promise<void> {
  try {
    error.value = null;
    const result = await reminderWebApplicationService.toggleGroupEnabled(
      groupUuid.value,
      enabled.value,
    );
    lastResult.value = result;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '操作失败';
  }
}

/**
 * 切换模板自我启用状态
 */
async function toggleTemplateSelfEnabled(): Promise<void> {
  try {
    error.value = null;
    const result = await reminderWebApplicationService.toggleTemplateSelfEnabled(
      templateUuid.value,
      selfEnabled.value,
    );
    lastResult.value = result;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '操作失败';
  }
}

/**
 * 批量启用模板
 */
async function batchUpdateEnabled(): Promise<void> {
  try {
    error.value = null;
    const result = await reminderWebApplicationService.batchUpdateTemplatesEnabled(
      templateUuidsList.value,
      true,
    );
    lastResult.value = result;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '操作失败';
  }
}

/**
 * 批量禁用模板
 */
async function batchUpdateDisabled(): Promise<void> {
  try {
    error.value = null;
    const result = await reminderWebApplicationService.batchUpdateTemplatesEnabled(
      templateUuidsList.value,
      false,
    );
    lastResult.value = result;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '操作失败';
  }
}

/**
 * 获取即将到来的提醒
 */
async function getUpcomingReminders(): Promise<void> {
  try {
    error.value = null;
    const result = await reminderWebApplicationService.getUpcomingReminders({
      days: upcomingDays.value,
      limit: upcomingLimit.value,
    });
    upcomingData.value = result;
    lastResult.value = result;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '操作失败';
  }
}

/**
 * 格式化日期
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN');
}
</script>

<style scoped>
.reminder-enable-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.demo-header {
  text-align: center;
  margin-bottom: 32px;
}

.demo-header h2 {
  color: #1f2937;
  margin-bottom: 8px;
}

.demo-header p {
  color: #6b7280;
}

.demo-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.demo-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
}

.demo-section h3 {
  color: #1f2937;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.control-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  align-items: start;
}

.control-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.control-item label {
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.control-item input,
.control-item select,
.control-item textarea {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.control-item input:focus,
.control-item select:focus,
.control-item textarea:focus {
  outline: none;
  border-color: #3b82f6;
}

.control-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-self: start;
}

.control-actions button {
  padding: 8px 16px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.control-actions button:hover:not(:disabled) {
  background-color: #2563eb;
}

.control-actions button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.upcoming-results {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.upcoming-results h4 {
  color: #1f2937;
  margin-bottom: 12px;
}

.instances-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.instance-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
}

.instance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.instance-title {
  font-weight: 500;
  color: #1f2937;
}

.instance-time {
  font-size: 12px;
  color: #6b7280;
}

.instance-description {
  font-size: 14px;
  color: #4b5563;
  margin: 0;
}

.more-instances {
  font-size: 14px;
  color: #6b7280;
  font-style: italic;
  margin: 8px 0 0 0;
}

.no-instances {
  font-size: 14px;
  color: #6b7280;
  text-align: center;
  margin: 16px 0;
}

.result-card {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 12px;
}

.result-card pre {
  font-size: 12px;
  color: #374151;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.error-card {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 12px;
}

.error-card p {
  color: #dc2626;
  margin: 0;
  font-size: 14px;
}
</style>
