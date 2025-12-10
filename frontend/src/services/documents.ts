import api from '@/lib/api';
import { Document } from '@/types';

export const documentService = {
    async uploadDocument(file: File): Promise<Document> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<Document>('/documents/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    async getDocuments(): Promise<Document[]> {
        const response = await api.get<Document[]>('/documents');
        return response.data;
    },

    async getDocument(id: string): Promise<Document> {
        const response = await api.get<Document>(`/documents/${id}`);
        return response.data;
    },

    async deleteDocument(id: string): Promise<void> {
        await api.delete(`/documents/${id}`);
    },
};
