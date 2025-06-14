import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Login from '../components/auth/Login';

const LoginPage: React.FC = () => {
    const { isAuthenticated, loading } = useAuth();

    // Show loading state
    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    // Redirect to chat if already authenticated
    if (isAuthenticated) {
        return <Navigate to="/chat" />;
    }

    return (
        <div className="auth-page">
            <div className="auth-logo">
                <h1>AI Chat</h1>
            </div>
            <Login />
        </div>
    );
};

export default LoginPage;
