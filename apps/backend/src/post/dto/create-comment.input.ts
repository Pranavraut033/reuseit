import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateCommentInput {
  @Field(() => String, { description: 'Comment content' })
  content: string;

  @Field(() => String, { description: 'Post ID that this comment belongs to' })
  postId: string;
}
