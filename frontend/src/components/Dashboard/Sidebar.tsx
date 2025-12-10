'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, MessageSquare, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import clsx from 'clsx';

const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Documents', href: '/dashboard/documents', icon: FileText },
    { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { logout } = useAuth();

    return (
        <div className="flex h-full w-64 flex-col bg-gray-900">
            <div className="flex h-16 items-center px-6">
                <h1 className="text-xl font-bold text-white">Aero-Doc AI</h1>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
                <nav className="flex-1 space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={clsx(
                                    isActive
                                        ? 'bg-gray-800 text-white'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                                    'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors'
                                )}
                            >
                                <item.icon
                                    className={clsx(
                                        isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-white',
                                        'mr-3 h-5 w-5 flex-shrink-0'
                                    )}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto border-t border-gray-800 pt-4">
                    {/* Settings Link (Optional) */}
                    <Link
                        href="/dashboard/settings"
                        className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                        <Settings
                            className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-white"
                        />
                        Settings
                    </Link>

                    <button
                        onClick={logout}
                        className="group mt-1 flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                        <LogOut
                            className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-white"
                        />
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}
