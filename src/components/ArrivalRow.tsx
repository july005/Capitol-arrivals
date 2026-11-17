import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, routeColor } from '@/theme';
import type { Arrival, TransitKind } from '@/lib/types';

export function ArrivalRow({ arrival, kind }: { arrival: Arrival; kind: TransitKind }) {
  const color = routeColor(kind, arrival.route);
  const isSoon = arrival.minutes !== null && arrival.minutes <= 2;
  const label = arrival.minuteLabel === 'ARR' ? 'Arriving' : arrival.minuteLabel === 'BRD' ? 'Boarding' :
    arrival.minutes === null ? 'No estimate' : arrival.minutes === 0 ? 'Now' : `${arrival.minutes} min`;

  return (
    <View style={styles.item}>
      <View style={[styles.line, { backgroundColor: color }]} />
      <View style={styles.routeWrap}>
        <Text style={[styles.route, { color }]}>{arrival.route}</Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.destination} numberOfLines={2}>{arrival.destination}</Text>
        {arrival.platform ? <Text style={styles.platform}>{arrival.platform}</Text> : null}
      </View>
      <View style={styles.minutesWrap}>
        <Text style={[styles.minutes, isSoon && { color: colors.accent }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 15, paddingVertical: 15, paddingRight: 15, marginBottom: 9, flexDirection: 'row', minHeight: 76, alignItems: 'center', overflow: 'hidden' },
  line: { width: 5, height: '100%', minHeight: 46, borderRadius: 4, marginRight: 13 },
  routeWrap: { minWidth: 38, maxWidth: 53, marginRight: 10 },
  route: { fontSize: 17, fontWeight: '900' },
  details: { flex: 1, gap: 3 },
  destination: { fontSize: 14, color: colors.text, fontWeight: '700' },
  platform: { fontSize: 12, color: colors.subtle },
  minutesWrap: { minWidth: 68, alignItems: 'flex-end', marginLeft: 7 },
  minutes: { fontSize: 15, color: colors.text, fontWeight: '900' },
});
