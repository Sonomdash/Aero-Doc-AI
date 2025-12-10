'use client';

import Sidebar from '@/components/Dashboard/Sidebar';
import Header from '@/components/Dashboard/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            // Double check token existence to avoid premature redirect
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
            }
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect via useEffect
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
            {/* Sidebar */}
            <aside className="hidden md:block flex-shrink-0">
                <Sidebar />
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
