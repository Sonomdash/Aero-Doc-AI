import api from '@/lib/api';
import { ChatSession, Message, ChatHistoryResponse, ChatSessionListResponse } from '@/types';

// We need to define this as it might not be in types/index.ts yet based on previous check, 
// checking step 34 output again... ChatHistoryResponse was NOT in the file content shown.
// Wait, step 34 showed lines 1-42 and it ended with Message and Source interfaces.
// I should add ChatHistoryResponse to types or define it here if it's small. 
// Ideally all types in types/index.ts. 
// Let's add the missing types to types/index.ts first in a separate tool call if needed, 
// or just export what I need.

// Actually, looking at the backend code for ChatHistoryResponse (step 19, line 62 in chat.py),
// it returns { session: ChatSession, messages: Message[] }.
// I'll define it here for now or update types/index.ts. Updating types is cleaner.
// But for now let's write the service assuming types will be there or I use `any` temporarily if strictness allows, 
// but better to be explicit.

export const chatService = {
    async createSession(title: string): Promise<ChatSession> {
        const response = await api.post<ChatSession>('/chat/sessions', { title });
        return response.data;
    },

    async getSessions(): Promise<ChatSessionListResponse> {
        const response = await api.get<ChatSessionListResponse>('/chat/sessions');
        return response.data;
    },

    async getSessionHistory(sessionId: string): Promise<ChatHistoryResponse> {
        const response = await api.get<ChatHistoryResponse>(`/chat/sessions/${sessionId}`);
        return response.data;
    },

    async sendMessage(sessionId: string, content: string): Promise<Message> {
        const response = await api.post<Message>(`/chat/sessions/${sessionId}/messages`, {
            session_id: sessionId,
            content,
        });
        return response.data;
    },
};
