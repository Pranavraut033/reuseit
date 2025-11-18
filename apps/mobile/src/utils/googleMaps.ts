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

export type ReverseGeocodeResult = {
  street: string;
  streetNumber: string;
  city: string;
  country: string;
  postalCode: string;
  formattedAddress: string;
};

const reverseGeocode = async (
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult | null> => {
  const apiKey = GOOGLE_API_KEY;

  if (!apiKey) {
    console.warn('Google Maps API key not found. Set GOOGLE_MAPS_API_KEY in app config or env.');
    return null;
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return null;
    }

    const result = data.results[0];
    const addressComponents = result.address_components;

    // Extract address components
    const getComponent = (type: string) =>
      addressComponents.find((c: any) => c.types.includes(type))?.long_name || '';

    const streetNumber = getComponent('street_number');
    const route = getComponent('route');
    const street = `${route} ${streetNumber} `.trim() || result.formatted_address.split(',')[0];
    const city = getComponent('locality') || getComponent('administrative_area_level_2');
    const country = getComponent('country');
    const postalCode = getComponent('postal_code');

    return {
      street,
      streetNumber,
      city,
      country,
      postalCode,
      formattedAddress: result.formatted_address,
    };
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    return null;
  }
};

// -------------------- Places Autocomplete & Details --------------------

export type AutocompletePrediction = {
  description: string;
  place_id: string;
  structured_formatting?: any;
  types?: string[];
};

export type PlacesAutocompleteOptions = {
  input: string;
  loc?: Region; // bias results near location
  radius?: number; // meters, only used with loc
  sessionToken?: string; // recommended for billing grouping
};

export type PlaceDetailsResult = {
  place_id: string;
  name: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
  address_components: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
};

// Simple in-memory caches to reduce duplicate network requests within a session
const _autocompleteCache: Record<string, AutocompletePrediction[]> = {};
const _placeDetailsCache: Record<string, PlaceDetailsResult> = {};

const generateSessionToken = () => Math.random().toString(36).slice(2);

async function placesAutocomplete({
  input,
  loc,
  radius = 5000,
  sessionToken,
}: PlacesAutocompleteOptions): Promise<AutocompletePrediction[]> {
  const apiKey = GOOGLE_API_KEY;
  if (!apiKey || !input.trim()) return [];

  const cacheKey = `${input}|${loc?.latitude || ''}|${loc?.longitude || ''}`;
  if (_autocompleteCache[cacheKey]) return _autocompleteCache[cacheKey];

  const params: Record<string, string> = {
    input,
    key: apiKey,
  };
  if (loc) {
    params.location = `${loc.latitude},${loc.longitude}`;
    params.radius = String(radius);
  }
  if (sessionToken) {
    params.sessiontoken = sessionToken;
  }

  const queryStr = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${queryStr}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const preds: AutocompletePrediction[] = data.predictions || [];
    _autocompleteCache[cacheKey] = preds;
    return preds;
  } catch (e) {
    console.warn('placesAutocomplete error', e);
    return [];
  }
}

async function fetchPlaceDetails(
  placeId: string,
  sessionToken?: string,
): Promise<PlaceDetailsResult | null> {
  if (_placeDetailsCache[placeId]) return _placeDetailsCache[placeId];
  const apiKey = GOOGLE_API_KEY;
  if (!apiKey || !placeId) return null;

  const params: Record<string, string> = {
    place_id: placeId,
    key: apiKey,
    fields: 'place_id,name,formatted_address,geometry,address_component',
  };
  if (sessionToken) params.sessiontoken = sessionToken;
  const queryStr = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  const url = `https://maps.googleapis.com/maps/api/place/details/json?${queryStr}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const result = data.result;
    if (!result) return null;
    const latitude = result.geometry?.location?.lat;
    const longitude = result.geometry?.location?.lng;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;
    const details: PlaceDetailsResult = {
      place_id: result.place_id,
      name: result.name,
      formatted_address: result.formatted_address,
      latitude,
      longitude,
      address_components: result.address_components || [],
    };
    _placeDetailsCache[placeId] = details;
    return details;
  } catch (e) {
    console.warn('fetchPlaceDetails error', e);
    return null;
  }
}

export {
  fetchNearbyPlacesByKeywords,
  fetchPlaceDetails,
  generateSessionToken,
  getGoogleApiKey,
  getPlacePhotoUrl,
  placesAutocomplete,
  reverseGeocode,
};
