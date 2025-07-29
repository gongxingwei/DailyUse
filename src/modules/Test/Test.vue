<template>
  <div>
    <!-- Tabs -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        :class="{ active: activeTab === tab }"
        @click="activeTab = tab"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Tab Content -->
    <div v-if="activeTab === '通知测试'">
      <!-- 通知测试内容 -->
    </div>
    <div v-else-if="activeTab === '右键菜单测试'">
      <context-menu-test />
    </div>
    <div v-else-if="activeTab === '其他测试'">
      <div class="notification-test-container">
        <div class="test-header">
          <h2>其他测试</h2>
          <p>这里可以放其他类型的测试内容</p>
        </div>
        <!-- AccountStore 测试区块 -->
        <div class="test-section">
          <h3>AccountStore 测试</h3>
          <div class="form-row">
            <label>当前账号用户名：</label>
            <span>{{ account?.username || '未登录' }}</span>
          </div>
          <div class="form-row">
            <label>当前账号 UUID：</label>
            <span>{{ account?.uuid || '无' }}</span>
          </div>
          <div class="form-row">
            <label>当前账号类型：</label>
            <span>{{ account?.accountType || '无' }}</span>
          </div>
          <div class="form-row">
            <label>当前账号状态：</label>
            <span>{{ account?.status || '无' }}</span>
          </div>
          <div class="button-group">
            <button class="btn btn-primary btn-sm" @click="logAccount">打印账号信息</button>
            <button class="btn btn-secondary btn-sm" @click="clearAccount">清空账号</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAccountStore } from '@/modules/Account/presentation/stores/accountStore';
import ContextMenuTest from './components/ContextMenuTest.vue';

// Tabs 相关
const tabs = ['通知测试', '右键菜单测试', '其他测试'];
const activeTab = ref(tabs[0]);

// AccountStore 测试
const accountStore = useAccountStore();
const account = accountStore.currentAccount;

// 打印账号信息
function logAccount() {
  console.log('当前账号信息:', account);
  alert(JSON.stringify(account, null, 2));
}

// 清空账号
function clearAccount() {
  alert('账号已清空');
}
</script>

<style scoped>
/* Tabs 样式 */
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.tabs button {
  padding: 8px 16px;
  border: none;
  cursor: pointer;
  border-radius: 4px 4px 0 0;
}
.tabs button.active {

}

/* 保留原有样式 */
.notification-test-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.test-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}
.test-header h2 {
  color: #333;
  margin-bottom: 10px;
}
.test-header p {
  color: #666;
  margin: 0;
}
.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border-radius: 8px;
}
.test-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #495057;
}
.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}
.btn:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}
.btn-primary { background: #007bff; color: white; }
.btn-success { background: #28a745; color: white; }
.btn-warning { background: #ffc107; color: #212529; }
.btn-danger { background: #dc3545; color: white; }
.btn-info { background: #17a2b8; color: white; }
.btn-secondary { background: #6c757d; color: white; }
.btn-sm { font-size: 12px; padding: 6px 12px; }
.form-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.form-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.form-row label {
  min-width: 80px;
  font-weight: 500;
  color: #495057;
}
.form-row input,
.form-row select,
.form-row textarea {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}
.form-row textarea {
  min-height: 60px;
  resize: vertical;
}
.log-container {
  max-height: 300px;
  overflow-y: auto;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  margin-bottom: 10px;
}
.log-item {
  padding: 8px 12px;
  border-bottom: 1px solid #f8f9fa;
  display: flex;
  gap: 10px;
  font-size: 13px;
}
.log-item:last-child {
  border-bottom: none;
}
.log-item.success { background: #d4edda; color: #155724; }
.log-item.warning { background: #fff3cd; color: #856404; }
.log-item.error { background: #f8d7da; color: #721c24; }
.log-item.info { background: #d1ecf1; color: #0c5460; }
.log-time {
  font-weight: 500;
  min-width: 80px;
}
.log-message {
  flex: 1;
}
.status-info {
  background: white;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}
.status-info p {
  margin: 5px 0;
  color: #495057;
}
.status-info strong {
  color: #007bff;
}
</style>