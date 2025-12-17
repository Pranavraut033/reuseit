import { Module } from '@nestjs/common';

import { PrismaModule } from '~/prisma/prisma.module';

import { LocationEventsLoader, LocationLoader, LocationPostsLoader } from './location.loader';
import { LocationResolver } from './location.resolver';
import { LocationService } from './location.service';

@Module({
  providers: [
    LocationService,
    LocationResolver,
    LocationLoader,
    LocationPostsLoader,
    LocationEventsLoader,
  ],
  imports: [PrismaModule],
  exports: [LocationService, LocationLoader],
})
export class LocationModule {}
