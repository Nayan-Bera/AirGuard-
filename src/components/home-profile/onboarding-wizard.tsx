'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Leaf,
  Loader2,
  MapPin,
  Navigation,
  ShieldCheck,
  SkipForward,
  Wind,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { householdProfileSchema } from '@/lib/validation/schemas';
import { PlantManager } from '@/components/home-profile/plant-manager';
import {
  COOKING_FUEL_LABELS,
  ENVIRONMENT_TYPE_LABELS,
  NEARBY_FEATURE_OPTIONS,
  PROPERTY_TYPE_LABELS,
  TRANSPORT_MODE_LABELS,
  calculateProfileCompletion,
  readStoredLocation,
  writeStoredLocation,
} from '@/components/home-profile/home-profile-utils';
import { cn } from '@/lib/utils';
import type { CookingFuel, EnvironmentType, HouseholdPlant, HouseholdProfile, LocationInfo, NearbyFeature, PropertyType, TransportMode } from '@/types';

type OnboardingFormValues = z.infer<typeof householdProfileSchema>;

interface OnboardingWizardProps {
  initialProfile?: HouseholdProfile | null;
  initialPlants?: HouseholdPlant[];
  onComplete: (profile: HouseholdProfile, plants: HouseholdPlant[]) => void;
  onCancel?: () => void;
}

const STEPS = [
  { id: 1, title: 'Location & Lifestyle', icon: MapPin, description: 'City, environment, and daily commute' },
  { id: 2, title: 'Home & Property', icon: Building2, description: 'Building type, floor, and surroundings' },
  { id: 3, title: 'Indoor Environment', icon: Wind, description: 'Ventilation, filtration, and cooking' },
  { id: 4, title: 'Indoor Plants', icon: Leaf, description: 'Your household plant inventory' },
  { id: 5, title: 'Review & Save', icon: ShieldCheck, description: 'Confirm your personalized setup' },
];

