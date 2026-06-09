"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { unbounded } from "@/lib/fonts";
import { login } from "@/hooks/useAuth";
import { getAuthError, isAlreadyAuthenticated } from "@/lib/auth-errors";
import "@/lib/amplify";

export default function ConnexionPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      if (isAlreadyAuthenticated(err)) {
        router.push("/dashboard");
      } else {
        setError(getAuthError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex text-white font-sans selection:bg-[#D90097] selection:text-white">

      {/* LEFT: Image */}
      <div className="hidden lg:block lg:w-1/2 p-4 h-screen sticky top-0">
        <div className="relative w-full h-full rounded-[2rem] overflow-hidden bg-[#111]">
          <Image
            src="/artist-1.png"
            alt="Producer in studio"
            fill
            sizes="50vw"
            className="object-cover grayscale"
            priority
          />
        </div>
      </div>

      {/* RIGHT: Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center p-6 sm:px-12 lg:px-20 lg:justify-center overflow-y-auto">
        <div className="w-full max-w-[480px] flex flex-col pt-4 pb-4">

          <h1 className={`${unbounded.className} text-3xl sm:text-4xl font-black mb-2 tracking-tight`}>
            Content <span className="bg-gradient-to-r from-[#FFFFFF] from-[30%] to-[#CD2A9B] to-[100%] bg-clip-text text-transparent">de te revoir !</span>
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mb-6 font-medium">
            Ton espace de création t'attend.
          </p>

          {/* Social Logins */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button className="flex-1 flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-xs font-semibold">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
              </svg>
              Se connecter avec Google
            </button>
            <button className="flex-1 flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-xs font-semibold">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className="w-4 h-4 text-white" fill="currentColor">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
              </svg>
              Se connecter avec Apple
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-white/30 text-[10px] uppercase font-bold tracking-[0.2em]">ou</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-bold block">
                Adresse e-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#D90097] focus:ring-1 focus:ring-[#D90097]/50 transition-all placeholder:text-white/20"
                placeholder="nom@exemple.com"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-bold block">
                  Mot de passe
                </label>
                <Link href="/reset-password" className="text-[10px] text-[#D90097] hover:underline underline-offset-4">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-2.5 pr-12 text-white focus:outline-none focus:border-[#D90097] focus:ring-1 focus:ring-[#D90097]/50 transition-all placeholder:text-white/20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <p className="text-[12px] text-gray-400">
                Pas encore de compte ? <Link href="/inscription" className="text-[#D90097] font-semibold hover:underline decoration-[#D90097]/50 underline-offset-4">Inscrivez vous.</Link>
              </p>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-[#D90097] hover:bg-[#e60091] disabled:opacity-50 disabled:cursor-not-allowed text-white px-10 py-3 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5 shadow-[0_5px_15px_rgba(217,0,151,0.2)] hover:shadow-[0_8px_25px_rgba(217,0,151,0.4)] ml-auto"
              >
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}