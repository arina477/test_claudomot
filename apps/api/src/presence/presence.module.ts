import { Module } from '@nestjs/common';
import { RbacModule } from '../rbac/rbac.module';
import { PresenceGateway } from './presence.gateway';
import { PresenceService } from './presence.service';

@Module({
  imports: [
    // RbacModule exports RbacService (for canViewChannelById) — value import
    RbacModule,
  ],
  providers: [PresenceService, PresenceGateway],
})
export class PresenceModule {}
