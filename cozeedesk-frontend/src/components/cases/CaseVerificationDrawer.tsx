'use client';

import { useState, useEffect } from 'react';
import { VerificationData, SaveExtractionRequest } from '@/types/case';
import { casesApi } from '@/lib/casesApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X, Eye, AlertTriangle, Save, Trash2, Plus, FileText } from 'lucide-react';

interface CaseVerificationDrawerProps {
  caseId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void; // Renamed from onConfirmed to be more descriptive
}

/**
 * Simplified case verification drawer
 * Removed Accept/Reject workflow in favor of Save/Save as Template/Discard
 */
export default function CaseVerificationDrawer({ 
  caseId, 
  isOpen, 
  onClose, 
  onSaved
}: CaseVerificationDrawerProps) {
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});
  const [caseTitle, setCaseTitle] = useState('');
  const [error, setError] = useState('');
  
  // Template saving state
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState('');
  const [selectedTitleField, setSelectedTitleField] = useState<string | null>(null);

  /**
   * Load verification data when drawer opens
   * Reset all state when drawer closes to prevent stale data
   */
  useEffect(() => {
    if (isOpen && caseId) {
      console.log(`[CaseVerificationDrawer] Loading verification data for case: ${caseId}`);
      loadVerificationData();
    } else {
      console.log('[CaseVerificationDrawer] Resetting state (drawer closed)');
      resetState();
    }
  }, [isOpen, caseId]);

  /**
   * Reset all component state to initial values
   * Called when drawer closes to prevent data leakage between cases
   */
  const resetState = () => {
    setVerificationData(null);
    setEditedFields({});
    setCaseTitle('');
    setError('');
    setShowSaveTemplateDialog(false);
    setTemplateName('');
    setTemplateType('');
    setSelectedTitleField(null);
  };

  /**
   * Load case data and initialize editing state
   * Sets up the initial field values for user editing
   */
  const loadVerificationData = async () => {
    if (!caseId) return;

    try {
      setLoading(true);
      setError('');
      console.log(`[CaseVerificationDrawer:loadVerificationData] Fetching data for case: ${caseId}`);
      
      const data = await casesApi.getVerificationData(caseId);
      setVerificationData(data);
      
      // Initialize editing state with extracted data
      setEditedFields(data.case.extractedFields || {});
      setCaseTitle(data.case.title || 'Untitled Case');
      
      console.log(`[CaseVerificationDrawer:loadVerificationData] Loaded ${Object.keys(data.case.extractedFields || {}).length} fields`);
    } catch (error) {
      console.error('[CaseVerificationDrawer:loadVerificationData] Failed to load:', error);
      setError('Failed to load verification data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update a field value in the editing state
   * @param key - Field name to update
   * @param value - New field value
   */
  const handleFieldChange = (key: string, value: string) => {
    console.log(`[CaseVerificationDrawer:handleFieldChange] ${key} = ${value}`);
    setEditedFields(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  /**
   * Remove a field from the case data
   * Allows users to delete fields they don't want
   */
  const removeField = (key: string) => {
    console.log(`[CaseVerificationDrawer:removeField] Removing field: ${key}`);
    setEditedFields(prev => {
      const newFields = { ...prev };
      delete newFields[key];
      return newFields;
    });
  };

  /**
   * Add a new custom field to the case
   * Allows users to add missing information
   */
  const addField = () => {
    const fieldName = prompt('Enter field name:');
    if (fieldName && !editedFields[fieldName]) {
      console.log(`[CaseVerificationDrawer:addField] Adding field: ${fieldName}`);
      setEditedFields(prev => ({
        ...prev,
        [fieldName]: '',
      }));
    }
  };

  /**
   * Update case title based on selected field or manual input
   * Called when user selects a different title field
   */
  const updateTitleFromField = (fieldKey: string | null) => {
    if (fieldKey && editedFields[fieldKey]) {
      console.log(`[CaseVerificationDrawer:updateTitleFromField] Setting title from field ${fieldKey}: ${editedFields[fieldKey]}`);
      setCaseTitle(editedFields[fieldKey]);
    }
    setSelectedTitleField(fieldKey);
  };

  /**
   * Save case with current field data and activate it
   * This replaces the old "Accept" functionality
   */
  const handleSave = async () => {
    if (!caseId || !verificationData) {
      console.error('[CaseVerificationDrawer:handleSave] Missing required data');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      console.log(`[CaseVerificationDrawer:handleSave] Saving case ${caseId} with title: ${caseTitle}`);

      const saveData: SaveExtractionRequest = {
        title: caseTitle,
        extractedFields: editedFields,
      };

      await casesApi.saveExtraction(caseId, saveData);
      console.log('[CaseVerificationDrawer:handleSave] Case saved successfully');
      
      onSaved(); // Notify parent component
      onClose(); // Close drawer
    } catch (error) {
      console.error('[CaseVerificationDrawer:handleSave] Save failed:', error);
      setError('Failed to save case. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Save current fields as a reusable template, then save the case
   * Combines template creation with case saving in one action
   */
  const handleSaveAsTemplate = async () => {
    if (!templateName.trim() || !templateType.trim()) {
      setError('Please provide both template name and type');
      return;
    }

    if (!caseId || !verificationData) {
      console.error('[CaseVerificationDrawer:handleSaveAsTemplate] Missing required data');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      console.log(`[CaseVerificationDrawer:handleSaveAsTemplate] Creating template: ${templateName}`);

      const saveData: SaveExtractionRequest = {
        title: caseTitle,
        extractedFields: editedFields,
        saveAsTemplate: {
          name: templateName,
          type: templateType,
          titleField: selectedTitleField || undefined,
        }
      };

      await casesApi.saveExtraction(caseId, saveData);
      console.log('[CaseVerificationDrawer:handleSaveAsTemplate] Template and case saved successfully');
      
      onSaved(); // Notify parent component
      onClose(); // Close drawer
    } catch (error) {
      console.error('[CaseVerificationDrawer:handleSaveAsTemplate] Save failed:', error);
      setError('Failed to save template and case. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Discard the extracted data and remove the case entirely
   * This replaces the old "Reject" functionality with a cleaner approach
   */
  const handleDiscard = async () => {
    if (!caseId) return;

    const confirmed = window.confirm(
      'Are you sure you want to discard this case? This action cannot be undone.'
    );
    
    if (!confirmed) return;

    try {
      setSubmitting(true);
      setError('');
      console.log(`[CaseVerificationDrawer:handleDiscard] Discarding case ${caseId}`);

      await casesApi.discardCase(caseId);
      console.log('[CaseVerificationDrawer:handleDiscard] Case discarded successfully');
      
      onSaved(); // Notify parent component to refresh list
      onClose(); // Close drawer
    } catch (error) {
      console.error('[CaseVerificationDrawer:handleDiscard] Discard failed:', error);
      setError('Failed to discard case. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Check if a field has low confidence from AI extraction
   * Used to highlight fields that need user attention
   */
  const isFieldLowConfidence = (fieldKey: string): boolean => {
    return verificationData?.extractionMetadata?.lowConfidenceFields?.includes(fieldKey) || false;
  };

  // Don't render if drawer is closed or no case ID
  if (!isOpen || !caseId) return null;

  return (
    <>
      {/* Backdrop - closes drawer when clicked */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Main drawer panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-6xl bg-white shadow-xl z-50 overflow-y-auto">
        <div className="p-6">
          {/* Header with title and close button */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Verify & Edit Extracted Data
            </h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
              title="Close verification panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-600">Loading verification data...</div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Main content - only show when data is loaded */}
          {verificationData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left column: Original document */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Original Document
                </h3>
                <div className="border rounded-lg p-4 bg-gray-50">
                  {verificationData.originalScanUrl ? (
                    <div className="space-y-4">
                      {/* Handle PDF files */}
                      {verificationData.originalScanUrl.toLowerCase().includes('.pdf') || 
                       verificationData.originalScanUrl.includes('application%2Fpdf') ? (
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
                        /* Handle image files */
                        <img 
                          src={verificationData.originalScanUrl} 
                          alt="Original scanned document"
                          className="w-full h-auto rounded shadow-sm max-h-[600px] object-contain"
                          onError={(e) => {
                            console.error('[CaseVerificationDrawer] Image load failed:', verificationData.originalScanUrl);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500 bg-gray-100 rounded">
                      <div className="text-center">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                        <p className="text-lg font-medium">No original document available</p>
                      </div>
                    </div>
                  )}
                </div>
                {/* Extraction metadata */}
                <div className="mt-3 text-sm text-gray-600">
                  <p>Confidence: <span className="font-medium">
                    {verificationData.extractionMetadata?.confidence || 'N/A'}
                  </span></p>
                </div>
              </div>

              {/* Right column: Extracted data editing */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Edit Extracted Data</h3>
                
                {/* Case title input */}
                <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Case Title:
                  </label>
                  <Input
                    value={caseTitle}
                    onChange={setCaseTitle}
                    placeholder="Enter case title..."
                    className="mb-2"
                  />
                  
                  {/* Quick title selection from fields */}
                  {Object.keys(editedFields).length > 0 && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Or select from extracted fields:
                      </label>
                      <select
                        value={selectedTitleField || ''}
                        onChange={(e) => updateTitleFromField(e.target.value || null)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Choose a field...</option>
                        {Object.keys(editedFields).map(fieldKey => (
                          <option key={fieldKey} value={fieldKey}>
                            {fieldKey}: {String(editedFields[fieldKey] || '').substring(0, 30)}
                            {String(editedFields[fieldKey] || '').length > 30 ? '...' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Extracted fields editing */}
                <div className="space-y-4 mb-6">
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
                          title="Remove this field"
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
                          AI confidence is low - please review carefully
                        </p>
                      )}
                    </div>
                  ))}
                  
                  {/* Add custom field button */}
                  <button
                    onClick={addField}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Custom Field</span>
                  </button>
                </div>

                {/* Action buttons */}
                <div className="space-y-4">
                  {/* Primary actions */}
                  <div className="flex space-x-3">
                    <Button
                      onClick={handleSave}
                      disabled={submitting}
                      className="flex items-center flex-1"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {submitting ? 'Saving...' : 'Save Case'}
                    </Button>
                    
                    <Button
                      onClick={() => setShowSaveTemplateDialog(true)}
                      variant="secondary"
                      disabled={submitting}
                      className="flex items-center"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Save as Template
                    </Button>
                  </div>
                  
                  {/* Discard button */}
                  <div className="flex">
                    <Button
                      onClick={handleDiscard}
                      variant="secondary"
                      disabled={submitting}
                      className="flex items-center text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Discard Case
                    </Button>
                  </div>
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
                    onClick={() => {
                      setShowSaveTemplateDialog(false);
                      setTemplateName('');
                      setTemplateType('');
                    }}
                    variant="secondary"
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveAsTemplate}
                    disabled={!templateName.trim() || !templateType.trim() || submitting}
                  >
                    {submitting ? 'Saving...' : 'Save Template & Case'}
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