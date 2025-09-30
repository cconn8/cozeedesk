'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { CasesTable } from '@/components/cases/CasesTable';
import { CaseDrawer } from '@/components/cases/CaseDrawer';

// Sample data for demonstration (will come from API later)
const sampleCases = [
  {
    id: '1',
    title: 'John Murphy',
    type: 'funeral' as const,
    status: 'completed' as const,
    createdAt: '2025-09-27T10:30:00Z',
    updatedAt: '2025-09-27T14:45:00Z'
  },
  {
    id: '2',
    title: 'Michael Doe',
    type: 'medical' as const,
    status: 'processing' as const,
    createdAt: '2025-09-27T09:15:00Z',
    updatedAt: '2025-09-27T12:20:00Z'
  },
  {
    id: '3',
    title: 'Sarah Wilson',
    type: 'legal' as const,
    status: 'new' as const,
    createdAt: '2025-09-26T16:45:00Z',
    updatedAt: '2025-09-26T16:45:00Z'
  }
];

// Sample detailed case data (will come from API later)
const sampleCaseDetails = {
  '1': {
    id: '1',
    title: 'John Murphy',
    type: 'funeral' as const,
    status: 'completed' as const,
    originalDocument: 'funeral_arrangements.pdf',
    extractedData: {
      nameOfDeceased: { value: 'John Murphy', confidence: 0.98 },
      dateOfDeath: { value: '26/7/2025', confidence: 0.95 },
      dateOfBirth: { value: '15/3/1943', confidence: 0.92 },
      placeOfDeath: { value: 'St. Mary\'s Hospital', confidence: 0.89 },
      funeralHome: { value: 'Murphy Funeral Directors', confidence: 0.96 },
      dateOfFuneral: { value: '2/8/2025', confidence: 0.94 },
      nextOfKin: { value: 'Mary Murphy (Spouse)', confidence: 0.97 }
    },
    createdAt: '2025-09-27T10:30:00Z',
    updatedAt: '2025-09-27T14:45:00Z'
  },
  '2': {
    id: '2',
    title: 'Michael Doe',
    type: 'medical' as const,
    status: 'processing' as const,
    originalDocument: 'medical_report.pdf',
    extractedData: {
      patientName: { value: 'Michael Doe', confidence: 0.99 },
      dateOfBirth: { value: '12/5/1985', confidence: 0.97 },
      diagnosis: { value: 'Acute Bronchitis', confidence: 0.85 },
      physician: { value: 'Dr. Sarah Johnson', confidence: 0.92 },
      treatmentDate: { value: '25/9/2025', confidence: 0.95 }
    },
    createdAt: '2025-09-27T09:15:00Z',
    updatedAt: '2025-09-27T12:20:00Z'
  }
};

export default function Cases() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading] = useState(false); // Will be used when we connect to real API

  // Handle viewing a case
  function handleViewCase(caseId: string) {
    setSelectedCaseId(caseId);
    setIsDrawerOpen(true);
    // In real app, this would fetch case details from API
  }

  // Handle closing the drawer
  function handleCloseDrawer() {
    setIsDrawerOpen(false);
    setSelectedCaseId(null);
  }

  // Get the selected case details
  const selectedCase = selectedCaseId ? sampleCaseDetails[selectedCaseId as keyof typeof sampleCaseDetails] : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cases</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage and track all your document processing cases
          </p>
        </div>

        {/* Cases Table */}
        <CasesTable
          cases={sampleCases}
          onViewCase={handleViewCase}
          loading={loading}
        />

        {/* Case Drawer */}
        <CaseDrawer
          case={selectedCase}
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
          loading={false}
        />
      </div>
    </DashboardLayout>
  );
}