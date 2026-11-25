import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/auth/session';
import {
  deleteUserAccountAndData,
  getUserPersistedData,
  saveUserPersistedData,
} from '@/lib/auth/user-store';
import { householdProfileSchema, plantSchema } from '@/lib/validation/schemas';
import { parseJsonBody, handleUnexpectedRouteError } from '@/lib/api/route-utils';

const locationPayloadSchema = z.object({
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  localArea: z.string().optional(),
  timezone: z.string().optional(),
});

const profileSyncSchema = z.object({
  householdProfile: householdProfileSchema.extend({
    id: z.string().optional(),
    userId: z.string().optional(),
    profileCompletionPercent: z.number().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  }).nullable().optional(),
  plants: z.array(
    plantSchema.extend({
      id: z.string().optional(),
      householdId: z.string().optional(),
    })
  ).optional(),
  location: locationPayloadSchema.nullable().optional(),
});

export async function GET() {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { authenticated: false, householdProfile: null, plants: [], location: null },
        { status: 200 }
      );
    }

    const data = await getUserPersistedData(user.id);
    return NextResponse.json(
      {
        authenticated: true,
        user,
        householdProfile: data.householdProfile,
        plants: data.plants,
        location: data.location,
        updatedAt: data.updatedAt,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return handleUnexpectedRouteError('GET /api/profile', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const bodyResult = await parseJsonBody(request, profileSyncSchema);
    if (!bodyResult.success) {
      return bodyResult.response;
    }

    const { user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { saved: false, authenticated: false, mode: 'guest' },
        { status: 200 }
      );
    }

    const now = new Date().toISOString();
    const { householdProfile, plants, location } = bodyResult.data;

    const normalizedProfile = householdProfile
      ? {
          id: householdProfile.id || crypto.randomUUID(),
          userId: user.id,
          city: householdProfile.city,
          environmentType: householdProfile.environmentType ?? null,
          transportMode: householdProfile.transportMode ?? null,
          dailyOutdoorHours: householdProfile.dailyOutdoorHours ?? null,
          outdoorTimings: householdProfile.outdoorTimings ?? null,
          propertyType: householdProfile.propertyType ?? null,
          isOwned: householdProfile.isOwned ?? null,
          totalFloors: householdProfile.totalFloors ?? null,
          floorNumber: householdProfile.floorNumber ?? null,
          bhk: householdProfile.bhk ?? null,
          approximateSize: householdProfile.approximateSize ?? null,
          hasBalcony: householdProfile.hasBalcony ?? null,
          hasGarden: householdProfile.hasGarden ?? null,
          hasProperVentilation: householdProfile.hasProperVentilation ?? null,
          windowsUsuallyOpen: householdProfile.windowsUsuallyOpen ?? null,
          nearbyFeatures: householdProfile.nearbyFeatures ?? [],
          hasAirPurifier: householdProfile.hasAirPurifier ?? null,
          hasAC: householdProfile.hasAC ?? null,
          hasExhaustFan: householdProfile.hasExhaustFan ?? null,
          cookingFuel: householdProfile.cookingFuel ?? null,
          isKitchenVentilated: householdProfile.isKitchenVentilated ?? null,
          burnsIncense: householdProfile.burnsIncense ?? null,
          experiencesDust: householdProfile.experiencesDust ?? null,
          profileCompletionPercent: householdProfile.profileCompletionPercent ?? 0,
          createdAt: householdProfile.createdAt || now,
          updatedAt: now,
        }
      : undefined;

    const normalizedPlants = plants
      ? plants.map((p) => ({
          id: p.id || crypto.randomUUID(),
          householdId: normalizedProfile?.id || user.id,
          name: p.name,
          type: p.type,
          location: p.location,
          notes: p.notes,
        }))
      : undefined;

    const saved = await saveUserPersistedData(user.id, {
      ...(normalizedProfile !== undefined ? { householdProfile: normalizedProfile } : {}),
      ...(normalizedPlants !== undefined ? { plants: normalizedPlants } : {}),
      ...(location !== undefined ? { location } : {}),
    });

    return NextResponse.json(
      {
        saved: true,
        authenticated: true,
        ...saved,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleUnexpectedRouteError('POST /api/profile', error);
  }
}

export async function DELETE() {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ deleted: true, mode: 'guest' }, { status: 200 });
    }

    await deleteUserAccountAndData(user.id);
    return NextResponse.json({ deleted: true, authenticated: true }, { status: 200 });
  } catch (error) {
    return handleUnexpectedRouteError('DELETE /api/profile', error);
  }
}
