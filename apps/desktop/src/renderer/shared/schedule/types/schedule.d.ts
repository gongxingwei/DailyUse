export type ScheduleTask = {
  type: string;
  payload: any;
};

export type ScheduleOptions = {
  uuid: string;
  cron: string;
  task: ScheduleTask;
};

export type ScheduleEventData = {
  uuid: string;
  task: ScheduleTask;
};
