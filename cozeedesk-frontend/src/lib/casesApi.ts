import axios from 'axios';
import { 
  Case, 
  CreateCaseRequest, 
  UpdateCaseRequest,
  ScanUploadRequest,
  VerificationData,
  ConfirmExtractionRequest,
  RejectExtractionRequest
} from '@/types/case';

const API_BASE = 'http://localhost:3005';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Helper function for file upload headers
const getFileUploadHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    // Don't set Content-Type for multipart/form-data - let browser set it with boundary
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

  // Upload scanned document for extraction
  async uploadScan(file: File, uploadData: ScanUploadRequest): Promise<{ caseId: string; jobId: string; status: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (uploadData.templateId) {
      formData.append('templateId', uploadData.templateId);
    }
    if (uploadData.templateMode) {
      formData.append('templateMode', uploadData.templateMode);
    }

    const response = await axios.post(`${API_BASE}/cases/upload-scan`, formData, {
      headers: getFileUploadHeaders(),
    });
    return response.data.data; // Backend returns { success: true, data: {...} }
  },

  // Get verification data for extracted case
  async getVerificationData(id: string): Promise<VerificationData> {
    const response = await axios.get(`${API_BASE}/cases/${id}/verify`, {
      headers: getAuthHeaders(),
    });
    return response.data.data; // Backend returns { success: true, data: {...} }
  },

  // Confirm extraction with any corrections
  async confirmExtraction(id: string, confirmData: ConfirmExtractionRequest): Promise<void> {
    await axios.patch(`${API_BASE}/cases/${id}/confirm-extraction`, confirmData, {
      headers: getAuthHeaders(),
    });
    // Backend returns { success: true, message: '...' }
  },

  // Reject extraction and provide feedback
  async rejectExtraction(id: string, rejectData: RejectExtractionRequest): Promise<void> {
    await axios.post(`${API_BASE}/cases/${id}/reject-extraction`, rejectData, {
      headers: getAuthHeaders(),
    });
  },
};