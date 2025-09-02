import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import '@mdi/font/css/materialdesignicons.css';
import { VDateInput } from 'vuetify/labs/VDateInput';

const vuetify = createVuetify({
  components: {
    ...components,
    VDateInput,
  },
  directives,
  icons: {
    defaultSet: 'mdi', // 设置默认图标集为 mdi
  },

  theme: {
    defaultTheme: 'dark', // 设置默认主题
    themes: {
      light: {
        colors: {
          background: '#FFFFFF', // 背景色
          surface: '#dae2df', // 表色
          primary: '#1867C0', // 主要颜色
          secondary: '#5CBBF6', // 次要颜色
          accent: '#4CAF50', // 强调色
          error: '#FF5252', // 错误颜色
          info: '#2196F3', // 信息颜色
          success: '#4CAF50', // 成功颜色
          warning: '#FFC107', // 警告颜色
          // 滚动条相关颜色
          'scrollbar-thumb': 'rgba(0, 0, 0, 0.2)',
          'scrollbar-thumb-hover': 'rgba(0, 0, 0, 0.3)',
          'surface-variant': 'rgba(0, 0, 0, 0.1)',
          'on-surface-variant': 'rgba(0, 0, 0, 0.7)',
        },
      },
      dark: {
        colors: {
          background: '#121212', // 背景色
          primary: '#2196F3',
          secondary: '#424242',
          accent: '#FF4081',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FB8C00',
          // 滚动条相关颜色
          'scrollbar-track': '#ccbfd6',
          'scrollbar-thumb': 'rgba(255, 255, 255, 0.2)',
          'scrollbar-thumb-hover': 'rgba(255, 255, 255, 0.3)',
          'surface-variant': 'rgba(255, 255, 255, 0.1)',
          'on-surface-variant': 'rgba(255, 255, 255, 0.7)',
          font: '#d4d4d4',
          button: '#c4c4c4',
          // 颜色
          'deep-blue': '#0d47a1', // 深蓝色
          blue: '#2196F3', // 蓝色
          'light-blue': '#bbdefb', // 浅蓝色
          'deep-red': '#b71c1c', // 深红色
          red: '#f44336', // 红色
          'light-red': '#ef5350', // 浅红色
        },
      },
      darkBlue: {
        dark: true, // 显式声明深色模式
        colors: {
          // ===== 核心颜色 =====
          primary: '#8AB4F8', // 主色（Google Blue 200）
          'on-primary': '#0D1B2A', // 主色上的文本
          'primary-container': '#1E3A8A', // 主色容器（深蓝）

          secondary: '#B5C9FF', // 次要色（浅蓝灰）
          'on-secondary': '#1A237E', // 次要色上的文本
          'secondary-container': '#303F9F',

          tertiary: '#FFB4A8', // 强调色（珊瑚粉）
          'on-tertiary': '#5D1407', // 强调色上的文本
          'tertiary-container': '#8C2B1D',

          error: '#FFB4AB', // 错误色（浅红）
          'on-error': '#690005', // 错误文本
          'error-container': '#93000A',

          success: '#A5D6A7', // 成功色（浅绿）
          info: '#81D4FA', // 信息色（浅蓝）
          warning: '#FFE082', // 警告色（浅黄）

          // ===== 背景与表面 =====
          background: '#121212', // 全局背景
          surface: '#1E1E1E', // 卡片/组件背景
          'on-surface': '#E1E1E1', // 表面上的文本
          'surface-variant': '#2D2D2D', // 次级表面（如菜单）
          'on-surface-variant': '#C7C7C7',

          // ===== 其他功能色 =====
          outline: '#5C5C5C', // 边框/分割线
          'outline-variant': '#3A3A3A',
          'surface-dim': '#121212', // 低亮度表面
          'surface-bright': '#383838', // 高亮度表面

          // ===== 滚动条 =====
          'scrollbar-thumb': 'rgba(138, 180, 248, 0.3)', // 主色衍生
          'scrollbar-thumb-hover': 'rgba(138, 180, 248, 0.5)',
          'scrollbar-track': '#1E1E1E',

          // ===== 扩展颜色（可选） =====
          'deep-blue': '#0D47A1', // 深蓝
          'deep-purple': '#4A148C', // 深紫
          'text-disabled': '#5A5A5A', // 禁用文本
        },
      },
      warmPaper: {
        dark: false,
        colors: {
          // ===== 核心颜色 =====
          primary: '#8C6A3D',          // 主色（深卡其色）
          'on-primary': '#FFF9F0',     // 主色上的文本（米白）
          'primary-container': '#E8D8C0', // 主色容器（浅卡其）
          
          secondary: '#A38B5E',        // 次要色（黄铜色）
          'on-secondary': '#FFF9F0',   
          'secondary-container': '#F0E6D0',
          
          tertiary: '#9A7B4F',         // 强调色（深黄褐）
          'on-tertiary': '#FFF9F0',    
          'tertiary-container': '#EADBC5',
          
          error: '#B4716D',            // 错误色（灰粉）
          'on-error': '#FFF9F0',       
          'error-container': '#F0D8D6',
          
          success: '#7A8C69',          // 成功色（橄榄绿）
          info: '#7A8C9C',             // 信息色（灰蓝）
          warning: '#C9A86B',          // 警告色（金黄）

          // ===== 背景与表面 =====
          background: '#F5F0E6',       // 全局背景（米黄）
          surface: '#FDF5E8',          // 卡片背景（象牙白）
          'on-surface': '#4A3C2A',     // 主文本（深褐）
          'surface-variant': '#F0E6D6', // 次级表面
          'on-surface-variant': '#5D4E3A',
          
          // ===== 功能色 =====
          outline: '#D4C8B8',          // 边框（亚麻色）
          'outline-variant': '#E0D6C5',
          'surface-dim': '#EDE4D4',    // 低亮度表面
          'surface-bright': '#FDF8ED', // 高亮度表面

          // ===== 滚动条/交互 =====
          'scrollbar-thumb': 'rgba(140, 106, 61, 0.3)', // 主色衍生
          'scrollbar-thumb-hover': 'rgba(140, 106, 61, 0.5)',
          'scrollbar-track': '#F0E6D6',
          'hover-state': 'rgba(140, 106, 61, 0.08)', // 悬停状态
          
          // ===== 扩展 =====
          'text-disabled': '#B8A98E',   // 禁用文本
          'link': '#9A7B4F',            // 链接色（同强调色）
          'selection': 'rgba(232, 216, 192, 0.5)' // 文本选中背景
        }
      },
      lightBlue: {
        dark: false, // 显式声明浅色模式
        colors: {
          // ===== 核心颜色 =====
          primary: '#4A6FA5', // 主色（低饱和度蓝）
          'on-primary': '#FFFFFF', // 主色上的文本（纯白）
          'primary-container': '#E1E8F5', // 主色容器（浅灰蓝）

          secondary: '#6D8B74', // 次要色（柔和绿）
          'on-secondary': '#FFFFFF',
          'secondary-container': '#E6EFE7',

          tertiary: '#A37A74', // 强调色（灰粉）
          'on-tertiary': '#FFFFFF',
          'tertiary-container': '#F0E0DD',

          error: '#C86B6B', // 错误色（暗红）
          'on-error': '#FFFFFF',
          'error-container': '#F8E1E1',

          success: '#6D8B74', // 成功色（同次要色）
          info: '#6B9AC4', // 信息色（浅蓝）
          warning: '#D4A373', // 警告色（浅棕）

          // ===== 背景与表面 =====
          background: '#F8F9FA', // 全局背景（浅灰）
          surface: '#FFFFFF', // 卡片/组件背景（纯白）
          'on-surface': '#333333', // 表面上的文本（深灰）
          'surface-variant': '#F1F3F5', // 次级表面（如菜单）
          'on-surface-variant': '#555555',

          // ===== 其他功能色 =====
          outline: '#DDDDDD', // 边框/分割线（浅灰）
          'outline-variant': '#EEEEEE',
          'surface-dim': '#F0F0F0', // 低亮度表面
          'surface-bright': '#FFFFFF', // 高亮度表面

          // ===== 滚动条 =====
          'scrollbar-thumb': 'rgba(74, 111, 165, 0.3)', // 主色衍生
          'scrollbar-thumb-hover': 'rgba(74, 111, 165, 0.5)',
          'scrollbar-track': '#F1F3F5',

          // ===== 扩展颜色（可选） =====
          'text-disabled': '#AAAAAA', // 禁用文本
          'hover-state': 'rgba(74, 111, 165, 0.08)', // 悬停状态
        },
      },
      blueGreen: {
        colors: {
          // Material Theme Builder dark theme colors
          primary: 'rgb(152, 233, 248)',
          'on-primary': 'rgb(0, 42, 48)',
          'primary-container': 'rgb(73, 156, 170)',
          'on-primary-container': 'rgb(0, 0, 0)',
          secondary: 'rgb(199, 225, 230)',
          'on-secondary': 'rgb(16, 41, 45)',
          'secondary-container': 'rgb(124, 149, 154)',
          'on-secondary-container': 'rgb(0, 0, 0)',
          tertiary: 'rgb(210, 219, 255)',
          'on-tertiary': 'rgb(26, 37, 65)',
          'tertiary-container': 'rgb(133, 144, 178)',
          'on-tertiary-container': 'rgb(0, 0, 0)',
          error: 'rgb(255, 210, 204)',
          'on-error': 'rgb(84, 0, 3)',
          'error-container': 'rgb(255, 84, 73)',
          'on-error-container': 'rgb(0, 0, 0)',
          background: 'rgb(14, 20, 22)',
          'on-background': 'rgb(222, 227, 229)',
          surface: 'rgb(14, 20, 22)',
          'on-surface': 'rgb(255, 255, 255)',
          'surface-variant': 'rgb(63, 72, 74)',
          'on-surface-variant': 'rgb(212, 222, 224)',
          outline: 'rgb(170, 180, 182)',
          'outline-variant': 'rgb(136, 146, 148)',
          'surface-dim': 'rgb(14, 20, 22)',
          'surface-bright': 'rgb(63, 69, 71)',
          'surface-container-lowest': 'rgb(4, 8, 9)',
          'surface-container-low': 'rgb(25, 31, 32)',
          'surface-container': 'rgb(35, 41, 42)',
          'surface-container-high': 'rgb(46, 52, 53)',
          'surface-container-highest': 'rgb(57, 63, 64)',

          'scrollbar-thumb': 'rgba(255, 255, 255, 0.2)',
          'scrollbar-thumb-hover': 'rgba(255, 255, 255, 0.3)',
        },
      },
    },
  },
});

export default vuetify;
