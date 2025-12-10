import { Message } from '@/types';
import { User, Bot, FileText } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

interface ChatMessageProps {
    message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === 'user';

    return (
        <div className={clsx('flex w-full mb-6', isUser ? 'justify-end' : 'justify-start')}>
            <div className={clsx('flex max-w-[80%] md:max-w-[70%]', isUser ? 'flex-row-reverse' : 'flex-row')}>
                <div
                    className={clsx(
                        'flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center',
                        isUser ? 'bg-blue-600 ml-3' : 'bg-green-600 mr-3'
                    )}
                >
                    {isUser ? <User className="h-5 w-5 text-white" /> : <Bot className="h-5 w-5 text-white" />}
                </div>

                <div className={clsx('flex flex-col', isUser ? 'items-end' : 'items-start')}>
                    <div
                        className={clsx(
                            'p-4 rounded-lg shadow-sm text-sm',
                            isUser
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none border border-gray-200 dark:border-gray-700'
                        )}
                    >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>

                    {/* Source citations for AI messages */}
                    {!isUser && message.sources && message.sources.length > 0 && (
                        <div className="mt-2 text-xs">
                            <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">Sources:</p>
                            <div className="flex flex-wrap gap-2">
                                {message.sources.map((source, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
                                    >
                                        <FileText className="h-3 w-3 mr-1" />
                                        <span className="truncate max-w-[150px]" title={source.filename}>
                                            {source.filename}
                                        </span>
                                        {source.page_number && <span className="ml-1 opacity-70">(p. {source.page_number})</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <span className="text-xs text-gray-400 mt-1">
                        {format(new Date(message.created_at), 'p')}
                    </span>
                </div>
            </div>
        </div>
    );
}
