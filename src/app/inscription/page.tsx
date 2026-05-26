"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Unbounded } from "next/font/google";

const unbounded = Unbounded({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

export default function InscriptionPage() {
  const [step, setStep] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);

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

  // Composant de progression
  const Stepper = ({ currentStep }: { currentStep: number }) => (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-10 w-full mx-auto">
      {[
        { num: 1, label: "Compte" },
        { num: 2, label: "Paiement" },
        { num: 3, label: "Accès" },
      ].map((s, i) => (
        <div key={s.num} className="flex items-center gap-2 sm:gap-4">
          <div className={`flex items-center gap-2 sm:gap-3 transition-colors ${
            currentStep === s.num ? "text-white" : 
            s.num < currentStep ? "text-white/60" : 
            "text-white/30"
          }`}>
            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-colors ${
              currentStep === s.num ? "bg-white text-[#050505]" : 
              s.num < currentStep ? "bg-white/20 text-white/80" : 
              "bg-white/10 text-white/50"
            }`}>
              {s.num < currentStep ? (
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                s.num
              )}
            </div>
            <span className={`text-[10px] sm:text-xs font-medium`}>{s.label}</span>
          </div>
          {i < 2 && <div className={`w-8 sm:w-12 h-[1px] transition-colors ${s.num < currentStep ? "bg-white/30" : "bg-white/10"}`}></div>}
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* ==================== ETAPE 1 : COMPTE ==================== */}
      {step === 1 && (
        <div className="min-h-screen bg-[#050505] flex text-white font-sans selection:bg-[#D90097] selection:text-white animate-in fade-in duration-500">
          
          {/* LEFT: Form */}
          <div className="w-full lg:w-1/2 flex flex-col items-center p-6 sm:px-12 lg:px-20 lg:justify-center overflow-y-auto">
            <div className="w-full max-w-[480px] flex flex-col pt-4 pb-4">
              
              <Stepper currentStep={1} />
              
              <h1 className={`${unbounded.className} text-3xl sm:text-4xl font-black mb-2 tracking-tight`}>
                Crée ton <span className="bg-gradient-to-r from-[#FFFFFF] from-[30%] to-[#CD2A9B] to-[100%] bg-clip-text text-transparent">compte</span>
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm mb-6 font-medium">
                Ton espace de création t'attend.
              </p>

              {/* Social Logins */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button className="flex-1 flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-xs font-semibold">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                  </svg>
                  S'inscrire avec Google
                </button>
                <button className="flex-1 flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-xs font-semibold">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className="w-4 h-4 text-white" fill="currentColor">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                  </svg>
                  S'inscrire avec Apple
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-white/30 text-[10px] uppercase font-bold tracking-[0.2em]">ou</span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>

              {/* Form */}
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); nextStep(); }}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-bold block">Nom</label>
                    <input type="text" className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#D90097] focus:ring-1 focus:ring-[#D90097]/50 transition-all placeholder:text-white/20" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-bold block">Nom d'utilisateur</label>
                    <input type="text" className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#D90097] focus:ring-1 focus:ring-[#D90097]/50 transition-all placeholder:text-white/20" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-bold block">Adresse e-mail</label>
                  <input type="email" className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#D90097] focus:ring-1 focus:ring-[#D90097]/50 transition-all placeholder:text-white/20" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-bold block">Mot de passe</label>
                  <input type="password" className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#D90097] focus:ring-1 focus:ring-[#D90097]/50 transition-all placeholder:text-white/20" />
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
                    className="w-full sm:w-auto bg-[#D90097] hover:bg-[#e60091] text-white px-10 py-3 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5 shadow-[0_5px_15px_rgba(217,0,151,0.2)] hover:shadow-[0_8px_25px_rgba(217,0,151,0.4)] ml-auto"
                  >
                    Continuer
                  </button>
                </div>
              </form>

            </div>
          </div>

          {/* RIGHT: Image Carousel */}
          <div className="hidden lg:block lg:w-1/2 p-4 h-screen sticky top-0 relative">
            <div className="relative w-full h-full rounded-[2rem] overflow-hidden bg-[#111]">
              
              {carouselItems.map((item, idx) => (
                <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ${idx === imageIndex ? "opacity-100" : "opacity-0"}`}>
                  <Image
                    src={item.src}
                    alt="Studio"
                    fill
                    sizes="50vw"
                    className="object-cover grayscale mix-blend-luminosity opacity-80"
                    priority={idx === 0}
                  />
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

      {/* ==================== ETAPE 2 : PAIEMENT ==================== */}
      {step === 2 && (
        <div className="min-h-screen bg-[#050505] flex text-white font-sans selection:bg-[#D90097] selection:text-white animate-in fade-in duration-500">
          
          {/* LEFT: Summary */}
          <div className="hidden lg:flex lg:w-[40%] xl:w-[35%] bg-[#0A0A0A] border-r border-white/5 flex-col p-8 xl:p-12 h-screen sticky top-0 justify-center">
             <button onClick={prevStep} className="absolute top-10 left-10 text-white/50 hover:text-white transition-colors" aria-label="Retour">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
               </svg>
             </button>
             
             <h2 className={`${unbounded.className} text-2xl font-black mb-8`}>Récapitulatif</h2>
             
             <div className="flex justify-between items-end mb-8">
               <div>
                 <p className="text-gray-400 text-sm mb-2">Abonnement Nara</p>
                 <div className="flex items-end gap-3">
                   <span className={`${unbounded.className} text-4xl font-black leading-none`}>16,00€</span>
                   <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-tight pb-1">Par<br/>Mois</span>
                 </div>
               </div>
             </div>

             <div className="h-px w-full bg-white/10 mb-6"></div>
             
             <div className="space-y-4 mb-6">
               <div className="flex justify-between text-sm">
                 <span className="text-gray-400">Sous-total</span>
                 <span className="font-semibold">16,00€</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-gray-400">Essai gratuit 14 jours</span>
                 <span className="font-semibold text-[#10B981]">-16,00€</span>
               </div>
             </div>

             <Link href="#" className="text-xs text-[#D90097] hover:underline underline-offset-4 decoration-[#D90097]/50">+ Ajouter un code promo</Link>

             <div className="h-px w-full bg-white/10 my-6"></div>

             <div className="flex justify-between items-center mb-8">
               <span className={`${unbounded.className} text-xl font-black text-gray-300`}>Dû aujourd'hui</span>
               <span className={`${unbounded.className} text-2xl font-black text-[#10B981]`}>0,00€</span>
             </div>

             <div className="rounded-2xl border border-[#D90097]/20 bg-[#D90097]/[0.03] p-5 shadow-[inset_0_0_20px_rgba(217,0,151,0.02)]">
                <p className="text-sm text-white font-semibold mb-2 flex items-center gap-2">
                  <span className="text-[#D90097] font-black text-lg leading-none">+</span> 14 jours gratuits <span className="text-white/20">•</span> aucun débit aujourd'hui
                </p>
                <p className="text-xs text-gray-400">Tu seras notifié 3 jours avant la fin de l'essai</p>
             </div>
          </div>

          {/* RIGHT: Payment Form */}
          <div className="w-full lg:w-[60%] xl:w-[65%] flex flex-col items-center justify-center p-6 sm:px-12 overflow-y-auto">
             <div className="w-full max-w-[500px]">
               <div className="mb-2 flex">
                 <Stepper currentStep={2} />
               </div>
               
               <h1 className={`${unbounded.className} text-3xl sm:text-4xl font-black mb-2 tracking-tight`}>
                 Aucun débit <span className="text-[#D90097]">aujourd'hui</span>
               </h1>
               <p className="text-gray-400 text-xs sm:text-sm mb-8 font-medium">
                 Tu ne seras débité qu'après l'essai.
               </p>

               {/* Payment Methods */}
               <div className="mb-6">
                 <label className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-bold block mb-3">Méthode de paiement</label>
                 <div className="grid grid-cols-3 gap-3">
                   <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#D90097] bg-[#D90097]/10 transition-colors text-xs font-semibold">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> 
                     Carte
                   </button>
                   <button className="flex items-center justify-center py-2.5 rounded-xl border border-white/10 hover:border-white/30 hover:bg-white/5 transition-colors text-[#0070BA] font-bold text-sm italic tracking-tighter">
                     PayPal
                   </button>
                   <button className="flex items-center justify-center py-2.5 rounded-xl border border-white/10 hover:border-white/30 hover:bg-white/5 transition-colors font-semibold text-sm tracking-tight">
                     <span className="text-[#4285F4]">G</span> Pay
                   </button>
                 </div>
               </div>

               {/* Card form */}
               <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); nextStep(); }}>
                 <div className="space-y-1.5">
                   <label className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-bold block">Titulaire de la carte</label>
                   <input type="text" className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#D90097] focus:ring-1 focus:ring-[#D90097]/50 transition-all placeholder:text-white/20" />
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-bold block">Informations de la carte</label>
                   <div className="flex flex-col rounded-xl border border-white/10 overflow-hidden focus-within:border-[#D90097] focus-within:ring-1 focus-within:ring-[#D90097]/50 transition-all">
                     <div className="relative border-b border-white/10">
                       <input type="text" placeholder="1234 1234 1234 1234" className="w-full bg-transparent px-4 py-2 text-white focus:outline-none placeholder:text-white/20 font-mono text-sm tracking-widest" />
                       <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1.5 opacity-50">
                         <div className="w-8 h-5 bg-[#1A1F71] rounded flex items-center justify-center"><span className="text-[8px] font-bold text-white italic">VISA</span></div>
                         <div className="w-8 h-5 bg-[#222] border border-white/10 rounded flex items-center justify-center relative overflow-hidden"><div className="w-3 h-3 bg-[#EB001B] rounded-full absolute -left-0.5"></div><div className="w-3 h-3 bg-[#F79E1B] rounded-full absolute -right-0.5 mix-blend-screen"></div></div>
                       </div>
                     </div>
                     <div className="flex">
                       <input type="text" placeholder="MM/YY" className="w-1/2 bg-transparent px-4 py-2 text-white focus:outline-none border-r border-white/10 placeholder:text-white/20 font-mono text-sm tracking-widest" />
                       <input type="text" placeholder="CVV" className="w-1/2 bg-transparent px-4 py-2 text-white focus:outline-none placeholder:text-white/20 font-mono text-sm tracking-widest" />
                     </div>
                   </div>
                 </div>

                 <div className="space-y-1">
                   <label className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-bold block">Pays</label>
                   <div className="relative">
                     <select className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#D90097] focus:ring-1 focus:ring-[#D90097]/50 transition-all appearance-none cursor-pointer text-sm">
                       <option className="bg-[#0A0A0A]">Sélectionne ton pays</option>
                       <option className="bg-[#0A0A0A]">France</option>
                       <option className="bg-[#0A0A0A]">Belgique</option>
                       <option className="bg-[#0A0A0A]">Suisse</option>
                     </select>
                     <svg className="w-4 h-4 text-white/50 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                   </div>
                 </div>

                 <div className="space-y-1">
                   <label className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-bold block">Adresse de facturation</label>
                   <div className="flex flex-col rounded-xl border border-white/10 overflow-hidden focus-within:border-[#D90097] focus-within:ring-1 focus-within:ring-[#D90097]/50 transition-all">
                      <div className="relative border-b border-white/10">
                        <input type="text" placeholder="Ville" className="w-full bg-transparent px-4 py-2 text-white focus:outline-none placeholder:text-white/20 text-sm" />
                      </div>
                      <input type="text" placeholder="Code Postal" className="w-full bg-transparent px-4 py-2 text-white focus:outline-none placeholder:text-white/20 text-sm" />
                   </div>
                 </div>

                 <div className="flex flex-col items-center gap-3 pt-2">
                   <p className="text-[10px] text-gray-500 font-bold tracking-widest flex items-center gap-1.5">
                     Paiement sécurisé <span className="text-white/20">•</span> <span className="text-white font-black lowercase tracking-tighter text-sm">stripe</span>
                   </p>
                   <button type="submit" className="w-full sm:w-auto ml-auto bg-[#D90097] hover:bg-[#e60091] text-white px-12 py-2.5 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5 shadow-[0_5px_15px_rgba(217,0,151,0.2)] hover:shadow-[0_8px_25px_rgba(217,0,151,0.4)]">
                     Continuer
                   </button>
                 </div>
               </form>

             </div>
          </div>
        </div>
      )}

      {/* ==================== ETAPE 3 : ACCÈS ==================== */}
      {step === 3 && (
        <div className="min-h-screen relative flex items-center justify-center text-white font-sans selection:bg-[#D90097] selection:text-white animate-in fade-in duration-1000">
          
          {/* BG Image Darkened */}
          <div className="absolute inset-0 z-0">
             <Image 
               src="/artist-1.png" 
               fill 
               className="object-cover grayscale opacity-20" 
               alt="Studio" 
               priority
             />
             <div className="absolute inset-0 bg-[#050505]/95 mix-blend-multiply" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center max-w-xl px-6">
            
            {/* Success Checkmark */}
            <div className="w-20 h-20 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
              <svg className="w-8 h-8 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className={`${unbounded.className} text-4xl sm:text-5xl font-black mb-1 tracking-tight`}>
              Bienvenue sur
            </h1>
            
            {/* NARA Logo Gradient */}
            <h1 className={`${unbounded.className} text-6xl sm:text-7xl font-black mb-8 bg-gradient-to-r from-[#FFFFFF] from-[30%] to-[#CD2A9B] to-[100%] bg-clip-text text-transparent`}>
              Nara.
            </h1>

            <p className="text-gray-400 text-sm sm:text-base mb-12 font-medium leading-relaxed max-w-sm">
              Ton essai gratuit de 14 jours commence maintenant. Tu seras notifié avant la fin.
            </p>

            <Link 
              href="/" 
              className="px-8 py-3.5 rounded-full border border-white/20 hover:border-white/50 hover:bg-white/5 transition-all text-sm font-bold flex items-center gap-3 backdrop-blur-sm group"
            >
              Accéder à mon studio 
              <span className="text-lg leading-none transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
