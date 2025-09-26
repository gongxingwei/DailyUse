<template>
  <v-navigation-drawer
    permanent
    location="right"
    width="380"
    class="reminder-instance-sidebar"
    elevation="1"
  >
    <!-- 标题栏 -->
    <v-toolbar flat color="primary" dark>
      <v-icon>mdi-bell-clock</v-icon>
      <v-toolbar-title class="ml-2">即将到来的提醒</v-toolbar-title>
      <v-spacer />
      <v-btn
        icon
        @click="refreshUpcoming"
        :loading="isLoading"
        size="small"
      >
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
      <v-btn
        icon
        @click="openSettings"
        size="small"
      >
        <v-icon>mdi-cog</v-icon>
      </v-btn>
    </v-toolbar>

    <!-- 过滤器 -->
    <v-expand-transition>
      <v-card v-show="showFilters" flat class="pa-4 border-b">
        <v-row>
          <v-col cols="12">
            <v-select
              v-model="filters.days"
              label="时间范围"
              :items="[
                { value: 1, title: '今天' },
                { value: 3, title: '3天内' },
                { value: 7, title: '一周内' },
                { value: 30, title: '一个月内' }
              ]"
              variant="outlined"
              density="compact"
              @update:model-value="applyFilters"
            />
          </v-col>
          <v-col cols="12">
            <v-select
              v-model="filters.priorities"
              label="优先级"
              :items="[
                { value: 'urgent', title: '紧急' },
                { value: 'high', title: '高' },
                { value: 'normal', title: '普通' },
                { value: 'low', title: '低' }
              ]"
              multiple
              variant="outlined"
              density="compact"
              @update:model-value="applyFilters"
            />
          </v-col>
        </v-row>
      </v-card>
    </v-expand-transition>

    <!-- 统计信息 -->
    <v-card v-if="upcomingData" flat class="pa-4 border-b">
      <v-row>
        <v-col cols="4" class="text-center">
          <div class="text-h6 text-primary">{{ upcomingData.total || 0 }}</div>
          <div class="text-caption text-medium-emphasis">总数</div>
        </v-col>
        <v-col cols="4" class="text-center">
          <div class="text-h6 text-info">{{ todayCount }}</div>
          <div class="text-caption text-medium-emphasis">今天</div>
        </v-col>
        <v-col cols="4" class="text-center">
          <div class="text-h6 text-error">{{ overdueCount }}</div>
          <div class="text-caption text-medium-emphasis">逾期</div>
        </v-col>
      </v-row>
    </v-card>

    <!-- 提醒列表 -->
    <div class="flex-grow-1 overflow-y-auto">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="pa-4">
        <v-skeleton-loader
          v-for="i in 3"
          :key="i"
          type="list-item-avatar-two-line"
          class="mb-2"
        />
      </div>

      <!-- 错误状态 -->
      <v-card v-else-if="error" flat class="pa-4 text-center">
        <v-icon size="48" color="error" class="mb-2">mdi-alert-circle</v-icon>
        <v-card-text>{{ error }}</v-card-text>
        <v-btn variant="outlined" @click="refreshUpcoming">重试</v-btn>
      </v-card>

      <!-- 空状态 -->
      <v-card v-else-if="groupedReminders.length === 0" flat class="pa-4 text-center">
        <v-icon size="48" color="disabled" class="mb-2">mdi-bell-off</v-icon>
        <v-card-text class="text-medium-emphasis">暂无即将到来的提醒</v-card-text>
      </v-card>

      <!-- 提醒列表 -->
      <div v-else>
        <div v-for="group in groupedReminders" :key="group.date">
          <!-- 日期分组头部 -->
          <v-list-subheader class="d-flex justify-space-between">
            <span>{{ formatGroupDate(group.date) }}</span>
            <v-chip size="small" variant="outlined">{{ group.reminders.length }}</v-chip>
          </v-list-subheader>

          <!-- 该日期的提醒列表 -->
          <v-list density="compact">
            <v-list-item
              v-for="reminder in group.reminders"
              :key="reminder.uuid"
              :class="getReminderClass(reminder)"
              @click="handleReminderClick(reminder)"
              class="reminder-item"
            >
              <!-- 优先级指示器 -->
              <template #prepend>
                <v-icon 
                  :color="getPriorityColor(reminder.priority)"
                  size="small"
                >
                  mdi-circle
                </v-icon>
              </template>

              <!-- 主要内容 -->
              <v-list-item-title class="text-wrap">
                {{ reminder.title }}
              </v-list-item-title>
              
              <v-list-item-subtitle v-if="reminder.content" class="text-wrap mt-1">
                {{ reminder.content }}
              </v-list-item-subtitle>

              <!-- 时间和标签 -->
              <div class="d-flex align-center justify-space-between mt-2">
                <v-chip 
                  size="x-small" 
                  :color="isOverdue(reminder.scheduledTime) ? 'error' : 'primary'"
                  variant="text"
                >
                  {{ formatTime(reminder.scheduledTime) }}
                </v-chip>
                
                <div v-if="reminder.tags?.length" class="d-flex gap-1">
                  <v-chip
                    v-for="tag in reminder.tags.slice(0, 2)"
                    :key="tag"
                    size="x-small"
                    variant="outlined"
                  >
                    {{ tag }}
                  </v-chip>
                  <v-chip
                    v-if="reminder.tags.length > 2"
                    size="x-small"
                    variant="text"
                  >
                    +{{ reminder.tags.length - 2 }}
                  </v-chip>
                </div>
              </div>

              <!-- 操作按钮 -->
              <!-- <template #append>
                <div class="reminder-actions">
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click.stop="snoozeReminder(reminder)"
                    title="延期"
                  >
                    <v-icon>mdi-clock-plus</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click.stop="completeReminder(reminder)"
                    title="完成"
                  >
                    <v-icon>mdi-check</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    @click.stop="dismissReminder(reminder)"
                    title="忽略"
                  >
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </div>
              </template> -->
            </v-list-item>
          </v-list>
          
          <v-divider />
        </div>
      </div>
    </div>

    <!-- 底部操作 -->
    <v-card flat class="border-t pa-2">
      <div class="d-flex justify-space-between">
        <v-btn
          variant="text"
          size="small"
          @click="toggleFilters"
          prepend-icon="mdi-filter"
        >
          过滤器
        </v-btn>
        <v-btn
          variant="text"
          size="small"
          @click="openAllReminders"
        >
          查看全部
        </v-btn>
      </div>
    </v-card>

    <!-- 设置弹窗 -->
    <v-dialog v-model="settingsOpen" max-width="400">
      <v-card>
        <v-card-title>
          <span class="text-h6">侧边栏设置</span>
        </v-card-title>
        
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-select
                v-model="settings.defaultDays"
                label="默认显示天数"
                :items="[
                  { value: 1, title: '1天' },
                  { value: 3, title: '3天' },
                  { value: 7, title: '7天' },
                  { value: 30, title: '30天' }
                ]"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model.number="settings.maxItems"
                label="最大显示数量"
                type="number"
                min="10"
                max="100"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-select
                v-model="settings.refreshInterval"
                label="自动刷新间隔（秒）"
                :items="[
                  { value: 0, title: '关闭' },
                  { value: 30, title: '30秒' },
                  { value: 60, title: '1分钟' },
                  { value: 300, title: '5分钟' }
                ]"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-checkbox
                v-model="settings.showCompleted"
                label="显示已完成的提醒"
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="settingsOpen = false">取消</v-btn>
          <v-btn color="primary" @click="saveSettings">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import type { ReminderContracts } from '@dailyuse/contracts';
