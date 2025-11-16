import { Module } from '@nestjs/common';

import { PointResolver } from './point.resolver';
import { PointService } from './point.service';

@Module({
  providers: [PointResolver, PointService],
})
export class PointModule {}
