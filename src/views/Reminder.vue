
<template>
  <div class="reminder-container">
    <h2>健康提醒设置</h2>
    
    <div class="reminder-settings">
      <div class="setting-item">
        <label>提醒间隔（分钟）</label>
        <input 
          type="number" 
          v-model="interval" 
          min="1" 
          max="120"
          @change="saveSettings"
        >
      </div>
      
      <div class="setting-item">
        <label>是否启用提醒</label>
        <input 
          type="checkbox" 
          v-model="isEnabled"
          @change="toggleReminder"
        >
      </div>
    </div>

    <div class="next-reminder" v-if="isEnabled && nextReminderTime">
      下次提醒时间: {{ formatTime(nextReminderTime) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { notification } from '../utils/notification';

// 状态
const interval = ref(45); // 默认45分钟
const isEnabled = ref(false);
const nextReminderTime = ref<Date | null>(null);
let reminderTimer: NodeJS.Timeout | null = null;

// 格式化时间
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 发送提醒通知
const sendReminder = () => {
  notification.show({
    title: '健康提醒',
    body: '已经工作一段时间了，建议站起来活动一下，做些伸展运动～',
    urgency: 'normal',
    actions: [
      { text: '好的', type: 'confirm' },
      { text: '稍后提醒', type: 'cancel' }
    ]
  });
  
  // 设置下次提醒时间
  scheduleNextReminder();
};

// 计算下次提醒时间
const scheduleNextReminder = () => {
  if (!isEnabled.value) return;
  
  const now = new Date();
  nextReminderTime.value = new Date(now.getTime() + interval.value * 60 * 1000);
  
  if (reminderTimer) {
    clearTimeout(reminderTimer);
  }
  
  reminderTimer = setTimeout(sendReminder, interval.value * 60 * 1000);
};

// 切换提醒状态
const toggleReminder = () => {
  if (isEnabled.value) {
    scheduleNextReminder();
  } else {
    if (reminderTimer) {
      clearTimeout(reminderTimer);
      reminderTimer = null;
    }
    nextReminderTime.value = null;
  }
  saveSettings();
};

// 保存设置到本地存储
const saveSettings = () => {
  const settings = {
    interval: interval.value,
    isEnabled: isEnabled.value
  };
  localStorage.setItem('reminderSettings', JSON.stringify(settings));
  
  if (isEnabled.value) {
    scheduleNextReminder();
  }
};

// 加载设置
const loadSettings = () => {
  const savedSettings = localStorage.getItem('reminderSettings');
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    interval.value = settings.interval;
    isEnabled.value = settings.isEnabled;
    if (isEnabled.value) {
      scheduleNextReminder();
    }
  }
};

onMounted(() => {
  loadSettings();
});

onUnmounted(() => {
  if (reminderTimer) {
    clearTimeout(reminderTimer);
    reminderTimer = null;
  }
});
</script>

<style scoped>
.reminder-container {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
  color: #e1e1e1;
}

h2 {
  color: #ffffff;
  margin-bottom: 20px;
}

.reminder-settings {
  background: #2a2a2a;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.setting-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.setting-item label {
  flex: 1;
  margin-right: 15px;
  color: #e1e1e1;
}

.setting-item input[type="number"] {
  width: 80px;
  padding: 8px;
  border: 1px solid #444;
  border-radius: 4px;
  background: #1a1a1a;
  color: #fff;
  outline: none;
}

.setting-item input[type="number"]:focus {
  border-color: #666;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
}

.setting-item input[type="checkbox"] {
  width: 20px;
  height: 20px;
  accent-color: #666;
  cursor: pointer;
}

.next-reminder {
  color: #a8dab5;
  font-size: 14px;
  padding: 12px;
  background: #1a2e1f;
  border-radius: 4px;
  text-align: center;
  border: 1px solid #2d4d37;
}

/* 输入框的滚动条样式 */
.setting-item input[type="number"]::-webkit-inner-spin-button,
.setting-item input[type="number"]::-webkit-outer-spin-button {
  opacity: 1;
  background: #333;
  border-radius: 2px;
  height: 14px;
}
</style>