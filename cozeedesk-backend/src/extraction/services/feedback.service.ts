import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { ExtractionFeedback } from '../interfaces/extraction-feedback.interface';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(private db: DatabaseService) {}

  /**
   * Log user corrections for future improvement
   */
  async logCorrections(data: {
    caseId: string;
    tenantId: string;
    userId: string;
    originalExtraction: Record<string, any>;
    userCorrections: Record<string, any>;
  }): Promise<ExtractionFeedback> {
    
    this.logger.log(`Logging corrections for case ${data.caseId}`);
    
    // Get tenant database
    const tenantDb = await this.db.getTenantDb(data.tenantId);
    const feedbackCollection = tenantDb.collection<ExtractionFeedback>('extraction_feedback');
    
    // Analyze differences
    const correctedFields = this.findCorrectedFields(
      data.originalExtraction,
      data.userCorrections,
    );

    const addedFields = this.findAddedFields(
      data.originalExtraction,
      data.userCorrections,
    );

    const removedFields = this.findRemovedFields(
      data.originalExtraction,
      data.userCorrections,
    );

    // Store feedback
    const feedback: Omit<ExtractionFeedback, '_id'> = {
      caseId: data.caseId,
      tenantId: data.tenantId,
      userId: data.userId,
      originalExtraction: data.originalExtraction,
      userCorrections: data.userCorrections,
      correctedFields,
      addedFields,
      removedFields,
      createdAt: new Date(),
    };

    const result = await feedbackCollection.insertOne(feedback as ExtractionFeedback);
    
    this.logger.log(`Logged ${correctedFields.length} corrections, ${addedFields.length} additions, ${removedFields.length} removals`);
    
    return { ...feedback, _id: result.insertedId } as ExtractionFeedback;
  }

  private findCorrectedFields(original: any, corrected: any): string[] {
    const corrections = [];
    
    for (const key in corrected) {
      if (original[key] !== corrected[key] && original[key] !== undefined) {
        corrections.push(key);
      }
    }
    
    return corrections;
  }

  private findAddedFields(original: any, corrected: any): string[] {
    return Object.keys(corrected).filter(key => !(key in original));
  }

  private findRemovedFields(original: any, corrected: any): string[] {
    return Object.keys(original).filter(key => !(key in corrected));
  }

  /**
   * Get most frequently corrected fields (for analytics)
   */
  async getMostCorrectedFields(tenantId: string, limit: number = 10) {
    const tenantDb = await this.db.getTenantDb(tenantId);
    const feedbackCollection = tenantDb.collection<ExtractionFeedback>('extraction_feedback');
    
    return feedbackCollection.aggregate([
      { $match: { tenantId } },
      { $unwind: '$correctedFields' },
      { $group: { _id: '$correctedFields', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]).toArray();
  }

  /**
   * Calculate extraction accuracy
   */
  async getExtractionAccuracy(tenantId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const tenantDb = await this.db.getTenantDb(tenantId);
    const feedbackCollection = tenantDb.collection<ExtractionFeedback>('extraction_feedback');

    const total = await feedbackCollection.countDocuments({
      tenantId,
      createdAt: { $gte: since },
    });

    const withCorrections = await feedbackCollection.countDocuments({
      tenantId,
      createdAt: { $gte: since },
      correctedFields: { $exists: true, $ne: [] },
    });

    return {
      totalExtractions: total,
      perfectExtractions: total - withCorrections,
      accuracy: total > 0 ? ((total - withCorrections) / total) * 100 : 0,
    };
  }
}