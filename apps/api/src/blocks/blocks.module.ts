import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrivacyModule } from '../privacy/privacy.module';
import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';

// ---------------------------------------------------------------------------
// BlocksModule — wave-70 M14 user-to-user block feature
//
// Imports:
//   AuthModule    — provides AuthGuard (used by BlocksController)
//   PrivacyModule — provides AppendPrivacyEventService (wave-73 B-2 audit log
//                   hooks for user_blocked / user_unblocked events). PrivacyModule
//                   exports the service so BlocksService can inject it without
//                   a circular dependency: the flow is one-directional
//                   (BlocksModule → PrivacyModule, never back).
//
// Exports:
//   BlocksService — exported so DmModule can import BlocksModule and inject
//                   BlocksService for the DM HIDE predicate (isBlockedBetween).
//
// DI direction: BlocksModule → DmModule (one way). DmModule imports BlocksModule.
// This avoids a circular dependency: DmService does NOT import back into
// BlocksModule, and BlocksService does not depend on DmService.
// ---------------------------------------------------------------------------

@Module({
  imports: [AuthModule, PrivacyModule],
  controllers: [BlocksController],
  providers: [BlocksService],
  exports: [BlocksService],
})
export class BlocksModule {}
