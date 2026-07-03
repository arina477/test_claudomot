import { Module, forwardRef } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  // forwardRef resolves the circular dependency:
  //   UsersModule → FilesModule (for FilesService in UsersController)
  //   FilesModule → UsersModule (for UsersService in FilesController)
  imports: [forwardRef(() => FilesModule)],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
