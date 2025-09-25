/**
 * ReminderInstanceSidebar 组件导出
 */
export { default as ReminderInstanceSidebar } from './ReminderInstanceSidebar.vue';

// 组件类型定义
export interface ReminderInstanceSidebarProps {
  /**
   * 是否显示侧边栏
   */
  visible?: boolean;

  /**
   * 自定义过滤参数
   */
  filters?: {
    days?: number;
    priorities?: string[];
    categories?: string[];
    tags?: string[];
  };

  /**
   * 自定义设置
   */
  settings?: {
    defaultDays?: number;
    maxItems?: number;
    refreshInterval?: number;
    showCompleted?: boolean;
  };
}

export interface ReminderInstanceSidebarEmits {
  /**
   * 实例被点击时触发
   */
  'instance-click': [instance: any];

  /**
   * 实例操作时触发
   */
  'instance-action': [action: 'snooze' | 'complete' | 'dismiss', instance: any];

  /**
   * 过滤器变化时触发
   */
  'filters-change': [filters: any];

  /**
   * 设置变化时触发
   */
  'settings-change': [settings: any];
}
