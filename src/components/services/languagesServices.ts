// Supported languages configuration
export interface Language {
    code: string;
    name: string;
    nativeName: string;
    speechCode?: string; // For speech recognition/synthesis
    flag: string;
    rtl?: boolean; // Right-to-left languages
}

export const SUPPORTED_LANGUAGES: Language[] = [
    // African Languages
    {
        code: 'bm',
        name: 'Bambara',
        nativeName: 'Bamanankan',
        speechCode: 'fr-ML', // Fallback to French-Mali
        flag: '🇲🇱'
    },
    {
        code: 'ff',
        name: 'Fulfulde',
        nativeName: 'Fulfulde',
        speechCode: 'fr-ML',
        flag: '🇲🇱'
    },
    {
        code: 'sw',
        name: 'Swahili',
        nativeName: 'Kiswahili',
        speechCode: 'sw-KE',
        flag: '🇰🇪'
    },
    {
        code: 'yo',
        name: 'Yoruba',
        nativeName: 'Yorùbá',
        speechCode: 'yo-NG',
        flag: '🇳🇬'
    },
    {
        code: 'ha',
        name: 'Hausa',
        nativeName: 'Hausa',
        speechCode: 'ha-NG',
        flag: '🇳🇬'
    },
    {
        code: 'ig',
        name: 'Igbo',
        nativeName: 'Igbo',
        speechCode: 'ig-NG',
        flag: '🇳🇬'
    },
    {
        code: 'am',
        name: 'Amharic',
        nativeName: 'አማርኛ',
        speechCode: 'am-ET',
        flag: '🇪🇹'
    },
    {
        code: 'zu',
        name: 'Zulu',
        nativeName: 'isiZulu',
        speechCode: 'zu-ZA',
        flag: '🇿🇦'
    },
    {
        code: 'xh',
        name: 'Xhosa',
        nativeName: 'isiXhosa',
        speechCode: 'xh-ZA',
        flag: '🇿🇦'
    },
    
    // Major World Languages
    {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        speechCode: 'en-US',
        flag: '🇺🇸'
    },
    {
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        speechCode: 'fr-FR',
        flag: '🇫🇷'
    },
    {
        code: 'ar',
        name: 'Arabic',
        nativeName: 'العربية',
        speechCode: 'ar-SA',
        flag: '🇸🇦',
        rtl: true
    },
    {
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        speechCode: 'es-ES',
        flag: '🇪🇸'
    },
    {
        code: 'pt',
        name: 'Portuguese',
        nativeName: 'Português',
        speechCode: 'pt-PT',
        flag: '🇵🇹'
    },
    {
        code: 'zh',
        name: 'Chinese',
        nativeName: '中文',
        speechCode: 'zh-CN',
        flag: '🇨🇳'
    },
    {
        code: 'hi',
        name: 'Hindi',
        nativeName: 'हिन्दी',
        speechCode: 'hi-IN',
        flag: '🇮🇳'
    },
    {
        code: 'ja',
        name: 'Japanese',
        nativeName: '日本語',
        speechCode: 'ja-JP',
        flag: '🇯🇵'
    },
    {
        code: 'ko',
        name: 'Korean',
        nativeName: '한국어',
        speechCode: 'ko-KR',
        flag: '🇰🇷'
    },
    {
        code: 'de',
        name: 'German',
        nativeName: 'Deutsch',
        speechCode: 'de-DE',
        flag: '🇩🇪'
    },
    {
        code: 'ru',
        name: 'Russian',
        nativeName: 'Русский',
        speechCode: 'ru-RU',
        flag: '🇷🇺'
    }
];

