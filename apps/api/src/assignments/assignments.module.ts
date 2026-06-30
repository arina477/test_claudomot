import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { RbacModule } from '../rbac/rbac.module';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';

// ---------------------------------------------------------------------------
// AssignmentsModule — wave-22 M5 (task 01fcefb8)
//
// Imports:
//   - RbacModule: exports RbacService (can() — organizer authz)
//   - FilesModule: exports FilesService (presignAttachmentUpload + headAttachment)
//
// No DbModule import needed — the service uses the shared `db` singleton from
// '../db/index' directly, consistent with all other modules in this codebase.
// ---------------------------------------------------------------------------

@Module({
  imports: [
    // RbacModule exports RbacService — organizer can() gate + owner superuser
    RbacModule,
    // FilesModule exports FilesService — attachment presign/head (wave-19 pattern)
    FilesModule,
  ],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
