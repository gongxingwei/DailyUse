import { ImportanceLevel } from "@/shared/types/importance";

export interface NotificationWindow {
  uuid: string;
  title: string;
  body: string;
  importance: ImportanceLevel;
  actions?: Array<{ text: string; type: "confirm" | "cancel" | "action" }>;
}
