import { gql } from '~/__generated__';

export const GOOGLE_SIGN_IN_MUTATION = gql(`
  mutation googleSignIn($data: GoogleSignInInput!) {
    googleSignIn(data: $data) {
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
