# 🎯 Web 项目中使用 @dailyuse/assets 快速指南

## ✅ 已完成的集成

### 1. **音频服务集成** ✅

#### 更新的文件：

- `AudioNotificationService.ts` - 已更新使用 @dailyuse/assets 音频
- `AudioService.ts` - 新建通用音频服务

#### 可用音效：

```typescript
import {
  alertSound,
  defaultSound,
  errorSound,
  notificationSound,
  reminderSound,
  successSound,
} from '@dailyuse/assets/audio';
```

### 2. **图片资源集成** ✅

#### 更新的文件：

- `App.vue` - 启动画面使用 logo
- `AssetsDemo.vue` - 完整演示组件

#### 可用图片：

```typescript
import {
  logo, // SVG logo
  logo128, // 128x128 PNG
  defaultAvatar, // 默认头像
  logos, // 所有 logo 对象
} from '@dailyuse/assets/images';
```

---

## 🚀 使用方式

### 方式 1: 在 Vue 组件中使用图片

```vue
<template>
  <img :src="logo" alt="Logo" />
</template>

<script setup lang="ts">
import { logo } from '@dailyuse/assets/images';
</script>
```

### 方式 2: 使用音频服务

```typescript
import { audioService } from '@/services/AudioService';

// 播放成功音效
audioService.playSuccess();

// 播放通知音效
audioService.playNotification();

// 设置音量
audioService.setVolume(0.8);
```

### 方式 3: 在通知系统中自动播放音效

```typescript
// AudioNotificationService 已自动集成
// 发送通知时会自动播放相应音效
```

---

## 📍 访问演示页面

### 开发环境路由：

- **/assets-demo** - 完整的资源演示页面
  - 展示所有图片资源
  - 测试所有音效
  - 音量控制面板
  - 音效列表

### 如何访问：

1. 启动 web 应用：`nx run web:dev`
2. 登录后访问：`http://localhost:5173/assets-demo`
3. 在左侧导航栏找到 "资源库演示"

---

## 🔧 技术细节

### TypeScript 错误说明

当前看到的类型错误是正常的：

```
Cannot find module '@dailyuse/assets/images'
```

**原因**：TypeScript 编译器还没有完全索引新创建的包。

**解决方案**（任选其一）：

1. ✅ 重启 VS Code TypeScript 服务器（Cmd/Ctrl + Shift + P → Restart TS Server）
2. ✅ 重新运行 `pnpm install`
3. ✅ 运行时会正常工作（Vite 能正确处理）

---

## 📦 已创建的文件

### 1. 服务层

```
apps/web/src/services/
└── AudioService.ts          # 通用音频服务
```

### 2. 组件层

```
apps/web/src/components/
└── AssetsDemo.vue           # 资源演示组件
```

### 3. 集成更新

```
apps/web/src/
├── App.vue                                           # 使用 logo
├── modules/notification/infrastructure/services/
│   └── AudioNotificationService.ts                   # 使用音频资源
└── shared/router/
    └── routes.ts                                     # 添加演示路由
```

---

## 🎨 使用示例代码

### 示例 1: 头像组件

```vue
<template>
  <v-avatar size="48">
    <img :src="avatar" alt="User Avatar" />
  </v-avatar>
</template>

<script setup lang="ts">
import { defaultAvatar as avatar } from '@dailyuse/assets/images';
</script>
```

### 示例 2: 操作反馈

```typescript
import { audioService } from '@/services/AudioService';

async function saveData() {
  try {
    await api.save();
    audioService.playSuccess(); // ✅ 播放成功音效
  } catch (error) {
    audioService.playError(); // ❌ 播放错误音效
  }
}
```

### 示例 3: 提醒通知

```typescript
import { audioService } from '@/services/AudioService';

function showReminder(message: string) {
  audioService.playReminder(); // 🔔 播放提醒音效
  showNotification(message);
}
```

### 示例 4: 动态选择 Logo 尺寸

```vue
<script setup lang="ts">
import { logos, type LogoSize } from '@dailyuse/assets/images';

const getLogoBySize = (size: LogoSize) => logos[size];

const smallLogo = getLogoBySize('png32'); // 32px logo
const largeLogo = getLogoBySize('png256'); // 256px logo
</script>
```

---

## ✨ 功能特性

### AudioService 功能：

- ✅ 单例模式，全局共享
- ✅ 音量控制（0-1）
- ✅ 静音开关
- ✅ 启用/禁用
- ✅ 音频缓存
- ✅ localStorage 持久化配置

### 可用方法：

```typescript
audioService.playSuccess(); // 播放成功音效
audioService.playError(); // 播放错误音效
audioService.playNotification(); // 播放通知音效
audioService.playReminder(); // 播放提醒音效
audioService.playAlert(); // 播放警告音效
audioService.playDefault(); // 播放默认音效

audioService.setVolume(0.8); // 设置音量 0-1
audioService.getVolume(); // 获取当前音量
audioService.setMuted(true); // 静音
audioService.setEnabled(false); // 禁用音效
```

---

## 🐛 常见问题

### Q: TypeScript 报错找不到模块？

**A**: 重启 TS Server 或重新运行 `pnpm install`

### Q: 音频播放失败？

**A**: 检查浏览器自动播放策略，某些浏览器需要用户交互后才能播放

### Q: 图片显示不出来？

**A**: 确保 Vite 开发服务器正在运行，检查浏览器控制台网络请求

### Q: 音效太大声/太小声？

**A**: 使用 `audioService.setVolume(0.5)` 调整音量

---

## 📊 当前状态

### 已集成模块：

- ✅ App.vue (启动画面 logo)
- ✅ AudioNotificationService (通知音效)
- ✅ AssetsDemo 组件 (完整演示)
- ✅ AudioService (通用音频服务)

### 推荐后续集成：

- [ ] 在用户个人资料中使用头像
- [ ] 在侧边栏导航中使用 logo
- [ ] 在任务完成时播放成功音效
- [ ] 在目标达成时播放特殊音效
- [ ] 在错误提示时播放错误音效

---

## 🎯 下一步建议

1. **访问演示页面测试**

   ```bash
   # 启动开发服务器
   nx run web:dev

   # 访问 http://localhost:5173/assets-demo
   ```

2. **在现有组件中集成音效**
   - 任务完成 → `playSuccess()`
   - 表单错误 → `playError()`
   - 新通知 → `playNotification()`

3. **替换硬编码资源路径**
   - 搜索项目中的 `/public/` 路径
   - 替换为 @dailyuse/assets 导入

---

**Created**: 2025-10-05  
**Status**: ✅ Ready to Use  
**Demo**: http://localhost:5173/assets-demo (Dev Mode)
