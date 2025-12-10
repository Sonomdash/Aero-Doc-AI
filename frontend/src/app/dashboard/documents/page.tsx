'use client';

import { useEffect, useState, useCallback } from 'react';
import DocumentUpload from '@/components/Documents/DocumentUpload';
import DocumentList from '@/components/Documents/DocumentList';
import { documentService } from '@/services/documents';
import { Document } from '@/types';
import { RefreshCw } from 'lucide-react';

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadDocuments = useCallback(async () => {
        setIsLoading(true);
        try {
            const docs = await documentService.getDocuments();
            setDocuments(docs);
        } catch (error) {
            console.error('Failed to load documents', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDocuments();
    }, [loadDocuments]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documents</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Upload and manage your documents for AI processing.
                    </p>
                </div>
                <button
                    onClick={loadDocuments}
                    className="p-2 text-gray-400 hover:text-gray-500 transition-colors"
                    title="Refresh list"
                >
                    <RefreshCw className="h-5 w-5" />
                </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <DocumentList
                        documents={documents}
                        onDeleteSuccess={loadDocuments}
                        isLoading={isLoading}
                    />
                </div>
                <div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Upload New</h2>
                        <DocumentUpload onUploadSuccess={loadDocuments} />
                    </div>
                </div>
            </div>
        </div>
    );
}
