import { ipcRenderer } from 'electron';

export interface ScheduleTask {
    type: string;
    payload: any;
}

export interface ScheduleOptions {
    id: string;
    cron: string;
    task: ScheduleTask;
    lastRun?: string;
}

export class ScheduleService {
    constructor() {
        // 监听定时任务触发
        ipcRenderer.on('schedule-triggered', (_event, data) => {
            this.handleScheduleTriggered(data);
        });
    }

    private handleScheduleTriggered(data: { id: string; task: ScheduleTask }) {
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('schedule-triggered', { detail: data }));
    }

    async createSchedule(options: ScheduleOptions): Promise<boolean> {
        return await ipcRenderer.invoke('create-schedule', options);
    }

    async updateSchedule(options: ScheduleOptions): Promise<boolean> {
        return await ipcRenderer.invoke('update-schedule', options);
    }

    async cancelSchedule(id: string): Promise<boolean> {
        return await ipcRenderer.invoke('cancel-schedule', id);
    }

    async getSchedules(): Promise<string[]> {
        return await ipcRenderer.invoke('get-schedules');
    }

    // 将时间戳转换为 cron 表达式
    static timestampToCron(timestamp: number): string {
        const date = new Date(timestamp);
        return `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;
    }
}

export const scheduleService = new ScheduleService();