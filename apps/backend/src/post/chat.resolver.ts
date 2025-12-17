import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import {
  Args,
  Context,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import type { Cache } from 'cache-manager';
import DataLoader from 'dataloader';
import { Loader } from 'nestjs-dataloader';

import { CacheQuery, InvalidateCache } from '~/decorators/cache.decorator';
import { CurrentUser } from '~/decorators/CurrentUser';
import { UserLoader } from '~/user/user.loader';

import { User } from '../user/entities/user.entity';
import { ChatService } from './chat.service';
import {
  BlockUserInput,
  CreateChatInput,
  CreateChatMessageInput,
  ReportChatInput,
} from './dto/create-chat.input';
import { Chat } from './entities/chat.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { Post } from './entities/post.entity';
import { PostLoader } from './post.loader';

@Resolver(() => Chat)
export class ChatResolver {
  constructor(
    private readonly chatService: ChatService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Mutation(() => Chat)
  @InvalidateCache((result: Chat) => [
    `chats:${result.requesterId}`,
    `chats:${result.authorId}`,
    `chat:${result.id}`,
    `postChats:${result.postId}`,
  ])
  createChat(
    @Args('createChatInput') createChatInput: CreateChatInput,
    @Context('req') req: { user?: User },
  ) {
    return this.chatService.create(createChatInput, req.user?.id);
  }

  @Mutation(() => ChatMessage)
  @InvalidateCache((result: ChatMessage) => [
    `chat:${result.chatId}`,
    `chatMessages:${result.chatId}`,
  ])
  createChatMessage(
    @Args('createChatMessageInput') createChatMessageInput: CreateChatMessageInput,
    @Context('req') req: { user?: User },
  ) {
    return this.chatService.createMessage(createChatMessageInput, req.user?.id);
  }

  @Mutation(() => Boolean)
  @InvalidateCache((_result: boolean, blockUserInput: BlockUserInput, userId: string) => [
    `chats:${userId}`,
    `chats:${blockUserInput.userId}`,
  ])
  blockUser(
    @Args('blockUserInput') blockUserInput: BlockUserInput,
    @Context('req') req: { user?: User },
  ) {
    return this.chatService.blockUser(blockUserInput, req.user?.id);
  }

  @Mutation(() => Boolean)
  @InvalidateCache((_result: boolean, chatId: string) => [`chat:${chatId}`])
  deleteChat(
    @Args('chatId', { type: () => String }) chatId: string,
    @Context('req') req: { user?: User },
  ) {
    return this.chatService.deleteChat(chatId, req.user?.id);
  }

  @Mutation(() => Boolean)
  reportChat(
    @Args('reportChatInput') reportChatInput: ReportChatInput,
    @Context('req') req: { user?: User },
  ) {
    return this.chatService.reportChat(reportChatInput, req.user?.id);
  }

  @Query(() => Chat, { nullable: true })
  @CacheQuery((postId: string, userId: string) => `chat:${postId}:${userId}`, 300)
  getChatByPostAndUser(
    @Args('postId', { type: () => String }) postId: string,
    @Context('req') req: { user?: User },
  ) {
    return this.chatService.findByPostAndUser(postId, req.user?.id);
  }

  @Query(() => Chat)
  @CacheQuery((id: string) => `chat:${id}`, 300)
  getChatById(
    @Args('id', { type: () => String }) id: string,
    @Context('req') req: { user?: User },
  ) {
    return this.chatService.findById(id, req.user?.id);
  }

  @Query(() => [Chat])
  @CacheQuery((userId: string) => `chats:${userId}`, 300)
  getChatsForUser(@CurrentUser() user?: User) {
    return this.chatService.findChatsForUser(user?.id);
  }

  // Field resolvers for relations
  @ResolveField('post', () => Post)
  async post(
    @Parent() chat: Chat & { postId: string },
    @Loader(PostLoader) loader: DataLoader<string, Post | null>,
  ): Promise<Post | null> {
    return loader.load(chat.postId);
  }

  @ResolveField('requester', () => User)
  async requester(
    @Parent() chat: Chat & { requesterId: string },
    @Loader(UserLoader) loader: DataLoader<string, User | null>,
  ): Promise<User | null> {
    return loader.load(chat.requesterId);
  }

  @ResolveField('author', () => User)
  async author(
    @Parent() chat: Chat & { authorId: string },
    @Loader(UserLoader) loader: DataLoader<string, User | null>,
  ): Promise<User | null> {
    return loader.load(chat.authorId);
  }

  @ResolveField('messages', () => [ChatMessage])
  async messages(
    @Parent() chat: Chat & { id: string },
    @Args('take', { type: () => Int, nullable: true }) take?: number,
    @Args('orderBy', { type: () => String, nullable: true }) orderBy?: string,
  ): Promise<ChatMessage[]> {
    return this.chatService.getMessagesForChat(chat.id, { take, orderBy });
  }
}
