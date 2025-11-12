// Simple i18n system for English and Spanish support

type Language = 'en' | 'es';

interface Translations {
  [key: string]: {
    en: string;
    es: string;
  };
}

const translations: Translations = {
  'offer.help': {
    en: 'Offer Help',
    es: 'Ofrecer Ayuda'
  },
  'offer.type': {
    en: 'Type of Help',
    es: 'Tipo de Ayuda'
  },
  'offer.submit': {
    en: 'Submit Offer',
    es: 'Enviar Oferta'
  },
  'offer.withdraw': {
    en: 'Withdraw Offer',
    es: 'Retirar Oferta'
  },
  'offer.return': {
    en: 'Initiate Return',
    es: 'Iniciar Devolución'
  },
  'offer.clarify': {
    en: 'Need Clarification',
    es: 'Necesita Aclaración'
  },
  'offer.resume': {
    en: 'Resume',
    es: 'Reanudar'
  },
  'status.clarifying': {
    en: 'Clarifying - Questions or additional information needed',
    es: 'Aclarando - Se necesitan preguntas o información adicional'
  },
  'report.abuse': {
    en: 'Report',
    es: 'Reportar'
  },
  'disclaimer.text': {
    en: '4MK only tracks communications through its website or app. External help or offline exchanges are not monitored or supported.',
    es: '4MK solo rastrea las comunicaciones a través de su sitio web o aplicación. La ayuda externa o los intercambios fuera de línea no son monitoreados ni respaldados.'
  },
  'common.cancel': {
    en: 'Cancel',
    es: 'Cancelar'
  },
  'common.submit': {
    en: 'Submit',
    es: 'Enviar'
  },
  'common.loading': {
    en: 'Loading...',
    es: 'Cargando...'
  }
};

let currentLanguage: Language = 'en';

export function setLanguage(lang: Language) {
  currentLanguage = lang;
  if (typeof window !== 'undefined') {
    localStorage.setItem('4mk_language', lang);
  }
}

export function getLanguage(): Language {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('4mk_language') as Language;
    if (stored === 'en' || stored === 'es') {
      return stored;
    }
  }
  return currentLanguage;
}

export function t(key: string, fallback?: string): string {
  const translation = translations[key];
  if (!translation) {
    return fallback || key;
  }
  return translation[getLanguage()] || translation.en || fallback || key;
}

// Initialize language from localStorage on load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('4mk_language') as Language;
  if (stored === 'en' || stored === 'es') {
    currentLanguage = stored;
  }
}




