import React, { useState } from 'react';
import { Message } from '../../contexts/ChatContext';
import { formatTime } from '../../utils/dateUtils';
import { FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import './chat-style.css';

interface ChatMessageProps {
    message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    const { user } = useAuth();
    const { deleteMessage, editMessage } = useChat();
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);
    const [showActions, setShowActions] = useState(false);
    const isUser = message.sender === 'user';

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this message?')) {
            try {
                await deleteMessage(message.id);
            } catch (error) {
                console.error('Error deleting message:', error);
            }
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
        setEditContent(message.content);
    };

    const handleSaveEdit = async () => {
        if (editContent.trim() && editContent !== message.content) {
            try {
                await editMessage(message.id, editContent.trim());
                setIsEditing(false);
            } catch (error) {
                console.error('Error editing message:', error);
            }
        } else {
            setIsEditing(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditContent(message.content);
    };

    const formatMessageContent = (content: string) => {
        if (content.includes('```')) {
            const parts = [];
            let isCodeBlock = false;
            let currentPart = '';
            let codeLanguage = '';

            const lines = content.split('\n');

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                if (line.startsWith('```')) {
                    if (!isCodeBlock) {
                        if (currentPart) {
                            parts.push({ type: 'text', content: currentPart });
                            currentPart = '';
                        }
                        isCodeBlock = true;
                        codeLanguage = line.slice(3).trim();
                    } else {
                        parts.push({ type: 'code', content: currentPart, language: codeLanguage });
                        currentPart = '';
                        isCodeBlock = false;
                        codeLanguage = '';
                    }
                } else {
                    currentPart += line + (i < lines.length - 1 ? '\n' : '');
                }
            }

            if (currentPart) {
                parts.push({
                    type: isCodeBlock ? 'code' : 'text',
                    content: currentPart,
                    language: codeLanguage
                });
            }

            return (
                <>
                    {parts.map((part, index) => {
                        if (part.type === 'code') {
                            return (
                                <pre key={index} className="code-block">
                                    <code>{part.content}</code>
                                </pre>
                            );
                        } else {
                            const textLines = part.content.split('\n');
                            return (
                                <div key={index} className="text-block">
                                    {textLines.map((line, lineIndex) => (
                                        <React.Fragment key={lineIndex}>
                                            {line}
                                            {lineIndex < textLines.length - 1 && <br />}
                                        </React.Fragment>
                                    ))}
                                </div>
                            );
                        }
                    })}
                </>
            );
        } else {
            const lines = content.split('\n');
            return lines.map((line, index) => (
                <React.Fragment key={index}>
                    {line}
                    {index < lines.length - 1 && <br />}
                </React.Fragment>
            ));
        }
    };

    return (
        <div
            className={`chat-message ${isUser ? 'user-message' : 'ai-message'}`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className="message-avatar">
                {isUser ? (
                    user?.profile_picture ? (
                        <img src={user.profile_picture} alt={user.username} />
                    ) : (
                        <div className="avatar-placeholder">
                            {user?.username.charAt(0).toUpperCase()}
                        </div>
                    )
                ) : (
                    <div className="ai-avatar">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
                                fill="currentColor"
                            />
                        </svg>
                    </div>
                )}
            </div>
            <div className="message-content">
                {isEditing ? (
                    <div className="message-edit">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="edit-textarea"
                            rows={3}
                            autoFocus
                        />
                        <div className="edit-actions">
                            <button onClick={handleSaveEdit} className="save-button">
                                <FiCheck /> Save
                            </button>
                            <button onClick={handleCancelEdit} className="cancel-button">
                                <FiX /> Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="message-text">
                            {formatMessageContent(message.content)}
                        </div>
                        {isUser && showActions && !isEditing && (
                            <div className="message-actions">
                                <button onClick={handleEdit} className="action-button edit-button">
                                    <FiEdit2 />
                                </button>
                                <button onClick={handleDelete} className="action-button delete-button">
                                    <FiTrash2 />
                                </button>
                            </div>
                        )}
                    </>
                )}
                <div className="message-info">
                    <span className="message-time">
                        {formatTime(message.created_at)}
                        {message.updated_at && ' (edited)'}
                    </span>
                    <span className="message-sender">{isUser ? user?.username : 'AI Assistant'}</span>
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;