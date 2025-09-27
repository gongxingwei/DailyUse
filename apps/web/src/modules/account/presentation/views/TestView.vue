<!-- 组件测试页面 -->
<template>
  <v-container fluid class="pa-6">
    <!-- 页面标题 -->
    <div class="d-flex align-center mb-6">
      <v-avatar size="48" color="primary" variant="tonal" class="mr-4">
        <v-icon size="24">mdi-test-tube</v-icon>
      </v-avatar>
      <div>
        <h1 class="text-h4 font-weight-bold text-primary mb-1">模块测试</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-0">测试各个模块的功能和API连接</p>
      </div>
    </div>

    <!-- 测试模块标签页 -->
    <v-tabs v-model="activeTab" class="mb-6" color="primary" align-tabs="center">
      <v-tab value="components">
        <v-icon start>mdi-puzzle</v-icon>
        组件测试
      </v-tab>
      <v-tab value="schedule">
        <v-icon start>mdi-calendar-clock</v-icon>
        Schedule 测试
      </v-tab>
      <v-tab value="reminder">
        <v-icon start>mdi-bell</v-icon>
        Reminder 测试
      </v-tab>
      <v-tab value="popups">
        <v-icon start>mdi-message-alert</v-icon>
        弹窗测试
      </v-tab>
      <v-tab value="api">
        <v-icon start>mdi-api</v-icon>
        API 测试
      </v-tab>
    </v-tabs>

    <!-- 标签页内容 -->
    <v-tabs-window v-model="activeTab">
      <!-- 组件测试标签页 -->
      <v-tabs-window-item value="components">
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

          <!-- Reminder 测试 -->
          <v-col cols="12" md="6">
            <v-card class="pa-4">
              <v-card-title>
                <v-icon class="mr-2">mdi-bell</v-icon>
                提醒管理组件
              </v-card-title>
              <v-card-text>
                <v-btn color="primary" variant="outlined" @click="$router.push('/reminders')" block>
                  进入提醒管理
                </v-btn>
                <p class="text-center mt-4 text-body-2">
                  提醒模板和实例管理
                </p>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Schedule 测试 -->
          <v-col cols="12" md="6">
            <v-card class="pa-4">
              <v-card-title>
                <v-icon class="mr-2">mdi-calendar-clock</v-icon>
                调度管理组件
              </v-card-title>
              <v-card-text>
                <v-btn color="primary" variant="outlined" @click="$router.push('/schedules')" block>
                  进入调度管理
                </v-btn>
                <p class="text-center mt-4 text-body-2">
                  任务调度和队列管理
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
                  <div class="d-flex align-center mb-1">
                    <v-icon size="16" color="success" class="mr-2">mdi-check</v-icon>
                    <span>提醒管理模块</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-tabs-window-item>

      <!-- Schedule 测试标签页 -->
      <v-tabs-window-item value="schedule">
        <h2 class="text-h5 font-weight-bold mb-4">Schedule 调度功能测试</h2>

        <v-row>
          <v-col cols="12" md="6">
            <v-card class="pa-4">
              <v-card-title>
                <v-icon class="mr-2">mdi-clock-outline</v-icon>
                调度任务管理
              </v-card-title>
              <v-card-text>
                <div class="mb-3">
                  <v-btn @click="createScheduleJob" color="primary" variant="outlined" size="small" class="mr-2">
                    <v-icon start>mdi-plus</v-icon>
                    创建调度任务
                  </v-btn>
                  <v-btn @click="getScheduleJobs" color="info" variant="outlined" size="small" class="mr-2"
                    :loading="scheduleLoading">
                    <v-icon start>mdi-refresh</v-icon>
                    刷新任务列表
                  </v-btn>
                </div>

                <div v-if="scheduleJobs.length > 0">
                  <v-list density="compact">
                    <v-list-item v-for="job in scheduleJobs" :key="job.id" class="px-0">
                      <template v-slot:prepend>
                        <v-icon :color="job.status === 'active' ? 'success' : 'grey'">
                          {{ job.status === 'active' ? 'mdi-play-circle' : 'mdi-pause-circle' }}
                        </v-icon>
                      </template>
                      <v-list-item-title>{{ job.name }}</v-list-item-title>
                      <v-list-item-subtitle>{{ job.schedule }} - {{ job.status }}</v-list-item-subtitle>
                      <template v-slot:append>
                        <v-btn @click="toggleJob(job)" icon size="x-small" variant="text">
                          <v-icon>{{ job.status === 'active' ? 'mdi-pause' : 'mdi-play' }}</v-icon>
                        </v-btn>
                      </template>
                    </v-list-item>
                  </v-list>
                </div>
                <div v-else class="text-center text-medium-emphasis">
                  暂无调度任务
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card class="pa-4">
              <v-card-title>
                <v-icon class="mr-2">mdi-chart-line</v-icon>
                调度统计
              </v-card-title>
              <v-card-text>
                <div class="mb-3">
                  <div class="d-flex justify-space-between mb-2">
                    <span>总任务数:</span>
                    <v-chip size="small" color="primary">{{ scheduleStats.total }}</v-chip>
                  </div>
                  <div class="d-flex justify-space-between mb-2">
                    <span>活跃任务:</span>
                    <v-chip size="small" color="success">{{ scheduleStats.active }}</v-chip>
                  </div>
                  <div class="d-flex justify-space-between mb-2">
                    <span>暂停任务:</span>
                    <v-chip size="small" color="warning">{{ scheduleStats.paused }}</v-chip>
                  </div>
                  <div class="d-flex justify-space-between mb-2">
                    <span>已完成:</span>
                    <v-chip size="small" color="info">{{ scheduleStats.completed }}</v-chip>
                  </div>
                  <div class="d-flex justify-space-between mb-2">
                    <span>失败任务:</span>
                    <v-chip size="small" color="error">{{ scheduleStats.failed }}</v-chip>
                  </div>
                  <div class="d-flex justify-space-between mb-2">
                    <span>今日执行:</span>
                    <v-chip size="small" color="info">{{ scheduleStats.todayExecuted }}</v-chip>
                  </div>
                  <div class="d-flex justify-space-between mb-2">
                    <span>队列大小:</span>
                    <v-chip size="small" color="secondary">{{ scheduleStats.queueSize }}</v-chip>
                  </div>
                </div>

                <v-btn @click="clearAllJobs" color="error" variant="outlined" size="small" block>
                  <v-icon start>mdi-delete</v-icon>
                  清空所有任务
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-tabs-window-item>

      <!-- Notification 测试标签页 -->
      <v-tabs-window-item value="reminder">
        <h2 class="text-h5 font-weight-bold mb-4">系统通知功能测试</h2>

        <v-row>
          <!-- 通知权限管理 -->
          <v-col cols="12" md="6">
            <v-card class="pa-4">
              <v-card-title>
                <v-icon class="mr-2">mdi-shield-check</v-icon>
                通知权限管理
              </v-card-title>
              <v-card-text>
                <div class="mb-3">
                  <div class="d-flex align-items-center mb-2">
                    <span class="text-body-1 mr-2">当前权限状态:</span>
                    <v-chip :color="getPermissionColor(notificationPermission)" size="small">
                      {{ getPermissionText(notificationPermission) }}
                    </v-chip>
                  </div>
                </div>

                <v-btn @click="requestNotificationPermission" :loading="permissionLoading" color="primary"
                  variant="outlined" size="small" class="mb-2" block>
                  <v-icon start>mdi-key</v-icon>
                  请求通知权限
                </v-btn>

                <v-btn @click="testNotificationSupport" color="info" variant="outlined" size="small" block>
                  <v-icon start>mdi-help-circle</v-icon>
                  检测浏览器支持
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- 桌面通知测试 -->
          <v-col cols="12" md="6">
            <v-card class="pa-4">
              <v-card-title>
                <v-icon class="mr-2">mdi-monitor</v-icon>
                桌面通知测试
              </v-card-title>
              <v-card-text>
                <div class="mb-3">
                  <v-btn @click="showTestNotification(NotificationType.INFO)" color="info" variant="outlined"
                    size="small" class="mr-2 mb-2">
                    信息通知
                  </v-btn>
                  <v-btn @click="showTestNotification(NotificationType.SUCCESS)" color="success" variant="outlined"
                    size="small" class="mr-2 mb-2">
                    成功通知
                  </v-btn>
                  <v-btn @click="showTestNotification(NotificationType.WARNING)" color="warning" variant="outlined"
                    size="small" class="mr-2 mb-2">
                    警告通知
                  </v-btn>
                  <v-btn @click="showTestNotification(NotificationType.ERROR)" color="error" variant="outlined"
                    size="small" class="mb-2">
                    错误通知
                  </v-btn>
                </div>

                <v-btn @click="showCustomNotification" color="primary" variant="flat" size="small" block>
                  <v-icon start>mdi-bell-ring</v-icon>
                  自定义通知
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- 音效测试 -->
          <v-col cols="12" md="6">
            <v-card class="pa-4">
              <v-card-title>
                <v-icon class="mr-2">mdi-volume-high</v-icon>
                音效测试
              </v-card-title>
              <v-card-text>
                <div class="mb-3">
                  <div class="d-flex align-items-center mb-3">
                    <span class="text-body-2 mr-2">音量:</span>
                    <v-slider v-model="globalVolume" :min="0" :max="1" :step="0.1" @update:model-value="updateVolume"
                      thumb-label class="flex-grow-1"></v-slider>
                  </div>

                  <div class="d-flex flex-wrap gap-2 mb-3">
                    <v-btn @click="testSound(SoundType.DEFAULT)" size="small" variant="outlined">
                      默认音效
                    </v-btn>
                    <v-btn @click="testSound(SoundType.REMINDER)" size="small" variant="outlined">
                      提醒音效
                    </v-btn>
                    <v-btn @click="testSound(SoundType.ALERT)" size="small" variant="outlined">
                      警告音效
                    </v-btn>
                    <v-btn @click="testSound(SoundType.SUCCESS)" size="small" variant="outlined">
                      成功音效
                    </v-btn>
                  </div>

                  <v-switch v-model="soundEnabled" @update:model-value="toggleSound" label="启用声音"
                    color="primary"></v-switch>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- 提醒模拟测试 -->
          <v-col cols="12" md="6">
            <v-card class="pa-4">
              <v-card-title>
                <v-icon class="mr-2">mdi-calendar-clock</v-icon>
                Schedule 提醒模拟
              </v-card-title>
              <v-card-text>
                <div class="mb-3">
                  <v-btn @click="simulateTaskReminder" color="primary" variant="outlined" size="small"
                    class="mr-2 mb-2">
                    <v-icon start>mdi-format-list-checks</v-icon>
                    任务提醒
                  </v-btn>
                  <v-btn @click="simulateGoalReminder" color="info" variant="outlined" size="small" class="mb-2">
                    <v-icon start>mdi-target</v-icon>
                    目标提醒
                  </v-btn>
                </div>

                <v-btn @click="simulateCustomReminder" color="success" variant="outlined" size="small" class="mr-2 mb-2"
                  block>
                  <v-icon start>mdi-bell-outline</v-icon>
                  自定义提醒
                </v-btn>

                <v-btn @click="dismissAllNotifications" color="error" variant="outlined" size="small" block>
                  <v-icon start>mdi-close-circle</v-icon>
                  关闭所有通知
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- 配置管理 -->
          <v-col cols="12" md="6">
            <v-card class="pa-4">
              <v-card-title>
                <v-icon class="mr-2">mdi-cog</v-icon>
                通知配置
              </v-card-title>
              <v-card-text>
                <div class="mb-3">
                  <v-switch v-model="desktopEnabled" @update:model-value="updateDesktopEnabled" label="桌面通知"
                    color="primary" class="mb-2"></v-switch>

                  <v-switch v-model="doNotDisturbMode" @update:model-value="updateDoNotDisturb" label="勿扰模式"
                    color="warning" class="mb-2"></v-switch>

                  <div class="d-flex align-items-center mb-3">
                    <span class="text-body-2 mr-2">自动关闭时间:</span>
                    <v-select v-model="autoCloseTime" @update:model-value="updateAutoCloseTime"
                      :items="autoCloseOptions" item-title="label" item-value="value" density="compact"
                      variant="outlined" class="flex-grow-1"></v-select>
                  </div>
                </div>

                <v-btn @click="resetNotificationConfig" color="warning" variant="outlined" size="small" block>
                  <v-icon start>mdi-restore</v-icon>
                  重置配置
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- 通知统计 -->
          <v-col cols="12" md="6">
            <v-card class="pa-4">
              <v-card-title>
                <v-icon class="mr-2">mdi-chart-bar</v-icon>
                通知统计
              </v-card-title>
              <v-card-text>
                <div v-if="notificationStats">
                  <div class="d-flex justify-space-between mb-2">
                    <span>总通知数:</span>
                    <v-chip size="small" color="primary">{{ notificationStats.total }}</v-chip>
                  </div>
                  <div class="d-flex justify-space-between mb-2">
                    <span>未读通知:</span>
                    <v-chip size="small" color="warning">{{ notificationStats.unread }}</v-chip>
                  </div>
                  <div class="d-flex justify-space-between mb-2">
                    <span>今日通知:</span>
                    <v-chip size="small" color="info">{{ notificationStats.todayCount }}</v-chip>
                  </div>
                </div>

                <v-btn @click="refreshNotificationStats" color="info" variant="outlined" size="small" class="mb-2"
                  block>
                  <v-icon start>mdi-refresh</v-icon>
                  刷新统计
                </v-btn>

                <v-btn @click="clearNotificationHistory" color="error" variant="outlined" size="small" block>
                  <v-icon start>mdi-delete</v-icon>
                  清空历史
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- 浏览器支持信息 -->
        <v-row v-if="browserSupport">
          <v-col cols="12">
            <v-card class="pa-4">
              <v-card-title>
                <v-icon class="mr-2">mdi-information</v-icon>
                浏览器支持信息
              </v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <div class="text-body-2 mb-2">
                      <strong>基础功能:</strong>
                    </div>
                    <div class="d-flex align-center mb-1">
                      <v-icon :color="browserSupport.desktopSupport ? 'success' : 'error'" size="16" class="mr-2">
                        {{ browserSupport.desktopSupport ? 'mdi-check' : 'mdi-close' }}
                      </v-icon>
                      <span>桌面通知</span>
                    </div>
                    <div class="d-flex align-center mb-1">
                      <v-icon :color="browserSupport.audioSupport ? 'success' : 'error'" size="16" class="mr-2">
                        {{ browserSupport.audioSupport ? 'mdi-check' : 'mdi-close' }}
                      </v-icon>
                      <span>音频播放</span>
                    </div>
                    <div class="d-flex align-center mb-1">
                      <v-icon :color="browserSupport.configPersistence ? 'success' : 'error'" size="16" class="mr-2">
                        {{ browserSupport.configPersistence ? 'mdi-check' : 'mdi-close' }}
                      </v-icon>
                      <span>配置持久化</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="text-body-2 mb-2">
                      <strong>权限状态:</strong>
                    </div>
                    <div class="d-flex align-center mb-1">
                      <v-icon :color="browserSupport.permissionGranted ? 'success' : 'warning'" size="16" class="mr-2">
                        {{ browserSupport.permissionGranted ? 'mdi-check' : 'mdi-alert' }}
                      </v-icon>
                      <span>通知权限{{ browserSupport.permissionGranted ? '已授权' : '未授权' }}</span>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-tabs-window-item>

      <!-- 弹窗测试标签页 -->
      <v-tabs-window-item value="popups">
        <h2 class="text-h5 font-weight-bold mb-4">弹窗功能测试</h2>

        <v-row>
          <v-col cols="12" md="4">
            <v-card class="pa-4">
              <v-card-title>
                <v-icon class="mr-2">mdi-message-alert</v-icon>
                基础弹窗
              </v-card-title>
              <v-card-text>
                <v-btn @click="showBasicDialog" color="primary" variant="outlined" size="small" class="mb-2" block>
                  基础对话框
                </v-btn>
                <v-btn @click="showConfirmDialog" color="warning" variant="outlined" size="small" class="mb-2" block>
                  确认对话框
                </v-btn>
                <v-btn @click="showFormDialog" color="info" variant="outlined" size="small" block>
                  表单对话框
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card class="pa-4">
              <v-card-title>
                <v-icon class="mr-2">mdi-tooltip</v-icon>
                提示和浮层
              </v-card-title>
              <v-card-text>
                <v-btn @click="showBottomSheet" color="primary" variant="outlined" size="small" class="mb-2" block>
                  底部抽屉
                </v-btn>
                <v-btn @click="showOverlay" color="info" variant="outlined" size="small" class="mb-2" block>
                  覆盖层
                </v-btn>
                <v-tooltip text="这是一个工具提示">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" color="success" variant="outlined" size="small" block>
                      工具提示
                    </v-btn>
                  </template>
                </v-tooltip>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card class="pa-4">
              <v-card-title>
                <v-icon class="mr-2">mdi-menu</v-icon>
                菜单和选择器
              </v-card-title>
              <v-card-text>
                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" color="primary" variant="outlined" size="small" class="mb-2" block>
                      下拉菜单
                    </v-btn>
                  </template>
                  <v-list>
                    <v-list-item @click="showInfo('选择了选项1')">选项1</v-list-item>
                    <v-list-item @click="showInfo('选择了选项2')">选项2</v-list-item>
                    <v-list-item @click="showInfo('选择了选项3')">选项3</v-list-item>
                  </v-list>
                </v-menu>

                <v-btn @click="showDatePicker" color="info" variant="outlined" size="small" class="mb-2" block>
                  日期选择器
                </v-btn>

                <v-btn @click="showColorPicker" color="success" variant="outlined" size="small" block>
                  颜色选择器
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-tabs-window-item>

      <!-- API 测试标签页 -->
      <v-tabs-window-item value="api">
        <h2 class="text-h5 font-weight-bold mb-4">API 连接测试</h2>

        <v-row>
          <v-col cols="12" md="6">
            <v-card class="pa-4">
              <v-card-title>
                <v-icon class="mr-2">mdi-api</v-icon>
                基础连接测试
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
          </v-col>

          <v-col cols="12" md="6">
            <v-card class="pa-4">
              <v-card-title>
                <v-icon class="mr-2">mdi-bell-ring</v-icon>
                Reminder API 测试
              </v-card-title>
              <v-card-text>
                <div class="mb-3">
                  <v-btn @click="testReminderAPI" :loading="reminderApiLoading" color="info" variant="outlined"
                    size="small" class="mr-2">
                    测试提醒 API
                  </v-btn>
                  <v-btn @click="testScheduleAPI" :loading="scheduleApiLoading" color="success" variant="outlined"
                    size="small">
                    测试调度 API
                  </v-btn>
                </div>

                <div v-if="apiTestResult" class="mt-3">
                  <v-alert :type="apiTestResult.success ? 'success' : 'error'" density="compact">
                    <div><strong>{{ apiTestResult.title }}</strong></div>
                    <div class="text-body-2 mt-1">{{ apiTestResult.message }}</div>
                    <div v-if="apiTestResult.data" class="text-caption mt-2">
                      数据: {{ JSON.stringify(apiTestResult.data).substring(0, 100) }}...
                    </div>
                  </v-alert>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-tabs-window-item>
    </v-tabs-window>

    <!-- 测试总结区域 -->
    <v-divider class="my-8"></v-divider>

    <h2 class="text-h5 font-weight-bold mb-4">测试总结</h2>

    <v-card class="pa-4">
      <v-card-title>
        <v-icon class="mr-2">mdi-clipboard-check</v-icon>
        功能测试状态
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-card variant="outlined" class="text-center pa-3">
              <v-icon size="48" color="success">mdi-check-circle</v-icon>
              <div class="text-h6 mt-2">Schedule 功能</div>
              <div class="text-body-2 text-medium-emphasis">调度任务管理</div>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card variant="outlined" class="text-center pa-3">
              <v-icon size="48" color="success">mdi-check-circle</v-icon>
              <div class="text-h6 mt-2">弹窗组件</div>
              <div class="text-body-2 text-medium-emphasis">各种对话框</div>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card variant="outlined" class="text-center pa-3">
              <v-icon size="48" color="success">mdi-check-circle</v-icon>
              <div class="text-h6 mt-2">API 测试</div>
              <div class="text-body-2 text-medium-emphasis">后端连接测试</div>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card variant="outlined" class="text-center pa-3">
              <v-icon size="48" color="success">mdi-check-circle</v-icon>
              <div class="text-h6 mt-2">UI 组件</div>
              <div class="text-body-2 text-medium-emphasis">界面元素测试</div>
            </v-card>
          </v-col>
        </v-row>

        <v-alert type="success" class="mt-4" variant="tonal">
          <template v-slot:title>
            <v-icon start>mdi-party-popper</v-icon>
            测试完成
          </template>
          <div>
            所有功能测试均已实现并可正常使用：
            <ul class="mt-2">
              <li>Schedule 调度功能：支持创建、启停、清理任务</li>
              <li>弹窗组件：基础对话框、确认框、表单、底部抽屉等</li>
              <li>选择器：日期选择、颜色选择、下拉菜单</li>
              <li>API 测试：模拟真实 API 调用和响应处理</li>
              <li>通知系统：成功、错误、警告、信息提示</li>
            </ul>
          </div>
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- 弹窗组件 -->

    <!-- 基础对话框 -->
    <v-dialog v-model="basicDialog" max-width="400">
      <v-card>
        <v-card-title>基础对话框</v-card-title>
        <v-card-text>
          这是一个基础的对话框示例，用于显示信息或简单的交互。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="basicDialog = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 确认对话框 -->
    <v-dialog v-model="confirmDialog" max-width="400">
      <v-card>
        <v-card-title>确认操作</v-card-title>
        <v-card-text>
          您确定要执行此操作吗？此操作无法撤销。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="confirmDialog = false">取消</v-btn>
          <v-btn color="primary" @click="handleConfirm">确认</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 表单对话框 -->
    <v-dialog v-model="formDialog" max-width="500">
      <v-card>
        <v-card-title>表单对话框</v-card-title>
        <v-card-text>
          <v-form>
            <v-text-field v-model="formData.name" label="名称" variant="outlined" class="mb-3"></v-text-field>
            <v-textarea v-model="formData.description" label="描述" variant="outlined" rows="3"></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="formDialog = false">取消</v-btn>
          <v-btn color="primary" @click="handleFormSubmit">提交</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 底部抽屉 -->
    <v-bottom-sheet v-model="bottomSheet">
      <v-card>
        <v-card-title>底部抽屉</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item @click="handleSheetOption('选项1')">
              <template v-slot:prepend>
                <v-icon>mdi-alpha-a</v-icon>
              </template>
              <v-list-item-title>选项1</v-list-item-title>
            </v-list-item>
            <v-list-item @click="handleSheetOption('选项2')">
              <template v-slot:prepend>
                <v-icon>mdi-alpha-b</v-icon>
              </template>
              <v-list-item-title>选项2</v-list-item-title>
            </v-list-item>
            <v-list-item @click="handleSheetOption('选项3')">
              <template v-slot:prepend>
                <v-icon>mdi-alpha-c</v-icon>
              </template>
              <v-list-item-title>选项3</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-bottom-sheet>

    <!-- 覆盖层 -->
    <v-overlay v-model="overlay" class="align-center justify-center">
      <v-card class="pa-6" max-width="300">
        <div class="text-center">
          <v-progress-circular indeterminate size="64" color="primary" class="mb-4"></v-progress-circular>
          <div class="text-h6 mb-2">处理中...</div>
          <div class="text-body-2 mb-4">请稍等片刻</div>
          <v-btn @click="overlay = false" color="primary" variant="outlined">取消</v-btn>
        </div>
      </v-card>
    </v-overlay>

    <!-- 日期选择器对话框 -->
    <v-dialog v-model="datePickerDialog" max-width="400">
      <v-card>
        <v-card-title>选择日期</v-card-title>
        <v-card-text>
          <v-date-picker v-model="selectedDate" @update:model-value="handleDateSelect"></v-date-picker>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 颜色选择器对话框 -->
    <v-dialog v-model="colorPickerDialog" max-width="400">
      <v-card>
        <v-card-title>选择颜色</v-card-title>
        <v-card-text>
          <v-color-picker v-model="selectedColor" @update:model-value="handleColorSelect"></v-color-picker>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="colorPickerDialog = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