export function OnboardingWizard({
  initialProfile,
  initialPlants = [],
  onComplete,
  onCancel,
}: OnboardingWizardProps) {
  const [step, setStep] = React.useState(1);
  const [plants, setPlants] = React.useState<HouseholdPlant[]>(initialPlants);
  const [isLocating, setIsLocating] = React.useState(false);
  const [locationError, setLocationError] = React.useState<string | null>(null);

  const storedLocation = React.useMemo(() => readStoredLocation(), []);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(householdProfileSchema),
    defaultValues: {
      city: initialProfile?.city ?? storedLocation?.city ?? 'New Delhi',
      environmentType: initialProfile?.environmentType ?? 'urban',
      transportMode: initialProfile?.transportMode ?? 'public_transport',
      dailyOutdoorHours: initialProfile?.dailyOutdoorHours ?? 2,
      outdoorTimings: initialProfile?.outdoorTimings ?? '08:30 - 10:00, 18:00 - 19:30',
      propertyType: initialProfile?.propertyType ?? 'apartment',
      isOwned: initialProfile?.isOwned ?? false,
      totalFloors: initialProfile?.totalFloors ?? 6,
      floorNumber: initialProfile?.floorNumber ?? 2,
      bhk: initialProfile?.bhk ?? 2,
      approximateSize: initialProfile?.approximateSize ?? 1100,
      hasBalcony: initialProfile?.hasBalcony ?? true,
      hasGarden: initialProfile?.hasGarden ?? false,
      hasProperVentilation: initialProfile?.hasProperVentilation ?? true,
      windowsUsuallyOpen: initialProfile?.windowsUsuallyOpen ?? false,
      nearbyFeatures: initialProfile?.nearbyFeatures ?? [],
      hasAirPurifier: initialProfile?.hasAirPurifier ?? false,
      hasAC: initialProfile?.hasAC ?? true,
      hasExhaustFan: initialProfile?.hasExhaustFan ?? true,
      cookingFuel: initialProfile?.cookingFuel ?? 'lpg',
      isKitchenVentilated: initialProfile?.isKitchenVentilated ?? true,
      burnsIncense: initialProfile?.burnsIncense ?? false,
      experiencesDust: initialProfile?.experiencesDust ?? true,
    },
  });

  const watchedValues = form.watch();
  const completionPercent = calculateProfileCompletion(watchedValues, plants.length);

  function handleAddPlant(plant: Omit<HouseholdPlant, 'id' | 'householdId'>) {
    const newPlant: HouseholdPlant = {
      ...plant,
      id: crypto.randomUUID(),
      householdId: initialProfile?.id ?? 'local-household',
    };
    setPlants((prev) => [...prev, newPlant]);
  }

  function handleUpdatePlant(id: string, updates: Omit<HouseholdPlant, 'id' | 'householdId'>) {
    setPlants((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }

  function handleRemovePlant(id: string) {
    setPlants((prev) => prev.filter((p) => p.id !== id));
  }

  function toggleNearbyFeature(feature: NearbyFeature) {
    const current = form.getValues('nearbyFeatures') ?? [];
    if (feature === 'none') {
      form.setValue('nearbyFeatures', ['none']);
      return;
    }
    const filtered = current.filter((f) => f !== 'none');
    if (filtered.includes(feature)) {
      form.setValue(
        'nearbyFeatures',
        filtered.filter((f) => f !== feature)
      );
    } else {
      form.setValue('nearbyFeatures', [...filtered, feature]);
    }
  }

  async function useCurrentLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Location access is not supported by this browser. Enter your city manually.');
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
      const coordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      const response = await fetch(
        `/api/location/reverse?lat=${coordinates.latitude}&lon=${coordinates.longitude}`
      );
      const resolved = response.ok ? await response.json() as LocationInfo : null;
      const location: LocationInfo = resolved?.city && resolved.city !== 'Unknown'
        ? { ...resolved, coordinates }
        : { coordinates, city: 'Current location', state: '', country: '' };
      form.setValue('city', location.city, { shouldDirty: true, shouldValidate: true });
      writeStoredLocation(location);
    } catch {
      setLocationError('We could not detect your location. Check browser permission or enter your city manually.');
    } finally {
      setIsLocating(false);
    }
  }

  function onSubmit(values: OnboardingFormValues) {
    const now = new Date().toISOString();
    const profile: HouseholdProfile = {
      id: initialProfile?.id ?? crypto.randomUUID(),
      userId: initialProfile?.userId ?? 'local-user',
      city: values.city,
      environmentType: values.environmentType ?? null,
      transportMode: values.transportMode ?? null,
      dailyOutdoorHours: values.dailyOutdoorHours ?? null,
      outdoorTimings: values.outdoorTimings ?? null,
      propertyType: values.propertyType ?? null,
      isOwned: values.isOwned ?? null,
      totalFloors: values.totalFloors ?? null,
      floorNumber: values.floorNumber ?? null,
      bhk: values.bhk ?? null,
      approximateSize: values.approximateSize ?? null,
      hasBalcony: values.hasBalcony ?? null,
      hasGarden: values.hasGarden ?? null,
      hasProperVentilation: values.hasProperVentilation ?? null,
      windowsUsuallyOpen: values.windowsUsuallyOpen ?? null,
      nearbyFeatures: values.nearbyFeatures ?? [],
      hasAirPurifier: values.hasAirPurifier ?? null,
      hasAC: values.hasAC ?? null,
      hasExhaustFan: values.hasExhaustFan ?? null,
      cookingFuel: values.cookingFuel ?? null,
      isKitchenVentilated: values.isKitchenVentilated ?? null,
      burnsIncense: values.burnsIncense ?? null,
      experiencesDust: values.experiencesDust ?? null,
      profileCompletionPercent: calculateProfileCompletion(values, plants.length),
      createdAt: initialProfile?.createdAt ?? now,
      updatedAt: now,
    };

    // Best-effort server sync
    fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    }).catch(() => { });

    onComplete(profile, plants);
  }

  return (
    <Card className="glass-card border-border/60 shadow-xl">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-xl font-bold">
              {initialProfile ? 'Update Household Profile' : 'Personalize Your Home Profile'}
            </CardTitle>
            <CardDescription>
              Step {step} of {STEPS.length}: {STEPS[step - 1].description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              {completionPercent}% Complete
            </Badge>
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        <Progress value={(step / STEPS.length) * 100} className="h-2" />

        <div className="grid grid-cols-5 gap-2 pt-1">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const active = s.id === step;
            const done = s.id < step;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl p-2 text-center transition-colors',
                  active && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                  done && 'text-emerald-600 dark:text-emerald-400',
                  !active && !done && 'text-muted-foreground hover:bg-muted/50'
                )}
              >
                <div
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full border text-xs',
                    active && 'border-emerald-500 bg-emerald-500 text-white',
                    done && 'border-emerald-500/50 bg-emerald-500/15',
                    !active && !done && 'border-border'
                  )}
                >
                  {done ? <Check className="size-4" /> : <Icon className="size-4" />}
                </div>
                <span className="hidden text-[11px] font-medium sm:inline">{s.title}</span>
              </button>
            );
          })}
        </div>
      </CardHeader>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="grid gap-4 sm:grid-cols-2"
              >
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="city">City / Location</Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input id="city" {...form.register('city')} placeholder="e.g., New Delhi" />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={useCurrentLocation}
                      disabled={isLocating}
                      className="shrink-0 gap-1.5"
                    >
                      {isLocating ? <Loader2 className="size-4 animate-spin" /> : <Navigation className="size-4 text-primary" />}
                      {isLocating ? 'Detecting...' : 'Use my location'}
                    </Button>
                  </div>
                  {form.formState.errors.city && (
                    <p className="text-xs text-destructive">{form.formState.errors.city.message}</p>
                  )}
                  {locationError && <p className="text-xs text-destructive">{locationError}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Surrounding Environment</Label>
                  <Controller
                    control={form.control}
                    name="environmentType"
                    render={({ field }) => (
                      <Select value={field.value ?? 'urban'} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select environment">
                            {ENVIRONMENT_TYPE_LABELS[(field.value ?? 'urban') as EnvironmentType]}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ENVIRONMENT_TYPE_LABELS).map(([val, label]) => (
                            <SelectItem key={val} value={val}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Primary Commute Mode</Label>
                  <Controller
                    control={form.control}
                    name="transportMode"
                    render={({ field }) => (
                      <Select value={field.value ?? 'public_transport'} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select commute mode">
                            {TRANSPORT_MODE_LABELS[(field.value ?? 'public_transport') as TransportMode]}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TRANSPORT_MODE_LABELS).map(([val, label]) => (
                            <SelectItem key={val} value={val}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dailyOutdoorHours">Daily Outdoor Hours</Label>
                  <Input
                    id="dailyOutdoorHours"
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    {...form.register('dailyOutdoorHours', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outdoorTimings">Typical Outdoor Timings</Label>
                  <Input
                    id="outdoorTimings"
                    {...form.register('outdoorTimings')}
                    placeholder="e.g., 7:00 AM - 8:00 AM, 6:00 PM"
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Property Type</Label>
                    <Controller
                      control={form.control}
                      name="propertyType"
                      render={({ field }) => (
                        <Select value={field.value ?? 'apartment'} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select property type">
                              {PROPERTY_TYPE_LABELS[(field.value ?? 'apartment') as PropertyType]}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PROPERTY_TYPE_LABELS).map(([val, label]) => (
                              <SelectItem key={val} value={val}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bhk">Rooms (BHK)</Label>
                    <Input id="bhk" type="number" min="1" max="20" {...form.register('bhk', { valueAsNumber: true })} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="floorNumber">Floor You Live On</Label>
                    <Input id="floorNumber" type="number" min="0" max="100" {...form.register('floorNumber', { valueAsNumber: true })} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalFloors">Total Building Floors</Label>
                    <Input id="totalFloors" type="number" min="1" max="100" {...form.register('totalFloors', { valueAsNumber: true })} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="approximateSize">Home Size (sq. ft.)</Label>
                    <Input id="approximateSize" type="number" min="100" step="50" {...form.register('approximateSize', { valueAsNumber: true })} />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <Controller
                    control={form.control}
                    name="isOwned"
                    render={({ field }) => (
                      <div className="flex items-center justify-between rounded-xl border p-3">
                        <Label htmlFor="isOwned" className="cursor-pointer text-sm">Own House</Label>
                        <Switch id="isOwned" checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                      </div>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="hasBalcony"
                    render={({ field }) => (
                      <div className="flex items-center justify-between rounded-xl border p-3">
                        <Label htmlFor="hasBalcony" className="cursor-pointer text-sm">Has Balcony</Label>
                        <Switch id="hasBalcony" checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                      </div>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="hasGarden"
                    render={({ field }) => (
                      <div className="flex items-center justify-between rounded-xl border p-3">
                        <Label htmlFor="hasGarden" className="cursor-pointer text-sm">Has Garden</Label>
                        <Switch id="hasGarden" checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nearby Features (select all that apply)</Label>
                  <div className="flex flex-wrap gap-2">
                    {NEARBY_FEATURE_OPTIONS.map((opt) => {
                      const selected = (watchedValues.nearbyFeatures ?? []).includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => toggleNearbyFeature(opt.value)}
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                            selected
                              ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              : 'border-border bg-background hover:bg-muted'
                          )}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Primary Cooking Fuel</Label>
                  <Controller
                    control={form.control}
                    name="cookingFuel"
                    render={({ field }) => (
                      <Select value={field.value ?? 'lpg'} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select cooking fuel">
                            {COOKING_FUEL_LABELS[(field.value ?? 'lpg') as CookingFuel]}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(COOKING_FUEL_LABELS).map(([val, label]) => (
                            <SelectItem key={val} value={val}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ['hasAirPurifier', 'Air Purifier (HEPA)'],
                      ['hasAC', 'Air Conditioner'],
                      ['hasExhaustFan', 'Bathroom / Room Exhaust Fan'],
                      ['hasProperVentilation', 'Good Cross-Ventilation'],
                      ['windowsUsuallyOpen', 'Windows Usually Kept Open'],
                      ['isKitchenVentilated', 'Kitchen Exhaust / Chimney'],
                      ['burnsIncense', 'Regularly Burn Incense / Coils'],
                      ['experiencesDust', 'Noticeable Dust Entry'],
                    ] as const
                  ).map(([fieldName, label]) => (
                    <Controller
                      key={fieldName}
                      control={form.control}
                      name={fieldName}
                      render={({ field }) => (
                        <div className="flex items-center justify-between rounded-xl border p-3">
                          <Label htmlFor={fieldName} className="cursor-pointer text-sm">
                            {label}
                          </Label>
                          <Switch
                            id={fieldName}
                            checked={Boolean(field.value)}
                            onCheckedChange={field.onChange}
                          />
                        </div>
                      )}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
              >
                <PlantManager
                  plants={plants}
                  onAddPlant={handleAddPlant}
                  onUpdatePlant={handleUpdatePlant}
                  onRemovePlant={handleRemovePlant}
                  compact
                />
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="space-y-4"
              >
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="size-5" />
                    <h4 className="font-semibold">Ready to Personalize Your Recommendations</h4>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your profile is {completionPercent}% complete. All AI guidance on your dashboard and assistant chat will now adapt to your home setup.
                  </p>
                </div>

                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-xl border p-3">
                    <p className="text-xs text-muted-foreground">Location & Commute</p>
                    <p className="font-medium">{watchedValues.city}</p>
                    <p className="text-xs text-muted-foreground">
                      {watchedValues.transportMode ? TRANSPORT_MODE_LABELS[watchedValues.transportMode] : 'Not set'} ·{' '}
                      {watchedValues.dailyOutdoorHours ?? 0}h/day outdoors
                    </p>
                  </div>
                  <div className="rounded-xl border p-3">
                    <p className="text-xs text-muted-foreground">Home Setup</p>
                    <p className="font-medium">
                      {watchedValues.bhk ?? '-'} BHK{' '}
                      {watchedValues.propertyType ? PROPERTY_TYPE_LABELS[watchedValues.propertyType] : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Floor {watchedValues.floorNumber ?? '-'} of {watchedValues.totalFloors ?? '-'} · {plants.length} indoor plant(s)
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="mr-2 size-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {step < STEPS.length && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}
                >
                  Skip
                  <SkipForward className="ml-1.5 size-3.5" />
                </Button>
              )}

              {step < STEPS.length ? (
                <Button
                  type="button"
                  onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}
                  className="bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  Next
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-500 hover:to-cyan-500"
                >
                  Save Home Profile
                  <Check className="ml-2 size-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
