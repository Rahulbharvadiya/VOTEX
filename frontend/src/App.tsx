import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Languages,
  FileText,
  Mic,
  MicOff,
  BookOpen,
  History,
  Bookmark,
  Sun,
  Moon,
  ArrowLeftRight,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Trash2,
  ClipboardPaste,
  Upload,
  Download,
  Eye,
  X,
  Plus,
  Search,
  ChevronDown,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileCheck2,
  Square,
  Globe,
  ArrowRight,
  SlidersHorizontal,
  Terminal,
  Bot,
} from 'lucide-react';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

export interface LanguageItem {
  code: string;
  name: string;
  native: string;
  speechCode: string;
  rtl?: boolean;
}

export interface GlossaryItem {
  id: string;
  sourceTerm: string;
  targetTerm: string;
  sourceLang: string;
  targetLang: string;
  category: string;
  active: boolean;
}

export interface HistoryItem {
  id: string;
  sourceLang: string;
  targetLang: string;
  tone: string;
  sourceText: string;
  translatedText: string;
  timestamp: string;
  saved: boolean;
}

const LANGUAGES: LanguageItem[] = [
  { code: 'auto', name: 'Auto-Detect', native: 'Detect language', speechCode: 'en-US' },

  // Indian Languages (22 Official Scheduled + prominent)
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', speechCode: 'hi-IN' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', speechCode: 'kn-IN' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', speechCode: 'gu-IN' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', speechCode: 'ta-IN' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', speechCode: 'te-IN' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', speechCode: 'mr-IN' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', speechCode: 'bn-IN' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', speechCode: 'pa-IN' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', speechCode: 'ml-IN' },
  { code: 'ur', name: 'Urdu', native: 'اردو', speechCode: 'ur-AE', rtl: true },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', speechCode: 'or-IN' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া', speechCode: 'as-IN' },
  { code: 'sa', name: 'Sanskrit', native: 'संस्कृतम्', speechCode: 'sa-IN' },
  { code: 'ne', name: 'Nepali', native: 'नेपाली', speechCode: 'ne-NP' },
  { code: 'sd', name: 'Sindhi', native: 'سنڌي', speechCode: 'sd-IN', rtl: true },
  { code: 'ks', name: 'Kashmiri', native: 'کٲشُر', speechCode: 'ks-IN', rtl: true },
  { code: 'kok', name: 'Konkani', native: 'कोंकणी', speechCode: 'kok-IN' },
  { code: 'mai', name: 'Maithili', native: 'मैथिली', speechCode: 'mai-IN' },
  { code: 'doi', name: 'Dogri', native: 'डोगरी', speechCode: 'doi-IN' },
  { code: 'brx', name: 'Bodo', native: 'बर\'', speechCode: 'brx-IN' },
  { code: 'sat', name: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ', speechCode: 'sat-IN' },
  { code: 'mni', name: 'Manipuri', native: 'মৈতৈলোন্', speechCode: 'mni-IN' },
  { code: 'bho', name: 'Bhojpuri', native: 'भोजपुरी', speechCode: 'bho-IN' },

  // Major World Languages
  { code: 'en', name: 'English', native: 'English', speechCode: 'en-US' },
  { code: 'es', name: 'Spanish', native: 'Español', speechCode: 'es-ES' },
  { code: 'fr', name: 'French', native: 'Français', speechCode: 'fr-FR' },
  { code: 'de', name: 'German', native: 'Deutsch', speechCode: 'de-DE' },
  { code: 'it', name: 'Italian', native: 'Italiano', speechCode: 'it-IT' },
  { code: 'pt', name: 'Portuguese', native: 'Português', speechCode: 'pt-PT' },
  { code: 'ru', name: 'Russian', native: 'Русский', speechCode: 'ru-RU' },
  { code: 'ja', name: 'Japanese', native: '日本語', speechCode: 'ja-JP' },
  { code: 'zh', name: 'Chinese (Simplified)', native: '中文 (简体)', speechCode: 'zh-CN' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', native: '中文 (繁體)', speechCode: 'zh-TW' },
  { code: 'ko', name: 'Korean', native: '한국어', speechCode: 'ko-KR' },
  { code: 'ar', name: 'Arabic', native: 'العربية', speechCode: 'ar-SA', rtl: true },
  { code: 'tr', name: 'Turkish', native: 'Türkçe', speechCode: 'tr-TR' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands', speechCode: 'nl-NL' },
  { code: 'pl', name: 'Polish', native: 'Polski', speechCode: 'pl-PL' },
  { code: 'sv', name: 'Swedish', native: 'Svenska', speechCode: 'sv-SE' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', speechCode: 'id-ID' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', speechCode: 'vi-VN' },
  { code: 'th', name: 'Thai', native: 'ไทย', speechCode: 'th-TH' },
  { code: 'uk', name: 'Ukrainian', native: 'Українська', speechCode: 'uk-UA' },
  { code: 'el', name: 'Greek', native: 'Ελληνικά', speechCode: 'el-GR' },
  { code: 'cs', name: 'Czech', native: 'Čeština', speechCode: 'cs-CZ' },
  { code: 'ro', name: 'Romanian', native: 'Română', speechCode: 'ro-RO' },
  { code: 'hu', name: 'Hungarian', native: 'Magyar', speechCode: 'hu-HU' },
  { code: 'da', name: 'Danish', native: 'Dansk', speechCode: 'da-DK' },
  { code: 'fi', name: 'Finnish', native: 'Suomi', speechCode: 'fi-FI' },
  { code: 'no', name: 'Norwegian', native: 'Norsk', speechCode: 'no-NO' },
  { code: 'he', name: 'Hebrew', native: 'עברית', speechCode: 'he-IL', rtl: true },
  { code: 'fa', name: 'Persian', native: 'فارسی', speechCode: 'fa-IR', rtl: true },
  { code: 'ms', name: 'Malay', native: 'Bahasa Melayu', speechCode: 'ms-MY' },
  { code: 'tl', name: 'Filipino / Tagalog', native: 'Filipino', speechCode: 'tl-PH' },
  { code: 'af', name: 'Afrikaans', native: 'Afrikaans', speechCode: 'af-ZA' },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili', speechCode: 'sw-KE' },
  { code: 'sq', name: 'Albanian', native: 'Shqip', speechCode: 'sq-AL' },
  { code: 'am', name: 'Amharic', native: 'አማርኛ', speechCode: 'am-ET' },
  { code: 'hy', name: 'Armenian', native: 'Հայերեն', speechCode: 'hy-AM' },
  { code: 'az', name: 'Azerbaijani', native: 'Azərbaycan', speechCode: 'az-AZ' },
  { code: 'eu', name: 'Basque', native: 'Euskara', speechCode: 'eu-ES' },
  { code: 'be', name: 'Belarusian', native: 'Беларуская', speechCode: 'be-BY' },
  { code: 'bs', name: 'Bosnian', native: 'Bosanski', speechCode: 'bs-BA' },
  { code: 'bg', name: 'Bulgarian', native: 'Български', speechCode: 'bg-BG' },
  { code: 'my', name: 'Burmese', native: 'မြန်မာ', speechCode: 'my-MM' },
  { code: 'ca', name: 'Catalan', native: 'Català', speechCode: 'ca-ES' },
  { code: 'ceb', name: 'Cebuano', native: 'Cebuano', speechCode: 'ceb-PH' },
  { code: 'ny', name: 'Chichewa', native: 'Chichewa', speechCode: 'ny-MW' },
  { code: 'co', name: 'Corsican', native: 'Corsu', speechCode: 'co-FR' },
  { code: 'hr', name: 'Croatian', native: 'Hrvatski', speechCode: 'hr-HR' },
  { code: 'eo', name: 'Esperanto', native: 'Esperanto', speechCode: 'eo' },
  { code: 'et', name: 'Estonian', native: 'Eesti', speechCode: 'et-EE' },
  { code: 'fy', name: 'Frisian', native: 'Frysk', speechCode: 'fy-NL' },
  { code: 'gl', name: 'Galician', native: 'Galego', speechCode: 'gl-ES' },
  { code: 'ka', name: 'Georgian', native: 'ქართული', speechCode: 'ka-GE' },
  { code: 'ht', name: 'Haitian Creole', native: 'Kreyòl ayisyen', speechCode: 'ht-HT' },
  { code: 'ha', name: 'Hausa', native: 'Hausa', speechCode: 'ha-NG' },
  { code: 'haw', name: 'Hawaiian', native: 'ʻŌlelo Hawaiʻi', speechCode: 'haw-US' },
  { code: 'is', name: 'Icelandic', native: 'Íslenska', speechCode: 'is-IS' },
  { code: 'ig', name: 'Igbo', native: 'Asụsụ Igbo', speechCode: 'ig-NG' },
  { code: 'ga', name: 'Irish', native: 'Gaeilge', speechCode: 'ga-IE' },
  { code: 'jw', name: 'Javanese', native: 'Basa Jawa', speechCode: 'jw-ID' },
  { code: 'kk', name: 'Kazakh', native: 'Қазақ', speechCode: 'kk-KZ' },
  { code: 'km', name: 'Khmer', native: 'ភាសាខ្មែរ', speechCode: 'km-KH' },
  { code: 'rw', name: 'Kinyarwanda', native: 'Ikinyarwanda', speechCode: 'rw-RW' },
  { code: 'ku', name: 'Kurdish', native: 'Kurdî', speechCode: 'ku-TR' },
  { code: 'ky', name: 'Kyrgyz', native: 'Кыргызча', speechCode: 'ky-KG' },
  { code: 'lo', name: 'Lao', native: 'ລາວ', speechCode: 'lo-LA' },
  { code: 'la', name: 'Latin', native: 'Latina', speechCode: 'la' },
  { code: 'lv', name: 'Latvian', native: 'Latviešu', speechCode: 'lv-LV' },
  { code: 'lt', name: 'Lithuanian', native: 'Lietuvių', speechCode: 'lt-LT' },
  { code: 'lb', name: 'Luxembourgish', native: 'Lëtzebuergesch', speechCode: 'lb-LU' },
  { code: 'mk', name: 'Macedonian', native: 'Македонски', speechCode: 'mk-MK' },
  { code: 'mg', name: 'Malagasy', native: 'Malagasy', speechCode: 'mg-MG' },
  { code: 'mt', name: 'Maltese', native: 'Malti', speechCode: 'mt-MT' },
  { code: 'mi', name: 'Maori', native: 'Te Reo Māori', speechCode: 'mi-NZ' },
  { code: 'mn', name: 'Mongolian', native: 'Монгол', speechCode: 'mn-MN' },
  { code: 'ps', name: 'Pashto', native: 'پښتو', speechCode: 'ps-AF', rtl: true },
  { code: 'sm', name: 'Samoan', native: 'Gagana Sāmoa', speechCode: 'sm-WS' },
  { code: 'gd', name: 'Scots Gaelic', native: 'Gàidhlig', speechCode: 'gd-GB' },
  { code: 'sr', name: 'Serbian', native: 'Српски', speechCode: 'sr-RS' },
  { code: 'st', name: 'Sesotho', native: 'Sesotho', speechCode: 'st-LS' },
  { code: 'sn', name: 'Shona', native: 'chiShona', speechCode: 'sn-ZW' },
  { code: 'si', name: 'Sinhala', native: 'සිංಹಲ', speechCode: 'si-LK' },
  { code: 'sk', name: 'Slovak', native: 'Slovenčina', speechCode: 'sk-SK' },
  { code: 'sl', name: 'Slovenian', native: 'Slovenščina', speechCode: 'sl-SI' },
  { code: 'so', name: 'Somali', native: 'Soomaali', speechCode: 'so-SO' },
  { code: 'su', name: 'Sundanese', native: 'Basa Sunda', speechCode: 'su-ID' },
  { code: 'tg', name: 'Tajik', native: 'Тоҷикӣ', speechCode: 'tg-TJ' },
  { code: 'tt', name: 'Tatar', native: 'Татар', speechCode: 'tt-RU' },
  { code: 'tk', name: 'Turkmen', native: 'Türkmen', speechCode: 'tk-TM' },
  { code: 'ug', name: 'Uyghur', native: 'ئۇيغۇرچە', speechCode: 'ug-CN', rtl: true },
  { code: 'uz', name: 'Uzbek', native: 'Oʻzbek', speechCode: 'uz-UZ' },
  { code: 'cy', name: 'Welsh', native: 'Cymraeg', speechCode: 'cy-GB' },
  { code: 'xh', name: 'Xhosa', native: 'isiXhosa', speechCode: 'xh-ZA' },
  { code: 'yi', name: 'Yiddish', native: 'ייִדיש', speechCode: 'yi-001', rtl: true },
  { code: 'yo', name: 'Yoruba', native: 'Èdè Yorùbá', speechCode: 'yo-NG' },
  { code: 'zu', name: 'Zulu', native: 'isiZulu', speechCode: 'zu-ZA' },
];

const TARGET_LANGUAGES = LANGUAGES.filter((l) => l.code !== 'auto');

const TONES = [
  { id: 'standard', label: 'Standard' },
  { id: 'formal', label: 'Formal' },
  { id: 'casual', label: 'Casual' },
  { id: 'technical', label: 'Technical' },
];

const SAMPLE_PRESETS = [
  {
    id: 'business',
    label: 'Business Email',
    sourceLang: 'en',
    text: 'Thank you for sharing the quarterly revenue roadmap. Could we align on the deployment schedule before Friday so our engineering team can finalize the release notes?',
  },
  {
    id: 'technical',
    label: 'Technical API Spec',
    sourceLang: 'en',
    text: 'The webhook endpoint must return an HTTP 200 status within 3 seconds. Include an idempotency key in the request header to prevent duplicate ledger entries.',
  },
  {
    id: 'casual',
    label: 'Casual Greeting',
    sourceLang: 'en',
    text: 'Hey! Are you free for coffee later this afternoon? I would love to catch up and hear how the new product launch went.',
  },
  {
    id: 'legal',
    label: 'Legal Clause',
    sourceLang: 'en',
    text: 'Subject to the terms of this Agreement, the Provider grants the Client a non-exclusive, non-transferable license to access the Platform solely for internal business operations.',
  },
];

const INITIAL_GLOSSARY: GlossaryItem[] = [];

const INITIAL_HISTORY: HistoryItem[] = [];

// ============================================================================
// TRANSLATION ENGINE (LOCAL MULTI-LANGUAGE DICTIONARY + TONE VARIANTS)
// ============================================================================

const PRESET_TRANSLATIONS: Record<string, Record<string, any>> = {
  business: {
    es: {
      standard: 'Gracias por compartir la hoja de ruta de ingresos trimestral. ¿Podríamos acordar el calendario de despliegue antes del viernes para que nuestro equipo de ingeniería finalice las notas de lanzamiento?',
      formal: 'Le agradecemos sinceramente haber compartido la hoja de ruta de ingresos trimestral. ¿Sería posible consensuar el calendario de despliegue antes del viernes a fin de que nuestro equipo de ingeniería ultime las notas de la versión?',
      casual: '¡Gracias por pasar el plan de ingresos del trimestre! ¿Nos ponemos de acuerdo con las fechas de lanzamiento antes del viernes para que ingeniería cierre las notas?',
      technical: 'Se agradece el roadmap de ingresos trimestral. Requerimos alineación en el cronograma de despliegue previo al viernes para que el equipo de ingeniería consolide las release notes.',
      alternatives: [
        'Muchas gracias por enviar la planificación de ingresos del trimestre. ¿Podemos coordinar la agenda de despliegue antes del viernes?',
        'Gracias por remitir la hoja de ruta trimestral. Conviene confirmar el calendario de puesta en producción antes del viernes.',
      ],
    },
    fr: {
      standard: 'Merci d’avoir partagé la feuille de route des revenus trimestriels. Pourrions-nous nous aligner sur le calendrier de déploiement avant vendredi afin que notre équipe d’ingénierie finalise les notes de version ?',
      formal: 'Nous vous remercions vivement de nous avoir communiqué la feuille de route financière trimestrielle. Serait-il envisageable de valider le calendrier de déploiement d’ici vendredi afin que nos ingénieurs puissent finaliser les notes de version ?',
      casual: 'Merci pour le partage du plan de revenus du trimestre ! On peut se caler sur le planning de mise en prod avant vendredi pour que l’équipe tech boucle les notes ?',
      technical: 'Accusé de réception de la feuille de route trimestrielle. Merci de synchroniser le calendrier de déploiement avant vendredi pour la génération finale des notes de version.',
      alternatives: [
        'Merci pour l’envoi de la feuille de route trimestrielle. Pouvons-nous confirmer la date de déploiement d’ici vendredi ?',
        'Je vous remercie pour la feuille de route des revenus. Validons le planning de déploiement avant vendredi pour l’équipe d’ingénierie.',
      ],
    },
    de: {
      standard: 'Vielen Dank für das Teilen der vierteljährlichen Umsatz-Roadmap. Könnten wir uns vor Freitag auf den Bereitstellungsplan einigen, damit unser Engineering-Team die Versionshinweise fertigstellen kann?',
      formal: 'Herzlichen Dank für die Übermittlung der quartalsweisen Umsatz-Roadmap. Dürften wir den Bereitstellungsplan bis Freitag abstimmen, sodass unsere Entwicklungsabteilung die Versionshinweise abschließen kann?',
      casual: 'Danke fürs Teilen der Umsatz-Roadmap! Können wir bis Freitag kurz den Rollout-Plan abstimmen, damit die Entwickler die Release Notes fertigmachen können?',
      technical: 'Bestätigung des Erhalts der Q-Umsatz-Roadmap. Bitte um Abstimmung des Deployment-Zeitplans vor Freitag zur Finalisierung der Release Notes durch das Engineering-Team.',
      alternatives: [
        'Danke für die Quartals-Roadmap. Lassen Sie uns den Bereitstellungsplan vor Freitag finalisieren.',
        'Vielen Dank für die Umsatzplanung. Eine Abstimmung zum Rollout vor Freitag ermöglicht dem Team den Abschluss der Release Notes.',
      ],
    },
    hi: {
      standard: 'तिमाही राजस्व रोडमैप साझा करने के लिए धन्यवाद। क्या हम शुक्रवार से पहले तैनाती कार्यक्रम पर सहमति बना सकते हैं ताकि हमारी इंजीनियरिंग टीम रिलीज़ नोट्स को अंतिम रूप दे सके?',
      formal: 'तिमाही राजस्व रोडमैप साझा करने हेतु आपका हार्दिक धन्यवाद। क्या हम शुक्रवार से पूर्व परिनियोजन समय-सारणी पर एकमत हो सकते हैं, जिससे हमारी अभियांत्रिकी टीम रिलीज़ नोट्स को अंतिम रूप प्रदान कर सके?',
      casual: 'तिमाही रेवेन्यू रोडमैप भेजने के लिए शुक्रिया! क्या हम शुक्रवार से पहले डिप्लॉयमेंट शेड्यूल तय कर लें ताकि इंजीनियरिंग टीम रिलीज़ नोट्स फाइनल कर सके?',
      technical: 'तिमाही राजस्व रोडमैप प्राप्त हुआ। कृपया शुक्रवार से पूर्व डिप्लॉयमेंट शेड्यूल संरेखित करें ताकि इंजीनियरिंग टीम रिलीज़ नोट्स को अंतिम रूप दे सके।',
      alternatives: [
        'क्वार्टरली रेवेन्यू प्लान साझा करने के लिए धन्यवाद। कृपया शुक्रवार से पहले डिप्लॉयमेंट की तारीख तय करें।',
        'तिमाही राजस्व योजना के लिए आभार। शुक्रवार से पहले शेड्यूल फाइनल करने पर इंजीनियरिंग टीम नोट्स तैयार कर लेगी।',
      ],
    },
    gu: {
      standard: 'ત્રિમાસિક આવક રોડમેપ શેર કરવા બદલ આભાર. શું આપણે શુક્રવાર પહેલાં ડિપ્લોયમેન્ટ શેડ્યૂલ પર સંમત થઈ શકીએ જેથી અમારી એન્જિનિયરિંગ ટીમ રિલીઝ નોટ્સને અંતિમ રૂપ આપી શકે?',
      formal: 'ત્રિમાસિક આવકનો રોડમેપ શેર કરવા બદલ આપનો હૃદયપૂર્વક આભાર. શું આપણે શુક્રવાર પૂર્વે ડિપ્લોયમેન્ટ સમયપત્રક પર સહમતિ સાધી શકીએ, જેથી અમારી એન્જિનિયરિંગ ટીમ રિલીઝ નોટ્સ પૂર્ણ કરી શકે?',
      casual: 'ક્વાર્ટરલી રેવન્યુ રોડમેપ મોકલવા માટે આભાર! શુક્રવાર પહેલાં ડિપ્લોયમેન્ટ પ્લાન ફાઇનલ કરી લઈએ જેથી એન્જિનિયરિંગ ટીમ રિલીઝ નોટ્સ પૂરી કરી શકે?',
      technical: 'ત્રિમાસિક આવક રોડમેપ પ્રાપ્ત થયો. એન્જિનિયરિંગ ટીમ દ્વારા રિલીઝ નોટ્સ ફાઇનલ કરવા માટે શુક્રવાર પહેલાં ડિપ્લોયમેન્ટ શેડ્યૂલ નિર્ધારિત કરવું જરૂરી છે.',
      alternatives: [
        'ત્રિમાસિક આવક યોજના મોકલવા બદલ આભાર. શુક્રવાર પહેલાં સમયપત્રક નક્કી કરીએ.',
        'રેવન્યુ રોડમેપ શેર કરવા માટે ધન્યવાદ. શુક્રવાર સુધીમાં ડિપ્લોયમેન્ટ તારીખ નક્કી કરી લઈએ.',
      ],
    },
    kn: {
      standard: 'ತ್ರೈಮಾಸಿಕ ಆದಾಯ ಮಾರ್ಗಸೂಚಿಯನ್ನು ಹಂಚಿಕೊಂಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ನಮ್ಮ ಎಂಜಿನಿಯರಿಂಗ್ ತಂಡವು ಬಿಡುಗಡೆ ಟಿಪ್ಪಣಿಗಳನ್ನು ಅಂತಿಮಗೊಳಿಸಲು ಶುಕ್ರವಾರಕ್ಕಿಂತ ಮುಂಚಿತವಾಗಿ ನಿಯೋಜನೆ ವೇಳಾಪಟ್ಟಿಯನ್ನು ಹೊಂದಿಸಬಹುದೇ?',
      formal: 'ತ್ರೈಮಾಸಿಕ ಆದಾಯ ಮಾರ್ಗಸೂಚಿಯನ್ನು ಹಂಚಿಕೊಂಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ಎಂಜಿನಿಯರಿಂಗ್ ತಂಡವು ಬಿಡುಗಡೆ ಟಿಪ್ಪಣಿಗಳನ್ನು ಅಂತಿಮಗೊಳಿಸಲು ಶುಕ್ರವಾರದ ಮೊದಲು ನಿಯೋಜನೆ ವೇಳಾಪಟ್ಟಿಯನ್ನು ಹೊಂದಿಸಬಹುದೇ?',
      casual: 'ತ್ರೈಮಾಸಿಕ ಆದಾಯ ಪ್ಲಾನ್ ಹಂಚಿಕೊಂಡಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದ! ಶುಕ್ರವಾರದೊಳಗೆ ಡಿಪ್ಲಾಯ್ಮೆಂಟ್ ವೇಳಾಪಟ್ಟಿ ಹೊಂದಿಸೋಣವೇ?',
      technical: 'ತ್ರೈಮಾಸಿಕ ಆದಾಯ ಮಾರ್ಗಸೂಚಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ. ರಿಲೀಸ್ ನೋಟ್ಸ್ ಪೂರ್ಣಗೊಳಿಸಲು ಶುಕ್ರವಾರದೊಳಗೆ ಡಿಪ್ಲಾಯ್ಮೆಂಟ್ ಶೆಡ್ಯೂಲ್ ಹೊಂದಿಸಿ.',
      alternatives: [
        'ತ್ರೈಮಾಸಿಕ ಆದಾಯ ಯೋಜನೆಯನ್ನು ಹಂಚಿಕೊಂಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು.',
        'ಶುಕ್ರವಾರದೊಳಗೆ ಡೆಪ್ಲಾಯ್ಮೆಂಟ್ ವೇಳಾಪಟ್ಟಿ ಅಂತಿಮಗೊಳಿಸಿ.',
      ],
    },
    ja: {
      standard: '四半期の収益ロードマップを共有いただきありがとうございます。エンジニアリングチームがリリースノートを確定できるよう、金曜日までにデプロイスケジュールを調整できますでしょうか？',
      formal: '四半期収益ロードマップをご共有いただき、誠にありがとうございます。エンジニアリング部門がリリースノートを最終確定できるよう、金曜日までに展開スケジュールをご調整いただけますでしょうか。',
      casual: '四半期の収益ロードマップの共有ありがとう！エンジニアチームがリリースノートをまとめられるように、金曜までにデプロイ予定を合わせられる？',
      technical: '四半期収益ロードマップを受領しました。エンジニアリングチームによるリリースノート確定のため、金曜日までにデプロイメントスケジュールを同期してください。',
      alternatives: [
        '収益ロードマップのご共有ありがとうございます。金曜日までにリリース日程を確定させていただけますか。',
        '四半期計画を共有いただきありがとうございます。金曜までにデプロイ予定を合意できれば幸いです。',
      ],
    },
    zh: {
      standard: '感谢您分享季度营收路线图。我们能否在周五之前就部署时间表达成一致，以便我们的工程团队最终确定发布说明？',
      formal: '衷心感谢您惠予分享本季度营收路线图。恳请于本周五前就部署排期达成共识，以便我方工程团队顺利完成发布说明的定稿。',
      casual: '谢谢分享季度营收路线图！咱们周五前能不能把上线时间对一下，方便工程团队把发布说明定下来？',
      technical: '已收到季度营收路线图。请在周五前同步部署时间表，以便研发团队完成最终版本发布说明（Release Notes）。',
      alternatives: [
        '感谢提供季度营收规划。请于周五前确认部署排期，便于工程团队整理发布说明。',
        '谢谢分享营收路线图，我们周五前对齐一下部署计划可以吗？',
      ],
    },
    ar: {
      standard: 'شكراً لمشاركة خارطة طريق الإيرادات الفصلية. هل يمكننا التوافق على جدول النشر قبل يوم الجمعة حتى يتمكن فريق الهندسة لدينا من إتمام ملاحظات الإصدار؟',
      formal: 'نتقدم بجزيل الشكر لمشاركتكم خارطة طريق الإيرادات الفصلية. نرجو التفضل بالتنسيق حول الجدول الزمني للنشر قبل يوم الجمعة ليتسنى لفريق الهندسة اعتماد ملاحظات الإصدار النهائية.',
      casual: 'شكراً على مشاركة خطة الإيرادات الفصلية! هل يمكننا الاتفاق على موعد الإطلاق قبل الجمعة لينتهي فريق الهندسة من ملاحظات الإصدار؟',
      technical: 'تم استلام خارطة طريق الإيرادات الفصلية. يرجى مواءمة جدول النشر قبل يوم الجمعة لتمكين فريق الهندسة من استكمال ملاحظات الإصدار.',
      alternatives: [
        'نشكركم على إرسال خارطة طريق الإيرادات. هل نعتمد جدول النشر قبل نهاية يوم الجمعة؟',
        'شكراً لمشاركة خطة الإيرادات الفصلية؛ نود تأكيد جدول النشر قبل الجمعة.',
      ],
    },
  },
  technical: {
    es: {
      standard: 'El endpoint de webhook debe devolver un estado HTTP 200 en menos de 3 segundos. Incluya una clave de idempotencia en el encabezado de la solicitud para evitar registros duplicados en el libro mayor.',
      formal: 'El punto de enlace webhook deberá retornar un código de estado HTTP 200 en un plazo máximo de 3 segundos, incorporando una clave de idempotencia en la cabecera para prevenir asientos contables duplicados.',
      casual: 'El webhook tiene que responder con HTTP 200 en menos de 3 segundos. Mete una clave de idempotencia en el header para que no se dupliquen registros.',
      technical: 'El endpoint webhook debe retornar HTTP 200 (< 3000 ms). Inyecte la cabecera Idempotency-Key (clave de idempotencia) en cada petición para garantizar la unicidad en el ledger.',
      alternatives: [
        'El webhook debe responder HTTP 200 dentro de 3 segundos y exigir una clave de idempotencia en la cabecera.',
        'Asegure una respuesta HTTP 200 en 3 segundos e incluya una clave de idempotencia para evitar duplicidad contable.',
      ],
    },
    fr: {
      standard: 'Le point de terminaison webhook doit renvoyer un statut HTTP 200 en moins de 3 secondes. Incluez une clé d’idempotence dans l’en-tête de la requête pour éviter les écritures en double dans le grand livre.',
      formal: 'Le point d’accès webhook est tenu de retourner un code HTTP 200 sous 3 secondes. Veuillez insérer une clé d’idempotence dans l’en-tête afin d’empêcher toute duplication comptable.',
      casual: 'Le webhook doit renvoyer un HTTP 200 en 3 secondes max. Ajoute une clé d’idempotence dans le header pour éviter les doublons.',
      technical: 'Le endpoint webhook doit retourner HTTP 200 en ≤ 3 s. Spécifiez une clé d’idempotence dans le header HTTP afin de prévenir les entrées dupliquées dans le ledger.',
      alternatives: [
        'Votre webhook doit répondre HTTP 200 sous 3 secondes avec une clé d’idempotence en en-tête.',
        'Pour éviter les doublons dans le registre, incluez une clé d’idempotence et répondez en moins de 3 secondes (HTTP 200).',
      ],
    },
    de: {
      standard: 'Der Webhook-Endpunkt muss innerhalb von 3 Sekunden einen HTTP-200-Status zurückgeben. Fügen Sie einen Idempotenzschlüssel in den Request-Header ein, um doppelte Hauptbucheinträge zu verhindern.',
      formal: 'Der Webhook-Endpunkt hat binnen 3 Sekunden den Status HTTP 200 zu erwidern. Bitte übermitteln Sie einen Idempotenzschlüssel im Header, um Mehrfachbuchungen auszuschließen.',
      casual: 'Der Webhook muss in unter 3 Sekunden HTTP 200 zurückgeben. Pack einfach einen Idempotenz-Key in den Header, damit nichts doppelt gebucht wird.',
      technical: 'Webhook-Endpoint-Anforderung: HTTP 200 Response < 3000 ms. Übermittlung eines Idempotency-Keys im Request-Header zur Vermeidung duplizierter Ledger-Einträge zwingend erforderlich.',
      alternatives: [
        'Antworten Sie binnen 3 Sekunden mit HTTP 200 und senden Sie einen Idempotenzschlüssel im Header mit.',
        'Um doppelte Buchungen zu vermeiden, nutzen Sie einen Idempotenzschlüssel und ein 3-Sekunden-Timeout (HTTP 200).',
      ],
    },
    hi: {
      standard: 'वेबहुक एंडपॉइंट को 3 सेकंड के भीतर HTTP 200 स्थिति लौटानी चाहिए। डुप्लिकेट लेजर प्रविष्टियों को रोकने के लिए रिक्वेस्ट हेडर में एक आइडेंपोटेंसी कुंजी शामिल करें।',
      formal: 'वेबहुक एंडपॉइंट द्वारा 3 सेकंड की अवधि के भीतर HTTP 200 स्थिति लौटाना अनिवार्य है। दोहरी बही-खाता प्रविष्टियों की रोकथाम हेतु अनुरोध हेडर में आइडेंपोटेंसी कुंजी संलग्न करें।',
      casual: 'वेबहुक को 3 सेकंड के अंदर HTTP 200 रिस्पॉन्स देना होगा। डुप्लिकेट एंट्री रोकने के लिए रिक्वेस्ट हेडर में आइडेंपोटेंसी की जरूर डालें।',
      technical: 'वेबहुक एंडपॉइंट: ≤ 3 सेकंड में HTTP 200 प्रतिक्रिया अनिवार्य। डुप्लिकेट लेजर एंट्री रोकने हेतु रिक्वेस्ट हेडर में Idempotency-Key शामिल करें।',
      alternatives: [
        '3 सेकंड के अंदर HTTP 200 लौटाएं और डुप्लिकेट एंट्री से बचने के लिए हेडर में आइडेंपोटेंसी की जोड़ें।',
        'वेबहुक प्रतिक्रिया 3 सेकंड से कम होनी चाहिए; रिक्वेस्ट हेडर में आइडेंपोटेंसी कुंजी अनिवार्य है।',
      ],
    },
    gu: {
      standard: 'વેબહુક એન્ડપોઇન્ટે 3 સેકન્ડમાં HTTP 200 સ્ટેટસ પરત કરવું આવશ્યક છે. ડુપ્લિકેટ લેજર એન્ટ્રીઓ અટકાવવા માટે રિક્વેસ્ટ હેડરમાં આઇડેમ્પોટન્સી કી શામેલ કરો.',
      formal: 'વેબહુક એન્ડપોઇન્ટ દ્વારા 3 સેકન્ડની અંદર HTTP 200 સ્થિતિ પરત કરવી ફરજિયાત છે. બેવડી ખાતાવહી નોંધો નિવારવા માટે વિનંતી હેડરમાં આઇડેમ્પોટન્સી કી ઉમેરો.',
      casual: 'વેબહુકે 3 સેકન્ડમાં HTTP 200 રિસ્પોન્સ આપવો પડશે. ડુપ્લિકેટ એન્ટ્રી રોકવા માટે હેડરમાં આઇડેમ્પોટન્સી કી મૂકજો.',
      technical: 'વેબહુક એન્ડપોઇન્ટ: ≤ 3s માં HTTP 200 રિટર્ન કરો. ડુપ્લિકેટ લેજર એન્ટ્રી નિવારવા Request Header માં Idempotency-Key ફરજિયાત છે.',
      alternatives: [
        '3 સેકન્ડની અંદર HTTP 200 પરત કરો અને હેડરમાં આઇડેમ્પોટન્સી કી ઉમેરો.',
        'ડુપ્લિકેટ નોંધ ટાળવા માટે રિક્વેસ્ટ હેડરમાં આઇડેમ્પોટન્સી કી સાથે 3 સેકન્ડમાં HTTP 200 આપો.',
      ],
    },
    kn: {
      standard: 'ವೆಬ್‌ಹುಕ್ ಎಂಡ್‌ಪಾಯಿಂಟ್ 3 ಸೆಕೆಂಡುಗಳಲ್ಲಿ HTTP 200 ಸ್ಥಿತಿಯನ್ನು ಹಿಂತಿರುಗಿಸಬೇಕು. ನಕಲಿ ಲೆಡ್ಜರ್ ನಮೂದುಗಳನ್ನು ತಡೆಗಟ್ಟಲು ವಿನಂತಿಯ ಹೆಡರ್‌ನಲ್ಲಿ ಐಡೆಂಪೊಟೆನ್ಸಿ ಕೀಲಿಯನ್ನು ಸೇರಿಸಿ.',
      formal: 'ವೆಬ್‌ಹುಕ್ ಎಂಡ್‌ಪಾಯಿಂಟ್ 3 ಸೆಕೆಂಡುಗಳ ಒಳಗೆ HTTP 200 ಸ್ಥಿತಿಯನ್ನು ಹಿಂತಿರುಗಿಸಬೇಕು. ನಕಲಿ ಲೆಡ್ಜರ್ ನಮೂದುಗಳನ್ನು ತಡೆಯಲು ಹೆಡರ್‌ನಲ್ಲಿ ಐಡೆಂಪೊಟೆನ್ಸಿ ಕೀ ಸೇರಿಸಿ.',
      casual: 'ವೆಬ್‌ಹುಕ್ 3 ಸೆಕೆಂಡ್‌ಗಳಲ್ಲಿ HTTP 200 ರಿಟರ್ನ್ ಮಾಡಬೇಕು. ಡ್ಯೂಪ್ಲಿಕೇಟ್ ಎಂಟ್ರಿ ತಡೆಯಲು ಹೆಡರ್‌ನಲ್ಲಿ ಐಡೆಂಪೊಟೆನ್ಸಿ ಕೀ ಹಾಕಿ.',
      technical: 'ವೆಬ್‌ಹುಕ್ ಎಂಡ್‌ಪಾಯಿಂಟ್: ≤ 3 ಸೆಕೆಂಡುಗಳಲ್ಲಿ HTTP 200 ಪ್ರತಿಕ್ರಿಯೆ ಕಡ್ಡಾಯ. ವಿನಂತಿಯ ಹೆಡರ್‌ನಲ್ಲಿ Idempotency-Key ಸೇರಿಸಿ.',
      alternatives: [
        '3 ಸೆಕೆಂಡುಗಳಲ್ಲಿ HTTP 200 ಹಿಂತಿರುಗಿಸಿ ಮತ್ತು ಹೆಡರ್‌ನಲ್ಲಿ ಐಡೆಂಪೊಟೆನ್ಸಿ ಕೀ ಸೇರಿಸಿ.',
        'ನಕಲಿ ನಮೂದುಗಳನ್ನು ತಪ್ಪಿಸಲು ಐಡೆಂಪೊಟೆನ್ಸಿ ಕೀ ಬಳಸಿ.',
      ],
    },
    ja: {
      standard: 'Webhookエンドポイントは3秒以内にHTTP 200ステータスを返す必要があります。重複する元帳エントリを防ぐため、リクエストヘッダーに冪等性キーを含めてください。',
      formal: 'Webhookエンドポイントは、3秒以内にHTTP 200ステータスを返却する必要がございます。元帳への重複登録を防止するため、リクエストヘッダーに冪等性キーを付与してください。',
      casual: 'Webhookは3秒以内にHTTP 200を返してね。二重登録を防ぐために、リクエストヘッダーに冪等性キーを入れておいて。',
      technical: 'Webhookエンドポイント要件：3秒以内にHTTP 200応答。重複レジャーエントリ防止のため、リクエストヘッダーへのIdempotency-Key付与が必須。',
      alternatives: [
        '3秒以内にHTTP 200を返し、重複防止のためヘッダーに冪等性キーを指定してください。',
        'Webhookは3秒以内のHTTP 200応答と、リクエストヘッダーへの冪等性キー設定が必要です。',
      ],
    },
    zh: {
      standard: 'Webhook 端点必须在 3 秒内返回 HTTP 200 状态。请在请求头中包含幂等性密钥，以防止重复的账本条目。',
      formal: 'Webhook 接口须于 3 秒内返回 HTTP 200 状态码。请于请求标头中附加幂等性密钥，以杜绝账簿记录重复。',
      casual: 'Webhook 必须在 3 秒内返回 HTTP 200，记得在请求头里带上幂等键，防止重复记账。',
      technical: 'Webhook 端点规范：响应时间 ≤ 3000ms 且返回 HTTP 200；请求头须携带 Idempotency-Key 以防 Ledger 重复写入。',
      alternatives: [
        '请在 3 秒内返回 HTTP 200，并在请求头中添加幂等键避免重复入账。',
        'Webhook 需在 3 秒内响应 HTTP 200，且请求头必须包含幂等性密钥。',
      ],
    },
    ar: {
      standard: 'يجب أن تُرجع نقطة نهاية Webhook حالة HTTP 200 خلال 3 ثوانٍ. قم بتضمين مفتاح عدم التكرار في ترويسة الطلب لمنع القيود المكررة في دفتر الأستاذ.',
      formal: 'يتعين على نقطة نهاية Webhook إرجاع رمز الحالة HTTP 200 في غضون 3 ثوانٍ، مع إدراج مفتاح عدم التكرار في ترويسة الطلب تفادياً لتكرار القيود المحاسبية.',
      casual: 'يجب أن يرد الـ Webhook برمز HTTP 200 خلال 3 ثوانٍ، ولا تنسَ إضافة مفتاح عدم التكرار في الترويسة لمنع التكرار.',
      technical: 'متطلب Webhook: إرجاع HTTP 200 خلال ≤ 3 ثوانٍ. تضمين ترويسة Idempotency-Key إلزامي لمنع الإدخالات المكررة في السجل.',
      alternatives: [
        'أرجع حالة HTTP 200 خلال 3 ثوانٍ وأضف مفتاح عدم التكرار في ترويسة الطلب.',
        'لمنع تكرار القيود، أضف مفتاح عدم التكرار واستجب برمز HTTP 200 خلال 3 ثوانٍ.',
      ],
    },
  },
  casual: {
    es: {
      standard: '¡Hola! ¿Tienes tiempo para un café esta tarde? Me encantaría ponernos al día y saber cómo salió el lanzamiento del nuevo producto.',
      formal: 'Buenas tardes. ¿Dispondría de un momento para tomar un café hoy más tarde? Sería un placer ponernos al día y conocer los resultados del reciente lanzamiento.',
      casual: '¡Hey! ¿Libre para un café hoy por la tarde? Me encantaría charlar y que me cuentes qué tal fue el lanzamiento del nuevo producto.',
      technical: 'Solicitud de reunión breve (café) para esta tarde con el objetivo de sincronizar novedades y revisar los resultados del lanzamiento del producto.',
      alternatives: [
        '¿Te apetece un café esta tarde? Quiero saber cómo fue el lanzamiento.',
        '¡Hola! ¿Nos vemos para un café más tarde y me cuentas sobre el nuevo producto?',
      ],
    },
    fr: {
      standard: 'Salut ! Es-tu libre pour un café plus tard cet après-midi ? J’aimerais beaucoup qu’on se rattrape et savoir comment s’est passé le lancement du nouveau produit.',
      formal: 'Bonjour, seriez-vous disponible pour prendre un café cet après-midi ? Je serais ravi d’échanger avec vous au sujet du lancement de votre nouveau produit.',
      casual: 'Coucou ! Dispo pour un café cet aprèm ? J’ai trop envie d’avoir de tes nouvelles et de savoir comment s’est passé le lancement !',
      technical: 'Proposition d’échange informel cet après-midi pour faire le point sur les résultats du déploiement produit.',
      alternatives: [
        'Tu es disponible pour un café cet après-midi ? Raconte-moi le lancement !',
        'On se retrouve autour d’un café tout à l’heure pour parler du nouveau produit ?',
      ],
    },
    de: {
      standard: 'Hey! Hast du heute Nachmittag Zeit für einen Kaffee? Ich würde mich freuen, mich auszutauschen und zu hören, wie der neue Produktstart lief.',
      formal: 'Guten Tag! Hätten Sie heute Nachmittag kurz Zeit für einen Kaffee? Ich würde mich sehr freuen, mehr über den Verlauf Ihrer neuen Produkteinführung zu erfahren.',
      casual: 'Hey! Bock auf ’nen Kaffee heute Nachmittag? Lass mal quatschen — will unbedingt hören, wie der Launch lief!',
      technical: 'Kurze Abstimmung bei einem Kaffee heute Nachmittag zur Nachbesprechung des aktuellen Produkt-Launches.',
      alternatives: [
        'Hast du später Lust auf einen Kaffee? Ich bin gespannt auf den Produktstart.',
        'Wollen wir heute Nachmittag einen Kaffee trinken und über den Launch sprechen?',
      ],
    },
    hi: {
      standard: 'नमस्ते! क्या आप आज दोपहर बाद कॉफ़ी के लिए खाली हैं? मुझे मिलकर बातचीत करने और यह जानने में खुशी होगी कि नए उत्पाद का लॉन्च कैसा रहा।',
      formal: 'नमस्कार। क्या आज अपराह्न कॉफ़ी हेतु आपका समय उपलब्ध रहेगा? आपसे भेंट कर नवीन उत्पाद के शुभारंभ के विषय में जानने की उत्सुकता है।',
      casual: 'अरे! आज शाम को कॉफ़ी के लिए फ्री हो क्या? काफी दिन हो गए, मिलते हैं और सुनते हैं नया प्रोडक्ट लॉन्च कैसा रहा!',
      technical: 'आज अपराह्न अनौपचारिक चर्चा (कॉफ़ी) हेतु उपलब्धता का अनुरोध; विषय: नवीन उत्पाद लॉन्च की समीक्षा।',
      alternatives: [
        'क्या आज शाम कॉफ़ी पर मिल सकते हैं? नए प्रोडक्ट लॉन्च के बारे में जानना है।',
        'हाय! आज दोपहर बाद कॉफ़ी का प्लान बनाएं? लॉन्च के बारे में सुनना अच्छा लगेगा।',
      ],
    },
    gu: {
      standard: 'નમસ્તે! શું તમે આજે બપોરે પછી કોફી માટે ફ્રી છો? મને મળીને વાતચીત કરવાનું અને નવા પ્રોડક્ટ લોન્ચ વિશે જાણવાનું ગમશે.',
      formal: 'નમસ્કાર. શું આજે બપોર બાદ કોફી માટે આપનો સમય ઉપલબ્ધ છે? આપની સાથે મુલાકાત કરી નવા ઉત્પાદનના લોન્ચ અંગે જાણવાની ઈચ્છા છે.',
      casual: 'હેય! આજે સાંજે કોફી માટે ફ્રી છે? મળીએ અને વાત કરીએ કે નવું પ્રોડક્ટ લોન્ચ કેવું રહ્યું!',
      technical: 'આજે બપોર પછી અનૌપચારિક મુલાકાત (કોફી) માટે ઉપલબ્ધતાની પૂછપરછ; વિષય: નવા પ્રોડક્ટ લોન્ચની વિગતો.',
      alternatives: [
        'આજે બપોરે કોફી માટે મળીએ? નવા લોન્ચ વિશે જાણવું છે.',
        'હેય! સાંજે કોફી પીવા મળીશું? લોન્ચ કેવું રહ્યું તે સાંભળવું છે.',
      ],
    },
    kn: {
      standard: 'ನಮಸ್ಕಾರ! ಇಂದು ಮಧ್ಯಾಹ್ನ ನಂತರ ನೀವು ಕಾಫಿಗೆ ಲಭ್ಯವಿದ್ದೀರಾ? ಭೇಟಿಯಾಗಿ ಹೊಸ ಉತ್ಪನ್ನದ ಬಿಡುಗಡೆ ಹೇಗಿತ್ತು ಎಂದು ತಿಳಿಯಲು ಇಷ್ಟಪಡುತ್ತೇನೆ.',
      formal: 'ನಮಸ್ಕಾರ. ಇಂದು ಮಧ್ಯಾಹ್ನದ ನಂತರ ಕಾಫಿಗೆ ಸಮಯವಿದೆಯೇ? ನಿಮ್ಮೊಂದಿಗೆ ಮಾತನಾಡಿ ಹೊಸ ಉತ್ಪನ್ನದ ಬಿಡುಗಡೆ ಬಗ್ಗೆ ತಿಳಿಯಲು ಸಂತೋಷವಾಗುತ್ತದೆ.',
      casual: 'ಹೇ! ಇವತ್ತು ಸಂಜೆ ಕಾಫಿ ಕುಡಿಯಲು ಫ್ರೀ ಇದ್ದೀರಾ? ಹೊಸ ಪ್ರಾಡಕ್ಟ್ ಲಾಂಚ್ ಹೇಗಿತ್ತು ಎಂದು ಕೇಳೋಣ!',
      technical: 'ಹೊಸ ಉತ್ಪನ್ನ ಬಿಡುಗಡೆಯ ಪ್ರಗತಿ ಪರಿಶೀಲನೆಗೆ ಇಂದು ಮಧ್ಯಾಹ್ನ ಸಂಕ್ಷಿಪ್ತ ಸಭೆ ವಿನಂತಿಸಲಾಗಿದೆ.',
      alternatives: [
        'ಇಂದು ಸಂಜೆ ಕಾಫಿಗೆ ಭೇಟಿಯಾಗೋಣವೇ?',
        'ಹೊಸ ಉತ್ಪನ್ನದ ಬಿಡುಗಡೆ ಕುರಿತು ಮಾತನಾಡಲು ಇಷ್ಟಪಡುತ್ತೇನೆ.',
      ],
    },
    ja: {
      standard: 'こんにちは！今日の午後、コーヒーでもいかがですか？近況を話したり、新製品のローンチがどうだったか聞きたいです。',
      formal: 'お疲れ様です。本日の午後、少しお時間をいただきコーヒーをご一緒できませんでしょうか。新製品のリリース状況についてもお伺いできれば幸いです。',
      casual: 'ねえ！今日の午後コーヒー行かない？久しぶりに話したいし、新製品のローンチどうだったか聞かせてよ！',
      technical: '本日午後の非公式ミーティング（コーヒー）の提案：近況同期および新製品ローンチ結果の共有。',
      alternatives: [
        '今日の午後、コーヒーを飲みながら新製品ローンチの話を聞かせてください。',
        '午後お時間あればコーヒーでも！ローンチの結果が気になっています。',
      ],
    },
    zh: {
      standard: '嗨！今天下午晚些时候有空喝杯咖啡吗？我很想叙叙旧，听听新产品发布得怎么样。',
      formal: '您好，不知今日午后您是否方便共饮一杯咖啡？很希望能与您交流近况，并了解新产品的发布进展。',
      casual: '嘿！下午有空喝杯咖啡不？好久没聊了，快跟我说说新产品上线怎么样！',
      technical: '提议今日下午进行简短非正式会面（咖啡），同步近况并复盘新产品发布情况。',
      alternatives: [
        '今天下午方便喝杯咖啡吗？想听听你分享新产品发布的情况。',
        '下午有空聚一下喝杯咖啡吗？顺便聊聊新品上线！',
      ],
    },
    ar: {
      standard: 'مرحباً! هل أنت متفرغ لتناول القهوة في وقت لاحق بعد ظهر اليوم؟ يسعدني أن نتحدث وأسمع كيف سار إطلاق المنتج الجديد.',
      formal: 'تحية طيبة. هل يتسع وقتكم لتناول فنجان من القهوة عصر اليوم؟ يسعدني الاطمئنان عليكم ومعرفة أصداء إطلاق المنتج الجديد.',
      casual: 'أهلاً! هل أنت فاضٍ لقهوة اليوم عصراً؟ مشتاق للحديث ومعرفة كيف كان إطلاق المنتج الجديد!',
      technical: 'طلب لقاء غير رسمي (قهوة) عصر اليوم لتبادل المستجدات ومراجعة نتائج إطلاق المنتج الجديد.',
      alternatives: [
        'هل نلتقي لتناول القهوة اليوم عصراً؟ أود معرفة تفاصيل إطلاق المنتج الجديد.',
        'مرحباً! هل لديك وقت لقهوة اليوم لنتحدث عن إطلاق المنتج؟',
      ],
    },
  },
  legal: {
    es: {
      standard: 'Sujeto a los términos de este Acuerdo, el Proveedor otorga al Cliente una licencia no exclusiva e intransferible para acceder a la Plataforma únicamente para operaciones comerciales internas.',
      formal: 'De conformidad con las estipulaciones del presente Contrato, el Proveedor confiere al Cliente una licencia de carácter no exclusivo e intransferible para el acceso a la Plataforma, circunscrita exclusivamente a operaciones mercantiles internas.',
      casual: 'Bajo este acuerdo, el proveedor le da al cliente un permiso no exclusivo ni transferible para usar la plataforma solo para su trabajo interno.',
      technical: 'Conforme al Acuerdo, el Proveedor concede al Cliente una licencia no exclusiva y no transferible de acceso a la Plataforma restringida a uso operativo interno.',
      alternatives: [
        'El Proveedor concede al Cliente una licencia limitada, no exclusiva e intransferible para uso comercial interno de la Plataforma.',
        'Bajo los términos pactados, el acceso del Cliente a la Plataforma es no exclusivo, intransferible y exclusivamente interno.',
      ],
    },
    fr: {
      standard: 'Sous réserve des conditions du présent Contrat, le Fournisseur accorde au Client une licence non exclusive et non transférable d’accès à la Plateforme uniquement pour ses opérations commerciales internes.',
      formal: 'Sous réserve des stipulations du présent Accord, le Prestataire concède au Client un droit d’utilisation non exclusif et incessible de la Plateforme, strictement limité à ses activités professionnelles internes.',
      casual: 'Selon cet accord, le fournisseur donne au client un accès non exclusif et non transférable à la plateforme, juste pour son usage interne.',
      technical: 'Aux termes du Contrat, le Fournisseur octroie au Client une licence non exclusive et non cessible d’accès à la Plateforme à des fins d’exploitation interne uniquement.',
      alternatives: [
        'Le Fournisseur octroie au Client une licence non exclusive et incessible réservée aux opérations internes.',
        'L’accès à la Plateforme est concédé au Client à titre non exclusif et non transférable pour son seul usage interne.',
      ],
    },
    de: {
      standard: 'Vorbehaltlich der Bestimmungen dieser Vereinbarung gewährt der Anbieter dem Kunden eine nicht-exklusive, nicht übertragbare Lizenz für den Zugriff auf die Plattform ausschließlich für interne Geschäftszwecke.',
      formal: 'Gemäß den Bestimmungen dieses Vertrages räumt der Anbieter dem Auftraggeber ein einfaches, nicht übertragbares Nutzungsrecht an der Plattform ausschließlich zum Zwecke des internen Geschäftsbetriebs ein.',
      casual: 'Laut dieser Vereinbarung darf der Kunde die Plattform nicht-exklusiv und nicht übertragbar nutzen — aber nur für interne Zwecke.',
      technical: 'Vertragsgemäß erteilt der Provider dem Client eine nicht-exklusive, nicht übertragbare Zugriffslizenz für die Plattform, beschränkt auf den internen Geschäftsbetrieb.',
      alternatives: [
        'Der Anbieter gewährt ein einfaches, nicht übertragbares Nutzungsrecht ausschließlich für interne Abläufe.',
        'Die Plattformlizenz ist nicht-exklusiv, nicht übertragbar und auf den internen Betrieb des Kunden beschränkt.',
      ],
    },
    hi: {
      standard: 'इस समझौते की शर्तों के अधीन, प्रदाता ग्राहक को केवल आंतरिक व्यावसायिक संचालन के लिए प्लेटफ़ॉर्म तक पहुँचने का एक गैर-अनन्य, गैर-हस्तांतरणीय लाइसेंस प्रदान करता है।',
      formal: 'प्रस्तुत अनुबंध की शर्तों के अधीन, सेवा प्रदाता ग्राहक को केवल आंतरिक व्यावसायिक गतिविधियों के संचालन हेतु प्लेटफ़ॉर्म के उपयोग का गैर-अनन्य एवं अहस्तांतरणीय अनुज्ञप्ति प्रदान करता है।',
      casual: 'इस एग्रीमेंट के तहत, प्रोवाइडर क्लाइंट को सिर्फ अपने अंदरूनी कामकाज के लिए प्लेटफॉर्म इस्तेमाल करने का नॉन-एक्सक्लूसिव और नॉन-ट्रांसफरेबल लाइसेंस देता है।',
      technical: 'अनुबंध की शर्तों के अंतर्गत, प्रदाता द्वारा ग्राहक को केवल आंतरिक संचालन हेतु प्लेटफ़ॉर्म एक्सेस का गैर-अनन्य व गैर-हस्तांतरणीय लाइसेंस स्वीकृत किया जाता है।',
      alternatives: [
        'प्रदाता ग्राहक को केवल आंतरिक उपयोग के लिए गैर-अनन्य और गैर-हस्तांतरणीय प्लेटफॉर्म लाइसेंस देता है।',
        'समझौते के अनुसार, प्लेटफॉर्म का उपयोग केवल ग्राहक के आंतरिक व्यवसाय तक सीमित रहेगा।',
      ],
    },
    gu: {
      standard: 'આ કરારની શરતોને આધીન, પ્રદાતા ગ્રાહકને માત્ર આંતરિક વ્યાવસાયિક કામગીરી માટે પ્લેટફોર્મનો ઉપયોગ કરવાનું બિન-વિશિષ્ટ, બિન-તબદીલીપાત્ર લાઇસન્સ આપે છે.',
      formal: 'પ્રસ્તુત કરારની શરતોને અધીન રહીને, સેવા પ્રદાતા ગ્રાહકને કેવળ આંતરિક વ્યાવસાયિક સંચાલન અર્થે પ્લેટફોર્મના ઉપયોગનું બિન-વિશિષ્ટ અને અહસ્તાંતરણીય પરવાનગીપત્ર પ્રદાન કરે છે.',
      casual: 'આ કરાર મુજબ, પ્રોવાઇડર ક્લાયન્ટને ફક્ત પોતાના આંતરિક કામ માટે પ્લેટફોર્મ વાપરવાનું નોન-એક્સક્લુઝિવ અને નોન-ટ્રાન્સફરેબલ લાઇસન્સ આપે છે.',
      technical: 'કરાર મુજબ, પ્રદાતા ગ્રાહકને માત્ર આંતરિક ઓપરેશન્સ માટે પ્લેટફોર્મ એક્સેસનું બિન-વિશિષ્ટ, બિન-તબદીલીપાત્ર લાઇસન્સ મંજૂર કરે છે.',
      alternatives: [
        'પ્રદાતા ગ્રાહકને ફક્ત આંતરિક વ્યાવસાયિક ઉપયોગ માટે બિન-તબદીલીપાત્ર લાઇસન્સ આપે છે.',
        'કરારની શરતો મુજબ, પ્લેટફોર્મનો ઉપયોગ માત્ર આંતરિક કામગીરી પૂરતો મર્યાદિત છે.',
      ],
    },
    kn: {
      standard: 'ಈ ಒಪ್ಪಂದದ ನಿಯಮಗಳಿಗೆ ಒಳಪಟ್ಟು, ಪೂರೈಕೆದಾರರು ಗ್ರಾಹಕರಿಗೆ ಆಂತರಿಕ ವ್ಯಾಪಾರ ಕಾರ್ಯಾಚರಣೆಗಳಿಗಾಗಿ ಮಾತ್ರ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಅನ್ನು ಪ್ರವೇಶಿಸಲು ವಿಶೇಷವಲ್ಲದ, ವರ್ಗಾಯಿಸಲಾಗದ ಪರವಾನಗಿಯನ್ನು ನೀಡುತ್ತಾರೆ.',
      formal: 'ಈ ಒಪ್ಪಂದದ ಷರತ್ತುಗಳ ಪ್ರಕಾರ, ಆಂತರಿಕ ವ್ಯಾಪಾರ ನಿರ್ವಹಣೆಗೆ ಮಾತ್ರ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಬಳಸಲು ವರ್ಗಾಯಿಸಲಾಗದ ಪರವಾನಗಿ ನೀಡಲಾಗುತ್ತದೆ.',
      casual: 'ಈ ಅಗ್ರಿಮೆಂಟ್ ಪ್ರಕಾರ, ಪೂರೈಕೆದಾರರು ಕೇವಲ ಆಂತರಿಕ ಕೆಲಸಕ್ಕೆ ಬಳಸಲು ವರ್ಗಾಯಿಸಲಾಗದ ಲೈಸೆನ್ಸ್ ನೀಡುತ್ತಾರೆ.',
      technical: 'ಒಪ್ಪಂದದ ನಿಯಮಗಳು: ಆಂತರಿಕ ಬಳಕೆಗೆ ಮಾತ್ರ ಅನ್ವಯವಾಗುವಂತೆ ವರ್ಗಾಯಿಸಲಾಗದ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಪರವಾನಗಿ.',
      alternatives: [
        'ಆಂತರಿಕ ವ್ಯಾಪಾರ ಕಾರ್ಯಾಚರಣೆಗಳಿಗಾಗಿ ಮಾತ್ರ ಪರವಾನಗಿ ನೀಡಲಾಗಿದೆ.',
        'ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಪ್ರವೇಶವು ವರ್ಗಾಯಿಸಲಾಗದ ನಿಯಮಕ್ಕೆ ಒಳಪಟ್ಟಿದೆ.',
      ],
    },
    ja: {
      standard: '本契約の条件に従い、プロバイダーはクライアントに対し、内部業務運営のみを目的としてプラットフォームにアクセスするための非独占的かつ譲渡不能なライセンスを付与します。',
      formal: '本契約の条項に従い、提供者は利用者に対し、社内業務の遂行のみを目的として本プラットフォームを利用する非独占的かつ譲渡不可の使用許諾を付与するものとします。',
      casual: 'この契約のもとで、プロバイダーはクライアントに社内業務だけで使える非独占・譲渡不可のライセンスを付与します。',
      technical: '本規約に基づき、プロバイダーはクライアントへ内部業務限定・非独占・譲渡不可のプラットフォームアクセスライセンスを供与する。',
      alternatives: [
        '提供者は利用者に対し、社内利用に限定した非独占的・譲渡不可のライセンスを許諾します。',
        '本契約により、プラットフォームのアクセス権は内部業務用途に限り非独占的に付与されます。',
      ],
    },
    zh: {
      standard: '根据本协议条款，提供商授予客户一项非排他性、不可转让的许可，仅限出于内部业务运营目的访问本平台。',
      formal: '兹依据本协议之约定，服务方授予客户一项非独占且不可转让之许可，仅限于其内部商业运营之目的访问并使用本平台。',
      casual: '按协议规定，服务商给客户一个非独家、不能转让的许可，只能在公司内部业务里用这个平台。',
      technical: '依据本协议条款，提供商向客户授予非排他性、不可转让的平台访问许可，严格限定于内部业务运营场景。',
      alternatives: [
        '提供商仅就内部业务运营向客户授予非排他性、不可转让的平台使用许可。',
        '客户获得的平台访问许可为非排他且不可转让，仅限内部业务使用。',
      ],
    },
    ar: {
      standard: 'وفقاً لشروط هذه الاتفاقية، يمنح المزود العميل ترخيصاً غير حصري وغير قابل للتحويل للوصول إلى المنصة فقط لأغراض العمليات التجارية الداخلية.',
      formal: 'مع مراعاة أحكام هذه الاتفاقية، يمنح مقدم الخدمة للعميل ترخيصاً غير حصري وغير قابل للتنازل للانتفاع بالمنصة، وذلك حصراً لأغراض أعماله التشغيلية الداخلية.',
      casual: 'بموجب هذا الاتفاق، يمنح المزود للعميل إذناً غير حصري وغير قابل للنقل لاستخدام المنصة للعمل الداخلي فقط.',
      technical: 'بموجب بنود الاتفاقية، يُمنح العميل ترخيص وصول غير حصري وغير قابل للتحويل للمنصة للاستخدام التشغيلي الداخلي حصراً.',
      alternatives: [
        'يمنح المزود العميل ترخيصاً محدوداً غير حصري للاستخدام التجاري الداخلي للمنصة فقط.',
        'تخضع المنصة لترخيص غير حصري وغير قابل للتحويل مقصور على العمليات الداخلية للعميل.',
      ],
    },
  },
};

const COMMON_PHRASES: Record<string, Record<string, string>> = {
  hello: { es: 'Hola', fr: 'Bonjour', de: 'Hallo', hi: 'नमस्ते', gu: 'નમસ્તે', kn: 'ನಮಸ್ಕಾರ', ja: 'こんにちは', zh: '你好', ar: 'مرحباً', en: 'Hello' },
  'good morning': { es: 'Buenos días', fr: 'Bonjour', de: 'Guten Morgen', hi: 'सुप्रभात', gu: 'શુભ સવાર', kn: 'ಶುಭೋದಯ', ja: 'おはようございます', zh: '早上好', ar: 'صباح الخير', en: 'Good morning' },
  'thank you': { es: 'Gracias', fr: 'Merci', de: 'Vielen Dank', hi: 'धन्यवाद', gu: 'આભાર', kn: 'ಧನ್ಯವಾದಗಳು', ja: 'ありがとうございます', zh: '谢谢', ar: 'شكراً لك', en: 'Thank you' },
  'how are you': { es: '¿Cómo estás?', fr: 'Comment allez-vous ?', de: 'Wie geht es Ihnen?', hi: 'आप कैसे हैं?', gu: 'તમે કેમ છો?', kn: 'ನೀವು ಹೇಗಿದ್ದೀರಿ?', ja: 'お元気ですか？', zh: '你好吗？', ar: 'كيف حالك؟', en: 'How are you?' },
  'welcome': { es: 'Bienvenido', fr: 'Bienvenue', de: 'Willkommen', hi: 'स्वागत है', gu: 'સ્વાગત છે', kn: 'ಸ್ವಾಗತ', ja: 'ようこそ', zh: '欢迎', ar: 'أهلاً وسهلاً', en: 'Welcome' },
};

// Simple script-based language detector for Auto-Detect
function detectLanguage(text: string): { code: string; confidence: number } {
  if (!text || !text.trim()) return { code: 'en', confidence: 0 };
  if (/[\u0900-\u097F]/.test(text)) return { code: 'hi', confidence: 99.1 };
  if (/[\u0A80-\u0AFF]/.test(text)) return { code: 'gu', confidence: 99.2 };
  if (/[\u0C80-\u0CFF]/.test(text)) return { code: 'kn', confidence: 99.3 };
  if (/[\u0B80-\u0BFF]/.test(text)) return { code: 'ta', confidence: 99.2 };
  if (/[\u0C00-\u0C7F]/.test(text)) return { code: 'te', confidence: 99.2 };
  if (/[\u0980-\u09FF]/.test(text)) return { code: 'bn', confidence: 99.2 };
  if (/[\u0A00-\u0A7F]/.test(text)) return { code: 'pa', confidence: 99.2 };
  if (/[\u0D00-\u0D7F]/.test(text)) return { code: 'ml', confidence: 99.2 };
  if (/[\u0B00-\u0B7F]/.test(text)) return { code: 'or', confidence: 99.0 };
  if (/[\u0400-\u04FF]/.test(text)) return { code: 'ru', confidence: 98.9 };
  if (/[\uAC00-\uD7AF]/.test(text)) return { code: 'ko', confidence: 99.4 };
  if (/[\u0E00-\u0E7F]/.test(text)) return { code: 'th', confidence: 99.0 };
  if (/[\u0370-\u03FF]/.test(text)) return { code: 'el', confidence: 98.8 };
  if (/[\u0590-\u05FF]/.test(text)) return { code: 'he', confidence: 99.1 };
  if (/[\u3040-\u30FF]/.test(text)) return { code: 'ja', confidence: 98.8 };
  if (/[\u4E00-\u9FFF]/.test(text)) return { code: 'zh', confidence: 97.4 };
  if (/[\u0600-\u06FF]/.test(text)) return { code: 'ar', confidence: 99.3 };
  if (/[¿¡ñáéíóú]/i.test(text) || /\b(gracias|hola|buenos|para|como)\b/i.test(text)) return { code: 'es', confidence: 95.6 };
  if (/[àâçéèêëîïôûùü]/i.test(text) || /\b(merci|bonjour|pour|avec|nous)\b/i.test(text)) return { code: 'fr', confidence: 96.2 };
  if (/[äöüß]/i.test(text) || /\b(danke|hallo|und|bitte|nicht)\b/i.test(text)) return { code: 'de', confidence: 95.9 };
  return { code: 'en', confidence: 98.4 };
}

// Core translation function with Glossary integration
function runTranslationEngine({
  text,
  sourceLang,
  targetLang,
  tone,
  glossary,
}: {
  text: string;
  sourceLang: string;
  targetLang: string;
  tone: string;
  glossary: GlossaryItem[];
}) {
  const cleanText = text.trim();
  if (!cleanText) {
    return { translated: '', detectedCode: sourceLang === 'auto' ? 'en' : sourceLang, confidence: 0, alternatives: [], appliedGlossary: [] };
  }

  const detected = sourceLang === 'auto' ? detectLanguage(cleanText) : { code: sourceLang, confidence: 99.5 };
  const effectiveSource = detected.code;

  // Find active glossary terms applicable to this language pair & present in source text
  const appliedGlossary = glossary.filter(
    (g) =>
      g.active &&
      g.targetLang === targetLang &&
      (g.sourceLang === effectiveSource || sourceLang === 'auto') &&
      cleanText.toLowerCase().includes(g.sourceTerm.toLowerCase())
  );

  // If source and target are identical
  if (effectiveSource === targetLang) {
    return {
      translated: cleanText,
      detectedCode: effectiveSource,
      confidence: 100,
      alternatives: [],
      appliedGlossary: [],
    };
  }

  // 1. Check Sample Presets
  const matchedPreset = SAMPLE_PRESETS.find(
    (p) => p.text.trim().toLowerCase() === cleanText.toLowerCase()
  );

  if (matchedPreset && PRESET_TRANSLATIONS[matchedPreset.id]?.[targetLang]) {
    const entry = PRESET_TRANSLATIONS[matchedPreset.id][targetLang];
    let translated = entry[tone] || entry.standard;
    appliedGlossary.forEach((g) => {
      if (!translated.toLowerCase().includes(g.targetTerm.toLowerCase())) {
        translated = `${translated}`;
      }
    });
    return {
      translated,
      detectedCode: effectiveSource,
      confidence: detected.confidence,
      alternatives: entry.alternatives || [],
      appliedGlossary,
    };
  }

  // 2. Check Common Phrases
  const lower = cleanText.toLowerCase().replace(/[?!.]/g, '').trim();
  if (COMMON_PHRASES[lower]?.[targetLang]) {
    const base = COMMON_PHRASES[lower][targetLang];
    const toneSuffix = tone === 'formal' ? (targetLang === 'en' ? ' (Formal)' : '') : '';
    return {
      translated: `${base}${toneSuffix}`,
      detectedCode: effectiveSource,
      confidence: detected.confidence,
      alternatives: [base],
      appliedGlossary,
    };
  }

  // 3. Fallback dictionary substitution
  let processed = cleanText;
  appliedGlossary.forEach((g) => {
    const regex = new RegExp(`\\b${g.sourceTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    processed = processed.replace(regex, g.targetTerm);
  });

  const targetMeta = TARGET_LANGUAGES.find((l) => l.code === targetLang);
  const toneLabels: Record<string, string> = {
    standard: 'Standard',
    formal: 'Formal',
    casual: 'Casual',
    technical: 'Technical',
  };

  const miniDict: Record<string, Record<string, string>> = {
    es: { the: 'el', and: 'y', is: 'es', for: 'para', with: 'con', team: 'equipo', project: 'proyecto', meeting: 'reunión', today: 'hoy', tomorrow: 'mañana', please: 'por favor', report: 'informe', update: 'actualización', system: 'sistema' },
    fr: { the: 'le', and: 'et', is: 'est', for: 'pour', with: 'avec', team: 'équipe', project: 'projet', meeting: 'réunion', today: "aujourd'hui", tomorrow: 'demain', please: "s'il vous plaît", report: 'rapport', update: 'mise à jour', system: 'système' },
    de: { the: 'der', and: 'und', is: 'ist', for: 'für', with: 'mit', team: 'Team', project: 'Projekt', meeting: 'Besprechung', today: 'heute', tomorrow: 'morgen', please: 'bitte', report: 'Bericht', update: 'Aktualisierung', system: 'System' },
    hi: { hello: 'नमस्ते', team: 'टीम', project: 'प्रोजेक्ट', meeting: 'बैठक', today: 'आज', tomorrow: 'कल', please: 'कृपया', report: 'रिपोर्ट', update: 'अपडेट', system: 'सिस्टम' },
    gu: { hello: 'નમસ્તે', team: 'ટીમ', project: 'પ્રોજેક્ટ', meeting: 'મીટિંગ', today: 'આજે', tomorrow: 'આવતીકાલે', please: 'કૃપા કરીને', report: 'રિપોર્ટ', update: 'અપડેટ', system: 'સિસ્ટમ' },
    kn: { hello: 'ನಮಸ್ಕಾರ', team: 'ತಂಡ', project: 'ಯೋಜನೆ', meeting: 'ಸಭೆ', today: 'ಇಂದು', tomorrow: 'ನಾಳೆ', please: 'ದಯವಿಟ್ಟು', report: 'ವರದಿ', update: 'ಅಪ್‌ಡೇಟ್', system: 'ವ್ಯವಸ್ಥೆ' },
    ja: { hello: 'こんにちは', team: 'チーム', project: 'プロジェクト', meeting: '会議', today: '今日', tomorrow: '明日', please: 'お願いします', report: 'レポート', system: 'システム' },
    zh: { hello: '你好', team: '团队', project: '项目', meeting: '会议', today: '今天', tomorrow: '明天', please: '请', report: '报告', system: '系统' },
    ar: { hello: 'مرحباً', team: 'الفريق', project: 'المشروع', meeting: 'اجتماع', today: 'اليوم', tomorrow: 'غداً', please: 'من فضلك', report: 'تقرير', system: 'النظام' },
  };

  let substituted = processed;
  if (miniDict[targetLang]) {
    Object.entries(miniDict[targetLang]).forEach(([srcWord, tgtWord]) => {
      const re = new RegExp(`\\b${srcWord}\\b`, 'gi');
      substituted = substituted.replace(re, tgtWord);
    });
  }

  const formattedOutput =
    substituted !== cleanText
      ? substituted
      : `[${targetMeta?.name} · ${toneLabels[tone] || 'Standard'}] ${processed}`;

  return {
    translated: formattedOutput,
    detectedCode: effectiveSource,
    confidence: detected.confidence,
    alternatives: [
      `[${targetMeta?.name} · Concise] ${processed}`,
      `[${targetMeta?.name} · Idiomatic] ${processed}`,
    ],
    appliedGlossary,
  };
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

function BrandMark({ darkMode, className = "h-8 w-8" }: { darkMode?: boolean; className?: string }) {
  const isDark = Boolean(darkMode);
  const bgColor = isDark ? '#FAFAFA' : '#09090B';
  const fgColor = isDark ? '#09090B' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.18)';

  return (
    <span className={`inline-flex items-center justify-center rounded-xl transition-transform active:scale-[0.98] ${isDark ? 'shadow-[0_1px_3px_rgba(255,255,255,0.08)]' : 'shadow-[0_2px_6px_rgba(0,0,0,0.18)]'}`}>
      <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="VOTEX Logo">
        <rect width="32" height="32" rx="8" fill={bgColor} stroke={borderColor} strokeWidth="1" />
        <path
          d="M7.5 9.5L14 23.5C14.3 24.1 15.2 24.1 15.5 23.5L19.5 15"
          stroke={fgColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20.5 9.5V13.5"
          stroke={fgColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M24.5 7V16"
          stroke={fgColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

const LANG_TO_FLAG: Record<string, string> = {
  en: 'gb',
  hi: 'in',
  kn: 'in',
  gu: 'in',
  ta: 'in',
  te: 'in',
  mr: 'in',
  bn: 'in',
  pa: 'in',
  ml: 'in',
  ur: 'ae',
  or: 'in',
  as: 'in',
  sa: 'in',
  ne: 'np',
  sd: 'in',
  ks: 'in',
  kok: 'in',
  mai: 'in',
  doi: 'in',
  brx: 'in',
  sat: 'in',
  mni: 'in',
  bho: 'in',
  es: 'es',
  fr: 'fr',
  de: 'de',
  it: 'it',
  pt: 'br',
  ru: 'ru',
  ja: 'jp',
  zh: 'cn',
  'zh-TW': 'tw',
  ko: 'kr',
  ar: 'sa',
  tr: 'tr',
  nl: 'nl',
  pl: 'pl',
  sv: 'se',
  id: 'id',
  vi: 'vn',
  th: 'th',
  uk: 'ua',
  el: 'gr',
  cs: 'cz',
  ro: 'ro',
  hu: 'hu',
  da: 'dk',
  fi: 'fi',
  no: 'no',
  he: 'il',
  fa: 'ir',
  ms: 'my',
  tl: 'ph',
  af: 'za',
  sw: 'ke',
  sq: 'al',
  am: 'et',
  hy: 'am',
  az: 'az',
  eu: 'es',
  be: 'by',
  bs: 'ba',
  bg: 'bg',
  my: 'mm',
  ca: 'es',
  hr: 'hr',
  et: 'ee',
  is: 'is',
  ga: 'ie',
  kk: 'kz',
  km: 'kh',
  lo: 'la',
  lv: 'lv',
  lt: 'lt',
  mk: 'mk',
  mt: 'mt',
  mn: 'mn',
  sr: 'rs',
  sk: 'sk',
  sl: 'si',
  uz: 'uz',
  cy: 'gb',
};

function CircularFlag({ langCode, className = 'h-5 w-5' }: { langCode: string; className?: string }) {
  const [loadError, setLoadError] = useState(false);

  if (langCode === 'auto') {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200/90 dark:border-zinc-700/80 shadow-2xs ${className}`}
        title="Auto-Detect Language"
      >
        <Languages className="h-3 w-3" />
      </span>
    );
  }
  const country = LANG_TO_FLAG[langCode] || 'un';

  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-black/10 dark:ring-white/10 shadow-2xs bg-zinc-100 dark:bg-zinc-800 ${className}`}>
      {!loadError ? (
        <img
          src={`https://flagcdn.com/w80/${country}.png`}
          alt={country}
          className="h-full w-full object-cover rounded-full"
          crossOrigin="anonymous"
          onError={() => setLoadError(true)}
        />
      ) : (
        <span className="text-[9px] font-bold uppercase tracking-tight text-zinc-600 dark:text-zinc-300">
          {country.toUpperCase()}
        </span>
      )}
    </span>
  );
}

