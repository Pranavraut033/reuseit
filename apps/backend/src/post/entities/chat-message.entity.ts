import { Field, ID, ObjectType } from '@nestjs/graphql';

import { User } from '~/user/entities/user.entity';

import { Chat } from './chat.entity';

@ObjectType()
export class ChatMessage {
  @Field(() => ID)
  id: string;

  @Field()
  createdAt: Date;

  @Field(() => Chat, { nullable: true })
  chat?: Chat;

  @Field(() => User)
  sender: User;

  @Field()
  content: string;

  @Field(() => ID)
  chatId: string;
  senderId: string;
}
