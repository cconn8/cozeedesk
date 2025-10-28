'use client';

import { useState, useEffect } from 'react';
import { VerificationData, ConfirmExtractionRequest, RejectExtractionRequest } from '@/types/case';
import { casesApi } from '@/lib/casesApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X, Eye, AlertTriangle, CheckCircle, Trash2, Save } from 'lucide-react';

interface CaseVerificationDrawerProps {
  caseId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmed: () => void;
}

export default function CaseVerificationDrawer({ 
  caseId, 
  isOpen, 
  onClose, 
  onConfirmed 
}: CaseVerificationDrawerProps) {
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState('');
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState('');
  const [selectedTitleField, setSelectedTitleField] = useState<string | null>(null);

  // Load verification data when drawer opens
  useEffect(() => {
    if (isOpen && caseId) {
      loadVerificationData();
    } else {
      // Reset state when drawer closes
      setVerificationData(null);
      setEditedFields({});
      setShowRejectDialog(false);
      setRejectReason('');
      setError('');
    }
  }, [isOpen, caseId]);

  const loadVerificationData = async () => {
    if (!caseId) return;

    try {
      setLoading(true);
      setError('');
      const data = await casesApi.getVerificationData(caseId);
      setVerificationData(data);
      // Initialize edited fields with extracted data from the case
      setEditedFields(data.case.extractedFields || {});
    } catch (error) {
      console.error('Failed to load verification data:', error);
      setError('Failed to load verification data');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setEditedFields(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const removeField = (key: string) => {
    setEditedFields(prev => {
      const newFields = { ...prev };
      delete newFields[key];
      return newFields;
    });
  };

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim() || !templateType.trim()) {
      setError('Please provide both template name and type');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Import templatesApi here to avoid circular dependency
      const { templatesApi } = await import('@/lib/templatesApi');
      
      await templatesApi.createTemplate({
        name: templateName,
        type: templateType,
        extractedFieldKeys: Object.keys(editedFields),
        titleField: selectedTitleField || undefined,
      });

      setShowSaveTemplateDialog(false);
      setTemplateName('');
      setTemplateType('');
    } catch (error) {
      console.error('Failed to save template:', error);
      setError('Failed to save template');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (!caseId || !verificationData) return;

    try {
      setSubmitting(true);
      setError('');

      // Find corrections (fields that were changed)
      const corrections: Record<string, string> = {};
      Object.keys(editedFields).forEach(key => {
        if (editedFields[key] !== (verificationData.case.extractedFields || {})[key]) {
          corrections[key] = editedFields[key];
        }
      });

      const confirmData: ConfirmExtractionRequest = {
        corrections: {
          extractedFields: editedFields,
          userCorrections: Object.keys(corrections).length > 0 ? corrections : undefined,
          selectedTitleField: selectedTitleField,
        }
      };

      await casesApi.confirmExtraction(caseId, confirmData);
      onConfirmed();
      onClose();
    } catch (error) {
      console.error('Failed to confirm extraction:', error);
      setError('Failed to confirm extraction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!caseId || !rejectReason.trim()) return;

    try {
      setSubmitting(true);
      setError('');

      const rejectData: RejectExtractionRequest = {
        reason: rejectReason,
      };

      await casesApi.rejectExtraction(caseId, rejectData);
      onConfirmed();
      onClose();
    } catch (error) {
      console.error('Failed to reject extraction:', error);
      setError('Failed to reject extraction');
    } finally {
      setSubmitting(false);
    }
  };

  const isFieldLowConfidence = (fieldKey: string) => {
    return verificationData?.extractionMetadata?.lowConfidenceFields?.includes(fieldKey) || false;
  };
  if (!isOpen || !caseId) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-6xl bg-white shadow-xl z-50 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Verify Extracted Data</h2>
            <Button 
              onClick={onClose}
              variant="secondary"
              className="p-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-600">Loading verification data...</div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {verificationData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Original Scan */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Original Document
                </h3>
                <div className="border rounded-lg p-4 bg-gray-50">
                  {verificationData.originalScanUrl ? (
                    <div className="space-y-4">
                      {verificationData.originalScanUrl.toLowerCase().includes('.pdf') || verificationData.originalScanUrl.includes('application%2Fpdf') ? (
                        // Handle PDF files with simple iframe
                        <div className="space-y-4">
                          <div className="flex items-center justify-between bg-gray-100 px-4 py-2 rounded-lg">
                            <span className="text-sm font-medium">PDF Document</span>
                            <a 
                              href={verificationData.originalScanUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Open in New Tab
                            </a>
                          </div>
                          <div className="border rounded-lg overflow-hidden">
                            <iframe
                              src={verificationData.originalScanUrl}
                              className="w-full h-[600px]"
                              title="PDF Document"
                            />
                          </div>
                        </div>
                      ) : (
                        // Handle image files
                        <>
                          <img 
                            src={verificationData.originalScanUrl} 
                            alt="Original scanned document"
                            className="w-full h-auto rounded shadow-sm max-h-[600px] object-contain"
                            onLoad={() => console.log('Image loaded successfully:', verificationData.originalScanUrl)}
                            onError={(e) => {
                              console.error('Failed to load image:', verificationData.originalScanUrl);
                              e.currentTarget.style.display = 'none';
                              const errorDiv = e.currentTarget.nextElementSibling as HTMLElement;
                              if (errorDiv) {
                                errorDiv.style.display = 'flex';
                              }
                            }}
                          />
                          <div style={{display: 'none'}} className="flex items-center justify-center h-64 text-gray-500 bg-gray-100 rounded">
                            <div className="text-center">
                              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                              <p className="text-lg font-medium mb-2">Unable to load original document</p>
                              <p className="text-sm text-gray-600 mb-2">This could be due to:</p>
                              <ul className="text-xs text-left space-y-1 max-w-sm">
                                <li>• Expired signed URL (URLs expire after 1 hour)</li>
                                <li>• Network connectivity issues</li>
                                <li>• Google Cloud Storage access issues</li>
                                <li>• Missing file in storage</li>
                              </ul>
                              <p className="text-xs mt-4 break-all">URL: {verificationData.originalScanUrl}</p>
                              <Button 
                                onClick={() => window.location.reload()} 
                                variant="secondary" 
                                className="mt-3 text-xs"
                              >
                                Refresh Page
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500 bg-gray-100 rounded">
                      <div className="text-center">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                        <p className="text-lg font-medium">No original document available</p>
                        <p className="text-sm">This case may not have an associated scanned document.</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  <p>Confidence: <span className="font-medium">{verificationData.extractionMetadata?.confidence || 'N/A'}</span></p>
                </div>
              </div>

              {/* Extracted Data */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Extracted Data</h3>
                
                  {/* Title Field Selection */}
                  <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select field to use as Case Title (optional):
                    </label>
                    <select
                      value={selectedTitleField || ''}
                      onChange={(e) => setSelectedTitleField(e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Use suggested title</option>
                      {Object.keys(editedFields).map(fieldKey => (
                        <option key={fieldKey} value={fieldKey}>
                          {fieldKey}: {String(editedFields[fieldKey] || '').substring(0, 30)}{String(editedFields[fieldKey] || '').length > 30 ? '...' : ''}
                        </option>
                      ))}
                    </select>
                    {selectedTitleField && (
                      <p className="text-xs text-blue-600 mt-1">
                        Case title will be: &quot;{editedFields[selectedTitleField]}&quot;
                      </p>
                    )}
                  </div>

                  <div className="space-y-4">
                    {Object.entries(editedFields).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-medium text-gray-700">
                            {key}
                            {isFieldLowConfidence(key) && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Low Confidence
                              </span>
                            )}
                          </label>
                          <button
                            onClick={() => removeField(key)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Remove field"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <Input
                          value={value}
                          onChange={(value) => handleFieldChange(key, value)}
                          className={isFieldLowConfidence(key) ? 'border-yellow-300 bg-yellow-50' : ''}
                        />
                        {isFieldLowConfidence(key) && (
                          <p className="text-xs text-yellow-600 mt-1">
                            Please review this field carefully
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-8 space-y-3">
                    <div className="flex space-x-3">
                      <Button
                        onClick={handleConfirm}
                        disabled={submitting}
                        className="flex items-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {submitting ? 'Confirming...' : 'Confirm & Save'}
                      </Button>
                      <Button
                        onClick={() => setShowRejectDialog(true)}
                        variant="secondary"
                        disabled={submitting}
                      >
                        Reject
                      </Button>
                    </div>
                    <div className="flex">
                      <Button
                        onClick={() => setShowSaveTemplateDialog(true)}
                        variant="secondary"
                        disabled={submitting}
                        className="flex items-center text-sm"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save as Template
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
          )}

          {/* Reject Dialog */}
          {showRejectDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-semibold mb-4">Reject Extraction</h3>
                <p className="text-gray-600 mb-4">
                  Please provide a reason for rejecting this extraction:
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Reason for rejection..."
                />
                <div className="flex justify-end space-x-3 mt-4">
                  <Button
                    onClick={() => setShowRejectDialog(false)}
                    variant="secondary"
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={!rejectReason.trim() || submitting}
                  >
                    {submitting ? 'Rejecting...' : 'Reject'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Save as Template Dialog */}
          {showSaveTemplateDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-semibold mb-4">Save as Template</h3>
                <p className="text-gray-600 mb-4">
                  Create a reusable template from these extracted fields:
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name
                    </label>
                    <Input
                      value={templateName}
                      onChange={setTemplateName}
                      placeholder="e.g., Funeral Document Template"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Type
                    </label>
                    <Input
                      value={templateType}
                      onChange={setTemplateType}
                      placeholder="e.g., Funeral, Legal, Insurance"
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Fields to include: {Object.keys(editedFields).length}</p>
                    <p className="text-xs mt-1">
                      {Object.keys(editedFields).slice(0, 3).join(', ')}
                      {Object.keys(editedFields).length > 3 && '...'}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    onClick={() => setShowSaveTemplateDialog(false)}
                    variant="secondary"
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveAsTemplate}
                    disabled={!templateName.trim() || !templateType.trim() || submitting}
                  >
                    {submitting ? 'Saving...' : 'Save Template'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}