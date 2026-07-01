import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { VoiceTokenController } from './voice-token.controller';
import { VoiceTokenService } from './voice-token.service';

@Module({
  imports: [AuthModule, RbacModule],
  controllers: [VoiceTokenController],
  providers: [VoiceTokenService],
})
export class VoiceModule {}
