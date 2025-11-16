import { FragmentType, gql } from '~/__generated__';

export const POST_FIELDS = gql(`
  fragment PostFields on Post {
    id
    category
    commentsCount
    condition
    content
    createdAt
    images
    likeCount
    likedByCurrentUser
    pickupDate
    tags
    title
    updatedAt
    location {
      id
      address
      coordinates
      googlePlaceId
      name
      type
    }
    author {
      id
      avatarUrl
      name
    }
  }
`);

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

export type Post = NonNullable<
  FragmentType<typeof POST_FIELDS>[' $fragmentRefs']
>['PostFieldsFragment'];