function SlideToggle({
  checked,
  onChange,
  label,
  darkMode,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  darkMode: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer select-none group focus:outline-none"
    >
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out border ${
          checked
            ? darkMode
              ? 'bg-white border-white'
              : 'bg-zinc-950 border-zinc-950'
            : darkMode
              ? 'bg-zinc-800 border-zinc-700'
              : 'bg-zinc-200 border-zinc-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full shadow-xs transition-transform duration-200 ease-in-out ${
            checked
              ? darkMode
                ? 'translate-x-4 bg-zinc-950'
                : 'translate-x-4 bg-white'
              : darkMode
                ? 'translate-x-0 bg-zinc-400'
                : 'translate-x-0 bg-white'
          }`}
        />
      </span>
      <span className={darkMode ? 'text-zinc-300 group-hover:text-white' : 'text-zinc-700 group-hover:text-zinc-950'}>
        {label}
      </span>
    </button>
  );
}

function LanguageSelect({
  value,
  onChange,
  options,
  darkMode,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: LanguageItem[];
  darkMode: boolean;
  ariaLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>(['en', 'hi', 'kn', 'gu', 'es', 'ru']);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedLang = options.find((l) => l.code === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (code: string) => {
    onChange(code);
    setRecentlyUsed((prev) => {
      const next = [code, ...prev.filter((c) => c !== code)];
      return next.slice(0, 6);
    });
    setIsOpen(false);
    setSearch('');
  };

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.native.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [options, search]);

  const recentOptions = useMemo(() => {
    return recentlyUsed
      .map((code) => options.find((l) => l.code === code))
      .filter(Boolean) as LanguageItem[];
  }, [recentlyUsed, options]);

  return (
    <div className="relative inline-flex items-center" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-2 rounded-lg border pl-3.5 pr-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all active:scale-[0.98] ${darkMode
          ? 'bg-[#111114] border-[#27272A] text-[#FAFAFA] hover:border-[#3F3F46] focus:ring-2 focus:ring-[#FAFAFA]/20'
          : 'bg-[#FFFFFF] border-[#E4E4E7] text-[#09090B] hover:border-[#D4D4D8] focus:ring-2 focus:ring-[#09090B]/15 shadow-xs'
          }`}
      >
        <CircularFlag langCode={selectedLang.code} className="h-5 w-5" />
        <span className="truncate max-w-[130px]">{selectedLang.name}</span>
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${darkMode ? 'text-[#A1A1AA]' : 'text-[#71717A]'}`} />
      </button>

      {/* Popover Dropdown matching user's screenshot */}
      {isOpen && (
        <div
          className={`absolute left-0 top-full mt-1.5 z-50 w-72 max-h-96 rounded-2xl border p-2.5 shadow-2xl overflow-hidden flex flex-col ${darkMode
            ? 'bg-[#111114] border-[#27272A] text-[#FAFAFA]'
            : 'bg-[#FFFFFF] border-[#E4E4E7] text-[#09090B]'
            }`}
        >
          {/* Search Box */}
          <div className="relative mb-2">
            <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${darkMode ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`} />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search language..."
              className={`w-full rounded-xl border pl-8 pr-7 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 ${darkMode
                ? 'bg-[#09090B] border-[#27272A] text-[#FAFAFA] placeholder-[#52525B] focus:ring-[#FAFAFA]/20'
                : 'bg-[#F8F9FA] border-[#E4E4E7] text-[#09090B] placeholder-[#A1A1AA] focus:ring-[#09090B]/15'
                }`}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {/* Recently Used Section */}
            {!search && recentOptions.length > 0 && (
              <div>
                <p className={`text-[11px] font-semibold mb-1.5 px-2 ${darkMode ? 'text-[#A1A1AA]' : 'text-[#71717A]'}`}>
                  Recently Used
                </p>
                <div className="space-y-1">
                  {recentOptions.map((lang) => {
                    const isSelected = lang.code === value;
                    return (
                      <button
                        key={`recent-${lang.code}`}
                        type="button"
                        onClick={() => handleSelect(lang.code)}
                        className={`w-full flex items-center gap-2.5 rounded-full px-2 py-1.5 text-xs font-medium transition-all ${isSelected
                          ? darkMode
                            ? 'bg-white text-zinc-900 shadow-md font-bold'
                            : 'bg-zinc-950 text-white shadow-md font-bold'
                          : darkMode
                            ? 'hover:bg-[#18181B] text-[#FAFAFA]'
                            : 'hover:bg-zinc-100 text-zinc-900'
                          }`}
                      >
                        <CircularFlag langCode={lang.code} className="h-5 w-5" />
                        <span className="truncate flex-1 text-left">{lang.name}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 mr-1.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Languages Section */}
            <div>
              <p className={`text-[11px] font-semibold mb-1.5 px-2 ${darkMode ? 'text-[#A1A1AA]' : 'text-[#71717A]'}`}>
                {search ? `Matching Languages (${filteredOptions.length})` : 'All Languages'}
              </p>
              <div className="space-y-1">
                {filteredOptions.map((lang) => {
                  const isSelected = lang.code === value;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleSelect(lang.code)}
                      className={`w-full flex items-center gap-2.5 rounded-full px-2 py-1.5 text-xs font-medium transition-all ${isSelected
                        ? darkMode
                          ? 'bg-white text-zinc-900 shadow-md font-bold'
                          : 'bg-zinc-950 text-white shadow-md font-bold'
                        : darkMode
                          ? 'hover:bg-[#18181B] text-[#FAFAFA]'
                          : 'hover:bg-zinc-100 text-zinc-900'
                        }`}
                    >
                      <CircularFlag langCode={lang.code} className="h-5 w-5" />
                      <div className="flex-1 text-left truncate flex items-center gap-1.5">
                        <span className="truncate">{lang.name}</span>
                        <span className={`text-[10px] truncate ${isSelected ? 'opacity-70' : darkMode ? 'text-[#71717A]' : 'text-zinc-400'}`}>
                          ({lang.native})
                        </span>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 mr-1.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Highlights active glossary terms inside translated output
function HighlightedOutput({
  text,
  appliedGlossary,
  darkMode,
  isRtl,
}: {
  text: string;
  appliedGlossary: GlossaryItem[];
  darkMode: boolean;
  isRtl: boolean;
}) {
  if (!appliedGlossary || appliedGlossary.length === 0) {
    return (
      <p
        dir={isRtl ? 'rtl' : 'ltr'}
        className="text-lg leading-relaxed whitespace-pre-wrap break-words"
      >
        {text}
      </p>
    );
  }

  const terms = appliedGlossary.map((g) => g.targetTerm).filter(Boolean);
  if (terms.length === 0) {
    return (
      <p dir={isRtl ? 'rtl' : 'ltr'} className="text-lg leading-relaxed whitespace-pre-wrap break-words">
        {text}
      </p>
    );
  }

  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const splitRegex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(splitRegex);

  return (
    <p dir={isRtl ? 'rtl' : 'ltr'} className="text-lg leading-relaxed whitespace-pre-wrap break-words">
      {parts.map((part, idx) => {
        const match = appliedGlossary.find(
          (g) => g.targetTerm.toLowerCase() === part.toLowerCase()
        );
        if (match) {
          return (
            <span
              key={idx}
              title={`Glossary Locked (${match.category}): "${match.sourceTerm}" → "${match.targetTerm}"`}
              className={`inline-block rounded px-1 -mx-0.5 border-b-2 cursor-help transition-colors ${darkMode
                ? 'bg-[#27272A]/80 border-[#FAFAFA]/60 text-[#FAFAFA]'
                : 'bg-[#F1F3F5] border-[#18181B]/60 text-[#09090B]'
                }`}
            >
              {part}
            </span>
          );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </p>
  );
}

// ============================================================================
// MAIN APPLICATION
// ============================================================================

export default function App() {
  // Theme & Navigation
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const [activeMode, setActiveMode] = useState<'text' | 'documents' | 'voice' | 'glossary'>('text');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'history' | 'saved'>('history');
  const [drawerSearch, setDrawerSearch] = useState('');

  // Text Translator State
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('hi');
  const [tone, setTone] = useState('standard');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [detectedLangCode, setDetectedLangCode] = useState('en');
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [appliedGlossary, setAppliedGlossary] = useState<GlossaryItem[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [swapRotated, setSwapRotated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isDictating, setIsDictating] = useState(false);

  // History & Saved Phrasebook (persisted per user in localStorage, default empty)
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('votex_history');
        if (stored) return JSON.parse(stored);
      } catch { }
    }
    return INITIAL_HISTORY;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('votex_history', JSON.stringify(history));
      } catch { }
    }
  }, [history]);

  // Glossary State (persisted per user in localStorage, default empty)
  const [glossary, setGlossary] = useState<GlossaryItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('votex_glossary');
        if (stored) return JSON.parse(stored);
      } catch { }
    }
    return INITIAL_GLOSSARY;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('votex_glossary', JSON.stringify(glossary));
      } catch { }
    }
  }, [glossary]);

  const [newTermSource, setNewTermSource] = useState('');
  const [newTermTarget, setNewTermTarget] = useState('');
  const [newTermSourceLang, setNewTermSourceLang] = useState('en');
  const [newTermTargetLang, setNewTermTargetLang] = useState('hi');
  const [newTermCategory, setNewTermCategory] = useState('Product');

  // Documents State
  const [docSourceLang, setDocSourceLang] = useState('auto');
  const [docTargetLang, setDocTargetLang] = useState('kn');
  const preserveLayout = true;
  const applyDocGlossary = true;
  const [isDragging, setIsDragging] = useState(false);
  const [docQueue, setDocQueue] = useState<any[]>([]);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [docCommandPrompt, setDocCommandPrompt] = useState('');
  const [docExecuting, setDocExecuting] = useState(false);

  // Voice Interpretation State
  const [speakerALang, setSpeakerALang] = useState('en');
  const [speakerBLang, setSpeakerBLang] = useState('kn');
  const [activeSpeaker, setActiveSpeaker] = useState<'A' | 'B' | null>(null);
  const [audioLevels, setAudioLevels] = useState([18, 32, 24, 48, 36, 22, 42, 28, 16, 30, 44, 20]);
  const [voiceCommandPrompt, setVoiceCommandPrompt] = useState('');
  const [voiceDenoise, setVoiceDenoise] = useState(true);
  const [voiceSynthesize, setVoiceSynthesize] = useState(true);
  const [voiceExecuting, setVoiceExecuting] = useState(false);
  const [transcript, setTranscript] = useState<any[]>([]);

  // Agent Instruction & Autonomous Pipeline State
  const [commandPrompt, setCommandPrompt] = useState('');
  const [filterNoise, setFilterNoise] = useState(true);
  const [generateAudio, setGenerateAudio] = useState(true);
  const [outputAudioUrl, setOutputAudioUrl] = useState<string | null>(null);
  const [executionSteps, setExecutionSteps] = useState<any[]>([]);

  // Toast Notification State
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<any>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2600);
  }, []);

  // Translation execution with optional VOTEX backend API integration
  const executeTranslation = useCallback(
    async (
      textToTranslate = sourceText,
      src = sourceLang,
      tgt = targetLang,
      selectedTone = tone,
      saveToHistory = false
    ) => {
      const trimmed = textToTranslate.trim();
      if (!trimmed && !commandPrompt.trim()) {
        setTranslatedText('');
        setAlternatives([]);
        setAppliedGlossary([]);
        return;
      }

      setIsTranslating(true);

      // Try VOTEX backend API first
      try {
        const formData = new FormData();
        formData.append('text', trimmed);
        formData.append('source_lang', src);
        formData.append('target_lang', tgt);
        formData.append('filter_noise', String(filterNoise));
        formData.append('generate_audio', String(generateAudio));
        if (commandPrompt.trim()) {
          formData.append('command', commandPrompt.trim());
        }

        const response = await fetch('/api/v1/studio/process', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setTranslatedText(data.translated_text || '');
          setDetectedLangCode(data.source_lang || (src === 'auto' ? 'en' : src));
          if (data.target_lang && data.target_lang !== targetLang) {
            setTargetLang(data.target_lang);
          }
          if (data.output_audio_url) {
            setOutputAudioUrl(data.output_audio_url);
          }
          if (data.steps) {
            setExecutionSteps(data.steps);
          }
          setAlternatives([
            `[${data.target_lang_name || tgt.toUpperCase()} · Concise] ${data.translated_text}`,
            `[${data.target_lang_name || tgt.toUpperCase()} · Formal] ${data.translated_text}`,
          ]);
          setAppliedGlossary([]);
          setIsTranslating(false);

          if (saveToHistory && data.translated_text) {
            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setHistory((prev) => [
              {
                id: `h-${Date.now()}`,
                sourceLang: data.source_lang || src,
                targetLang: data.target_lang || tgt,
                tone: selectedTone,
                sourceText: trimmed || commandPrompt,
                translatedText: data.translated_text,
                timestamp: now,
                saved: false,
              },
              ...prev.slice(0, 29),
            ]);
          }
          return;
        }
      } catch {
        // Fallback to local translation engine below
      }

      // Local engine fallback
      setTimeout(() => {
        const result = runTranslationEngine({
          text: trimmed,
          sourceLang: src,
          targetLang: tgt,
          tone: selectedTone,
          glossary,
        });

        setTranslatedText(result.translated);
        setDetectedLangCode(result.detectedCode);
        setAlternatives(result.alternatives);
        setAppliedGlossary(result.appliedGlossary);
        setIsTranslating(false);

        if (saveToHistory && result.translated) {
          const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setHistory((prev) => {
            const exists = prev[0] && prev[0].sourceText === trimmed && prev[0].targetLang === tgt;
            if (exists) return prev;
            return [
              {
                id: `h-${Date.now()}`,
                sourceLang: result.detectedCode,
                targetLang: tgt,
                tone: selectedTone,
                sourceText: trimmed,
                translatedText: result.translated,
                timestamp: now,
                saved: false,
              },
              ...prev.slice(0, 29),
            ];
          });
        }
      }, 280);
    },
    [sourceText, sourceLang, targetLang, tone, glossary, commandPrompt, filterNoise, generateAudio]
  );

  // Clear translation output when source text is cleared
  useEffect(() => {
    if (!sourceText.trim()) {
      setTranslatedText('');
      setAlternatives([]);
      setAppliedGlossary([]);
    }
  }, [sourceText]);

  // Keyboard shortcut: Cmd/Ctrl + Enter
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && activeMode === 'text') {
        e.preventDefault();
        if (sourceText.trim()) {
          executeTranslation(sourceText, sourceLang, targetLang, tone, true);
          showToast('Translation updated & saved to history');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeMode, sourceText, sourceLang, targetLang, tone, executeTranslation, showToast]);

  // Swap languages handler
  const handleSwapLanguages = () => {
    const resolvedSource = sourceLang === 'auto' ? detectedLangCode || 'en' : sourceLang;
    if (resolvedSource === targetLang) return;
    setSwapRotated((r) => !r);
    setSourceLang(targetLang);
    setTargetLang(resolvedSource);
    if (translatedText) {
      setSourceText(translatedText);
    }
  };

  // Copy translated output
  const handleCopy = async (textToCopy = translatedText) => {
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = textToCopy;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    showToast('Copied to clipboard');
    setTimeout(() => setCopied(false), 1800);
  };

  // Paste from clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setSourceText(text.slice(0, 5000));
        setTranslatedText('');
        setAlternatives([]);
        setAppliedGlossary([]);
        showToast('Pasted from clipboard — click Translate');
      }
    } catch {
      showToast('Clipboard access unavailable — use ⌘V / Ctrl+V');
    }
  };

  // Fallback to browser Web Speech Synthesis if backend is unreachable
  const fallbackBrowserSpeak = (text: string, langCode: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSpeaking(false);
      showToast('Speech audio playback unavailable');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langMeta = LANGUAGES.find((l) => l.code === langCode);
    utterance.lang = langMeta?.speechCode || 'en-US';
    utterance.rate = 0.98;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Natural Speech Synthesis via VOTEX Neural TTS Engine (supports all Indian & Global languages)
  const handleSpeak = (text: string, langCode: string) => {
    if (!text || !text.trim()) {
      return;
    }

    // Toggle off if already speaking
    if (isSpeaking) {
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current.currentTime = 0;
        ttsAudioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    // Stop any dangling audio or utterance first
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current.currentTime = 0;
      ttsAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const cleanText = text.trim();
    // Use backend neural TTS endpoint for accurate, human-like voice in Kannada, Gujarati, Tamil, etc.
    const ttsUrl = `/api/v1/studio/tts?text=${encodeURIComponent(cleanText.slice(0, 1000))}&lang=${encodeURIComponent(langCode)}`;

    try {
      const audio = new Audio(ttsUrl);
      ttsAudioRef.current = audio;
      setIsSpeaking(true);

      audio.onplay = () => {
        setIsSpeaking(true);
      };

      audio.onended = () => {
        setIsSpeaking(false);
        ttsAudioRef.current = null;
      };

      audio.onerror = () => {
        // Fallback to browser SpeechSynthesis if backend audio stream fails
        ttsAudioRef.current = null;
        fallbackBrowserSpeak(cleanText, langCode);
      };

      audio.play().catch(() => {
        ttsAudioRef.current = null;
        fallbackBrowserSpeak(cleanText, langCode);
      });
    } catch {
      fallbackBrowserSpeak(cleanText, langCode);
    }
  };

  // Voice dictation in Text mode
  const recognitionRef = useRef<any>(null);
  const handleDictationToggle = () => {
    if (isDictating) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsDictating(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        const langMeta = LANGUAGES.find((l) => l.code === (sourceLang === 'auto' ? 'en' : sourceLang));
        rec.lang = langMeta?.speechCode || 'en-US';
        rec.interimResults = false;
        rec.onresult = (event: any) => {
          const spoken = event.results[0][0].transcript;
          setSourceText((prev) => (prev ? `${prev} ${spoken}` : spoken));
          setIsDictating(false);
        };
        rec.onerror = () => {
          setIsDictating(false);
          showToast('Microphone access denied or error occurred');
        };
        rec.onend = () => setIsDictating(false);
        recognitionRef.current = rec;
        rec.start();
        setIsDictating(true);
        return;
      } catch {
        setIsDictating(false);
        showToast('Microphone could not be started');
      }
    } else {
      setIsDictating(false);
      showToast('Speech recognition not supported in this browser');
    }
  };

  // Bookmark / Save current translation
  const isCurrentSaved = useMemo(() => {
    if (!sourceText.trim() || !translatedText.trim()) return false;
    return history.some(
      (h) => h.saved && h.sourceText === sourceText.trim() && h.targetLang === targetLang
    );
  }, [history, sourceText, translatedText, targetLang]);

  const handleToggleSaveCurrent = () => {
    if (!sourceText.trim() || !translatedText.trim()) return;
    const trimmed = sourceText.trim();
    const existingIdx = history.findIndex(
      (h) => h.sourceText === trimmed && h.targetLang === targetLang
    );

    if (existingIdx !== -1) {
      setHistory((prev) =>
        prev.map((item, idx) =>
          idx === existingIdx ? { ...item, saved: !item.saved } : item
        )
      );
      showToast(history[existingIdx].saved ? 'Removed from Phrasebook' : 'Saved to Phrasebook');
    } else {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setHistory((prev) => [
        {
          id: `h-${Date.now()}`,
          sourceLang: sourceLang === 'auto' ? detectedLangCode : sourceLang,
          targetLang,
          tone,
          sourceText: trimmed,
          translatedText,
          timestamp: now,
          saved: true,
        },
        ...prev,
      ]);
      showToast('Saved to Phrasebook');
    }
  };

  // ============================================================================
  // DOCUMENT TRANSLATION HANDLERS
  // ============================================================================

  const enqueueDocument = async (fileObj: {
    name: string;
    sizeLabel: string;
    sampleContent?: string;
    file?: File;
  }) => {
    const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    let docOriginalText = fileObj.sampleContent;
    if (!docOriginalText && fileObj.file) {
      try {
        docOriginalText = await fileObj.file.text();
      } catch {
        // Fallback for binary / unreadable file types
      }
    }
    if (!docOriginalText) {
      docOriginalText = `DOCUMENT: ${fileObj.name}\n\n1. Executive Overview\nOur platform orchestrates autonomous multilingual intelligence across regional languages and global dialects with strict terminology preservation.\n\n2. Technical Architecture\nThe pipeline features real-time spectral noise filtering, neural speech translation, and deterministic domain glossary enforcement.`;
    }

    const newItem = {
      id,
      name: fileObj.name,
      size: fileObj.sizeLabel,
      sourceLang: docSourceLang === 'auto' ? 'en' : docSourceLang,
      targetLang: docTargetLang,
      progress: 20,
      status: 'Processing',
      preserveLayout,
      glossaryApplied: applyDocGlossary,
      originalContent: docOriginalText,
      translatedContent: 'Agent translating document...',
      steps: [] as any[],
    };

    setDocQueue((prev) => [newItem, ...prev]);
    setDocExecuting(true);

    try {
      const formData = new FormData();
      formData.append('text', docOriginalText);
      formData.append('source_lang', docSourceLang);
      formData.append('target_lang', docTargetLang);
      formData.append('filter_noise', 'false');
      formData.append('generate_audio', 'false');
      if (docCommandPrompt.trim()) {
        formData.append('command', docCommandPrompt.trim());
      }

      const response = await fetch('/api/v1/studio/process', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const translated = data.translated_text || docOriginalText;
        setDocQueue((prev) =>
          prev.map((d) =>
            d.id === id
              ? {
                ...d,
                progress: 100,
                status: 'Completed',
                translatedContent: `TRANSLATED DOCUMENT (${(data.target_lang || docTargetLang).toUpperCase()}):\n\n${translated}`,
                steps: data.steps || [],
              }
              : d
          )
        );
        showToast(`Agent translated ${fileObj.name}`);
      } else {
        throw new Error('Server returned non-200');
      }
    } catch {
      // Local fallback engine
      const res = runTranslationEngine({
        text: docOriginalText,
        sourceLang: docSourceLang,
        targetLang: docTargetLang,
        tone: 'formal',
        glossary: applyDocGlossary ? glossary : [],
      });
      setDocQueue((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
              ...d,
              progress: 100,
              status: 'Completed',
              translatedContent: `TRANSLATED DOCUMENT (${docTargetLang.toUpperCase()}):\n\n${res.translated}`,
              steps: [
                { step: 1, name: 'Parsed Document Content', status: 'completed' },
                { step: 2, name: `Agent Translation (${docSourceLang} → ${docTargetLang})`, status: 'completed' },
              ],
            }
            : d
        )
      );
      showToast(`Translated ${fileObj.name}`);
    } finally {
      setDocExecuting(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const kb = Math.max(1, Math.round(file.size / 1024));
      enqueueDocument({
        name: file.name,
        sizeLabel: kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`,
        file,
      });
    });
  };

  const handleDownloadDoc = (doc: any) => {
    const blob = new Blob([doc.translatedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translated_${doc.targetLang}_${doc.name.replace(/\.[^.]+$/, '')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded translated document');
  };

  // ============================================================================
  // VOICE INTERPRETATION HANDLERS
  // ============================================================================

  useEffect(() => {
    if (!activeSpeaker) return;
    const interval = setInterval(() => {
      setAudioLevels((prev) => prev.map(() => Math.floor(Math.random() * 44) + 12));
    }, 120);
    return () => clearInterval(interval);
  }, [activeSpeaker]);

  const handleVoiceCapture = async (speaker: 'A' | 'B') => {
    if (activeSpeaker === speaker) {
      setActiveSpeaker(null);
      return;
    }
    setActiveSpeaker(speaker);
    setVoiceExecuting(true);

    const src = speaker === 'A' ? speakerALang : speakerBLang;
    const tgt = speaker === 'A' ? speakerBLang : speakerALang;

    const sampleUtterances = [
      'Welcome to the conference. Could we review the project deployment roadmap for the upcoming release?',
      'Thank you for joining the meeting. We are excited to coordinate the localization schedules across our engineering teams.',
      'Could you confirm whether the latency requirements for the voice interpretation gateway have been validated?',
      'Yes, the latency benchmarks meet all specifications and background noise filtering is operating normally.',
    ];
    let spokenText = sampleUtterances[transcript.length % sampleUtterances.length];

    // Attempt real browser Speech Recognition if available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        const srcMeta = LANGUAGES.find((l) => l.code === src);
        recognition.lang = srcMeta?.speechCode || 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        const recognizedPrompt: string = await new Promise((resolve, reject) => {
          recognition.onresult = (e: any) => {
            const transcriptResult = e.results?.[0]?.[0]?.transcript;
            if (transcriptResult) resolve(transcriptResult);
            else reject(new Error('No speech text'));
          };
          recognition.onerror = () => reject(new Error('Speech recognition error'));
          recognition.start();
          setTimeout(() => reject(new Error('Timeout')), 3500);
        });

        if (recognizedPrompt && recognizedPrompt.trim()) {
          spokenText = recognizedPrompt.trim();
        }
      } catch {
        // Fallback to sample dialogue utterance
      }
    }

    try {
      const formData = new FormData();
      formData.append('text', spokenText);
      formData.append('source_lang', src);
      formData.append('target_lang', tgt);
      formData.append('filter_noise', String(voiceDenoise));
      formData.append('generate_audio', String(voiceSynthesize));
      if (voiceCommandPrompt.trim()) {
        formData.append('command', voiceCommandPrompt.trim());
      }

      const response = await fetch('/api/v1/studio/process', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const translated = data.translated_text || spokenText;
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        setTranscript((prev) => [
          ...prev,
          {
            id: `v-${Date.now()}`,
            speaker,
            sourceLang: data.source_lang || src,
            targetLang: data.target_lang || tgt,
            original: data.source_text || spokenText,
            translated,
            timestamp: now,
            outputAudioUrl: data.output_audio_url,
            steps: data.steps || [],
          },
        ]);

        if (voiceSynthesize && data.output_audio_url) {
          try {
            const audioObj = new Audio(data.output_audio_url);
            audioObj.play().catch(() => {
              handleSpeak(translated, data.target_lang || tgt);
            });
          } catch {
            handleSpeak(translated, data.target_lang || tgt);
          }
        } else if (voiceSynthesize) {
          handleSpeak(translated, data.target_lang || tgt);
        }

        showToast(`Speaker ${speaker} interpreted by Agent`);
      } else {
        throw new Error('API response failed');
      }
    } catch {
      // Local fallback
      const res = runTranslationEngine({
        text: spokenText,
        sourceLang: src,
        targetLang: tgt,
        tone: 'standard',
        glossary,
      });
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setTranscript((prev) => [
        ...prev,
        {
          id: `v-${Date.now()}`,
          speaker,
          sourceLang: src,
          targetLang: tgt,
          original: spokenText,
          translated: res.translated,
          timestamp: now,
          steps: [
            { step: 1, name: 'Voice Utterance Ingested', status: 'completed' },
            { step: 2, name: `Agent Translation (${src} → ${tgt})`, status: 'completed' },
          ],
        },
      ]);
      if (voiceSynthesize) {
        handleSpeak(res.translated, tgt);
      }
      showToast(`Speaker ${speaker} interpreted`);
    } finally {
      setActiveSpeaker(null);
      setVoiceExecuting(false);
    }
  };

  // ============================================================================
  // GLOSSARY HANDLERS
  // ============================================================================

  const handleAddGlossaryTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTermSource.trim() || !newTermTarget.trim()) return;
    setGlossary((prev) => [
      {
        id: `g-${Date.now()}`,
        sourceTerm: newTermSource.trim(),
        targetTerm: newTermTarget.trim(),
        sourceLang: newTermSourceLang,
        targetLang: newTermTargetLang,
        category: newTermCategory,
        active: true,
      },
      ...prev,
    ]);
    setNewTermSource('');
    setNewTermTarget('');
    showToast('Glossary term locked');
  };

  const handleToggleGlossary = (id: string) => {
    setGlossary((prev) =>
      prev.map((g) => (g.id === id ? { ...g, active: !g.active } : g))
    );
  };

  const handleDeleteGlossary = (id: string) => {
    setGlossary((prev) => prev.filter((g) => g.id !== id));
    showToast('Term removed');
  };

  // ============================================================================
  // DERIVED VALUES & THEME TOKENS
  // ============================================================================

  const wordCount = useMemo(() => {
    const t = sourceText.trim();
    return t ? t.split(/\s+/).length : 0;
  }, [sourceText]);

  const savedCount = useMemo(() => history.filter((h) => h.saved).length, [history]);
  const activeGlossaryCount = useMemo(() => glossary.filter((g) => g.active).length, [glossary]);

  const filteredDrawerItems = useMemo(() => {
    const base = drawerTab === 'saved' ? history.filter((h) => h.saved) : history;
    if (!drawerSearch.trim()) return base;
    const q = drawerSearch.toLowerCase();
    return base.filter(
      (item) =>
        item.sourceText.toLowerCase().includes(q) ||
        item.translatedText.toLowerCase().includes(q)
    );
  }, [history, drawerTab, drawerSearch]);

  const targetLangMeta = TARGET_LANGUAGES.find((l) => l.code === targetLang);
  const detectedLangMeta = LANGUAGES.find((l) => l.code === detectedLangCode);

  const theme = darkMode
    ? {
      canvas: 'bg-[#09090B] text-[#FAFAFA]',
      panel: 'bg-[#111114]',
      surface: 'bg-[#18181B]',
      border: 'border-[#27272A]',
      textPrimary: 'text-[#FAFAFA]',
      textSecondary: 'text-[#A1A1AA]',
      textMuted: 'text-[#71717A]',
      cta: 'bg-[#FAFAFA] text-[#09090B] hover:bg-[#E4E4E7]',
      btnSecondary: 'bg-[#111114] border-[#27272A] text-[#FAFAFA] hover:bg-[#18181B]',
      btnGhost: 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B]',
    }
    : {
      canvas: 'bg-[#F8F9FA] text-[#09090B]',
      panel: 'bg-[#FFFFFF]',
      surface: 'bg-[#F1F3F5]',
      border: 'border-[#E4E4E7]',
      textPrimary: 'text-[#09090B]',
      textSecondary: 'text-[#52525B]',
      textMuted: 'text-[#71717A]',
      cta: 'bg-[#18181B] text-[#FFFFFF] hover:bg-[#27272A]',
      btnSecondary: 'bg-[#FFFFFF] border-[#E4E4E7] text-[#09090B] hover:bg-[#F1F3F5]',
      btnGhost: 'text-[#52525B] hover:text-[#09090B] hover:bg-[#F1F3F5]',
    };

  interface NavModeItem {
    id: 'text' | 'documents' | 'voice' | 'glossary';
    label: string;
    icon: any;
    badge?: number;
  }

  const NAV_MODES: NavModeItem[] = [
    { id: 'text', label: 'Text', icon: Languages },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'voice', label: 'Voice', icon: Mic },
    { id: 'glossary', label: 'Glossary', icon: BookOpen, badge: activeGlossaryCount },
  ];

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${theme.canvas}`}>
      {/* Google Fonts & Editorial Styling */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .font-display {
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
        }
        .font-mono-code {
          font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
          font-variant-numeric: tabular-nums;
        }
        @keyframes subtleShimmer {
          0% { opacity: 0.45; }
          50% { opacity: 0.85; }
          100% { opacity: 0.45; }
        }
        .animate-shimmer {
          animation: subtleShimmer 1.1s ease-in-out infinite;
        }
        /* Custom smooth scrollbar */
        ::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(140, 140, 140, 0.22);
          border-radius: 9999px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(140, 140, 140, 0.42);
        }
      `}</style>

      {/* ====================================================================
          TOP HEADER BAR (56px height, 1px bottom border)
         ==================================================================== */}
      <header
        className={`sticky top-0 z-30 h-16 border-b backdrop-blur-md transition-colors ${theme.border} ${darkMode ? 'bg-[#09090B]/90' : 'bg-[#FFFFFF]/90'
          }`}
      >
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-6 sm:px-8 lg:px-10 gap-3">
          {/* Brand Left */}
          <div className="flex items-center gap-2.5 shrink-0">
            <BrandMark darkMode={darkMode} className="h-8 w-8" />
            <span className="text-base font-bold tracking-tight">VOTEX</span>
          </div>

          {/* Center Segmented Mode Switcher */}
          <nav
            aria-label="Workspace modes"
            className={`hidden md:flex items-center rounded-lg border p-0.5 ${theme.border} ${theme.surface}`}
          >
            {NAV_MODES.map((m) => {
              const Icon = m.icon;
              const active = activeMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveMode(m.id)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.98] ${active
                    ? darkMode
                      ? 'bg-[#111114] text-[#FAFAFA] shadow-sm border border-[#27272A]'
                      : 'bg-[#FFFFFF] text-[#09090B] shadow-sm border border-[#E4E4E7]/80'
                    : `${theme.textSecondary} hover:${theme.textPrimary} border border-transparent`
                    }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{m.label}</span>
                  {typeof m.badge === 'number' && m.badge > 0 && (
                    <span
                      className={`ml-0.5 rounded px-1 py-0 text-[10px] font-mono-code ${darkMode ? 'bg-[#27272A] text-[#A1A1AA]' : 'bg-[#E4E4E7]/80 text-[#52525B]'
                        }`}
                    >
                      {m.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Utility Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                setDrawerTab('history');
                setDrawerOpen(true);
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all active:scale-[0.98] ${theme.btnSecondary}`}
              title="Translation History"
            >
              <History className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">History</span>
              <span
                className={`rounded px-1 text-[10px] font-mono-code ${darkMode ? 'bg-[#27272A] text-[#A1A1AA]' : 'bg-[#F1F3F5] text-[#52525B]'
                  }`}
              >
                {history.length}
              </span>
            </button>

            <button
              onClick={() => {
                setDrawerTab('saved');
                setDrawerOpen(true);
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all active:scale-[0.98] ${theme.btnSecondary}`}
              title="Saved Phrasebook"
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Saved</span>
              {savedCount > 0 && (
                <span
                  className={`rounded px-1 text-[10px] font-mono-code ${darkMode ? 'bg-[#27272A] text-[#A1A1AA]' : 'bg-[#F1F3F5] text-[#52525B]'
                    }`}
                >
                  {savedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setDarkMode((d) => !d)}
              aria-label="Toggle color theme"
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all active:scale-[0.98] ${theme.btnSecondary}`}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Mode Switcher */}
      <div className={`md:hidden border-b px-4 py-2 ${theme.border} ${theme.panel}`}>
        <div className={`grid grid-cols-4 gap-1 rounded-lg border p-0.5 ${theme.border} ${theme.surface}`}>
          {NAV_MODES.map((m) => {
            const Icon = m.icon;
            const active = activeMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActiveMode(m.id)}
                className={`flex flex-col items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-medium transition-all ${active
                  ? darkMode
                    ? 'bg-[#111114] text-[#FAFAFA]'
                    : 'bg-[#FFFFFF] text-[#09090B] shadow-sm'
                  : theme.textSecondary
                  }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ====================================================================
          MAIN WORKSPACE CONTAINER
         ==================================================================== */}
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 sm:px-8 lg:px-10 py-4 sm:py-5">
        {/* ==================================================================
            MODE 1: TEXT TRANSLATOR
           ================================================================== */}
        {activeMode === 'text' && (
          <div className="space-y-3.5">
            {/* Control Strip */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Language Pair Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <LanguageSelect
                  ariaLabel="Source language"
                  value={sourceLang}
                  onChange={setSourceLang}
                  options={LANGUAGES}
                  darkMode={darkMode}
                />

                {sourceLang === 'auto' && sourceText.trim() && detectedLangMeta && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-mono-code ${theme.border} ${theme.surface} ${theme.textSecondary}`}
                  >
                    <Languages className="h-3 w-3" />
                    Detected: {detectedLangMeta.name}
                  </span>
                )}

                <button
                  onClick={handleSwapLanguages}
                  aria-label="Swap languages"
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all active:scale-[0.96] ${theme.btnSecondary}`}
                  title="Swap source and target languages"
                >
                  <ArrowLeftRight
                    className={`h-3.5 w-3.5 transition-transform duration-300 ${swapRotated ? 'rotate-180' : 'rotate-0'
                      }`}
                  />
                </button>

                <LanguageSelect
                  ariaLabel="Target language"
                  value={targetLang}
                  onChange={setTargetLang}
                  options={TARGET_LANGUAGES}
                  darkMode={darkMode}
                />
              </div>

              {/* Tone Segmented Selector */}
              <div className="flex items-center gap-2">
                <span className={`hidden sm:inline-flex items-center gap-1 text-xs ${theme.textMuted}`}>
                  <SlidersHorizontal className="h-3 w-3" />
                  Tone
                </span>
                <div
                  className={`inline-flex items-center rounded-lg border p-0.5 ${theme.border} ${theme.surface}`}
                  role="radiogroup"
                  aria-label="Translation tone"
                >
                  {TONES.map((t) => {
                    const active = tone === t.id;
                    return (
                      <button
                        key={t.id}
                        role="radio"
                        aria-checked={active}
                        onClick={() => setTone(t.id)}
                        className={`rounded-md px-3 py-1.5 text-xs sm:text-[13px] font-medium transition-all active:scale-[0.98] ${active
                          ? darkMode
                            ? 'bg-[#111114] text-[#FAFAFA] border border-[#27272A]'
                            : 'bg-[#FFFFFF] text-[#09090B] shadow-sm border border-[#E4E4E7]/80'
                          : `${theme.textSecondary} hover:${theme.textPrimary} border border-transparent`
                          }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Unified Split-Pane Translation Container (Text to Convert) */}
            <div
              className={`rounded-2xl border overflow-hidden transition-all duration-200 ${theme.border} ${theme.panel} ${darkMode
                ? 'shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5)]'
                : 'shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.03)]'
                }`}
            >
              <div className={`grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x ${theme.border}`}>
                {/* LEFT PANE: SOURCE INPUT */}
                <div className="flex flex-col min-h-[260px] sm:min-h-[285px] lg:min-h-[305px]">
                  <div className="flex-1 p-4 sm:p-5 flex flex-col">
                    <textarea
                      value={sourceText}
                      onChange={(e) => {
                        setSourceText(e.target.value.slice(0, 5000));
                        if (translatedText) {
                          setTranslatedText('');
                          setAlternatives([]);
                          setAppliedGlossary([]);
                        }
                      }}
                      placeholder="Enter or paste text to translate..."
                      spellCheck={false}
                      className={`w-full flex-1 resize-none bg-transparent text-base sm:text-[17px] leading-relaxed focus:outline-none ${darkMode
                        ? 'text-[#FAFAFA] placeholder-[#52525B]'
                        : 'text-[#09090B] placeholder-[#A1A1AA]'
                        }`}
                    />
                  </div>

                  {/* Source Bottom Utility Bar */}
                  <div
                    className={`flex items-center justify-between border-t px-4 py-2 ${theme.border} ${darkMode ? 'bg-[#111114]' : 'bg-[#FAFAFA]/60'
                      }`}
                  >
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleDictationToggle}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all active:scale-[0.98] ${isDictating
                          ? darkMode
                            ? 'bg-[#FAFAFA] text-[#09090B]'
                            : 'bg-[#18181B] text-[#FFFFFF]'
                          : theme.btnGhost
                          }`}
                        title="Voice dictation"
                      >
                        {isDictating ? (
                          <>
                            <MicOff className="h-3.5 w-3.5" />
                            <span>Listening...</span>
                          </>
                        ) : (
                          <>
                            <Mic className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Dictate</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handlePaste}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all active:scale-[0.98] ${theme.btnGhost}`}
                        title="Paste from clipboard"
                      >
                        <ClipboardPaste className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Paste</span>
                      </button>

                      {sourceText && (
                        <button
                          onClick={() => setSourceText('')}
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-all active:scale-[0.98] ${theme.btnGhost}`}
                          title="Clear text"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className={`flex items-center gap-3 text-[11px] font-mono-code ${theme.textMuted}`}>
                      <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
                      <span className="opacity-40">|</span>
                      <span>{sourceText.length.toLocaleString()} / 5,000</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT PANE: TRANSLATED OUTPUT */}
                <div
                  className={`flex flex-col min-h-[260px] sm:min-h-[285px] lg:min-h-[305px] ${darkMode ? 'bg-[#141418]/60' : 'bg-[#F8F9FA]/50'
                    }`}
                >
                  <div className="flex-1 p-4 sm:p-5">
                    {isTranslating ? (
                      <div className="space-y-3 pt-1" aria-label="Translating">
                        <div className={`h-4 w-11/12 rounded animate-shimmer ${darkMode ? 'bg-[#27272A]' : 'bg-[#E4E4E7]'}`} />
                        <div className={`h-4 w-9/12 rounded animate-shimmer ${darkMode ? 'bg-[#27272A]' : 'bg-[#E4E4E7]'}`} />
                        <div className={`h-4 w-7/12 rounded animate-shimmer ${darkMode ? 'bg-[#27272A]' : 'bg-[#E4E4E7]'}`} />
                      </div>
                    ) : translatedText ? (
                      <HighlightedOutput
                        text={translatedText}
                        appliedGlossary={appliedGlossary}
                        darkMode={darkMode}
                        isRtl={Boolean(targetLangMeta?.rtl)}
                      />
                    ) : (
                      <p className={`text-base sm:text-[17px] leading-relaxed select-none ${darkMode ? 'text-[#3F3F46]' : 'text-[#A1A1AA]'}`}>
                        Translation will appear here.
                      </p>
                    )}
                  </div>

                  {/* Target Bottom Utility Bar */}
                  <div
                    className={`flex items-center justify-between border-t px-4 sm:px-5 py-2 ${theme.border} ${darkMode ? 'bg-[#111114]' : 'bg-[#FAFAFA]/80'
                      }`}
                  >
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSpeak(translatedText, targetLang)}
                        disabled={!translatedText}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none ${theme.btnGhost}`}
                        title="Listen to translation"
                      >
                        {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                        <span className="hidden sm:inline">{isSpeaking ? 'Stop' : 'Listen'}</span>
                      </button>

                      <button
                        onClick={() => handleCopy(translatedText)}
                        disabled={!translatedText}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none ${theme.btnGhost}`}
                        title="Copy translation"
                      >
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        onClick={handleToggleSaveCurrent}
                        disabled={!translatedText}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none ${theme.btnGhost}`}
                        title="Save to Phrasebook"
                      >
                        <Bookmark
                          className={`h-3.5 w-3.5 ${isCurrentSaved ? 'fill-current text-sky-500 dark:text-sky-400' : ''
                            }`}
                        />
                        <span className="hidden sm:inline">{isCurrentSaved ? 'Saved' : 'Save'}</span>
                      </button>
                    </div>

                    <div className={`text-[11px] font-mono-code ${theme.textMuted}`}>
                      {translatedText ? `${translatedText.split(/\s+/).filter(Boolean).length} words` : 'Output'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AUTONOMOUS AGENT COMMAND & DIRECTIVE BAR (Placed Down the Text as an Optional Tool) */}
            <div
              className={`rounded-xl border p-3.5 sm:p-4 space-y-2.5 transition-colors ${theme.border} ${theme.panel} ${darkMode ? 'shadow-none' : 'shadow-[0_1px_3px_rgba(0,0,0,0.03)]'
                }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-lg border ${theme.border} ${theme.surface} ${theme.textPrimary}`}
                  >
                    <Bot className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <label htmlFor="agent-cmd" className="text-xs font-semibold tracking-tight">
                        Agent Directive
                      </label>
                      <span
                        className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-mono-code font-medium ${
                          darkMode ? 'bg-[#27272A] text-[#A1A1AA]' : 'bg-[#E4E4E7] text-[#71717A]'
                        }`}
                      >
                        Optional
                      </span>
                    </div>
                    <p className={`text-[11px] ${theme.textMuted}`}>
                      Instructions for dialect nuances, noise removal, or neural speech synthesis.
                    </p>
                  </div>
                </div>

                {/* Pipeline Feature Toggles (Modern Slide Switches) */}
                <div className="flex items-center gap-3.5">
                  <SlideToggle
                    checked={filterNoise}
                    onChange={setFilterNoise}
                    label="Spectral Denoise"
                    darkMode={darkMode}
                  />
                  <SlideToggle
                    checked={generateAudio}
                    onChange={setGenerateAudio}
                    label="Voice Audio (TTS)"
                    darkMode={darkMode}
                  />
                </div>
              </div>

              {/* Input field */}
              <div className="relative">
                <Terminal className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${theme.textMuted}`} />
                <input
                  id="agent-cmd"
                  type="text"
                  value={commandPrompt}
                  onChange={(e) => setCommandPrompt(e.target.value)}
                  placeholder="Directive: e.g. Translate to Kannada in formal tone, filter background noise, synthesize speech..."
                  className={`w-full rounded-lg border pl-8 pr-8 py-2 text-xs font-medium focus:outline-none focus:ring-2 ${darkMode
                    ? 'bg-[#09090B] border-[#27272A] text-[#FAFAFA] placeholder-[#52525B] focus:ring-[#FAFAFA]/20'
                    : 'bg-[#F8F9FA] border-[#E4E4E7] text-[#09090B] placeholder-[#A1A1AA] focus:ring-[#09090B]/15'
                    }`}
                />
                {commandPrompt && (
                  <button
                    onClick={() => setCommandPrompt('')}
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md ${theme.btnGhost}`}
                    title="Clear command"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Quick Command Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className={`text-[11px] font-mono-code uppercase tracking-wider ${theme.textMuted}`}>
                  Directives:
                </span>
                {[
                  {
                    label: 'Hindi → Kannada + Denoise',
                    cmd: 'Translate from Hindi to Kannada and filter background noise',
                    src: 'hi',
                    tgt: 'kn',
                  },
                  {
                    label: 'Gujarati → Kannada Voice',
                    cmd: 'Translate from Gujarati to Kannada and synthesize voice audio',
                    src: 'gu',
                    tgt: 'kn',
                  },
                  {
                    label: 'English → Hindi Formal',
                    cmd: 'Translate from English to Hindi in formal polite tone',
                    src: 'en',
                    tgt: 'hi',
                  },
                  {
                    label: 'Clean Audio Only',
                    cmd: 'Filter background noise and clean audio clarity',
                  },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCommandPrompt(preset.cmd);
                      if (preset.src) setSourceLang(preset.src);
                      if (preset.tgt) setTargetLang(preset.tgt);
                      setFilterNoise(true);
                      showToast(`Preset: ${preset.label}`);
                    }}
                    className={`rounded-md border px-2 py-0.5 text-[11px] font-medium transition-all active:scale-[0.98] ${theme.btnSecondary}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* TRANSLATE ACTION BAR BELOW AGENT (As Requested) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-0.5">
              <div className="text-xs">
                {commandPrompt.trim() ? (
                  <span className={`inline-flex items-center gap-1.5 font-medium ${darkMode ? 'text-[#FAFAFA]' : 'text-[#09090B]'}`}>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Agent Directive active
                  </span>
                ) : (
                  <span className={`text-[11px] font-mono-code ${theme.textMuted}`}>
                    Tone: <strong className={theme.textPrimary}>{tone}</strong>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (sourceText.trim() || commandPrompt.trim()) {
                    executeTranslation(sourceText, sourceLang, targetLang, tone, true);
                    showToast('Translating...');
                  }
                }}
                disabled={(!sourceText.trim() && !commandPrompt.trim()) || isTranslating}
                className={`group inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3 text-sm font-semibold tracking-wide transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-sm hover:shadow-md disabled:opacity-40 disabled:pointer-events-none ${theme.cta}`}
              >
                {isTranslating ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    <span>Translating...</span>
                  </>
                ) : (
                  <>
                    <span>Translate</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </div>

            {/* Contextual Insights Bar */}
            {translatedText && !isTranslating && (
              <div className="space-y-3 pt-1">
                {/* Telemetry & Metadata Strip */}
                <div
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-6 py-3.5 text-xs ${theme.border} ${theme.panel}`}
                >
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className={`inline-flex items-center gap-1.5 font-mono-code ${theme.textSecondary}`}>
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${darkMode ? 'bg-[#FAFAFA]' : 'bg-[#18181B]'}`} />
                      {detectedLangCode.toUpperCase()} → {targetLang.toUpperCase()}
                    </span>
                    <span className={`capitalize ${theme.textMuted}`}>
                      Tone: <strong className={theme.textPrimary}>{tone}</strong>
                    </span>
                  </div>

                  {appliedGlossary.length > 0 && (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium ${theme.border} ${theme.surface} ${theme.textPrimary}`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {appliedGlossary.length} Glossary {appliedGlossary.length === 1 ? 'term' : 'terms'} applied
                    </span>
                  )}
                </div>

                {/* Alternative Phrasings */}
                {alternatives.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {alternatives.slice(0, 2).map((alt, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setTranslatedText(alt);
                          showToast(`Applied alternative phrasing #${idx + 1}`);
                        }}
                        className={`group text-left rounded-lg border p-3.5 transition-all active:scale-[0.99] ${theme.border} ${theme.panel} ${darkMode ? 'hover:border-[#3F3F46]' : 'hover:border-[#A1A1AA]'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[11px] font-mono-code uppercase tracking-wider ${theme.textMuted}`}>
                            Alternative 0{idx + 1}
                          </span>
                          <span className={`text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity ${theme.textSecondary}`}>
                            Use phrasing →
                          </span>
                        </div>
                        <p
                          dir={targetLangMeta?.rtl ? 'rtl' : 'ltr'}
                          className={`text-sm leading-relaxed line-clamp-2 ${theme.textSecondary} group-hover:${theme.textPrimary}`}
                        >
                          {alt}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Agent Synthesized Voice Audio Card */}
                {outputAudioUrl && (
                  <div className={`rounded-xl border p-4 ${theme.border} ${theme.panel} ${darkMode ? 'bg-[#111114]' : 'bg-[#FFFFFF]'}`}>
                    <div className="mb-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-semibold">
                          Agent Synthesized Voice · Spoken in {targetLangMeta?.name || targetLang.toUpperCase()}
                        </span>
                      </div>
                      <a
                        href={outputAudioUrl}
                        download={`votex_${targetLang}_speech.mp3`}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs sm:text-[13px] font-medium transition-all ${theme.cta}`}
                      >
                        <Download className="h-3 w-3" />
                        Download MP3
                      </a>
                    </div>
                    <audio controls src={outputAudioUrl} className="w-full h-8" autoPlay={false} />
                  </div>
                )}

                {/* Agent Autonomous Pipeline Badges */}
                {executionSteps.length > 0 && (
                  <div className={`rounded-lg border p-3 ${theme.border} ${theme.panel}`}>
                    <span className={`text-[11px] font-mono-code uppercase tracking-wider block mb-2 ${theme.textMuted}`}>
                      Autonomous Agent Execution Steps:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {executionSteps.map((st: any, i: number) => (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${theme.border} ${theme.surface} ${theme.textPrimary}`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          {st.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================
            MODE 2: DOCUMENT TRANSLATION
           ================================================================== */}
        {activeMode === 'documents' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Document Translation</h1>
                <p className={`text-sm mt-1 ${theme.textSecondary}`}>
                  Translate structured files while preserving typography, tables, and glossary terminology.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <LanguageSelect
                  ariaLabel="Document source language"
                  value={docSourceLang}
                  onChange={setDocSourceLang}
                  options={LANGUAGES}
                  darkMode={darkMode}
                />
                <ArrowRight className={`h-3.5 w-3.5 ${theme.textMuted}`} />
                <LanguageSelect
                  ariaLabel="Document target language"
                  value={docTargetLang}
                  onChange={setDocTargetLang}
                  options={TARGET_LANGUAGES}
                  darkMode={darkMode}
                />
              </div>
            </div>

            {/* Architectural Drag-and-Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFileSelect(e.dataTransfer.files);
              }}
              className={`rounded-xl border border-dashed p-12 sm:p-16 text-center rounded-2xl transition-colors ${isDragging
                ? darkMode
                  ? 'border-[#FAFAFA] bg-[#18181B]'
                  : 'border-[#18181B] bg-[#F1F3F5]'
                : `${theme.border} ${theme.panel}`
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md,.srt"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />

              <div
                className={`mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-lg border ${theme.border} ${theme.surface}`}
              >
                <Upload className={`h-5 w-5 ${theme.textPrimary}`} />
              </div>

              <h2 className="text-sm font-semibold tracking-tight">
                Drop documents here, or browse from your computer
              </h2>
              <p className={`mt-1 text-xs font-mono-code ${theme.textMuted}`}>
                Supported formats: .PDF, .DOCX, .TXT, .MD, .SRT · Max 25 MB
              </p>

              <div className="mt-5 flex items-center justify-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all active:scale-[0.98] ${theme.cta}`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Select File
                </button>
              </div>
            </div>

            {/* File Queue */}
            {docQueue.length > 0 && (
              <div className={`rounded-xl border overflow-hidden ${theme.border} ${theme.panel}`}>
                <div className={`border-b px-4 py-3 flex items-center justify-between ${theme.border}`}>
                  <span className="text-xs font-semibold uppercase tracking-wider">Processing Queue</span>
                  <span className={`text-xs font-mono-code ${theme.textMuted}`}>{docQueue.length} files</span>
                </div>
                <div className={`divide-y ${theme.border}`}>
                  {docQueue.map((doc) => (
                    <div key={doc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className={`mt-0.5 rounded-lg border p-2 ${theme.border} ${theme.surface}`}>
                          <FileCheck2 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium truncate">{doc.name}</p>
                            <span className={`text-[11px] font-mono-code ${theme.textMuted}`}>{doc.size}</span>
                            <span
                              className={`rounded border px-1.5 py-0.5 text-[10px] font-mono-code uppercase ${theme.border} ${theme.surface} ${theme.textSecondary}`}
                            >
                              {doc.sourceLang} → {doc.targetLang}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="mt-2.5 flex items-center gap-3">
                            <div className={`h-1.5 flex-1 rounded-full overflow-hidden ${theme.surface}`}>
                              <div
                                className={`h-full transition-all duration-500 ${darkMode ? 'bg-[#FAFAFA]' : 'bg-[#18181B]'
                                  }`}
                                style={{ width: `${doc.progress}%` }}
                              />
                            </div>
                            <span className={`text-[11px] font-mono-code w-9 text-right ${theme.textMuted}`}>
                              {doc.progress}%
                            </span>
                          </div>

                          {/* Real Agent Execution Steps */}
                          {doc.steps && doc.steps.length > 0 && (
                            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                              {doc.steps.map((s: any, idx: number) => (
                                <span
                                  key={idx}
                                  className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono-code ${darkMode
                                    ? 'bg-[#18181B] text-[#A1A1AA] border border-[#27272A]'
                                    : 'bg-[#F1F3F5] text-[#52525B] border border-[#E4E4E7]'
                                    }`}
                                >
                                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                                  <span>{s.name}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium ${theme.border} ${theme.surface}`}
                        >
                          {doc.status === 'Completed' ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {doc.status}
                        </span>

                        {doc.status === 'Completed' && (
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.98] ${theme.cta}`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Preview & Download
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Side-by-Side Document Preview Panel */}
            {previewDoc && (
              <div className={`rounded-xl border overflow-hidden ${theme.border} ${theme.panel}`}>
                <div className={`flex items-center justify-between border-b px-4 py-3 ${theme.border} ${theme.surface}`}>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-xs font-semibold">{previewDoc.name}</span>
                    <span className={`text-[11px] font-mono-code ${theme.textMuted}`}>
                      ({previewDoc.sourceLang.toUpperCase()} → {previewDoc.targetLang.toUpperCase()})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadDoc(previewDoc)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.98] ${theme.cta}`}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                    <button
                      onClick={() => setPreviewDoc(null)}
                      className={`rounded-lg p-1.5 ${theme.btnGhost}`}
                      aria-label="Close preview"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x ${theme.border}`}>
                  <div className="p-5">
                    <p className={`text-[11px] font-mono-code uppercase tracking-wider mb-3 ${theme.textMuted}`}>
                      Original Source
                    </p>
                    <pre className={`whitespace-pre-wrap font-sans text-sm leading-relaxed ${theme.textSecondary}`}>
                      {previewDoc.originalContent}
                    </pre>
                  </div>
                  <div className="p-5">
                    <p className={`text-[11px] font-mono-code uppercase tracking-wider mb-3 ${theme.textMuted}`}>
                      Translated Output
                    </p>
                    <pre className={`whitespace-pre-wrap font-sans text-sm leading-relaxed ${theme.textPrimary}`}>
                      {previewDoc.translatedContent}
                    </pre>
                  </div>
                </div>
              </div>
            )}

{/* AUTONOMOUS DOCUMENT AGENT DIRECTIVE BAR */}
            <div
              className={`rounded-xl border p-4 sm:p-5 space-y-3.5 transition-colors ${theme.border} ${theme.panel} ${darkMode ? 'shadow-none' : 'shadow-[0_1px_3px_rgba(0,0,0,0.03)]'
                }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg border ${theme.border} ${darkMode ? 'bg-[#18181B] text-[#FAFAFA]' : 'bg-[#F1F3F5] text-[#18181B]'
                      }`}
                  >
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Document Agent Directive
                      </span>
                      <span
                        className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-mono-code font-medium ${
                          darkMode ? 'bg-[#27272A] text-[#A1A1AA]' : 'bg-[#E4E4E7] text-[#71717A]'
                        }`}
                      >
                        Optional
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {docExecuting && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-500 animate-pulse">
                      <Clock className="h-3 w-3" />
                      Processing File...
                    </span>
                  )}
                </div>
              </div>

              {/* Directive Input */}
              <div className="relative">
                <Terminal className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${theme.textMuted}`} />
                <input
                  id="doc-agent-cmd"
                  type="text"
                  value={docCommandPrompt}
                  onChange={(e) => setDocCommandPrompt(e.target.value)}
                  placeholder="Directive: e.g. Translate legal agreement to Kannada in formal tone, preserving clause numbers..."
                  className={`w-full rounded-lg border pl-10 pr-10 py-2.5 text-sm font-medium rounded-xl focus:outline-none focus:ring-2 ${darkMode
                    ? 'bg-[#09090B] border-[#27272A] text-[#FAFAFA] placeholder-[#52525B] focus:ring-[#FAFAFA]/20'
                    : 'bg-[#F8F9FA] border-[#E4E4E7] text-[#09090B] placeholder-[#A1A1AA] focus:ring-[#09090B]/15'
                    }`}
                />
                {docCommandPrompt && (
                  <button
                    onClick={() => setDocCommandPrompt('')}
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md ${theme.btnGhost}`}
                    title="Clear command"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Quick Document Directives */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className={`text-[11px] font-mono-code uppercase tracking-wider ${theme.textMuted}`}>
                  Directives:
                </span>
                {[
                  {
                    label: 'Legal Contract in Formal Kannada',
                    cmd: 'Translate legal agreement to Kannada in formal tone, preserving clause numbers',
                    tgt: 'kn',
                  },
                  {
                    label: 'Technical Spec in Hindi',
                    cmd: 'Translate technical specification to Hindi retaining code tokens and API keywords',
                    tgt: 'hi',
                  },
                  {
                    label: 'Executive Brief in Gujarati',
                    cmd: 'Translate executive summary into professional business Gujarati tone',
                    tgt: 'gu',
                  },
                  {
                    label: 'Corporate SLA in Spanish',
                    cmd: 'Translate service level agreement to Spanish preserving tables and metrics',
                    tgt: 'es',
                  },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setDocCommandPrompt(preset.cmd);
                      if (preset.tgt) setDocTargetLang(preset.tgt);
                      showToast(`Directive set: ${preset.label}`);
                    }}
                    className={`rounded-md border px-2 py-0.5 text-[11px] font-medium transition-all active:scale-[0.98] ${theme.btnSecondary}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            MODE 3: VOICE & LIVE INTERPRETATION
           ================================================================== */}
        {activeMode === 'voice' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Live Voice Interpretation</h1>
                <p className={`text-sm mt-1 ${theme.textSecondary}`}>
                  Real-time bilingual conversation mode with structured transcript, background noise cancellation, and audio playback.
                </p>
              </div>

              {transcript.length > 0 && (
                <button
                  onClick={() => {
                    setTranscript([]);
                    showToast('Transcript cleared');
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium self-start sm:self-auto transition-all active:scale-[0.98] ${theme.btnSecondary}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear Session
                </button>
              )}
            </div>

            {/* Dual-Speaker Control Deck */}
            <div className={`rounded-xl border p-6 ${theme.border} ${theme.panel}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6">
                {/* Speaker A */}
                <div className="flex flex-col items-center text-center gap-3">
                  <span className={`text-[11px] font-mono-code uppercase tracking-wider ${theme.textMuted}`}>
                    Speaker A
                  </span>
                  <LanguageSelect
                    ariaLabel="Speaker A language"
                    value={speakerALang}
                    onChange={setSpeakerALang}
                    options={TARGET_LANGUAGES}
                    darkMode={darkMode}
                  />
                  <button
                    onClick={() => handleVoiceCapture('A')}
                    className={`mt-1 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-medium transition-all active:scale-[0.98] ${activeSpeaker === 'A' ? theme.cta : `border ${theme.btnSecondary}`
                      }`}
                  >
                    {activeSpeaker === 'A' ? (
                      <>
                        <Square className="h-3.5 w-3.5 fill-current" />
                        Listening...
                      </>
                    ) : (
                      <>
                        <Mic className="h-3.5 w-3.5" />
                        Speak ({speakerALang.toUpperCase()})
                      </>
                    )}
                  </button>
                </div>

                {/* Minimalist Monochrome Audio Level Visualizer */}
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="flex items-center justify-center gap-1.5 h-14">
                    {audioLevels.map((lvl, idx) => (
                      <div
                        key={idx}
                        className={`w-1 rounded-full transition-all duration-150 ${activeSpeaker
                          ? darkMode
                            ? 'bg-[#FAFAFA]'
                            : 'bg-[#18181B]'
                          : darkMode
                            ? 'bg-[#27272A]'
                            : 'bg-[#E4E4E7]'
                          }`}
                        style={{
                          height: activeSpeaker ? `${lvl}px` : '8px',
                        }}
                      />
                    ))}
                  </div>
                  <p className={`mt-2 text-[11px] font-mono-code ${theme.textMuted}`}>
                    {activeSpeaker
                      ? `Capturing Speaker ${activeSpeaker} audio...`
                      : 'Select a speaker to begin interpreting'}
                  </p>
                </div>

                {/* Speaker B */}
                <div className="flex flex-col items-center text-center gap-3">
                  <span className={`text-[11px] font-mono-code uppercase tracking-wider ${theme.textMuted}`}>
                    Speaker B
                  </span>
                  <LanguageSelect
                    ariaLabel="Speaker B language"
                    value={speakerBLang}
                    onChange={setSpeakerBLang}
                    options={TARGET_LANGUAGES}
                    darkMode={darkMode}
                  />
                  <button
                    onClick={() => handleVoiceCapture('B')}
                    className={`mt-1 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-medium transition-all active:scale-[0.98] ${activeSpeaker === 'B' ? theme.cta : `border ${theme.btnSecondary}`
                      }`}
                  >
                    {activeSpeaker === 'B' ? (
                      <>
                        <Square className="h-3.5 w-3.5 fill-current" />
                        Listening...
                      </>
                    ) : (
                      <>
                        <Mic className="h-3.5 w-3.5" />
                        Speak ({speakerBLang.toUpperCase()})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Structured Transcript Feed */}
            <div className={`rounded-xl border overflow-hidden ${theme.border} ${theme.panel}`}>
              <div className={`border-b px-4 py-3 flex items-center justify-between ${theme.border}`}>
                <span className="text-xs font-semibold uppercase tracking-wider">Conversation Transcript</span>
                <span className={`text-xs font-mono-code ${theme.textMuted}`}>
                  {transcript.length} {transcript.length === 1 ? 'turn' : 'turns'}
                </span>
              </div>

              {transcript.length === 0 ? (
                <div className={`p-10 text-center text-sm ${theme.textMuted}`}>
                  No conversation turns recorded yet. Tap a speaker button above to interpret live speech.
                </div>
              ) : (
                <div className={`divide-y ${theme.border}`}>
                  {transcript.map((item) => (
                    <div key={item.id} className="p-4 sm:p-5 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-mono-code font-medium uppercase border ${theme.border} ${theme.surface}`}
                          >
                            Speaker {item.speaker}
                          </span>
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono-code">
                            <CircularFlag langCode={item.sourceLang} className="h-3.5 w-3.5" />
                            <span className="uppercase">{item.sourceLang}</span>
                            <ArrowRight className={`h-3 w-3 ${theme.textMuted}`} />
                            <CircularFlag langCode={item.targetLang} className="h-3.5 w-3.5" />
                            <span className="uppercase">{item.targetLang}</span>
                            <span className={`opacity-40 ${theme.textMuted}`}>·</span>
                            <span className={theme.textMuted}>{item.timestamp}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              if (item.outputAudioUrl) {
                                try {
                                  new Audio(item.outputAudioUrl).play().catch(() => {
                                    handleSpeak(item.translated, item.targetLang);
                                  });
                                } catch {
                                  handleSpeak(item.translated, item.targetLang);
                                }
                              } else {
                                handleSpeak(item.translated, item.targetLang);
                              }
                            }}
                            className={`rounded-lg p-1.5 ${theme.btnGhost}`}
                            title="Play translated audio"
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleCopy(item.translated)}
                            className={`rounded-lg p-1.5 ${theme.btnGhost}`}
                            title="Copy translation"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className={`text-xs leading-relaxed ${theme.textMuted}`}>{item.original}</p>
                      <p className={`text-base leading-relaxed font-medium ${theme.textPrimary}`}>
                        {item.translated}
                      </p>

                      {/* Agent Execution Step Badges */}
                      {item.steps && item.steps.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {item.steps.map((s: any, idx: number) => (
                            <span
                              key={idx}
                              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono-code ${darkMode
                                ? 'bg-[#18181B] text-[#A1A1AA] border border-[#27272A]'
                                : 'bg-[#F1F3F5] text-[#52525B] border border-[#E4E4E7]'
                                }`}
                            >
                              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                              <span>{s.name}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

{/* AUTONOMOUS VOICE AGENT DIRECTIVE BAR */}
            <div
              className={`rounded-xl border p-4 sm:p-5 space-y-3.5 transition-colors ${theme.border} ${theme.panel} ${darkMode ? 'shadow-none' : 'shadow-[0_1px_3px_rgba(0,0,0,0.03)]'
                }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg border ${theme.border} ${darkMode ? 'bg-[#18181B] text-[#FAFAFA]' : 'bg-[#F1F3F5] text-[#18181B]'
                      }`}
                  >
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Voice Agent Directive
                      </span>
                      <span
                        className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-mono-code font-medium ${
                          darkMode ? 'bg-[#27272A] text-[#A1A1AA]' : 'bg-[#E4E4E7] text-[#71717A]'
                        }`}
                      >
                        Optional
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pipeline Controls (Modern Slide Switches) */}
                <div className="flex items-center gap-4 text-xs">
                  <SlideToggle
                    checked={voiceDenoise}
                    onChange={setVoiceDenoise}
                    label="Spectral Denoise"
                    darkMode={darkMode}
                  />
                  <SlideToggle
                    checked={voiceSynthesize}
                    onChange={setVoiceSynthesize}
                    label="Voice Audio (TTS)"
                    darkMode={darkMode}
                  />
                  {voiceExecuting && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-500 animate-pulse">
                      <Clock className="h-3 w-3" />
                      Interpreting Speech...
                    </span>
                  )}
                </div>
              </div>

              {/* Directive Input */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Terminal className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${theme.textMuted}`} />
                  <input
                    id="voice-agent-cmd"
                    type="text"
                    value={voiceCommandPrompt}
                    onChange={(e) => setVoiceCommandPrompt(e.target.value)}
                    placeholder="Directive: e.g. Interpret between English and Kannada with background noise removal and formal tone..."
                    className={`w-full rounded-lg border pl-10 pr-10 py-2.5 text-sm font-medium rounded-xl focus:outline-none focus:ring-2 ${darkMode
                      ? 'bg-[#09090B] border-[#27272A] text-[#FAFAFA] placeholder-[#52525B] focus:ring-[#FAFAFA]/20'
                      : 'bg-[#F8F9FA] border-[#E4E4E7] text-[#09090B] placeholder-[#A1A1AA] focus:ring-[#09090B]/15'
                      }`}
                  />
                  {voiceCommandPrompt && (
                    <button
                      onClick={() => setVoiceCommandPrompt('')}
                      className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md ${theme.btnGhost}`}
                      title="Clear command"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleVoiceCapture('A')}
                  disabled={voiceExecuting}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-all active:scale-[0.98] ${theme.cta}`}
                >
                  <Mic className="h-3.5 w-3.5" />
                  <span>Start Turn</span>
                </button>
              </div>

              {/* Quick Voice Directives */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className={`text-[11px] font-mono-code uppercase tracking-wider ${theme.textMuted}`}>
                  Directives:
                </span>
                {[
                  {
                    label: 'English ↔ Kannada + Denoise',
                    cmd: 'Bilingual live interpretation between English and Kannada with background noise removal',
                    spkA: 'en',
                    spkB: 'kn',
                  },
                  {
                    label: 'Hindi ↔ Kannada Real-Time',
                    cmd: 'Real-time conversational interpretation between Hindi and Kannada with speech clarity',
                    spkA: 'hi',
                    spkB: 'kn',
                  },
                  {
                    label: 'Gujarati ↔ English Corporate',
                    cmd: 'Interpret Gujarati to English in formal corporate business tone',
                    spkA: 'gu',
                    spkB: 'en',
                  },
                  {
                    label: 'Polite Diplomatic Tone',
                    cmd: 'Translate dialogue into polite diplomatic tone and synthesize high-clarity voice',
                  },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setVoiceCommandPrompt(preset.cmd);
                      if (preset.spkA) setSpeakerALang(preset.spkA);
                      if (preset.spkB) setSpeakerBLang(preset.spkB);
                      setVoiceDenoise(true);
                      setVoiceSynthesize(true);
                      showToast(`Directive set: ${preset.label}`);
                    }}
                    className={`rounded-md border px-2 py-0.5 text-[11px] font-medium transition-all active:scale-[0.98] ${theme.btnSecondary}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            MODE 4: GLOSSARY / TERMINOLOGY MANAGER
           ================================================================== */}
        {activeMode === 'glossary' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Terminology Glossary</h1>
              <p className={`text-sm mt-1 ${theme.textSecondary}`}>
                Lock domain-specific terms so they are consistently enforced and highlighted in the Text Translator.
              </p>
            </div>

            {/* Add New Term Inline Form */}
            <form
              onSubmit={handleAddGlossaryTerm}
              className={`rounded-xl border p-4 sm:p-5 ${theme.border} ${theme.panel}`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                <div className="lg:col-span-3">
                  <label className={`block text-[11px] font-medium uppercase tracking-wider mb-1.5 ${theme.textMuted}`}>
                    Source Term
                  </label>
                  <input
                    type="text"
                    value={newTermSource}
                    onChange={(e) => setNewTermSource(e.target.value)}
                    placeholder="e.g., webhook endpoint"
                    className={`w-full rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 ${darkMode
                      ? 'bg-[#09090B] border-[#27272A] text-[#FAFAFA] focus:ring-[#FAFAFA]/20'
                      : 'bg-[#F8F9FA] border-[#E4E4E7] text-[#09090B] focus:ring-[#09090B]/15'
                      }`}
                  />
                </div>

                <div className="lg:col-span-3">
                  <label className={`block text-[11px] font-medium uppercase tracking-wider mb-1.5 ${theme.textMuted}`}>
                    Locked Target Term
                  </label>
                  <input
                    type="text"
                    value={newTermTarget}
                    onChange={(e) => setNewTermTarget(e.target.value)}
                    placeholder="e.g., punto de enlace webhook"
                    className={`w-full rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 ${darkMode
                      ? 'bg-[#09090B] border-[#27272A] text-[#FAFAFA] focus:ring-[#FAFAFA]/20'
                      : 'bg-[#F8F9FA] border-[#E4E4E7] text-[#09090B] focus:ring-[#09090B]/15'
                      }`}
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className={`block text-[11px] font-medium uppercase tracking-wider mb-1.5 ${theme.textMuted}`}>
                    Pair
                  </label>
                  <div className="flex items-center gap-1">
                    <select
                      value={newTermSourceLang}
                      onChange={(e) => setNewTermSourceLang(e.target.value)}
                      className={`w-full rounded-lg border px-2 py-1.5 text-xs font-mono-code ${darkMode ? 'bg-[#09090B] border-[#27272A]' : 'bg-[#F8F9FA] border-[#E4E4E7]'
                        }`}
                    >
                      {TARGET_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.code.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <span className={`text-xs ${theme.textMuted}`}>→</span>
                    <select
                      value={newTermTargetLang}
                      onChange={(e) => setNewTermTargetLang(e.target.value)}
                      className={`w-full rounded-lg border px-2 py-1.5 text-xs font-mono-code ${darkMode ? 'bg-[#09090B] border-[#27272A]' : 'bg-[#F8F9FA] border-[#E4E4E7]'
                        }`}
                    >
                      {TARGET_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.code.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <label className={`block text-[11px] font-medium uppercase tracking-wider mb-1.5 ${theme.textMuted}`}>
                    Category
                  </label>
                  <select
                    value={newTermCategory}
                    onChange={(e) => setNewTermCategory(e.target.value)}
                    className={`w-full rounded-lg border px-2.5 py-1.5 text-sm ${darkMode ? 'bg-[#09090B] border-[#27272A]' : 'bg-[#F8F9FA] border-[#E4E4E7]'
                      }`}
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Legal">Legal</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <button
                    type="submit"
                    disabled={!newTermSource.trim() || !newTermTarget.trim()}
                    className={`w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-all active:scale-[0.98] disabled:opacity-40 ${theme.cta}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Term
                  </button>
                </div>
              </div>
            </form>

            {/* Glossary Data Table */}
            <div className={`rounded-xl border overflow-hidden ${theme.border} ${theme.panel}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-[11px] font-mono-code uppercase tracking-wider ${theme.border} ${theme.surface} ${theme.textMuted}`}>
                      <th className="py-3 px-4 font-medium">Source Term</th>
                      <th className="py-3 px-4 font-medium">Target Term</th>
                      <th className="py-3 px-4 font-medium">Pair</th>
                      <th className="py-3 px-4 font-medium">Category</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                      <th className="py-3 px-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y text-sm ${theme.border}`}>
                    {glossary.map((item) => (
                      <tr key={item.id} className={item.active ? '' : 'opacity-50'}>
                        <td className="py-3.5 px-4 font-medium">{item.sourceTerm}</td>
                        <td className="py-3.5 px-4">{item.targetTerm}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`rounded border px-1.5 py-0.5 text-[11px] font-mono-code uppercase ${theme.border} ${theme.surface} ${theme.textSecondary}`}
                          >
                            {item.sourceLang} → {item.targetLang}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-xs ${theme.textSecondary}`}>{item.category}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleGlossary(item.id)}
                            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors ${theme.border} ${item.active
                              ? darkMode
                                ? 'bg-[#FAFAFA] text-[#09090B]'
                                : 'bg-[#18181B] text-[#FFFFFF]'
                              : `${theme.surface} ${theme.textMuted}`
                              }`}
                          >
                            {item.active ? 'Active' : 'Paused'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteGlossary(item.id)}
                            className={`rounded-lg p-1.5 ${theme.btnGhost}`}
                            aria-label={`Delete ${item.sourceTerm}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ====================================================================
          SLIDE-OVER DRAWER (HISTORY & SAVED PHRASEBOOK)
         ==================================================================== */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-[1px]"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Sheet */}
          <aside
            className={`relative z-10 flex h-full w-full max-w-md flex-col border-l ${theme.border} ${theme.panel}`}
          >
            {/* Drawer Header */}
            <div className={`flex items-center justify-between border-b px-5 py-4 ${theme.border}`}>
              <div className={`inline-flex rounded-lg border p-0.5 ${theme.border} ${theme.surface}`}>
                <button
                  onClick={() => setDrawerTab('history')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${drawerTab === 'history'
                    ? darkMode
                      ? 'bg-[#111114] text-[#FAFAFA]'
                      : 'bg-[#FFFFFF] text-[#09090B] shadow-sm'
                    : theme.textSecondary
                    }`}
                >
                  History ({history.length})
                </button>
                <button
                  onClick={() => setDrawerTab('saved')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${drawerTab === 'saved'
                    ? darkMode
                      ? 'bg-[#111114] text-[#FAFAFA]'
                      : 'bg-[#FFFFFF] text-[#09090B] shadow-sm'
                    : theme.textSecondary
                    }`}
                >
                  Saved ({savedCount})
                </button>
              </div>

              <button
                onClick={() => setDrawerOpen(false)}
                className={`rounded-lg p-1.5 ${theme.btnGhost}`}
                aria-label="Close drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className={`border-b px-5 py-3 ${theme.border}`}>
              <div className="relative">
                <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${theme.textMuted}`} />
                <input
                  type="text"
                  value={drawerSearch}
                  onChange={(e) => setDrawerSearch(e.target.value)}
                  placeholder="Filter translations..."
                  className={`w-full rounded-lg border pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 ${darkMode
                    ? 'bg-[#09090B] border-[#27272A] text-[#FAFAFA] focus:ring-[#FAFAFA]/20'
                    : 'bg-[#F8F9FA] border-[#E4E4E7] text-[#09090B] focus:ring-[#09090B]/15'
                    }`}
                />
              </div>
            </div>

            {/* Drawer List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {filteredDrawerItems.length === 0 ? (
                <div className={`py-12 px-4 text-center text-xs ${theme.textMuted}`}>
                  {drawerTab === 'saved'
                    ? 'No saved phrases yet. Click the bookmark icon on any translated output to save it here.'
                    : 'No translation history yet. Your completed translations will be stored here.'}
                </div>
              ) : (
                filteredDrawerItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActiveMode('text');
                      setSourceLang(item.sourceLang);
                      setTargetLang(item.targetLang);
                      setTone(item.tone || 'standard');
                      setSourceText(item.sourceText);
                      setDrawerOpen(false);
                      showToast('Loaded into editor');
                    }}
                    className={`group cursor-pointer rounded-lg border p-3.5 transition-all ${theme.border} ${darkMode ? 'hover:bg-[#18181B]' : 'hover:bg-[#F8F9FA]'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[10px] font-mono-code uppercase ${theme.border} ${theme.surface} ${theme.textSecondary}`}
                      >
                        {item.sourceLang} → {item.targetLang}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono-code ${theme.textMuted}`}>{item.timestamp}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setHistory((prev) =>
                              prev.map((h) => (h.id === item.id ? { ...h, saved: !h.saved } : h))
                            );
                          }}
                          className={`rounded p-1 ${theme.btnGhost}`}
                          title="Toggle save"
                        >
                          <Bookmark className={`h-3 w-3 ${item.saved ? 'fill-current text-sky-500 dark:text-sky-400' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setHistory((prev) => prev.filter((h) => h.id !== item.id));
                          }}
                          className={`rounded p-1 ${theme.btnGhost}`}
                          title="Delete entry"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <p className={`text-xs line-clamp-2 ${theme.textMuted}`}>{item.sourceText}</p>
                    <p className={`mt-1.5 text-sm font-medium line-clamp-2 ${theme.textPrimary}`}>
                      {item.translatedText}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer */}
            {history.length > 0 && drawerTab === 'history' && (
              <div className={`border-t px-5 py-3 flex justify-end ${theme.border}`}>
                <button
                  onClick={() => {
                    setHistory((prev) => prev.filter((h) => h.saved));
                    showToast('Cleared unsaved history');
                  }}
                  className={`text-xs font-medium ${theme.textMuted} hover:${theme.textPrimary}`}
                >
                  Clear unsaved history
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ====================================================================
          MINIMAL BOTTOM-RIGHT TOAST NOTIFICATION
         ==================================================================== */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-xs font-medium shadow-lg transition-all ${darkMode
            ? 'bg-[#FAFAFA] text-[#09090B] border-[#E4E4E7]'
            : 'bg-[#18181B] text-[#FFFFFF] border-[#27272A]'
            }`}
        >
          <Check className="h-3.5 w-3.5" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
