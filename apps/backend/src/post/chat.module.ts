import { Module } from '@nestjs/common';

import { NotificationModule } from '~/notification/notification.module';

import {
  ChatAuthorLoader,
  ChatLoader,
  ChatMessageSenderLoader,
  ChatPostLoader,
  ChatRequesterLoader,
} from './chat.loader';
import { ChatResolver } from './chat.resolver';
import { ChatService } from './chat.service';
import { ChatMessageResolver } from './chat-message.resolver';

@Module({
  providers: [
    ChatResolver,
    ChatMessageResolver,
    ChatService,
    ChatPostLoader,
    ChatRequesterLoader,
    ChatAuthorLoader,
    ChatMessageSenderLoader,
    ChatLoader,
  ],
  imports: [NotificationModule],
  exports: [ChatService],
})
export class ChatModule {}