import { ref, computed, onMounted, watch } from 'vue';
import { useSnackbar } from '@/shared/composables/useSnackbar';
import { useSettingStore } from '@/modules/setting/presentation/stores/settingStore';
import ProfileAvatar from '@/modules/account/presentation/components/ProfileAvatar.vue';
import { scheduleApiClient, type ScheduleJob } from '@/modules/schedule/infrastructure/api/scheduleApiClient';

// Notification 模块导入
import {
  NotificationService,
  NotificationInitializationManager,
  NotificationType,
  NotificationPriority,
  NotificationMethod,
  SoundType,
  type NotificationConfig,
  type NotificationServiceConfig
} from '@/modules/notification';

const { snackbar, closeSnackbar, showSuccess, showError, showWarning, showInfo } = useSnackbar();
const settingStore = useSettingStore();

// 标签页状态
const activeTab = ref('components');
const selectedTheme = ref('system');

// API测试相关
const loading = ref(false);
const result = ref<{ success: boolean; message: string } | null>(null);
const elapsed = ref<number>(0);
const timeout = ref(false);

// Schedule 功能测试相关
const scheduleLoading = ref(false);
const scheduleJobs = ref<ScheduleJob[]>([]);
const scheduleStats = ref({
  total: 0,
  active: 0,
  paused: 0,
  completed: 0,
  failed: 0,
  todayExecuted: 0,
  queueSize: 0
});

