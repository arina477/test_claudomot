import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EntitlementsModule } from '../billing/entitlements.module';
import { RbacModule } from '../rbac/rbac.module';
import { InvitesController, ServersController } from './servers.controller';
import { ServersService } from './servers.service';

// ---------------------------------------------------------------------------
// ServersModule imports EntitlementsModule (one-way dependency).
// EntitlementsModule does NOT import ServersModule — no circular dependency.
// ---------------------------------------------------------------------------

@Module({
  imports: [AuthModule, RbacModule, EntitlementsModule],
  controllers: [ServersController, InvitesController],
  providers: [ServersService],
  exports: [ServersService],
})
export class ServersModule {}
