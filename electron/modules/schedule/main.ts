import { ipcMain } from "electron";
import nodeSchedule from "node-schedule";

// 存储所有的定时任务
const scheduleJobs = new Map<string, nodeSchedule.Job>();

export function setupScheduleHandlers() {
    // 创建定时任务
    ipcMain.handle('create-schedule', async (_event, options: {
        id: string
        cron: string
        task: {
            type: string
            payload: any
          }
        lastRun: string
    }) => {
        try {
            // 如果已存在相同ID的任务，先删除
            if (scheduleJobs.has(options.id)) {
                scheduleJobs.get(options.id)?.cancel();
            }

            // 创建新的定时任务
            const job = nodeSchedule.scheduleJob(options.cron, () => {
                // 任务执行时通知渲染进程
                _event.sender.send('schedule-triggered', {
                    id: options.id,
                    task: options.task
                });
            });

            scheduleJobs.set(options.id, job);
            return true;
        } catch (error) {
            console.error('Failed to create schedule:', error);
            return false;
        }
    });

    // 删除定时任务
    ipcMain.handle('cancel-schedule', (_event, id: string) => {
        const job = scheduleJobs.get(id);
        if (job) {
            job.cancel();
            scheduleJobs.delete(id);
            return true;
        }
        return false;
    });

    // 修改定时任务
    ipcMain.handle('update-schedule', async (_event, options: {
        id: string
        cron: string
        task: {
            type: string
            payload: any
          }
        lastRun: string
    }) => {
        try {
            // 如果已存在相同ID的任务，先删除
            if (scheduleJobs.has(options.id)) {
                scheduleJobs.get(options.id)?.cancel();
            }

            // 创建新的定时任务
            const job = nodeSchedule.scheduleJob(options.cron, () => {
                // 任务执行时通知渲染进程
                _event.sender.send('schedule-triggered', {
                    id: options.id,
                    task: options.task
                });
            });

            scheduleJobs.set(options.id, job);
            return true;
        } catch (error) {
            console.error('Failed to create schedule:', error);
            return false;
        }
    });

    // 获取所有定时任务
    ipcMain.handle('get-schedules', () => {
        return Array.from(scheduleJobs.keys());
    });
}