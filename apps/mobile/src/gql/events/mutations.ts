import { gql } from '~/__generated__';

export const CREATE_EVENT = gql(`
  mutation CreateEvent($createEventInput: CreateEventInput!) {
    createEvent(createEventInput: $createEventInput) {
      ...EventFields
    }
  }
`);

export const UPDATE_EVENT = gql(`
  mutation UpdateEvent($updateEventInput: UpdateEventInput!) {
    updateEvent(updateEventInput: $updateEventInput) {
      ...EventFields
    }
  }
`);

export const DELETE_EVENT = gql(`
  mutation DeleteEvent($id: String!) {
    removeEvent(id: $id) {
      id
      title
    }
  }
`);

export const JOIN_EVENT = gql(`
  mutation JoinEvent($eventId: String!) {
    joinEvent(eventId: $eventId) {
      ...EventFields
    }
  }
`);

export const LEAVE_EVENT = gql(`
  mutation LeaveEvent($eventId: String!) {
    leaveEvent(eventId: $eventId) {
      ...EventFields
    }
  }
`);
