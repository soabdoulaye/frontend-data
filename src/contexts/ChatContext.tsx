import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

// API URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-data-d6uy.onrender.com';
const API_URL = `${BACKEND_URL}/api`;
const SOCKET_URL = BACKEND_URL;
console.log('BACKEND_URL:', BACKEND_URL);
console.log(`FRONTEND_PORT`, `${process.env.PORT}`);

// Types
export interface Message {
    id: string;
    content: string;
    sender: 'user' | 'ai';
    conversation_id?: string;
    created_at: Date;
}

export interface Conversation {
    conversation_id: string;
    lastmessage: string;
    created_at: Date;
}

interface ChatContextType {
    messages: Message[];
    conversations: Conversation[];
    currentconversation_id: string | null;
    isLoading: boolean;
    error: string | null;
    sendMessage: (content: string) => Promise<void>;
    startNewConversation: () => void;
    loadConversation: (conversation_id: string) => Promise<void>;
    loadMoreMessages: () => Promise<void>;
    clearMessages: () => void;
    clearError: () => void;
}

// Create context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider component
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, token } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentconversation_id, setCurrentconversation_id] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [messagesOffset, setMessagesOffset] = useState<number>(0);
    const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);

    // Connect to socket when authenticated
    useEffect(() => {
        if (isAuthenticated && token) {
            // Connect to socket
            const newSocket = io(SOCKET_URL, {
                auth: {
                    token
                }
            });

            setSocket(newSocket);

            // Socket event listeners
            newSocket.on('connect', () => {
                console.log('Connected to socket');
            });

            newSocket.on('disconnect', () => {
                console.log('Disconnected from socket');
            });

            newSocket.on('error', (error) => {
                console.error('Socket error:', error);
                setError(error.message || 'Socket error');
            });

            newSocket.on('message-received', (message: Message) => {
                // Add user message to chat
                setMessages(prevMessages => [...prevMessages, {
                    ...message,
                    created_at: new Date(message.created_at)
                }]);

                // Reload conversations after sending a message
                loadConversations();
            });

            newSocket.on('ai-message', (message: Message) => {
                // Add AI message to chat
                setMessages(prevMessages => [...prevMessages, {
                    ...message,
                    created_at: new Date(message.created_at)
                }]);

                // Reload conversations after receiving AI message
                loadConversations();
            });

            // Load conversations
            loadConversations();

            // Cleanup on unmount
            return () => {
                newSocket.disconnect();
            };
        }
    }, [isAuthenticated, token]);

    // Load conversations
    const loadConversations = async () => {
        if (!isAuthenticated) return;

        try {
            setIsLoading(true);
            const response = await axios.get(`${API_URL}/chat/conversations`);
            setConversations(response.data.data.conversations.map((conv: any) => ({
                ...conv,
                created_at: new Date(conv.created_at)
            })));
            setIsLoading(false);
        } catch (error: any) {
            console.error('Error loading conversations:', error);
            setError(error.response?.data?.error || 'Failed to load conversations');
            setIsLoading(false);
        }
    };

    // Load conversation messages
    const loadConversation = async (conversation_id: string) => {
        if (!isAuthenticated) return;

        try {
            setIsLoading(true);
            setCurrentconversation_id(conversation_id);
            setMessagesOffset(0);
            setHasMoreMessages(true);

            const response = await axios.get(`${API_URL}/chat/messages`, {
                params: {
                    conversation_id,
                    limit: 50,
                    offset: 0
                }
            });

            setMessages(response.data.data.messages.map((msg: any) => ({
                ...msg,
                created_at: new Date(msg.created_at)
            })));

            // Join conversation room
            if (socket) {
                socket.emit('join-conversation', conversation_id);
            }

            setIsLoading(false);
        } catch (error: any) {
            console.error('Error loading conversation:', error);
            setError(error.response?.data?.error || 'Failed to load conversation');
            setIsLoading(false);
        }
    };

    // Load more messages
    const loadMoreMessages = async () => {
        if (!isAuthenticated || !currentconversation_id || !hasMoreMessages) return;

        try {
            setIsLoading(true);
            const newOffset = messagesOffset + 50;

            const response = await axios.get(`${API_URL}/chat/messages`, {
                params: {
                    conversation_id: currentconversation_id,
                    limit: 50,
                    offset: newOffset
                }
            });

            const newMessages = response.data.data.messages.map((msg: any) => ({
                ...msg,
                created_at: new Date(msg.created_at)
            }));

            if (newMessages.length === 0) {
                setHasMoreMessages(false);
            } else {
                setMessages(prevMessages => [...newMessages, ...prevMessages]);
                setMessagesOffset(newOffset);
            }

            setIsLoading(false);
        } catch (error: any) {
            console.error('Error loading more messages:', error);
            setError(error.response?.data?.error || 'Failed to load more messages');
            setIsLoading(false);
        }
    };

    // Send message
    const sendMessage = async (content: string) => {
        if (!isAuthenticated) return;

        try {
            setIsLoading(true);

            // Use socket for real-time communication
            if (socket) {
                socket.emit('user-message', {
                    message: content,
                    conversation_id: currentconversation_id
                });

                // Force reload conversations after a short delay to ensure they're updated
                setTimeout(() => {
                    loadConversations();
                }, 1000);
            } else {
                // Fallback to REST API
                const response = await axios.post(`${API_URL}/chat`, {
                    message: content,
                    conversation_id: currentconversation_id
                });

                const { userMessage, aiMessage, conversation_id } = response.data.data;

                // Update current conversation ID if it's a new conversation
                if (!currentconversation_id) {
                    setCurrentconversation_id(conversation_id);
                }

                // Add messages to chat
                setMessages(prevMessages => [
                    ...prevMessages,
                    {
                        ...userMessage,
                        created_at: new Date(userMessage.created_at)
                    },
                    {
                        ...aiMessage,
                        created_at: new Date(aiMessage.created_at)
                    }
                ]);

                // Update conversations list
                await loadConversations();
            }

            setIsLoading(false);
        } catch (error: any) {
            console.error('Error sending message:', error);
            setError(error.response?.data?.error || 'Failed to send message');
            setIsLoading(false);
        }
    };

    // Start new conversation
    const startNewConversation = () => {
        setCurrentconversation_id(null);
        setMessages([]);
        setMessagesOffset(0);
        setHasMoreMessages(true);

        // Leave current conversation room
        if (socket && currentconversation_id) {
            socket.emit('leave-conversation', currentconversation_id);
        }
    };

    // Clear messages
    const clearMessages = () => {
        setMessages([]);
    };

    // Clear error
    const clearError = () => {
        setError(null);
    };

    return (
        <ChatContext.Provider
            value={{
                messages,
                conversations,
                currentconversation_id,
                isLoading,
                error,
                sendMessage,
                startNewConversation,
                loadConversation,
                loadMoreMessages,
                clearMessages,
                clearError
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

// Custom hook to use chat context
export const useChat = () => {
    const context = useContext(ChatContext);

    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }

    return context;
};
