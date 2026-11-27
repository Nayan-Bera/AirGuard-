'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  CheckCircle2,
  CircleCheckBig,
  ClipboardCheck,
  ExternalLink,
  Flame,
  Home,
  Loader2,
  MapPin,
  Pencil,
  RefreshCw,
  ShieldAlert,
  ShoppingBag,
  Trees,
  Wind,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OnboardingWizard } from '@/components/home-profile/onboarding-wizard';
import { PlantManager } from '@/components/home-profile/plant-manager';
import { EnvironmentScore } from '@/components/home-profile/environment-score';
import {
  COOKING_FUEL_LABELS,
  DEFAULT_COORDINATES,
  ENVIRONMENT_TYPE_LABELS,
  NEARBY_FEATURE_OPTIONS,
  PROPERTY_TYPE_LABELS,
  TRANSPORT_MODE_LABELS,
  calculateProfileCompletion,
  readStoredLocation,
  readStoredPlants,
  readStoredProfile,
  writeStoredPlants,
  writeStoredProfile,
} from '@/components/home-profile/home-profile-utils';
import type { AIRecommendationResponse, HouseholdPlant, HouseholdProfile } from '@/types';

export function HomeDashboard() {
  const [profile, setProfile] = React.useState<HouseholdProfile | null>(null);
  const [plants, setPlants] = React.useState<HouseholdPlant[]>([]);
  const [hydrated, setHydrated] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [currentAQI, setCurrentAQI] = React.useState<number | null>(null);
  const [aiPlan, setAiPlan] = React.useState<AIRecommendationResponse | null>(null);
  const [loadingPlan, setLoadingPlan] = React.useState(false);
  const [planError, setPlanError] = React.useState<string | null>(null);
  const autoPlanKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const storedProfile = readStoredProfile();
    const storedPlants = readStoredPlants();
    setProfile(storedProfile);
    setPlants(storedPlants);
    setHydrated(true);

    // Sync from server if user is signed in via manual JWT session
    fetch('/api/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((serverData) => {
        if (serverData?.authenticated) {
          if (serverData.householdProfile) {
            setProfile(serverData.householdProfile);
            writeStoredProfile(serverData.householdProfile);
          }
          if (Array.isArray(serverData.plants) && serverData.plants.length > 0) {
            setPlants(serverData.plants);
            writeStoredPlants(serverData.plants);
          }
        }
      })
      .catch(() => { });

    const loc = readStoredLocation();
    const coords = loc?.coordinates ?? DEFAULT_COORDINATES;
    fetch(`/api/air-quality?lat=${coords.latitude}&lon=${coords.longitude}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.current?.aqi != null) {
          setCurrentAQI(data.current.aqi);
        }
      })
      .catch(() => { });
  }, []);

  function syncToServer(
    nextProfile: HouseholdProfile | null,
    nextPlants: HouseholdPlant[]
  ) {
    fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        householdProfile: nextProfile,
        plants: nextPlants,
        location: readStoredLocation(),
      }),
    }).catch(() => { });
  }

  function handleSaveWizard(updatedProfile: HouseholdProfile, updatedPlants: HouseholdPlant[]) {
    setProfile(updatedProfile);
    setPlants(updatedPlants);
    writeStoredProfile(updatedProfile);
    writeStoredPlants(updatedPlants);
    syncToServer(updatedProfile, updatedPlants);
    setIsEditing(false);
  }

  function handleAddPlant(plant: Omit<HouseholdPlant, 'id' | 'householdId'>) {
    const newPlant: HouseholdPlant = {
      ...plant,
      id: crypto.randomUUID(),
      householdId: profile?.id ?? 'local-household',
    };
    const next = [...plants, newPlant];
    setPlants(next);
    writeStoredPlants(next);
    let updatedProfile = profile;
    if (profile) {
      updatedProfile = {
        ...profile,
        profileCompletionPercent: calculateProfileCompletion(profile, next.length),
      };
      setProfile(updatedProfile);
      writeStoredProfile(updatedProfile);
    }
    syncToServer(updatedProfile, next);
  }

  function handleUpdatePlant(id: string, updates: Omit<HouseholdPlant, 'id' | 'householdId'>) {
    const next = plants.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setPlants(next);
    writeStoredPlants(next);
    syncToServer(profile, next);
  }

  function handleRemovePlant(id: string) {
    const next = plants.filter((p) => p.id !== id);
    setPlants(next);
    writeStoredPlants(next);
    let updatedProfile = profile;
    if (profile) {
      updatedProfile = {
        ...profile,
        profileCompletionPercent: calculateProfileCompletion(profile, next.length),
      };
      setProfile(updatedProfile);
      writeStoredProfile(updatedProfile);
    }
    syncToServer(updatedProfile, next);
  }

  async function generateHomePlan() {
    if (!profile) return;
    setLoadingPlan(true);
    setPlanError(null);
    try {
      const loc = readStoredLocation();
      const coords = loc?.coordinates ?? DEFAULT_COORDINATES;
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: coords.latitude,
          longitude: coords.longitude,
          household: profile,
          plants,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null) as
          | { error?: string | { message?: string }; message?: string }
          | null;
        const message = typeof err?.error === 'string'
          ? err.error
          : err?.error?.message ?? err?.message ?? 'Failed to generate your home action plan';
        throw new Error(message);
      }
      const data = await res.json();
      setAiPlan(data.recommendations ?? data);
    } catch (err) {
      setPlanError(
        err instanceof Error
          ? err.message
          : 'Could not generate AI plan. Ensure GEMINI_API_KEY is configured.'
      );
    } finally {
      setLoadingPlan(false);
    }
  }

  // Generate an actionable plan as soon as a saved (even partial) home profile is available.
  React.useEffect(() => {
    if (!profile || !hydrated) return;
    const planKey = `${profile.id}:${profile.updatedAt ?? ''}`;
    if (autoPlanKeyRef.current === planKey) return;
    autoPlanKeyRef.current = planKey;
    void generateHomePlan();
  }, [profile, hydrated]);

  if (!hydrated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-64 animate-pulse rounded-2xl bg-muted/50" />
      </div>
    );
  }

  if (!profile || isEditing) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Home & Environment</h1>
            <p className="text-sm text-muted-foreground">
              Tell AeroPulse AI about your living space for tailored indoor air quality guidance.
            </p>
          </div>
        </div>

        <OnboardingWizard
          initialProfile={profile}
          initialPlants={plants}
          onComplete={handleSaveWizard}
          onCancel={profile ? () => setIsEditing(false) : undefined}
        />
      </div>
    );
  }

  const completion = calculateProfileCompletion(profile, plants.length);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <Home className="size-6 text-emerald-500" />
            <h1 className="text-3xl font-bold tracking-tight">My Home</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Personalized indoor environment profile for {profile.city}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Pencil className="mr-2 size-4" />
            Edit Home Profile
          </Button>
          <Button
            onClick={generateHomePlan}
            disabled={loadingPlan}
            className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-500 hover:to-cyan-500"
          >
            {loadingPlan ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Generating Plan...
              </>
            ) : (
              <>
                <ClipboardCheck className="mr-2 size-4" />
                Update Home Plan
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Profile Completion Bar */}
      <Card className="glass-card border-border/60">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span className="text-sm font-medium">Profile Completion: {completion}%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Higher completion enables more accurate ventilation, filtration, and commute advice.
            </p>
          </div>
          <div className="w-full sm:w-64">
            <Progress value={completion} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Score + Property Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <EnvironmentScore profile={profile} plants={plants} currentAQI={currentAQI} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <Card className="glass-card border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="size-4 text-cyan-500" />
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">
                  {profile.propertyType ? PROPERTY_TYPE_LABELS[profile.propertyType] : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Configuration</span>
                <span className="font-medium">
                  {profile.bhk ?? '-'} BHK {profile.approximateSize ? `(${profile.approximateSize} sq.ft)` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Floor</span>
                <span className="font-medium">
                  {profile.floorNumber ?? '-'} of {profile.totalFloors ?? '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Outdoor Space</span>
                <span className="font-medium">
                  {[profile.hasBalcony && 'Balcony', profile.hasGarden && 'Garden'].filter(Boolean).join(', ') || 'None'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wind className="size-4 text-emerald-500" />
                Indoor Environment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Air Purifier</span>
                <Badge variant={profile.hasAirPurifier ? 'default' : 'outline'}>
                  {profile.hasAirPurifier ? 'Available' : 'None'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Windows Usually</span>
                <span className="font-medium">{profile.windowsUsuallyOpen ? 'Open' : 'Closed'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cooking Fuel</span>
                <span className="font-medium">
                  {profile.cookingFuel ? COOKING_FUEL_LABELS[profile.cookingFuel] : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kitchen Exhaust</span>
                <span className="font-medium">{profile.isKitchenVentilated ? 'Yes' : 'No'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="size-4 text-amber-500" />
                Lifestyle & Commute
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Area Type</span>
                <span className="font-medium">
                  {profile.environmentType ? ENVIRONMENT_TYPE_LABELS[profile.environmentType] : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Commute</span>
                <span className="font-medium">
                  {profile.transportMode ? TRANSPORT_MODE_LABELS[profile.transportMode] : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Daily Outdoor Time</span>
                <span className="font-medium">{profile.dailyOutdoorHours ?? 0} hrs/day</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trees className="size-4 text-teal-500" />
                Nearby Surroundings
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {(profile.nearbyFeatures ?? []).length > 0 ? (
                profile.nearbyFeatures.map((f) => {
                  const opt = NEARBY_FEATURE_OPTIONS.find((o) => o.value === f);
                  return (
                    <Badge key={f} variant="secondary" className="text-xs">
                      {opt?.label ?? f}
                    </Badge>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground">No nearby features specified</p>
              )}
              {profile.burnsIncense && (
                <Badge variant="outline" className="border-amber-500/40 text-xs text-amber-600">
                  <Flame className="mr-1 size-3" /> Incense / Coils used
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Home air quality plan */}
      {(planError || aiPlan) && (
        <Card className="glass-card border-border/70">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="size-5 text-primary" />
                Home Air Quality Plan
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={generateHomePlan} disabled={loadingPlan}>
                <RefreshCw className="mr-1.5 size-3.5" />
                Refresh
              </Button>
            </div>
            <CardDescription>
              Practical guidance based on your home details and the current outdoor AQI.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {planError && (
              <Alert variant="destructive">
                <ShieldAlert className="size-4" />
                <AlertDescription>{planError}</AlertDescription>
              </Alert>
            )}

            {aiPlan && (
              <div className="space-y-6">
                <div className="rounded-xl border border-border/70 bg-muted/25 px-4 py-3">
                  <p className="text-sm leading-relaxed">{aiPlan.air_quality_summary}</p>
                </div>
                {(aiPlan.priority_actions ?? []).length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CircleCheckBig className="size-4 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <h3 className="text-sm font-semibold">Recommended actions</h3>
                        <p className="text-xs text-muted-foreground">Start with these steps to reduce exposure today.</p>
                      </div>
                    </div>
                    <ol className="grid gap-3 md:grid-cols-3">
                      {aiPlan.priority_actions.slice(0, 3).map((action, index) => (
                        <li key={`${action.action}-${index}`} className="rounded-xl border border-border/70 bg-background/60 p-3.5">
                          <span className="mb-2 flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span>
                          <p className="text-sm font-semibold leading-snug">{action.action}</p>
                          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{action.reason}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Wind className="size-4 text-sky-600 dark:text-sky-400" />
                    <div>
                      <h3 className="text-sm font-semibold">Home suggestions</h3>
                      <p className="text-xs text-muted-foreground">Additional changes for cleaner indoor air.</p>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {[...(aiPlan.indoor_recommendations ?? []), ...(aiPlan.plant_recommendations ?? [])].map((rec) => (
                      <div key={rec.id} className="rounded-xl border border-border/70 bg-background/60 p-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {rec.category === 'plants' ? <Trees className="size-4 text-emerald-600" /> : <Wind className="size-4 text-sky-600" />}
                            <h4 className="text-sm font-semibold">{rec.title}</h4>
                          </div>
                          <Badge variant="outline" className="shrink-0 text-[10px] uppercase">{rec.priority}</Badge>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{rec.description}</p>
                        <p className="mt-2 text-[11px] text-muted-foreground"><span className="font-medium text-foreground">Why it helps:</span> {rec.reason}</p>
                      </div>
                    ))}
                  </div>
                </section>
                {(aiPlan.product_recommendations ?? []).length > 0 && (
                  <section className="space-y-3 border-t border-border/70 pt-5">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="size-4 text-primary" />
                      <div>
                        <h3 className="text-sm font-semibold">Recommended products</h3>
                        <p className="text-xs text-muted-foreground">Optional products selected for your current needs.</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Compare room coverage, fit, filter costs, warranty, and seller information before buying.
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {aiPlan.product_recommendations.map((product) => (
                        <div key={product.id} className="rounded-xl border border-border/70 bg-background/60 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold">{product.name}</h4>
                            <Badge variant="outline" className="shrink-0 text-[10px] uppercase">{product.priority}</Badge>
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{product.description}</p>
                          <p className="mt-2 text-[11px] text-muted-foreground"><span className="font-medium text-foreground">Recommended because:</span> {product.reason}</p>
                          <a
                            href={product.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                          >
                            View options <ExternalLink className="size-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                <p className="text-[11px] text-muted-foreground">{aiPlan.disclaimer}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Indoor Plant Manager */}
      <PlantManager
        plants={plants}
        onAddPlant={handleAddPlant}
        onUpdatePlant={handleUpdatePlant}
        onRemovePlant={handleRemovePlant}
      />
    </div>
  );
}
