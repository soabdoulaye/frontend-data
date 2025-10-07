import React, { useState, useRef, useEffect } from 'react';
import { FiMic, FiMicOff, FiVolume2, FiVolumeX, FiPhone, FiPhoneOff } from 'react-icons/fi';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import './voice-chat-enhanced.css';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-data-d6uy.onrender.com';

const VoiceChat: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isCallActive, setIsCallActive] = useState(false);
    const [userTranscript, setUserTranscript] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [conversationLog, setConversationLog] = useState<Array<{ role: 'user' | 'ai', text: string }>>([]);

    const { token } = useAuth();
    const { currentconversation_id } = useChat();
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const voiceSocketRef = useRef<Socket | null>(null);
    const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Initialize Speech Synthesis
    useEffect(() => {
        synthRef.current = window.speechSynthesis;

        return () => {
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, []);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.maxAlternatives = 1;

        recognitionRef.current.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            setUserTranscript(interimTranscript || finalTranscript);

            // Send final transcript to server
            if (finalTranscript && voiceSocketRef.current) {
                // Interrupt AI if it's speaking
                if (isSpeaking) {
                    stopSpeaking();
                    voiceSocketRef.current.emit('voice-interrupt');
                }

                console.log('Sending transcript:', finalTranscript);
                voiceSocketRef.current.emit('voice-transcript', {
                    transcript: finalTranscript,
                    conversation_id: currentconversation_id,
                    isFinal: true
                });

                // Add to conversation log
                setConversationLog(prev => [...prev, { role: 'user', text: finalTranscript }]);
                setUserTranscript('');
            }
        };

        recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);

            if (event.error === 'no-speech') {
                // No speech detected, just continue
                return;
            } else if (event.error === 'not-allowed') {
                setError('Microphone access denied. Please allow microphone access.');
                setIsRecording(false);
            } else if (event.error === 'network') {
                setError('Network error. Please check your connection.');
            } else {
                setError(`Recognition error: ${event.error}`);
            }
        };

        recognitionRef.current.onend = () => {
            // Auto-restart if call is active and not muted
            if (isCallActive && !isMuted) {
                try {
                    recognitionRef.current?.start();
                } catch (err) {
                    console.error('Error restarting recognition:', err);
                }
            } else {
                setIsRecording(false);
            }
        };

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (err) {
                    console.error('Error stopping recognition:', err);
                }
            }
        };
    }, [isCallActive, isMuted, isSpeaking, currentconversation_id]);

    const startCall = async () => {
        try {
            setError(null);
            setIsConnecting(true);
            setConversationLog([]);
            setUserTranscript('');
            setAiResponse('');

            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());

            // Connect to voice socket
            const voiceSocket = io(`${BACKEND_URL}/voice`, {
                auth: { token }
            });

            voiceSocketRef.current = voiceSocket;

            voiceSocket.on('connect', () => {
                console.log('Voice socket connected');
                setIsConnecting(false);
                setIsCallActive(true);

                // Start the call
                voiceSocket.emit('voice-call-start', {
                    conversation_id: currentconversation_id
                });
            });

            voiceSocket.on('voice-call-ready', () => {
                console.log('Voice call ready');

                // Start speech recognition
                if (recognitionRef.current && !isMuted) {
                    recognitionRef.current.start();
                    setIsRecording(true);
                }
            });

            voiceSocket.on('voice-user-transcript', (data: { transcript: string }) => {
                console.log('User transcript acknowledged:', data.transcript);
            });

            voiceSocket.on('voice-ai-response', (data: { response: string }) => {
                console.log('AI response received:', data.response);
                setAiResponse(data.response);

                // Add to conversation log
                setConversationLog(prev => [...prev, { role: 'ai', text: data.response }]);

                // Speak the AI response
                speakText(data.response);
            });

            voiceSocket.on('voice-error', (data: { message: string }) => {
                console.error('Voice error:', data.message);
                setError(data.message);
            });

            voiceSocket.on('voice-interrupt-acknowledged', () => {
                console.log('Interruption acknowledged');
            });

            voiceSocket.on('disconnect', () => {
                console.log('Voice socket disconnected');
                setIsCallActive(false);
                setIsRecording(false);
            });

            voiceSocket.on('connect_error', (err) => {
                console.error('Voice socket connection error:', err);
                setError('Failed to connect to voice service. Please try again.');
                setIsConnecting(false);
            });

        } catch (err: any) {
            console.error('Error starting call:', err);

            if (err.name === 'NotAllowedError') {
                setError('Microphone access denied. Please allow microphone access in your browser settings.');
            } else if (err.name === 'NotFoundError') {
                setError('No microphone found. Please connect a microphone and try again.');
            } else {
                setError('Failed to start call. Please check your microphone and try again.');
            }

            setIsConnecting(false);
            setIsCallActive(false);
        }
    };

    const endCall = () => {
        // Send end call event
        if (voiceSocketRef.current) {
            voiceSocketRef.current.emit('voice-call-end');
            voiceSocketRef.current.disconnect();
            voiceSocketRef.current = null;
        }

        // Stop recognition
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (err) {
                console.error('Error stopping recognition:', err);
            }
        }

        // Stop speaking
        stopSpeaking();

        // Reset states
        setIsCallActive(false);
        setIsRecording(false);
        setIsSpeaking(false);
        setUserTranscript('');
        setAiResponse('');
        setError(null);
    };

    const toggleMute = () => {
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);

        if (newMutedState) {
            // Muting
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (err) {
                    console.error('Error stopping recognition:', err);
                }
            }
            setIsRecording(false);
        } else {
            // Unmuting
            if (recognitionRef.current && isCallActive) {
                try {
                    recognitionRef.current.start();
                    setIsRecording(true);
                } catch (err) {
                    console.error('Error starting recognition:', err);
                    setError('Failed to start recording. Please try again.');
                }
            }
        }
    };

    const speakText = (text: string) => {
        if (!synthRef.current) return;

        // Cancel any ongoing speech
        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1.1;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => {
            setIsSpeaking(true);
            currentUtteranceRef.current = utterance;
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            currentUtteranceRef.current = null;
            setAiResponse('');
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            setIsSpeaking(false);
            currentUtteranceRef.current = null;
        };

        synthRef.current.speak(utterance);
    };

    const stopSpeaking = () => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
            currentUtteranceRef.current = null;
            setAiResponse('');
        }
    };

    return (
        <div className="voice-chat-container">
            {!isCallActive && !isConnecting ? (
                <div className="voice-chat-start">
                    <div className="voice-intro">
                        <h2>Real-Time AI Voice Call</h2>
                        <p>Have a natural conversation with AI. Speak and get instant voice responses!</p>
                    </div>

                    <button className="start-call-button" onClick={startCall}>
                        <FiPhone size={28} />
                        <span>Start Voice Call</span>
                    </button>

                    <div className="voice-features">
                        <div className="feature-item">
                            <FiMic size={24} />
                            <div>
                                <h4>Continuous Listening</h4>
                                <p>AI listens continuously for natural conversation</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <FiVolume2 size={24} />
                            <div>
                                <h4>Instant Voice Response</h4>
                                <p>Get immediate AI responses with natural speech</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : isConnecting ? (
                <div className="voice-connecting">
                    <div className="connecting-spinner"></div>
                    <h3>Connecting to AI...</h3>
                    <p>Please wait while we establish the connection</p>
                </div>
            ) : (
                <div className="voice-call-active">
                    <div className="call-header">
                        <h3>🎙️ Live Conversation</h3>
                        <div className={`call-status-badge ${isRecording ? 'recording' : isMuted ? 'muted' : 'ready'}`}>
                            {isRecording ? (
                                <>
                                    <span className="status-dot recording"></span>
                                    Listening
                                </>
                            ) : isMuted ? (
                                <>
                                    <span className="status-dot muted"></span>
                                    Muted
                                </>
                            ) : (
                                <>
                                    <span className="status-dot ready"></span>
                                    Ready
                                </>
                            )}
                        </div>
                    </div>

                    <div className="call-visualization">
                        <div className="conversation-display">
                            {conversationLog.length === 0 ? (
                                <div className="call-idle">
                                    {isRecording ? (
                                        <>
                                            <div className="voice-wave">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                            <p>Start speaking...</p>
                                        </>
                                    ) : (
                                        <p>Say something to begin the conversation</p>
                                    )}
                                </div>
                            ) : (
                                <div className="conversation-log">
                                    {conversationLog.slice(-3).map((entry, index) => (
                                        <div key={index} className={`conversation-entry ${entry.role}`}>
                                            <div className="entry-label">
                                                {entry.role === 'user' ? '👤 You' : '🤖 AI'}
                                            </div>
                                            <div className="entry-text">{entry.text}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {userTranscript && (
                            <div className="transcript-live">
                                <div className="transcript-label">Listening...</div>
                                <p>{userTranscript}</p>
                            </div>
                        )}

                        {isSpeaking && aiResponse && (
                            <div className="ai-speaking-indicator">
                                <FiVolume2 size={24} className="speaking-icon" />
                                <div>
                                    <div className="speaking-label">AI is speaking</div>
                                    <p className="speaking-text">{aiResponse}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="call-controls">
                        <button
                            className={`control-button mute ${isMuted ? 'active' : ''}`}
                            onClick={toggleMute}
                            title={isMuted ? 'Unmute' : 'Mute'}
                        >
                            {isMuted ? <FiMicOff size={28} /> : <FiMic size={28} />}
                            <span className="control-label">
                                {isMuted ? 'Unmute' : 'Mute'}
                            </span>
                        </button>

                        <button
                            className="control-button end-call"
                            onClick={endCall}
                            title="End call"
                        >
                            <FiPhoneOff size={28} />
                            <span className="control-label">End Call</span>
                        </button>

                        <button
                            className={`control-button speaker ${isSpeaking ? 'active' : ''}`}
                            onClick={stopSpeaking}
                            title="Stop AI"
                            disabled={!isSpeaking}
                        >
                            {isSpeaking ? <FiVolumeX size={28} /> : <FiVolume2 size={28} />}
                            <span className="control-label">
                                {isSpeaking ? 'Stop' : 'Speaker'}
                            </span>
                        </button>
                    </div>

                    {error && (
                        <div className="voice-error">
                            <strong>Error:</strong> {error}
                        </div>
                    )}
                </div>
            )}

            <div className="voice-info">
                <h4>💡 Tips for Best Experience</h4>
                <ul>
                    <li><strong>Speak Naturally:</strong> Talk as you would in a normal conversation</li>
                    <li><strong>Wait for Response:</strong> Let AI finish speaking before replying</li>
                    <li><strong>Interrupt Anytime:</strong> Just start speaking to interrupt AI</li>
                    <li><strong>Browser:</strong> Works best on Chrome, Edge, or Safari</li>
                </ul>
            </div>
        </div>
    );
};

export default VoiceChat;