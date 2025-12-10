'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    email: string;
    full_name?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchUser = async () => {
        try {
            const response = await api.get('/auth/me');
            setUser(response.data);
        } catch (error) {
            console.error('Failed to fetch user', error);
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { access_token } = response.data;
            localStorage.setItem('token', access_token);
            await fetchUser();
            router.push('/dashboard');
        } catch (error) {
            console.error('Login failed', error);
            throw error;
        }
    };

    const register = async (email: string, password: string, fullName: string) => {
        try {
            await api.post('/auth/register', { email, password, full_name: fullName });
            // Auto login after register? Or redirect to login?
            // For now, let's login automatically
            await login(email, password);
        } catch (error) {
            console.error('Registration failed', error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
