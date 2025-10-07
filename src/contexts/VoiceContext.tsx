import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useChat } from './ChatContext';

interface VoiceContextType {
    isRecording: boolean;
    isSpeaking: boolean;
    isCallActive: boolean;
    isMuted: boolean;
    transcript: string;
    error: string | null;
    startCall: () => Promise<void>;
    endCall: () => void;
    toggleMute: () => void;
    speakText: (text: string) => void;
    stopSpeaking: () => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isCallActive, setIsCallActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    const { sendMessage, messages } = useChat();
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const lastMessageIdRef = useRef<string | null>(null);

    // Initialize Speech Recognition and Synthesis
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                setTranscript(finalTranscript || interimTranscript);

                if (finalTranscript.trim()) {
                    handleSendVoiceMessage(finalTranscript.trim());
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);

                if (event.error === 'no-speech') {
                    setError('No speech detected. Please try again.');
                } else if (event.error === 'not-allowed') {
                    setError('Microphone access denied. Please allow microphone access.');
                } else {
                    setError(`Recognition error: ${event.error}`);
                }

                setIsRecording(false);
            };

            recognitionRef.current.onend = () => {
                if (isCallActive && !isMuted) {
                    try {
                        recognitionRef.current?.start();
                    } catch (error) {
                        console.error('Error restarting recognition:', error);
                    }
                }
            };
        } else {
            setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
        }

        synthRef.current = window.speechSynthesis;

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (error) {
                    console.error('Error stopping recognition:', error);
                }
            }
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, [isCallActive, isMuted]);

    // Auto-speak AI responses
    useEffect(() => {
        if (!isCallActive || messages.length === 0) return;

        const lastMessage = messages[messages.length - 1];

        // Check if it's a new AI message and we haven't spoken it yet
        if (
            lastMessage.sender === 'ai' &&
            lastMessage.id !== lastMessageIdRef.current
        ) {
            lastMessageIdRef.current = lastMessage.id;
            speakText(lastMessage.content);
        }
    }, [messages, isCallActive]);

    const handleSendVoiceMessage = async (text: string) => {
        if (!text.trim()) return;

        try {
            setTranscript('');
            setError(null);
            await sendMessage(text);
        } catch (error) {
            console.error('Error sending voice message:', error);
            setError('Failed to send message. Please try again.');
        }
    };

    const startCall = async () => {
        try {
            setError(null);

            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            setIsCallActive(true);

            // Start speech recognition
            if (recognitionRef.current && !isMuted) {
                recognitionRef.current.start();
                setIsRecording(true);
            }

            // Stop the stream (we just needed to check permissions)
            stream.getTracks().forEach(track => track.stop());

        } catch (err: any) {
            console.error('Error starting call:', err);

            if (err.name === 'NotAllowedError') {
                setError('Microphone access denied. Please allow microphone access in your browser settings.');
            } else if (err.name === 'NotFoundError') {
                setError('No microphone found. Please connect a microphone and try again.');
            } else {
                setError('Failed to start call. Please check your microphone and try again.');
            }

            setIsCallActive(false);
        }
    };

    const endCall = () => {
        setIsCallActive(false);
        setIsRecording(false);
        setIsSpeaking(false);
        setTranscript('');
        setError(null);
        lastMessageIdRef.current = null;

        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (error) {
                console.error('Error stopping recognition:', error);
            }
        }

        if (synthRef.current) {
            synthRef.current.cancel();
        }
    };

    const toggleMute = () => {
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);

        if (newMutedState) {
            // Muting
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (error) {
                    console.error('Error stopping recognition:', error);
                }
            }
            setIsRecording(false);
        } else {
            // Unmuting
            if (recognitionRef.current && isCallActive) {
                try {
                    recognitionRef.current.start();
                    setIsRecording(true);
                } catch (error) {
                    console.error('Error starting recognition:', error);
                    setError('Failed to start recording. Please try again.');
                }
            }
        }
    };

    const speakText = useCallback((text: string) => {
        if (!synthRef.current) return;

        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => {
            setIsSpeaking(true);
        };

        utterance.onend = () => {
            setIsSpeaking(false);
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            setIsSpeaking(false);
            setError('Failed to speak text. Please try again.');
        };

        synthRef.current.speak(utterance);
    }, []);

    const stopSpeaking = () => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
        }
    };

    return (
        <VoiceContext.Provider
            value={{
                isRecording,
                isSpeaking,
                isCallActive,
                isMuted,
                transcript,
                error,
                startCall,
                endCall,
                toggleMute,
                speakText,
                stopSpeaking
            }}
        >
            {children}
        </VoiceContext.Provider>
    );
};

export const useVoice = () => {
    const context = useContext(VoiceContext);

    if (context === undefined) {
        throw new Error('useVoice must be used within a VoiceProvider');
    }

    return context;
};