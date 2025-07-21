import { ImportanceLevel } from "../../../shared/types/importance";
export type NotificationWindowOptions = {
  uuid: string;
  title: string;
  body: string;
  importance: ImportanceLevel;
  actions?: Array<{ text: string; type: 'confirm' | 'cancel' | 'action' }>;
}