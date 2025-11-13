import { gql } from '~/src/__generated__';

export const SIGN_IN_MUTATION = gql(`
  mutation signIn($data: SignInInput!) {
    signIn(data: $data) {
      user {
        id
        createdAt
        updatedAt
        lastLogin
        avatarUrl
        email
        emailVerified
        googleId
        name
        phoneNumber
        phoneVerified
      }
      token
    }
  }`);
