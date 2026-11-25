import { z } from 'zod';

export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  city: z.string().optional(),
});

export const householdProfileSchema = z.object({
  city: z.string().min(1, 'City is required'),
  environmentType: z.enum(['urban', 'suburban', 'rural']).nullable().optional(),
  transportMode: z.enum(['bike', 'car', 'public_transport', 'walking', 'work_from_home']).nullable().optional(),
  dailyOutdoorHours: z.number().min(0).max(24).nullable().optional(),
  outdoorTimings: z.string().nullable().optional(),
  propertyType: z.enum(['apartment', 'independent_house', 'flat', 'villa', 'other']).nullable().optional(),
  isOwned: z.boolean().nullable().optional(),
  totalFloors: z.number().min(1).max(100).nullable().optional(),
  floorNumber: z.number().min(0).max(100).nullable().optional(),
  bhk: z.number().min(1).max(20).nullable().optional(),
  approximateSize: z.number().min(100).max(100000).nullable().optional(),
  hasBalcony: z.boolean().nullable().optional(),
  hasGarden: z.boolean().nullable().optional(),
  hasProperVentilation: z.boolean().nullable().optional(),
  windowsUsuallyOpen: z.boolean().nullable().optional(),
  nearbyFeatures: z.array(z.enum(['busy_road', 'industrial_area', 'construction_site', 'green_area', 'park', 'river', 'none'])).optional(),
  hasAirPurifier: z.boolean().nullable().optional(),
  hasAC: z.boolean().nullable().optional(),
  hasExhaustFan: z.boolean().nullable().optional(),
  cookingFuel: z.enum(['lpg', 'electric', 'induction', 'wood', 'piped_gas', 'other']).nullable().optional(),
  isKitchenVentilated: z.boolean().nullable().optional(),
  burnsIncense: z.boolean().nullable().optional(),
  experiencesDust: z.boolean().nullable().optional(),
});

export const plantSchema = z.object({
  name: z.string().min(1, 'Plant name is required'),
  type: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  notes: z.string().optional(),
});

export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
  conversationId: z.string().optional(),
});

export const notificationPreferencesSchema = z.object({
  enableAQIAlerts: z.boolean(),
  aqiThreshold: z.number().min(50).max(500),
  enablePM25Alerts: z.boolean(),
  pm25Threshold: z.number().min(10).max(500),
  enableFestivalAlerts: z.boolean(),
  festivalAlertDaysBefore: z.number().min(1).max(30),
  enableSeasonalAlerts: z.boolean(),
  enableForecastAlerts: z.boolean(),
});
