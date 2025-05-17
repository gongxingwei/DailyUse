import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
  components: {
    ...components,
  },
  directives,
  icons: {
    defaultSet: 'mdi', // 设置默认图标集为 mdi
  },

  theme: {
    defaultTheme: 'light', // 设置默认主题
    themes: {
      light: {
        colors: {
          background: '#FFFFFF', // 背景色
          surface: '#dae2df', // 表色
          'on-surface': '#000000', // 文字颜色
          primary: '#1867C0',      // 主要颜色
          secondary: '#5CBBF6',    // 次要颜色
          accent: '#4CAF50',       // 强调色
          error: '#FF5252',        // 错误颜色
          info: '#2196F3',         // 信息颜色
          success: '#4CAF50',      // 成功颜色
          warning: '#FFC107',      // 警告颜色
          // 滚动条相关颜色
          'scrollbar-thumb': 'rgba(0, 0, 0, 0.2)',
          'scrollbar-thumb-hover': 'rgba(0, 0, 0, 0.3)',
          'surface-variant': 'rgba(0, 0, 0, 0.1)',
          'on-surface-variant': 'rgba(0, 0, 0, 0.7)'
        }
      },
      dark: {
        colors: {
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
          'blue': '#2196F3', // 蓝色
          'light-blue': '#bbdefb', // 浅蓝色
          'deep-red': '#b71c1c', // 深红色
          'red': '#f44336', // 红色
          'light-red': '#ef5350', // 浅红色
        }
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
        }
      }
    }
  }

})

export default vuetify