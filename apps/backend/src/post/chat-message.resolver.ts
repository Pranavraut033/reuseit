import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import DataLoader from 'dataloader';
import { Loader } from 'nestjs-dataloader';

import { User } from '~/user/entities/user.entity';
import { UserLoader } from '~/user/user.loader';

import { ChatLoader } from './chat.loader';
import { Chat } from './entities/chat.entity';
import { ChatMessage } from './entities/chat-message.entity';

@Resolver(() => ChatMessage)
export class ChatMessageResolver {
  @ResolveField('sender', () => User)
  async sender(
    @Parent() message: ChatMessage & { senderId: string },
    @Loader(UserLoader) loader: DataLoader<string, User>,
  ): Promise<User> {
    return loader.load(message.senderId);
  }

  @ResolveField('chat', () => Chat, { nullable: true })
  async chat(
    @Parent() message: ChatMessage & { chatId: string },
    @Loader(ChatLoader) loader: DataLoader<string, Chat>,
  ): Promise<Chat | null> {
    return loader.load(message.chatId);
  }
}
