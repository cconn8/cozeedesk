import { ObjectId } from 'mongodb';

export interface Case {
  _id?: ObjectId;
  tenantId: string;
  title: string;
  type: string;
  paymentStatus?: string;
  createdAt: Date;
  createdBy: string;
  templateId?: string;
  extractedFields: Record<string, string>;
  attachments?: { url: string; filename: string }[];
  // NEW: Extraction-related fields
  originalScanUrl?: string;
  status?: 'processing' | 'pending_verification' | 'active';
  extractionMetadata?: {
    confidence?: string;
    processingTime?: number;
    pagesProcessed?: number;
    extractionNotes?: string;
    lowConfidenceFields?: string[];
    error?: string;
  };
  extractionJobId?: string;
}

export interface CreateCaseDto {
  tenantId: string;
  title: string;
  type: string;
  paymentStatus?: string;
  createdBy: string;
  templateId?: string;
  extractedFields?: Record<string, string>;
  attachments?: { url: string; filename: string }[];
  // NEW: Extraction-related fields
  originalScanUrl?: string;
  status?: 'processing' | 'pending_verification' | 'active';
  extractionMetadata?: {
    confidence?: string;
    processingTime?: number;
    pagesProcessed?: number;
    extractionNotes?: string;
    lowConfidenceFields?: string[];
    error?: string;
  };
  extractionJobId?: string;
}

export interface UpdateCaseDto {
  title?: string;
  type?: string;
  paymentStatus?: string;
  templateId?: string;
  extractedFields?: Record<string, string>;
  attachments?: { url: string; filename: string }[];
  // NEW: Extraction-related fields
  originalScanUrl?: string;
  status?: 'processing' | 'pending_verification' | 'active';
  extractionMetadata?: {
    confidence?: string;
    processingTime?: number;
    pagesProcessed?: number;
    extractionNotes?: string;
    lowConfidenceFields?: string[];
    error?: string;
  };
  extractionJobId?: string;
}
