'use client';

import { useState, useEffect } from 'react';
import { CaseTemplate, CreateTemplateRequest, UpdateTemplateRequest } from '@/types/template';
import { templatesApi } from '@/lib/templatesApi';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import TemplateViewDrawer from '@/components/templates/TemplateViewDrawer';
import TemplateModal from '@/components/templates/TemplateModal';
import DeleteConfirmModal from '@/components/cases/DeleteConfirmModal';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<CaseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [viewTemplate, setViewTemplate] = useState<CaseTemplate | null>(null);
  const [editTemplate, setEditTemplate] = useState<CaseTemplate | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<CaseTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await templatesApi.getTemplates();
      setTemplates(data);
    } catch (err) {
      setError('Failed to load templates');
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (template: CaseTemplate) => {
    setViewTemplate(template);
  };

  const handleEdit = (template: CaseTemplate) => {
    setEditTemplate(template);
  };

  const handleDelete = (template: CaseTemplate) => {
    setDeleteTemplate(template);
  };

  const handleCreateNew = () => {
    setShowCreateModal(true);
  };

  // Handle template creation/update
  const handleTemplateSubmit = async (templateData: Record<string, unknown>) => {
    try {
      setModalLoading(true);
      setError('');
      
      if (editTemplate) {
        // Update existing template
        await templatesApi.updateTemplate(editTemplate._id, templateData as unknown as UpdateTemplateRequest);
      } else {
        // Create new template
        await templatesApi.createTemplate(templateData as unknown as CreateTemplateRequest);
      }
      
      // Close modal and reload
      setShowCreateModal(false);
      setEditTemplate(null);
      await loadTemplates();
      
    } catch (err) {
      setError(editTemplate ? 'Failed to update template' : 'Failed to create template');
      console.error('Error submitting template:', err);
    } finally {
      setModalLoading(false);
    }
  };

  // Handle template deletion
  const handleDeleteConfirm = async () => {
    if (!deleteTemplate) return;
    
    try {
      setModalLoading(true);
      await templatesApi.deleteTemplate(deleteTemplate._id);
      setDeleteTemplate(null);
      await loadTemplates();
    } catch (err) {
      setError('Failed to delete template');
      console.error('Error deleting template:', err);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-600 mt-2">
            Manage case templates for faster case creation
          </p>
        </div>
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create New Template
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fields
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No templates yet. Create your first template!
                  </td>
                </tr>
              ) : (
                templates.map((template) => (
                  <tr key={template._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {template.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{template.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {template.extractedFieldKeys.length} fields
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {template.extractedFieldKeys.slice(0, 3).join(', ')}
                        {template.extractedFieldKeys.length > 3 && '...'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(template.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleView(template)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(template)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(template)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Template View Drawer */}
      <TemplateViewDrawer
        template={viewTemplate}
        isOpen={!!viewTemplate}
        onClose={() => setViewTemplate(null)}
      />

      {/* Create Template Modal */}
      <TemplateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleTemplateSubmit}
        loading={modalLoading}
      />

      {/* Edit Template Modal */}
      <TemplateModal
        isOpen={!!editTemplate}
        onClose={() => setEditTemplate(null)}
        onSubmit={handleTemplateSubmit}
        editTemplate={editTemplate}
        loading={modalLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTemplate}
        title="Delete Template"
        itemName={deleteTemplate?.name || ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTemplate(null)}
        loading={modalLoading}
      />
    </div>
  );
}