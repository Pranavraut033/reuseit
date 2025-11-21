import { gql } from '~/__generated__';

export const CREATE_POST = gql(`
  mutation CreatePost($createPostInput: CreatePostInput!) {
    createPost(createPostInput: $createPostInput) {
      ...PostFields
    }
  }
`);

export const CREATE_COMMENT = gql(`
  mutation CreateComment($createCommentInput: CreateCommentInput!) {
    createComment(createCommentInput: $createCommentInput) {
      id
      content
      createdAt
      author {
        id
        name
        avatarUrl
      }
    }
  }
`);

export const TOGGLE_LIKE_POST = gql(`
  mutation TogglePostLike($postId: String!) {
    togglePostLike(postId: $postId)
  }
`);