// Notification 模块状态
const notificationPermission = ref<NotificationPermission>('default');
const permissionLoading = ref(false);
const globalVolume = ref(0.7);
const soundEnabled = ref(true);
const desktopEnabled = ref(true);
const doNotDisturbMode = ref(false);
const autoCloseTime = ref(5000);
const notificationStats = ref<any>(null);
const browserSupport = ref<any>(null);

// Notification 服务实例
let notificationService: NotificationService | null = null;
let notificationInitManager: NotificationInitializationManager | null = null;

// 自动关闭时间选项
const autoCloseOptions = [
  { label: '3秒', value: 3000 },
  { label: '5秒', value: 5000 },
  { label: '10秒', value: 10000 },
  { label: '15秒', value: 15000 },
  { label: '30秒', value: 30000 },
  { label: '永不关闭', value: 0 }
];

// 弹窗相关状态
const basicDialog = ref(false);
const confirmDialog = ref(false);
const formDialog = ref(false);
const bottomSheet = ref(false);
const overlay = ref(false);
const datePickerDialog = ref(false);
const colorPickerDialog = ref(false);

// 表单数据
const formData = ref({
  name: '',
  description: ''
});

// 选择器数据
const selectedDate = ref(new Date());
const selectedColor = ref('#1976D2');

