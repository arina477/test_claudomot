import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChannelMessageGuard } from './channel-message.guard';
import { ChannelOverrideController } from './channel-override.controller';
import { ChannelPermissionGuard } from './channel-permission.guard';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { OwnerLockoutService } from './owner-lockout.service';
import {
  MemberRoleController,
  RbacController,
  ServerPermissionsController,
} from './rbac.controller';
import { RbacService } from './rbac.service';

@Module({
  imports: [AuthModule],
  controllers: [
    RbacController,
    MemberRoleController,
    ServerPermissionsController,
    ChannelOverrideController,
    ModerationController,
  ],
  providers: [
    RbacService,
    ChannelPermissionGuard,
    ChannelMessageGuard,
    OwnerLockoutService,
    ModerationService,
  ],
  exports: [RbacService, ChannelPermissionGuard, ChannelMessageGuard, OwnerLockoutService],
})
export class RbacModule {}
