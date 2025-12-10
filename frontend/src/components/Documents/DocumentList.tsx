'use client';

import { useState } from 'react';
import { Document } from '@/types';
import { FileText, Trash2, CheckCircle, XCircle, Clock, File } from 'lucide-react';
import { documentService } from '@/services/documents';
import clsx from 'clsx';
import { format } from 'date-fns';

interface DocumentListProps {
    documents: Document[];
    onDeleteSuccess: () => void;
    isLoading: boolean;
}

export default function DocumentList({ documents, onDeleteSuccess, isLoading }: DocumentListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        setDeletingId(id);
        try {
            await documentService.deleteDocument(id);
            onDeleteSuccess();
        } catch (error) {
            console.error('Failed to delete document', error);
            alert('Failed to delete document');
        } finally {
            setDeletingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full mr-4"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (documents.length === 0) {
        return (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 border-dashed">
                <File className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No documents</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by uploading a new document.</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden bg-white dark:bg-gray-800 shadow sm:rounded-md">
            <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
                {documents.map((doc) => (
                    <li key={doc.id}>
                        <div className="flex items-center px-4 py-4 sm:px-6">
                            <div className="min-w-0 flex-1 flex items-center">
                                <div className="flex-shrink-0">
                                    <FileText className="h-8 w-8 text-blue-500" />
                                </div>
                                <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4">
                                    <div>
                                        <p className="truncate text-sm font-medium text-blue-600 dark:text-blue-400">{doc.filename}</p>
                                        <p className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                                            <span className="truncate">{(doc.file_size / 1024).toFixed(2)} KB</span>
                                        </p>
                                    </div>
                                    <div className="hidden md:block">
                                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                            <Clock className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                                            <p>Uploaded {format(new Date(doc.upload_date), 'PPP')}</p>
                                        </div>
                                        <div className="mt-2 flex items-center">
                                            {doc.processed ? (
                                                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/20 dark:text-green-400">
                                                    <CheckCircle className="mr-1 h-3 w-3" />
                                                    Ready
                                                </span>
                                            ) : doc.error_message ? (
                                                <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-900/20 dark:text-red-400" title={doc.error_message}>
                                                    <XCircle className="mr-1 h-3 w-3" />
                                                    Error
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-900/20 dark:text-yellow-400">
                                                    <Clock className="mr-1 h-3 w-3" />
                                                    Processing
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <button
                                    onClick={() => handleDelete(doc.id)}
                                    disabled={deletingId === doc.id}
                                    className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                >
                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