import { useReminder } from '../composables/useReminder';
import { useRouter } from 'vue-router';
import { format, formatDistanceToNow, isToday, isPast, startOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// ===== Props & Emits =====
interface Props {
  visible?: boolean;
  filters?: {
    days?: number;
    priorities?: string[];
    categories?: string[];
    tags?: string[];
  };
  settings?: {
    defaultDays?: number;
    maxItems?: number;
    refreshInterval?: number;
    showCompleted?: boolean;
  };
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  filters: () => ({}),
  settings: () => ({})
});

interface Emits {
  (e: 'reminder-click', reminder: any): void;
  (e: 'reminder-action', action: 'snooze' | 'complete' | 'dismiss', reminder: any): void;
  (e: 'filters-change', filters: any): void;
  (e: 'settings-change', settings: any): void;
}

const emit = defineEmits<Emits>();

// ===== Composables =====
const router = useRouter();
const { getActiveReminders, isLoading, error } = useReminder();

// ===== 响应式状态 =====
const showFilters = ref(false);
const settingsOpen = ref(false);
const upcomingData = ref<any>(null);

// 过滤器状态
const filters = ref({
  days: props.filters.days || 7,
  priorities: props.filters.priorities || [],
  categories: props.filters.categories || [],
  tags: props.filters.tags || [],
});

// 设置状态
const settings = ref({
  defaultDays: props.settings.defaultDays || 7,
  maxItems: props.settings.maxItems || 50,
  refreshInterval: props.settings.refreshInterval || 60,
  showCompleted: props.settings.showCompleted || false,
});

// 自动刷新定时器
let refreshTimer: ReturnType<typeof setInterval> | null = null;

// ===== 计算属性 =====

/**
 * 分组的提醒实例
 */
