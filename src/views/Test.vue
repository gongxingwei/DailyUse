<template>
  <v-container>
    <div class="container">
      
      <v-row justify="center" class="mt-5">
      <v-btn color="primary" @click="newPopup">
        点击我显示弹窗
      </v-btn>
    </v-row>
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title>测试功能</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="testTitle"
                    label="测试消息标题"
                    placeholder="输入测试消息标题"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="testMessage"
                    label="测试消息内容"
                    placeholder="输入测试消息内容"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-btn
                color="primary"
                @click="addTestMessage"
                :loading="loading"
                class="mr-4"
              >
                发送测试消息
              </v-btn>
              <v-btn
                color="secondary"
                @click="addMultipleMessages"
                :loading="loading"
              >
                发送多条测试消息
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useReminderStore } from '../stores/reminder';

const store = useReminderStore();
const testTitle = ref('测试标题');
const testMessage = ref('这是一条测试消息');
const loading = ref(false);

const newPopup = () => {
  window.electron.ipcRenderer.send('newPopup',1);
}

const addTestMessage = () => {
  loading.value = true;
  try {
    // 添加消息到队列
    const messageId = store.addMessage(testTitle.value, testMessage.value);
    console.log('添加测试消息成功，消息ID:', messageId);
  } catch (error) {
    console.error('添加测试消息失败:', error);
  } finally {
    loading.value = false;
  }
};

// 添加多条测试消息的函数
const addMultipleMessages = async () => {
  loading.value = true;
  try {
    // 添加三条测试消息
    for (let i = 1; i <= 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 500)); // 间隔 500ms
      const title = `测试标题 ${i}`;
      const message = `这是第 ${i} 条测试消息`;
      const messageId = store.addMessage(title, message);
      console.log(`添加第 ${i} 条测试消息成功，消息ID:`, messageId);
    }
  } catch (error) {
    console.error('添加多条测试消息失败:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.container {
  padding: 20px;
}
</style>