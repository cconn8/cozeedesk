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
}

export interface UpdateCaseDto {
  title?: string;
  type?: string;
  paymentStatus?: string;
  templateId?: string;
  extractedFields?: Record<string, string>;
  attachments?: { url: string; filename: string }[];
}