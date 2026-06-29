"use client";

export function getCognitoId(): string | null {
    if (typeof window !== "undefined") {
        const fromStorage = window.localStorage.getItem("nara:cognito-id");
        if (fromStorage && fromStorage.trim() !== "") return fromStorage.trim();
    }
    const fromEnv = process.env.NEXT_PUBLIC_COGNITO_ID;
    if (fromEnv && fromEnv.trim() !== "") return fromEnv.trim();
    return null;
}


export function authHeaders(): Record<string, string> {
    const id = getCognitoId();
    return id ? { "x-cognito-id": id } : {};
}