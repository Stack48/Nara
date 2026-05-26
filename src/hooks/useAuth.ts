import {
    signIn,
    signUp,
    signOut,
    confirmSignUp,
    getCurrentUser,
    fetchAuthSession,
    resetPassword,
    confirmResetPassword,
} from "aws-amplify/auth";
import "@/lib/amplify";

// INSCRIPTION
export async function register(
    email: string,
    password: string,
    username: string,
    name: string
) {
    return await signUp({
        username: email,
        password,
        options: {
            userAttributes: {
                email,
                name,
                preferred_username: username,
            },
        },
    });
}

// CONFIRMATION CODE EMAIL
export async function confirmEmail(email: string, code: string) {
    return await confirmSignUp({ username: email, confirmationCode: code });
}

// CONNEXION
export async function login(email: string, password: string) {
    return await signIn({ username: email, password });
}

// DÉCONNEXION
export async function logout() {
    return await signOut();
}

// UTILISATEUR COURANT
export async function getUser() {
    try {
        return await getCurrentUser();
    } catch {
        return null;
    }
}

// TOKEN JWT (pour les appels API)
export async function getToken() {
    try {
        const session = await fetchAuthSession();
        return session.tokens?.idToken?.toString() ?? null;
    } catch {
        return null;
    }
}

// RESET MOT DE PASSE
export async function forgotPassword(email: string) {
    return await resetPassword({ username: email });
}

export async function confirmForgotPassword(
    email: string,
    code: string,
    newPassword: string
) {
    return await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword,
    });
}