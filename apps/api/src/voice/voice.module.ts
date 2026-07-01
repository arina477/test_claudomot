import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { UsersModule } from '../users/users.module';
import { VoiceParticipantsController } from './voice-participants.controller';
import { VoiceParticipantsService } from './voice-participants.service';
import { VoiceTokenController } from './voice-token.controller';
import { VoiceTokenService } from './voice-token.service';

@Module({
  imports: [AuthModule, RbacModule, UsersModule],
  controllers: [VoiceTokenController, VoiceParticipantsController],
  providers: [VoiceTokenService, VoiceParticipantsService],
})
export class VoiceModule {}