const groupedReminders = computed(() => {
  if (!upcomingData.value?.reminders) return [];

  const groups = new Map<string, any[]>();

  upcomingData.value.reminders.forEach((reminder: any) => {
    const date = startOfDay(new Date(reminder.scheduledTime)).toISOString();
    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(reminder);
  });

  return Array.from(groups.entries())
    .map(([date, reminders]) => ({
      date,
      reminders: reminders.sort(
        (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
      ),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
});

/**
 * 今天的提醒数量
 */
const todayCount = computed(() => {
  if (!upcomingData.value?.reminders) return 0;
  return upcomingData.value.reminders.filter((reminder: any) =>
    isToday(new Date(reminder.scheduledTime))
  ).length;
});

/**
 * 逾期的提醒数量
 */
const overdueCount = computed(() => {
  if (!upcomingData.value?.reminders) return 0;
  return upcomingData.value.reminders.filter((reminder: any) =>
    isPast(new Date(reminder.scheduledTime))
  ).length;
});

// ===== 方法 =====

/**
 * 获取即将到来的提醒
 */
async function fetchUpcomingReminders(): Promise<void> {
  try {
    const response = await getActiveReminders({
      limit: settings.value.maxItems,
      // TODO: 根据实际 API 调整参数
    });

    upcomingData.value = response;
  } catch (err) {
    console.error('获取即将到来的提醒失败:', err);
  }
}

/**
 * 刷新数据
 */
async function refreshUpcoming(): Promise<void> {
  await fetchUpcomingReminders();
}

/**
 * 应用过滤器
 */
async function applyFilters(): Promise<void> {
  emit('filters-change', filters.value);
  await fetchUpcomingReminders();
}

/**
 * 格式化分组日期
 */
function formatGroupDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return '今天';
  return format(date, 'M月d日 EEEE', { locale: zhCN });
}

/**
 * 格式化时间
 */
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isPast(date)) {
    return `逾期 ${formatDistanceToNow(date, { locale: zhCN })}`;
  }
  return format(date, 'HH:mm');
}

/**
 * 检查是否逾期
 */
function isOverdue(dateStr: string): boolean {
  return isPast(new Date(dateStr));
}

/**
 * 获取提醒样式类
 */
function getReminderClass(reminder: any): string[] {
  const classes = [];
  
  if (isOverdue(reminder.scheduledTime)) {
    classes.push('overdue');
  }
  
  return classes;
}

/**
 * 获取优先级颜色
 */
function getPriorityColor(priority: string): string {
  const colors = {
    urgent: 'red',
    high: 'orange',
    normal: 'blue',
    low: 'grey'
  };
  return colors[priority as keyof typeof colors] || 'grey';
}

/**
 * 处理提醒点击
 */
function handleReminderClick(reminder: any): void {
  emit('reminder-click', reminder);
  router.push(`/reminders/templates/${reminder.templateUuid}/instances/${reminder.uuid}`);
}

// /**
//  * 延期提醒
//  */
// async function snoozeReminder(reminder: any): Promise<void> {
//   emit('reminder-action', 'snooze', reminder);
//   try {
//     await snoozeReminderAction(reminder.templateUuid, reminder.uuid, 300); // 延期5分钟
//     await refreshUpcoming();
//   } catch (err) {
//     console.error('延期提醒失败:', err);
//   }
// }

// /**
//  * 完成提醒
//  */
// async function completeReminder(reminder: any): Promise<void> {
//   emit('reminder-action', 'complete', reminder);
//   try {
//     await completeReminderAction(reminder.templateUuid, reminder.uuid);
//     await refreshUpcoming();
//   } catch (err) {
//     console.error('完成提醒失败:', err);
//   }
// }

// /**
//  * 忽略提醒
//  */
// async function dismissReminder(reminder: any): Promise<void> {
//   emit('reminder-action', 'dismiss', reminder);
//   try {
//     await dismissReminderAction(reminder.templateUuid, reminder.uuid);
//     await refreshUpcoming();
//   } catch (err) {
//     console.error('忽略提醒失败:', err);
//   }
// }

/**
 * 切换过滤器显示
 */
function toggleFilters(): void {
  showFilters.value = !showFilters.value;
}

/**
 * 打开设置
 */
function openSettings(): void {
  settingsOpen.value = true;
}

/**
 * 保存设置
 */
function saveSettings(): void {
  // 更新过滤器默认值
  filters.value.days = settings.value.defaultDays;
  
  // 重新设置自动刷新
  setupAutoRefresh();
  
  // 重新获取数据
  fetchUpcomingReminders();
  
  emit('settings-change', settings.value);
  settingsOpen.value = false;
}

/**
 * 查看全部提醒
 */
function openAllReminders(): void {
  router.push('/reminders');
}

/**
 * 设置自动刷新
 */
function setupAutoRefresh(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  
  if (settings.value.refreshInterval > 0) {
    refreshTimer = setInterval(() => {
      fetchUpcomingReminders();
    }, settings.value.refreshInterval * 1000);
  }
}

// ===== 生命周期 =====

onMounted(async () => {
  await fetchUpcomingReminders();
  setupAutoRefresh();
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});

// 监听设置变化
watch(() => settings.value.refreshInterval, setupAutoRefresh);
</script>

<style scoped>
.reminder-instance-sidebar {
  border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.reminder-item {
  transition: background-color 0.2s ease;
}

.reminder-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.reminder-item.overdue {
  background-color: rgba(var(--v-theme-error), 0.08);
}

.reminder-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
  display: flex;
  gap: 2px;
}

.reminder-item:hover .reminder-actions {
  opacity: 1;
}
</style>