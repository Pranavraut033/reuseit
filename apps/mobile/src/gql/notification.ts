import { gql } from '~/__generated__';

export const REGISTER_DEVICE_TOKEN_MUTATION = gql(`
  mutation registerDeviceToken($token: String!, $userId: String!) {
    registerDeviceToken(token: $token, userId: $userId)
  }
`);

export const SEND_TEST_NOTIFICATION_MUTATION = gql(`
  mutation sendTestNotification($token: String!, $title: String!, $body: String!) {
    sendTestNotification(token: $token, title: $title, body: $body)
  }
`);

export const SEND_NOTIFICATION_TO_USER_MUTATION = gql(`
  mutation sendNotificationToUser($userId: String!, $title: String!, $body: String!) {
    sendNotificationToUser(userId: $userId, title: $title, body: $body)
  }
`);
