import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventResolver } from './event.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  providers: [EventResolver, EventService],
  imports: [PrismaModule],
})
export class EventModule {}
