import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { UsersModule } from '../users/users.module';
import { AttachmentsController } from './attachments.controller';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  imports: [
    // forwardRef resolves the circular dependency introduced by wave-38:
    //   FilesModule → UsersModule (for UsersService in FilesController)
    //   UsersModule → FilesModule (for FilesService in UsersController)
    forwardRef(() => UsersModule),
    AuthModule,
    // RbacModule exports RbacService (canViewChannelById) — used by AttachmentsController
    RbacModule,
  ],
  controllers: [FilesController, AttachmentsController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
