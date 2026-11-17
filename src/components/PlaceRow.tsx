import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, railColors } from '@/theme';
import { openPlace } from '@/lib/navigation';
import type { Place } from '@/lib/types';
import { useFavorites } from '@/state/FavoritesProvider';

export function PlaceRow({ place }: { place: Place }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(place.kind, place.id);
  const isRail = place.kind === 'rail';
  const routeLabel = isRail
    ? `${place.lines.length} ${place.lines.length === 1 ? 'line' : 'lines'}`
    : place.routes.slice(0, 4).join(' · ') || `Stop ${place.id}`;
  const distance = typeof place.distanceMeters === 'number'
    ? (place.distanceMeters < 300 ? `${Math.round(place.distanceMeters)} m` : `${(place.distanceMeters / 1609.344).toFixed(1)} mi`)
    : null;

  return (
    <View style={styles.row}>
      <Pressable
        style={({ pressed }) => [styles.main, pressed && { opacity: 0.74 }]}
        onPress={() => openPlace(place)}
        accessibilityRole="button"
        accessibilityLabel={`View ${place.name} arrivals`}
      >
        <View style={[styles.iconWrap, isRail ? styles.railIcon : styles.busIcon]}>
          <Ionicons name={isRail ? 'train-outline' : 'bus-outline'} size={23} color={isRail ? colors.accent : colors.bus} />
        </View>
        <View style={styles.labels}>
          <Text style={styles.title} numberOfLines={2}>{place.name}</Text>
          <View style={styles.subRow}>
            {isRail ? <View style={styles.lineRow}>
              {place.lines.map((code) => <View key={code} style={[styles.lineDot, { backgroundColor: railColors[code] ?? colors.muted }]} />)}
            </View> : null}
            <Text style={styles.subtitle} numberOfLines={1}>{routeLabel}</Text>
          </View>
          {distance ? <Text style={styles.distance}>{distance} away</Text> : null}
        </View>
      </Pressable>
      <Pressable
        onPress={() => toggleFavorite(place)}
        accessibilityRole="button"
        accessibilityLabel={favorite ? `Remove ${place.name} from favorites` : `Save ${place.name} to favorites`}
        hitSlop={10}
        style={styles.star}
      >
        <Ionicons name={favorite ? 'star' : 'star-outline'} color={favorite ? colors.accent : colors.subtle} size={23} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  main: { flexDirection: 'row', gap: 13, alignItems: 'center', flex: 1, paddingHorizontal: 13, paddingVertical: 15 },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  railIcon: { backgroundColor: colors.accentDark },
  busIcon: { backgroundColor: '#17374B' },
  labels: { flex: 1, gap: 4 },
  title: { color: colors.text, fontWeight: '800', fontSize: 15, letterSpacing: -0.2 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  lineRow: { flexDirection: 'row', gap: 3 },
  lineDot: { height: 7, width: 7, borderRadius: 4 },
  subtitle: { color: colors.muted, fontSize: 12, flexShrink: 1 },
  distance: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  star: { alignItems: 'center', justifyContent: 'center', width: 49, alignSelf: 'stretch', paddingRight: 9 },
});