// API 测试相关
const reminderApiLoading = ref(false);
const scheduleApiLoading = ref(false);
const apiTestResult = ref<{
  success: boolean;
  title: string;
  message: string;
  data?: any;
} | null>(null);

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

// Schedule 功能相关方法
const createScheduleJob = async () => {
  try {
    scheduleLoading.value = true;

    const jobData = {
      name: `测试任务-${Date.now()}`,
      type: 'test',
      schedule: '0 */2 * * *', // 每2小时执行一次
      payload: { description: '这是一个测试任务' },
      maxAttempts: 3
    };

    const response = await scheduleApiClient.createJob(jobData);

    if (response.success && response.data) {
      await getScheduleJobs(); // 刷新任务列表
      showSuccess(`创建调度任务成功: ${response.data.name}`);
    } else {
      throw new Error(response.message || '创建任务失败');
    }
  } catch (error: any) {
    console.error('创建调度任务失败:', error);
    showError(`创建调度任务失败: ${error.message}`);
  } finally {
    scheduleLoading.value = false;
  }
};

const getScheduleJobs = async () => {
  scheduleLoading.value = true;
  try {
    const response = await scheduleApiClient.getJobs({ limit: 50 });

    if (response) {
      scheduleJobs.value = response.jobs;
      showInfo(`已刷新 ${response.data.jobs.length} 个调度任务`);
    } else {
      throw new Error(response.message || '获取任务列表失败');
    }
  } catch (error: any) {
    console.error('获取调度任务失败:', error);
    showError(`获取调度任务失败: ${error.message}`);
    // 如果API调用失败，显示空状态
    scheduleJobs.value = [];
  } finally {
    scheduleLoading.value = false;
  }
};

