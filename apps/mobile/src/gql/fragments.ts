import { getFragmentData, gql } from '~/__generated__';

export const POST_FIELDS = gql(`
  fragment PostFields on Post {
    id
    category
    commentCount
    condition
    description
    createdAt
    images
    likeCount
    likedByCurrentUser
    pickupDate
    tags
    title
    updatedAt
    location {
      ...LocationFields
    }
    event {
      id
      title
      startTime
      endTime
      imageUrl
    }
    author {
      id
      avatarUrl
      name
    }
    anonymous
  }
`);

export const LOCATION_FIELDS = gql(`
  fragment LocationFields on Location {
    id
    street
    addressLine2
    additionalInfo
    city
    country
    coordinates
    createdAt
    googlePlaceId
    postalCode
    type
  }
`);

let _p = getFragmentData(POST_FIELDS, {});

let _l = getFragmentData(LOCATION_FIELDS, _p.location);

export type Location = typeof _l;

export type Post = typeof _p & {
  location: Location;
};
