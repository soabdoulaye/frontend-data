import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const TwoFactorAuth: React.FC = () => {
    const [token, setToken] = useState('');
    const { verifyTwoFactor, loading, error, clearError } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        try {
            await verifyTwoFactor(token);
            navigate('/chat');
        } catch (error) {
            console.error('2FA verification error:', error);
        }
    };

    return (
        <div className="two-factor-container">
            <h3>Two-Factor Authentication</h3>
            <p>Please enter the verification code from your authenticator app.</p>

            <form onSubmit={handleSubmit}>
                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                    <label htmlFor="token">Verification Code</label>
                    <input
                        type="text"
                        id="token"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Enter 6-digit code"
                        required
                        disabled={loading}
                        autoComplete="off"
                        maxLength={6}
                        pattern="[0-9]{6}"
                    />
                </div>

                <button type="submit" className="auth-button" disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify'}
                </button>
            </form>
        </div>
    );
};

export default TwoFactorAuth;
