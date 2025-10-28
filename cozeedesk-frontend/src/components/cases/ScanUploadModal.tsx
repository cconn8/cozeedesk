'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CaseTemplate } from '@/types/template';
import { templatesApi } from '@/lib/templatesApi';
import { casesApi } from '@/lib/casesApi';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Button } from '@/components/ui/Button';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';

interface ScanUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (caseId: string) => void;
}

export default function ScanUploadModal({ isOpen, onClose, onSuccess }: ScanUploadModalProps) {
  const [templates, setTemplates] = useState<CaseTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateMode, setTemplateMode] = useState<'strict' | 'flexible'>('flexible');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const { notifications } = useWebSocket();

  // Load templates on modal open
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      setSelectedTemplateId('');
      setUploadedFile(null);
      setError('');
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      const data = await templatesApi.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false,
  });

  // Handle file upload
  const handleUpload = async () => {
    if (!uploadedFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const uploadData = {
        templateId: selectedTemplateId || undefined,
        templateMode,
      };

      const response = await casesApi.uploadScan(uploadedFile, uploadData);
      onSuccess(response.caseId);
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      setError('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Upload Scanned Document</h2>
            <Button 
              type="button"
              onClick={onClose}
              variant="secondary"
              className="p-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Template Selection */}
          {templates.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template (Optional)
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No template - flexible extraction</option>
                {templates.map((template) => (
                  <option key={template._id} value={template._id}>
                    {template.name} ({template.type})
                  </option>
                ))}
              </select>
              
              {selectedTemplateId && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Extraction Mode
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="templateMode"
                        value="flexible"
                        checked={templateMode === 'flexible'}
                        onChange={(e) => setTemplateMode(e.target.value as 'flexible')}
                        className="mr-2"
                      />
                      Flexible (recommended)
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="templateMode"
                        value="strict"
                        checked={templateMode === 'strict'}
                        onChange={(e) => setTemplateMode(e.target.value as 'strict')}
                        className="mr-2"
                      />
                      Strict
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* File Upload Area */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document File
            </label>
            
            {!uploadedFile ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                {isDragActive ? (
                  <p className="text-blue-600">Drop the file here...</p>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-2">
                      Drag and drop a document here, or click to select
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports PDF, PNG, JPG, JPEG, GIF (max 50MB)
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={removeFile}
                    variant="secondary"
                    className="p-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {fileRejections.length > 0 && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-700">
                    {fileRejections[0].errors[0].message}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!uploadedFile || uploading}
            >
              {uploading ? 'Uploading...' : 'Upload & Process'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}