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

export const EVENT_FIELDS = gql(`
  fragment EventFields on Event {
    id
    title
    description
    startTime
    endTime
    imageUrl
    creator {
      id
      name
      avatarUrl
    }
    location {
      ...LocationFields
    }
    participants {
      id
      user {
        id
        name
        avatarUrl
      }
    }
    posts {
      id
      title
    }
  }
`);

let _p = getFragmentData(POST_FIELDS, {});
let _l = getFragmentData(LOCATION_FIELDS, _p.location);
let _e = getFragmentData(EVENT_FIELDS, {});

export type Location = typeof _l;

export type Post = Omit<typeof _p, 'location'> & {
  location: Location;
};

export type Event = Omit<typeof _e, 'location'> & {
  location: Location;
};
