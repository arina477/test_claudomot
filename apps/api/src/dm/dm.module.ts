/**
 * DmModule — wave-46 M8 direct messages (tasks a48f1910 + 32f5d29e)
 *
 * Provides:
 *   DmService    — createConversation / listConversations / sendMessage / listMessages
 *   DmController — REST endpoints at /dm/conversations[/:id/messages]
 *   DmParticipantGuard — participant-gated IDOR-safe guard for :id routes
 *
 * EventEmitterModule is imported at AppModule level; DmService receives
 * EventEmitter2 via NestJS DI without a local import.
 *
 * MessagingModule provides the MessagingGateway (already registered in AppModule)
 * which handles the dm.message → dm:message fan-out. No circular dependency:
 * DmService emits a domain event; the gateway listens via @OnEvent.
 */

import { Module } from '@nestjs/common';
import { DmParticipantGuard } from './dm-participant.guard';
import { DmController } from './dm.controller';
import { DmService } from './dm.service';

@Module({
  controllers: [DmController],
  providers: [DmService, DmParticipantGuard],
  exports: [DmService],
})
export class DmModule {}
