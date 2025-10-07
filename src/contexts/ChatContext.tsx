import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import '../components/chat/chat-style.css';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-data-d6uy.onrender.com';
const API_URL = `${BACKEND_URL}/api`;
const SOCKET_URL = BACKEND_URL;

export interface Message {
    id: string;
    content: string;
    sender: 'user' | 'ai';
    conversation_id?: string;
    created_at: Date;
    updated_at?: Date;
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
    deleteMessage: (message_id: string) => Promise<void>;
    deleteConversation: (conversation_id: string) => Promise<void>;
    deleteAllConversations: () => Promise<void>;
    editMessage: (message_id: string, new_content: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

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

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    useEffect(() => {
        if (isAuthenticated && token) {
            const newSocket = io(SOCKET_URL, {
                auth: { token }
            });

            setSocket(newSocket);

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
                setMessages(prevMessages => [...prevMessages, {
                    ...message,
                    created_at: new Date(message.created_at)
                }]);
                loadConversations();
            });

            newSocket.on('ai-message', (message: Message) => {
                setMessages(prevMessages => [...prevMessages, {
                    ...message,
                    created_at: new Date(message.created_at)
                }]);
                loadConversations();
            });

            loadConversations();

            return () => {
                newSocket.disconnect();
            };
        }
    }, [isAuthenticated, token]);

    const loadConversations = async () => {
        if (!isAuthenticated || !token) return;

        try {
            setIsLoading(true);
            const response = await axios.get(`${API_URL}/chat/conversations`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setConversations(response.data.data.conversations.map((conv: any) => ({
                conversation_id: conv.conversationId || conv.conversation_id,
                lastmessage: conv.lastMessage || conv.lastmessage,
                created_at: new Date(conv.createdAt || conv.created_at)
            })));
            setIsLoading(false);
        } catch (error: any) {
            console.error('Error loading conversations:', error);
            setError(error.response?.data?.error || 'Failed to load conversations');
            setIsLoading(false);
        }
    };

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
                created_at: new Date(msg.created_at),
                updated_at: msg.updated_at ? new Date(msg.updated_at) : undefined
            })));

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
                created_at: new Date(msg.created_at),
                updated_at: msg.updated_at ? new Date(msg.updated_at) : undefined
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

    const sendMessage = async (content: string) => {
        if (!isAuthenticated) return;

        try {
            setIsLoading(true);

            if (socket) {
                socket.emit('user-message', {
                    message: content,
                    conversation_id: currentconversation_id
                });

                setTimeout(() => {
                    loadConversations();
                }, 1000);
            } else {
                const response = await axios.post(`${API_URL}/chat`, {
                    message: content,
                    conversation_id: currentconversation_id
                });

                const { userMessage, aiMessage, conversation_id } = response.data.data;

                if (!currentconversation_id) {
                    setCurrentconversation_id(conversation_id);
                }

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

                await loadConversations();
            }

            setIsLoading(false);
        } catch (error: any) {
            console.error('Error sending message:', error);
            setError(error.response?.data?.error || 'Failed to send message');
            setIsLoading(false);
        }
    };

    const deleteMessage = async (message_id: string) => {
        if (!isAuthenticated) return;

        try {
            setIsLoading(true);
            await axios.delete(`${API_URL}/chat/message/${message_id}`);

            setMessages(prevMessages => prevMessages.filter(msg => msg.id !== message_id));
            await loadConversations();

            setIsLoading(false);
        } catch (error: any) {
            console.error('Error deleting message:', error);
            setError(error.response?.data?.error || 'Failed to delete message');
            setIsLoading(false);
        }
    };

    const deleteConversation = async (conversation_id: string) => {
        if (!isAuthenticated) return;

        try {
            setIsLoading(true);
            await axios.delete(`${API_URL}/chat/conversation/${conversation_id}`);

            if (currentconversation_id === conversation_id) {
                setCurrentconversation_id(null);
                setMessages([]);
            }

            await loadConversations();
            setIsLoading(false);
        } catch (error: any) {
            console.error('Error deleting conversation:', error);
            setError(error.response?.data?.error || 'Failed to delete conversation');
            setIsLoading(false);
        }
    };

    const deleteAllConversations = async () => {
        if (!isAuthenticated) return;

        try {
            setIsLoading(true);
            await axios.delete(`${API_URL}/chat/conversations`);

            setCurrentconversation_id(null);
            setMessages([]);
            setConversations([]);

            setIsLoading(false);
        } catch (error: any) {
            console.error('Error deleting all conversations:', error);
            setError(error.response?.data?.error || 'Failed to delete all conversations');
            setIsLoading(false);
        }
    };

    const editMessage = async (message_id: string, new_content: string) => {
        if (!isAuthenticated) return;

        try {
            setIsLoading(true);
            const response = await axios.put(`${API_URL}/chat/message/${message_id}`, {
                content: new_content
            });

            const updatedMessage = response.data.data;

            setMessages(prevMessages =>
                prevMessages.map(msg =>
                    msg.id === message_id
                        ? {
                            ...msg,
                            content: updatedMessage.content,
                            updated_at: new Date(updatedMessage.updated_at)
                        }
                        : msg
                )
            );

            await loadConversations();
            setIsLoading(false);
        } catch (error: any) {
            console.error('Error editing message:', error);
            setError(error.response?.data?.error || 'Failed to edit message');
            setIsLoading(false);
        }
    };

    const startNewConversation = () => {
        setCurrentconversation_id(null);
        setMessages([]);
        setMessagesOffset(0);
        setHasMoreMessages(true);

        if (socket && currentconversation_id) {
            socket.emit('leave-conversation', currentconversation_id);
        }
    };

    const clearMessages = () => {
        setMessages([]);
    };

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
                clearError,
                deleteMessage,
                deleteConversation,
                deleteAllConversations,
                editMessage
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);

    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }

    return context;
};