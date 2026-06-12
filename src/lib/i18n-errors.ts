type ErrorTranslations = {
  [key: string]: {
    [lang: string]: string;
  };
};

const translations: ErrorTranslations = {
  internal_error: {
    fr: "Une erreur interne est survenue.",
    en: "An internal error occurred.",
    es: "Ocurrió un error interno.",
  },
  unauthorized: {
    fr: "Non autorisé. Clé API manquante ou invalide.",
    en: "Unauthorized. Missing or invalid API Key.",
    es: "No autorizado. Falta la clave de API o es inválida.",
  },
  rate_limit: {
    fr: "Trop de requêtes. Veuillez réessayer plus tard.",
    en: "Too many requests. Please try again later.",
    es: "Demasiadas peticiones. Por favor inténtelo más tarde.",
  },
  not_found: {
    fr: "Ressource introuvable.",
    en: "Resource not found.",
    es: "Recurso no encontrado.",
  },
  bad_request: {
    fr: "Requête invalide.",
    en: "Bad request.",
    es: "Petición inválida.",
  }
};

export function getTranslation(langHeader: string | null, errorKey: keyof typeof translations): string {
  let lang = 'fr'; // fallback par défaut
  
  if (langHeader) {
    if (langHeader.includes('en')) lang = 'en';
    else if (langHeader.includes('es')) lang = 'es';
  }

  return translations[errorKey]?.[lang] || translations[errorKey]?.['fr'] || "Erreur";
}
