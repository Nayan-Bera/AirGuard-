// Notification & Early Warning Evaluation Service
// Evaluates real environmental data, forecasts, and festival warnings against user preferences.

import type {
  AirQualityData,
  AirQualityForecast,
  NotificationPreferences,
  UserNotification,
} from '@/types';
import { getFestivalWarnings, getSeasonalRisk } from '@/services/festivals';

export function evaluateNotifications(params: {
  userId: string;
  city: string;
  airQuality?: AirQualityData;
  forecast?: AirQualityForecast[];
  preferences: NotificationPreferences;
  existingNotificationKeys?: Set<string>;
}): UserNotification[] {
  const {
    userId,
    city,
    airQuality,
    forecast = [],
    preferences,
    existingNotificationKeys = new Set<string>(),
  } = params;

  const notifications: UserNotification[] = [];
  const nowIso = new Date().toISOString();
  const todayKey = nowIso.split('T')[0];

  // 1. Current AQI threshold alert
  if (preferences.enableAQIAlerts && airQuality && airQuality.aqi >= preferences.aqiThreshold) {
    const dedupKey = `aqi_${city}_${todayKey}`;
    if (!existingNotificationKeys.has(dedupKey)) {
      notifications.push({
        id: dedupKey,
        userId,
        type: 'aqi_alert',
        title: `High AQI Alert in ${city}: ${airQuality.aqi} (${airQuality.category})`,
        message: `Current CPCB AQI in ${city} has reached ${airQuality.aqi}, exceeding your threshold of ${preferences.aqiThreshold}. Limit prolonged outdoor exertion and keep indoor spaces sealed.`,
        severity: airQuality.aqi >= 301 ? 'critical' : 'warning',
        isRead: false,
        data: { aqi: airQuality.aqi, category: airQuality.category, city },
        createdAt: nowIso,
      });
    }
  }

  // 2. PM2.5 threshold alert
  if (
    preferences.enablePM25Alerts &&
    airQuality?.pollutants.pm25 != null &&
    airQuality.pollutants.pm25 >= preferences.pm25Threshold
  ) {
    const dedupKey = `pm25_${city}_${todayKey}`;
    if (!existingNotificationKeys.has(dedupKey)) {
      notifications.push({
        id: dedupKey,
        userId,
        type: 'pm25_alert',
        title: `Elevated PM2.5 in ${city}: ${airQuality.pollutants.pm25} µg/m³`,
        message: `Fine particulate matter (PM2.5) is ${airQuality.pollutants.pm25} µg/m³, above your alert threshold of ${preferences.pm25Threshold} µg/m³. Consider running an air purifier or wearing an N95 mask outdoors.`,
        severity: airQuality.pollutants.pm25 >= 120 ? 'critical' : 'warning',
        isRead: false,
        data: { pm25: airQuality.pollutants.pm25, city },
        createdAt: nowIso,
      });
    }
  }

  // 3. Forecast spike alert
  if (preferences.enableForecastAlerts && forecast.length > 0) {
    const spikeDay = forecast.find(
      (day) => day.date > todayKey && day.aqi >= Math.max(preferences.aqiThreshold, 201)
    );
    if (spikeDay) {
      const dedupKey = `forecast_${city}_${spikeDay.date}`;
      if (!existingNotificationKeys.has(dedupKey)) {
        notifications.push({
          id: dedupKey,
          userId,
          type: 'forecast_alert',
          title: `Pollution Spike Forecast on ${spikeDay.date}`,
          message: `Modelled forecast indicates AQI may reach ~${spikeDay.aqi} (${spikeDay.category}) in ${city} on ${spikeDay.date}. Plan outdoor errands and indoor air filtration in advance.`,
          severity: spikeDay.aqi >= 301 ? 'critical' : 'warning',
          isRead: false,
          data: { forecastDate: spikeDay.date, aqi: spikeDay.aqi, city },
          createdAt: nowIso,
        });
      }
    }
  }

  // 4. Upcoming festival warning
  if (preferences.enableFestivalAlerts) {
    const warnings = getFestivalWarnings(preferences.festivalAlertDaysBefore);
    for (const w of warnings) {
      const dedupKey = `festival_${w.festival.name}_${w.festival.date}`;
      if (!existingNotificationKeys.has(dedupKey)) {
        notifications.push({
          id: dedupKey,
          userId,
          type: 'festival_warning',
          title: `${w.festival.name} in ${w.daysUntil} day${w.daysUntil === 1 ? '' : 's'} — Prepare Early`,
          message: `${w.festival.name} (${w.festival.date}) carries a ${w.festival.pollutionImpact.replace('_', ' ')} pollution risk. ${w.preparations[0] ?? 'Check air purifier filters and respirators.'}`,
          severity: w.festival.pollutionImpact === 'very_high' || w.festival.pollutionImpact === 'high' ? 'warning' : 'info',
          isRead: false,
          data: { festival: w.festival.name, date: w.festival.date, daysUntil: w.daysUntil },
          createdAt: nowIso,
        });
      }
    }
  }

  // 5. Seasonal advisory
  if (preferences.enableSeasonalAlerts) {
    const seasonal = getSeasonalRisk(new Date().getMonth() + 1);
    if (seasonal.riskLevel === 'High' || seasonal.riskLevel === 'Moderate to High') {
      const monthKey = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
      const dedupKey = `seasonal_${seasonal.season}_${monthKey}`;
      if (!existingNotificationKeys.has(dedupKey)) {
        notifications.push({
          id: dedupKey,
          userId,
          type: 'seasonal_warning',
          title: `${seasonal.season} Air Quality Advisory (${seasonal.riskLevel} Risk)`,
          message: seasonal.description,
          severity: 'info',
          isRead: false,
          data: { season: seasonal.season, riskLevel: seasonal.riskLevel },
          createdAt: nowIso,
        });
      }
    }
  }

  return notifications;
}

