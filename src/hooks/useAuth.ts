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
import { prisma } from "@/lib/prisma";
import "@/lib/amplify";

// INSCRIPTION → enregistre dans Cognito ET en DB
export async function register(
    email: string,
    password: string,
    username: string,
    name: string
) {
    const result = await signUp({
        username,
        password,
        options: {
            userAttributes: {
                email,
                name,
                preferred_username: username,
            },
        },
    });

    return result;
}

// Après confirmation → enregistre en DB PostgreSQL
export async function syncUserToDB(
    cognitoId: string,
    email: string,
    name: string,
    username: string
) {
    const res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cognitoId, email, name, username }),
    });
    if (!res.ok) throw new Error("Erreur sync user");
    return await res.json();
}

// CONFIRMATION CODE EMAIL
export async function confirmEmail(username: string, code: string) {
    return await confirmSignUp({ username, confirmationCode: code });
}

// CONNEXION
export async function login(email: string, password: string) {
    try {
        await signOut();
    } catch {
        // ignore
    }
    return await signIn({ username: email, password });
}

// DÉCONNEXION — sans global pour ne pas déconnecter les autres appareils
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

// TOKEN JWT
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
    try {
        await signOut();
    } catch {
        // ignore
    }
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