import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChannelMessageGuard } from './channel-message.guard';
import { ChannelOverrideController } from './channel-override.controller';
import { ChannelPermissionGuard } from './channel-permission.guard';
import { OwnerLockoutService } from './owner-lockout.service';
import { MemberRoleController, RbacController } from './rbac.controller';
import { RbacService } from './rbac.service';

@Module({
  imports: [AuthModule],
  controllers: [RbacController, MemberRoleController, ChannelOverrideController],
  providers: [RbacService, ChannelPermissionGuard, ChannelMessageGuard, OwnerLockoutService],
  exports: [RbacService, ChannelPermissionGuard, ChannelMessageGuard, OwnerLockoutService],
})
export class RbacModule {}
