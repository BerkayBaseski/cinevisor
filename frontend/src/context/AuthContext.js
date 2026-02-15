'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for stored user on mount
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('access_token');
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = useCallback(async (email, password) => {
        const data = await api.login(email, password);
        if (data.data?.user) {
            setUser(data.data.user);
        }
        return data;
    }, []);

    const register = useCallback(async (email, username, password) => {
        return api.register(email, username, password);
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.logout();
        } catch (e) {
            console.warn('Backend logout failed:', e);
        }
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setUser(null);
    }, []);

    const updateUser = useCallback((userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    }, []);

    const isLoggedIn = !!user;
    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{ user, loading, isLoggedIn, isAdmin, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