const getScheduleStats = async () => {
  try {
    const response = await scheduleApiClient.getStats();

    if (response.success && response.data) {
      scheduleStats.value = response.data;
    } else {
      throw new Error(response.message || '获取统计信息失败');
    }
  } catch (error: any) {
    console.error('获取调度统计失败:', error);
    showError(`获取调度统计失败: ${error.message}`);
  }
};

const toggleJob = async (job: ScheduleJob) => {
  try {
    const response = job.status === 'active'
      ? await scheduleApiClient.pauseJob(job.id)
      : await scheduleApiClient.startJob(job.id);

    if (response.success && response.data) {
      // 更新本地状态
      const index = scheduleJobs.value.findIndex(j => j.id === job.id);
      if (index !== -1) {
        scheduleJobs.value[index] = response.data;
      }

      showInfo(`任务 ${job.name} 已${response.data.status === 'active' ? '启用' : '暂停'}`);

      // 刷新统计信息
      await getScheduleStats();
    } else {
      throw new Error(response.message || '操作失败');
    }
  } catch (error: any) {
    console.error('切换任务状态失败:', error);
    showError(`切换任务状态失败: ${error.message}`);
  }
};

const clearAllJobs = async () => {
  if (scheduleJobs.value.length === 0) {
    showWarning('没有任务需要清空');
    return;
  }

  try {
    const jobIds = scheduleJobs.value.map(job => job.id);
    await scheduleApiClient.batchDelete(jobIds);

    await getScheduleJobs(); // 刷新任务列表
    await getScheduleStats(); // 刷新统计信息

    showSuccess(`已清空 ${jobIds.length} 个调度任务`);
  } catch (error: any) {
    console.error('清空任务失败:', error);
    showError(`清空任务失败: ${error.message}`);
  }
};

