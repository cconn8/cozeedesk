'use client';

import { useState, useEffect, useCallback } from 'react';
import { Case, CreateCaseRequest, UpdateCaseRequest } from '@/types/case';
import { CaseTemplate, CreateTemplateRequest } from '@/types/template';
import { templatesApi } from '@/lib/templatesApi';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X, Plus, Minus } from 'lucide-react';

interface CaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (caseData: Record<string, unknown>, templateData?: Record<string, unknown>) => void;
  editCase?: Case | null; // If provided, we're in edit mode
  loading?: boolean;
}

interface ExtractedField {
  key: string;
  value: string;
}

export default function CaseModal({ isOpen, onClose, onSubmit, editCase, loading = false }: CaseModalProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<CaseTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([]);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [creationMethod, setCreationMethod] = useState<'template' | 'manual'>('manual');

  const loadTemplates = useCallback(async () => {
    try {
      setLoadingTemplates(true);
      const data = await templatesApi.getTemplates();
      setTemplates(data);
      
      // Auto-select template method if templates exist and we're not editing
      if (data.length > 0 && !editCase) {
        setCreationMethod('template');
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  }, [editCase]);

  // Load templates on open
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      resetForm();
      
      // If editing, populate form
      if (editCase) {
        setTitle(editCase.title);
        setType(editCase.type);
        setPaymentStatus(editCase.paymentStatus || '');
        setSelectedTemplateId(editCase.templateId || '');
        
        // Convert extractedFields object to array
        const fieldsArray = Object.entries(editCase.extractedFields || {}).map(([key, value]) => ({
          key,
          value
        }));
        setExtractedFields(fieldsArray);
      }
    }
  }, [isOpen, editCase, loadTemplates]);

  const resetForm = () => {
    setTitle('');
    setType('');
    setPaymentStatus('');
    setSelectedTemplateId('');
    setExtractedFields([]);
    setSaveAsTemplate(false);
    setTemplateName('');
    setCreationMethod('manual');
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t._id === templateId);
    
    if (template) {
      setType(template.type);
      // Populate extracted fields keys with empty values
      const fieldsArray = template.extractedFieldKeys.map(key => ({
        key,
        value: ''
      }));
      setExtractedFields(fieldsArray);
    }
  };

  // Handle adding new extracted field
  const addExtractedField = () => {
    setExtractedFields([...extractedFields, { key: '', value: '' }]);
  };

  // Handle removing extracted field
  const removeExtractedField = (index: number) => {
    setExtractedFields(extractedFields.filter((_, i) => i !== index));
  };

  // Handle field change
  const updateExtractedField = (index: number, field: 'key' | 'value', newValue: string) => {
    const updated = [...extractedFields];
    updated[index][field] = newValue;
    setExtractedFields(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert extracted fields array to object
    const extractedFieldsObj = extractedFields.reduce((acc, field) => {
      if (field.key.trim()) {
        acc[field.key.trim()] = field.value;
      }
      return acc;
    }, {} as Record<string, string>);

    const caseData = {
      title,
      type,
      paymentStatus: paymentStatus || undefined,
      extractedFields: extractedFieldsObj,
      createdBy: user?.email || 'Unknown',
      templateId: selectedTemplateId || undefined,
    };

    let templateData: Record<string, unknown> | undefined;
    if (saveAsTemplate && templateName.trim()) {
      templateData = {
        name: templateName.trim(),
        type,
        extractedFieldKeys: extractedFields.map(f => f.key).filter(k => k.trim()),
        createdBy: user?.email || 'Unknown',
      };
    }

    onSubmit(caseData, templateData);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editCase ? 'Edit Case' : 'Create New Case'}
                </h2>
                <Button 
                  type="button"
                  onClick={onClose}
                  variant="secondary"
                  className="p-2"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Creation Method Selection (only for new cases) */}
              {!editCase && templates.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Creation Method</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="creationMethod"
                        value="template"
                        checked={creationMethod === 'template'}
                        onChange={(e) => setCreationMethod(e.target.value as 'template')}
                        className="mr-2"
                      />
                      From Template
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="creationMethod"
                        value="manual"
                        checked={creationMethod === 'manual'}
                        onChange={(e) => setCreationMethod(e.target.value as 'manual')}
                        className="mr-2"
                      />
                      Manual Entry
                    </label>
                  </div>
                </div>
              )}

              {/* Template Selection */}
              {creationMethod === 'template' && templates.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Template</label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={loadingTemplates}
                  >
                    <option value="">Choose a template&hellip;</option>
                    {templates.map((template) => (
                      <option key={template._id} value={template._id}>
                        {template.name} ({template.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Input
                  label="Title"
                  value={title}
                  onChange={setTitle}
                  required
                  placeholder="Enter case title"
                />
                <Input
                  label="Type"
                  value={type}
                  onChange={setType}
                  required
                  placeholder="Enter case type"
                />
                <Input
                  label="Payment Status"
                  value={paymentStatus}
                  onChange={setPaymentStatus}
                  placeholder="e.g., paid, pending, overdue"
                />
              </div>

              {/* Extracted Fields */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Extracted Fields</h3>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addExtractedField}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Field
                  </Button>
                </div>

                {extractedFields.length === 0 ? (
                  <p className="text-gray-500 italic">No extracted fields yet. Click &ldquo;Add Field&rdquo; to create one.</p>
                ) : (
                  <div className="space-y-3">
                    {extractedFields.map((field, index) => (
                      <div key={index} className="flex gap-3 items-start">
                        <div className="flex-1">
                          <Input
                            placeholder="Field name (e.g., Client Name)"
                            value={field.key}
                            onChange={(value) => updateExtractedField(index, 'key', value)}
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            placeholder="Field value"
                            value={field.value}
                            onChange={(value) => updateExtractedField(index, 'value', value)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => removeExtractedField(index)}
                          className="p-2 mt-1"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Save as Template (only for new cases or manual method) */}
              {(!editCase || creationMethod === 'manual') && (
                <div className="mb-6">
                  <label className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      checked={saveAsTemplate}
                      onChange={(e) => setSaveAsTemplate(e.target.checked)}
                      className="mr-2"
                    />
                    Save as Template
                  </label>
                  {saveAsTemplate && (
                    <Input
                      placeholder="Template name"
                      value={templateName}
                      onChange={setTemplateName}
                      required={saveAsTemplate}
                    />
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3 justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  disabled={loading || !title.trim() || !type.trim()}
                >
                  {loading ? 
                    (editCase ? 'Updating...' : 'Creating...') : 
                    (editCase ? 'Update Case' : 'Create Case')
                  }
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}