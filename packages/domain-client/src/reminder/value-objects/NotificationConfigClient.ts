/**
 * NotificationConfig 值对象实现 (Client)
 */

import type { ReminderContracts } from '@dailyuse/contracts';
import { ReminderContracts as RC } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type INotificationConfigClient = ReminderContracts.NotificationConfigClient;
type NotificationConfigClientDTO = ReminderContracts.NotificationConfigClientDTO;
type NotificationConfigServerDTO = ReminderContracts.NotificationConfigServerDTO;
type NotificationChannel = ReminderContracts.NotificationChannel;
type SoundConfig = ReminderContracts.SoundConfig;
type VibrationConfig = ReminderContracts.VibrationConfig;
type NotificationActionConfig = ReminderContracts.NotificationActionConfig;

const NotificationChannel = RC.NotificationChannel;

export class NotificationConfigClient extends ValueObject implements INotificationConfigClient {
  private _channels: NotificationChannel[];
  private _title?: string | null;
  private _body?: string | null;
  private _sound?: SoundConfig | null;
  private _vibration?: VibrationConfig | null;
  private _actions?: NotificationActionConfig[] | null;

  private constructor(params: {
    channels: NotificationChannel[];
    title?: string | null;
    body?: string | null;
    sound?: SoundConfig | null;
    vibration?: VibrationConfig | null;
    actions?: NotificationActionConfig[] | null;
  }) {
    super();
    this._channels = params.channels;
    this._title = params.title;
    this._body = params.body;
    this._sound = params.sound;
    this._vibration = params.vibration;
    this._actions = params.actions;
  }

  public get channels(): NotificationChannel[] {
    return [...this._channels];
  }

  public get title(): string | null | undefined {
    return this._title;
  }

  public get body(): string | null | undefined {
    return this._body;
  }

  public get sound(): SoundConfig | null | undefined {
    return this._sound;
  }

  public get vibration(): VibrationConfig | null | undefined {
    return this._vibration;
  }

  public get actions(): NotificationActionConfig[] | null | undefined {
    return this._actions;
  }

  public get channelsText(): string {
    const channelMap: Record<NotificationChannel, string> = {
      [NotificationChannel.IN_APP]: '应用内',
      [NotificationChannel.PUSH]: '推送',
      [NotificationChannel.EMAIL]: '邮件',
      [NotificationChannel.SMS]: '短信',
    };

    return this._channels.map((ch) => channelMap[ch]).join(' + ') || '无';
  }

  public get hasSoundEnabled(): boolean {
    return Boolean(this._sound?.enabled);
  }

  public get hasVibrationEnabled(): boolean {
    return Boolean(this._vibration?.enabled);
  }

  public equals(other: INotificationConfigClient): boolean {
    if (this._channels.length !== other.channels.length) return false;
    if (!this._channels.every((ch) => other.channels.includes(ch))) return false;
    if (this._title !== other.title) return false;
    if (this._body !== other.body) return false;
    return true;
  }

  public toServerDTO(): NotificationConfigServerDTO {
    return {
      channels: this._channels,
      title: this._title,
      body: this._body,
      sound: this._sound,
      vibration: this._vibration,
      actions: this._actions,
    };
  }

  public toClientDTO(): NotificationConfigClientDTO {
    return {
      channels: this._channels,
      title: this._title,
      body: this._body,
      sound: this._sound,
      vibration: this._vibration,
      actions: this._actions,
      channelsText: this.channelsText,
      hasSoundEnabled: this.hasSoundEnabled,
      hasVibrationEnabled: this.hasVibrationEnabled,
    };
  }

  public static fromClientDTO(dto: NotificationConfigClientDTO): NotificationConfigClient {
    return new NotificationConfigClient({
      channels: dto.channels,
      title: dto.title,
      body: dto.body,
      sound: dto.sound,
      vibration: dto.vibration,
      actions: dto.actions,
    });
  }

  public static fromServerDTO(dto: NotificationConfigServerDTO): NotificationConfigClient {
    return new NotificationConfigClient({
      channels: dto.channels,
      title: dto.title,
      body: dto.body,
      sound: dto.sound,
      vibration: dto.vibration,
      actions: dto.actions,
    });
  }
}
