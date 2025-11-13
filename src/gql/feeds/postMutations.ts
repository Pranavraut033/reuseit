import { gql } from "~/src/__generated__";

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

export const GET_COMMENTS_BY_POST = gql(`
  query GetCommentsByPost($postId: String!) {
    commentsByPost(postId: $postId) {
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