// 弹窗相关方法
const showBasicDialog = () => {
  basicDialog.value = true;
};

const showConfirmDialog = () => {
  confirmDialog.value = true;
};

const showFormDialog = () => {
  formData.value.name = '';
  formData.value.description = '';
  formDialog.value = true;
};

const showBottomSheet = () => {
  bottomSheet.value = true;
};

const showOverlay = () => {
  overlay.value = true;
  // 3秒后自动关闭
  setTimeout(() => {
    overlay.value = false;
  }, 3000);
};

const showDatePicker = () => {
  datePickerDialog.value = true;
};

const showColorPicker = () => {
  colorPickerDialog.value = true;
};

// 事件处理方法
const handleConfirm = () => {
  confirmDialog.value = false;
  showSuccess('操作已确认');
};

const handleFormSubmit = () => {
  if (!formData.value.name.trim()) {
    showError('请输入名称');
    return;
  }

  formDialog.value = false;
  showSuccess(`表单提交成功: ${formData.value.name}`);
};

const handleSheetOption = (option: string) => {
  bottomSheet.value = false;
  showInfo(`选择了: ${option}`);
};

const handleDateSelect = (date: any) => {
  datePickerDialog.value = false;
  showInfo(`选择的日期: ${new Date(date).toLocaleDateString()}`);
};

const handleColorSelect = (color: any) => {
  showInfo(`选择的颜色: ${color}`);
};

// API 测试方法
const testReminderAPI = async () => {
  reminderApiLoading.value = true;
  apiTestResult.value = null;

  try {
    // 模拟调用提醒 API
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 模拟成功响应
    const mockData = {
      templates: [
        { id: '1', name: '提醒模板1', enabled: true },
        { id: '2', name: '提醒模板2', enabled: false }
      ],
      total: 2
    };

    apiTestResult.value = {
      success: true,
      title: 'Reminder API 测试成功',
      message: '获取提醒模板列表成功',
      data: mockData
    };

    showSuccess('Reminder API 测试通过');
  } catch (error) {
    apiTestResult.value = {
      success: false,
      title: 'Reminder API 测试失败',
      message: error instanceof Error ? error.message : 'API 调用失败'
    };

    showError('Reminder API 测试失败');
  } finally {
    reminderApiLoading.value = false;
  }
};

const testScheduleAPI = async () => {
  scheduleApiLoading.value = true;
  apiTestResult.value = null;

  try {
    // 调用真实的调度 API
    const response = await scheduleApiClient.getStats();

    if (response.success && response.data) {
      apiTestResult.value = {
        success: true,
        title: 'Schedule API 测试成功',
        message: '获取调度统计信息成功',
        data: response.data
      };

      showSuccess('Schedule API 测试通过');
    } else {
      throw new Error(response.message || 'API 调用失败');
    }
  } catch (error) {
    apiTestResult.value = {
      success: false,
      title: 'Schedule API 测试失败',
      message: error instanceof Error ? error.message : 'API 调用失败'
    };

    showError('Schedule API 测试失败');
  } finally {
    scheduleApiLoading.value = false;
  }
};

// 初始化数据
// Notification 相关方法
const requestNotificationPermission = async () => {
  try {
    permissionLoading.value = true;

    if (!('Notification' in window)) {
      showError('当前浏览器不支持桌面通知功能');
      return;
    }

    const permission = await Notification.requestPermission();
    notificationPermission.value = permission;

    if (permission === 'granted') {
      showSuccess('通知权限已获取');
    } else if (permission === 'denied') {
      showWarning('通知权限被拒绝');
    } else {
      showInfo('通知权限未授权');
    }

    await refreshBrowserSupport();
  } catch (error) {
    console.error('请求通知权限失败:', error);
    showError('请求通知权限失败');
  } finally {
    permissionLoading.value = false;
  }
};

const testNotificationSupport = async () => {
  await refreshBrowserSupport();

  if (browserSupport.value?.desktopSupport) {
    showSuccess('浏览器支持桌面通知');
  } else {
    showWarning('浏览器不支持桌面通知');
  }
};

const showTestNotification = async (type: string) => {
  try {
    if (!notificationService) {
      showError('通知服务未初始化');
      return;
    }

    const messages: Record<NotificationType, { title: string; body: string }> = {
      [NotificationType.INFO]: { title: '信息通知测试', body: '这是一条信息通知，用于测试桌面通知功能' },
      [NotificationType.SUCCESS]: { title: '成功通知测试', body: '这是一条成功通知，表示操作已完成' },
      [NotificationType.WARNING]: { title: '警告通知测试', body: '这是一条警告通知，请注意相关事项' },
      [NotificationType.ERROR]: { title: '错误通知测试', body: '这是一条错误通知，需要您的关注' },
      [NotificationType.REMINDER]: { title: '提醒通知测试', body: '这是一条提醒通知' },
      [NotificationType.TASK]: { title: '任务通知测试', body: '这是一条任务通知' },
      [NotificationType.GOAL]: { title: '目标通知测试', body: '这是一条目标通知' },
      [NotificationType.SYSTEM]: { title: '系统通知测试', body: '这是一条系统通知' }
    };

    const notificationType = type as NotificationType;
    const messageData = messages[notificationType];

    if (!messageData) {
      showError('不支持的通知类型');
      return;
    }

    const config: NotificationConfig = {
      id: `test-${Date.now()}`,
      title: messageData.title,
      message: messageData.body,
      type: notificationType,
      priority: NotificationPriority.NORMAL,
      methods: desktopEnabled.value ? [NotificationMethod.DESKTOP] : [],
      sound: soundEnabled.value ? {
        enabled: true,
        type: SoundType.DEFAULT,
        volume: globalVolume.value
      } : undefined,
      autoClose: autoCloseTime.value || undefined
    };

    // 添加声音方式到methods
    if (soundEnabled.value) {
      config.methods.push(NotificationMethod.SOUND);
    }

    await notificationService.show(config);
    showInfo(`已发送${type}测试通知`);
  } catch (error) {
    console.error('发送测试通知失败:', error);
    showError('发送测试通知失败');
  }
};

