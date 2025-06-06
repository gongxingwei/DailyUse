export type ScheduleTask = {
    type: string;
    payload: any;
}

export type ScheduleOptions = {
    id: string;
    cron: string;
    task: ScheduleTask;
}

export type ScheduleEventData = {
    id: string;
    task: ScheduleTask;
}