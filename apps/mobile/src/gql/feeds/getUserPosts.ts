import { gql } from "~/src/__generated__";

export const GET_USER_POSTS = gql(`
  query GetUserPosts($authorId: String!) {
    postsByAuthor(authorId: $authorId) {
      id
      content
      createdAt
      images
      likes
      author {
        id
        name
        avatarUrl
      }
      comments {
        id
      }
    }
  }
`);