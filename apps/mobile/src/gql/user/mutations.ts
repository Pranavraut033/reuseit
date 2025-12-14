import { gql } from '~/__generated__';

export const UPDATE_USER_MUTATION = gql(`
  mutation updateUser($updateUserInput: UpdateUserInput!) {
    updateUser(updateUserInput: $updateUserInput) {
      id
      name
      username
      email
      phoneNumber
      avatarUrl
      updatedAt
    }
  }
`);

export const EXPORT_USER_DATA_MUTATION = gql(`
  mutation exportUserData($id: String!) {
    exportUserData(id: $id)
  }
`);

export const REMOVE_USER_MUTATION = gql(`
  mutation removeUser($id: String!) {
    removeUser(id: $id) {
      id
      name
      email
    }
  }
`);
