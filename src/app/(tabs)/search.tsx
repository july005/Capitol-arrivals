import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Page } from '@/components/Page';
import { Brand } from '@/components/Brand';
import { Eyebrow, MessagePanel, SectionHeading } from '@/components/Controls';
import { PlaceRow } from '@/components/PlaceRow';
import { transitApi } from '@/lib/api';
import type { Place, TransitKind } from '@/lib/types';
import { colors } from '@/theme';

type Filter = 'all' | TransitKind;

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateQuery = (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setPlaces([]);
      setError(null);
      setLoading(false);
    } else {
      setLoading(true);
    }
  };

  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) return;
    let active = true;
    const timer = setTimeout(() => {
      transitApi.search(text).then((data) => { if (active) { setPlaces(data); setError(null); } })
        .catch((reason) => { if (active) { setPlaces([]); setError(reason.message); } })
        .finally(() => { if (active) setLoading(false); });
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [query]);

  const filtered = places.filter((place) => filter === 'all' || place.kind === filter);

  return (
    <Page>
      <Brand small />
      <View style={styles.heading}>
        <Eyebrow>FIND YOUR RIDE</Eyebrow>
        <Text style={styles.title}>Every stop.{'\n'}One search.</Text>
        <Text style={styles.subtitle}>Search by station, street, route, or bus stop ID.</Text>
      </View>
      <View style={styles.inputWrap}>
        <Ionicons name="search" size={22} color={colors.accent} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={updateQuery}
          placeholder="Try 'Dupont' or 'D10'"
          placeholderTextColor={colors.subtle}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search transit stations and stops"
        />
        {query.length ? <Pressable onPress={() => updateQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search"><Ionicons name="close-circle" size={22} color={colors.subtle} /></Pressable> : null}
      </View>
      <View style={styles.filters}>
        {([['all', 'All'], ['rail', 'Metro'], ['bus', 'Bus']] as [Filter, string][]).map(([value, label]) => (
          <Pressable key={value} accessibilityRole="button" onPress={() => setFilter(value)} style={[styles.filter, filter === value && styles.filterSelected]}>
            <Text style={[styles.filterText, filter === value && styles.filterTextSelected]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {query.trim().length < 2 ?
        <MessagePanel icon="search-outline" title="Where are you headed?" message="Start typing to search every Metro station and Metrobus stop. Tap the star beside any result to save it." /> :
        loading ? <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} /> :
          error ? <MessagePanel icon="cloud-offline-outline" title="Search unavailable" message={error} /> :
            filtered.length ? <View style={styles.results}>
              <SectionHeading title="Results" trailing={`${filtered.length} found`} />
              {filtered.map((place) => <PlaceRow key={`${place.kind}:${place.id}`} place={place} />)}
            </View> :
              <MessagePanel icon="search-outline" title="No matching stops" message="Try another station name, nearby street, route number, or seven-digit bus stop ID." />}
    </Page>
  );
}

const styles = StyleSheet.create({
  heading: { marginTop: 39 },
  title: { fontSize: 38, lineHeight: 43, color: colors.text, fontWeight: '900', letterSpacing: -1.5, marginTop: 10 },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 10, lineHeight: 21 },
  inputWrap: { backgroundColor: colors.surfaceRaised, borderRadius: 18, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 16, marginTop: 25, minHeight: 60 },
  input: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600', paddingVertical: 15 },
  filters: { flexDirection: 'row', gap: 8, marginTop: 15, marginBottom: 24 },
  filter: { borderRadius: 100, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 18, paddingVertical: 10 },
  filterSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  filterText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  filterTextSelected: { color: colors.background },
  results: { marginTop: 2 },
});
