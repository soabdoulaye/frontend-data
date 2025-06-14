import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ChatProvider } from '../contexts/ChatContext';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import useIsMobile from '../hooks/useIsMobile';
import { FiMenu } from 'react-icons/fi';

const Chat: React.FC = () => {
    const { isAuthenticated, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isMobile = useIsMobile(768);

    // Close sidebar when clicking outside on mobile
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
                    <FiMenu size={24} className='menu-button' onClick={() => setSidebarOpen(!sidebarOpen)} />
                )}
                <ChatSidebar
                    isOpen={!isMobile || sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />
                <ChatWindow />
            </div>
        </ChatProvider>
    );
};

export default Chat;
