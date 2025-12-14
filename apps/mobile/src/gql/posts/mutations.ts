import { gql } from '~/__generated__';

export const CREATE_POST = gql(`
  mutation CreatePost($createPostInput: CreatePostInput!) {
    createPost(createPostInput: $createPostInput) {
      ...PostFields
    }
  }
`);

export const CREATE_CHAT = gql(`
  mutation CreateChat($createChatInput: CreateChatInput!) {
    createChat(createChatInput: $createChatInput) {
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

export const CREATE_CHAT_MESSAGE = gql(`
  mutation CreateChatMessage($createChatMessageInput: CreateChatMessageInput!) {
    createChatMessage(createChatMessageInput: $createChatMessageInput) {
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
`);

export const TOGGLE_LIKE_POST = gql(`
  mutation TogglePostLike($postId: String!) {
    togglePostLike(postId: $postId)
  }
`);

export const BLOCK_USER = gql(`
  mutation BlockUser($blockUserInput: BlockUserInput!) {
    blockUser(blockUserInput: $blockUserInput)
  }
`);

export const DELETE_CHAT = gql(`
  mutation DeleteChat($chatId: String!) {
    deleteChat(chatId: $chatId)
  }
`);

export const REPORT_CHAT = gql(`
  mutation ReportChat($reportChatInput: ReportChatInput!) {
    reportChat(reportChatInput: $reportChatInput)
  }
`);
