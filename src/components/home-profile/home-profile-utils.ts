import type {
  CookingFuel,
  EnvironmentType,
  GeoCoordinates,
  HouseholdPlant,
  HouseholdProfile,
  LocationInfo,
  NearbyFeature,
  PropertyType,
  TransportMode,
} from '@/types';

export const HOUSEHOLD_PROFILE_STORAGE_KEY = 'uaqa_household_profile';
export const HOUSEHOLD_PLANTS_STORAGE_KEY = 'uaqa_household_plants';
export const LOCATION_STORAGE_KEY = 'uaqa_selected_location';

export const DEFAULT_COORDINATES: GeoCoordinates = {
  latitude: 28.6139,
  longitude: 77.209,
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: 'Apartment',
  independent_house: 'Independent House',
  flat: 'Flat',
  villa: 'Villa',
  other: 'Other',
};

export const ENVIRONMENT_TYPE_LABELS: Record<EnvironmentType, string> = {
  urban: 'Urban (City Core)',
  suburban: 'Suburban',
  rural: 'Rural / Outskirts',
};

export const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = {
  bike: 'Two-Wheeler / Bike',
  car: 'Car',
  public_transport: 'Public Transport',
  walking: 'Walking',
  work_from_home: 'Work from Home',
};

export const COOKING_FUEL_LABELS: Record<CookingFuel, string> = {
  lpg: 'LPG Cylinder',
  piped_gas: 'Piped Natural Gas (PNG)',
  induction: 'Induction',
  electric: 'Electric Stove',
  wood: 'Wood / Biomass',
  other: 'Other',
};

export const NEARBY_FEATURE_OPTIONS: Array<{
  value: NearbyFeature;
  label: string;
  tone: 'risk' | 'positive' | 'neutral';
}> = [
  { value: 'busy_road', label: 'Busy Road / Highway', tone: 'risk' },
  { value: 'construction_site', label: 'Construction Site', tone: 'risk' },
  { value: 'industrial_area', label: 'Industrial Area', tone: 'risk' },
  { value: 'green_area', label: 'Green Belt / Trees', tone: 'positive' },
  { value: 'park', label: 'Public Park', tone: 'positive' },
  { value: 'river', label: 'River / Lake', tone: 'positive' },
  { value: 'none', label: 'None of these', tone: 'neutral' },
];

export const PLANT_LOCATION_LABELS: Record<string, string> = {
  living_room: 'Living Room',
  bedroom: 'Bedroom',
  balcony: 'Balcony',
  kitchen: 'Kitchen',
  study: 'Study / Home Office',
  hallway: 'Hallway / Entry',
  terrace: 'Terrace',
};

export interface PlantPreset {
  name: string;
  type: string;
  rating: 'High' | 'Good' | 'Moderate';
  benefit: string;
  careTip: string;
}

export const COMMON_INDOOR_PLANTS: PlantPreset[] = [
  {
    name: 'Snake Plant',
    type: 'Sansevieria trifasciata',
    rating: 'High',
    benefit:
      'Resilient indoor plant that releases oxygen at night and helps absorb trace VOCs like formaldehyde and benzene.',
    careTip: 'Low light tolerant; water only when soil is completely dry.',
  },
  {
    name: 'Peace Lily',
    type: 'Spathiphyllum',
    rating: 'High',
    benefit:
      'Known for humidity support and helping reduce trace indoor VOCs such as ammonia and formaldehyde.',
    careTip: 'Prefers indirect light and moist soil; keep away from pets.',
  },
  {
    name: 'Areca Palm',
    type: 'Dypsis lutescens',
    rating: 'High',
    benefit:
      'Acts as a natural indoor humidifier with broad fronds that trap airborne dust particles.',
    careTip: 'Bright indirect sunlight; wipe leaves occasionally to clear settled dust.',
  },
  {
    name: 'Spider Plant',
    type: 'Chlorophytum comosum',
    rating: 'Good',
    benefit:
      'Easy-to-grow foliage that complements indoor freshness and helps capture fine settled particulates on leaves.',
    careTip: 'Bright to moderate indirect light; pet-friendly.',
  },
  {
    name: 'Money Plant (Pothos)',
    type: 'Epipremnum aureum',
    rating: 'Good',
    benefit:
      'Fast-growing trailing vine suited for shelves and corners to boost indoor greenery and surface dust capture.',
    careTip: 'Thrives in water or soil under indirect light.',
  },
  {
    name: 'Boston Fern',
    type: 'Nephrolepis exaltata',
    rating: 'Good',
    benefit:
      'Natural humidifier with dense fronds that help trap coarse dust indoors during dry winter months.',
    careTip: 'Likes indirect light and regular misting.',
  },
  {
    name: 'Aloe Vera',
    type: 'Succulent',
    rating: 'Moderate',
    benefit:
      'Low-maintenance windowsill succulent that releases oxygen at night and adds greenery to sunny spots.',
    careTip: 'Needs bright light and infrequent watering.',
  },
  {
    name: 'Rubber Plant',
    type: 'Ficus elastica',
    rating: 'Good',
    benefit:
      'Broad, glossy leaves make it easy to wipe away indoor dust while supporting household greenery.',
    careTip: 'Medium to bright indirect light; clean leaves weekly.',
  },
];

