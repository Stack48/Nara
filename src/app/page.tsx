import { Header } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { Avis } from '@/components/landing/Avis';
import { Pv } from '@/components/landing/Pv';
import { Faq } from '@/components/landing/Faq';
import { Cta } from '@/components/landing/Cta';
import { Footer } from '@/components/Footer';

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Pv />
        <Features />
        <Avis />
        <Cta />
        <Faq />
      </main>
      <Footer />
    </>
  );
}