import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Register: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const { register, loading, error, clearError } = useAuth();
    const navigate = useNavigate();

    const validatePassword = () => {
        if (password !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return false;
        }

        if (password.length < 8) {
            setPasswordError('Password must be at least 8 characters long');
            return false;
        }

        setPasswordError('');
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        // Validate password
        if (!validatePassword()) {
            return;
        }

        try {
            await register(username, email, password);
            navigate('/login');
        } catch (error) {
            console.error('Registration error:', error);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Register</h2>

                <form onSubmit={handleSubmit}>
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                        {passwordError && <div className="error-message">{passwordError}</div>}
                    </div>

                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>

                    <div className="auth-links">
                        <p>
                            Already have an account?{' '}
                            <Link to="/login">Login</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