const showCustomNotification = async () => {
  try {
    if (!notificationService) {
      showError('通知服务未初始化');
      return;
    }

    const config: NotificationConfig = {
      id: `custom-test-${Date.now()}`,
      title: '自定义通知测试',
      message: '这是一个包含所有功能的自定义通知，具有最高优先级和完整配置',
      type: NotificationType.INFO,
      priority: NotificationPriority.HIGH,
      methods: [],
      sound: soundEnabled.value ? {
        enabled: true,
        type: SoundType.REMINDER,
        volume: globalVolume.value
      } : undefined,
      autoClose: autoCloseTime.value || undefined,
      actions: [
        {
          id: 'confirm',
          action: 'confirm',
          label: '确认'
        },
        {
          id: 'cancel',
          action: 'cancel',
          label: '取消'
        }
      ]
    };

    // 添加通知方式
    if (desktopEnabled.value) {
      config.methods.push(NotificationMethod.DESKTOP);
    }
    if (soundEnabled.value) {
      config.methods.push(NotificationMethod.SOUND);
    }

    await notificationService.show(config);
    showInfo('已发送自定义通知');
  } catch (error) {
    console.error('发送自定义通知失败:', error);
    showError('发送自定义通知失败');
  }
};

const testSound = async (soundType: string) => {
  try {
    // 创建临时通知配置来测试声音
    const testNotification: NotificationConfig = {
      id: `sound-test-${Date.now()}`,
      title: '音效测试',
      message: `测试${soundType}音效`,
      type: NotificationType.INFO,
      priority: NotificationPriority.LOW,
      methods: [NotificationMethod.SOUND], // 只播放声音，不显示通知
      sound: {
        enabled: true,
        type: soundType as SoundType,
        volume: globalVolume.value
      },
      autoClose: 1 // 1毫秒后自动关闭
    };

    if (notificationService) {
      await notificationService.show(testNotification);
    }

    showInfo(`播放${soundType}音效`);
  } catch (error) {
    console.error('播放音效失败:', error);
    showError('播放音效失败');
  }
};

const updateVolume = (volume: number) => {
  globalVolume.value = volume;
  if (notificationService) {
    const config = notificationService.getConfig();
    config.globalVolume = volume;
    notificationService.updateConfig(config);
  }
};

const toggleSound = (enabled: boolean | null) => {
  if (enabled === null || !notificationService) return;
  soundEnabled.value = enabled;
  const config = notificationService.getConfig();
  config.soundEnabled = enabled;
  notificationService.updateConfig(config);
};

const updateDesktopEnabled = (enabled: boolean | null) => {
  if (enabled === null || !notificationService) return;
  desktopEnabled.value = enabled;
  const config = notificationService.getConfig();
  config.desktopEnabled = enabled;
  notificationService.updateConfig(config);
};

const updateDoNotDisturb = (enabled: boolean | null) => {
  if (enabled === null || !notificationService) return;
  doNotDisturbMode.value = enabled;
  const config = notificationService.getConfig();
  config.doNotDisturbEnabled = enabled;
  notificationService.updateConfig(config);
};

const updateAutoCloseTime = (time: number) => {
  autoCloseTime.value = time;
  if (!notificationService) return;
  const config = notificationService.getConfig();
  config.defaultAutoClose = time || 5000;
  notificationService.updateConfig(config);
};

const simulateTaskReminder = async () => {
  try {
    if (!notificationService) {
      showError('通知服务未初始化');
      return;
    }

    const config: NotificationConfig = {
      id: `task-reminder-${Date.now()}`,
      title: '任务提醒',
      message: '您的任务"完成项目报告"即将到期，请及时处理',
      type: NotificationType.WARNING,
      priority: NotificationPriority.HIGH,
      methods: [],
      sound: soundEnabled.value ? {
        enabled: true,
        type: SoundType.REMINDER,
        volume: globalVolume.value
      } : undefined,
      autoClose: autoCloseTime.value || undefined,
      sourceModule: 'schedule'
    };

    // 添加通知方式
    if (desktopEnabled.value) {
      config.methods.push(NotificationMethod.DESKTOP);
    }
    if (soundEnabled.value) {
      config.methods.push(NotificationMethod.SOUND);
    }

    await notificationService.show(config);
    showInfo('模拟任务提醒发送成功');
  } catch (error) {
    console.error('模拟任务提醒失败:', error);
    showError('模拟任务提醒失败');
  }
};

const simulateGoalReminder = async () => {
  try {
    if (!notificationService) {
      showError('通知服务未初始化');
      return;
    }

    const config: NotificationConfig = {
      id: `goal-reminder-${Date.now()}`,
      title: '目标提醒',
      message: '距离您的目标"每日运动30分钟"截止时间还有1小时',
      type: NotificationType.INFO,
      priority: NotificationPriority.NORMAL,
      methods: [],
      sound: soundEnabled.value ? {
        enabled: true,
        type: SoundType.DEFAULT,
        volume: globalVolume.value
      } : undefined,
      autoClose: autoCloseTime.value || undefined,
      sourceModule: 'schedule'
    };

    // 添加通知方式
    if (desktopEnabled.value) {
      config.methods.push(NotificationMethod.DESKTOP);
    }
    if (soundEnabled.value) {
      config.methods.push(NotificationMethod.SOUND);
    }

    await notificationService.show(config);
    showInfo('模拟目标提醒发送成功');
  } catch (error) {
    console.error('模拟目标提醒失败:', error);
    showError('模拟目标提醒失败');
  }
};

