import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Page } from '@/components/Page';
import { Brand } from '@/components/Brand';
import { ActionButton, Eyebrow, MessagePanel, SectionHeading } from '@/components/Controls';
import { PlaceRow } from '@/components/PlaceRow';
import { transitApi } from '@/lib/api';
import type { Place } from '@/lib/types';
import { colors } from '@/theme';

export default function NearbyScreen() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const findNearby = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const permissions = await Location.requestForegroundPermissionsAsync();
      if (permissions.status !== 'granted') {
        setStatus('error');
        setError('Location access is off. You can enable it in iPhone Settings or search for stops manually.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const found = await transitApi.nearby(position.coords.latitude, position.coords.longitude);
      setPlaces(found);
      setStatus('ready');
    } catch (reason) {
      setStatus('error');
      setError(reason instanceof Error ? reason.message : 'Could not find nearby stops.');
    }
  }, []);

  const rail = places.filter((place) => place.kind === 'rail');
  const bus = places.filter((place) => place.kind === 'bus');

  return (
    <Page>
      <Brand small />
      <View style={styles.heading}>
        <Eyebrow>AROUND YOU</Eyebrow>
        <Text style={styles.title}>Your next ride{'\n'}is close.</Text>
        <Text style={styles.subtitle}>Find Metro stations and bus stops near your current location.</Text>
      </View>
      <View style={styles.locationCard}>
        <View style={styles.locationIcon}><Ionicons name="location" size={26} color={colors.accent} /></View>
        <View style={styles.locationCopy}>
          <Text style={styles.locationTitle}>Nearby transit</Text>
          <Text style={styles.locationSubtitle}>Your location is used only when you tap the button.</Text>
        </View>
        <View style={{ width: '100%' }}><ActionButton label={status === 'ready' ? 'Update nearby stops' : 'Find stops near me'} icon="navigate" onPress={findNearby} loading={status === 'loading'} /></View>
      </View>

      {status === 'loading' ? <View style={styles.loading}><ActivityIndicator color={colors.accent} /><Text style={styles.loadingText}>Finding nearby stations and stops…</Text></View> : null}
      {status === 'idle' ? <MessagePanel icon="walk-outline" title="Explore what's nearby" message="You'll see the nearest bus stops and Metro stations, with walking distances, as soon as you choose to share your location." /> : null}
      {status === 'error' ? <MessagePanel icon="alert-circle-outline" title="Couldn't get nearby stops" message={error || 'Please try again.'} actionLabel="Search instead" onAction={() => router.push('/search')} /> : null}
      {status === 'ready' ? <View style={styles.results}>
        {rail.length ? <>
          <SectionHeading title="Metro stations" trailing={`${rail.length} nearby`} />
          {rail.map((place) => <PlaceRow key={`${place.kind}:${place.id}`} place={place} />)}
        </> : null}
        {bus.length ? <View style={styles.busSection}>
          <SectionHeading title="Bus stops" trailing={`${bus.length} nearby`} />
          {bus.map((place) => <PlaceRow key={`${place.kind}:${place.id}`} place={place} />)}
        </View> : null}
        {!places.length ? <MessagePanel icon="map-outline" title="No stops found here" message="Try again from another location or search by name." /> : null}
        <Pressable style={styles.privacyRow} accessibilityRole="button" onPress={() => router.push('/search')}>
          <Ionicons name="search-outline" color={colors.accent} size={17} />
          <Text style={styles.privacyText}>Looking for somewhere else? Search all stops</Text>
          <Ionicons name="arrow-forward" color={colors.accent} size={16} />
        </Pressable>
      </View> : null}
    </Page>
  );
}

const styles = StyleSheet.create({
  heading: { marginTop: 39, marginBottom: 24 },
  title: { color: colors.text, fontSize: 37, lineHeight: 42, fontWeight: '900', letterSpacing: -1.4, marginTop: 10 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 10 },
  locationCard: { borderRadius: 22, padding: 21, gap: 15, backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderWidth: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  locationIcon: { width: 54, height: 54, borderRadius: 17, backgroundColor: colors.accentDark, alignItems: 'center', justifyContent: 'center' },
  locationCopy: { flex: 1 },
  locationTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  locationSubtitle: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  loading: { alignItems: 'center', gap: 12, marginVertical: 30 },
  loadingText: { color: colors.muted, fontSize: 13 },
  results: { marginTop: 28 },
  busSection: { marginTop: 23 },
  privacyRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12 },
  privacyText: { color: colors.accent, fontSize: 12, fontWeight: '700' },
});
