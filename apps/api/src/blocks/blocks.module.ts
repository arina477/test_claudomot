import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';

// ---------------------------------------------------------------------------
// BlocksModule — wave-70 M14 user-to-user block feature
//
// Imports:
//   AuthModule — provides AuthGuard (used by BlocksController)
//
// Exports:
//   BlocksService — exported so DmModule can import BlocksModule and inject
//                   BlocksService for the DM HIDE predicate (isBlockedBetween).
//
// DI direction: BlockModule → DmModule (one way). DmModule imports BlockModule.
// This avoids a circular dependency: DmService does NOT import back into
// BlocksModule, and BlocksService does not depend on DmService.
// ---------------------------------------------------------------------------

@Module({
  imports: [AuthModule],
  controllers: [BlocksController],
  providers: [BlocksService],
  exports: [BlocksService],
})
export class BlocksModule {}
