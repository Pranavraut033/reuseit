import { Module } from '@nestjs/common';

import { PrismaModule } from '~/prisma/prisma.module';

import {
  LocationCreatorLoader,
  LocationEventsLoader,
  LocationPostsLoader,
} from './location.loader';
import { LocationResolver } from './location.resolver';
import { LocationService } from './location.service';

@Module({
  providers: [
    LocationService,
    LocationResolver,
    LocationCreatorLoader,
    LocationPostsLoader,
    LocationEventsLoader,
  ],
  imports: [PrismaModule],
  exports: [LocationService],
})
export class LocationModule {}
