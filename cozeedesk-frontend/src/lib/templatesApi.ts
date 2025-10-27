import axios from 'axios';
import { CaseTemplate, CreateTemplateRequest, UpdateTemplateRequest } from '@/types/template';

const API_BASE = 'http://localhost:3005';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const templatesApi = {
  // Get all templates for current tenant
  async getTemplates(): Promise<CaseTemplate[]> {
    const response = await axios.get(`${API_BASE}/templates`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Get single template
  async getTemplate(id: string): Promise<CaseTemplate> {
    const response = await axios.get(`${API_BASE}/templates/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Create new template
  async createTemplate(templateData: CreateTemplateRequest): Promise<CaseTemplate> {
    const response = await axios.post(`${API_BASE}/templates`, templateData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Update template
  async updateTemplate(id: string, updates: UpdateTemplateRequest): Promise<CaseTemplate> {
    const response = await axios.patch(`${API_BASE}/templates/${id}`, updates, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Delete template
  async deleteTemplate(id: string): Promise<void> {
    await axios.delete(`${API_BASE}/templates/${id}`, {
      headers: getAuthHeaders(),
    });
  },
};