import http from 'node:http';
import { pathToFileURL } from 'node:url';
import {
  distanceMeters, normalizeBusArrivals, normalizeBusStops,
  normalizeRailArrivals, normalizeStations, searchPlaces,
} from './normalize.mjs';

const WMATA_BASE = 'https://api.wmata.com';
// This key is explicitly published by WMATA for limited developer testing only.
const PUBLIC_TEST_KEY = 'e13626d03d8e4c03ac07f95541b3091b';
const cache = new Map();
const inflight = new Map();
const requestsByIp = new Map();

async function fetchWmata(path, params = {}, ttlMs = 25_000) {
  const key = process.env.WMATA_API_KEY || (process.env.NODE_ENV !== 'production' ? PUBLIC_TEST_KEY : '');
  if (!key) throw Object.assign(new Error('The production WMATA API key is not configured.'), { status: 503 });

  const url = new URL(path, WMATA_BASE);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, String(value));
  const cacheKey = url.toString();
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.data;
  if (inflight.has(cacheKey)) return inflight.get(cacheKey);

  const pending = (async () => {
    const response = await fetch(url, {
      headers: { api_key: key, Accept: 'application/json' },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      const status = response.status === 429 ? 429 : 502;
      throw Object.assign(new Error(response.status === 429
        ? 'WMATA is rate limiting requests. Please try again shortly.'
        : `WMATA is temporarily unavailable (${response.status}).`), { status });
    }
    const data = await response.json();
    cache.set(cacheKey, { data, expires: Date.now() + ttlMs });
    return data;
  })();

  inflight.set(cacheKey, pending);
  try { return await pending; }
  finally { inflight.delete(cacheKey); }
}

async function stations(getJson) {
  return normalizeStations(await getJson('/Rail.svc/json/jStations', {}, 86_400_000));
}

async function busStops(getJson) {
  return normalizeBusStops(await getJson('/Bus.svc/json/jStops', {}, 3_600_000));
}

function json(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(data));
}

function validateCoordinates(rawLat, rawLon) {
  const lat = Number(rawLat);
  const lon = Number(rawLon);
  if (!rawLat || !rawLon || !Number.isFinite(lat) || !Number.isFinite(lon) ||
      lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw Object.assign(new Error('Valid latitude and longitude are required.'), { status: 400 });
  }
  return { lat, lon };
}

function throttle(req) {
  const ip = req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const previous = requestsByIp.get(ip);
  const item = previous && previous.until > now ? previous : { count: 0, until: now + 60_000 };
  item.count += 1;
  requestsByIp.set(ip, item);
  if (requestsByIp.size > 1000) {
    for (const [address, value] of requestsByIp) if (value.until < now) requestsByIp.delete(address);
  }
  return item.count > 120;
}

export function createHandler(getJson = fetchWmata) {
  return async (req, res) => {
    if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed.' });
    if (throttle(req)) return json(res, 429, { error: 'Too many requests. Wait a minute and retry.' });

    try {
      const url = new URL(req.url, 'http://localhost');
      const path = url.pathname;

      if (path === '/api/health') return json(res, 200, { ok: true, service: 'Capitol Arrivals' });

      if (path === '/api/popular') {
        const items = await stations(getJson);
        const ids = ['A01', 'B01', 'A03', 'B03', 'C04'];
        const chosen = ids.map((id) => items.find((place) => place.codes.includes(id))).filter(Boolean);
        return json(res, 200, { places: chosen });
      }

      if (path === '/api/search') {
        const query = (url.searchParams.get('q') || '').trim().slice(0, 80);
        if (query.length < 2) return json(res, 200, { places: [] });
        const [rail, bus] = await Promise.all([stations(getJson), busStops(getJson)]);
        return json(res, 200, { places: searchPlaces([...rail, ...bus], query) });
      }

      if (path === '/api/nearby') {
        const { lat, lon } = validateCoordinates(url.searchParams.get('lat'), url.searchParams.get('lon'));
        const [rail, rawBus] = await Promise.all([
          stations(getJson),
          getJson('/Bus.svc/json/jStops', { Lat: lat, Lon: lon, Radius: 1600 }, 60_000),
        ]);
        const bus = normalizeBusStops(rawBus);
        const measured = [...rail, ...bus]
          .map((place) => ({ ...place, distanceMeters: Math.round(distanceMeters(lat, lon, place.lat, place.lon)) }))
          .filter((place) => place.distanceMeters <= (place.kind === 'bus' ? 1600 : 3000))
          .sort((a, b) => a.distanceMeters - b.distanceMeters);
        const places = [
          ...measured.filter((place) => place.kind === 'rail').slice(0, 8),
          ...measured.filter((place) => place.kind === 'bus').slice(0, 24),
        ];
        return json(res, 200, { places });
      }

      if (path === '/api/arrivals') {
        const kind = url.searchParams.get('kind');
        const id = url.searchParams.get('id') || '';
        if (kind !== 'rail' && kind !== 'bus')
          throw Object.assign(new Error('kind must be rail or bus.'), { status: 400 });
        if (!(kind === 'rail' ? /^[A-Z]\d{2}$/ : /^\d{5,8}$/).test(id))
          throw Object.assign(new Error('Invalid stop or station identifier.'), { status: 400 });

        if (kind === 'bus') {
          const payload = await getJson('/NextBusService.svc/json/jPredictions', { StopID: id }, 20_000);
          return json(res, 200, {
            arrivals: normalizeBusArrivals(payload),
            updatedAt: new Date().toISOString(),
          });
        }

        const rail = await stations(getJson);
        const station = rail.find((place) => place.codes.includes(id));
        const stationCodes = station?.codes.join(',') || id;
        const payload = await getJson(`/StationPrediction.svc/json/GetPrediction/${stationCodes}`, {}, 20_000);
        return json(res, 200, {
          arrivals: normalizeRailArrivals(payload),
          updatedAt: new Date().toISOString(),
        });
      }

      return json(res, 404, { error: 'Route not found.' });
    } catch (error) {
      const status = error?.status || (error?.name === 'TimeoutError' ? 504 : 502);
      console.error(`[transit] ${error?.message || 'Request failed'}`);
      return json(res, status, { error: error?.message || 'Transit information is temporarily unavailable.' });
    }
  };
}

const isDirectInvocation = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectInvocation) {
  const port = Number(process.env.PORT || 8787);
  http.createServer(createHandler()).listen(port, '0.0.0.0', () => {
    console.log(`Capitol Arrivals backend listening on http://localhost:${port}`);
    if (!process.env.WMATA_API_KEY)
      console.log('Using WMATA public test key. Set WMATA_API_KEY before production deployment.');
  });
}