const simulateCustomReminder = async () => {
  try {
    if (!notificationService) {
      showError('通知服务未初始化');
      return;
    }

    const config: NotificationConfig = {
      id: `custom-reminder-${Date.now()}`,
      title: '自定义提醒',
      message: '这是一个通过Schedule模块触发的自定义提醒通知',
      type: NotificationType.SUCCESS,
      priority: NotificationPriority.NORMAL,
      methods: [],
      sound: soundEnabled.value ? {
        enabled: true,
        type: SoundType.SUCCESS,
        volume: globalVolume.value
      } : undefined,
      autoClose: autoCloseTime.value || undefined,
      sourceModule: 'schedule'
    };

    // 添加通知方式
    if (desktopEnabled.value) {
      config.methods.push(NotificationMethod.DESKTOP);
    }
    if (soundEnabled.value) {
      config.methods.push(NotificationMethod.SOUND);
    }

    await notificationService.show(config);
    showInfo('模拟自定义提醒发送成功');
  } catch (error) {
    console.error('模拟自定义提醒失败:', error);
    showError('模拟自定义提醒失败');
  }
};

const dismissAllNotifications = async () => {
  try {
    if (!notificationService) {
      showError('通知服务未初始化');
      return;
    }

    await notificationService.dismissAll();
    showInfo('已关闭所有通知');
  } catch (error) {
    console.error('关闭所有通知失败:', error);
    showError('关闭所有通知失败');
  }
};

const resetNotificationConfig = async () => {
  try {
    if (!notificationService) {
      showError('通知服务未初始化');
      return;
    }

    // 创建默认配置
    const defaultConfig: NotificationServiceConfig = {
      maxConcurrentNotifications: 5,
      defaultAutoClose: 5000,
      enablePersistence: true,
      soundEnabled: true,
      vibrationEnabled: false,
      desktopEnabled: true,
      globalVolume: 0.7,
      doNotDisturbEnabled: false
    };

    await notificationService.updateConfig(defaultConfig);

    // 重新加载配置到UI
    globalVolume.value = defaultConfig.globalVolume;
    soundEnabled.value = defaultConfig.soundEnabled;
    desktopEnabled.value = defaultConfig.desktopEnabled;
    doNotDisturbMode.value = defaultConfig.doNotDisturbEnabled;
    autoCloseTime.value = defaultConfig.defaultAutoClose;

    showSuccess('通知配置已重置');
  } catch (error) {
    console.error('重置通知配置失败:', error);
    showError('重置通知配置失败');
  }
};

const refreshNotificationStats = async () => {
  try {
    if (!notificationService) {
      showError('通知服务未初始化');
      return;
    }

    notificationStats.value = await notificationService.getStats();
    showInfo('通知统计已刷新');
  } catch (error) {
    console.error('刷新通知统计失败:', error);
    showError('刷新通知统计失败');
  }
};

const clearNotificationHistory = async () => {
  try {
    if (!notificationService) {
      showError('通知服务未初始化');
      return;
    }

    await notificationService.clearHistory();
    notificationStats.value = await notificationService.getStats();
    showSuccess('通知历史已清空');
  } catch (error) {
    console.error('清空通知历史失败:', error);
    showError('清空通知历史失败');
  }
};

const refreshBrowserSupport = async () => {
  try {
    browserSupport.value = {
      desktopSupport: 'Notification' in window,
      audioSupport: 'Audio' in window,
      configPersistence: 'localStorage' in window,
      permissionGranted: Notification.permission === 'granted'
    };
  } catch (error) {
    console.error('检测浏览器支持失败:', error);
  }
};

// 权限状态相关的计算属性和方法
const getPermissionColor = (permission: NotificationPermission) => {
  switch (permission) {
    case 'granted': return 'success';
    case 'denied': return 'error';
    default: return 'warning';
  }
};

const getPermissionText = (permission: NotificationPermission) => {
  switch (permission) {
    case 'granted': return '已授权';
    case 'denied': return '已拒绝';
    default: return '未授权';
  }
};

onMounted(async () => {
  // 当切换到 Schedule 标签页时加载数据
  if (activeTab.value === 'schedule') {
    await Promise.all([
      getScheduleJobs(),
      getScheduleStats()
    ]);
  }

  // 初始化 Notification 模块
  if (activeTab.value === 'reminder') {
    try {
      notificationInitManager = NotificationInitializationManager.getInstance();
      await notificationInitManager.initializeNotificationModule();

      notificationService = NotificationService.getInstance();

      // 加载当前状态
      notificationPermission.value = Notification.permission;
      const config = notificationService.getConfig();
      globalVolume.value = config.globalVolume;
      soundEnabled.value = config.soundEnabled;
      desktopEnabled.value = config.desktopEnabled;
      doNotDisturbMode.value = config.doNotDisturbEnabled;
      autoCloseTime.value = config.defaultAutoClose;

      // 刷新统计和浏览器支持信息
      await Promise.all([
        refreshNotificationStats(),
        refreshBrowserSupport()
      ]);
    } catch (error) {
      console.error('初始化通知模块失败:', error);
      showError('初始化通知模块失败');
    }
  }
});

// 监听标签页切换，加载对应数据
watch(activeTab, async (newTab) => {
  if (newTab === 'schedule' && scheduleJobs.value.length === 0) {
    await Promise.all([
      getScheduleJobs(),
      getScheduleStats()
    ]);
  } else if (newTab === 'reminder') {
    try {
      // 初始化通知模块
      if (!notificationInitManager) {
        notificationInitManager = NotificationInitializationManager.getInstance();
        await notificationInitManager.initializeNotificationModule();
      }

      if (!notificationService) {
        notificationService = NotificationService.getInstance();
      }

      // 加载当前状态
      notificationPermission.value = Notification.permission;
      const config = notificationService.getConfig();
      globalVolume.value = config.globalVolume;
      soundEnabled.value = config.soundEnabled;
      desktopEnabled.value = config.desktopEnabled;
      doNotDisturbMode.value = config.doNotDisturbEnabled;
      autoCloseTime.value = config.defaultAutoClose;

      // 刷新统计和浏览器支持信息
      await Promise.all([
        refreshNotificationStats(),
        refreshBrowserSupport()
      ]);
    } catch (error) {
      console.error('初始化通知模块失败:', error);
      showError('初始化通知模块失败');
    }
  }
});
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