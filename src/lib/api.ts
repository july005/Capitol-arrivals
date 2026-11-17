import Constants from 'expo-constants';
import type { ArrivalsResponse, Place, TransitKind } from './types';

function getBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  // In development Expo serves the bundle from the laptop's LAN address.
  // Reuse that address so the physical iPhone can reach the local Node server.
  if (__DEV__) {
    const uri = Constants.expoConfig?.hostUri ?? '';
    const host = uri.replace(/^https?:\/\//, '').split(':')[0];
    if (/^(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.)/.test(host)) {
      return `http://${host}:8787`;
    }
  }
  // Never accidentally ship a store build pointed at the user's own phone.
  return __DEV__ ? 'http://localhost:8787' : '';
}

export const API_BASE_URL = getBaseUrl();

async function get<T>(path: string): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('The production transit server is not configured. Set EXPO_PUBLIC_API_BASE_URL before building the app.');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 14_000);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload.error || `Transit server returned ${res.status}.`);
    return payload as T;
  } catch (error) {
    if (error instanceof TypeError || (error instanceof Error && error.name === 'AbortError')) {
      throw new Error('Cannot reach the transit server. Check that it is running and your phone is on the same Wi-Fi, or configure EXPO_PUBLIC_API_BASE_URL.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export const transitApi = {
  popular: async () => (await get<{ places: Place[] }>('/api/popular')).places,
  search: async (query: string) =>
    (await get<{ places: Place[] }>(`/api/search?q=${encodeURIComponent(query)}`)).places,
  nearby: async (lat: number, lon: number) =>
    (await get<{ places: Place[] }>(`/api/nearby?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`)).places,
  arrivals: (kind: TransitKind, id: string) =>
    get<ArrivalsResponse>(`/api/arrivals?kind=${kind}&id=${encodeURIComponent(id)}`),
};
