'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Message, ChatSession } from '@/types';
import ChatMessage from './ChatMessage';
import { chatService } from '@/services/chat';

interface ChatInterfaceProps {
    session: ChatSession | null;
    initialMessages?: Message[];
    onSessionCreated?: (session: ChatSession) => void;
}

export default function ChatInterface({
    session,
    initialMessages = [],
    onSessionCreated
}: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Update messages when initialMessages changes (e.g. switching sessions)
    useEffect(() => {
        setMessages(initialMessages);
    }, [initialMessages]);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const content = input.trim();
        setInput('');

        // Optimistic update for user message
        const optimisticMessage: Message = {
            id: 'temp-' + Date.now(),
            session_id: session?.id || '',
            role: 'user',
            content: content,
            created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setIsLoading(true);

        try {
            let currentSessionId = session?.id;
            let currentSession = session;

            // If no session exists, create one first or handle it within the send flow
            // Ideally we create a session if one doesn't exist
            if (!currentSessionId) {
                // Generate a title from the first message
                const title = content.slice(0, 30) + (content.length > 30 ? '...' : '');
                const newSession = await chatService.createSession(title);
                currentSessionId = newSession.id;
                currentSession = newSession;
                if (onSessionCreated) onSessionCreated(newSession);

                // Update optimistic message with real session ID
                setMessages(prev => prev.map(m => m.id === optimisticMessage.id ? { ...m, session_id: newSession.id } : m));
            }

            const response = await chatService.sendMessage(currentSessionId!, content);

            // Allow time for optimistic update to settle visually if needed, but here we just append response
            // We should also replace the optimistic message with the real one if we want real IDs, 
            // but for display it doesn't matter much.
            // Let's just append the AI response.
            setMessages(prev => [...prev, response]);

        } catch (error) {
            console.error('Failed to send message', error);
            // Remove optimistic message or show error
            // setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
            alert('Failed to send message. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Header if session exists */}
            {session && (
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                        {session.title}
                    </h2>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-gray-900/20">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-500">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-4">
                            <Send className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Start a conversation</h3>
                        <p className="max-w-md">
                            Ask questions about your documents. Upload documents in the Documents tab first to get context-aware answers.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {messages.map((msg) => (
                            <ChatMessage key={msg.id} message={msg} />
                        ))}
                        {isLoading && (
                            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 ml-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm">AI is thinking...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSubmit} className="flex gap-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
