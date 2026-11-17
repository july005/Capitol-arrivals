import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function SectionHeading({ title, trailing }: { title: string; trailing?: string }) {
  return (
    <View style={styles.heading}>
      <Text style={styles.section}>{title}</Text>
      {trailing ? <Text style={styles.trailing}>{trailing}</Text> : null}
    </View>
  );
}

export function ActionButton({
  label, onPress, icon, secondary, loading,
}: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap; secondary?: boolean; loading?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [styles.button, secondary && styles.secondary, pressed && { opacity: 0.75 }]}
    >
      {loading ? <ActivityIndicator color={secondary ? colors.text : colors.background} /> :
        icon ? <Ionicons name={icon} size={18} color={secondary ? colors.text : colors.background} /> : null}
      <Text style={[styles.buttonText, secondary && { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export function MessagePanel({
  title, message, icon = 'information-circle-outline', actionLabel, onAction,
}: {
  title: string; message: string; icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string; onAction?: () => void;
}) {
  return (
    <View style={styles.message}>
      <View style={styles.messageIcon}><Ionicons name={icon} size={24} color={colors.accent} /></View>
      <Text style={styles.messageTitle}>{title}</Text>
      <Text style={styles.messageBody}>{message}</Text>
      {actionLabel && onAction ? <ActionButton label={actionLabel} onPress={onAction} secondary /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontWeight: '800', letterSpacing: 1.5, color: colors.accent, fontSize: 11, textTransform: 'uppercase' },
  heading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14, marginTop: 10 },
  section: { fontWeight: '800', color: colors.text, fontSize: 21, letterSpacing: -0.5 },
  trailing: { color: colors.subtle, fontWeight: '600', fontSize: 12 },
  button: { borderRadius: 16, backgroundColor: colors.accent, paddingVertical: 14, paddingHorizontal: 18, minHeight: 50, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9 },
  secondary: { backgroundColor: colors.surfaceLight, borderColor: colors.border, borderWidth: 1 },
  buttonText: { fontSize: 14, color: colors.background, fontWeight: '800' },
  message: { borderWidth: 1, borderColor: colors.border, borderRadius: 22, backgroundColor: colors.surface, padding: 22, gap: 9, alignItems: 'flex-start' },
  messageIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  messageTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  messageBody: { fontSize: 14, lineHeight: 21, color: colors.muted, marginBottom: 5 },
});
