const RAIL_LINE_NAMES = {
  RD: 'Red', OR: 'Orange', SV: 'Silver', BL: 'Blue', YL: 'Yellow', GR: 'Green',
};

export function railLineName(code) {
  return RAIL_LINE_NAMES[code] ?? code ?? 'Train';
}

export function normalizeStations(payload) {
  const stations = Array.isArray(payload?.Stations) ? payload.Stations : [];
  const byName = new Map();

  for (const station of stations) {
    if (!station?.Code || !station?.Name) continue;
    const name = String(station.Name).trim();
    const key = name.toLocaleLowerCase('en-US');
    const codes = [station.Code, station.StationTogether1, station.StationTogether2]
      .filter((value) => typeof value === 'string' && value.length > 0);
    const lines = [station.LineCode1, station.LineCode2, station.LineCode3, station.LineCode4]
      .filter((value) => typeof value === 'string' && value.length > 0);
    const existing = byName.get(key);

    if (existing) {
      existing.codes = [...new Set([...existing.codes, ...codes])];
      existing.lines = [...new Set([...existing.lines, ...lines])];
      continue;
    }

    byName.set(key, {
      kind: 'rail',
      id: String(station.Code),
      name,
      subtitle: 'Metro station',
      lat: Number(station.Lat),
      lon: Number(station.Lon),
      codes: [...new Set(codes)],
      lines: [...new Set(lines)],
      routes: [],
    });
  }

  return [...byName.values()].filter((place) =>
    Number.isFinite(place.lat) && Number.isFinite(place.lon)
  ).sort((a, b) => a.name.localeCompare(b.name));
}

export function normalizeBusStops(payload) {
  const stops = Array.isArray(payload?.Stops) ? payload.Stops : [];
  return stops
    .filter((stop) => stop?.StopID && String(stop.StopID) !== '0' && stop?.Name)
    .map((stop) => ({
      kind: 'bus',
      id: String(stop.StopID),
      name: String(stop.Name).trim(),
      subtitle: 'Metrobus stop',
      lat: Number(stop.Lat),
      lon: Number(stop.Lon),
      routes: Array.isArray(stop.Routes)
        ? [...new Set(stop.Routes.map((route) => String(route).replace(/v\d+$/i, '')))]
        : [],
      codes: [],
      lines: [],
    }))
    .filter((stop) => Number.isFinite(stop.lat) && Number.isFinite(stop.lon));
}

function railMinutes(raw) {
  const value = String(raw ?? '---').trim().toUpperCase();
  if (/^\d+$/.test(value)) return { minutes: Number(value), minuteLabel: value };
  if (value === 'ARR') return { minutes: 0, minuteLabel: 'ARR' };
  if (value === 'BRD') return { minutes: 0, minuteLabel: 'BRD' };
  return { minutes: null, minuteLabel: '—' };
}

export function normalizeRailArrivals(payload) {
  return (Array.isArray(payload?.Trains) ? payload.Trains : []).map((train, index) => ({
    id: `${train.LocationCode ?? ''}-${train.Line ?? ''}-${train.DestinationCode ?? ''}-${index}`,
    route: String(train.Line ?? '').trim() || '—',
    destination: String(train.DestinationName || train.Destination || 'Destination unavailable'),
    platform: train.Group ? `Track ${train.Group}` : undefined,
    ...railMinutes(train.Min),
  })).sort(compareArrivals);
}

export function normalizeBusArrivals(payload) {
  return (Array.isArray(payload?.Predictions) ? payload.Predictions : []).map((bus, index) => {
    const minutes = Number(bus.Minutes);
    const validMinutes = bus.Minutes !== null && bus.Minutes !== undefined && Number.isFinite(minutes);
    return {
      id: `${bus.TripID ?? 'trip'}-${index}`,
      route: String(bus.RouteID || 'Bus'),
      destination: String(bus.DirectionText || 'Destination unavailable'),
      minutes: validMinutes ? Math.max(0, minutes) : null,
      minuteLabel: validMinutes ? String(Math.max(0, minutes)) : '—',
    };
  }).sort(compareArrivals);
}

function compareArrivals(a, b) {
  return (a.minutes ?? Infinity) - (b.minutes ?? Infinity);
}

export function distanceMeters(lat1, lon1, lat2, lon2) {
  const rad = (degrees) => degrees * Math.PI / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function searchPlaces(places, query, limit = 40) {
  const text = String(query ?? '').trim().toLocaleLowerCase('en-US');
  if (text.length < 2) return [];
  return places
    .map((place) => {
      const name = place.name.toLocaleLowerCase('en-US');
      const routeHit = place.routes.some((route) => route.toLocaleLowerCase('en-US') === text);
      const score = place.id.toLowerCase() === text ? 0 :
        name === text ? 1 :
        name.startsWith(text) ? 2 :
        name.split(/\W+/).some((word) => word.startsWith(text)) ? 3 :
        name.includes(text) ? 4 :
        routeHit ? 5 : Infinity;
      return { place, score };
    })
    .filter(({ score }) => Number.isFinite(score))
    .sort((a, b) => a.score - b.score ||
      (a.place.kind === 'rail' ? -1 : 1) - (b.place.kind === 'rail' ? -1 : 1) ||
      a.place.name.localeCompare(b.place.name))
    .slice(0, limit)
    .map(({ place }) => place);
}
