import { gql } from "~/__generated__";

export const GET_USER_POINTS = gql( `
  query GetUserPoints($id: String!) {
    user(id: $id) {
      id
      name
      points
      pointsHistory {
        id
        amount
        reason
        createdAt
      }
    }
  }
`);