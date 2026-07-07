import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BlocksModule } from '../blocks/blocks.module';
import { UsersModule } from '../users/users.module';
import { ProfileVisibilityService } from './profile-visibility.service';
import { ProfileController } from './profile.controller';

// wave-77 M13 leg-2: BlocksModule imported so ProfileVisibilityService can inject
// BlocksService.isBlockedBetween for the fail-closed cross-server visibility gate
// (task bf0ad2a8). One-directional dependency: ProfileModule → BlocksModule.
@Module({
  imports: [UsersModule, AuthModule, BlocksModule],
  controllers: [ProfileController],
  providers: [ProfileVisibilityService],
})
export class ProfileModule {}
