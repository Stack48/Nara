"use client";

import { useState } from "react";
import Link from "next/link";
import { unbounded } from "@/lib/fonts";
import { forgotPassword, confirmForgotPassword, logout } from "@/hooks/useAuth";
import { getAuthError } from "@/lib/auth-errors";
import "@/lib/amplify";

export default function ResetPasswordPage() {
    const [step, setStep] = useState<"email" | "code">("email");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await logout();
            await forgotPassword(email);
            setStep("code");
        } catch (err: unknown) {
            setError(getAuthError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await confirmForgotPassword(email, code, newPassword);
            setSuccess(true);
        } catch (err: unknown) {
            setError(getAuthError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white font-sans selection:bg-[#D90097]">
            <div className="w-full max-w-[480px] px-6">

                <h1 className={`${unbounded.className} text-3xl font-black mb-2 tracking-tight`}>
                    {success ? "Mot de passe" : "Réinitialiser"}{" "}
                    <span className="bg-gradient-to-r from-[#FFFFFF] from-[30%] to-[#CD2A9B] to-[100%] bg-clip-text text-transparent">
                        {success ? "mis à jour !" : "le mot de passe"}
                    </span>
                </h1>

                {success ? (
                    <div className="mt-6">
                        <p className="text-gray-400 text-sm mb-6">
                            Ton mot de passe a été modifié avec succès.
                        </p>
                        <Link
                            href="/login"
                            className="w-full block text-center bg-[#D90097] hover:bg-[#e60091] text-white px-10 py-3 rounded-full text-sm font-bold transition-all"
                        >
                            Se connecter
                        </Link>
                    </div>
                ) : step === "email" ? (
                    <>
                        <p className="text-gray-400 text-xs mb-6">
                            Entre ton email pour recevoir un code de réinitialisation.
                        </p>
                        {error && (
                            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                                {error}
                            </div>
                        )}
                        <form className="space-y-4" onSubmit={handleSendCode}>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-bold block">
                                    Adresse e-mail
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#D90097] focus:ring-1 focus:ring-[#D90097]/50 transition-all placeholder:text-white/20"
                                    placeholder="nom@exemple.com"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#D90097] hover:bg-[#e60091] disabled:opacity-50 text-white px-10 py-3 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5 shadow-[0_5px_15px_rgba(217,0,151,0.2)]"
                            >
                                {loading ? "Envoi..." : "Envoyer le code"}
                            </button>
                            <p className="text-center text-xs text-gray-400">
                                <Link href="/login" className="text-[#D90097] hover:underline underline-offset-4">
                                    Retour à la connexion
                                </Link>
                            </p>
                        </form>
                    </>
                ) : (
                    <>
                        <p className="text-gray-400 text-xs mb-6">
                            Code envoyé à <span className="text-white font-semibold">{email}</span>
                        </p>
                        {error && (
                            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                                {error}
                            </div>
                        )}
                        <form className="space-y-4" onSubmit={handleConfirm}>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-bold block">
                                    Code de confirmation
                                </label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="000000"
                                    required
                                    className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#D90097] focus:ring-1 focus:ring-[#D90097]/50 transition-all placeholder:text-white/20 text-center text-2xl tracking-[0.5em] font-mono"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-bold block">
                                    Nouveau mot de passe
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#D90097] focus:ring-1 focus:ring-[#D90097]/50 transition-all placeholder:text-white/20"
                                    placeholder="••••••••"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#D90097] hover:bg-[#e60091] disabled:opacity-50 text-white px-10 py-3 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5 shadow-[0_5px_15px_rgba(217,0,151,0.2)]"
                            >
                                {loading ? "Mise à jour..." : "Confirmer"}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}