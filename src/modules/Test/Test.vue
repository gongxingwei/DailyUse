<template>
  <div class="notification-test-container">
    <div class="test-header">
      <h2>通知系统测试</h2>
      <p>测试各种类型的弹窗通知功能</p>
    </div>

    <!-- 基础通知测试 -->
    <div class="test-section">
      <h3>基础通知</h3>
      <div class="button-group">
        <button @click="showSimpleNotification" class="btn btn-primary">
          简单通知
        </button>
        <button @click="showWarningNotification" class="btn btn-warning">
          警告通知
        </button>
        <button @click="showCriticalNotification" class="btn btn-danger">
          重要通知
        </button>
      </div>
    </div>

    <!-- 带操作按钮的通知 -->
    <div class="test-section">
      <h3>交互通知</h3>
      <div class="button-group">
        <button @click="showConfirmNotification" class="btn btn-success">
          确认通知
        </button>
        <button @click="showActionNotification" class="btn btn-info">
          多操作通知
        </button>
        <button @click="showCustomNotification" class="btn btn-secondary">
          自定义通知
        </button>
      </div>
    </div>

    <!-- 批量测试 -->
    <div class="test-section">
      <h3>批量测试</h3>
      <div class="button-group">
        <button @click="showMultipleNotifications" class="btn btn-primary">
          显示多个通知
        </button>
        <button @click="closeAllNotifications" class="btn btn-danger">
          关闭所有通知
        </button>
      </div>
    </div>

    <!-- 自定义通知表单 -->
    <div class="test-section">
      <h3>自定义通知</h3>
      <div class="form-group">
        <div class="form-row">
          <label>标题:</label>
          <input v-model="customNotification.title" type="text" placeholder="通知标题" />
        </div>
        <div class="form-row">
          <label>内容:</label>
          <textarea v-model="customNotification.body" placeholder="通知内容"></textarea>
        </div>
        <div class="form-row">
          <label>紧急程度:</label>
          <select v-model="customNotification.urgency">
            <option value="low">低</option>
            <option value="normal">普通</option>
            <option value="critical">重要</option>
          </select>
        </div>
        <div class="form-row">
          <label>图标URL:</label>
          <input v-model="customNotification.icon" type="text" placeholder="图标URL (可选)" />
        </div>
        <button @click="showCustomFormNotification" class="btn btn-primary">
          发送自定义通知
        </button>
      </div>
    </div>

    <!-- 测试日志 -->
    <div class="test-section">
      <h3>测试日志</h3>
      <div class="log-container">
        <div v-for="(log, index) in testLogs" :key="index" class="log-item" :class="log.type">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
      <button @click="clearLogs" class="btn btn-secondary btn-sm">清空日志</button>
    </div>

    <!-- 通知状态 -->
    <div class="test-section">
      <h3>通知状态</h3>
      <div class="status-info">
        <p>当前活跃通知数量: <strong>{{ activeNotificationCount }}</strong></p>
        <p>总发送通知数: <strong>{{ totalSentCount }}</strong></p>
        <p>接收到的操作数: <strong>{{ actionReceivedCount }}</strong></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { notificationService } from '@/modules/notification/services/notificationService';
import type { NotificationWindowOptions } from '@/modules/notification/types/notification';
// 测试状态
const activeNotificationCount = ref(0);
const totalSentCount = ref(0);
const actionReceivedCount = ref(0);

// 自定义通知表单
const customNotification = ref({
  title: '自定义通知标题',
  body: '这是一个自定义的通知内容',
  urgency: 'normal' as 'low' | 'normal' | 'critical',
  icon: ''
});

// 测试日志
const testLogs = ref<Array<{
  time: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}>>([]);

// 添加日志
const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  const time = new Date().toLocaleTimeString();
  testLogs.value.unshift({ time, message, type });
  
  // 限制日志数量
  if (testLogs.value.length > 50) {
    testLogs.value = testLogs.value.slice(0, 50);
  }
};

