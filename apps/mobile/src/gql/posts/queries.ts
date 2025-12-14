import { gql } from '~/__generated__';

export const GET_POSTS = gql(`
  query GetPosts($limit: Int, $offset: Int, $postFilter: PostFilterInput) {
    posts(limit: $limit, offset: $offset, postFilter: $postFilter) {
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

export const GET_CHAT_BY_POST_AND_USER = gql(`
  query GetChatByPostAndUser($postId: String!) {
    getChatByPostAndUser(postId: $postId) {
      id
      createdAt
      updatedAt
      post {
        id
        title
      }
      requester {
        id
        name
        avatarUrl
      }
      author {
        id
        name
        avatarUrl
      }
      messages {
        id
        content
        createdAt
        sender {
          id
          name
          avatarUrl
        }
      }
    }
  }
`);

export const GET_CHAT_BY_ID = gql(`
  query GetChatById($id: String!) {
    getChatById(id: $id) {
      id
      createdAt
      updatedAt
      post {
        id
        title
      }
      requester {
        id
        name
        avatarUrl
      }
      author {
        id
        name
        avatarUrl
      }
      messages {
        id
        content
        createdAt
        sender {
          id
          name
          avatarUrl
        }
      }
    }
  }
`);

export const GET_CHATS_FOR_USER = gql(`
  query GetChatsForUser {
    getChatsForUser {
      id
      createdAt
      updatedAt
      post {
        id
        title
        images
      }
      requester {
        id
        name
        avatarUrl
      }
      author {
        id
        name
        avatarUrl
      }
      messages(orderBy: "createdAt", take: 1) {
        content
        createdAt
        sender {
          name
        }
      }
    }
  }
`);
