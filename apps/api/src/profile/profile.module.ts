import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BlocksModule } from '../blocks/blocks.module';
import { DmModule } from '../dm/dm.module';
import { UsersModule } from '../users/users.module';
import { EncryptionKeyService } from './encryption-key.service';
import { ProfileVisibilityService } from './profile-visibility.service';
import { ProfileController } from './profile.controller';

// wave-77 M13 leg-2: BlocksModule imported so ProfileVisibilityService can inject
// BlocksService.isBlockedBetween for the fail-closed cross-server visibility gate
// (task bf0ad2a8). One-directional dependency: ProfileModule → BlocksModule.
//
// wave-79 M13 leg-3a: DmModule imported so the GET /profile/:userId/encryption-key
// gate can reuse DmService.canDm (the who_can_dm seam) — a peer-key fetch is
// gated on who_can_dm, NOT profile_visibility (P-4 karen correction 1).
// EncryptionKeyService is a leaf provider (own the user_encryption_keys table).
@Module({
  imports: [UsersModule, AuthModule, BlocksModule, DmModule],
  controllers: [ProfileController],
  providers: [ProfileVisibilityService, EncryptionKeyService],
})
export class ProfileModule {}
