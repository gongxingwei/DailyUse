import type { ClockPort } from '@dailyuse/domain';

export class SystemClock implements ClockPort {
  nowIso(): string {
    return new Date().toISOString();
  }
}
