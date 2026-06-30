import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { UsersModule } from '../users/users.module';
import { AttachmentsController } from './attachments.controller';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    // RbacModule exports RbacService (canViewChannelById) — used by AttachmentsController
    RbacModule,
  ],
  controllers: [FilesController, AttachmentsController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
