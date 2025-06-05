export interface ScheduleTask {
    type: string;
    payload: any;
}

export interface ScheduleOptions {
    id: string;
    cron: string;
    task: ScheduleTask;
}

export interface ScheduleEventData {
    id: string;
    task: ScheduleTask;
}