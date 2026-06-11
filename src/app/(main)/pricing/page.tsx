"use client";

import { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { getUser } from '@/hooks/useAuth';

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    getUser().then(user => {
      if (user) {
        setUserId(user.userId || user.username);
      }
    });
  }, []);

  const handleCheckout = async (planType: string) => {
    if (!userId) {
      alert("Veuillez vous connecter pour vous abonner.");
      return;
    }
    
    setLoading(planType);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType, userId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Une erreur est survenue");
        setLoading(null);
      }
    } catch (err) {
      alert("Une erreur est survenue");
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    if (!userId) return;
    setLoading('PORTAL');
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Vous n'avez pas d'abonnement actif.");
        setLoading(null);
      }
    } catch (err) {
      alert("Une erreur est survenue");
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-6">
          <div className="nara-badge mx-auto">Plans & Tarification</div>
          <h1 className="nara-title-1 text-white">
            Passez au niveau <span className="text-[#d90097]">supérieur</span>
          </h1>
          <p className="nara-subtitle text-zinc-400 max-w-2xl mx-auto">
            Débloquez toute la puissance de Nara pour collaborer, versionner et gérer vos projets musicaux sans limite.
          </p>
          
          <div className="pt-4">
            <button 
              onClick={handlePortal}
              disabled={loading === 'PORTAL'}
              className="text-sm font-arimo text-zinc-400 hover:text-white underline decoration-zinc-600 underline-offset-4 transition-colors flex items-center justify-center mx-auto gap-2"
            >
              {loading === 'PORTAL' && <Loader2 className="w-4 h-4 animate-spin" />}
              Gérer mon abonnement actuel
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          
          {/* Plan Free Trial */}
          <div className="bg-zinc-900/50 rounded-3xl p-8 border border-zinc-800 flex flex-col h-full">
            <div className="mb-8">
              <h3 className="nara-title-4 text-white mb-2">Free Trial</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="nara-title-2">0€</span>
                <span className="text-zinc-500 font-arimo">/mois</span>
              </div>
              <p className="text-zinc-400 font-arimo text-sm">Pour découvrir Nara pendant 14 jours.</p>
            </div>
            
            <div className="space-y-4 mb-8 flex-grow">
              <Feature text="Accès à la plateforme" />
              <Feature text="Projets limités" />
              <Feature text="Valable 14 jours" />
            </div>

            <button disabled className="w-full py-4 rounded-full font-unbounded text-sm font-bold bg-zinc-800 text-zinc-500 cursor-not-allowed">
              Plan Actuel
            </button>
          </div>

          {/* Plan Basic */}
          <div className="bg-gradient-to-b from-zinc-900 to-black rounded-3xl p-8 border border-[#d90097]/30 shadow-[0_0_40px_rgba(217,0,151,0.1)] flex flex-col h-full relative transform md:-translate-y-4">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#d90097] text-white text-xs font-bold px-4 py-1.5 rounded-full font-unbounded uppercase tracking-wider">
              Populaire
            </div>
            <div className="mb-8">
              <h3 className="nara-title-4 text-white mb-2">Basic</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="nara-title-2">3,99€</span>
                <span className="text-zinc-400 font-arimo">/mois</span>
              </div>
              <p className="text-zinc-300 font-arimo text-sm">Pour les artistes indépendants qui veulent s'organiser.</p>
            </div>
            
            <div className="space-y-4 mb-8 flex-grow">
              <Feature text="Projets illimités" />
              <Feature text="Éditeur de paroles avancé" />
              <Feature text="Stockage standard" />
              <Feature text="Support par email" />
            </div>

            <button 
              onClick={() => handleCheckout('BASIC')}
              disabled={loading !== null}
              className="w-full py-4 rounded-full font-unbounded text-sm font-bold bg-[#d90097] text-white hover:bg-[#b0007a] transition-all flex justify-center items-center gap-2"
            >
              {loading === 'BASIC' ? <Loader2 className="w-5 h-5 animate-spin" /> : "S'abonner à Basic"}
            </button>
          </div>

          {/* Plan Pro */}
          <div className="bg-zinc-900/50 rounded-3xl p-8 border border-zinc-800 flex flex-col h-full">
            <div className="mb-8">
              <h3 className="nara-title-4 text-white mb-2">Pro</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="nara-title-2">11,99€</span>
                <span className="text-zinc-500 font-arimo">/mois</span>
              </div>
              <p className="text-zinc-400 font-arimo text-sm">Pour les studios et les paroliers professionnels.</p>
            </div>
            
            <div className="space-y-4 mb-8 flex-grow">
              <Feature text="Toutes les features Basic" />
              <Feature text="Collaboration en temps réel" />
              <Feature text="Versioning des paroles" />
              <Feature text="API Publique" />
              <Feature text="Support prioritaire" />
            </div>

            <button 
              onClick={() => handleCheckout('PRO')}
              disabled={loading !== null}
              className="w-full py-4 rounded-full font-unbounded text-sm font-bold bg-white text-black hover:bg-zinc-200 transition-all flex justify-center items-center gap-2"
            >
              {loading === 'PRO' ? <Loader2 className="w-5 h-5 animate-spin" /> : "S'abonner à Pro"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 bg-[#d90097]/20 p-1 rounded-full">
        <Check className="w-3 h-3 text-[#d90097]" />
      </div>
      <span className="text-zinc-300 font-arimo text-sm leading-relaxed">{text}</span>
    </div>
  );
}
