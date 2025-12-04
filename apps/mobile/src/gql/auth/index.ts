import { gql } from '~/__generated__';

export const SIGN_IN_MUTATION = gql(`
  mutation signIn($data: SignInInput!) {
    signIn(data: $data) {
      user {
        id
        avatarUrl
        createdAt
        email
        emailVerified
        googleId
        lastLogin
        name
        phoneNumber
        phoneVerified
        points
        updatedAt
      }
      token
    }
  }`);
