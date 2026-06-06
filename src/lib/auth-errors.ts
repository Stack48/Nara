const COGNITO_ERROR_MAP: Record<string, string> = {
    NotAuthorizedException: "Email ou mot de passe incorrect.",
    UserNotConfirmedException: "Ton compte n'est pas encore confirmé.",
    UserNotFoundException: "Aucun compte trouvé avec cet email.",
    UsernameExistsException: "Un compte existe déjà avec cet email.",
    CodeMismatchException: "Code de confirmation incorrect.",
    ExpiredCodeException: "Ce code a expiré. Demandes-en un nouveau.",
    LimitExceededException: "Trop de tentatives. Réessaie dans quelques minutes.",
    InvalidPasswordException: "Mot de passe invalide (8 caractères min, majuscule, chiffre).",
    TooManyRequestsException: "Trop de requêtes. Patiente un moment.",
};

export function getAuthError(err: unknown): string {
    if (!(err instanceof Error)) return "Une erreur inattendue est survenue.";
    return COGNITO_ERROR_MAP[err.name] ?? "Une erreur est survenue. Réessaie.";
}

export function isAlreadyAuthenticated(err: unknown): boolean {
    return err instanceof Error && err.name === "UserAlreadyAuthenticatedException";
}