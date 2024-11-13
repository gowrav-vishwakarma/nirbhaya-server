// files.module.ts
import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';

@Module({
  providers: [FileService],
  exports: [FileService],
  controllers: [FileController],
  //   imports: [FilesService],
})
export class FileModule {}
