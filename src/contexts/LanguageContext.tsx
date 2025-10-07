import React, { createContext, useState, useContext, useEffect } from 'react';
import { SUPPORTED_LANGUAGES, Language, translate, getSpeechLanguage } from '../components/services/languagesServices';

interface LanguageContextType {
    currentLanguage: Language;
    setLanguage: (code: string) => void;
    t: (key: string) => string;
    getSpeechLang: () => string;
    supportedLanguages: Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentLanguage, setCurrentLanguage] = useState<Language>(
        SUPPORTED_LANGUAGES.find(lang => lang.code === 'bm') || SUPPORTED_LANGUAGES[0]
    );

    useEffect(() => {
        // Load saved language from localStorage
        const savedLanguage = localStorage.getItem('preferred_language');
        if (savedLanguage) {
            const language = SUPPORTED_LANGUAGES.find(lang => lang.code === savedLanguage);
            if (language) {
                setCurrentLanguage(language);
            }
        } else {
            // Try to detect browser language
            const browserLang = navigator.language.split('-')[0];
            const detectedLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === browserLang);
            if (detectedLanguage) {
                setCurrentLanguage(detectedLanguage);
            }
        }
    }, []);

    useEffect(() => {
        // Apply RTL direction if needed
        if (currentLanguage.rtl) {
            document.documentElement.setAttribute('dir', 'rtl');
            document.documentElement.setAttribute('lang', currentLanguage.code);
        } else {
            document.documentElement.setAttribute('dir', 'ltr');
            document.documentElement.setAttribute('lang', currentLanguage.code);
        }
    }, [currentLanguage]);

    const setLanguage = (code: string) => {
        const language = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
        if (language) {
            setCurrentLanguage(language);
            localStorage.setItem('preferred_language', code);
        }
    };

    const t = (key: string): string => {
        return translate(key, currentLanguage.code);
    };

    const getSpeechLang = (): string => {
        return getSpeechLanguage(currentLanguage.code);
    };

    return (
        <LanguageContext.Provider
            value={{
                currentLanguage,
                setLanguage,
                t,
                getSpeechLang,
                supportedLanguages: SUPPORTED_LANGUAGES
            }}
        >
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};