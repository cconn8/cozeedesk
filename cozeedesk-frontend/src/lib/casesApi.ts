import axios from 'axios';
import { Case, CreateCaseRequest, UpdateCaseRequest } from '@/types/case';

const API_BASE = 'http://localhost:3005';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const casesApi = {
  // Get all cases for current tenant
  async getCases(search?: string): Promise<Case[]> {
    const params = search ? { search } : {};
    const response = await axios.get(`${API_BASE}/cases`, {
      headers: getAuthHeaders(),
      params,
    });
    return response.data;
  },

  // Get single case
  async getCase(id: string): Promise<Case> {
    const response = await axios.get(`${API_BASE}/cases/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Create new case
  async createCase(caseData: CreateCaseRequest): Promise<Case> {
    const response = await axios.post(`${API_BASE}/cases`, caseData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Update case
  async updateCase(id: string, updates: UpdateCaseRequest): Promise<Case> {
    const response = await axios.patch(`${API_BASE}/cases/${id}`, updates, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Delete case
  async deleteCase(id: string): Promise<void> {
    await axios.delete(`${API_BASE}/cases/${id}`, {
      headers: getAuthHeaders(),
    });
  },
};