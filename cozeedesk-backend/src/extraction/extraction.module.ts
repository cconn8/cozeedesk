import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { DatabaseModule } from '../database/database.module';
import { StorageModule } from '../storage/storage.module';
import { ImageEnhancementService } from './services/image-enhancement.service';
import { ClaudeVisionService } from './services/claude-vision.service';
import { DocumentProcessorService } from './services/document-processor.service';
import { ExtractionQueueService } from './services/extraction-queue.service';
import { FeedbackService } from './services/feedback.service';
import { ExtractionProcessor } from './extraction.processor';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    StorageModule,
    NotificationsModule,
    BullModule.registerQueue({
      name: 'document-extraction',
    }),
  ],
  providers: [
    ImageEnhancementService,
    ClaudeVisionService,
    DocumentProcessorService,
    ExtractionQueueService,
    FeedbackService,
    ExtractionProcessor,
  ],
  exports: [
    ExtractionQueueService,
    FeedbackService,
  ],
})
export class ExtractionModule {}