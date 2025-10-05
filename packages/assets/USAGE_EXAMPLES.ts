/**
 * 🎨 @dailyuse/assets 使用示例
 *
 * 这个文件展示了如何在项目中使用共享资源库
 */

// ============================================
// 方式 1: 导入单个资源
// ============================================
import { logo, logo128, defaultAvatar } from '@dailyuse/assets/images';

console.log('Logo SVG:', logo);
console.log('Logo 128:', logo128);
console.log('Default Avatar:', defaultAvatar);

// ============================================
// 方式 2: 导入资源组
// ============================================
import { logos } from '@dailyuse/assets/images';

console.log('All logos:', logos);
console.log('32px Logo:', logos.png32);

// ============================================
// 方式 3: 在 Vue 组件中使用
// ============================================
/**
 * <template>
 *   <div class="logo-showcase">
 *     <img :src="logo" alt="DailyUse Logo" />
 *     <img :src="logo128" alt="DailyUse Logo 128" />
 *     <img :src="avatar" alt="User Avatar" />
 *   </div>
 * </template>
 *
 * <script setup lang="ts">
 * import { logo, logo128, defaultAvatar as avatar } from '@dailyuse/assets/images';
 * </script>
 */

// ============================================
// 方式 4: 动态选择资源
// ============================================
import type { LogoSize } from '@dailyuse/assets/images';

function getLogoBySize(size: LogoSize) {
  return logos[size];
}

const smallLogo = getLogoBySize('png32');
console.log('Small logo:', smallLogo);

// ============================================
// 方式 5: 在 Electron 中使用
// ============================================
/**
 * // main process
 * import { logoIco } from '@dailyuse/assets/images';
 *
 * const win = new BrowserWindow({
 *   icon: logoIco, // Windows 图标
 * });
 */

// ============================================
// 方式 6: 音频使用（待添加音频文件后）
// ============================================
/**
 * import { notificationSound } from '@dailyuse/assets/audio';
 *
 * function playNotification() {
 *   const audio = new Audio(notificationSound);
 *   audio.play();
 * }
 */

export {};
