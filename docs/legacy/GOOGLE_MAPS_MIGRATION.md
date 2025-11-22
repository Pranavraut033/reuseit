# Google Maps API Migration

## Overview

Google Maps functionality has been migrated from client-side direct API calls to server-side GraphQL queries. This provides better API key security, centralized caching, and reduced API usage.

## Changes Made

### Backend (`apps/backend`)

1. **New Module**: `GoogleMapsModule` (`src/google-maps/`)
   - `google-maps.service.ts` - Service layer handling Google Maps API calls with caching
   - `google-maps.resolver.ts` - GraphQL resolver exposing queries
   - `google-maps.module.ts` - Module configuration with CacheModule
   - `entities/` - GraphQL entity types

2. **GraphQL Queries Added**:
   - `placesAutocomplete` - Place search with autocomplete
   - `placeDetails` - Detailed info for a specific place
   - `nearbyPlaces` - Find places near coordinates by keywords
   - `reverseGeocode` - Convert coordinates to address
   - `generatePlacesSessionToken` - Session token for billing optimization

3. **Caching**:
   - Autocomplete: 60s TTL
   - Place Details: 300s TTL
   - Nearby Places: 120s TTL
   - Reverse Geocode: 600s TTL

4. **Environment Variable**:
   - `GOOGLE_MAPS_API_KEY` - Required in backend `.env`

### Mobile (`apps/mobile`)

1. **GraphQL Operations** (`src/gql/google-maps/index.ts`):
   - Added query definitions for all Google Maps features

2. **Updated Utils** (`src/utils/googleMaps.ts`):
   - Replaced direct API calls with GraphQL queries via Apollo Client
   - Maintained backward-compatible function signatures
   - Removed client-side API key handling
   - `photoUrl` now served directly from backend

3. **Updated Components**:
   - `LocationAutocomplete.tsx` - Uses async `generateSessionToken()`
   - `explore.tsx` - Uses `photoUrl` from backend response
   - Removed `useGetPlacePhotoUrl` hook (photos served by backend)

## Benefits

- **Security**: API key only on backend, not exposed in mobile builds
- **Caching**: Reduces API calls and costs through server-side caching
- **Consistency**: Single source of truth for Google Maps data
- **Performance**: Faster responses for cached queries
- **Billing**: Better control over API usage and costs

## Testing

### Backend
1. Start backend: `pnpm --filter backend run start:dev`
2. Visit GraphQL Playground: `http://localhost:3000/graphql`
3. Test queries:

```graphql
query TestReverseGeocode {
  reverseGeocode(latitude: 37.7749, longitude: -122.4194) {
    street
    city
    country
    formattedAddress
  }
}

query TestNearbyPlaces {
  nearbyPlaces(
    latitude: 37.7749
    longitude: -122.4194
    radius: 1000
    keywords: ["recycling"]
  ) {
    placeId
    name
    photoUrl
  }
}
```

### Mobile
1. Ensure backend is running with `GOOGLE_MAPS_API_KEY` set
2. Start mobile: `pnpm --filter mobile run start`
3. Test features:
   - Explore tab (nearby recycling centers)
   - Create post (location autocomplete)
   - Location picker (reverse geocoding)

## Migration Checklist

- [x] Create backend GoogleMaps module with service, resolver, entities
- [x] Add GraphQL queries to mobile
- [x] Update `googleMaps.ts` to use GraphQL instead of fetch
- [x] Update components to use new async functions
- [x] Remove client-side API key references
- [x] Generate GraphQL types (`pnpm graphql-codegen`)
- [x] Test all Google Maps features
- [x] Update documentation

## Rollback

If needed, revert these commits to restore direct API calls. You'll need to:
1. Restore old `googleMaps.ts` implementation
2. Add `GOOGLE_MAPS_API_KEY` to mobile `app.config.js`
3. Remove GraphQL queries and generated types
