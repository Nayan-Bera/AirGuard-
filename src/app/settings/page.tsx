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
  Star,
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
import { LocationSearch } from '@/components/dashboard/location-search';
import {
  BROWSER_ALERTS_ENABLED_KEY,
  BROWSER_ALERTS_LAST_CHECK_KEY,
  showBrowserAlertNotifications,
} from '@/lib/browser-notifications';
import type { AQIStandard, LocationInfo, NotificationPreferences, UserNotification } from '@/types';
import { useAppSelector } from '@/lib/store/hooks';

const PREFS_STORAGE_KEY = 'uaqa_notification_preferences';
const PROFILE_META_STORAGE_KEY = 'uaqa_user_settings';
const SAVED_LOCATIONS_STORAGE_KEY = 'uaqa_saved_locations';

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

function isAQIStandard(value: string): value is AQIStandard {
  return value === 'india_cpcb' || value === 'us_epa' || value === 'european';
}

export default function SettingsPage() {
  const authUser = useAppSelector((state) => state.auth.user);
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
  const [savedLocations, setSavedLocations] = React.useState<LocationInfo[]>([]);
  const [locationsSaving, setLocationsSaving] = React.useState(false);
  const [locationsError, setLocationsError] = React.useState<string | null>(null);
  const [browserAlertsEnabled, setBrowserAlertsEnabled] = React.useState(false);
  const [browserPermission, setBrowserPermission] = React.useState<NotificationPermission | 'unsupported'>('default');
  const [browserAlertError, setBrowserAlertError] = React.useState<string | null>(null);

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
      const saved = localStorage.getItem(SAVED_LOCATIONS_STORAGE_KEY);
      if (saved) setSavedLocations(JSON.parse(saved));
      setBrowserAlertsEnabled(localStorage.getItem(BROWSER_ALERTS_ENABLED_KEY) === 'true');
      setBrowserPermission('Notification' in window ? Notification.permission : 'unsupported');
    } catch {
      // Ignore storage errors
    }
  }, []);

  React.useEffect(() => {
    if (!authUser) return;
    setUserMeta((current) => ({
      ...current,
      displayName: current.displayName || authUser.name || '',
      email: current.email || authUser.email || '',
    }));
  }, [authUser]);

  React.useEffect(() => {
    fetch('/api/profile', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.authenticated) return;
        const locations = Array.isArray(data.locations) ? data.locations : data.location ? [data.location] : [];
        setSavedLocations(locations);
        localStorage.setItem(SAVED_LOCATIONS_STORAGE_KEY, JSON.stringify(locations));
      })
      .catch(() => {});
  }, []);

  async function persistLocations(locations: LocationInfo[]) {
    if (locations.length > 20) {
      setLocationsError('You can save up to 20 locations.');
      return;
    }
    setSavedLocations(locations);
    setLocationsError(null);
    try { localStorage.setItem(SAVED_LOCATIONS_STORAGE_KEY, JSON.stringify(locations)); } catch { /* Ignore storage errors */ }
    setLocationsSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations }),
      });
      if (!response.ok) throw new Error('Could not sync saved locations to your account.');
      await response.json();
    } catch (error) {
      setLocationsError(error instanceof Error ? error.message : 'Could not save locations.');
    } finally { setLocationsSaving(false); }
  }

  function addSavedLocation(location: LocationInfo) {
    if (savedLocations.some((item) => item.coordinates.latitude === location.coordinates.latitude && item.coordinates.longitude === location.coordinates.longitude)) {
      setLocationsError('That location is already saved.');
      return;
    }
    void persistLocations([...savedLocations, location]);
  }

  function activateSavedLocation(location: LocationInfo) {
    writeStoredLocation(location);
    setLocationCity([location.city, location.state].filter(Boolean).join(', '));
  }

  async function setBrowserAlerts(enabled: boolean) {
    setBrowserAlertError(null);
    if (!enabled) {
      setBrowserAlertsEnabled(false);
      localStorage.setItem(BROWSER_ALERTS_ENABLED_KEY, 'false');
      return;
    }
    if (!('Notification' in window)) {
      setBrowserPermission('unsupported');
      setBrowserAlertError('This browser does not support desktop notifications.');
      return;
    }

    const permission = Notification.permission === 'default'
      ? await Notification.requestPermission()
      : Notification.permission;
    setBrowserPermission(permission);
    if (permission !== 'granted') {
      setBrowserAlertsEnabled(false);
      localStorage.setItem(BROWSER_ALERTS_ENABLED_KEY, 'false');
      setBrowserAlertError(permission === 'denied'
        ? 'Notifications are blocked for this site in Chrome. Allow them in the site permissions, then try again.'
        : 'Notification permission was not granted.');
      return;
    }

    setBrowserAlertsEnabled(true);
    localStorage.setItem(BROWSER_ALERTS_ENABLED_KEY, 'true');
    localStorage.removeItem(BROWSER_ALERTS_LAST_CHECK_KEY);
  }

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
      if (!savedLocations.some((item) => item.coordinates.latitude === coordinates.latitude && item.coordinates.longitude === coordinates.longitude)) {
        void persistLocations([...savedLocations, location]);
      }
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
        showBrowserAlertNotifications(data.notifications ?? []);
        localStorage.setItem(BROWSER_ALERTS_LAST_CHECK_KEY, String(Date.now()));
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
      localStorage.removeItem(SAVED_LOCATIONS_STORAGE_KEY);
      localStorage.removeItem('uaqa_chat_history');
    } catch {
      // Ignore
    }
    await fetch('/api/profile', { method: 'DELETE' }).catch(() => {});
    setUserMeta({ displayName: '', email: '', aqiStandard: 'india_cpcb' });
    setPrefs(DEFAULT_PREFS);
    setLocationCity('Not set');
    setSavedLocations([]);
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
              onValueChange={(value) => {
                if (value && isAQIStandard(value)) {
                  setUserMeta((meta) => ({ ...meta, aqiStandard: value }));
                }
              }}
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

      <Card className="glass-card border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><MapPin className="size-5 text-emerald-500" />Saved Home Locations</CardTitle>
          <CardDescription>Save places such as home, work, or another household, then switch the dashboard location anytime.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LocationSearch
            currentLocation={readStoredLocation()}
            onSelectLocation={addSavedLocation}
            trigger={<Button variant="outline"><MapPin className="mr-2 size-4" />Add a location</Button>}
          />
          {locationsSaving && <p className="text-xs text-muted-foreground">Saving locations…</p>}
          {locationsError && <p className="text-sm text-destructive">{locationsError}</p>}
          {savedLocations.length === 0 ? <p className="text-sm text-muted-foreground">No saved locations yet.</p> : (
            <div className="space-y-2">
              {savedLocations.map((location, index) => {
                const selected = readStoredLocation();
                const active = selected?.coordinates.latitude === location.coordinates.latitude && selected?.coordinates.longitude === location.coordinates.longitude;
                return <div key={`${location.city}-${location.coordinates.latitude}-${location.coordinates.longitude}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
                  <div><p className="font-medium">{location.city}{location.state ? `, ${location.state}` : ''}{active && <span className="ml-2 text-xs text-emerald-600">Active</span>}</p><p className="text-xs text-muted-foreground">{location.country || 'Saved location'}</p></div>
                  <div className="flex gap-2">
                    {!active && <Button size="sm" variant="outline" onClick={() => activateSavedLocation(location)}><Star className="mr-1 size-3.5" />Use</Button>}
                    <Button size="sm" variant="ghost" aria-label={`Remove ${location.city}`} onClick={() => void persistLocations(savedLocations.filter((_, i) => i !== index))}><Trash2 className="size-4" /></Button>
                  </div>
                </div>;
              })}
            </div>
          )}
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
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 p-3">
            <div>
              <p className="text-sm font-medium">Chrome desktop notifications</p>
              <p className="text-xs text-muted-foreground">
                Get a browser notification when an air quality alert is detected while AeroPulse is open.
                {browserPermission === 'granted' && ' Permission granted.'}
                {browserPermission === 'denied' && ' Blocked in Chrome site settings.'}
                {browserPermission === 'unsupported' && ' Not supported by this browser.'}
              </p>
            </div>
            <Switch
              checked={browserAlertsEnabled}
              disabled={browserPermission === 'unsupported'}
              onCheckedChange={(enabled) => void setBrowserAlerts(enabled)}
              aria-label="Enable Chrome desktop notifications"
            />
          </div>
          {browserAlertError && <p className="text-sm text-destructive">{browserAlertError}</p>}

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
              <span className="font-semibold text-foreground">AeroPulse AI — Urban Air Quality Assistant</span>
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