// 基础通知方法
const showNotification = async (options: Omit<NotificationWindowOptions, 'id'> = {
  title: '默认通知',
  body: '这是一个默认通知消息',
  urgency: 'normal'
}) => {
  try {
    const result = await notificationService.showNotification({
      ...options
    });
    
    totalSentCount.value++;
    activeNotificationCount.value++;
    
    return result;
  } catch (error) {
    addLog(`发送通知失败: ${error}`, 'error');
    console.error('发送通知失败:', error);
  }
};


// 简单通知
const showSimpleNotification = () => {
  showNotification({
    title: '简单通知',
    body: '这是一个简单的通知消息',
    urgency: 'normal'
  });
};

// 警告通知
const showWarningNotification = () => {
  showNotification({
    title: '警告',
    body: '这是一个警告消息，需要您的注意',
    urgency: 'normal'
  });
};

// 重要通知
const showCriticalNotification = () => {
  showNotification({
    title: '重要通知',
    body: '这是一个重要通知，不会自动关闭',
    urgency: 'critical'
  });
};

// 确认通知
const showConfirmNotification = () => {
  showNotification({
    title: '确认操作',
    body: '您确定要执行此操作吗？',
    urgency: 'normal',
    actions: [
      { text: '确认', type: 'confirm' },
      { text: '取消', type: 'cancel' }
    ]
  });
};

// 多操作通知
const showActionNotification = () => {
  showNotification({
    title: '多选操作',
    body: '请选择您要执行的操作',
    urgency: 'normal',
    actions: [
      { text: '保存', type: 'action' },
      { text: '另存为', type: 'action' },
      { text: '取消', type: 'cancel' }
    ]
  });
};

// 自定义通知
const showCustomNotification = () => {
  showNotification({
    title: '自定义通知',
    body: '这是一个带图标的自定义通知',
    urgency: 'normal',
    icon: 'https://via.placeholder.com/48x48/007bff/ffffff?text=i',
    actions: [
      { text: '查看详情', type: 'action' },
      { text: '忽略', type: 'cancel' }
    ]
  });
};

// 表单自定义通知
const showCustomFormNotification = () => {
  showNotification({
    title: customNotification.value.title,
    body: customNotification.value.body,
    urgency: customNotification.value.urgency,
    icon: customNotification.value.icon || undefined,
    actions: [
      { text: '确定', type: 'confirm' },
      { text: '取消', type: 'cancel' }
    ]
  });
};

// 显示多个通知
const showMultipleNotifications = () => {
  const notifications = [
    { title: '通知 1', body: '第一个批量通知', urgency: 'low' as const },
    { title: '通知 2', body: '第二个批量通知', urgency: 'normal' as const },
    { title: '通知 3', body: '第三个批量通知', urgency: 'critical' as const }
  ];

  notifications.forEach((notification, index) => {
    setTimeout(() => {
      showNotification(notification);
    }, index * 500); // 每隔500ms显示一个
  });
};

// 关闭所有通知
const closeAllNotifications = () => {
  // 这里需要调用通知服务的关闭所有通知方法
  // 暂时只是记录日志
  addLog('请求关闭所有通知', 'warning');
  activeNotificationCount.value = 0;
};

// 清空日志
const clearLogs = () => {
  testLogs.value = [];
};

// 监听通知操作回调
const handleNotificationAction = (_event: any, id: string, action: { text: string; type: string }) => {
  actionReceivedCount.value++;
  activeNotificationCount.value = Math.max(0, activeNotificationCount.value - 1);
  addLog(`收到通知操作: ${action.text} (${action.type}) - ID: ${id}`, 'info');
};

// 监听通知关闭
const handleNotificationClosed = (_event: any, id: string) => {
  activeNotificationCount.value = Math.max(0, activeNotificationCount.value - 1);
  addLog(`通知已关闭 - ID: ${id}`, 'info');
};

// 组件生命周期
onMounted(() => {
  // 监听通知操作
  window.shared.ipcRenderer.on('notification-action-received', handleNotificationAction);
  window.shared.ipcRenderer.on('notification-closed', handleNotificationClosed);
  
  addLog('通知测试组件已加载', 'success');
});

onUnmounted(() => {
  // 清理事件监听
  window.shared.ipcRenderer.removeListener('notification-action-received', handleNotificationAction);
  window.shared.ipcRenderer.removeListener('notification-closed', handleNotificationClosed);
});
</script>

<style scoped>
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
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
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