import assert from 'node:assert/strict';
import { test } from 'node:test';
import http from 'node:http';
import {
  distanceMeters, normalizeBusArrivals, normalizeBusStops,
  normalizeRailArrivals, normalizeStations, searchPlaces,
} from './normalize.mjs';
import { createHandler } from './index.mjs';

test('rail transfer stations merge both platforms and lines', () => {
  const stations = normalizeStations({ Stations: [
    { Code: 'A01', StationTogether1: 'C01', Name: 'Metro Center', Lat: 38.898, Lon: -77.028, LineCode1: 'RD' },
    { Code: 'C01', StationTogether1: 'A01', Name: 'Metro Center', Lat: 38.898, Lon: -77.028, LineCode1: 'BL', LineCode2: 'OR' },
  ] });
  assert.equal(stations.length, 1);
  assert.deepEqual(stations[0].codes, ['A01', 'C01']);
  assert.deepEqual(stations[0].lines, ['RD', 'BL', 'OR']);
});

test('rail arrivals preserve ARR, BRD and missing predictions', () => {
  const arrivals = normalizeRailArrivals({ Trains: [
    { Line: 'RD', Min: '---', DestinationName: 'Shady Grove' },
    { Line: 'RD', Min: 'BRD', DestinationName: 'Glenmont' },
    { Line: 'RD', Min: '5', DestinationName: 'Glenmont' },
    { Line: 'RD', Min: 'ARR', DestinationName: 'Glenmont' },
  ] });
  assert.deepEqual(arrivals.map((arrival) => arrival.minuteLabel), ['BRD', 'ARR', '5', '—']);
  assert.equal(arrivals.at(-1).minutes, null);
});

test('bus stops deduplicate route variants and reject missing stop ids', () => {
  const places = normalizeBusStops({ Stops: [
    { StopID: '1000001', Name: '14TH ST NW', Lat: 38.9, Lon: -77.04, Routes: ['D10', 'D10v1', 'D20'] },
    { StopID: null, Name: 'invalid', Lat: 38.9, Lon: -77.04 },
  ] });
  assert.deepEqual(places[0].routes, ['D10', 'D20']);
  assert.equal(places.length, 1);
});

test('bus predictions sort by numeric minutes', () => {
  const values = normalizeBusArrivals({ Predictions: [
    { RouteID: 'D10', Minutes: 12, DirectionText: 'East' },
    { RouteID: 'D10', Minutes: 3, DirectionText: 'East' },
  ] });
  assert.deepEqual(values.map((item) => item.minutes), [3, 12]);
});

test('search prioritizes station names, matches stop ids and routes', () => {
  const places = [
    { kind: 'rail', id: 'A01', name: 'Metro Center', routes: [] },
    { kind: 'bus', id: '1000001', name: 'Metro Bus Terminal', routes: ['D10'] },
    { kind: 'bus', id: '1000002', name: 'K St NW', routes: ['D10'] },
  ];
  assert.equal(searchPlaces(places, 'metro')[0].id, 'A01');
  assert.equal(searchPlaces(places, '1000001')[0].id, '1000001');
  assert.equal(searchPlaces(places, 'D10').length, 2);
});

test('distance is zero for same point and approximate for separated points', () => {
  assert.equal(distanceMeters(38.9, -77, 38.9, -77), 0);
  assert.ok(distanceMeters(38.9, -77, 38.91, -77) > 1000);
});

test('backend validates invalid arrivals input without touching WMATA', async () => {
  const handler = createHandler(async () => { throw Error('WMATA should not be called'); });
  let status;
  let body;
  const res = { writeHead(code) { status = code; }, end(value) { body = JSON.parse(value); } };
  await handler({ method: 'GET', url: '/api/arrivals?kind=rail&id=INVALID', socket: { remoteAddress: 'test-1' } }, res);
  assert.equal(status, 400);
  assert.match(body.error, /Invalid/);
});

test('backend serves search, nearby and live arrival shapes end to end', async (t) => {
  const mockWmata = async (path) => {
    if (path.includes('jStations')) return { Stations: [
      { Code: 'A01', StationTogether1: 'C01', Name: 'Metro Center', Lat: 38.898, Lon: -77.028, LineCode1: 'RD' },
      { Code: 'C01', StationTogether1: 'A01', Name: 'Metro Center', Lat: 38.898, Lon: -77.028, LineCode1: 'BL' },
    ] };
    if (path.includes('jStops')) return { Stops: [
      { StopID: '1000001', Name: '11th St NW', Lat: 38.899, Lon: -77.029, Routes: ['D10'] },
    ] };
    if (path.includes('GetPrediction')) return { Trains: [
      { Line: 'RD', Min: '4', DestinationName: 'Glenmont' },
    ] };
    if (path.includes('jPredictions')) return { Predictions: [
      { RouteID: 'D10', Minutes: 7, DirectionText: 'East to Minnesota Av' },
    ] };
    throw new Error(`Unexpected endpoint ${path}`);
  };

  const server = http.createServer(createHandler(mockWmata));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const get = async (url) => {
    const response = await fetch(base + url);
    assert.equal(response.status, 200);
    return response.json();
  };

  const search = await get('/api/search?q=metro');
  assert.equal(search.places.length, 1);
  assert.deepEqual(search.places[0].codes, ['A01', 'C01']);

  const nearby = await get('/api/nearby?lat=38.898&lon=-77.028');
  assert.equal(nearby.places.length, 2);
  assert.equal(nearby.places[0].kind, 'rail');

  const trains = await get('/api/arrivals?kind=rail&id=A01');
  assert.equal(trains.arrivals[0].destination, 'Glenmont');
  assert.ok(!Number.isNaN(Date.parse(trains.updatedAt)));

  const buses = await get('/api/arrivals?kind=bus&id=1000001');
  assert.equal(buses.arrivals[0].minutes, 7);
});
