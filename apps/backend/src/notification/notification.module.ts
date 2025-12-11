import { Module } from '@nestjs/common';

import { FirebaseModule } from '../firebase/firebase.module';
import { NotificationResolver } from './notification.resolver';
import { NotificationService } from './notification.service';

@Module({
  imports: [FirebaseModule],
  providers: [NotificationService, NotificationResolver],
  exports: [NotificationService],
})
export class NotificationModule {}
