import React from 'react';
import { Message } from '../../contexts/ChatContext';
import { formatTime } from '../../utils/dateUtils';
import { FiUser } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

interface ChatMessageProps {
    message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    const { user } = useAuth();
    const isUser = message.sender === 'user';

    // Function to format message content with proper line breaks and code blocks
    const formatMessageContent = (content: string) => {
        // Check if content contains code blocks
        if (content.includes('```')) {
            const parts = [];
            let isCodeBlock = false;
            let currentPart = '';
            let codeLanguage = '';

            // Split content by lines
            const lines = content.split('\n');

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                // Check for code block markers
                if (line.startsWith('```')) {
                    if (!isCodeBlock) {
                        // Start of code block
                        if (currentPart) {
                            // Add text before code block
                            parts.push({ type: 'text', content: currentPart });
                            currentPart = '';
                        }
                        isCodeBlock = true;
                        codeLanguage = line.slice(3).trim(); // Get language if specified
                    } else {
                        // End of code block
                        parts.push({ type: 'code', content: currentPart, language: codeLanguage });
                        currentPart = '';
                        isCodeBlock = false;
                        codeLanguage = '';
                    }
                } else {
                    // Add line to current part
                    currentPart += line + (i < lines.length - 1 ? '\n' : '');
                }
            }

            // Add any remaining content
            if (currentPart) {
                parts.push({
                    type: isCodeBlock ? 'code' : 'text',
                    content: currentPart,
                    language: codeLanguage
                });
            }

            // Render parts
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
                            // For text parts, handle line breaks
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
            // Simple case: no code blocks, just handle line breaks
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
        <div className={`chat-message ${isUser ? 'user-message' : 'ai-message'}`}>
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
                <div className="message-text">
                    {formatMessageContent(message.content)}
                </div>
                <div className="message-info">
                    <span className="message-time">{formatTime(message.created_at)}</span>
                    <span className="message-sender">{isUser ? user?.username : 'AI Assistant'}</span>
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;
