export type NotificationWindowOptions = {
  id: string;
  title: string;
  body: string;
  icon?: string;
  urgency?: 'normal' | 'critical' | 'low';
  actions?: Array<{ text: string; type: 'confirm' | 'cancel' | 'action' }>;
}