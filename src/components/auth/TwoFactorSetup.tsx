import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface TwoFactorSetupProps {
    onComplete: () => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onComplete }) => {
    const [secret, setSecret] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const { setupTwoFactor, verifyTwoFactor, loading } = useAuth();

    useEffect(() => {
        const setup = async () => {
            try {
                setIsLoading(true);
                const { secret, qrCodeUrl } = await setupTwoFactor();
                setSecret(secret);
                setQrCodeUrl(qrCodeUrl);
            } catch (error: any) {
                setError(error.message || 'Failed to setup two-factor authentication');
            } finally {
                setIsLoading(false);
            }
        };

        setup();
    }, [setupTwoFactor]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await verifyTwoFactor(token);
            onComplete();
        } catch (error: any) {
            setError(error.message || 'Invalid verification code');
        }
    };

    if (isLoading) {
        return <div className="loading">Setting up two-factor authentication...</div>;
    }

    return (
        <div className="two-factor-setup-container">
            <h3>Set Up Two-Factor Authentication</h3>
            <p>Scan the QR code with your authenticator app (like Google Authenticator or Authy).</p>

            {qrCodeUrl && (
                <div className="qr-code-container">
                    <img src={qrCodeUrl} alt="QR Code for 2FA" />
                </div>
            )}

            <div className="secret-key-container">
                <p>If you can't scan the QR code, enter this secret key manually:</p>
                <code className="secret-key">{secret}</code>
            </div>

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
                    {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
                </button>
            </form>
        </div>
    );
};

export default TwoFactorSetup;
