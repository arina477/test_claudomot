import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InvitesController, ServersController } from './servers.controller';
import { ServersService } from './servers.service';

@Module({
  imports: [AuthModule],
  controllers: [ServersController, InvitesController],
  providers: [ServersService],
})
export class ServersModule {}
