import { gql } from '~/__generated__';

export const GET_POSTS = gql(`
  query GetPosts {
    posts {
      ...PostFields
    }
  }
`);

export const GET_POST_BY_ID = gql(`
  query GetPostById($id: String!) {
    post(id: $id) {
      ...PostFields
    }
  }
`);
