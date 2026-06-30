import { Module } from '@nestjs/common';
import { RbacModule } from '../rbac/rbac.module';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [
    // RbacModule exports RbacService (for canViewChannelById) + ChannelMessageGuard
    RbacModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagingModule {}
