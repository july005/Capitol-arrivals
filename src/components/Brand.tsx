import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';

export function Brand({ small = false }: { small?: boolean }) {
  return (
    <View style={styles.row}>
      <View style={[styles.mark, small && { width: 31, height: 31, borderRadius: 11 }]}>
        <Ionicons name="navigate" size={small ? 17 : 20} color={colors.background} />
      </View>
      <Text style={[styles.name, small && { fontSize: 18 }]}>capital<Text style={styles.accent}>arrivals</Text></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 20, fontWeight: '800', letterSpacing: -0.8, color: colors.text },
  accent: { color: colors.accent },
});
