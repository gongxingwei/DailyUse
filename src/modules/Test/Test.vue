<template>
  <div class="test-container">
    <h2>通知测试</h2>

    <div class="button-group">
      <button @click="showSimpleNotification">
        简单通知
      </button>

      <button @click="showWarningNotification">
        警告通知
      </button>

      <button @click="showCustomNotification">
        自定义通知（带按钮）
      </button>

      <button @click="showMultipleNotifications">
        多个通知
      </button>

      <button @click="addTaskSchedule">
        添加任务
      </button>
      <button @click="getTaskSchedule">
        获取当前所有任务
      </button>
      <button @click="cancelTaskSchedule">
        删除测试任务
      </button>
    </div>

    <div class="status">
      <h3>通知历史</h3>
      <div v-for="(item, index) in notificationHistory" :key="index" class="history-item">
        <span class="time">{{ item.time }}</span>
        <span class="title">{{ item.title }}</span>
        <span class="type">{{ item.type }}</span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { notification } from '@/shared/utils/notification/notification';
import { scheduleService } from '@/shared/utils/schedule/main';

const everyTenSeconds = '*/10 * * * * *';


interface NotificationHistoryItem {
  time: string;
  title: string;
  type: string;
}

const notificationHistory = ref<NotificationHistoryItem[]>([]);

const addToHistory = (title: string, type: string) => {
  const time = new Date().toLocaleTimeString();
  notificationHistory.value.unshift({ time, title, type });
};

const addTaskSchedule = async () => {
  await scheduleService.createSchedule({
    id: 'daily-task',
    cron: everyTenSeconds,
    task: {
      type: 'notification',
      payload: {
        title: '每日提醒',
        body: '该开始工作了！'
      }
    }
  });

};

const getTaskSchedule = async () => {
  const tasks = await scheduleService.getSchedules();
  console.log('当前所有任务:', tasks);
};

const cancelTaskSchedule = async () => {
  await scheduleService.cancelSchedule('daily-task');
};


// scheduleService.onScheduleTriggered(({ id, task }) => {
//   if (task.type === 'notification') {
//     // 处理通知任务
//     notification.show(task.payload);
//   }
// });
let cleanup: (() => void) | null = null;
onMounted(() => {
    cleanup = scheduleService.onScheduleTriggered(({ task }) => {
        if (task.type === 'notification') {
            // 处理通知任务
            notification.show(task.payload);
        }
    });
});

onUnmounted(() => {
    if (cleanup) {
        cleanup();
    }
});

const showSimpleNotification = async () => {
  console.log('开始显示简单通知...');
  try {
    console.log('调用 notification.showSimple...');
    const id = await notification.showSimple(
      '简单通知',
      '这是一条基本的通知消息'
    );
    console.log('notification.showSimple 返回的 ID:', id);
    addToHistory('简单通知', `ID: ${id}`);
    console.log('通知历史已更新');
  } catch (error) {
    console.error('显示通知时发生错误:', error);
  }
};

const showWarningNotification = async () => {
  const id = await notification.showWarning(
    '警告通知',
    '这是一条警告消息，需要你的注意！'
  );
  addToHistory('警告通知', `ID: ${id}`);
};

const showCustomNotification = async () => {
  const id = await notification.show({
    title: '自定义通知',
    body: '这是一条带有自定义按钮的通知',
    urgency: 'normal',
    actions: [
      { text: '确认', type: 'confirm' },
      { text: '取消', type: 'cancel' },
      { text: '稍后提醒', type: 'action' }
    ]
  });
  addToHistory('自定义通知', `ID: ${id}`);
};

const showMultipleNotifications = async () => {
  // 连续发送3条不同的通知
  const id1 = await notification.showSimple('通知 1', '第一条通知消息');
  addToHistory('通知 1', `ID: ${id1}`);

  const id2 = await notification.show({
    title: '通知 2',
    body: '第二条通知消息',
    urgency: 'low',
  });
  addToHistory('通知 2', `ID: ${id2}`);

  const id3 = await notification.showWarning('通知 3', '第三条警告消息');
  addToHistory('通知 3', `ID: ${id3}`);
};
</script>

<style scoped>
.test-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #1890ff;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #40a9ff;
}

.status {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
}

.history-item {
  display: flex;
  gap: 15px;
  padding: 8px;
  border-bottom: 1px solid #e8e8e8;
}

.time {
  color: #888;
  min-width: 100px;
}

.title {
  font-weight: 500;
  flex: 1;
}

.type {
  color: #1890ff;
}



.drop-zone {
  width: 200px;
  height: 200px;
  border: 2px dashed #ccc;
  padding: 20px;
  text-align: center;
}

.dragover {
  border-color: #2196f3;
}
</style>
