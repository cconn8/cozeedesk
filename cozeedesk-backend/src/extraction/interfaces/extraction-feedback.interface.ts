import { ObjectId } from 'mongodb';

export interface ExtractionFeedback {
  _id?: ObjectId;
  caseId: string;
  tenantId: string;
  userId: string;
  originalExtraction: Record<string, any>;
  userCorrections: Record<string, any>;
  correctedFields: string[];
  addedFields: string[];
  removedFields: string[];
  createdAt: Date;
}