/**
 * DmModule — wave-46 M8 direct messages (tasks a48f1910 + 32f5d29e)
 *             wave-47 M8 DM entry-point (task 10967558)
 *
 * Provides:
 *   DmService              — createConversation / listConversations / sendMessage / listMessages / getDmCandidates
 *   DmController           — REST endpoints at /dm/conversations[/:id/messages]
 *   DmCandidatesController — GET /dm/candidates (server co-members)
 *   DmParticipantGuard     — participant-gated IDOR-safe guard for :id routes
 *
 * EventEmitterModule is imported at AppModule level; DmService receives
 * EventEmitter2 via NestJS DI without a local import.
 *
 * MessagingModule provides the MessagingGateway (already registered in AppModule)
 * which handles the dm.message → dm:message fan-out. No circular dependency:
 * DmService emits a domain event; the gateway listens via @OnEvent.
 *
 * BlocksModule is imported here (wave-70) to provide BlocksService for the
 * DM HIDE predicate (isBlockedBetween). DI direction: BlocksModule → DmModule
 * only; BlocksService does not depend on DmService (no circular dependency).
 */

import { Module } from '@nestjs/common';
import { BlocksModule } from '../blocks/blocks.module';
import { DmParticipantGuard } from './dm-participant.guard';
import { DmCandidatesController, DmController } from './dm.controller';
import { DmService } from './dm.service';

@Module({
  imports: [BlocksModule],
  controllers: [DmController, DmCandidatesController],
  providers: [DmService, DmParticipantGuard],
  exports: [DmService],
})
export class DmModule {}
