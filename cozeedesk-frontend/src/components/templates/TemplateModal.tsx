'use client';

import { useState, useEffect } from 'react';
import { CaseTemplate } from '@/types/template';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X, Plus, Minus } from 'lucide-react';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (templateData: Record<string, unknown>) => void;
  editTemplate?: CaseTemplate | null; // If provided, we're in edit mode
  loading?: boolean;
}

export default function TemplateModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editTemplate, 
  loading = false 
}: TemplateModalProps) {
  const { user } = useAuth();
  
  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [fieldKeys, setFieldKeys] = useState<string[]>(['']);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (editTemplate) {
        // Populate form for editing
        setName(editTemplate.name);
        setType(editTemplate.type);
        setFieldKeys(editTemplate.extractedFieldKeys.length > 0 ? editTemplate.extractedFieldKeys : ['']);
      } else {
        // Reset form for new template
        setName('');
        setType('');
        setFieldKeys(['']);
      }
    }
  }, [isOpen, editTemplate]);

  const handleAddField = () => {
    setFieldKeys([...fieldKeys, '']);
  };

  const handleRemoveField = (index: number) => {
    if (fieldKeys.length > 1) {
      setFieldKeys(fieldKeys.filter((_, i) => i !== index));
    }
  };

  const handleFieldChange = (index: number, value: string) => {
    const updated = [...fieldKeys];
    updated[index] = value;
    setFieldKeys(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty field keys
    const validFieldKeys = fieldKeys.filter(key => key.trim());

    const templateData = {
      name: name.trim(),
      type: type.trim(),
      extractedFieldKeys: validFieldKeys,
      createdBy: user?.email || 'Unknown',
    };

    onSubmit(templateData);
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
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editTemplate ? 'Edit Template' : 'Create New Template'}
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

              {/* Basic Information */}
              <div className="space-y-4 mb-6">
                <Input
                  label="Template Name"
                  value={name}
                  onChange={setName}
                  required
                  placeholder="e.g., Funeral Services Template"
                />
                <Input
                  label="Case Type"
                  value={type}
                  onChange={setType}
                  required
                  placeholder="e.g., Funeral"
                />
              </div>

              {/* Field Keys */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Field Keys</h3>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddField}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Field
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Define the field names that will be available when creating cases from this template.
                </p>

                <div className="space-y-3">
                  {fieldKeys.map((fieldKey, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <div className="flex-1">
                        <Input
                          placeholder="Field name (e.g., 'Deceased Name', 'Date of Death')"
                          value={fieldKey}
                          onChange={(value) => handleFieldChange(index, value)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleRemoveField(index)}
                        disabled={fieldKeys.length === 1}
                        className="p-2"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

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
                  disabled={loading || !name.trim() || !type.trim()}
                >
                  {loading ? 
                    (editTemplate ? 'Updating...' : 'Creating...') : 
                    (editTemplate ? 'Update Template' : 'Create Template')
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