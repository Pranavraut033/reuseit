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

export const GET_USER_POSTS = gql(`
  query GetUserPosts($authorId: String!) {
    postsByAuthor(authorId: $authorId) {
      ...PostFields
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
