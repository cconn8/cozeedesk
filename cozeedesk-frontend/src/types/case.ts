export interface Case {
  _id: string;
  tenantId: string;
  title: string;
  type: string;
  paymentStatus?: string;
  createdAt: string;
  createdBy: string;
  templateId?: string;
  extractedFields: Record<string, string>;
  attachments?: { url: string; filename: string }[];
  // Extraction fields
  originalScanUrl?: string;
  status?: 'processing' | 'pending_verification' | 'active';
  extractionJobId?: string;
  extractionMetadata?: {
    confidence?: string;
    processingTime?: number;
    pagesProcessed?: number;
    extractionNotes?: string;
    lowConfidenceFields?: string[];
    error?: string;
  };
}

export interface CreateCaseRequest {
  title: string;
  type: string;
  paymentStatus?: string;
  createdBy: string;
  templateId?: string;
  extractedFields?: Record<string, string>;
  attachments?: { url: string; filename: string }[];
}

export interface UpdateCaseRequest {
  title?: string;
  type?: string;
  paymentStatus?: string;
  templateId?: string;
  extractedFields?: Record<string, string>;
  attachments?: { url: string; filename: string }[];
}

// Extraction-related interfaces
export interface ScanUploadRequest {
  templateId?: string;
  templateMode?: 'strict' | 'flexible';
}

export interface VerificationData {
  case: Case;
  originalScanUrl: string;
  extractionMetadata: {
    confidence?: string;
    processingTime?: number;
    pagesProcessed?: number;
    extractionNotes?: string;
    lowConfidenceFields?: string[];
    error?: string;
  };
}

// Simplified interface for saving extracted data after user verification
export interface SaveExtractionRequest {
  title?: string;
  extractedFields?: Record<string, string>;
  saveAsTemplate?: {
    name: string;
    type: string;
    titleField?: string;
  };
}