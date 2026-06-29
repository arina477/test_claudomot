import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { InvitesController, ServersController } from './servers.controller';
import { ServersService } from './servers.service';

@Module({
  imports: [AuthModule, RbacModule],
  controllers: [ServersController, InvitesController],
  providers: [ServersService],
  exports: [ServersService],
})
export class ServersModule {}
