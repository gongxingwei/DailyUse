interface NotificationOptions {
  title: string
  body: string
  icon?: string
  urgency?: 'normal' | 'critical' | 'low'
  actions?: Array<{
    text: string
    type: 'confirm' | 'cancel' | 'action'
  }>
}

export class NotificationService {
  private static instance: NotificationService;
  private notificationCount = 0;

  private constructor() {
    // 监听通知动作
    window.electron.ipcRenderer.on('notification-action', (_event: any, id: string, action: any) => {
      console.log('Notification action:', id, action);
    });
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private generateId(): string {
    const id = `notification-${Date.now()}-${this.notificationCount++}`;
    console.log('生成通知 ID:', id);
    return id;
  }

  /**
   * 显示桌面通知
   * @param options 通知选项
   */
  public async show(options: NotificationOptions): Promise<string> {
    console.log('NotificationService.show 被调用，参数:', options);
    const id = this.generateId();
    try {
      console.log('调用 IPC show-notification，参数:', { id, ...options });
      const result = await window.electron.ipcRenderer.invoke('show-notification', {
        id,
        ...options
      });
      console.log('IPC show-notification 返回结果:', result);
      return result;
    } catch (error) {
      console.error('显示通知失败:', error);
      return id;
    }
  }

  /**
   * 显示简单通知
   * @param title 标题
   * @param message 消息内容
   */
  public async showSimple(title: string, message: string): Promise<string> {
    console.log('NotificationService.showSimple 被调用:', { title, message });
    const id = this.generateId();
    console.log('调用 IPC show-notification，参数:', { id, title, body: message, urgency: 'normal' });
    const result = await window.electron.ipcRenderer.invoke('show-notification', {
      id,
      title,
      body: message,
      urgency: 'normal'
    });
    console.log('IPC show-notification 返回结果:', result);
    return result;
  }

  /**
   * 显示警告通知
   * @param title 标题
   * @param message 消息内容
   */
  public async showWarning(title: string, message: string): Promise<string> {
    return await this.show({
      title,
      body: message,
      urgency: 'critical',
      actions: [
        { text: '我知道了', type: 'confirm' }
      ]
    });
  }
}

// 导出单例实例
export const notification = NotificationService.getInstance();
