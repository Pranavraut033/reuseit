import { forwardRef, Module } from '@nestjs/common';

import { NotificationModule } from '~/notification/notification.module';
import { UserModule } from '~/user/user.module';

import { ChatLoader } from './chat.loader';
import { ChatResolver } from './chat.resolver';
import { ChatService } from './chat.service';
import { ChatMessageResolver } from './chat-message.resolver';
import { PostModule } from './post.module';

@Module({
  providers: [ChatResolver, ChatMessageResolver, ChatService, ChatLoader],
  imports: [NotificationModule, forwardRef(() => UserModule), forwardRef(() => PostModule)],
  exports: [ChatService],
})
export class ChatModule {}
