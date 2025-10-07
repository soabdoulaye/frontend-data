import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiGlobe, FiMic, FiMessageCircle, FiZap } from 'react-icons/fi';
import './djelia-style.css';

// Lightweight language selector component (doesn't require context)
const DjeliaCloud: React.FC = () => {
    const navigate = useNavigate();
    const [currentLanguage, setCurrentLanguage] = useState<string>('en');
    const [showLanguages, setShowLanguages] = useState(false);
    const [languages] = useState([
        { code: 'bm', name: 'Bambara', native: 'Bamanankan', flag: '🇲🇱' },
        { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
        { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
        { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
        { code: 'sw', name: 'Swahili', native: 'Kiswahili', flag: '🇰🇪' },
        { code: 'yo', name: 'Yoruba', native: 'Yorùbá', flag: '🇳🇬' },
        { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
        { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇵🇹' },
        { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳' },
        { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
    ]);

    useEffect(() => {
        // Load saved language
        const saved = localStorage.getItem('preferred_language');
        if (saved) {
            setCurrentLanguage(saved);
        }
    }, []);

    const handleLanguageChange = (code: string) => {
        setCurrentLanguage(code);
        localStorage.setItem('preferred_language', code);
        setShowLanguages(false);
    };

    const handleStartChat = () => {
        navigate('/chat');
    };

    const currentLang = languages.find(l => l.code === currentLanguage) || languages[1];
    const isRTL = currentLanguage === 'ar';

    return (
        <div className="djelia-cloud-container" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Header */}
            <header className="djelia-header">
                <div className="header-content">
                    <div className="logo">
                        <h1>🌍 Djelia Cloud</h1>
                        <p>African AI Conversation Platform</p>
                    </div>

                    {/* Language Selector */}
                    <div className="language-selector">
                        <button
                            className="lang-button"
                            onClick={() => setShowLanguages(!showLanguages)}
                        >
                            <FiGlobe size={20} />
                            <span>{currentLang.flag} {currentLang.native}</span>
                        </button>

                        {showLanguages && (
                            <div className="lang-dropdown">
                                {languages.map(lang => (
                                    <button
                                        key={lang.code}
                                        className={`lang-item ${currentLanguage === lang.code ? 'active' : ''}`}
                                        onClick={() => handleLanguageChange(lang.code)}
                                    >
                                        <span>{lang.flag} {lang.native}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <h2>🎤 Talk with AI in Your Language</h2>
                    <p className="hero-subtitle">
                        From Mali to the World: AI That Speaks Your Language
                    </p>
                    <p className="hero-description">
                        Djelia Cloud brings AI conversation to African languages, starting with Bambara and expanding to over 20 languages worldwide. Experience natural, real-time voice conversations with advanced AI.
                    </p>

                    <button className="cta-button" onClick={handleStartChat}>
                        <FiMic size={24} />
                        <span>Start Conversation</span>
                    </button>
                </div>

                <div className="hero-features">
                    <div className="feature-card">
                        <FiMic size={40} />
                        <h3>Voice Chat</h3>
                        <p>Real-time voice conversations</p>
                    </div>
                    <div className="feature-card">
                        <FiMessageCircle size={40} />
                        <h3>Text Chat</h3>
                        <p>Type and get instant responses</p>
                    </div>
                    <div className="feature-card">
                        <FiZap size={40} />
                        <h3>Fast & Smart</h3>
                        <p>Powered by advanced AI models</p>
                    </div>
                </div>
            </section>

            {/* Languages Section */}
            <section className="languages-section">
                <div className="section-header">
                    <FiGlobe size={40} />
                    <h2>Supported Languages</h2>
                </div>

                <div className="language-grid">
                    {/* African Languages */}
                    <div className="language-group">
                        <h3>🌍 African Languages</h3>
                        <div className="language-list">
                            {languages
                                .filter(lang => ['bm', 'sw', 'yo', 'ar'].includes(lang.code))
                                .map(lang => (
                                    <span key={lang.code} className="language-badge">
                                        {lang.flag} {lang.native}
                                    </span>
                                ))}
                        </div>
                    </div>

                    {/* World Languages */}
                    <div className="language-group">
                        <h3>🌐 World Languages</h3>
                        <div className="language-list">
                            {languages
                                .filter(lang => !['bm', 'sw', 'yo', 'ar'].includes(lang.code))
                                .map(lang => (
                                    <span key={lang.code} className="language-badge">
                                        {lang.flag} {lang.native}
                                    </span>
                                ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <h2>Why Djelia Cloud?</h2>

                <div className="features-grid">
                    <div className="feature">
                        <div className="feature-icon">🎯</div>
                        <h3>Accessible to All</h3>
                        <p>No technical knowledge required. Just speak in your language.</p>
                    </div>

                    <div className="feature">
                        <div className="feature-icon">🚀</div>
                        <h3>Instant Responses</h3>
                        <p>Get answers in real-time, whether through voice or text.</p>
                    </div>

                    <div className="feature">
                        <div className="feature-icon">🌍</div>
                        <h3>Global & Local</h3>
                        <p>Supporting African languages while connecting to the world.</p>
                    </div>

                    <div className="feature">
                        <div className="feature-icon">🔒</div>
                        <h3>Privacy First</h3>
                        <p>Your conversations are secure and private.</p>
                    </div>

                    <div className="feature">
                        <div className="feature-icon">💬</div>
                        <h3>Natural Conversation</h3>
                        <p>AI understands context and responds naturally.</p>
                    </div>

                    <div className="feature">
                        <div className="feature-icon">♿</div>
                        <h3>Inclusive Design</h3>
                        <p>Accessible for everyone, everywhere.</p>
                    </div>
                </div>
            </section>

            {/* About Mali Section */}
            <section className="about-mali">
                <h2>🇲🇱 Celebrating Mali & African Languages</h2>
                <div className="about-content">
                    <p>
                        Mali is home to some of Africa's most vibrant cultures and languages. Bambara (Bamanankan),
                        spoken by millions across Mali and West Africa, carries centuries of history and wisdom through the
                        griot tradition. Djelia Cloud honors this heritage by bringing cutting-edge AI technology to African languages.
                    </p>
                    <p>
                        We believe AI should be accessible in every language, preserving cultural heritage while embracing innovation.
                    </p>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <h2>Ready to Start?</h2>
                <p>Join thousands of users across Africa and the world</p>
                <button className="cta-button-large" onClick={handleStartChat}>
                    <FiMic size={28} />
                    <span>Start Your Conversation Now</span>
                </button>
            </section>

            {/* Footer */}
            <footer className="djelia-footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <h4>Djelia Cloud</h4>
                        <p>African AI Conversation Platform</p>
                    </div>
                    <div className="footer-section">
                        <h4>Supported Languages</h4>
                        <p>{languages.length}+ languages available</p>
                    </div>
                    <div className="footer-section">
                        <h4>Contact</h4>
                        <p>info@djelia.cloud</p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2024 Djelia Cloud. Celebrating African Languages & AI.</p>
                </div>
            </footer>
        </div>
    );
};

export default DjeliaCloud;