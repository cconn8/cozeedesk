import { ObjectId } from 'mongodb';

export interface CaseTemplate {
  _id?: ObjectId;
  tenantId: string;
  name: string;
  type: string;
  extractedFieldKeys: string[];
  createdAt: Date;
  createdBy: string;
}

export interface CreateTemplateDto {
  tenantId: string;
  name: string;
  type: string;
  extractedFieldKeys: string[];
  createdBy: string;
}

export interface UpdateTemplateDto {
  name?: string;
  type?: string;
  extractedFieldKeys?: string[];
}