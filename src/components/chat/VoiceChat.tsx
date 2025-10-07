import React, { useState, useRef, useEffect } from 'react';
import { FiMic, FiMicOff, FiVolume2, FiVolumeX, FiPhone, FiPhoneOff, FiGlobe } from 'react-icons/fi';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { useLanguage } from '../../contexts/LanguageContext';
import './voice-chat-enhanced.css';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-data-d6uy.onrender.com';

interface ConversationEntry {
    role: 'user' | 'ai';
    text: string;
}

const VoiceChat: React.FC = () => {
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
    const [isCallActive, setIsCallActive] = useState<boolean>(false);
    const [userTranscript, setUserTranscript] = useState<string>('');
    const [aiResponse, setAiResponse] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [conversationLog, setConversationLog] = useState<ConversationEntry[]>([]);
    const [showLanguageSelector, setShowLanguageSelector] = useState<boolean>(false);

    const { token } = useAuth();
    const { currentconversation_id } = useChat();
    const { currentLanguage, t, getSpeechLang, supportedLanguages, setLanguage } = useLanguage();

    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const voiceSocketRef = useRef<Socket | null>(null);
    const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Initialize Speech Synthesis
    useEffect(() => {
        if (typeof window !== 'undefined') {
            synthRef.current = window.speechSynthesis;
        }

        return () => {
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, []);

    // Initialize Speech Recognition with current language
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        try {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = getSpeechLang(); // Use current language
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

                if (finalTranscript && voiceSocketRef.current) {
                    if (isSpeaking) {
                        stopSpeaking();
                        voiceSocketRef.current.emit('voice-interrupt');
                    }

                    console.log('Sending transcript:', finalTranscript);
                    voiceSocketRef.current.emit('voice-transcript', {
                        transcript: finalTranscript,
                        conversation_id: currentconversation_id,
                        isFinal: true,
                        language: currentLanguage.code  // ← 言語情報を追加
                    });

                    setConversationLog(prev => [...prev, { role: 'user', text: finalTranscript }]);
                    setUserTranscript('');
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);

                if (event.error === 'no-speech') {
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
        } catch (err) {
            console.error('Error initializing speech recognition:', err);
            setError('Failed to initialize speech recognition');
        }

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (err) {
                    console.error('Error stopping recognition:', err);
                }
            }
        };
    }, [isCallActive, isMuted, isSpeaking, currentconversation_id, currentLanguage, getSpeechLang]);

    const startCall = async () => {
        try {
            setError(null);
            setIsConnecting(true);
            setConversationLog([]);
            setUserTranscript('');
            setAiResponse('');

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());

            const voiceSocket = io(`${BACKEND_URL}/voice`, {
                auth: { token }
            });

            voiceSocketRef.current = voiceSocket;

            voiceSocket.on('connect', () => {
                console.log('Voice socket connected');
                setIsConnecting(false);
                setIsCallActive(true);

                // startCall関数内で voice-call-start イベント送信時に言語情報を追加
                voiceSocket.emit('voice-call-start', {
                    conversation_id: currentconversation_id,
                    language: currentLanguage.code  // ← 言語情報を追加
                });
            });

            voiceSocket.on('voice-call-ready', () => {
                console.log('Voice call ready');

                if (recognitionRef.current && !isMuted) {
                    try {
                        recognitionRef.current.start();
                        setIsRecording(true);
                    } catch (err) {
                        console.error('Error starting recognition:', err);
                    }
                }
            });

            voiceSocket.on('voice-user-transcript', (data: { transcript: string }) => {
                console.log('User transcript acknowledged:', data.transcript);
            });

            voiceSocket.on('voice-ai-response', (data: { response: string }) => {
                console.log('AI response received:', data.response);
                setAiResponse(data.response);

                setConversationLog(prev => [...prev, { role: 'ai', text: data.response }]);

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

            voiceSocket.on('connect_error', (err: Error) => {
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
        if (voiceSocketRef.current) {
            voiceSocketRef.current.emit('voice-call-end');
            voiceSocketRef.current.disconnect();
            voiceSocketRef.current = null;
        }

        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (err) {
                console.error('Error stopping recognition:', err);
            }
        }

        stopSpeaking();

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
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (err) {
                    console.error('Error stopping recognition:', err);
                }
            }
            setIsRecording(false);
        } else {
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

        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = getSpeechLang(); // Use current language
        utterance.rate = 1.0;
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

        utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
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

    const handleLanguageChange = (languageCode: string) => {
        setLanguage(languageCode);
        setShowLanguageSelector(false);

        // If call is active, restart recognition with new language
        if (isCallActive && recognitionRef.current) {
            try {
                recognitionRef.current.stop();
                recognitionRef.current.lang = getSpeechLang();
                if (!isMuted) {
                    setTimeout(() => {
                        recognitionRef.current?.start();
                    }, 100);
                }
            } catch (err) {
                console.error('Error changing language during call:', err);
            }
        }
    };

    return (
        <div className="voice-chat-container" dir={currentLanguage.rtl ? 'rtl' : 'ltr'}>
            {/* Language Selector */}
            <div className="language-selector-header">
                <button
                    className="language-button"
                    onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                >
                    <FiGlobe size={20} />
                    <span>{currentLanguage.flag} {currentLanguage.nativeName}</span>
                </button>

                {showLanguageSelector && (
                    <div className="language-dropdown">
                        {supportedLanguages.map(lang => (
                            <button
                                key={lang.code}
                                className={`language-option ${currentLanguage.code === lang.code ? 'active' : ''}`}
                                onClick={() => handleLanguageChange(lang.code)}
                            >
                                <span className="language-flag">{lang.flag}</span>
                                <span className="language-name">{lang.nativeName}</span>
                                <span className="language-name-en">({lang.name})</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {!isCallActive && !isConnecting ? (
                <div className="voice-chat-start">
                    <div className="voice-intro">
                        <h2>{t('welcome')} - Djelia Cloud</h2>
                        <p>🌍 {t('start_chat')}</p>
                    </div>

                    <button className="start-call-button" onClick={startCall}>
                        <FiPhone size={28} />
                        <span>{t('start_voice_call')}</span>
                    </button>

                    <div className="voice-features">
                        <div className="feature-item">
                            <FiMic size={24} />
                            <div>
                                <h4>{currentLanguage.nativeName}</h4>
                                <p>{t('listening')}</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <FiVolume2 size={24} />
                            <div>
                                <h4>{t('ai_assistant')}</h4>
                                <p>{t('speaking')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : isConnecting ? (
                <div className="voice-connecting">
                    <div className="connecting-spinner"></div>
                    <h3>{t('listening')}...</h3>
                </div>
            ) : (
                <div className="voice-call-active">
                    <div className="call-header">
                        <h3>{currentLanguage.flag} {currentLanguage.nativeName}</h3>
                        <div className={`call-status-badge ${isRecording ? 'recording' : isMuted ? 'muted' : 'ready'}`}>
                            {isRecording ? (
                                <>
                                    <span className="status-dot recording"></span>
                                    {t('listening')}
                                </>
                            ) : isMuted ? (
                                <>
                                    <span className="status-dot muted"></span>
                                    {t('mute')}
                                </>
                            ) : (
                                <>
                                    <span className="status-dot ready"></span>
                                    {t('ready') || 'Ready'}
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
                                            <p>{t('listening')}...</p>
                                        </>
                                    ) : (
                                        <p>{t('type_message')}</p>
                                    )}
                                </div>
                            ) : (
                                <div className="conversation-log">
                                    {conversationLog.slice(-3).map((entry, index) => (
                                        <div key={index} className={`conversation-entry ${entry.role}`}>
                                            <div className="entry-label">
                                                {entry.role === 'user' ? 'You' : t('ai_assistant')}
                                            </div>
                                            <div className="entry-text">{entry.text}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {userTranscript && (
                            <div className="transcript-live">
                                <div className="transcript-label">{t('listening')}...</div>
                                <p>{userTranscript}</p>
                            </div>
                        )}

                        {isSpeaking && aiResponse && (
                            <div className="ai-speaking-indicator">
                                <FiVolume2 size={24} className="speaking-icon" />
                                <div>
                                    <div className="speaking-label">{t('speaking')}</div>
                                    <p className="speaking-text">{aiResponse}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="call-controls">
                        <button
                            className={`control-button mute ${isMuted ? 'active' : ''}`}
                            onClick={toggleMute}
                            title={isMuted ? t('unmute') : t('mute')}
                        >
                            {isMuted ? <FiMicOff size={28} /> : <FiMic size={28} />}
                            <span className="control-label">
                                {isMuted ? t('unmute') : t('mute')}
                            </span>
                        </button>

                        <button
                            className="control-button end-call"
                            onClick={endCall}
                            title={t('end_call')}
                        >
                            <FiPhoneOff size={28} />
                            <span className="control-label">{t('end_call')}</span>
                        </button>

                        <button
                            className={`control-button speaker ${isSpeaking ? 'active' : ''}`}
                            onClick={stopSpeaking}
                            title={t('speaking')}
                            disabled={!isSpeaking}
                        >
                            {isSpeaking ? <FiVolumeX size={28} /> : <FiVolume2 size={28} />}
                            <span className="control-label">
                                {isSpeaking ? t('mute') : t('speaking')}
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
                <h4>💡 Tips</h4>
                <ul>
                    <li><strong>{t('start_voice_call')}:</strong> {currentLanguage.nativeName}</li>
                    <li><strong>{t('language')}:</strong> {currentLanguage.name}</li>
                    <li><strong>{t('ai_assistant')}:</strong> {t('speaking')} {currentLanguage.nativeName}</li>
                </ul>
            </div>
        </div>
    );
};

export default VoiceChat;