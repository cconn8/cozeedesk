'use client';

import { CaseTemplate } from '@/types/template';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TemplateViewDrawerProps {
  template: CaseTemplate | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TemplateViewDrawer({ 
  template: templateData, 
  isOpen, 
  onClose 
}: TemplateViewDrawerProps) {
  if (!isOpen || !templateData) return null;

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
            <h2 className="text-2xl font-bold text-gray-900">Template Details</h2>
            <Button 
              onClick={onClose}
              variant="secondary"
              className="p-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Template Information */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
                  <p className="text-gray-900">{templateData.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Type</label>
                  <p className="text-gray-900">{templateData.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Created</label>
                  <p className="text-gray-900">{new Date(templateData.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Created By</label>
                  <p className="text-gray-900">{templateData.createdBy}</p>
                </div>
              </div>
            </div>

            {/* Field Keys */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Field Keys ({templateData.extractedFieldKeys.length})
              </h3>
              {templateData.extractedFieldKeys.length === 0 ? (
                <p className="text-gray-500 italic">No field keys defined</p>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {templateData.extractedFieldKeys.map((fieldKey, index) => (
                      <div key={index} className="flex items-center p-2 bg-white rounded border">
                        <span className="text-sm text-gray-900">{fieldKey}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Usage Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage</h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  This template can be used to create new cases with pre-defined field structure. 
                  When creating a case from this template, the field keys will be available as 
                  empty fields that can be filled with specific values.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}