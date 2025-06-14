import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TwoFactorAuth from './TwoFactorAuth';

const Login: React.FC = () => {
    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading, error, requiresTwoFactor, clearError } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        try {
            await login(usernameOrEmail, password);

            // If 2FA is not required, redirect to chat
            if (!requiresTwoFactor) {
                navigate('/chat');
            }
        } catch (error) {
            console.error('Login error:', error);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Login</h2>

                {requiresTwoFactor ? (
                    <TwoFactorAuth />
                ) : (
                    <form onSubmit={handleSubmit}>
                        {error && <div className="error-message">{error}</div>}

                        <div className="form-group">
                            <label htmlFor="usernameOrEmail">Username or Email</label>
                            <input
                                type="text"
                                id="usernameOrEmail"
                                value={usernameOrEmail}
                                onChange={(e) => setUsernameOrEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <button type="submit" className="auth-button" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>

                        <div className="auth-links">
                            <p>
                                Don't have an account?{' '}
                                <Link to="/register">Register</Link>
                            </p>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;
