import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ChatProvider } from '../contexts/ChatContext';
// import { VoiceProvider } from '../contexts/VoiceContext';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import VoiceChat from '../components/chat/VoiceChat';
import useIsMobile from '../hooks/useIsMobile';
import { FiMenu, FiMessageSquare, FiPhone } from 'react-icons/fi';
import './mode-switcher-style.css';
import '../components/chat/voice-chat-enhanced.css';

const Chat: React.FC = () => {
    const { isAuthenticated, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeMode, setActiveMode] = useState<'text' | 'voice'>('text');
    const isMobile = useIsMobile(768);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isMobile && sidebarOpen) {
                const sidebar = document.querySelector('.chat-sidebar');
                const menuButton = document.querySelector('.menu-button');

                if (sidebar &&
                    !sidebar.contains(event.target as Node) &&
                    menuButton &&
                    !menuButton.contains(event.target as Node)) {
                    setSidebarOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMobile, sidebarOpen]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return (
        <ChatProvider>
            <div className="chat-page">
                {isMobile && (
                    <div className="mobile-header">
                        <FiMenu
                            size={24}
                            className='menu-button'
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        />
                        <div className="mode-switcher">
                            <button
                                className={`mode-button ${activeMode === 'text' ? 'active' : ''}`}
                                onClick={() => setActiveMode('text')}
                            >
                                <FiMessageSquare size={20} />
                                <span>Text</span>
                            </button>
                            <button
                                className={`mode-button ${activeMode === 'voice' ? 'active' : ''}`}
                                onClick={() => setActiveMode('voice')}
                            >
                                <FiPhone size={20} />
                                <span>Voice</span>
                            </button>
                        </div>
                    </div>
                )}

                <ChatSidebar
                    isOpen={!isMobile || sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                <div className="chat-main">
                    {!isMobile && (
                        <div className="mode-switcher-desktop">
                            <button
                                className={`mode-button ${activeMode === 'text' ? 'active' : ''}`}
                                onClick={() => setActiveMode('text')}
                            >
                                <FiMessageSquare size={20} />
                                <span>Text Chat</span>
                            </button>
                            <button
                                className={`mode-button ${activeMode === 'voice' ? 'active' : ''}`}
                                onClick={() => setActiveMode('voice')}
                            >
                                <FiPhone size={20} />
                                <span>Voice Call</span>
                            </button>
                        </div>
                    )}

                    {activeMode === 'text' ? (
                        <ChatWindow />
                    ) : (
                        <VoiceChat />
                    )}
                </div>
            </div>
        </ChatProvider>
    );
};

export default Chat;