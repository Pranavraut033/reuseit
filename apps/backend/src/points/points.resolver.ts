import { Query, Resolver } from '@nestjs/graphql';

import { CurrentUser, User } from '~/decorators/CurrentUser';

import { PointsHistory } from './dto/point-history.entity';
import { PointsService } from './points.service';

@Resolver(() => PointsHistory)
export class PointResolver {
  constructor(private readonly pointService: PointsService) {}

  @Query()
  async pointHistories(@CurrentUser() user?: User) {
    if (!user) {
      return [];
    }

    return this.pointService.getPointHistories(user?.id);
  }
}
