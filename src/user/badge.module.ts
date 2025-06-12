import { Module } from '@nestjs/common';
import { BadgeService } from './badge.service';
import { BadgeResolver } from './badge.resolver';

@Module({
  providers: [BadgeResolver, BadgeService],
})
export class BadgeModule {}
