'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { FileText, MessageSquare, Clock } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        documents: 0,
        chats: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [docsRes, chatsRes] = await Promise.all([
                    api.get('/documents'),
                    api.get('/chat/sessions')
                ]);

                setStats({
                    documents: docsRes.data.length,
                    chats: chatsRes.data.sessions ? chatsRes.data.sessions.length : 0,
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchStats();
        }
    }, [user]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Overview
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Welcome back, {user?.full_name}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Documents Card */}
                <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <FileText className="h-6 w-6 text-gray-400" aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Total Documents
                                    </dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900 dark:text-white">
                                            {loading ? '...' : stats.documents}
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                        <div className="text-sm">
                            <Link
                                href="/dashboard/documents"
                                className="font-medium text-blue-600 hover:text-blue-500"
                            >
                                View all
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Chats Card */}
                <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <MessageSquare className="h-6 w-6 text-gray-400" aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Active Chats
                                    </dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900 dark:text-white">
                                            {loading ? '...' : stats.chats}
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                        <div className="text-sm">
                            <Link
                                href="/dashboard/chat"
                                className="font-medium text-blue-600 hover:text-blue-500"
                            >
                                Start new chat
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Card */}
                <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                                Quick Actions
                            </h3>
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-4">
                            <Link
                                href="/dashboard/documents"
                                className="flex items-center p-3 text-base font-medium text-gray-900 rounded-lg bg-gray-50 hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white"
                            >
                                <FileText className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                                <span className="flex-1 ml-3 whitespace-nowrap">Upload Document</span>
                            </Link>
                            <Link
                                href="/dashboard/chat"
                                className="flex items-center p-3 text-base font-medium text-gray-900 rounded-lg bg-gray-50 hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white"
                            >
                                <MessageSquare className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                                <span className="flex-1 ml-3 whitespace-nowrap">Ask a Question</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
