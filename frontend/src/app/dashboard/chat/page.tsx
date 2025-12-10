'use client';

import { useState, useEffect, useCallback } from 'react';
import ChatHistory from '@/components/Chat/ChatHistory';
import ChatInterface from '@/components/Chat/ChatInterface';
import { chatService } from '@/services/chat';
import { ChatSession, Message } from '@/types';
import { Menu } from 'lucide-react';

export default function ChatPage() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
    const [isSessionsLoading, setIsSessionsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open on desktop

    const loadSessions = useCallback(async () => {
        setIsSessionsLoading(true);
        try {
            const data = await chatService.getSessions();
            setSessions(data.sessions);

            // If no session selected but sessions exist, select the first one
            // if (!currentSessionId && data.sessions.length > 0) {
            //     handleSelectSession(data.sessions[0].id);
            // } 

            // Actually, maybe better to start with new chat or explicit select.
            // Let's leave it as is (no session selected = new chat state).
        } catch (error) {
            console.error('Failed to load chat sessions', error);
        } finally {
            setIsSessionsLoading(false);
        }
    }, [currentSessionId]);

    const handleSelectSession = async (sessionId: string) => {
        setCurrentSessionId(sessionId);
        setCurrentMessages([]); // Clear previous messages while loading

        // On mobile, close sidebar after selection
        if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
        }

        try {
            const history = await chatService.getSessionHistory(sessionId);
            setCurrentMessages(history.messages);
        } catch (error) {
            console.error('Failed to load session history', error);
        }
    };

    const handleNewChat = () => {
        setCurrentSessionId(null);
        setCurrentMessages([]);
        if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
        }
    };

    const handleSessionCreated = (newSession: ChatSession) => {
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
    };

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    // Handle initial responsive sidebar state
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };

        // Set initial state
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const currentSession = sessions.find(s => s.id === currentSessionId) || null;

    return (
        <div className="h-[calc(100vh-8rem)] flex overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 relative">
            {/* Sidebar Toggle for Mobile */}
            <button
                className="absolute top-4 left-4 z-20 p-2 bg-white dark:bg-gray-800 rounded-md shadow-md lg:hidden"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>

            {/* Sidebar */}
            <div className={`
                absolute inset-y-0 left-0 z-10 transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <ChatHistory
                    sessions={sessions}
                    currentSessionId={currentSessionId}
                    onSelectSession={handleSelectSession}
                    onNewChat={handleNewChat}
                    isLoading={isSessionsLoading}
                />
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <ChatInterface
                    session={currentSession}
                    initialMessages={currentMessages}
                    onSessionCreated={handleSessionCreated}
                />
            </div>
        </div>
    );
}
