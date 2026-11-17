import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Page } from '@/components/Page';
import { ArrivalRow } from '@/components/ArrivalRow';
import { ActionButton, Eyebrow, MessagePanel, SectionHeading } from '@/components/Controls';
import { transitApi } from '@/lib/api';
import type { Arrival, Place, TransitKind } from '@/lib/types';
import { useFavorites } from '@/state/FavoritesProvider';
import { colors, railColors } from '@/theme';

function split(value: string | string[] | undefined) {
  return typeof value === 'string' && value.length ? value.split(',').filter(Boolean) : [];
}

export default function PlaceScreen() {
  const params = useLocalSearchParams<{
    kind: TransitKind; id: string; name?: string; lat?: string; lon?: string;
    codes?: string; lines?: string; routes?: string;
  }>();
  const kind: TransitKind = params.kind === 'bus' ? 'bus' : 'rail';
  const id = typeof params.id === 'string' ? params.id : '';
  const place = useMemo<Place>(() => ({
    kind, id, name: params.name || `Stop ${id}`,
    subtitle: kind === 'rail' ? 'Metro station' : 'Metrobus stop',
    lat: Number(params.lat || 0), lon: Number(params.lon || 0),
    codes: split(params.codes), lines: split(params.lines), routes: split(params.routes),
  }), [kind, id, params.name, params.lat, params.lon, params.codes, params.lines, params.routes]);

  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(kind, id);
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    else setRefreshing(true);
    try {
      const response = await transitApi.arrivals(kind, id);
      setArrivals(response.arrivals);
      setUpdatedAt(response.updatedAt);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to get current arrivals.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [kind, id]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    transitApi.arrivals(kind, id)
      .then((response) => {
        if (!active) return;
        setArrivals(response.arrivals);
        setUpdatedAt(response.updatedAt);
        setError(null);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to get current arrivals.');
      })
      .finally(() => { if (active) setLoading(false); });
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void refresh();
    }, 30_000);
    return () => { active = false; clearInterval(timer); };
  }, [kind, id, refresh]);

  return (
    <Page>
      <View style={styles.topRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.circleButton}>
          <Ionicons name="arrow-back" color={colors.text} size={21} />
        </Pressable>
        <Text style={styles.pageLabel}>LIVE ARRIVALS</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={favorite ? 'Remove from favorites' : 'Add to favorites'} onPress={() => toggleFavorite(place)} style={styles.circleButton}>
          <Ionicons name={favorite ? 'star' : 'star-outline'} color={favorite ? colors.accent : colors.text} size={22} />
        </Pressable>
      </View>

      <View style={styles.placeHeader}>
        <View style={styles.kindIcon}><Ionicons name={kind === 'rail' ? 'train' : 'bus'} size={27} color={colors.accent} /></View>
        <Eyebrow>{kind === 'rail' ? 'METRORAIL STATION' : 'METROBUS STOP'}</Eyebrow>
        <Text style={styles.placeName}>{place.name}</Text>
        {kind === 'rail' ? <View style={styles.lines}>
          {place.lines.map((code) => <View key={code} style={[styles.lineCircle, { backgroundColor: railColors[code] ?? colors.subtle }]}><Text style={styles.lineCircleText}>{code}</Text></View>)}
        </View> : <Text style={styles.routes}>{place.routes.length ? `Routes: ${place.routes.slice(0, 6).join(' · ')}` : `Stop ID ${id}`}</Text>}
      </View>

      <View style={styles.liveHeader}>
        <View><SectionHeading title={kind === 'rail' ? 'Next trains' : 'Next buses'} trailing={undefined} /><Text style={styles.liveMeta}>{updatedAt ? `Updated ${new Date(updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}` : 'Waiting for predictions'}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Refresh arrival times" disabled={refreshing} onPress={() => void refresh()} style={styles.refreshButton}>
          {refreshing ? <ActivityIndicator color={colors.accent} size="small" /> : <Ionicons name="refresh" color={colors.accent} size={20} />}
        </Pressable>
      </View>

      {loading ? <View style={styles.loading}><ActivityIndicator color={colors.accent} /><Text style={styles.loadingText}>Checking live arrivals…</Text></View> :
        arrivals.length ? arrivals.map((arrival) => <ArrivalRow key={arrival.id} arrival={arrival} kind={kind} />) :
          <MessagePanel icon="time-outline" title="No predictions available" message="WMATA is not currently reporting arrivals for this stop. Check back shortly—absence of a prediction doesn't mean no vehicle is coming." />}
      {error ? <View style={styles.error}>
        <Text style={styles.errorText}>{error}{updatedAt ? ' Showing the last retrieved predictions.' : ''}</Text>
        <ActionButton label="Try again" secondary icon="refresh" onPress={() => void refresh()} />
      </View> : null}
      <View style={styles.disclaimer}>
        <Ionicons name="information-circle-outline" color={colors.subtle} size={18} />
        <Text style={styles.disclaimerText}>Times are estimates supplied by WMATA and may change without notice. This app is independent of WMATA. Predictions refresh every 30 seconds while this screen is open.</Text>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  circleButton: { width: 45, height: 45, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  pageLabel: { color: colors.muted, letterSpacing: 2, fontWeight: '800', fontSize: 11 },
  placeHeader: { marginTop: 29, marginBottom: 28, gap: 10 },
  kindIcon: { height: 56, width: 56, borderRadius: 18, backgroundColor: colors.accentDark, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  placeName: { color: colors.text, fontSize: 34, lineHeight: 40, fontWeight: '900', letterSpacing: -1.1 },
  lines: { flexDirection: 'row', gap: 7, marginTop: 2 },
  lineCircle: { height: 32, minWidth: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  lineCircleText: { fontSize: 10, color: '#102633', fontWeight: '900' },
  routes: { color: colors.muted, fontSize: 13, marginTop: 4 },
  liveHeader: { marginBottom: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveMeta: { color: colors.subtle, fontSize: 12, marginTop: -6 },
  refreshButton: { height: 42, width: 42, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  loading: { paddingVertical: 32, gap: 12, alignItems: 'center' },
  loadingText: { color: colors.muted, fontSize: 12 },
  error: { gap: 12, marginTop: 16 },
  errorText: { color: colors.error, fontSize: 12, lineHeight: 18 },
  disclaimer: { flexDirection: 'row', gap: 10, padding: 17, borderRadius: 15, backgroundColor: colors.surface, marginTop: 22, marginBottom: 10 },
  disclaimerText: { flex: 1, color: colors.muted, fontSize: 11, lineHeight: 17 },
});
