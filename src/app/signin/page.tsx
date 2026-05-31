"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Unbounded } from "next/font/google";
import { register, confirmEmail } from "@/hooks/useAuth";
import "@/lib/amplify";

const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

export default function InscriptionPage() {
  const [step, setStep] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);

  // Form state
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (step === 1) {
      const timer = setInterval(() => {
        setImageIndex((prev) => (prev + 1) % 3);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [step]);

  const carouselItems = [
    { src: "/artist-3.png", text: "Chaque note a sa place." },
    { src: "/artist-2.png", text: "Capte tout. Ne perds rien." },
    { src: "/artist-4.png", text: "Ton œuvre, pour toujours." },
  ];

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  // INSCRIPTION
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register(email, password, username, name);
      setNeedsConfirmation(true);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // CONFIRMATION CODE
  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await confirmEmail(username, confirmCode);
      nextStep();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const Stepper = ({ currentStep }: { currentStep: number }) => (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-10 w-full mx-auto">
      {[
        { num: 1, label: "Compte" },
        { num: 2, label: "Paiement" },
        { num: 3, label: "Accès" },
      ].map((s, i) => (
        <div key={s.num} className="flex items-center gap-2 sm:gap-4">
          <div className={`flex items-center gap-2 sm:gap-3 transition-colors ${currentStep === s.num ? "text-white" :
            s.num < currentStep ? "text-white/60" :
              "text-white/30"
            }`}>
            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-colors ${currentStep === s.num ? "bg-white text-[#050505]" :
              s.num < currentStep ? "bg-white/20 text-white/80" :
                "bg-white/10 text-white/50"
              }`}>
              {s.num < currentStep ? (
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : s.num}
            </div>
            <span className="text-[10px] sm:text-xs font-medium">{s.label}</span>
          </div>
          {i < 2 && <div className={`w-8 sm:w-12 h-[1px] transition-colors ${s.num < currentStep ? "bg-white/30" : "bg-white/10"}`}></div>}
        </div>
      ))}
    </div>
  );

  return (
    <>
      {step === 1 && (
        <div className="min-h-screen bg-[#050505] flex text-white font-sans selection:bg-[#D90097] selection:text-white animate-in fade-in duration-500">

          <div className="w-full lg:w-1/2 flex flex-col items-center p-6 sm:px-12 lg:px-20 lg:justify-center overflow-y-auto">
            <div className="w-full max-w-[480px] flex flex-col pt-4 pb-4">

              <Stepper currentStep={1} />

              <h1 className={`${unbounded.className} text-3xl sm:text-4xl font-black mb-2 tracking-tight`}>
                Crée ton <span className="bg-gradient-to-r from-[#FFFFFF] from-[30%] to-[#CD2A9B] to-[100%] bg-clip-text text-transparent">compte</span>
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm mb-6 font-medium">
                Ton espace de création t'attend.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button className="flex-1 flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-xs font-semibold">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                  </svg>
                  S'inscrire avec Google
                </button>
                <button className="flex-1 flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-xs font-semibold">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className="w-4 h-4 text-white" fill="currentColor">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                  </svg>
                  S'inscrire avec Apple
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-white/30 text-[10px] uppercase font-bold tracking-[0.2em]">ou</span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>

              {/* Erreur */}
              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {error}
                </div>
              )}

              {/* Formulaire inscription ou confirmation code */}
              {!needsConfirmation ? (
                <form className="space-y-4" onSubmit={handleRegister}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-bold block">Nom</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#D90097] focus:ring-1 focus:ring-[#D90097]/50 transition-all placeholder:text-white/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-bold block">Nom d'utilisateur</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#D90097] focus:ring-1 focus:ring-[#D90097]/50 transition-all placeholder:text-white/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-bold block">Adresse e-mail</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#D90097] focus:ring-1 focus:ring-[#D90097]/50 transition-all placeholder:text-white/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-bold block">Mot de passe</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#D90097] focus:ring-1 focus:ring-[#D90097]/50 transition-all placeholder:text-white/20"
                    />
                  </div>

                  <div className="pt-4 flex items-start gap-3">
                    <input type="checkbox" id="terms" className="mt-1 w-4 h-4 rounded bg-transparent border border-white/20 accent-[#D90097] cursor-pointer" required />
                    <label htmlFor="terms" className="text-[11px] text-gray-400 cursor-pointer">
                      J'accepte les <Link href="#" className="text-white hover:underline decoration-white/30">Conditions Générales d'Utilisation</Link> et la <Link href="#" className="text-white hover:underline decoration-white/30">Politique de Confidentialité</Link>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                    <p className="text-[12px] text-gray-400">
                      Déjà un compte ? <Link href="/connexion" className="text-[#D90097] font-semibold hover:underline decoration-[#D90097]/50 underline-offset-4">Se connecter</Link>
                    </p>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto bg-[#D90097] hover:bg-[#e60091] disabled:opacity-50 disabled:cursor-not-allowed text-white px-10 py-3 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5 shadow-[0_5px_15px_rgba(217,0,151,0.2)] hover:shadow-[0_8px_25px_rgba(217,0,151,0.4)] ml-auto"
                    >
                      {loading ? "Chargement..." : "Continuer"}
                    </button>
                  </div>
                </form>
              ) : (
                /* Confirmation code email */
                <form className="space-y-4" onSubmit={handleConfirm}>
                  <p className="text-sm text-gray-400">Un code de confirmation a été envoyé à <span className="text-white font-semibold">{email}</span></p>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-bold block">Code de confirmation</label>
                    <input
                      type="text"
                      value={confirmCode}
                      onChange={(e) => setConfirmCode(e.target.value)}
                      placeholder="000000"
                      required
                      className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#D90097] focus:ring-1 focus:ring-[#D90097]/50 transition-all placeholder:text-white/20 text-center text-2xl tracking-[0.5em] font-mono"
                    />
                  </div>
                  {error && (
                    <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#D90097] hover:bg-[#e60091] disabled:opacity-50 text-white px-10 py-3 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5 shadow-[0_5px_15px_rgba(217,0,151,0.2)]"
                  >
                    {loading ? "Vérification..." : "Confirmer mon compte"}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* RIGHT: Image Carousel — inchangé */}
          <div className="hidden lg:block lg:w-1/2 p-4 h-screen sticky top-0 relative">
            <div className="relative w-full h-full rounded-[2rem] overflow-hidden bg-[#111]">
              {carouselItems.map((item, idx) => (
                <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ${idx === imageIndex ? "opacity-100" : "opacity-0"}`}>
                  <Image src={item.src} alt="Studio" fill sizes="50vw" className="object-cover grayscale mix-blend-luminosity opacity-80" priority={idx === 0} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent"></div>
                </div>
              ))}
              <div className="absolute bottom-16 left-0 right-0 text-center px-10 z-10">
                <div className="relative h-12 mb-4 flex items-center justify-center">
                  {carouselItems.map((item, idx) => (
                    <h2 key={idx} className={`${unbounded.className} text-3xl font-black absolute transition-all duration-700 ${idx === imageIndex ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                      {item.text}
                    </h2>
                  ))}
                </div>
                <div className="flex justify-center gap-2">
                  {[0, 1, 2].map(i => (
                    <div key={i} className={`w-10 h-1 rounded-full transition-all duration-500 ${i === imageIndex ? "bg-white" : "bg-white/20"}`}></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ÉTAPE 2 et 3 : inchangées */}
      {step === 2 && (
        // ... garde ton code existant pour l'étape 2
        <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
          <div className="text-center">
            <p className="text-gray-400 mb-4">Étape paiement</p>
            <button onClick={prevStep} className="text-[#D90097] underline text-sm">Retour</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
          <div className="text-center">
            <h1 className={`${unbounded.className} text-4xl font-black`}>Bienvenue sur Nara.</h1>
          </div>
        </div>
      )}
    </>
  );
}