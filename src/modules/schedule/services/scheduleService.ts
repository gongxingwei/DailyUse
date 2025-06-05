import { ScheduleApi } from '../api/scheduleApi';
import { ScheduleOptions, ScheduleEventData } from '../types/schedule';

/**
 * 定时任务服务类 - 业务逻辑 + 事件管理
 */
export class ScheduleService {
    private listeners: Set<(data: ScheduleEventData) => void> = new Set();
    
    constructor() {
        this.initializeEventListeners();
    }

    /**
     * 初始化事件监听器
     */
    private initializeEventListeners(): void {
        window.shared.ipcRenderer.on('schedule-triggered', (_event: Event, data: ScheduleEventData) => {
            this.handleScheduleTriggered(data);
        });
    }

    /**
     * 处理定时任务触发事件
     */
    private handleScheduleTriggered(data: ScheduleEventData): void {
        // 触发自定义事件（支持原生事件监听）
        window.dispatchEvent(new CustomEvent('schedule-triggered', { detail: data }));
        
        // 通知观察者
        this.notifyListeners(data);
    }

    /**
     * 通知所有监听器
     */
    private notifyListeners(data: ScheduleEventData): void {
        this.listeners.forEach(listener => {
            try {
                listener(data);
            } catch (error) {
                console.error('Schedule listener error:', error);
            }
        });
    }

    // === 业务方法（委托给 API 层） ===

    /**
     * 创建定时任务
     */
    async createSchedule(options: ScheduleOptions): Promise<boolean> {
        return await ScheduleApi.createSchedule(options);
    }

    /**
     * 更新定时任务
     */
    async updateSchedule(options: ScheduleOptions): Promise<boolean> {
        return await ScheduleApi.updateSchedule(options);
    }

    /**
     * 取消定时任务
     */
    async cancelSchedule(id: string): Promise<boolean> {
        return await ScheduleApi.cancelSchedule(id);
    }

    /**
     * 获取所有定时任务
     */
    async getSchedules(): Promise<string[]> {
        return await ScheduleApi.getSchedules();
    }

    // === 事件管理方法 ===

    /**
     * 添加任务触发监听器
     */
    onScheduleTriggered(callback: (data: ScheduleEventData) => void): () => void {
        this.listeners.add(callback);
        
        // 返回清理函数
        return () => {
            this.listeners.delete(callback);
        };
    }

    /**
     * 移除所有监听器
     */
    removeAllListeners(): void {
        this.listeners.clear();
    }

    /**
     * 获取监听器数量
     */
    getListenerCount(): number {
        return this.listeners.size;
    }
}

// 导出单例
export const scheduleService = new ScheduleService();