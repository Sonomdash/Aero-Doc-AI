export interface User {
    id: string;
    email: string;
    full_name?: string;
}

export interface Document {
    id: string;
    user_id: string;
    filename: string;
    file_type: string;
    file_size: number;
    upload_date: string;
    processed: boolean;
    chunk_count: number;
    error_message?: string;
}

export interface ChatSession {
    id: string;
    user_id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

export interface Message {
    id: string;
    session_id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
    sources?: Source[];
}

export interface Source {
    doc_id: string;
    filename: string;
    chunk_index: number;
    page_number?: number;
}

export interface ChatSessionListResponse {
    sessions: ChatSession[];
    total: number;
}

export interface ChatHistoryResponse {
    session: ChatSession;
    messages: Message[];
}
