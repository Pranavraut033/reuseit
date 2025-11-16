import Constants from 'expo-constants';
import { Region } from 'react-native-maps';

import { GoogleMapsTypes, Result } from '~/types/googleMapsAPI.types';

export type Place = Result;

const getGoogleApiKey = () => {
  try {
    // prefer expo config values when available
    // these keys are defined in app.config.js under ios.config.googleMapsApiKey and android.config.googleMaps.apiKey
    const expoConfig = Constants.expoConfig;
    return (
      expoConfig?.ios?.config?.googleMapsApiKey ||
      expoConfig?.android?.config?.googleMaps?.apiKey ||
      process.env.GOOGLE_MAPS_API_KEY ||
      ''
    );
  } catch (e) {
    console.warn('Error getting Google API key', { error: e });
    return '';
  }
};

const GOOGLE_API_KEY = getGoogleApiKey();

const getPlacePhotoUrl = (place: Place, maxwidth = 400) => {
  const photos = place?.photos || [];
  if (!photos.length) return null;
  const ref = photos[0]?.photo_reference;
  if (!ref) return null;
  const key = GOOGLE_API_KEY;
  if (!key) return null;
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photoreference=${encodeURIComponent(
    ref,
  )}&key=${key}`;
};

type Options = {
  loc?: Region;
  radius?: number;
  keywords: string[];
};

const fetchNearbyPlacesByKeywords = async ({
  loc,
  radius = 500,
  keywords,
}: Options): Promise<Place[]> => {
  const apiKey = GOOGLE_API_KEY;
  if (!loc) {
    return [];
  }

  if (!apiKey) {
    console.warn('Google Maps API key not found. Set GOOGLE_MAPS_API_KEY in app config or env.');
    return [];
  }

  const locationStr = `${loc.latitude},${loc.longitude}`;

  const allResults: Record<string, Place> = {};

  for (const kw of keywords) {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${encodeURIComponent(
      locationStr,
    )}&radius=${radius}&keyword=${encodeURIComponent(kw)}&key=${apiKey}`;

    const res = await fetch(url);
    if (!res.ok) continue;
    const json: GoogleMapsTypes = await res.json();
    const results = json.results || [];
    for (const r of results) {
      if (r.place_id && !allResults[r.place_id]) {
        allResults[r.place_id] = r;
      }
    }

    // if the API returns a next_page_token we could handle pagination here
    // but for simplicity we'll ignore paginated results in this first iteration
  }

  return Object.values(allResults);
};

export { fetchNearbyPlacesByKeywords, getGoogleApiKey, getPlacePhotoUrl };
