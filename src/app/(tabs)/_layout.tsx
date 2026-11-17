import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';

function TabIcon({ name, focused }: { name: keyof typeof Ionicons.glyphMap; focused: boolean }) {
  return <Ionicons name={name} size={23} color={focused ? colors.accent : colors.subtle} />;
}

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.subtle,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '800', marginTop: 2 },
      tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: 1, paddingTop: 9 },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} /> }} />
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'search' : 'search-outline'} focused={focused} /> }} />
      <Tabs.Screen name="nearby" options={{ title: 'Nearby', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'navigate' : 'navigate-outline'} focused={focused} /> }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'star' : 'star-outline'} focused={focused} /> }} />
    </Tabs>
  );
}
