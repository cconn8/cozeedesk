import { ObjectId } from 'mongodb';

export interface ExtractionJob {
  _id?: ObjectId;
  caseId: string;
  tenantId: string;
  fileUrl: string;
  mimeType: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  templateId?: string;
  templateMode?: 'strict' | 'flexible';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  result?: any;
  retryCount: number;
}