import { defineStore } from 'pinia' 
import { scheduleService } from '@/shared/utils/schedule/main';
import { TimeConfig, UrgencyLevel } from '@/shared/types/time';

export interface Reminder {
    id: string;
    title: string;
    body: string;
    timeConfig: TimeConfig;
    urgency: UrgencyLevel;
    enabled: boolean;
}

export const useReminderStore = defineStore( 'reminder', {
    state: () => ({ reminders: [
        {
            id: '1',
            title: '健康提醒123123123',
            body: '活动一下，眺望远处',
            timeConfig: {mode: 'daily', dailyTime: '09:00'},
            urgency: 'normal',
            enabled: false
        }
    ] as Reminder[] }),

    getters: {
        getReminders: (state) => {
            return state.reminders;
        },
        getReminderById: (state) => (id: string): Reminder | null => {
            const foundReminder = state.reminders.find((reminder: Reminder) => {
                return reminder.id === id;
            });
            return foundReminder || null;
        }
    },
    
    actions: {
        async addReminder(reminder: Reminder) {
            this.reminders.push(reminder);
            if (reminder.enabled) {
                await this.scheduleReminder(reminder);
            }
        },

        async updateReminder(reminder: Reminder) {
            const index = this.reminders.findIndex(item => item.id === reminder.id);
            if (index !== -1) {
                this.reminders.splice(index, 1, reminder);
                // 如果启用状态改变，更新定时任务
                if (reminder.enabled) {
                    await this.scheduleReminder(reminder);
                } else {
                    await scheduleService.cancelSchedule(reminder.id);
                }
            }
        },

        async removeReminder(id: string) {
            this.reminders = this.reminders.filter(reminder => reminder.id !== id);
            await scheduleService.cancelSchedule(id);
        },

        async scheduleReminder(reminder: Reminder) {
            const cron = this.generateCronExpression(reminder.timeConfig);
            await scheduleService.createSchedule({
                id: reminder.id,
                cron,
                task: {
                    type: 'REMINDER',
                    payload: {
                        title: reminder.title,
                        body: reminder.body,
                        urgency: reminder.urgency
                    }
                }
            });
        },

        generateCronExpression(timeConfig: TimeConfig): string {
            switch (timeConfig.mode) {
                case 'once': {
                    if (!timeConfig.timestamp) throw new Error('Timestamp required for once mode');
                    const date = new Date(timeConfig.timestamp);
                    return `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;
                }
                
                case 'daily': {
                    if (!timeConfig.dailyTime) throw new Error('Daily time required for daily mode');
                    const [hours, minutes] = timeConfig.dailyTime.split(':');
                    return `${minutes} ${hours} * * *`;
                }
                
                case 'interval': {
                    if (!timeConfig.interval) throw new Error('Interval config required for interval mode');
                    const { value, unit } = timeConfig.interval;
                    if (unit === 'minutes') {
                        return `*/${value} * * * *`;
                    } else { // hours
                        return `0 */${value} * * *`;
                    }
                }
                
                default:
                    throw new Error('Invalid time mode');
            }
        },

        async initializeSchedules() {
            // 初始化时为所有启用的提醒创建定时任务
            for (const reminder of this.reminders) {
                if (reminder.enabled) {
                    await this.scheduleReminder(reminder);
                }
            }
        }
    },

    persist: true
} )