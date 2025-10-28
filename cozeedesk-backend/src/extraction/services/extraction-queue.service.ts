import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { DatabaseService } from '../../database/database.service';
import { ExtractionJob } from '../interfaces/extraction-job.interface';
import { ObjectId } from 'mongodb';

@Injectable()
export class ExtractionQueueService {
  private readonly logger = new Logger(ExtractionQueueService.name);

  constructor(
    @InjectQueue('document-extraction') private extractionQueue: Queue,
    private db: DatabaseService,
  ) {}

  /**
   * Add extraction job to queue
   */
  async addJob(data: {
    caseId: string;
    tenantId: string;
    fileUrl: string;
    mimeType: string;
    templateId?: string;
    templateMode?: 'strict' | 'flexible';
  }): Promise<ExtractionJob> {
    
    this.logger.log(`Creating extraction job for case ${data.caseId}`);
    
    // Get tenant database
    const tenantDb = await this.db.getTenantDb(data.tenantId);
    const extractionJobsCollection = tenantDb.collection<ExtractionJob>('extraction_jobs');
    
    // Create job record in database
    const jobRecord: Omit<ExtractionJob, '_id'> = {
      ...data,
      status: 'queued',
      createdAt: new Date(),
      retryCount: 0,
    };

    const result = await extractionJobsCollection.insertOne(jobRecord as ExtractionJob);
    const insertedJob = { ...jobRecord, _id: result.insertedId };

    // Add to Bull queue for background processing
    await this.extractionQueue.add('extract-document', {
      jobId: result.insertedId.toString(),
      ...data,
    }, {
      attempts: 3, // Retry up to 3 times
      backoff: {
        type: 'exponential',
        delay: 2000, // Start with 2 second delay
      },
      removeOnComplete: true,
      removeOnFail: false,
    });

    this.logger.log(`Job ${result.insertedId} added to queue`);

    return insertedJob as ExtractionJob;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string, tenantId: string): Promise<ExtractionJob | null> {
    const tenantDb = await this.db.getTenantDb(tenantId);
    const extractionJobsCollection = tenantDb.collection<ExtractionJob>('extraction_jobs');
    
    return extractionJobsCollection.findOne({ _id: new ObjectId(jobId) });
  }

  /**
   * Update job status
   */
  async updateJobStatus(
    jobId: string, 
    tenantId: string, 
    update: Partial<ExtractionJob>
  ): Promise<void> {
    const tenantDb = await this.db.getTenantDb(tenantId);
    const extractionJobsCollection = tenantDb.collection<ExtractionJob>('extraction_jobs');
    
    await extractionJobsCollection.updateOne(
      { _id: new ObjectId(jobId) },
      { $set: update }
    );
  }
}