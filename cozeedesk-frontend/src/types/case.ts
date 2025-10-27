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