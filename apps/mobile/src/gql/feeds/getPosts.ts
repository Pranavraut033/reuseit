import { gql,  } from "~/__generated__";
import { GetPostsQuery } from "~/__generated__/graphql";

export const GET_POSTS = gql(`
  query GetPosts {
    posts {
      id
      content
      createdAt
      images
      likes
      likedByCurrentUser
      comments {
        id
      }
      author {
        id
        name
        avatarUrl
      }
    }
  }
`);

export type Post = GetPostsQuery["posts"][number] // extract from the query