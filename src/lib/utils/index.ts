import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Weather code to description mapping (WMO codes)
export function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snowfall',
    73: 'Moderate snowfall',
    75: 'Heavy snowfall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return descriptions[code] || 'Unknown';
}

// Weather code to icon mapping
export function getWeatherIcon(code: number, isDay: boolean): string {
  if (code === 0) return isDay ? '☀️' : '🌙';
  if (code <= 3) return isDay ? '⛅' : '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 57) return '🌧️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  if (code <= 86) return '🌨️';
  return '⛈️';
}

// AQI color mapping for India CPCB standard
export function getAQIColor(aqi: number): { bg: string; text: string; border: string; label: string } {
  if (aqi <= 50) return { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/30', label: 'Good' };
  if (aqi <= 100) return { bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/30', label: 'Satisfactory' };
  if (aqi <= 200) return { bg: 'bg-yellow-500/10', text: 'text-yellow-600', border: 'border-yellow-500/30', label: 'Moderate' };
  if (aqi <= 300) return { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-500/30', label: 'Poor' };
  if (aqi <= 400) return { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/30', label: 'Very Poor' };
  return { bg: 'bg-red-900/10', text: 'text-red-800', border: 'border-red-900/30', label: 'Severe' };
}

export function getAQIGradient(aqi: number): string {
  if (aqi <= 50) return 'from-emerald-400 to-green-500';
  if (aqi <= 100) return 'from-green-400 to-lime-500';
  if (aqi <= 200) return 'from-yellow-400 to-amber-500';
  if (aqi <= 300) return 'from-orange-400 to-orange-600';
  if (aqi <= 400) return 'from-red-400 to-red-600';
  return 'from-red-700 to-red-900';
}

// Convert PM2.5 concentration (µg/m³) to India CPCB AQI sub-index
export function pm25ToAQI_CPCB(pm25: number): number {
  const breakpoints = [
    { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
    { cLow: 31, cHigh: 60, iLow: 51, iHigh: 100 },
    { cLow: 61, cHigh: 90, iLow: 101, iHigh: 200 },
    { cLow: 91, cHigh: 120, iLow: 201, iHigh: 300 },
    { cLow: 121, cHigh: 250, iLow: 301, iHigh: 400 },
    { cLow: 251, cHigh: 500, iLow: 401, iHigh: 500 },
  ];
  for (const bp of breakpoints) {
    if (pm25 >= bp.cLow && pm25 <= bp.cHigh) {
      return Math.round(((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.iLow);
    }
  }
  return pm25 > 500 ? 500 : 0;
}

// Convert PM10 concentration (µg/m³) to India CPCB AQI sub-index
export function pm10ToAQI_CPCB(pm10: number): number {
  const breakpoints = [
    { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
    { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 101, cHigh: 250, iLow: 101, iHigh: 200 },
    { cLow: 251, cHigh: 350, iLow: 201, iHigh: 300 },
    { cLow: 351, cHigh: 430, iLow: 301, iHigh: 400 },
    { cLow: 431, cHigh: 510, iLow: 401, iHigh: 500 },
  ];
  for (const bp of breakpoints) {
    if (pm10 >= bp.cLow && pm10 <= bp.cHigh) {
      return Math.round(((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm10 - bp.cLow) + bp.iLow);
    }
  }
  return pm10 > 510 ? 500 : 0;
}

// Calculate overall CPCB AQI from pollutant sub-indices
export function calculateCPCB_AQI(pollutants: { pm25?: number; pm10?: number; no2?: number; so2?: number; co?: number; o3?: number }): { aqi: number; dominantPollutant: string } {
  const subIndices: Array<{ name: string; value: number }> = [];
  
  if (pollutants.pm25 != null) subIndices.push({ name: 'PM2.5', value: pm25ToAQI_CPCB(pollutants.pm25) });
  if (pollutants.pm10 != null) subIndices.push({ name: 'PM10', value: pm10ToAQI_CPCB(pollutants.pm10) });
  
  if (subIndices.length === 0) return { aqi: 0, dominantPollutant: 'N/A' };
  
  const max = subIndices.reduce((prev, curr) => curr.value > prev.value ? curr : prev);
  return { aqi: max.value, dominantPollutant: max.name };
}

export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function getDataFreshness(timestamp: string): 'live' | 'recent' | 'stale' | 'unavailable' {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMins = diffMs / 60000;
  if (diffMins < 30) return 'live';
  if (diffMins < 120) return 'recent';
  if (diffMins < 720) return 'stale';
  return 'unavailable';
}

export function getWindDirectionLabel(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}
