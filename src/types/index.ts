// ============================================================================
// Core Application Types
// ============================================================================

// --- Location Types ---
export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationInfo {
  coordinates: GeoCoordinates;
  city: string;
  state: string;
  country: string;
  localArea?: string;
  timezone?: string;
}

// --- AQI Standards ---
export type AQIStandard = 'india_cpcb' | 'us_epa' | 'european';

export interface AQICategory {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  min: number;
  max: number;
  healthImplication: string;
}

// --- Air Quality Types ---
export interface PollutantReading {
  name: string;
  shortName: string;
  value: number | null;
  unit: string;
  category?: string;
}

export interface AirQualityData {
  aqi: number;
  aqiStandard: AQIStandard;
  category: string;
  categoryColor: string;
  dominantPollutant: string;
  pollutants: {
    pm25: number | null;
    pm10: number | null;
    co: number | null;
    no2: number | null;
    so2: number | null;
    o3: number | null;
    dust?: number | null;
  };
  source: string;
  sourceType: 'monitoring_station' | 'modelled_estimate';
  stationName?: string;
  lastUpdated: string;
  dataFreshness: 'live' | 'recent' | 'stale' | 'unavailable';
}

export interface AirQualityForecast {
  date: string;
  aqi: number;
  pm25: number;
  pm10: number;
  o3: number;
  category: string;
}

export interface HourlyAirQuality {
  time: string;
  aqi: number;
  pm25: number;
  pm10: number;
}

// --- Weather Types ---
export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  precipitation: number;
  precipitationProbability: number;
  cloudCover: number;
  visibility?: number;
  weatherCode: number;
  weatherDescription: string;
  isDay: boolean;
  sunrise: string;
  sunset: string;
  uvIndex?: number;
  lastUpdated: string;
}

export interface WeatherForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number;
  weatherCode: number;
  weatherDescription: string;
  windSpeedMax: number;
  sunrise: string;
  sunset: string;
}

// --- Household Profile Types ---
export type PropertyType = 'apartment' | 'independent_house' | 'flat' | 'villa' | 'other';
export type TransportMode = 'bike' | 'car' | 'public_transport' | 'walking' | 'work_from_home';
export type EnvironmentType = 'urban' | 'suburban' | 'rural';
export type CookingFuel = 'lpg' | 'electric' | 'induction' | 'wood' | 'piped_gas' | 'other';
export type NearbyFeature = 'busy_road' | 'industrial_area' | 'construction_site' | 'green_area' | 'park' | 'river' | 'none';

export interface HouseholdProfile {
  id: string;
  userId: string;
  
  // Location & Lifestyle
  city: string;
  environmentType: EnvironmentType | null;
  transportMode: TransportMode | null;
  dailyOutdoorHours: number | null;
  outdoorTimings: string | null;
  
  // Property
  propertyType: PropertyType | null;
  isOwned: boolean | null;
  totalFloors: number | null;
  floorNumber: number | null;
  bhk: number | null;
  approximateSize: number | null;
  hasBalcony: boolean | null;
  hasGarden: boolean | null;
  hasProperVentilation: boolean | null;
  windowsUsuallyOpen: boolean | null;
  nearbyFeatures: NearbyFeature[];
  
  // Indoor Environment
  hasAirPurifier: boolean | null;
  hasAC: boolean | null;
  hasExhaustFan: boolean | null;
  cookingFuel: CookingFuel | null;
  isKitchenVentilated: boolean | null;
  burnsIncense: boolean | null;
  experiencesDust: boolean | null;
  
  // Profile completion
  profileCompletionPercent: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface HouseholdPlant {
  id: string;
  householdId: string;
  name: string;
  type?: string;
  location: string; // e.g., 'bedroom', 'living_room', 'balcony'
  airPurifyingRating?: string;
  notes?: string;
}

export interface HouseholdMember {
  id: string;
  householdId: string;
  relationship: string;
  ageGroup: 'infant' | 'child' | 'teenager' | 'adult' | 'senior';
  hasRespiratoryIssues: boolean;
  notes?: string;
}

// --- AI Recommendation Types ---
export interface AIRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  reason: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timing?: string;
  estimatedCost?: string;
  expectedBenefit?: string;
}

export interface ProductRecommendation {
  id: string;
  name: string;
  category: 'air_purifier' | 'mask' | 'air_monitor' | 'kitchen_ventilation';
  description: string;
  reason: string;
  url: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AIRecommendationResponse {
  air_quality_summary: string;
  risk_level: 'good' | 'satisfactory' | 'moderate' | 'poor' | 'very_poor' | 'severe';
  outdoor_recommendations: AIRecommendation[];
  indoor_recommendations: AIRecommendation[];
  plant_recommendations: AIRecommendation[];
  lifestyle_recommendations: AIRecommendation[];
  family_recommendations: AIRecommendation[];
  product_recommendations: ProductRecommendation[];
  upcoming_risks: Array<{
    event: string;
    date: string;
    riskLevel: string;
    description: string;
    preparations: string[];
  }>;
  priority_actions: Array<{
    action: string;
    reason: string;
    urgency: string;
  }>;
  explanation: string;
  data_sources: string[];
  generated_at: string;
  disclaimer: string;
}

// --- Chat Types ---
export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

// --- Festival Types ---
export interface FestivalEvent {
  id: string;
  name: string;
  date: string;
  endDate?: string;
  region: string;
  pollutionImpact: 'none' | 'low' | 'medium' | 'high' | 'very_high';
  pollutionType: string[];
  description: string;
  historicalAQIImpact?: {
    avgAQIBefore: number;
    avgAQIDuring: number;
    avgAQIAfter: number;
    peakAQI: number;
    recoveryDays: number;
  };
}

// --- Notification Types ---
export interface NotificationPreferences {
  userId: string;
  enableAQIAlerts: boolean;
  aqiThreshold: number;
  enablePM25Alerts: boolean;
  pm25Threshold: number;
  enableFestivalAlerts: boolean;
  festivalAlertDaysBefore: number;
  enableSeasonalAlerts: boolean;
  enableForecastAlerts: boolean;
}

export interface UserNotification {
  id: string;
  userId: string;
  type: 'aqi_alert' | 'pm25_alert' | 'festival_warning' | 'seasonal_warning' | 'forecast_alert';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

// --- Home Environment Score ---
export interface HomeEnvironmentScore {
  overall: number; // 0-100
  ventilation: number;
  airPurification: number;
  greenery: number;
  pollutionExposure: number;
  indoorSources: number;
  recommendations: string[];
  disclaimer: string;
}
