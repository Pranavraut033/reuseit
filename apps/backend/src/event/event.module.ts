import { Module } from '@nestjs/common';

import { LocationModule } from '~/location/location.module';
import { NotificationModule } from '~/notification/notification.module';

import { PrismaModule } from '../prisma/prisma.module';
import {
  EventCreatorLoader,
  EventLocationLoader,
  EventParticipantsLoader,
  EventPostsLoader,
} from './event.loader';
import { EventResolver } from './event.resolver';
import { EventService } from './event.service';

@Module({
  providers: [
    EventResolver,
    EventService,
    EventCreatorLoader,
    EventLocationLoader,
    EventPostsLoader,
    EventParticipantsLoader,
  ],
  imports: [PrismaModule, LocationModule, NotificationModule],
})
export class EventModule {}
