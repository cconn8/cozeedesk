import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { DatabaseService } from '../database/database.service';
import { DocumentProcessorService } from './services/document-processor.service';
import { ExtractionQueueService } from './services/extraction-queue.service';
import { NotificationGateway } from '../notifications/notification.gateway';

@Processor('document-extraction')
@Injectable()
export class ExtractionProcessor {
  private readonly logger = new Logger(ExtractionProcessor.name);

  constructor(
    private documentProcessorService: DocumentProcessorService,
    private extractionQueueService: ExtractionQueueService,
    private notificationGateway: NotificationGateway,
    private db: DatabaseService,
  ) {}

  @Process('extract-document')
  async handleExtraction(job: Job) {
    const { jobId, caseId, tenantId, fileUrl, mimeType, templateId, templateMode } = job.data;

    this.logger.log(`Processing extraction job ${jobId} for case ${caseId}`);

    try {
      // Update job status to processing
      await this.extractionQueueService.updateJobStatus(jobId, tenantId, {
        status: 'processing',
        startedAt: new Date(),
      });

      // Process the document
      const result = await this.documentProcessorService.processDocument(
        fileUrl,
        mimeType,
        tenantId,
        templateId,
        templateMode,
      );

      // Get tenant database
      const tenantDb = await this.db.getTenantDb(tenantId);
      const casesCollection = tenantDb.collection('cases');

      // Update case with extracted data
      await casesCollection.updateOne(
        { _id: new ObjectId(caseId) },
        {
          $set: {
            title: result.extractedData.suggestedTitle,
            type: result.extractedData.suggestedType,
            extractedFields: result.extractedData.fields,
            status: 'pending_verification',
            extractionMetadata: {
              confidence: result.extractedData.confidence,
              processingTime: result.processingTime,
              pagesProcessed: result.pagesProcessed,
              extractionNotes: result.extractedData.notes,
              lowConfidenceFields: result.extractedData.lowConfidenceFields,
            },
          }
        }
      );

      // Update job status to completed
      await this.extractionQueueService.updateJobStatus(jobId, tenantId, {
        status: 'completed',
        completedAt: new Date(),
        result: result.extractedData,
      });

      // Notify user via WebSocket
      this.notificationGateway.notifyExtractionComplete(tenantId, caseId, jobId, {
        confidence: result.extractedData.confidence,
        message: 'Extraction complete. Please review the results.',
        processingTime: result.processingTime,
        pagesProcessed: result.pagesProcessed,
      });

      this.logger.log(`Successfully processed job ${jobId} - confidence: ${result.extractedData.confidence}`);

      return { success: true };

    } catch (error) {
      this.logger.error(`Failed to process job ${jobId}: ${error.message}`);

      // Update job as failed
      await this.extractionQueueService.updateJobStatus(jobId, tenantId, {
        status: 'failed',
        error: error.message,
      });

      // Update case as rejected
      const tenantDb = await this.db.getTenantDb(tenantId);
      const casesCollection = tenantDb.collection('cases');
      
      await casesCollection.updateOne(
        { _id: new ObjectId(caseId) },
        {
          $set: {
            status: 'rejected',
            extractionMetadata: {
              error: error.message,
            },
          }
        }
      );

      // Notify user of failure via WebSocket
      this.notificationGateway.notifyExtractionFailed(tenantId, caseId, jobId, error.message);

      throw error; // Bull will retry based on job config
    }
  }
}