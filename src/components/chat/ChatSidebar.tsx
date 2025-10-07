import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiLogOut, FiSettings, FiUser, FiTrash2, FiMoreVertical } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useChat, Conversation } from '../../contexts/ChatContext';
import { formatDate } from '../../utils/dateUtils';
import './chat-style.css';

interface ChatSidebarProps {
    isOpen: boolean;
    onClose?: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const {
        conversations,
        currentconversation_id,
        startNewConversation,
        loadConversation,
        deleteConversation,
        deleteAllConversations
    } = useChat();
    const navigate = useNavigate();
    const [showDeleteAll, setShowDeleteAll] = useState(false);

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

    const handleDeleteConversation = async (e: React.MouseEvent, conversation_id: string) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this conversation?')) {
            try {
                await deleteConversation(conversation_id);
            } catch (error) {
                console.error('Error deleting conversation:', error);
            }
        }
    };

    const handleDeleteAll = async () => {
        if (window.confirm('Are you sure you want to delete ALL conversations? This action cannot be undone.')) {
            try {
                await deleteAllConversations();
                setShowDeleteAll(false);
            } catch (error) {
                console.error('Error deleting all conversations:', error);
            }
        }
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
                <div className="conversations-header">
                    <h3>Conversations</h3>
                    {conversations.length > 0 && (
                        <button
                            className="delete-all-button"
                            onClick={() => setShowDeleteAll(!showDeleteAll)}
                            title="Delete all conversations"
                        >
                            <FiMoreVertical />
                        </button>
                    )}
                </div>

                {showDeleteAll && (
                    <div className="delete-all-confirm">
                        <button className="confirm-delete-all" onClick={handleDeleteAll}>
                            <FiTrash2 /> Delete All Conversations
                        </button>
                        <button className="cancel-delete-all" onClick={() => setShowDeleteAll(false)}>
                            Cancel
                        </button>
                    </div>
                )}

                {conversations.length === 0 ? (
                    <div className="no-conversations">No conversations yet</div>
                ) : (
                    conversations.map((conversation: Conversation) => (
                        <div
                            key={conversation.conversation_id}
                            className={`conversation-item ${currentconversation_id === conversation.conversation_id ? 'active' : ''}`}
                            onClick={() => handleConversationClick(conversation.conversation_id)}
                        >
                            <div className="conversation-content">
                                <div className="conversation-message">{conversation.lastmessage}</div>
                                <div className="conversation-date">
                                    {formatDate(conversation.created_at)}
                                </div>
                            </div>
                            <button
                                className="delete-conversation-button"
                                onClick={(e) => handleDeleteConversation(e, conversation.conversation_id)}
                                title="Delete conversation"
                            >
                                <FiTrash2 />
                            </button>
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
