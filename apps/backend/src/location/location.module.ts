import { Module } from '@nestjs/common';

import { PrismaModule } from '~/prisma/prisma.module';

import { LocationResolver } from './location.resolver';
import { LocationService } from './location.service';

@Module({
  providers: [LocationService, LocationResolver],
  imports: [PrismaModule],
})
export class LocationModule {}
