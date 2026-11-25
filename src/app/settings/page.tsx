'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Bell,
  Check,
  Globe,
  Home,
  Info,
  Loader2,
  MapPin,
  Navigation,
  Settings,
  Shield,
  Trash2,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { clearStoredHomeData, readStoredLocation, readStoredProfile, writeStoredLocation } from '@/components/home-profile/home-profile-utils';
import type { AQIStandard, LocationInfo, NotificationPreferences, UserNotification } from '@/types';

const PREFS_STORAGE_KEY = 'uaqa_notification_preferences';
const PROFILE_META_STORAGE_KEY = 'uaqa_user_settings';

interface UserSettingsMeta {
  displayName: string;
  email: string;
  aqiStandard: AQIStandard;
}

const DEFAULT_PREFS: NotificationPreferences = {
  userId: 'local-user',
  enableAQIAlerts: true,
  aqiThreshold: 200,
  enablePM25Alerts: true,
  pm25Threshold: 60,
  enableFestivalAlerts: true,
  festivalAlertDaysBefore: 14,
  enableSeasonalAlerts: true,
  enableForecastAlerts: true,
};

export default function SettingsPage() {
  const [userMeta, setUserMeta] = React.useState<UserSettingsMeta>({
    displayName: '',
    email: '',
    aqiStandard: 'india_cpcb',
  });
  const [prefs, setPrefs] = React.useState<NotificationPreferences>(DEFAULT_PREFS);
  const [savedBanner, setSavedBanner] = React.useState(false);
  const [locationCity, setLocationCity] = React.useState<string>('Not set');
  const [activeAlerts, setActiveAlerts] = React.useState<UserNotification[]>([]);
  const [checkingAlerts, setCheckingAlerts] = React.useState(false);
  const [isLocating, setIsLocating] = React.useState(false);
  const [locationError, setLocationError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const rawMeta = localStorage.getItem(PROFILE_META_STORAGE_KEY);
      if (rawMeta) setUserMeta(JSON.parse(rawMeta));

      const rawPrefs = localStorage.getItem(PREFS_STORAGE_KEY);
      if (rawPrefs) setPrefs(JSON.parse(rawPrefs));

      const loc = readStoredLocation();
      if (loc) setLocationCity(`${loc.city}${loc.state ? `, ${loc.state}` : ''}`);
      else {
        const profile = readStoredProfile();
        if (profile?.city) setLocationCity(profile.city);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  React.useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.authenticated || !data.user) return;
        setUserMeta((current) => ({
          ...current,
          displayName: current.displayName || data.user.name || '',
          email: current.email || data.user.email || '',
        }));
      })
      .catch(() => {});
  }, []);

  async function useCurrentLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Your browser does not support location access. Use the Dashboard to choose a city.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
        });
      });
      const coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      const response = await fetch(
        `/api/location/reverse?lat=${coordinates.latitude}&lon=${coordinates.longitude}`
      );
      const resolved = response.ok ? await response.json() as LocationInfo : null;
      const location: LocationInfo = resolved?.city && resolved.city !== 'Unknown'
        ? { ...resolved, coordinates }
        : { coordinates, city: 'Current location', state: '', country: '' };
      writeStoredLocation(location);
      setLocationCity([location.city, location.state].filter(Boolean).join(', '));
    } catch {
      setLocationError('We could not access your location. Check browser permission or choose a city from the Dashboard.');
    } finally {
      setIsLocating(false);
    }
  }

  function saveAllSettings() {
    try {
      localStorage.setItem(PROFILE_META_STORAGE_KEY, JSON.stringify(userMeta));
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 3000);
    } catch {
      // Ignore
    }
  }

  async function evaluateLiveAlerts() {
    setCheckingAlerts(true);
    try {
      const loc = readStoredLocation();
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: loc?.coordinates.latitude,
          longitude: loc?.coordinates.longitude,
          city: loc?.city,
          preferences: prefs,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveAlerts(data.notifications ?? []);
      }
    } finally {
      setCheckingAlerts(false);
    }
  }

  async function handleDeleteAllData() {
    clearStoredHomeData();
    try {
      localStorage.removeItem(PREFS_STORAGE_KEY);
      localStorage.removeItem(PROFILE_META_STORAGE_KEY);
      localStorage.removeItem('uaqa_selected_location');
      localStorage.removeItem('uaqa_chat_history');
    } catch {
      // Ignore
    }
    await fetch('/api/profile', { method: 'DELETE' }).catch(() => {});
    setUserMeta({ displayName: '', email: '', aqiStandard: 'india_cpcb' });
    setPrefs(DEFAULT_PREFS);
    setLocationCity('Not set');
    setActiveAlerts([]);
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <Settings className="size-6 text-emerald-500" />
            <h1 className="text-3xl font-bold tracking-tight">Settings & Preferences</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your profile, AQI display standard, early warning thresholds, and privacy.
          </p>
        </div>

        <Button
          onClick={saveAllSettings}
          className="bg-emerald-600 text-white hover:bg-emerald-500"
        >
          {savedBanner ? (
            <>
              <Check className="mr-2 size-4" />
              Saved
            </>
          ) : (
            'Save Preferences'
          )}
        </Button>
      </motion.div>

      {/* Personal Profile */}
      <Card className="glass-card border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="size-5 text-cyan-500" />
            Personal Profile
          </CardTitle>
          <CardDescription>Basic account details and preferred AQI standard</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="Your name"
              value={userMeta.displayName}
              onChange={(e) => setUserMeta((m) => ({ ...m, displayName: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={userMeta.email}
              onChange={(e) => setUserMeta((m) => ({ ...m, email: e.target.value }))}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Preferred AQI Standard</Label>
            <Select
              value={userMeta.aqiStandard}
              onValueChange={(v) => setUserMeta((m) => ({ ...m, aqiStandard: v as AQIStandard }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select AQI standard">
                  {userMeta.aqiStandard === 'india_cpcb'
                    ? 'India CPCB (NAQI 0–500)'
                    : userMeta.aqiStandard === 'us_epa'
                      ? 'US EPA (0–500)'
                      : 'European AQI (CAQI)'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="india_cpcb">India CPCB (NAQI 0–500)</SelectItem>
                <SelectItem value="us_epa">US EPA (0–500)</SelectItem>
                <SelectItem value="european">European AQI (CAQI)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Location & Home Shortcuts */}
      <Card className="glass-card border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="size-5 text-emerald-500" />
            Location & Household
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Current Saved Location: {locationCity}</p>
            <p className="text-xs text-muted-foreground">
              Exact coordinates are never exposed publicly. Change your city from the Dashboard.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="default" size="sm" onClick={useCurrentLocation} disabled={isLocating}>
              {isLocating ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <Navigation className="mr-1.5 size-3.5" />}
              {isLocating ? 'Finding location...' : 'Use my location'}
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <Globe className="mr-1.5 size-3.5" />
                Change Location
              </Button>
            </Link>
            <Link href="/home">
              <Button variant="outline" size="sm">
                <Home className="mr-1.5 size-3.5" />
                Home Profile
              </Button>
            </Link>
          </div>
          {locationError && <p className="text-xs text-destructive sm:col-span-2">{locationError}</p>}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="glass-card border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="size-5 text-amber-500" />
                Early Warning & Alert Preferences
              </CardTitle>
              <CardDescription>
                Configure thresholds for pollution spikes, festivals, and seasonal advisories
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={evaluateLiveAlerts} disabled={checkingAlerts}>
              {checkingAlerts ? 'Checking...' : 'Check Active Alerts'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">AQI Threshold Alerts</p>
              <p className="text-xs text-muted-foreground">Alert when CPCB AQI exceeds {prefs.aqiThreshold}</p>
            </div>
            <Switch
              checked={prefs.enableAQIAlerts}
              onCheckedChange={(v) => setPrefs((p) => ({ ...p, enableAQIAlerts: v }))}
            />
          </div>
          <Slider
            value={[prefs.aqiThreshold]}
            min={50}
            max={450}
            step={25}
            disabled={!prefs.enableAQIAlerts}
            onValueChange={(val) => {
              const next = Array.isArray(val) ? val[0] : val;
              if (typeof next === 'number') setPrefs((p) => ({ ...p, aqiThreshold: next }));
            }}
          />

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm font-medium">PM2.5 Threshold Alerts</p>
              <p className="text-xs text-muted-foreground">Alert when PM2.5 exceeds {prefs.pm25Threshold} µg/m³</p>
            </div>
            <Switch
              checked={prefs.enablePM25Alerts}
              onCheckedChange={(v) => setPrefs((p) => ({ ...p, enablePM25Alerts: v }))}
            />
          </div>
          <Slider
            value={[prefs.pm25Threshold]}
            min={15}
            max={250}
            step={5}
            disabled={!prefs.enablePM25Alerts}
            onValueChange={(val) => {
              const next = Array.isArray(val) ? val[0] : val;
              if (typeof next === 'number') setPrefs((p) => ({ ...p, pm25Threshold: next }));
            }}
          />

          <div className="grid gap-3 pt-2 sm:grid-cols-3">
            <div className="flex items-center justify-between rounded-xl border p-3">
              <Label className="text-xs">Festival Warnings</Label>
              <Switch
                checked={prefs.enableFestivalAlerts}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, enableFestivalAlerts: v }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border p-3">
              <Label className="text-xs">Seasonal Advisories</Label>
              <Switch
                checked={prefs.enableSeasonalAlerts}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, enableSeasonalAlerts: v }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border p-3">
              <Label className="text-xs">Forecast Spikes</Label>
              <Switch
                checked={prefs.enableForecastAlerts}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, enableForecastAlerts: v }))}
              />
            </div>
          </div>

          {activeAlerts.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Triggered Alerts for Current Conditions
              </p>
              {activeAlerts.map((alert) => (
                <Alert key={alert.id}>
                  <AlertTriangle className="size-4" />
                  <AlertDescription className="text-xs">
                    <span className="font-semibold">{alert.title}:</span> {alert.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy & Data Management */}
      <Card className="glass-card border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="size-5 text-destructive" />
            Data Privacy & Account
          </CardTitle>
          <CardDescription>
            Manage or permanently erase your stored household profile, plant inventory, and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            Your private household details are stored locally (and in your private Supabase account when signed in).
          </div>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
              <Trash2 className="mr-2 size-4" />
              Delete Personal Data
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all personal and household data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove your household profile, indoor plant inventory, saved location, chat history, and notification preferences. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAllData}>
                  Delete Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* About & Disclaimer */}
      <Card className="glass-card border-border/60">
        <CardContent className="flex items-start gap-3 p-4 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-emerald-500" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">AirGuard AI — Urban Air Quality Assistant</span>
              <Badge variant="outline" className="text-[10px]">v1.0.0</Badge>
            </div>
            <p>
              Environmental readings and forecasts are sourced from Open-Meteo Air Quality & Weather APIs. This application provides informational environmental guidance only and does not replace official public health advisories or professional medical advice.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
