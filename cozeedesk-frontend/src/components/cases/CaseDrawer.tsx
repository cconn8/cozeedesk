// Simple Case Drawer Component - Shows case details in a side panel

import { useState } from 'react';
import { Button, Card, CardContent } from '../ui';

// Define what extracted data looks like
interface ExtractedData {
  [key: string]: {
    value: string;
    confidence?: number;
  };
}

// Define what a full Case looks like (more detailed than table version)
interface CaseDetails {
  id: string;
  title: string;
  type: 'funeral' | 'medical' | 'legal' | 'invoice';
  status: 'new' | 'processing' | 'completed';
  originalDocument?: string; // File URL
  extractedData: ExtractedData;
  createdAt: string;
  updatedAt: string;
}

interface CaseDrawerProps {
  case: CaseDetails | null;
  isOpen: boolean;
  onClose: () => void;
  loading?: boolean;
}

export function CaseDrawer(props: CaseDrawerProps) {
  const { case: caseData, isOpen, onClose, loading = false } = props;
  const [activeTab, setActiveTab] = useState<'details' | 'scan'>('details');
  // const [showConfidence, setShowConfidence] = useState(true);

  // Don't render anything if drawer is closed
  if (!isOpen) {
    return null;
  }

  // Function to get status color
  function getStatusColor(status: string): string {
    if (status === 'new') return 'bg-blue-100 text-blue-800';
    if (status === 'processing') return 'bg-yellow-100 text-yellow-800';
    if (status === 'completed') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  }

  // Function to format date
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Function to format case type
  function formatCaseType(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  // Function to format field names
  function formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  return (
    <div className="fixed inset-0 overflow-hidden z-50">
      {/* Background overlay - transparent to show dimmed content */}
      <div className="absolute inset-0 bg-gray-900 opacity-50" onClick={onClose}></div>
      
      {/* Drawer panel - now wider */}
      <div className="absolute right-0 top-0 h-full w-full max-w-5xl bg-white shadow-xl">
        <div className="flex h-full">
          {/* Main content area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Case Details</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {loading && (
                <div className="text-center py-12">
                  <div className="text-gray-500">Loading case details...</div>
                </div>
              )}

              {!loading && !caseData && (
                <div className="text-center py-12">
                  <div className="text-gray-500">No case selected</div>
                </div>
              )}

              {!loading && caseData && (
                <div className="p-6 space-y-6">
                  {/* Case Overview */}
                  <Card>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-medium text-gray-900">{caseData.title}</h3>
                          <div className="mt-2 flex items-center space-x-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(caseData.status)}`}>
                              {caseData.status}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatCaseType(caseData.type)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Created</label>
                            <p className="mt-1 text-sm text-gray-900">{formatDate(caseData.createdAt)}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                            <p className="mt-1 text-sm text-gray-900">{formatDate(caseData.updatedAt)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tabs */}
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                      <button
                        onClick={() => setActiveTab('details')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'details'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Details
                      </button>
                      <button
                        onClick={() => setActiveTab('scan')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'scan'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Original Scan
                      </button>
                    </nav>
                  </div>

                  {/* Tab Content */}
                  {activeTab === 'details' && (
                    <div className="space-y-6">
                      {/* Extracted Data - Compact Layout */}
                      <Card>
                        <CardContent>
                          <div className='flex justify-between'>
                            <h4 className="text-lg font-medium text-gray-900 mb-4">Extracted Information</h4>
                            <label className='mx-2 font-small'>
                              <input type="checkbox" className='mx-2 font-small'/>
                                Show/Hide Confidence Rating
                            </label>
                          </div>
                        
                          <div className="grid grid-cols-1">
                            {Object.entries(caseData.extractedData).map(([key, data]) => (
                              <div key={key} className="flex justify-between gap-x-3 items-center py-1 border-b border-gray-100 last:border-b-0">
                                <span className="text-sm font-bold text-gray-700">
                                  {formatFieldName(key)}:
                                </span>
                                <span className="text-sm text-gray-900">{data.value}</span>
                                {data.confidence && (
                                  <div className="text-xs text-gray-500">
                                    {Math.round(data.confidence * 100)}% confidence
                                  </div>
                                )}
                              </div>
                            ))}
                            
                            {Object.keys(caseData.extractedData).length === 0 && (
                              <div className="col-span-full text-center py-8 text-gray-500">
                                No data extracted yet
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {activeTab === 'scan' && (
                    <div className="space-y-6">
                      {/* Original Document */}
                      <Card>
                        <CardContent>
                          <h4 className="text-lg font-medium text-gray-900 mb-4">Original Document</h4>
                          {caseData.originalDocument ? (
                            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                              <div className="text-center">
                                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">{caseData.originalDocument}</h3>
                                <p className="mt-1 text-sm text-gray-500">Click to view full document</p>
                                <div className="mt-4">
                                  <Button>View Document</Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-12 text-gray-500">
                              No document uploaded
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {!loading && caseData && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between">
                  <Button variant="secondary" onClick={onClose}>
                    Close
                  </Button>
                  <div className="space-x-3">
                    <Button variant="secondary">
                      Edit
                    </Button>
                    <Button>
                      Reprocess
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Center Sidebar */}
          {!loading && caseData && (
            <div className="w-64 border-l border-gray-200 bg-gray-50">
              <div className="p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Action Center</h4>
                <div className="space-y-2">
                  <Button variant="secondary" className="w-full justify-start">
                    <span className="mr-2">📝</span>
                    Notes
                  </Button>
                  <Button variant="secondary" className="w-full justify-start">
                    <span className="mr-2">✅</span>
                    Tasks
                  </Button>
                  <Button variant="secondary" className="w-full justify-start">
                    <span className="mr-2">👥</span>
                    Contacts
                  </Button>
                  <Button variant="secondary" className="w-full justify-start">
                    <span className="mr-2">💳</span>
                    Billing
                  </Button>
                  <Button variant="secondary" className="w-full justify-start">
                    <span className="mr-2">📅</span>
                    Schedule
                  </Button>
                  <Button variant="secondary" className="w-full justify-start">
                    <span className="mr-2">🔄</span>
                    Workflow
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}