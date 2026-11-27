import type { UserNotification } from '@/types';

export const BROWSER_ALERTS_ENABLED_KEY = 'uaqa_browser_alerts_enabled';
export const BROWSER_ALERTS_LAST_CHECK_KEY = 'uaqa_browser_alerts_last_check';
const SENT_ALERTS_KEY = 'uaqa_browser_alerts_sent';

export function showBrowserAlertNotifications(alerts: UserNotification[]): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (localStorage.getItem(BROWSER_ALERTS_ENABLED_KEY) !== 'true' || Notification.permission !== 'granted') return;

  let sentIds: string[] = [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SENT_ALERTS_KEY) ?? '[]');
    if (Array.isArray(parsed)) sentIds = parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    sentIds = [];
  }

  const sent = new Set(sentIds);
  for (const alert of alerts) {
    if (sent.has(alert.id)) continue;
    const notification = new Notification(alert.title, {
      body: alert.message,
      icon: '/favicon.ico',
      tag: alert.id,
    });
    notification.onclick = () => {
      window.focus();
      window.location.assign('/dashboard');
      notification.close();
    };
    sent.add(alert.id);
  }

  try {
    localStorage.setItem(SENT_ALERTS_KEY, JSON.stringify([...sent].slice(-100)));
  } catch {
    // Notifications still display if storage is unavailable.
  }
}
