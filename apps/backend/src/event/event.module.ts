import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { EventResolver } from './event.resolver';
import { EventService } from './event.service';

@Module({
  providers: [EventResolver, EventService],
  imports: [PrismaModule],
})
export class EventModule {}
