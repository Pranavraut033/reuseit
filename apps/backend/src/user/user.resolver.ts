import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import DataLoader from 'dataloader';
import { Loader } from 'nestjs-dataloader';

import { Event } from '~/event/entities/event.entity';
import { EvenParticipant } from '~/event/entities/event-participant.entity';
import { PointsHistory } from '~/points/dto/point-history.entity';
import { Post } from '~/post/entities/post.entity';

import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { Badge } from './entities/badge.entity';
import { BadgeAssignment } from './entities/badge-assignment';
import { User } from './entities/user.entity';
import { UserArticle } from './entities/user-article.entity';
import {
  UserArticlesLoader,
  UserBadgesLoader,
  UserCommentsLoader,
  UserEventParticipationsLoader,
  UserEventsLoader,
  UserPointsHistoryLoader,
  UserPostsLoader,
} from './user.loader';
import { UserService } from './user.service';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => User)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.userService.create(createUserInput);
  }

  @Query(() => [User], { name: 'users' })
  findAll() {
    return this.userService.findAll();
  }

  @Query(() => User, { name: 'user' })
  findOne(
    @Args('id', { type: () => String, nullable: true }) id?: string,
    @Args('email', { type: () => String, nullable: true }) email?: string,
  ) {
    return this.userService.findOne({ id, email });
  }

  @Mutation(() => User)
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return this.userService.update(updateUserInput.id, updateUserInput);
  }

  @Mutation(() => User)
  removeUser(@Args('id', { type: () => String }) id: string) {
    return this.userService.remove(id);
  }

  // Field resolvers for relations
  @ResolveField('posts', () => [Post])
  async posts(
    @Parent() user: User,
    @Loader(UserPostsLoader) loader: DataLoader<string, Post[]>,
  ): Promise<Post[]> {
    return loader.load(user.id);
  }

  @ResolveField('comments', () => [Comment])
  async comments(
    @Parent() user: User,
    @Loader(UserCommentsLoader) loader: DataLoader<string, Comment[]>,
  ): Promise<Comment[]> {
    return loader.load(user.id);
  }

  @ResolveField('badges', () => [Badge])
  async badges(
    @Parent() user: User,
    @Loader(UserBadgesLoader) loader: DataLoader<string, BadgeAssignment[]>,
  ): Promise<BadgeAssignment[]> {
    return loader.load(user.id);
  }

  @ResolveField('eventsCreated', () => [Event])
  async eventsCreated(
    @Parent() user: User,
    @Loader(UserEventsLoader) loader: DataLoader<string, Event[]>,
  ): Promise<Event[]> {
    return loader.load(user.id);
  }

  @ResolveField('evenParticipant', () => [EvenParticipant])
  async evenParticipant(
    @Parent() user: User,
    @Loader(UserEventParticipationsLoader) loader: DataLoader<string, EvenParticipant[]>,
  ): Promise<EvenParticipant[]> {
    return loader.load(user.id);
  }

  @ResolveField('pointsHistory', () => [PointsHistory])
  async pointsHistory(
    @Parent() user: User,
    @Loader(UserPointsHistoryLoader) loader: DataLoader<string, PointsHistory[]>,
  ): Promise<PointsHistory[]> {
    return loader.load(user.id);
  }

  @ResolveField('userArticle', () => [UserArticle])
  async userArticle(
    @Parent() user: User,
    @Loader(UserArticlesLoader) loader: DataLoader<string, UserArticle[]>,
  ): Promise<UserArticle[]> {
    return loader.load(user.id);
  }
}
