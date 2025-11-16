import { gql } from '@apollo/client';

export const LIKE_POST = gql`
  mutation LikePost($postId: String!) {
    likePost(postId: $postId)
  }
`;

export default LIKE_POST;
