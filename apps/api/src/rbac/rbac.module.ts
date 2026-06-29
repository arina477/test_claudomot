import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MemberRoleController, RbacController } from './rbac.controller';
import { RbacService } from './rbac.service';

@Module({
  imports: [AuthModule],
  controllers: [RbacController, MemberRoleController],
  providers: [RbacService],
  exports: [RbacService],
})
export class RbacModule {}
