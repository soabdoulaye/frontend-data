import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import dotenv from 'dotenv';

// API URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-data-d6uy.onrender.com';
const API_URL = `${BACKEND_URL}/api`;
console.log('BACKEND_URL:', BACKEND_URL);

// Types
interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    two_factor_enabled?: boolean;
    profile_picture?: string;
    created_at: Date;
    lastLoginAt?: Date;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
    requiresTwoFactor: boolean;
    tempuser_id: string | null;
    login: (usernameOrEmail: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    verifyTwoFactor: (token: string) => Promise<void>;
    setupTwoFactor: () => Promise<{ secret: string; otpAuthUrl: string; qrCodeUrl: string }>;
    clearError: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [requiresTwoFactor, setRequiresTwoFactor] = useState<boolean>(false);
    const [tempuser_id, setTempuser_id] = useState<string | null>(null);

    // Initialize auth state from localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem('token');

        if (storedToken) {
            try {
                // Check if token is expired
                const tokenParts = storedToken.split('.');
                if (tokenParts.length !== 3) {
                    throw new Error('Invalid token format');
                }

                const payload = JSON.parse(atob(tokenParts[1]));
                const currentTime = Date.now() / 1000;

                if (payload.exp && payload.exp < currentTime) {
                    // Token is expired
                    localStorage.removeItem('token');
                    setIsAuthenticated(false);
                    setUser(null);
                    setToken(null);
                } else {
                    // Token is valid
                    setToken(storedToken);
                    setIsAuthenticated(true);

                    // Set axios default headers
                    axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

                    // Fetch user data
                    fetchUserData(storedToken);
                }
            } catch (error) {
                // Invalid token
                localStorage.removeItem('token');
                setIsAuthenticated(false);
                setUser(null);
                setToken(null);
            }
        }

        setLoading(false);
    }, []);

    // Fetch user data
    const fetchUserData = async (authToken: string) => {
        try {
            const response = await axios.get(`${API_URL}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            });

            setUser(response.data.data);
        } catch (error) {
            console.error('Error fetching user data:', error);
            setError('Failed to fetch user data');
        }
    };

    // Login
    const login = async (usernameOrEmail: string, password: string) => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.post(`${API_URL}/auth/login`, {
                usernameOrEmail,
                password
            });

            const { data } = response.data;

            if (data.requiresTwoFactor) {
                // Two-factor authentication required
                setRequiresTwoFactor(true);
                setTempuser_id(data.user_id);
                setLoading(false);
                return;
            }

            // Login successful
            localStorage.setItem('token', data.token);
            setToken(data.token);
            setUser(data.user);
            setIsAuthenticated(true);

            // Set axios default headers
            axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

            setLoading(false);
        } catch (error: any) {
            setLoading(false);
            setError(error.response?.data?.error || 'Login failed');
        }
    };

    // Register
    const register = async (username: string, email: string, password: string) => {
        try {
            setLoading(true);
            setError(null);

            await axios.post(`${API_URL}/auth/register`, {
                username,
                email,
                password
            });

            setLoading(false);
        } catch (error: any) {
            setLoading(false);
            setError(error.response?.data?.error || 'Registration failed');
        }
    };

    // Verify two-factor authentication
    const verifyTwoFactor = async (token: string) => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.post(`${API_URL}/auth/2fa/verify`, {
                user_id: tempuser_id,
                token
            });

            const { data } = response.data;

            // Login successful
            localStorage.setItem('token', data.token);
            setToken(data.token);
            setUser(data.user);
            setIsAuthenticated(true);
            setRequiresTwoFactor(false);
            setTempuser_id(null);

            // Set axios default headers
            axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

            setLoading(false);
        } catch (error: any) {
            setLoading(false);
            setError(error.response?.data?.error || 'Two-factor authentication failed');
        }
    };

    // Setup two-factor authentication
    const setupTwoFactor = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.post(`${API_URL}/auth/2fa/setup`);

            setLoading(false);
            return response.data.data;
        } catch (error: any) {
            setLoading(false);
            setError(error.response?.data?.error || 'Failed to setup two-factor authentication');
            throw error;
        }
    };

    // Logout
    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);

        // Remove axios default headers
        delete axios.defaults.headers.common['Authorization'];
    };

    // Clear error
    const clearError = () => {
        setError(null);
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                user,
                token,
                loading,
                error,
                requiresTwoFactor,
                tempuser_id,
                login,
                register,
                logout,
                verifyTwoFactor,
                setupTwoFactor,
                clearError
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};
