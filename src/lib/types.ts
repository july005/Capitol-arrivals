export type TransitKind = 'rail' | 'bus';

export type Place = {
  kind: TransitKind;
  id: string;
  name: string;
  subtitle: string;
  lat: number;
  lon: number;
  routes: string[];
  codes: string[];
  lines: string[];
  distanceMeters?: number;
};

export type Arrival = {
  id: string;
  route: string;
  destination: string;
  minutes: number | null;
  minuteLabel: string;
  platform?: string;
};

export type ArrivalsResponse = {
  arrivals: Arrival[];
  updatedAt: string;
};
