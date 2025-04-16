
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
        window.shared.ipcRenderer.on('schedule-triggered', (_event: Event, data: { id: string, task: ScheduleTask }) => {
            this.notifyListeners(data);
        });
    }
    private notifyListeners(data: { id: string, task: ScheduleTask }) {
        this.listeners.forEach(listener => listener(data));
    }

    // 创建定时任务
    public async createSchedule(options: ScheduleOptions): Promise<boolean> {
        return await window.shared.ipcRenderer.invoke('create-schedule', options);
    }

    // 取消定时任务
    public async cancelSchedule(id: string): Promise<boolean> {
        return await window.shared.ipcRenderer.invoke('cancel-schedule', id);
    }

    // 获取所有定时任务
    public async getSchedules(): Promise<string[]> {
        return await window.shared.ipcRenderer.invoke('get-schedules');
    }

    public onScheduleTriggered(callback: (data: { id: string, task: ScheduleTask }) => void) {
        this.listeners.add(callback);
        
        // 返回清理函数
        return () => {
            this.listeners.delete(callback);
        };
    }
    // // 监听定时任务触发
    // public onScheduleTriggered(callback: (data: { id: string, task: ScheduleTask }) => void) {
    //     window.shared.ipcRenderer.on('schedule-triggered', (_event: Event, data: { id: string, task: ScheduleTask }) => callback(data));
    // }
}

export const scheduleService = new ScheduleService();