import { gql } from '~/__generated__';

export const GET_EVENTS = gql(`
  query GetEvents {
    events {
      ...EventFields
    }
  }
`);

export const GET_EVENT = gql(`
  query GetEvent($id: String!) {
    event(id: $id) {
      ...EventFields
      posts {
        id
        title
        description
        images
        createdAt
        author {
          id
          name
          avatarUrl
        }
      }
    }
  }
`);

export const GET_UPCOMING_EVENTS = gql(`
  query GetUpcomingEvents {
    upcomingEvents {
      ...EventFields
    }
  }
`);

export const GET_EVENTS_BY_CREATOR = gql(`
  query GetEventsByCreator($creatorId: String!) {
    eventsByCreator(creatorId: $creatorId) {
      ...EventFields
    }
  }
`);
