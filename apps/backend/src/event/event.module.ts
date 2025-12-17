import { Module } from '@nestjs/common';

import { LocationModule } from '~/location/location.module';
import { NotificationModule } from '~/notification/notification.module';
import { UserModule } from '~/user/user.module';

import { PrismaModule } from '../prisma/prisma.module';
import { EventParticipantsLoader, EventPostsLoader } from './event.loader';
import { EventResolver } from './event.resolver';
import { EventService } from './event.service';

@Module({
  providers: [EventResolver, EventService, EventPostsLoader, EventParticipantsLoader],
  imports: [PrismaModule, LocationModule, NotificationModule, UserModule],
})
export class EventModule {}
