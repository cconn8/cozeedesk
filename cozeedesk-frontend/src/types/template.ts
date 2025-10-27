export interface CaseTemplate {
  _id: string;
  tenantId: string;
  name: string;
  type: string;
  extractedFieldKeys: string[];
  createdAt: string;
  createdBy: string;
}

export interface CreateTemplateRequest {
  name: string;
  type: string;
  extractedFieldKeys: string[];
  createdBy: string;
}

export interface UpdateTemplateRequest {
  name?: string;
  type?: string;
  extractedFieldKeys?: string[];
}