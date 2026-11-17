import { router } from 'expo-router';
import type { Place } from './types';

export function openPlace(place: Place) {
  router.push({
    pathname: '/place/[kind]/[id]',
    params: {
      kind: place.kind,
      id: place.id,
      name: place.name,
      lat: String(place.lat),
      lon: String(place.lon),
      routes: place.routes.join(','),
      lines: place.lines.join(','),
      codes: place.codes.join(','),
    },
  });
}
