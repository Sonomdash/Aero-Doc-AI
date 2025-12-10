'use client';

import { useAuth } from '@/contexts/AuthContext';
import { UserCircle } from 'lucide-react';

export default function Header() {
    const { user } = useAuth();

    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-6">
            <div className="flex items-center">
                {/* Breadcrumbs or Page Title could go here */}
                {/* <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Dashboard</h2> */}
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {user?.full_name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user?.email}
                        </p>
                    </div>
                    <UserCircle className="h-8 w-8 text-gray-400" />
                </div>
            </div>
        </header>
    );
}
