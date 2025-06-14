import React, { useState, useRef, useEffect } from 'react';
import { FiSend } from 'react-icons/fi';
import { useChat } from '../../contexts/ChatContext';

const ChatInput: React.FC = () => {
    const [message, setMessage] = useState('');
    const { sendMessage, isLoading } = useChat();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [message]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!message.trim() || isLoading) return;

        try {
            await sendMessage(message);
            setMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="chat-input-container">
            <form className="chat-input-form" onSubmit={handleSubmit}>
                <textarea
                    ref={textareaRef}
                    className="chat-input"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    disabled={isLoading}
                    rows={1}
                />
                <button
                    type="submit"
                    className="send-button"
                    disabled={!message.trim() || isLoading}
                >
                    <FiSend />
                </button>
            </form>
            <div className="chat-input-info">
                <span>Press Enter to send, Shift+Enter for new line</span>
            </div>
        </div>
    );
};

export default ChatInput;
