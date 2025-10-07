import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import { LanguageProvider } from './contexts/LanguageContext';
import { ChatProvider } from './contexts/ChatContext';
import DjeliaCloud from './components/chat/DjeliaCloud';
import './App.css';

const App: React.FC = () => {
    return (
        <AuthProvider>
            <LanguageProvider>
                <ChatProvider>
                    <Router>
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/chat" element={<Chat />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/" element={<Navigate to="/chat" replace />} />
                            <Route path="*" element={<Navigate to="/chat" replace />} />
                            {/*  追加部分(Djelia Cloudの機能追加) */}
                            <Route path="/" element={<DjeliaCloud />} />
                            <Route path="/djelia" element={<DjeliaCloud />} />
                            <Route path="/login" element={<LoginPage />} />
                        </Routes>
                    </Router>
                </ChatProvider>
            </LanguageProvider>
        </AuthProvider>
    );
};

export default App;
