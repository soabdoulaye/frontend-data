import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiLogOut, FiSettings, FiUser } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useChat, Conversation } from '../../contexts/ChatContext';
import { formatDate } from '../../utils/dateUtils';
import { FiX, FiChevronLeft } from 'react-icons/fi';

interface ChatSidebarProps {
    isOpen: boolean;
    onClose?: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const { conversations, currentconversation_id, startNewConversation, loadConversation } = useChat();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleNewChat = () => {
        startNewConversation();
    };

    const handleConversationClick = (conversation_id: string) => {
        loadConversation(conversation_id);
    };

    const handleSettingsClick = () => {
        navigate('/settings');
    };

    const handleProfileClick = () => {
        navigate('/profile');
    };

    return (
        <div className={`chat-sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <div className="user-info">
                    <div className="user-avatar">
                        {user?.profile_picture ? (
                            <img src={user.profile_picture} alt={user.username} />
                        ) : (
                            <div className="avatar-placeholder">
                                {user?.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="user-name">{user?.username}</div>
                </div>
            </div>

            <div className="sidebar-actions">
                <button className="new-chat-button" onClick={handleNewChat}>
                    <FiPlus /> New Chat
                </button>
            </div>

            <div className="conversations-list">
                <h3>Conversations</h3>
                {conversations.length === 0 ? (
                    <div className="no-conversations">No conversations yet</div>
                ) : (
                    conversations.map((conversation: Conversation) => (
                        <div
                            key={conversation.conversation_id}
                            className={`conversation-item ${currentconversation_id === conversation.conversation_id ? 'active' : ''
                                }`}
                            onClick={() => handleConversationClick(conversation.conversation_id)}
                        >
                            <div className="conversation-content">
                                <div className="conversation-message">{conversation.lastmessage}</div>
                                <div className="conversation-date">
                                    {formatDate(conversation.created_at)}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="sidebar-footer">
                <button className="sidebar-button" onClick={handleProfileClick}>
                    <FiUser /> Profile
                </button>
                <button className="sidebar-button" onClick={handleSettingsClick}>
                    <FiSettings /> Settings
                </button>
                <button className="sidebar-button logout-button" onClick={handleLogout}>
                    <FiLogOut /> Logout
                </button>
            </div>
        </div>
    );
};

export default ChatSidebar;
