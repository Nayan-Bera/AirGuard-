import { describe, it, expect } from 'vitest';
import {
  pm25ToAQI_CPCB,
  pm10ToAQI_CPCB,
  calculateCPCB_AQI,
  getAQIColor,
} from '@/lib/utils/index';
import { retrieveTrustedKnowledge } from '@/lib/rag/knowledge-base';
import { calculateHomeEnvironmentScore } from '@/services/recommendations';
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '@/lib/auth/jwt';
import { householdProfileSchema, locationSchema } from '@/lib/validation/schemas';
import type { HouseholdProfile } from '@/types';

describe('CPCB AQI Calculations', () => {
  it('calculates Good AQI for low PM2.5', () => {
    expect(pm25ToAQI_CPCB(15)).toBe(25);
    expect(getAQIColor(25).label).toBe('Good');
  });

  it('calculates Severe AQI for extreme PM2.5', () => {
    const aqi = pm25ToAQI_CPCB(350);
    expect(aqi).toBeGreaterThanOrEqual(401);
    expect(getAQIColor(aqi).label).toBe('Severe');
  });

  it('selects dominant pollutant across PM2.5 and PM10', () => {
    const res = calculateCPCB_AQI({ pm25: 95, pm10: 120 });
    expect(res.dominantPollutant).toBe('PM2.5');
    expect(res.aqi).toBe(pm25ToAQI_CPCB(95));
    expect(pm10ToAQI_CPCB(100)).toBe(100);
  });
});

describe('RAG Knowledge Base Retrieval', () => {
  it('retrieves plant limitation guidance for plant queries', () => {
    const docs = retrieveTrustedKnowledge('can indoor plants replace my air purifier for PM2.5?', 2);
    expect(docs.length).toBeGreaterThan(0);
    expect(docs[0].document.id).toBe('plants-limitations');
  });

  it('retrieves respirator guidance for N95 queries', () => {
    const docs = retrieveTrustedKnowledge('should I wear an N95 mask while riding my bike?', 2);
    expect(docs.some((d) => d.document.id === 'respirator-n95-guidance')).toBe(true);
  });
});

describe('Home Environment Score', () => {
  it('computes bounded 0-100 score and includes disclaimer', () => {
    const profile: HouseholdProfile = {
      id: 'h1',
      userId: 'u1',
      city: 'New Delhi',
      environmentType: 'urban',
      transportMode: 'bike',
      dailyOutdoorHours: 2,
      outdoorTimings: '09:00',
      propertyType: 'apartment',
      isOwned: false,
      totalFloors: 8,
      floorNumber: 5,
      bhk: 2,
      approximateSize: 1000,
      hasBalcony: true,
      hasGarden: false,
      hasProperVentilation: true,
      windowsUsuallyOpen: false,
      nearbyFeatures: ['busy_road'],
      hasAirPurifier: true,
      hasAC: true,
      hasExhaustFan: true,
      cookingFuel: 'lpg',
      isKitchenVentilated: true,
      burnsIncense: false,
      experiencesDust: false,
      profileCompletionPercent: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const score = calculateHomeEnvironmentScore(profile, [], 250);
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(100);
    expect(score.disclaimer).toContain('not a measured indoor air quality value');
  });
});

describe('Manual JWT & Password Hashing', () => {
  it('hashes and verifies passwords securely', () => {
    const hash = hashPassword('MySecretPass123!');
    expect(verifyPassword('MySecretPass123!', hash)).toBe(true);
    expect(verifyPassword('WrongPassword', hash)).toBe(false);
  });

  it('signs and verifies access and refresh JWTs', async () => {
    const access = await signAccessToken({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Test User',
    });
    const accessPayload = await verifyAccessToken(access);
    expect(accessPayload?.sub).toBe('user-1');
    expect(accessPayload?.type).toBe('access');

    const refresh = await signRefreshToken('user-1', 'jti-123');
    const refreshPayload = await verifyRefreshToken(refresh);
    expect(refreshPayload?.sub).toBe('user-1');
    expect(refreshPayload?.jti).toBe('jti-123');
    expect(refreshPayload?.type).toBe('refresh');
  });
});

describe('Zod Validation Schemas', () => {
  it('validates coordinates and rejects out-of-range latitude', () => {
    expect(locationSchema.safeParse({ latitude: 28.61, longitude: 77.2 }).success).toBe(true);
    expect(locationSchema.safeParse({ latitude: 120, longitude: 77.2 }).success).toBe(false);
  });

  it('validates household profile input', () => {
    expect(householdProfileSchema.safeParse({ city: 'Mumbai', bhk: 2 }).success).toBe(true);
    expect(householdProfileSchema.safeParse({ city: '' }).success).toBe(false);
  });
});
