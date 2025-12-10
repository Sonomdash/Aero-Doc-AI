import { ChatSession } from '@/types';
import { MessageSquare, Plus } from 'lucide-react';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

interface ChatHistoryProps {
    sessions: ChatSession[];
    currentSessionId: string | null;
    onSelectSession: (sessionId: string) => void;
    onNewChat: () => void;
    isLoading?: boolean;
}

export default function ChatHistory({
    sessions,
    currentSessionId,
    onSelectSession,
    onNewChat,
    isLoading = false
}: ChatHistoryProps) {
    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-700 w-64 flex-shrink-0">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    New Chat
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {isLoading ? (
                    [1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse h-12 bg-gray-200 dark:bg-gray-800 rounded mx-2 mb-2"></div>
                    ))
                ) : sessions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                        <p>No chat history</p>
                    </div>
                ) : (
                    sessions.map((session) => (
                        <button
                            key={session.id}
                            onClick={() => onSelectSession(session.id)}
                            className={clsx(
                                'w-full text-left px-3 py-3 rounded-md flex items-start space-x-3 transition-colors',
                                currentSessionId === session.id
                                    ? 'bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'
                            )}
                        >
                            <MessageSquare className={clsx(
                                'h-5 w-5 mt-0.5 flex-shrink-0',
                                currentSessionId === session.id ? 'text-blue-500' : 'text-gray-400'
                            )} />
                            <div className="min-w-0 flex-1">
                                <p className={clsx(
                                    'text-sm font-medium truncate',
                                    currentSessionId === session.id ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                                )}>
                                    {session.title || 'Untitled Chat'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                    {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
                                </p>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
