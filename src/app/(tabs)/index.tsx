import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Page } from '@/components/Page';
import { Brand } from '@/components/Brand';
import { ActionButton, Eyebrow, MessagePanel, SectionHeading } from '@/components/Controls';
import { PlaceRow } from '@/components/PlaceRow';
import { transitApi } from '@/lib/api';
import type { Place } from '@/lib/types';
import { useFavorites } from '@/state/FavoritesProvider';
import { colors } from '@/theme';

export default function HomeScreen() {
  const { favorites, loading: savedLoading } = useFavorites();
  const [popular, setPopular] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    transitApi.popular().then((data) => { if (active) setPopular(data); })
      .catch((reason) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const featured = favorites.length ? favorites.slice(0, 4) : popular;
  const greeting = new Date().getHours() < 12 ? 'GOOD MORNING, DC' :
    new Date().getHours() < 17 ? 'GOOD AFTERNOON, DC' : 'GOOD EVENING, DC';

  return (
    <Page>
      <Brand />
      <View style={styles.hero}>
        <View style={styles.decorA} /><View style={styles.decorB} />
        <Text style={styles.heroEyebrow}>{greeting}</Text>
        <Text style={styles.heroTitle}>Catch the ride.{'\n'}Skip the wait.</Text>
        <Text style={styles.heroSubtitle}>Live Metro and bus arrivals, right when you need them.</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/search')} style={styles.heroButton}>
          <Ionicons name="search" size={18} color={colors.text} />
          <Text style={styles.heroButtonText}>Find your stop</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.quickRow}>
        <Pressable accessibilityRole="button" onPress={() => router.push('/nearby')} style={({ pressed }) => [styles.quick, pressed && { opacity: 0.8 }]}>
          <View style={[styles.quickIcon, { backgroundColor: '#1F4651' }]}><Ionicons name="navigate-outline" color={colors.accent} size={21} /></View>
          <View style={{ flex: 1 }}><Text style={styles.quickTitle}>Near me</Text><Text style={styles.quickSubtitle}>Closest stops</Text></View>
          <Ionicons name="chevron-forward" color={colors.muted} size={17} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push('/saved')} style={({ pressed }) => [styles.quick, pressed && { opacity: 0.8 }]}>
          <View style={[styles.quickIcon, { backgroundColor: '#244336' }]}><Ionicons name="star-outline" color={colors.accent} size={21} /></View>
          <View style={{ flex: 1 }}><Text style={styles.quickTitle}>Saved</Text><Text style={styles.quickSubtitle}>One-tap access</Text></View>
          <Ionicons name="chevron-forward" color={colors.muted} size={17} />
        </Pressable>
      </View>

      <View style={styles.sectionTop}>
        <Eyebrow>YOUR TRANSIT</Eyebrow>
        <SectionHeading title={favorites.length ? 'Your favorites' : 'Popular stations'} trailing={favorites.length ? `${favorites.length} saved` : 'START HERE'} />
      </View>
      {savedLoading || (loading && !favorites.length) ? <ActivityIndicator style={{ padding: 24 }} color={colors.accent} /> :
        featured.length ? featured.map((place) => <PlaceRow key={`${place.kind}:${place.id}`} place={place} />) :
          <MessagePanel title="Ready when you are" message="Find a station or bus stop to see real-time arrivals and save it for next time." icon="train-outline" actionLabel="Search stations and stops" onAction={() => router.push('/search')} />}
      {error && !favorites.length ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text><ActionButton label="Search instead" secondary onPress={() => router.push('/search')} /></View> : null}

      <View style={styles.footer}>
        <View style={styles.liveDot} />
        <Text style={styles.footerText}>Predictions supplied by WMATA · independent app</Text>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.accent, borderRadius: 28, marginTop: 31, padding: 26, minHeight: 260, overflow: 'hidden' },
  decorA: { position: 'absolute', right: -74, top: -86, width: 245, height: 245, borderRadius: 125, borderWidth: 36, borderColor: '#B1D968' },
  decorB: { position: 'absolute', right: -30, bottom: -115, width: 225, height: 225, borderRadius: 125, borderWidth: 30, borderColor: '#B1D968' },
  heroEyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, color: '#356043' },
  heroTitle: { fontSize: 34, fontWeight: '900', color: '#0A2928', marginTop: 11, lineHeight: 39, letterSpacing: -1.2 },
  heroSubtitle: { fontSize: 13, color: '#355449', maxWidth: 260, marginTop: 9, lineHeight: 19, fontWeight: '600' },
  heroButton: { marginTop: 24, minHeight: 47, borderRadius: 14, backgroundColor: '#103735', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, paddingHorizontal: 16, alignSelf: 'flex-start' },
  heroButtonText: { color: colors.text, fontWeight: '800', fontSize: 13 },
  quickRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  quick: { flex: 1, backgroundColor: colors.surface, borderRadius: 18, borderColor: colors.border, borderWidth: 1, padding: 12, gap: 8, alignItems: 'center', flexDirection: 'row' },
  quickIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  quickSubtitle: { color: colors.muted, fontSize: 10, marginTop: 3 },
  sectionTop: { marginTop: 31 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 7, justifyContent: 'center', marginTop: 23, marginBottom: 8 },
  liveDot: { height: 6, width: 6, backgroundColor: colors.green, borderRadius: 3 },
  footerText: { fontSize: 11, color: colors.subtle },
  error: { gap: 10, paddingVertical: 10 },
  errorText: { color: colors.error, fontSize: 12, lineHeight: 18 },
});