// Translation mappings for UI elements
export const TRANSLATIONS: Record<string, Record<string, string>> = {
    // Bambara
    'bm': {
        'welcome': 'I ni ce',
        'start_voice_call': 'Ka kuma daminɛ',
        'start_chat': 'Ka baro daminɛ',
        'listening': 'Ka mɛn',
        'speaking': 'Ka kuma',
        'mute': 'Ka kunbɛn dabila',
        'unmute': 'Ka kunbɛn laban',
        'end_call': 'Ka telefɔni jogin',
        'send': 'Ka ci',
        'type_message': 'Sɛbɛ kuma dɔ',
        'ai_assistant': 'AI dɛmɛbaga',
        'new_conversation': 'Baro kura',
        'settings': 'Labɛncogo',
        'language': 'Kan',
        'select_language': 'Kan sugandi'
    },
    // English
    'en': {
        'welcome': 'Welcome',
        'start_voice_call': 'Start Voice Call',
        'start_chat': 'Start Chat',
        'listening': 'Listening',
        'speaking': 'Speaking',
        'mute': 'Mute',
        'unmute': 'Unmute',
        'end_call': 'End Call',
        'send': 'Send',
        'type_message': 'Type a message',
        'ai_assistant': 'AI Assistant',
        'new_conversation': 'New Conversation',
        'settings': 'Settings',
        'language': 'Language',
        'select_language': 'Select Language'
    },
    // French
    'fr': {
        'welcome': 'Bienvenue',
        'start_voice_call': 'Démarrer un appel vocal',
        'start_chat': 'Commencer la discussion',
        'listening': 'À l\'écoute',
        'speaking': 'En train de parler',
        'mute': 'Muet',
        'unmute': 'Réactiver le son',
        'end_call': 'Terminer l\'appel',
        'send': 'Envoyer',
        'type_message': 'Tapez un message',
        'ai_assistant': 'Assistant IA',
        'new_conversation': 'Nouvelle conversation',
        'settings': 'Paramètres',
        'language': 'Langue',
        'select_language': 'Sélectionner la langue'
    },
    // Arabic
    'ar': {
        'welcome': 'مرحبا',
        'start_voice_call': 'بدء مكالمة صوتية',
        'start_chat': 'بدء الدردشة',
        'listening': 'الاستماع',
        'speaking': 'التحدث',
        'mute': 'كتم الصوت',
        'unmute': 'إلغاء كتم الصوت',
        'end_call': 'إنهاء المكالمة',
        'send': 'إرسال',
        'type_message': 'اكتب رسالة',
        'ai_assistant': 'مساعد الذكاء الاصطناعي',
        'new_conversation': 'محادثة جديدة',
        'settings': 'الإعدادات',
        'language': 'اللغة',
        'select_language': 'اختر اللغة'
    },
    // Swahili
    'sw': {
        'welcome': 'Karibu',
        'start_voice_call': 'Anza Simu ya Sauti',
        'start_chat': 'Anza Mazungumzo',
        'listening': 'Kusikiliza',
        'speaking': 'Kuongea',
        'mute': 'Zima Sauti',
        'unmute': 'Washa Sauti',
        'end_call': 'Maliza Simu',
        'send': 'Tuma',
        'type_message': 'Andika ujumbe',
        'ai_assistant': 'Msaidizi wa AI',
        'new_conversation': 'Mazungumzo Mapya',
        'settings': 'Mipangilio',
        'language': 'Lugha',
        'select_language': 'Chagua Lugha'
    },
    // Yoruba
    'yo': {
        'welcome': 'Káàbọ̀',
        'start_voice_call': 'Bẹ̀rẹ̀ Ìpè Ohùn',
        'start_chat': 'Bẹ̀rẹ̀ Ìfọ̀rọ̀wérọ̀',
        'listening': 'Ń gbọ́',
        'speaking': 'Ń sọ̀rọ̀',
        'mute': 'Pa ohùn',
        'unmute': 'Tú ohùn',
        'end_call': 'Parí ìpè',
        'send': 'Fi ránṣẹ́',
        'type_message': 'Kọ ìránṣẹ́',
        'ai_assistant': 'Olùrànlọ́wọ́ AI',
        'new_conversation': 'Ìfọ̀rọ̀wérọ̀ Tuntun',
        'settings': 'Àwọn Ìṣètò',
        'language': 'Èdè',
        'select_language': 'Yan Èdè'
    }
};

export const getLanguage = (code: string): Language | undefined => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
};

export const translate = (key: string, languageCode: string): string => {
    return TRANSLATIONS[languageCode]?.[key] || TRANSLATIONS['en'][key] || key;
};

export const getSpeechLanguage = (languageCode: string): string => {
    const language = getLanguage(languageCode);
    return language?.speechCode || 'en-US';
};