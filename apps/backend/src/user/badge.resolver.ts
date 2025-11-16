import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';

import { BadgeService } from './badge.service';
import { CreateBadgeInput } from './dto/create-badge.input';
import { UpdateBadgeInput } from './dto/update-badge.input';
import { Badge } from './entities/badge.entity';

@Resolver(() => Badge)
export class BadgeResolver {
  constructor(private readonly badgeService: BadgeService) {}

  @Mutation(() => Badge)
  createBadge(@Args('createBadgeInput') createBadgeInput: CreateBadgeInput) {
    return this.badgeService.create(createBadgeInput);
  }

  @Query(() => [Badge], { name: 'badge' })
  findAll() {
    return this.badgeService.findAll();
  }

  @Query(() => Badge, { name: 'badge' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.badgeService.findOne(id);
  }

  @Mutation(() => Badge)
  updateBadge(@Args('updateBadgeInput') updateBadgeInput: UpdateBadgeInput) {
    return this.badgeService.update(updateBadgeInput.id, updateBadgeInput);
  }

  @Mutation(() => Badge)
  removeBadge(@Args('id', { type: () => Int }) id: number) {
    return this.badgeService.remove(id);
  }
}
