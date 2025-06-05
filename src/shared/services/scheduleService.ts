
export interface ScheduleTask {
    type: string;
    payload: any;
}

export interface ScheduleOptions {
    id: string;
    cron: string;
    task: ScheduleTask;
}

export class ScheduleService {
    // 定时任务ID和任务对象的映射
    private listeners: Set<(data: { id: string, task: ScheduleTask }) => void> = new Set();
    
    constructor() {
        // 监听定时任务触发事件
        window.shared.ipcRenderer.on('schedule-triggered', (_event: Event, data: { id: string, task: ScheduleTask }) => {
            this.handleScheduleTriggered(data);
        });
    }

    /**
     * 触发函数，用来处理定时任务触发事件
     * @param data 
     */
    private handleScheduleTriggered(data: { id: string, task: ScheduleTask }) {
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('schedule-triggered', { detail: data }));
        // 触发所有监听器
        this.notifyListeners(data);
    }
    private notifyListeners(data: { id: string, task: ScheduleTask }) {
        this.listeners.forEach(listener => {
            try {
                listener(data);
            } catch (error) {
                console.error('Schedule listener error:', error);
            }
        });
    }

    async createSchedule(options: ScheduleOptions): Promise<boolean> {
        return await window.shared.ipcRenderer.invoke('create-schedule', options);
    }

    async updateSchedule(options: ScheduleOptions): Promise<boolean> {
        return await window.shared.ipcRenderer.invoke('update-schedule', options);
    }

    async cancelSchedule(id: string): Promise<boolean> {
        return await window.shared.ipcRenderer.invoke('cancel-schedule', id);
    }

    async getSchedules(): Promise<string[]> {
        return await window.shared.ipcRenderer.invoke('get-schedules');
    }

    public onScheduleTriggered(callback: (data: { id: string, task: ScheduleTask }) => void) {
        this.listeners.add(callback);
        
        // 返回清理函数
        return () => {
            this.listeners.delete(callback);
        };
    }
    removeAllListeners() {
        this.listeners.clear();
    }

    // 工具方法
    static timestampToCron(timestamp: number): string {
        const date = new Date(timestamp);
        return `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;
    }

    static cronToReadable(cron: string): string {
        // 简单的 cron 表达式解析
        const parts = cron.split(' ');
        if (parts.length >= 5) {
            return `每天 ${parts[1]}:${parts[0].padStart(2, '0')}`;
        }
        return cron;
    }
}

export const scheduleService = new ScheduleService();