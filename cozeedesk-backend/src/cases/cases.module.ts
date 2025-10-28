import { Module } from '@nestjs/common';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from 'src/auth/auth.module';
import { ExtractionModule } from '../extraction/extraction.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [DatabaseModule, AuthModule, ExtractionModule, StorageModule],
  controllers: [CasesController],
  providers: [CasesService],
  exports: [CasesService],
})
export class CasesModule {}
