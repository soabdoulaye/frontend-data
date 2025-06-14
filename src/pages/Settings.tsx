import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TwoFactorSetup from '../components/auth/TwoFactorSetup';
import { FiShield, FiArrowLeft } from 'react-icons/fi';

const Settings: React.FC = () => {
    const { isAuthenticated, loading, user } = useAuth();
    const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);

    // Show loading state
    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    const handleTwoFactorSetupComplete = () => {
        setShowTwoFactorSetup(false);
        // Refresh user data
        window.location.reload();
    };

    return (
        <div className="settings-page">
            <div className="settings-header">
                <a href="/chat" className="back-button">
                    <FiArrowLeft /> Back to Chat
                </a>
                <h1>Settings</h1>
            </div>

            <div className="settings-content">
                <div className="settings-section">
                    <h2>Security</h2>

                    <div className="settings-card">
                        <div className="settings-card-header">
                            <div className="settings-card-icon">
                                <FiShield />
                            </div>
                            <div className="settings-card-title">
                                <h3>Two-Factor Authentication</h3>
                                <p>Add an extra layer of security to your account</p>
                            </div>
                        </div>

                        <div className="settings-card-content">
                            {user?.two_factor_enabled ? (
                                <div className="two-factor-status enabled">
                                    <span>Enabled</span>
                                    <p>
                                        Your account is protected with two-factor authentication.
                                    </p>
                                </div>
                            ) : showTwoFactorSetup ? (
                                <TwoFactorSetup onComplete={handleTwoFactorSetupComplete} />
                            ) : (
                                <div className="two-factor-status disabled">
                                    <span>Disabled</span>
                                    <p>
                                        Two-factor authentication is not enabled for your account.
                                        Enable it for additional security.
                                    </p>
                                    <button
                                        className="primary-button"
                                        onClick={() => setShowTwoFactorSetup(true)}
                                    >
                                        Enable Two-Factor Authentication
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="settings-section">
                    <h2>Account Information</h2>

                    <div className="settings-card">
                        <div className="settings-card-content">
                            <div className="account-info">
                                <div className="info-row">
                                    <span className="info-label">Username</span>
                                    <span className="info-value">{user?.username}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Email</span>
                                    <span className="info-value">{user?.email}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Account Created</span>
                                    <span className="info-value">
                                        {user?.created_at
                                            ? new Date(user.created_at).toLocaleDateString()
                                            : 'N/A'}
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Last Login</span>
                                    <span className="info-value">
                                        {user?.lastLoginAt
                                            ? new Date(user.lastLoginAt).toLocaleString()
                                            : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
