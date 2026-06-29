import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChannelOverrideController } from './channel-override.controller';
import { ChannelPermissionGuard } from './channel-permission.guard';
import { MemberRoleController, RbacController } from './rbac.controller';
import { RbacService } from './rbac.service';

@Module({
  imports: [AuthModule],
  controllers: [RbacController, MemberRoleController, ChannelOverrideController],
  providers: [RbacService, ChannelPermissionGuard],
  exports: [RbacService, ChannelPermissionGuard],
})
export class RbacModule {}
