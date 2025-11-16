import { gql } from '~/__generated__';

export const GET_USER_POSTS = gql(`
  query GetUserPosts($authorId: String!) {
    postsByAuthor(authorId: $authorId) {
      ...PostFields
    }
  }
`);
