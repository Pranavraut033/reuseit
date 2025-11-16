import { gql } from '~/__generated__';

export const CREATE_POST = gql(`
  mutation CreatePost($createPostInput: CreatePostInput!) {
    createPost(createPostInput: $createPostInput) {
      ...PostFields
    }
  }
`);
