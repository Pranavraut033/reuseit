import { gql } from '~/__generated__';
import { NearbyPlace } from '~/__generated__/types';

export const PLACES_AUTOCOMPLETE_QUERY = gql(`
  query placesAutocomplete(
    $input: String!
    $latitude: Float
    $longitude: Float
    $radius: Float
    $sessionToken: String
  ) {
    placesAutocomplete(
      input: $input
      latitude: $latitude
      longitude: $longitude
      radius: $radius
      sessionToken: $sessionToken
    ) {
      description
      placeId
      types
    }
  }
`);
export type Place = NearbyPlace;

export const PLACE_DETAILS_QUERY = gql(`
  query placeDetails($placeId: String!, $sessionToken: String) {
    placeDetails(placeId: $placeId, sessionToken: $sessionToken) {
      placeId
      name
      formattedAddress
      latitude
      longitude
      addressComponents {
        longName
        shortName
        types
      }
    }
  }
`);

export const NEARBY_PLACES_QUERY = gql(`
  query nearbyPlaces(
    $latitude: Float!
    $longitude: Float!
    $radius: Float
    $keywords: [String!]!
  ) {
    nearbyPlaces(
      latitude: $latitude
      longitude: $longitude
      radius: $radius
      keywords: $keywords
    ) {
      placeId
      name
      vicinity
      types
      latitude
      longitude
      photoUrl
    }
  }
`);

export const REVERSE_GEOCODE_QUERY = gql(`
  query reverseGeocode($latitude: Float!, $longitude: Float!) {
    reverseGeocode(latitude: $latitude, longitude: $longitude) {
      street
      streetNumber
      city
      country
      postalCode
      formattedAddress
    }
  }
`);

export const GENERATE_PLACES_SESSION_TOKEN_QUERY = gql(`
  query generatePlacesSessionToken {
    generatePlacesSessionToken
  }
`);
