'use client';

import { useState, useEffect } from 'react';
import { Case, CreateCaseRequest, UpdateCaseRequest } from '@/types/case';
import { CreateTemplateRequest } from '@/types/template';
import { casesApi } from '@/lib/casesApi';
import { templatesApi } from '@/lib/templatesApi';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Search, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import CaseViewDrawer from '@/components/cases/CaseViewDrawer';
import CaseModal from '@/components/cases/CaseModal';
import DeleteConfirmModal from '@/components/cases/DeleteConfirmModal';

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  
  // Modal states
  const [viewCase, setViewCase] = useState<Case | null>(null);
  const [editCase, setEditCase] = useState<Case | null>(null);
  const [deleteCase, setDeleteCase] = useState<Case | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async (search?: string) => {
    try {
      setLoading(true);
      setError('');
      const data = await casesApi.getCases(search);
      setCases(data);
    } catch (err) {
      setError('Failed to load cases');
      console.error('Error loading cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCases(searchTerm);
  };

  const handleView = (caseItem: Case) => {
    setViewCase(caseItem);
  };

  const handleEdit = (caseItem: Case) => {
    setEditCase(caseItem);
  };

  const handleDelete = (caseItem: Case) => {
    setDeleteCase(caseItem);
  };

  const handleCreateNew = () => {
    setShowCreateModal(true);
  };

  // Handle case creation/update
  const handleCaseSubmit = async (caseData: Record<string, unknown>, templateData?: Record<string, unknown>) => {
    try {
      setModalLoading(true);
      setError('');
      
      if (editCase) {
        // Update existing case
        await casesApi.updateCase(editCase._id, caseData as unknown as UpdateCaseRequest);
      } else {
        // Create new case
        await casesApi.createCase(caseData as unknown as CreateCaseRequest);
        
        // Create template if requested
        if (templateData) {
          try {
            await templatesApi.createTemplate(templateData as unknown as CreateTemplateRequest);
          } catch (err) {
            console.error('Failed to create template:', err);
            // Don't fail the case creation if template fails
          }
        }
      }
      
      // Close modal and reload
      setShowCreateModal(false);
      setEditCase(null);
      await loadCases(searchTerm);
      
    } catch (err) {
      setError(editCase ? 'Failed to update case' : 'Failed to create case');
      console.error('Error submitting case:', err);
    } finally {
      setModalLoading(false);
    }
  };

  // Handle case deletion
  const handleDeleteConfirm = async () => {
    if (!deleteCase) return;
    
    try {
      setModalLoading(true);
      await casesApi.deleteCase(deleteCase._id);
      setDeleteCase(null);
      await loadCases(searchTerm);
    } catch (err) {
      setError('Failed to delete case');
      console.error('Error deleting case:', err);
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
          <h1 className="text-3xl font-bold text-gray-900">Cases</h1>
          <p className="text-gray-600 mt-2">
            Manage your case files and documents
          </p>
        </div>
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create New Case
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by title, type, or payment status..."
                value={searchTerm}
                onChange={(value) => setSearchTerm(value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
            {searchTerm && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSearchTerm('');
                  loadCases();
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fields
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'No cases found matching your search.' : 'No cases yet. Create your first case!'}
                  </td>
                </tr>
              ) : (
                cases.map((caseItem) => (
                  <tr key={caseItem._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {caseItem.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{caseItem.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        caseItem.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                        caseItem.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        caseItem.paymentStatus === 'overdue' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {caseItem.paymentStatus || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(caseItem.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Object.keys(caseItem.extractedFields || {}).length} fields
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleView(caseItem)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(caseItem)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(caseItem)}
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

      {/* Case View Drawer */}
      <CaseViewDrawer
        case={viewCase}
        isOpen={!!viewCase}
        onClose={() => setViewCase(null)}
      />

      {/* Create Case Modal */}
      <CaseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCaseSubmit}
        loading={modalLoading}
      />

      {/* Edit Case Modal */}
      <CaseModal
        isOpen={!!editCase}
        onClose={() => setEditCase(null)}
        onSubmit={handleCaseSubmit}
        editCase={editCase}
        loading={modalLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteCase}
        title="Delete Case"
        itemName={deleteCase?.title || ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteCase(null)}
        loading={modalLoading}
      />
    </div>
  );
}