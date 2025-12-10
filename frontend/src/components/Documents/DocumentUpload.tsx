'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, Loader2, X } from 'lucide-react';
import { documentService } from '@/services/documents';
import clsx from 'clsx';

interface DocumentUploadProps {
    onUploadSuccess: () => void;
}

export default function DocumentUpload({ onUploadSuccess }: DocumentUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            await documentService.uploadDocument(file);
            onUploadSuccess();
        } catch (err: any) {
            console.error('Upload failed', err);
            setError(err.response?.data?.detail || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    }, [onUploadSuccess]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/msword': ['.doc'],
        },
        maxFiles: 1,
        disabled: uploading,
    });

    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={clsx(
                    'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                    isDragActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
                    uploading && 'opacity-50 cursor-not-allowed'
                )}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center space-y-4">
                    {uploading ? (
                        <>
                            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">Uploading and processing...</p>
                        </>
                    ) : (
                        <>
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                                <UploadCloud className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div className="text-gray-600 dark:text-gray-300">
                                <span className="font-medium text-blue-600 hover:text-blue-500">
                                    Click to upload
                                </span>{' '}
                                or drag and drop
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                PDF, DOCX up to 10MB
                            </p>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-md flex items-start">
                    <X className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="ml-3 text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}
        </div>
    );
}
