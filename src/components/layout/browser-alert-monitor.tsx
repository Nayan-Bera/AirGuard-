'use client';

import { useEffect } from 'react';
import type { NotificationPreferences, UserNotification } from '@/types';
import { readStoredLocation } from '@/components/home-profile/home-profile-utils';
import {
  BROWSER_ALERTS_ENABLED_KEY,
  BROWSER_ALERTS_LAST_CHECK_KEY,
  showBrowserAlertNotifications,
} from '@/lib/browser-notifications';

const PREFS_STORAGE_KEY = 'uaqa_notification_preferences';
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

export function BrowserAlertMonitor() {
  useEffect(() => {
    let checking = false;

    const checkAlerts = async () => {
      if (checking || localStorage.getItem(BROWSER_ALERTS_ENABLED_KEY) !== 'true') return;
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const lastCheck = Number(localStorage.getItem(BROWSER_ALERTS_LAST_CHECK_KEY) ?? 0);
      if (Date.now() - lastCheck < CHECK_INTERVAL_MS) return;

      checking = true;
      localStorage.setItem(BROWSER_ALERTS_LAST_CHECK_KEY, String(Date.now()));
      try {
        const location = readStoredLocation();
        let preferences: NotificationPreferences | undefined;
        try {
          const raw = localStorage.getItem(PREFS_STORAGE_KEY);
          if (raw) preferences = JSON.parse(raw) as NotificationPreferences;
        } catch {
          preferences = undefined;
        }

        const response = await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: location?.coordinates.latitude,
            longitude: location?.coordinates.longitude,
            city: location?.city,
            preferences,
          }),
        });
        if (!response.ok) return;
        const result = await response.json() as { notifications?: UserNotification[] };
        showBrowserAlertNotifications(result.notifications ?? []);
      } catch {
        // Try again after the next interval if the network is unavailable.
        localStorage.removeItem(BROWSER_ALERTS_LAST_CHECK_KEY);
      } finally {
        checking = false;
      }
    };

    void checkAlerts();
    const interval = window.setInterval(() => void checkAlerts(), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return null;
}
