'use client';

import { Case } from '@/types/case';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CaseViewDrawerProps {
  case: Case | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CaseViewDrawer({ case: caseData, isOpen, onClose }: CaseViewDrawerProps) {
  if (!isOpen || !caseData) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl z-50 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Case Details</h2>
            <Button 
              onClick={onClose}
              variant="secondary"
              className="p-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Case Information */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Title</label>
                  <p className="text-gray-900">{caseData.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Type</label>
                  <p className="text-gray-900">{caseData.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Payment Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    caseData.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                    caseData.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    caseData.paymentStatus === 'overdue' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {caseData.paymentStatus || 'N/A'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Created</label>
                  <p className="text-gray-900">{new Date(caseData.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Created By</label>
                  <p className="text-gray-900">{caseData.createdBy}</p>
                </div>
                {caseData.templateId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Template ID</label>
                    <p className="text-gray-900 font-mono text-sm">{caseData.templateId}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Extracted Fields */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Extracted Fields</h3>
              {Object.keys(caseData.extractedFields || {}).length === 0 ? (
                <p className="text-gray-500 italic">No extracted fields</p>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    {Object.entries(caseData.extractedFields).map(([key, value]) => (
                      <div key={key} className="flex flex-col sm:flex-row sm:items-center">
                        <div className="sm:w-1/3">
                          <span className="text-sm font-medium text-gray-600">{key}:</span>
                        </div>
                        <div className="sm:w-2/3">
                          <span className="text-gray-900">{value || 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Attachments */}
            {caseData.attachments && caseData.attachments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
                <div className="space-y-2">
                  {caseData.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{attachment.filename}</p>
                        <p className="text-xs text-gray-500">{attachment.url}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}