export function getPlantBenefitInfo(
  name: string,
  type?: string,
  rating?: string
): {
  rating: 'High' | 'Good' | 'Moderate';
  benefit: string;
  careTip: string;
} {
  const normalized = `${name} ${type ?? ''}`.toLowerCase();
  const preset = COMMON_INDOOR_PLANTS.find(
    (item) =>
      normalized.includes(item.name.toLowerCase().split(' ')[0]) ||
      normalized.includes(item.type.toLowerCase())
  );

  if (preset) {
    return {
      rating: preset.rating,
      benefit: preset.benefit,
      careTip: preset.careTip,
    };
  }

  const normalizedRating: 'High' | 'Good' | 'Moderate' =
    rating === 'High' || rating === 'Good' || rating === 'Moderate'
      ? rating
      : 'Good';

  return {
    rating: normalizedRating,
    benefit:
      'Contributes to indoor greenery, humidity balance, and surface dust capture. Use alongside ventilation and HEPA filtration for PM2.5.',
    careTip: 'Keep leaves dust-free for better light absorption and transpiration.',
  };
}

export function calculateProfileCompletion(
  profile: Partial<HouseholdProfile>,
  plantsCount = 0
): number {
  const checks: boolean[] = [
    Boolean(profile.city && profile.city.trim().length > 0),
    profile.environmentType != null,
    profile.transportMode != null,
    profile.dailyOutdoorHours != null,
    profile.propertyType != null,
    profile.isOwned != null,
    profile.floorNumber != null,
    profile.bhk != null,
    profile.approximateSize != null,
    profile.hasBalcony != null,
    profile.hasGarden != null,
    profile.hasProperVentilation != null,
    profile.windowsUsuallyOpen != null,
    Boolean(profile.nearbyFeatures && profile.nearbyFeatures.length > 0),
    profile.hasAirPurifier != null,
    profile.hasAC != null,
    profile.hasExhaustFan != null,
    profile.cookingFuel != null,
    profile.isKitchenVentilated != null,
    profile.burnsIncense != null,
    profile.experiencesDust != null,
    plantsCount > 0,
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

export function readStoredProfile(): HouseholdProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(HOUSEHOLD_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HouseholdProfile;
    if (!parsed || typeof parsed !== 'object' || !parsed.city) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredProfile(profile: HouseholdProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HOUSEHOLD_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage quota / restricted mode errors
  }
}

export function readStoredPlants(): HouseholdPlant[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HOUSEHOLD_PLANTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HouseholdPlant[]) : [];
  } catch {
    return [];
  }
}

export function writeStoredPlants(plants: HouseholdPlant[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HOUSEHOLD_PLANTS_STORAGE_KEY, JSON.stringify(plants));
  } catch {
    // Ignore storage quota / restricted mode errors
  }
}

export function clearStoredHomeData(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(HOUSEHOLD_PROFILE_STORAGE_KEY);
    localStorage.removeItem(HOUSEHOLD_PLANTS_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function readStoredLocation(): LocationInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocationInfo;
    if (
      parsed &&
      parsed.coordinates &&
      typeof parsed.coordinates.latitude === 'number' &&
      typeof parsed.coordinates.longitude === 'number'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeStoredLocation(location: LocationInfo): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
    window.dispatchEvent(new Event('airguard-location-change'));
  } catch {
    // Ignore storage quota / restricted mode errors
  }
}
