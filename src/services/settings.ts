export interface ParishSettingsRecord {
  parishName: string;
  denomination: string;
  foyerDesks: string[];
  qrRotationSeconds: number;
  geofenceEnabled: boolean;
  geofenceRadiusMeters: number;
  sanctuaryLatitude: number;
  sanctuaryLongitude: number;
  duplicateScanDefense: boolean;
  childMinorShieldEnabled: boolean;
  compressionProfile: string;
  updatedAt: string;
}

export interface UpdateParishSettingsInput {
  parishName?: string;
  denomination?: string;
  qrRotationSeconds?: number;
  geofenceEnabled?: boolean;
  geofenceRadiusMeters?: number;
  childMinorShieldEnabled?: boolean;
  compressionProfile?: string;
}

export interface GeofenceCheckResult {
  withinGeofence: boolean;
  distanceMeters: number;
  maxRadiusMeters: number;
}

const DEFAULT_PARISH_SETTINGS: ParishSettingsRecord = {
  parishName: "Grace Sanctuary Parish",
  denomination: "Redeemed Christian Church of God (RCCG)",
  foyerDesks: ["Door A (Main Entrance)", "Door B (Gallery Ramp)", "Foyer Desk #1 (Guest Lounge)"],
  qrRotationSeconds: 45,
  geofenceEnabled: true,
  geofenceRadiusMeters: 150,
  sanctuaryLatitude: 6.5244,
  sanctuaryLongitude: 3.3792,
  duplicateScanDefense: true,
  childMinorShieldEnabled: true,
  compressionProfile: "Lagos Mobile Mesh: WebP Lossy (85% Quality)",
  updatedAt: new Date("2026-11-17T03:00:00.000Z").toISOString(),
};

let currentSettings: ParishSettingsRecord = { ...DEFAULT_PARISH_SETTINGS };

export function resetParishSettingsForTests(): void {
  currentSettings = {
    ...DEFAULT_PARISH_SETTINGS,
    foyerDesks: [...DEFAULT_PARISH_SETTINGS.foyerDesks],
  };
}

export function getParishSettings(): ParishSettingsRecord {
  return {
    ...currentSettings,
    foyerDesks: [...currentSettings.foyerDesks],
  };
}

export function updateParishSettings(input: UpdateParishSettingsInput): ParishSettingsRecord {
  currentSettings = {
    ...currentSettings,
    ...(input.parishName !== undefined ? { parishName: input.parishName.trim() } : {}),
    ...(input.denomination !== undefined ? { denomination: input.denomination.trim() } : {}),
    ...(input.qrRotationSeconds !== undefined
      ? { qrRotationSeconds: input.qrRotationSeconds }
      : {}),
    ...(input.geofenceEnabled !== undefined ? { geofenceEnabled: input.geofenceEnabled } : {}),
    ...(input.geofenceRadiusMeters !== undefined
      ? { geofenceRadiusMeters: input.geofenceRadiusMeters }
      : {}),
    ...(input.childMinorShieldEnabled !== undefined
      ? { childMinorShieldEnabled: input.childMinorShieldEnabled }
      : {}),
    ...(input.compressionProfile !== undefined
      ? { compressionProfile: input.compressionProfile }
      : {}),
    updatedAt: new Date().toISOString(),
  };

  return getParishSettings();
}

/**
 * Computes great-circle Haversine distance in meters between two WGS84 coordinates.
 */
export function computeDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }
  const earthRadiusMeters = 6_371_000;
  const toRadians = (deg: number): number => (deg * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadiusMeters * c);
}

export function verifySanctuaryGeofence(coords: {
  latitude: number;
  longitude: number;
}): GeofenceCheckResult {
  const distanceMeters = computeDistanceMeters(
    currentSettings.sanctuaryLatitude,
    currentSettings.sanctuaryLongitude,
    coords.latitude,
    coords.longitude,
  );

  if (!currentSettings.geofenceEnabled) {
    return {
      withinGeofence: true,
      distanceMeters,
      maxRadiusMeters: currentSettings.geofenceRadiusMeters,
    };
  }

  return {
    withinGeofence: distanceMeters <= currentSettings.geofenceRadiusMeters,
    distanceMeters,
    maxRadiusMeters: currentSettings.geofenceRadiusMeters,
  };
}
