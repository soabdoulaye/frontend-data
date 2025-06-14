import React, { useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

const ChatWindow: React.FC = () => {
    const { messages, isLoading, error, clearError } = useChat();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Clear error after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                clearError();
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [error, clearError]);

    return (
        <div className="chat-window">
            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="empty-chat">
                        <div className="empty-chat-icon">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
                                    fill="currentColor"
                                />
                            </svg>
                        </div>
                        <h3>Start a new conversation</h3>
                        <p>Type a message below to start chatting with the AI assistant.</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <ChatMessage key={message.id} message={message} />
                    ))
                )}

                {isLoading && (
                    <div className="chat-loading">
                        <div className="loading-indicator">
                            <div className="dot"></div>
                            <div className="dot"></div>
                            <div className="dot"></div>
                        </div>
                        <span>AI is thinking...</span>
                    </div>
                )}

                {error && (
                    <div className="chat-error">
                        <span>{error}</span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <ChatInput />
        </div>
    );
};

export default ChatWindow;
