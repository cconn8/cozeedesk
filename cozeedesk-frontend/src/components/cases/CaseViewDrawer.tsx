'use client';

import { useState, useEffect } from 'react';
import { Case } from '@/types/case';
import { X, Eye, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { casesApi } from '@/lib/casesApi';

interface CaseViewDrawerProps {
  case: Case | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CaseViewDrawer({ case: caseData, isOpen, onClose }: CaseViewDrawerProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'original'>('details');
  const [originalScanUrl, setOriginalScanUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load original scan URL when drawer opens and case has originalScanUrl
  useEffect(() => {
    if (isOpen && caseData && caseData.originalScanUrl) {
      loadOriginalScan();
    } else {
      setOriginalScanUrl(null);
      setActiveTab('details');
    }
  }, [isOpen, caseData]);

  const loadOriginalScan = async () => {
    if (!caseData || !caseData.originalScanUrl) return;

    try {
      setLoading(true);
      // If the case has an originalScanUrl, try to get a fresh signed URL
      if (caseData.status === 'pending_verification' || caseData.status === 'active') {
        try {
          const verificationData = await casesApi.getVerificationData(caseData._id);
          setOriginalScanUrl(verificationData.originalScanUrl);
        } catch (error) {
          // If verification endpoint fails, use the stored URL
          setOriginalScanUrl(caseData.originalScanUrl);
        }
      } else {
        setOriginalScanUrl(caseData.originalScanUrl);
      }
    } catch (error) {
      console.error('Failed to load original scan:', error);
      setOriginalScanUrl(null);
    } finally {
      setLoading(false);
    }
  };

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

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Details
              </button>
              {(caseData.originalScanUrl || originalScanUrl) && (
                <button
                  onClick={() => setActiveTab('original')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'original'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Eye className="w-4 h-4 mr-2 inline" />
                  Original Scan
                </button>
              )}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'details' && (
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
          )}

          {activeTab === 'original' && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Original Document
              </h3>
              
              {loading ? (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Loading original document...</p>
                  </div>
                </div>
              ) : originalScanUrl ? (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="space-y-4">
                    {originalScanUrl.toLowerCase().includes('.pdf') || originalScanUrl.includes('application%2Fpdf') ? (
                      // Handle PDF files
                      <div className="flex items-center justify-center h-64 text-gray-600 bg-white rounded border-2 border-dashed border-gray-300">
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-red-100 rounded-lg">
                            <span className="text-2xl font-bold text-red-600">PDF</span>
                          </div>
                          <p className="text-lg font-medium mb-2">PDF Document</p>
                          <p className="text-sm text-gray-600 mb-4">
                            This is the original PDF document that was processed for data extraction.
                          </p>
                          <a 
                            href={originalScanUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View PDF
                          </a>
                        </div>
                      </div>
                    ) : (
                      // Handle image files
                      <>
                        <img 
                          src={originalScanUrl} 
                          alt="Original scanned document"
                          className="w-full h-auto rounded shadow-sm max-h-[600px] object-contain mx-auto"
                          onLoad={() => console.log('Image loaded successfully:', originalScanUrl)}
                          onError={(e) => {
                            console.error('Failed to load image:', originalScanUrl);
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
                            <p className="text-xs mt-4 break-all">URL: {originalScanUrl}</p>
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
                  
                  {/* Document metadata */}
                  <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">Created:</span> {new Date(caseData.createdAt).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span> {caseData.status}
                      </div>
                      {caseData.extractionMetadata?.confidence && (
                        <div>
                          <span className="font-medium">Extraction Confidence:</span> {caseData.extractionMetadata.confidence}
                        </div>
                      )}
                      {caseData.extractionMetadata?.processingTime && (
                        <div>
                          <span className="font-medium">Processing Time:</span> {caseData.extractionMetadata.processingTime}ms
                        </div>
                      )}
                    </div>
                  </div>
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
          )}
        </div>
      </div>
    </>
  );
}