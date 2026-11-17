import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Page } from '@/components/Page';
import { Brand } from '@/components/Brand';
import { Eyebrow, MessagePanel, SectionHeading } from '@/components/Controls';
import { PlaceRow } from '@/components/PlaceRow';
import { useFavorites } from '@/state/FavoritesProvider';
import { colors } from '@/theme';

export default function SavedScreen() {
  const { favorites } = useFavorites();
  const rails = favorites.filter((place) => place.kind === 'rail');
  const buses = favorites.filter((place) => place.kind === 'bus');

  return (
    <Page>
      <Brand small />
      <View style={styles.heading}>
        <Eyebrow>YOUR SHORTLIST</Eyebrow>
        <Text style={styles.title}>Your places.{'\n'}No hunting.</Text>
        <Text style={styles.subtitle}>Save a stop once, then find its next arrivals in a tap.</Text>
      </View>
      {!favorites.length ?
        <MessagePanel icon="star-outline" title="Nothing saved yet" message="Tap the star next to any Metro station or bus stop to keep it here." actionLabel="Find your first stop" onAction={() => router.push('/search')} /> :
        <>
          {rails.length ? <View style={styles.group}><SectionHeading title="Metro stations" trailing={`${rails.length} saved`} />{rails.map((place) => <PlaceRow key={`rail:${place.id}`} place={place} />)}</View> : null}
          {buses.length ? <View style={styles.group}><SectionHeading title="Bus stops" trailing={`${buses.length} saved`} />{buses.map((place) => <PlaceRow key={`bus:${place.id}`} place={place} />)}</View> : null}
          <Text style={styles.note}>Favorites are saved on this device, not in an account.</Text>
        </>}
    </Page>
  );
}

const styles = StyleSheet.create({
  heading: { marginTop: 39, marginBottom: 27 },
  title: { color: colors.text, fontSize: 38, fontWeight: '900', letterSpacing: -1.5, lineHeight: 43, marginTop: 10 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 10 },
  group: { marginBottom: 24 },
  note: { color: colors.subtle, fontSize: 12, marginTop: 9, textAlign: 'center' },
});
