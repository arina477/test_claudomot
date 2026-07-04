import { Module } from '@nestjs/common';
import { RbacModule } from '../rbac/rbac.module';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';

// ---------------------------------------------------------------------------
// SchedulingModule — wave-43 class-scheduling (task 535bdb8c)
//
// Imports:
//   - RbacModule: exports RbacService (can() — organizer authz)
//
// No FilesModule needed — scheduling has no attachment/presign functionality.
// No DbModule import needed — the service uses the shared `db` singleton from
// '../db/index' directly, consistent with all other modules in this codebase.
// ---------------------------------------------------------------------------

@Module({
  imports: [
    // RbacModule exports RbacService — organizer can() gate + owner superuser
    RbacModule,
  ],
  controllers: [SchedulingController],
  providers: [SchedulingService],
  exports: [SchedulingService],
})
export class SchedulingModule {}
