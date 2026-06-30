import { Module } from '@nestjs/common';
import { RbacModule } from '../rbac/rbac.module';
import { MentionsController, MessagesController, ThreadsController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MessagingGateway } from './messaging.gateway';

@Module({
  imports: [
    // RbacModule exports RbacService (for canViewChannelById) + ChannelMessageGuard
    RbacModule,
  ],
  controllers: [MessagesController, MentionsController, ThreadsController],
  providers: [MessagesService, MessagingGateway],
  exports: [MessagesService],
})
export class MessagingModule {}
