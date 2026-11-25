// Database schema for Supabase PostgreSQL with Drizzle ORM
// Run migrations with: npx drizzle-kit push

import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, real, varchar, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const aqiStandardEnum = pgEnum('aqi_standard', ['india_cpcb', 'us_epa', 'european']);
export const propertyTypeEnum = pgEnum('property_type', ['apartment', 'independent_house', 'flat', 'villa', 'other']);
export const transportModeEnum = pgEnum('transport_mode', ['bike', 'car', 'public_transport', 'walking', 'work_from_home']);
export const environmentTypeEnum = pgEnum('environment_type', ['urban', 'suburban', 'rural']);
export const cookingFuelEnum = pgEnum('cooking_fuel', ['lpg', 'electric', 'induction', 'wood', 'piped_gas', 'other']);
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant', 'system']);
export const notificationTypeEnum = pgEnum('notification_type', ['aqi_alert', 'pm25_alert', 'festival_warning', 'seasonal_warning', 'forecast_alert']);
export const severityEnum = pgEnum('severity', ['info', 'warning', 'critical']);

// Users / Profiles
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  authId: text('auth_id').unique().notNull(),
  email: text('email'),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  preferredAqiStandard: aqiStandardEnum('preferred_aqi_standard').default('india_cpcb'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// User Locations
export const userLocations = pgTable('user_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  city: text('city').notNull(),
  state: text('state'),
  country: text('country'),
  localArea: text('local_area'),
  isPrimary: boolean('is_primary').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Household Profiles
export const householdProfiles = pgTable('household_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull().unique(),
  
  // Location & Lifestyle
  city: text('city').notNull(),
  environmentType: environmentTypeEnum('environment_type'),
  transportMode: transportModeEnum('transport_mode'),
  dailyOutdoorHours: real('daily_outdoor_hours'),
  outdoorTimings: text('outdoor_timings'),
  
  // Property
  propertyType: propertyTypeEnum('property_type'),
  isOwned: boolean('is_owned'),
  totalFloors: integer('total_floors'),
  floorNumber: integer('floor_number'),
  bhk: integer('bhk'),
  approximateSize: integer('approximate_size'),
  hasBalcony: boolean('has_balcony'),
  hasGarden: boolean('has_garden'),
  hasProperVentilation: boolean('has_proper_ventilation'),
  windowsUsuallyOpen: boolean('windows_usually_open'),
  nearbyFeatures: jsonb('nearby_features').$type<string[]>().default([]),
  
  // Indoor
  hasAirPurifier: boolean('has_air_purifier'),
  hasAC: boolean('has_ac'),
  hasExhaustFan: boolean('has_exhaust_fan'),
  cookingFuel: cookingFuelEnum('cooking_fuel'),
  isKitchenVentilated: boolean('is_kitchen_ventilated'),
  burnsIncense: boolean('burns_incense'),
  experiencesDust: boolean('experiences_dust'),
  
  profileCompletionPercent: integer('profile_completion_percent').default(0),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Household Plants
export const householdPlants = pgTable('household_plants', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').references(() => householdProfiles.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  type: text('type'),
  location: text('location').notNull(),
  airPurifyingRating: text('air_purifying_rating'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Household Members
export const householdMembers = pgTable('household_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').references(() => householdProfiles.id, { onDelete: 'cascade' }).notNull(),
  relationship: text('relationship').notNull(),
  ageGroup: text('age_group').notNull(), // infant, child, teenager, adult, senior
  hasRespiratoryIssues: boolean('has_respiratory_issues').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Chat Conversations
export const chatConversations = pgTable('chat_conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').default('New Conversation'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Chat Messages
export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => chatConversations.id, { onDelete: 'cascade' }).notNull(),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// AI Recommendations (cached)
export const aiRecommendations = pgTable('ai_recommendations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  locationCity: text('location_city').notNull(),
  aqiAtGeneration: integer('aqi_at_generation'),
  recommendations: jsonb('recommendations').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Notification Preferences
export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull().unique(),
  enableAqiAlerts: boolean('enable_aqi_alerts').default(true),
  aqiThreshold: integer('aqi_threshold').default(200),
  enablePm25Alerts: boolean('enable_pm25_alerts').default(true),
  pm25Threshold: integer('pm25_threshold').default(60),
  enableFestivalAlerts: boolean('enable_festival_alerts').default(true),
  festivalAlertDaysBefore: integer('festival_alert_days_before').default(7),
  enableSeasonalAlerts: boolean('enable_seasonal_alerts').default(true),
  enableForecastAlerts: boolean('enable_forecast_alerts').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// User Notifications
export const userNotifications = pgTable('user_notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  severity: severityEnum('severity').default('info'),
  isRead: boolean('is_read').default(false),
  data: jsonb('data'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Festival Events
export const festivalEvents = pgTable('festival_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  date: text('date').notNull(),
  endDate: text('end_date'),
  region: text('region').notNull(),
  pollutionImpact: text('pollution_impact').notNull(),
  pollutionTypes: jsonb('pollution_types').$type<string[]>().default([]),
  description: text('description'),
  historicalAqiImpact: jsonb('historical_aqi_impact'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Environmental Observations Cache
export const environmentalObservations = pgTable('environmental_observations', {
  id: uuid('id').primaryKey().defaultRandom(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  city: text('city'),
  aqi: integer('aqi'),
  pm25: real('pm25'),
  pm10: real('pm10'),
  co: real('co'),
  no2: real('no2'),
  so2: real('so2'),
  o3: real('o3'),
  temperature: real('temperature'),
  humidity: real('humidity'),
  windSpeed: real('wind_speed'),
  source: text('source'),
  sourceType: text('source_type'),
  observedAt: timestamp('observed_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
